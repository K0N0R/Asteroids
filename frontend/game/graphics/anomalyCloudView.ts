import { CanvasSource, Container, Sprite, Texture } from 'pixi.js';
import type { Point } from '../worlds/sector';
import { destroyDisplayTree } from '../../core/systems/destroyDisplayTree';
type Window = { x: number; y: number; width: number; height: number };
const cache = new Map<string, HTMLCanvasElement>();
let builds = 0,
    lastBuildMS = 0;
export function anomalyCanvasStats() {
    return {
        builds,
        lastBuildMS,
        entries: cache.size,
        pixels: [...cache.values()].reduce((n, c) => n + c.width * c.height, 0),
    };
}
/** Bounded CPU canvas cache; every scene owns and destroys its own GPU texture. */
export function anomalyCloudView(
    polygons: readonly (readonly Point[])[],
    seed = 1,
    window?: Window,
) {
    const root = new Container();
    root.eventMode = 'none';
    if (!polygons.length) return root;
    const points = polygons.flat(),
        x0 = window?.x ?? Math.min(...points.map((p) => p.x)) - 80,
        y0 = window?.y ?? Math.min(...points.map((p) => p.y)) - 80;
    const width = window?.width ?? Math.max(...points.map((p) => p.x)) - x0 + 80,
        height = window?.height ?? Math.max(...points.map((p) => p.y)) - y0 + 80;
    const resolution = window
            ? Math.min(1, 3072 / Math.max(width, height))
            : Math.min(0.5, 1536 / Math.max(width, height)),
        key = JSON.stringify([seed, polygons, window]);
    let canvas = cache.get(key);
    if (!canvas) {
        const started = performance.now();
        canvas = document.createElement('canvas');
        canvas.width = Math.ceil(width * resolution);
        canvas.height = Math.ceil(height * resolution);
        const ctx = canvas.getContext('2d')!;
        ctx.scale(resolution, resolution);
        ctx.translate(-x0, -y0);
        ctx.fillStyle = '#6f3035';
        ctx.globalAlpha = 0.12;
        ctx.fillRect(x0, y0, width, height);
        const noise = (x: number, y: number) => {
            const n = Math.sin(x * 127.1 + y * 311.7 + seed * 73.3) * 43758.5453;
            return n - Math.floor(n);
        };
        const spacing = 1,
            vertices = new Map<string, Point>(),
            edges = new Set<string>();
        const vertex = (u: number, v: number) => {
            const k = `${u},${v}`;
            if (!vertices.has(k))
                vertices.set(k, {
                    x: (u * 49 + (noise(u, v) - 0.5) * 70) * spacing,
                    y: (v * 85 + (noise(v, u) - 0.5) * 90) * spacing,
                });
            return { key: k, point: vertices.get(k)! };
        };
        const paths = Array.from({ length: 4 }, () => new Path2D());
        for (let col = Math.floor(x0 / 147) - 2; col * 147 < x0 + width + 300; col++)
            for (let row = Math.floor(y0 / 170) - 2; row * 170 < y0 + height + 300; row++) {
                const u = col * 3,
                    v = row * 2 + (((col % 2) + 2) % 2);
                const cell = [
                    [u + 2, v],
                    [u + 1, v + 1],
                    [u - 1, v + 1],
                    [u - 2, v],
                    [u - 1, v - 1],
                    [u + 1, v - 1],
                ].map(([a, b]) => vertex(a, b));
                for (let i = 0; i < 6; i++) {
                    let a = cell[i],
                        b = cell[(i + 1) % 6];
                    if (a.key > b.key) [a, b] = [b, a];
                    const k = `${a.key}/${b.key}`;
                    if (edges.has(k)) continue;
                    edges.add(k);
                    const p = a.point,
                        q = b.point,
                        bend = (noise(p.x, q.y) - 0.5) * 0.65,
                        path = paths[Math.floor(noise(p.x, p.y) * 4)];
                    path.moveTo(p.x, p.y);
                    path.quadraticCurveTo(
                        (p.x + q.x) / 2 - (q.y - p.y) * bend,
                        (p.y + q.y) / 2 + (q.x - p.x) * bend,
                        q.x,
                        q.y,
                    );
                }
            }
        ctx.lineCap = 'round';
        for (let i = 0; i < paths.length; i++)
            for (const [w, a, color, blur] of [
                [36, 0.12, '#8e3926', 18],
                [16, 0.22, '#be5730', 10],
                [5, 0.52, '#e99450', 5],
                [1.4, 0.65, '#ffd397', 1],
            ] as const) {
                const strength = 0.5 + i * 0.12;
                ctx.globalAlpha = a * strength;
                ctx.strokeStyle = color;
                ctx.lineWidth = w * strength;
                ctx.shadowColor = color;
                ctx.shadowBlur = blur;
                ctx.stroke(paths[i]);
            }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.5;
        for (const p of vertices.values()) {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 28);
            g.addColorStop(0, 'rgba(255,201,126,.4)');
            g.addColorStop(1, 'rgba(155,63,35,0)');
            ctx.fillStyle = g;
            ctx.fillRect(p.x - 28, p.y - 28, 56, 56);
            ctx.fillStyle = 'rgba(130,199,220,.35)';
            for (let j = 0; j < 3; j++) {
                const dx = (noise(p.x + j, p.y) - 0.5) * 90;
                const dy = (noise(p.y + j, p.x) - 0.5) * 90;
                ctx.fillRect(p.x + dx, p.y + dy, 1.2, 1.2);
            }
        }
        // Rasterize the polygon union once, then feather it in native canvas code instead of
        // evaluating every polygon for every mask pixel on the JS main thread.
        const mask = document.createElement('canvas');
        mask.width = canvas.width;
        mask.height = canvas.height;
        const m = mask.getContext('2d')!;
        m.scale(resolution, resolution);
        m.translate(-x0, -y0);
        m.beginPath();
        for (const poly of polygons) {
            m.moveTo(poly[0].x, poly[0].y);
            for (const p of poly.slice(1)) m.lineTo(p.x, p.y);
            m.closePath();
        }
        m.fillStyle = 'white';
        m.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'destination-in';
        ctx.filter = `blur(${Math.max(1, 30 * resolution)}px)`;
        ctx.drawImage(mask, 0, 0);
        ctx.filter = 'none';
        cache.set(key, canvas);
        while (
            cache.size > 2 ||
            [...cache.values()].reduce((n, c) => n + c.width * c.height, 0) > 12000000
        )
            cache.delete(cache.keys().next().value!);
        builds++;
        lastBuildMS = performance.now() - started;
    } else {
        cache.delete(key);
        cache.set(key, canvas);
    }
    const texture = new Texture({ source: new CanvasSource({ resource: canvas }) }),
        sprite = new Sprite(texture);
    sprite.position.set(x0, y0);
    sprite.width = width;
    sprite.height = height;
    root.addChild(sprite);
    root.once('destroyed', () => texture.destroy(true));
    return root;
}

