import { BufferImageSource, Container, Sprite, Texture } from 'pixi.js';
import { random } from '../worlds/sector';

const smooth = (t: number) => t * t * (3 - 2 * t);
function noise(x: number, y: number) {
    const ix = Math.floor(x),
        iy = Math.floor(y),
        tx = smooth(x - ix),
        ty = smooth(y - iy);
    const hash = (a: number, b: number) => {
        let n = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ 150082;
        n = Math.imul(n ^ (n >>> 13), 1274126177);
        return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const a = hash(ix, iy),
        b = hash(ix + 1, iy),
        c = hash(ix, iy + 1),
        d = hash(ix + 1, iy + 1);
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
}
function clouds(x: number, y: number) {
    return (
        noise(x, y) * 0.53 +
        noise(x * 2.07 + 17, y * 2.07 - 3) * 0.27 +
        noise(x * 4.19 - 9, y * 4.19 + 8) * 0.13 +
        noise(x * 8.3, y * 8.3) * 0.07
    );
}

/** A continuous noisy star cloud: dust attenuates the light, never cuts empty ribbons. */
export function milkyWayView() {
    const root = new Container();
    root.label = 'milky-way';
    root.eventMode = 'none';
    const width = 1800,
        height = 1000,
        scale = 2,
        left = -1000,
        top = -500;
    const pixels = new Uint8Array(width * height * 4);
    const spine = (x: number) => 510 - (x - 800) * 0.16 + Math.sin((x + 350) / 690) * 34;
    const coreAt = (x: number) => Math.exp(-1 * ((x - 760) / 470) ** 2);
    const density = (x: number, offset: number) => {
        const core = coreAt(x),
            broad = 68 + core * 90;
        const warp = clouds(x / 360 + 7, offset / 200 - 11);
        const detail = clouds(x / 150 + warp * 1.8, offset / 95 + warp * 1.5);
        const dust = clouds(x / 210 - 15 + warp, offset / 88 + 8);
        const lane = Math.exp(-0.5 * ((offset - (warp - 0.5) * 110) / (16 + core * 18)) ** 2);
        const obscured = smooth(Math.min(1, Math.max(0, (dust - 0.38) / 0.32)));
        const profile = Math.exp(-0.5 * (offset / broad) ** 2);
        const wisps = Math.floor(detail * 7) / 6;
        const halo = Math.exp(-0.5 * (offset / (broad * 1.85)) ** 2);
        return {
            core,
            halo,
            light: profile * (0.22 + wisps * 1.05) * (1 - obscured * lane * 0.9),
        };
    };
    for (let y = 0; y < height; y++) {
        const worldY = top + y * scale;
        for (let x = 0; x < width; x++) {
            const worldX = left + x * scale,
                offset = worldY - spine(worldX);
            const { core, halo, light } = density(worldX, offset);
            const taper = Math.min(1, x / 110, (width - 1 - x) / 110);
            const alpha = Math.min(0.82, halo * 0.09 + light * (0.42 + core * 0.46)) * taper;
            const luminous = Math.min(1, light * (0.3 + core * 0.85));
            const blue = smooth(
                Math.min(1, Math.max(0, 1 - Math.abs(offset) / (100 + core * 110))),
            );
            const edge = clouds(worldX / 250 + 30, offset / 120);
            const index = (y * width + x) * 4;
            pixels[index] = (91 + edge * 39 + luminous * 104) * alpha;
            pixels[index + 1] = (42 + blue * 101 + luminous * 108) * alpha;
            pixels[index + 2] = (174 + blue * 43 + luminous * 38) * alpha;
            pixels[index + 3] = alpha * 255;
        }
    }
    // Subpixel splats keep the stars fine instead of turning the band into confetti.
    const star = (x: number, y: number, alpha: number, blue: number) => {
        const px = (x - left) / scale,
            py = (y - top) / scale;
        const ix = Math.floor(px),
            iy = Math.floor(py);
        for (let dy = 0; dy <= 1; dy++)
            for (let dx = 0; dx <= 1; dx++) {
                if (ix + dx < 0 || ix + dx >= width || iy + dy < 0 || iy + dy >= height) continue;
                const a = alpha * (dx ? px - ix : 1 - (px - ix)) * (dy ? py - iy : 1 - (py - iy));
                const i = ((iy + dy) * width + ix + dx) * 4;
                pixels[i] = pixels[i] * (1 - a) + (245 - blue * 35) * a;
                pixels[i + 1] = pixels[i + 1] * (1 - a) + (246 - blue * 8) * a;
                pixels[i + 2] = pixels[i + 2] * (1 - a) + 255 * a;
                pixels[i + 3] = pixels[i + 3] * (1 - a) + 255 * a;
            }
    };
    const rng = random(150082);
    for (let i = 0; i < 62000; i++) {
        const x = -950 + rng() * 3500,
            core = coreAt(x);
        const offset = (rng() + rng() + rng() + rng() - 2) * (90 + core * 100);
        const sample = density(x, offset);
        if (rng() > sample.light * 1.15) continue;
        star(x, spine(x) + offset, 0.18 + rng() * 0.67, core * rng());
    }
    for (let i = 0; i < 85; i++) {
        const x = -850 + rng() * 3200,
            y = spine(x) + (rng() - 0.5) * 580;
        star(x, y, 0.9, rng());
        for (let j = 0; j < 9; j++) {
            const angle = rng() * Math.PI * 2;
            star(x + Math.cos(angle) * 2.3, y + Math.sin(angle) * 2.3, 0.08, 0.3);
        }
    }
    const texture = new Texture({
        source: new BufferImageSource({
            resource: pixels,
            width,
            height,
            alphaMode: 'premultiplied-alpha',
            scaleMode: 'linear',
            label: 'Milky Way cloud field',
        }),
    });
    const view = new Sprite(texture);
    view.position.set(left, top);
    view.scale.set(scale);
    root.addChild(view);
    root.on('destroyed', () => texture.destroy(true));
    return root;
}
