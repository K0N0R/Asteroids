import type { Point } from './sector';
import { segmentDistance } from '../systems/hyperdrive';
import { MARS_MAPS } from './marsLayout';
export const PHOBOS_MAZE_GATE = { x: 10500, y: -9500 };
export const PHOBOS_MAZE_ENTRY = { x: 1700, y: 900 };
export const PHOBOS_MAZE_ROUTE: readonly Point[] = [
    PHOBOS_MAZE_ENTRY,
    { x: 3000, y: 900 },
    { x: 3000, y: -900 },
    { x: 7500, y: -900 },
    { x: 7500, y: -2300 },
    { x: 2600, y: -2300 },
    { x: 2600, y: -4500 },
    { x: 9500, y: -4500 },
    { x: 9500, y: -5900 },
    { x: 3800, y: -5900 },
    { x: 3800, y: -7700 },
    { x: 10500, y: -7700 },
    PHOBOS_MAZE_GATE,
];
export const PHOBOS_MAZE_BRANCHES: readonly (readonly Point[])[] = [
    [
        { x: 4800, y: -900 },
        { x: 4800, y: 300 },
        { x: 6500, y: 300 },
    ],
    [
        { x: 5500, y: -2300 },
        { x: 5500, y: -3400 },
        { x: 3800, y: -3400 },
    ],
    [
        { x: 7800, y: -4500 },
        { x: 7800, y: -3100 },
        { x: 9000, y: -3100 },
    ],
    [
        { x: 5200, y: -5900 },
        { x: 5200, y: -6800 },
        { x: 7000, y: -6800 },
    ],
    [
        { x: 9000, y: -7700 },
        { x: 9000, y: -8800 },
        { x: 7500, y: -8800 },
    ],
];
const paths = [PHOBOS_MAZE_ROUTE, ...PHOBOS_MAZE_BRANCHES];
export function mazeDistance(p: Point) {
    return Math.min(
        ...paths.flatMap((route) => route.slice(1).map((b, i) => segmentDistance(p, route[i], b))),
    );
}
/** Row runs merged vertically: compact union geometry, no per-cell scene objects. */
export function anomalyTiles(center: Point, radius: number, filled: (p: Point) => boolean) {
    const step = 200,
        rows = Math.ceil((radius * 2) / step),
        polys: Point[][] = [],
        active = new Map<string, { x: number; y: number; w: number; h: number }>();
    const finish = (r: { x: number; y: number; w: number; h: number }) =>
        polys.push([
            { x: r.x, y: r.y },
            { x: r.x + r.w, y: r.y },
            { x: r.x + r.w, y: r.y + r.h },
            { x: r.x, y: r.y + r.h },
        ]);
    for (let row = 0; row < rows; row++) {
        const y = center.y - radius + row * step,
            keys = new Set<string>();
        let begin = -1;
        for (let col = 0; col <= rows; col++) {
            const x = center.x - radius + col * step,
                p = { x: x + step / 2, y: y + step / 2 };
            const on =
                col < rows && Math.hypot(p.x - center.x, p.y - center.y) < radius && filled(p);
            if (on && begin < 0) begin = col;
            if (!on && begin >= 0) {
                const k = `${begin},${col}`,
                    old = active.get(k);
                keys.add(k);
                if (old) old.h += step;
                else
                    active.set(k, {
                        x: center.x - radius + begin * step,
                        y,
                        w: (col - begin) * step,
                        h: step,
                    });
                begin = -1;
            }
        }
        for (const [k, r] of active)
            if (!keys.has(k)) {
                finish(r);
                active.delete(k);
            }
    }
    for (const r of active.values()) finish(r);
    return polys;
}
// Safe station pocket in the lower-left plus an actual branching maze through the filled region.
export const PHOBOS_MAZE_BANDS = anomalyTiles(
    MARS_MAPS.mars.center,
    MARS_MAPS.mars.radius,
    (p) => Math.hypot(p.x, p.y) > 2900 && mazeDistance(p) > 375,
);
export const PHOBOS_ORBIT_BANDS = anomalyTiles(
    MARS_MAPS.phobos.center,
    MARS_MAPS.phobos.radius,
    (p) => p.x < MARS_MAPS.phobos.center.x - 1130,
);
