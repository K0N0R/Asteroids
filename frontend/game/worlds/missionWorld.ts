import { EnemyFactoryView } from '../graphics/enemyFactoryView';
import { StationSentryView } from '../graphics/stationSentryView';
import { sentryPosition } from '../systems/stationSentries';
import { STATION_DRONES } from '../state/stationDrones';
import { newShip } from '../state/campaign';
import { destroyDisplayTree } from '../../core/systems/destroyDisplayTree';
import { drawKineticShield } from '../graphics/kineticShieldView';
import { researchShipView, researchAnomalyView } from '../graphics/researchView';
import { laserTint, laserUpgradeLevel } from '../graphics/shipEquipment';
import { salvagePosition } from '../systems/salvage';
import { fortressView } from '../graphics/fortressView';
import { createMissionAudio } from '../systems/audio';
import { Container, Graphics } from 'pixi.js';
import { shipHull } from '../graphics/shipHull';
import { MissionSimulation, FlightInput } from '../systems/mission';
import {
    C,
    ShapeLibrary,
    ShipView,
    stationView,
    wreckView,
    surveySiteView,
    DroneView,
    cacheView,
} from '../graphics/shapes';
import {
    AEGIS,
    ATLAS_WEAPONS,
    DRONES,
    ENEMY_MINES,
    GAME,
    HULLS,
    OUTPOST,
    RECOVERY,
    SCAN,
    ScanSiteId,
} from '../config';
import { SoundManager } from '../../core/systems/soundManager';
import { Ship } from '../state/campaign';
import { label } from '../ui/primitives';
import { enemyPosition } from '../systems/enemies';
import {
    angleDifference,
    followCameraAngle,
    followCameraZoom,
    rotateVector,
} from '../systems/flight';
import type { Point } from './sector';
import { outpostView } from '../graphics/outpostView';
import { impactParticleCount } from '../systems/impact';
import { CACHE } from '../systems/prototypes';
import { OrbitalOutpostView } from '../graphics/venusOutpost';
import { LunarTransferView } from '../graphics/lunarTransfer';
import { MOON } from './moon';
import { MoonSurfaceView } from '../graphics/moonSurface';

