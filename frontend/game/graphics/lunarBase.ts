import { Graphics } from 'pixi.js';
import { C } from './shapes';

/** Connected, rounded modules appear only after their equipment has been delivered. */
export function drawLunarBase(g: Graphics, modules: readonly boolean[], stage: number) {
    g.ellipse(0, 30, 320, 230).fill({ color: 0x535774, alpha: 0.3 });
    g.roundRect(-75, -65, 150, 130, 32).fill(0x626983);
    g.circle(0, 0, 42).fill(0x3d4867);
    g.roundRect(-20, -4, 40, 8, 4).fill(C.cyan);
    const dome = (x: number, y: number, radius: number, color: number) => {
        g.ellipse(x + 4, y + 9, radius, radius * 0.8).fill(0x353c5b);
        g.circle(x, y, radius).fill(0xb4c8d8);
        g.circle(x - 4, y - 6, radius * 0.79).fill(color);
        g.roundRect(x - radius * 0.45, y - radius * 0.25, radius * 0.75, 10, 5).fill(0xe0eef0);
    };
    const corridor = (x: number, y: number, w: number, h: number) =>
        g.roundRect(x, y, w, h, 16).fill(0x8fa9bb);
    if (modules[0]) dome(0, 0, 74, 0x80c6d0);
    if (modules[1]) {
        corridor(-185, -15, 150, 35);
        g.roundRect(-260, -70, 150, 145, 60).fill(0xb4c8d8);
        g.roundRect(-248, -60, 126, 120, 48).fill(0x71bda6);
        for (let i = 0; i < 3; i++) g.roundRect(-232 + i * 34, -48, 14, 92, 7).fill(0xa2e1c2);
    }
    if (modules[2]) {
        corridor(-17, -150, 34, 110);
        dome(0, -165, 52, 0x758fe1);
    }
    if (modules[3]) {
        corridor(35, -15, 170, 35);
        dome(190, 0, 48, 0xf2c080);
        for (const side of [-1, 1]) {
            g.roundRect(125, side * 110 - 28, 140, 56, 16).fill(0x405e94);
            for (let i = 0; i < 4; i++)
                g.roundRect(134 + i * 32, side * 110 - 20, 24, 40, 8).fill(0x70c7e0);
        }
    }
    if (modules[4]) {
        corridor(-15, 40, 30, 130);
        dome(0, 160, 62, 0xb4d8e5);
    }
    if (stage >= 1)
        for (const side of [-1, 1]) {
            corridor(side < 0 ? -145 : 10, 130, 130, 26);
            g.roundRect(side * 155 - 28, 110, 56, 100, 28).fill(0xdcc7ac);
            g.roundRect(side * 155 - 18, 123, 36, 72, 18).fill(0xf1d791);
        }
    if (stage >= 2) {
        g.roundRect(-75, 235, 150, 40, 20).fill(0x829eb4);
        g.roundRect(-50, 247, 100, 12, 6).fill(stage >= 3 ? C.mint : C.cyan);
    }
}
