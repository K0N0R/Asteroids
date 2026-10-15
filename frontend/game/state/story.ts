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
} as const;
export type StorySectorId = keyof typeof STORY_SECTORS;
export interface StoryTask {
    id: string;
    sector: StorySectorId;
    act: 1 | 2 | 3 | 4 | 5;
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
        | 'construction';
    resource?: 'ore' | 'parts';
    target: number;
    site?: ScanSiteId;
    dependencies: readonly string[];
    reward: Cargo;
}
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
        detail: '7 wskazuje przekaźnik. Zatrzymaj statek, przytrzymaj E i wróć z odczytem do Satuk 15.',
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
        detail: '3 wskazuje podejście do Księżyca. Na powierzchni: 7 budowa, E przekazuje rudę z ładowni.',
        required: true,
        kind: 'delivery',
        resource: 'ore',
        target: 48,
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
];
export const MARS_BASE = { x: -2600, y: 1200 } as const;
export const VENUS_EXPANSION_TASKS = ['venus-build', 'venus-shield', 'venus-defense'];
export const VENUS_OUTPOST = { x: 2700, y: -1100 } as const;
export const EARTH_BRIEFING =
    'Technologia potrzebna do pokonania pasa jest do zdobycia na Merkurym. Najpierw skieruj Satuk 15 do Wenus: rozpoznaj orbitę i przygotuj zaplecze przed wyprawą bliżej Słońca.';
