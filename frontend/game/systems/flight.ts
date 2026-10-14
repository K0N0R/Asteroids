import { GAME, type Mount } from '../config';
import type { Point } from '../worlds/sector';

export const angleDifference = (to: number, from: number) =>
    Math.atan2(Math.sin(to - from), Math.cos(to - from));

export function followCameraAngle(current: number, shipAngle: number, dt: number) {
    return (
        current +
        angleDifference(-Math.PI / 2 - shipAngle, current) *
            (1 - Math.exp(-GAME.cameraResponse * dt))
    );
}

export function rotateVector(point: Point, angle: number): Point {
    const c = Math.cos(angle),
        s = Math.sin(angle);
    return { x: point.x * c - point.y * s, y: point.x * s + point.y * c };
}

export function gunMount(position: Point, hullAngle: number, size: number, side: number): Point {
    const offset = rotateVector({ x: 0, y: side * GAME.gunMountY * size }, hullAngle);
    return { x: position.x + offset.x, y: position.y + offset.y };
}
export function mountPosition(
    position: Point,
    hullAngle: number,
    size: number,
    mount: Mount,
): Point {
    const offset = rotateVector({ x: mount.x * size, y: mount.y * size }, hullAngle);
    return { x: position.x + offset.x, y: position.y + offset.y };
}

export function aimAngle(origin: Point, target: Point, fallback: number) {
    return Math.hypot(target.x - origin.x, target.y - origin.y) > 8
        ? Math.atan2(target.y - origin.y, target.x - origin.x)
        : fallback;
}
