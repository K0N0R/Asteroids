import type { Point } from './sector';

// Separate coordinate space keeps both maps alive for the duration of one sortie.
export const MOON = {
    center: { x: 24000, y: 24000 },
    radius: 1600,
    entrance: { x: -1800, y: -1300 },
    exit: { x: 23100, y: 24000 },
    construction: { x: 24300, y: 24000 },
    quarry: { x: 23900, y: 24650 },
    transferSeconds: 2,
    deliverySeconds: 2,
} as const;
export function moonDistance(p: Point) {
    return Math.hypot(p.x - MOON.center.x, p.y - MOON.center.y);
}
