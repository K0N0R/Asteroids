import type { Point } from './sector';
import { segmentDistance } from '../systems/hyperdrive';
import { MARS_ACT } from '../state/marsAct';
import { MARS_MAPS, MARS_GATES } from './marsLayout';
export const PHOBOS_MAZE_GATE = { x: 10500, y: -9500 };
export const PHOBOS_MAZE_ENTRY = { x: 1700, y: 900 };

/** Rounded splines sampled once, outside the flight loop. */
function curve(points: readonly Point[]): Point[] {
    const out: Point[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[Math.max(0, i - 1)],
            b = points[i],
            c = points[i + 1],
            d = points[Math.min(points.length - 1, i + 2)];
        const steps = Math.max(4, Math.ceil(Math.hypot(c.x - b.x, c.y - b.y) / 160));
        for (let j = 0; j < steps; j++) {
            const t = j / steps;
            const at = (k: 'x' | 'y') =>
                0.5 *
                (2 * b[k] +
                    (-a[k] + c[k]) * t +
                    (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t +
                    (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t * t * t);
            out.push({ x: at('x'), y: at('y') });
        }
    }
    out.push({ ...points.at(-1)! });
    return out;
}
export const PHOBOS_MAZE_ROUTE = curve([
    PHOBOS_MAZE_ENTRY,
    { x: 3300, y: 1100 },
    { x: 4000, y: 200 },
    { x: 6200, y: -350 },
    { x: 7800, y: -1400 },
    { x: 6900, y: -2500 },
    { x: 4400, y: -2100 },
    { x: 2900, y: -3100 },
    { x: 3800, y: -4600 },
    { x: 6500, y: -4200 },
    { x: 9200, y: -4800 },
    { x: 9500, y: -6100 },
    { x: 7400, y: -6700 },
    { x: 5100, y: -6000 },
    { x: 3900, y: -6900 },
    { x: 5200, y: -8100 },
    { x: 7900, y: -7900 },
    { x: 9700, y: -8200 },
    PHOBOS_MAZE_GATE,
]);
export const PHOBOS_MAZE_BRANCHES = [
    curve([
        { x: 4000, y: 200 },
        { x: 4400, y: 1700 },
        { x: 6100, y: 1500 },
        { x: 7000, y: 400 },
    ]),
    curve([
        { x: 4400, y: -2100 },
        { x: 4600, y: -1100 },
        { x: 6200, y: -350 },
    ]),
    curve([
        { x: 3800, y: -4600 },
        { x: 2200, y: -5100 },
        { x: 1500, y: -6500 },
    ]),
    curve([
        { x: 6500, y: -4200 },
        { x: 7400, y: -3500 },
        { x: 9000, y: -3700 },
        { x: 9200, y: -4800 },
    ]),
    curve([
        { x: 5100, y: -6000 },
        { x: 5700, y: -7200 },
        { x: 7900, y: -7900 },
    ]),
    curve([
        { x: 9700, y: -8200 },
        { x: 11200, y: -7000 },
        { x: 11700, y: -7500 },
    ]),
];
const segments = [PHOBOS_MAZE_ROUTE, ...PHOBOS_MAZE_BRANCHES].flatMap((route) =>
    route.slice(1).map((b, i) => ({ a: route[i], b })),
);
const pockets = [
    { x: 7000, y: 400, r: 680 },
    { x: 1500, y: -6500, r: 510 },
    { x: 7900, y: -3500, r: 760 },
    { x: 5700, y: -7200, r: 600 },
    { x: 11700, y: -7500, r: 460 },
];
export function mazeDistance(p: Point) {
    let distance = Infinity;
    for (const { a, b } of segments) distance = Math.min(distance, segmentDistance(p, a, b));
    return distance;
}
function rawClearance(p: Point, phobos = false) {
    const ripple =
        Math.sin(p.x / 310 + Math.sin(p.y / 570) * 1.8) * 150 +
        Math.sin(p.y / 190 + Math.cos(p.x / 410)) * 75;
    if (phobos) {
        const north = p.y - (-1000 + Math.sin(p.x / 750) * 180 + Math.sin(p.x / 310) * 95),
            northwest = Math.max(p.x - (29100 + Math.sin(p.y / 430) * 150), p.y - 250);
        return Math.max(
            Math.min(north, northwest),
            340 -
                segmentDistance(p, MARS_ACT.probe, {
                    x: MARS_ACT.probe.x + 850,
                    y: MARS_ACT.probe.y + 500,
                }),
        );
    }
    const width = 400 + 70 * Math.sin(p.x / 880 + p.y / 1430) + 40 * Math.cos(p.y / 510);
    let safe = Math.max(
        2700 - Math.hypot(p.x, p.y) + ripple,
        Math.max(240, width + ripple) - mazeDistance(p),
    );
    for (const q of pockets) safe = Math.max(safe, q.r - Math.hypot(p.x - q.x, p.y - q.y) + ripple);
    return safe;
}

export const MARS_CLEAR_ROUTES = [
    { a: PHOBOS_MAZE_GATE, b: MARS_GATES.phobosArrival },
    { a: MARS_GATES.asteroidExit, b: MARS_GATES.asteroidArrival },
] as const;

/** Shared interpolated field: constant-time damage tests, matching the rendered boundary. */
function field(center: Point, radius: number, phobos = false) {
    const step = 120,
        extent = radius + (phobos ? 1500 : 2600),
        n = Math.ceil((extent * 2) / step),
        left = center.x - extent,
        top = center.y - extent;
    const values = new Float32Array((n + 1) * (n + 1));
    for (let y = 0; y <= n; y++)
        for (let x = 0; x <= n; x++) {
            const p = { x: left + x * step, y: top + y * step };
            const angle = Math.atan2(p.y - center.y, p.x - center.x),
                skirt = phobos ? 550 : 1150,
                edge =
                    radius +
                    skirt +
                    Math.sin(angle * 3 + 0.7) * skirt * 0.55 +
                    Math.cos(angle * 5 - 1.1) * skirt * 0.3 +
                    Math.sin(angle * 11) * skirt * 0.15,
                laneClearance = Math.max(
                    ...MARS_CLEAR_ROUTES.map((lane) => 650 - segmentDistance(p, lane.a, lane.b)),
                );
            values[y * (n + 1) + x] = Math.max(
                rawClearance(p, phobos),
                Math.hypot(p.x - center.x, p.y - center.y) - edge,
                laneClearance,
            );
        }
    const sample = (p: Point) => {
        const gx = (p.x - left) / step,
            gy = (p.y - top) / step,
            x = Math.floor(gx),
            y = Math.floor(gy);
        if (x < 0 || y < 0 || x >= n || y >= n) return Infinity;
        const a = gx - x,
            b = gy - y,
            i = y * (n + 1) + x;
        return (
            (values[i] * (1 - a) + values[i + 1] * a) * (1 - b) +
            (values[i + n + 1] * (1 - a) + values[i + n + 2] * a) * b
        );
    };
    const polygons: Point[][] = [];
    for (let y = 0; y < n; y++) {
        let run = -1;
        const flush = (x: number) => {
            if (run >= 0) {
                polygons.push([
                    { x: left + run * step, y: top + y * step },
                    { x: left + x * step, y: top + y * step },
                    { x: left + x * step, y: top + (y + 1) * step },
                    { x: left + run * step, y: top + (y + 1) * step },
                ]);
                run = -1;
            }
        };
        for (let x = 0; x < n; x++) {
            const corners = [
                [x, y],
                [x + 1, y],
                [x + 1, y + 1],
                [x, y + 1],
            ].map(([a, b]) => ({
                x: left + a * step,
                y: top + b * step,
                v: values[b * (n + 1) + a],
            }));
            if (corners.every((p) => p.v < 0)) {
                if (run < 0) run = x;
                continue;
            }
            flush(x);
            for (const indices of [
                [0, 1, 2],
                [0, 2, 3],
            ]) {
                const tri = indices.map((i) => corners[i]),
                    poly: Point[] = [];
                for (let j = 0; j < 3; j++) {
                    const a = tri[j],
                        b = tri[(j + 1) % 3];
                    if (a.v < 0) poly.push({ x: a.x, y: a.y });
                    if (a.v < 0 !== b.v < 0) {
                        const t = a.v / (a.v - b.v);
                        poly.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
                    }
                }
                if (poly.length >= 3) polygons.push(poly);
            }
        }
        flush(n);
    }
    return { sample, polygons };
}
const mars = field(MARS_MAPS.mars.center, MARS_MAPS.mars.radius);
const phobos = field(MARS_MAPS.phobos.center, MARS_MAPS.phobos.radius, true);
export const PHOBOS_MAZE_BANDS = mars.polygons;
export const PHOBOS_ORBIT_BANDS = phobos.polygons;
export function marsAnomalyClearance(p: Point, orbit: 'mars' | 'phobos' | 'asteroid') {
    return orbit === 'mars' ? mars.sample(p) : orbit === 'phobos' ? phobos.sample(p) : Infinity;
}
