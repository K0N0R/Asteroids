import { HULLS, type HullId } from '../config';

export function shieldProfile(hull: HullId, level = 0) {
    const base = HULLS[hull].shield;
    return {
        capacity: Math.round(base.capacity * (1 + level * 0.25)),
        regen: base.regen * (1 + level * 0.15),
        delay: base.delay,
    };
}
export class KineticShield {
    charge: number;
    cooldown = 0;
    flash = 0;
    constructor(readonly profile: ReturnType<typeof shieldProfile>) {
        this.charge = profile.capacity;
    }
    absorb(damage: number) {
        if (!Number.isFinite(damage) || damage <= 0) return { absorbed: 0, hull: 0 };
        const absorbed = Math.min(this.charge, damage);
        this.charge = Math.max(0, this.charge - absorbed);
        this.cooldown = this.profile.delay;
        if (absorbed) this.flash = 0.35;
        return { absorbed, hull: damage - absorbed };
    }
    update(dt: number, inDock = false) {
        this.flash = Math.max(0, this.flash - dt);
        const recovering = inDock ? dt : Math.max(0, dt - this.cooldown);
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (inDock) this.cooldown = 0;
        const rate = inDock
            ? Math.max(this.profile.regen, this.profile.capacity / 2)
            : this.profile.regen;
        this.charge = Math.min(this.profile.capacity, this.charge + rate * recovering);
    }
}
