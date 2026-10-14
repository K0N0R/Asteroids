import { Container, Graphics, GraphicsContext } from 'pixi.js';
import { random } from '../worlds/sector';
import { EnemyKind, HullId, ScanSiteId, WeaponId, WEAPONS } from '../config';
import { ShipModules } from '../state/campaign';
import { GAME, HULLS } from '../config';
import { aimAngle, rotateVector } from '../systems/flight';
import { HarpoonArms, type HarpoonArmPose } from '../systems/harpoonArms';
import { drawHarpoonArms } from './harpoonArmsView';
import type { Point } from '../worlds/sector';
import {
    SHIP_COLORS,
    shipHull,
    shipUnderbody,
    engineHousing,
    roundedPanel,
    visor,
} from './shipHull';

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
    readonly harpoonView = new Graphics();
    readonly config;
    constructor(
        modules: ShipModules & { hull?: HullId; weapon?: WeaponId } = {
            engine: 0,
            handling: 0,
            cargo: 0,
            drill: 0,
            armor: 0,
            shield: 0,
        },
    ) {
        super();
        const hull = modules.hull ?? 'prospector',
            config = (this.config = HULLS[hull]),
            S = SHIP_COLORS,
            weapon = WEAPONS[hull === 'stinger' ? 'standard' : (modules.weapon ?? 'standard')];
        this.addChild(this.flame, this.retro, shipUnderbody(hull));
        if (hull === 'harpoon') {
            drawHarpoonArms(
                this.harpoonView,
                new HarpoonArms(modules.handling, modules.drill).poses,
            );
            this.addChild(this.harpoonView);
        }
        for (const mount of config.guns) {
            const gun = new Container();
            gun.position.set(mount.x, mount.y);
            gun.rotation = hull !== 'stinger' && mount.x < 0 ? Math.PI : 0;
            gun.addChild(
                hull === 'aegis'
                    ? new Graphics()
                          .roundRect(-7, -5, 25, 10, 2)
                          .fill(S.engine)
                          .stroke({ color: 0xa3c8d9, width: 1 })
                          .roundRect(0, -3, 24, 6, 2)
                          .fill(0x528ead)
                          .rect(5, -1, 22, 2)
                          .fill(0xc7f4ff)
                    : new Graphics()
                          .circle(0, 0, 7)
                          .fill(S.engine)
                          .stroke({ color: S.gunInset, width: 1 })
                          .roundRect(-7, -4, weapon.length + 7, 8, 2)
                          .fill(S.gun)
                          .rect(6, -2, 23, 4)
                          .fill(S.gunInset)
                          .roundRect(weapon.length - 4, -3, 4, 6, 1)
                          .fill(S.engine),
            );
            if (hull !== 'aegis' && hull !== 'stinger' && modules.weapon === 'rail')
                gun.addChild(
                    new Graphics()
                        .roundRect(10, -7, weapon.length - 9, 3, 1)
                        .roundRect(10, 4, weapon.length - 9, 3, 1)
                        .fill(0x91a5b3)
                        .rect(14, -5, 13, 2)
                        .rect(14, 3, 13, 2)
                        .fill({ color: C.cyan, alpha: 0.7 }),
                );
            if (hull !== 'aegis' && hull !== 'stinger' && modules.weapon === 'pulse')
                gun.addChild(
                    new Graphics()
                        .roundRect(3, -7, 13, 14, 3)
                        .fill(0x667e89)
                        .rect(5, -5, 2, 10)
                        .rect(10, -5, 2, 10)
                        .fill(0xadc1c9),
                );
            this.guns.push(gun);
            this.addChild(gun);
        }
        for (const mount of config.lasers) {
            const laser = new Container();
            laser.position.set(mount.x, mount.y);
            laser.rotation = mount.x < 0 ? Math.PI : 0;
            laser.addChild(
                hull === 'phoenix'
                    ? new Graphics()
                          .roundRect(-8, -5, 27, 10, 2)
                          .fill(S.engine)
                          .stroke({ color: 0xc5d2d7, width: 1 })
                          .roundRect(3, -3, 19, 6, 1)
                          .fill(0x7b4242)
                          .rect(7, -1, 16, 2)
                          .fill(0xff5547)
                    : new Graphics()
                          .roundRect(-5, -4, 24 + modules.drill, 8, 3)
                          .fill(S.laser)
                          .stroke({ color: S.gunInset, width: 0.7 })
                          .roundRect(3, -1.5, 13 + modules.drill, 3, 1)
                          .fill(S.visor)
                          .circle(0, 0, 4)
                          .fill(S.engine),
            );
            this.lasers.push(laser);
            this.addChild(laser);
        }
        for (const engine of config.engines) this.addChild(engineHousing(engine.x, engine.y));
        this.addChild(shipHull(hull, modules));
        for (const mount of config.grabbers)
            this.addChild(
                new Graphics()
                    .circle(mount.x, mount.y, 3)
                    .fill(S.engine)
                    .circle(mount.x, mount.y, 1.4)
                    .fill(S.reinforcement),
            );
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
    updateArms(poses: readonly HarpoonArmPose[]) {
        drawHarpoonArms(this.harpoonView, poses);
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
                .fill({ color: fault ? C.red : SHIP_COLORS.flame, alpha: 0.8 });
            this.retro
                .poly([
                    engine.x + 8,
                    engine.y - 6,
                    engine.x + 24,
                    engine.y,
                    engine.x + 8,
                    engine.y + 6,
                ])
                .fill(0xc4ac88);
        }
        this.flame.visible = forward;
        this.retro.visible = reverse;
        this.flame.alpha = fault ? 0.45 + Math.abs(Math.sin(time * 19)) * 0.3 : 1;
    }
}

