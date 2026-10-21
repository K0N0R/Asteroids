import { Container, Sprite, Texture } from 'pixi.js';
import type { Point } from '../worlds/sector';
import { anomalyOpacity } from './anomalyAppearance';

/** One cloud for the entire footprint: shared filaments and a feathered union, without polygon seams. */
export function anomalyCloudView(polygons: readonly (readonly Point[])[], seed = 1) {
    const root = new Container();
    root.eventMode = 'none';
    const points = polygons.flat();
    const x0 = Math.min(...points.map((p) => p.x)) - 40,
        y0 = Math.min(...points.map((p) => p.y)) - 40;
    const width = Math.max(...points.map((p) => p.x)) - x0 + 40;
    const height = Math.max(...points.map((p) => p.y)) - y0 + 40;
    const resolution = Math.min(0.65, 2048 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * resolution);
    canvas.height = Math.ceil(height * resolution);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(resolution, resolution);
    ctx.translate(-x0, -y0);
    const noise = (x: number, y: number) => {
        const n = Math.sin(x * 127.1 + y * 311.7 + seed * 73.3) * 43758.5453;
        return n - Math.floor(n);
    };
    // Integer lattice keys ensure that neighbouring cells use exactly the same vertices and edges.
    const vertices = new Map<string, Point>();
    const edges = new Set<string>();
    const vertex = (u: number, v: number) => {
        const key = `${u},${v}`;
        if (!vertices.has(key))
            vertices.set(key, {
                x: x0 + u * 49 + (noise(u, v) - 0.5) * 70,
                y: y0 + v * 85 + (noise(v, u) - 0.5) * 90,
            });
        return { key, point: vertices.get(key)! };
    };
    for (let col = -1; col * 147 < width + 150; col++) {
        for (let row = -1; row * 170 < height + 170; row++) {
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
                const key = `${a.key}/${b.key}`;
                if (edges.has(key)) continue;
                edges.add(key);
                const p = a.point,
                    q = b.point;
                const bend = (noise(p.x, q.y) - 0.5) * 0.65;
                const cx = (p.x + q.x) / 2 - (q.y - p.y) * bend,
                    cy = (p.y + q.y) / 2 + (q.x - p.x) * bend;
                const strength = 0.45 + noise(p.x, p.y) * 0.55;
                ctx.lineCap = 'round';
                for (const [lineWidth, alpha, color, blur] of [
                    [36, 0.12, '#8e3926', 18],
                    [16, 0.22, '#be5730', 10],
                    [5, 0.42, '#e99450', 5],
                    [1.4, 0.35, '#ffd397', 2],
                ] as const) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.quadraticCurveTo(cx, cy, q.x, q.y);
                    ctx.lineWidth = lineWidth * strength;
                    ctx.globalAlpha = alpha * strength;
                    ctx.strokeStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = blur;
                    ctx.stroke();
                }
            }
        }
    }
    ctx.shadowBlur = 0;
    for (const p of vertices.values()) {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 28);
        gradient.addColorStop(0, 'rgba(255,201,126,.4)');
        gradient.addColorStop(0.25, 'rgba(231,133,64,.18)');
        gradient.addColorStop(1, 'rgba(155,63,35,0)');
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x - 28, p.y - 28, 56, 56);
    }
    ctx.globalAlpha = 1;
    // A low resolution smooth mask is enough for broad wispy edges and avoids a full-size distance field.
    const mask = document.createElement('canvas');
    const maskStep = Math.max(5, Math.max(width, height) / 512);
    mask.width = Math.ceil(width / maskStep);
    mask.height = Math.ceil(height / maskStep);
    const maskContext = mask.getContext('2d')!,
        pixels = maskContext.createImageData(mask.width, mask.height);
    for (let y = 0; y < mask.height; y++)
        for (let x = 0; x < mask.width; x++) {
            const index = (y * mask.width + x) * 4;
            pixels.data[index + 3] = Math.round(
                255 *
                    anomalyOpacity(
                        {
                            x: x0 + ((x + 0.5) * width) / mask.width,
                            y: y0 + ((y + 0.5) * height) / mask.height,
                        },
                        polygons,
                    ),
            );
        }
    maskContext.putImageData(pixels, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
    const texture = Texture.from(canvas),
        sprite = new Sprite(texture);
    sprite.position.set(x0, y0);
    sprite.width = width;
    sprite.height = height;
    root.addChild(sprite);
    root.once('destroyed', () => texture.destroy(true));
    return root;
}
