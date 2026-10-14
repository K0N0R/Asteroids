import type { Point } from '../worlds/sector';

export const HARPOON_ARMS = {
    reach: 150,
    jawRadius: 22,
    jawOpen: 20,
    jawClosed: 2,
    cycle: 0.32,
    contactTime: 0.08,
    releaseTime: 0.14,
    rockDamage: 45,
    shipDamage: 95,
} as const;

export interface HarpoonArmPose {
    shoulder: Point;
    elbow: Point;
    tip: Point;
    angle: number;
    closure: number;
}

export class HarpoonArms {
    extension = 0;
    closure = 0;
    private pressed = false;
    private cycleTime = HARPOON_ARMS.cycle as number;
    private contacted = true;
    private target: Point = { x: HARPOON_ARMS.reach, y: 0 };
    private limits = new Map<number, Point>();

    constructor(
        readonly handling = 0,
        readonly power = 0,
    ) {}

    get reach() {
        return HARPOON_ARMS.reach * (1 + this.handling * 0.15);
    }
    get damageMultiplier() {
        return 1 + this.power * 0.25;
    }
    update(dt: number, target: Point, extend: boolean, fire: boolean) {
        this.limits.clear();
        if (fire && !this.pressed && this.cycleTime >= HARPOON_ARMS.cycle) {
            this.cycleTime = 0;
            this.contacted = false;
        }
        this.pressed = fire;
        this.target = { ...target };
        const active = this.cycleTime < HARPOON_ARMS.cycle;
        const desired = extend ? 1 : active ? 0.35 : 0;
        const speed = dt * 3 * (1 + this.handling * 0.2);
        this.extension += Math.max(-speed, Math.min(speed, desired - this.extension));
        this.cycleTime = Math.min(HARPOON_ARMS.cycle, this.cycleTime + dt);
        this.closure = active
            ? Math.max(
                  0,
                  this.cycleTime <= HARPOON_ARMS.contactTime
                      ? this.cycleTime / HARPOON_ARMS.contactTime
                      : 1 - (this.cycleTime - HARPOON_ARMS.contactTime) / HARPOON_ARMS.releaseTime,
              )
            : 0;
        const strike = !this.contacted && this.cycleTime >= HARPOON_ARMS.contactTime;
        if (strike) this.contacted = true;
        return strike;
    }
    constrainTip(index: number, point: Point) {
        this.limits.set(index, { ...point });
    }
    get poses(): readonly HarpoonArmPose[] {
        const angle = Math.atan2(this.target.y, this.target.x);
        const distance = Math.min(
            this.reach,
            Math.max(65, Math.hypot(this.target.x, this.target.y)),
        );
        return [-1, 1].map((side, index) => {
            const shoulder = { x: 8, y: side * 18 };
            const spread = side * (28 - this.closure * 16);
            const deployed = {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance + spread,
            };
            const tip = this.limits.get(index) ?? {
                x: 12 + (deployed.x - 12) * this.extension,
                y: side * 40 + (deployed.y - side * 40) * this.extension,
            };
            const dx = tip.x - shoulder.x,
                dy = tip.y - shoulder.y;
            const length = Math.max(0.001, Math.hypot(dx, dy));
            const segment = Math.max(18, length / 2 + 2 * (1 - this.extension));
            const bend = Math.sqrt(Math.max(0, segment * segment - (length * length) / 4));
            const bendSide = dx >= 0 ? side : -side;
            const elbow = {
                x:
                    -14 * (1 - this.extension) +
                    ((shoulder.x + tip.x) / 2 - (dy / length) * bend * bendSide) * this.extension,
                y:
                    side * 32 * (1 - this.extension) +
                    ((shoulder.y + tip.y) / 2 + (dx / length) * bend * bendSide) * this.extension,
            };
            return {
                shoulder,
                elbow,
                tip,
                angle: angle * this.extension,
                closure: this.closure,
            };
        });
    }
}
