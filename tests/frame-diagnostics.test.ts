import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FrameSample } from '../frontend/core/systems/frameDiagnostics';

test('frame measurements retain real stalls and ignore warmup and paused intervals', () => {
    const s = new FrameSample(10);
    s.frame(0, true);
    s.frame(1000, true);
    for (let i = 1; i <= 100; i++) s.frame(1000 + i * 10, true, 12);
    s.frame(2100, true, 13);
    s.frame(2200, false);
    s.frame(20000, true);
    s.frame(20010, true, 11);
    const r = s.report();
    assert.equal(r.frames, 102);
    assert.equal(r.seconds, 1.11);
    assert.equal(r.p95MS, 10);
    assert.equal(r.maxMS, 100);
    assert.equal(r.slowFrames, 1);
    assert.equal(r.heapStartMB, 10);
    assert.equal(r.heapEndMB, 11);
    assert.equal(r.heapPeakMB, 13);
    assert.ok(Math.abs(r.fps - 102000 / 1110) < 1e-8);
});

test('short runs and unavailable heap counters remain explicitly empty', () => {
    const s = new FrameSample();
    s.frame(0, true);
    s.frame(100, true);
    const r = s.report();
    assert.equal(r.frames, 0);
    assert.equal(r.fps, 0);
    assert.equal(r.p95MS, 0);
    assert.equal(r.heapEndMB, null);
});
