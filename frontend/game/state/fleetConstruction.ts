import type { HullId } from '../config';
import type { ResourceStore } from './resources';

export const HULL_PARTS = [
    'parts',
    'electronics',
    'storageFrames',
    'lifeSupport',
    'propulsion',
    'powerModules',
] as const;
/** Fixed tier-I bills. Material alternatives and tiers II–III are a later stage. */
function bill(
    plating: number,
    electronics: number,
    machinery: number,
    lifeSupport: number,
    propulsion: number,
    power: number,
) {
    return Object.freeze({
        parts: plating,
        electronics,
        storageFrames: machinery,
        lifeSupport,
        propulsion,
        powerModules: power,
    });
}
export const HULL_CONSTRUCTION = {
    prospector: bill(4, 1, 2, 1, 1, 1),
    swift: bill(3, 2, 1, 1, 2, 1),
    mule: bill(10, 2, 8, 2, 2, 3),
    fighter: bill(6, 3, 3, 1, 2, 2),
    tug: bill(10, 2, 6, 2, 2, 2),
    falcon: bill(5, 5, 3, 1, 3, 3),
    widmo: bill(6, 6, 4, 1, 3, 4),
    atlas: bill(14, 4, 10, 2, 4, 4),
    harpoon: bill(8, 3, 7, 1, 2, 3),
    aegis: bill(9, 6, 5, 2, 2, 6),
    stinger: bill(6, 5, 3, 1, 3, 3),
    phoenix: bill(8, 6, 4, 1, 4, 5),
    raider: bill(4, 1, 1, 1, 1, 1),
    lancer: bill(6, 2, 2, 1, 2, 2),
} as const satisfies Record<HullId, Readonly<ResourceStore>>;
export function hasHullParts(bank: Readonly<ResourceStore>, hull: HullId) {
    if (!Object.hasOwn(HULL_CONSTRUCTION, hull)) return false;
    return HULL_PARTS.every(
        (id) =>
            Number.isSafeInteger(bank[id] ?? 0) && (bank[id] ?? 0) >= HULL_CONSTRUCTION[hull][id],
    );
}
