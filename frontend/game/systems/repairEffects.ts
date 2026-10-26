import { mountPosition } from './flight';
import type { Point } from '../worlds/sector';

/** Shared welding cadence and hull locations for the pilot and escort ships. */
export function repairWeld(
    before: number,
    after: number,
    position: Point,
    angle: number,
    size: number,
    velocity: Point,
) {
    const index = Math.floor(before * 12);
    if (Math.floor(after * 12) <= index) return null;
    const sites = [
        { x: -18, y: -12 },
        { x: 11, y: 13 },
        { x: -10, y: 14 },
        { x: 18, y: -10 },
    ];
    return {
        ...mountPosition(position, angle, size, sites[index % sites.length]),
        kind: 'weld' as const,
        strength: 3,
        velocity,
    };
}
