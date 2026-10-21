import { Graphics } from 'pixi.js';

/** Opaque cloud deck, drawn in flat layers and clipped by the planet renderer. */
export function drawVenusAtmosphere(g: Graphics, r: number) {
    g.circle(0, 0, r).fill(0xd7ab72);
    g.ellipse(-r * 0.22, -r * 0.21, r * 0.96, r * 0.92).fill(0xe8c592);
    g.ellipse(-r * 0.31, -r * 0.43, r * 0.77, r * 0.52).fill(0xefe0b6);

    // Wide flowing fronts replace the former horizontal stripes.
    const front = (offset: number, thickness: number, color: number) => {
        g.moveTo(-r * 1.2, r * (0.5 + offset))
            .bezierCurveTo(
                -r * 0.72,
                r * (-0.03 + offset),
                -r * 0.25,
                r * (0.2 + offset),
                r * 0.18,
                r * (-0.17 + offset),
            )
            .bezierCurveTo(
                r * 0.62,
                r * (-0.52 + offset),
                r * 0.85,
                r * (-0.14 + offset),
                r * 1.2,
                r * (-0.48 + offset),
            )
            .lineTo(r * 1.2, r * (-0.48 + offset + thickness))
            .bezierCurveTo(
                r * 0.79,
                r * (-0.01 + offset + thickness),
                r * 0.62,
                r * (-0.38 + offset + thickness),
                r * 0.2,
                r * (-0.08 + offset + thickness),
            )
            .bezierCurveTo(
                -r * 0.26,
                r * (0.28 + offset + thickness),
                -r * 0.74,
                r * (0.12 + offset + thickness),
                -r * 1.2,
                r * (0.5 + offset + thickness),
            )
            .closePath()
            .fill(color);
    };
    front(-0.64, 0.23, 0xf4e7c6);
    front(-0.42, 0.1, 0xddbb8b);
    front(-0.28, 0.12, 0xf8edcf);
    front(-0.08, 0.26, 0xd99858);
    front(0.01, 0.1, 0xc28550);
    front(0.22, 0.16, 0xeac18a);
    front(0.45, 0.25, 0xefdbb0);
    front(0.72, 0.1, 0xe0b47d);

    // Narrow cream filaments split and bend around the larger cloud formations.
    for (const [offset, width, alpha] of [
        [-0.52, 0.014, 0.7],
        [-0.29, 0.023, 0.8],
        [-0.2, 0.009, 0.6],
        [0.38, 0.018, 0.7],
        [0.49, 0.009, 0.55],
    ]) {
        g.moveTo(-r * 1.08, r * (0.47 + offset))
            .bezierCurveTo(
                -r * 0.62,
                r * (-0.02 + offset),
                -r * 0.2,
                r * (0.22 + offset),
                r * 0.25,
                r * (-0.18 + offset),
            )
            .bezierCurveTo(
                r * 0.55,
                r * (-0.45 + offset),
                r * 0.86,
                r * (-0.1 + offset),
                r * 1.1,
                r * (-0.42 + offset),
            )
            .stroke({ color: 0xfff2d7, width: r * width, alpha, cap: 'round' });
    }
    const vortex = (x: number, y: number, size: number, turn: number) => {
        g.ellipse(x * r, y * r, size * r * 1.2, size * r * 0.7).fill({
            color: 0xf4e4bc,
            alpha: 0.35,
        });
        for (const [phase, color, width] of [
            [0, 0xf9edcf, 0.025],
            [Math.PI, 0xcfaa77, 0.016],
        ]) {
            for (let i = 0; i <= 70; i++) {
                const t = i / 70,
                    a = phase + turn * t * Math.PI * 3.5;
                const px = (x + Math.cos(a) * size * t) * r,
                    py = (y + Math.sin(a) * size * t * 0.65) * r;
                if (i === 0) g.moveTo(px, py);
                else g.lineTo(px, py);
            }
            g.stroke({ color, width: r * width, alpha: 0.75, cap: 'round', join: 'round' });
        }
    };
    vortex(-0.37, -0.5, 0.19, 1);
    vortex(-0.17, 0.62, 0.23, -1);
    vortex(0.58, -0.47, 0.12, 1);
    g.moveTo(-r * 0.87, -r * 0.35)
        .bezierCurveTo(-r * 0.7, -r * 0.66, -r * 0.34, -r * 0.8, r * 0.02, -r * 0.83)
        .stroke({ color: 0xfff4dc, width: r * 0.023, alpha: 0.6, cap: 'round' });
}
