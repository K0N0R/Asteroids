import { MARS_ACT } from '../state/marsAct';
import type { Point } from './sector';

/** Separate flight spaces, reached through the same hold-E transfer as the Moon. */
export const MARS_MOONS = {
    phobos: {
        id: 'phobos',
        name: 'Fobos',
        center: MARS_ACT.surface,
        radius: 1800,
        entrance: MARS_ACT.phobos,
        exit: { x: 5700, y: 5700 },
    },
    deimos: {
        id: 'deimos',
        name: 'Deimos',
        center: { x: -24000, y: 24000 },
        radius: 1800,
        entrance: MARS_ACT.deimosGate,
        exit: { x: -24800, y: 23700 },
    },
} as const;
export function marsSurfaceAt(point: Point) {
    return Object.values(MARS_MOONS).find(
        (body) => Math.hypot(point.x - body.center.x, point.y - body.center.y) < body.radius + 500,
    );
}
export function nearestMarsSurface(point: Point) {
    return Object.values(MARS_MOONS).reduce((a, b) =>
        Math.hypot(point.x - a.center.x, point.y - a.center.y) <
        Math.hypot(point.x - b.center.x, point.y - b.center.y)
            ? a
            : b,
    );
}
