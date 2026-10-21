import { Graphics } from 'pixi.js';
import { random } from '../worlds/sector';

/** Stylised mineral-colour atlas inspired by the reference, not a geological map. */
export function drawMercuryTerrain(g: Graphics, r: number) {
    g.circle(0, 0, r).fill(0x8c92a5);
    g.ellipse(-r * 0.2, -r * 0.24, r * 0.91, r * 0.88).fill(0xb6b3a6);
    // Warm uplands and cooler, irregular plains; avoid continent-like outlines.
    g.moveTo(-r, -r * 0.1)
        .bezierCurveTo(-r * 0.92, -r * 0.64, -r * 0.52, -r * 0.98, -r * 0.03, -r * 0.94)
        .bezierCurveTo(r * 0.28, -r * 0.89, r * 0.24, -r * 0.58, r * 0.02, -r * 0.36)
        .bezierCurveTo(-r * 0.16, -r * 0.1, -r * 0.48, -r * 0.24, -r * 0.65, r * 0.11)
        .bezierCurveTo(-r * 0.83, r * 0.29, -r * 0.95, r * 0.07, -r, -r * 0.1)
        .closePath()
        .fill(0xc9b282);
    g.moveTo(-r * 0.84, r * 0.21)
        .bezierCurveTo(-r * 0.58, -r * 0.12, -r * 0.26, r * 0.13, -r * 0.08, -r * 0.07)
        .bezierCurveTo(r * 0.2, -r * 0.33, r * 0.13, -r * 0.65, r * 0.4, -r * 0.77)
        .bezierCurveTo(r * 0.67, -r * 0.7, r * 0.72, -r * 0.42, r * 0.49, -r * 0.19)
        .bezierCurveTo(r * 0.27, r * 0.06, r * 0.49, r * 0.28, r * 0.22, r * 0.5)
        .bezierCurveTo(-r * 0.04, r * 0.65, -r * 0.16, r * 0.96, -r * 0.52, r * 0.79)
        .bezierCurveTo(-r * 0.82, r * 0.77, -r * 0.77, r * 0.48, -r * 0.84, r * 0.21)
        .closePath()
        .fill(0x78859e);
    g.moveTo(-r * 0.66, r * 0.47)
        .bezierCurveTo(-r * 0.5, r * 0.27, -r * 0.29, r * 0.49, -r * 0.13, r * 0.33)
        .bezierCurveTo(r * 0.08, r * 0.13, r * 0.2, r * 0.42, r * 0.09, r * 0.66)
        .bezierCurveTo(-r * 0.09, r * 0.91, -r * 0.38, r * 0.9, -r * 0.66, r * 0.47)
        .closePath()
        .fill(0x637896);
    g.moveTo(r * 0.36, -r * 0.12)
        .bezierCurveTo(r * 0.58, -r * 0.43, r * 0.83, -r * 0.39, r * 0.97, -r * 0.11)
        .bezierCurveTo(r * 0.94, r * 0.15, r * 0.77, r * 0.18, r * 0.69, r * 0.4)
        .bezierCurveTo(r * 0.51, r * 0.64, r * 0.49, r * 0.86, r * 0.28, r * 0.84)
        .bezierCurveTo(r * 0.13, r * 0.59, r * 0.42, r * 0.43, r * 0.33, r * 0.2)
        .bezierCurveTo(r * 0.25, r * 0.05, r * 0.26, -r * 0.02, r * 0.36, -r * 0.12)
        .closePath()
        .fill(0xbdaa85);
    // Large old impact basin with softened concentric shelves.
    g.ellipse(-r * 0.37, -r * 0.4, r * 0.3, r * 0.255).fill(0xd6be8e);
    g.ellipse(-r * 0.36, -r * 0.41, r * 0.248, r * 0.207).fill(0xb4a38b);
    g.ellipse(-r * 0.37, -r * 0.43, r * 0.205, r * 0.168).fill(0xc7b797);
    g.ellipse(-r * 0.4, -r * 0.47, r * 0.15, r * 0.12).fill(0xd5c6a6);
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        g.beginPath()
            .arc(-r * 0.37, -r * 0.4, r * 0.275, angle + 0.06, angle + 0.37)
            .stroke({ color: 0x9d947f, width: r * 0.012, alpha: 0.5, cap: 'round' });
    }
    const crater = (x: number, y: number, size: number, bright = false) => {
        g.ellipse(x * r, (y + 0.012) * r, size * r * 1.1, size * r * 0.92).fill(
            bright ? 0xc8d7d1 : 0xd0c2a4,
        );
        g.ellipse(x * r, y * r, size * r, size * r * 0.82).fill(0x626b80);
        g.ellipse((x + 0.007) * r, (y + 0.01) * r, size * r * 0.72, size * r * 0.55).fill(
            bright ? 0x91adb6 : 0x9e9c96,
        );
        if (size > 0.065)
            g.ellipse(x * r, (y - 0.005) * r, size * r * 0.17, size * r * 0.14).fill(0xbfc4bd);
    };
    const rng = random(731109);
    for (let i = 0; i < 65; i++) {
        const x = (rng() - 0.5) * 1.9,
            y = (rng() - 0.5) * 1.9,
            size = 0.012 + rng() * 0.023;
        if (x * x + y * y < 0.92 && Math.hypot(x + 0.37, y + 0.4) > 0.22) crater(x, y, size);
    }
    for (const [x, y, size] of [
        [-0.72, -0.15, 0.07],
        [-0.54, 0.16, 0.06],
        [-0.26, 0.34, 0.085],
        [0.67, 0.31, 0.08],
        [0.38, 0.71, 0.055],
        [-0.58, 0.62, 0.049],
        [0.05, -0.68, 0.045],
    ])
        crater(x, y, size);
    // Fresh impacts carry irregular ejecta fans, not an atmospheric glow.
    for (const [x, y, size, reach] of [
        [0.25, 0.03, 0.065, 0.38],
        [0.52, -0.42, 0.047, 0.28],
        [-0.1, 0.61, 0.045, 0.25],
    ]) {
        for (let i = 0; i < 11; i++) {
            const angle = (i * Math.PI * 2) / 11 + 0.14;
            const length = reach * (0.62 + rng() * 0.38);
            const sx = x + Math.cos(angle) * size,
                sy = y + Math.sin(angle) * size * 0.85;
            const ex = x + Math.cos(angle) * length,
                ey = y + Math.sin(angle) * length * 0.8;
            g.moveTo(sx * r, sy * r)
                .quadraticCurveTo(
                    (sx + ex) * r * 0.5,
                    (sy + ey) * r * 0.5 - r * 0.025,
                    ex * r,
                    ey * r,
                )
                .stroke({
                    color: 0xb8d6d5,
                    width: r * (i % 3 === 0 ? 0.02 : 0.009),
                    alpha: 0.55,
                    cap: 'round',
                });
        }
        g.ellipse(x * r, y * r, size * r * 1.65, size * r * 1.35).fill({
            color: 0xc7ded6,
            alpha: 0.25,
        });
        crater(x, y, size, true);
    }
    // Small escarpments break up the smooth plains without covering the silhouettes.
    g.moveTo(-r * 0.25, -r * 0.02)
        .bezierCurveTo(-r * 0.08, -r * 0.17, r * 0.06, -r * 0.12, r * 0.08, -r * 0.27)
        .moveTo(r * 0.41, r * 0.3)
        .bezierCurveTo(r * 0.57, r * 0.2, r * 0.51, r * 0.09, r * 0.65, r * 0.04)
        .stroke({ color: 0x606a80, width: r * 0.015, alpha: 0.65, cap: 'round' });
}
