export const GAME = {
    step: 1 / 60,
    pixelsPerMeter: 100,
    sectorRadius: 5400,
    dockRadius: 190,
    dockSpeed: 65,
    cargo: 40,
    hull: 100,
    thrust: 1000,
    brake: 1800,
    turnSpeed: 18,
    turnResponse: 24,
    releaseDrag: 4.8,
    stopSpeed: 3,
    maxSpeed: 480,
    shotSpeed: 1150,
    shotInterval: 0.2,
    shotDamage: 18,
    repairSeconds: 5,
    repairHull: 25,
    repairSpeed: 80,
    faultDamage: 20,
    damagedThrust: 0.45,
} as const;

export const FLEET_LIMIT = 3;
export const DRONES = {
    hull: 54,
    radius: 26,
    patrolSpeed: 100,
    chaseSpeed: 250,
    acceleration: 400,
    turnSpeed: 5,
    detectRange: 800,
    loseRange: 1150,
    leash: 1100,
    safeRadius: 850,
    fireRange: 650,
    preferredRange: 340,
    windup: 0.65,
    shotInterval: 1.3,
    shotSpeed: 650,
    shotLife: 1.6,
    shotDamage: 12,
} as const;
export const RECOVERY = { signalLimit: 3, radius: 160, speed: 80, seconds: 4 } as const;
export const SCAN = { radius: 180, speed: 60, seconds: 3 } as const;
export const SCAN_SITES = {
    relay: { name: 'Przekaźnik Lumen', key: 7 },
    archive: { name: 'Obserwatorium Mnemos', key: 8 },
} as const;
export type ScanSiteId = keyof typeof SCAN_SITES;
export const HULLS = {
    prospector: {
        name: 'Prospector I',
        role: 'Uniwersalny',
        detail: 'Sprawdzony punkt odniesienia dla sterowania.',
        health: GAME.hull,
        cargo: GAME.cargo,
        thrust: GAME.thrust,
        brake: GAME.brake,
        turnSpeed: GAME.turnSpeed,
        maxSpeed: GAME.maxSpeed,
        size: 1,
        miningPower: 1,
        ore: 15,
        parts: 0,
        workshop: 0,
        recovery: 0.1,
    },
    swift: {
        name: 'Swift',
        role: 'Zwiadowca',
        detail: 'Szybszy i zwinniejszy; mniejszy zapas kadłuba.',
        health: 85,
        cargo: 35,
        thrust: 1500,
        brake: 2200,
        turnSpeed: 22,
        maxSpeed: 620,
        size: 0.9,
        miningPower: 1,
        ore: 65,
        parts: 4,
        workshop: 1,
        recovery: 0.18,
    },
    mule: {
        name: 'Mule',
        role: 'Statek wydobywczy',
        detail: 'Duży ładunek, mocniejszy kadłub i działko; wolniejszy lot.',
        health: 150,
        cargo: 80,
        thrust: 850,
        brake: 1600,
        turnSpeed: 14,
        maxSpeed: 400,
        size: 1.25,
        miningPower: 1.3,
        ore: 85,
        parts: 6,
        workshop: 1,
        recovery: 0.22,
    },
} as const;
export type HullId = keyof typeof HULLS;

export const CREW = { hireOre: 12, queueLimit: 3, kitLimit: 10, embarkKits: 2 } as const;
export const PILOT_PROGRESSION = {
    thresholds: [0, 20, 50, 90, 140],
    skillLimit: 2,
    maxXpPerRun: 50,
} as const;
export const PILOT_SKILLS = {
    handling: { title: 'Manewrowanie', detail: 'Obrót i hamowanie +3% / poziom', bonus: 0.03 },
    mining: { title: 'Wydobycie', detail: 'Obrażenia działka skałom +5% / poziom', bonus: 0.05 },
    survival: {
        title: 'Procedury ewakuacji',
        detail: 'Szansa kapsuły +6 p.p. / poziom',
        bonus: 0.06,
    },
} as const;
export type PilotSkillId = keyof typeof PILOT_SKILLS;
export const JOBS = {
    refine: { title: 'Rafinacja rudy', ore: 8, parts: 0, seconds: 45, output: 'parts' },
    kit: { title: 'Zestaw naprawczy', ore: 6, parts: 1, seconds: 30, output: 'kit' },
} as const;
export type JobKind = keyof typeof JOBS;

