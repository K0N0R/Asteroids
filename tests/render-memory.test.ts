import { Background } from '../frontend/core/containers/entities/background';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Graphics, TexturePool } from 'pixi.js';
import { releaseSceneBuffers } from '../frontend/core/systems/renderMemory';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
import { CelestialLayer } from '../frontend/game/graphics/celestialLayer';
import { celestialBodiesFor } from '../frontend/game/worlds/celestialBodies';
import { MissionInfoPopup } from '../frontend/game/ui/missionInfo';
import { Typography } from '../frontend/core/containers/components/typography';
import { Text } from 'pixi.js';

test('destroyed text leaves no renderer resolution subscription across repeated scene restarts', () => {
    const runner = {
        items: [] as unknown[],
        add(item: unknown) {
            this.items.push(item);
        },
        remove(item: unknown) {
            this.items.splice(this.items.indexOf(item), 1);
        },
    };
    const renderer = { runners: { resolutionChange: runner } };
    let returned = 0;
    for (let restart = 0; restart < 30; restart++) {
        const root = new Container();
        for (let i = 0; i < 50; i++) {
            const label = root.addChild(new Typography({ text: `Label ${i}` }));
            const text = label.children[0] as Text;
            const batch = {
                _renderer: renderer as typeof renderer | null,
                resolutionChange() {},
                destroy() {
                    this._renderer = null;
                    returned++;
                },
            };
            runner.add(batch);
            (text as unknown as { _gpuData: Record<string, unknown> })._gpuData = { test: batch };
        }
        assert.equal(runner.items.length, 50);
        // Cover both teardown paths used by menus and scenes.
        if (restart % 2) root.destroy({ children: true });
        else destroyDisplayTree(root);
        assert.equal(runner.items.length, 0);
    }
    assert.equal(returned, 1500, 'native GPU cleanup still releases every text texture');
});
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
    assert.equal(
        (TexturePool as unknown as { _poolKeyHash: Record<number, number> })._poolKeyHash[idle.uid],
        undefined,
    );
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
