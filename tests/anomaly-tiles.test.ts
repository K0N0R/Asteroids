import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AnomalyCloudView, anomalyCanvasStats } from '../frontend/game/graphics/anomalyCloudView';
import {
    anomalyTileRange,
    ANOMALY_TILE_SIZE as SIZE,
} from '../frontend/game/graphics/anomalyTiles';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';

test('tile preload covers every corner of a moving and rotating viewport with one tile of margin', () => {
    for (const angle of [0, 0.2, 0.8, 1.5, 2.5, 4, 6])
        for (const center of [
            { x: 0, y: 0 },
            { x: -1200, y: 7580 },
            { x: 52000, y: -37 },
        ]) {
            const r = anomalyTileRange(center, 960, 580, angle);
            for (const x of [-960, 960])
                for (const y of [-580, 580]) {
                    const wx = center.x + x * Math.cos(angle) - y * Math.sin(angle),
                        wy = center.y + x * Math.sin(angle) + y * Math.cos(angle);
                    assert.ok(wx >= r.left * SIZE + SIZE && wx < (r.right + 1) * SIZE - SIZE);
                    assert.ok(wy >= r.top * SIZE + SIZE && wy < (r.bottom + 1) * SIZE - SIZE);
                }
            assert.ok((r.right - r.left + 1) * (r.bottom - r.top + 1) <= 64);
        }
});

test('anomaly worker publishes small tiles only on update and releases textures, bitmaps and worker on scene disposal', () => {
    const originalWorker = globalThis.Worker,
        originalCanvas = globalThis.OffscreenCanvas;
    const instances: FakeWorker[] = [];
    class FakeWorker {
        onmessage: ((e: any) => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        messages: any[] = [];
        terminated = false;
        constructor() {
            instances.push(this);
        }
        postMessage(message: any) {
            this.messages.push(message);
        }
        terminate() {
            this.terminated = true;
        }
    }
    (globalThis as any).Worker = FakeWorker;
    (globalThis as any).OffscreenCanvas = class {};
    const before = anomalyCanvasStats();
    let closes = 0;
    const bitmap = () => ({ width: 640, height: 640, close: () => closes++ });
    const view = new AnomalyCloudView([
        [
            { x: -6000, y: -6000 },
            { x: 6000, y: -6000 },
            { x: 6000, y: 6000 },
            { x: -6000, y: 6000 },
        ],
    ]);
    try {
        view.update({ x: 0, y: 0 }, 960, 580, 0);
        const worker = instances[0];
        assert.equal(worker.messages.length, 2);
        for (let i = 0; i < 100; i++) view.update({ x: 0, y: 0 }, 960, 580, 0);
        assert.equal(worker.messages.length, 2, 'one job in flight, no raster work per frame');
        worker.onmessage!({ data: { bitmap: bitmap(), ms: 1 } });
        assert.equal(
            view.children.length,
            0,
            'worker cannot force a texture upload between frames',
        );
        view.update({ x: 0, y: 0 }, 960, 580, 0);
        assert.equal(view.children.length, 1);
        const buffers = [...(view.children[0] as any).geometry.buffers];
        assert.equal(worker.messages.length, 3);
        worker.onmessage!({ data: { bitmap: bitmap(), ms: 1 } });
        destroyDisplayTree(view);
        assert.ok(
            buffers.every((buffer) => buffer.destroyed),
            'tile mesh releases its GPU buffers',
        );
        assert.ok(worker.terminated);
        assert.equal(closes, 2);
        assert.equal(anomalyCanvasStats().entries, before.entries);
        assert.equal(anomalyCanvasStats().pixels, before.pixels);
        assert.equal(anomalyCanvasStats().workers, before.workers);
        worker.onmessage!({ data: { bitmap: bitmap(), ms: 1 } });
        assert.equal(closes, 3, 'late bitmap also released');
    } finally {
        destroyDisplayTree(view);
        globalThis.Worker = originalWorker;
        globalThis.OffscreenCanvas = originalCanvas;
    }
});
