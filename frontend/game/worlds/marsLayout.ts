import type { Point } from './sector';
export type MarsOrbitId = 'mars' | 'phobos' | 'asteroid';
export const MARS_MAPS = {
    mars: { id: 'mars', name: 'Orbita Marsa', center: { x: 4000, y: -4000 }, radius: 9000 },
    phobos: { id: 'phobos', name: 'Orbita Fobosa', center: { x: 30000, y: 0 }, radius: 2800 },
    asteroid: {
        id: 'asteroid',
        name: 'Obszar asteroidy',
        center: { x: 60000, y: 0 },
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
    phobosArrival: { x: 28250, y: 1650 },
    asteroidExit: { x: 31800, y: 1300 },
    asteroidArrival: { x: 58600, y: 400 },
} as const;
