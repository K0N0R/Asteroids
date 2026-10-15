import { HULLS, WEAPONS, GAME, type HullId, type WeaponId } from '../config';
import { beginRun, newCampaign, newShip, type ShipModules } from '../state/campaign';
import { newPilot } from '../state/pilots';
import { generateSector, random, type Point, type RockSpec } from '../worlds/sector';
import { MODULE_KEYS } from '../ui/modulePreview';
import { MissionSimulation } from './mission';
import type { FrameReport } from '../../core/systems/frameDiagnostics';

export const SANDBOX_SCENARIOS = {
    sector: {
        name: 'Swobodny sektor',
        detail: 'Pełna mapa. Porównaj statki i wróć do Aurory.',
        target: 1,
    },
    mining: {
        name: 'Wydobycie',
        detail: 'Zbierz 10 jednostek ładunku i wróć. Brak wrogów; złoże przed statkiem.',
        target: 1,
    },
    combat: {
        name: 'Walka',
        detail: 'Pokonaj dwa drony i wróć do bazy. Walka zaczyna się poza tarczą Aurory.',
        target: 1,
    },
    salvage: {
        name: 'Holowanie / ratunek',
        detail: 'Dostarcz wrak lub kapsułę do Aurory. Kapsuła: 6, wrak: Z, podjęcie: E.',
        target: 5,
    },
    infiltration: {
        name: 'Infiltracja',
        detail: 'Wykradnij dane z Cerbera i wróć. 0 wskazuje terminal, E pobiera, G sabotuje (3 komponenty na start).',
        target: -1,
    },
    escort: {
        name: 'Eskorta',
        detail: 'N wskazuje Keplera, E rozpoczyna eskortę. Zakończ badania i wróć do bazy.',
        target: 15,
    },
} as const;
export type SandboxScenario = keyof typeof SANDBOX_SCENARIOS;
export interface SandboxConfig extends ShipModules {
    hull: HullId;
    weapon: WeaponId;
    seed: number;
    scenario: SandboxScenario;
}
export const defaultSandboxConfig = (): SandboxConfig => ({
    hull: 'prospector',
    weapon: 'standard',
    engine: 0,
    handling: 0,
    cargo: 0,
    drill: 0,
    armor: 0,
    shield: 0,
    seed: 71,
    scenario: 'mining',
});
export function normalizeSandboxConfig(input: SandboxConfig): SandboxConfig {
    const fallback = defaultSandboxConfig();
    const result = {
        ...fallback,
        hull: Object.hasOwn(HULLS, input.hull) ? input.hull : fallback.hull,
        weapon: Object.hasOwn(WEAPONS, input.weapon) ? input.weapon : ('standard' as WeaponId),
        scenario: Object.hasOwn(SANDBOX_SCENARIOS, input.scenario)
            ? input.scenario
            : ('sector' as SandboxScenario),
        seed: Number.isFinite(input.seed) ? Math.trunc(input.seed) >>> 0 : 71,
    };
    for (const key of MODULE_KEYS)
        result[key] = Number.isFinite(input[key])
            ? Math.max(0, Math.min(3, Math.round(input[key])))
            : 0;
    return result;
}

function sandboxSector(config: SandboxConfig) {
    const sector = generateSector(config.seed),
        rng = random(config.seed ^ 0x61cc34);
    let spawn: Point = { x: 240, y: 0 };
    if (config.scenario === 'sector') return { sector, spawn };
    sector.fortress.guards = [];
    sector.enemies = [];
    sector.caches = [];
    if (config.scenario !== 'infiltration') sector.outpost.guards = [];
    if (config.scenario === 'mining') {
        spawn = { x: 1050, y: 0 };
        sector.rocks = Array.from(
            { length: 9 },
            (_, i): RockSpec => ({
                x: 1400 + (i % 3) * 190,
                y: (Math.floor(i / 3) - 1) * 210,
                radius: 35 + rng() * 15,
                rich: i % 3 === 1,
                crystal: i === 8,
                variant: Math.floor(rng() * 128),
                vx: (rng() - 0.5) * 8,
                vy: (rng() - 0.5) * 8,
            }),
        );
        Object.assign(sector.landmarks.find((l) => l.key === 2)!, {
            x: 1550,
            y: 0,
            name: 'Złoże testowe',
        });
    } else if (config.scenario === 'combat') {
        spawn = { x: 1400, y: 0 };
        sector.rocks = [];
        sector.enemies = [-1, 1].map((side, i) => ({
            id: 8001 + i,
            kind: 'patrol' as const,
            x: 2000,
            y: side * 190,
            home: { x: 1900, y: 0 },
            phase: Math.PI,
        }));
        Object.assign(sector.landmarks.find((l) => l.key === 2)!, {
            x: 2000,
            y: 0,
            name: 'Poligon bojowy',
        });
    } else if (config.scenario === 'salvage') {
        spawn = { x: 1040, y: 0 };
        sector.rocks = [
            {
                x: 1080,
                y: 340,
                radius: 48,
                rich: false,
                variant: Math.floor(rng() * 128),
                vx: 0,
                vy: 0,
            },
        ];
    } else if (config.scenario === 'infiltration') {
        spawn = { x: sector.outpost.x - 800, y: sector.outpost.y };
        sector.enemies = [...sector.outpost.guards];
        sector.rocks = sector.rocks.filter(
            (r) => Math.hypot(r.x - sector.outpost.x, r.y - sector.outpost.y) < 1400,
        );
    } else if (config.scenario === 'escort') {
        sector.rocks = sector.rocks.filter((r) => Math.hypot(r.x, r.y) < 4000);
    }
    sector.rocks = sector.rocks.filter(
        (r) => Math.hypot(r.x - spawn.x, r.y - spawn.y) > r.radius + 180,
    );
    return { sector, spawn };
}

