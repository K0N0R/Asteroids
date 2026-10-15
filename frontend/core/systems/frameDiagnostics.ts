export interface FrameReport {
    frames: number;
    seconds: number;
    fps: number;
    p95MS: number;
    maxMS: number;
    slowFrames: number;
    heapStartMB: number | null;
    heapEndMB: number | null;
    heapPeakMB: number | null;
}

export function heapMB(): number | null {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    return memory ? memory.usedJSHeapSize / 1048576 : null;
}

/** Bounded histogram: no per-frame arrays, no listeners or animation loops to retain a mission. */
export class FrameSample {
    private histogram = new Uint32Array(2001);
    private previous: number | null = null;
    private warmupMS = 1000;
    private frames = 0;
    private totalMS = 0;
    private maxMS = 0;
    private slowFrames = 0;
    private heapStartMB: number | null;
    private heapEndMB: number | null;
    private heapPeakMB: number | null;
    constructor(memory: number | null = null) {
        this.heapStartMB = this.heapEndMB = this.heapPeakMB = memory;
    }
    frame(now: number, active: boolean, memory: number | null = null) {
        if (memory !== null) {
            this.heapEndMB = memory;
            this.heapPeakMB = Math.max(this.heapPeakMB ?? memory, memory);
        }
        if (!active) {
            this.previous = null;
            return;
        }
        const previous = this.previous;
        this.previous = now;
        if (previous === null || now <= previous) return;
        const delta = now - previous;
        if (this.warmupMS > 0) {
            this.warmupMS -= delta;
            return;
        }
        this.frames++;
        this.totalMS += delta;
        this.maxMS = Math.max(this.maxMS, delta);
        if (delta > 33.34) this.slowFrames++;
        this.histogram[Math.min(2000, Math.ceil(delta))]++;
    }
    report(): FrameReport {
        const threshold = Math.ceil(this.frames * 0.95);
        let count = 0,
            p95MS = 0;
        for (let i = 0; i < this.histogram.length && count < threshold; i++) {
            count += this.histogram[i];
            p95MS = i;
        }
        return {
            frames: this.frames,
            seconds: this.totalMS / 1000,
            fps: this.totalMS ? (this.frames * 1000) / this.totalMS : 0,
            p95MS,
            maxMS: this.maxMS,
            slowFrames: this.slowFrames,
            heapStartMB: this.heapStartMB,
            heapEndMB: this.heapEndMB,
            heapPeakMB: this.heapPeakMB,
        };
    }
}

/** Called before ticker delta clamping, so real stalls remain visible in the report. */
export class FrameDiagnostics {
    private static current: { sample: FrameSample; active: () => boolean } | null = null;
    static start(active: () => boolean) {
        this.current = { sample: new FrameSample(heapMB()), active };
    }
    static frame() {
        if (!this.current) return;
        this.current.sample.frame(
            performance.now(),
            document.visibilityState === 'visible' && this.current.active(),
            heapMB(),
        );
    }
    static stop(): FrameReport | undefined {
        const report = this.current?.sample.report();
        this.current = null;
        return report;
    }
}
