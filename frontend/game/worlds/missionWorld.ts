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
} from '../graphics/shapes';
import { DRONES, GAME, HULLS, RECOVERY, SCAN, ScanSiteId } from '../config';
import { SoundManager } from '../../core/systems/soundManager';
import { Ship } from '../state/campaign';
import { label } from '../ui/primitives';
import { enemyPosition } from '../systems/enemies';

const interpolate = (a: number, b: number, t: number) => a + (b - a) * t;
export class MissionWorld extends Container {
    readonly camera = new Container();
    readonly shipView;
    private rocks = new Map<number, Graphics>();
    private bullets = new Map<number, Graphics>();
    private enemyViews = new Map<number, DroneView>();
    private enemyStatus = new Graphics();
    private loot = new Map<number, Graphics>();
    private particles: { view: Graphics; vx: number; vy: number; life: number }[] = [];
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
    private surveyViews = new Map<ScanSiteId, Container>();
    constructor(
        readonly simulation: MissionSimulation,
        modules: Ship,
    ) {
        super();
        this.eventMode = 'none';
        this.shipView = new ShipView(modules);
        this.shipView.scale.set(simulation.hullConfig.size);
        this.camera.addChild(this.navigation, this.home);
        const wreck = wreckView(),
            w = simulation.sector.landmarks[2];
        wreck.position.set(w.x, w.y);
        this.camera.addChild(wreck, this.rockLayer, this.effectLayer, this.shipView);
        this.camera.addChild(this.enemyStatus);
        this.camera.addChildAt(this.surveyRings, 2);
        for (const site of simulation.sector.landmarks) {
            if (!site.siteId) continue;
            const view = surveySiteView(site.siteId);
            view.position.set(site.x, site.y);
            label(view, site.name, -100, 103, 17, C.cyan);
            this.surveyViews.set(site.siteId, view);
            this.camera.addChildAt(view, 2);
        }
        const signal = simulation.recoverySignal;
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
        this.accumulator += Math.min(deltaMS / 1000, 0.1);
        this.clock += deltaMS / 1000;
        while (this.accumulator >= GAME.step) {
            this.simulation.step(input);
            this.accumulator -= GAME.step;
            if (this.simulation.ended) {
                this.accumulator = 0;
                break;
            }
        }
        this.render(this.accumulator / GAME.step);
        for (const event of this.simulation.events.splice(0)) {
            SoundManager.checkThresholdAndPlay(
                {
                    soundName: `sounds/${event.kind}.wav`,
                    group: 'gameplay',
                    volume: event.kind === 'shot' ? 0.4 : 0.7,
                },
                70,
            );
            if (event.kind === 'shot') continue;
            const count = event.kind === 'break' ? 13 : event.kind === 'hit' ? 5 : 2;
            for (let i = 0; i < count && this.particles.length < 240; i++) {
                const view = new Graphics()
                    .rect(-1.5, -1.5, 3, 3)
                    .fill(event.rich ? C.gold : event.kind === 'collect' ? C.mint : C.cyan);
                view.position.set(event.x, event.y);
                this.effectLayer.addChild(view);
                const angle = Math.random() * Math.PI * 2,
                    speed = 25 + Math.random() * 100;
                this.particles.push({
                    view,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.4 + Math.random() * 0.4,
                });
            }
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= deltaMS / 1000;
            particle.view.x += (particle.vx * deltaMS) / 1000;
            particle.view.y += (particle.vy * deltaMS) / 1000;
            particle.view.alpha = Math.max(0, particle.life);
            if (particle.life <= 0) {
                particle.view.destroy();
                this.particles.splice(i, 1);
            }
        }
    }
    private render(alpha: number) {
        const s = this.simulation,
            p = s.position;
        this.shipView.position.set(
            interpolate(s.previous.x, p.x, alpha),
            interpolate(s.previous.y, p.y, alpha),
        );
        const deltaAngle = Math.atan2(
            Math.sin(s.ship.rotation() - s.previousAngle),
            Math.cos(s.ship.rotation() - s.previousAngle),
        );
        this.shipView.rotation = s.previousAngle + deltaAngle * alpha;
        this.shipView.flame.visible = s.thrusting;
        this.shipView.flame.tint = s.engineFault ? C.red : 0xffffff;
        this.shipView.flame.alpha = s.engineFault
            ? 0.35 + Math.abs(Math.sin(this.clock * 19)) * 0.4
            : 1;
        this.shipView.flame.scale.x = 0.75 + Math.sin(this.clock * 47) * 0.16;
        this.shipView.retro.visible = s.braking && s.speed > 5;
        this.camera.position.set(800 - this.shipView.x, 450 - this.shipView.y);
        for (const [id, view] of this.enemyViews)
            if (!s.enemies.enemies.has(id)) {
                view.destroy({ children: true });
                this.enemyViews.delete(id);
            }
        this.enemyStatus.clear();
        for (const enemy of s.enemies.enemies.values()) {
            let view = this.enemyViews.get(enemy.id);
            if (!view) {
                view = new DroneView();
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
            view.visible = Math.abs(pos.x - p.x) < 960 && Math.abs(pos.y - p.y) < 580;
            if (!view.visible) continue;
            this.enemyStatus
                .rect(pos.x - 24, pos.y - 47, 48, 4)
                .fill(C.line)
                .rect(pos.x - 24, pos.y - 47, (48 * enemy.health) / DRONES.hull, 4)
                .fill(C.red);
            if (enemy.charge > 0) {
                const a = enemy.body.rotation();
                this.enemyStatus
                    .arc(
                        pos.x,
                        pos.y,
                        39,
                        -Math.PI / 2,
                        -Math.PI / 2 + (enemy.charge / DRONES.windup) * Math.PI * 2,
                    )
                    .stroke({ color: C.red, width: 3 });
                this.enemyStatus
                    .moveTo(pos.x + Math.cos(a) * 35, pos.y + Math.sin(a) * 35)
                    .lineTo(pos.x + Math.cos(a) * 100, pos.y + Math.sin(a) * 100)
                    .stroke({ color: C.red, width: 1, alpha: 0.5 });
            }
        }
        this.surveyRings.clear();
        for (const site of s.sector.landmarks) {
            if (!site.siteId) continue;
            const view = this.surveyViews.get(site.siteId)!;
            view.visible = Math.abs(site.x - p.x) < 960 && Math.abs(site.y - p.y) < 580;
            if (!view.visible) continue;
            const done = s.surveyData.has(site.siteId);
            this.surveyRings.circle(site.x, site.y, SCAN.radius).stroke({
                color: done ? C.mint : C.cyan,
                width: 1,
                alpha: done ? 0.35 : 0.2 + Math.sin(this.clock * 2) * 0.08,
            });
            if (s.scanTarget === site.siteId && s.scanProgress > 0)
                this.surveyRings
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
        const signal = s.recoverySignal;
        this.recoveryRing.clear();
        if (signal) {
            if (s.recoverySecured) {
                const a = this.shipView.rotation;
                const x = this.shipView.x - Math.cos(a) * 135,
                    y = this.shipView.y - Math.sin(a) * 135;
                this.recoveryView.position.set(x, y);
                this.recoveryRing
                    .moveTo(this.shipView.x, this.shipView.y)
                    .lineTo(x, y)
                    .stroke({ color: C.mint, alpha: 0.5, width: 1 });
            } else {
                this.recoveryRing.circle(signal.x, signal.y, RECOVERY.radius).stroke({
                    color: C.mint,
                    width: 1,
                    alpha: 0.25 + Math.sin(this.clock * 3) * 0.1,
                });
                if (s.recoveryProgress > 0)
                    this.recoveryRing
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
            view.visible = Math.abs(view.x - p.x) < 960 && Math.abs(view.y - p.y) < 580;
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
                    .roundRect(-11, -1.5, 22, 3, 1)
                    .fill(bullet.team === 'enemy' ? C.red : C.mint);
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
        this.simulation.dispose();
        this.destroy({ children: true });
        this.shapes.dispose();
    }
}
