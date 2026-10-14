import { Container, Graphics, GraphicsContext } from 'pixi.js';
import { random } from '../worlds/sector';
import { HullId, ScanSiteId } from '../config';
import { ShipModules } from '../state/campaign';
import { GAME, HULLS } from '../config';
import { aimAngle, rotateVector } from '../systems/flight';
import type { Point } from '../worlds/sector';
import { SHIP_COLORS, shipHull, shipUnderbody, engineHousing } from './shipHull';

export const C = {
    ink: 0x07121e,
    panel: 0x0b1d2b,
    line: 0x244758,
    text: 0xe4f0f4,
    muted: 0x7d9cac,
    mint: 0x78e1bc,
    cyan: 0x69cbe9,
    gold: 0xf2bd75,
    red: 0xf07879,
} as const;

export { SHIP_COLORS } from './shipHull';
export class ShipView extends Container {
    readonly guns: Container[] = [];
    readonly lasers: Container[] = [];
    readonly flame = new Graphics();
    readonly retro = new Graphics();
    readonly config;
    constructor(
        modules: ShipModules & { hull?: HullId } = {
            engine: 0,
            handling: 0,
            cargo: 0,
            drill: 0,
            armor: 0,
        },
    ) {
        super();
        const hull = modules.hull ?? 'prospector',
            config = (this.config = HULLS[hull]),
            S = SHIP_COLORS;
        this.addChild(this.flame, this.retro, shipUnderbody(hull));
        for (const mount of config.guns) {
            const gun = new Container();
            gun.position.set(mount.x, mount.y);
            gun.rotation = mount.x < 0 ? Math.PI : 0;
            gun.addChild(
                new Graphics()
                    .circle(0, 0, 7)
                    .fill(S.gunInset)
                    .roundRect(-7, -4, GAME.gunLength + 7, 8, 2)
                    .fill(S.gun)
                    .rect(6, -2, 23, 4)
                    .fill(S.gunInset),
            );
            this.guns.push(gun);
            this.addChild(gun);
        }
        for (const mount of config.lasers) {
            const laser = new Container();
            laser.position.set(mount.x, mount.y);
            laser.rotation = mount.x < 0 ? Math.PI : 0;
            laser.addChild(
                new Graphics()
                    .roundRect(-5, -4, 24 + modules.drill, 8, 3)
                    .fill(S.laser)
                    .circle(0, 0, 4)
                    .fill(S.engine),
            );
            this.lasers.push(laser);
            this.addChild(laser);
        }
        for (const engine of config.engines) this.addChild(engineHousing(engine.x, engine.y));
        this.addChild(shipHull(hull, modules));
        for (const mount of config.grabbers)
            this.addChild(new Graphics().circle(mount.x, mount.y, 3).fill(S.reinforcement));
        this.updateDrive(false, false, false, false, 0);
    }
    aimAt(target: Point) {
        const local = rotateVector(
            { x: (target.x - this.x) / this.scale.x, y: (target.y - this.y) / this.scale.y },
            -this.rotation,
        );
        for (const gun of [...this.guns, ...this.lasers])
            gun.rotation = aimAngle(gun.position, local, 0);
    }
    updateDrive(forward: boolean, reverse: boolean, fault: boolean, boost: boolean, time: number) {
        this.flame.clear();
        this.retro.clear();
        const length = (boost ? 48 : 27) * (0.85 + Math.sin(time * 37) * 0.12);
        for (const engine of this.config.engines) {
            this.flame
                .poly([
                    engine.x - 14,
                    engine.y - 7,
                    engine.x - 14 - length,
                    engine.y,
                    engine.x - 14,
                    engine.y + 7,
                ])
                .fill(fault ? C.red : SHIP_COLORS.flame);
            this.retro
                .poly([
                    engine.x + 8,
                    engine.y - 6,
                    engine.x + 24,
                    engine.y,
                    engine.x + 8,
                    engine.y + 6,
                ])
                .fill(C.gold);
        }
        this.flame.visible = forward;
        this.retro.visible = reverse;
        this.flame.alpha = fault ? 0.45 + Math.abs(Math.sin(time * 19)) * 0.3 : 1;
    }
}

export class DroneView extends Container {
    readonly flame = new Graphics().poly([-23, -6, -48, 0, -23, 6]).fill(C.red);
    constructor() {
        super();
        this.addChild(this.flame);
        const hull = new Graphics()
            .poly([-24, -12, -9, -29, 15, -15, 32, 0, 15, 15, -9, 29, -24, 12])
            .fill(0x3e222b)
            .stroke({ color: C.red, width: 2 });
        hull.poly([-15, -8, 12, -10, 23, 0, 12, 10, -15, 8]).fill(0x6d3540);
        hull.poly([2, -5, 18, 0, 2, 5]).fill(C.red);
        hull.rect(-20, -23, 26, 4).rect(-20, 19, 26, 4).fill(C.gold);
        this.addChild(hull);
    }
}

