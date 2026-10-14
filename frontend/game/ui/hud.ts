import { Container, Graphics } from 'pixi.js';
import { Typography } from '../../core/containers/components/typography';
import { CONTRACTS, GAME, SCAN_SITES } from '../config';
import { C } from '../graphics/shapes';
import { MissionSimulation } from '../systems/mission';
import { navigationWaypoint } from '../worlds/sector';
import { EnemyNavigation } from '../systems/enemyNavigation';
import { enemyPosition } from '../systems/enemies';
import { flightHint, missionObjectives } from './missionReadout';
import { hudLabel as label, keyHint, mouseHint, objectiveMark } from './hudIcons';

export class MissionHud extends Container {
    cameraAngle = 0;
    target = 1;
    private health: Typography;
    private cargo: Typography;
    private context: Typography;
    private direction: Typography;
    private goals: Typography[] = [];
    private checks = new Graphics();
    private recoveryWasSecured = false;
    private lastSurveyCount = 0;
    private combatComplete = false;
    private enemyNavigation = new EnemyNavigation();
    private map = new Graphics();
    private meters = new Graphics();
    private arrow = new Graphics();
    private throttle = 0;
    constructor(
        readonly sim: MissionSimulation,
        private contract: number,
        openDetails: () => void = () => {},
    ) {
        super();
        this.eventMode = 'passive';
        const firstSite = CONTRACTS[contract].sites[0];
        if (firstSite) this.target = SCAN_SITES[firstSite].key - 1;
        if (CONTRACTS[contract].kills) this.trackEnemy();
        if (sim.recoverySignal) this.target = 5;
        this.addChild(this.meters, this.map, this.checks, this.arrow);
        for (const graphic of [this.meters, this.map, this.checks, this.arrow])
            graphic.eventMode = 'none';
        this.health = label(this, '', 80, 41, 20);
        this.cargo = label(this, '', 80, 93, 20);
        this.direction = label(this, '', 1320, 234, 16, C.muted, 250);
        label(this, CONTRACTS[contract].title, 1320, 285, 16, C.text, 250);
        const count = missionObjectives(
            contract,
            sim.cargo,
            [...sim.surveyData],
            !!sim.recoverySignal,
            sim.recoverySecured,
            false,
            sim.enemyKills,
        ).length;
        for (let i = 0; i < count; i++)
            this.goals.push(label(this, '', 1343, 320 + i * 28, 15, C.muted, 228));
        this.context = label(this, '', 40, 797, 18, C.mint, 670);
        keyHint(this, 'WASD', 'lot', 40, 845, 54);
        keyHint(this, 'SHIFT', 'boost', 145, 845, 54);
        mouseHint(this, null, 'cel', 277, 845);
        mouseHint(this, 'left', 'ogień', 355, 845);
        mouseHint(this, 'right', 'laser', 453, 845);
        keyHint(this, 'F', 'dron', 552, 845);
        keyHint(this, '0–9', 'cel', 644, 845, 43);
        keyHint(this, 'E', 'akcja', 752, 845);
        keyHint(this, 'R', 'naprawa', 857, 845);
        if (sim.hullConfig.cloak) keyHint(this, 'C', 'kamuflaż', 990, 845);
        const details = keyHint(this, 'TAB', 'pokład', 1170, 845, 40);
        details.eventMode = 'static';
        details.cursor = 'pointer';
        details.on('pointerdown', openDetails);
        keyHint(this, 'ESC', 'pauza', 1400, 845, 40);
        this.refresh();
    }
    trackEnemy() {
        this.enemyNavigation.select(this.sim.enemies, this.sim.position);
        this.target = 10;
    }
    get waypoint() {
        if (this.target === 10)
            return this.enemyNavigation.waypoint(this.sim.enemies, this.sim.position);
        if (this.target === -1)
            return { ...this.sim.sector.outpost.terminal, name: this.sim.sector.outpost.name };
        if (this.target === 8)
            return this.sim.nextCache ?? { x: 0, y: 0, name: 'Aurora / skrytki puste' };
        return navigationWaypoint(
            this.sim.sector.landmarks,
            this.target + 1,
            this.sim.recoverySignal,
        );
    }
    update(deltaMS: number) {
        this.throttle += deltaMS;
        if (this.throttle > 100) {
            this.throttle = 0;
            this.refresh();
        }
    }
    private refresh() {
        const s = this.sim,
            p = s.position,
            v = s.velocity;
        const lowHull = s.hull / s.maxHull < 0.3;
        this.health.setText(`${Math.ceil(s.hull)} / ${s.maxHull}`);
        this.health.setColor(lowHull ? C.red : C.text);
        this.cargo.setText(`${s.cargoUsed} / ${s.cargoCapacity}`);
        this.cargo.setColor(s.cargoUsed >= s.cargoCapacity ? C.gold : C.text);
        this.meters
            .clear()
            .poly([47, 43, 65, 43, 65, 55, 56, 65, 47, 55])
            .stroke({ color: lowHull ? C.red : C.cyan, width: 2 })
            .poly([47, 99, 56, 94, 65, 99, 65, 111, 56, 116, 47, 111])
            .stroke({ color: C.gold, width: 2 })
            .moveTo(47, 99)
            .lineTo(56, 104)
            .lineTo(65, 99)
            .moveTo(56, 104)
            .lineTo(56, 116)
            .stroke({ color: C.gold, width: 1 });
        this.meters.rect(80, 72, 190, 5).fill({ color: C.line, alpha: 0.65 });
        if (s.hull > 0)
            this.meters
                .rect(80, 72, 190 * Math.min(1, s.hull / s.maxHull), 5)
                .fill(lowHull ? C.red : C.cyan);
        this.meters.rect(80, 124, 190, 5).fill({ color: C.line, alpha: 0.65 });
        if (s.cargoUsed > 0)
            this.meters
                .rect(80, 124, 190 * Math.min(1, s.cargoUsed / s.cargoCapacity), 5)
                .fill(C.gold);
        this.context.setText(flightHint(s));
        if (s.recoverySecured && !this.recoveryWasSecured) {
            this.recoveryWasSecured = true;
            this.target = 0;
        }
        if (s.surveyData.size !== this.lastSurveyCount) {
            this.lastSurveyCount = s.surveyData.size;
            const nextSite = CONTRACTS[this.contract].sites.find((site) => !s.surveyData.has(site));
            if (CONTRACTS[this.contract].sites.length && (!s.recoverySignal || s.recoverySecured))
                this.target = nextSite ? SCAN_SITES[nextSite].key - 1 : 0;
        }
        const kills = CONTRACTS[this.contract].kills;
        if (kills && !this.combatComplete && s.enemyKills >= kills) {
            this.combatComplete = true;
            this.target = s.recoverySignal && !s.recoverySecured ? 5 : 0;
        }
        this.checks.clear();
        missionObjectives(
            this.contract,
            s.cargo,
            [...s.surveyData],
            !!s.recoverySignal,
            s.recoverySecured,
            false,
            s.enemyKills,
        ).forEach((goal, i) => {
            this.goals[i].setText(`${goal.title}${goal.progress ? `  ${goal.progress}` : ''}`);
            this.goals[i].setColor(goal.complete ? C.mint : C.muted);
            objectiveMark(this.checks, 1325, 328 + i * 28, goal.complete);
        });
        const waypoint = this.waypoint,
            distance = Math.hypot(waypoint.x - p.x, waypoint.y - p.y);
        this.direction.setText(`${waypoint.name} · ${(distance / 1000).toFixed(1)} km`);
        const x = 1470,
            y = 130,
            radius = 88,
            scale = radius / GAME.sectorRadius;
        const enemies = [...s.enemies.enemies.values()];
        const chased = s.outpost.alarm > 0 || enemies.some((enemy) => enemy.state === 'chase');
        this.map
            .clear()
            .beginPath()
            .circle(x, y, radius)
            .fill({ color: C.ink, alpha: 0.72 })
            .stroke({ color: chased ? C.red : C.line, width: chased ? 2 : 1 });
        this.map
            .moveTo(x - radius, y)
            .lineTo(x + radius, y)
            .moveTo(x, y - radius)
            .lineTo(x, y + radius)
            .stroke({ color: C.line, width: 1, alpha: 0.35 });
        this.map.circle(x, y, 3).fill(C.mint);
        for (const site of s.sector.landmarks) {
            const mx = x + site.x * scale,
                my = y + site.y * scale;
            if (site.kind === 'belt')
                this.map
                    .beginPath()
                    .circle(mx, my, site.radius * scale)
                    .stroke({ color: C.red, alpha: 0.25, width: 1 });
            if (site.siteId)
                this.map
                    .rect(mx - 3, my - 3, 6, 6)
                    .fill(s.surveyData.has(site.siteId) ? C.mint : C.cyan);
            else this.map.circle(mx, my, 2.5).fill(site.key === this.target + 1 ? C.text : C.gold);
        }
        if (s.recoverySignal && !s.recoverySecured) {
            const mx = x + s.recoverySignal.x * scale,
                my = y + s.recoverySignal.y * scale;
            this.map
                .poly([mx, my - 5, mx + 5, my, mx, my + 5, mx - 5, my])
                .stroke({ color: C.mint, width: 1.5 });
        }
        const outpost = s.sector.outpost,
            ox = x + outpost.x * scale,
            oy = y + outpost.y * scale;
        this.map
            .poly([
                ox - 4,
                oy - 3,
                ox,
                oy - 5,
                ox + 4,
                oy - 3,
                ox + 4,
                oy + 3,
                ox,
                oy + 5,
                ox - 4,
                oy + 3,
            ])
            .stroke({ color: s.outpost.secured ? C.mint : C.red, width: 1.5 });
        for (const cache of s.sector.caches) {
            const mx = x + cache.x * scale,
                my = y + cache.y * scale;
            this.map
                .poly([mx, my - 4, mx + 4, my, mx, my + 4, mx - 4, my])
                .fill({ color: C.mint, alpha: s.openedCaches.has(cache.id) ? 0.2 : 0.8 });
        }
        for (const enemy of enemies) {
            const e = enemyPosition(enemy),
                mx = x + e.x * scale,
                my = y + e.y * scale;
            this.map
                .poly(
                    enemy.kind === 'lancer'
                        ? [mx + 4, my, mx, my - 3, mx - 4, my, mx, my + 3]
                        : [mx + 3, my, mx - 2, my - 2, mx - 2, my + 2],
                )
                .fill(enemy.state === 'chase' ? C.red : 0xb3696c);
        }
        if (distance > 1 && this.target !== 0)
            this.map
                .beginPath()
                .circle(x + waypoint.x * scale, y + waypoint.y * scale, 7)
                .stroke({ color: C.text, width: 1, alpha: 0.7 });
        // Keep the player marker within the radar when escaping the sector boundary.
        const length = Math.max(GAME.sectorRadius, Math.hypot(p.x, p.y));
        const mx = x + (p.x / length) * radius,
            my = y + (p.y / length) * radius;
        const a = s.ship.rotation();
        this.map
            .poly([
                mx + Math.cos(a) * 5,
                my + Math.sin(a) * 5,
                mx + Math.cos(a + 2.5) * 4,
                my + Math.sin(a + 2.5) * 4,
                mx + Math.cos(a - 2.5) * 4,
                my + Math.sin(a - 2.5) * 4,
            ])
            .fill(C.cyan);
        if (s.speed > 5)
            this.map
                .moveTo(mx, my)
                .lineTo(mx + v.x * scale * 0.3, my + v.y * scale * 0.3)
                .stroke({ color: C.cyan, width: 1 });
        this.arrow.clear();
        if (distance > 250) {
            const angle = Math.atan2(waypoint.y - p.y, waypoint.x - p.x) + this.cameraAngle;
            const ax = 800 + Math.cos(angle) * 230,
                ay = 450 + Math.sin(angle) * 160;
            this.arrow
                .poly([
                    ax + Math.cos(angle) * 8,
                    ay + Math.sin(angle) * 8,
                    ax + Math.cos(angle + 2.4) * 6,
                    ay + Math.sin(angle + 2.4) * 6,
                    ax + Math.cos(angle - 2.4) * 6,
                    ay + Math.sin(angle - 2.4) * 6,
                ])
                .fill({ color: this.target === 0 ? C.mint : C.gold, alpha: 0.7 });
        }
    }
}
