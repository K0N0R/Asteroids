import { Graphics } from 'pixi.js';
import { random } from '../worlds/sector';

/** Stylised ice and rust atlas, with an asymmetric heart-shaped bright plain. */
export function drawPlutoTerrain(g: Graphics, r: number) {
    g.circle(0, 0, r).fill(0xaaa6a8);
    g.ellipse(-r * 0.21, -r * 0.28, r * 0.92, r * 0.9).fill(0xc7c9c6);
    g.beginPath()
        .moveTo(-r, -r * 0.22)
        .bezierCurveTo(-r * 0.82, -r * 0.73, -r * 0.42, -r * 0.96, r * 0.09, -r * 0.9)
        .bezierCurveTo(r * 0.43, -r * 0.85, r * 0.51, -r * 0.48, r * 0.27, -r * 0.35)
        .bezierCurveTo(-r * 0.06, -r * 0.51, -r * 0.13, -r * 0.14, -r * 0.43, -r * 0.24)
        .bezierCurveTo(-r * 0.65, -r * 0.16, -r * 0.81, r * 0.04, -r, -r * 0.22)
        .closePath()
        .fill(0xd5c6ae);
    g.beginPath()
        .moveTo(-r, r * 0.06)
        .bezierCurveTo(-r * 0.74, -r * 0.09, -r * 0.59, r * 0.26, -r * 0.36, r * 0.14)
        .bezierCurveTo(-r * 0.12, -r * 0.05, r * 0.19, r * 0.34, r * 0.48, r * 0.2)
        .bezierCurveTo(r * 0.75, r * 0.12, r * 0.86, r * 0.46, r * 0.95, r * 0.61)
        .lineTo(r * 0.48, r * 1.05)
        .lineTo(-r * 0.64, r * 1.05)
        .bezierCurveTo(-r * 0.87, r * 0.77, -r * 0.97, r * 0.37, -r, r * 0.06)
        .closePath()
        .fill(0x95554e);
    g.beginPath()
        .moveTo(-r * 0.8, r * 0.34)
        .bezierCurveTo(-r * 0.55, r * 0.16, -r * 0.41, r * 0.48, -r * 0.2, r * 0.37)
        .bezierCurveTo(r * 0.04, r * 0.22, r * 0.25, r * 0.54, r * 0.59, r * 0.43)
        .bezierCurveTo(r * 0.73, r * 0.52, r * 0.67, r * 0.84, r * 0.44, r * 0.95)
        .bezierCurveTo(r * 0.09, r * 1.06, -r * 0.52, r * 0.98, -r * 0.8, r * 0.34)
        .closePath()
        .fill(0x7f4544);
    g.beginPath()
        .moveTo(-r * 0.92, -r * 0.08)
        .bezierCurveTo(-r * 0.64, -r * 0.23, -r * 0.69, -r * 0.53, -r * 0.46, -r * 0.58)
        .bezierCurveTo(-r * 0.28, -r * 0.45, -r * 0.36, -r * 0.17, -r * 0.56, -r * 0.1)
        .bezierCurveTo(-r * 0.68, r * 0.13, -r * 0.88, r * 0.09, -r * 0.92, -r * 0.08)
        .closePath()
        .fill(0xd4ddd9);

    // Unequal lobes and a blunt lower edge avoid a regular pictogram heart.
    g.beginPath()
        .moveTo(r * 0.12, -r * 0.23)
        .bezierCurveTo(-r * 0.04, -r * 0.49, -r * 0.37, -r * 0.26, -r * 0.23, r * 0.04)
        .bezierCurveTo(-r * 0.18, r * 0.24, r * 0.03, r * 0.39, r * 0.2, r * 0.49)
        .bezierCurveTo(r * 0.36, r * 0.32, r * 0.57, r * 0.27, r * 0.64, r * 0.06)
        .bezierCurveTo(r * 0.82, -r * 0.19, r * 0.58, -r * 0.48, r * 0.34, -r * 0.34)
        .bezierCurveTo(r * 0.23, -r * 0.33, r * 0.19, -r * 0.24, r * 0.12, -r * 0.23)
        .closePath()
        .fill(0xe3dfca);
    g.beginPath()
        .moveTo(r * 0.12, -r * 0.21)
        .bezierCurveTo(-r * 0.03, -r * 0.43, -r * 0.29, -r * 0.24, -r * 0.18, r * 0.02)
        .bezierCurveTo(-r * 0.12, r * 0.22, r * 0.05, r * 0.34, r * 0.19, r * 0.43)
        .bezierCurveTo(r * 0.31, r * 0.2, r * 0.21, -r * 0.05, r * 0.12, -r * 0.21)
        .closePath()
        .fill(0xf2edda);
    // Restrained cells in the pale plain, not a grid spread over the entire globe.
    g.beginPath()
        .moveTo(-r * 0.13, -r * 0.11)
        .lineTo(r * 0.02, -r * 0.06)
        .lineTo(r * 0.11, -r * 0.15)
        .moveTo(r * 0.02, -r * 0.06)
        .lineTo(r * 0.01, r * 0.09)
        .lineTo(-r * 0.07, r * 0.16)
        .moveTo(r * 0.01, r * 0.09)
        .lineTo(r * 0.17, r * 0.13)
        .lineTo(r * 0.21, r * 0.28)
        .stroke({ color: 0xc7c8bb, width: r * 0.007, alpha: 0.5, cap: 'round', join: 'round' });

    const rng = random(115104);
    // Frost islands at the boundary of the dark terrain; keep the heart uncluttered.
    for (let i = 0; i < 44; i++) {
        const x = -0.88 + rng() * 1.68,
            y = 0.16 + rng() * 0.69;
        if (x * x + y * y > 0.89 || (x > -0.27 && x < 0.69 && y < 0.5)) continue;
        const size = 0.012 + rng() * 0.026;
        g.ellipse(x * r, y * r, size * r, size * r * 0.65).fill(i % 3 === 0 ? 0xc3c9c5 : 0xb18475);
    }
    for (const [x, y, size] of [
        [-0.49, -0.65, 0.055],
        [-0.7, -0.34, 0.04],
        [0.12, -0.72, 0.038],
        [0.66, -0.45, 0.035],
        [-0.37, 0.74, 0.035],
    ]) {
        g.ellipse(x * r, (y + 0.008) * r, size * r, size * r * 0.8).fill(0xe0d6be);
        g.ellipse(x * r, y * r, size * r * 0.7, size * r * 0.53).fill(0x999b9f);
    }
    g.beginPath()
        .moveTo(-r * 0.63, r * 0.08)
        .bezierCurveTo(-r * 0.46, r * 0.03, -r * 0.47, -r * 0.07, -r * 0.35, -r * 0.09)
        .moveTo(r * 0.58, r * 0.52)
        .bezierCurveTo(r * 0.48, r * 0.61, r * 0.53, r * 0.7, r * 0.4, r * 0.76)
        .stroke({ color: 0xc9c9bf, width: r * 0.012, alpha: 0.6, cap: 'round' });
}
