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
    laserShipDamage: 12,
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
    interceptor: {
        ...DRONES,
        name: 'Przechwytujący',
        hull: 42,
        radius: 21,
        patrolSpeed: 150,
        chaseSpeed: 360,
        acceleration: 620,
        turnSpeed: 7,
        preferredRange: 220,
        windup: 0.35,
        shotInterval: 0.9,
        shotDamage: 7,
        oreLoot: 2,
        partsLoot: 2,
        density: 3,
        strafe: 0.55,
    },
    heavy: {
        ...DRONES,
        name: 'Pancernik',
        hull: 210,
        radius: 42,
        patrolSpeed: 65,
        chaseSpeed: 140,
        acceleration: 220,
        turnSpeed: 2.2,
        preferredRange: 240,
        windup: 1,
        shotInterval: 2.2,
        shotSpeed: 550,
        shotDamage: 14,
        oreLoot: 6,
        partsLoot: 5,
        density: 8,
        strafe: 0.05,
    },
    support: {
        ...DRONES,
        name: 'Serwisant',
        hull: 62,
        radius: 25,
        patrolSpeed: 90,
        chaseSpeed: 200,
        preferredRange: 620,
        shotDamage: 5,
        shotInterval: 2,
        oreLoot: 3,
        partsLoot: 4,
        density: 3,
        strafe: 0.2,
    },
    minelayer: {
        ...DRONES,
        name: 'Stawiacz min',
        hull: 74,
        radius: 29,
        patrolSpeed: 95,
        chaseSpeed: 190,
        preferredRange: 480,
        shotDamage: 6,
        shotInterval: 2,
        oreLoot: 3,
        partsLoot: 3,
        density: 4,
        strafe: 0.65,
    },
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
export const ENEMY_SUPPORT = { range: 420, followRange: 800, repairPerSecond: 5 } as const;
export const ENEMY_MINES = {
    interval: 5,
    armSeconds: 1.5,
    lifetime: 24,
    triggerRadius: 95,
    blastRadius: 170,
    damage: 24,
    hull: 12,
    radius: 13,
    limitPerLayer: 4,
    limit: 20,
} as const;
export const RECOVERY = { signalLimit: 10000, radius: 160, speed: 80, seconds: 4 } as const;
export const SCAN = { radius: 180, speed: 60, seconds: 3 } as const;
export const OUTPOST = {
    radius: 100,
    terminalDistance: 260,
    interactRadius: 100,
    interactSpeed: 60,
    equipmentSeconds: 5,
    equipmentSlots: 3,
    disabledSeconds: 20,
    scanRange: 560,
    scanHalfAngle: 0.38,
    scanSpeed: 0.28,
    detectSeconds: 2,
    alarmSeconds: 8,
} as const;
export const SCAN_SITES = {
    lunarProbe: { name: 'Sonda księżycowa', key: 8 },
    relay: { name: 'Przekaźnik Lumen', key: 7 },
    archive: { name: 'Obserwatorium Mnemos', key: 8 },
    outpost: { name: 'Dane placówki Cerber', key: 0 },
    fortress: { name: 'Rdzeń twierdzy Aegis', key: 14 },
    escort: { name: 'Badania Keplera', key: 16 },
    rescue: { name: 'Dostawa promu ratunkowego', key: 17 },
    factory: { name: 'Zniszczenie stoczni polowej', key: 5 },
    anomaly: { name: 'Odzysk sondy z anomalii', key: 17 },
} as const;
export type ScanSiteId = keyof typeof SCAN_SITES;
export interface Mount {
    x: number;
    y: number;
}
export interface HullDefinition {
    salvageOnly?: boolean;
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
    workshop: number;
    recovery: number;
    boost: number;
    radarJamming: number;
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
        workshop: 0,
        recovery: 0.1,
        boost: 1.45,
        radarJamming: 0,
        guns: [{ x: 25, y: -14 }],
        lasers: [{ x: 25, y: 14 }],
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
        detail: 'Lekki zwiadowca: działko, laser i skuteczne zakłócanie radarów.',
        health: 60,
        shield: { capacity: 30, regen: 9, delay: 3.5 },
        cargo: 24,
        thrust: 1500,
        brake: 880,
        turnSpeed: 2.35,
        maxSpeed: 520,
        size: 0.9,
        miningPower: 1,
        workshop: 0,
        recovery: 0.18,
        boost: 1.6,
        radarJamming: 0.6,
        guns: [{ x: 32, y: 0 }],
        lasers: [{ x: -18, y: 0 }],
        engines: [{ x: -32, y: 0 }],
        laserRange: 180,
        grabbers: [{ x: 0, y: 18 }],
        grabberRange: 140,
        towPickupSpeed: 1,
        hitbox: [40, 34],
    },
    mule: {
        name: 'Mule',
        role: 'Statek wydobywczy',
        detail: 'LPM: dwa lasery. PPM: samonaprawa bez surowców i zestawów naprawczych.',
        health: 150,
        shield: { capacity: 60, regen: 6, delay: 6 },
        cargo: 110,
        thrust: 550,
        brake: 640,
        turnSpeed: 0.9,
        maxSpeed: 260,
        size: 1.25,
        miningPower: 1.3,
        workshop: 1,
        recovery: 0.22,
        boost: 1.25,
        radarJamming: 0,
        guns: [],
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
        detail: 'Dwa boczne działka i krótkodystansowe granaty na PPM.',
        health: 100,
        shield: { capacity: 100, regen: 10, delay: 4.5 },
        cargo: 30,
        thrust: 1000,
        brake: 720,
        turnSpeed: 1.65,
        maxSpeed: 480,
        size: 1,
        miningPower: 1,
        workshop: 1,
        recovery: 0.18,
        boost: 1.65,
        radarJamming: 0.2,
        guns: [
            { x: 0, y: -23 },
            { x: 0, y: 23 },
        ],
        lasers: [],
        engines: [{ x: -27, y: 0 }],
        laserRange: 0,
        grabbers: [{ x: 0, y: 22 }],
        grabberRange: 220,
        towPickupSpeed: 1,
        hitbox: [32, 23],
    },
    tug: {
        name: 'Manta',
        role: 'Holowniczy',
        detail: 'Wytrzymała płaszczka z dwoma silnikami. Holuje dwie jednostki jednocześnie.',
        health: 230,
        shield: { capacity: 80, regen: 7, delay: 5.5 },
        cargo: 60,
        thrust: 600,
        brake: 680,
        turnSpeed: 1.4,
        maxSpeed: 280,
        size: 1.25,
        miningPower: 1,
        workshop: 1,
        recovery: 0.3,
        boost: 1.25,
        radarJamming: 0.25,
        guns: [{ x: 24, y: -20 }],
        lasers: [{ x: 24, y: 20 }],
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
        detail: 'Mocny boost i ciche włamanie: 45 s na terminal, połowa śladu po błędzie.',
        health: 125,
        shield: { capacity: 65, regen: 8, delay: 4.5 },
        cargo: 60,
        thrust: 1050,
        brake: 720,
        turnSpeed: 1.05,
        maxSpeed: 560,
        size: 1.1,
        miningPower: 1,
        workshop: 1,
        recovery: 0.22,
        boost: 2.1,
        radarJamming: 0.4,
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
    widmo: {
        name: 'Widmo',
        role: 'Infiltrator fazowy',
        detail: 'LPM: fazowy dash przez struktury i wrogów. PPM: kamuflaż optyczny.',
        health: 60,
        shield: { capacity: 35, regen: 9, delay: 3.5 },
        cargo: 24,
        thrust: 1500,
        brake: 880,
        turnSpeed: 2.35,
        maxSpeed: 620,
        size: 0.9,
        miningPower: 1,
        workshop: 2,
        recovery: 0.18,
        boost: 1.6,
        radarJamming: 0.6,
        guns: [],
        lasers: [],
        engines: [{ x: -32, y: 0 }],
        laserRange: 0,
        grabbers: [{ x: 0, y: 18 }],
        grabberRange: 140,
        towPickupSpeed: 1,
        hitbox: [44, 54],
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
        workshop: 2,
        recovery: 0.25,
        boost: 1.2,
        radarJamming: 0,
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
        detail: 'LPM: zacisk szczęk. PPM: wysuw ramion. Jedyny kadłub wyrywający spiek merkuriański.',
        health: 110,
        shield: { capacity: 70, regen: 8.5, delay: 4 },
        cargo: 75,
        thrust: 850,
        brake: 900,
        turnSpeed: 1.55,
        maxSpeed: 430,
        size: 1.15,
        miningPower: 1,
        workshop: 2,
        recovery: 0.3,
        boost: 1.4,
        radarJamming: 0.35,
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
        workshop: 2,
        recovery: 0.3,
        boost: 1.35,
        radarJamming: 0,
        guns: [{ x: 45, y: 0 }],
        lasers: [],
        engines: [
            { x: -36, y: -24 },
            { x: -36, y: 24 },
        ],
        laserRange: 0,
        grabbers: [{ x: -24, y: 0 }],
        grabberRange: 230,
        towPickupSpeed: 1,
        hitbox: [40, 37],
    },
    stinger: {
        name: 'Żądło',
        role: 'Glass cannon',
        detail: 'Cztery działka. LPM: amunicja przeciw lekkim dronom. PPM: amunicja przeciwpancerna. Bez lasera.',
        health: 55,
        shield: { capacity: 20, regen: 7, delay: 5 },
        cargo: 20,
        thrust: 1650,
        brake: 1000,
        turnSpeed: 2.85,
        maxSpeed: 680,
        size: 0.95,
        miningPower: 0.8,
        workshop: 2,
        recovery: 0.14,
        boost: 1.95,
        radarJamming: 0,
        guns: [
            { x: -20, y: -42 },
            { x: 16, y: -36 },
            { x: -20, y: 42 },
            { x: 16, y: 36 },
        ],
        lasers: [],
        engines: [
            { x: -29, y: -12 },
            { x: -29, y: 12 },
        ],
        laserRange: 0,
        grabbers: [{ x: -8, y: 20 }],
        grabberRange: 140,
        towPickupSpeed: 1,
        hitbox: [40, 46],
    },
    phoenix: {
        name: 'Feniks',
        role: 'Uniwersalny szturmowiec',
        detail: 'Laser bojowy i rakieta. Terminal: natychmiastowe przełamanie kosztem alarmu i pościgu.',
        health: 95,
        shield: { capacity: 55, regen: 8, delay: 4.5 },
        cargo: 55,
        thrust: 1100,
        brake: 820,
        turnSpeed: 1.95,
        maxSpeed: 540,
        size: 1.05,
        miningPower: 1,
        workshop: 2,
        recovery: 0.2,
        boost: 1.7,
        radarJamming: 0,
        guns: [],
        lasers: [{ x: 42, y: 0 }],
        engines: [
            { x: -27, y: -20 },
            { x: -27, y: 20 },
        ],
        laserRange: 700,
        grabbers: [
            { x: -8, y: -27 },
            { x: -8, y: 27 },
        ],
        grabberRange: 140,
        towPickupSpeed: 1,
        hitbox: [43, 39],
    },
    raider: {
        name: 'Raider odzyskany',
        role: 'Przechwycony',
        detail: 'Odbudowany wrak przeciwnika. Dostępny wyłącznie przez odzysk.',
        health: 80,
        shield: { capacity: 45, regen: 10, delay: 4.5 },
        cargo: 30,
        thrust: 1000,
        brake: 720,
        turnSpeed: 1.65,
        maxSpeed: 410,
        size: 1,
        miningPower: 1,
        workshop: 2,
        recovery: 0.18,
        boost: 1.65,
        radarJamming: 0.2,
        salvageOnly: true,
        guns: [
            { x: 0, y: -23 },
            { x: 0, y: 23 },
        ],
        lasers: [],
        engines: [{ x: -27, y: 0 }],
        laserRange: 0,
        grabbers: [{ x: 0, y: 22 }],
        grabberRange: 220,
        towPickupSpeed: 1,
        hitbox: [32, 23],
    },
    lancer: {
        name: 'Lancer odzyskany',
        role: 'Przechwycony',
        detail: 'Odbudowany wrak przeciwnika. Dostępny wyłącznie przez odzysk.',
        health: 160,
        shield: { capacity: 110, regen: 10, delay: 4.5 },
        cargo: 30,
        thrust: 1000,
        brake: 720,
        turnSpeed: 1.65,
        maxSpeed: 290,
        size: 1,
        miningPower: 1,
        workshop: 2,
        recovery: 0.18,
        boost: 1.65,
        radarJamming: 0.2,
        salvageOnly: true,
        guns: [
            { x: 0, y: -23 },
            { x: 0, y: 23 },
        ],
        lasers: [],
        engines: [{ x: -27, y: 0 }],
        laserRange: 0,
        grabbers: [{ x: 0, y: 22 }],
        grabberRange: 220,
        towPickupSpeed: 1,
        hitbox: [32, 23],
    },
} as const satisfies Record<string, HullDefinition>;
export type HullId = keyof typeof HULLS;

