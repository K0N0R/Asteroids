import { validDialogueHistory } from './dialogues';
import { capacity, storageCapacity, storageUsed, type Campaign, type Cargo } from './campaign';
import type { ScanSiteId } from '../config';

export const STORY_SAVE_KEY = 'asteroids.satuk15.v1';
export const STORY_SECTORS = {
    earth: {
        act: 1,
        shortName: 'Ziemia',
        name: 'Orbita Ziemi',
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
        name: 'Podejście do Marsa',
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
    kind:
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
        | 'factory';
    resource?: 'ore' | 'parts';
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
        id: 'earth-supply',
        sector: 'earth',
        act: 1,
        title: 'Pierwsze zaopatrzenie',
        detail: 'Wydobądź i przekaż stacji 24 rudy. Możesz dostarczać ją przez kilka wypraw.',
        required: true,
        kind: 'ore',
        target: 24,
        dependencies: [],
        reward: { ore: 30, parts: 4 },
    },
    {
        id: 'earth-relay',
        sector: 'earth',
        act: 1,
        title: 'Łączność orbitalna',
        detail: '7 wskazuje przekaźnik. Zatrzymaj statek, naciśnij E, dostrój trzy kanały i wróć z odczytem do Satuk 15.',
        required: true,
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 12, parts: 2 },
    },
    {
        id: 'earth-workshop',
        sector: 'earth',
        act: 1,
        title: 'Zaplecze stacji',
        detail: 'Po zaopatrzeniu i przywróceniu łączności uruchom warsztat I w panelu Stacja.',
        required: true,
        kind: 'workshop',
        target: 1,
        dependencies: ['earth-supply', 'earth-relay'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'earth-route',
        sector: 'earth',
        act: 1,
        title: 'Sygnał na dalszej orbicie',
        detail: 'Po otwarciu dalszego obszaru: 8 wskazuje węzeł. Przytrzymaj E i wróć z danymi trasy.',
        required: true,
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['earth-supply', 'earth-relay'],
        reward: { ore: 15, parts: 3 },
    },
    {
        id: 'earth-reserve',
        sector: 'earth',
        act: 1,
        title: 'Rezerwa materiałowa',
        detail: 'Dodatkowy przydział: przekaż 16 rudy na zapasy. Nie jest wymagany do podróży dalej.',
        required: false,
        kind: 'ore',
        target: 16,
        dependencies: [],
        reward: { ore: 8, parts: 3 },
    },
    {
        id: 'lunar-survey',
        sector: 'lunar',
        act: 1,
        title: 'Zwiad trasy księżycowej',
        detail: '7 wskazuje punkt rozpoznania. Zbierz odczyt przez E i wróć, aby otworzyć podejście do Księżyca.',
        required: true,
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 15, parts: 2 },
    },
    {
        id: 'lunar-foundation',
        sector: 'lunar',
        act: 1,
        title: 'Fundamenty stacji paliw',
        detail: 'Na Księżycu: N wskazuje Muła, E rozpoczyna eskortę. Dostarczcie 160 rudy na budowę (7). Fundamenty odblokują Muła.',
        required: true,
        kind: 'delivery',
        resource: 'ore',
        target: 160,
        dependencies: ['lunar-survey'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'lunar-installations',
        sector: 'lunar',
        act: 1,
        title: 'Instalacje stacji paliw',
        detail: 'Dostarcz na budowę 12 komponentów. Możesz dzielić dostawy na kilka wypraw.',
        required: true,
        kind: 'delivery',
        resource: 'parts',
        target: 12,
        dependencies: ['lunar-foundation'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'lunar-commission',
        sector: 'lunar',
        act: 1,
        title: 'Odbiór techniczny',
        detail: 'Po dostawach zeskanuj instalacje przez E i wróć z raportem do Satuk 15.',
        required: true,
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['lunar-installations'],
        reward: { ore: 24, parts: 6 },
    },
    {
        id: 'lunar-defense',
        sector: 'lunar',
        act: 1,
        title: 'Osłona budowy',
        detail: 'Po fundamentach: przy budowie przytrzymaj G przez 2 s. Obroń konstrukcję przed trzema falami asteroid.',
        required: true,
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
        detail: 'Po odbiorze i osłonie budowy: G przy stacji rozpoczyna atak AI. Odeprzyj trzy kontakty i wróć do Satuk 15.',
        required: true,
        kind: 'assault',
        target: 1,
        dependencies: ['lunar-commission', 'lunar-defense'],
        reward: { ore: 40, parts: 8 },
    },
    {
        id: 'lunar-rescue',
        sector: 'lunar',
        act: 1,
        title: 'Sygnał ratunkowy',
        detail: 'N: prom · E: zabezpiecz obwody, potem podłącz hol. Odprowadź prom do Satuk 15 i wróć z raportem.',
        required: false,
        kind: 'rescue',
        site: 'rescue',
        target: 1,
        dependencies: ['lunar-survey'],
        reward: { ore: 12, parts: 5 },
    },
    {
        id: 'mars-trail',
        sector: 'mars',
        act: 2,
        title: 'Ślad pościgu',
        required: true,
        detail: '7 wskazuje przekaźnik na trasie pościgu. Zbierz odczyt przez E i wróć do Satuk 15.',
        kind: 'scan',
        site: 'relay',
        target: 1,
        dependencies: [],
        reward: { ore: 16, parts: 4 },
    },
    {
        id: 'mars-patrol',
        sector: 'mars',
        act: 2,
        title: 'Zabezpieczenie podejścia',
        required: true,
        detail: 'Odeprzyj dwa patrole na podejściu. F wskazuje przeciwnika. Wyniki walki zatwierdzasz po powrocie; możesz rozdzielić je na wyprawy.',
        kind: 'patrol',
        target: 2,
        dependencies: [],
        reward: { ore: 24, parts: 6 },
    },
    {
        id: 'mars-belt',
        sector: 'mars',
        act: 2,
        title: 'Granica pościgu',
        required: true,
        detail: '8 wskazuje podejście do pasa asteroid. Zbierz odczyt przez E i wróć. Dalszy przelot wymaga brakującej technologii.',
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['mars-trail', 'mars-patrol'],
        reward: { ore: 20, parts: 4 },
    },
    {
        id: 'mars-factory',
        sector: 'mars',
        act: 2,
        title: 'Zatrzymaj produkcję',
        detail: '5 wskazuje stocznię polową. Zniszcz jej rdzeń, aby zatrzymać posiłki, i wróć z raportem. Wypuszczone jednostki pozostaną w walce.',
        required: false,
        kind: 'factory',
        site: 'factory',
        target: 1,
        dependencies: ['mars-trail', 'mars-patrol'],
        reward: { ore: 28, parts: 8 },
    },
    {
        id: 'mars-reserve',
        sector: 'mars',
        act: 2,
        title: 'Zapasy ekspedycji',
        required: false,
        detail: 'Przekaż 20 rudy na zaplecze pościgu. Zadanie dodatkowe nie blokuje rozpoznania pasa.',
        kind: 'ore',
        target: 20,
        dependencies: [],
        reward: { ore: 10, parts: 4 },
    },
    {
        id: 'earth-debrief',
        sector: 'earth',
        act: 2,
        title: 'Nowy kierunek',
        required: true,
        detail: 'Raport z pasa wymaga odprawy przy Ziemi. Przeczytaj plan wyprawy i zatwierdź trasę do Wenus w Satuk 15.',
        kind: 'briefing',
        target: 1,
        dependencies: ['mars-belt'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'venus-survey',
        sector: 'venus',
        act: 3,
        title: 'Rozpoznanie orbity',
        required: true,
        detail: '7 wskazuje przekaźnik przy Wenus. Zbierz odczyt przez E i wróć do Satuk 15.',
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
        detail: 'Po zwiadzie: 8 wskazuje punkt pomiarowy. Zbierz odczyt przez E i wróć, aby zatwierdzić miejsce pod przyszłą placówkę.',
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['venus-survey'],
        reward: { ore: 16, parts: 4 },
    },
    {
        id: 'venus-stockpile',
        sector: 'venus',
        act: 3,
        title: 'Materiały na placówkę',
        required: true,
        detail: 'Po zwiadzie przekaż 32 rudy z magazynu na przyszłą placówkę. Możesz dzielić dostawy na kilka wypraw.',
        kind: 'ore',
        target: 32,
        dependencies: ['venus-survey'],
        reward: { ore: 0, parts: 6 },
    },
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
        detail: 'Po pomiarach i zgromadzeniu rudy: 8 wskazuje plac budowy. Przytrzymaj E przez 2 s przy nieruchomym statku. Materiały są już opłacone.',
        kind: 'construction',
        target: 1,
        dependencies: ['venus-site', 'venus-stockpile'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'venus-shield',
        sector: 'venus',
        act: 3,
        title: 'Osłona słoneczna',
        required: true,
        detail: 'Po budowie przekaż 12 komponentów w stacji na przygotowanie osłony Satuk 15 do podróży bliżej Słońca. Możesz dzielić wpłaty.',
        kind: 'parts',
        target: 12,
        dependencies: ['venus-build'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'venus-defense',
        sector: 'venus',
        act: 3,
        title: 'Obrona przygotowań',
        required: true,
        detail: 'Po budowie: G przez 2 s przy placówce rozpoczyna atak AI. Odeprzyj trzy kontakty i wróć z raportem. Osłonę możesz przygotować równolegle.',
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
        detail: '7 wskazuje punkt pomiarowy w cieniu dużej skały. Zbierz odczyt przez E i wróć. Podczas rozbłysków chłodź statek za asteroidami.',
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
        detail: 'Po zwiadzie odeprzyj dwa kontakty AI, w tym Lancera. F wskazuje przeciwnika. Raporty wymagają powrotu; można podzielić walki na wyprawy.',
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
        detail: 'Po zabezpieczeniu sektora: 8 wskazuje węzeł danych. Zbierz pakiet przez E i wróć. Dopiero bezpieczny powrót zabezpiecza technologię pasa.',
        kind: 'scan',
        site: 'archive',
        target: 1,
        dependencies: ['mercury-survey', 'mercury-patrol'],
        reward: { ore: 35, parts: 10 },
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
    {
        id: 'mars-base-ore',
        sector: 'mars',
        act: 5,
        title: 'Poszycie bazy marsjańskiej',
        required: true,
        detail: 'Po odzyskaniu technologii przekaż w stacji 40 rudy na bazę przy Marsie. Wpłaty mogą pochodzić z wielu wypraw.',
        kind: 'ore',
        target: 40,
        dependencies: ['mercury-technology'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-base-parts',
        sector: 'mars',
        act: 5,
        title: 'Wyposażenie bazy',
        required: true,
        detail: 'Przekaż 10 komponentów na instalacje bazy. Rudę i komponenty możesz gromadzić równolegle.',
        kind: 'parts',
        target: 10,
        dependencies: ['mercury-technology'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-base-build',
        sector: 'mars',
        act: 5,
        title: 'Montaż bazy marsjańskiej',
        required: true,
        detail: 'Po dostawach: 7 wskazuje bazę. Przytrzymaj E przez 2 s przy spokojnym statku. Materiały zostały już opłacone.',
        kind: 'construction',
        target: 1,
        dependencies: ['mars-base-ore', 'mars-base-parts'],
        reward: { ore: 0, parts: 0 },
    },
    {
        id: 'mars-base-defense',
        sector: 'mars',
        act: 5,
        title: 'Obrona bazy marsjańskiej',
        required: true,
        detail: 'Po montażu: G przez 2 s przy bazie rozpoczyna trzy kontakty AI. Obroń obiekt i wróć z raportem do Satuk 15.',
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
        detail: 'Po montażu neutralizuj trzy patrole w dalszym obszarze, w tym dwa Lancery. F wskazuje przeciwnika. Możesz wracać po każdym kontakcie.',
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
        detail: 'Dodatkowy zwiad: po montażu bazy 8 wskazuje dalszy punkt. Zbierz pomiary przez E i wróć. Nie blokuje przygotowania przejścia pasa.',
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
        detail: '7 wskazuje wejście. Zatrzymaj statek, zbierz pomiary przez E i wróć do Satuk 15, aby otworzyć dalszą trasę.',
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
            detail: `${point.key} wskazuje skałę blokującą trasę. Usuń ją laserem lub uzbrojeniem i wróć z raportem. Przeszkody można usuwać w dowolnej kolejności.`,
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
        detail: 'Po zatwierdzeniu usunięcia trzech przeszkód: 8 wskazuje zewnętrzną granicę pasa. Dotrzyj tam, zbierz odczyt przez E i wróć do Satuk 15.',
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
        detail: 'Po zwiadzie: F wskazuje dwa kontakty w pasie. Możesz raportować każdy osobno. Ich neutralizacja nie blokuje przejścia.',
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
        detail: '7 wskazuje przekaźnik pomiarowy. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć dalszy obszar.',
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
        detail: 'Po zwiadzie neutralizuj patrol i Lancera. F wskazuje przeciwnika. Możesz wracać z raportem po każdym kontakcie.',
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
        detail: '0 wskazuje terminal chronionego węzła. Przytrzymaj E przez 4 s bez alarmu. G za 1 komponent wyłącza skaner na 20 s. Wróć z danymi.',
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
        detail: 'Po raportach z walk i węzła: 8 wskazuje dalszy punkt obserwacyjny. Zbierz pakiet przez E i wróć do Satuk 15.',
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
        detail: '7 wskazuje przekaźnik na podejściu do pierścieni. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć dalszy obszar.',
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
        detail: 'Po zwiadzie przywieź 36 rudy z wypraw w pierścienie. 2 wskazuje bliskie złoże. Możesz dzielić transporty; ruda trafia do zwykłego magazynu.',
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
        detail: 'Po zwiadzie F wskazuje odległy patrol. Odeprzyj go i wróć z raportem. Walkę i zaopatrzenie możesz wykonać w dowolnej kolejności.',
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
        detail: 'Po zaopatrzeniu i raporcie z walki 8 wskazuje dalszy punkt. Zbierz dane przez E i wróć do Satuk 15.',
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
        detail: '7 wskazuje pomiary podejścia. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć obszar baz.',
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
        detail: 'Po zwiadzie 0 wskazuje terminal bazy. E pobiera dane bez alarmu; G za komponent wyłącza skaner na 20 s. Wróć z danymi.',
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
        detail: 'F wskazuje patrol i Lancera w rejonie baz. Możesz raportować kontakty osobno. Włamanie i walki wykonujesz równolegle.',
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
        detail: 'Po raportach z bazy i walki 8 wskazuje dalszy węzeł. Odczyt przez E i powrót otwierają sektor Neptuna.',
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
        detail: '7 wskazuje przekaźnik. Odczyt przez E i bezpieczny powrót otwierają rejon kolejnej bazy.',
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
        detail: '0 wskazuje chroniony terminal. Pobierz dane przez E bez alarmu i wróć. G za 1 komponent wyłącza skaner na 20 s.',
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
        detail: 'Po raporcie z bazy 3 wskazuje rejon starcia. G przez 2 s rozpoczyna dwufazową walkę. Zmuś ciężką jednostkę do odwrotu i wróć z raportem.',
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
        detail: 'Po bezpiecznym raporcie ze starcia 8 wskazuje dalszy punkt. Zbierz odczyt i wróć do Satuk 15.',
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
        detail: 'Dodatkowo F wskazuje dwa patrole. Możesz wracać z raportami pojedynczo. Nie blokują pierwszego starcia ani dalszej trasy.',
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
        detail: '7 wskazuje pomiary podejścia. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć dalszy obszar.',
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
        detail: '0 wskazuje chroniony terminal. Pobierz dane przez E i wróć. G za 1 komponent wyłącza skaner na 20 s. Cel równoległy do osłony.',
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
        detail: 'F wskazuje patrol i Lancera. Raporty możesz przywozić pojedynczo. Dane bazy i osłonę realizujesz w dowolnej kolejności.',
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
        detail: '3 wskazuje rejon starcia po obu raportach. G przez 2 s rozpoczyna walkę z trzema fazami. Unieszkodliw jednostkę i wróć bezpiecznie do Satuk 15.',
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
        detail: '8 wskazuje odległy punkt pomiarowy. Zbierz dane i wróć. Dodatkowy odczyt nie blokuje finałowego starcia.',
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
export const VENUS_EXPANSION_TASKS = ['venus-build', 'venus-shield', 'venus-defense'];
export const VENUS_OUTPOST = { x: 2700, y: -1100 } as const;
export const EARTH_BRIEFING =
    'Technologia potrzebna do pokonania pasa jest do zdobycia na Merkurym. Najpierw skieruj Satuk 15 do Wenus: rozpoznaj orbitę i przygotuj zaplecze przed wyprawą bliżej Słońca.';
export interface StoryProgress {
    version: 19;
    dialogues: string[];
    sector: StorySectorId;
    progress: Record<string, number>;
    claimed: string[];
    searchedWrecks: StorySectorId[];
}
export const newStoryProgress = (): StoryProgress => ({
    version: 19,
    dialogues: [],
    sector: 'earth',
    progress: Object.fromEntries(STORY_TASKS.map((task) => [task.id, 0])),
    claimed: [],
    searchedWrecks: [],
});
export function storyTaskAvailable(p: StoryProgress, task: StoryTask) {
    return (
        storySectorUnlocked(p, task.sector) &&
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
            return storySectorComplete(p, 'earth', 1);
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
          : p.sector === 'mars' || (p.sector === 'earth' && p.claimed.includes('mars-belt'))
            ? 'AKT II'
            : 'AKT I';
}
export function actTwoComplete(p: StoryProgress) {
    return storySectorComplete(p, 'mars') && p.claimed.includes('earth-debrief');
}
export function storyVisibleTasks(p: StoryProgress) {
    const tasks = STORY_TASKS.filter(
        (t) =>
            t.sector === p.sector &&
            (t.id !== 'earth-debrief' || p.claimed.includes('mars-belt')) &&
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
    return ['mars-base-ore', 'mars-base-parts'].every((id) => p.claimed.includes(id));
}
export function beltPassageReady(p: StoryProgress) {
    return beltTechnologyReady(p) && storySectorComplete(p, 'mars', 5);
}
export function beltRouteCleared(p: StoryProgress) {
    return BELT_BARRIERS.every((_, i) => p.claimed.includes(`belt-clear-${i}`));
}
export function venusPreparationComplete(p: StoryProgress) {
    return ['venus-site', 'venus-stockpile'].every((id) => p.claimed.includes(id));
}
export function solarShieldReady(p: StoryProgress) {
    return p.claimed.includes('venus-shield');
}
export function beltTechnologyReady(p: StoryProgress) {
    return p.claimed.includes('mercury-technology');
}
export function storyNextStep(p: StoryProgress) {
    if (p.sector === 'pluto') {
        if (storySectorComplete(p, 'pluto'))
            return 'Cele operacyjne kampanii ukończone. Raport finałowego starcia zabezpieczony. Możesz wrócić do wcześniejszych sektorów i zadań dodatkowych.';
        if (!p.claimed.includes('pluto-survey'))
            return '7 wskazuje zwiad Plutona. Wróć z odczytem, aby otworzyć bazę i kontakty na podejściu.';
        return plutoFinaleReady(p)
            ? '3 wskazuje finałowe starcie. Zatrzymaj się i przytrzymaj G przez 2 s. Pokonaj trzy fazy i wróć z raportem. 8 to opcjonalne pomiary.'
            : '0 wskazuje bazę, F kontakty. Dane i osłonę wykonujesz równolegle. Oba raporty otwierają rejon finałowego starcia. 8 wskazuje dodatkowe pomiary.';
    }

    if (p.sector === 'uranus') {
        if (storySectorComplete(p, 'uranus'))
            return 'Trasa do Neptuna otwarta. Wybierz kolejny sektor; Uran i wcześniejsze rejony pozostają dostępne.';
        if (!p.claimed.includes('uranus-survey'))
            return '7 wskazuje pomiary. Wróć z odczytem, aby otworzyć rejon chronionej bazy i patroli.';
        return outerRouteOpen(p, 'uranus')
            ? 'Raporty z bazy i walk zabezpieczone. 8 wskazuje trasę do Neptuna. Odczytaj węzeł i wróć.'
            : '0 wskazuje bazę, F kontakty. Pobierz dane i zabezpiecz obszar w dowolnej kolejności. Wyniki zatwierdzasz po powrocie.';
    }
    if (p.sector === 'neptune') {
        if (storySectorComplete(p, 'neptune'))
            return 'Cele operacyjne aktu IX ukończone. Starcie i zewnętrzna trasa rozliczone. Wybierz sektor Plutona, aby rozpocząć akt X.';
        if (!p.claimed.includes('neptune-survey'))
            return '7 wskazuje zwiad podejścia. Zbierz dane i wróć, aby otworzyć obszar bazy.';
        if (!p.claimed.includes('neptune-base'))
            return '0 wskazuje terminal bazy. Pobierz dane bez alarmu i wróć do Satuk 15.';
        return p.claimed.includes('neptune-boss')
            ? 'Starcie odparte. 8 wskazuje zewnętrzną trasę. Zbierz odczyt i wróć.'
            : '3 wskazuje rejon starcia. Zatrzymaj się i przytrzymaj G przez 2 s. Zmuś jednostkę do odwrotu. Opuszczenie rejonu przerywa próbę; raport wymaga powrotu.';
    }
    if (p.sector === 'saturn') {
        if (storySectorComplete(p, 'saturn'))
            return 'Cele operacyjne Saturna ukończone. Zaopatrzenie i trasa zabezpieczone. Wybierz sektor Urana, aby rozpoznać dalszy obszar.';
        if (!p.claimed.includes('saturn-survey'))
            return '7 wskazuje pomiary pierścieni. Zbierz odczyt i wróć, aby otworzyć dalszy rejon. 2 wskazuje bliskie złoże.';
        if (saturnRouteOpen(p))
            return 'Zaopatrzenie i rejon zabezpieczone. 8 wskazuje dalszy punkt. Odczytaj trasę przez E i wróć do Satuk 15.';
        return 'Przywoź rudę z wypraw: cel 36, transporty można dzielić. 2 wskazuje złoże, 5 kryształy, F odległy patrol. Zaopatrzenie i walkę wykonujesz równolegle.';
    }
    if (p.sector === 'jupiter') {
        if (storySectorComplete(p, 'jupiter'))
            return 'Pakiet obserwacyjny zabezpieczony w Satuk 15. Cele operacyjne Jowisza ukończone. Możesz wybrać sektor Saturna.';
        if (!p.claimed.includes('jupiter-survey'))
            return '7 wskazuje pomiary podejścia. Zbierz odczyt przez E i wróć; raport otworzy rejon patroli oraz chroniony węzeł.';
        if (jupiterObservationsOpen(p))
            return 'Raporty z walk i węzła zabezpieczone. 8 wskazuje dalszy punkt. Zbierz pakiet obserwacyjny przez E i wróć do Satuk 15.';
        return 'F wskazuje patrole, 0 terminal węzła. Możesz wykonać te cele w dowolnej kolejności. Wróć z raportami, aby otworzyć punkt obserwacyjny.';
    }
    if (storySectorComplete(p, 'belt'))
        return 'Akt VI ukończony. Przejście pasa potwierdzone. Wybierz sektor Jowisz, aby rozpoznać dalszy obszar.';
    if (p.sector === 'belt') {
        if (!p.claimed.includes('belt-survey'))
            return '7 wskazuje wejście w pas. Zbierz pomiary i wróć; raport otworzy dalszą trasę. Technologia z Merkurego umożliwia tę wyprawę.';
        return beltRouteCleared(p)
            ? 'Trasa oczyszczona. 8 wskazuje zewnętrzną granicę pasa. Dotrzyj do węzła, zbierz odczyt przez E i wróć z raportem.'
            : '3 / 4 / 5 wskazują skały do usunięcia. Użyj lasera lub uzbrojenia i wróć z raportem; kolejność i liczba wypraw są dowolne. Uważaj na ruchome odłamki.';
    }
    if (beltPassageReady(p))
        return 'Akt V ukończony. Baza i korytarz zabezpieczone. Wybierz sektor Pas, aby rozpocząć przejście pasa asteroid.';
    if (p.sector === 'mars' && beltTechnologyReady(p)) {
        if (!p.claimed.includes('mars-base-build'))
            return marsBaseReady(p)
                ? 'Materiały gotowe. Wyrusz do bazy wskazywanej przez 7 i przytrzymaj E przez 2 s, aby ją zamontować.'
                : 'Przekaż 40 rudy i 10 komponentów na bazę. Projekty możesz realizować równolegle; wcześniejsze cele Marsa pozostają zapisane.';
        if (p.claimed.includes('mars-base-defense'))
            return 'Baza obroniona. Zabezpiecz dalszy korytarz: F wskazuje kontakty. Wyniki walk zatwierdzasz po bezpiecznym powrocie.';
        if (p.claimed.includes('mars-corridor'))
            return 'Korytarz zabezpieczony. Obroń bazę: 7 wskazuje obiekt, G przez 2 s rozpoczyna atak. Wróć z raportem.';
        return 'Obroń bazę przez G przy obiekcie i zabezpiecz dalszy korytarz. Te cele możesz wykonywać równolegle; raporty wymagają powrotu.';
    }
    if (beltTechnologyReady(p))
        return 'Akt IV ukończony. Technologia przejścia pasa zabezpieczona. Następny etap: powrót na Marsa i przygotowanie dalszej ekspedycji.';
    if (p.sector === 'mercury')
        return p.claimed.includes('mercury-patrol')
            ? '8 wskazuje pakiet technologii. Zbierz dane i wróć do Satuk 15. Utrata statku przed powrotem oznacza utratę pakietu.'
            : p.claimed.includes('mercury-survey')
              ? 'Zabezpiecz podejście i wróć z raportami. W cieniu dużych asteroid statek chłodzi się; nie niszcz osłon bez potrzeby.'
              : '7 wskazuje pomiary podejścia. 3 i 4 wskazują schronienia; 5 pojawi się po zwiadzie. Chłodź statek w zaznaczonym cieniu dużych skał.';
    if (p.sector === 'venus') {
        if (storySectorComplete(p, 'venus'))
            return 'Akt III ukończony. Placówka obroniona, osłona słoneczna gotowa. Następny kierunek: Merkury.';
        if (p.claimed.includes('venus-build'))
            return p.claimed.includes('venus-defense')
                ? 'Placówka obroniona. Przekaż brakujące komponenty na osłonę słoneczną w stacji, aby zakończyć przygotowania.'
                : solarShieldReady(p)
                  ? 'Osłona gotowa. Obroń placówkę: 8 wskazuje obiekt, G przez 2 s rozpoczyna atak. Wróć z raportem do Satuk 15.'
                  : 'Przekaż komponenty na osłonę w stacji i obroń placówkę: 8 wskazuje obiekt, G przez 2 s rozpoczyna atak. Wróć z raportem.';
        if (venusPreparationComplete(p))
            return 'Miejsce i materiały przygotowane. Wyrusz do placówki wskazywanej przez 8 i przytrzymaj E przez 2 s, aby ją zbudować.';
        return p.claimed.includes('venus-survey')
            ? 'Wykonaj pomiary miejsca pod placówkę i przekaż materiały. Te cele możesz realizować równolegle.'
            : 'Rozpoznaj orbitę Wenus i wróć z odczytem. Zwiad otworzy dalszy obszar oraz przygotowania placówki.';
    }
    if (actTwoComplete(p))
        return 'Akt II ukończony. Trasa do Wenus otwarta. Przygotuj zaplecze przed wyprawą na Merkurego; wcześniejsze sektory pozostają dostępne.';
    if (p.claimed.includes('mars-belt'))
        return p.sector === 'earth'
            ? 'Raport z pasa dostarczony. Odbierz odprawę Nowy kierunek i zatwierdź plan podróży do Wenus.'
            : 'Pas asteroid blokuje pościg. Wróć do sektora Ziemi i odbierz odprawę Nowy kierunek w Satuk 15.';
    if (actOneComplete(p))
        return p.sector === 'mars'
            ? 'Odczyt przekaźnika i osłona podejścia otworzą dalszy obszar. Raporty zatwierdzasz po powrocie.'
            : 'Akt I ukończony. Stacja paliw działa. Podejmij pościg w sektorze Marsa; wcześniejsze sektory pozostają dostępne.';
    return '';
}
export function marsApproachOpen(p: StoryProgress) {
    return ['mars-trail', 'mars-patrol'].every((id) => p.claimed.includes(id));
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
    if (p.sector === 'mars' && marsApproachOpen(p)) return 4600;
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
        p.version !== 19 ||
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
}
function settle(c: Campaign): StoryChange {
    const p = c.story!;
    const result: StoryChange = { titles: [], reward: { ore: 0, parts: 0 }, overflow: 0 };
    for (const task of STORY_TASKS) {
        if (!storyTaskAvailable(p, task) || p.claimed.includes(task.id)) continue;
        if (task.kind === 'workshop' && c.station.workshop >= 1) p.progress[task.id] = 1;
        if (p.progress[task.id] < task.target) continue;
        p.claimed.push(task.id);
        result.titles.push(task.title);
        result.reward.ore += task.reward.ore;
        result.reward.parts += task.reward.parts;
    }
    const free = Math.max(0, storageCapacity(c) - storageUsed(c));
    const parts = Math.min(free, result.reward.parts),
        ore = Math.min(free - parts, result.reward.ore);
    c.bank.parts += parts;
    c.bank.ore += ore;
    result.overflow = result.reward.ore + result.reward.parts - ore - parts;
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
        c.activeRun?.sector !== 'lunar' ||
        c.activeRun.area !== 'surface' ||
        p.sector !== 'lunar' ||
        !storyTaskAvailable(p, task) ||
        p.claimed.includes(task.id)
    )
        return null;
    p.progress[task.id] = 1;
    return settle(c);
}
export function lunarBuildStage(p: StoryProgress) {
    return p.claimed.includes('lunar-commission')
        ? 3
        : p.claimed.includes('lunar-installations')
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
        p.sector !== 'earth' ||
        p.claimed.includes(task.id) ||
        !storyTaskAvailable(p, task)
    )
        return null;
    p.progress[task.id] = 1;
    return settle(c);
}
export function deliverLunarCargo(c: Campaign, cargo: Cargo, playerDelivery = true) {
    const p = c.story;
    if (
        !p ||
        p.sector !== 'lunar' ||
        c.activeRun?.sector !== 'lunar' ||
        c.activeRun.area !== 'surface'
    )
        return null;
    const task = STORY_TASKS.find(
        (t) => t.kind === 'delivery' && !p.claimed.includes(t.id) && storyTaskAvailable(p, t),
    );
    if (!task?.resource) return null;
    const amount = Math.min(cargo[task.resource], task.target - p.progress[task.id]);
    if (amount <= 0) return null;
    cargo[task.resource] -= amount;
    // Loaded supplies are delivered first; newly mined cargo still earns normal XP on return.
    const freight = playerDelivery ? c.activeRun.freight : undefined;
    if (freight) freight[task.resource] = Math.max(0, freight[task.resource] - amount);
    p.progress[task.id] += amount;
    const change = settle(c);
    return { amount, resource: task.resource, change };
}
export function constructionManifest(c: Campaign): Cargo {
    const cargo = { ore: 0, parts: 0 };
    const p = c.story;
    if (!p || p.sector !== 'lunar' || !c.ship || c.activeRun) return cargo;
    const task = STORY_TASKS.find(
        (t) => t.kind === 'delivery' && !p.claimed.includes(t.id) && storyTaskAvailable(p, t),
    );
    if (task?.resource)
        cargo[task.resource] = Math.min(
            capacity(c),
            c.bank[task.resource],
            task.target - p.progress[task.id],
        );
    return cargo;
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
    if (!c.story || c.story.sector !== sector || c.activeRun?.sector !== sector) return null;
    if (sector === 'pluto' && finalBossWon) {
        const task = STORY_TASKS.find((t) => t.id === 'pluto-boss')!;
        if (storyTaskAvailable(c.story, task)) c.story.progress[task.id] = 1;
    }
    if (sector === 'neptune' && firstBossWon) {
        const task = STORY_TASKS.find((t) => t.id === 'neptune-boss')!;
        if (storyTaskAvailable(c.story, task)) c.story.progress[task.id] = 1;
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
    if (sector === 'lunar' && assaultWon && storyTaskAvailable(c.story, final))
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
            task.sector === sector &&
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
) {
    const p = c.story!;
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
        .map((task) => ({
            id: task.id,
            title: `${c.activeRun?.mission?.task === task.id ? '▶ ' : ''}${task.title}`,
            progress: p.claimed.includes(task.id)
                ? ''
                : !storyTaskAvailable(p, task)
                  ? '· później'
                  : task.kind === 'boss' && (task.sector === 'pluto' ? finalBossWon : firstBossWon)
                    ? '· wróć z raportem'
                    : task.kind === 'gather'
                      ? `${Math.min(task.target, p.progress[task.id] + Math.max(0, Math.floor(returnedOre)))}/${task.target}${returnedOre > 0 ? ' · wróć z ładunkiem' : ''}`
                      : task.kind === 'clearance' &&
                          clearedBeltRocks.some((i) => task.id === `belt-clear-${i}`)
                        ? '· wróć z raportem'
                        : task.kind === 'assault' &&
                            (task.sector === 'mars'
                                ? marsDefenseWon
                                : task.sector === 'venus'
                                  ? venusDefenseWon
                                  : assaultWon)
                          ? '· wróć z raportem'
                          : task.kind === 'patrol'
                            ? `${Math.min(task.target, p.progress[task.id] + patrolKills)}/${task.target}${patrolKills ? ' · wróć z raportem' : ''}`
                            : task.kind === 'ore' ||
                                task.kind === 'parts' ||
                                task.kind === 'delivery'
                              ? `${p.progress[task.id]}/${task.target}`
                              : task.site && data.includes(task.site)
                                ? '· wróć z danymi'
                                : '',
            complete: p.claimed.includes(task.id),
        }));
}
