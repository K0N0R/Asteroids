import { Graphics } from 'pixi.js';

/** Layered cloud belts and storms; all geometry is static and clipped by the globe. */
export function drawJupiterAtmosphere(g: Graphics, r: number) {
    g.circle(0, 0, r).fill(0xe7d4b4);
    const latitude = (x: number, y: number, amplitude: number, phase: number) =>
        y +
        x * x * 0.055 +
        Math.sin(x * 7 + phase) * amplitude +
        Math.sin(x * 17 - phase) * amplitude * 0.32;
    const belt = (top: number, bottom: number, color: number, amplitude = 0.018, phase = 0) => {
        for (let i = 0; i <= 80; i++) {
            const x = -1.15 + (i * 2.3) / 80,
                y = latitude(x, top, amplitude, phase);
            if (i === 0) g.moveTo(x * r, y * r);
            else g.lineTo(x * r, y * r);
        }
        for (let i = 80; i >= 0; i--) {
            const x = -1.15 + (i * 2.3) / 80;
            g.lineTo(x * r, latitude(x, bottom, amplitude * 0.85, phase + 0.7) * r);
        }
        g.closePath().fill(color);
    };
    belt(-1.1, -0.74, 0x9f7c68, 0.012);
    belt(-0.76, -0.58, 0xb79276, 0.025, 1);
    belt(-0.59, -0.43, 0xf2e5c9, 0.015, 2);
    belt(-0.44, -0.37, 0xcfa57e, 0.014);
    belt(-0.34, -0.13, 0xb77758, 0.045, 1);
    belt(-0.24, -0.08, 0xcf9170, 0.036, 2);
    belt(-0.09, 0.1, 0xf3e9d1, 0.022);
    belt(0.1, 0.19, 0xd4cfbb, 0.025, 2);
    belt(0.22, 0.43, 0xa96c50, 0.03, 3);
    belt(0.26, 0.38, 0xc38962, 0.025, 1);
    belt(0.43, 0.59, 0xe8ddbf, 0.021, 1);
    belt(0.6, 0.77, 0xb79a80, 0.023, 3);
    belt(0.78, 1.1, 0x927866, 0.014);

    const filament = (
        y: number,
        amplitude: number,
        phase: number,
        color: number,
        width: number,
    ) => {
        for (let i = 0; i <= 140; i++) {
            const x = -1.1 + (i * 2.2) / 140;
            // Folded stream edges, less regular than a plain sinusoidal stripe.
            const px = x + Math.sin(x * 23 + phase) * 0.018;
            const py =
                latitude(x, y, amplitude, phase) + Math.sin(x * 33 + phase) * amplitude * 0.35;
            if (i === 0) g.moveTo(px * r, py * r);
            else g.lineTo(px * r, py * r);
        }
        g.stroke({ color, width: r * width, alpha: 0.8, cap: 'round', join: 'round' });
    };
    filament(-0.25, 0.028, 1, 0xf5dfba, 0.024);
    filament(-0.19, 0.022, 2, 0xeebd96, 0.012);
    filament(0.26, 0.025, 3, 0xf5e5c6, 0.025);
    filament(0.48, 0.012, 1, 0xf8ecd2, 0.012);
    for (const y of [-0.89, -0.81, -0.69, 0.68, 0.83, 0.9])
        filament(y, 0.009, y * 14, 0xd1b69a, 0.008);

    // Small white ovals and trailing cloud curls sit inside the individual belts.
    for (const [x, y, size] of [
        [-0.5, -0.53, 0.045],
        [-0.16, -0.49, 0.029],
        [0.4, -0.5, 0.055],
        [0.68, -0.46, 0.031],
        [-0.49, 0.66, 0.036],
        [0.02, 0.64, 0.055],
        [0.39, 0.69, 0.029],
    ]) {
        g.ellipse(x * r, y * r, size * r * 1.3, size * r * 0.65).fill(0xc2a68c);
        g.ellipse((x - 0.008) * r, (y - 0.008) * r, size * r, size * r * 0.5).fill(0xf5e9cf);
    }
    for (const [x, y] of [
        [-0.63, -0.17],
        [0.53, -0.22],
        [-0.45, 0.31],
    ]) {
        g.moveTo((x - 0.1) * r, y * r)
            .bezierCurveTo(
                (x - 0.03) * r,
                (y - 0.06) * r,
                (x + 0.09) * r,
                (y + 0.07) * r,
                (x + 0.1) * r,
                y * r,
            )
            .bezierCurveTo(
                (x + 0.09) * r,
                (y - 0.045) * r,
                (x + 0.01) * r,
                (y - 0.025) * r,
                (x + 0.025) * r,
                (y + 0.005) * r,
            )
            .stroke({ color: 0xf0d5b1, width: r * 0.016, cap: 'round' });
    }

    // The Great Red Spot bends the surrounding stream instead of floating on a stripe.
    const x = 0.18,
        y = 0.36;
    g.moveTo(-r * 0.4, r * 0.34)
        .bezierCurveTo(-r * 0.14, r * 0.33, -r * 0.17, r * 0.14, r * 0.15, r * 0.16)
        .bezierCurveTo(r * 0.47, r * 0.15, r * 0.49, r * 0.47, r * 0.78, r * 0.43)
        .stroke({ color: 0xf6e6c6, width: r * 0.055, cap: 'round' });
    g.ellipse(x * r, (y + 0.015) * r, r * 0.29, r * 0.158).fill(0xa86e51);
    g.ellipse((x - 0.018) * r, (y - 0.008) * r, r * 0.277, r * 0.145).fill(0xe4b080);
    g.ellipse(x * r, y * r, r * 0.239, r * 0.119).fill(0xc77646);
    g.ellipse((x - 0.015) * r, (y - 0.014) * r, r * 0.196, r * 0.093).fill(0xdf9656);
    g.ellipse((x - 0.03) * r, (y - 0.02) * r, r * 0.128, r * 0.061).fill(0xeaa66a);
    for (let i = 0; i <= 100; i++) {
        const t = i / 100,
            angle = t * Math.PI * 4.5;
        const px = (x - 0.02 + Math.cos(angle) * t * 0.21) * r;
        const py = (y - 0.008 + Math.sin(angle) * t * 0.098) * r;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
    }
    g.stroke({ color: 0xa9603e, width: r * 0.01, alpha: 0.65, cap: 'round', join: 'round' });
    g.moveTo(-r * 0.21, r * 0.46)
        .bezierCurveTo(r * 0.01, r * 0.6, r * 0.42, r * 0.55, r * 0.54, r * 0.45)
        .stroke({ color: 0xf2dfbc, width: r * 0.018, cap: 'round' });
}
