import { Graphics } from 'pixi.js';

/** Closed rounded landform, in unit-radius atlas coordinates. */
function patch(g: Graphics, r: number, points: readonly number[], color: number) {
    const n = points.length / 2;
    g.moveTo(
        ((points[0] + points[points.length - 2]) / 2) * r,
        ((points[1] + points[points.length - 1]) / 2) * r,
    );
    for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        g.quadraticCurveTo(
            points[i * 2] * r,
            points[i * 2 + 1] * r,
            ((points[i * 2] + points[next * 2]) / 2) * r,
            ((points[i * 2 + 1] + points[next * 2 + 1]) / 2) * r,
        );
    }
    g.closePath().fill(color);
}

/** Stylised Mars atlas: broad rust plains, volcanic shields, canyon and polar ice. */
export function drawMarsTerrain(g: Graphics, r: number) {
    g.circle(0, 0, r).fill(0xc96843);
    g.ellipse(-r * 0.2, -r * 0.23, r * 0.91, r * 0.9).fill(0xe68a52);
    patch(
        g,
        r,
        [
            -1, -0.23, -0.84, -0.64, -0.48, -0.91, -0.17, -0.77, 0.19, -0.84, 0.4, -0.61, 0.27,
            -0.34, 0.01, -0.16, -0.15, 0.13, -0.52, 0.17, -0.68, -0.12,
        ],
        0xf0a965,
    );
    patch(
        g,
        r,
        [
            -1, 0.11, -0.71, -0.03, -0.58, 0.27, -0.29, 0.2, -0.08, 0.38, -0.22, 0.59, -0.08, 0.82,
            -0.38, 1, -0.67, 0.72, -0.94, 0.63,
        ],
        0xd77b4c,
    );
    patch(
        g,
        r,
        [
            0.22, -0.8, 0.56, -0.85, 0.83, -0.56, 0.68, -0.24, 0.89, 0.02, 0.61, 0.22, 0.45, 0.06,
            0.19, 0.18, 0.08, -0.08, 0.29, -0.29, 0.08, -0.56,
        ],
        0xb85c3f,
    );
    patch(
        g,
        r,
        [
            0.46, -0.63, 0.72, -0.51, 0.61, -0.25, 0.8, -0.04, 0.58, 0.08, 0.43, -0.11, 0.49, -0.29,
            0.32, -0.49,
        ],
        0xa7513a,
    );
    patch(
        g,
        r,
        [
            -0.14, 0.53, 0.12, 0.39, 0.35, 0.54, 0.55, 0.47, 0.81, 0.66, 0.65, 0.89, 0.36, 1, 0.17,
            0.8, -0.11, 0.92, -0.35, 0.72,
        ],
        0xb25a40,
    );
    patch(g, r, [-0.93, 0.51, -0.73, 0.42, -0.53, 0.58, -0.61, 0.82, -0.87, 0.73], 0x974d3c);
    // A broad impact basin, with nested flat tones rather than random crater noise.
    g.ellipse(r * 0.51, r * 0.42, r * 0.23, r * 0.17).fill(0xdc8e5c);
    g.ellipse(r * 0.5, r * 0.4, r * 0.17, r * 0.12).fill(0xe7a16a);
    // Volcanic shields remain legible both on the small map and at flight scale.
    for (const [x, y, size] of [
        [-0.5, -0.28, 0.12],
        [-0.27, -0.08, 0.065],
        [-0.14, 0.04, 0.054],
        [-0.02, 0.14, 0.047],
    ]) {
        g.ellipse(x * r, y * r, size * r, size * r * 0.75).fill(0xeab080);
        g.ellipse((x + 0.015) * r, (y + 0.018) * r, size * r * 0.65, size * r * 0.45).fill(
            0xc3704c,
        );
        g.ellipse((x + 0.025) * r, (y + 0.015) * r, size * r * 0.29, size * r * 0.21).fill(
            0x854737,
        );
    }
    // Long branching canyon, drawn as inset shelves and an irregular dark floor.
    const canyon = [
        -0.53, 0.22, -0.33, 0.17, -0.15, 0.23, 0.02, 0.2, 0.18, 0.29, 0.42, 0.27, 0.66, 0.4, 0.49,
        0.45, 0.27, 0.39, 0.11, 0.4, -0.1, 0.32, -0.3, 0.32,
    ];
    patch(g, r, canyon, 0xe6a06d);
    patch(
        g,
        r,
        [
            -0.54, 0.23, -0.3, 0.22, -0.13, 0.27, 0.02, 0.26, 0.22, 0.34, 0.44, 0.32, 0.65, 0.4,
            0.43, 0.42, 0.21, 0.38, 0.08, 0.36, -0.15, 0.3, -0.35, 0.28,
        ],
        0x9a4c37,
    );
    g.moveTo(-r * 0.33, r * 0.24)
        .bezierCurveTo(-r * 0.28, r * 0.11, -r * 0.2, r * 0.14, -r * 0.23, r * 0.02)
        .moveTo(r * 0.2, r * 0.35)
        .bezierCurveTo(r * 0.24, r * 0.22, r * 0.31, r * 0.24, r * 0.28, r * 0.12)
        .stroke({ color: 0x9a4c37, width: r * 0.022, cap: 'round' });
    for (const [x, y, size] of [
        [-0.8, -0.02, 0.042],
        [-0.62, 0.58, 0.036],
        [0.03, -0.56, 0.03],
        [0.76, 0.15, 0.04],
        [-0.28, 0.7, 0.025],
    ]) {
        g.ellipse(x * r, y * r, size * r, size * r * 0.8).fill(0xe5a16b);
        g.ellipse((x + 0.008) * r, (y + 0.009) * r, size * r * 0.65, size * r * 0.52).fill(
            0xb46b4c,
        );
    }
    patch(
        g,
        r,
        [
            -0.38, -0.94, -0.2, -1.03, 0.08, -1.02, 0.28, -0.97, 0.18, -0.88, -0.02, -0.86, -0.16,
            -0.9,
        ],
        0xe6ddc9,
    );
    patch(
        g,
        r,
        [-0.29, -0.97, -0.12, -1.04, 0.12, -1.02, 0.19, -0.97, 0.06, -0.92, -0.1, -0.91],
        0xf5ebd4,
    );
    patch(g, r, [-0.13, 0.97, 0.02, 0.91, 0.18, 0.97, 0.08, 1.06, -0.08, 1.04], 0xe6d7bf);
}
