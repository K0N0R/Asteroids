import { INTERACTION_SECONDS } from './interactionTarget';
import RAPIER from '@dimforge/rapier2d-compat';
import { GAME, DRONES } from '../config';
import type { Point } from '../worlds/sector';

export const ESCORT = {
    health: 140,
    radius: 26,
    speed: 125,
    range: 650,
    startRange: 160,
    startSeconds: INTERACTION_SECONDS,
    researchSeconds: 12,
} as const;
export type EscortState =
    | 'idle'
    | 'travel'
    | 'waiting'
    | 'research'
    | 'complete'
    | 'destroyed'
    | 'failed';
export interface NavigationRock extends Point {
    radius: number;
}
export function clearResearchLeg(a: Point, b: Point, rocks: readonly NavigationRock[]) {
    const dx = b.x - a.x,
        dy = b.y - a.y,
        d = dx * dx + dy * dy;
    return rocks.every((r) => {
        const t = d ? Math.max(0, Math.min(1, ((r.x - a.x) * dx + (r.y - a.y) * dy) / d)) : 0;
        return Math.hypot(a.x + dx * t - r.x, a.y + dy * t - r.y) > r.radius + ESCORT.radius + 16;
    });
}
// A bounded grid search gives the convoy a route around deposits instead of steering straight into them.
export function researchPath(
    from: Point,
    to: Point,
    rocks: readonly NavigationRock[],
    allowed?: (a: Point, b: Point) => boolean,
) {
    const clear = (a: Point, b: Point) =>
        clearResearchLeg(a, b, rocks) && (!allowed || allowed(a, b));
    if (clear(from, to)) return [{ ...to }];
    const size = 100,
        start = { x: Math.round(from.x / size), y: Math.round(from.y / size) },
        goal = { x: Math.round(to.x / size), y: Math.round(to.y / size) };
    const key = (x: number, y: number) => `${x},${y}`;
    const minX = Math.min(start.x, goal.x) - 10,
        maxX = Math.max(start.x, goal.x) + 10,
        minY = Math.min(start.y, goal.y) - 10,
        maxY = Math.max(start.y, goal.y) + 10;
    const blocked = new Set<string>();
    for (const r of rocks) {
        const radius = r.radius + ESCORT.radius + 24;
        for (
            let x = Math.max(minX, Math.floor((r.x - radius) / size));
            x <= Math.min(maxX, Math.ceil((r.x + radius) / size));
            x++
        )
            for (
                let y = Math.max(minY, Math.floor((r.y - radius) / size));
                y <= Math.min(maxY, Math.ceil((r.y + radius) / size));
                y++
            )
                if (Math.hypot(x * size - r.x, y * size - r.y) < radius) blocked.add(key(x, y));
    }
    blocked.delete(key(start.x, start.y));
    blocked.delete(key(goal.x, goal.y));
    const frontier = [{ ...start, g: 0, f: 0 }],
        cost = new Map([[key(start.x, start.y), 0]]),
        parent = new Map<string, string>();
    let iterations = 0;
    while (frontier.length && iterations++ < 8000) {
        frontier.sort((a, b) => b.f - a.f);
        const n = frontier.pop()!,
            nk = key(n.x, n.y);
        if (n.g !== cost.get(nk)) continue;
        if (n.x === goal.x && n.y === goal.y) {
            const points: Point[] = [to];
            let k = nk;
            while (parent.has(k)) {
                const [x, y] = k.split(',').map(Number);
                points.push({ x: x * size, y: y * size });
                k = parent.get(k)!;
            }
            points.push(from);
            points.reverse();
            const smooth: Point[] = [from];
            let i = 0;
            while (i < points.length - 1) {
                let next = i + 1;
                for (let j = points.length - 1; j > i; j--)
                    if (clear(points[i], points[j])) {
                        next = j;
                        break;
                    }
                if (!clear(points[i], points[next])) return [];
                smooth.push(points[next]);
                i = next;
            }
            return smooth.slice(1);
        }
        for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
        ]) {
            const x = n.x + dx,
                y = n.y + dy,
                k = key(x, y);
            if (
                x < minX ||
                x > maxX ||
                y < minY ||
                y > maxY ||
                blocked.has(k) ||
                (allowed &&
                    !allowed({ x: n.x * size, y: n.y * size }, { x: x * size, y: y * size })) ||
                (dx && dy && (blocked.has(key(n.x + dx, n.y)) || blocked.has(key(n.x, n.y + dy))))
            )
                continue;
            const g = n.g + Math.hypot(dx, dy);
            if (g >= (cost.get(k) ?? Infinity)) continue;
            cost.set(k, g);
            parent.set(k, nk);
            frontier.push({ x, y, g, f: g + Math.hypot(goal.x - x, goal.y - y) });
        }
    }
    return [];
}
const P = GAME.pixelsPerMeter;
export class ResearchEscort {
    readonly body: RAPIER.RigidBody;
    readonly collider: RAPIER.Collider;
    state: EscortState = 'idle';
    health: number = ESCORT.health;
    startHeld = false;
    startProgress = 0;
    researchProgress = 0;
    scanning = false;
    cooldown = 0;
    departure = 0;
    previous: Point = { x: 380, y: 0 };
    previousAngle = 0;
    ambushed = false;
    waitingReason: 'player' | 'route' | null = null;
    private path: Point[] = [];
    private replan = 0;
    constructor(
        private world: RAPIER.World,
        readonly destination: Point,
    ) {
        this.body = world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(3.8, 0)
                .setCcdEnabled(true)
                .setLinearDamping(0.1)
                .setAngularDamping(0.8),
        );
        this.collider = world.createCollider(
            RAPIER.ColliderDesc.ball(ESCORT.radius / P)
                .setDensity(3)
                .setCollisionGroups(0x0004ffff)
                .setRestitution(0.2)
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
            this.body,
        );
    }
    resumeResearch(point: Point) {
        if (this.health <= 0) return false;
        this.setDestination(point);
        this.state = 'travel';
        this.researchProgress = 0;
        this.ambushed = true;
        this.collider.setSensor(false);
        return true;
    }
    protected setDestination(point: Point) {
        Object.assign(this.destination, point);
        this.path = [];
        this.replan = 0;
    }
    get position(): Point {
        const p = this.body.translation();
        return { x: p.x * P, y: p.y * P };
    }
    get velocity(): Point {
        const v = this.body.linvel();
        return { x: v.x * P, y: v.y * P };
    }
    get vulnerable() {
        return this.state !== 'complete' && this.state !== 'destroyed' && this.state !== 'failed';
    }
    damage(amount: number, safeRadius: number = DRONES.safeRadius) {
        if (!this.vulnerable || Math.hypot(this.position.x, this.position.y) < safeRadius)
            return false;
        this.health = Math.max(0, this.health - amount);
        this.cooldown = 0.5;
        this.researchProgress = 0;
        if (this.health) return false;
        this.state = 'destroyed';
        this.body.setLinvel({ x: 0, y: 0 }, true);
        this.collider.setSensor(true);
        return true;
    }
    protected allowsTravel(_a: Point, _b: Point) {
        return true;
    }
    protected get arrivalRadius() {
        return 90;
    }
    protected get researchOnArrival() {
        return true;
    }
    update(dt: number, player: Point, rocks: readonly NavigationRock[], hostileNear: boolean) {
        this.scanning = false;
        this.previous = this.position;
        this.previousAngle = this.body.rotation();
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.state === 'complete') {
            this.departure += dt;
            return false;
        }
        if (this.state === 'destroyed' || this.state === 'idle') return false;
        const p = this.position,
            distance = Math.hypot(player.x - p.x, player.y - p.y);
        let desired: Point = { x: 0, y: 0 };
        this.replan -= dt;
        if (distance > ESCORT.range) {
            this.state = 'waiting';
            this.waitingReason = 'player';
        } else if (
            Math.hypot(p.x - this.destination.x, p.y - this.destination.y) < this.arrivalRadius
        ) {
            if (!this.researchOnArrival) {
                this.state = 'complete';
                this.waitingReason = null;
                this.collider.setSensor(true);
                this.body.setLinvel({ x: 0, y: 0 }, true);
                this.body.setAngvel(0, true);
                return true;
            }
            this.state = 'research';
            this.waitingReason = null;
            desired = { x: (this.destination.x - p.x) * 0.7, y: (this.destination.y - p.y) * 0.7 };
            this.scanning = !hostileNear && this.cooldown <= 0;
            if (this.scanning) this.researchProgress += dt;
            if (this.researchProgress + 1e-8 >= ESCORT.researchSeconds) {
                this.state = 'complete';
                this.collider.setSensor(true);
                this.body.setLinvel({ x: 0, y: 0 }, true);
                return true;
            }
        } else {
            if (this.path.length > 1 && Math.hypot(this.path[0].x - p.x, this.path[0].y - p.y) < 50)
                this.path.shift();
            if (
                this.replan <= 0 &&
                (!this.path.length ||
                    !clearResearchLeg(p, this.path[0], rocks) ||
                    !this.allowsTravel(p, this.path[0]))
            ) {
                this.path = researchPath(p, this.destination, rocks, (a, b) =>
                    this.allowsTravel(a, b),
                );
                this.replan = 1;
            }
            if (!this.path.length) {
                this.state = 'waiting';
                this.waitingReason = 'route';
            } else {
                this.state = 'travel';
                this.waitingReason = null;
                const target = this.path[0],
                    dx = target.x - p.x,
                    dy = target.y - p.y,
                    d = Math.max(1, Math.hypot(dx, dy));
                const speed = Math.min(ESCORT.speed, d * 1.5);
                desired = { x: (dx / d) * speed, y: (dy / d) * speed };
            }
        }
        if (distance <= ESCORT.range && this.state !== 'research') {
            const close = rocks.find(
                (r) => Math.hypot(p.x - r.x, p.y - r.y) < r.radius + ESCORT.radius + 18,
            );
            if (close) {
                const dx = p.x - close.x,
                    dy = p.y - close.y,
                    d = Math.max(1, Math.hypot(dx, dy));
                desired = { x: (dx / d) * 80, y: (dy / d) * 80 };
                this.replan = 0;
            }
        }
        const v = this.body.linvel(),
            dx = desired.x / P - v.x,
            dy = desired.y / P - v.y,
            fraction = Math.min(1, ((250 / P) * dt) / Math.max(0.00001, Math.hypot(dx, dy)));
        this.body.applyImpulse(
            { x: dx * fraction * this.body.mass(), y: dy * fraction * this.body.mass() },
            true,
        );
        if (Math.hypot(desired.x, desired.y) > 5) {
            const a = Math.atan2(desired.y, desired.x),
                error = Math.atan2(
                    Math.sin(a - this.body.rotation()),
                    Math.cos(a - this.body.rotation()),
                );
            this.body.setAngvel(Math.max(-1.8, Math.min(1.8, error * 5)), true);
        }
        return false;
    }
    dispose() {
        this.world.removeRigidBody(this.body);
    }
}
