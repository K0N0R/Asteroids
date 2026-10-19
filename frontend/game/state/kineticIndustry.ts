import type { Campaign } from './campaign';
import { RESOURCE_IDS, resourceSummary, type ResourceStore } from './resources';

export const KINETIC_SHIELD_COSTS: readonly ResourceStore[] = [
    { kineticModules: 1, ore: 20, parts: 4 },
    { kineticModules: 2, ore: 30, parts: 6 },
];
export const REINFORCED_BAY_COST = {
    kineticPlates: 2,
    storageFrames: 1,
    ore: 30,
    parts: 4,
} as const;
export function kineticInstallationLock(c: Campaign, kind: 'shield' | 'storage'): string | null {
    if (kind === 'storage') return 'Magazyn jest bez limitu; nie wymaga rozbudowy.';
    if (c.activeRun) return 'Montaż po powrocie do stacji.';
    if (c.story && !c.story.claimed.includes('mercury-survey')) return 'Najpierw zwiad Merkurego.';
    if (c.station.workshop < 2) return 'Wymagany warsztat II.';
    if (kind === 'shield' && !c.station.shield)
        return 'Najpierw zamontuj podstawowy generator tarczy.';
    const level = kind === 'shield' ? c.station.shieldLevel : c.station.reinforcedBays;
    if (level >= 2) return 'Osiągnięto poziom II.';
    const cost: ResourceStore =
        kind === 'shield' ? KINETIC_SHIELD_COSTS[level] : REINFORCED_BAY_COST;
    if (RESOURCE_IDS.some((id) => (c.bank[id] ?? 0) < (cost[id] ?? 0)))
        return `Potrzeba: ${resourceSummary(cost)}.`;
    return null;
}
export function installKineticUpgrade(c: Campaign, kind: 'shield' | 'storage') {
    if (kineticInstallationLock(c, kind)) return false;
    const cost: ResourceStore =
        kind === 'shield' ? KINETIC_SHIELD_COSTS[c.station.shieldLevel] : REINFORCED_BAY_COST;
    for (const id of RESOURCE_IDS) if (cost[id]) c.bank[id] = (c.bank[id] ?? 0) - cost[id]!;
    if (kind === 'shield') c.station.shieldLevel++;
    else c.station.reinforcedBays++;
    return true;
}
