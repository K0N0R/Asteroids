import { Graphics } from 'pixi.js';

export const URANUS_RING_TILT = 0.52;

/** Narrow projected ring strands, split around the opaque globe. */
export function uranusRingHalf(r: number, front: boolean) {
    const g = new Graphics();
    g.label = front ? 'uranus-rings-front' : 'uranus-rings-back';
    g.rotation = URANUS_RING_TILT;
    const start = front ? 0 : Math.PI;
    for (const [radius, color, width, alpha] of [
        [1.65, 0x668e9f, 0.007, 0.55],
        [1.72, 0xc0dadd, 0.008, 0.7],
        [1.8, 0x85b8c4, 0.005, 0.55],
    ]) {
        for (let i = 0; i <= 100; i++) {
            const angle = start + (i / 100) * Math.PI;
            const x = Math.cos(angle) * radius * r;
            const y = Math.sin(angle) * radius * r * 0.1;
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
        }
        g.stroke({ color, width: width * r, alpha, cap: 'round' });
    }
    return g;
}

/** Soft cyan atmosphere with broad arcs and a pale polar region. */
export function drawUranusAtmosphere(g: Graphics, r: number) {
    g.circle(0, 0, r).fill(0x53b6cb);
    g.ellipse(-r * 0.2, -r * 0.23, r * 0.95, r * 0.93).fill(0x76c9d5);
    g.ellipse(-r * 0.3, -r * 0.5, r * 0.74, r * 0.45).fill(0x9ddce2);
    g.ellipse(-r * 0.32, -r * 0.67, r * 0.49, r * 0.25).fill(0xb9e8e9);
    g.ellipse(-r * 0.36, -r * 0.74, r * 0.32, r * 0.12).fill(0xceeff0);
    const band = (y: number, thickness: number, color: number) => {
        g.moveTo(-r * 1.1, r * (y - 0.1))
            .bezierCurveTo(
                -r * 0.57,
                r * (y + 0.12),
                r * 0.4,
                r * (y + 0.13),
                r * 1.1,
                r * (y - 0.12),
            )
            .lineTo(r * 1.1, r * (y - 0.12 + thickness))
            .bezierCurveTo(
                r * 0.42,
                r * (y + 0.11 + thickness),
                -r * 0.57,
                r * (y + 0.11 + thickness),
                -r * 1.1,
                r * (y - 0.1 + thickness),
            )
            .closePath()
            .fill(color);
    };
    band(-0.46, 0.12, 0x8ed5df);
    band(-0.25, 0.045, 0xa6e1e5);
    band(-0.05, 0.19, 0x6ac3d3);
    band(0.2, 0.065, 0x8ed5df);
    band(0.39, 0.13, 0x50aec7);
    band(0.64, 0.055, 0x79c7d7);
    band(0.8, 0.12, 0x4a9fb9);
    for (const [x, y, length] of [
        [-0.52, -0.18, 0.45],
        [0.16, 0.28, 0.35],
        [-0.46, 0.55, 0.32],
    ]) {
        g.moveTo(x * r, y * r)
            .bezierCurveTo(
                (x + length * 0.3) * r,
                (y + 0.045) * r,
                (x + length * 0.8) * r,
                (y + 0.035) * r,
                (x + length) * r,
                (y - 0.005) * r,
            )
            .stroke({ color: 0xbce9eb, width: r * 0.016, alpha: 0.45, cap: 'round' });
    }
}
