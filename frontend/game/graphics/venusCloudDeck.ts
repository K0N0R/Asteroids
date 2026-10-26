import { BufferImageSource, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { random, type Point } from '../worlds/sector';
import { VENUS_MAPS } from '../worlds/venusLayout';
import { rotateVector } from '../systems/flight';

/** Soft multi-scale density, generated once on CPU; no blur filters or render textures. */
function cloudTexture(seed: number, color: number) {
    const size = 384,
        density = new Float32Array(size * size),
        rng = random(seed);
    let weight = 0.55;
    for (const cells of [4, 8, 16, 32, 64]) {
        const grid = Float32Array.from({ length: cells * cells }, () => rng());
        for (let y = 0; y < size; y++) {
            const py = (y / size) * cells,
                iy = Math.floor(py),
                ty = py - iy;
            const v = ty * ty * (3 - 2 * ty),
                row = iy * cells,
                nextRow = ((iy + 1) % cells) * cells;
            for (let x = 0; x < size; x++) {
                const px = (x / size) * cells,
                    ix = Math.floor(px),
                    tx = px - ix,
                    u = tx * tx * (3 - 2 * tx),
                    next = (ix + 1) % cells;
                density[y * size + x] +=
                    weight *
                    ((grid[row + ix] * (1 - u) + grid[row + next] * u) * (1 - v) +
                        (grid[nextRow + ix] * (1 - u) + grid[nextRow + next] * u) * v);
            }
        }
        weight *= 0.5;
    }
    const pixels = new Uint8Array(size * size * 4);
    for (let i = 0; i < density.length; i++) {
        const relief = (density[(i + size) % density.length] - density[i]) * 8;
        const light = Math.max(0.65, Math.min(1.2, 0.9 + relief));
        const alpha = Math.max(0, Math.min(0.8, (density[i] - 0.27) * 1.9));
        // Premultiplied pixels upload directly and remain correct after context restoration.
        pixels[i * 4] = Math.min(255, ((color >> 16) & 255) * light) * alpha;
        pixels[i * 4 + 1] = Math.min(255, ((color >> 8) & 255) * light) * alpha;
        pixels[i * 4 + 2] = Math.min(255, (color & 255) * light) * alpha;
        pixels[i * 4 + 3] = alpha * 255;
    }
    return new Texture({
        source: new BufferImageSource({
            resource: pixels,
            width: size,
            height: size,
            alphaMode: 'premultiplied-alpha',
            scaleMode: 'linear',
        }),
    });
}

/** Distant cloud planes: static small textures, independent motion and a soft entry fade. */
export class VenusCloudDeck extends Container {
    private layers: { view: Container; depth: number }[] = [];
    private textures: Texture[] = [];
    constructor() {
        super();
        this.label = 'venus-cloud-deck';
        this.eventMode = 'none';
        this.alpha = 0;
        this.visible = false;
        this.addChild(new Graphics().rect(0, 0, 1600, 900).fill(0x493e43));
        for (let plane = 0; plane < 3; plane++) {
            const color = [0xa47c64, 0xceaa7d, 0xf0d4a0][plane];
            const texture = cloudTexture(0x765043 + plane * 173, color);
            this.textures.push(texture);
            const view = new Sprite(texture);
            view.anchor.set(0.5);
            view.width = 4600 - plane * 500;
            view.height = 3400 - plane * 350;
            this.layers.push({ view, depth: 0.035 + plane * 0.06 });
            this.addChild(view);
        }
    }
    override destroy() {
        super.destroy({ children: true });
        for (const texture of this.textures) texture.destroy(true);
        this.textures.length = 0;
    }
    update(active: boolean, camera: Point, angle: number, time: number, dt: number) {
        this.alpha += (Number(active) - this.alpha) * (1 - Math.exp(-dt * 3));
        this.visible = this.alpha > 0.002;
        if (!this.visible) return;
        const center = VENUS_MAPS.atmosphere.center;
        for (const { view, depth } of this.layers) {
            const offset = rotateVector(
                {
                    x: (center.x - camera.x) * depth + Math.sin(time * 0.025) * 120,
                    y: (center.y - camera.y) * depth + Math.sin(time * 0.012) * 120,
                },
                angle,
            );
            view.position.set(800 + offset.x, 450 + offset.y);
            view.rotation = angle;
        }
    }
}