export const PHOENIX = { laserDamage: 30, rockDamage: 110, burnDamage: 8, burnSeconds: 3 } as const;

export const STINGER_AMMO = {
    light: { damage: 8, interval: 0.24, speed: 1250, life: 0.9, patrol: 1.5, lancer: 0.4 },
    armor: { damage: 12, interval: 0.4, speed: 1500, life: 1, patrol: 0.45, lancer: 1.5 },
} as const;

export const REPAIR_KITS = { kitLimit: 10 } as const;
export const PILOT_PROGRESSION = {
    thresholds: [0, 20, 50, 90, 140],
    skillLimit: 2,
    maxXpPerRun: 50,
} as const;
export const PILOT_SKILLS = {
    handling: { title: 'Manewrowanie', detail: 'Obrót i hamowanie +6% / poziom', bonus: 0.06 },
    mining: { title: 'Wydobycie', detail: 'Moc wydobycia +10% / poziom', bonus: 0.1 },
    survival: {
        title: 'Procedury ewakuacji',
        detail: 'Szansa kapsuły +6 p.p. / poziom',
        bonus: 0.06,
    },
} as const;
export type PilotSkillId = keyof typeof PILOT_SKILLS;
export const PILOTS = [
    {
        name: 'Mira Voss',
        role: 'Nawigacja',
        trait: 'Precyzyjny pilotaż',
        perkDetail:
            'Obrót +20% i siła hamowania +10%. Łatwiejsze podejścia do stacji i manewry między skałami.',
        turn: 1.2,
        brake: 1.1,
        mining: 1,
        scan: 1,
        escape: 0.12,
    },
    {
        name: 'Ivo Kern',
        role: 'Eksploatacja złóż',
        trait: 'Praca w złożu',
        perkDetail:
            'Moc wydobycia +20% i siła hamowania +20%. Szybsze rozbijanie skał i pewniejsze zatrzymanie przy złożu.',
        turn: 1,
        brake: 1.2,
        mining: 1.2,
        scan: 1,
        escape: 0.08,
    },
    {
        name: 'Nela Rook',
        role: 'Zwiad',
        trait: 'Rozpoznanie i powrót',
        perkDetail:
            'Tempo skanowania +35%. Premia do szansy kapsuły +20 p.p., przydatna podczas ryzykownych wypraw.',
        turn: 1,
        brake: 1,
        mining: 1,
        scan: 1.35,
        escape: 0.2,
    },
    {
        name: 'Kadet Sol',
        role: 'Program ratunkowy',
        trait: 'Szkolenie podstawowe',
        perkDetail:
            'Bez premii specjalizacji. Zdobywa doświadczenie i rozwija umiejętności jak pozostali piloci.',
        turn: 1,
        brake: 1,
        mining: 1,
        scan: 1,
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
export const UPGRADES: Record<Upgrade, { title: string; detail: string }> = {
    engine: { title: 'Silnik impulsowy', detail: 'Ciąg +15% / poziom' },
    handling: {
        title: 'Dysze manewrowe',
        detail: 'Skręt i reakcja na klawisze +20% / poziom',
    },
    cargo: { title: 'Moduł ładowni', detail: 'Pojemność +15 / poziom' },
    drill: {
        title: 'Laser wydobywczy',
        detail: 'Moc lasera +25% / poziom',
    },
    armor: { title: 'Wzmocnienie kadłuba', detail: 'Kadłub +25 / poziom' },
    shield: {
        title: 'Tarcza kinetyczna',
        detail: 'Pojemność +25%, regeneracja +15% / poziom',
    },
    workshop: {
        title: 'Zaplecze produkcyjne',
        detail: 'Odblokowuje wyższy poziom modułów',
    },
    storage: { title: 'Magazyn stacji', detail: 'Pojemność +100 / poziom' },
};

export const WIDMO = { duration: 3, cooldown: 12 } as const;

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
    launcher: { x: 34, y: 0, length: 35 },
    lockTime: 3,
    rocket: { speed: 240, life: 12, radius: 180, damage: 160, interval: 1.8, turn: 2.8 },
    grenade: { speed: 320, life: 0.7, radius: 65, damage: 45, interval: 0.55, spread: 0.16 },
} as const;

export function shipUpgradeDefinition(hull: HullId, upgrade: Upgrade) {
    const definition = UPGRADES[upgrade];
    if ((hull === 'raider' || hull === 'lancer') && upgrade === 'drill')
        return { ...definition, title: 'Układ bojowy', detail: 'Obrażenia działek +25% / poziom' };
    if (hull === 'stinger' && upgrade === 'drill')
        return {
            ...definition,
            title: 'Układ amunicji',
            detail: 'Obrażenia obu rodzajów pocisków +25% / poziom',
        };
    if (hull === 'phoenix' && upgrade === 'drill')
        return {
            ...definition,
            title: 'Projektor bojowy',
            detail: 'Wiązka, podpalenie i wydobycie +25% / poziom',
        };
    if (hull === 'widmo' && upgrade === 'handling')
        return {
            ...definition,
            title: 'Napęd ostrzowy',
            detail: 'Dash: obrażenia +25%, dystans +10%, odnowienie +15%, ostrza +6% / poziom',
        };
    if (hull === 'widmo' && upgrade === 'drill')
        return {
            ...definition,
            title: 'Projektor kamuflażu',
            detail: 'Szybkość odnowienia kamuflażu +20% / poziom; czas działania 3 s',
        };
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
    if ((hull === 'atlas' || hull === 'fighter') && upgrade === 'drill')
        return {
            ...definition,
            title: 'Salwa granatów',
            detail: '+1 granat w stożku / poziom',
        };
    if ((hull === 'atlas' || hull === 'phoenix') && upgrade === 'handling')
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
        detail: 'Zniszcz 3 drony w jednej wyprawie i wróć do Aurory.',
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
        detail: 'Leć do twierdzy. Pokonaj 5 obrońców, pobierz dane rdzenia (E) i wróć do Aurory.',
        ore: 0,
        parts: 0,
        rewardOre: 48,
        rewardParts: 12,
        sites: ['fortress'],
        unlock: 'research',
    },
    {
        title: 'Eskorta Keplera',
        detail: 'Podejdź do statku badawczego. E rozpoczyna eskortę. Osłaniaj Keplera w locie i podczas badań, potem wróć z danymi.',
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
        workshop: 1,
    },
} as const;
export type WeaponId = keyof typeof WEAPONS;

