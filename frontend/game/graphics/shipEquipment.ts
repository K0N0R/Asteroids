import { Container, Graphics } from 'pixi.js';
import { fittedArmor } from './hullArmor';
import type { HullId, Mount } from '../config';
import type { ShipModules } from '../state/campaign';
import { HULL_PALETTES, engineHousing, drawTank, roundedPanel } from './shipHull';

// Fitted sockets are local to each silhouette, rather than a universal strip on the deck.
export const EQUIPMENT_SOCKETS: Record<HullId, { jets: Mount[] }> = {
    prospector: {
        jets: [
            { x: 0, y: 20 },
            { x: -15, y: 17 },
            { x: 12, y: 16 },
        ],
    },
    swift: {
        jets: [
            { x: -18, y: 24 },
            { x: 3, y: 16 },
            { x: -29, y: 19 },
        ],
    },
    mule: {
        jets: [
            { x: 29, y: 31 },
            { x: 4, y: 13 },
            { x: -21, y: 12 },
        ],
    },
    fighter: {
        jets: [
            { x: 0, y: 23 },
            { x: -15, y: 16 },
            { x: 17, y: 10 },
        ],
    },
    tug: {
        jets: [
            { x: 11, y: 39 },
            { x: 27, y: 30 },
            { x: -5, y: 16 },
        ],
    },
    falcon: {
        jets: [
            { x: -6, y: 32 },
            { x: -23, y: 25 },
            { x: 22, y: 24 },
        ],
    },
    widmo: {
        jets: [],
    },
    atlas: {
        jets: [],
    },
    harpoon: {
        jets: [],
    },
    aegis: {
        jets: [],
    },
    stinger: {
        jets: [
            { x: -22, y: 43 },
            { x: 17, y: 40 },
            { x: -29, y: 30 },
        ],
    },
    phoenix: {
        jets: [],
    },
    raider: {
        jets: [
            { x: -12, y: 27 },
            { x: 14, y: 23 },
            { x: -29, y: 18 },
        ],
    },
    lancer: {
        jets: [
            { x: -12, y: 27 },
            { x: 14, y: 23 },
            { x: -29, y: 18 },
        ],
    },
};

export const laserTint = (level: number, combat = false) =>
    (combat ? [0xd98a76, 0xe1976b, 0xe7ad73, 0xf2c58f] : [0x93c9db, 0x80b9e2, 0xa4afe9, 0xc5b1ee])[
        Math.min(3, level)
    ];
export const laserBarrelLength = (level: number) => 24 + level * 5;

export function laserUpgradeLevel(hull: HullId, level: number) {
    return ['prospector', 'swift', 'mule', 'tug', 'falcon', 'phoenix'].includes(hull) ? level : 0;
}

