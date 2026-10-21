import { PlanetIllustration } from '../frontend/game/graphics/planetView';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CelestialLayer } from '../frontend/game/graphics/celestialLayer';
import {
    celestialBodiesFor,
    type CelestialBodySpec,
} from '../frontend/game/worlds/celestialBodies';
import { parallaxPoint } from '../frontend/game/graphics/parallax';
import { Background } from '../frontend/core/containers/entities/background';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';

test('both Earth and Moon drift much more slowly than foreground objects through camera motion, turns and zoom', () => {
    const layer = new CelestialLayer();
    const specs = celestialBodiesFor('earth');
    layer.setBodies(specs);
    try {
        assert.equal(specs.length, 2);
        for (const angle of [0, Math.PI / 2, -0.8])
            for (const zoom of [0.8, 1.3]) {
                layer.update({ x: 0, y: 0 }, angle, zoom);
                const starts = layer.children.map((v) => ({ x: v.x, y: v.y }));
                layer.update({ x: 400, y: -150 }, angle, zoom);
                const worldMove = Math.hypot(400, 150) * zoom;
                layer.children.forEach((v, i) => {
                    const displacement = Math.hypot(v.x - starts[i].x, v.y - starts[i].y);
                    assert.ok(displacement < worldMove * 0.3 && displacement > 0);
                    assert.ok(Math.abs(displacement - worldMove * specs[i].depth) < 1e-8);
                    assert.equal(v.rotation, angle);
                });
            }
    } finally {
        destroyDisplayTree(layer);
    }
});
test('one sector layer supports three or more bodies with independent anchors and far-to-near ordering', () => {
    const layer = new CelestialLayer();
    const third: CelestialBodySpec = {
        id: 'third-moon',
        appearance: 'lunar',
        anchor: { x: 6000, y: 2000 },
        depth: 0.06,
        scale: 0.6,
    };
    layer.setBodies([...celestialBodiesFor('earth'), third]);
    try {
        assert.equal(layer.children.length, 3);
        assert.equal(layer.children[0].label, 'celestial-third-moon');
        const camera = { x: 1400, y: -2700 };
        layer.update(camera, 0.5, 1.2);
        const thirdView = layer.getChildByLabel('celestial-third-moon')!;
        assert.deepEqual(
            { x: thirdView.x, y: thirdView.y },
            parallaxPoint(third.anchor, camera, 0.5, third.depth, 1.2),
        );
        assert.equal(thirdView.scale.x, 0.72);
        layer.setBodies(celestialBodiesFor('mars'));
        assert.equal(layer.children.length, 3);
        assert.equal(thirdView.destroyed, true);
    } finally {
        destroyDisplayTree(layer);
    }
});

test('Mars scenery has reusable, distinct moon artwork and releases all bodies on a sector change', () => {
    const layer = new CelestialLayer(),
        specs = celestialBodiesFor('mars');
    layer.setBodies(specs);
    try {
        assert.deepEqual(specs.map((spec) => spec.id).sort(), ['deimos', 'mars', 'phobos']);
        for (const moon of ['phobos', 'deimos']) {
            const view = layer.getChildByLabel(`celestial-${moon}`)!;
            assert.ok(view.getChildByLabel(`mars-moon-${moon}`, true));
        }
        const before = [...layer.children];
        for (const angle of [0, -Math.PI / 2, 0.8]) {
            layer.update({ x: 700, y: -600 }, angle, 1.1);
            for (const spec of specs) {
                const view = layer.getChildByLabel(`celestial-${spec.id}`)!;
                const expected = parallaxPoint(
                    spec.anchor,
                    { x: 700, y: -600 },
                    angle,
                    spec.depth,
                    1.1,
                );
                assert.deepEqual({ x: view.x, y: view.y }, expected);
            }
        }
        layer.setBodies(celestialBodiesFor('venus'));
        assert.equal(layer.children.length, 1);
        assert.ok(before.every((view) => view.destroyed));
        assert.equal(layer.getChildByLabel('celestial-phobos'), null);
    } finally {
        destroyDisplayTree(layer);
    }
});
test('Earth remains in the approach background while Moon transfers into the surface renderer', () => {
    const bg = new Background();
    bg.setRegion('earth');
    bg.setFlight(true);
    bg.update(0);
    try {
        const layer = bg.getChildByLabel('celestial-layer')!;
        const preview = bg.getChildByLabel('world-planet')!;
        assert.equal(layer.children.length, 2);
        assert.equal(layer.visible, true);
        assert.equal(preview.visible, false);
        bg.update(1000);
        const earth = layer.getChildByLabel('celestial-earth') as PlanetIllustration;
        assert.ok(Math.abs(earth.cloudDrift!.x - 0.8) < 1e-9);
        bg.surface = true;
        bg.lunarTransfer = true;
        bg.update(0);
        assert.equal(layer.visible, true);
        assert.equal(layer.getChildByLabel('celestial-earth')!.visible, true);
        assert.equal(layer.getChildByLabel('celestial-moon')!.visible, false);
        bg.lunarTransfer = false;
        bg.update(0);
        assert.equal(layer.visible, false);
        bg.setFlight(false);
        bg.update(0);
        assert.equal(layer.visible, false);
        assert.equal(preview.visible, true);
        assert.deepEqual({ x: preview.x, y: preview.y }, { x: 1360, y: 190 });
    } finally {
        destroyDisplayTree(bg);
    }
});