export interface StoryProgress {
    version: 9;
    sector: StorySectorId;
    progress: Record<string, number>;
    claimed: string[];
    searchedWrecks: StorySectorId[];
}
export const newStoryProgress = (): StoryProgress => ({
    version: 9,
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
        case 'mercury':
            return storySectorComplete(p, 'venus') && solarShieldReady(p);
    }
}
export function storyAct(p: StoryProgress) {
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
export function marsBaseReady(p: StoryProgress) {
    return ['mars-base-ore', 'mars-base-parts'].every((id) => p.claimed.includes(id));
}
export function beltPassageReady(p: StoryProgress) {
    return beltTechnologyReady(p) && storySectorComplete(p, 'mars', 5);
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
    if (beltPassageReady(p))
        return 'Akt V ukończony. Baza i korytarz zabezpieczone. Ekspedycja gotowa do kolejnego etapu: przejścia pasa asteroid.';
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
export function storyRadius(p: StoryProgress) {
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
        p.version !== 9 ||
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
    return storySectorUnlocked(p, p.sector);
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
export function migrateStoryV2(value: unknown) {
    if (!value || typeof value !== 'object') return value;
    const p = value as StoryProgress;
    if ((p.version as number) !== 2 || !p.progress || typeof p.progress !== 'object') return value;
    const previous = STORY_TASKS.filter(
        (t) => t.act === 1 && !['lunar-defense', 'lunar-attack'].includes(t.id),
    );
    if (
        Object.keys(p.progress).length !== previous.length ||
        previous.some((t) => !Object.hasOwn(p.progress, t.id))
    )
        return value;
    return { ...p, version: 3, progress: { ...p.progress, 'lunar-defense': 0 } };
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
export function migrateStoryV3(value: unknown) {
    if (!value || typeof value !== 'object') return value;
    const p = value as StoryProgress;
    if ((p.version as number) !== 3 || !p.progress || typeof p.progress !== 'object') return value;
    const previous = STORY_TASKS.filter((t) => t.act === 1 && t.id !== 'lunar-attack');
    if (
        Object.keys(p.progress).length !== previous.length ||
        previous.some((t) => !Object.hasOwn(p.progress, t.id))
    )
        return value;
    return { ...p, version: 4, progress: { ...p.progress, 'lunar-attack': 0 } };
}
export function migrateStoryV4(value: unknown) {
    if (!value || typeof value !== 'object') return value;
    const p = value as StoryProgress;
    if ((p.version as number) !== 4 || !p.progress || typeof p.progress !== 'object') return value;
    const previous = STORY_TASKS.filter((t) => t.act === 1);
    if (
        Object.keys(p.progress).length !== previous.length ||
        previous.some((t) => !Object.hasOwn(p.progress, t.id))
    )
        return value;
    return {
        ...p,
        version: 5,
        progress: {
            ...p.progress,
            ...Object.fromEntries(
                STORY_TASKS.filter((t) => t.sector === 'mars' && t.act === 2).map((t) => [t.id, 0]),
            ),
        },
    };
}
export function migrateStoryV5(value: unknown) {
    if (!value || typeof value !== 'object') return value;
    const p = value as StoryProgress;
    if ((p.version as number) !== 5 || !p.progress || typeof p.progress !== 'object') return value;
    const previous = STORY_TASKS.filter((t) => t.act === 1 || (t.sector === 'mars' && t.act === 2));
    if (
        Object.keys(p.progress).length !== previous.length ||
        previous.some((t) => !Object.hasOwn(p.progress, t.id))
    )
        return value;
    const added = STORY_TASKS.filter(
        (t) =>
            (t.id === 'earth-debrief' || t.sector === 'venus') &&
            !VENUS_EXPANSION_TASKS.includes(t.id),
    );
    return {
        ...p,
        version: 6,
        progress: { ...p.progress, ...Object.fromEntries(added.map((t) => [t.id, 0])) },
    };
}
export function migrateStoryV6(value: unknown) {
    if (!value || typeof value !== 'object') return value;
    const p = value as StoryProgress;
    if ((p.version as number) !== 6 || !p.progress || typeof p.progress !== 'object') return value;
    const previous = STORY_TASKS.filter((t) => t.act <= 3 && !VENUS_EXPANSION_TASKS.includes(t.id));
    if (
        Object.keys(p.progress).length !== previous.length ||
        previous.some((t) => !Object.hasOwn(p.progress, t.id))
    )
        return value;
    return {
        ...p,
        version: 7,
        progress: {
            ...p.progress,
            ...Object.fromEntries(VENUS_EXPANSION_TASKS.map((id) => [id, 0])),
        },
    };
}
export function migrateStoryV7(value: unknown) {
    if (!value || typeof value !== 'object') return value;
    const p = value as StoryProgress;
    if ((p.version as number) !== 7 || !p.progress || typeof p.progress !== 'object') return value;
    const previous = STORY_TASKS.filter((t) => t.act <= 3);
    if (
        Object.keys(p.progress).length !== previous.length ||
        previous.some((t) => !Object.hasOwn(p.progress, t.id))
    )
        return value;
    return {
        ...p,
        version: 8,
        progress: {
            ...p.progress,
            ...Object.fromEntries(
                STORY_TASKS.filter((t) => t.sector === 'mercury').map((t) => [t.id, 0]),
            ),
        },
    };
}
export function migrateStoryV8(value: unknown) {
    if (!value || typeof value !== 'object') return value;
    const p = value as StoryProgress;
    if ((p.version as number) !== 8 || !p.progress || typeof p.progress !== 'object') return value;
    const previous = STORY_TASKS.filter((t) => t.act <= 4);
    if (
        Object.keys(p.progress).length !== previous.length ||
        previous.some((t) => !Object.hasOwn(p.progress, t.id))
    )
        return value;
    return {
        ...p,
        version: 9,
        progress: {
            ...p.progress,
            ...Object.fromEntries(STORY_TASKS.filter((t) => t.act === 5).map((t) => [t.id, 0])),
        },
    };
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
export function deliverLunarCargo(c: Campaign, cargo: Cargo) {
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
    const freight = c.activeRun.freight;
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
export function migrateStoryV1(value: unknown) {
    if (!value || typeof value !== 'object') return value;
    const p = value as StoryProgress;
    if ((p.version as number) !== 1 || !p.progress || typeof p.progress !== 'object') return value;
    const added = ['lunar-foundation', 'lunar-installations', 'lunar-commission'];
    const previous = STORY_TASKS.filter(
        (t) =>
            t.act === 1 &&
            !['lunar-defense', 'lunar-attack'].includes(t.id) &&
            !added.includes(t.id),
    );
    if (
        Object.keys(p.progress).length !== previous.length ||
        previous.some((t) => !Object.hasOwn(p.progress, t.id))
    )
        return value;
    return {
        ...p,
        version: 2,
        progress: { ...p.progress, ...Object.fromEntries(added.map((id) => [id, 0])) },
    };
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
) {
    if (!c.story || c.story.sector !== sector || c.activeRun?.sector !== sector) return null;
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
        (sector === 'mars' || sector === 'mercury') &&
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
            task.kind === 'scan' &&
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
) {
    const p = c.story!;
    return storyVisibleTasks(p)
        .filter((t) => p.sector !== 'mars' || !beltTechnologyReady(p) || t.act === 5)
        .map((task) => ({
            id: task.id,
            title: task.title,
            progress: p.claimed.includes(task.id)
                ? ''
                : !storyTaskAvailable(p, task)
                  ? '· później'
                  : task.kind === 'assault' &&
                      (task.sector === 'mars'
                          ? marsDefenseWon
                          : task.sector === 'venus'
                            ? venusDefenseWon
                            : assaultWon)
                    ? '· wróć z raportem'
                    : task.kind === 'patrol'
                      ? `${Math.min(task.target, p.progress[task.id] + patrolKills)}/${task.target}${patrolKills ? ' · wróć z raportem' : ''}`
                      : task.kind === 'ore' || task.kind === 'parts' || task.kind === 'delivery'
                        ? `${p.progress[task.id]}/${task.target}`
                        : task.site && data.includes(task.site)
                          ? '· wróć z danymi'
                          : '',
            complete: p.claimed.includes(task.id),
        }));
}