export const FORTRESS_WALL_HALF_WIDTH = 55;
export const phaseBladeScale = (level: number) => 1 + Math.max(0, Math.min(3, level)) * 0.06;
export const PHASE_DASH = { seconds: 0.32, speed: 1600, cooldown: 5, damage: 65 } as const;
export const ARMAMENT_KITS = {
    standard: { power: 1, range: 1, cooldown: 1 },
    pulse: { power: 0.8, range: 1.2, cooldown: 0.7 },
    rail: { power: 1.45, range: 0.85, cooldown: 1.4 },
} as const;
export function armamentName(hull: HullId, weapon: WeaponId) {
    const system =
        hull === 'widmo'
            ? 'Napęd fazowy'
            : hull === 'mule'
              ? 'Lasery górnicze'
              : hull === 'harpoon'
                ? 'Szczęki odzysku'
                : hull === 'aegis'
                  ? 'Ogniwo EMP'
                  : hull === 'atlas'
                    ? 'Arsenał rakietowy'
                    : hull === 'phoenix'
                      ? 'Projektor bojowy'
                      : hull === 'stinger'
                        ? 'Bateria skrzydłowa'
                        : 'Uzbrojenie';
    return `${system} · ${weapon === 'standard' ? 'standard' : weapon === 'pulse' ? 'impulsowy' : 'ciężki'}`;
}
