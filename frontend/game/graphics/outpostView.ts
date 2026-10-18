import { Container, Graphics } from 'pixi.js';
import { OUTPOST } from '../config';
import { C } from './shapes';
import { roundedPanel, visor } from './shipHull';

export function outpostView() {
    const view = new Container();
    const g = new Graphics();
    view.addChild(g);
    const points: number[] = [];
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        points.push(Math.cos(a) * OUTPOST.radius, Math.sin(a) * OUTPOST.radius);
    }
    roundedPanel(g, points, 9, 0x555761, 0x96939b);
    g.circle(0, 0, 83).stroke({ color: 0x323e49, width: 17 });
    g.circle(0, 0, 85).stroke({ color: 0x9c9099, width: 1 });
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = Math.cos(a) * 75,
            y = Math.sin(a) * 75;
        g.moveTo(x * 0.4, y * 0.4)
            .lineTo(x, y)
            .stroke({ color: 0x4c545b, width: 10 });
        const pod = new Graphics();
        pod.roundRect(-17, -13, 34, 26, 5).fill(0x77717a);
        pod.roundRect(-12, -9, 24, 7, 2).fill(0x96909a);
        pod.roundRect(-10, 3, 20, 5, 1).fill(0x353d48);
        pod.circle(10, -5, 2).fill(0xd09c8a);
        pod.position.set(x, y);
        pod.rotation = a;
        view.addChild(pod);
    }
    g.circle(0, 0, 49).fill(0x353e4a);
    g.poly([-25, -15, 0, -29, 25, -15, 25, 15, 0, 29, -25, 15]).fill(0x736671);
    visor(g, 0, -7, 24, 16);
    g.roundRect(-15, 18, 30, 5, 2).fill(0xcb9b89);
    // A narrow service cable leads to the exposed remote terminal, outside the solid hull.
    g.moveTo(100, -7)
        .lineTo(OUTPOST.terminalDistance - 24, -7)
        .moveTo(100, 7)
        .lineTo(OUTPOST.terminalDistance - 24, 7)
        .stroke({ color: C.line, width: 2, alpha: 0.6 });
    g.roundRect(OUTPOST.terminalDistance - 24, -20, 48, 40, 5).fill(0x61727a);
    g.roundRect(OUTPOST.terminalDistance - 16, -12, 32, 24, 3).fill(0x283b49);
    g.roundRect(OUTPOST.terminalDistance - 10, -7, 20, 8, 2).fill(0x9ccfe3);
    g.circle(OUTPOST.terminalDistance, 8, 2).fill(C.mint);
    return view;
}
