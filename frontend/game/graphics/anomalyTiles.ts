import type { Point } from '../worlds/sector';
export const ANOMALY_TILE_SIZE = 512;
export const ANOMALY_TILE_BLEED = 64;
export function anomalyTileRange(
    center: Point,
    halfWidth: number,
    halfHeight: number,
    angle: number,
) {
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