const interpolate = (a: number, b: number, t: number) => a + (b - a) * t;
export class MissionWorld extends Container {
    private moon: MoonSurfaceView;
    private transfer = new LunarTransferView();
    private transferZoom = 1;
    private factoryView: EnemyFactoryView | null = null;
    private venusOutpost = new OrbitalOutpostView();
    readonly audio = createMissionAudio();
    readonly camera = new Container();
    readonly shipView;
    private dashGhosts: Container[] = [];
    private dashTrailView = new Container();
    private rocks = new Map<number, Graphics>();
    private bullets = new Map<number, Graphics>();
    private researchView = researchShipView();
    private rescueShip: ShipView | null = null;
    private rescueStatus = new Graphics();
    private anomalyView = researchAnomalyView();
    private researchStatus = new Graphics();
    private salvageViews = new Map<number, Container>();
    private salvageStatus = new Graphics();
    private enemyViews = new Map<number, DroneView>();
    private enemyStatus = new Graphics();
    private mineView = new Graphics();
    private repairBeams = new Graphics();
    private loot = new Map<number, Graphics>();
    private particles: {
        view: Graphics;
        vx: number;
        vy: number;
        life: number;
        duration: number;
        spin: number;
        dust: boolean;
        blast?: boolean;
    }[] = [];
    private shield = new Graphics();
    private solarShadows = new Graphics();
    private solarGlare = new Graphics().rect(0, 0, 1600, 900).fill(0xf0a04c);
    private kineticView = new Graphics();
    private atlasLockView = new Graphics();
    private burningView = new Graphics();
    private supportShields = new Graphics();
    private supportDrone = new Container();
    private sentryViews = new Map<number, StationSentryView>();
    private sentryStatus = new Graphics();
    private rockLayer = new Container();
    private effectLayer = new Container();
    private shapes = new ShapeLibrary();
    private fortressRevision = 0;
    private accumulator = 0;
    private clock = 0;
    private navigation = new Graphics();
    private home = stationView();
    private recoveryView = new Container();
    private recoveryRing = new Graphics();
    private surveyRings = new Graphics();
    private laser = new Graphics();
    private grabberLines = new Graphics();
    private surveyViews = new Map<ScanSiteId, Container>();
    private surveyLabels = new Map<ScanSiteId, ReturnType<typeof label>>();
    private outpostView = outpostView();
    private outpostScanner = new Graphics();
    private outpostLabel: ReturnType<typeof label>;
    private terminalLabel: ReturnType<typeof label>;
    private cacheRings = new Graphics();
    private cacheViews = new Map<number, Container>();
    private cacheLabels = new Map<number, ReturnType<typeof label>>();
    constructor(
        readonly simulation: MissionSimulation,
        private readonly modules: Ship,
    ) {
        super();
        this.eventMode = 'none';
        const viewportMask = new Graphics().rect(0, 0, 1600, 900).fill(0xffffff);
        this.addChild(viewportMask);
        this.mask = viewportMask;
        this.shipView = new ShipView(modules);
        this.shipView.scale.set(simulation.hullConfig.size);
        this.camera.rotation = -Math.PI / 2 - simulation.ship.rotation();
        this.moon = new MoonSurfaceView(!!simulation.surfaceUnlocked);
        this.camera.addChild(this.moon, this.venusOutpost, this.solarShadows);
        this.camera.addChild(this.navigation, this.shield, this.home);
        label(this.home, simulation.stationName, -65, 165, 18, C.mint);
        const wreck = wreckView(),
            w = simulation.sector.landmarks.find((l) => l.kind === 'wreck');
        if (w) wreck.position.set(w.x, w.y);
        else wreck.visible = false;
        this.camera.addChild(wreck, this.rockLayer, this.effectLayer, this.shipView);
        if (modules.hull === 'widmo') {
            const trail = this.dashTrailView;
            for (let i = 0; i < 22; i++) {
                const ghost = new Container();
                // Offset translucent silhouettes soften the afterimage without a filter
                // render target, which clips large transformed world coordinates.
                for (const offset of [-1.2, 0, 1.2]) {
                    const silhouette = shipHull('widmo', modules);
                    silhouette.position.set(offset, -offset);
                    silhouette.alpha = 0.34;
                    ghost.addChild(silhouette);
                }
                ghost.scale.set(simulation.hullConfig.size);
                ghost.visible = false;
                this.dashGhosts.push(ghost);
                trail.addChild(ghost);
            }
            this.camera.addChildAt(trail, this.camera.getChildIndex(this.shipView));
        }
        this.camera.addChild(this.enemyStatus, this.effectLayer, this.salvageStatus);
        this.camera.addChild(this.mineView, this.repairBeams);
        this.camera.addChild(this.atlasLockView, this.burningView);
        this.supportDrone.addChild(
            new Graphics()
                .poly([-14, -6, -5, -11, 7, -7, 15, 0, 7, 7, -5, 11, -14, 6])
                .fill(0x889da7)
                .stroke({ color: 0xc3d9e0, width: 1 })
                .ellipse(2, 0, 5, 4)
                .fill(0x94d4ed)
                .roundRect(11, -2, 14, 4, 1)
                .fill(0xcee7e8)
                .rect(-15, -6, 3, 12)
                .fill(0x83d4f0),
        );
        for (let i = 0; i < modules.handling && modules.hull === 'aegis'; i++)
            this.supportDrone.addChild(
                new Graphics()
                    .roundRect(-10 + i * 6, -9, 4, 18, 1)
                    .fill(0x58788e)
                    .stroke({ color: 0xa8cbdc, width: 0.7 }),
            );
        this.camera.addChild(this.supportDrone, this.supportShields);
        this.camera.addChild(this.sentryStatus);
        this.camera.addChildAt(this.kineticView, this.camera.getChildIndex(this.shipView) + 1);
        this.camera.addChildAt(this.laser, this.camera.getChildIndex(this.shipView));
        this.camera.addChildAt(this.grabberLines, this.camera.getChildIndex(this.shipView));
        this.camera.addChildAt(this.surveyRings, 2);
        for (const site of simulation.sector.landmarks) {
            if (!site.siteId) continue;
            const view =
                site.kind === 'construction'
                    ? new Container()
                    : site.siteId === 'fortress'
                      ? fortressView(simulation.sector.fortress)
                      : surveySiteView(site.siteId);
            view.position.set(site.x, site.y);
            this.surveyLabels.set(site.siteId, label(view, site.name, -100, 103, 17, C.cyan));
            this.surveyViews.set(site.siteId, view);
            this.camera.addChildAt(view, 2);
        }
        if (simulation.rescueOperation) {
            this.rescueShip = new ShipView(newShip(0, 'swift'));
            this.camera.addChild(this.rescueShip, this.rescueStatus);
        }
        if (simulation.miningEscort) {
            destroyDisplayTree(this.researchView);
            this.researchView = new ShipView(newShip(0, 'mule'));
        }
        if (simulation.escort) {
            this.anomalyView.position.copyFrom(simulation.sector.researchSite);
            this.camera.addChild(this.anomalyView, this.researchView, this.researchStatus);
        }
        if (simulation.enemyFactory) {
            this.factoryView = new EnemyFactoryView();
            this.camera.addChild(this.factoryView);
        }
        const outpost = simulation.sector.outpost;
        this.outpostView.position.set(outpost.x, outpost.y);
        this.outpostView.rotation = outpost.phase + Math.PI;
        this.outpostScanner.position.set(outpost.x, outpost.y);
        const titles = new Container();
        titles.position.set(outpost.x, outpost.y);
        this.outpostLabel = label(
            titles,
            simulation.outerSector ? 'BAZA' : simulation.jupiterSector ? 'WĘZEŁ' : 'CERBER',
            -45,
            -134,
            17,
            C.red,
        );
        this.terminalLabel = label(
            this.camera,
            'E',
            outpost.terminal.x,
            outpost.terminal.y,
            20,
            C.mint,
        );
        this.camera.addChildAt(this.outpostScanner, 2);
        this.camera.addChildAt(this.outpostView, 3);
        this.camera.addChild(titles);
        const signal = simulation.recoverySignal;
        this.camera.addChildAt(this.cacheRings, 2);
        for (const cache of simulation.sector.caches) {
            const view = cacheView();
            view.position.set(cache.x, cache.y);
            this.cacheLabels.set(cache.id, label(view, cache.name, -90, 72, 17, C.mint));
            this.cacheViews.set(cache.id, view);
            this.camera.addChildAt(view, 2);
        }
        if (signal) {
            if (signal.ship) {
                const hull = new ShipView(signal.ship);
                hull.scale.set(HULLS[signal.ship.hull].size);
                hull.rotation = 0.6;
                hull.alpha = 0.6;
                this.recoveryView.addChild(hull);
            }
            if (signal.pilot) {
                const pod = new Graphics()
                    .roundRect(-15, -26, 30, 52, 14)
                    .fill(0x5e7481)
                    .stroke({ color: 0xa9bdc5, width: 1.2 })
                    .roundRect(-11, -20, 22, 33, 10)
                    .fill(0x283d4b)
                    .stroke({ color: C.cyan, width: 1 })
                    .ellipse(0, -4, 8, 13)
                    .fill(0x9ccfe3)
                    .ellipse(0, -4, 4, 7)
                    .fill({ color: 0xd9ad88, alpha: 0.8 })
                    .circle(4, -12, 3)
                    .fill({ color: 0xffffff, alpha: 0.65 })
                    .roundRect(-7, 17, 14, 4, 2)
                    .fill(C.mint)
                    .roundRect(-18, -10, 5, 20, 2)
                    .roundRect(13, -10, 5, 20, 2)
                    .fill(0x364c5a);
                pod.x = signal.ship ? 70 : 0;
                this.recoveryView.addChild(pod);
            }
            this.recoveryView.position.set(signal.x, signal.y);
            this.camera.addChild(this.recoveryRing, this.recoveryView);
        }
        this.solarGlare.visible = simulation.mercurySector;
        this.solarGlare.alpha = 0;
        this.addChild(this.camera, this.solarGlare, this.transfer);
        this.render(1);
    }
    private holHealthBar(g: Graphics, p: Point, health: number, max: number, color: number) {
        const polygon = (width: number) =>
            [-24, -48, -24 + width, -48, -24 + width, -45, -24, -45].reduce<number[]>(
                (points, value, i, array) => {
                    if (i % 2 === 0) {
                        const q = rotateVector(
                            { x: value, y: array[i + 1] },
                            -this.camera.rotation,
                        );
                        points.push(p.x + q.x, p.y + q.y);
                    }
                    return points;
                },
                [],
            );
        g.beginPath()
            .poly(polygon(48))
            .fill({ color: C.line, alpha: 0.7 })
            .poly(polygon((48 * health) / max))
            .fill(health / max < 0.3 ? C.red : color);
    }
    update(deltaMS: number, input: FlightInput) {
        if (this.simulation.pendingChoice) return;
        this.accumulator += Math.min(deltaMS / 1000, 0.1);
        this.clock += deltaMS / 1000;
        while (this.accumulator >= GAME.step) {
            this.simulation.step(input);
            this.accumulator -= GAME.step;
            if (this.simulation.ended || this.simulation.pendingChoice) {
                this.accumulator = 0;
                break;
            }
        }
        this.render(
            this.simulation.pendingChoice || this.simulation.ended
                ? 1
                : this.accumulator / GAME.step,
            Math.min(deltaMS / 1000, 0.1),
        );
        this.audio.update(this.simulation);
        for (const event of this.simulation.events.splice(0)) {
            this.audio.event(event, this.simulation.position, this.simulation.elapsed);
            if (event.kind === 'shot' || !this.inView(event)) continue;
            if (event.kind === 'explosion') {
                const radius = event.strength ?? ATLAS_WEAPONS.grenade.radius;
                const ring = new Graphics()
                    .circle(0, 0, radius)
                    .fill({ color: 0xf0a64e, alpha: 0.08 })
                    .stroke({ color: 0xffcc76, width: 3 })
                    .circle(0, 0, radius * 0.6)
                    .stroke({ color: 0xffefbc, width: 2, alpha: 0.6 });
                ring.position.set(event.x, event.y);
                ring.scale.set(0.2);
                ring.blendMode = 'add';
                this.effectLayer.addChild(ring);
                this.particles.push({
                    view: ring,
                    vx: 0,
                    vy: 0,
                    life: 0.45,
                    duration: 0.45,
                    spin: 0,
                    dust: false,
                    blast: true,
                });
            }
            const count = impactParticleCount(event.kind, event.strength);
            for (let i = 0; i < count && this.particles.length < 800; i++) {
                const dust = event.kind === 'break' && i % 3 === 0;
                const color =
                    event.kind === 'explosion'
                        ? i % 2
                            ? 0xffb54f
                            : 0xffebae
                        : event.kind === 'weld'
                          ? i % 2
                              ? 0xffcb79
                              : 0xeaf5ff
                          : event.kind === 'shield'
                            ? 0x80d5ff
                            : event.kind === 'collect'
                              ? C.mint
                              : dust
                                ? 0x8b8171
                                : i % 3 === 0
                                  ? 0xe5bc84
                                  : 0xacc0ca;
                const view = new Graphics();
                const size = dust
                    ? 4 + Math.random() * 7
                    : event.kind === 'break'
                      ? 1.4 + Math.random() * 3
                      : 0.7 + Math.random() * 1.4;
                if (event.kind === 'weld' && i === 0)
                    view.circle(0, 0, 4).fill({ color: 0xd8edff, alpha: 0.75 });
                else if (dust) view.circle(0, 0, size).fill({ color, alpha: 0.23 });
                else if (event.kind === 'break' && i % 2 === 0)
                    view.poly([
                        -size,
                        -size,
                        size,
                        -size * 0.4,
                        size * 0.5,
                        size,
                        -size * 0.7,
                        size * 0.5,
                    ]).fill(color);
                else
                    view.roundRect(-size * 2, -size * 0.4, size * 4, size * 0.8, size * 0.25).fill(
                        color,
                    );
                view.position.set(event.x, event.y);
                if (!dust) view.blendMode = 'add';
                this.effectLayer.addChild(view);
                const angle = Math.random() * Math.PI * 2,
                    speed =
                        (event.kind === 'break' ? 60 : event.kind === 'weld' ? 45 : 35) +
                        Math.random() * (event.kind === 'break' ? 250 : 130),
                    duration = dust
                        ? 0.8 + Math.random() * 0.7
                        : 0.18 + Math.random() * (event.kind === 'break' ? 0.85 : 0.45);
                view.rotation = angle;
                this.particles.push({
                    view,
                    vx: Math.cos(angle) * speed + (event.velocity?.x ?? 0),
                    vy: Math.sin(angle) * speed + (event.velocity?.y ?? 0),
                    life: duration,
                    duration,
                    spin: dust ? 0 : (Math.random() - 0.5) * 8,
                    dust,
                });
            }
        }
        const effectDt = Math.min(deltaMS / 1000, 0.1);
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= effectDt;
            p.view.x += p.vx * effectDt;
            p.view.y += p.vy * effectDt;
            p.vx *= Math.exp(-effectDt * (p.dust ? 2 : 1));
            p.vy *= Math.exp(-effectDt * (p.dust ? 2 : 1));
            p.view.rotation += p.spin * effectDt;
            p.view.alpha = Math.max(0, p.life / p.duration);
            if (p.blast) p.view.scale.set(0.2 + (1 - p.life / p.duration) * 0.8);
            if (p.dust) p.view.scale.set(1 + (1 - p.life / p.duration) * 1.8);
            if (p.life <= 0) {
                p.view.destroy();
                this.particles.splice(i, 1);
            }
        }
    }
    private inView(point: Point, margin = 0) {
        const delta = rotateVector(
            { x: point.x - this.shipView.x, y: point.y - this.shipView.y },
            this.camera.rotation,
        );
        return (
            Math.abs(delta.x) < 960 / this.camera.scale.x + margin &&
            Math.abs(delta.y) < 580 / this.camera.scale.y + margin
        );
    }
    private render(alpha: number, dt = 0) {
        const s = this.simulation,
            p = s.position;
        if (this.factoryView && s.enemyFactory) {
            this.factoryView.visible =
                s.area === 'orbit' && this.inView(this.factoryView.position, 250);
            this.factoryView.update(s.enemyFactory, this.camera.rotation);
        }
        this.solarGlare.alpha = s.mercurySector
            ? (s.solar.phase === 'flare' ? 0.06 : 0.01) + s.solar.heat * 0.0008
            : 0;
        this.solarShadows.clear();
        if (s.mercurySector)
            for (const rock of s.rocks.values()) {
                if (rock.radius < 60) continue;
                const p = rock.body.translation(),
                    x = p.x * GAME.pixelsPerMeter,
                    y = p.y * GAME.pixelsPerMeter,
                    r = rock.radius;
                this.solarShadows
                    .poly([
                        x - r,
                        y - r * 0.72,
                        x - 650,
                        y - r * 0.72,
                        x - 650,
                        y + r * 0.72,
                        x - r,
                        y + r * 0.72,
                    ])
                    .fill({ color: C.cyan, alpha: 0.09 })
                    .stroke({ color: C.cyan, width: 1, alpha: 0.2 });
            }
        this.venusOutpost.update(s, this.camera.rotation);
        this.moon.update(s.area === 'surface', s.buildStage, this.camera.rotation);
        this.moon.updateDefense(
            s.lunarDefense,
            [...s.lunarDefense.threats.keys()].flatMap((id) => {
                const rock = s.rocks.get(id);
                if (!rock) return [];
                const p = rock.body.translation();
                return [
                    {
                        x: p.x * GAME.pixelsPerMeter,
                        y: p.y * GAME.pixelsPerMeter,
                        radius: rock.radius,
                    },
                ];
            }),
        );
        if (s.lunarAssault.state !== 'idle')
            this.moon.updateDefense(
                s.lunarAssault,
                [...s.lunarAssault.enemies].flatMap((id) => {
                    const enemy = s.enemies.enemies.get(id);
                    if (!enemy) return [];
                    return [{ ...enemyPosition(enemy), radius: enemy.config.radius }];
                }),
                180,
            );
        this.atlasLockView.clear();
        if (s.hasRocketLauncher) {
            for (const id of new Set([s.atlasLock.target, s.atlasLock.locked])) {
                const enemy = id === null ? undefined : s.enemies.enemies.get(id);
                if (!enemy) continue;
                const position = enemyPosition(enemy);
                const locked = id === s.atlasLock.locked;
                const radius = enemy.config.radius + 16;
                const color = locked ? C.red : C.gold;
                this.atlasLockView
                    .circle(position.x, position.y, radius)
                    .stroke({ color, width: 1, alpha: 0.4 });
                const fraction = locked ? 1 : s.atlasLock.progress / ATLAS_WEAPONS.lockTime;
                if (fraction > 0)
                    this.atlasLockView
                        .beginPath()
                        .moveTo(position.x, position.y - radius)
                        .arc(
                            position.x,
                            position.y,
                            radius,
                            -Math.PI / 2,
                            -Math.PI / 2 + Math.PI * 2 * fraction,
                        )
                        .stroke({ color, width: 3 });
                for (const side of [-1, 1])
                    this.atlasLockView
                        .moveTo(position.x + side * (radius + 8), position.y)
                        .lineTo(position.x + side * (radius - 5), position.y)
                        .moveTo(position.x, position.y + side * (radius + 8))
                        .lineTo(position.x, position.y + side * (radius - 5))
                        .stroke({ color, width: 2 });
            }
        }
        this.burningView.clear();
        for (const [id, burn] of s.burning) {
            const enemy = s.enemies.enemies.get(id);
            if (!enemy) continue;
            const position = enemyPosition(enemy);
            const opacity = Math.min(1, burn.remaining);
            this.burningView
                .beginPath()
                .circle(position.x, position.y, enemy.config.radius + 3)
                .stroke({ color: 0xff5636, width: 2, alpha: opacity * 0.45 });
            for (let index = 0; index < 3; index++) {
                const angle = (index * Math.PI * 2) / 3 + this.clock * 0.6;
                const x = position.x + Math.cos(angle) * enemy.config.radius * 0.7;
                const y = position.y + Math.sin(angle) * enemy.config.radius * 0.7;
                const length = 8 + Math.sin(this.clock * 16 + index) * 3;
                this.burningView
                    .beginPath()
                    .moveTo(x - 3, y + 3)
                    .quadraticCurveTo(x - 5, y - 3, x + 1, y - length)
                    .quadraticCurveTo(x + 6, y, x + 3, y + 3)
                    .closePath()
                    .fill({ color: 0xffa345, alpha: opacity * 0.85 });
            }
        }
        this.shield.clear();
        if (s.stationSafeRadius > 0 && Math.hypot(p.x, p.y) < s.stationSafeRadius + 1100) {
            const pulse =
                (0.8 + Math.sin(this.clock * 1.6) * 0.15) * (s.stationShieldActive ? 1 : 0.35);
            this.shield.circle(0, 0, s.stationSafeRadius).fill({ color: 0x388fce, alpha: 0.018 });
            for (const [width, opacity] of [
                [46, 0.015],
                [25, 0.035],
                [11, 0.07],
                [3, 0.3],
                [1, 0.55],
            ])
                this.shield
                    .beginPath()
                    .circle(0, 0, s.stationSafeRadius)
                    .stroke({ color: 0x7bcfff, width, alpha: opacity * pulse });
            for (let i = 0; i < 32; i++) {
                const a = (i * Math.PI) / 16;
                this.shield
                    .beginPath()
                    .arc(0, 0, s.stationSafeRadius - 7, a + 0.015, a + 0.06)
                    .stroke({ color: 0xc2eaff, width: 1.5, alpha: 0.3 });
            }
        }
        this.shipView.position.set(
            interpolate(s.previous.x, p.x, alpha),
            interpolate(s.previous.y, p.y, alpha),
        );
        const deltaAngle = Math.atan2(
            Math.sin(s.ship.rotation() - s.previousAngle),
            Math.cos(s.ship.rotation() - s.previousAngle),
        );
        this.shipView.rotation = s.previousAngle + deltaAngle * alpha;
        this.kineticView.position.copyFrom(this.shipView.position);
        drawKineticShield(
            this.kineticView,
            s.kineticShield,
            (Math.hypot(...s.hullConfig.hitbox) + 18) *
                s.hullConfig.size *
                (1 + (0.35 * (s.aegis?.shields.get('player')?.time ?? 0)) / AEGIS.duration),
            this.clock,
            this.modules.shield,
        );
        this.shipView.aimAt(s.aimTarget);
        if (s.harpoonArms) this.shipView.updateArms(s.harpoonArms.poses);
        this.shipView.updateDrive(
            s.thrusting && !s.reversing,
            s.reversing || (s.braking && s.speed > 5),
            s.engineFault,
            s.boosting,
            this.clock,
            s.ship.angvel(),
        );
        this.dashTrailView.position.copyFrom(this.shipView.position);
        this.dashGhosts.forEach((ghost, i) => {
            const sample = s.dashTrail[s.dashTrail.length - 1 - i];
            ghost.visible = !!sample;
            if (sample) {
                ghost.position.set(sample.x - this.shipView.x, sample.y - this.shipView.y);
                ghost.rotation = sample.angle;
                ghost.alpha = 0.3 * (1 - sample.age / 0.36) ** 2;
            }
        });
        this.shipView.alpha = s.dashTime > 0 ? 0.25 : s.opticalCloak ? 0.3 : 1;
        if (s.destroyedFortressWalls.size !== this.fortressRevision) {
            this.fortressRevision = s.destroyedFortressWalls.size;
            const old = this.surveyViews.get('fortress');
            if (old) {
                const next = fortressView(s.sector.fortress, s.destroyedFortressWalls);
                next.position.copyFrom(old.position);
                this.camera.addChildAt(next, this.camera.getChildIndex(old));
                this.surveyViews.set('fortress', next);
                this.surveyLabels.set(
                    'fortress',
                    label(next, 'Twierdza Aegis', -100, 103, 17, C.cyan),
                );
                destroyDisplayTree(old);
            }
        }
        this.supportShields.clear();
        this.supportDrone.visible = !!s.aegis?.drone;
        if (s.aegis) {
            const dronePosition = s.aegis.dronePosition;
            if (dronePosition && s.aegis.drone) {
                this.supportDrone.position.set(dronePosition.x, dronePosition.y);
                this.supportDrone.rotation = s.aegis.drone.body.rotation();
            }
            for (const [id, shield] of s.aegis.shields) {
                if (id === 'player' || shield.charge <= 0) continue;
                let position: Point | null = null,
                    radius = 30;
                if (id === 'drone') position = dronePosition;
                else if (id === 'escort') {
                    position = s.escort?.position ?? null;
                    radius = 46;
                } else if (id.startsWith('sentry:')) {
                    const drone = s.sentries.drones.get(Number(id.split(':')[1]));
                    if (drone) position = sentryPosition(drone);
                } else {
                    const item = s.salvage.items.get(Number(id.split(':')[1]));
                    if (item) {
                        position = salvagePosition(item);
                        radius = item.radius + 18;
                    }
                }
                if (!position) continue;
                radius *=
                    (1 + this.modules.shield * 0.08) *
                    (1.2 + (0.15 * shield.time) / AEGIS.duration);
                const opacity =
                    Math.min(1, shield.time) * (0.25 + (shield.charge / shield.capacity) * 0.4);
                this.supportShields
                    .circle(position.x, position.y, radius)
                    .fill({ color: 0x71bfe9, alpha: opacity * 0.08 })
                    .stroke({ color: 0x9cdeff, width: 2, alpha: opacity })
                    .circle(position.x, position.y, radius + 4)
                    .stroke({ color: 0x639bce, width: 4, alpha: opacity * 0.2 });
            }
            for (const enemy of s.enemies.enemies.values()) {
                if (!enemy.weaponDisabled) continue;
                const position = enemyPosition(enemy);
                const offset = rotateVector(
                    { x: 0, y: -enemy.config.radius - 14 },
                    -this.camera.rotation,
                );
                this.supportShields
                    .moveTo(position.x + offset.x - 7, position.y + offset.y - 3)
                    .lineTo(position.x + offset.x + 7, position.y + offset.y + 3)
                    .moveTo(position.x + offset.x - 7, position.y + offset.y + 3)
                    .lineTo(position.x + offset.x + 7, position.y + offset.y - 3)
                    .stroke({ color: C.cyan, width: 2 });
            }
        }
        this.camera.rotation = followCameraAngle(this.camera.rotation, this.shipView.rotation, dt);
        const normalZoom = followCameraZoom(this.camera.scale.x / this.transferZoom, s.speed, dt);
        const t = s.transferFraction;
        this.transferZoom = s.transferActive
            ? 1 + (s.area === 'surface' ? 0.45 : -0.25) * (1 - t) * (1 - t)
            : 1;
        this.camera.scale.set(normalZoom * this.transferZoom);
        this.transfer.update(
            s.transferActive,
            t,
            s.area === 'surface',
            Math.max(0, (s.passageProgress / MOON.transferSeconds - 0.8) / 0.2),
        );
        this.camera.pivot.copyFrom(this.shipView.position);
        this.camera.position.set(800, 450);
        this.laser.clear();
        for (const { from, to } of s.laserBeams) {
            const combat = s.hullId === 'phoenix',
                level = laserUpgradeLevel(s.hullId, this.modules.drill);
            this.laser
                .beginPath()
                .moveTo(from.x, from.y)
                .lineTo(to.x, to.y)
                .stroke({
                    color: laserTint(level, combat),
                    width: combat ? 11 : 8,
                    alpha: 0.18,
                });
            this.laser
                .beginPath()
                .moveTo(from.x, from.y)
                .lineTo(to.x, to.y)
                .stroke({
                    color: laserTint(level, combat),
                    width: (combat ? 3.5 : 2.5) + level * 0.5,
                    alpha: 0.9,
                });
            this.laser
                .beginPath()
                .circle(to.x, to.y, 4 + Math.sin(this.clock * 40))
                .fill(combat ? 0xffb49a : C.text);
        }
        this.grabberLines.clear();
        for (const arm of s.grippers.arms) {
            if (arm.phase === 'idle') continue;
            const origin = s.grippers.origin(
                arm,
                this.shipView.position,
                this.shipView.rotation,
                s.hullConfig.size,
            );
            const tip = {
                x: interpolate(arm.previous.x, arm.tip.x, alpha),
                y: interpolate(arm.previous.y, arm.tip.y, alpha),
            };
            const dx = tip.x - origin.x,
                dy = tip.y - origin.y,
                length = Math.max(1, Math.hypot(dx, dy));
            const nx = dx / length,
                ny = dy / length;
            this.grabberLines
                .moveTo(origin.x, origin.y)
                .lineTo(tip.x, tip.y)
                .stroke({ color: 0x737373, width: 3 });
            this.grabberLines
                .moveTo(tip.x - nx * 7 - ny * 6, tip.y - ny * 7 + nx * 6)
                .lineTo(tip.x + nx * 3 - ny * 5, tip.y + ny * 3 + nx * 5)
                .moveTo(tip.x - nx * 7 + ny * 6, tip.y - ny * 7 - nx * 6)
                .lineTo(tip.x + nx * 3 + ny * 5, tip.y + ny * 3 - nx * 5)
                .stroke({ color: 0xc3c3c3, width: 2 });
            if (arm.held)
                this.grabberLines
                    .poly([tip.x, tip.y - 7, tip.x + 6, tip.y, tip.x, tip.y + 7, tip.x - 6, tip.y])
                    .fill(
                        arm.held === 'crystals' ? 0xc2a0ec : arm.held === 'parts' ? C.gold : C.mint,
                    );
        }
        for (const [id, view] of this.sentryViews)
            if (!s.sentries.drones.has(id)) {
                destroyDisplayTree(view);
                this.sentryViews.delete(id);
            }
        this.sentryStatus.clear();
        for (const drone of s.sentries.drones.values()) {
            let view = this.sentryViews.get(drone.id);
            if (!view) {
                view = new StationSentryView();
                this.sentryViews.set(drone.id, view);
                this.effectLayer.addChild(view);
            }
            const p = sentryPosition(drone);
            view.position.set(
                interpolate(drone.previous.x, p.x, alpha),
                interpolate(drone.previous.y, p.y, alpha),
            );
            view.rotation = drone.body.rotation();
            view.visible = this.inView(p);
            view.flame.visible = Math.hypot(drone.body.linvel().x, drone.body.linvel().y) > 0.2;
            view.flame.scale.x = 0.8 + Math.sin(this.clock * 29 + drone.id) * 0.15;
            if (view.visible)
                this.sentryStatus
                    .beginPath()
                    .rect(p.x - 23, p.y - 34, 46, 4)
                    .fill(C.line)
                    .beginPath()
                    .rect(p.x - 23, p.y - 34, (46 * drone.state.hull) / STATION_DRONES.hull, 4)
                    .fill(drone.mode === 'repair' ? C.gold : C.mint);
        }
        for (const [id, view] of this.enemyViews)
            if (!s.enemies.enemies.has(id)) {
                destroyDisplayTree(view);
                this.enemyViews.delete(id);
            }
        this.enemyStatus.clear();
        this.repairBeams.clear();
        for (const enemy of s.enemies.enemies.values()) {
            let view = this.enemyViews.get(enemy.id);
            if (!view) {
                view = new DroneView(enemy.kind);
                if (enemy.boss) {
                    view.scale.set(1.6);
                    view.tint = enemy.finalBoss ? 0xe2b788 : 0xc0a4bb;
                    view.addChildAt(
                        new Graphics()
                            .poly([
                                -36, -15, -22, -40, 19, -38, 34, -17, 34, 17, 19, 38, -22, 40, -36,
                                15,
                            ])
                            .fill(0x443847)
                            .stroke({ color: 0xd7b1c4, width: 2 }),
                        0,
                    );
                }
                this.enemyViews.set(enemy.id, view);
                this.effectLayer.addChild(view);
            }
            const pos = enemyPosition(enemy);
            view.position.set(
                interpolate(enemy.previous.x, pos.x, alpha),
                interpolate(enemy.previous.y, pos.y, alpha),
            );
            const da = Math.atan2(
                Math.sin(enemy.body.rotation() - enemy.previousAngle),
                Math.cos(enemy.body.rotation() - enemy.previousAngle),
            );
            view.rotation = enemy.previousAngle + da * alpha;
            view.flame.visible = enemy.thrusting;
            view.flame.scale.x = 0.7 + Math.sin(this.clock * 37 + enemy.id) * 0.15;
            view.alpha = enemy.hitFlash > 0 ? 0.45 : 1;
            view.visible = this.inView(pos);
            const repaired =
                enemy.repairTarget === null ? undefined : s.enemies.enemies.get(enemy.repairTarget);
            if (repaired) {
                const target = enemyPosition(repaired);
                if (view.visible || this.inView(target)) {
                    this.repairBeams
                        .beginPath()
                        .moveTo(pos.x, pos.y)
                        .lineTo(target.x, target.y)
                        .stroke({
                            color: 0xe4cd8b,
                            width: 2,
                            alpha: 0.55 + Math.sin(this.clock * 9) * 0.2,
                        });
                    this.repairBeams
                        .beginPath()
                        .circle(target.x, target.y, repaired.config.radius + 6)
                        .stroke({ color: 0xe4cd8b, width: 1.5, alpha: 0.6 });
                }
            }
            if (!view.visible) continue;
            const healthWidth = enemy.boss ? 110 : 48,
                healthY = pos.y - (enemy.boss ? 85 : 47);
            this.enemyStatus
                .rect(pos.x - healthWidth / 2, healthY, healthWidth, 4)
                .fill(C.line)
                .rect(
                    pos.x - healthWidth / 2,
                    healthY,
                    (healthWidth * enemy.health) / enemy.config.hull,
                    4,
                )
                .fill(C.red);
            if (enemy.charge > 0) {
                const a = enemy.body.rotation();
                this.enemyStatus
                    .beginPath()
                    .arc(
                        pos.x,
                        pos.y,
                        enemy.config.radius + 13,
                        -Math.PI / 2,
                        -Math.PI / 2 + (enemy.charge / enemy.config.windup) * Math.PI * 2,
                    )
                    .stroke({ color: C.red, width: 3 });
                for (const offset of enemy.kind === 'heavy' ? [-0.16, 0, 0.16] : [0]) {
                    const length =
                        enemy.kind === 'lancer' ? 350 : enemy.kind === 'heavy' ? 220 : 100;
                    this.enemyStatus
                        .beginPath()
                        .moveTo(
                            pos.x + Math.cos(a + offset) * 35,
                            pos.y + Math.sin(a + offset) * 35,
                        )
                        .lineTo(
                            pos.x + Math.cos(a + offset) * length,
                            pos.y + Math.sin(a + offset) * length,
                        )
                        .stroke({ color: C.red, width: 1, alpha: 0.5 });
                }
            }
        }
        this.mineView.clear();
        for (const mine of s.mines.mines.values()) {
            if (!this.inView(mine)) continue;
            const color = mine.armRemaining > 0 ? C.gold : C.red;
            const pulse = 0.65 + Math.sin(this.clock * (mine.life < 3 ? 18 : 6)) * 0.25;
            this.mineView
                .beginPath()
                .circle(mine.x, mine.y, ENEMY_MINES.triggerRadius)
                .stroke({ color, width: 1, alpha: 0.12 });
            this.mineView
                .beginPath()
                .poly([
                    mine.x - 13,
                    mine.y,
                    mine.x - 6,
                    mine.y - 6,
                    mine.x,
                    mine.y - 13,
                    mine.x + 6,
                    mine.y - 6,
                    mine.x + 13,
                    mine.y,
                    mine.x + 6,
                    mine.y + 6,
                    mine.x,
                    mine.y + 13,
                    mine.x - 6,
                    mine.y + 6,
                ])
                .fill(0x424952)
                .stroke({ color, width: 2, alpha: pulse });
            this.mineView.beginPath().circle(mine.x, mine.y, 4).fill({ color, alpha: pulse });
            if (mine.armRemaining > 0)
                this.mineView
                    .beginPath()
                    .arc(
                        mine.x,
                        mine.y,
                        19,
                        -Math.PI / 2,
                        -Math.PI / 2 +
                            (1 - mine.armRemaining / ENEMY_MINES.armSeconds) * Math.PI * 2,
                    )
                    .stroke({ color, width: 2 });
        }
        this.surveyRings.clear();
        this.cacheRings.clear();
        for (const cache of s.sector.caches) {
            const view = this.cacheViews.get(cache.id)!;
            view.visible = this.inView(cache);
            if (!view.visible) continue;
            const opened = s.openedCaches.has(cache.id);
            view.alpha = opened ? 0.35 : 1;
            const title = this.cacheLabels.get(cache.id)!;
            title.setText(opened ? `${cache.name} / pusta` : cache.name);
            title.rotation = -this.camera.rotation;
            title.position.copyFrom(rotateVector({ x: -90, y: 72 }, -this.camera.rotation));
            if (opened) continue;
            this.cacheRings
                .beginPath()
                .circle(cache.x, cache.y, CACHE.radius)
                .stroke({ color: C.mint, width: 1, alpha: 0.25 });
            if (s.cacheTarget === cache.id && s.cacheProgress > 0)
                this.cacheRings
                    .beginPath()
                    .arc(
                        cache.x,
                        cache.y,
                        62,
                        -Math.PI / 2,
                        -Math.PI / 2 + (s.cacheProgress / CACHE.seconds) * Math.PI * 2,
                    )
                    .stroke({ color: C.mint, width: 4 });
        }
        for (const site of s.sector.landmarks) {
            if (!site.siteId) continue;
            const view = this.surveyViews.get(site.siteId)!;
            view.visible =
                !(s.venusSector && site.siteId === 'archive' && s.venusOutpostStage >= 0) &&
                !(s.marsBaseSector && site.siteId === 'archive' && s.orbitalBaseStage < 1) &&
                this.inView(site, site.siteId === 'fortress' ? site.radius : 0);
            if (!view.visible) continue;
            const title = this.surveyLabels.get(site.siteId)!;
            title.visible = site.kind !== 'construction';
            title.rotation = -this.camera.rotation;
            title.position.copyFrom(rotateVector({ x: -100, y: 103 }, -this.camera.rotation));
            const done = s.surveyData.has(site.siteId);
            this.surveyRings.circle(site.x, site.y, SCAN.radius).stroke({
                color: done ? C.mint : C.cyan,
                width: 1,
                alpha: done ? 0.35 : 0.2 + Math.sin(this.clock * 2) * 0.08,
            });
            if (s.scanTarget === site.siteId && s.scanProgress > 0)
                this.surveyRings
                    .beginPath()
                    .arc(
                        site.x,
                        site.y,
                        95,
                        -Math.PI / 2,
                        -Math.PI / 2 + (s.scanProgress / SCAN.seconds) * Math.PI * 2,
                    )
                    .stroke({ color: C.mint, width: 4 });
            if (done)
                this.surveyRings
                    .moveTo(site.x - 10, site.y - 105)
                    .lineTo(site.x - 2, site.y - 97)
                    .lineTo(site.x + 13, site.y - 113)
                    .stroke({ color: C.mint, width: 3 });
        }
        const outpost = s.sector.outpost,
            security = s.outpost;
        this.outpostScanner.clear();
        this.outpostView.visible = this.inView(outpost);
        this.outpostLabel.visible = this.outpostView.visible;
        this.terminalLabel.visible =
            this.inView(outpost.terminal) &&
            (!security.secured ||
                (!s.storyMode && (!security.sabotaged || !security.equipmentSecured)));
        this.outpostLabel.rotation = -this.camera.rotation;
        this.outpostLabel.position.copyFrom(
            rotateVector({ x: -45, y: -134 }, -this.camera.rotation),
        );
        this.terminalLabel.setText(security.sabotageProgress > 0 ? 'G' : 'E');
        this.terminalLabel.rotation = -this.camera.rotation;
        const terminalOffset = rotateVector({ x: -6, y: 36 }, -this.camera.rotation);
        this.terminalLabel.position.set(
            outpost.terminal.x + terminalOffset.x,
            outpost.terminal.y + terminalOffset.y,
        );
        if (this.outpostView.visible) {
            const angle = security.scannerAngle(s.elapsed),
                half = OUTPOST.scanHalfAngle;
            const color = security.disabledTime > 0 ? C.muted : security.alarm > 0 ? C.red : C.gold;
            const g = this.outpostScanner;
            if (security.disabledTime <= 0) {
                g.poly([
                    Math.cos(angle - half) * OUTPOST.radius,
                    Math.sin(angle - half) * OUTPOST.radius,
                    Math.cos(angle - half) * OUTPOST.scanRange,
                    Math.sin(angle - half) * OUTPOST.scanRange,
                    Math.cos(angle + half) * OUTPOST.scanRange,
                    Math.sin(angle + half) * OUTPOST.scanRange,
                    Math.cos(angle + half) * OUTPOST.radius,
                    Math.sin(angle + half) * OUTPOST.radius,
                ]).fill({ color, alpha: 0.09 });
                g.moveTo(Math.cos(angle) * OUTPOST.radius, Math.sin(angle) * OUTPOST.radius)
                    .lineTo(
                        Math.cos(angle) * OUTPOST.scanRange,
                        Math.sin(angle) * OUTPOST.scanRange,
                    )
                    .stroke({ color, width: 2, alpha: 0.55 });
            }
            g.beginPath().circle(0, 0, OUTPOST.scanRange).stroke({ color, width: 1, alpha: 0.08 });
            const tx = outpost.terminal.x - outpost.x,
                ty = outpost.terminal.y - outpost.y;
            g.beginPath()
                .circle(tx, ty, OUTPOST.interactRadius)
                .stroke({ color: security.secured ? C.mint : color, width: 1, alpha: 0.3 });
            if (security.sabotageProgress > 0)
                g.beginPath()
                    .arc(
                        tx,
                        ty,
                        48,
                        -Math.PI / 2,
                        -Math.PI / 2 +
                            (security.sabotageProgress / OUTPOST.sabotageSeconds) * Math.PI * 2,
                    )
                    .stroke({ color: C.mint, width: 4 });
            if (security.equipmentProgress > 0)
                g.beginPath()
                    .arc(
                        tx,
                        ty,
                        48,
                        -Math.PI / 2,
                        -Math.PI / 2 +
                            (security.equipmentProgress / OUTPOST.equipmentSeconds) * Math.PI * 2,
                    )
                    .stroke({ color: C.gold, width: 4 });
            if (security.secured && !security.equipmentSecured)
                g.beginPath()
                    .roundRect(tx + 27, ty - 9, 16, 18, 3)
                    .fill(0x9b8b6c)
                    .stroke({ color: C.gold, width: 1 });
            if (security.download > 0)
                g.beginPath()
                    .arc(
                        tx,
                        ty,
                        42,
                        -Math.PI / 2,
                        -Math.PI / 2 + (security.download / OUTPOST.downloadSeconds) * Math.PI * 2,
                    )
                    .stroke({ color: C.mint, width: 4 });
            if (security.secured)
                g.moveTo(tx - 10, ty - 36)
                    .lineTo(tx - 2, ty - 28)
                    .lineTo(tx + 13, ty - 44)
                    .stroke({ color: C.mint, width: 3 });
            if (security.detection > 0)
                g.beginPath()
                    .arc(
                        p.x - outpost.x,
                        p.y - outpost.y,
                        50,
                        -Math.PI / 2,
                        -Math.PI / 2 + (security.detection / OUTPOST.detectSeconds) * Math.PI * 2,
                    )
                    .stroke({ color: C.red, width: 3 });
        }
        const signal = s.recoverySignal;
        this.recoveryRing.clear();
        this.recoveryView.visible = !!signal && !s.recoveryDestroyed && !s.recoveryDelivered;
        if (signal && !s.recoveryDestroyed && !s.recoveryDelivered) {
            if (s.recoverySecured && s.tow) {
                const x = interpolate(s.tow.previous.x, s.tow.position.x, alpha),
                    y = interpolate(s.tow.previous.y, s.tow.position.y, alpha);
                this.recoveryView.position.set(x, y);
                this.recoveryView.rotation =
                    s.tow.previousAngle + angleDifference(s.tow.angle, s.tow.previousAngle) * alpha;
                const held = [...s.salvage.towing.values()].find(
                    (item) => item.source === 'recovery',
                );
                if (held)
                    this.holHealthBar(
                        this.recoveryRing,
                        { x, y },
                        held.health,
                        held.maxHealth,
                        C.mint,
                    );
                const a = this.shipView.rotation;
                const offset = rotateVector(held ? s.salvage.towAnchor(held) : { x: -28, y: 0 }, a);
                const anchor = {
                    x: this.shipView.x + offset.x,
                    y: this.shipView.y + offset.y,
                };
                const dx = x - anchor.x,
                    dy = y - anchor.y,
                    length = Math.max(1, Math.hypot(dx, dy));
                const slack = Math.min(45, Math.max(5, (230 - length) * 0.25));
                const cx = (anchor.x + x) / 2 - (dy / length) * slack,
                    cy = (anchor.y + y) / 2 + (dx / length) * slack;
                this.recoveryRing
                    .moveTo(anchor.x, anchor.y)
                    .quadraticCurveTo(cx, cy, x, y)
                    .stroke({ color: C.mint, alpha: 0.5, width: 1 });
            } else {
                this.recoveryRing.circle(signal.x, signal.y, RECOVERY.radius).stroke({
                    color: C.mint,
                    width: 1,
                    alpha: 0.25 + Math.sin(this.clock * 3) * 0.1,
                });
                if (s.recoveryProgress > 0)
                    this.recoveryRing
                        .beginPath()
                        .arc(
                            signal.x,
                            signal.y,
                            65,
                            -Math.PI / 2,
                            -Math.PI / 2 + (s.recoveryProgress / s.recoverySeconds) * Math.PI * 2,
                        )
                        .stroke({ color: C.mint, width: 4 });
            }
        }
        if (s.rescueOperation && this.rescueShip) {
            const r = s.rescueOperation;
            const alive = !['destroyed', 'delivered'].includes(r.state);
            this.rescueShip.visible = alive && this.inView(r.position);
            this.rescueStatus.clear();
            if (alive) {
                const p = r.position,
                    item = r.item;
                this.rescueShip.position.set(
                    interpolate(item.previous.x, p.x, alpha),
                    interpolate(item.previous.y, p.y, alpha),
                );
                this.rescueShip.rotation =
                    item.previousAngle +
                    angleDifference(item.body.rotation(), item.previousAngle) * alpha;
                this.rescueShip.alpha = r.stabilized ? 1 : 0.75;
                this.holHealthBar(this.rescueStatus, p, item.health, item.maxHealth, C.gold);
                if (r.state === 'towing') {
                    const offset = rotateVector(s.salvage.towAnchor(item), this.shipView.rotation);
                    const x = this.shipView.x + offset.x,
                        y = this.shipView.y + offset.y;
                    this.rescueStatus
                        .moveTo(x, y)
                        .quadraticCurveTo((x + p.x) / 2, (y + p.y) / 2 + 20, p.x, p.y)
                        .stroke({ color: C.mint, width: 2, alpha: 0.65 });
                }
                if (r.state !== 'towing')
                    this.rescueStatus
                        .circle(p.x, p.y, 65 + Math.sin(this.clock * 3) * 4)
                        .stroke({ color: r.stabilized ? C.mint : C.gold, width: 2, alpha: 0.6 });
            }
        }
        if (s.escort) {
            const e = s.escort,
                p = e.position;
            this.researchView.visible =
                e.state !== 'destroyed' &&
                e.departure < 2 &&
                (!s.miningEscort || s.area === 'surface') &&
                this.inView(p);
            this.researchView.alpha = e.state === 'complete' ? Math.max(0, 1 - e.departure / 2) : 1;
            this.researchView.position.set(
                interpolate(e.previous.x, p.x, alpha),
                interpolate(e.previous.y, p.y, alpha),
            );
            this.researchView.rotation =
                e.previousAngle + angleDifference(e.body.rotation(), e.previousAngle) * alpha;
            this.anomalyView.visible = !s.miningEscort && this.inView(s.sector.researchSite, 180);
            this.anomalyView.rotation = this.clock * 0.08;
            this.researchStatus.clear();
            if (this.researchView.visible)
                this.holHealthBar(
                    this.researchStatus,
                    p,
                    e.health,
                    s.miningEscort ? HULLS.mule.health : 140,
                    C.mint,
                );
            if (s.miningEscort?.beam) {
                const beam = s.miningEscort.beam;
                this.researchStatus
                    .moveTo(beam.from.x, beam.from.y)
                    .lineTo(beam.to.x, beam.to.y)
                    .stroke({ color: C.cyan, width: 4, alpha: 0.8 });
            }
            if (e.state === 'research' && !s.miningEscort)
                this.researchStatus
                    .beginPath()
                    .arc(
                        p.x,
                        p.y,
                        60,
                        -Math.PI / 2,
                        -Math.PI / 2 + (e.researchProgress / 12) * Math.PI * 2,
                    )
                    .stroke({ color: C.cyan, width: 3, alpha: 0.8 });
        }
        this.salvageStatus.clear();
        for (const [id, view] of this.salvageViews)
            if (!s.salvage.items.has(id)) {
                destroyDisplayTree(view);
                this.salvageViews.delete(id);
            }
        for (const item of s.salvage.items.values()) {
            if (item.source === 'recovery') continue;
            let view = this.salvageViews.get(item.id);
            if (!view) {
                const drone = new DroneView(item.source);
                drone.flame.visible = false;
                drone.alpha = 0.75;
                const scars = new Graphics()
                    .moveTo(-15, -10)
                    .lineTo(6, 8)
                    .lineTo(15, 2)
                    .stroke({ color: 0x161f28, width: 3 })
                    .circle(-8, 5, 5)
                    .fill(0x25323d);
                view = new Container();
                view.addChild(drone, scars);
                this.effectLayer.addChild(view);
                this.salvageViews.set(item.id, view);
            }
            const p = salvagePosition(item);
            view.visible = this.inView(p);
            if (!view.visible) continue;
            view.position.set(
                interpolate(item.previous.x, p.x, alpha),
                interpolate(item.previous.y, p.y, alpha),
            );
            view.rotation =
                item.previousAngle +
                angleDifference(item.body.rotation(), item.previousAngle) * alpha;
            this.holHealthBar(this.salvageStatus, p, item.health, item.maxHealth, C.gold);
            if (s.salvage.towing.has(item.id)) {
                const anchor = this.shipView.position,
                    a = this.shipView.rotation;
                const offset = rotateVector(s.salvage.towAnchor(item), a);
                const x = anchor.x + offset.x,
                    y = anchor.y + offset.y;
                const dx = p.x - x,
                    dy = p.y - y,
                    d = Math.max(1, Math.hypot(dx, dy)),
                    slack = Math.min(45, Math.max(4, (230 - d) * 0.25));
                this.salvageStatus
                    .beginPath()
                    .moveTo(x, y)
                    .quadraticCurveTo(
                        (x + p.x) / 2 - (dy / d) * slack,
                        (y + p.y) / 2 + (dx / d) * slack,
                        p.x,
                        p.y,
                    )
                    .stroke({ color: C.mint, width: 1, alpha: 0.6 });
            } else {
                this.salvageStatus
                    .beginPath()
                    .circle(p.x, p.y, 55)
                    .stroke({ color: C.gold, width: 1, alpha: 0.25 });
                if (s.salvageTarget === item.id && s.salvageProgress > 0)
                    this.salvageStatus
                        .beginPath()
                        .arc(
                            p.x,
                            p.y,
                            55,
                            -Math.PI / 2,
                            -Math.PI / 2 + (s.salvageProgress / 3) * Math.PI * 2,
                        )
                        .stroke({ color: C.mint, width: 3 });
            }
        }
        for (const [id, view] of this.rocks)
            if (!s.rocks.has(id)) {
                view.destroy();
                this.rocks.delete(id);
            }
        for (const rock of s.rocks.values()) {
            let view = this.rocks.get(rock.id);
            if (!view) {
                view = this.shapes.rock(rock.variant, rock.rich, rock.crystal);
                if (rock.copper) view.tint = 0xe0aa82;
                view.scale.set(rock.radius);
                this.rocks.set(rock.id, view);
                this.rockLayer.addChild(view);
            }
            const pos = rock.body.translation();
            view.position.set(
                interpolate(rock.previous.x, pos.x * 100, alpha),
                interpolate(rock.previous.y, pos.y * 100, alpha),
            );
            view.rotation = interpolate(rock.previousAngle, rock.body.rotation(), alpha);
            view.visible = this.inView(view.position);
        }
        for (const [id, view] of this.bullets)
            if (!s.bullets.has(id)) {
                view.destroy();
                this.bullets.delete(id);
            }
        for (const bullet of s.bullets.values()) {
            let view = this.bullets.get(bullet.id);
            if (!view) {
                view = bullet.energy
                    ? new Graphics()
                          .roundRect(-28, -3, 56, 6, 3)
                          .fill({ color: 0x67d7f3, alpha: 0.5 })
                          .roundRect(-24, -1, 48, 2, 1)
                          .fill(0xd5faff)
                    : bullet.explosive === 'rocket'
                      ? new Graphics()
                            .poly([-17, -3, -29, 0, -17, 3])
                            .fill(0xffb75f)
                            .poly([-13, -4, 8, -4, 16, 0, 8, 4, -13, 4])
                            .fill(0xc7d4cf)
                            .rect(-6, -4, 4, 8)
                            .fill(laserTint(this.modules.handling, true))
                            .poly([
                                -13,
                                -4,
                                -17,
                                -8 - this.modules.handling,
                                -6,
                                -4,
                                -6,
                                4,
                                -17,
                                8 + this.modules.handling,
                                -13,
                                4,
                            ])
                            .fill(0x859996)
                      : bullet.explosive === 'grenade'
                        ? new Graphics()
                              .circle(0, 0, 6)
                              .fill(0x839b81)
                              .stroke({ color: 0xd4ddbb, width: 1.5 })
                              .rect(-2, -8, 4, 4)
                              .fill(0xb28b50)
                              .circle(2, -4, 2)
                              .fill(0xffba62)
                        : new Graphics()
                              .roundRect(
                                  bullet.heavy ? -16 : -11,
                                  bullet.heavy ? -2.5 : -1.5,
                                  bullet.heavy ? 32 : 22,
                                  bullet.heavy ? 5 : 3,
                                  1,
                              )
                              .fill(
                                  bullet.heavy
                                      ? bullet.team === 'player'
                                          ? C.cyan
                                          : C.gold
                                      : bullet.team === 'enemy'
                                        ? C.red
                                        : C.mint,
                              );
                this.bullets.set(bullet.id, view);
                this.effectLayer.addChild(view);
            }
            view.position.set(bullet.x, bullet.y);
            view.rotation = Math.atan2(bullet.vy, bullet.vx);
            if (bullet.explosive === 'grenade') {
                view.rotation += (ATLAS_WEAPONS.grenade.life - bullet.life) * 12;
                view.alpha = 0.7 + Math.abs(Math.sin(bullet.life * 28)) * 0.3;
            }
        }
        for (const [id, view] of this.loot)
            if (!s.loot.has(id)) {
                view.destroy();
                this.loot.delete(id);
            }
        for (const item of s.loot.values()) {
            let view = this.loot.get(item.id);
            if (!view) {
                view = new Graphics()
                    .poly([0, -7, 6, 0, 0, 7, -6, 0])
                    .fill(
                        item.kind === 'copperOre'
                            ? 0xd48c62
                            : item.kind === 'crystals'
                              ? 0xc2a0ec
                              : item.kind === 'parts'
                                ? C.gold
                                : C.mint,
                    )
                    .circle(0, 0, 12)
                    .stroke({
                        color:
                            item.kind === 'copperOre'
                                ? 0xd48c62
                                : item.kind === 'crystals'
                                  ? 0xc2a0ec
                                  : item.kind === 'parts'
                                    ? C.gold
                                    : C.mint,
                        width: 1,
                        alpha: 0.3,
                    });
                this.loot.set(item.id, view);
                this.effectLayer.addChild(view);
            }
            view.position.set(item.x, item.y);
            view.alpha = 0.8 + Math.sin(this.clock * 3 + item.id) * 0.2;
        }
        this.navigation.clear();
        if (s.firstBossAvailable) {
            this.navigation
                .circle(s.bossArena.x, s.bossArena.y, 180)
                .stroke({ color: C.gold, width: 2, alpha: 0.5 });
            this.navigation
                .circle(s.bossArena.x, s.bossArena.y, s.firstBoss.rules.arenaRadius)
                .stroke({ color: s.firstBoss.active ? C.red : C.gold, width: 3, alpha: 0.3 });
        }
        if (s.beltSector)
            for (const rock of s.rocks.values()) {
                if (rock.beltBarrier === undefined) continue;
                const position = rock.body.translation();
                const x = position.x * GAME.pixelsPerMeter,
                    y = position.y * GAME.pixelsPerMeter;
                this.navigation
                    .circle(x, y, rock.radius + 12)
                    .stroke({ color: C.gold, width: 2, alpha: 0.65 });
                this.navigation
                    .moveTo(x - 10, y - rock.radius - 20)
                    .lineTo(x, y - rock.radius - 10)
                    .lineTo(x + 10, y - rock.radius - 20)
                    .stroke({ color: C.gold, width: 2 });
            }
        for (const site of s.sector.landmarks) {
            if (site.key < 12 || !this.inView(site, site.radius)) continue;
            this.navigation
                .beginPath()
                .circle(site.x, site.y, site.radius)
                .stroke({
                    color: site.kind === 'cluster' ? 0xb6a1e2 : C.cyan,
                    width: 2,
                    alpha: 0.16,
                });
        }
        const territories = new Map<string, Point>();
        for (const enemy of s.enemies.enemies.values())
            if (!enemy.route)
                territories.set(
                    `${Math.round(enemy.home.x)},${Math.round(enemy.home.y)}`,
                    enemy.home,
                );
        for (const center of territories.values()) {
            if (!this.inView(center, DRONES.leash)) continue;
            this.navigation
                .beginPath()
                .circle(center.x, center.y, DRONES.leash)
                .fill({ color: C.red, alpha: 0.015 });
            for (let i = 0; i < 12; i++)
                this.navigation
                    .beginPath()
                    .arc(
                        center.x,
                        center.y,
                        DRONES.leash,
                        (i * Math.PI) / 6 + 0.02,
                        (i * Math.PI) / 6 + 0.35,
                    )
                    .stroke({ color: C.red, alpha: 0.15, width: 2 });
        }

        this.navigation
            .circle(0, 0, GAME.dockRadius)
            .stroke({ color: C.mint, width: 1, alpha: 0.3 });
        if (s.dockProgress > 0)
            this.navigation
                .beginPath()
                .arc(
                    0,
                    0,
                    GAME.dockRadius + 10,
                    -Math.PI / 2,
                    -Math.PI / 2 + (s.dockProgress / 1.2) * Math.PI * 2,
                )
                .stroke({ color: C.mint, width: 4 });
        this.navigation
            .circle(s.mapCenter.x, s.mapCenter.y, s.sectorRadius)
            .stroke({ color: C.red, width: 10, alpha: 0.5 });
        const v = s.velocity;
        if (s.speed > 15)
            this.navigation
                .moveTo(p.x, p.y)
                .lineTo(p.x + v.x * 0.32, p.y + v.y * 0.32)
                .stroke({ color: C.cyan, width: 1, alpha: 0.3 });
    }
    dispose() {
        this.audio.pause();
        SoundManager.stopGroup('gameplay');
        this.simulation.dispose();
        destroyDisplayTree(this);
        this.shapes.dispose();
    }
}
