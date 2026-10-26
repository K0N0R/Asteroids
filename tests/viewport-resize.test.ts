import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StableViewportResize } from '../frontend/core/systems/stableViewportResize';
test('transient viewport changes that return to the same size never reallocate the backbuffer', () => {
    let queued: (() => void) | null = null;
    const applied: unknown[] = [];
    const resize = new StableViewportResize(
        (s) => applied.push(s),
        (fn) => {
            queued = fn;
            return () => {
                queued = null;
            };
        },
    );
    resize.request(1920, 911, 1);
    resize.flush();
    for (let i = 0; i < 20; i++) {
        resize.request(1920, 1080, 1);
        resize.request(1920, 911, 1);
    }
    queued!();
    assert.equal(applied.length, 1);
    resize.request(1600, 900, 1);
    queued!();
    assert.equal(applied.length, 2);
    resize.request(1600, 900, 2);
    queued!();
    assert.equal(applied.length, 3);
    resize.dispose();
});
test('resize stays pending while context is lost and commits the latest size only after restoration', () => {
    const applied: unknown[] = [];
    const resize = new StableViewportResize(
        (s) => applied.push(s),
        () => () => {},
    );
    resize.request(1280, 720, 1);
    resize.flush();
    resize.suspend(true);
    resize.request(1920, 1080, 1);
    resize.flush();
    resize.request(1920, 911, 1);
    resize.flush();
    assert.equal(applied.length, 1);
    resize.suspend(false);
    resize.flush();
    assert.deepEqual(applied[1], { width: 1920, height: 911, resolution: 1 });
    resize.dispose();
});
