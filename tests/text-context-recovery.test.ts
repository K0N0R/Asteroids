import { interactionOutlineRadius } from '../frontend/game/graphics/interactionOutline';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Graphics, Text } from 'pixi.js';
import { bindRenderContextRecovery } from '../frontend/core/systems/renderContextRecovery';
import { Typography } from '../frontend/core/containers/components/typography';

test('GPU recovery refreshes static and hidden text, pauses simulation and respects an already stopped ticker', () => {
    const canvas = new EventTarget();
    const stage = new Container();
    const hidden = new Container();
    hidden.visible = false;
    stage.addChild(hidden);
    const title = stage.addChild(new Text({ text: 'Satuk 15' }));
    const amount = hidden.addChild(new Text({ text: '19 Fe' }));
    const vector = stage.addChild(new Graphics().circle(0, 0, 10).fill(0xffffff));
    vector.context.dirty = false;
    const cached = stage.addChild(new Container());
    cached.cacheAsTexture(true);
    let cacheUpdates = 0;
    cached.updateCacheTexture = () => {
        cacheUpdates++;
    };
    let refreshes = 0;
    for (const text of [title, amount])
        text.onViewUpdate = () => {
            refreshes++;
        };
    const ticker = {
        started: true,
        stop() {
            this.started = false;
        },
        start() {
            this.started = true;
        },
    };
    let suspends = 0,
        recovers = 0,
        losses = 0,
        restores = 0;
    Object.assign(hidden, {
        suspendRenderContext: () => suspends++,
        recoverRenderContext: () => recovers++,
    });
    const unbind = bindRenderContextRecovery(
        { canvas, stage, ticker } as Parameters<typeof bindRenderContextRecovery>[0],
        { lost: () => losses++, restored: () => restores++ },
    );
    try {
        const lost = new Event('webglcontextlost', { cancelable: true });
        canvas.dispatchEvent(lost);
        assert.ok(lost.defaultPrevented);
        assert.equal(ticker.started, false);
        assert.equal(suspends, 1);
        assert.equal(losses, 1);
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
        canvas.dispatchEvent(new Event('webglcontextrestored'));
        assert.equal(ticker.started, true);
        assert.equal(refreshes, 2);
        assert.equal(recovers, 1);
        assert.equal(restores, 1);
        assert.equal(vector.context.dirty, true);
        assert.equal(cacheUpdates, 1);
        assert.equal(title.text, 'Satuk 15');
        assert.equal(amount.text, '19 Fe');
        ticker.stop();
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
        canvas.dispatchEvent(new Event('webglcontextrestored'));
        assert.equal(ticker.started, false);
        assert.equal(refreshes, 4);
        unbind();
        canvas.dispatchEvent(new Event('webglcontextrestored'));
        assert.equal(refreshes, 4);
    } finally {
        stage.destroy({ children: true });
    }
});

test('typography uses one intentional supersampling factor, independent of device pixel ratio', () => {
    const label = new Typography({ text: 'Próba', size: 20 });
    try {
        const text = label.children[0] as Text;
        assert.equal(text.resolution, 1);
        assert.equal(text.style.fontSize, 40);
        assert.equal(text.scale.x, 0.5);
    } finally {
        label.destroy({ children: true });
    }
});

test('interaction outline fits physical art, ignores captions and scales with the object', () => {
    const station = new Container();
    station.addChild(new Graphics().circle(0, 0, 160).fill(0xffffff));
    station.addChild(new Typography({ text: 'An enormously long station caption', size: 20 }));
    assert.equal(interactionOutlineRadius(station, 1), 168);
    station.scale.set(2);
    assert.equal(interactionOutlineRadius(station, 1), 328);
    assert.equal(interactionOutlineRadius(station, 2), 324);
    station.destroy({ children: true });
});
