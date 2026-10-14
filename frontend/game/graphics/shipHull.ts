import { Graphics } from 'pixi.js';
import type { HullId } from '../config';
import type { ShipModules } from '../state/campaign';

export const SHIP_COLORS = {
    hull: 0x657782,
    visor: 0x9ccfe3,
    gun: 0xaebac1,
    gunInset: 0x71838d,
    cargo: 0xa28e6b,
    engine: 0x293640,
    flame: 0x91c7e7,
    reinforcement: 0x8898a1,
    laser: 0x728e97,
} as const;
export const HULL_PALETTES = {
    prospector: { hull: 0x727d83, panel: 0x89959a, edge: 0xa2afb3, cargo: 0xa08e73 },
    swift: { hull: 0x354a55, panel: 0x596b76, edge: 0x9bb5bd, cargo: 0x657b83 },
    mule: { hull: 0x6d7568, panel: 0x8d9585, edge: 0xaab09e, cargo: 0xa28f67 },
    fighter: { hull: 0x4e5d70, panel: 0x6c7c8e, edge: 0x91a0ad, cargo: 0x887c6b },
    tug: { hull: 0x526f70, panel: 0x72918d, edge: 0x9ab2ac, cargo: 0x9e8970 },
    falcon: { hull: 0x7e7a72, panel: 0x98978f, edge: 0xb8b7a9, cargo: 0x918169 },
    atlas: { hull: 0x72766e, panel: 0x949c8d, edge: 0xb7c0ad, cargo: 0xad8f55 },
    harpoon: { hull: 0x586e79, panel: 0x7d959b, edge: 0xacc4c5, cargo: 0xaf8b4e },
    aegis: { hull: 0x788b98, panel: 0xa8b9c2, edge: 0xc8d8de, cargo: 0x749baf },
    stinger: { hull: 0x596462, panel: 0x85918a, edge: 0xb7c4b6, cargo: 0xc7b955 },
} as const satisfies Record<HullId, { hull: number; panel: number; edge: number; cargo: number }>;
const S = SHIP_COLORS;