type CargoSegment = {
    x: number;
    y: number;
    w: number;
    h: number;
    angle?: number;
    underbody?: boolean;
};
// Local +X points towards the bow. Segments follow the existing cargo bays,
// leaving the cockpit, weapon sockets and main engine exhausts clear.
const CARGO_EXTENSIONS: Record<HullId, CargoSegment[]> = {
    prospector: [
        { x: -19, y: -15, w: 13, h: 5 },
        { x: -19, y: 15, w: 13, h: 5 },
        { x: -30, y: 0, w: 7, h: 17 },
    ],
    swift: [
        { x: -7, y: 0, w: 6, h: 13 },
        { x: -16, y: 0, w: 7, h: 15 },
        { x: -26, y: 0, w: 8, h: 17 },
    ],
    mule: [
        { x: -28, y: -30, w: 14, h: 20, underbody: true },
        { x: -28, y: 30, w: 14, h: 20, underbody: true },
        { x: -35, y: 0, w: 11, h: 21 },
    ],
    fighter: [
        { x: -18, y: -7, w: 13, h: 6 },
        { x: -18, y: 7, w: 13, h: 6 },
        { x: -19, y: 0, w: 15, h: 6 },
    ],
    tug: [
        { x: -22, y: -22, w: 9, h: 18 },
        { x: -22, y: 22, w: 9, h: 18 },
        { x: -29, y: 0, w: 8, h: 21 },
    ],
    falcon: [
        { x: -21, y: -15, w: 15, h: 7, angle: 0.55 },
        { x: -21, y: 15, w: 15, h: 7, angle: -0.55 },
        { x: -11, y: 0, w: 6, h: 17 },
    ],
    widmo: [
        { x: 13, y: -10, w: 12, h: 5, angle: -0.35 },
        { x: 13, y: 10, w: 12, h: 5, angle: 0.35 },
        { x: 14, y: 0, w: 5, h: 12 },
    ],
    atlas: [
        { x: 1, y: -27, w: 10, h: 20 },
        { x: 1, y: 27, w: 10, h: 20 },
        { x: -37, y: 0, w: 10, h: 24 },
    ],
    harpoon: [
        { x: -16, y: 0, w: 7, h: 20 },
        { x: -25, y: 0, w: 7, h: 16 },
        { x: -33, y: 0, w: 6, h: 12 },
    ],
    aegis: [
        { x: -25, y: -13, w: 12, h: 6 },
        { x: -25, y: 13, w: 12, h: 6 },
        { x: -33, y: 0, w: 7, h: 19 },
    ],
    stinger: [
        { x: -15, y: 0, w: 6, h: 12 },
        { x: -23, y: 0, w: 7, h: 13 },
        { x: -31, y: 0, w: 8, h: 15 },
    ],
    phoenix: [
        { x: 27, y: 0, w: 6, h: 10 },
        { x: 35, y: 0, w: 7, h: 12 },
        { x: 43, y: 0, w: 7, h: 14 },
    ],
    raider: [
        { x: -22, y: -13, w: 12, h: 6 },
        { x: -22, y: 13, w: 12, h: 6 },
        { x: -28, y: 0, w: 8, h: 16 },
    ],
    lancer: [
        { x: -22, y: -13, w: 12, h: 6 },
        { x: -22, y: 13, w: 12, h: 6 },
        { x: -28, y: 0, w: 8, h: 16 },
    ],
};

export function cargoEquipment(hull: HullId, level: number, underbody = false) {
    const g = new Graphics();
    if (level <= 0) return g;
    const growth = 0.8 + Math.min(3, level) * 0.08;
    for (const segment of CARGO_EXTENSIONS[hull].slice(0, level)) {
        if ((segment.underbody ?? hull === 'tug') !== underbody) continue;
        const w = segment.w * growth,
            h = segment.h * growth;
        g.context.save();
        g.context.translate(segment.x, segment.y);
        if (segment.angle) g.context.rotate(segment.angle);
        drawTank(g, -w / 2, -h / 2, w, h, HULL_PALETTES[hull].cargo);
        g.context.restore();
    }
    return g;
}

export function fittedEquipment(hull: HullId, modules: ShipModules) {
    return fittedArmor(hull, modules);
}

