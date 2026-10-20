import type { Point } from './sector';

// Separate coordinate space keeps both maps alive for the duration of one sortie.
export const MOON = {
    center: { x: 24000, y: 24000 },
    radius: 2600,
    entrance: { x: 0, y: -4500 },
    exit: { x: 23100, y: 24000 },
    construction: { x: 24300, y: 24000 },
    quarry: { x: 23900, y: 24650 },
    copperRidge: { x: 25450, y: 22600 },
    transferSeconds: 2,
    arrivalSeconds: 3.2,
    deliverySeconds: 2,
} as const;
export function moonDistance(p: Point) {
    return Math.hypot(p.x - MOON.center.x, p.y - MOON.center.y);
}
export function moonOrbitPoint(p: Point): Point {
    return {
        x: MOON.entrance.x + p.x - MOON.exit.x,
        y: MOON.entrance.y + p.y - MOON.exit.y,
    };
}

export function inEarthSystem(sector: string | undefined) {
    return sector === 'earth' || sector === 'lunar';
}
export const EARTH_MOON_LANE = {
    name: 'Ziemia — Księżyc',
    a: { x: 0, y: -1200 },
    b: { x: 0, y: -3900 },
};
