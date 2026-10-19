export const RESOURCES = {
    hydrogen: { name: 'Wodór (H)', short: 'H', category: 'PIERWIASTKI', color: 0x9ddff5 },
    mercuryOre: { name: 'Tytan (Ti)', short: 'Ti', category: 'PIERWIASTKI', color: 0xa6d2df },
    kineticPlates: {
        name: 'Płyty kinetyczne',
        short: 'PK',
        category: 'CZĘŚCI',
        color: 0xc2d4e5,
    },
    kineticModules: { name: 'Moduły osłonowe', short: 'MO', category: 'CZĘŚCI', color: 0x91b8ef },
    ore: { name: 'Żelazo (Fe)', short: 'Fe', category: 'PIERWIASTKI', color: 0x79c9ad },
    copperOre: { name: 'Miedź (Cu)', short: 'Cu', category: 'PIERWIASTKI', color: 0xd48c62 },
    parts: {
        name: 'Poszycie stalowe I',
        short: 'PS I',
        category: 'CZĘŚCI',
        color: 0xe5bd6d,
    },
    conductors: {
        name: 'Przewodniki miedziane',
        short: 'P',
        category: 'CZĘŚCI',
        color: 0xe6a16d,
    },
    powerModules: { name: 'Układ zasilania I', short: 'MZ', category: 'CZĘŚCI', color: 0x83c9ef },
    storageFrames: {
        name: 'Maszyneria I',
        short: 'M I',
        category: 'CZĘŚCI',
        color: 0xb6c8d5,
    },
    crystals: { name: 'Krzem (Si)', short: 'Si', category: 'PIERWIASTKI', color: 0xc2a0ec },
    oxygen: { name: 'Tlen (O)', short: 'O', category: 'PIERWIASTKI', color: 0xf08e95 },
    carbon: { name: 'Węgiel (C)', short: 'C', category: 'PIERWIASTKI', color: 0xa5afc8 },
    aluminium: { name: 'Glin (Al)', short: 'Al', category: 'PIERWIASTKI', color: 0xd6e6ef },
    magnesium: { name: 'Magnez (Mg)', short: 'Mg', category: 'PIERWIASTKI', color: 0xa9dfb5 },
    nitrogen: { name: 'Azot (N)', short: 'N', category: 'PIERWIASTKI', color: 0x8ca9ff },
    water: { name: 'Woda (H₂O)', short: 'H₂O', category: 'MATERIAŁY', color: 0x79d5ed },
    oxygenGas: { name: 'Tlen gazowy (O₂)', short: 'O₂', category: 'MATERIAŁY', color: 0xf08e95 },
    silica: { name: 'Krzemionka (SiO₂)', short: 'SiO₂', category: 'MATERIAŁY', color: 0xdcc9ef },
    steel: { name: 'Stal', short: 'Stal', category: 'MATERIAŁY', color: 0xa4bed1 },
    aluminiumAlloy: {
        name: 'Stop glinu i magnezu',
        short: 'Al–Mg',
        category: 'MATERIAŁY',
        color: 0xb7ddda,
    },
    pureCopper: {
        name: 'Oczyszczona miedź',
        short: 'Cu cz.',
        category: 'MATERIAŁY',
        color: 0xd48c62,
    },
    pureSilicon: {
        name: 'Oczyszczony krzem',
        short: 'Si cz.',
        category: 'MATERIAŁY',
        color: 0xc2a0ec,
    },
    electronics: { name: 'Elektronika I', short: 'E I', category: 'CZĘŚCI', color: 0x8edabc },
    lifeSupport: {
        name: 'Podtrzymywanie życia I',
        short: 'Ż I',
        category: 'CZĘŚCI',
        color: 0x81d9ed,
    },
    propulsion: { name: 'Zespół napędowy I', short: 'N I', category: 'CZĘŚCI', color: 0xf3be7b },
    lightPlating: { name: 'Poszycie lekkie I', short: 'PL I', category: 'CZĘŚCI', color: 0xb7ddda },
} as const;
export type ResourceId = keyof typeof RESOURCES;
export const STORAGE_PRIORITY: readonly ResourceId[] = [
    'hydrogen',
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
    'oxygen',
    'carbon',
    'aluminium',
    'magnesium',
    'nitrogen',
    'water',
    'oxygenGas',
    'silica',
    'steel',
    'aluminiumAlloy',
    'pureCopper',
    'pureSilicon',
    'electronics',
    'lifeSupport',
    'propulsion',
    'lightPlating',
];
export type ResourceStore = Partial<Record<ResourceId, number>>;
export const RESOURCE_IDS = Object.keys(RESOURCES) as ResourceId[];
export function resourceTotal(store: ResourceStore) {
    return RESOURCE_IDS.reduce((sum, id) => sum + (store[id] ?? 0), 0);
}
export function resourceSummary(store: ResourceStore) {
    return (
        RESOURCE_IDS.filter((id) => (store[id] ?? 0) > 0)
            .map((id) => `${store[id]} ${RESOURCES[id].name}`)
            .join(' · ') || 'brak'
    );
}

/** Inventory quantities are game portions, not kilograms. Existing internal keys remain until all campaign costs are redesigned. */
export const ELEMENT_IDS = [
    'hydrogen',
    'oxygen',
    'carbon',
    'ore',
    'crystals',
    'copperOre',
    'aluminium',
    'magnesium',
    'nitrogen',
    'mercuryOre',
] as const satisfies readonly ResourceId[];
export type ElementId = (typeof ELEMENT_IDS)[number];
export const ELEMENT_SYMBOLS: Record<ElementId, string> = {
    hydrogen: 'H',
    oxygen: 'O',
    carbon: 'C',
    ore: 'Fe',
    crystals: 'Si',
    copperOre: 'Cu',
    aluminium: 'Al',
    magnesium: 'Mg',
    nitrogen: 'N',
    mercuryOre: 'Ti',
};
