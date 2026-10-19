import { drawMineralMarkers, mineralMarkerKey } from './mineralMarkers';
import type { ResourceStore } from '../state/resources';
import { Container, Graphics, GraphicsContext } from 'pixi.js';
import { random } from '../worlds/sector';
import { EnemyKind, HullId, ScanSiteId, WeaponId, WEAPONS } from '../config';
import { ShipModules } from '../state/campaign';
import { GAME, HULLS, ATLAS_WEAPONS } from '../config';
import { aimAngle, rotateVector } from '../systems/flight';
import { HarpoonArms, type HarpoonArmPose } from '../systems/harpoonArms';
import { drawHarpoonArms } from './harpoonArmsView';
import type { Point } from '../worlds/sector';
import {
    SHIP_COLORS,
    HULL_PALETTES,
    shipHull,
    shipUnderbody,
    engineHousing,
    roundedPanel,
    visor,
} from './shipHull';

import {
    fittedEquipment,
    outerArmor,
    aegisCannon,
    cargoEquipment,
    maneuveringJets,
    maneuveringFlame,
    laserTint,
    laserBarrelLength,
    laserUpgradeLevel,
} from './shipEquipment';

import { C } from './theme';
export { C } from './theme';

export { SHIP_COLORS } from './shipHull';
export class ShipView extends Container {
    readonly guns: Container[] = [];
    readonly lasers: Container[] = [];
    readonly rocketLauncher: Container | null;
    readonly flame = new Graphics();
    readonly retro = new Graphics();
    readonly maneuvering = new Graphics();
    private visualModules: ShipModules;
    private hullId: HullId;
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
        this.visualModules = modules;
        this.hullId = modules.hull ?? 'prospector';
        const hull = modules.hull ?? 'prospector',
            config = (this.config = HULLS[hull]),
            S = {
                ...SHIP_COLORS,
                gun: HULL_PALETTES[hull].edge,
                gunInset: HULL_PALETTES[hull].panel,
            },
            weapon = WEAPONS[modules.weapon ?? 'standard'];
        this.addChild(this.flame, this.retro, this.maneuvering, shipUnderbody(hull));
        this.addChild(cargoEquipment(hull, modules.cargo, true), outerArmor(hull, modules.armor));
        this.rocketLauncher = hull === 'atlas' ? new Container() : null;
        if (this.rocketLauncher) {
            const mount = ATLAS_WEAPONS.launcher;
            this.rocketLauncher.position.set(mount.x, mount.y);
            const launcher = new Graphics()
                .circle(0, 0, 8)
                .fill(S.engine)
                .roundRect(-8, -8, 19, 16, 3)
                .fill(HULL_PALETTES[hull].panel)
                .roundRect(3, -6, mount.length - 3, 12, 2)
                .fill(0x596b70);
            for (const side of [-1, 1]) {
                launcher.roundRect(8, side * 3 - 1.5, mount.length - 8, 3, 1).fill(0x263942);
                launcher.roundRect(mount.length - 5, side * 3 - 1, 3, 2, 0.5).fill(0xc1ab7c);
                for (let i = 0; i < modules.handling; i++)
                    launcher.rect(10 + i * 5, side * 6 - 0.6, 2, 1.2).fill(0xb0c6ce);
            }
            this.rocketLauncher.addChild(launcher);
            this.addChild(this.rocketLauncher);
        }
        if (hull === 'harpoon') {
            drawHarpoonArms(
                this.harpoonView,
                new HarpoonArms(modules.handling, modules.drill).poses,
                modules.handling,
                modules.drill,
            );
            this.addChild(this.harpoonView);
        }
        for (const mount of config.guns) {
            const gun = new Container();
            gun.position.set(mount.x, mount.y);
            gun.rotation = hull !== 'stinger' && mount.x < 0 ? Math.PI : 0;
            gun.addChild(
                hull === 'aegis'
                    ? aegisCannon(modules.drill)
                    : new Graphics()
                          .circle(0, 0, 7)
                          .fill(S.engine)
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
        const laserLevel = laserUpgradeLevel(hull, modules.drill);
        for (const mount of config.lasers) {
            const laser = new Container();
            laser.position.set(mount.x, mount.y);
            laser.rotation = mount.x < 0 ? Math.PI : 0;
            laser.addChild(
                hull === 'phoenix'
                    ? new Graphics()
                          .roundRect(-8, -5, laserBarrelLength(laserLevel) + 3, 10, 2)
                          .fill(S.engine)
                          .roundRect(3, -3, laserBarrelLength(laserLevel) - 5, 6, 1)
                          .fill(0x7b4242)
                          .rect(7, -1, 16, 2)
                          .fill(laserTint(laserLevel, true))
                    : new Graphics()
                          .roundRect(-5, -4, laserBarrelLength(laserLevel), 8, 3)
                          .fill(laserTint(laserLevel))
                          .stroke({ color: S.gunInset, width: 0.7 })
                          .roundRect(3, -1.5, laserBarrelLength(laserLevel) - 11, 3, 1)
                          .fill(S.visor)
                          .circle(0, 0, 4)
                          .fill(S.engine),
            );
            this.lasers.push(laser);
            this.addChild(laser);
        }
        const kit = modules.weapon ?? 'standard';
        const tint =
            kit === 'rail'
                ? HULL_PALETTES[hull].cargo
                : kit === 'pulse'
                  ? 0x8aaebb
                  : HULL_PALETTES[hull].panel;
        for (const emitter of [...this.guns, ...this.lasers]) {
            if (hull === 'mule') continue;
            emitter.addChild(new Graphics().roundRect(-4, -5, 7, 10, 2).fill(tint));
        }
        if (hull === 'widmo') {
            for (const side of [-1, 1])
                this.addChild(new Graphics().roundRect(-9, side * 9 - 2, 19, 4, 2).fill(tint));
        }
        for (const engine of config.engines)
            this.addChild(engineHousing(engine.x, engine.y, modules.engine));
        this.addChild(maneuveringJets(hull, modules.handling));
        this.addChild(
            shipHull(hull, modules),
            fittedEquipment(hull, modules),
            cargoEquipment(hull, modules.cargo),
        );
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
        if (this.rocketLauncher)
            this.rocketLauncher.rotation = aimAngle(this.rocketLauncher.position, local, 0);
    }
    updateArms(poses: readonly HarpoonArmPose[]) {
        drawHarpoonArms(
            this.harpoonView,
            poses,
            this.visualModules.handling,
            this.visualModules.drill,
        );
    }
    updateDrive(
        forward: boolean,
        reverse: boolean,
        fault: boolean,
        boost: boolean,
        time: number,
        turn = 0,
    ) {
        maneuveringFlame(this.maneuvering, this.hullId, this.visualModules.handling, turn, time);
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
        if (kind !== 'patrol' && kind !== 'lancer') {
            const hulls = {
                interceptor: [-25, -6, -12, -18, 1, -11, 32, 0, 1, 11, -12, 18, -25, 6],
                heavy: [
                    -37, -25, -24, -38, 15, -38, 34, -23, 38, 0, 34, 23, 15, 38, -24, 38, -37, 25,
                ],
                support: [
                    -27, -21, -9, -27, 9, -18, 24, -11, 24, 11, 9, 18, -9, 27, -27, 21, -17, 0,
                ],
                minelayer: [-31, -25, 10, -28, 29, -14, 31, 14, 10, 28, -31, 25, -20, 0],
            };
            const accent =
                kind === 'support'
                    ? 0xd6c38a
                    : kind === 'interceptor'
                      ? 0xd2988a
                      : kind === 'minelayer'
                        ? 0xd0a575
                        : 0xbda09a;
            this.flame
                .poly([-27, -6, -49, 0, -27, 6])
                .fill({ color: SHIP_COLORS.flame, alpha: 0.8 });
            this.addChild(this.flame);
            const guns = new Graphics();
            for (const offset of kind === 'heavy' ? [-17, 0, 17] : [0])
                guns.rect(17, offset - 3, kind === 'heavy' ? 29 : 19, 6).fill(SHIP_COLORS.gun);
            this.addChild(guns);
            const body = new Graphics();
            roundedPanel(body, hulls[kind], 3, kind === 'heavy' ? 0x5c5e62 : 0x59686e, 0xa4adb0);
            for (const side of [-1, 1]) {
                body.beginPath()
                    .rect(-20, side * (kind === 'heavy' ? 27 : 15) - 3, 20, 6)
                    .fill(accent);
                body.beginPath()
                    .rect(-28, side * 12 - 3, 7, 6)
                    .fill(SHIP_COLORS.engine);
            }
            if (kind === 'heavy') {
                roundedPanel(
                    body,
                    [-21, -23, 16, -23, 25, 0, 16, 23, -21, 23],
                    3,
                    0x7c7e7d,
                    0xafb1ab,
                );
                body.beginPath().rect(-11, -21, 7, 42).fill(0x494e54);
            }
            if (kind === 'support') {
                body.beginPath().rect(-3, -11, 6, 22).rect(-11, -3, 22, 6).fill(accent);
                body.beginPath().circle(20, -14, 4).circle(20, 14, 4).fill(0xc4d9db);
            }
            if (kind === 'minelayer')
                for (const side of [-1, 1])
                    for (let index = 0; index < 3; index++) {
                        const x = -22 + index * 10,
                            y = side * 19;
                        body.beginPath()
                            .poly([x - 4, y, x, y - 4, x + 4, y, x, y + 4])
                            .fill(0x373c43);
                    }
            if (kind !== 'support') visor(body, kind === 'heavy' ? 13 : 7, 0, 6, 5);
            this.addChild(body);
            return;
        }
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
        g.roundRect(-18, -9, 26, 18, 5).fill(0x414b55);
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
        ring = new Graphics();
    ring.circle(0, 0, 156)
        .stroke({ color: 0x273458, width: 32 })
        .circle(0, 0, 149)
        .stroke({ color: 0xd1d9e7, width: 18 })
        .circle(0, 0, 132)
        .stroke({ color: 0x748fb9, width: 5 });
    view.addChild(ring);
    for (let i = 0; i < 8; i++) {
        const arm = new Graphics(),
            a = (i * Math.PI) / 4;
        arm.roundRect(38, -8, 113, 16, 5)
            .fill(0x9eafc9)
            .roundRect(120, -26, 53, 52, 12)
            .fill(i < 3 + level ? 0xeac297 : 0xa5c3da)
            .roundRect(129, -15, 34, 30, 7)
            .fill(0x35456d)
            .roundRect(134, -10, 8, 20, 3)
            .fill(C.cyan)
            .roundRect(149, -10, 8, 20, 3)
            .fill(C.cyan);
        arm.rotation = a;
        view.addChild(arm);
        ring.beginPath()
            .arc(0, 0, 149, a + 0.15, a + 0.55)
            .stroke({ color: i % 2 ? C.coral : C.gold, width: 18 });
    }
    const hub = new Graphics()
        .circle(0, 0, 62)
        .fill(0xd2dbe8)
        .circle(0, 0, 47)
        .fill(0x536c99)
        .circle(0, 0, 34)
        .fill(0x78d4e6)
        .ellipse(-8, -10, 13, 8)
        .fill(0xe1f5ed);
    for (const side of [-1, 1]) hub.roundRect(180, side * 44 - 5, 66, 10, 5).fill(C.cyan);
    hub.roundRect(194, -33, 36, 66, 9).fill({ color: C.mint, alpha: 0.12 });
    view.addChild(hub);
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
    g.roundRect(-34, -24, 68, 48, 5).fill(0x7e8e94);
    for (const x of [-27, 17]) g.roundRect(x, -24, 10, 48, 2).fill(0x3e505b);
    g.roundRect(-14, -19, 28, 38, 4).fill(0xa69576);
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
    const g = new Graphics();
    // A broken survey craft, with readable bow, cockpit and detached engine.
    g.roundRect(-72, -26, 102, 52, 22).fill(0x34435e);
    g.roundRect(-66, -23, 81, 46, 18).fill(0x8e9db6);
    g.roundRect(-59, -17, 39, 34, 14).fill(0x536b8f);
    g.ellipse(-43, -2, 15, 12).fill(0x88cde1);
    g.ellipse(-47, -6, 5, 3).fill(0xd9eff2);
    g.roundRect(-18, -17, 28, 34, 8).fill(0x61728c);
    g.roundRect(-14, -11, 17, 5, 2).fill(0xa9b7c7);
    g.roundRect(-14, 1, 17, 5, 2).fill(0xa9b7c7);
    g.poly([12, -25, 31, -17, 18, -9, 30, 0, 14, 9, 24, 19, 10, 26]).fill(0x202c45);
    for (const y of [-36, 26]) {
        g.roundRect(-48, y, 52, 10, 5).fill(0x667e9d);
        g.roundRect(-40, y + 2, 24, 5, 2).fill(0xd9b982);
    }
    g.roundRect(47, -20, 40, 34, 10).fill(0x72859d);
    g.roundRect(67, -16, 14, 26, 5).fill(0x2e3d57);
    g.roundRect(49, -12, 10, 18, 4).fill(0xc4a781);
    for (const [x, y, r] of [
        [33, 29, 5],
        [46, -33, 4],
        [19, 42, 3],
        [91, 25, 3],
    ])
        g.circle(x, y, r).fill(0x697b94);
    view.addChild(g);
    return view;
}

export function surveySiteView(site: ScanSiteId) {
    const view = new Container(),
        g = new Graphics();
    if (site === 'relay') {
        g.roundRect(-35, -30, 70, 60, 14).fill(0x9cacc7);
        g.roundRect(-53, -4, 106, 8, 4).fill(C.cyan);
        for (const x of [-110, 50]) {
            g.roundRect(x, -35, 60, 70, 12).fill(0x426b96);
            for (let col = 0; col < 3; col++)
                for (let row = 0; row < 4; row++)
                    g.roundRect(x + 6 + col * 17, -29 + row * 15, 14, 12, 4).fill(0x729fc3);
        }
        g.circle(0, 0, 19).fill(C.ink);
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
        g.poly([0, -40, 38, -10, 24, 34, -25, 34, -38, -10]).fill(0x687681);
        g.circle(0, 0, 24).fill(C.ink);
        g.poly([0, -16, 16, 0, 0, 16, -16, 0]).fill({ color: C.cyan, alpha: 0.3 });
        g.rect(-4, -6, 8, 12).fill(C.gold);
    }
    // Glazed instruments and inset service panels share the fleet material language.
    if (site === 'relay') {
        visor(g, 0, 0, 16, 12);
        for (const y of [-21, 21]) g.roundRect(-27, y - 2, 18, 4, 1).fill(0xa1afb4);
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
    lunarRock(
        variant: number,
        rich: boolean,
        copper = false,
        contents: Readonly<ResourceStore> = {},
    ) {
        const key = `lunar:${variant}:${rich}:${copper}:${mineralMarkerKey(contents)}`;
        let context = this.rocks.get(key);
        if (!context) {
            const rng = random(variant * 163 + 71);
            const peakX = (rng() - 0.5) * 0.5,
                peakY = -0.48 - rng() * 0.3,
                left = -0.7 - rng() * 0.25,
                right = 0.7 + rng() * 0.25;
            context = new GraphicsContext()
                .ellipse(0.25, 0.35, 1.03, 0.46)
                .fill({ color: 0x505573, alpha: 0.38 })
                .poly([
                    left,
                    0.28,
                    left * 0.82,
                    -0.18,
                    peakX,
                    peakY,
                    right * 0.8,
                    -0.1,
                    right,
                    0.3,
                    0.1,
                    0.7,
                ])
                .fill(copper ? 0xa98c92 : 0x737994)
                .poly([left, 0.28, left * 0.82, -0.18, peakX, peakY, -0.08, 0.12, 0.1, 0.7])
                .fill(copper ? 0xd4ad9b : 0xbfc1d2)
                .poly([peakX, peakY, right * 0.8, -0.1, right, 0.3, -0.08, 0.12])
                .fill(copper ? 0xbe9690 : 0x989eb6);
            drawMineralMarkers(context, contents, variant, true);
            this.rocks.set(key, context);
        }
        return new Graphics(context);
    }
    rock(variant: number, rich: boolean, crystal = false, contents: Readonly<ResourceStore> = {}) {
        const key = `${variant}:${rich}:${crystal}:${mineralMarkerKey(contents)}`;
        let context = this.rocks.get(key);
        if (!context) {
            const rng = random(variant * 163 + 8),
                points: number[] = [];
            const n = 10 + Math.floor(rng() * 7),
                aspect = 0.74 + rng() * 0.3;
            const palettes = rich
                ? [0x947c92, 0x997d83, 0x8c829e, 0xa58c91]
                : [0x737d9d, 0x8087a5, 0x6c8195, 0x8a839d, 0x7085a6];
            const base = palettes[Math.floor(rng() * palettes.length)];
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2,
                    r = 0.69 + rng() * 0.29;
                points.push(Math.cos(a) * r, Math.sin(a) * r * aspect);
            }
            context = new GraphicsContext();
            for (let i = 0; i < n; i++) {
                const before = (i + n - 1) % n,
                    after = (i + 1) % n;
                const x = points[i * 2],
                    y = points[i * 2 + 1];
                const startX = x + (points[before * 2] - x) * 0.25;
                const startY = y + (points[before * 2 + 1] - y) * 0.25;
                if (i === 0) context.moveTo(startX, startY);
                else context.lineTo(startX, startY);
                context.quadraticCurveTo(
                    x,
                    y,
                    x + (points[after * 2] - x) * 0.25,
                    y + (points[after * 2 + 1] - y) * 0.25,
                );
            }
            context.closePath().fill(base);
            // Broad flat craters keep small rocks legible without a fan of fine facets.
            for (let i = 0; i < 3; i++) {
                const x = (rng() - 0.5) * 0.8,
                    y = (rng() - 0.5) * 0.7;
                const r = 0.07 + rng() * 0.1;
                context
                    .ellipse(x + 0.02, y + 0.025, r, r * 0.75)
                    .fill({ color: 0xc2c7d9, alpha: 0.4 })
                    .ellipse(x, y, r, r * 0.75)
                    .fill({ color: 0x414d74, alpha: 0.65 });
            }
            drawMineralMarkers(context, contents, variant);
            this.rocks.set(key, context);
        }
        return new Graphics(context);
    }
    dispose() {
        for (const context of this.rocks.values()) context.destroy();
        this.rocks.clear();
    }
}
