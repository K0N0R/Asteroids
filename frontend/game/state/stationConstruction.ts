import type { ResourceStore } from './resources';

/** Station technology unlocks and installed devices use manufactured parts. */
export const WORKSHOP_CONSTRUCTION: readonly ResourceStore[] = [
    { parts: 2, storageFrames: 1, electronics: 1 },
    { parts: 8, storageFrames: 4, electronics: 4, powerModules: 3, lifeSupport: 2 },
];
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
    { kineticModules: 1, parts: 4, electronics: 2, powerModules: 2 },
    { kineticModules: 2, parts: 6, electronics: 3, powerModules: 3 },
];
export function droneReplacementBill(count: number): ResourceStore {
    return Object.fromEntries(
        Object.entries(DRONE_REPLACEMENT).map(([id, amount]) => [id, amount * count]),
    );
}
