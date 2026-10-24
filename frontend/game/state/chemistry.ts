import { ADVANCED_RECIPES } from './advancedRecipes';
import type { ElementId, ResourceId, ResourceStore } from './resources';
export interface ProcessRecipe {
    title: string;
    category: 'laboratory' | 'workshop';
    inputs: ResourceStore;
    output: ResourceId | 'kit';
    amount: number;
    level: number;
    explanation: string;
    equation?: string;
}
export const RECIPES = {
    water: {
        title: 'Synteza wody',
        category: 'laboratory',
        inputs: {
            hydrogen: 4,
            oxygen: 2,
        },
        output: 'water',
        amount: 2,
        level: 1,
        explanation:
            'Woda ma skład H₂O: dwa atomy wodoru na jeden atom tlenu. Synteza wymaga odpowiednich warunków i kontroli energii.',
        equation: '2 H₂ + O₂ → 2 H₂O',
    },
    silica: {
        title: 'Otrzymywanie krzemionki',
        category: 'laboratory',
        inputs: {
            crystals: 4,
            oxygen: 8,
        },
        output: 'silica',
        amount: 4,
        level: 1,
        explanation:
            'SiO₂ opisuje proporcje atomów w sieci krzemionki. Materiał służy do izolacji i szkła technicznego.',
    },
    steel: {
        title: 'Otrzymywanie stali',
        category: 'laboratory',
        inputs: {
            ore: 4,
            carbon: 1,
        },
        output: 'steel',
        amount: 4,
        level: 1,
        explanation:
            'Stal jest stopem żelaza z dodatkiem węgla. Kontrolowane wytapianie przygotowuje materiał do obróbki konstrukcyjnej.',
    },
    alloy: {
        title: 'Lekki stop Al–Mg',
        category: 'laboratory',
        inputs: {
            aluminium: 4,
            magnesium: 1,
        },
        output: 'aluminiumAlloy',
        amount: 4,
        level: 1,
        explanation:
            'Stop glinu i magnezu jest materiałem konstrukcyjnym; obróbka stopu wymaga energii i kontroli procesu.',
    },
    siliconCarbide: {
        title: 'Węglik krzemu',
        category: 'laboratory',
        inputs: {
            crystals: 4,
            carbon: 4,
        },
        output: 'siliconCarbide',
        amount: 4,
        level: 2,
        explanation:
            'Ceramika SiC ma sieć atomów krzemu i węgla. Zaawansowany proces wymaga wysokiej temperatury.',
    },
    alumina: {
        title: 'Ceramika tlenkowa',
        category: 'laboratory',
        inputs: {
            aluminium: 8,
            oxygen: 12,
        },
        output: 'alumina',
        amount: 4,
        level: 2,
        explanation:
            'Al₂O₃ opisuje proporcje atomów tlenku glinu, używanego jako ceramika i izolator.',
    },
    stabilizedAnomaly: {
        title: 'Stabilizacja urobku anomalii',
        category: 'laboratory',
        inputs: {
            anomalyOre: 4,
            silica: 4,
        },
        output: 'stabilizedAnomaly',
        amount: 4,
        level: 2,
        explanation:
            'Osnowa krzemionkowa wiąże urobek anomalii i ogranicza jego niestabilność. Materiał można dzięki temu bezpiecznie przechowywać i obrabiać.',
    },
    resonantComposite: {
        title: 'Kompozyt rezonansowy',
        category: 'laboratory',
        inputs: {
            stabilizedAnomaly: 4,
            siliconCarbide: 2,
        },
        output: 'resonantComposite',
        amount: 2,
        level: 3,
        explanation:
            'Stabilizowany materiał anomalii jest łączony z ceramiką w wielowarstwowy kompozyt o kontrolowanej strukturze.',
    },
    plating: {
        title: 'Poszycie stalowe I',
        category: 'workshop',
        inputs: {
            steel: 1,
        },
        output: 'parts',
        amount: 1,
        level: 1,
        explanation:
            'Materiały są obrabiane i montowane w gotowy produkt. Energia procesu pochodzi z instalacji stacji.',
    },
    lightPlating: {
        title: 'Poszycie lekkie I',
        category: 'workshop',
        inputs: {
            aluminiumAlloy: 1,
        },
        output: 'lightPlating',
        amount: 1,
        level: 1,
        explanation:
            'Materiały są obrabiane i montowane w gotowy produkt. Energia procesu pochodzi z instalacji stacji.',
    },
    electronics: {
        title: 'Elektronika I',
        category: 'workshop',
        inputs: {
            crystals: 1,
            copperOre: 2,
            silica: 1,
        },
        output: 'electronics',
        amount: 1,
        level: 1,
        explanation:
            'Materiały są obrabiane i montowane w gotowy produkt. Energia procesu pochodzi z instalacji stacji.',
    },
    machinery: {
        title: 'Maszyneria I',
        category: 'workshop',
        inputs: {
            steel: 2,
            copperOre: 1,
        },
        output: 'storageFrames',
        amount: 1,
        level: 1,
        explanation:
            'Materiały są obrabiane i montowane w gotowy produkt. Energia procesu pochodzi z instalacji stacji.',
    },
    lifeSupport: {
        title: 'Podtrzymywanie życia I',
        category: 'workshop',
        inputs: {
            steel: 1,
            water: 1,
            oxygen: 2,
        },
        output: 'lifeSupport',
        amount: 1,
        level: 1,
        explanation:
            'Materiały są obrabiane i montowane w gotowy produkt. Energia procesu pochodzi z instalacji stacji.',
    },
    propulsion: {
        title: 'Zespół napędowy I',
        category: 'workshop',
        inputs: {
            steel: 2,
            copperOre: 1,
            crystals: 1,
        },
        output: 'propulsion',
        amount: 1,
        level: 1,
        explanation:
            'Materiały są obrabiane i montowane w gotowy produkt. Energia procesu pochodzi z instalacji stacji.',
    },
    power: {
        title: 'Układ zasilania I',
        category: 'workshop',
        inputs: {
            steel: 1,
            copperOre: 2,
            silica: 1,
        },
        output: 'powerModules',
        amount: 1,
        level: 1,
        explanation:
            'Materiały są obrabiane i montowane w gotowy produkt. Energia procesu pochodzi z instalacji stacji.',
    },
    kit: {
        title: 'Zestaw naprawczy',
        category: 'workshop',
        inputs: {
            steel: 1,
            copperOre: 1,
        },
        output: 'kit',
        amount: 1,
        level: 1,
        explanation: 'Zestaw do napraw podczas wyprawy. Muł naprawia się bez zestawów i surowców.',
    },
    kineticPlate: {
        title: 'Płyta kinetyczna',
        category: 'workshop',
        inputs: {
            mercuryOre: 2,
            steel: 1,
            siliconCarbide: 1,
        },
        output: 'kineticPlates',
        amount: 1,
        level: 2,
        explanation:
            'Materiały są obrabiane i montowane w gotowy produkt. Energia procesu pochodzi z instalacji stacji.',
    },
    kineticModule: {
        title: 'Moduł osłonowy',
        category: 'workshop',
        inputs: {
            kineticPlates: 2,
            powerModulesII: 1,
        },
        output: 'kineticModules',
        amount: 1,
        level: 2,
        explanation:
            'Materiały są obrabiane i montowane w gotowy produkt. Energia procesu pochodzi z instalacji stacji.',
    },
    ...ADVANCED_RECIPES,
} as const satisfies Record<string, ProcessRecipe>;
export type RecipeId = keyof typeof RECIPES;
export const RECIPE_IDS = Object.keys(RECIPES) as RecipeId[];
export const MATERIAL_COMPOSITION: Partial<Record<ResourceId, Partial<Record<ElementId, number>>>> =
    {
        water: { hydrogen: 2, oxygen: 1 },
        silica: { crystals: 1, oxygen: 2 },
        steel: { ore: 1, carbon: 0.25 },
        aluminiumAlloy: { aluminium: 1, magnesium: 0.25 },
        siliconCarbide: { crystals: 1, carbon: 1 },
        alumina: { aluminium: 2, oxygen: 3 },
    };
