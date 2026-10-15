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
} as const;
export type StorySectorId = keyof typeof STORY_SECTORS;
export interface StoryTask {
    id: string;
    sector: StorySectorId;
    act: 1 | 2 | 3;
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
];
export const VENUS_EXPANSION_TASKS = ['venus-build', 'venus-shield', 'venus-defense'];
export const VENUS_OUTPOST = { x: 2700, y: -1100 } as const;
export const EARTH_BRIEFING =
    'Technologia potrzebna do pokonania pasa jest do zdobycia na Merkurym. Najpierw skieruj Satuk 15 do Wenus: rozpoznaj orbitę i przygotuj zaplecze przed wyprawą bliżej Słońca.';
export interface StoryProgress {
    version: 7;
    sector: StorySectorId;
    progress: Record<string, number>;
    claimed: string[];
    searchedWrecks: StorySectorId[];
}
export const newStoryProgress = (): StoryProgress => ({
    version: 7,
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
    }
}
export function storyAct(p: StoryProgress) {
    return p.sector === 'venus'
        ? 'AKT III'
        : p.sector === 'mars' || (p.sector === 'earth' && p.claimed.includes('mars-belt'))
          ? 'AKT II'
          : 'AKT I';
}
export function actTwoComplete(p: StoryProgress) {
    return storySectorComplete(p, 'mars') && p.claimed.includes('earth-debrief');
}
export function storyVisibleTasks(p: StoryProgress) {
    return STORY_TASKS.filter(
        (t) =>
            t.sector === p.sector && (t.id !== 'earth-debrief' || p.claimed.includes('mars-belt')),
    );
}
export function venusPreparationComplete(p: StoryProgress) {
    return ['venus-site', 'venus-stockpile'].every((id) => p.claimed.includes(id));
}
export function solarShieldReady(p: StoryProgress) {
    return p.claimed.includes('venus-shield');
}
export function storyNextStep(p: StoryProgress) {
    if (p.sector === 'venus') {
        if (storySectorComplete(p, 'venus'))
            return 'Akt III ukończony. Placówka obroniona, osłona słoneczna gotowa. Następny kierunek: Merkury.';
        if (p.claimed.includes('venus-build'))
            return 'Przekaż komponenty na osłonę w stacji i obroń placówkę: 8 wskazuje obiekt, G przez 2 s rozpoczyna atak. Wróć z raportem.';
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
        p.version !== 7 ||
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
                STORY_TASKS.filter((t) => t.sector === 'mars').map((t) => [t.id, 0]),
            ),
        },
    };
}
export function migrateStoryV5(value: unknown) {
    if (!value || typeof value !== 'object') return value;
    const p = value as StoryProgress;
    if ((p.version as number) !== 5 || !p.progress || typeof p.progress !== 'object') return value;
    const previous = STORY_TASKS.filter((t) => t.act === 1 || t.sector === 'mars');
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
    const previous = STORY_TASKS.filter((t) => !VENUS_EXPANSION_TASKS.includes(t.id));
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
) {
    if (!c.story || c.story.sector !== sector || c.activeRun?.sector !== sector) return null;
    if (sector === 'venus' && venusDefenseWon) {
        const task = STORY_TASKS.find((t) => t.id === 'venus-defense')!;
        if (storyTaskAvailable(c.story, task)) c.story.progress[task.id] = 1;
    }
    const final = STORY_TASKS.find((t) => t.id === 'lunar-attack')!;
    if (sector === 'lunar' && assaultWon && storyTaskAvailable(c.story, final))
        c.story.progress[final.id] = 1;
    if (sector === 'mars' && Number.isInteger(patrolKills) && patrolKills > 0) {
        const patrol = STORY_TASKS.find((t) => t.id === 'mars-patrol')!;
        if (storyTaskAvailable(c.story, patrol))
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
) {
    const p = c.story!;
    return storyVisibleTasks(p).map((task) => ({
        id: task.id,
        title: task.title,
        progress: p.claimed.includes(task.id)
            ? ''
            : !storyTaskAvailable(p, task)
              ? '· później'
              : task.kind === 'assault' && (task.sector === 'venus' ? venusDefenseWon : assaultWon)
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
