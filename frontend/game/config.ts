export const GAME = {
    step: 1 / 60,
    pixelsPerMeter: 100,
    sectorRadius: 8000,
    dockRadius: 190,
    dockSpeed: 65,
    cargo: 40,
    hull: 65,
    thrust: 650,
    brake: 720,
    turnSpeed: 1.15,
    turnResponse: 3,
    releaseDrag: 2.2,
    stopSpeed: 3,
    maxSpeed: 300,
    reverseSpeed: 0.35,
    boostSpeed: 1.65,
    boostThrust: 1.4,
    cameraResponse: 1.8,
    shotSpeed: 1150,
    shotInterval: 0.2,
    shotDamage: 18,
    shotRockDamage: 2,
    gunMountY: 23,
    gunLength: 36,
    laserRange: 230,
    laserDamage: 150,
    repairSeconds: 5,
    repairHull: 25,
    repairSpeed: 80,
    faultDamage: 20,
    damagedThrust: 0.45,
} as const;

export const FLEET_LIMIT = 6;
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
export const ENEMY_PROFILES = {
    patrol: { ...DRONES, name: 'Dron', oreLoot: 3, partsLoot: 2, density: 4, strafe: 0.35 },
    lancer: {
        ...DRONES,
        name: 'Lancer',
        hull: 90,
        radius: 32,
        patrolSpeed: 75,
        chaseSpeed: 165,
        acceleration: 260,
        turnSpeed: 3,
        detectRange: 950,
        loseRange: 1300,
        fireRange: 900,
        preferredRange: 400,
        windup: 1.2,
        shotInterval: 2.5,
        shotSpeed: 900,
        shotLife: 1.5,
        shotDamage: 18,
        oreLoot: 4,
        partsLoot: 4,
        density: 5,
        strafe: 0.12,
    },
} as const;
export type EnemyKind = keyof typeof ENEMY_PROFILES;
export const RECOVERY = { signalLimit: 3, radius: 160, speed: 80, seconds: 4 } as const;
export const SCAN = { radius: 180, speed: 60, seconds: 3 } as const;
export const OUTPOST = {
    radius: 100,
    terminalDistance: 260,
    interactRadius: 100,
    interactSpeed: 60,
    downloadSeconds: 4,
    equipmentSeconds: 5,
    equipmentSlots: 3,
    sabotageSeconds: 3,
    disabledSeconds: 20,
    scanRange: 560,
    scanHalfAngle: 0.38,
    scanSpeed: 0.28,
    detectSeconds: 2,
    alarmSeconds: 8,
} as const;
export const SCAN_SITES = {
    relay: { name: 'Przekaźnik Lumen', key: 7 },
    archive: { name: 'Obserwatorium Mnemos', key: 8 },
    outpost: { name: 'Dane placówki Cerber', key: 0 },
    fortress: { name: 'Rdzeń twierdzy Aegis', key: 14 },
    escort: { name: 'Badania Keplera', key: 16 },
} as const;
export type ScanSiteId = keyof typeof SCAN_SITES;
export interface Mount {
    x: number;
    y: number;
}
export interface HullDefinition {
    name: string;
    role: string;
    detail: string;
    health: number;
    shield: { capacity: number; regen: number; delay: number };
    cargo: number;
    thrust: number;
    brake: number;
    turnSpeed: number;
    maxSpeed: number;
    size: number;
    miningPower: number;
    ore: number;
    parts: number;
    workshop: number;
    recovery: number;
    boost: number;
    cloak: number;
    guns: readonly Mount[];
    lasers: readonly Mount[];
    engines: readonly Mount[];
    laserRange: number;
    grabbers: readonly Mount[];
    grabberRange: number;
    towPickupSpeed: number;
    hitbox: readonly [number, number];
}
export const HULLS = {
    prospector: {
        name: 'Prospector I',
        role: 'Początkowy',
        detail: 'Prosty owalny kadłub: jeden silnik, działko i krótki laser.',
        health: GAME.hull,
        shield: { capacity: 25, regen: 5, delay: 5 },
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
        boost: 1.45,
        cloak: 0,
        guns: [{ x: 25, y: 0 }],
        lasers: [{ x: -25, y: 16 }],
        engines: [{ x: -32, y: 0 }],
        laserRange: 180,
        grabbers: [{ x: 8, y: 18 }],
        grabberRange: 140,
        towPickupSpeed: 1,
        hitbox: [32, 20],
    },
    swift: {
        name: 'Swift',
        role: 'Zwiadowca',
        detail: 'Szybszy i zwinniejszy; mniejszy zapas kadłuba.',
        health: 60,
        shield: { capacity: 35, regen: 9, delay: 3.5 },
        cargo: 24,
        thrust: 1500,
        brake: 880,
        turnSpeed: 2.35,
        maxSpeed: 620,
        size: 0.9,
        miningPower: 1,
        ore: 65,
        parts: 4,
        workshop: 1,
        recovery: 0.18,
        boost: 1.6,
        cloak: 0.6,
        guns: [{ x: 32, y: 0 }],
        lasers: [{ x: -24, y: 17 }],
        engines: [{ x: -32, y: 0 }],
        laserRange: 180,
        grabbers: [{ x: 0, y: 18 }],
        grabberRange: 140,
        towPickupSpeed: 1,
        hitbox: [35, 20],
    },
    mule: {
        name: 'Mule',
        role: 'Statek wydobywczy',
        detail: 'Duży ładunek, mocniejszy kadłub i laser; wolniejszy lot.',
        health: 150,
        shield: { capacity: 60, regen: 6, delay: 6 },
        cargo: 110,
        thrust: 550,
        brake: 640,
        turnSpeed: 0.9,
        maxSpeed: 260,
        size: 1.25,
        miningPower: 1.3,
        ore: 85,
        parts: 6,
        workshop: 1,
        recovery: 0.22,
        boost: 1.25,
        cloak: 0,
        guns: [{ x: -30, y: 0 }],
        lasers: [
            { x: 10, y: -29 },
            { x: 10, y: 29 },
        ],
        engines: [
            { x: -31, y: -24 },
            { x: -31, y: 24 },
        ],
        laserRange: 320,
        grabbers: [
            { x: 0, y: -30 },
            { x: 20, y: 0 },
            { x: 0, y: 30 },
        ],
        grabberRange: 300,
        towPickupSpeed: 1,
        hitbox: [34, 34],
    },
    fighter: {
        name: 'Bastion',
        role: 'Bojowy',
        detail: 'Dwa boczne działka, dawny kadłub Prospectora.',
        health: 100,
        shield: { capacity: 100, regen: 10, delay: 4.5 },
        cargo: 30,
        thrust: 1000,
        brake: 720,
        turnSpeed: 1.65,
        maxSpeed: 480,
        size: 1,
        miningPower: 1,
        ore: 90,
        parts: 7,
        workshop: 1,
        recovery: 0.18,
        boost: 1.65,
        cloak: 0.2,
        guns: [
            { x: 0, y: -23 },
            { x: 0, y: 23 },
        ],
        lasers: [{ x: 25, y: 0 }],
        engines: [{ x: -27, y: 0 }],
        laserRange: 180,
        grabbers: [{ x: 0, y: 22 }],
        grabberRange: 220,
        towPickupSpeed: 1,
        hitbox: [32, 23],
    },
    tug: {
        name: 'Manta',
        role: 'Holowniczy',
        detail: 'Wytrzymała płaszczka z dwoma silnikami na przednich skrzydłach.',
        health: 230,
        shield: { capacity: 80, regen: 7, delay: 5.5 },
        cargo: 60,
        thrust: 600,
        brake: 680,
        turnSpeed: 1.4,
        maxSpeed: 280,
        size: 1.25,
        miningPower: 1,
        ore: 95,
        parts: 6,
        workshop: 1,
        recovery: 0.3,
        boost: 1.25,
        cloak: 0.25,
        guns: [{ x: 28, y: 0 }],
        lasers: [{ x: -30, y: 0 }],
        engines: [
            { x: 12, y: -37 },
            { x: 12, y: 37 },
        ],
        laserRange: 320,
        grabbers: [
            { x: 0, y: -30 },
            { x: 0, y: 30 },
        ],
        grabberRange: 220,
        towPickupSpeed: 1,
        hitbox: [35, 36],
    },
    falcon: {
        name: 'Sokół',
        role: 'Szybki transport',
        detail: 'Okrągły kadłub z rozwidlonym dziobem i mocnym boostem.',
        health: 125,
        shield: { capacity: 65, regen: 8, delay: 4.5 },
        cargo: 60,
        thrust: 1050,
        brake: 720,
        turnSpeed: 1.05,
        maxSpeed: 560,
        size: 1.1,
        miningPower: 1,
        ore: 120,
        parts: 9,
        workshop: 1,
        recovery: 0.22,
        boost: 2.1,
        cloak: 0.4,
        guns: [
            { x: 27, y: -12 },
            { x: 27, y: 12 },
        ],
        lasers: [{ x: 18, y: 0 }],
        engines: [{ x: -31, y: 0 }],
        laserRange: 320,
        grabbers: [
            { x: 0, y: -27 },
            { x: 0, y: 27 },
        ],
        grabberRange: 140,
        towPickupSpeed: 1,
        hitbox: [36, 32],
    },
    atlas: {
        name: 'Atlas',
        role: 'Grenadier',
        detail: 'LPM: rakieta z namierzaniem celu po 3 s. PPM: krótkodystansowe granaty obszarowe.',
        health: 200,
        shield: { capacity: 90, regen: 5, delay: 7 },
        cargo: 150,
        thrust: 420,
        brake: 540,
        turnSpeed: 0.75,
        maxSpeed: 220,
        size: 1.35,
        miningPower: 0.85,
        ore: 180,
        parts: 16,
        workshop: 2,
        recovery: 0.25,
        boost: 1.2,
        cloak: 0,
        guns: [],
        lasers: [],
        engines: [
            { x: -35, y: -20 },
            { x: -35, y: 20 },
        ],
        laserRange: 320,
        grabbers: [
            { x: -18, y: -32 },
            { x: 20, y: -32 },
            { x: -18, y: 32 },
            { x: 20, y: 32 },
        ],
        grabberRange: 300,
        towPickupSpeed: 1,
        hitbox: [43, 38],
    },
    harpoon: {
        name: 'Harpun',
        role: 'Specjalista odzysku',
        detail: 'Przegubowe szczęki zamiast działek i lasera. LPM miażdży, PPM wysuwa ramiona ku celowi.',
        health: 110,
        shield: { capacity: 70, regen: 8.5, delay: 4 },
        cargo: 75,
        thrust: 850,
        brake: 900,
        turnSpeed: 1.55,
        maxSpeed: 430,
        size: 1.15,
        miningPower: 1,
        ore: 155,
        parts: 14,
        workshop: 2,
        recovery: 0.3,
        boost: 1.4,
        cloak: 0.35,
        guns: [],
        lasers: [],
        engines: [
            { x: -30, y: -16 },
            { x: -30, y: 16 },
        ],
        laserRange: 320,
        grabbers: [
            { x: -12, y: -12 },
            { x: 8, y: -18 },
            { x: -12, y: 12 },
            { x: 8, y: 18 },
        ],
        grabberRange: 300,
        towPickupSpeed: 2,
        hitbox: [35, 18],
    },
    aegis: {
        name: 'Aegis',
        role: 'Obrońca eskorty',
        detail: 'Energetyczne działko wyłącza broń wroga. Impuls tarcz i reaktywny dron osłaniają sojuszników.',
        health: 145,
        shield: { capacity: 120, regen: 8, delay: 5 },
        cargo: 60,
        thrust: 750,
        brake: 850,
        turnSpeed: 1.25,
        maxSpeed: 340,
        size: 1.15,
        miningPower: 1,
        ore: 210,
        parts: 22,
        workshop: 2,
        recovery: 0.3,
        boost: 1.35,
        cloak: 0,
        guns: [{ x: 45, y: 0 }],
        lasers: [],
        engines: [
            { x: -36, y: -24 },
            { x: -36, y: 24 },
        ],
        laserRange: 0,
        grabbers: [
            { x: -10, y: -37 },
            { x: -10, y: 37 },
        ],
        grabberRange: 230,
        towPickupSpeed: 1,
        hitbox: [40, 37],
    },
} as const satisfies Record<string, HullDefinition>;
export type HullId = keyof typeof HULLS;

