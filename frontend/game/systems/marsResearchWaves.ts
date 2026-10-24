import type { MissionSimulation } from './mission';
import { MarsResearchEscort } from './marsResearchEscort';
import { clearResearchLeg, researchPath, type NavigationRock } from './escort';
import { enemyPosition } from './enemies';
import { outsideCombatView } from './assaultEntry';
import type { Point, EnemySpec } from '../worlds/sector';
import { PHOBOS_MAZE_ROUTE } from '../worlds/phobosMaze';
import { marsResearchLegClear, marsResearchPointClear } from '../worlds/marsResearch';
import { marsResearchComplete } from '../state/marsAct';

type Pursuit = { path: Point[]; replan: number; safe: Point; goal?: Point };
export class MarsResearchWaves {
    private routes = new Map<number, Pursuit>();
    private retry = 0;
    private obstacleTime = -Infinity;
    private obstacles: NavigationRock[] = [];
    constructor(
        private s: MissionSimulation,
        private say: (id: string, text: string) => void,
    ) {}
    private get escort() {
        return this.s.escort instanceof MarsResearchEscort ? this.s.escort : null;
    }
    private get active() {
        return (
            this.s.area === 'orbit' &&
            this.s.marsOrbit === 'mars' &&
            this.s.campaign.story!.claimed.includes('mars-sector-secure') &&
            !marsResearchComplete(this.s.campaign.story!)
        );
    }
    private rocks() {
        if (this.s.elapsed - this.obstacleTime > 0.75) {
            this.obstacleTime = this.s.elapsed;
            this.obstacles = [...this.s.rocks.values()]
                .filter((r) => r.body.isEnabled())
                .map((r) => {
                    const p = r.body.translation();
                    return { x: p.x * 100, y: p.y * 100, radius: r.radius };
                });
        }
        return this.obstacles;
    }
    update(dt: number) {
        const e = this.escort,
            p = this.s.campaign.story!.mars;
        this.retry = Math.max(0, this.retry - dt);
        for (const id of this.routes.keys())
            if (!this.s.enemies.enemies.has(id)) this.routes.delete(id);
        if (
            !e ||
            !this.active ||
            !e.vulnerable ||
            !['travel', 'waiting', 'research'].includes(e.state) ||
            this.retry > 0
        )
            return;
        const index = e.returning ? 3 : p.researchSites;
        if (
            index > 3 ||
            p.researchWaves > index ||
            (!e.returning &&
                Math.hypot(e.position.x - e.destination.x, e.position.y - e.destination.y) > 500)
        )
            return;
        const count = index === 3 ? 3 : index + 2,
            entries = this.entries(e.position, count, index);
        this.retry = 1;
        if (entries.length < count) return; // Wait for a safe offscreen opening; never pop onto the screen.
        const specs: EnemySpec[] = entries.map((point, i) => ({
            ...point,
            id: 74010 + index * 10 + i,
            kind: i === count - 1 && index > 0 ? 'lancer' : 'patrol',
            home: { ...point },
            phase: 0,
        }));
        this.s.enemies.add(specs);
        this.s.enemies.alert(
            specs.map((e) => e.id),
            e.position,
        );
        for (const spec of specs)
            this.routes.set(spec.id, { path: [], replan: 0, safe: { x: spec.x, y: spec.y } });
        p.researchWaves = index + 1;
        this.s.deliveryRevision++;
        this.say(
            `wave-${index}`,
            index === 3
                ? 'Ada Serrin: Kontakty na kursie powrotnym Keplera. Osłaniaj statek aż do Satuk 15.'
                : 'Ada Serrin: Drony nadlatują w stronę ekspedycji. Osłaniaj Keplera.',
        );
    }
    private entries(site: Point, count: number, wave: number) {
        const s = this.s,
            rocks = this.rocks(),
            view = s.combatView;
        const candidates: Point[] = [];
        for (const d of [1000, 1400, 1800, 2300, 2900, 3600, 4300])
            for (let i = 0; i < 48; i++) {
                const a = (i * Math.PI * 2) / 48 + wave * 0.31;
                candidates.push({ x: site.x + Math.cos(a) * d, y: site.y + Math.sin(a) * d });
            }
        candidates.push(...PHOBOS_MAZE_ROUTE);
        const valid = candidates.filter(
            (p) =>
                outsideCombatView(p, 55, view) &&
                marsResearchPointClear(p, 145) &&
                Math.hypot(p.x, p.y) > s.stationSafeRadius + 100 &&
                rocks.every((r) => Math.hypot(r.x - p.x, r.y - p.y) > r.radius + 80),
        );
        valid.sort(
            (a, b) =>
                Math.hypot(a.x - site.x, a.y - site.y) - Math.hypot(b.x - site.x, b.y - site.y),
        );
        const chosen: Point[] = [];
        let attempts = 0;
        for (const p of valid) {
            if (chosen.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 150)) continue;
            if (++attempts > 12) break;
            if (!researchPath(p, site, rocks, marsResearchLegClear).length) continue;
            chosen.push({ ...p });
            if (chosen.length === count) break;
        }
        return chosen;
    }
    beforePhysics(dt: number) {
        const e = this.escort;
        if (!e || !this.active || !e.vulnerable) return;
        if (e.returning && this.s.campaign.story!.mars.researchWaves < 4)
            e.body.setLinvel({ x: 0, y: 0 }, true);
        const rocks = this.rocks(),
            target = e.position;
        for (const enemy of this.s.enemies.enemies.values()) {
            if (enemy.id < 74010 || enemy.id >= 74050 || !enemy.body.isEnabled()) continue;
            const p = enemyPosition(enemy);
            let route = this.routes.get(enemy.id);
            if (!route) {
                route = { path: [], replan: 0, safe: { ...p } };
                this.routes.set(enemy.id, route);
            }
            if (marsResearchPointClear(p, 60)) route.safe = { ...p };
            const distance = Math.hypot(p.x - target.x, p.y - target.y);
            route.replan -= dt;
            if (
                distance > 650 ||
                !marsResearchLegClear(p, target) ||
                !clearResearchLeg(p, target, rocks)
            ) {
                while (
                    route.path.length &&
                    Math.hypot(route.path[0].x - p.x, route.path[0].y - p.y) < 50
                )
                    route.path.shift();
                if (route.replan <= 0) {
                    if (
                        !route.path.length ||
                        !route.goal ||
                        Math.hypot(route.goal.x - target.x, route.goal.y - target.y) > 220 ||
                        !clearResearchLeg(p, route.path[0], rocks) ||
                        !marsResearchLegClear(p, route.path[0])
                    ) {
                        route.path = researchPath(p, target, rocks, marsResearchLegClear);
                        route.goal = { ...target };
                    }
                    route.replan = 1.2 + (enemy.id % 3) * 0.2;
                }
                const next = route.path[0];
                if (next) {
                    const d = Math.max(1, Math.hypot(next.x - p.x, next.y - p.y)),
                        speed = Math.min(190, d * 2);
                    enemy.body.setLinvel(
                        {
                            x: (((next.x - p.x) / d) * speed) / 100,
                            y: (((next.y - p.y) / d) * speed) / 100,
                        },
                        true,
                    );
                    enemy.body.setRotation(Math.atan2(next.y - p.y, next.x - p.x), true);
                    enemy.state = 'chase';
                    enemy.target = 'escort';
                    enemy.home = { ...target };
                    enemy.lastSeen = { ...target };
                    enemy.lostSight = 0;
                } else enemy.body.setLinvel({ x: 0, y: 0 }, true);
            }
            const v = enemy.body.linvel();
            if (
                !marsResearchLegClear(
                    p,
                    { x: p.x + v.x * 100 * dt * 3, y: p.y + v.y * 100 * dt * 3 },
                    55,
                )
            ) {
                enemy.body.setLinvel({ x: 0, y: 0 }, true);
                route.replan = 0;
            }
        }
    }
    afterPhysics() {
        this.escort?.keepSafe();
        if (!this.active) {
            this.routes.clear();
            return;
        }
        for (const [id, route] of this.routes) {
            const enemy = this.s.enemies.enemies.get(id);
            if (!enemy || !enemy.body.isEnabled()) continue;
            if (!marsResearchPointClear(enemyPosition(enemy), 40)) {
                enemy.body.setTranslation({ x: route.safe.x / 100, y: route.safe.y / 100 }, true);
                enemy.body.setLinvel({ x: 0, y: 0 }, true);
                route.replan = 0;
            }
        }
    }
}