export class DroneView extends Container {
    readonly flame = new Graphics();
    constructor(kind: EnemyKind = 'patrol') {
        super();
        const heavy = kind === 'lancer',
            g = new Graphics();
        this.flame.poly([-29, -7, -54, 0, -29, 7]).fill({ color: SHIP_COLORS.flame, alpha: 0.8 });
        this.addChild(this.flame, engineHousing(-24, heavy ? -17 : 0));
        if (heavy) this.addChild(engineHousing(-24, 17));
        // Weapon sits below the armoured deck, like the player fleet.
        const gun = new Graphics()
            .circle(2, 0, 8)
            .fill(SHIP_COLORS.engine)
            .roundRect(-2, -5, heavy ? 49 : 38, 10, 3)
            .fill(SHIP_COLORS.gun)
            .roundRect(13, -2, heavy ? 30 : 20, 4, 1)
            .fill(SHIP_COLORS.gunInset)
            .roundRect(heavy ? 42 : 32, -4, 5, 8, 1)
            .fill(0x394650);
        this.addChild(gun);
        const hull = heavy ? 0x615b66 : 0x646b73,
            edge = heavy ? 0xa49ba6 : 0xa0adb4;
        roundedPanel(
            g,
            heavy
                ? [
                      -29, -15, -15, -35, 10, -32, 29, -16, 21, -8, 21, 8, 29, 16, 10, 32, -15, 35,
                      -29, 15,
                  ]
                : [-26, -12, -12, -28, 10, -20, 28, -8, 28, 8, 10, 20, -12, 28, -26, 12],
            4,
            hull,
            edge,
        );
        for (const side of [-1, 1]) {
            roundedPanel(
                g,
                [-15, side * 12, -9, side * (heavy ? 28 : 22), 12, side * 19, 18, side * 11],
                2,
                heavy ? 0x7f7481 : 0x7b8790,
                edge,
            );
            g.roundRect(-18, side * 11 - 2, 12, 4, 1).fill(SHIP_COLORS.engine);
            g.roundRect(1, side * 16 - 1.5, 10, 3, 1).fill(0xb7887e);
            g.circle(-9, side * 18, 1.2).fill(0xc6c6c3);
        }
        g.roundRect(-18, -9, 26, 18, 5).fill(0x414b55).stroke({ color: edge, width: 0.7 });
        visor(g, -6, 0, 9, 7);
        g.roundRect(12, -4, 7, 8, 2).fill(0x423e43);
        g.circle(15, 0, 2).fill(0xd39b87);
        for (let i = 0; i < 3; i++)
            g.roundRect(-22 + i * 3, -4, 1.3, 8, 0.5).fill(SHIP_COLORS.engine);
        this.addChild(g);
    }
}