export const CREW = {
    hireOre: 12,
    quartermasterOre: 20,
    quartermasterParts: 2,
    queueLimit: 3,
    kitLimit: 10,
    embarkKits: 2,
} as const;
export const PILOT_PROGRESSION = {
    thresholds: [0, 20, 50, 90, 140],
    skillLimit: 2,
    maxXpPerRun: 50,
} as const;
export const PILOT_SKILLS = {
    handling: { title: 'Manewrowanie', detail: 'Obrót i hamowanie +3% / poziom', bonus: 0.03 },
    mining: { title: 'Wydobycie', detail: 'Moc lasera +5% / poziom', bonus: 0.05 },
    survival: {
        title: 'Procedury ewakuacji',
        detail: 'Szansa kapsuły +6 p.p. / poziom',
        bonus: 0.06,
    },
} as const;
export type PilotSkillId = keyof typeof PILOT_SKILLS;
export const JOBS = {
    crystallize: {
        title: 'Przetop kryształów',
        ore: 0,
        parts: 5,
        seconds: 90,
        output: 'crystals',
        amount: 1,
        worker: 'mechanic',
        workshop: 1,
    },
    refine: {
        title: 'Rafinacja rudy',
        ore: 8,
        parts: 0,
        seconds: 45,
        output: 'parts',
        amount: 1,
        worker: 'mechanic',
    },
    kit: {
        title: 'Zestaw naprawczy',
        ore: 6,
        parts: 1,
        seconds: 30,
        output: 'kit',
        amount: 1,
        worker: 'mechanic',
    },
    recycle: {
        title: 'Odzysk rudy',
        ore: 0,
        parts: 1,
        seconds: 60,
        output: 'ore',
        amount: 5,
        worker: 'quartermaster',
    },
} as const;
export type JobKind = keyof typeof JOBS;
export type CrewRole = 'mechanic' | 'quartermaster';

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

