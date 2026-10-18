import { Container, Graphics } from 'pixi.js';
import { C } from '../graphics/shapes';
import { label } from './primitives';
export function hudLabel(
    parent: Container,
    text: string,
    x: number,
    y: number,
    size = 16,
    color: number = C.text,
    wrapWidth?: number,
) {
    return label(parent, text, x, y, size, color, wrapWidth);
}

export function keyHint(
    parent: Container,
    key: string,
    text: string,
    x: number,
    y: number,
    width = 30,
) {
    const view = new Container();
    view.position.set(x, y);
    view.addChild(
        new Graphics()
            .roundRect(0, 0, width, 27, 8)
            .fill({ color: C.ink, alpha: 0.94 })
            .stroke({ color: C.muted, width: 1, alpha: 0.45 }),
    );
    hudLabel(view, key, 7, 6, 13, C.text);
    hudLabel(view, text, width + 8, 6, 14, C.muted);
    parent.addChild(view);
    return view;
}

export function mouseHint(
    parent: Container,
    button: 'left' | 'right' | null,
    text: string,
    x: number,
    y: number,
) {
    const view = new Container(),
        g = new Graphics();
    view.position.set(x, y);
    g.roundRect(0, 0, 18, 26, 8)
        .fill({ color: C.ink, alpha: 0.94 })
        .stroke({ color: C.muted, width: 1 });
    if (button) g.roundRect(button === 'left' ? 2 : 10, 3, 6, 9, 2).fill(C.mint);
    g.moveTo(9, 2).lineTo(9, 13).stroke({ color: C.muted, width: 1 });
    view.addChild(g);
    hudLabel(view, text, 26, 6, 14, C.muted);
    parent.addChild(view);
}

export function objectiveMark(g: Graphics, x: number, y: number, complete: boolean) {
    if (complete)
        g.moveTo(x - 6, y)
            .lineTo(x - 1, y + 5)
            .lineTo(x + 8, y - 6)
            .stroke({ color: C.mint, width: 2 });
    else g.beginPath().circle(x, y, 6).stroke({ color: C.muted, width: 1, alpha: 0.65 });
}
