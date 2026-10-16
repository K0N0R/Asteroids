import { destroyDisplayTree } from '../../core/systems/destroyDisplayTree';
import { uiCue } from '../systems/audio';
import { Container, Graphics, TextStyle } from 'pixi.js';
import { Typography } from '../../core/containers/components/typography';
import { Button } from '../../core/containers/components/button';
import { C } from '../graphics/shapes';

export function label(
    parent: Container,
    text: string,
    x: number,
    y: number,
    size = 20,
    color: number = C.text,
    wrapWidth?: number,
    styleProps?: Partial<TextStyle>,
) {
    const view = new Typography({
        text,
        size,
        color,
        fontFamily: 'Segoe UI',
        horizontalAlign: 'left',
        verticalAlign: 'top',
        styleProps: {
            ...(wrapWidth ? { wordWrap: true, wordWrapWidth: wrapWidth * 2 } : {}),
            ...styleProps,
        },
    });
    view.position.set(x, y);
    view.eventMode = 'none';
    parent.addChild(view);
    return view;
}
export function panel(parent: Container, x: number, y: number, width: number, height: number) {
    const g = new Graphics()
        .roundRect(x, y, width, height, 12)
        .fill({ color: C.panel, alpha: 0.94 })
        .stroke({ color: C.line, width: 1 });
    parent.addChild(g);
    return g;
}
export function button(
    parent: Container,
    text: string,
    x: number,
    y: number,
    width: number,
    onClick: () => void,
    active = false,
    enabled = true,
    height = 48,
    textSize = 17,
) {
    const textView = new Typography({
        text,
        size: textSize,
        color: active ? C.ink : C.text,
        fontFamily: 'Segoe UI',
    });
    const view = new Button({
        x: x + width / 2,
        y: y + height / 2,
        width,
        height,
        tint: active ? C.mint : 0x173244,
        outlineTint: active ? C.mint : C.line,
        outlineWidth: 1,
        roundness: 7,
        children: [textView],
        onClick: () => {
            if (enabled) {
                uiCue('click');
                onClick();
            }
        },
    });
    view.alpha = enabled ? 1 : 0.38;
    view.eventMode = enabled ? 'passive' : 'none';
    view.box.cursor = enabled ? 'pointer' : 'default';
    parent.addChild(view);
    return view;
}
export function clear(parent: Container) {
    for (const child of parent.removeChildren()) destroyDisplayTree(child);
}
