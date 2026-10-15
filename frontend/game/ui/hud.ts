import { salvagePosition } from '../systems/salvage';
import { RadarTrail } from '../systems/radarTrail';
import { Container, Graphics } from 'pixi.js';
import { Typography } from '../../core/containers/components/typography';
import { CONTRACTS, GAME, SCAN_SITES, DRONES } from '../config';
import { C } from '../graphics/shapes';
import { MissionSimulation } from '../systems/mission';
import { navigationWaypoint } from '../worlds/sector';
import { EnemyNavigation } from '../systems/enemyNavigation';
import { enemyPosition } from '../systems/enemies';
import { MOON } from '../worlds/moon';
import { flightHint, missionObjectives } from './missionReadout';
import { hudLabel as label, keyHint, mouseHint, objectiveMark } from './hudIcons';

export class MissionHud extends Container {
    cameraAngle = 0;
    target = 1;
    private health: Typography;
    private shieldValue: Typography;
    private cargo: Typography;
    private context: Typography;
    private direction: Typography;
    private goals: Typography[] = [];
    private goalStep = 28;
    private checks = new Graphics();
    private recoveryWasSecured = false;
    private towedIds = '';
    private wreckId: number | null = null;
    private lastSurveyCount = 0;
    private combatComplete = false;
    private enemyNavigation = new EnemyNavigation();
    private trail = new RadarTrail();
    private map = new Graphics();
    private meters = new Graphics();
    private arrow = new Graphics();
    private throttle = 0;
    private areaRevision = 0;
    private supportStatus: Typography | null = null;
    private defenseStatus: Typography | null = null;
    constructor(
        readonly sim: MissionSimulation,
        private contract: number,
        openDetails: () => void = () => {},
        private customObjectives?: () => ReturnType<typeof missionObjectives>,
        objectivesTitle = 'CEL PRÓBY',
    ) {
        super();
        this.eventMode = 'passive';
        this.goalStep = customObjectives ? 40 : 28;
        const firstSite = CONTRACTS[contract].sites[0];
        if (firstSite) this.target = SCAN_SITES[firstSite].key - 1;
        if (CONTRACTS[contract].kills) this.trackEnemy();
        if (sim.recoverySignal) this.target = 5;
        this.addChild(this.meters, this.map, this.checks, this.arrow);
        for (const graphic of [this.meters, this.map, this.checks, this.arrow])
            graphic.eventMode = 'none';
        this.health = label(this, '', 80, 41, 20);
        this.shieldValue = label(this, '', 288, 43, 17, 0x86bded);
        this.cargo = label(this, '', 80, 93, 20);
        if (sim.surfaceUnlocked || sim.venusSector)
            this.defenseStatus = label(this, '', 40, 185, 16, C.gold, 720);
        if (sim.aegis || sim.hullId === 'widmo' || sim.hullId === 'mule')
            this.supportStatus = label(this, '', 80, 140, 14, C.cyan, 600);
        this.direction = label(this, '', 1320, 234, 16, C.muted, 250);
        label(
            this,
            customObjectives ? objectivesTitle : CONTRACTS[contract].title,
            1320,
            285,
            16,
            C.text,
            250,
        );
        const count = (
            this.customObjectives?.() ??
            missionObjectives(
                contract,
                sim.cargo,
                [...sim.surveyData],
                !!sim.recoverySignal,
                sim.recoverySecured,
                false,
                sim.enemyKills,
            )
        ).length;
        for (let i = 0; i < count; i++)
            this.goals.push(label(this, '', 1343, 320 + i * this.goalStep, 15, C.muted, 228));
        this.context = label(this, '', 40, 797, 18, C.mint, 670);
        keyHint(this, 'WASD', 'lot', 40, 845, 54);
        keyHint(this, 'SHIFT', 'boost', 145, 845, 54);
        mouseHint(this, null, 'cel', 277, 845);
        mouseHint(
            this,
            'left',
            sim.harpoonArms
                ? 'zacisk'
                : sim.isAtlas
                  ? 'rakieta'
                  : sim.hullId === 'mule'
                    ? 'lasery'
                    : sim.hullId === 'stinger'
                      ? 'lekka'
                      : sim.hullId === 'phoenix'
                        ? 'laser'
                        : sim.hullId === 'widmo'
                          ? 'dash'
                          : 'ogień',
            355,
            845,
        );
        mouseHint(
            this,
            'right',
            sim.harpoonArms
                ? 'ramiona'
                : sim.isAtlas || sim.hullId === 'fighter'
                  ? 'granaty'
                  : sim.aegis
                    ? 'impuls'
                    : sim.hullId === 'widmo'
                      ? 'kamuflaż'
                      : sim.hullId === 'mule'
                        ? 'zestaw'
                        : sim.hullId === 'stinger'
                          ? 'AP'
                          : sim.hullId === 'phoenix'
                            ? 'rakieta'
                            : 'laser',
            453,
            845,
        );
        keyHint(this, 'F/Z/N', 'cel', 552, 845, 52);
        keyHint(this, '0–9/T/H', 'cel', 644, 845, 66);
        keyHint(this, 'E', 'akcja', 752, 845);
        keyHint(this, 'R', 'naprawa', 857, 845);

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
    trackWreck() {
        const p = this.sim.position;
        this.wreckId =
            [...this.sim.salvage.items.values()]
                .filter((w) => w.source !== 'recovery' && !this.sim.salvage.towing.has(w.id))
                .sort(
                    (a, b) =>
                        Math.hypot(salvagePosition(a).x - p.x, salvagePosition(a).y - p.y) -
                        Math.hypot(salvagePosition(b).x - p.x, salvagePosition(b).y - p.y),
                )[0]?.id ?? null;
        this.target = 14;
    }
    get waypoint() {
        const s = this.sim;
        if (s.area === 'surface') {
            if (this.target === 10)
                return s.enemies.enemies.size
                    ? this.enemyNavigation.waypoint(s.enemies, s.position)
                    : { ...MOON.construction, name: 'Stacja · oczekuj kontaktu' };
            if (
                this.target === 5 &&
                s.recoverySignal?.area === 'surface' &&
                !s.recoverySecured &&
                !s.recoveryDestroyed
            )
                return { ...s.recoverySignal, name: 'Cel ratunkowy na powierzchni' };
            return (
                s.landmarks.find((l) => l.key === this.target + 1) ?? {
                    ...MOON.exit,
                    name: 'Powrót na orbitę',
                }
            );
        }
        if (this.target === 5 && s.recoverySignal?.area === 'surface')
            return { ...MOON.entrance, name: 'Ratunek na powierzchni · wejście' };
        if (this.target === 15) {
            const e = this.sim.escort;
            return !e || e.state === 'destroyed' || e.state === 'complete'
                ? { x: 0, y: 0, name: 'Aurora / koniec eskorty' }
                : { ...e.position, name: 'RV Kepler' };
        }
        if (this.target === 14) {
            if (this.wreckId === null || !this.sim.salvage.items.has(this.wreckId))
                this.trackWreck();
            const item = this.sim.salvage.items.get(this.wreckId!);
            return item
                ? { ...salvagePosition(item), name: `Wrak #${item.id}` }
                : { x: 0, y: 0, name: 'Aurora / brak wraków' };
        }
        if (this.target === 10)
            return this.enemyNavigation.waypoint(this.sim.enemies, this.sim.position);
        if (this.target === -1)
            return { ...this.sim.sector.outpost.terminal, name: this.sim.sector.outpost.name };
        if (this.target === 8)
            return this.sim.nextCache ?? { x: 0, y: 0, name: 'Aurora / skrytki puste' };
        const point = navigationWaypoint(
            this.sim.landmarks,
            this.target + 1,
            this.sim.recoveryDestroyed ? null : this.sim.recoverySignal,
        );
        return { ...point, name: point.name.replace('Aurora', this.sim.stationName) };
    }
    update(deltaMS: number) {
        this.throttle += deltaMS;
        if (this.throttle > 100) {
            this.throttle = 0;
            this.refresh();
        }
    }
    private refresh() {
        this.defenseStatus?.setText(
            this.sim.venusSector || this.sim.area === 'surface' ? this.sim.defenseSummary : '',
        );
        if (this.areaRevision !== this.sim.areaRevision) {
            this.areaRevision = this.sim.areaRevision;
            this.target = this.sim.area === 'surface' ? 0 : 2;
            this.trail = new RadarTrail();
        }
        const s = this.sim,
            p = s.position,
            v = s.velocity;
        const lowHull = s.hull / s.maxHull < 0.3;
        this.shieldValue.setText(
            `${Math.ceil(s.kineticShield.charge)}/${s.kineticShield.profile.capacity}`,
        );
        this.health.setText(`${Math.ceil(s.hull)} / ${s.maxHull}`);
        this.health.setColor(lowHull ? C.red : C.text);
        if (s.aegis)
            this.supportStatus?.setText(
                `Impuls ${s.aegis.cooldown > 0 ? `${Math.ceil(s.aegis.cooldown)} s` : 'gotowy'} · dron ${s.aegis.drone ? `${Math.ceil(s.aegis.drone.hull)}/${Math.round(s.aegis.droneHull)}` : 'zniszczony'}${!s.aegis.drone ? ` · zestawy ${s.repairKits}` : ''}`,
            );
        else if (s.hullId === 'widmo')
            this.supportStatus?.setText(
                s.opticalCloak
                    ? `Kamuflaż ${s.opticalCloakTime.toFixed(1)} s`
                    : `Kamuflaż ${s.opticalCloakCooldown > 1e-8 ? `odnowienie ${Math.ceil(s.opticalCloakCooldown)} s` : 'gotowy'}`,
            );
        else if (s.hullId === 'mule')
            this.supportStatus?.setText(
                `Zestawy ${s.repairKits} · produkcja ${s.repairKits ? 'zapas musi wynosić 0' : `${s.repairKitCost.ore} rudy / ${s.repairKitCost.parts} komponenty`}`,
            );
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
        const shield = s.kineticShield,
            alpha = shield.charge > 0 ? 0.8 : 0.25;
        this.meters
            .poly([265, 43, 274, 48, 274, 58, 265, 63, 256, 58, 256, 48])
            .stroke({ color: 0x86bded, width: 2, alpha })
            .rect(288, 72, 100, 5)
            .fill({ color: C.line, alpha: 0.65 })
            .rect(288, 72, (100 * shield.charge) / shield.profile.capacity, 5)
            .fill(0x86bded);
        this.meters.rect(80, 124, 190, 5).fill({ color: C.line, alpha: 0.65 });
        if (s.cargoUsed > 0)
            this.meters
                .rect(80, 124, 190 * Math.min(1, s.cargoUsed / s.cargoCapacity), 5)
                .fill(C.gold);
        this.context.setText(flightHint(s));
        const towedIds = [...s.salvage.towing.keys()].join(',');
        if (this.towedIds !== towedIds) {
            this.towedIds = towedIds;
            if (towedIds) this.target = 0;
        }
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
        (
            this.customObjectives?.() ??
            missionObjectives(
                this.contract,
                s.cargo,
                [...s.surveyData],
                !!s.recoverySignal,
                s.recoverySecured,
                false,
                s.enemyKills,
            )
        ).forEach((goal, i) => {
            const text =
                goal.id === 'rescue' && s.recoveryDestroyed
                    ? 'Cel ratunkowy utracony'
                    : goal.id === 'rescue' && s.recoveryDelivered
                      ? `Cel przekazany ${s.stationRecipient}`
                      : goal.id === 'fortress'
                        ? goal.complete
                            ? 'Dane Aegis'
                            : s.fortressGuardCount
                              ? `Obrońcy Aegis ${5 - s.fortressGuardCount}/5`
                              : 'Pobierz dane rdzenia'
                        : goal.id === 'escort' && s.escort
                          ? s.escort.state === 'destroyed'
                              ? 'Kepler utracony'
                              : goal.complete
                                ? 'Badania Keplera'
                                : s.escort.state === 'research'
                                  ? `Badania ${Math.floor(s.escort.researchProgress)}/12 s`
                                  : `Kepler · ${Math.ceil(s.escort.health)} HP`
                          : `${goal.title}${goal.progress ? `  ${goal.progress}` : ''}`;
            this.goals[i].setText(text);
            this.goals[i].setColor(
                (goal.id === 'rescue' && s.recoveryDestroyed) ||
                    (goal.id === 'escort' && s.escort?.state === 'destroyed')
                    ? C.red
                    : goal.complete
                      ? C.mint
                      : C.muted,
            );
            objectiveMark(this.checks, 1325, 328 + i * this.goalStep, goal.complete);
        });
        const waypoint = this.waypoint,
            distance = Math.hypot(waypoint.x - p.x, waypoint.y - p.y);
        this.direction.setText(`${waypoint.name} · ${(distance / 1000).toFixed(1)} km`);
        if (s.area === 'surface') {
            this.surfaceRadar(waypoint);
            this.navigationArrow(waypoint, distance);
            return;
        }
        const x = 1470,
            y = 130,
            radius = 88,
            scale = radius / s.sectorRadius;
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
        this.trail.update(p, s.elapsed);
        this.map
            .beginPath()
            .circle(x, y, DRONES.safeRadius * scale)
            .fill({ color: C.cyan, alpha: 0.12 })
            .stroke({ color: C.cyan, width: 1, alpha: 0.5 });
        const homes = new Map<string, { x: number; y: number }>();
        for (const enemy of enemies.filter((e) => !e.route))
            homes.set(`${Math.round(enemy.home.x)},${Math.round(enemy.home.y)}`, enemy.home);
        for (const home of homes.values())
            this.map
                .beginPath()
                .circle(x + home.x * scale, y + home.y * scale, DRONES.leash * scale)
                .fill({ color: C.red, alpha: 0.09 })
                .stroke({ color: C.red, width: 1, alpha: 0.35 });
        for (const point of this.trail.points) {
            if (Math.hypot(point.x, point.y) > s.sectorRadius) continue;
            this.map
                .beginPath()
                .circle(x + point.x * scale, y + point.y * scale, 1)
                .fill({ color: C.cyan, alpha: this.trail.opacity(s.elapsed, point) });
        }
        this.map.circle(x, y, 3).fill(C.mint);
        for (const site of s.landmarks) {
            const mx = x + site.x * scale,
                my = y + site.y * scale;
            if (site.kind === 'belt' || site.kind === 'cluster')
                this.map
                    .beginPath()
                    .circle(mx, my, site.radius * scale)
                    .stroke({
                        color: site.kind === 'cluster' ? 0xb6a1e2 : C.red,
                        alpha: 0.5,
                        width: 1,
                    });
            if (site.kind === 'fortress')
                this.map
                    .beginPath()
                    .circle(mx, my, site.radius * scale)
                    .fill({ color: s.surveyData.has('fortress') ? C.mint : C.red, alpha: 0.12 })
                    .stroke({ color: C.red, width: 1, alpha: 0.6 });
            if (site.siteId)
                this.map
                    .rect(mx - 3, my - 3, 6, 6)
                    .fill(s.surveyData.has(site.siteId) ? C.mint : C.cyan);
            else this.map.circle(mx, my, 2.5).fill(site.key === this.target + 1 ? C.text : C.gold);
        }
        if (
            s.recoverySignal &&
            !s.recoverySignal.area &&
            !s.recoverySecured &&
            !s.recoveryDestroyed
        ) {
            const mx = x + s.recoverySignal.x * scale,
                my = y + s.recoverySignal.y * scale;
            this.map
                .poly([mx, my - 5, mx + 5, my, mx, my + 5, mx - 5, my])
                .stroke({ color: C.mint, width: 1.5 });
        }
        for (const item of s.salvage.items.values()) {
            if (item.source === 'recovery') continue;
            const p = salvagePosition(item),
                mx = x + p.x * scale,
                my = y + p.y * scale;
            this.map
                .beginPath()
                .poly([mx, my - 4, mx + 4, my, mx, my + 4, mx - 4, my])
                .stroke({ color: s.salvage.towing.has(item.id) ? C.mint : C.gold, width: 1 });
        }
        if (s.escort) {
            const site = s.sector.researchSite,
                e = s.escort;
            this.map
                .beginPath()
                .circle(x + site.x * scale, y + site.y * scale, 4)
                .stroke({ color: C.cyan, width: 1 });
            if (e.vulnerable)
                this.map
                    .beginPath()
                    .circle(x + e.position.x * scale, y + e.position.y * scale, 3)
                    .fill(C.mint);
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
        const length = Math.max(s.sectorRadius, Math.hypot(p.x, p.y));
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
        this.navigationArrow(waypoint, distance);
    }
    private surfaceRadar(waypoint: { x: number; y: number }) {
        const s = this.sim,
            x = 1470,
            y = 130,
            scale = 88 / s.sectorRadius;
        const point = (p: { x: number; y: number }) => ({
            x: x + (p.x - MOON.center.x) * scale,
            y: y + (p.y - MOON.center.y) * scale,
        });
        const map = this.map
            .clear()
            .circle(x, y, 88)
            .fill({ color: 0x303c45, alpha: 0.94 })
            .stroke({ color: C.line, width: 2 });
        for (const l of s.landmarks) {
            const p = point(l);
            map.circle(p.x, p.y, l.kind === 'passage' ? 5 : 3).fill(
                l.kind === 'passage' ? C.cyan : C.gold,
            );
        }
        const signal = s.recoverySignal;
        const d = s.lunarDefense;
        for (const id of s.lunarAssault.enemies) {
            const enemy = s.enemies.enemies.get(id);
            if (!enemy) continue;
            const p = point(enemyPosition(enemy));
            map.circle(p.x, p.y, 4).fill(C.red);
        }
        const warningWave = s.lunarAssault.active ? s.lunarAssault : d;
        if (warningWave.state === 'warning') {
            const warning = point({
                x: MOON.construction.x + Math.cos(warningWave.angle) * 850,
                y: MOON.construction.y + Math.sin(warningWave.angle) * 850,
            });
            map.circle(warning.x, warning.y, 7).stroke({ color: C.gold, width: 2 });
        }
        for (const id of d.threats.keys()) {
            const r = s.rocks.get(id);
            if (!r) continue;
            const raw = r.body.translation(),
                p = point({ x: raw.x * GAME.pixelsPerMeter, y: raw.y * GAME.pixelsPerMeter });
            map.circle(p.x, p.y, 3).fill(C.red);
        }
        if (signal?.area === 'surface' && !s.recoverySecured && !s.recoveryDestroyed) {
            const p = point(signal);
            map.rect(p.x - 3, p.y - 3, 6, 6).stroke({ color: C.mint, width: 2 });
        }
        const p = point(s.position),
            w = point(waypoint),
            a = s.ship.rotation();
        map.circle(w.x, w.y, 7)
            .stroke({ color: C.text, width: 1 })
            .poly([
                p.x + Math.cos(a) * 5,
                p.y + Math.sin(a) * 5,
                p.x + Math.cos(a + 2.5) * 4,
                p.y + Math.sin(a + 2.5) * 4,
                p.x + Math.cos(a - 2.5) * 4,
                p.y + Math.sin(a - 2.5) * 4,
            ])
            .fill(C.cyan);
    }
    private navigationArrow(waypoint: { x: number; y: number }, distance: number) {
        const p = this.sim.position;
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
