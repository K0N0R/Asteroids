export const RESOURCES = {
    hydrogen: { name: 'Wodór', short: 'H', category: 'PIERWIASTKI', color: 0x9ddff5 },
    hyperFuel: { name: 'Ogniwa hipernapędu', short: 'OH', category: 'PALIWO', color: 0xa3a9f2 },
    mercuryOre: { name: 'Spiek merkuriański', short: 'Sp', category: 'RUDY', color: 0xa6d2df },
    kineticPlates: {
        name: 'Płyty kinetyczne',
        short: 'PK',
        category: 'KOMPONENTY',
        color: 0xc2d4e5,
    },
    kineticModules: { name: 'Moduły osłonowe', short: 'MO', category: 'MODUŁY', color: 0x91b8ef },
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
    crystals: { name: 'Krzem', short: 'Si', category: 'MINERAŁY', color: 0xc2a0ec },
} as const;
export type ResourceId = keyof typeof RESOURCES;
export const STORAGE_PRIORITY: readonly ResourceId[] = [
    'hydrogen',
    'hyperFuel',
    'kineticModules',
    'kineticPlates',
    'mercuryOre',
    'storageFrames',
    'powerModules',
    'conductors',
    'crystals',
    'parts',
    'copperOre',
    'ore',
];
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
