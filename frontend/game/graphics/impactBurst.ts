import { Graphics } from 'pixi.js';

/** One short-lived mesh per impact, released by the existing particle lifecycle. */
export function impactBurst(shield: boolean, radius: number) {
    const g = new Graphics();
    if (shield) {
        g.circle(0, 0, radius).stroke({ color: 0xa5edf4, width: 2.5, alpha: 0.8 });
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            g.beginPath()
                .arc(0, 0, radius * 0.75, angle, angle + 0.7)
                .stroke({ color: 0x65bddf, width: 5, alpha: 0.38 });
        }
    } else {
        g.circle(0, 0, radius)
            .fill({ color: 0xf0a64e, alpha: 0.07 })
            .stroke({ color: 0xffcc91, width: 3, alpha: 0.8 });
        g.circle(0, 0, radius * 0.4).fill({ color: 0xffefce, alpha: 0.16 });
        for (let i = 0; i < 7; i++) {
            const angle = (i * Math.PI * 2) / 7;
            g.moveTo(Math.cos(angle) * radius * 0.55, Math.sin(angle) * radius * 0.55)
                .lineTo(Math.cos(angle) * radius * 0.85, Math.sin(angle) * radius * 0.85)
                .stroke({ color: 0xf4b780, width: 2, alpha: 0.5, cap: 'round' });
        }
    }
    return g;
}
