import type { Point } from '../worlds/sector';
import { nearestMarsOrbit } from '../worlds/marsLayout';
import { HYPERDRIVE } from './hyperdrive';
export function gateRadarFrame(
    center: Point,
    radius: number,
    drive: {
        transfer: boolean;
        state: string;
        origin: Point;
        target: Point;
        transitElapsed: number;
    },
) {
    if (!drive.transfer || drive.state !== 'transit') return { center, radius };
    const a = nearestMarsOrbit(drive.origin),
        b = nearestMarsOrbit(drive.target),
        t = Math.min(1, drive.transitElapsed / HYPERDRIVE.transferSeconds),
        e = t * t * (3 - 2 * t);
    return {
        center: {
            x: a.center.x + (b.center.x - a.center.x) * e,
            y: a.center.y + (b.center.y - a.center.y) * e,
        },
        radius: a.radius + (b.radius - a.radius) * e,
    };
}
export const RADAR_RADIUS = 110;
export const RADAR_ZOOMS = [0.75, 1, 1.5, 2, 3, 4] as const;
export function zoomRadarFrame(center: Point, radius: number, ship: Point, zoom: number) {
    return { center: zoom > 1 ? ship : center, radius: radius / zoom };
}
export function radarPoint(p: Point, center: Point, radius: number, clamp = false) {
    const dx = p.x - center.x,
        dy = p.y - center.y,
        fraction = clamp ? Math.min(1, (radius - 100) / Math.max(1, Math.hypot(dx, dy))) : 1;
    return {
        x: 1470 + (dx * fraction * RADAR_RADIUS) / radius,
        y: 130 + (dy * fraction * RADAR_RADIUS) / radius,
    };
}
