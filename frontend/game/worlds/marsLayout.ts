import type { Point } from './sector';
export type MarsOrbitId = 'mars' | 'phobos' | 'asteroid';
export const MARS_MAPS = {
    mars: { id: 'mars', name: 'Orbita Marsa', center: { x: 4000, y: -4000 }, radius: 9000 },
    phobos: { id: 'phobos', name: 'Orbita Fobosa', center: { x: 30000, y: 0 }, radius: 2800 },
    asteroid: {
        id: 'asteroid',
        name: 'Obszar asteroidy',
        center: { x: 3000, y: 24000 },
        radius: 1800,
    },
} as const;
export function marsOrbitAt(p: Point) {
    return Object.values(MARS_MAPS).find(
        (m) => Math.hypot(p.x - m.center.x, p.y - m.center.y) <= m.radius + 100,
    );
}
export function nearestMarsOrbit(p: Point) {
    return Object.values(MARS_MAPS).reduce((a, b) =>
        Math.hypot(p.x - a.center.x, p.y - a.center.y) <
        Math.hypot(p.x - b.center.x, p.y - b.center.y)
            ? a
            : b,
    );
}
export function inMarsMap(id: MarsOrbitId, p: Point, margin = 0) {
    const m = MARS_MAPS[id];
    return Math.hypot(p.x - m.center.x, p.y - m.center.y) <= m.radius + margin;
}
export const MARS_GATES = {
    phobosArrival: { x: 28350, y: -1550 },
    asteroidExit: { x: 29400, y: 2200 },
    asteroidArrival: { x: 3800, y: 22800 },
    asteroidReturn: { x: 1700, y: 24100 },
    marsReturn: { x: -1100, y: 1400 },
} as const;
export const PHOBOS_AMBUSH_POSITIONS = Array.from({ length: 3 }, (_, i) => ({
    x: MARS_GATES.phobosArrival.x + 300 + i * 80,
    y: MARS_GATES.phobosArrival.y - 180 + i * 170,
}));
