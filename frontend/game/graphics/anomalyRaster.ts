import type { Point } from '../worlds/sector';
export type AnomalyWindow = { x: number; y: number; width: number; height: number };
/** Self-contained so the identical rasterizer can run in an OffscreenCanvas worker. */
export function rasterAnomaly(
    polygons: readonly (readonly Point[])[],
    seed: number,
    window: AnomalyWindow,
) {
    const makeCanvas = (w: number, h: number) => {
        if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    };
    const { x: x0, y: y0, width, height } = window,
        resolution = 1;
    const canvas = makeCanvas(width, height);
    const ctx = canvas.getContext('2d') as
        | CanvasRenderingContext2D
        | OffscreenCanvasRenderingContext2D;
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
    const mask = makeCanvas(canvas.width, canvas.height);
    const m = mask.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
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

    return canvas;
}
