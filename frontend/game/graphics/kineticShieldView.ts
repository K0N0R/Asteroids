import { Graphics } from 'pixi.js';
import type { KineticShield } from '../systems/kineticShield';

export function drawKineticShield(
    g: Graphics,
    shield: KineticShield,
    radius: number,
    time: number,
    level = 0,
) {
    g.clear();
    radius *= 1 + level * 0.08;
    const ratio = shield.charge / shield.profile.capacity,
        flash = shield.flash / 0.35;
    if (ratio <= 0 && flash <= 0) return;
    const alpha = 0.16 + 0.28 * flash,
        color = 0x79baff;
    g.beginPath()
        .circle(0, 0, radius)
        .stroke({ color, width: 10 + level * 2, alpha: alpha * 0.22 })
        .circle(0, 0, radius)
        .stroke({ color, width: 2, alpha: alpha * 0.55 });
    for (let i = 0; i < 12; i++) {
        if (i / 12 >= ratio && flash <= 0) continue;
        const a = (i / 12) * Math.PI * 2 + time * 0.06,
            x = Math.cos(a) * radius,
            y = Math.sin(a) * radius;
        const points = Array.from({ length: 6 }, (_, j) => {
            const angle = (j / 6) * Math.PI * 2;
            return [x + Math.cos(angle) * (9 + level * 2), y + Math.sin(angle) * (9 + level * 2)];
        }).flat();
        g.beginPath()
            .poly(points)
            .fill({ color, alpha: alpha * 0.45 })
            .stroke({ color, width: 1.3, alpha: alpha + flash * 0.2 });
    }
}
