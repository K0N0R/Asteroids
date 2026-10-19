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
        equation: '2 H + O → H₂O',
        explanation:
            'Każda cząsteczka wody ma dwa atomy wodoru i jeden tlenu. Woda pomaga regulować temperaturę i jest niezbędna do życia.',
    },
    oxygen: {
        title: 'Przygotowanie tlenu',
        category: 'laboratory',
        inputs: { oxygen: 2 },
        output: 'oxygenGas',
        amount: 1,
        level: 0,
        equation: '2 O → O₂',
        explanation:
            'Tlen w powietrzu występuje w parach atomów — jako O₂. Astronauci zabierają jego zapas do oddychania.',
    },
    silica: {
        title: 'Otrzymywanie krzemionki',
        category: 'laboratory',
        inputs: { crystals: 1, oxygen: 2 },
        output: 'silica',
        amount: 1,
        level: 0,
        equation: 'Si + 2 O → SiO₂',
        explanation:
            'Krzemionkę znajdziesz w kwarcu i piasku. Jej połączone atomy tworzą sieć, a z piasku bogatego w krzemionkę powstaje szkło.',
    },
    steel: {
        title: 'Otrzymywanie stali',
        category: 'laboratory',
        inputs: { ore: 4, carbon: 1 },
        output: 'steel',
        amount: 4,
        level: 0,
        explanation:
            'Dodatek węgla pomaga zwiększyć twardość stali. Stalowe elementy znajdziesz w mostach, narzędziach i konstrukcjach budynków.',
    },
    copper: {
        title: 'Oczyszczanie miedzi',
        category: 'laboratory',
        inputs: { copperOre: 2 },
        output: 'pureCopper',
        amount: 1,
        level: 0,
        explanation:
            'Miedź świetnie przewodzi prąd. Oczyszczanie usuwa domieszki, dzięki czemu lepiej nadaje się do produkcji przewodów.',
    },
    silicon: {
        title: 'Oczyszczanie krzemu',
        category: 'laboratory',
        inputs: { crystals: 2 },
        output: 'pureSilicon',
        amount: 1,
        level: 0,
        explanation:
            'Bardzo czysty krzem służy do produkcji układów elektronicznych i ogniw słonecznych. Nawet drobne domieszki zmieniają jego właściwości.',
    },
    alloy: {
        title: 'Lekki stop',
        category: 'laboratory',
        inputs: { aluminium: 4, magnesium: 1 },
        output: 'aluminiumAlloy',
        amount: 1,
        level: 1,
        explanation:
            'Glin i magnez należą do lekkich metali. Ich stopy pomagają zmniejszać masę pojazdów, co ułatwia oszczędzanie energii.',
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
            'Lżejsze poszycie zmniejsza masę konstrukcji. Stopy glinu są często używane w lotnictwie.',
    },
    conductors: {
        title: 'Przewodniki miedziane',
        category: 'workshop',
        inputs: { pureCopper: 1 },
        output: 'conductors',
        amount: 2,
        level: 0,
        explanation:
            'Miedź można rozciągać w cienkie druty. Dzięki temu nadaje się do przewodów łączących urządzenia elektryczne.',
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
        level: 0,
        explanation: 'Napęd jest zespołem części mechanicznych, sterowania i osłon.',
    },
    power: {
        title: 'Układ zasilania I',
        category: 'workshop',
        inputs: { electronics: 1, conductors: 2, parts: 1 },
        output: 'powerModules',
        amount: 1,
        level: 0,
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
            'Tytan łączy wytrzymałość z niewielką masą. Wykorzystuje się go w lotnictwie i technice kosmicznej.',
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
        steel: { ore: 1, carbon: 1 / 4 },
        pureCopper: { copperOre: 2 },
        pureSilicon: { crystals: 2 },
        aluminiumAlloy: { aluminium: 4, magnesium: 1 },
    };