export type SandboxOutcome = 'returned' | 'destroyed' | 'stopped' | 'restart';
export interface SandboxReport {
    config: SandboxConfig;
    outcome: SandboxOutcome;
    completed: boolean;
    seconds: number;
    hull: number;
    shield: number;
    kills: number;
    cargo: { ore: number; parts: number; crystals: number };
    deliveries: number;
    statistics: MissionSimulation['statistics'];
    performance?: FrameReport;
}

// This object cannot reference the player's campaign or save repository.
export class SandboxRun {
    readonly config: SandboxConfig;
    readonly campaign = newCampaign();
    readonly simulation: MissionSimulation;
    constructor(config: SandboxConfig) {
        this.config = normalizeSandboxConfig(config);
        const c = this.campaign,
            { sector, spawn } = sandboxSector(this.config);
        c.ship = newShip(1, this.config.hull);
        c.ship.weapon = this.config.weapon;
        c.ship.weapons = ['standard', 'pulse', 'rail'];
        for (const key of MODULE_KEYS) c.ship[key] = this.config[key];
        c.pilots = [newPilot(1, 3)];
        c.station = { workshop: 2, storage: 3 };
        c.repairKits = 3;
        c.contract = this.config.scenario === 'escort' ? 7 : 0;
        c.contractCompletions = c.contractCompletions.map(() => 1);
        if (this.config.scenario === 'salvage')
            c.recoverySignals = [
                {
                    id: 8802,
                    seed: this.config.seed,
                    x: 1420,
                    y: 180,
                    pilot: newPilot(2, 3),
                    ship: null,
                },
            ];
        if (!beginRun(c, this.config.seed, this.config.scenario === 'salvage' ? 8802 : null))
            throw new Error('Sandbox initialization failed');
        c.activeRun!.repairKits = 3;
        c.repairKits = 0;
        this.simulation = new MissionSimulation(c, this.config.seed, sector);
        const sim = this.simulation;
        if (this.config.scenario === 'infiltration') sim.cargo.parts = 3;
        sim.ship.setTranslation(
            { x: spawn.x / GAME.pixelsPerMeter, y: spawn.y / GAME.pixelsPerMeter },
            true,
        );
        sim.ship.setRotation(0, true);
        sim.previous = { ...spawn };
        sim.previousAngle = sim.ship.rotation();
        sim.aegis?.rebuild(spawn);
        if (this.config.scenario === 'salvage')
            sim.salvage.add(8801, 'patrol', { x: 1210, y: 0 }, { x: 0, y: 0 });
        sim.setNotice(SANDBOX_SCENARIOS[this.config.scenario].detail);
    }
    objectives(returned = false) {
        const s = this.simulation,
            deliveries = this.campaign.activeRun?.deliveries?.length ?? 0;
        const goals: { id: string; title: string; progress: string; complete: boolean }[] = [];
        if (this.config.scenario === 'mining')
            goals.push({
                id: 'sandbox-cargo',
                title: 'Ładunek',
                progress: `${s.cargoUsed}/10`,
                complete: s.cargoUsed >= 10,
            });
        if (this.config.scenario === 'combat')
            goals.push({
                id: 'kills',
                title: 'Drony',
                progress: `${s.enemyKills}/2`,
                complete: s.enemyKills >= 2,
            });
        if (this.config.scenario === 'salvage')
            goals.push({
                id: 'sandbox-delivery',
                title: 'Dostarczony hol',
                progress: `${deliveries}/1`,
                complete: deliveries > 0,
            });
        if (this.config.scenario === 'infiltration')
            goals.push({
                id: 'outpost',
                title: 'Dane Cerbera',
                progress: '',
                complete: s.surveyData.has('outpost'),
            });
        if (this.config.scenario === 'escort')
            goals.push({
                id: 'escort',
                title: 'Badania Keplera',
                progress: '',
                complete: s.escort?.state === 'complete',
            });
        if (this.config.scenario !== 'salvage')
            goals.push({
                id: 'return',
                title: 'Powrót do Aurory',
                progress: '',
                complete: returned,
            });
        return goals;
    }
    report(outcome: SandboxOutcome): SandboxReport {
        const s = this.simulation,
            deliveries = this.campaign.activeRun?.deliveries?.length ?? 0;
        const completed = this.objectives(outcome === 'returned').every((goal) => goal.complete);
        return {
            config: { ...this.config },
            outcome,
            completed,
            seconds: s.elapsed,
            hull: s.hull,
            shield: s.kineticShield.charge,
            kills: s.enemyKills,
            cargo: { ore: s.cargo.ore, parts: s.cargo.parts, crystals: s.cargo.crystals ?? 0 },
            deliveries,
            statistics: { ...s.statistics },
        };
    }
}
