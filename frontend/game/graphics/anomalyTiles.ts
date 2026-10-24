import type { Point } from '../worlds/sector';
export const ANOMALY_TILE_SIZE = 512;
export const ANOMALY_TILE_BLEED = 64;
export function anomalyTileRange(
    center: Point,
    halfWidth: number,
    halfHeight: number,
    angle: number,
) {
    // Camera transitions and a corrupt/stale zoom must not enqueue millions of tiles.
    halfWidth = Number.isFinite(halfWidth) ? Math.min(4096, Math.max(1, halfWidth)) : 960;
    halfHeight = Number.isFinite(halfHeight) ? Math.min(3072, Math.max(1, halfHeight)) : 580;
    angle = Number.isFinite(angle) ? angle : 0;
    const c = Math.abs(Math.cos(angle)),
        s = Math.abs(Math.sin(angle));
    const w = halfWidth * c + halfHeight * s + ANOMALY_TILE_SIZE;
    const h = halfWidth * s + halfHeight * c + ANOMALY_TILE_SIZE;
    return {
        left: Math.floor((center.x - w) / ANOMALY_TILE_SIZE),
        right: Math.floor((center.x + w) / ANOMALY_TILE_SIZE),
        top: Math.floor((center.y - h) / ANOMALY_TILE_SIZE),
        bottom: Math.floor((center.y + h) / ANOMALY_TILE_SIZE),
    };
}