export function stationView(level = 0) {
    const view = new Container(),
        g = new Graphics();
    // Heavy segmented habitat ring, docking arms and a glazed command hub.
    g.circle(0, 0, 150).stroke({ color: 0x293944, width: 29 });
    g.circle(0, 0, 151).stroke({ color: 0x8dabb9, width: 1.5 });
    g.circle(0, 0, 133).stroke({ color: 0x4a626f, width: 4 });
    for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4,
            arm = new Graphics();
        arm.roundRect(42, -8, 119, 16, 4).fill(0x435765).stroke({ color: 0x8096a1, width: 1 });
        arm.roundRect(117, -27, 59, 54, 8)
            .fill(i < 3 + level ? 0x677975 : 0x5e7280)
            .stroke({ color: 0x9db1b7, width: 1.2 });
        arm.roundRect(121, -23, 50, 12, 3).fill(0x81969d);
        arm.roundRect(130, -9, 34, 18, 4).fill(0x293944);
        arm.rect(135, -5, 23, 2).rect(135, 3, 23, 2).fill(C.cyan);
        for (const y of [-20, 20]) arm.roundRect(126, y - 2, 36, 4, 1).fill(0xa09176);
        arm.circle(121, -18, 1.6).circle(171, 18, 1.6).fill(0xd4d9d8);
        arm.rotation = a;
        view.addChild(arm);
        g.beginPath()
            .arc(0, 0, 150, a + 0.09, a + 0.65)
            .stroke({ color: 0x758b99, width: 17 });
        g.beginPath()
            .arc(0, 0, 151, a + 0.16, a + 0.59)
            .stroke({ color: C.cyan, width: 2, alpha: 0.7 });
    }
    roundedPanel(g, [0, -65, 56, -32, 56, 32, 0, 65, -56, 32, -56, -32], 8, 0x617784, 0xa2b9c3);
    g.circle(0, 0, 43).fill(0x364d5a).stroke({ color: 0x96adb5, width: 2 });
    visor(g, 0, 0, 31, 28);
    g.circle(0, 0, 12).fill({ color: 0xe1f4ff, alpha: 0.15 });
    for (const x of [-46, 46])
        for (const y of [-18, 18]) g.roundRect(x - 3, y - 6, 6, 12, 2).fill(C.mint);
    g.beginPath()
        .moveTo(179, -47)
        .lineTo(256, -47)
        .moveTo(179, 47)
        .lineTo(256, 47)
        .stroke({ color: C.cyan, width: 2, alpha: 0.5 });
    view.addChild(g);
    return view;
}

export function cacheView() {
    const view = new Container(),
        g = new Graphics();
    roundedPanel(
        g,
        [-41, -25, -20, -39, 25, -39, 41, -24, 41, 24, 20, 39, -25, 39, -41, 24],
        5,
        0x546873,
        0x9baeb5,
    );
    g.roundRect(-34, -24, 68, 48, 5).fill(0x7e8e94).stroke({ color: 0x354650, width: 3 });
    for (const x of [-27, 17]) g.roundRect(x, -24, 10, 48, 2).fill(0x3e505b);
    g.roundRect(-14, -19, 28, 38, 4).fill(0xa69576).stroke({ color: 0xd0c2a3, width: 1 });
    g.roundRect(-8, -11, 16, 22, 3).fill(0x263e4b);
    g.roundRect(-5, -7, 10, 5, 1).fill(SHIP_COLORS.visor);
    g.circle(0, 7, 2).fill(C.mint);
    for (const x of [-33, 33]) for (const y of [-29, 29]) g.circle(x, y, 2).fill(0xd0d6d5);
    g.roundRect(-28, -32, 22, 3, 1).fill(0xc5b493);
    view.addChild(g);
    return view;
}

export function wreckView() {
    const view = new Container();
    const g = new Graphics()
        .poly([-75, -28, -15, -35, 12, -12, -10, 20, -65, 32])
        .fill(0x51616b)
        .stroke({ color: C.muted, width: 2 });
    g.poly([30, -15, 73, -28, 92, 4, 56, 24, 18, 17])
        .fill(0x667079)
        .stroke({ color: 0x9a9e9d, width: 1 });
    g.rect(-60, -18, 25, 5).rect(-53, 12, 20, 4).fill(C.gold);
    g.circle(0, 0, 135).stroke({ color: 0x9a9e9d, width: 1, alpha: 0.17 });
    for (const y of [-16, 16]) {
        g.roundRect(-59, y - 2, 32, 4, 1).fill(0x2d3e49);
        g.circle(-62, y, 2).fill(0xa5b0b4);
    }
    g.poly([-12, -9, 5, -4, -4, 8, -16, 5]).fill(0x23343f);
    g.beginPath().moveTo(31, -8).lineTo(57, 7).lineTo(71, 3).stroke({ color: 0x313e47, width: 3 });
    view.addChild(g);
    return view;
}

