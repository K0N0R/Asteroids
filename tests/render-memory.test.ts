import { Background } from '../frontend/core/containers/entities/background';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Graphics, TexturePool } from 'pixi.js';
import { releaseSceneBuffers } from '../frontend/core/systems/renderMemory';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
import { CelestialLayer } from '../frontend/game/graphics/celestialLayer';
import { celestialBodiesFor } from '../frontend/game/worlds/celestialBodies';
import { MissionInfoPopup } from '../frontend/game/ui/missionInfo';
test('unchanged scenery reuses existing planet views instead of rebuilding render caches', () => {
    const layer = new CelestialLayer(),
        specs = celestialBodiesFor('mars');
    layer.setBodies(specs);
    const views = [...layer.children];
    for (let i = 0; i < 50; i++) layer.setBodies(JSON.parse(JSON.stringify(specs)));
    assert.deepEqual(layer.children, views);
    assert.ok(views.every((view) => !view.destroyed));
    layer.setBodies(celestialBodiesFor('venus'));
    assert.ok(views.every((view) => view.destroyed));
    destroyDisplayTree(layer);
});
test('scene cleanup releases free render textures without destroying live textures', () => {
    const idle = TexturePool.getOptimalTexture(512, 512),
        live = TexturePool.getOptimalTexture(256, 256);
    TexturePool.returnTexture(idle);
    releaseSceneBuffers();
    assert.ok(idle.destroyed);
    assert.equal(live.destroyed, false);
    TexturePool.returnTexture(live);
    releaseSceneBuffers();
    assert.ok(live.destroyed);
});
test('recursive view destruction releases owned graphic contexts exactly once', () => {
    const root = new Container(),
        g = new Graphics().circle(0, 0, 10).fill(0xffffff);
    let releases = 0;
    g.context.on('destroy', () => releases++);
    root.addChild(g);
    destroyDisplayTree(root);
    destroyDisplayTree(root);
    assert.equal(releases, 1);
});

test('closing the reusable mission panel destroys its buttons and releases their callbacks', () => {
    const popup = new MissionInfoPopup();
    const content = popup.children[0];
    const button = new Graphics().rect(0, 0, 20, 20).fill(0xffffff);
    button.on('pointerdown', () => assert.fail('stale mission callback'));
    content.addChild(button);
    popup.hide();
    assert.equal(content.children.length, 0);
    assert.equal(button.destroyed, true);
    assert.equal(button.listenerCount('pointerdown'), 0);
    assert.equal(popup.destroyed, false);
    popup.hide();
    destroyDisplayTree(popup);
});

test('background releases all four borrowed star contexts after its views are destroyed', () => {
    const bg = new Background();
    const references = new Map<object, number>();
    const visit = (node: Container) => {
        if (node instanceof Graphics)
            references.set(node.context, (references.get(node.context) ?? 0) + 1);
        for (const child of node.children) visit(child);
    };
    visit(bg);
    const shared = [...references]
        .filter(([, count]) => count > 1)
        .map(([context]) => context as Graphics['context']);
    assert.equal(shared.length, 4);
    let freed = 0;
    for (const context of shared) context.once('destroy', () => freed++);
    destroyDisplayTree(bg);
    assert.equal(freed, 4);
});
