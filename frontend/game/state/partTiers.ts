import type { ResourceId, ResourceStore } from './resources';

export const PART_FAMILIES = {
    plating: ['parts', 'partsII', 'partsIII'],
    lightPlating: ['lightPlating', 'lightPlatingII', 'lightPlatingIII'],
    electronics: ['electronics', 'electronicsII', 'electronicsIII'],
    machinery: ['storageFrames', 'storageFramesII', 'storageFramesIII'],
    lifeSupport: ['lifeSupport', 'lifeSupportII', 'lifeSupportIII'],
    propulsion: ['propulsion', 'propulsionII', 'propulsionIII'],
    power: ['powerModules', 'powerModulesII', 'powerModulesIII'],
} as const satisfies Record<string, readonly ResourceId[]>;
export type PartFamily = keyof typeof PART_FAMILIES;
export type PartTier = 1 | 2 | 3;
export const TIER_NAMES = ['I', 'II', 'III'] as const;
export function partInfo(id: ResourceId | 'kit') {
    for (const [family, ids] of Object.entries(PART_FAMILIES)) {
        const index = (ids as readonly string[]).indexOf(id);
        if (index >= 0) return { family: family as PartFamily, tier: (index + 1) as PartTier };
    }
    return null;
}
/** Exact-tier bills never silently consume more advanced parts. */
export function tieredBill(bill: Readonly<ResourceStore>, tier: PartTier): ResourceStore {
    return Object.fromEntries(
        Object.entries(bill).map(([id, count]) => {
            const info = partInfo(id as ResourceId);
            return [info ? PART_FAMILIES[info.family][tier - 1] : id, count];
        }),
    );
}