export type Upgrade =
    | 'engine'
    | 'handling'
    | 'cargo'
    | 'drill'
    | 'armor'
    | 'shield'
    | 'workshop'
    | 'storage';
export const UPGRADES: Record<
    Upgrade,
    { title: string; detail: string; ore: number; parts: number }
> = {
    engine: { title: 'Silnik impulsowy', detail: 'Ciąg +15% / poziom', ore: 18, parts: 1 },
    handling: {
        title: 'Dysze manewrowe',
        detail: 'Skręt i reakcja na klawisze +20% / poziom',
        ore: 16,
        parts: 1,
    },
    cargo: { title: 'Moduł ładowni', detail: 'Pojemność +15 / poziom', ore: 14, parts: 0 },
    drill: {
        title: 'Laser wydobywczy',
        detail: 'Moc lasera +25% / poziom',
        ore: 20,
        parts: 2,
    },
    armor: { title: 'Wzmocnienie kadłuba', detail: 'Kadłub +25 / poziom', ore: 16, parts: 1 },
    shield: {
        title: 'Tarcza kinetyczna',
        detail: 'Pojemność +25%, regeneracja +15% / poziom',
        ore: 22,
        parts: 2,
    },
    workshop: {
        title: 'Warsztat stacji',
        detail: 'Odblokowuje wyższy poziom modułów',
        ore: 30,
        parts: 3,
    },
    storage: { title: 'Magazyn stacji', detail: 'Pojemność +100 / poziom', ore: 25, parts: 1 },
};

