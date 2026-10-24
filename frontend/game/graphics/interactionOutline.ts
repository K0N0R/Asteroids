import { Container, Graphics, Mesh, Sprite } from 'pixi.js';

/** Physical art only: captions and station shield/range layers are not part of the target. */
export function interactionOutlineRadius(view: Container, zoom: number, fallback = 48) {
    let left = Infinity,
        right = -Infinity,
        top = Infinity,
        bottom = -Infinity;
    const walk = (
        node: Container,
        transform: (x: number, y: number) => { x: number; y: number },
    ) => {
        if (node instanceof Graphics || node instanceof Sprite || node instanceof Mesh) {
            const b = node.getLocalBounds();
            for (const x of [b.minX, b.maxX])
                for (const y of [b.minY, b.maxY]) {
                    const p = transform(x, y);
                    left = Math.min(left, p.x);
                    right = Math.max(right, p.x);
                    top = Math.min(top, p.y);
                    bottom = Math.max(bottom, p.y);
                }
        }
        for (const child of node.children) {
            if (!child.visible) continue;
            const cos = Math.cos(child.rotation),
                sin = Math.sin(child.rotation);
            walk(child, (x, y) => {
                const sx = (x - child.pivot.x) * child.scale.x,
                    sy = (y - child.pivot.y) * child.scale.y;
                return transform(child.x + cos * sx - sin * sy, child.y + sin * sx + cos * sy);
            });
        }
    };
    walk(view, (x, y) => ({ x: x * view.scale.x, y: y * view.scale.y }));
    const scale = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
    return Number.isFinite(left)
        ? Math.max(24 / scale, Math.max(right - left, bottom - top) / 2 + 8 / scale)
        : fallback;
}
