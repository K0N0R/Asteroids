import type { Point } from '../worlds/sector';
import { ANOMALY_FEATHER } from '../systems/anomalyField';

/** Keep the core opaque; fade only outside its contour over the shared damage margin. */
export function drawAnomalyCoverage(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    polygons: readonly (readonly Point[])[],
    resolution = 1,
    clip?: { x: number; y: number; width: number; height: number },
) {
    const canvas = ctx.canvas;
    ctx.beginPath();
    for (const poly of polygons) {
        if (clip) {
            let left = Infinity,
                right = -Infinity,
                top = Infinity,
                bottom = -Infinity;
            for (const p of poly) {
                left = Math.min(left, p.x);
                right = Math.max(right, p.x);
                top = Math.min(top, p.y);
                bottom = Math.max(bottom, p.y);
            }
            if (
                right + ANOMALY_FEATHER < clip.x ||
                left - ANOMALY_FEATHER > clip.x + clip.width ||
                bottom + ANOMALY_FEATHER < clip.y ||
                top - ANOMALY_FEATHER > clip.y + clip.height
            )
                continue;
        }
        ctx.moveTo(poly[0].x, poly[0].y);
        for (const p of poly.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.closePath();
    }
    ctx.globalAlpha = 1;
    ctx.lineJoin = 'round';
    const steps = Math.max(1, Math.ceil(ANOMALY_FEATHER * resolution));
    // Opaque grayscale strokes form a distance ramp without blending down small cores.
    for (let i = steps; i > 0; i--) {
        const density = Math.round((1 - i / steps) * 255);
        ctx.strokeStyle = `rgb(${density},${density},${density})`;
        ctx.lineWidth = ((ANOMALY_FEATHER * i) / steps) * 2;
        ctx.stroke();
    }
    ctx.fillStyle = 'white';
    ctx.fill();
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < image.data.length; i += 4) {
        image.data[i + 3] = Math.round((image.data[i] * image.data[i + 3]) / 255);
        image.data[i] = image.data[i + 1] = image.data[i + 2] = 255;
    }
    ctx.putImageData(image, 0, 0);
}
