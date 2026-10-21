import {
    phobosOrbitSecured,
    newMarsProgress,
    validMarsProgress,
    marsThreatsCleared,
    marsSecurityObjective,
    type MarsProgress,
} from './marsAct';
import { lunarShipmentPending, lunarShipmentLock } from './lunarShipment';
import { STARTER_MATERIALS } from './stationConstruction';
import { awardPilotXp } from './pilots';
import { SATELLITES } from '../worlds/earthSystem';
import { inEarthSystem } from '../worlds/moon';
import {
    MARS_CONSTRUCTION,
    VENUS_CONSTRUCTION,
    VENUS_SHIELD,
    orbitalSuppliesReady,
} from './orbitalConstruction';
import {
    LUNAR_PROCESSING,
    LUNAR_PROCESSING_TASKS,
    lunarProcessingReady,
} from './lunarConstruction';
import {
    RESOURCES,
    RESOURCE_IDS,
    resourceSummary,
    type ResourceStore,
    type ResourceId,
} from './resources';
import { recordCargoDelivery } from './earthLogistics';
import { validDialogueHistory } from './dialogues';
import { capacity, storageCapacity, storageUsed, type Campaign, type Cargo } from './campaign';
import type { ScanSiteId } from '../config';

export const STORY_SAVE_KEY = 'asteroids.satuk15.v1';
export const STORY_SECTORS = {
    earth: {
        act: 1,
        shortName: 'Ziemia',
        name: 'Sektor Ziemia–Księżyc',
        size: 'S',
        seed: 150071,
        radius: 1450,
    },
    lunar: {
        act: 1,
        shortName: 'Księżyc',
        name: 'Trasa księżycowa',
        size: 'M',
        seed: 150072,
        radius: 3200,
    },
    mars: {
        act: 2,
        shortName: 'Mars',
        name: 'Sektor Marsa',
        size: 'M',
        seed: 150073,
        radius: 3000,
    },
    venus: {
        act: 3,
        shortName: 'Wenus',
        name: 'Orbita Wenus',
        size: 'M',
        seed: 150074,
        radius: 2800,
    },
    mercury: {
        act: 4,
        shortName: 'Merkury',
        name: 'Orbita Merkurego',
        size: 'L',
        seed: 150075,
        radius: 3000,
    },
    belt: {
        act: 6,
        shortName: 'Pas',
        name: 'Przejście pasa asteroid',
        size: 'L',
        seed: 150076,
        radius: 2200,
    },
    jupiter: {
        act: 7,
        shortName: 'Jowisz',
        name: 'Podejście do Jowisza',
        size: 'L',
        seed: 150077,
        radius: 2700,
    },
    saturn: {
        act: 8,
        shortName: 'Saturn',
        name: 'Pierścienie Saturna',
        size: 'L',
        seed: 150078,
        radius: 2500,
    },
    uranus: {
        act: 9,
        shortName: 'Uran',
        name: 'Rejon Urana',
        size: 'L',
        seed: 150079,
        radius: 2700,
    },
    neptune: {
        act: 9,
        shortName: 'Neptun',
        name: 'Podejście do Neptuna',
        size: 'L',
        seed: 150080,
        radius: 2800,
    },
    pluto: {
        act: 10,
        shortName: 'Pluton',
        name: 'Rejon Plutona',
        size: 'L',
        seed: 150081,
        radius: 2800,
    },
} as const;
export type StorySectorId = keyof typeof STORY_SECTORS;
export interface StoryTask {
    id: string;
    sector: StorySectorId;
    act: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    title: string;
    detail: string;
    required: boolean;
    /** Delivery counters are internal steps of their parent quest. */
    internal?: boolean;
    deliveryItems?: readonly { id: string; resource: ResourceId; target: number }[];
    requirements?: ResourceStore;
    rewardXp?: number;
    kind:
        | 'supplies'
        | 'ore'
        | 'scan'
        | 'workshop'
        | 'delivery'
        | 'defense'
        | 'assault'
        | 'patrol'
        | 'briefing'
        | 'parts'
        | 'construction'
        | 'clearance'
        | 'gather'
        | 'boss'
        | 'rescue'
        | 'factory'
        | 'kineticShield'
        | 'event';
    resource?: ResourceId;
    target: number;
    site?: ScanSiteId;
    dependencies: readonly string[];
    reward: Cargo;
}
export const BELT_BARRIERS = [
    { x: 2600, y: 450, key: 3, radius: 36 },
    { x: 3400, y: -650, key: 4, radius: 40 },
    { x: 4200, y: 600, key: 5, radius: 44 },
] as const;
export const STORY_TASKS: readonly StoryTask[] = [
    {
        id: 'earth-materials',
        sector: 'earth',
        act: 1,
        title: 'Materiały do zaplecza',
        detail: '',
        internal: true,
        required: false,
        kind: 'supplies',
        requirements: STARTER_MATERIALS,
        target: 1,
        dependencies: [],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'earth-supply',
        sector: 'earth',
        act: 1,
        title: 'Pierwsze zaopatrzenie',
        detail: 'Zbierz materiały i rozbuduj zaplecze stacji do poziomu I.',
        required: true,
        kind: 'workshop',
        requirements: STARTER_MATERIALS,
        target: 1,
        dependencies: [],
        reward: { ore: 0, parts: 0 },
        rewardXp: 40,
    },
    {
        id: 'earth-relay',
        sector: 'earth',
        act: 1,
        title: 'Kontakt z satelitą',
        detail: 'Nawiąż kontakt z satelitą Ziemi, aby rozszerzyć obszar działań.',
        required: true,
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 0, parts: 0, lifeSupport: 1 },
    },
    {
        id: 'earth-workshop',
        sector: 'earth',
        act: 1,
        title: 'Zaplecze stacji',
        detail: 'Rozbuduj zaplecze stacji do poziomu I.',
        required: false,
        internal: true,
        kind: 'workshop',
        target: 1,
        dependencies: ['earth-supply'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'earth-route',
        sector: 'earth',
        act: 1,
        title: 'Przelot na Księżyc',
        detail: 'Dotrzyj na orbitę Księżyca.',
        required: true,
        kind: 'gather',
        target: 1,
        dependencies: ['earth-relay'],
        reward: { ore: 15, parts: 3 },
    },
    {
        id: 'lunar-survey',
        sector: 'lunar',
        act: 1,
        title: 'Kontakt z sondą księżycową',
        detail: 'Nawiąż kontakt z sondą księżycową, aby otworzyć lądowanie i trasę do bogatej asteroidy.',
        required: true,
        kind: 'scan',
        site: 'lunarProbe',
        target: 1,
        dependencies: ['earth-route'],
        reward: { ore: 15, parts: 2 },
    },
    ...SATELLITES.map(
        (sat): StoryTask => ({
            id: sat.task,
            sector: 'earth',
            act: 1,
            title: 'Odzysk satelity',
            detail: 'Odholuj wrak do Satuk 15.',
            required: false,
            kind: 'gather',
            target: 1,
            dependencies: ['earth-relay'],
            reward: { ore: 0, parts: 0 },
        }),
    ),
    {
        id: 'earth-salvage',
        sector: 'earth',
        act: 1,
        title: 'Odzysk wraków satelit',
        detail: 'Odzyskaj trzy wraki satelit.',
        required: false,
        kind: 'gather',
        target: 3,
        dependencies: ['earth-relay'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'earth-ship-upgrade',
        sector: 'earth',
        act: 1,
        title: 'Ulepszenie statku',
        detail: 'Zamontuj dowolne ulepszenie statku w Hangarze.',
        required: false,
        kind: 'gather',
        target: 1,
        dependencies: [],
        reward: { ore: 0, parts: 0 },
        rewardXp: 15,
    },
    ...LUNAR_PROCESSING.map(
        (module): StoryTask => ({
            ...module,
            sector: 'lunar',
            act: 1,
            required: false,
            internal: true,
            kind: 'delivery',
            detail: 'Dostarcz wyposażenie na stację księżycową.',
            dependencies: ['lunar-survey'],
            reward: { ore: 0, parts: 0 },
        }),
    ),
    {
        id: 'lunar-equipment',
        sector: 'lunar',
        act: 1,
        title: 'Wyposażenie stacji',
        detail: 'Zdobądź zestaw części do wyposażenia stacji na Księżycu.',
        required: true,
        kind: 'construction',
        deliveryItems: LUNAR_PROCESSING,
        target: LUNAR_PROCESSING.reduce((sum, item) => sum + item.target, 0),
        dependencies: ['lunar-survey'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'lunar-foundation',
        sector: 'lunar',
        act: 1,
        title: 'Rozbudowa stacji księżycowej',
        detail: 'Dostarcz żelazo do rozbudowy stacji księżycowej. Muł pomoże w miejscowym wydobyciu.',
        required: true,
        kind: 'delivery',
        resource: 'ore',
        target: 160,
        dependencies: LUNAR_PROCESSING_TASKS,
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'lunar-installations',
        sector: 'lunar',
        act: 1,
        title: 'Węgiel do miejscowej produkcji',
        detail: 'Dostarcz węgiel do miejscowej produkcji na stacji księżycowej.',
        required: true,
        kind: 'delivery',
        resource: 'carbon',
        target: 2,
        dependencies: LUNAR_PROCESSING_TASKS,
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'lunar-commission',
        sector: 'lunar',
        act: 1,
        title: 'Odbiór techniczny',
        detail: 'Po dostawach zeskanuj instalacje przez E. Satuk 15 potwierdzi odbiór techniczny przez radio.',
        required: true,
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['lunar-foundation', 'lunar-installations'],
        reward: { ore: 24, parts: 6 },
    },
    {
        id: 'lunar-defense',
        sector: 'lunar',
        act: 1,
        title: 'Ochrona budowy przed asteroidami',
        detail: 'Po fundamentach: przy budowie przytrzymaj G przez 2 s. Obroń konstrukcję przed trzema falami asteroid.',
        required: false,
        kind: 'defense',
        target: 1,
        dependencies: ['lunar-foundation'],
        reward: { ore: 20, parts: 4 },
    },
    {
        id: 'lunar-attack',
        sector: 'lunar',
        act: 1,
        title: 'Obrona stacji księżycowej',
        detail: 'Po odbiorze technicznym wrogowie zaatakują stację. Odeprzyj trzy fale i wróć do Satuk 15 na rozmowę o pościgu ku Marsowi.',
        required: true,
        kind: 'assault',
        target: 1,
        dependencies: ['lunar-commission'],
        reward: { ore: 40, parts: 8 },
    },
    {
        id: 'mars-shields',
        sector: 'mars',
        act: 2,
        title: 'Tarcze Satuk 15',
        detail: 'Zbuduj system tarcz w zakładce Rozbudowa stacji. Odblokowuje Bastiona i Mantę.',
        required: true,
        kind: 'event',
        target: 1,
        dependencies: [],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-sector-secure',
        sector: 'mars',
        act: 2,
        title: 'Zabezpieczenie sektora Marsa',
        detail: 'Rozpoznaj barierę, zabezpiecz Fobosa i zlikwiduj zakład oraz wymagane patrole. Cele aktualizują się z odkryciami.',
        required: true,
        kind: 'event',
        target: 1,
        dependencies: [],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-phobos-route',
        sector: 'mars',
        act: 2,
        title: 'Nieznany korytarz',
        detail: 'Po budowie tarcz i rozpoznaniu bariery zbadaj labirynt anomalii i hiperśluzę na Fobosa.',
        required: true,
        kind: 'event',
        target: 1,
        dependencies: ['mars-shields', 'mars-landing-blocked'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-landing-blocked',
        sector: 'mars',
        act: 2,
        title: 'Bariera lądowania',
        detail: 'Podejdź do bariery lądowania na Marsie.',
        required: false,
        kind: 'event',
        target: 1,
        dependencies: [],
        reward: { ore: 0, parts: 0 },
        internal: true,
    },
    {
        id: 'mars-phobos-base',
        sector: 'mars',
        act: 2,
        title: 'Ukryta instalacja',
        detail: 'Odkryj bazę wśród złóż Fobosa. Włam się do terminala bez alarmu lub zniszcz instalację. Fizyczny moduł pamięci odholuj do Satuk 15.',
        required: true,
        kind: 'event',
        target: 1,
        dependencies: ['mars-phobos-route'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-ai-discovery',
        sector: 'mars',
        act: 2,
        title: 'Wróg bez załogi',
        detail: 'Dostarcz moduł pamięci i wróć do Satuk 15 na analizę.',
        required: true,
        kind: 'event',
        target: 1,
        dependencies: ['mars-phobos-base'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-asteroid-yard',
        sector: 'mars',
        act: 2,
        title: 'Zatrzymaj produkcję',
        detail: 'Przez ujawnioną hiperśluzę dotrzyj do dużej asteroidy. Zniszcz zakład przemysłowy; pozostali przeciwnicy nadal wymagają eliminacji.',
        required: true,
        kind: 'event',
        target: 1,
        dependencies: ['mars-ai-discovery'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-anomaly-research',
        sector: 'mars',
        act: 2,
        title: 'Osłona ekspedycji naukowej',
        detail: 'Eskortuj Keplera do trzech punktów pomiarowych na orbicie Marsa. Odeprzyj ograniczone fale niedobitków. Zniszczoną jednostkę zastąpi kolejna wyprawa.',
        required: true,
        kind: 'event',
        target: 1,
        dependencies: ['mars-sector-secure'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-probe',
        sector: 'mars',
        act: 2,
        title: 'Zapomniana sonda',
        detail: 'Odholuj starą ziemską sondę z orbity Fobosa do Satuk 15.',
        required: false,
        kind: 'event',
        target: 1,
        dependencies: ['mars-phobos-route'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'earth-debrief',
        sector: 'earth',
        act: 2,
        title: 'Nowy kierunek',
        detail: 'Po zakończeniu trzech pomiarów wróć do Satuk 15 i zatwierdź odprawę. Następny kierunek: Wenus i Merkury.',
        required: true,
        kind: 'briefing',
        target: 1,
        dependencies: ['mars-anomaly-research'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'venus-survey',
        sector: 'venus',
        act: 3,
        title: 'Rozpoznanie orbity',
        required: true,
        detail: 'Leć do przekaźnika przy Wenus. Zbierz odczyt przez E i poczekaj na potwierdzenie radiowe Satuk 15.',
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 18, parts: 4 },
    },
    {
        id: 'venus-site',
        sector: 'venus',
        act: 3,
        title: 'Miejsce pod placówkę',
        required: true,
        detail: 'Po zwiadzie leć do punktu pomiarowego. Zbierz odczyt przez E i wróć, aby zatwierdzić miejsce pod przyszłą placówkę.',
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['venus-survey'],
        reward: { ore: 16, parts: 4 },
    },
    ...VENUS_CONSTRUCTION.map(
        (entry): StoryTask => ({
            ...entry,
            sector: 'venus',
            act: 3,
            required: true,
            kind: 'delivery',
            detail: `Dostarcz ${entry.target} × ${RESOURCES[entry.resource].name}. Załaduj manifest i przekaż części przy budowie.`,
            dependencies: ['venus-survey'],
            reward: { ore: 0, parts: 0 },
        }),
    ),
    {
        id: 'venus-reserve',
        sector: 'venus',
        act: 3,
        title: 'Zapas na dalszą drogę',
        required: false,
        detail: 'Dodatkowy przydział: przekaż 16 rudy na zapasy. Nie blokuje przygotowania placówki.',
        kind: 'ore',
        target: 16,
        dependencies: [],
        reward: { ore: 8, parts: 3 },
    },
    {
        id: 'venus-build',
        sector: 'venus',
        act: 3,
        title: 'Budowa placówki',
        required: true,
        detail: 'Po pomiarach i dostarczeniu części leć na plac budowy. Przytrzymaj E przez 2 s przy nieruchomym statku. Materiały są już opłacone.',
        kind: 'construction',
        target: 1,
        dependencies: ['venus-site', ...VENUS_CONSTRUCTION.map((t) => t.id)],
        reward: { ore: 0, parts: 0 },
    },
    ...VENUS_SHIELD.map(
        (entry): StoryTask => ({
            ...entry,
            sector: 'venus',
            act: 3,
            required: true,
            kind: 'delivery',
            detail: `Dostarcz ${entry.target} × ${RESOURCES[entry.resource].name} do osłony. Części przyjmuje zbudowana placówka.`,
            dependencies: ['venus-build'],
            reward: { ore: 0, parts: 0 },
        }),
    ),
    {
        id: 'venus-shield',
        sector: 'venus',
        act: 3,
        title: 'Osłona słoneczna',
        required: true,
        detail: 'Po dostarczeniu poszycia lekkiego, zasilania i elektroniki placówka potwierdzi gotowość osłony do podróży bliżej Słońca.',
        kind: 'construction',
        target: 1,
        dependencies: VENUS_SHIELD.map((t) => t.id),
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'venus-defense',
        sector: 'venus',
        act: 3,
        title: 'Obrona przygotowań',
        required: true,
        detail: 'Po budowie: G przez 2 s przy placówce rozpoczyna atak AI. Odeprzyj trzy kontakty i poczekaj na potwierdzenie radiowe. Osłonę możesz przygotować równolegle.',
        kind: 'assault',
        target: 1,
        dependencies: ['venus-build'],
        reward: { ore: 30, parts: 8 },
    },
    {
        id: 'mercury-survey',
        sector: 'mercury',
        act: 4,
        title: 'Podejście do Słońca',
        required: true,
        detail: 'Odszukaj punkt pomiarowy w cieniu dużej skały. Zbierz odczyt przez E i poczekaj na potwierdzenie radiowe. Podczas rozbłysków chłodź statek za asteroidami.',
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 20, parts: 6 },
    },
    {
        id: 'mercury-patrol',
        sector: 'mercury',
        act: 4,
        title: 'Osłona wyprawy',
        required: true,
        detail: 'Po zwiadzie odeprzyj dwa kontakty AI, w tym Lancera. Raporty wymagają powrotu; można podzielić walki na wyprawy.',
        kind: 'patrol',
        target: 2,
        dependencies: ['mercury-survey'],
        reward: { ore: 28, parts: 8 },
    },
    {
        id: 'mercury-technology',
        sector: 'mercury',
        act: 4,
        title: 'Technologia przejścia',
        required: true,
        detail: 'Po zabezpieczeniu sektora leć do węzła danych. Zbierz pakiet przez E i wróć. Dopiero bezpieczny powrót zabezpiecza technologię pasa.',
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['mercury-survey', 'mercury-patrol'],
        reward: { ore: 35, parts: 10 },
    },
    {
        id: 'mercury-shield',
        sector: 'mercury',
        act: 4,
        title: 'Osłona kinetyczna Satuk 15',
        required: false,
        kind: 'kineticShield',
        target: 1,
        dependencies: ['mercury-survey'],
        detail: 'Odszukaj spiek za skałą osłonową. Harpunem wyrwij złoża; ostrzał ich nie uszkadza. Wróć z ładunkiem, w warsztacie II wytwórz płyty i moduł osłonowy, następnie rozbuduj tarczę Satuk 15.',
        reward: { ore: 20, parts: 4 },
    },
    {
        id: 'mercury-reserve',
        sector: 'mercury',
        act: 4,
        title: 'Zapas ekspedycji',
        required: false,
        detail: 'Przekaż 24 rudy na zaplecze wyprawy. Zadanie dodatkowe nie blokuje odzyskania technologii.',
        kind: 'ore',
        target: 24,
        dependencies: [],
        reward: { ore: 12, parts: 5 },
    },
    ...MARS_CONSTRUCTION.map(
        (entry): StoryTask => ({
            ...entry,
            sector: 'mars',
            act: 5,
            required: true,
            kind: 'delivery',
            detail: `Dostarcz ${entry.target} × ${RESOURCES[entry.resource].name}. Załaduj manifest i przekaż części przy budowie.`,
            dependencies: ['mercury-technology'],
            reward: { ore: 0, parts: 0 },
        }),
    ),
    {
        id: 'mars-base-build',
        sector: 'mars',
        act: 5,
        title: 'Montaż bazy marsjańskiej',
        required: true,
        detail: 'Po dostawach leć do bazy. Przytrzymaj E przez 2 s przy spokojnym statku. Materiały zostały już opłacone.',
        kind: 'construction',
        target: 1,
        dependencies: MARS_CONSTRUCTION.map((t) => t.id),
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-base-defense',
        sector: 'mars',
        act: 5,
        title: 'Obrona bazy marsjańskiej',
        required: true,
        detail: 'Po montażu: G przez 2 s przy bazie rozpoczyna trzy kontakty AI. Obroń obiekt i poczekaj na potwierdzenie radiowe Satuk 15.',
        kind: 'assault',
        target: 1,
        dependencies: ['mars-base-build'],
        reward: { ore: 30, parts: 8 },
    },
    {
        id: 'mars-corridor',
        sector: 'mars',
        act: 5,
        title: 'Zabezpieczenie korytarza',
        required: true,
        detail: 'Po montażu neutralizuj trzy patrole w dalszym obszarze, w tym dwa Lancery. Możesz wracać po każdym kontakcie.',
        kind: 'patrol',
        target: 3,
        dependencies: ['mars-base-build'],
        reward: { ore: 40, parts: 12 },
    },
    {
        id: 'mars-route',
        sector: 'mars',
        act: 5,
        title: 'Pomiary dalszej trasy',
        required: false,
        detail: 'Dodatkowy zwiad: po montażu bazy leć do dalszego punktu. Zbierz pomiary przez E i wróć. Nie blokuje przygotowania przejścia pasa.',
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['mars-base-build'],
        reward: { ore: 18, parts: 5 },
    },
    {
        id: 'belt-survey',
        sector: 'belt',
        act: 6,
        title: 'Zwiad wejścia w pas',
        required: true,
        kind: 'scan',
        site: 'relay',
        target: 1,
        detail: 'Leć do wejścia w pas. Zatrzymaj statek, zbierz pomiary przez E i wróć do Satuk 15, aby otworzyć dalszą trasę.',
        dependencies: [],
        reward: { ore: 18, parts: 4 },
    },
    ...BELT_BARRIERS.map(
        (point, index): StoryTask => ({
            id: `belt-clear-${index}`,
            sector: 'belt',
            act: 6,
            title: `Przeszkoda ${index + 1} na trasie`,
            required: true,
            kind: 'clearance',
            target: 1,
            detail: `${point.key} wskazuje skałę blokującą trasę. Usuń ją laserem lub uzbrojeniem i poczekaj na potwierdzenie radiowe. Przeszkody można usuwać w dowolnej kolejności.`,
            dependencies: ['belt-survey'],
            reward: { ore: 10, parts: 2 },
        }),
    ),
    {
        id: 'belt-exit',
        sector: 'belt',
        act: 6,
        title: 'Zewnętrzna granica pasa',
        required: true,
        kind: 'scan',
        site: 'archive',
        target: 1,
        detail: 'Po zatwierdzeniu usunięcia trzech przeszkód leć do zewnętrznej granicy pasa. Zbierz odczyt przez E i poczekaj na potwierdzenie radiowe Satuk 15.',
        dependencies: ['belt-clear-0', 'belt-clear-1', 'belt-clear-2'],
        reward: { ore: 30, parts: 8 },
    },
    {
        id: 'belt-patrol',
        sector: 'belt',
        act: 6,
        title: 'Osłona przejścia',
        required: false,
        kind: 'patrol',
        target: 2,
        detail: 'Po zwiadzie odeprzyj dwa kontakty w pasie. Możesz raportować każdy osobno. Ich neutralizacja nie blokuje przejścia.',
        dependencies: ['belt-survey'],
        reward: { ore: 22, parts: 6 },
    },
    {
        id: 'jupiter-survey',
        sector: 'jupiter',
        act: 7,
        title: 'Zwiad podejścia do Jowisza',
        required: true,
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 20, parts: 4 },
        detail: 'Leć do przekaźnika pomiarowego. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć dalszy obszar.',
    },
    {
        id: 'jupiter-patrol',
        sector: 'jupiter',
        act: 7,
        title: 'Osłona rejonu pomiarów',
        required: true,
        kind: 'patrol',
        target: 2,
        dependencies: ['jupiter-survey'],
        reward: { ore: 28, parts: 8 },
        detail: 'Po zwiadzie neutralizuj patrol i Lancera. Możesz wracać z raportem po każdym kontakcie.',
    },
    {
        id: 'jupiter-uplink',
        sector: 'jupiter',
        act: 7,
        title: 'Włamanie do węzła',
        required: true,
        kind: 'scan',
        site: 'outpost',
        target: 1,
        dependencies: ['jupiter-survey'],
        reward: { ore: 24, parts: 6 },
        detail: 'Leć do terminala chronionego węzła. Przytrzymaj E przez 4 s bez alarmu. G wyłącza skaner na 20 s. Wróć z danymi.',
    },
    {
        id: 'jupiter-observations',
        sector: 'jupiter',
        act: 7,
        title: 'Pakiet obserwacyjny',
        required: true,
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['jupiter-patrol', 'jupiter-uplink'],
        reward: { ore: 36, parts: 10 },
        detail: 'Po raportach z walk i węzła leć do dalszego punktu obserwacyjnego. Zbierz pakiet przez E i poczekaj na potwierdzenie radiowe Satuk 15.',
    },
    {
        id: 'jupiter-recovery',
        sector: 'jupiter',
        act: 7,
        title: 'Sonda w skażonej anomalii',
        required: false,
        kind: 'rescue',
        site: 'anomaly',
        target: 1,
        dependencies: ['jupiter-survey'],
        reward: { ore: 32, parts: 10 },
        detail: 'Wybierz sondę i podłącz hol przez H. Dostarcz ją do Satuk 15 bezpieczną trasą, omijając skażone pasma.',
    },
    {
        id: 'jupiter-reserve',
        sector: 'jupiter',
        act: 7,
        title: 'Zapasy rejonu Jowisza',
        required: false,
        kind: 'ore',
        target: 24,
        dependencies: ['jupiter-survey'],
        reward: { ore: 12, parts: 5 },
        detail: 'Dodatkowe przygotowanie: przekaż 24 rudy w stacji. Możesz dzielić wpłaty; zapas nie blokuje odzyskania pakietu.',
    },
    {
        id: 'saturn-survey',
        sector: 'saturn',
        act: 8,
        title: 'Rozpoznanie pierścieni',
        required: true,
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 18, parts: 4 },
        detail: 'Leć do przekaźnika na podejściu do pierścieni. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć dalszy obszar.',
    },
    {
        id: 'saturn-supply',
        sector: 'saturn',
        act: 8,
        title: 'Zaopatrzenie z pierścieni',
        required: true,
        kind: 'gather',
        resource: 'ore',
        target: 36,
        dependencies: ['saturn-survey'],
        reward: { ore: 24, parts: 8 },
        detail: 'Po zwiadzie przywieź 36 rudy z wypraw w pierścienie, korzystając z bliskiego złoża. Możesz dzielić transporty; ruda trafia do zwykłego magazynu.',
    },
    {
        id: 'saturn-patrol',
        sector: 'saturn',
        act: 8,
        title: 'Zabezpieczenie rejonu',
        required: true,
        kind: 'patrol',
        target: 1,
        dependencies: ['saturn-survey'],
        reward: { ore: 16, parts: 5 },
        detail: 'Po zwiadzie odeprzyj odległy patrol i poczekaj na potwierdzenie radiowe. Walkę i zaopatrzenie możesz wykonać w dowolnej kolejności.',
    },
    {
        id: 'saturn-route',
        sector: 'saturn',
        act: 8,
        title: 'Odczyt dalszej trasy',
        required: true,
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['saturn-supply', 'saturn-patrol'],
        reward: { ore: 28, parts: 8 },
        detail: 'Po zaopatrzeniu i raporcie z walki leć do dalszego punktu. Zbierz dane przez E i poczekaj na potwierdzenie radiowe Satuk 15.',
    },
    {
        id: 'saturn-reserve',
        sector: 'saturn',
        act: 8,
        title: 'Rezerwa dalszej ekspedycji',
        required: false,
        kind: 'ore',
        target: 18,
        dependencies: ['saturn-survey'],
        reward: { ore: 8, parts: 4 },
        detail: 'Dodatkowy projekt: przekaż 18 rudy z magazynu stacji. Wpłaty mogą być częściowe. Rezerwa nie blokuje odczytu trasy.',
    },
    {
        id: 'uranus-survey',
        sector: 'uranus',
        act: 9,
        title: 'Rozpoznanie rejonu Urana',
        required: true,
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 20, parts: 5 },
        detail: 'Leć do pomiarów podejścia. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć obszar baz.',
    },
    {
        id: 'uranus-base',
        sector: 'uranus',
        act: 9,
        title: 'Dane chronionej bazy',
        required: true,
        kind: 'scan',
        site: 'outpost',
        target: 1,
        dependencies: ['uranus-survey'],
        reward: { ore: 24, parts: 7 },
        detail: 'Po zwiadzie leć do terminala bazy. E pobiera dane bez alarmu; G wyłącza skaner na 20 s. Wróć z danymi.',
    },
    {
        id: 'uranus-patrol',
        sector: 'uranus',
        act: 9,
        title: 'Osłona obszaru baz',
        required: true,
        kind: 'patrol',
        target: 2,
        dependencies: ['uranus-survey'],
        reward: { ore: 30, parts: 8 },
        detail: 'Odeprzyj patrol i Lancera w rejonie baz. Możesz raportować kontakty osobno. Włamanie i walki wykonujesz równolegle.',
    },
    {
        id: 'uranus-route',
        sector: 'uranus',
        act: 9,
        title: 'Trasa do Neptuna',
        required: true,
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['uranus-base', 'uranus-patrol'],
        reward: { ore: 24, parts: 6 },
        detail: 'Po raportach z bazy i walki leć do dalszego węzła. Odczyt przez E i potwierdzenie radiowe otwierają sektor Neptuna.',
    },
    {
        id: 'uranus-reserve',
        sector: 'uranus',
        act: 9,
        title: 'Zapas na dalszą trasę',
        required: false,
        kind: 'ore',
        target: 20,
        dependencies: ['uranus-survey'],
        reward: { ore: 10, parts: 5 },
        detail: 'Dodatkowo przekaż 20 rudy w stacji. Wpłaty mogą być częściowe; zapas nie blokuje trasy do Neptuna.',
    },
    {
        id: 'neptune-survey',
        sector: 'neptune',
        act: 9,
        title: 'Zwiad podejścia do Neptuna',
        required: true,
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 22, parts: 5 },
        detail: 'Leć do przekaźnika. Odczyt przez E i bezpieczny powrót otwierają rejon kolejnej bazy.',
    },
    {
        id: 'neptune-base',
        sector: 'neptune',
        act: 9,
        title: 'Rozpoznanie bazy Neptuna',
        required: true,
        kind: 'scan',
        site: 'outpost',
        target: 1,
        dependencies: ['neptune-survey'],
        reward: { ore: 28, parts: 8 },
        detail: 'Leć do chronionego terminala. Pobierz dane przez E bez alarmu i wróć. G wyłącza skaner na 20 s.',
    },
    {
        id: 'neptune-boss',
        sector: 'neptune',
        act: 9,
        title: 'Pierwsze starcie',
        required: true,
        kind: 'boss',
        target: 1,
        dependencies: ['neptune-base'],
        reward: { ore: 50, parts: 16 },
        detail: 'Po raporcie z bazy leć do rejonu starcia. G przez 2 s rozpoczyna dwufazową walkę. Zmuś ciężką jednostkę do odwrotu i poczekaj na potwierdzenie radiowe.',
    },
    {
        id: 'neptune-route',
        sector: 'neptune',
        act: 9,
        title: 'Odczyt zewnętrznej trasy',
        required: true,
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['neptune-boss'],
        reward: { ore: 30, parts: 10 },
        detail: 'Po bezpiecznym raporcie ze starcia leć do dalszego punktu. Zbierz odczyt i poczekaj na potwierdzenie radiowe Satuk 15.',
    },
    {
        id: 'neptune-patrol',
        sector: 'neptune',
        act: 9,
        title: 'Dodatkowa osłona podejścia',
        required: false,
        kind: 'patrol',
        target: 2,
        dependencies: ['neptune-survey'],
        reward: { ore: 24, parts: 6 },
        detail: 'Dodatkowo odeprzyj dwa patrole. Możesz wracać z raportami pojedynczo. Nie blokują pierwszego starcia ani dalszej trasy.',
    },

    {
        id: 'pluto-survey',
        sector: 'pluto',
        act: 10,
        title: 'Zwiad Plutona',
        required: true,
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 24, parts: 6 },
        detail: 'Leć do pomiarów podejścia. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć dalszy obszar.',
    },
    {
        id: 'pluto-base',
        sector: 'pluto',
        act: 10,
        title: 'Dane końcowego podejścia',
        required: true,
        kind: 'scan',
        site: 'outpost',
        target: 1,
        dependencies: ['pluto-survey'],
        reward: { ore: 30, parts: 10 },
        detail: 'Leć do chronionego terminala. Pobierz dane przez E i wróć. G wyłącza skaner na 20 s. Cel równoległy do osłony.',
    },
    {
        id: 'pluto-patrol',
        sector: 'pluto',
        act: 10,
        title: 'Osłona końcowego podejścia',
        required: true,
        kind: 'patrol',
        target: 2,
        dependencies: ['pluto-survey'],
        reward: { ore: 36, parts: 10 },
        detail: 'Odeprzyj patrol i Lancera. Raporty możesz przywozić pojedynczo. Dane bazy i osłonę realizujesz w dowolnej kolejności.',
    },
    {
        id: 'pluto-boss',
        sector: 'pluto',
        act: 10,
        title: 'Finałowe starcie',
        required: true,
        kind: 'boss',
        target: 1,
        dependencies: ['pluto-base', 'pluto-patrol'],
        reward: { ore: 60, parts: 20 },
        detail: 'Po obu raportach leć do rejonu starcia. G przez 2 s rozpoczyna walkę z trzema fazami. Unieszkodliw jednostkę i wróć bezpiecznie do Satuk 15.',
    },
    {
        id: 'pluto-record',
        sector: 'pluto',
        act: 10,
        title: 'Zabezpieczenie odczytów',
        required: false,
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['pluto-survey'],
        reward: { ore: 18, parts: 8 },
        detail: 'Leć do odległego punktu pomiarowego. Zbierz dane i wróć. Dodatkowy odczyt nie blokuje finałowego starcia.',
    },
];
export const PLUTO_ARENA = { x: 4200, y: -1000 } as const;
export const OUTER_BASES = {
    pluto: { x: 2600, y: 1200, terminal: { x: 2340, y: 1200 } },
    uranus: { x: 2600, y: 900, terminal: { x: 2340, y: 900 } },
    neptune: { x: 2500, y: 1200, terminal: { x: 2240, y: 1200 } },
} as const;
export const NEPTUNE_ARENA = { x: 3900, y: -900 } as const;
export const JUPITER_UPLINK = { x: 2600, y: 900, terminal: { x: 2340, y: 900 } } as const;
export const MARS_BASE = { x: -2600, y: 1200 } as const;
export const VENUS_EXPANSION_TASKS = [
    'venus-build',
    ...VENUS_SHIELD.map((t) => t.id),
    'venus-shield',
    'venus-defense',
];
export const VENUS_OUTPOST = { x: 2700, y: -1100 } as const;
export const EARTH_BRIEFING =
    'Pomiary anomalii wskazują, że brakującą technologię znajdziemy w rejonie Merkurego. Najpierw skieruj Satuk 15 do Wenus: rozpoznaj orbitę i przygotuj zaplecze przed wyprawą bliżej Słońca.';
export interface StoryProgress {
    version: 30;
    mars: MarsProgress;
    dialogues: string[];
    sector: StorySectorId;
    progress: Record<string, number>;
    claimed: string[];
    searchedWrecks: StorySectorId[];
}
export const newStoryProgress = (): StoryProgress => ({
    version: 30,
    mars: newMarsProgress(),
    dialogues: [],
    sector: 'earth',
    progress: Object.fromEntries(STORY_TASKS.map((task) => [task.id, 0])),
    claimed: [],
    searchedWrecks: [],
});
export function storyTaskAvailable(p: StoryProgress, task: StoryTask) {
    return (
        storySectorUnlocked(p, task.sector) &&
        (task.id !== 'mars-phobos-base' || phobosOrbitSecured(p)) &&
        task.dependencies.every((id) => p.claimed.includes(id))
    );
}
export function storySectorComplete(
    p: StoryProgress,
    sector: StorySectorId,
    act: number = STORY_SECTORS[sector].act,
) {
    return STORY_TASKS.filter(
        (task) => task.sector === sector && task.act === act && task.required,
    ).every((task) => p.claimed.includes(task.id));
}
export function storySectorUnlocked(p: StoryProgress, sector: StorySectorId) {
    switch (sector) {
        case 'earth':
            return true;
        case 'lunar':
            return p.claimed.includes('earth-relay');
        case 'mars':
            return actOneComplete(p);
        case 'venus':
            return p.claimed.includes('earth-debrief');
        case 'uranus':
            return storySectorComplete(p, 'saturn');
        case 'pluto':
            return storySectorComplete(p, 'neptune');
        case 'neptune':
            return storySectorComplete(p, 'uranus');
        case 'saturn':
            return storySectorComplete(p, 'jupiter');
        case 'jupiter':
            return storySectorComplete(p, 'belt');
        case 'belt':
            return beltPassageReady(p);
        case 'mercury':
            return storySectorComplete(p, 'venus') && solarShieldReady(p);
    }
}
export function storyAct(p: StoryProgress) {
    if (p.sector === 'pluto') return 'AKT X';
    if (p.sector === 'uranus' || p.sector === 'neptune') return 'AKT IX';
    if (p.sector === 'saturn') return 'AKT VIII';
    if (p.sector === 'jupiter') return 'AKT VII';
    if (p.sector === 'belt') return 'AKT VI';
    if (p.sector === 'mars' && beltTechnologyReady(p)) return 'AKT V';
    return p.sector === 'mercury'
        ? 'AKT IV'
        : p.sector === 'venus'
          ? 'AKT III'
          : p.sector === 'mars' ||
              (p.sector === 'earth' && p.claimed.includes('mars-anomaly-research'))
            ? 'AKT II'
            : 'AKT I';
}
export function actTwoComplete(p: StoryProgress) {
    return storySectorComplete(p, 'mars') && p.claimed.includes('earth-debrief');
}
export function storyVisibleTasks(p: StoryProgress) {
    const tasks = STORY_TASKS.filter(
        (t) =>
            (t.sector === p.sector ||
                (inEarthSystem(t.sector) && inEarthSystem(p.sector)) ||
                (t.id === 'earth-debrief' && p.sector === 'mars')) &&
            !t.id.startsWith('earth-satellite-') &&
            !t.internal &&
            !(
                t.id === 'lunar-defense' &&
                p.claimed.includes('lunar-attack') &&
                !p.claimed.includes(t.id)
            ) &&
            (t.id !== 'earth-debrief' || p.claimed.includes('mars-anomaly-research')) &&
            (t.act !== 5 || beltTechnologyReady(p)),
    );
    return p.sector === 'mars' && beltTechnologyReady(p)
        ? tasks.sort((a, b) => b.act - a.act)
        : tasks;
}
/** Only revealed tasks belong in the journal, HUD and briefing. Definitions remain intact. */
export function storyDiscoveredTasks(p: StoryProgress) {
    return storyVisibleTasks(p).filter((t) => p.claimed.includes(t.id) || storyTaskAvailable(p, t));
}
export function marsBaseReady(p: StoryProgress) {
    return orbitalSuppliesReady(p, 'mars');
}
export function beltPassageReady(p: StoryProgress) {
    return beltTechnologyReady(p) && storySectorComplete(p, 'mars', 5);
}
export function beltRouteCleared(p: StoryProgress) {
    return BELT_BARRIERS.every((_, i) => p.claimed.includes(`belt-clear-${i}`));
}
export function venusPreparationComplete(p: StoryProgress) {
    return p.claimed.includes('venus-site') && orbitalSuppliesReady(p, 'venus');
}
export function solarShieldReady(p: StoryProgress) {
    return p.claimed.includes('venus-shield');
}
export function beltTechnologyReady(p: StoryProgress) {
    return p.claimed.includes('mercury-technology');
}
export function storyNextStep(p: StoryProgress) {
    if (p.sector === 'mars' && !beltTechnologyReady(p))
        return p.claimed.includes('mars-anomaly-research')
            ? 'Pomiary zakończone. Wróć do Satuk 15 na odprawę i przygotuj wyprawę ku Wenus.'
            : marsSecurityObjective(p);
    if (inEarthSystem(p.sector) && !actOneComplete(p)) {
        if (!p.claimed.includes('earth-relay'))
            return 'Uruchom przekaźnik orbitalny przez E. Otworzy śluzę Ziemia–Księżyc.';
        if (!p.claimed.includes('earth-workshop'))
            return 'Przygotuj pierwsze zaplecze w Satuk 15. Śluza na Księżyc jest już otwarta.';
        if (!p.claimed.includes('lunar-survey'))
            return p.claimed.includes('earth-route')
                ? 'Zsynchronizuj sondę księżycową przez E. Otworzy lądowanie i śluzę do bogatej asteroidy.'
                : 'Przeleć śluzą Ziemia–Księżyc.';
        if (!lunarProcessingReady(p))
            return 'Przygotuj części w Satuk 15. Załaduj manifest dostawy i przekaż wyposażenie na powierzchni. Każda dostawa uruchamia odpowiedni moduł stacji.';
        if (!p.claimed.includes('lunar-foundation') || !p.claimed.includes('lunar-installations'))
            return 'Lokalna linia działa. Uruchom Muła przez E i eskortuj wydobycie Żelaza (Fe) oraz Węgla (C). Możesz pomagać własnymi dostawami.';
        if (!p.claimed.includes('lunar-commission'))
            return 'Materiały dostarczone. E przy budowie: odbiór techniczny i odblokowanie kadłuba Muła.';
        return 'Stacja odebrana. Osłoń budowę i odeprzyj atak, aby otworzyć dalszą trasę.';
    }

    if (p.sector === 'pluto') {
        if (storySectorComplete(p, 'pluto'))
            return 'Cele operacyjne kampanii ukończone. Raport finałowego starcia zabezpieczony. Możesz wrócić do wcześniejszych sektorów i zadań dodatkowych.';
        if (!p.claimed.includes('pluto-survey'))
            return 'Rozpoznaj Plutona. Wróć z odczytem, aby otworzyć bazę i kontakty na podejściu.';
        return plutoFinaleReady(p)
            ? 'Leć do finałowego starcia. Zatrzymaj się i przytrzymaj G przez 2 s. Pokonaj trzy fazy i poczekaj na potwierdzenie radiowe. Dalsze pomiary są opcjonalne.'
            : 'Zbierz dane bazy i odeprzyj kontakty w dowolnej kolejności. Oba raporty otwierają rejon finałowego starcia. Dalsze pomiary są opcjonalne.';
    }

    if (p.sector === 'uranus') {
        if (storySectorComplete(p, 'uranus'))
            return 'Trasa do Neptuna otwarta. Wybierz kolejny sektor; Uran i wcześniejsze rejony pozostają dostępne.';
        if (!p.claimed.includes('uranus-survey'))
            return 'Wykonaj pomiary. Wróć z odczytem, aby otworzyć rejon chronionej bazy i patroli.';
        return outerRouteOpen(p, 'uranus')
            ? 'Raporty z bazy i walk zabezpieczone. Leć do trasy do Neptuna. Odczytaj węzeł i wróć.'
            : 'Pobierz dane bazy i odeprzyj kontakty w dowolnej kolejności. Wyniki zatwierdzasz po powrocie.';
    }
    if (p.sector === 'neptune') {
        if (storySectorComplete(p, 'neptune'))
            return 'Cele operacyjne aktu IX ukończone. Starcie i zewnętrzna trasa rozliczone. Wybierz sektor Plutona, aby rozpocząć akt X.';
        if (!p.claimed.includes('neptune-survey'))
            return 'Rozpoznaj podejście. Zbierz dane i wróć, aby otworzyć obszar bazy.';
        if (!p.claimed.includes('neptune-base'))
            return 'Leć do terminala bazy. Pobierz dane bez alarmu i poczekaj na potwierdzenie radiowe Satuk 15.';
        return p.claimed.includes('neptune-boss')
            ? 'Starcie odparte. Leć do zewnętrznej trasy. Zbierz odczyt i wróć.'
            : 'Leć do rejonu starcia. Zatrzymaj się i przytrzymaj G przez 2 s. Zmuś jednostkę do odwrotu. Opuszczenie rejonu przerywa próbę; raport potwierdza radio.';
    }
    if (p.sector === 'saturn') {
        if (storySectorComplete(p, 'saturn'))
            return 'Cele operacyjne Saturna ukończone. Zaopatrzenie i trasa zabezpieczone. Wybierz sektor Urana, aby rozpoznać dalszy obszar.';
        if (!p.claimed.includes('saturn-survey'))
            return 'Wykonaj pomiary pierścieni. Zbierz odczyt i wróć, aby otworzyć dalszy rejon. Możesz wydobywać z bliskiego złoża.';
        if (saturnRouteOpen(p))
            return 'Zaopatrzenie i rejon zabezpieczone. Leć do dalszego punktu. Odczytaj trasę przez E i poczekaj na potwierdzenie radiowe Satuk 15.';
        return 'Przywoź rudę z wypraw: cel 36, transporty można dzielić. Złoże, kryształy i odległy patrol są celami nawigacji. Zaopatrzenie i walkę wykonujesz równolegle.';
    }
    if (p.sector === 'jupiter') {
        if (storySectorComplete(p, 'jupiter'))
            return 'Pakiet obserwacyjny zabezpieczony w Satuk 15. Cele operacyjne Jowisza ukończone. Możesz wybrać sektor Saturna.';
        if (!p.claimed.includes('jupiter-survey'))
            return 'Wykonaj pomiary podejścia. Zbierz odczyt przez E i wróć; raport otworzy rejon patroli oraz chroniony węzeł.';
        if (jupiterObservationsOpen(p))
            return 'Raporty z walk i węzła zabezpieczone. Leć do dalszego punktu. Zbierz pakiet obserwacyjny przez E i poczekaj na potwierdzenie radiowe Satuk 15.';
        return 'Odeprzyj patrole i zbierz dane terminala węzła w dowolnej kolejności. Wróć z raportami, aby otworzyć punkt obserwacyjny.';
    }
    if (storySectorComplete(p, 'belt'))
        return 'Akt VI ukończony. Przejście pasa potwierdzone. Wybierz sektor Jowisz, aby rozpoznać dalszy obszar.';
    if (p.sector === 'belt') {
        if (!p.claimed.includes('belt-survey'))
            return 'Leć do wejścia w pas. Zbierz pomiary i wróć; raport otworzy dalszą trasę. Technologia z Merkurego umożliwia tę wyprawę.';
        return beltRouteCleared(p)
            ? 'Trasa oczyszczona. Leć do zewnętrznej granicy pasa. Dotrzyj do węzła, zbierz odczyt przez E i poczekaj na potwierdzenie radiowe.'
            : 'Usuń oznaczone skały. Użyj lasera lub uzbrojenia i poczekaj na potwierdzenie radiowe; kolejność i liczba wypraw są dowolne. Uważaj na ruchome odłamki.';
    }
    if (beltPassageReady(p))
        return 'Akt V ukończony. Baza i korytarz zabezpieczone. Wybierz sektor Pas, aby rozpocząć przejście pasa asteroid.';
    if (p.sector === 'mars' && beltTechnologyReady(p)) {
        if (!p.claimed.includes('mars-base-build'))
            return marsBaseReady(p)
                ? 'Materiały gotowe. Wyrusz do bazy i przytrzymaj E przez 2 s, aby ją zamontować.'
                : 'Wyprodukuj pięć kompletów części i załaduj manifest. Dostarcz wyposażenie do bazy marsjańskiej przez C lub E; dostawy częściowe pozostają na budowie.';
        if (p.claimed.includes('mars-base-defense'))
            return 'Baza obroniona. Odeprzyj kontakty w dalszym korytarzu. Wyniki walk potwierdza radio.';
        if (p.claimed.includes('mars-corridor'))
            return 'Korytarz zabezpieczony. Obroń bazę: G przez 2 s przy obiekcie rozpoczyna atak. Raport potwierdzi radio.';
        return 'Obroń bazę przez G przy obiekcie i zabezpiecz dalszy korytarz. Te cele możesz wykonywać równolegle; raporty potwierdza radio.';
    }
    if (beltTechnologyReady(p))
        return 'Akt IV ukończony. Technologia przejścia pasa zabezpieczona. Następny etap: powrót na Marsa i przygotowanie dalszej ekspedycji.';
    if (p.sector === 'mercury')
        return p.claimed.includes('mercury-patrol')
            ? 'Leć do pakietu technologii. Zbierz dane i poczekaj na potwierdzenie radiowe Satuk 15. Utrata statku przed powrotem oznacza utratę pakietu.'
            : p.claimed.includes('mercury-survey')
              ? 'Zabezpiecz podejście i wróć z raportami. W cieniu dużych asteroid statek chłodzi się; nie niszcz osłon bez potrzeby.'
              : 'Wykonaj pomiary podejścia. Kolejne schronienie pojawi się po zwiadzie. Chłodź statek w zaznaczonym cieniu dużych skał.';
    if (p.sector === 'venus') {
        if (storySectorComplete(p, 'venus'))
            return 'Akt III ukończony. Placówka obroniona, osłona słoneczna gotowa. Następny kierunek: Merkury.';
        if (p.claimed.includes('venus-build'))
            return p.claimed.includes('venus-defense')
                ? 'Placówka obroniona. Dostarcz brakujące części osłony słonecznej do placówki, aby zakończyć przygotowania.'
                : solarShieldReady(p)
                  ? 'Osłona gotowa. Obroń placówkę: G przez 2 s przy obiekcie rozpoczyna atak. Raport potwierdzi radio Satuk 15.'
                  : 'Dostarcz części osłony do placówki i obroń placówkę: G przez 2 s przy obiekcie rozpoczyna atak. Raport potwierdzi radio.';
        if (venusPreparationComplete(p))
            return 'Miejsce i materiały przygotowane. Wyrusz do placówki i przytrzymaj E przez 2 s, aby ją zbudować.';
        return p.claimed.includes('venus-survey')
            ? 'Wykonaj pomiary miejsca pod placówkę i dostarcz manifest części przez C lub E. Te cele możesz realizować równolegle.'
            : 'Rozpoznaj orbitę Wenus i wróć z odczytem. Zwiad otworzy dalszy obszar oraz przygotowania placówki.';
    }
    if (actTwoComplete(p))
        return 'Akt II ukończony. Trasa do Wenus otwarta. Przygotuj zaplecze przed wyprawą na Merkurego; wcześniejsze sektory pozostają dostępne.';
    if (p.claimed.includes('mars-anomaly-research'))
        return p.sector === 'earth'
            ? 'Pomiary anomalii dostarczone. Odbierz odprawę Nowy kierunek i zatwierdź plan podróży do Wenus.'
            : 'Wróć do Satuk 15 i odbierz odprawę Nowy kierunek po badaniach anomalii.';
    if (actOneComplete(p))
        return p.sector === 'mars'
            ? 'Odczyt przekaźnika i osłona podejścia otworzą dalszy obszar. Raporty zatwierdzasz po powrocie.'
            : 'Akt I ukończony. Stacja księżycowa działa. Podejmij pościg w sektorze Marsa; wcześniejsze sektory pozostają dostępne.';
    return '';
}
export function marsApproachOpen(p: StoryProgress) {
    return p.mars.aiIdentified;
}
export function jupiterObservationsOpen(p: StoryProgress) {
    return ['jupiter-patrol', 'jupiter-uplink'].every((id) => p.claimed.includes(id));
}
export function saturnRouteOpen(p: StoryProgress) {
    return ['saturn-supply', 'saturn-patrol'].every((id) => p.claimed.includes(id));
}
export function outerRouteOpen(p: StoryProgress, sector: 'uranus' | 'neptune') {
    return sector === 'uranus'
        ? ['uranus-base', 'uranus-patrol'].every((id) => p.claimed.includes(id))
        : p.claimed.includes('neptune-base');
}
export function plutoFinaleReady(p: StoryProgress) {
    return ['pluto-base', 'pluto-patrol'].every((id) => p.claimed.includes(id));
}
export function storyRadius(p: StoryProgress) {
    if (p.sector === 'earth' && p.claimed.includes('earth-relay')) return 12000;
    if (p.sector === 'pluto')
        return plutoFinaleReady(p) ? 6000 : p.claimed.includes('pluto-survey') ? 4800 : 2800;
    if (p.sector === 'uranus')
        return outerRouteOpen(p, 'uranus')
            ? 5600
            : p.claimed.includes('uranus-survey')
              ? 4600
              : 2700;
    if (p.sector === 'neptune')
        return outerRouteOpen(p, 'neptune')
            ? 5800
            : p.claimed.includes('neptune-survey')
              ? 4800
              : 2800;
    if (p.sector === 'saturn')
        return saturnRouteOpen(p) ? 5400 : p.claimed.includes('saturn-survey') ? 4200 : 2500;
    if (p.sector === 'jupiter')
        return jupiterObservationsOpen(p)
            ? 6100
            : p.claimed.includes('jupiter-survey')
              ? 4700
              : 2700;
    if (p.sector === 'belt' && p.claimed.includes('belt-survey')) return 5700;
    if (p.sector === 'mercury' && p.claimed.includes('mercury-survey')) return 4700;
    if (p.sector === 'mars' && p.claimed.includes('mars-base-build')) return 5400;
    if (p.sector === 'mars' && !beltTechnologyReady(p)) return 11000;
    if (p.sector === 'venus' && p.claimed.includes('venus-survey')) return 3900;
    return p.sector === 'earth' &&
        ['earth-supply', 'earth-relay'].every((id) => p.claimed.includes(id))
        ? 2450
        : STORY_SECTORS[p.sector].radius;
}
export function actOneComplete(p: StoryProgress) {
    return storySectorComplete(p, 'earth') && storySectorComplete(p, 'lunar');
}
export function validStory(value: unknown): value is StoryProgress {
    if (!value || typeof value !== 'object') return false;
    const p = value as StoryProgress;
    if (
        p.version !== 30 ||
        !validMarsProgress(p.mars) ||
        !Object.hasOwn(STORY_SECTORS, p.sector) ||
        !p.progress ||
        typeof p.progress !== 'object' ||
        Array.isArray(p.progress) ||
        !Array.isArray(p.claimed) ||
        new Set(p.claimed).size !== p.claimed.length
    )
        return false;
    if (
        Object.keys(p.progress).length !== STORY_TASKS.length ||
        p.claimed.some((id) => !STORY_TASKS.some((task) => task.id === id))
    )
        return false;
    for (const task of STORY_TASKS) {
        const n = p.progress[task.id];
        if (
            !Number.isInteger(n) ||
            n < 0 ||
            n > task.target ||
            (n === task.target) !== p.claimed.includes(task.id)
        )
            return false;
        if (p.claimed.includes(task.id) && !storyTaskAvailable(p, task)) return false;
        if (n > 0 && !storyTaskAvailable(p, task)) return false;
    }
    if (
        !Array.isArray(p.searchedWrecks) ||
        new Set(p.searchedWrecks).size !== p.searchedWrecks.length ||
        p.searchedWrecks.some(
            (id) => !Object.hasOwn(STORY_SECTORS, id) || !storySectorUnlocked(p, id),
        )
    )
        return false;
    return validDialogueHistory(p) && storySectorUnlocked(p, p.sector);
}
export interface StoryChange {
    titles: string[];
    reward: Cargo;
    overflow: number;
    xp: number;
}
export function storyRewardText(task: StoryTask) {
    const rewards = [];
    if (task.rewardXp) rewards.push(`${task.rewardXp} PD dla pilota`);
    if (RESOURCE_IDS.some((id) => (task.reward[id] ?? 0) > 0))
        rewards.push(
            task.id === 'earth-relay'
                ? '1 × System podtrzymywania życia'
                : resourceSummary(task.reward),
        );
    return rewards.join(' · ');
}
function settle(c: Campaign): StoryChange {
    const p = c.story!;
    const result: StoryChange = { titles: [], reward: { ore: 0, parts: 0 }, overflow: 0, xp: 0 };
    const pilot = c.pilots.find((pilot) => pilot.id === (c.activeRun?.pilotId ?? c.selectedPilot));
    for (const task of STORY_TASKS) {
        if (!storyTaskAvailable(p, task) || p.claimed.includes(task.id)) continue;
        if (task.deliveryItems)
            p.progress[task.id] = task.deliveryItems.reduce(
                (sum, item) => sum + Math.min(item.target, p.progress[item.id]),
                0,
            );
        if (
            task.requirements &&
            task.kind !== 'workshop' &&
            Object.entries(task.requirements).every(
                ([id, count]) => (c.bank[id as ResourceId] ?? 0) >= count,
            )
        )
            p.progress[task.id] = task.target;
        if (task.id === 'mars-shields' && c.station.shield) p.progress[task.id] = 1;
        if (task.id === 'mars-landing-blocked' && p.mars.landingBlocked) p.progress[task.id] = 1;
        if (task.id === 'mars-phobos-route' && p.mars.ambushEntered) p.progress[task.id] = 1;
        if (task.id === 'mars-phobos-base' && p.mars.memoryDelivered) p.progress[task.id] = 1;
        if (task.id === 'mars-ai-discovery' && p.mars.memoryDelivered && !c.activeRun) {
            p.mars.aiIdentified = true;
            p.progress[task.id] = 1;
        }
        if (task.id === 'mars-asteroid-yard' && p.mars.yardDestroyed) p.progress[task.id] = 1;
        if (task.id === 'mars-sector-secure' && marsThreatsCleared(p)) p.progress[task.id] = 1;
        if (task.id === 'mars-anomaly-research' && p.mars.researchSites === 3)
            p.progress[task.id] = 1;
        if (task.id === 'mars-probe' && p.mars.probeDelivered) p.progress[task.id] = 1;
        if (task.id === 'venus-shield' && VENUS_SHIELD.every((t) => p.claimed.includes(t.id)))
            p.progress[task.id] = 1;
        if (
            task.id === 'earth-ship-upgrade' &&
            [c.ship, ...c.reserveShips].some(
                (ship) =>
                    ship &&
                    (['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const).some(
                        (key) => ship[key] > 0,
                    ),
            )
        )
            p.progress[task.id] = 1;
        if (task.kind === 'workshop' && c.station.workshop >= 1) p.progress[task.id] = 1;
        if (task.kind === 'kineticShield' && c.station.shieldLevel > 0) p.progress[task.id] = 1;
        if (p.progress[task.id] < task.target) continue;
        p.claimed.push(task.id);
        if (!task.internal) result.titles.push(task.title);
        for (const id of RESOURCE_IDS)
            if (task.reward[id]) result.reward[id] = (result.reward[id] ?? 0) + task.reward[id]!;
        if (pilot && task.rewardXp) {
            const progress = awardPilotXp(pilot, task.rewardXp);
            result.xp += progress.gainedXp;
            if (c.activeRun) c.activeRun.questXp = (c.activeRun.questXp ?? 0) + progress.gainedXp;
        }
    }
    let free = Math.max(0, storageCapacity(c) - storageUsed(c));
    for (const id of RESOURCE_IDS) {
        const count = result.reward[id] ?? 0,
            accepted = Math.min(free, count);
        if (accepted) c.bank[id] = (c.bank[id] ?? 0) + accepted;
        free -= accepted;
        result.overflow += count - accepted;
    }
    return result;
}
export function syncStory(c: Campaign): StoryChange | null {
    return c.story ? settle(c) : null;
}
export function recordLunarDefense(c: Campaign) {
    const p = c.story,
        task = STORY_TASKS.find((t) => t.id === 'lunar-defense')!;
    if (
        !p ||
        !inEarthSystem(c.activeRun?.sector) ||
        c.activeRun.area !== 'surface' ||
        !inEarthSystem(p.sector) ||
        !storyTaskAvailable(p, task) ||
        p.claimed.includes(task.id)
    )
        return null;
    p.progress[task.id] = 1;
    return settle(c);
}
export function recordSatelliteDelivery(c: Campaign, id: string) {
    if (!c.story || !SATELLITES.some((s) => s.task === id) || c.story.claimed.includes(id))
        return null;
    c.story.progress[id] = 1;
    c.story.progress['earth-salvage'] = SATELLITES.filter(
        (s) => c.story!.progress[s.task] === 1,
    ).length;
    return settle(c);
}
export function recordMoonArrival(c: Campaign) {
    if (
        !inEarthSystem(c.story?.sector) ||
        !inEarthSystem(c.activeRun?.sector) ||
        c.activeRun?.mission?.aborted ||
        !c.story?.claimed.includes('earth-relay')
    )
        return null;
    c.story.progress['earth-route'] = 1;
    return settle(c);
}
export function lunarBuildStage(p: StoryProgress) {
    return p.claimed.includes('lunar-commission')
        ? 3
        : p.claimed.includes('lunar-installations') && p.claimed.includes('lunar-foundation')
          ? 2
          : p.claimed.includes('lunar-foundation')
            ? 1
            : 0;
}
export function recordOrbitalConstruction(c: Campaign) {
    const p = c.story;
    const id =
        p?.sector === 'mars' ? 'mars-base-build' : p?.sector === 'venus' ? 'venus-build' : '';
    const task = STORY_TASKS.find((t) => t.id === id);
    if (
        !p ||
        !task ||
        c.activeRun?.sector !== p.sector ||
        c.activeRun.area ||
        !storyTaskAvailable(p, task) ||
        p.claimed.includes(task.id)
    )
        return null;
    p.progress[task.id] = 1;
    return settle(c);
}
export function recordVenusConstruction(c: Campaign) {
    const p = c.story,
        task = STORY_TASKS.find((t) => t.id === 'venus-build')!;
    if (
        !p ||
        p.sector !== 'venus' ||
        c.activeRun?.sector !== 'venus' ||
        c.activeRun.area ||
        !storyTaskAvailable(p, task) ||
        p.claimed.includes(task.id)
    )
        return null;
    p.progress[task.id] = 1;
    return settle(c);
}
export function acknowledgeStoryBriefing(c: Campaign) {
    const p = c.story,
        task = STORY_TASKS.find((t) => t.id === 'earth-debrief')!;
    if (
        !p ||
        c.activeRun ||
        !['earth', 'mars'].includes(p.sector) ||
        p.claimed.includes(task.id) ||
        !storyTaskAvailable(p, task)
    )
        return null;
    p.progress[task.id] = 1;
    return settle(c);
}
export function constructionDeliveryTasks(c: Campaign) {
    const p = c.story;
    return p
        ? STORY_TASKS.filter(
              (t) =>
                  (t.sector === p.sector || (inEarthSystem(t.sector) && inEarthSystem(p.sector))) &&
                  t.kind === 'delivery' &&
                  !p.claimed.includes(t.id) &&
                  storyTaskAvailable(p, t),
          )
        : [];
}
export function lunarDeliveryTasks(c: Campaign) {
    return inEarthSystem(c.story?.sector)
        ? constructionDeliveryTasks(c).filter(
              (t) => t.sector === 'lunar' && !LUNAR_PROCESSING_TASKS.some((id) => id === t.id),
          )
        : [];
}
export function pendingOrbitalDeliveries(c: Campaign, cargo: Cargo) {
    const p = c.story;
    if (
        !p ||
        !['mars', 'venus'].includes(p.sector) ||
        c.activeRun?.sector !== p.sector ||
        c.activeRun.area ||
        c.activeRun.mission?.aborted
    )
        return [];
    return constructionDeliveryTasks(c).flatMap((task) => {
        if (!task.resource) return [];
        const amount = Math.min(cargo[task.resource] ?? 0, task.target - p.progress[task.id]);
        return amount > 0 ? [{ task, resource: task.resource, amount }] : [];
    });
}
export function deliverOrbitalCargo(c: Campaign, cargo: Cargo) {
    const pending = pendingOrbitalDeliveries(c, cargo);
    if (!pending.length) return null;
    const accepted: Cargo = { ore: 0, parts: 0 };
    for (const { task, resource, amount } of pending) {
        cargo[resource] = (cargo[resource] ?? 0) - amount;
        accepted[resource] = (accepted[resource] ?? 0) + amount;
        c.story!.progress[task.id] += amount;
    }
    recordCargoDelivery(c, accepted);
    return { accepted, change: settle(c) };
}
export function pendingLunarDeliveries(c: Campaign, cargo: Cargo) {
    const p = c.story;
    if (
        !p ||
        !inEarthSystem(c.activeRun?.sector) ||
        c.activeRun.area !== 'surface' ||
        c.activeRun.mission?.aborted
    )
        return [];
    return lunarDeliveryTasks(c)
        .filter((task) => !LUNAR_PROCESSING_TASKS.some((id) => id === task.id))
        .flatMap((task) => {
            if (!task.resource) return [];
            const amount = Math.min(cargo[task.resource] ?? 0, task.target - p.progress[task.id]);
            return amount > 0 ? [{ task, resource: task.resource, amount }] : [];
        });
}
export function pendingLunarDelivery(c: Campaign, cargo: Cargo) {
    return pendingLunarDeliveries(c, cargo)[0] ?? null;
}
/** Only the physical parcel at the lunar site can commission the first equipment. */
export function deliverLunarShipment(c: Campaign) {
    if (
        !c.lunarShipment ||
        !lunarShipmentPending(c) ||
        !inEarthSystem(c.activeRun?.sector) ||
        c.activeRun?.area !== 'surface' ||
        c.activeRun?.mission?.aborted
    )
        return null;
    for (const task of LUNAR_PROCESSING) c.story!.progress[task.id] = task.target;
    c.lunarShipment = null;
    delete c.activeRun.lunarShipment;
    return settle(c);
}
export function deliverLunarCargo(c: Campaign, cargo: Cargo, playerDelivery = true) {
    if (!playerDelivery && (!c.story || !lunarProcessingReady(c.story))) return null;
    const pending = pendingLunarDeliveries(c, cargo);
    if (!pending.length) return null;
    const accepted: Cargo = { ore: 0, parts: 0 };
    for (const { task, resource, amount } of pending) {
        cargo[resource] = (cargo[resource] ?? 0) - amount;
        accepted[resource] = (accepted[resource] ?? 0) + amount;
        c.story!.progress[task.id] += amount;
    }
    if (playerDelivery) recordCargoDelivery(c, accepted);
    return {
        amount: Object.values(accepted).reduce((sum, n) => sum + n, 0),
        resource: pending[0].resource,
        accepted,
        change: settle(c),
    };
}
export function constructionManifest(c: Campaign): Cargo {
    const cargo: Cargo = { ore: 0, parts: 0 };
    if (!c.ship || c.activeRun) return cargo;
    for (const task of constructionDeliveryTasks(c)) {
        const id = task.resource!;
        cargo[id] = (cargo[id] ?? 0) + task.target - c.story!.progress[task.id];
    }
    return cargo;
}
export function constructionLoadLock(c: Campaign) {
    if (lunarShipmentPending(c)) return lunarShipmentLock(c);
    const manifest = constructionManifest(c),
        count = Object.values(manifest).reduce((sum, n) => sum + n, 0);
    if (!count) return 'Brak ładunku do dostarczenia.';
    if (!c.ship || count > capacity(c))
        return `Potrzeba miejsca na cały ładunek: ${count} / ${c.ship ? capacity(c) : 0}.`;
    const missing = RESOURCE_IDS.filter((id) => (c.bank[id] ?? 0) < (manifest[id] ?? 0));
    return missing.length ? 'Brakuje pełnego kompletu materiałów. Sprawdź wymagania zadań.' : null;
}
export function contributeStory(c: Campaign, id: string): StoryChange | null {
    const p = c.story,
        task = STORY_TASKS.find((t) => t.id === id);
    if (
        !p ||
        c.activeRun ||
        !task ||
        task.sector !== p.sector ||
        !['ore', 'parts'].includes(task.kind) ||
        !storyTaskAvailable(p, task) ||
        p.claimed.includes(id)
    )
        return null;
    const resource = task.kind === 'parts' ? 'parts' : 'ore';
    const amount = Math.min(c.bank[resource], task.target - p.progress[id]);
    if (amount <= 0) return null;
    c.bank[resource] -= amount;
    p.progress[id] += amount;
    return settle(c);
}
/** Apply cumulative sortie telemetry, shared by live radio and the final docking report. */
export function recordStoryReturn(
    c: Campaign,
    sector: StorySectorId,
    data: readonly ScanSiteId[],
    wreckVisited = false,
    assaultWon = false,
    patrolKills = 0,
    venusDefenseWon = false,
    marsDefenseWon = false,
    clearedBeltRocks: readonly number[] = [],
    returnedOre = 0,
    firstBossWon = false,
    finalBossWon = false,
) {
    if (
        !c.story ||
        c.story.sector !== sector ||
        c.activeRun?.sector !== sector ||
        c.activeRun.mission?.aborted
    )
        return null;
    // Both live radio and docking supply cumulative sortie counts. Consume each kill once,
    // including kills made before a patrol becomes available.
    const run = c.activeRun;
    const cumulative = Number.isInteger(patrolKills) && patrolKills > 0 ? patrolKills : 0;
    patrolKills = Math.max(0, cumulative - (run.reportedPatrolKills ?? 0));
    if (cumulative > (run.reportedPatrolKills ?? 0)) run.reportedPatrolKills = cumulative;
    if (sector === 'pluto' && finalBossWon) {
        const task = STORY_TASKS.find((t) => t.id === 'pluto-boss')!;
        if (storyTaskAvailable(c.story, task)) {
            if (!c.story.claimed.includes(task.id)) run.reportedBossXp = 18;
            c.story.progress[task.id] = 1;
        }
    }
    if (sector === 'neptune' && firstBossWon) {
        const task = STORY_TASKS.find((t) => t.id === 'neptune-boss')!;
        if (storyTaskAvailable(c.story, task)) {
            if (!c.story.claimed.includes(task.id)) run.reportedBossXp = 12;
            c.story.progress[task.id] = 1;
        }
    }
    if (sector === 'saturn' && Number.isInteger(returnedOre) && returnedOre > 0) {
        const task = STORY_TASKS.find((t) => t.id === 'saturn-supply')!;
        if (storyTaskAvailable(c.story, task) && !c.story.claimed.includes(task.id))
            c.story.progress[task.id] = Math.min(
                task.target,
                c.story.progress[task.id] + returnedOre,
            );
    }
    if (sector === 'belt') {
        for (const index of new Set(clearedBeltRocks)) {
            if (!Number.isInteger(index) || index < 0 || index >= BELT_BARRIERS.length) continue;
            const task = STORY_TASKS.find((t) => t.id === `belt-clear-${index}`)!;
            if (storyTaskAvailable(c.story, task)) c.story.progress[task.id] = 1;
        }
    }
    if (sector === 'mars' && marsDefenseWon) {
        const task = STORY_TASKS.find((t) => t.id === 'mars-base-defense')!;
        if (storyTaskAvailable(c.story, task)) c.story.progress[task.id] = 1;
    }
    if (sector === 'venus' && venusDefenseWon) {
        const task = STORY_TASKS.find((t) => t.id === 'venus-defense')!;
        if (storyTaskAvailable(c.story, task)) c.story.progress[task.id] = 1;
    }
    const final = STORY_TASKS.find((t) => t.id === 'lunar-attack')!;
    if (inEarthSystem(sector) && assaultWon && storyTaskAvailable(c.story, final))
        c.story.progress[final.id] = 1;
    if (
        (sector === 'mars' ||
            sector === 'mercury' ||
            sector === 'belt' ||
            sector === 'jupiter' ||
            sector === 'saturn' ||
            sector === 'uranus' ||
            sector === 'neptune' ||
            sector === 'pluto') &&
        Number.isInteger(patrolKills) &&
        patrolKills > 0
    ) {
        const patrol = STORY_TASKS.find(
            (t) =>
                t.sector === sector &&
                t.kind === 'patrol' &&
                storyTaskAvailable(c.story!, t) &&
                !c.story!.claimed.includes(t.id),
        );
        if (patrol)
            c.story.progress[patrol.id] = Math.min(
                patrol.target,
                c.story.progress[patrol.id] + patrolKills,
            );
    }
    if (wreckVisited && !c.story.searchedWrecks.includes(sector))
        c.story.searchedWrecks.push(sector);
    for (const task of STORY_TASKS)
        if (
            (task.sector === sector || (inEarthSystem(task.sector) && inEarthSystem(sector))) &&
            (task.kind === 'scan' || task.kind === 'rescue' || task.kind === 'factory') &&
            task.site &&
            data.includes(task.site) &&
            storyTaskAvailable(c.story, task)
        )
            c.story.progress[task.id] = 1;
    return settle(c);
}
export function travelStory(c: Campaign, sector: StorySectorId) {
    if (
        !c.story ||
        c.activeRun ||
        (inEarthSystem(c.story.sector) && sector === 'lunar') ||
        !Object.hasOwn(STORY_SECTORS, sector) ||
        !storySectorUnlocked(c.story, sector) ||
        c.story.sector === sector
    )
        return false;
    c.story.sector = sector;
    return true;
}
export function storyObjectives(
    c: Campaign,
    data: readonly ScanSiteId[] = [],
    assaultWon = false,
    patrolKills = 0,
    venusDefenseWon = false,
    marsDefenseWon = false,
    clearedBeltRocks: readonly number[] = [],
    returnedOre = 0,
    firstBossWon = false,
    finalBossWon = false,
    cargo: ResourceStore = {},
) {
    const p = c.story!;
    patrolKills = Math.max(0, patrolKills - (c.activeRun?.reportedPatrolKills ?? 0));
    if (c.activeRun?.mission?.aborted) {
        data = [];
        assaultWon = false;
        patrolKills = 0;
        venusDefenseWon = false;
        marsDefenseWon = false;
        clearedBeltRocks = [];
        returnedOre = 0;
        firstBossWon = false;
        finalBossWon = false;
    }
    return storyDiscoveredTasks(p)
        .filter((t) => p.sector !== 'mars' || !beltTechnologyReady(p) || t.act === 5)
        .filter(
            (t) =>
                !(
                    inEarthSystem(p.sector) &&
                    lunarProcessingReady(p) &&
                    LUNAR_PROCESSING_TASKS.some((id) => id === t.id)
                ),
        )
        .map((task) => ({
            id: task.id,
            requirements: task.requirements
                ? Object.entries(task.requirements).map(([id, need]) => ({
                      resource: id as ResourceId,
                      need,
                      have:
                          task.id === 'earth-supply' && p.claimed.includes('earth-materials')
                              ? need
                              : (c.bank[id as ResourceId] ?? 0) + (cargo[id as ResourceId] ?? 0),
                  }))
                : task.id === 'lunar-equipment' && c.lunarShipment
                  ? undefined
                  : task.deliveryItems?.map((item) => ({
                        resource: item.resource,
                        need: item.target,
                        have:
                            task.id === 'lunar-equipment'
                                ? (c.bank[item.resource] ?? 0)
                                : p.progress[item.id],
                    })),
            title: `${c.activeRun?.mission?.task === task.id ? '▶ ' : ''}${task.title}${task.id === 'lunar-equipment' ? (c.lunarShipment ? ' · dostarcz paczkę' : ' · kompletowanie') : ''}`,
            progress: p.claimed.includes(task.id)
                ? ''
                : task.id === 'lunar-equipment'
                  ? c.lunarShipment
                      ? 'etap 2/2'
                      : 'etap 1/2'
                  : task.id === 'earth-supply'
                    ? '0/1'
                    : task.deliveryItems
                      ? `${task.deliveryItems.reduce((sum, item) => sum + Math.min(item.target, p.progress[item.id]), 0)}/${task.target}`
                      : !storyTaskAvailable(p, task)
                        ? '· później'
                        : task.kind === 'boss' &&
                            (task.sector === 'pluto' ? finalBossWon : firstBossWon)
                          ? '· wysyłanie raportu'
                          : task.kind === 'gather'
                            ? `${Math.min(task.target, p.progress[task.id] + (task.resource === 'ore' ? Math.max(0, Math.floor(returnedOre)) : 0))}/${task.target}${task.resource === 'ore' && returnedOre > 0 ? ' · wróć z ładunkiem' : ''}`
                            : task.kind === 'clearance' &&
                                clearedBeltRocks.some((i) => task.id === `belt-clear-${i}`)
                              ? '· wysyłanie raportu'
                              : task.kind === 'assault' &&
                                  (task.sector === 'mars'
                                      ? marsDefenseWon
                                      : task.sector === 'venus'
                                        ? venusDefenseWon
                                        : assaultWon)
                                ? '· wysyłanie raportu'
                                : task.kind === 'patrol'
                                  ? `${Math.min(task.target, p.progress[task.id] + patrolKills)}/${task.target}${patrolKills ? ' · wysyłanie raportu' : ''}`
                                  : task.kind === 'ore' ||
                                      task.kind === 'parts' ||
                                      task.kind === 'delivery'
                                    ? `${p.progress[task.id]}/${task.target}`
                                    : task.site && data.includes(task.site)
                                      ? '· wysyłanie danych'
                                      : '',
            complete: p.claimed.includes(task.id),
        }));
}
