import { Graphics } from 'pixi.js';
import { random } from '../worlds/sector';

/** Reusable cratered dwarf-planet illustration; deliberately independent of sector layout. */
export function drawCeresTerrain(g: Graphics, r: number) {
    g.circle(0, 0, r).fill(0x858b96);
    g.ellipse(-r * 0.18, -r * 0.18, r * 0.93, r * 0.9).fill(0xa7aaa8);
    g.ellipse(-r * 0.3, -r * 0.51, r * 0.62, r * 0.43).fill(0xbab8ac);
    g.ellipse(r * 0.46, -r * 0.17, r * 0.53, r * 0.56).fill(0x949b9e);
    g.ellipse(-r * 0.27, r * 0.49, r * 0.72, r * 0.46).fill(0x92999e);
    g.beginPath()
        .moveTo(-r * 0.92, r * 0.16)
        .bezierCurveTo(-r * 0.64, -r * 0.03, -r * 0.44, r * 0.15, -r * 0.26, -r * 0.03)
        .bezierCurveTo(r * 0.01, -r * 0.21, r * 0.16, r * 0.11, r * 0.4, r * 0.03)
        .bezierCurveTo(r * 0.67, -r * 0.03, r * 0.63, r * 0.26, r * 0.84, r * 0.36)
        .bezierCurveTo(r * 0.59, r * 0.63, r * 0.38, r * 0.33, r * 0.16, r * 0.4)
        .bezierCurveTo(-r * 0.17, r * 0.53, -r * 0.25, r * 0.28, -r * 0.58, r * 0.42)
        .bezierCurveTo(-r * 0.77, r * 0.49, -r * 0.88, r * 0.33, -r * 0.92, r * 0.16)
        .closePath()
        .fill(0x8b939d);

    const crater = (x: number, y: number, size: number, bright = false) => {
        g.ellipse(x * r, (y + 0.015) * r, size * r * 1.1, size * r * 0.96).fill(0x717b8a);
        g.ellipse(x * r, y * r, size * r, size * r * 0.86).fill(bright ? 0xb8c5cb : 0xc0bfb3);
        g.ellipse((x + 0.006) * r, (y - 0.007) * r, size * r * 0.8, size * r * 0.66).fill(
            bright ? 0x667a92 : 0x7d8792,
        );
        g.ellipse((x + 0.022) * r, (y + 0.018) * r, size * r * 0.6, size * r * 0.45).fill(
            bright ? 0x8098ac : 0x9ba09f,
        );
        if (size > 0.12 && !bright)
            g.ellipse((x + 0.01) * r, (y + 0.005) * r, size * r * 0.14, size * r * 0.11).fill(
                0xbbbdba,
            );
    };
    for (const [x, y, size] of [
        [-0.53, -0.56, 0.13],
        [0.04, -0.61, 0.15],
        [0.47, -0.4, 0.125],
        [-0.64, 0.08, 0.16],
        [0.3, 0.17, 0.13],
        [-0.34, 0.48, 0.17],
        [0.53, 0.55, 0.12],
        [0.05, 0.72, 0.085],
    ])
        crater(x, y, size);
    const rng = random(116950);
    for (let i = 0; i < 50; i++) {
        const x = (rng() - 0.5) * 1.88,
            y = (rng() - 0.5) * 1.88;
        if (x * x + y * y > 0.88 || Math.hypot(x + 0.13, y + 0.12) < 0.25) continue;
        crater(x, y, 0.014 + rng() * 0.035);
    }
    // The bright deposits form several irregular patches inside one dark basin.
    crater(-0.13, -0.12, 0.18, true);
    g.beginPath()
        .poly([
            -0.185 * r,
            -0.145 * r,
            -0.151 * r,
            -0.176 * r,
            -0.132 * r,
            -0.15 * r,
            -0.101 * r,
            -0.156 * r,
            -0.082 * r,
            -0.12 * r,
            -0.11 * r,
            -0.097 * r,
            -0.11 * r,
            -0.065 * r,
            -0.147 * r,
            -0.077 * r,
            -0.17 * r,
            -0.062 * r,
            -0.194 * r,
            -0.103 * r,
        ])
        .fill(0xeff2e6);
    g.beginPath()
        .poly([
            -0.059 * r,
            -0.119 * r,
            -0.029 * r,
            -0.133 * r,
            -0.009 * r,
            -0.108 * r,
            -0.026 * r,
            -0.085 * r,
            -0.057 * r,
            -0.09 * r,
        ])
        .fill(0xd5e4e3);
    g.ellipse(-r * 0.143, -r * 0.118, r * 0.022, r * 0.031).fill(0xffffff);
    g.ellipse(-r * 0.044, -r * 0.103, r * 0.011, r * 0.014).fill(0xf7f6e9);
    // Low-contrast ridges and fractured terrain suggest relief without a noise texture.
    g.beginPath()
        .moveTo(-r * 0.73, r * 0.35)
        .bezierCurveTo(-r * 0.59, r * 0.28, -r * 0.61, r * 0.17, -r * 0.45, r * 0.2)
        .moveTo(r * 0.1, r * 0.49)
        .bezierCurveTo(r * 0.18, r * 0.37, r * 0.37, r * 0.49, r * 0.42, r * 0.35)
        .moveTo(r * 0.46, -r * 0.12)
        .bezierCurveTo(r * 0.62, -r * 0.07, r * 0.59, r * 0.06, r * 0.75, r * 0.04)
        .stroke({ color: 0xc2c5bc, width: r * 0.012, alpha: 0.55, cap: 'round' });
}
