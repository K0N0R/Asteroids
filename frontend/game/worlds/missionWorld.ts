import { createMissionAudio } from '../systems/audio';
import { Container, Graphics } from 'pixi.js';
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
import { DRONES, GAME, HULLS, OUTPOST, RECOVERY, SCAN, ScanSiteId } from '../config';
import { SoundManager } from '../../core/systems/soundManager';
import { Ship } from '../state/campaign';
import { label } from '../ui/primitives';
import { enemyPosition } from '../systems/enemies';
import { angleDifference, followCameraAngle, rotateVector } from '../systems/flight';
import type { Point } from './sector';
import { outpostView } from '../graphics/outpostView';
import { impactParticleCount } from '../systems/impact';
import { CACHE } from '../systems/prototypes';

const interpolate = (a: number, b: number, t: number) => a + (b - a) * t;
export class MissionWorld extends Container {
    readonly audio = createMissionAudio();
    readonly camera = new Container();
    readonly shipView;
    private rocks = new Map<number, Graphics>();
    private bullets = new Map<number, Graphics>();
    private enemyViews = new Map<number, DroneView>();
    private enemyStatus = new Graphics();
    private loot = new Map<number, Graphics>();
    private particles: {
        view: Graphics;
        vx: number;
        vy: number;
        life: number;
        duration: number;
        spin: number;
        dust: boolean;
    }[] = [];
    private shield = new Graphics();
    private rockLayer = new Container();
    private effectLayer = new Container();
    private shapes = new ShapeLibrary();
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
        modules: Ship,
    ) {
        super();
        this.eventMode = 'none';
        this.shipView = new ShipView(modules);
        this.shipView.scale.set(simulation.hullConfig.size);
        this.camera.rotation = -Math.PI / 2 - simulation.ship.rotation();
        this.camera.addChild(this.navigation, this.shield, this.home);
        const wreck = wreckView(),
            w = simulation.sector.landmarks[2];
        wreck.position.set(w.x, w.y);
        this.camera.addChild(wreck, this.rockLayer, this.effectLayer, this.shipView);
        this.camera.addChild(this.enemyStatus, this.effectLayer);
        this.camera.addChildAt(this.laser, this.camera.getChildIndex(this.shipView));
        this.camera.addChildAt(this.grabberLines, this.camera.getChildIndex(this.shipView));
        this.camera.addChildAt(this.surveyRings, 2);
        for (const site of simulation.sector.landmarks) {
            if (!site.siteId) continue;
            const view = surveySiteView(site.siteId);
            view.position.set(site.x, site.y);
            this.surveyLabels.set(site.siteId, label(view, site.name, -100, 103, 17, C.cyan));
            this.surveyViews.set(site.siteId, view);
            this.camera.addChildAt(view, 2);
        }
        const outpost = simulation.sector.outpost;
        this.outpostView.position.set(outpost.x, outpost.y);
        this.outpostView.rotation = outpost.phase + Math.PI;
        this.outpostScanner.position.set(outpost.x, outpost.y);
        const titles = new Container();
        titles.position.set(outpost.x, outpost.y);
        this.outpostLabel = label(titles, 'CERBER', -45, -134, 17, C.red);
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
                    .roundRect(-10, -18, 20, 36, 8)
                    .fill(C.ink)
                    .stroke({ color: C.mint, width: 2 })
                    .circle(0, -3, 5)
                    .fill(C.mint);
                pod.x = signal.ship ? 70 : 0;
                this.recoveryView.addChild(pod);
            }
            this.recoveryView.position.set(signal.x, signal.y);
            this.camera.addChild(this.recoveryRing, this.recoveryView);
        }
        this.addChild(this.camera);
        this.render(1);
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
            const count = impactParticleCount(event.kind, event.strength);
            for (let i = 0; i < count && this.particles.length < 800; i++) {
                const dust = event.kind === 'break' && i % 3 === 0;
                const color =
                    event.kind === 'weld'
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
            if (p.dust) p.view.scale.set(1 + (1 - p.life / p.duration) * 1.8);
            if (p.life <= 0) {
                p.view.destroy();
                this.particles.splice(i, 1);
            }
        }
    }
    private inView(point: Point) {
        const delta = rotateVector(
            { x: point.x - this.shipView.x, y: point.y - this.shipView.y },
            this.camera.rotation,
        );
        return Math.abs(delta.x) < 960 && Math.abs(delta.y) < 580;
    }
    private render(alpha: number, dt = 0) {
        const s = this.simulation,
            p = s.position;
        this.shield.clear();
        if (Math.hypot(p.x, p.y) < DRONES.safeRadius + 1100) {
            const pulse = 0.8 + Math.sin(this.clock * 1.6) * 0.15;
            this.shield.circle(0, 0, DRONES.safeRadius).fill({ color: 0x388fce, alpha: 0.018 });
            for (const [width, opacity] of [
                [46, 0.015],
                [25, 0.035],
                [11, 0.07],
                [3, 0.3],
                [1, 0.55],
            ])
                this.shield
                    .beginPath()
                    .circle(0, 0, DRONES.safeRadius)
                    .stroke({ color: 0x7bcfff, width, alpha: opacity * pulse });
            for (let i = 0; i < 32; i++) {
                const a = (i * Math.PI) / 16;
                this.shield
                    .beginPath()
                    .arc(0, 0, DRONES.safeRadius - 7, a + 0.015, a + 0.06)
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
        this.shipView.aimAt(s.aimTarget);
        this.shipView.updateDrive(
            s.thrusting && !s.reversing,
            s.reversing || (s.braking && s.speed > 5),
            s.engineFault,
            s.boosting,
            this.clock,
        );
        this.shipView.alpha = s.cloaked ? 0.4 : 1;
        this.camera.rotation = followCameraAngle(this.camera.rotation, this.shipView.rotation, dt);
        this.camera.pivot.copyFrom(this.shipView.position);
        this.camera.position.set(800, 450);
        this.laser.clear();
        for (const { from, to } of s.laserBeams) {
            this.laser
                .moveTo(from.x, from.y)
                .lineTo(to.x, to.y)
                .stroke({ color: C.gold, width: 8, alpha: 0.18 });
            this.laser
                .moveTo(from.x, from.y)
                .lineTo(to.x, to.y)
                .stroke({ color: C.mint, width: 2.5, alpha: 0.9 });
            this.laser.circle(to.x, to.y, 4 + Math.sin(this.clock * 40)).fill(C.text);
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
                    .fill(arm.held === 'parts' ? C.gold : C.mint);
        }
        for (const [id, view] of this.enemyViews)
            if (!s.enemies.enemies.has(id)) {
                view.destroy({ children: true });
                this.enemyViews.delete(id);
            }
        this.enemyStatus.clear();
        for (const enemy of s.enemies.enemies.values()) {
            let view = this.enemyViews.get(enemy.id);
            if (!view) {
                view = new DroneView(enemy.kind);
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
            if (!view.visible) continue;
            this.enemyStatus
                .rect(pos.x - 24, pos.y - 47, 48, 4)
                .fill(C.line)
                .rect(pos.x - 24, pos.y - 47, (48 * enemy.health) / enemy.config.hull, 4)
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
                this.enemyStatus
                    .moveTo(pos.x + Math.cos(a) * 35, pos.y + Math.sin(a) * 35)
                    .lineTo(
                        pos.x + Math.cos(a) * (enemy.kind === 'lancer' ? 350 : 100),
                        pos.y + Math.sin(a) * (enemy.kind === 'lancer' ? 350 : 100),
                    )
                    .stroke({ color: C.red, width: 1, alpha: 0.5 });
            }
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
            view.visible = this.inView(site);
            if (!view.visible) continue;
            const title = this.surveyLabels.get(site.siteId)!;
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
            (!security.secured || !security.sabotaged || !security.equipmentSecured);
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
        if (signal) {
            if (s.recoverySecured && s.tow) {
                const x = interpolate(s.tow.previous.x, s.tow.position.x, alpha),
                    y = interpolate(s.tow.previous.y, s.tow.position.y, alpha);
                this.recoveryView.position.set(x, y);
                this.recoveryView.rotation =
                    s.tow.previousAngle + angleDifference(s.tow.angle, s.tow.previousAngle) * alpha;
                const a = this.shipView.rotation;
                const anchor = {
                    x: this.shipView.x - Math.cos(a) * 28,
                    y: this.shipView.y - Math.sin(a) * 28,
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
                            -Math.PI / 2 + (s.recoveryProgress / RECOVERY.seconds) * Math.PI * 2,
                        )
                        .stroke({ color: C.mint, width: 4 });
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
                view = this.shapes.rock(rock.variant, rock.rich);
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
                view = new Graphics()
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
                    .fill(item.kind === 'parts' ? C.gold : C.mint)
                    .circle(0, 0, 12)
                    .stroke({
                        color: item.kind === 'parts' ? C.gold : C.mint,
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
            .circle(0, 0, GAME.sectorRadius)
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
        this.destroy({ children: true });
        this.shapes.dispose();
    }
}