/** Full-detail moving window instead of magnifying one thumbnail across an entire sector. */
export class AnomalyCloudView extends Container {
    private window: Window | null = null;
    private illustration: Container | null = null;
    constructor(
        private polygons: readonly (readonly Point[])[],
        private seed = 1,
    ) {
        super();
        this.eventMode = 'none';
    }
    update(center: Point, halfWidth: number, halfHeight: number, angle: number) {
        const c = Math.abs(Math.cos(angle)),
            s = Math.abs(Math.sin(angle));
        const w = halfWidth * c + halfHeight * s,
            h = halfWidth * s + halfHeight * c;
        const old = this.window;
        if (
            old &&
            center.x - w >= old.x + 128 &&
            center.x + w <= old.x + old.width - 128 &&
            center.y - h >= old.y + 128 &&
            center.y + h <= old.y + old.height - 128
        )
            return;
        const x = Math.floor((center.x - w - 512) / 512) * 512;
        const y = Math.floor((center.y - h - 512) / 512) * 512;
        this.window = {
            x,
            y,
            width: Math.ceil((center.x + w + 512 - x) / 512) * 512,
            height: Math.ceil((center.y + h + 512 - y) / 512) * 512,
        };
        if (this.illustration) destroyDisplayTree(this.illustration);
        this.illustration = null;
        const nearby = this.polygons.some(
            (poly) =>
                Math.min(...poly.map((p) => p.x)) < x + this.window!.width &&
                Math.max(...poly.map((p) => p.x)) > x &&
                Math.min(...poly.map((p) => p.y)) < y + this.window!.height &&
                Math.max(...poly.map((p) => p.y)) > y,
        );
        if (nearby)
            this.illustration = this.addChild(
                anomalyCloudView(this.polygons, this.seed, this.window),
            );
    }
}
