import { Container, ImageSource, Rectangle, MeshPlane, Texture, Sprite } from 'pixi.js';
import type { Point } from '../worlds/sector';
import { rasterAnomaly, type AnomalyWindow } from './anomalyRaster';
import {
    anomalyTileRange,
    ANOMALY_TILE_SIZE as SIZE,
    ANOMALY_TILE_BLEED as BLEED,
} from './anomalyTiles';
type Raster = ImageBitmap | OffscreenCanvas | HTMLCanvasElement;
class OwnedAnomalyMesh extends MeshPlane {
    override destroy(options?: Parameters<MeshPlane['destroy']>[0]) {
        if (this.destroyed) return;
        const geometry = this.geometry;
        super.destroy(options);
        // Pixi MeshPlane drops its geometry reference but does not free its buffers.
        geometry.destroy(true);
    }
}
type Job = { key: string; x: number; y: number };
type Tile = { sprite: MeshPlane; texture: Texture; raster: Raster; x: number; y: number };
/** World-space deformation keeps adjacent tile edges identical, without filter render targets. */
export function anomalyDrift(x: number, y: number, time: number) {
    return {
        x: Math.sin(y / 380 + time * 0.48) * 19 + Math.sin((x + y) / 710 - time * 0.31) * 8,
        y: Math.sin(x / 430 - time * 0.42) * 17 + Math.cos((y - x) / 840 + time * 0.27) * 8,
    };
}
const resources = new Set<Raster>();
let builds = 0,
    lastBuildMS = 0,
    workers = 0;
