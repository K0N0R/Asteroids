import { rotateVector } from '../systems/flight';
import type { Point } from '../worlds/sector';

/** Project a distant world anchor through the same camera heading as the sector. */
export function parallaxPoint(
    anchor: Point,
    camera: Point,
    angle: number,
    depth: number,
    zoom = 1,
) {
    const offset = rotateVector(
        { x: (anchor.x - camera.x) * depth * zoom, y: (anchor.y - camera.y) * depth * zoom },
        angle,
    );
    return { x: 800 + offset.x, y: 450 + offset.y };
}