export const AEGIS = {
    damage: 36,
    rockDamage: 12,
    speed: 780,
    life: 1.5,
    interval: 0.5,
    disable: 2.5,
    range: 420,
    duration: 6,
    cooldown: 18,
    buffer: 80,
    droneHull: 50,
    droneDamage: 12,
    droneRadius: 11,
    droneRange: 550,
    droneInterval: 0.6,
    orbit: 110,
} as const;

export const ATLAS_WEAPONS = {
    lockTime: 3,
    rocket: { speed: 240, life: 12, radius: 180, damage: 160, interval: 1.8, turn: 2.8 },
    grenade: { speed: 320, life: 0.7, radius: 65, damage: 45, interval: 0.55, spread: 0.16 },
} as const;

export function shipUpgradeDefinition(hull: HullId, upgrade: Upgrade) {
    const definition = UPGRADES[upgrade];
    if (hull === 'aegis' && upgrade === 'drill')
        return {
            ...definition,
            title: 'Ogniwo energetyczne',
            detail: 'Obrażenia działka +25% / poziom',
        };
    if (hull === 'aegis' && upgrade === 'handling')
        return {
            ...definition,
            title: 'System drona',
            detail: 'Atak i kadłub drona +25%, manewry +20% / poziom',
        };
    if (hull === 'aegis' && upgrade === 'shield')
        return {
            ...definition,
            title: 'Impuls ochronny',
            detail: 'Szybkość odnowienia +20%, tarcze +25% / poziom',
        };
    if (hull === 'atlas' && upgrade === 'drill')
        return {
            ...definition,
            title: 'Salwa granatów',
            detail: '+1 granat w stożku / poziom',
        };
    if (hull === 'atlas' && upgrade === 'handling')
        return {
            ...definition,
            title: 'Układ rakietowy',
            detail: 'Rakiety: obrażenia +25%, skręt i manewry +20% / poziom',
        };
    if (hull === 'harpoon' && upgrade === 'handling')
        return {
            ...definition,
            title: 'Przeguby ramion',
            detail: 'Zasięg +15%, wysuw i skręt +20% / poziom',
        };
    if (hull === 'harpoon' && upgrade === 'drill')
        return {
            ...definition,
            title: 'Siłowniki szczęk',
            detail: 'Obrażenia skał i statków +25% / poziom',
        };
    return definition;
}

