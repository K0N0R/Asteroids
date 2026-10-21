import { CanvasPool, TexturePool, type Texture } from 'pixi.js';

/** Drain idle buffers only. Pixi 8 clear() drops buckets still needed by checked-out textures. */
export function releaseSceneBuffers() {
    // Pixi has no public trim API. Keep bucket identities so live resources can return safely.
    const textures = (TexturePool as unknown as { _texturePool?: Record<string, Texture[]> })
        ._texturePool;
    if (textures)
        for (const bucket of Object.values(textures)) {
            for (const texture of bucket.splice(0)) texture.destroy(true);
        }
    const canvases = (CanvasPool as unknown as { _canvasPool?: Record<string, unknown[]> })
        ._canvasPool;
    if (canvases) for (const bucket of Object.values(canvases)) bucket.length = 0;
}
