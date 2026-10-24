export const INTERACTION_SECONDS = 1;

import type { Point } from '../worlds/sector';
export interface InteractionTarget extends Point {
    id: string;
    kind: 'gate' | 'tow' | 'world';
    name: string;
}
/** One target per held press. Losing it requires a fresh press, never a silent retarget. */
export class InteractionLatch {
    target: InteractionTarget | null = null;
    private blocked = false;
    get requiresRelease() {
        return this.blocked;
    }
    resolve(held: boolean, candidates: readonly InteractionTarget[], aim: Point) {
        if (!held) {
            this.target = null;
            this.blocked = false;
            return null;
        }
        if (this.blocked) return null;
        if (this.target) {
            const current = candidates.find((candidate) => candidate.id === this.target!.id);
            if (!current) {
                this.target = null;
                this.blocked = true;
                return null;
            }
            this.target = current;
            return current;
        }
        this.target =
            [...candidates].sort(
                (a, b) =>
                    Math.hypot(a.x - aim.x, a.y - aim.y) - Math.hypot(b.x - aim.x, b.y - aim.y),
            )[0] ?? null;
        return this.target;
    }
}