export function outerArmor(hull: HullId, level: number) {
    const g = new Graphics();
    if (hull === 'harpoon' && level > 0) {
        const palette = HULL_PALETTES.harpoon;
        const extension = level === 3 ? 2 : 0;
        roundedPanel(
            g,
            [36, -10, 43, -14, 48 + extension, -10, 48 + extension, 10, 43, 14, 36, 10],
            2.5,
            palette.panel,
            palette.edge,
        );
        g.moveTo(44 + extension, -8)
            .lineTo(44 + extension, 8)
            .stroke({ color: 0xb3bfc0, width: 1.4 });
        if (level >= 2)
            for (const side of [-1, 1]) {
                roundedPanel(
                    g,
                    [
                        24,
                        side * 16,
                        31,
                        side * 12,
                        41,
                        side * 15,
                        43 + extension,
                        side * 22,
                        34,
                        side * (26 + extension),
                        23,
                        side * 24,
                    ],
                    2.5,
                    palette.hull,
                    palette.edge,
                );
                g.moveTo(29, side * 22)
                    .lineTo(35, side * (23 + extension))
                    .lineTo(40 + extension, side * 20)
                    .stroke({ color: 0xadbfc1, width: 1.2 });
                g.circle(27, side * 19, 1.3).fill(0x293d43);
            }
        return g;
    }
    if (hull !== 'aegis' || !level) return g;
    const palette = HULL_PALETTES.aegis;
    for (const side of [-1, 1]) {
        for (const end of level >= 2 ? [-1, 1] : [1]) {
            const points = [8, 34, 25, 31, 34, 22, 39, 26, 31, 39, 12, 45 + level];
            const plate = points.map((value, i) => value * (i % 2 ? side : end));
            roundedPanel(g, plate, 2.5, 0x516b7d, palette.edge);
            g.moveTo(end * 13, side * (42 + level))
                .lineTo(end * 28, side * 37)
                .stroke({ color: 0x849eae, width: 1.3 });
            g.circle(end * 31, side * 28, 1.4).fill(0x253944);
        }
        if (level >= 3) {
            roundedPanel(
                g,
                [
                    -7,
                    side * 36,
                    -9,
                    side * 44,
                    -5,
                    side * 48,
                    5,
                    side * 48,
                    9,
                    side * 44,
                    7,
                    side * 36,
                ],
                2,
                0x6e8390,
                palette.edge,
            );
            g.roundRect(-3, side * 44 - 1, 6, 2, 0.6).fill(0x354e60);
        }
    }
    return g;
}

export function aegisCannon(level: number) {
    const g = new Graphics();
    g.circle(0, 0, 7).fill(0x293d49).stroke({ color: 0x93aab6, width: 1 });
    roundedPanel(g, [-5, -6, 10, -7, 17, -4, 17, 4, 10, 7, -5, 6], 2, 0x7d939f, 0xb5c9d0);
    g.roundRect(10, -3, 20, 6, 1.5).fill(0x354e60).stroke({ color: 0x8daab9, width: 0.8 });
    g.roundRect(12, -1, 16, 2, 0.6).fill(0xb1e2f1);
    g.roundRect(27, -4, 5, 8, 1.2).fill(0x758d9b).stroke({ color: 0xb5c9d0, width: 0.7 });
    for (let i = 0; i < level; i++)
        for (const side of [-1, 1]) {
            g.roundRect(1 + i * 5, side * 6 - 1.5, 3, 3, 0.7)
                .fill(0x354e60)
                .stroke({ color: 0xa8cad8, width: 0.6 });
            g.rect(2 + i * 5, side * 6 - 0.6, 1, 1.2).fill(0xb5e8f4);
        }
    return g;
}

export function maneuveringJets(hull: HullId, level: number) {
    const root = new Container();
    for (const point of EQUIPMENT_SOCKETS[hull].jets.slice(0, level))
        for (const side of [-1, 1]) {
            const engine = engineHousing(0, 0);
            engine.scale.set(0.3);
            engine.rotation = (-side * Math.PI) / 2;
            engine.position.set(point.x, side * point.y);
            root.addChild(engine);
        }
    return root;
}

export function maneuveringFlame(
    g: Graphics,
    hull: HullId,
    level: number,
    turn: number,
    time: number,
) {
    g.clear();
    if (Math.abs(turn) < 0.1) return;
    const side = turn > 0 ? -1 : 1;
    for (const point of EQUIPMENT_SOCKETS[hull].jets.slice(0, level)) {
        const y = side * point.y,
            length = 8 + level * 2 + Math.sin(time * 40) * 2;
        g.poly([
            point.x - 2,
            y + side * 3,
            point.x,
            y + side * length,
            point.x + 2,
            y + side * 3,
        ]).fill({ color: 0x8fc9ed, alpha: 0.75 });
        g.poly([
            point.x - 1,
            y + side * 3,
            point.x,
            y + side * length * 0.7,
            point.x + 1,
            y + side * 3,
        ]).fill(0xd8f0ff);
    }
}
