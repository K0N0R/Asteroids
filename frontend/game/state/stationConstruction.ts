import type { ResourceStore } from './resources';

/** Station technology unlocks and installed devices use manufactured parts. */
export const WORKSHOP_CONSTRUCTION: readonly ResourceStore[] = [
    { steel: 4, silica: 2, copperOre: 2 },
    {
        parts: 8,
        storageFrames: 4,
        electronics: 3,
        powerModules: 2,
        alumina: 2,
        stabilizedAnomaly: 4,
    },
    {
        partsII: 8,
        storageFramesII: 4,
        electronicsII: 4,
        powerModulesII: 3,
        resonantComposite: 4,
        alumina: 4,
    },
];
export const LABORATORY_CONSTRUCTION: readonly ResourceStore[] = [
    { ore: 8, copperOre: 2, crystals: 2 },
    {
        parts: 6,
        storageFrames: 2,
        electronics: 2,
        powerModules: 1,
        silica: 2,
        aluminiumAlloy: 2,
        anomalyOre: 2,
    },
    {
        partsII: 6,
        storageFramesII: 3,
        electronicsII: 3,
        powerModulesII: 2,
        stabilizedAnomaly: 4,
        siliconCarbide: 4,
    },
];
export const EXTRACTION_CONSTRUCTION: ResourceStore = {
    parts: 2,
    storageFrames: 1,
    electronics: 1,
    powerModules: 1,
};
export const SHIELD_CONSTRUCTION = {
    parts: 6,
    storageFrames: 2,
    electronics: 3,
    powerModules: 3,
} as const;
export const DRONE_HANGAR_CONSTRUCTION = {
    parts: 9,
    storageFrames: 3,
    electronics: 3,
    propulsion: 3,
    powerModules: 3,
} as const;
export const DRONE_REPLACEMENT = {
    parts: 2,
    electronics: 1,
    propulsion: 1,
    powerModules: 1,
} as const;
export const KINETIC_CONSTRUCTION: readonly ResourceStore[] = [
    { kineticModules: 1, partsII: 4, electronicsII: 2, powerModulesII: 2 },
    { kineticModules: 2, partsII: 6, electronicsII: 3, powerModulesII: 3 },
];
export function droneReplacementBill(count: number): ResourceStore {
    return Object.fromEntries(
        Object.entries(DRONE_REPLACEMENT).map(([id, amount]) => [id, amount * count]),
    );
}

/** Raw stock that makes the complete first upgrade through the level-zero recipes. */
export const STARTER_MATERIALS = {
    ore: 8,
    copperOre: 2,
    crystals: 2,
} as const satisfies ResourceStore;
