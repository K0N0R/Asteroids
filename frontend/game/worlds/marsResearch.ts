import type { Point } from './sector';
import { marsAnomalyClearance } from './phobosMaze';
import { MARS_MAPS, inMarsMap } from './marsLayout';

export const MARS_RESEARCH_HOME = { x: 140, y: 0 };
export const RESEARCH_CLEARANCE = 90;
export function marsResearchPointClear(p: Point, margin = RESEARCH_CLEARANCE) {
    return inMarsMap('mars', p, -margin) && marsAnomalyClearance(p, 'mars') > margin;
}
/** Check the entire swept leg, including diagonals and path smoothing. */
export function marsResearchLegClear(a: Point, b: Point, margin = RESEARCH_CLEARANCE) {
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 30));
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        if (!marsResearchPointClear({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, margin))
            return false;
    }
    return true;
}
/** Aim at the nearest actual damaging boundary, not a decorative waypoint. */
export function marsResearchScanTarget(site: Point) {
    let nearest: Point | null = null,
        distance = Infinity;
    for (let i = 0; i < 64; i++) {
        const angle = (i * Math.PI * 2) / 64;
        for (let d = 20; d < Math.min(1600, distance); d += 20) {
            const p = { x: site.x + Math.cos(angle) * d, y: site.y + Math.sin(angle) * d };
            if (marsAnomalyClearance(p, 'mars') > 0) continue;
            nearest = p;
            distance = d;
            break;
        }
    }
    return nearest ?? { x: site.x, y: MARS_MAPS.mars.center.y };
}
