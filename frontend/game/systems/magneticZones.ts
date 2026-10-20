import type { Point } from '../worlds/sector';
export const MAGNETIC_RELAYS = [
    { id: 0, x: 750, y: 650, radius: 1200, name: 'Przekaźnik orbitalny' },
] as const;
export const REMOTE_MAGNETIC_ZONE = {
    x: 0,
    y: -4500,
    radius: 1000,
    name: 'Orbita Księżyca',
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

/** Only the outer edge of combined protection is dangerous; covered arcs are omitted. */
export function magneticBoundaryArcs(zones: readonly (Point & { radius: number })[]) {
    const tau = Math.PI * 2;
    return zones.flatMap((zone, index) => {
        const covered: [number, number][] = [];
        for (let j = 0; j < zones.length; j++) {
            if (j === index) continue;
            const other = zones[j];
            const dx = other.x - zone.x,
                dy = other.y - zone.y,
                distance = Math.hypot(dx, dy);
            if (distance < 1e-8 && Math.abs(zone.radius - other.radius) < 1e-8 && j > index)
                continue;
            if (distance + zone.radius <= other.radius) return [];
            if (distance >= zone.radius + other.radius || distance + other.radius <= zone.radius)
                continue;
            const half = Math.acos(
                Math.max(
                    -1,
                    Math.min(
                        1,
                        (zone.radius ** 2 + distance ** 2 - other.radius ** 2) /
                            (2 * zone.radius * distance),
                    ),
                ),
            );
            const start = (((Math.atan2(dy, dx) - half) % tau) + tau) % tau;
            const end = start + half * 2;
            if (end > tau) covered.push([start, tau], [0, end - tau]);
            else covered.push([start, end]);
        }
        covered.sort((a, b) => a[0] - b[0]);
        const arcs: { x: number; y: number; radius: number; start: number; end: number }[] = [];
        let cursor = 0;
        for (const [start, end] of covered) {
            if (start > cursor + 1e-8) arcs.push({ ...zone, start: cursor, end: start });
            cursor = Math.max(cursor, end);
        }
        if (cursor < tau - 1e-8) arcs.push({ ...zone, start: cursor, end: tau });
        return arcs;
    });
}
