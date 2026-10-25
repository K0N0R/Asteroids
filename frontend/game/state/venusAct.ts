import type { StoryTask, StoryProgress } from './story';
import type { ResourceStore } from './resources';

export const VENUS_PROBE_COST: ResourceStore = {
    lightPlating: 2,
    electronics: 2,
    storageFrames: 1,
    powerModules: 1,
};
export const VENUS_TASK_IDS = [
    'venus-toxic-orbit',
    'venus-dead-laboratory',
    'venus-atmospheric-probe',
    'venus-horizon-project',
    'venus-guardian',
    'venus-mercury-signal',
] as const;
export const VENUS_TASKS: StoryTask[] = VENUS_TASK_IDS.map((id, i) => ({
    id,
    sector: 'venus',
    act: 3,
    required: true,
    kind: 'event',
    target: 1,
    title: [
        'Toksyczna orbita',
        'Martwe laboratorium',
        'W głąb atmosfery',
        'Projekt Horyzont',
        'Przebudzenie strażnika',
        'Sygnał z Merkurego',
    ][i],
    detail: [
        'Rozpoznaj przekaźnik na wschodzie orbity. Połącz się przez F. Lądowanie na powierzchni nie jest możliwe.',
        'Wejdź przez śluzę stacji badawczej, przywróć zasilanie terminala i odzyskaj archiwum. Dostarcz dane do Satuk 15.',
        'Zmontuj sondę w Warsztacie I. Rozpocznij eskortę przez F przy sondzie i osłaniaj jej lot oraz transmisję z górnej atmosfery.',
        'Wróć do Satuk 15. Przeanalizuj odebrane dane w Laboratorium.',
        'Zbadaj odkrytą instalację SI. Odzyskaj pełną specyfikację projektu z jej terminala.',
        'Pobierz pakiet z terminala instalacji i dostarcz go do Satuk 15. Analiza pozwoli ustalić źródło materiału rdzenia.',
    ][i],
    dependencies: i ? [VENUS_TASK_IDS[i - 1]] : [],
    reward: { ore: [10, 16, 18, 0, 24, 12][i], parts: 0 },
    rewardXp: [2, 3, 4, 2, 5, 2][i],
}));
export interface VenusProgress {
    powerRestored: boolean;
    probeBuilt: boolean;
    transmission: number;
    guardianDefeated: boolean;
    announcements: string[];
}
export const newVenusProgress = (): VenusProgress => ({
    powerRestored: false,
    probeBuilt: false,
    transmission: 0,
    guardianDefeated: false,
    announcements: [],
});
export function venusProgress(p: StoryProgress) {
    return (p.venus ??= newVenusProgress());
}
export function validVenusProgress(p: unknown): p is VenusProgress {
    if (!p || typeof p !== 'object') return false;
    const v = p as VenusProgress;
    return (
        ['powerRestored', 'probeBuilt', 'guardianDefeated'].every(
            (k) => typeof v[k as keyof VenusProgress] === 'boolean',
        ) &&
        Number.isInteger(v.transmission) &&
        v.transmission >= 0 &&
        v.transmission <= 3 &&
        Array.isArray(v.announcements) &&
        v.announcements.length <= 20 &&
        new Set(v.announcements).size === v.announcements.length &&
        v.announcements.every((s) =>
            [
                'intro',
                'relay',
                'archive',
                'transmission',
                'horizon',
                'guardian',
                'victory',
                'finale',
            ].includes(s),
        )
    );
}
export function venusObjective(p: StoryProgress) {
    const has = (id: string) => p.claimed.includes(id),
        v = p.venus;
    if (has('venus-mercury-signal'))
        return 'Akt III ukończony. Dane wskazują instalację przemysłową SI na Merkurym. Otwórz Układ słoneczny i wyznacz kurs.';
    if (has('venus-guardian'))
        return 'Odzyskaj końcowy pakiet z terminala instalacji SI i dostarcz go do Satuk 15.';
    if (has('venus-horizon-project'))
        return 'Zbadaj instalację SI za śluzą na północnym wschodzie orbity.';
    if (has('venus-atmospheric-probe'))
        return 'Pełna transmisja odebrana. Wróć i przeanalizuj dane w Laboratorium Satuk 15.';
    if (has('venus-dead-laboratory'))
        return v?.probeBuilt
            ? `Osłaniaj sondę atmosferyczną. Odebrane fragmenty transmisji: ${v.transmission}/3.`
            : 'Warsztat I: zmontuj sondę atmosferyczną, potem rozpocznij eskortę przy Satuk 15.';
    if (has('venus-toxic-orbit'))
        return 'Zbadaj martwe laboratorium przez śluzę na północnym zachodzie. Odzyskaj i dostarcz archiwum.';
    return 'Rozpoznaj przekaźnik na wschodzie orbity Wenus. Powierzchnia pozostaje niedostępna.';
}
