import type { HullId } from '../config';
export type Ability = 'emp' | 'shockwave' | 'cloak' | 'shield' | 'rocket';
export const SHIP_ABILITIES: Partial<Record<HullId, { q?: Ability; e?: Ability }>> = {
    falcon: { q: 'emp' },
    widmo: { q: 'cloak' },
    atlas: { q: 'shockwave' },
    aegis: { q: 'shield', e: 'shockwave' },
    stinger: { q: 'cloak', e: 'emp' },
    phoenix: { q: 'rocket', e: 'shockwave' },
};
export const ABILITY_NAMES: Record<Ability, string> = {
    emp: 'Granat EMP',
    shockwave: 'Shockwave',
    cloak: 'Kamuflaż',
    shield: 'Wzmocnienie tarcz',
    rocket: 'Rakieta',
};
export const ABILITY_COOLDOWNS: Record<Ability, number> = {
    emp: 6,
    shockwave: 12,
    cloak: 12,
    shield: 18,
    rocket: 8,
};
/** Keyboard abilities use rising edges; weapon bindings can use timed repeated shots. */
export class ShipAbilities {
    readonly cooldowns: Record<Ability, number> = {
        emp: 0,
        shockwave: 0,
        cloak: 0,
        shield: 0,
        rocket: 0,
    };
    private qHeld = false;
    private eHeld = false;
    constructor(readonly hull: HullId) {}
    tick(
        dt: number,
        q: boolean,
        e: boolean,
        activate: (ability: Ability) => boolean,
        interval?: (ability: Ability) => number,
    ) {
        for (const key of Object.keys(this.cooldowns) as Ability[])
            this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
        const slots = SHIP_ABILITIES[this.hull];
        if (q && !this.qHeld && slots?.q) this.use(slots.q, activate, interval?.(slots.q));
        if (e && !this.eHeld && slots?.e) this.use(slots.e, activate, interval?.(slots.e));
        this.qHeld = q;
        this.eHeld = e;
    }
    use(
        ability: Ability,
        activate: (ability: Ability) => boolean,
        interval = ABILITY_COOLDOWNS[ability],
    ) {
        if (this.cooldowns[ability] > 1e-8 || !activate(ability)) return false;
        this.cooldowns[ability] = interval;
        return true;
    }
    get readout() {
        const slots = SHIP_ABILITIES[this.hull];
        return (['q', 'e'] as const)
            .flatMap((key) => {
                const effect = slots?.[key];
                return effect
                    ? [
                          `${key.toUpperCase()} · ${ABILITY_NAMES[effect]} ${this.cooldowns[effect] > 0 ? `${Math.ceil(this.cooldowns[effect])} s` : 'gotowe'}`,
                      ]
                    : [];
            })
            .join(' · ');
    }
}
