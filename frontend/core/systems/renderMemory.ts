import { CanvasPool, TexturePool, type Text, type Texture } from 'pixi.js';

/** Pixi 8's BatchableText.destroy leaves its resolution runner subscription behind. */
export function bindTextRendererCleanup(text: Text) {
    text.once('destroyed', () => {
        // Run before ViewContainer destroys GPU data and clears BatchableText._renderer.
        const data = (
            text as unknown as {
                _gpuData?: Record<
                    string,
                    {
                        _renderer?: {
                            runners: { resolutionChange: { remove(item: unknown): void } };
                        };
                    }
                >;
            }
        )._gpuData;
        for (const batch of Object.values(data ?? {}))
            batch._renderer?.runners.resolutionChange.remove(batch);
    });
}

/** Drain idle buffers only. Pixi 8 clear() drops buckets still needed by checked-out textures. */
export function releaseSceneBuffers() {
    // Pixi has no public trim API. Keep bucket identities so live resources can return safely.
    const pool = TexturePool as unknown as {
        _texturePool?: Record<string, Texture[]>;
        _poolKeyHash?: Record<number, number>;
    };
    const textures = pool._texturePool;
    if (textures)
        for (const bucket of Object.values(textures)) {
            for (const texture of bucket.splice(0)) {
                if (pool._poolKeyHash) delete pool._poolKeyHash[texture.uid];
                texture.destroy(true);
            }
        }
    const canvases = (CanvasPool as unknown as { _canvasPool?: Record<string, unknown[]> })
        ._canvasPool;
    if (canvases) for (const bucket of Object.values(canvases)) bucket.length = 0;
}