export interface ContractDefinition {
    title: string;
    detail: string;
    ore: number;
    parts: number;
    rewardOre: number;
    rewardParts: number;
    sites: readonly ScanSiteId[];
    kills?: number;
    unlock: 'always' | 'return' | 'research' | 'combat';
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
    {
        title: 'Cichy przechwyt',
        detail: 'Wykradnij dane z terminala placówki Cerber (0) i wróć do Aurory.',
        ore: 0,
        parts: 0,
        rewardOre: 32,
        rewardParts: 8,
        sites: ['outpost'],
        unlock: 'research',
    },
    {
        title: 'Ochrona szlaku',
        detail: 'Zniszcz 3 drony w jednej wyprawie i wróć do Aurory. F wskazuje najbliższego drona.',
        ore: 0,
        parts: 0,
        rewardOre: 24,
        rewardParts: 6,
        sites: [],
        kills: 3,
        unlock: 'combat',
    },
    {
        title: 'Przełamanie Aegis',
        detail: 'H wskazuje twierdzę. Pokonaj 5 obrońców, pobierz dane rdzenia (E) i wróć do Aurory.',
        ore: 0,
        parts: 0,
        rewardOre: 48,
        rewardParts: 12,
        sites: ['fortress'],
        unlock: 'research',
    },
    {
        title: 'Eskorta Keplera',
        detail: 'N wskazuje statek badawczy. E rozpoczyna eskortę. Osłaniaj Keplera w locie i podczas badań, potem wróć z danymi.',
        ore: 0,
        parts: 0,
        rewardOre: 36,
        rewardParts: 8,
        sites: ['escort'],
        unlock: 'research',
    },
] as const;

export const WEAPONS = {
    standard: {
        name: 'Autocannon',
        detail: 'Uniwersalne działko · równy rytm ognia.',
        damage: GAME.shotDamage,
        interval: GAME.shotInterval,
        speed: GAME.shotSpeed,
        life: 1.15,
        length: GAME.gunLength,
        ore: 0,
        parts: 0,
        workshop: 0,
    },
    pulse: {
        name: 'Impuls',
        detail: 'Szybka seria · krótszy zasięg i lżejsze trafienia.',
        damage: 9,
        interval: 0.1,
        speed: 1050,
        life: 0.8,
        length: 28,
        ore: 16,
        parts: 3,
        workshop: 1,
    },
    rail: {
        name: 'Kinetic',
        detail: 'Mocny strzał z dystansu · długi odstęp między strzałami.',
        damage: 42,
        interval: 0.65,
        speed: 1700,
        life: 1.2,
        length: 42,
        ore: 24,
        parts: 6,
        workshop: 1,
    },
} as const;
export type WeaponId = keyof typeof WEAPONS;