export function surveySiteView(site: ScanSiteId) {
    const view = new Container(),
        g = new Graphics();
    if (site === 'relay') {
        g.roundRect(-35, -30, 70, 60, 8).fill(0x596f7d).stroke({ color: 0x9eafb7, width: 1.5 });
        for (const x of [-110, 50]) {
            g.rect(x, -35, 60, 70).fill(0x314d64).stroke({ color: C.cyan, width: 1 });
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
        g.circle(0, 0, 83).stroke({ color: 0xa89e88, width: 1.5, alpha: 0.4 });
        for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 6;
            g.beginPath()
                .arc(0, 0, 67, a + 0.1, a + 0.7)
                .stroke({ color: 0x576c79, width: 14 });
            g.beginPath()
                .arc(0, 0, 67, a + 0.1, a + 0.7)
                .stroke({ color: 0xa89e88, width: 1.5 });
        }
        g.poly([0, -40, 38, -10, 24, 34, -25, 34, -38, -10])
            .fill(0x687681)
            .stroke({ color: 0xa89e88, width: 1.5 });
        g.circle(0, 0, 24).fill(C.ink).stroke({ color: 0x9eafb7, width: 1.5 });
        g.poly([0, -16, 16, 0, 0, 16, -16, 0]).fill({ color: C.cyan, alpha: 0.3 });
        g.rect(-4, -6, 8, 12).fill(C.gold);
    }
    // Glazed instruments and inset service panels share the fleet material language.
    if (site === 'relay') {
        visor(g, 0, 0, 16, 12);
        for (const y of [-21, 21]) g.roundRect(-27, y - 2, 18, 4, 1).fill(0xa1afb4);
        for (const x of [-103, 57])
            for (const y of [-27, -9, 9, 27])
                g.roundRect(x, y - 3, 45, 6, 1).fill({ color: 0x6f96b6, alpha: 0.35 });
    } else {
        visor(g, 0, 0, 20, 20);
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            g.circle(Math.cos(a) * 52, Math.sin(a) * 52, 2).fill(0xc5c7bf);
        }
    }
    view.addChild(g);
    return view;
}

export class ShapeLibrary {
    private rocks = new Map<string, GraphicsContext>();
    rock(variant: number, rich: boolean, crystal = false) {
        const key = `${variant}:${rich}:${crystal}`;
        let context = this.rocks.get(key);
        if (!context) {
            const rng = random(variant * 163 + 8),
                points: number[] = [];
            const n = 10 + Math.floor(rng() * 7),
                aspect = 0.74 + rng() * 0.3;
            const palettes = rich
                ? [0x52483c, 0x5b4d42, 0x484943, 0x645749]
                : [0x45535d, 0x55555a, 0x4c5954, 0x5c514c, 0x3e505c];
            const base = palettes[Math.floor(rng() * palettes.length)];
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2,
                    r = 0.69 + rng() * 0.29;
                points.push(Math.cos(a) * r, Math.sin(a) * r * aspect);
            }
            context = new GraphicsContext()
                .poly(points)
                .fill(base)
                .stroke({ color: rich ? 0x9d8b71 : 0x829097, width: 0.018 });
            // Facets fan into a displaced centre; no repeated painted-on polygon.
            const cx = (rng() - 0.5) * 0.3,
                cy = (rng() - 0.5) * 0.25;
            for (let i = 0; i < n; i++) {
                const next = (i + 1) % n;
                context
                    .poly([
                        cx,
                        cy,
                        points[i * 2],
                        points[i * 2 + 1],
                        points[next * 2],
                        points[next * 2 + 1],
                    ])
                    .fill({ color: i < n / 2 ? 0xc7c3b8 : 0x16212a, alpha: 0.05 + rng() * 0.14 });
            }
            for (let i = 0; i < 3 + Math.floor(rng() * 5); i++) {
                const angle = rng() * Math.PI * 2,
                    reach = rng() * 0.42,
                    x = Math.cos(angle) * reach,
                    y = Math.sin(angle) * reach * aspect,
                    r = 0.035 + rng() * 0.13;
                context.ellipse(x, y, r, r * 0.7).fill({ color: 0x18242c, alpha: 0.38 });
                context
                    .beginPath()
                    .arc(x, y, r, 0.1, 2.7)
                    .stroke({ color: 0xb4b8b1, width: 0.012, alpha: 0.23 });
            }
            for (let i = 0; i < 2; i++) {
                const x = (rng() - 0.5) * 0.8,
                    y = (rng() - 0.5) * 0.8;
                context
                    .beginPath()
                    .moveTo(x, y)
                    .lineTo(x + 0.13, y - 0.13)
                    .lineTo(x + 0.22, y - 0.1)
                    .stroke({ color: 0x1e2a31, width: 0.018, alpha: 0.75 });
            }
            if (rich)
                for (let i = 0; i < 3; i++) {
                    const x = (rng() - 0.5) * 0.85,
                        y = (rng() - 0.5) * 0.75;
                    context
                        .poly([x, y - 0.08, x + 0.13, y, x + 0.06, y + 0.1, x - 0.06, y + 0.03])
                        .fill(0xb9a17c)
                        .stroke({ color: 0xe0c398, width: 0.01 });
                }
            if (crystal)
                for (const [x, y] of [
                    [-0.18, -0.18],
                    [0.18, 0.2],
                    [0.23, -0.23],
                ])
                    context
                        .poly([x, y - 0.16, x + 0.08, y, x, y + 0.1, x - 0.07, y])
                        .fill(0xb69ade)
                        .stroke({ color: 0xe5d6ff, width: 0.014 });
            this.rocks.set(key, context);
        }
        return new Graphics(context);
    }
    dispose() {
        for (const context of this.rocks.values()) context.destroy();
        this.rocks.clear();
    }
}
