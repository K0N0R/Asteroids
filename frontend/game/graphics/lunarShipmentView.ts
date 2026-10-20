import { Container, Graphics } from 'pixi.js';
import { C } from './shapes';
/** Sealed construction pallet, visually distinct from damaged spacecraft. */
export function lunarShipmentView() {
    const view = new Container();
    const g = view.addChild(new Graphics());
    g.roundRect(-36, -26, 72, 52, 12).fill(C.raised);
    g.roundRect(-29, -20, 58, 40, 8).fill(C.gold);
    g.roundRect(-16, -25, 8, 50, 3).fill(C.muted);
    g.roundRect(10, -25, 8, 50, 3).fill(C.muted);
    g.roundRect(-11, -12, 22, 24, 6).fill(C.ink);
    g.circle(0, 0, 7).fill(C.mint);
    return view;
}
