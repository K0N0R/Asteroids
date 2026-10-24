import { readAnomalyPixels } from '../frontend/game/graphics/anomalyRaster';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    AnomalyCloudView,
    anomalyCanvasStats,
    ANOMALY_MAX_TILES,
} from '../frontend/game/graphics/anomalyCloudView';
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

test('anomaly worker publishes small tiles only on update and reuses CPU-backed textures and releases worker and buffers on scene disposal', () => {
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
    const reply = (worker: FakeWorker) => {
        const job = worker.messages.at(-1);
        worker.onmessage!({
            data: {
                width: 320,
                height: 320,
                pixels: new Uint8Array(320 * 320 * 4),
                serial: job.serial,
                ms: 1,
            },
        });
    };
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
        reply(worker);
        assert.equal(
            view.children.length,
            0,
            'worker cannot force a texture upload between frames',
        );
        view.update({ x: 0, y: 0 }, 960, 580, 0);
        assert.equal(view.children.length, 1);
        const first = view.children[0] as any;
        assert.equal(first.texture.source.uploadMethodId, 'buffer');
        assert.equal(first.texture.source.width, 320);
        assert.equal(
            first.texture.source.resolution,
            1,
            'buffer uploader expects physical pixel dimensions',
        );
        const buffers = [...first.geometry.buffers];
        // Traverse repeatedly across disjoint viewports. A slot is updated in place.
        for (let i = 0; i < 500; i++) {
            reply(worker);
            view.update(
                {
                    x: Math.floor(i / 50) % 2 ? -3500 : 3500,
                    y: ((Math.floor(i / 50) % 3) - 1) * 2500,
                },
                960,
                580,
                0,
            );
        }
        assert.ok(view.children.length > 10, 'multiple viewports really populated the pool');
        assert.ok(view.children.length <= ANOMALY_MAX_TILES);
        assert.ok(anomalyCanvasStats().allocations - before.allocations <= ANOMALY_MAX_TILES);
        assert.ok(
            anomalyCanvasStats().bytes - before.bytes <= (ANOMALY_MAX_TILES + 1) * 320 * 320 * 4,
        );
        let uploads = 0;
        first.texture.source.on('update', () => uploads++);
        view.suspendRenderContext();
        const messages = worker.messages.length;
        reply(worker);
        view.update({ x: 0, y: 0 }, 960, 580, 0);
        assert.equal(worker.messages.length, messages);
        view.recoverRenderContext();
        assert.ok(uploads > 0, 'retained CPU source is explicitly reuploaded after loss');
        view.update({ x: 0, y: 0 }, 960, 580, 0);

        reply(worker);
        destroyDisplayTree(view);
        assert.ok(
            buffers.every((buffer) => buffer.destroyed),
            'tile mesh releases its GPU buffers',
        );
        assert.ok(worker.terminated);

        assert.equal(anomalyCanvasStats().entries, before.entries);
        assert.equal(anomalyCanvasStats().pixels, before.pixels);
        assert.equal(anomalyCanvasStats().workers, before.workers);
        reply(worker);
        assert.equal(
            anomalyCanvasStats().entries,
            before.entries,
            'late reply cannot resurrect resources',
        );
    } finally {
        destroyDisplayTree(view);
        globalThis.Worker = originalWorker;
        globalThis.OffscreenCanvas = originalCanvas;
    }
});

test('camera zoom out and invalid zoom keep anomaly tile work bounded', () => {
    for (const zoom of [Infinity, NaN, 1e9]) {
        const r = anomalyTileRange({ x: 0, y: 0 }, zoom, zoom, 0.7);
        assert.ok(Number.isFinite(r.left));
        assert.ok((r.right - r.left + 1) * (r.bottom - r.top + 1) < 600);
    }
});

test('raster transport premultiplies RGBA and immediately releases its canvas backing', () => {
    const canvas = {
        width: 2,
        height: 1,
        getContext: () => ({
            getImageData: () => ({ data: new Uint8ClampedArray([100, 50, 0, 128, 0, 50, 100, 0]) }),
        }),
    };
    const result = readAnomalyPixels(canvas as unknown as HTMLCanvasElement);
    assert.equal(result.width, 2);
    assert.equal(result.height, 1);
    assert.deepEqual([...result.pixels], [50, 25, 0, 128, 0, 0, 0, 0]);
    assert.equal(canvas.width, 0);
    assert.equal(canvas.height, 0);
});
