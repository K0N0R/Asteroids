import { rotateVector } from './flight';
import type { Point } from '../worlds/sector';

export interface CombatView {
    center: Point;
    angle: number;
    zoom: number;
}
/** Full physical body outside the 1600x900 play area, including camera interpolation margin. */
export function outsideCombatView(point: Point, radius: number, view: CombatView) {
    const p = rotateVector({ x: point.x - view.center.x, y: point.y - view.center.y }, view.angle);
    const zoom = Math.max(0.3, Math.min(2, view.zoom));
    return Math.abs(p.x) > 800 / zoom + radius + 120 || Math.abs(p.y) > 450 / zoom + radius + 120;
}
export function assaultEntry(
    site: Point,
    radius: number,
    view: CombatView,
    sectorCenter: Point,
    sectorRadius: number,
    phase: number,
    blocked: (p: Point) => boolean,
): Point | null {
    for (const distance of [800, 1050, 1300, 1600, 1950, 2300])
        for (let i = 0; i < 32; i++) {
            const angle = phase + (i * Math.PI * 2) / 32;
            const point = {
                x: site.x + Math.cos(angle) * distance,
                y: site.y + Math.sin(angle) * distance,
            };
            if (
                Math.hypot(point.x - sectorCenter.x, point.y - sectorCenter.y) >
                sectorRadius - radius - 40
            )
                continue;
            if (!outsideCombatView(point, radius, view) || blocked(point)) continue;
            return point;
        }
    return null;
}