export function stationView(level = 0) {
    const view = new Container(),
        g = new Graphics();
    g.circle(0, 0, 180).stroke({ color: C.cyan, width: 1, alpha: 0.18 });
    g.circle(0, 0, 144).stroke({ color: C.cyan, width: 10, alpha: 0.08 });
    g.circle(0, 0, 140).stroke({ color: C.line, width: 18 });
    g.circle(0, 0, 140).stroke({ color: C.cyan, width: 1, alpha: 0.6 });
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const arm = new Graphics()
            .rect(42, -8, 104, 16)
            .fill(0x163447)
            .stroke({ color: C.line, width: 1 });
        arm.roundRect(116, -24, 55, 48, 5)
            .fill(0x173446)
            .stroke({ color: i < 3 + level ? C.mint : C.cyan, width: 1.3 });
        arm.rect(120, -16, 40, 3)
            .rect(120, 13, 40, 3)
            .fill(i < 3 + level ? C.mint : C.muted);
        arm.rotation = angle;
        view.addChild(arm);
    }
    g.poly([0, -62, 54, -31, 54, 31, 0, 62, -54, 31, -54, -31])
        .fill(0x183b4d)
        .stroke({ color: C.cyan, width: 2 });
    g.circle(0, 0, 30).fill(C.ink).stroke({ color: C.mint, width: 2 });
    g.circle(0, 0, 14).fill({ color: C.mint, alpha: 0.15 }).stroke({ color: C.mint, width: 1 });
    g.rect(-4, -20, 8, 40).rect(-20, -4, 40, 8).fill(C.mint);
    g.moveTo(175, -48)
        .lineTo(255, -48)
        .moveTo(175, 48)
        .lineTo(255, 48)
        .stroke({ color: C.mint, width: 2, alpha: 0.5 });
    view.addChild(g);
    return view;
}

export function wreckView() {
    const view = new Container();
    const g = new Graphics()
        .poly([-75, -28, -15, -35, 12, -12, -10, 20, -65, 32])
        .fill(0x203744)
        .stroke({ color: C.muted, width: 2 });
    g.poly([30, -15, 73, -28, 92, 4, 56, 24, 18, 17])
        .fill(0x253a43)
        .stroke({ color: C.gold, width: 1 });
    g.rect(-60, -18, 25, 5).rect(-53, 12, 20, 4).fill(C.gold);
    g.circle(0, 0, 135).stroke({ color: C.gold, width: 1, alpha: 0.17 });
    view.addChild(g);
    return view;
}

export function surveySiteView(site: ScanSiteId) {
    const view = new Container(),
        g = new Graphics();
    if (site === 'relay') {
        g.roundRect(-35, -30, 70, 60, 8).fill(0x173346).stroke({ color: C.cyan, width: 2 });
        for (const x of [-110, 50]) {
            g.rect(x, -35, 60, 70).fill(0x1c4255).stroke({ color: C.cyan, width: 1 });
            for (let i = 1; i < 4; i++)
                g.moveTo(x + i * 15, -35)
                    .lineTo(x + i * 15, 35)
                    .stroke({ color: C.line, width: 2 });
        }
        g.moveTo(-50, 0).lineTo(50, 0).stroke({ color: C.cyan, width: 3 });
        g.circle(0, 0, 19).fill(C.ink).stroke({ color: C.mint, width: 2 });
        g.circle(0, 0, 7).fill(C.mint);
        g.moveTo(0, -30).lineTo(0, -65).stroke({ color: C.cyan, width: 3 });
        g.beginPath()
            .arc(0, -65, 22, Math.PI, Math.PI * 2)
            .stroke({ color: C.cyan, width: 3 });
        g.beginPath()
            .arc(0, -65, 38, Math.PI * 1.2, Math.PI * 1.8)
            .stroke({
                color: C.mint,
                width: 1,
                alpha: 0.5,
            });
    } else {
        g.circle(0, 0, 83).stroke({ color: C.gold, width: 2, alpha: 0.4 });
        for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 6;
            g.beginPath()
                .arc(0, 0, 67, a + 0.1, a + 0.7)
                .stroke({ color: C.line, width: 14 });
            g.beginPath()
                .arc(0, 0, 67, a + 0.1, a + 0.7)
                .stroke({ color: C.gold, width: 2 });
        }
        g.poly([0, -40, 38, -10, 24, 34, -25, 34, -38, -10])
            .fill(0x293a43)
            .stroke({ color: C.gold, width: 2 });
        g.circle(0, 0, 24).fill(C.ink).stroke({ color: C.cyan, width: 2 });
        g.poly([0, -16, 16, 0, 0, 16, -16, 0]).fill({ color: C.cyan, alpha: 0.3 });
        g.rect(-4, -6, 8, 12).fill(C.gold);
    }
    view.addChild(g);
    return view;
}

export class ShapeLibrary {
    private rocks = new Map<string, GraphicsContext>();
    rock(variant: number, rich: boolean) {
        const key = `${variant}:${rich}`;
        let context = this.rocks.get(key);
        if (!context) {
            const rng = random(variant * 163 + 8),
                points: number[] = [];
            for (let i = 0; i < 11; i++) {
                const a = (i / 11) * Math.PI * 2,
                    r = 0.8 + rng() * 0.2;
                points.push(Math.cos(a) * r, Math.sin(a) * r);
            }
            context = new GraphicsContext()
                .poly(points)
                .fill(rich ? 0x423c36 : 0x243741)
                .stroke({ color: rich ? 0xa68559 : 0x56717d, width: 0.022 });
            context
                .poly([-0.45, -0.23, -0.2, -0.52, 0.12, -0.46, 0.27, -0.12, -0.04, 0.02])
                .fill(rich ? 0x62513c : 0x344e59);
            context
                .moveTo(-0.45, 0.45)
                .lineTo(-0.1, 0.2)
                .lineTo(0.15, 0.32)
                .stroke({ color: 0x14252e, width: 0.025 });
            if (rich) context.poly([0.15, -0.4, 0.3, -0.25, 0.17, -0.08, 0.03, -0.24]).fill(C.gold);
            this.rocks.set(key, context);
        }
        return new Graphics(context);
    }
    dispose() {
        for (const context of this.rocks.values()) context.destroy();
        this.rocks.clear();
    }
}
