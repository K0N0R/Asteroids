import { tieredBill, type PartTier } from './partTiers';
import { HULLS, type HullId } from '../config';
import type { ResourceStore } from './resources';

export const HULL_PARTS = [
    'parts',
    'electronics',
    'storageFrames',
    'lifeSupport',
    'propulsion',
    'powerModules',
] as const;
/** Six families; technology tier follows the hull project. */
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
const BASE_HULL_CONSTRUCTION = {
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
export const HULL_CONSTRUCTION = Object.fromEntries(
    (Object.keys(BASE_HULL_CONSTRUCTION) as HullId[]).map((hull) => {
        const base: ResourceStore = { ...BASE_HULL_CONSTRUCTION[hull] };
        if (['falcon', 'widmo', 'stinger', 'phoenix'].includes(hull)) {
            base.lightPlating = base.parts;
            delete base.parts;
        }
        return [hull, Object.freeze(tieredBill(base, (HULLS[hull].workshop + 1) as PartTier))];
    }),
) as Record<HullId, Readonly<ResourceStore>>;
export function hullPartIds(hull: HullId) {
    return Object.keys(HULL_CONSTRUCTION[hull]) as (keyof ResourceStore)[];
}
export function hasHullParts(bank: Readonly<ResourceStore>, hull: HullId) {
    if (!Object.hasOwn(HULL_CONSTRUCTION, hull)) return false;
    return hullPartIds(hull).every(
        (id) =>
            Number.isSafeInteger(bank[id] ?? 0) &&
            (bank[id] ?? 0) >= (HULL_CONSTRUCTION[hull][id] ?? 0),
    );
}
