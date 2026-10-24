import { Graphics, Text, type Application, type Container } from 'pixi.js';

/** Pause on GPU loss, then rebuild retained graphics and CPU-backed scene resources. */
export function bindRenderContextRecovery(
    app: Pick<Application, 'canvas' | 'stage' | 'ticker'>,
    callbacks: { lost?: () => void; restored?: () => void } = {},
) {
    let resume = false;
    let contextLost = false;
    let banner: HTMLElement | null = null;
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
        visit(app.stage, (node) => node.suspendRenderContext?.());
        callbacks.lost?.();
        if (typeof document !== 'undefined') {
            banner = document.createElement('div');
            banner.textContent = 'Przywracanie grafiki. Rozgrywka jest wstrzymana.';
            banner.style.cssText =
                'position:fixed;inset:0;z-index:100000;background:#10152bef;color:#b5f0dc;display:grid;place-items:center;font:20px sans-serif';
            document.body.appendChild(banner);
        }
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
        banner?.remove();
        banner = null;
        contextLost = false;
        if (resume) app.ticker.start();
        resume = false;
    };
    app.canvas.addEventListener('webglcontextlost', lost);
    app.canvas.addEventListener('webglcontextrestored', restored);
    return () => {
        banner?.remove();
        app.canvas.removeEventListener('webglcontextlost', lost);
        app.canvas.removeEventListener('webglcontextrestored', restored);
    };
}
