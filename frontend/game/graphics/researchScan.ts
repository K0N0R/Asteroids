import { Graphics } from 'pixi.js';
import type { Point } from '../worlds/sector';

/** A swept sensor fan hits the anomaly surface; pulses mark the sampled material. */
export function drawResearchScan(
    g: Graphics,
    from: Point,
    to: Point,
    time: number,
    active: boolean,
) {
    g.clear();
    const angle = Math.atan2(to.y - from.y, to.x - from.x),
        distance = Math.hypot(to.x - from.x, to.y - from.y),
        half = 0.21;
    const point = (a: number, d: number) => ({
        x: from.x + Math.cos(a) * d,
        y: from.y + Math.sin(a) * d,
    });
    const start = point(angle, 28),
        left = point(angle - half, distance + 40),
        right = point(angle + half, distance + 40);
    g.poly([start.x, start.y, left.x, left.y, right.x, right.y]).fill({
        color: 0x6ce9db,
        alpha: active ? 0.065 : 0.018,
    });
    // Scanner lens and moving sweep remain attached to the ship's emitter.
    g.circle(start.x, start.y, 5).fill({ color: 0xa8f9ed, alpha: active ? 0.9 : 0.25 });
    if (!active) return;
    const sweep = point(angle + Math.sin(time * 2.2) * half, distance + 35);
    g.moveTo(start.x, start.y)
        .lineTo(sweep.x, sweep.y)
        .stroke({ color: 0x8bfff1, width: 2.3, alpha: 0.85 });
    g.circle(sweep.x, sweep.y, 7 + Math.sin(time * 9) * 2).fill({ color: 0xcbfff6, alpha: 0.45 });
    for (let i = 0; i < 3; i++) {
        const t = (time * 0.55 + i / 3) % 1;
        g.beginPath()
            .arc(to.x, to.y, 18 + t * 95, angle + Math.PI - 0.9, angle + Math.PI + 0.9)
            .stroke({
                color: 0x72efdf,
                width: 2,
                alpha: (1 - t) * 0.65,
            });
    }
    const side = { x: -Math.sin(angle), y: Math.cos(angle) };
    for (let i = -2; i <= 2; i++) {
        const d = Math.sin(time * 1.7 + i) * 15;
        g.moveTo(to.x + side.x * i * 22 - side.y * d, to.y + side.y * i * 22 + side.x * d)
            .lineTo(
                to.x + side.x * i * 22 - side.y * d + side.x * 9,
                to.y + side.y * i * 22 + side.x * d + side.y * 9,
            )
            .stroke({ color: 0xd0fff4, width: 1.5, alpha: 0.45 });
    }
}