// Trim each corner and join it with a quadratic curve, preserving the silhouette.
export function roundedPanel(
    g: Graphics,
    points: number[],
    radius = 3,
    color: number = S.hull,
    edge: number = S.reinforcement,
) {
    const n = points.length / 2;
    g.beginPath();
    for (let i = 0; i < n; i++) {
        const x = points[i * 2],
            y = points[i * 2 + 1];
        const before = (i + n - 1) % n,
            after = (i + 1) % n;
        const dx = points[before * 2] - x,
            dy = points[before * 2 + 1] - y;
        const ex = points[after * 2] - x,
            ey = points[after * 2 + 1] - y;
        const a = Math.hypot(dx, dy),
            b = Math.hypot(ex, ey);
        const r = Math.min(radius, a * 0.4, b * 0.4);
        const ix = x + (dx / a) * r,
            iy = y + (dy / a) * r;
        if (i === 0) g.moveTo(ix, iy);
        else g.lineTo(ix, iy);
        g.quadraticCurveTo(x, y, x + (ex / b) * r, y + (ey / b) * r);
    }
    g.closePath().fill(color).stroke({ color: edge, width: 1.2 });
}
export function visor(g: Graphics, x: number, y: number, rx: number, ry: number) {
    g.ellipse(x - 1, y + 1, rx + 2.5, ry + 2.5).fill(S.engine);
    g.ellipse(x, y, rx + 1, ry + 1).fill(S.reinforcement);
    g.ellipse(x, y, rx, ry).fill(0x639cbb).stroke({ color: 0xc3e0ee, width: 0.8 });
    g.ellipse(x + rx * 0.12, y - ry * 0.05, rx * 0.83, ry * 0.85).fill({
        color: S.visor,
        alpha: 0.72,
    });
    g.ellipse(x + rx * 0.3, y - ry * 0.13, rx * 0.6, ry * 0.68).fill({
        color: 0xd5edff,
        alpha: 0.3,
    });
    g.circle(x + rx * 0.22, y - ry * 0.34, Math.min(rx, ry) * 0.22).fill({
        color: 0xffffff,
        alpha: 0.75,
    });
    g.circle(x - rx * 0.34, y + ry * 0.2, Math.min(rx, ry) * 0.13).fill({
        color: 0xffffff,
        alpha: 0.5,
    });
    g.circle(x + rx * 0.48, y + ry * 0.4, Math.min(rx, ry) * 0.09).fill({
        color: 0xffffff,
        alpha: 0.48,
    });
}
function seam(g: Graphics, points: number[], width = 1.4) {
    g.beginPath().moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]);
    g.stroke({ color: 0x333b40, width });
}
function drawTank(
    g: Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number = S.cargo,
) {
    g.roundRect(x - 1, y + 1, w + 2, h + 2, 7).fill(S.engine);
    g.roundRect(x, y, w, h, 6).fill(color).stroke({ color: 0xb5ad98, width: 1 });
    g.roundRect(x + 3, y + 3, w - 6, h * 0.25, 3).fill({ color: 0xe3dbbf, alpha: 0.18 });
    for (const t of [0.28, 0.72])
        g.rect(x + w * t, y + 1, 2, h - 2).fill({ color: S.engine, alpha: 0.36 });
}
export function shipUnderbody(hull: HullId) {
    const g = new Graphics();
    const tank = (target: Graphics, x: number, y: number, w: number, h: number) =>
        drawTank(target, x, y, w, h, HULL_PALETTES[hull].cargo);
    if (hull === 'tug') {
        // Rounded tanks protrude beneath the swept wings; the hull hides their inner edges.
        tank(g, -16, -31, 36, 19);
        tank(g, -16, 12, 36, 19);
    } else if (hull === 'mule') {
        tank(g, -25, -38, 47, 21);
        tank(g, -25, 17, 47, 21);
    } else if (hull === 'atlas') {
        for (const side of [-1, 1])
            for (const x of [-33, 8]) tank(g, x, side < 0 ? -38 : 17, 27, 21);
    }
    return g;
}
export function engineHousing(x: number, y: number) {
    const g = new Graphics();
    roundedPanel(g, [x - 13, y - 10, x + 9, y - 6, x + 9, y + 6, x - 13, y + 10], 1.6, S.engine);
    g.roundRect(x - 14, y - 7, 4, 14, 1).fill(0x20272b);
    g.moveTo(x - 8, y - 6)
        .lineTo(x + 4, y - 3)
        .moveTo(x - 8, y + 6)
        .lineTo(x + 4, y + 3)
        .stroke({ color: 0x59636b, width: 1 });
    g.circle(x + 5, y, 1.5).fill(S.reinforcement);
    return g;
}
export function shipHull(hull: HullId, modules: ShipModules) {
    const g = new Graphics();
    const palette = HULL_PALETTES[hull];
    const S = {
        ...SHIP_COLORS,
        hull: palette.hull,
        reinforcement: palette.edge,
        cargo: palette.cargo,
    };
    const roundedHull = (
        target: Graphics,
        points: number[],
        radius = 3,
        color: number = palette.hull,
    ) => roundedPanel(target, points, radius, color, palette.edge);
    const tank = (target: Graphics, x: number, y: number, w: number, h: number) =>
        drawTank(target, x, y, w, h, palette.cargo);
    if (hull === 'prospector') {
        g.ellipse(0, 0, 37, 22).fill(S.hull).stroke({ color: S.reinforcement, width: 1.4 });
        g.ellipse(2, -1, 32, 18).fill(palette.panel);
        tank(g, -26, -12, 14, 24);
        seam(g, [-5, -19, 8, -15, 13, 0, 8, 15, -5, 19]);
        g.roundRect(-7, -8, 8, 16, 3).fill(S.engine);
        visor(g, 17, 0, 12, 14);
    } else if (hull === 'swift') {
        for (const side of [-1, 1]) {
            g.beginPath()
                .moveTo(36, side * 24)
                .bezierCurveTo(19, side * 38, -5, side * 42, -25, side * 35)
                .lineTo(-34, side * 28)
                .quadraticCurveTo(-12, side * 34, -8, side * 24)
                .lineTo(-12, side * 8)
                .lineTo(4, side * 7)
                .quadraticCurveTo(19, side * 16, 36, side * 24)
                .closePath()
                .fill(palette.hull)
                .stroke({ color: palette.edge, width: 1.3 });
            roundedPanel(
                g,
                [25, side * 27, 8, side * 35, -13, side * 35, -8, side * 27, 4, side * 22],
                2,
                palette.panel,
                palette.panel,
            );
        }
        roundedHull(
            g,
            [
                -47, 0, -29, -5, -16, -12, 4, -10, 26, -6, 44, -3, 44, 3, 26, 6, 4, 10, -16, 12,
                -29, 5,
            ],
            1.6,
        );
        roundedHull(g, [-33, 0, -19, -8, 3, -7, 30, 0, 3, 7, -19, 8], 2, palette.panel);
        g.poly([4, -2.5, 9, 0, 4, 2.5]).fill(0x8ae6e0);
        visor(g, -13, 0, 11, 7);
    } else if (hull === 'stinger') {
        for (const side of [-1, 1]) {
            roundedHull(
                g,
                [
                    -25,
                    side * 9,
                    -32,
                    side * 46,
                    -17,
                    side * 46,
                    -6,
                    side * 30,
                    12,
                    side * 44,
                    25,
                    side * 40,
                    7,
                    side * 12,
                ],
                1.5,
            );
            roundedPanel(
                g,
                [
                    -23,
                    side * 16,
                    -28,
                    side * 41,
                    -20,
                    side * 41,
                    -7,
                    side * 25,
                    15,
                    side * 40,
                    20,
                    side * 37,
                    3,
                    side * 15,
                ],
                1,
                palette.panel,
                palette.panel,
            );
            g.beginPath()
                .poly([-17, side * 18, -10, side * 25, 13, side * 40, 16, side * 38, -8, side * 21])
                .fill(palette.cargo);
        }
        roundedHull(g, [-36, -7, -15, -12, 17, -7, 43, 0, 17, 7, -15, 12, -36, 7], 2);
        roundedHull(g, [-26, -5, -10, -8, 21, 0, -10, 8, -26, 5], 2, palette.panel);
        visor(g, 4, 0, 14, 7);
    } else if (hull === 'mule') {
        // Broad forward crossbar and a narrower rear spine read as a T from above.
        roundedHull(g, [-36, -12, 15, -12, 22, -32, 39, -32, 39, 32, 22, 32, 15, 12, -36, 12], 4);
        g.roundRect(-30, -7, 59, 14, 4).fill(palette.panel);
        g.roundRect(-24, -3, 43, 6, 2).fill(S.engine);
        seam(g, [25, -28, 31, -18, 31, 18, 25, 28], 2);
        for (const y of [-24, 24]) {
            g.roundRect(24, y - 4, 10, 8, 2).fill(S.engine);
            g.rect(27, y - 2, 4, 4).fill(S.reinforcement);
        }
        visor(g, 34, 0, 12, 16);
    } else if (hull === 'fighter') {
        roundedHull(
            g,
            [-22, -10, -8, -25, 8, -22, 20, -9, 34, 0, 20, 9, 8, 22, -8, 25, -22, 10],
            3.5,
        );
        roundedHull(g, [-18, -10, 12, -10, 28, 0, 12, 10, -18, 10], 4, palette.panel);
        tank(g, -18, -19, 13, 7);
        tank(g, -18, 12, 13, 7);
        seam(g, [-5, -20, 10, -17, 18, -10]);
        seam(g, [-5, 20, 10, 17, 18, 10]);
        visor(g, 12, 0, 14, 9);
    } else if (hull === 'tug') {
        roundedHull(
            g,
            [-40, 0, -6, -17, 10, -42, 28, -34, 38, -19, 42, 0, 38, 19, 28, 34, 10, 42, -6, 17],
            6,
        );
        roundedHull(g, [9, -29, 28, -18, 35, 0, 28, 18, 9, 29, 0, 0], 6, palette.panel);
        seam(g, [-29, 0, -1, -13, 9, -31]);
        seam(g, [-29, 0, -1, 13, 9, 31]);
        visor(g, 20, 0, 12, 18);
    } else if (hull === 'atlas') {
        roundedHull(g, [-43, -14, 25, -14, 43, -9, 43, 9, 25, 14, -43, 14], 4);
        g.roundRect(-35, -9, 57, 18, 3).fill(palette.panel);
        for (const side of [-1, 1]) {
            g.roundRect(-5, side < 0 ? -37 : 15, 11, 22, 2)
                .fill(S.hull)
                .stroke({ color: palette.edge, width: 1 });
            for (const x of [-22, 21]) {
                g.roundRect(x, side < 0 ? -41 : 35, 11, 5, 1).fill(S.engine);
                g.roundRect(x + 2, side < 0 ? -40 : 36, 7, 2, 1).fill(S.reinforcement);
            }
        }
        tank(g, 31, -7, 12, 14);
        for (const side of [-1, 1]) {
            g.roundRect(28, side * 12 - 4, 18, 8, 2)
                .fill(S.engine)
                .stroke({ color: palette.edge, width: 1 });
            g.circle(43, side * 12, 2.5).fill(0xb99052);
        }
        seam(g, [-32, -6, -11, -6, -11, 6, -32, 6], 2);
        visor(g, 10, 0, 18, 9);
    } else if (hull === 'aegis') {
        g.ellipse(0, 0, 42, 39).fill(S.engine).stroke({ color: palette.edge, width: 1.5 });
        for (const side of [-1, 1]) {
            roundedHull(
                g,
                [
                    -31,
                    side * 13,
                    -36,
                    side * 25,
                    -20,
                    side * 39,
                    20,
                    side * 39,
                    36,
                    side * 25,
                    31,
                    side * 13,
                ],
                4,
            );
            roundedHull(
                g,
                [
                    -23,
                    side * 19,
                    -28,
                    side * 28,
                    -12,
                    side * 35,
                    29,
                    side * 28,
                    35,
                    side * 12,
                    18,
                    side * 15,
                ],
                3,
                palette.panel,
            );
            roundedHull(
                g,
                [
                    -27,
                    side * 23,
                    -17,
                    side * 34,
                    -2,
                    side * 31,
                    23,
                    side * 25,
                    25,
                    side * 19,
                    6,
                    side * 22,
                ],
                2,
                0x497c9c,
            );
            g.circle(0, side * 30, 7)
                .fill(S.engine)
                .stroke({ color: palette.edge, width: 1.3 });
            visor(g, 0, side * 30, 4, 4);
            g.roundRect(2, side * 43 - 1.5, 12, 3, 1).fill(0x79d6f1);
            for (const x of [-29, 29]) g.circle(x, side * 23, 1.5).fill(S.engine);
        }
        roundedHull(
            g,
            [-39, -10, -23, -14, 21, -12, 38, -7, 42, 0, 38, 7, 21, 12, -23, 14, -39, 10],
            4,
            palette.panel,
        );
        roundedHull(g, [-32, -9, 26, -8, 35, 0, 26, 8, -32, 9], 3);
        g.roundRect(-30, -6, 17, 12, 2).fill(palette.edge).stroke({ color: S.engine, width: 1 });
        for (const x of [-27, -23, -19]) g.rect(x, -4, 2, 8).fill(S.engine);
        visor(g, 12, 0, 13, 8);
        g.rect(34, -3, 9, 6).fill(S.engine);
        g.rect(37, -1, 8, 2).fill(0x91e0f7);
    } else if (hull === 'harpoon') {
        roundedHull(
            g,
            [-35, -8, -12, -12, -4, -18, 27, -18, 35, -9, 35, 9, 27, 18, -4, 18, -12, 12, -35, 8],
            3,
        );
        tank(g, 28, -6, 12, 12);
        tank(g, -12, -16, 13, 32);
        g.roundRect(-31, -5, 18, 10, 2).fill(palette.panel);
        for (const side of [-1, 1]) {
            g.roundRect(2, side * 18 - 5, 12, 10, 2)
                .fill(palette.panel)
                .stroke({ color: palette.edge, width: 1 });
            g.circle(8, side * 18, 4)
                .fill(S.engine)
                .stroke({ color: S.cargo, width: 1.5 });
        }
        g.circle(11, 0, 17).fill(palette.panel).stroke({ color: S.engine, width: 2 });
        visor(g, 11, 0, 13, 13);
    } else {
        g.ellipse(-5, 0, 34, 34).fill(S.hull).stroke({ color: S.reinforcement, width: 1.8 });
        g.ellipse(-5, 0, 29, 29).fill(palette.panel);
        roundedHull(g, [10, -28, 44, -17, 44, -8, 17, -7, 17, 7, 44, 8, 44, 17, 10, 28], 3);
        roundedHull(g, [-29, -19, -36, 0, -29, 19, -12, 16, -12, -16], 5, S.cargo);
        seam(g, [-25, -24, 7, 0, -25, 24], 3);
        g.circle(2, 0, 9).fill(S.reinforcement).stroke({ color: S.engine, width: 1 });
        visor(g, 10, -27, 10, 6);
    }
    if (hull !== 'swift') {
        // Recessed exhaust vents and a raised service cover give the aft deck more depth.
        for (let i = 0; i < 3; i++)
            g.roundRect(-26 + i * 4, -4, 2, 8, 0.8).fill({ color: S.engine, alpha: 0.65 });
        g.roundRect(-8, -4, 7, 8, 2)
            .fill(S.hull)
            .stroke({ color: palette.edge, width: 0.5, alpha: 0.55 });
        // Small inspection plates and fasteners add detail without a texture atlas.
        for (const y of [-1, 1]) {
            g.circle(-9, y * 11, 1.5).fill(0xa0a6aa);
            g.roundRect(-19, y * 8 - 1, 7, 2, 1).fill(S.engine);
        }
        for (let i = 0; i < modules.cargo; i++)
            g.roundRect(-21 + i * 9, -7, 6, 14, 2).fill(S.cargo);
        if (modules.armor)
            g.beginPath()
                .arc(0, 0, 28, Math.PI * 0.65, Math.PI * 1.35)
                .stroke({ color: S.reinforcement, width: 2 + modules.armor });
    }
    return g;
}