export const PILOTS = [
    {
        name: 'Mira Voss',
        role: 'Nawigatorka',
        trait: 'Obrót +8%',
        turn: 1.08,
        brake: 1,
        escape: 0.12,
    },
    {
        name: 'Ivo Kern',
        role: 'Pilot transportowy',
        trait: 'Hamowanie +8%',
        turn: 1,
        brake: 1.08,
        escape: 0.08,
    },
    {
        name: 'Nela Rook',
        role: 'Pilotka zwiadowcza',
        trait: 'Obrót +5%',
        turn: 1.05,
        brake: 1,
        escape: 0.2,
    },
    {
        name: 'Kadet Sol',
        role: 'Program ratunkowy',
        trait: 'Standardowe sterowanie',
        turn: 1,
        brake: 1,
        escape: 0,
    },
] as const;

export type Upgrade = 'engine' | 'cargo' | 'drill' | 'armor' | 'workshop' | 'storage';
export const UPGRADES: Record<
    Upgrade,
    { title: string; detail: string; ore: number; parts: number }
> = {
    engine: { title: 'Silnik impulsowy', detail: 'Ciąg +15% / poziom', ore: 18, parts: 1 },
    cargo: { title: 'Moduł ładowni', detail: 'Pojemność +15 / poziom', ore: 14, parts: 0 },
    drill: {
        title: 'Działo wydobywcze',
        detail: 'Obrażenia skał +25% / poziom',
        ore: 20,
        parts: 2,
    },
    armor: { title: 'Wzmocnienie kadłuba', detail: 'Kadłub +25 / poziom', ore: 16, parts: 1 },
    workshop: {
        title: 'Warsztat stacji',
        detail: 'Odblokowuje wyższy poziom modułów',
        ore: 30,
        parts: 3,
    },
    storage: { title: 'Magazyn stacji', detail: 'Pojemność +100 / poziom', ore: 25, parts: 1 },
};

export interface ContractDefinition {
    title: string;
    detail: string;
    ore: number;
    parts: number;
    rewardOre: number;
    rewardParts: number;
    sites: readonly ScanSiteId[];
    unlock: 'always' | 'return' | 'research';
}
export const CONTRACTS: readonly ContractDefinition[] = [
    {
        title: 'Pierwszy transport',
        detail: 'Przywieź 12 jednostek rudy w jednej wyprawie.',
        ore: 12,
        parts: 0,
        rewardOre: 10,
        rewardParts: 1,
        sites: [],
        unlock: 'always',
    },
    {
        title: 'Zaopatrzenie warsztatu',
        detail: 'Przywieź 20 rudy i 2 komponenty.',
        ore: 20,
        parts: 2,
        rewardOre: 18,
        rewardParts: 2,
        sites: [],
        unlock: 'always',
    },
    {
        title: 'Nasłuch sektora',
        detail: 'Zeskanuj przekaźnik Lumen (7) i dostarcz dane do Aurory.',
        ore: 0,
        parts: 0,
        rewardOre: 18,
        rewardParts: 3,
        sites: ['relay'],
        unlock: 'return',
    },
    {
        title: 'Ślad dawnych gwiazd',
        detail: 'Przywieź dane z przekaźnika Lumen (7) i obserwatorium Mnemos (8).',
        ore: 0,
        parts: 0,
        rewardOre: 30,
        rewardParts: 5,
        sites: ['relay', 'archive'],
        unlock: 'research',
    },
] as const;
