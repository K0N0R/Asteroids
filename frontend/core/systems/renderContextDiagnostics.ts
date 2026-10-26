import { Graphics, Text, type Application, type Container } from 'pixi.js';
import { heapMB } from './frameDiagnostics';
import { watchRenderTrace } from './renderTrace';

export const WEBGL_REPORT_KEY = 'asteroids.webgl-report';
type DiagnosticApp = Pick<Application, 'canvas' | 'stage' | 'ticker'> &
    Partial<Pick<Application, 'renderer'>>;

/** Bounded pre-failure history; never retains display objects or GPU resources. */
export class RenderContextJournal {
    readonly samples: { at: string; data: unknown }[] = [];
    readonly events: { at: string; kind: string; detail: string }[] = [];
    sample(data: unknown) {
        this.samples.push({ at: new Date().toISOString(), data });
        if (this.samples.length > 30) this.samples.shift();
    }
    event(kind: string, detail: string) {
        this.events.push({ at: new Date().toISOString(), kind, detail: detail.slice(0, 4000) });
        if (this.events.length > 40) this.events.shift();
    }
}

export class RenderContextDiagnostics {
    private stopTrace: (() => void) | null = null;
    private journal = new RenderContextJournal();
    private timer: ReturnType<typeof setInterval> | undefined;
    private report: Record<string, unknown> | null = null;
    private panel: HTMLDivElement | null = null;
    private reopen: HTMLButtonElement | null = null;
    private resumeAfterReport = false;
    private losses = 0;
    private lostAt = 0;
    private gpu: Record<string, unknown> = {};
    private onError = (e: ErrorEvent) =>
        this.journal.event('error', String(e.error?.stack ?? e.message));
    private onRejection = (e: PromiseRejectionEvent) =>
        this.journal.event('unhandledrejection', String(e.reason?.stack ?? e.reason));
    private onVisibility = () => this.journal.event('visibility', document.visibilityState);
    private onResize = () =>
        this.journal.event(
            'resize',
            `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
        );
    constructor(
        private app: DiagnosticApp,
        private clearInput: () => void = () => {},
    ) {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        this.stopTrace = watchRenderTrace((kind, detail) => this.journal.event(kind, detail));
        const gl = (app.renderer as unknown as { gl?: WebGLRenderingContext })?.gl;
        if (gl) {
            const debug = gl.getExtension('WEBGL_debug_renderer_info');
            this.gpu = {
                version: gl.getParameter(gl.VERSION),
                vendor: gl.getParameter(debug?.UNMASKED_VENDOR_WEBGL ?? gl.VENDOR),
                renderer: gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                attributes: gl.getContextAttributes(),
            };
        }
        window.addEventListener('error', this.onError);
        window.addEventListener('unhandledrejection', this.onRejection);
        window.addEventListener('resize', this.onResize);
        document.addEventListener('visibilitychange', this.onVisibility);
        this.sample();
        this.timer = setInterval(() => this.sample(), 2000);
    }
    private sample() {
        try {
            this.captureSample();
        } catch (error) {
            this.journal.event('diagnostics-error', String(error));
        }
    }
    private captureSample() {
        const scene = { nodes: 0, graphics: 0, texts: 0, cached: 0 };
        const details: unknown[] = [];
        const visit = (node: Container & { renderDiagnostics?(): unknown }) => {
            if (node.destroyed) return;
            scene.nodes++;
            if (node instanceof Graphics) scene.graphics++;
            if (node instanceof Text) scene.texts++;
            if (node.isCachedAsTexture) scene.cached++;
            if (node.renderDiagnostics) details.push(node.renderDiagnostics());
            for (const child of node.children) visit(child);
        };
        visit(this.app.stage);
        const renderer = this.app.renderer as unknown as {
            resolution?: number;
            buffer?: { _gpuBuffers?: Record<string, { byteLength: number }> };
            texture?: {
                managedTextures?: { pixelWidth: number; pixelHeight: number; label?: string }[];
            };
        };
        const textures = renderer?.texture?.managedTextures ?? [];
        const buffers = Object.values(renderer?.buffer?._gpuBuffers ?? {});
        this.journal.sample({
            canvas: {
                width: this.app.canvas.width,
                height: this.app.canvas.height,
                resolution: renderer?.resolution,
                viewportWidth: typeof window === 'undefined' ? undefined : window.innerWidth,
                viewportHeight: typeof window === 'undefined' ? undefined : window.innerHeight,
            },
            buffers: {
                count: buffers.length,
                estimatedMB: buffers.reduce((n, b) => n + (b.byteLength || 0), 0) / 1048576,
            },
            fps: this.app.ticker.FPS,
            heapMB: heapMB(),
            scene,
            textures: {
                count: textures.length,
                estimatedRGBA8MB:
                    textures.reduce((n, t) => n + t.pixelWidth * t.pixelHeight * 4, 0) / 1048576,
                largest: textures
                    .map((t) => ({ label: t.label, width: t.pixelWidth, height: t.pixelHeight }))
                    .sort((a, b) => b.width * b.height - a.width * a.height)
                    .slice(0, 8),
            },
            details,
        });
    }
    lost(event: Event) {
        this.losses++;
        this.lostAt = performance.now();
        this.sample();
        const statusMessage = (event as WebGLContextEvent).statusMessage ?? '';
        this.journal.event('webglcontextlost', statusMessage);
        this.report = {
            schema: 1,
            event: 'CONTEXT_LOST_WEBGL',
            at: new Date().toISOString(),
            losses: this.losses,
            statusMessage,
            restored: false,
            userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
            gpu: this.gpu,
            // This is the event-handler stack, not a GPU/driver crash stack.
            lossHandlerStack: new Error('WebGL context loss observed').stack,
            recentSamples: [...this.journal.samples],
            recentEvents: [...this.journal.events],
        };
        this.persist();
        console.error(
            '[Asteroids WebGL context lost] Skopiuj raport z okna diagnostyki:',
            JSON.stringify(this.report, null, 2),
        );
        if (typeof document !== 'undefined') this.show(true);
    }
    restored() {
        if (!this.report) return;
        this.journal.event('webglcontextrestored', 'Graphics restored');
        Object.assign(this.report, {
            restored: true,
            restoredAt: new Date().toISOString(),
            recoveryMS: performance.now() - this.lostAt,
            recentEvents: [...this.journal.events],
        });
        this.persist();
        console.info('[Asteroids WebGL context restored]', JSON.stringify(this.report));
        if (typeof document !== 'undefined') this.show(false);
    }
    private persist() {
        try {
            localStorage.setItem(WEBGL_REPORT_KEY, JSON.stringify(this.report));
        } catch {
            /* Report remains in the panel and console. */
        }
    }
    private show(lost: boolean) {
        this.clearInput();
        if (!lost && this.app.ticker.started) {
            this.resumeAfterReport = true;
            this.app.ticker.stop();
        }
        this.panel?.remove();
        this.reopen?.remove();
        this.panel = document.createElement('div');
        // Keep native text selection/copy shortcuts out of the flight controls.
        this.panel.addEventListener('keydown', (event) => event.stopPropagation());
        this.panel.addEventListener('keyup', (event) => event.stopPropagation());
        this.panel.style.cssText =
            'position:fixed;inset:0;z-index:100000;background:#10152bf5;color:#b5f0dc;padding:24px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;font:16px sans-serif';
        const title = document.createElement('strong');
        title.textContent = lost
            ? 'Utrata kontekstu WebGL · gra wstrzymana'
            : 'Grafika przywrócona · raport utraty WebGL';
        const info = document.createElement('div');
        info.textContent =
            'Skopiuj raport i prześlij go w czacie. Zawiera stan sceny, pamięci i zdarzenia sprzed awarii. Przeglądarka nie udostępnia stosu awarii sterownika GPU.';
        const report = document.createElement('textarea');
        report.setAttribute('aria-label', 'Raport diagnostyczny WebGL');
        report.readOnly = true;
        report.value = JSON.stringify(this.report, null, 2);
        report.style.cssText =
            'width:100%;flex:1;min-height:100px;background:#080d1c;color:#cde2ec;font:12px monospace;box-sizing:border-box';
        const actions = document.createElement('div');
        const copy = document.createElement('button');
        copy.textContent = 'Kopiuj raport';
        copy.onclick = async () => {
            try {
                await navigator.clipboard.writeText(report.value);
                copy.textContent = 'Skopiowano';
            } catch {
                report.focus();
                report.select();
                copy.textContent = 'Zaznaczono · Ctrl+C';
            }
        };
        const download = document.createElement('button');
        download.textContent = 'Zapisz raport JSON';
        download.onclick = () => {
            const url = URL.createObjectURL(new Blob([report.value], { type: 'application/json' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'asteroids-webgl-report.json';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
        const close = document.createElement('button');
        close.textContent = lost ? 'Oczekiwanie na przywrócenie grafiki…' : 'Zamknij raport';
        close.disabled = lost;
        close.onclick = () => {
            this.panel?.remove();
            this.clearInput();
            if (this.resumeAfterReport) this.app.ticker.start();
            this.resumeAfterReport = false;
        };
        actions.append(copy, download, close);
        this.panel.append(title, info, report, actions);
        document.body.append(this.panel);
        if (!lost) {
            this.reopen = document.createElement('button');
            this.reopen.textContent = 'Raport WebGL';
            this.reopen.addEventListener('keydown', (event) => event.stopPropagation());
            this.reopen.addEventListener('keyup', (event) => event.stopPropagation());
            this.reopen.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:99999';
            this.reopen.onclick = () => this.show(false);
            document.body.append(this.reopen);
        }
    }
    dispose() {
        this.stopTrace?.();
        this.stopTrace = null;
        if (this.timer !== undefined) clearInterval(this.timer);
        this.panel?.remove();
        this.reopen?.remove();
        if (typeof window === 'undefined') return;
        window.removeEventListener('error', this.onError);
        window.removeEventListener('unhandledrejection', this.onRejection);
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('visibilitychange', this.onVisibility);
    }
}
