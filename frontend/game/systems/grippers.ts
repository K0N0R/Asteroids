import type { Mount } from '../config';
import { rotateVector } from './flight';
import type { Point } from '../worlds/sector';

export interface Resource extends Point {
    id: number;
    kind: 'ore' | 'parts' | 'crystals' | 'copperOre' | 'mercuryOre';
    amount: number;
}
export interface Gripper {
    mount: Mount;
    phase: 'idle' | 'extend' | 'return';
    targetId: number | null;
    tip: Point;
    previous: Point;
    held: 'ore' | 'parts' | 'crystals' | 'copperOre' | 'mercuryOre' | null;
}
export class GripperSystem {
    readonly arms: Gripper[];
    constructor(
        mounts: readonly Mount[],
        public range: number,
    ) {
        this.arms = mounts.map((mount) => ({
            mount,
            phase: 'idle',
            targetId: null,
            tip: { x: 0, y: 0 },
            previous: { x: 0, y: 0 },
            held: null,
        }));
    }
    speedMultiplier = 1;
    origin(arm: Gripper, ship: Point, angle: number, size: number): Point {
        const p = rotateVector({ x: arm.mount.x * size, y: arm.mount.y * size }, angle);
        return { x: ship.x + p.x, y: ship.y + p.y };
    }
    update(
        dt: number,
        ship: Point,
        angle: number,
        size: number,
        space: number,
        loot: Map<number, Resource>,
        deliver: (kind: 'ore' | 'parts' | 'crystals' | 'copperOre' | 'mercuryOre') => void,
        clearLine: (a: Point, b: Point) => boolean,
    ) {
        const reserved = new Set(this.arms.map((arm) => arm.targetId).filter((id) => id !== null));
        for (const arm of this.arms) {
            const origin = this.origin(arm, ship, angle, size);
            arm.previous = { ...arm.tip };
            if (arm.phase === 'idle') {
                arm.tip = { ...origin };
                arm.previous = { ...origin };
                const pending = this.arms.filter((other) => other.phase !== 'idle').length;
                if (space <= pending) continue;
                let best: Resource | undefined,
                    distance = this.range;
                for (const item of loot.values()) {
                    const gap = Math.hypot(item.x - origin.x, item.y - origin.y);
                    if (
                        item.amount > 0 &&
                        !reserved.has(item.id) &&
                        gap < distance &&
                        clearLine(origin, item)
                    ) {
                        best = item;
                        distance = gap;
                    }
                }
                if (!best) continue;
                arm.targetId = best.id;
                reserved.add(best.id);
                arm.phase = 'extend';
            }
            let target = origin;
            if (arm.phase === 'extend') {
                const item = loot.get(arm.targetId!);
                if (
                    !item ||
                    Math.hypot(item.x - origin.x, item.y - origin.y) > this.range ||
                    !clearLine(origin, item)
                ) {
                    reserved.delete(arm.targetId!);
                    arm.targetId = null;
                    arm.phase = 'return';
                } else target = item;
            }
            let dx = target.x - arm.tip.x,
                dy = target.y - arm.tip.y,
                distance = Math.hypot(dx, dy);
            if (arm.phase === 'return' && distance > this.range) {
                arm.tip = {
                    x: origin.x - (dx / distance) * this.range,
                    y: origin.y - (dy / distance) * this.range,
                };
                dx = origin.x - arm.tip.x;
                dy = origin.y - arm.tip.y;
                distance = this.range;
            }
            const travel = Math.min(
                distance,
                (arm.phase === 'extend' ? 360 : 500) * this.speedMultiplier * dt,
            );
            if (distance > 0) {
                arm.tip.x += (dx / distance) * travel;
                arm.tip.y += (dy / distance) * travel;
            }
            if (distance > travel + 1e-6) continue;
            if (arm.phase === 'extend') {
                const item = loot.get(arm.targetId!);
                if (item && item.amount > 0) {
                    arm.held = item.kind;
                    item.amount--;
                    if (item.amount === 0) loot.delete(item.id);
                }
                reserved.delete(arm.targetId!);
                arm.targetId = null;
                arm.phase = 'return';
            } else if (arm.phase === 'return') {
                if (arm.held && space > 0) {
                    deliver(arm.held);
                    space--;
                } else if (arm.held) continue;
                arm.held = null;
                arm.phase = 'idle';
            }
        }
    }
    clear() {
        for (const arm of this.arms) {
            arm.held = null;
            arm.targetId = null;
            arm.phase = 'idle';
        }
    }
}
