import type { Point } from '../worlds/sector';
export const MAGNETIC_RELAYS = [
    { id: 0, x: 750, y: 650, radius: 1200, name: 'Przekaźnik orbitalny' },
    { id: 1, x: -1750, y: 700, radius: 1100, name: 'Przekaźnik zachodni' },
    { id: 2, x: 1500, y: -1500, radius: 1000, name: 'Przekaźnik południowy' },
] as const;
export const REMOTE_MAGNETIC_ZONE = {
    x: 0,
    y: -4500,
    radius: 700,
    name: 'Metaliczne złoże · pole indukowane',
};
export function magneticCoverage(p: Point, active: readonly number[]) {
    return (
        Math.hypot(p.x, p.y) <= 1450 ||
        MAGNETIC_RELAYS.some(
            (r) => active.includes(r.id) && Math.hypot(p.x - r.x, p.y - r.y) <= r.radius,
        ) ||
        Math.hypot(p.x - REMOTE_MAGNETIC_ZONE.x, p.y - REMOTE_MAGNETIC_ZONE.y) <=
            REMOTE_MAGNETIC_ZONE.radius
    );
}
