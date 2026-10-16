export const RESOURCES = {
    ore: { name: 'Ruda żelaza', short: 'Fe', category: 'RUDY', color: 0x79c9ad },
    copperOre: { name: 'Ruda miedzi', short: 'Cu', category: 'RUDY', color: 0xd48c62 },
    parts: {
        name: 'Komponenty konstrukcyjne',
        short: 'K',
        category: 'KOMPONENTY',
        color: 0xe5bd6d,
    },
    conductors: {
        name: 'Przewodniki miedziane',
        short: 'P',
        category: 'KOMPONENTY',
        color: 0xe6a16d,
    },
    powerModules: { name: 'Moduły zasilania', short: 'MZ', category: 'MODUŁY', color: 0x83c9ef },
    storageFrames: {
        name: 'Segmenty magazynowe',
        short: 'SM',
        category: 'KONSTRUKCJE',
        color: 0xb6c8d5,
    },
    crystals: { name: 'Kryształy', short: '◆', category: 'MINERAŁY', color: 0xc2a0ec },
} as const;
export type ResourceId = keyof typeof RESOURCES;
export type ResourceStore = Partial<Record<ResourceId, number>>;
export const RESOURCE_IDS = Object.keys(RESOURCES) as ResourceId[];
export function resourceTotal(store: ResourceStore) {
    return RESOURCE_IDS.reduce((sum, id) => sum + (store[id] ?? 0), 0);
}
export function resourceSummary(store: ResourceStore) {
    return (
        RESOURCE_IDS.filter((id) => (store[id] ?? 0) > 0)
            .map((id) => `${store[id]} ${RESOURCES[id].short}`)
            .join(' · ') || 'brak'
    );
}
