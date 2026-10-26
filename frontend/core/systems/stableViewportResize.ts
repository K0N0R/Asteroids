import { traceRenderEvent } from './renderTrace';
type Size = { width: number; height: number; resolution: number };
type Schedule = (fn: () => void) => () => void;

/** Commit only a settled viewport. Never allocate a backbuffer while GL is lost or hidden. */
export class StableViewportResize {
    private pending: Size | null = null;
    private applied = '';
    private cancel: (() => void) | null = null;
    private suspended = false;
    constructor(
        private apply: (size: Size) => void,
        private schedule: Schedule = (fn) => {
            const timer = setTimeout(fn, 120);
            return () => clearTimeout(timer);
        },
    ) {}
    request(width: number, height: number, resolution: number) {
        if (
            ![width, height, resolution].every(Number.isFinite) ||
            width <= 0 ||
            height <= 0 ||
            resolution <= 0
        )
            return;
        this.pending = { width: Math.round(width), height: Math.round(height), resolution };
        traceRenderEvent('viewport-request', `${width}x${height}@${resolution}`);
        this.cancel?.();
        this.cancel = null;
        if (!this.suspended) this.cancel = this.schedule(() => this.flush());
    }
    suspend(value: boolean) {
        this.suspended = value;
        if (value) {
            this.cancel?.();
            this.cancel = null;
        }
    }
    flush() {
        this.cancel?.();
        this.cancel = null;
        if (this.suspended || !this.pending) return;
        const size = this.pending;
        this.pending = null;
        const key = `${size.width}x${size.height}@${size.resolution}`;
        if (key === this.applied) return;
        traceRenderEvent('viewport-apply', key);
        this.apply(size);
        this.applied = key;
    }
    dispose() {
        this.cancel?.();
        this.cancel = null;
        this.pending = null;
    }
}
