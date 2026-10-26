import { Graphics, Text, type Application, type Container } from 'pixi.js';
import { RenderContextDiagnostics } from './renderContextDiagnostics';

/** Pause on GPU loss, then rebuild retained graphics and CPU-backed scene resources. */
export function bindRenderContextRecovery(
    app: Pick<Application, 'canvas' | 'stage' | 'ticker'> & Partial<Pick<Application, 'renderer'>>,
    callbacks: { lost?: () => void; restored?: () => void; clearInput?: () => void } = {},
) {
    let resume = false;
    let contextLost = false;
    const diagnostics = new RenderContextDiagnostics(app, callbacks.clearInput);
    const visit = (
        view: Container,
        action: (
            node: Container & { suspendRenderContext?(): void; recoverRenderContext?(): void },
        ) => void,
    ) => {
        if (view.destroyed) return;
        action(view);
        for (const child of view.children) visit(child, action);
    };
    const lost = (event: Event) => {
        event.preventDefault();
        if (contextLost) return;
        contextLost = true;
        resume = app.ticker.started;
        app.ticker.stop();
        diagnostics.lost(event);
        visit(app.stage, (node) => node.suspendRenderContext?.());
        callbacks.lost?.();
    };
    const restored = () => {
        if (!contextLost) return;
        const refresh = (view: Container) => {
            if (view.destroyed) return;
            if (view instanceof Text) view.onViewUpdate();
            if (view instanceof Graphics) {
                view.context.dirty = true;
                view.context.emit('update', view.context);
            }
            for (const child of view.children) refresh(child);
            if (view.isCachedAsTexture) view.updateCacheTexture();
            (view as Container & { recoverRenderContext?(): void }).recoverRenderContext?.();
        };
        // Pooled text canvases may have been reused since their original GPU upload.
        refresh(app.stage);
        callbacks.restored?.();
        contextLost = false;
        if (resume) app.ticker.start();
        resume = false;
        diagnostics.restored();
    };
    app.canvas.addEventListener('webglcontextlost', lost);
    app.canvas.addEventListener('webglcontextrestored', restored);
    return () => {
        diagnostics.dispose();
        app.canvas.removeEventListener('webglcontextlost', lost);
        app.canvas.removeEventListener('webglcontextrestored', restored);
    };
}
