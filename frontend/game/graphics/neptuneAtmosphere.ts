import { Graphics } from 'pixi.js';

/** Deep blue cloud deck with bright jet streams and an asymmetric storm complex. */
export function drawNeptuneAtmosphere(g: Graphics, r: number) {
    g.circle(0, 0, r).fill(0x24489f);
    g.ellipse(-r * 0.2, -r * 0.22, r * 0.94, r * 0.94).fill(0x3263ba);
    const curve = (x: number, y: number, wave: number, phase: number) =>
        y + x * x * 0.055 + Math.sin(x * 8 + phase) * wave + Math.sin(x * 23 - phase) * wave * 0.3;
    const band = (y: number, thickness: number, color: number, phase: number) => {
        g.beginPath();
        for (let i = 0; i <= 90; i++) {
            const x = -1.1 + (i * 2.2) / 90;
            const py = curve(x, y, 0.018, phase);
            if (i === 0) g.moveTo(x * r, py * r);
            else g.lineTo(x * r, py * r);
        }
        for (let i = 90; i >= 0; i--) {
            const x = -1.1 + (i * 2.2) / 90;
            g.lineTo(x * r, curve(x, y + thickness, 0.014, phase + 0.8) * r);
        }
        g.closePath().fill(color);
    };
    band(-1.1, 0.25, 0x283e89, 1);
    band(-0.79, 0.1, 0x4977c7, 2);
    band(-0.62, 0.16, 0x2a4b9f, 0);
    band(-0.44, 0.075, 0x6794d7, 1);
    band(-0.28, 0.14, 0x274a9e, 2);
    band(-0.08, 0.25, 0x3c6cc1, 0);
    band(0.28, 0.22, 0x244293, 2);
    band(0.57, 0.055, 0x658dd0, 1);
    band(0.7, 0.2, 0x294593, 0);

    const jet = (y: number, wave: number, width: number, color: number, phase = 0) => {
        g.beginPath();
        for (let i = 0; i <= 130; i++) {
            const x = -1.1 + (i * 2.2) / 130;
            const py = curve(x, y, wave, phase);
            if (i === 0) g.moveTo(x * r, py * r);
            else g.lineTo(x * r, py * r);
        }
        g.stroke({ color, width: r * width, alpha: 0.85, cap: 'round', join: 'round' });
    };
    jet(-0.38, 0.014, 0.029, 0xb2c9ed, 1);
    jet(-0.25, 0.009, 0.01, 0xd0def1, 2);
    jet(0.59, 0.013, 0.025, 0xacc5e9, 1);
    jet(0.84, 0.012, 0.01, 0x7c9cd6);

    // A smaller high-latitude swirl with a pale trailing ribbon.
    g.beginPath()
        .moveTo(-r * 0.84, -r * 0.57)
        .bezierCurveTo(-r * 0.6, -r * 0.6, -r * 0.64, -r * 0.72, -r * 0.39, -r * 0.65)
        .bezierCurveTo(-r * 0.29, -r * 0.6, -r * 0.49, -r * 0.56, -r * 0.55, -r * 0.63)
        .stroke({ color: 0x9bb8e7, width: r * 0.019, cap: 'round' });

    // Bright cloud fronts peel away from the storm into an irregular wake.
    g.beginPath()
        .moveTo(-r * 0.94, r * 0.04)
        .bezierCurveTo(-r * 0.69, r * 0.13, -r * 0.63, -r * 0.07, -r * 0.46, r * 0.08)
        .bezierCurveTo(-r * 0.33, r * 0.27, -r * 0.17, -r * 0.13, r * 0.16, -r * 0.05)
        .bezierCurveTo(r * 0.54, -r * 0.15, r * 0.52, r * 0.18, r * 0.98, r * 0.18)
        .stroke({ color: 0x7197d9, width: r * 0.09, cap: 'round' });
    g.beginPath()
        .moveTo(-r * 0.91, r * 0.2)
        .bezierCurveTo(-r * 0.56, r * 0.13, -r * 0.36, r * 0.38, -r * 0.13, r * 0.3)
        .bezierCurveTo(r * 0.26, r * 0.51, r * 0.63, r * 0.28, r * 0.98, r * 0.34)
        .stroke({ color: 0x86a9e0, width: r * 0.035, cap: 'round' });
    g.beginPath()
        .moveTo(-r * 0.67, r * 0.02)
        .bezierCurveTo(-r * 0.43, -r * 0.03, -r * 0.44, r * 0.19, -r * 0.25, r * 0.17)
        .bezierCurveTo(-r * 0.4, r * 0.31, -r * 0.05, r * 0.31, -r * 0.05, r * 0.38)
        .stroke({ color: 0xb4c8ea, width: r * 0.014, cap: 'round' });

    const x = 0.28,
        y = 0.13;
    g.beginPath()
        .ellipse(x * r, y * r, r * 0.335, r * 0.173)
        .fill(0x537cc4);
    g.ellipse((x - 0.012) * r, (y - 0.012) * r, r * 0.29, r * 0.141).fill(0x96b2e2);
    g.ellipse(x * r, y * r, r * 0.249, r * 0.112).fill(0x486ab4);
    g.ellipse((x - 0.02) * r, y * r, r * 0.194, r * 0.077).fill(0x1d347a);
    g.beginPath();
    for (let i = 0; i <= 110; i++) {
        const t = i / 110,
            angle = t * Math.PI * 4.5;
        const px = (x - 0.025 + Math.cos(angle) * t * 0.267) * r;
        const py = (y + Math.sin(angle) * t * 0.12) * r;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
    }
    g.stroke({ color: 0xb6c9ee, width: r * 0.013, alpha: 0.8, cap: 'round', join: 'round' });
    g.beginPath()
        .moveTo(-r * 0.13, r * 0.3)
        .bezierCurveTo(r * 0.14, r * 0.45, r * 0.58, r * 0.38, r * 0.7, r * 0.24)
        .stroke({ color: 0x7597d4, width: r * 0.013, cap: 'round' });
}
