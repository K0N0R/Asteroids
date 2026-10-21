import { Graphics } from 'pixi.js';

export const SATURN_RING_TILT = -0.36;
const RING_FLATTENING = 0.25;

/** Both halves use the same projected annuli; the globe sits between them. */
export function saturnRingHalf(r: number, front: boolean) {
    const g = new Graphics();
    g.label = front ? 'saturn-rings-front' : 'saturn-rings-back';
    g.rotation = SATURN_RING_TILT;
    const start = front ? 0 : Math.PI;
    const point = (radius: number, angle: number) => ({
        x: Math.cos(angle) * radius * r,
        y: Math.sin(angle) * radius * r * RING_FLATTENING,
    });
    const strip = (inner: number, outer: number, color: number, alpha = 1) => {
        const points: number[] = [];
        for (let i = 0; i <= 96; i++) {
            const p = point(outer, start + (i / 96) * Math.PI);
            points.push(p.x, p.y);
        }
        for (let i = 96; i >= 0; i--) {
            const p = point(inner, start + (i / 96) * Math.PI);
            points.push(p.x, p.y);
        }
        g.poly(points).fill({ color, alpha });
    };
    strip(1.2, 1.34, 0x8e877e, 0.65);
    strip(1.35, 1.48, 0xbeb29b);
    strip(1.48, 1.64, 0xe5d8b9);
    strip(1.64, 1.77, 0xf0e5cc);
    // Transparent division between the broad inner and outer ring groups.
    strip(1.85, 1.98, 0xcbbba1);
    strip(1.98, 2.065, 0xe1d1b4);
    strip(2.08, 2.13, 0x9c948e, 0.45);
    const groove = (radius: number, color: number, alpha: number) => {
        for (let i = 0; i <= 96; i++) {
            const p = point(radius, start + (i / 96) * Math.PI);
            if (i === 0) g.moveTo(p.x, p.y);
            else g.lineTo(p.x, p.y);
        }
        g.stroke({ color, alpha, width: r * 0.006 });
    };
    for (const radius of [1.39, 1.44, 1.52, 1.57, 1.61, 1.68, 1.73, 1.89, 1.94, 2.02])
        groove(radius, 0x7c7168, 0.28);
    groove(1.765, 0xfff1d4, 0.75);
    groove(2.06, 0xf5e8cc, 0.65);
    return g;
}

export function drawSaturnAtmosphere(g: Graphics, r: number) {
    g.circle(0, 0, r).fill(0xdfc996);
    const cloudY = (x: number, y: number, wave: number, phase: number) =>
        y + x * x * 0.04 + Math.sin(x * 9 + phase) * wave + Math.sin(x * 22 - phase) * wave * 0.28;
    const band = (top: number, bottom: number, color: number, wave = 0.009, phase = 0) => {
        for (let i = 0; i <= 80; i++) {
            const x = -1.12 + (i * 2.24) / 80;
            const y = cloudY(x, top, wave, phase);
            if (i === 0) g.moveTo(x * r, y * r);
            else g.lineTo(x * r, y * r);
        }
        for (let i = 80; i >= 0; i--) {
            const x = -1.12 + (i * 2.24) / 80;
            g.lineTo(x * r, cloudY(x, bottom, wave * 0.8, phase + 0.4) * r);
        }
        g.closePath().fill(color);
    };
    band(-1.1, -0.76, 0xc0b48e);
    band(-0.77, -0.62, 0xeadcaa, 0.011);
    band(-0.62, -0.51, 0xc2ab7c, 0.014, 1);
    band(-0.5, -0.3, 0xf3e6be, 0.01, 2);
    band(-0.29, -0.18, 0xccb17e, 0.016, 1);
    band(-0.16, 0.06, 0xf2e4b9, 0.013);
    band(0.07, 0.21, 0xc2a16b, 0.018, 2);
    band(0.21, 0.31, 0xd6b981, 0.012, 3);
    band(0.33, 0.51, 0xefe0b3, 0.01);
    band(0.53, 0.65, 0xcab17f, 0.015, 2);
    band(0.67, 0.83, 0xdac79b, 0.009);
    band(0.84, 1.1, 0xb8a17e);
    for (const [y, wave, color] of [
        [-0.55, 0.015, 0x9e8b68],
        [-0.26, 0.019, 0xf6e9c7],
        [0.13, 0.021, 0xf2deb2],
        [0.41, 0.012, 0xffefd1],
        [0.61, 0.013, 0xa78d67],
    ]) {
        for (let i = 0; i <= 100; i++) {
            const x = -1.1 + (i * 2.2) / 100;
            const py = cloudY(x, y, wave, 2) + Math.sin(x * 32) * wave * 0.25;
            if (i === 0) g.moveTo(x * r, py * r);
            else g.lineTo(x * r, py * r);
        }
        g.stroke({ color, width: r * 0.01, alpha: 0.65, cap: 'round', join: 'round' });
    }
    // Restrained storm curls distinguish the softer atmosphere from Jupiter's belts.
    for (const [x, y, size] of [
        [-0.45, -0.25, 0.07],
        [0.32, 0.14, 0.09],
        [-0.16, 0.6, 0.045],
    ]) {
        g.moveTo((x - size * 1.8) * r, y * r)
            .bezierCurveTo(
                (x - size) * r,
                (y - size * 0.45) * r,
                (x + size) * r,
                (y + size * 0.5) * r,
                (x + size) * r,
                y * r,
            )
            .bezierCurveTo(
                (x + size) * r,
                (y - size * 0.4) * r,
                (x - size * 0.2) * r,
                (y - size * 0.3) * r,
                x * r,
                y * r,
            )
            .stroke({ color: 0xf8e7bf, width: r * 0.012, cap: 'round', alpha: 0.8 });
    }
}
