import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Graphics, GraphicsContext } from 'pixi.js';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';

test('mission and UI cleanup releases owned graphics contexts exactly once', () => {
    let destroyed = 0;
    const root = new Container(),
        group = new Container();
    root.addChild(group);
    const views = Array.from({ length: 20 }, () => new Graphics().circle(0, 0, 5).fill(0xffffff));
    for (const view of views) {
        view.context.on('destroy', () => destroyed++);
        group.addChild(view);
    }
    destroyDisplayTree(root);
    assert.equal(destroyed, 20);
    assert.ok(root.destroyed && group.destroyed && views.every((view) => view.destroyed));
    destroyDisplayTree(root);
    assert.equal(destroyed, 20);
});

test('removing a tree preserves shared rock contexts until their library disposes them', () => {
    const context = new GraphicsContext().circle(0, 0, 5).fill(0xffffff);
    let destroyed = 0;
    context.on('destroy', () => destroyed++);
    const root = new Container();
    root.addChild(new Graphics(context), new Graphics(context));
    destroyDisplayTree(root);
    assert.equal(destroyed, 0);
    const next = new Graphics(context);
    assert.equal(next.width, 10);
    destroyDisplayTree(next);
    assert.equal(destroyed, 0);
    context.destroy();
    assert.equal(destroyed, 1);
});
