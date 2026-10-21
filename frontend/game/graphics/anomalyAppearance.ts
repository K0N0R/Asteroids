import type { Point } from '../worlds/sector';
import { polygonDistance } from '../systems/anomalyField';

/** Signed distance to a single footprint. No alpha is added when footprints overlap. */
function signedDistance(p: Point, polygon: readonly Point[]) {
    const outside = polygonDistance(p, polygon);
    if (outside > 0) return -outside;
    let edge = Infinity;
    for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i],
            b = polygon[(i + 1) % polygon.length];
        const dx = b.x - a.x,
            dy = b.y - a.y;
        const t = Math.max(
            0,
            Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)),
        );
        edge = Math.min(edge, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
    }
    return edge;
}

export function anomalyOpacity(point: Point, polygons: readonly (readonly Point[])[]) {
    const distance = Math.max(...polygons.map((polygon) => signedDistance(point, polygon)));
    // A faint fringe reaches at most 24 units outside the footprint; the safe route stays clear.
    const drift = Math.sin(point.x / 43 + Math.sin(point.y / 67)) * Math.sin(point.y / 37) * 12;
    const t = Math.max(0, Math.min(1, (distance + 12 + drift) / 85));
    return t * t * (3 - 2 * t);
}
