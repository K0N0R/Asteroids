import { Container, BufferImageSource, MeshPlane, Texture, Sprite } from 'pixi.js';
import type { Point } from '../worlds/sector';
import {
    rasterAnomaly,
    readAnomalyPixels,
    type AnomalyPixels,
    type AnomalyWindow,
} from './anomalyRaster';
import {
    anomalyTileRange,
    ANOMALY_TILE_SIZE as SIZE,
    ANOMALY_TILE_BLEED as BLEED,
} from './anomalyTiles';

export const ANOMALY_MAX_TILES = 48;
export const ANOMALY_RESOLUTION = 0.5;
class OwnedAnomalyMesh extends MeshPlane {
    override destroy(options?: Parameters<MeshPlane['destroy']>[0]) {
        if (this.destroyed) return;
        const geometry = this.geometry;
        super.destroy(options);
        geometry.destroy(true);
    }
}
type Job = { key: string; x: number; y: number };
type Tile = { sprite: MeshPlane; texture: Texture; raster: AnomalyPixels; x: number; y: number };
export function anomalyDrift(x: number, y: number, time: number) {
    return {
        x: Math.sin(y / 380 + time * 0.48) * 19 + Math.sin((x + y) / 710 - time * 0.31) * 8,
        y: Math.sin(x / 430 - time * 0.42) * 17 + Math.cos((y - x) / 840 + time * 0.27) * 8,
    };
}
const resources = new Set<AnomalyPixels>();
let builds = 0,
    lastBuildMS = 0,
    workers = 0,
    allocations = 0;
