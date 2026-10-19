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
        inputs: { hydrogen: 2, oxygen: 1 },
        output: 'water',
        amount: 1,
        level: 0,
        equation: '2 H₂ + O₂ → 2 H₂O',
        explanation:
            'Jedna porcja wody zawiera dwie porcje atomów wodoru i jedną tlenu. Równanie obok przedstawia reakcję gazów. Proces wymaga kontrolowanych warunków.',
    },
    oxygen: {
        title: 'Przygotowanie tlenu',
        category: 'laboratory',
        inputs: { oxygen: 2 },
        output: 'oxygenGas',
        amount: 1,
        level: 0,
        equation: 'O₂: dwa atomy tlenu',
        explanation:
            'Tlen gazowy tworzy cząsteczki dwuatomowe. Porcje opisują ilość substancji, nie masę.',
    },
    silica: {
        title: 'Otrzymywanie krzemionki',
        category: 'laboratory',
        inputs: { crystals: 1, oxygen: 2 },
        output: 'silica',
        amount: 1,
        level: 0,
        equation: 'Si + O₂ → SiO₂',
        explanation:
            'Krzemionka jest siecią połączonych atomów. Wzór opisuje ich proporcje; nie jest to oddzielna trzyatomowa cząsteczka.',
    },
    steel: {
        title: 'Otrzymywanie stali',
        category: 'laboratory',
        inputs: { ore: 99, carbon: 1 },
        output: 'steel',
        amount: 12,
        level: 0,
        explanation:
            'Stal to stop żelaza z węglem. Nie ma jednego wzoru cząsteczki. Przetwarzamy większą partię żelaza z niewielkim dodatkiem węgla. Porcje opisują ilość substancji, nie kilogramy.',
    },
    copper: {
        title: 'Oczyszczanie miedzi',
        category: 'laboratory',
        inputs: { copperOre: 2 },
        output: 'pureCopper',
        amount: 1,
        level: 0,
        explanation: 'Rafinacja poprawia czystość miedzi. Nie zmienia jej w inny pierwiastek.',
    },
    silicon: {
        title: 'Oczyszczanie krzemu',
        category: 'laboratory',
        inputs: { crystals: 2 },
        output: 'pureSilicon',
        amount: 1,
        level: 0,
        explanation: 'Oczyszczony krzem jest materiałem do elektroniki. Tworzy sieć krystaliczną.',
    },
    alloy: {
        title: 'Lekki stop',
        category: 'laboratory',
        inputs: { aluminium: 4, magnesium: 1 },
        output: 'aluminiumAlloy',
        amount: 1,
        level: 1,
        explanation:
            'Glin i magnez tworzą lekki stop. Pokazujemy mieszaną strukturę, nie cząsteczkę AlMg.',
    },
    plating: {
        title: 'Poszycie stalowe I',
        category: 'workshop',
        inputs: { steel: 1 },
        output: 'parts',
        amount: 1,
        level: 0,
        explanation: 'Formowanie stalowej płyty. Gotowa część służy do budowy i napraw.',
    },
    lightPlating: {
        title: 'Poszycie lekkie I',
        category: 'workshop',
        inputs: { aluminiumAlloy: 1 },
        output: 'lightPlating',
        amount: 1,
        level: 1,
        explanation:
            'Lekka alternatywa materiałowa poszycia. Integracja wariantów z parametrami kadłubów nastąpi w etapie floty.',
    },
    conductors: {
        title: 'Przewodniki miedziane',
        category: 'workshop',
        inputs: { pureCopper: 1 },
        output: 'conductors',
        amount: 2,
        level: 0,
        explanation:
            'Miedź dobrze przewodzi prąd. Formujemy przewody, nie wykonujemy reakcji chemicznej.',
    },
    electronics: {
        title: 'Elektronika I',
        category: 'workshop',
        inputs: { pureSilicon: 1, conductors: 2, silica: 1 },
        output: 'electronics',
        amount: 1,
        level: 0,
        explanation: 'Układ łączy półprzewodnik, przewody i izolację.',
    },
    machinery: {
        title: 'Maszyneria I',
        category: 'workshop',
        inputs: { steel: 2, conductors: 1 },
        output: 'storageFrames',
        amount: 1,
        level: 0,
        explanation: 'Elementy mechaniczne i sterowanie tworzą wyposażenie maszynowe.',
    },
    lifeSupport: {
        title: 'Podtrzymywanie życia I',
        category: 'workshop',
        inputs: { water: 2, oxygenGas: 2, steel: 1 },
        output: 'lifeSupport',
        amount: 1,
        level: 0,
        explanation: 'Zbiorniki wody i tlenu oraz obudowa są częścią systemu podtrzymywania życia.',
    },
    propulsion: {
        title: 'Zespół napędowy I',
        category: 'workshop',
        inputs: { storageFrames: 1, electronics: 1, steel: 1 },
        output: 'propulsion',
        amount: 1,
        level: 1,
        explanation: 'Napęd jest zespołem części mechanicznych, sterowania i osłon.',
    },
    power: {
        title: 'Układ zasilania I',
        category: 'workshop',
        inputs: { electronics: 1, conductors: 2, parts: 1 },
        output: 'powerModules',
        amount: 1,
        level: 1,
        explanation: 'Gotowy układ rozprowadza energię do urządzeń stacji lub statku.',
    },
    kit: {
        title: 'Zestaw naprawczy',
        category: 'workshop',
        inputs: { parts: 1, conductors: 1 },
        output: 'kit',
        amount: 1,
        level: 0,
        explanation: 'Przygotuj zestaw przed lotem. Muł jako jedyny naprawia się bez zestawów.',
    },
    kineticPlate: {
        title: 'Płyty kinetyczne',
        category: 'workshop',
        inputs: { mercuryOre: 4, steel: 2 },
        output: 'kineticPlates',
        amount: 2,
        level: 2,
        explanation:
            'Zaawansowane osłony wymagają badań na Merkurym. Odporności są uproszczeniem gry.',
    },
    kineticModule: {
        title: 'Moduł osłonowy',
        category: 'workshop',
        inputs: { kineticPlates: 2, powerModules: 2 },
        output: 'kineticModules',
        amount: 1,
        level: 2,
        explanation: 'Zestaw osłon i zasilania dla ochrony stacji.',
    },
} as const satisfies Record<string, ProcessRecipe>;
export type RecipeId = keyof typeof RECIPES;
export const RECIPE_IDS = Object.keys(RECIPES) as RecipeId[];
/** Composition per production portion; parts and materials keep their inputs as a bill of materials. */
export const MATERIAL_COMPOSITION: Partial<Record<ResourceId, Partial<Record<ElementId, number>>>> =
    {
        water: { hydrogen: 2, oxygen: 1 },
        oxygenGas: { oxygen: 2 },
        silica: { crystals: 1, oxygen: 2 },
        steel: { ore: 99 / 12, carbon: 1 / 12 },
        pureCopper: { copperOre: 2 },
        pureSilicon: { crystals: 2 },
        aluminiumAlloy: { aluminium: 4, magnesium: 1 },
    };
