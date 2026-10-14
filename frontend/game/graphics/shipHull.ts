import { Graphics } from 'pixi.js';
import type { HullId } from '../config';
import type { ShipModules } from '../state/campaign';

export const SHIP_COLORS = {
    hull: 0x4c545b,
    visor: 0x22dd7b,
    gun: 0xffffff,
    gunInset: 0xc3c3c3,
    cargo: 0xca9229,
    engine: 0x33373a,
    flame: 0x465aca,
    reinforcement: 0x737373,
    laser: 0x2ddecb,
} as const;
const S = SHIP_COLORS;

// Trim each corner and join it with a quadratic curve, preserving the silhouette.
function roundedHull(g: Graphics, points: number[], radius = 3, color: number = S.hull) {
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
    g.closePath().fill(color).stroke({ color: S.reinforcement, width: 1.2 });
}
function visor(g: Graphics, x: number, y: number, rx: number, ry: number) {
    g.ellipse(x - 1, y + 1, rx + 2.5, ry + 2.5).fill(S.engine);
    g.ellipse(x, y, rx + 1, ry + 1).fill(S.reinforcement);
    g.ellipse(x, y, rx, ry).fill(0x123e39).stroke({ color: 0x88b4ac, width: 0.8 });
    g.ellipse(x + rx * 0.12, y - ry * 0.05, rx * 0.83, ry * 0.85).fill({
        color: S.visor,
        alpha: 0.34,
    });
    g.ellipse(x + rx * 0.3, y - ry * 0.13, rx * 0.6, ry * 0.68).fill({
        color: 0xa5ffdf,
        alpha: 0.12,
    });
    g.circle(x + rx * 0.22, y - ry * 0.34, Math.min(rx, ry) * 0.3).fill({
        color: 0xffffff,
        alpha: 0.85,
    });
    g.circle(x - rx * 0.34, y + ry * 0.2, Math.min(rx, ry) * 0.18).fill({
        color: 0xffffff,
        alpha: 0.65,
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
function tank(g: Graphics, x: number, y: number, w: number, h: number) {
    g.roundRect(x - 1, y + 1, w + 2, h + 2, 7).fill(S.engine);
    g.roundRect(x, y, w, h, 6).fill(S.cargo).stroke({ color: 0xe6b04f, width: 1 });
    g.roundRect(x + 3, y + 3, w - 6, h * 0.25, 3).fill({ color: 0xffd37c, alpha: 0.28 });
    for (const t of [0.28, 0.72])
        g.rect(x + w * t, y + 1, 2, h - 2).fill({ color: S.engine, alpha: 0.65 });
}
export function shipUnderbody(hull: HullId) {
    const g = new Graphics();
    if (hull === 'tug') {
        // Rounded tanks protrude beneath the swept wings; the hull hides their inner edges.
        tank(g, -16, -31, 36, 19);
        tank(g, -16, 12, 36, 19);
    } else if (hull === 'mule') {
        tank(g, -25, -38, 47, 21);
        tank(g, -25, 17, 47, 21);
    }
    return g;
}
export function engineHousing(x: number, y: number) {
    const g = new Graphics();
    roundedHull(g, [x - 13, y - 10, x + 9, y - 6, x + 9, y + 6, x - 13, y + 10], 1.6, S.engine);
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
    if (hull === 'prospector') {
        g.ellipse(0, 0, 37, 22).fill(S.hull).stroke({ color: S.reinforcement, width: 1.4 });
        g.ellipse(2, -1, 32, 18).fill(0x535e66);
        tank(g, -26, -12, 14, 24);
        seam(g, [-5, -19, 8, -15, 13, 0, 8, 15, -5, 19]);
        g.roundRect(-7, -8, 8, 16, 3).fill(S.engine);
        visor(g, 17, 0, 12, 14);
    } else if (hull === 'swift') {
        roundedHull(g, [-24, -12, -32, -35, 15, -17, 43, 0, 15, 17, -32, 35, -24, 12], 2.4);
        roundedHull(g, [-29, -14, -9, -17, 45, 0, -9, 17, -29, 14, -23, 0], 4, 0x535e66);
        seam(g, [-24, -25, 15, -12, 34, 0, 15, 12, -24, 25], 2);
        tank(g, -27, -9, 9, 18);
        g.roundRect(-16, -6, 9, 12, 3).fill(S.engine);
        visor(g, 8, 0, 16, 10);
    } else if (hull === 'mule') {
        // Broad forward crossbar and a narrower rear spine read as a T from above.
        roundedHull(g, [-36, -12, 15, -12, 22, -32, 39, -32, 39, 32, 22, 32, 15, 12, -36, 12], 4);
        g.roundRect(-30, -7, 59, 14, 4).fill(0x657078);
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
        roundedHull(g, [-18, -10, 12, -10, 28, 0, 12, 10, -18, 10], 4, 0x657078);
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
        roundedHull(g, [9, -29, 28, -18, 35, 0, 28, 18, 9, 29, 0, 0], 6, 0x657078);
        seam(g, [-29, 0, -1, -13, 9, -31]);
        seam(g, [-29, 0, -1, 13, 9, 31]);
        visor(g, 20, 0, 12, 18);
    } else {
        g.ellipse(-5, 0, 34, 34).fill(S.hull).stroke({ color: S.reinforcement, width: 1.8 });
        g.ellipse(-5, 0, 29, 29).fill(0x535e66);
        roundedHull(g, [10, -28, 44, -17, 44, -8, 17, -7, 17, 7, 44, 8, 44, 17, 10, 28], 3);
        roundedHull(g, [-29, -19, -36, 0, -29, 19, -12, 16, -12, -16], 5, S.cargo);
        seam(g, [-25, -24, 7, 0, -25, 24], 3);
        g.circle(2, 0, 9).fill(S.reinforcement).stroke({ color: S.engine, width: 1 });
        visor(g, 10, -27, 10, 6);
    }
    // Small inspection plates and fasteners add detail without a texture atlas.
    for (const y of [-1, 1]) {
        g.circle(-9, y * 11, 1.5).fill(0xa0a6aa);
        g.roundRect(-19, y * 8 - 1, 7, 2, 1).fill(S.engine);
    }
    for (let i = 0; i < modules.cargo; i++) g.roundRect(-21 + i * 9, -7, 6, 14, 2).fill(S.cargo);
    if (modules.armor)
        g.beginPath()
            .arc(0, 0, 28, Math.PI * 0.65, Math.PI * 1.35)
            .stroke({ color: S.reinforcement, width: 2 + modules.armor });
    return g;
}