export function anomalyCanvasStats() {
    return {
        builds,
        lastBuildMS,
        entries: resources.size,
        pixels: [...resources].reduce((n, r) => n + r.width * r.height, 0),
        bytes: [...resources].reduce((n, r) => n + r.pixels.byteLength, 0),
        workers,
        allocations,
    };
}
function release(raster: AnomalyPixels) {
    resources.delete(raster);
    raster.pixels = new Uint8Array(0);
}
function textureFor(raster: AnomalyPixels) {
    return new Texture({
        source: new BufferImageSource({
            resource: raster.pixels,
            width: raster.width,
            height: raster.height,
            resolution: 1,
            format: 'rgba8unorm',
            alphaMode: 'premultiplied-alpha',
            scaleMode: 'linear',
            autoGenerateMipmaps: false,
            label: 'anomaly-cpu-rgba',
        }),
    });
}
/** Bounded reusable GPU slots backed by retained CPU pixels for context restoration. */
export class AnomalyCloudView extends Container {
    private worker: Worker | null = null;
    private fallback: ReturnType<typeof setTimeout> | null = null;
    private tiles = new Map<string, Tile>();
    private spare: Tile[] = [];
    private wanted = new Map<string, Job>();
    private pending: Job | null = null;
    private pendingSince = 0;
    private serial = 0;
    private ready: { job: Job; raster: AnomalyPixels } | null = null;
    private range = '';
    private suspended = false;
    private haze: { sprite: Sprite; texture: Texture; raster: AnomalyPixels } | null = null;
    private bounds: { left: number; right: number; top: number; bottom: number }[];
    constructor(
        private polygons: readonly (readonly Point[])[],
        private seed = 1,
    ) {
        super();
        this.eventMode = 'none';
        this.bounds = polygons.map((p) => ({
            left: Math.min(...p.map((q) => q.x)),
            right: Math.max(...p.map((q) => q.x)),
            top: Math.min(...p.map((q) => q.y)),
            bottom: Math.max(...p.map((q) => q.y)),
        }));
        if (typeof document !== 'undefined' && polygons.length) {
            const left = Math.min(...this.bounds.map((b) => b.left)) - BLEED,
                top = Math.min(...this.bounds.map((b) => b.top)) - BLEED,
                width = Math.max(...this.bounds.map((b) => b.right)) - left + BLEED,
                height = Math.max(...this.bounds.map((b) => b.bottom)) - top + BLEED,
                scale = Math.min(1, 768 / Math.max(width, height)),
                canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.ceil(width * scale));
            canvas.height = Math.max(1, Math.ceil(height * scale));
            const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
            ctx.scale(scale, scale);
            ctx.translate(-left, -top);
            ctx.beginPath();
            for (const poly of polygons) {
                ctx.moveTo(poly[0].x, poly[0].y);
                for (const p of poly.slice(1)) ctx.lineTo(p.x, p.y);
                ctx.closePath();
            }
            ctx.fillStyle = 'rgba(174,65,48,0.30)';
            ctx.fill();
            const raster = readAnomalyPixels(canvas),
                texture = textureFor(raster),
                sprite = new Sprite(texture);
            sprite.position.set(left, top);
            sprite.scale.set(1 / scale);
            this.addChild(sprite);
            this.haze = { sprite, texture, raster };
            resources.add(raster);
        }
        if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
            const source = `const raster=${rasterAnomaly.toString()};const read=${readAnomalyPixels.toString()};let polygons,seed;onmessage=({data})=>{if(data.init){polygons=data.polygons;seed=data.seed;return;}const t=performance.now();const result=read(raster(polygons,seed,data.window));postMessage({...result,serial:data.serial,ms:performance.now()-t},[result.pixels.buffer]);};`;
            const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
            try {
                const worker = (this.worker = new Worker(url));
                workers++;
                worker.onmessage = ({
                    data,
                }: {
                    data: AnomalyPixels & { serial: number; ms: number };
                }) => {
                    if (this.worker !== worker || data.serial !== this.serial || this.destroyed)
                        return;
                    this.receive(data, data.ms);
                };
                worker.onerror = (event) => {
                    event.preventDefault();
                    this.stopWorker();
                    this.pending = null;
                };
                worker.postMessage({ init: true, polygons, seed });
            } catch {
                this.stopWorker();
            } finally {
                URL.revokeObjectURL(url);
            }
        }
    }
    private stopWorker() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            workers--;
        }
    }
    private receive(raster: AnomalyPixels, ms: number) {
        const job = this.pending;
        this.pending = null;
        builds++;
        lastBuildMS = ms;
        if (this.destroyed || !job || !this.wanted.has(job.key)) return;
        const dimension = Math.ceil((SIZE + 2 * BLEED) * ANOMALY_RESOLUTION);
        if (
            raster.width !== dimension ||
            raster.height !== dimension ||
            !(raster.pixels instanceof Uint8Array) ||
            raster.pixels.byteLength !== dimension * dimension * 4
        )
            return;
        if (this.ready) release(this.ready.raster);
        resources.add(raster);
        this.ready = { job, raster };
    }
    private retire(key: string, tile: Tile) {
        this.tiles.delete(key);
        tile.sprite.visible = false;
        this.spare.push(tile);
    }
    private destroyTile(tile: Tile) {
        if (!tile.sprite.destroyed) tile.sprite.destroy();
        tile.texture.destroy(true);
        release(tile.raster);
    }
    suspendRenderContext() {
        this.suspended = true;
    }
    recoverRenderContext() {
        if (this.destroyed) return;
        this.suspended = false;
        // RGBA remains owned until teardown; uploads cannot reference closed bitmaps/canvases.
        for (const tile of [...this.tiles.values(), ...this.spare]) {
            tile.texture.source.update();
            tile.sprite.geometry.getBuffer('aPosition').update();
        }
        this.haze?.texture.source.update();
    }
    update(
        center: Point,
        halfWidth: number,
        halfHeight: number,
        angle: number,
        time = 0,
        previews: readonly Point[] = [],
    ) {
        if (this.suspended || this.destroyed) return;
        if (this.pending && performance.now() - this.pendingSince > 4000) {
            this.stopWorker();
            if (this.fallback !== null) clearTimeout(this.fallback);
            this.fallback = null;
            this.pending = null;
            this.serial++;
        }
        const ranges = [center, ...previews.slice(0, 1)].map((p) =>
                anomalyTileRange(p, halfWidth, halfHeight, angle),
            ),
            signature = JSON.stringify(ranges);
        if (signature !== this.range) {
            this.range = signature;
            this.wanted.clear();
            const jobs = new Map<string, Job>();
            for (const r of ranges)
                for (let y = r.top; y <= r.bottom; y++)
                    for (let x = r.left; x <= r.right; x++) {
                        const left = x * SIZE - BLEED,
                            top = y * SIZE - BLEED;
                        if (
                            this.bounds.some(
                                (b) =>
                                    b.left < left + SIZE + 2 * BLEED &&
                                    b.right > left &&
                                    b.top < top + SIZE + 2 * BLEED &&
                                    b.bottom > top,
                            )
                        )
                            jobs.set(`${x},${y}`, { key: `${x},${y}`, x: x * SIZE, y: y * SIZE });
                    }
            const ordered = [...jobs.values()].sort(
                (a, b) =>
                    Math.hypot(a.x + SIZE / 2 - center.x, a.y + SIZE / 2 - center.y) -
                    Math.hypot(b.x + SIZE / 2 - center.x, b.y + SIZE / 2 - center.y),
            );
            for (const job of ordered.slice(0, ANOMALY_MAX_TILES)) this.wanted.set(job.key, job);
            for (const [key, tile] of this.tiles) if (!this.wanted.has(key)) this.retire(key, tile);
        }
        if (this.ready) {
            const { job, raster } = this.ready;
            this.ready = null;
            if (this.wanted.has(job.key) && !this.tiles.has(job.key)) {
                let tile = this.spare.pop();
                if (tile) {
                    const old = tile.raster;
                    tile.texture.source.resource = raster.pixels;
                    tile.raster = raster;
                    tile.texture.source.update();
                    release(old);
                } else {
                    const texture = textureFor(raster),
                        sprite = new OwnedAnomalyMesh({ texture, verticesX: 9, verticesY: 9 });
                    tile = { texture, sprite, raster, x: job.x, y: job.y };
                    this.addChild(sprite);
                    allocations++;
                }
                tile.x = job.x;
                tile.y = job.y;
                tile.sprite.position.set(job.x, job.y);
                tile.sprite.visible = true;
                this.tiles.set(job.key, tile);
            } else release(raster);
        }
        if (this.haze) this.haze.sprite.alpha = 0.91 + Math.sin(time * 0.63) * 0.09;
        for (const tile of this.tiles.values()) {
            tile.sprite.alpha = 0.88 + Math.sin(time * 0.75) * 0.12;
            const buffer = tile.sprite.geometry.getBuffer('aPosition');
            for (let y = 0; y < 9; y++)
                for (let x = 0; x < 9; x++) {
                    const lx = (x * (SIZE + 2 * BLEED)) / 8 - BLEED,
                        ly = (y * (SIZE + 2 * BLEED)) / 8 - BLEED,
                        d = anomalyDrift(tile.x + lx, tile.y + ly, time),
                        i = (y * 9 + x) * 2;
                    buffer.data[i] = lx + d.x;
                    buffer.data[i + 1] = ly + d.y;
                }
            buffer.update();
        }
        if (this.pending) return;
        const job = [...this.wanted.values()].find((j) => !this.tiles.has(j.key));
        if (!job) return;
        this.pending = job;
        this.pendingSince = performance.now();
        this.serial++;
        const window: AnomalyWindow = {
            x: job.x - BLEED,
            y: job.y - BLEED,
            width: SIZE + 2 * BLEED,
            height: SIZE + 2 * BLEED,
            resolution: ANOMALY_RESOLUTION,
        };
        if (this.worker) this.worker.postMessage({ window, serial: this.serial });
        else
            this.fallback = setTimeout(() => {
                this.fallback = null;
                if (this.destroyed) return;
                const start = performance.now();
                this.receive(
                    readAnomalyPixels(rasterAnomaly(this.polygons, this.seed, window)),
                    performance.now() - start,
                );
            }, 0);
    }
    override destroy(options?: Parameters<Container['destroy']>[0]) {
        if (this.destroyed) return;
        this.stopWorker();
        if (this.fallback !== null) clearTimeout(this.fallback);
        if (this.haze) {
            if (!this.haze.sprite.destroyed) this.haze.sprite.destroy();
            this.haze.texture.destroy(true);
            release(this.haze.raster);
            this.haze = null;
        }
        if (this.ready) release(this.ready.raster);
        this.ready = null;
        for (const tile of this.tiles.values()) this.destroyTile(tile);
        for (const tile of this.spare) this.destroyTile(tile);
        this.tiles.clear();
        this.spare.length = 0;
        this.pending = null;
        this.wanted.clear();
        super.destroy(options);
    }
}