export function anomalyCanvasStats() {
    return {
        builds,
        lastBuildMS,
        entries: resources.size,
        pixels: [...resources].reduce((n, c) => n + c.width * c.height, 0),
        workers,
    };
}
function release(raster: Raster) {
    resources.delete(raster);
    if ('close' in raster) raster.close();
    else raster.width = raster.height = 0;
}
/** Small, independently owned textures. Raster work stays off the flight/render thread. */
export class AnomalyCloudView extends Container {
    private worker: Worker | null = null;
    private fallback: ReturnType<typeof setTimeout> | null = null;
    private tiles = new Map<string, Tile>();
    private wanted = new Map<string, Job>();
    private pending: Job | null = null;
    private ready: { job: Job; raster: Raster } | null = null;
    private range = '';
    private haze: { sprite: Sprite; texture: Texture; raster: HTMLCanvasElement } | null = null;
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
        // A small persistent coverage layer makes dangerous interiors visible immediately,
        // even while detailed filament tiles are still being streamed by the worker.
        if (typeof document !== 'undefined' && polygons.length) {
            const left = Math.min(...this.bounds.map((b) => b.left)) - BLEED,
                top = Math.min(...this.bounds.map((b) => b.top)) - BLEED,
                width = Math.max(...this.bounds.map((b) => b.right)) - left + BLEED,
                height = Math.max(...this.bounds.map((b) => b.bottom)) - top + BLEED,
                scale = Math.min(1, 1024 / Math.max(width, height)),
                raster = document.createElement('canvas');
            raster.width = Math.ceil(width * scale);
            raster.height = Math.ceil(height * scale);
            const ctx = raster.getContext('2d')!;
            ctx.scale(scale, scale);
            ctx.translate(-left, -top);
            ctx.beginPath();
            for (const poly of polygons) {
                ctx.moveTo(poly[0].x, poly[0].y);
                for (const p of poly.slice(1)) ctx.lineTo(p.x, p.y);
                ctx.closePath();
            }
            ctx.fillStyle = 'rgba(174,65,48,0.30)';
            ctx.filter = `blur(${30 * scale}px)`;
            ctx.fill();
            const texture = Texture.from(raster),
                sprite = new Sprite(texture);
            sprite.position.set(left, top);
            sprite.scale.set(1 / scale);
            this.addChild(sprite);
            this.haze = { sprite, texture, raster };
            resources.add(raster);
        }
        if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
            const source = `const raster=${rasterAnomaly.toString()};let polygons,seed;onmessage=({data})=>{if(data.init){polygons=data.polygons;seed=data.seed;return;}const t=performance.now();const canvas=raster(polygons,seed,data.window);const bitmap=canvas.transferToImageBitmap();postMessage({bitmap,ms:performance.now()-t},[bitmap]);};`;
            const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
            try {
                this.worker = new Worker(url);
                workers++;
                this.worker.onmessage = ({ data }: { data: { bitmap: ImageBitmap; ms: number } }) =>
                    this.receive(data.bitmap, data.ms);
                this.worker.onerror = (event) => {
                    event.preventDefault();
                    this.stopWorker();
                    const job = this.pending;
                    this.pending = null;
                    if (job) this.wanted.set(job.key, job);
                };
                this.worker.postMessage({ init: true, polygons, seed });
            } catch {
                this.worker = null;
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
    private receive(raster: Raster, ms: number) {
        const job = this.pending;
        this.pending = null;
        builds++;
        lastBuildMS = ms;
        if (this.destroyed || !job || !this.wanted.has(job.key)) {
            release(raster);
            return;
        }
        resources.add(raster);
        this.ready = { job, raster };
    }
    private remove(key: string, tile: Tile) {
        if (!tile.sprite.destroyed) tile.sprite.destroy();
        tile.texture.destroy(true);
        release(tile.raster);
        this.tiles.delete(key);
    }
    update(
        center: Point,
        halfWidth: number,
        halfHeight: number,
        angle: number,
        time = 0,
        previews: readonly Point[] = [],
    ) {
        const ranges = [center, ...previews].map((p) =>
                anomalyTileRange(p, halfWidth, halfHeight, angle),
            ),
            signature = JSON.stringify(ranges);
        if (signature !== this.range) {
            this.range = signature;
            this.wanted.clear();
            const jobs: Job[] = [];
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
                            jobs.push({ key: `${x},${y}`, x: x * SIZE, y: y * SIZE });
                    }
            jobs.sort(
                (a, b) =>
                    Math.hypot(a.x + SIZE / 2 - center.x, a.y + SIZE / 2 - center.y) -
                    Math.hypot(b.x + SIZE / 2 - center.x, b.y + SIZE / 2 - center.y),
            );
            for (const job of jobs) this.wanted.set(job.key, job);
            for (const [key, tile] of this.tiles) if (!this.wanted.has(key)) this.remove(key, tile);
        }
        // At most one small texture is published per frame; never upload a full viewport.
        if (this.ready) {
            const { job, raster } = this.ready;
            this.ready = null;
            if (this.wanted.has(job.key)) {
                const texture = new Texture({
                        source: new ImageSource({ resource: raster }),
                        frame: new Rectangle(BLEED, BLEED, SIZE, SIZE),
                    }),
                    sprite = new OwnedAnomalyMesh({ texture, verticesX: 9, verticesY: 9 });
                sprite.position.set(job.x, job.y);
                this.addChild(sprite);
                this.tiles.set(job.key, { sprite, texture, raster, x: job.x, y: job.y });
            } else release(raster);
        }
        if (this.haze) this.haze.sprite.alpha = 0.91 + Math.sin(time * 0.63) * 0.09;
        for (const tile of this.tiles.values()) {
            tile.sprite.alpha = 0.88 + Math.sin(time * 0.75) * 0.12;
            const buffer = tile.sprite.geometry.getBuffer('aPosition');
            for (let y = 0; y < 9; y++)
                for (let x = 0; x < 9; x++) {
                    const lx = (x * SIZE) / 8,
                        ly = (y * SIZE) / 8,
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
        const window: AnomalyWindow = {
            x: job.x - BLEED,
            y: job.y - BLEED,
            width: SIZE + 2 * BLEED,
            height: SIZE + 2 * BLEED,
        };
        if (this.worker) this.worker.postMessage({ window });
        else
            this.fallback = setTimeout(() => {
                this.fallback = null;
                if (this.destroyed) return;
                const start = performance.now();
                this.receive(
                    rasterAnomaly(this.polygons, this.seed, window),
                    performance.now() - start,
                );
            }, 0);
    }
    override destroy(options?: Parameters<Container['destroy']>[0]) {
        if (this.destroyed) return;
        this.stopWorker();
        if (this.haze) {
            this.haze.sprite.destroy();
            this.haze.texture.destroy(true);
            release(this.haze.raster);
            this.haze = null;
        }
        if (this.fallback !== null) clearTimeout(this.fallback);
        if (this.ready) release(this.ready.raster);
        this.ready = null;
        for (const [key, tile] of this.tiles) this.remove(key, tile);
        this.pending = null;
        this.wanted.clear();
        super.destroy(options);
    }
}
