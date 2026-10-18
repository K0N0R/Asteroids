import type { Point } from '../worlds/sector';

export const HYPERDRIVE = {
    capacity: 3,
    range: 4000,
    speed: 4000,
    charge: 0.7,
    minimum: 600,
    gateRadius: 110,
} as const;
export interface Hyperlane {
    name: string;
    a: Point;
    b: Point;
}
export interface SectorRegion extends Point {
    name: string;
    radius: number;
}
export function segmentDistance(p: Point, a: Point, b: Point) {
    const dx = b.x - a.x,
        dy = b.y - a.y,
        length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
    return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
}
export function nearestGate(lanes: readonly Hyperlane[], p: Point) {
    return (
        lanes
            .flatMap((l) => [
                { name: l.name, from: l.a, to: l.b },
                { name: l.name, from: l.b, to: l.a },
            ])
            .sort(
                (a, b) =>
                    Math.hypot(a.from.x - p.x, a.from.y - p.y) -
                    Math.hypot(b.from.x - p.x, b.from.y - p.y),
            )[0] ?? null
    );
}
export class Hyperdrive {
    state: 'idle' | 'charging' | 'transit' = 'idle';
    remaining = 0;
    guided = false;
    target: Point = { x: 0, y: 0 };
    origin: Point = { x: 0, y: 0 };
    get active() {
        return this.state !== 'idle';
    }
    start(from: Point, to: Point, guided = false) {
        if (
            this.active ||
            ![from.x, from.y, to.x, to.y].every(Number.isFinite) ||
            Math.hypot(to.x - from.x, to.y - from.y) < HYPERDRIVE.minimum ||
            Math.hypot(to.x - from.x, to.y - from.y) > HYPERDRIVE.range + 1
        )
            return false;
        this.origin = { ...from };
        this.target = { ...to };
        this.remaining = HYPERDRIVE.charge;
        this.guided = guided;
        this.state = 'charging';
        return true;
    }
    cancel() {
        this.state = 'idle';
        this.remaining = 0;
    }
    charge(dt: number) {
        if (this.state !== 'charging' || !Number.isFinite(dt) || dt <= 0) return false;
        this.remaining = Math.max(0, this.remaining - dt);
        if (this.remaining > 1e-8) return false;
        this.state = 'transit';
        return true;
    }
    next(from: Point, dt: number) {
        const dx = this.target.x - from.x,
            dy = this.target.y - from.y,
            length = Math.hypot(dx, dy);
        const fraction = length ? Math.min(1, (HYPERDRIVE.speed * dt) / length) : 1;
        return {
            point: { x: from.x + dx * fraction, y: from.y + dy * fraction },
            complete: fraction === 1,
        };
    }
}
