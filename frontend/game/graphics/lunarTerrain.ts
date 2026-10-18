import { Graphics } from 'pixi.js';
import { random } from '../worlds/sector';

export function drawLunarTerrain(view: Graphics, radius: number) {
    view.circle(0, 0, radius).fill(0xa6aac6);
    const rng = random(731);
    for (let index = 0; index < 12; index++) {
        const x = (rng() - 0.5) * radius * 1.8,
            y = (rng() - 0.5) * radius * 1.8,
            size = radius * (0.064 + rng() * 0.198);
        view.beginPath()
            .ellipse(x + radius * 0.016, y + radius * 0.032, size, size * 0.8)
            .fill(0xd9d8e7)
            .ellipse(x, y, size, size * 0.8)
            .fill(0x8588aa);
    }
}
