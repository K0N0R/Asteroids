import { PART_FAMILIES, TIER_NAMES, type PartFamily } from './partTiers';
import { RESOURCES, type ResourceStore } from './resources';
import type { ProcessRecipe } from './chemistry';

export type AdvancedRecipeId = `${PartFamily}${'II' | 'III'}`;
const improvements: Record<PartFamily, [ResourceStore, ResourceStore]> = {
    plating: [
        { steel: 2, silica: 1 },
        { steel: 2, aluminiumAlloy: 1, silica: 2 },
    ],
    lightPlating: [
        { aluminiumAlloy: 1, silica: 1 },
        { aluminiumAlloy: 2, steel: 1, silica: 2 },
    ],
    electronics: [
        { pureSilicon: 2, conductors: 2 },
        { pureSilicon: 3, conductors: 2, silica: 2 },
    ],
    machinery: [
        { steel: 2, electronics: 1 },
        { aluminiumAlloy: 2, electronicsII: 1 },
    ],
    lifeSupport: [
        { water: 1, oxygenGas: 1, electronics: 1 },
        { water: 1, oxygenGas: 1, electronicsII: 1 },
    ],
    propulsion: [
        { storageFramesII: 1, electronics: 1 },
        { storageFramesIII: 1, electronicsII: 1 },
    ],
    power: [
        { electronicsII: 1, conductors: 2 },
        { electronicsIII: 1, conductors: 2 },
    ],
};
const descriptions: Record<PartFamily, [string, string]> = {
    plating: [
        'Profilowane żebra wzmacniają stalowy panel, a izolacja krzemionkowa oddziela warstwy.',
        'Warstwowy panel łączy stalową ramę, lekki stop i izolację. Jego konstrukcja rozkłada obciążenia.',
    ],
    lightPlating: [
        'Wytłaczane żebra usztywniają lekki panel ze stopu glinu i magnezu.',
        'Panel komórkowy łączy lekki stop z cienką ramą stalową i warstwą izolacji.',
    ],
    electronics: [
        'Dodatkowe układy półprzewodnikowe i ścieżki tworzą precyzyjny sterownik.',
        'Wielowarstwowy sterownik ma więcej układów i oddzielone, izolowane połączenia.',
    ],
    machinery: [
        'Precyzyjna przekładnia otrzymuje własne sterowanie elektroniczne.',
        'Zespół maszynowy łączy precyzyjne przekładnie, lekką obudowę i sterownik II.',
    ],
    lifeSupport: [
        'Filtr i sterownik pomagają kontrolować obieg wody oraz tlenu. Zbiorniki pozostają częścią zestawu.',
        'Rozbudowany obieg ma oddzielne filtry i dokładniejszy sterownik. To model urządzenia, nie tworzenie tlenu z niczego.',
    ],
    propulsion: [
        'Ulepszony napęd otrzymuje precyzyjną maszynerię i dodatkowe sterowanie.',
        'Zespół trzech dysz korzysta z maszynerii III i precyzyjnej elektroniki. To umowny model napędu gry.',
    ],
    power: [
        'Rozdzielacz zasilania ma precyzyjny sterownik i dodatkowe połączenia miedziane.',
        'Modułowa szyna zasilania wykorzystuje elektronikę III do rozdziału energii. Nie produkuje jej bez źródła.',
    ],
};
export const ADVANCED_RECIPES = Object.fromEntries(
    (Object.keys(PART_FAMILIES) as PartFamily[]).flatMap((family) =>
        [2, 3].map((tier) => {
            const output = PART_FAMILIES[family][tier - 1];
            return [
                `${family}${TIER_NAMES[tier - 1]}`,
                {
                    title: RESOURCES[output].name,
                    category: 'workshop',
                    inputs: {
                        [PART_FAMILIES[family][tier - 2]]: 1,
                        ...improvements[family][tier - 2],
                    },
                    output,
                    amount: 1,
                    level: tier - 1,
                    explanation: descriptions[family][tier - 2],
                },
            ];
        }),
    ),
) as Record<AdvancedRecipeId, ProcessRecipe>;
