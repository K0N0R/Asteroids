import { Graphics } from 'pixi.js';
import { phaseBladeScale, type HullId } from '../config';
import type { ShipModules } from '../state/campaign';
import { HULL_PALETTES, roundedPanel } from './shipHull';

const pair = (points: number[]) => [points, points.map((v, i) => (i % 2 ? -v : v))];

// Each stage adds fitted plates. Coordinates are hull-local; +X is the bow.
const ARMOR_STAGES: Partial<Record<HullId, number[][][]>> = {
    swift: [
        pair([-29, 16, -19, 22, -7, 19, -4, 15, -16, 17, -26, 12]),
        pair([-18, 23, -29, 27, -33, 23, -29, 20, -20, 19]),
        pair([28, 3, 37, 1, 34, 5, 24, 8, 21, 6]),
    ],
    fighter: [
        pair([-5, 16, 1, 22, 10, 19, 18, 10, 13, 8, 6, 14]),
        [[29, -3, 34, 0, 29, 3, 27, 2, 29, 0, 27, -2]],
        pair([-10, 13, -6, 19, 1, 17, 2, 12, -4, 10]),
    ],
    tug: [
        pair([27, 28, 35, 20, 40, 8, 36, 5, 32, 17, 24, 24]),
        pair([7, 37, 13, 38, 27, 31, 25, 26, 13, 31, 8, 29]),
        pair([-10, 9, -1, 14, 6, 25, 10, 22, 2, 10, -6, 5]),
    ],
    falcon: [
        pair([-26, 22, -12, 31, -2, 32, -2, 27, -10, 26, -22, 19]),
        pair([23, 18, 38, 17, 41, 10, 35, 10, 33, 13, 24, 14]),
        [[-37, -11, -33, -15, -33, 15, -37, 11]],
    ],
    widmo: [
        pair([-10, 12, -4, 10, 3, 13, 1, 23, -8, 30, -14, 25]),
        pair([-14, 44, -4, 48, 11, 44, 11, 40, -2, 43, -11, 40]),
        pair([-4, 8, 8, 7, 14, 5, 15, 8, 8, 11, -4, 12]),
    ],
    atlas: [
        pair([-30, 8, -8, 8, -5, 11, -10, 13, -30, 13]),
        pair([-5, 11, 24, 11, 32, 6, 36, 7, 26, 13, -5, 14]),
        [[31, -5, 38, -6, 41, 0, 38, 6, 31, 5, 34, 0]],
    ],
    stinger: [
        pair([-10, 13, -3, 12, 5, 18, 2, 23, -9, 21, -13, 17]),
        pair([-27, 31, -23, 29, -19, 36, -21, 42, -26, 42, -29, 38]),
        pair([22, 3, 35, 1, 39, 0, 31, 5, 21, 7, 18, 5]),
    ],
    phoenix: [
        pair([-8, 10, 9, 9, 18, 13, 10, 18, -4, 18]),
        pair([8, 16, 12, 18, -17, 36, -22, 33, -12, 25]),
        pair([-29, 9, -18, 12, 6, 8, 8, 12, -17, 16, -30, 12]),
    ],
    raider: [
        pair([-19, 16, -12, 23, 6, 22, 17, 15, 11, 11, -10, 13]),
        [[28, -7, 35, -7, 39, 0, 35, 7, 28, 7, 31, 0]],
        pair([-29, 10, -24, 9, -20, 15, -23, 21, -29, 17]),
    ],
    lancer: [
        pair([-23, 15, -17, 25, 10, 24, 20, 16, 13, 11, -12, 13]),
        [[27, -8, 35, -9, 40, 0, 35, 9, 27, 8, 30, 0]],
        pair([-31, 10, -25, 9, -19, 15, -22, 23, -29, 20, -33, 15]),
    ],
};

export function fittedArmor(hull: HullId, modules: ShipModules) {
    const g = new Graphics(),
        stages = ARMOR_STAGES[hull];
    if (!stages || !modules.armor) return g;
    const palette = HULL_PALETTES[hull],
        heavy = modules.armor >= 3,
        radius = ['swift', 'stinger', 'phoenix', 'raider', 'lancer'].includes(hull) ? 0.7 : 1.5;
    const plate = (points: number[]) => {
        const count = points.length / 2;
        let cx = 0,
            cy = 0;
        for (let i = 0; i < points.length; i += 2) {
            cx += points[i] / count;
            cy += points[i + 1] / count;
        }
        roundedPanel(
            g,
            points.map((v, i) => v + (i % 2 ? 0.8 : -0.7)),
            radius,
            0x263942,
            0x263942,
        );
        roundedPanel(g, points, radius, palette.panel, palette.edge);
        if (heavy) {
            const inset = points.map((v, i) => (i % 2 ? cy : cx) + (v - (i % 2 ? cy : cx)) * 0.74);
            g.poly(inset).fill({ color: palette.edge, alpha: 0.2 });
        }
        if (hull === 'raider' || hull === 'lancer') {
            for (const i of [0, 4])
                g.circle(cx + (points[i] - cx) * 0.6, cy + (points[i + 1] - cy) * 0.6, 0.8).fill(
                    0x38404a,
                );
        }
    };
    for (let stage = 0; stage < Math.min(3, modules.armor); stage++) {
        g.context.save();
        // Wing armor follows the blade size; fuselage armor keeps fixed anchors.
        if (hull === 'widmo' && stage < 2)
            g.context.scale(1 + modules.handling * 0.025, phaseBladeScale(modules.handling));
        for (const points of stages[stage]) plate(points);
        g.context.restore();
    }
    return g;
}
