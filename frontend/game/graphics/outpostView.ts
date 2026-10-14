import { Container, Graphics } from 'pixi.js';
import { OUTPOST } from '../config';
import { C } from './shapes';

export function outpostView() {
    const view = new Container();
    const g = new Graphics();
    const points: number[] = [];
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        points.push(Math.cos(a) * OUTPOST.radius, Math.sin(a) * OUTPOST.radius);
    }
    g.poly(points).fill(0x252d36).stroke({ color: 0x737373, width: 6 });
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = Math.cos(a) * 75,
            y = Math.sin(a) * 75;
        g.moveTo(x * 0.4, y * 0.4)
            .lineTo(x, y)
            .stroke({ color: 0x4c545b, width: 10 });
        g.circle(x, y, 6).fill(C.red);
    }
    g.circle(0, 0, 49).fill(C.ink).stroke({ color: C.red, width: 3 });
    g.poly([-25, -15, 0, -29, 25, -15, 25, 15, 0, 29, -25, 15])
        .fill(0x413136)
        .stroke({ color: C.red, width: 2 });
    g.rect(-12, -3, 24, 6).fill(C.red);
    // A narrow service cable leads to the exposed remote terminal, outside the solid hull.
    g.moveTo(100, -7)
        .lineTo(OUTPOST.terminalDistance - 24, -7)
        .moveTo(100, 7)
        .lineTo(OUTPOST.terminalDistance - 24, 7)
        .stroke({ color: C.line, width: 2, alpha: 0.6 });
    g.roundRect(OUTPOST.terminalDistance - 24, -20, 48, 40, 5)
        .fill(C.ink)
        .stroke({ color: C.gold, width: 2 });
    g.rect(OUTPOST.terminalDistance - 14, -9, 28, 18).fill(0x38423a);
    g.rect(OUTPOST.terminalDistance - 9, -3, 18, 6).fill(C.mint);
    view.addChild(g);
    return view;
}
