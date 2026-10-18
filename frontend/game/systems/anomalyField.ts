import type { Point } from '../worlds/sector';

export const ANOMALY = {
    center: { x: -2400, y: -1700 },
    probe: { x: -2850, y: -1700 },
    warningSeconds: 0.8,
    damagePerSecond: 10,
    waypoints: [
        { x: -1750, y: -1050 },
        { x: -1750, y: -2300 },
        { x: -2850, y: -2300 },
    ],
} as const;

/** Separate contaminated bands leave wide, navigable corridors and a clear recovery pocket. */
export const ANOMALY_BANDS: readonly (readonly Point[])[] = [
    [
        [-1050, 210],
        [-700, 150],
        [-350, 220],
        [370, 150],
        [430, 430],
        [320, 850],
        [-1000, 790],
    ],
    [
        [-200, -300],
        [120, -360],
        [400, -270],
        [430, 10],
        [350, 150],
        [-170, 120],
    ],
    [
        [-1100, -980],
        [-600, -1030],
        [200, -950],
        [1000, -1000],
        [950, -850],
        [-1050, -810],
    ],
    [
        [-1100, -900],
        [-920, -800],
        [-960, -200],
        [-900, 450],
        [-1000, 810],
        [-1150, 400],
    ],
    [
        [850, -750],
        [1060, -690],
        [1020, -120],
        [1080, 280],
        [880, 350],
        [900, -230],
    ],
].map((polygon) => polygon.map(([x, y]) => ({ x: x + ANOMALY.center.x, y: y + ANOMALY.center.y })));

export function polygonDistance(point: Point, polygon: readonly Point[]) {
    let inside = false,
        distance = Infinity;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[j],
            b = polygon[i];
        if (
            a.y > point.y !== b.y > point.y &&
            point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
        )
            inside = !inside;
        const dx = b.x - a.x,
            dy = b.y - a.y;
        const t = Math.max(
            0,
            Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)),
        );
        distance = Math.min(distance, Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy));
    }
    return inside ? 0 : distance;
}
export function anomalyDistance(point: Point) {
    return Math.min(...ANOMALY_BANDS.map((polygon) => polygonDistance(point, polygon)));
}

/** Integrates exposure along the travelled segment; crossing a band between frames is detected. */
export class AnomalyExposure {
    exposure = 0;
    contaminated = false;
    nearby = false;
    private damageTime = 0;
    step(from: Point, to: Point, dt: number, radius: number) {
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        const samples = Math.max(1, Math.ceil(distance / 20));
        let damage = 0;
        for (let i = 1; i <= samples; i++) {
            const p = {
                x: from.x + ((to.x - from.x) * i) / samples,
                y: from.y + ((to.y - from.y) * i) / samples,
            };
            if (anomalyDistance(p) <= radius) {
                const before = Math.max(0, this.exposure - ANOMALY.warningSeconds);
                this.exposure += dt / samples;
                this.damageTime += Math.max(0, this.exposure - ANOMALY.warningSeconds) - before;
                while (this.damageTime + 1e-8 >= 0.5) {
                    damage += ANOMALY.damagePerSecond * 0.5;
                    this.damageTime = Math.max(0, this.damageTime - 0.5);
                }
            } else {
                this.exposure = 0;
                this.damageTime = 0;
            }
        }
        const edge = anomalyDistance(to);
        this.contaminated = edge <= radius;
        this.nearby = edge < radius + 180;
        return damage;
    }
    get status() {
        return this.contaminated
            ? this.exposure < ANOMALY.warningSeconds
                ? 'ANOMALIA · opuść skażone pasmo!'
                : 'SKAŻENIE · 10 obrażeń/s · wróć do jasnego korytarza!'
            : this.nearby
              ? 'Granica skażenia · jasne korytarze są bezpieczne'
              : '';
    }
}
