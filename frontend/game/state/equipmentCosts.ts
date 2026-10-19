import type { Upgrade, WeaponId } from '../config';
import { RESOURCE_IDS, type ResourceStore } from './resources';

export type ShipModule = Exclude<Upgrade, 'workshop' | 'storage'>;
/** Parts required for the first level; subsequent levels multiply the whole bill. */
export const MODULE_PARTS = {
    engine: { propulsion: 2, storageFrames: 1 },
    handling: { propulsion: 1, electronics: 1 },
    cargo: { parts: 2, storageFrames: 2 },
    drill: { electronics: 2, powerModules: 1 },
    armor: { parts: 4, storageFrames: 1 },
    shield: { electronics: 1, powerModules: 2 },
} as const satisfies Record<ShipModule, ResourceStore>;
export const WEAPON_PARTS = {
    standard: {},
    pulse: { electronics: 3, powerModules: 2, storageFrames: 1 },
    rail: { parts: 3, storageFrames: 2, powerModules: 2 },
} as const satisfies Record<WeaponId, ResourceStore>;
export function moduleParts(module: ShipModule, installedLevel: number): ResourceStore {
    return Object.fromEntries(
        Object.entries(MODULE_PARTS[module]).map(([id, count]) => [
            id,
            count * (installedLevel + 1),
        ]),
    );
}
export function canAffordEquipment(bank: ResourceStore, bill: ResourceStore): boolean {
    return RESOURCE_IDS.every((id) => {
        const need = bill[id] ?? 0;
        return !need || (Number.isSafeInteger(bank[id]) && bank[id]! >= need);
    });
}
export function spendEquipment(bank: ResourceStore, bill: ResourceStore): boolean {
    if (!canAffordEquipment(bank, bill)) return false;
    for (const id of RESOURCE_IDS) if (bill[id]) bank[id] = bank[id]! - bill[id]!;
    return true;
}
