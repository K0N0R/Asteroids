import type { Graphics } from 'pixi.js';
import type { Point } from '../worlds/sector';
import { marsAnomalyTouches } from '../worlds/phobosMaze';
import { RADAR_RADIUS } from '../systems/radarFrame';

/** Fixed pixel budget; an empty overlay must never fill the preceding radar disc. */
export function drawRadarAnomaly(map: Graphics, frame: { center: Point; radius: number }) {
    const cell = 3,
        worldPerPixel = frame.radius / RADAR_RADIUS;
    let cells = 0;
    for (let dy = -RADAR_RADIUS; dy < RADAR_RADIUS; dy += cell)
        for (let dx = -RADAR_RADIUS; dx < RADAR_RADIUS; dx += cell) {
            if (Math.hypot(dx + cell / 2, dy + cell / 2) > RADAR_RADIUS) continue;
            const p = {
                x: frame.center.x + (dx + cell / 2) * worldPerPixel,
                y: frame.center.y + (dy + cell / 2) * worldPerPixel,
            };
            if (!marsAnomalyTouches(p, 'mars', 0) && !marsAnomalyTouches(p, 'phobos', 0)) continue;
            if (!cells) map.beginPath();
            map.rect(1470 + dx, 130 + dy, cell, cell);
            cells++;
        }
    if (cells) map.fill({ color: 0xd8794c, alpha: 0.45 });
    return cells;
}
