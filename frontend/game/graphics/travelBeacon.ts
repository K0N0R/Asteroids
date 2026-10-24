import { Graphics } from 'pixi.js';
import { C } from './shapes';

/** Landing beacon: orbital tracks around a pad, with four approach lights. */
export function travelBeacon() {
    const g = new Graphics();
    g.circle(0, 0, 112)
        .fill({ color: C.ink, alpha: 0.55 })
        .circle(0, 0, 112)
        .stroke({ color: C.cyan, width: 2, alpha: 0.35 })
        .circle(0, 0, 87)
        .stroke({ color: C.cyan, width: 2, alpha: 0.2 });
    for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        g.beginPath()
            .arc(0, 0, 112, a - 0.14, a + 0.14)
            .stroke({ color: C.mint, width: 6 });
        g.circle(Math.cos(a) * 130, Math.sin(a) * 130, 4).fill(C.mint);
    }
    g.ellipse(0, 18, 47, 17)
        .stroke({ color: C.cyan, width: 3 })
        .moveTo(-32, -29)
        .lineTo(-32, 12)
        .lineTo(32, 12)
        .lineTo(32, -29)
        .moveTo(-32, -9)
        .lineTo(32, -9)
        .stroke({ color: C.mint, width: 5 })
        .circle(0, -48, 5)
        .fill(C.text);
    return g;
}
