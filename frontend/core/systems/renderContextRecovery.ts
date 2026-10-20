import { Graphics, Text, type Application, type Container } from 'pixi.js';

/** Rebuild retained text and vector geometry after Pixi restores the GPU context. */
export function bindRenderContextRecovery(app: Pick<Application, 'canvas' | 'stage' | 'ticker'>) {
    let resume = false;
    const lost = (event: Event) => {
        event.preventDefault();
        resume = app.ticker.started;
        app.ticker.stop();
    };
    const restored = () => {
        const refresh = (view: Container) => {
            if (view instanceof Text) view.onViewUpdate();
            if (view instanceof Graphics) {
                view.context.dirty = true;
                view.context.emit('update', view.context);
            }
            for (const child of view.children) refresh(child);
            if (view.isCachedAsTexture) view.updateCacheTexture();
        };
        // Pooled text canvases may have been reused since their original GPU upload.
        refresh(app.stage);
        if (resume) app.ticker.start();
        resume = false;
    };
    app.canvas.addEventListener('webglcontextlost', lost);
    app.canvas.addEventListener('webglcontextrestored', restored);
    return () => {
        app.canvas.removeEventListener('webglcontextlost', lost);
        app.canvas.removeEventListener('webglcontextrestored', restored);
    };
}
