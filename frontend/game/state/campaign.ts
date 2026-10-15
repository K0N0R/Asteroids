import {
    newStoryProgress,
    migrateStoryV1,
    migrateStoryV2,
    migrateStoryV3,
    migrateStoryV4,
    migrateStoryV5,
    migrateStoryV6,
    storyRadius,
    constructionManifest,
    validStory,
    STORY_SECTORS,
    recordStoryReturn,
    actOneComplete,
    type StoryProgress,
    type StorySectorId,
} from './story';
import { random } from '../worlds/sector';
import { MOON, moonDistance } from '../worlds/moon';
import { SALVAGE } from '../systems/salvage';
import { WEAPONS, type WeaponId } from '../config';
import {
    CONTRACTS,
    CREW,
    FLEET_LIMIT,
    GAME,
    HULLS,
    HullId,
    JOBS,
    PILOTS,
    PilotSkillId,
    RECOVERY,
    SCAN_SITES,
    ScanSiteId,
    UPGRADES,
    Upgrade,
} from '../config';
import { CrewState, newCrew, reservedResources } from './crew';
import { createRecoverySignal, RecoverySignal, recoveryDescription } from './recovery';
import { Point } from '../worlds/sector';
import { contractLockReason, contractReady } from './contracts';
import {
    awardPilotXp,
    clonePilot,
    expeditionXp,
    newPilot,
    PilotProgress,
    pilotProfile,
    pilotName,
    validPilotProgress,
} from './pilots';

export interface Cargo {
    ore: number;
    parts: number;
    crystals?: number;
}
export interface Pilot {
    id: number;
    archetype: number;
    xp: number;
    skills: Record<PilotSkillId, number>;
}
export type ShipModules = Record<
    'engine' | 'handling' | 'cargo' | 'drill' | 'armor' | 'shield',
    number
>;
export interface Ship extends ShipModules {
    id: number;
    hull: HullId;
    weapon: WeaponId;
    weapons: WeaponId[];
}
export interface SalvageDelivery {
    id: number;
    source: 'patrol' | 'lancer' | 'recovery';
    description: string;
    materials: Cargo;
    overflow: number;
    rescueXp: number;
}
export interface Campaign {
    version: 25;
    story: StoryProgress | null;
    bank: Cargo;
    ship: Ship | null;
    reserveShips: Ship[];
    nextShipId: number;
    recoverySignals: RecoverySignal[];
    station: { workshop: number; storage: number };
    pilots: Pilot[];
    selectedPilot: number;
    nextPilotId: number;
    activeRun: {
        pilotId: number;
        seed: number;
        contract: number;
        repairKits: number;
        recoveryId: number | null;
        lastPosition: Point;
        sector?: StorySectorId;
        area?: 'surface';
        /** Supplies loaded at departure that have not yet been delivered. */
        freight?: Cargo;
        deliveries?: SalvageDelivery[];
    } | null;
    crew: CrewState;
    repairKits: number;
    sorties: number;
    recovered: number;
    lostPilots: number;
    contract: number;
    contractCompletions: number[];
}

export interface RunResult {
    success: boolean;
    cargo: Cargo;
    pilotName: string;
    shipName: string;
    duration: number;
    reason: string;
    reward: Cargo;
    overflow: number;
    recoveryText: string;
    equipmentText: string;
    contractText: string;
    pilotProgress: PilotProgress | null;
    deliveries: SalvageDelivery[];
}

export const SAVE_KEY = 'asteroids.campaign.v1';
export const newShip = (id = 1, hull: HullId = 'prospector'): Ship => ({
    id,
    hull,
    weapon: 'standard',
    weapons: ['standard'],
    engine: 0,
    handling: 0,
    cargo: 0,
    drill: 0,
    armor: 0,
    shield: 0,
});
export function newCampaign(): Campaign {
    return {
        version: 25,
        story: null,
        bank: { ore: 0, parts: 0 },
        ship: newShip(),
        reserveShips: [],
        nextShipId: 2,
        recoverySignals: [],
        station: { workshop: 0, storage: 0 },
        pilots: [newPilot()],
        selectedPilot: 1,
        nextPilotId: 2,
        activeRun: null,
        crew: newCrew(),
        repairKits: 1,
        sorties: 0,
        recovered: 0,
        lostPilots: 0,
        contract: 0,
        contractCompletions: CONTRACTS.map(() => 0),
    };
}

const integer = (value: unknown, max = 1000000): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
const object = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
const cargo = (value: unknown): value is Cargo =>
    object(value) &&
    integer(value.ore) &&
    integer(value.parts) &&
    (value.crystals === undefined || integer(value.crystals));

export function parseCampaign(json: string | null): Campaign | null {
    try {
        const p: unknown = JSON.parse(json ?? 'null');
        if (
            !object(p) ||
            ![
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
                24, 25,
            ].includes(p.version as number) ||
            !cargo(p.bank) ||
            !object(p.station)
        )
            return null;
        if (!integer(p.station.workshop, 2) || !integer(p.station.storage, 3)) return null;
        if (
            p.ship !== null &&
            (!object(p.ship) ||
                !['engine', 'cargo', 'drill', 'armor'].every((k) =>
                    integer((p.ship as Record<string, unknown>)[k], 3),
                ))
        )
            return null;
        if (
            !Array.isArray(p.pilots) ||
            p.pilots.length > 8 ||
            !p.pilots.every(
                (v) => object(v) && integer(v.id) && v.id > 0 && integer(v.archetype, 3),
            )
        )
            return null;
        if (
            ![
                'selectedPilot',
                'nextPilotId',
                'sorties',
                'recovered',
                'lostPilots',
                'contract',
            ].every((k) => integer(p[k]))
        )
            return null;
        if (!integer(p.contract, CONTRACTS.length - 1) || (p.nextPilotId as number) < 1)
            return null;
        const ids = p.pilots.map((v) => v.id as number);
        if (new Set(ids).size !== ids.length || ids.some((id) => id >= (p.nextPilotId as number)))
            return null;
        if (ids.length && !ids.includes(p.selectedPilot as number)) return null;
        if (p.activeRun !== null) {
            if (
                !object(p.activeRun) ||
                !integer(p.activeRun.seed, 0xffffffff) ||
                !integer(p.activeRun.contract, CONTRACTS.length - 1) ||
                !ids.includes(p.activeRun.pilotId as number) ||
                p.ship === null
            )
                return null;
        }
        if (object(p.activeRun) && p.activeRun.deliveries !== undefined) {
            const deliveries = p.activeRun.deliveries;
            if (
                !Array.isArray(deliveries) ||
                deliveries.length > 64 ||
                !deliveries.every(
                    (d) =>
                        object(d) &&
                        typeof d.id === 'number' &&
                        Number.isInteger(d.id) &&
                        d.id !== 0 &&
                        Math.abs(d.id) <= 1000000 &&
                        ['patrol', 'lancer', 'recovery'].includes(d.source as string) &&
                        (d.source === 'recovery' ? d.id < 0 : d.id > 0) &&
                        typeof d.description === 'string' &&
                        d.description.length > 0 &&
                        d.description.length <= 200 &&
                        cargo(d.materials) &&
                        integer(d.overflow) &&
                        [0, 5, 15, 20].includes(d.rescueXp as number) &&
                        (d.source === 'recovery' || d.rescueXp === 0),
                )
            )
                return null;
            if (new Set(deliveries.map((d) => d.id)).size !== deliveries.length) return null;
        }
        if (p.version === 1) {
            p.version = 2;
            p.crew = newCrew();
            p.repairKits = p.sorties === 0 ? 1 : 0;
            if (object(p.activeRun)) p.activeRun.repairKits = 0;
        }
        if ((p.version as number) < 10 && object(p.crew)) p.crew.quartermaster = false;
        if ((p.version as number) < 16 && object(p.crew)) p.crew.mechanicAboard = false;
        if ((p.version as number) < 17 && object(p.crew)) p.crew.quartermasterAboard = false;
        if (
            !object(p.crew) ||
            typeof p.crew.mechanic !== 'boolean' ||
            typeof p.crew.mechanicAboard !== 'boolean' ||
            typeof p.crew.quartermaster !== 'boolean' ||
            typeof p.crew.quartermasterAboard !== 'boolean' ||
            !integer(p.repairKits, CREW.kitLimit) ||
            !integer(p.crew.completed) ||
            !integer(p.crew.nextJobId) ||
            p.crew.nextJobId < 1
        )
            return null;
        if (!Array.isArray(p.crew.jobs) || p.crew.jobs.length > CREW.queueLimit * 2) return null;
        for (const job of p.crew.jobs) {
            if (
                !object(job) ||
                !integer(job.id) ||
                job.id < 1 ||
                job.id >= p.crew.nextJobId ||
                typeof job.kind !== 'string' ||
                !Object.hasOwn(JOBS, job.kind)
            )
                return null;
            const recipe = JOBS[job.kind as keyof typeof JOBS];
            if (!p.crew[recipe.worker]) return null;
            if ('workshop' in recipe && p.station.workshop < recipe.workshop) return null;
            if (
                typeof job.remaining !== 'number' ||
                !Number.isFinite(job.remaining) ||
                job.remaining <= 0 ||
                job.remaining > recipe.seconds
            )
                return null;
        }
        for (const role of ['mechanic', 'quartermaster'] as const)
            if (
                p.crew.jobs.filter((job) => JOBS[job.kind as keyof typeof JOBS].worker === role)
                    .length > CREW.queueLimit
            )
                return null;
        if (new Set(p.crew.jobs.map((job) => job.id)).size !== p.crew.jobs.length) return null;
        if (
            p.crew.mechanicAboard &&
            (!p.crew.mechanic ||
                p.crew.jobs.some(
                    (job) => JOBS[job.kind as keyof typeof JOBS].worker === 'mechanic',
                ))
        )
            return null;
        if (
            p.activeRun !== null &&
            (!object(p.activeRun) || !integer(p.activeRun.repairKits, CREW.embarkKits))
        )
            return null;
        if (
            p.crew.quartermasterAboard &&
            (!p.crew.quartermaster ||
                p.crew.jobs.some(
                    (job) => JOBS[job.kind as keyof typeof JOBS].worker === 'quartermaster',
                ))
        )
            return null;
        if (p.version === 2) {
            p.version = 3;
            if (object(p.ship)) p.ship = { ...p.ship, id: 1, hull: 'prospector' };
            p.reserveShips = [];
            p.nextShipId = p.ship ? 2 : 1;
        }
        const validShip = (ship: unknown): ship is Ship =>
            object(ship) &&
            integer(ship.id) &&
            ship.id > 0 &&
            typeof ship.hull === 'string' &&
            Object.hasOwn(HULLS, ship.hull) &&
            ['engine', 'cargo', 'drill', 'armor'].every((key) => integer(ship[key], 3)) &&
            (((p.version as number) < 15 && ship.shield === undefined) ||
                integer(ship.shield, 3)) &&
            ((p.version as number) < 7 || integer(ship.handling, 3)) &&
            ((p.version as number) < 11 ||
                (typeof ship.weapon === 'string' &&
                    Object.hasOwn(WEAPONS, ship.weapon) &&
                    Array.isArray(ship.weapons) &&
                    ship.weapons.length <= 3 &&
                    ship.weapons.every((w) => typeof w === 'string' && Object.hasOwn(WEAPONS, w)) &&
                    new Set(ship.weapons).size === ship.weapons.length &&
                    ship.weapons.includes('standard') &&
                    ship.weapons.includes(ship.weapon)));
        if (
            (p.ship !== null && !validShip(p.ship)) ||
            !Array.isArray(p.reserveShips) ||
            !p.reserveShips.every(validShip) ||
            !integer(p.nextShipId) ||
            p.nextShipId < 1
        )
            return null;
        const ships = [...(p.ship ? [p.ship] : []), ...p.reserveShips] as Ship[];
        if (
            ships.length > FLEET_LIMIT ||
            new Set(ships.map((ship) => ship.id)).size !== ships.length ||
            ships.some((ship) => ship.id >= (p.nextShipId as number))
        )
            return null;
        if (p.version === 3) {
            p.version = 4;
            p.recoverySignals = [];
            if (object(p.activeRun)) {
                p.activeRun.recoveryId = null;
                p.activeRun.lastPosition = { x: 240, y: 0 };
            }
        }
        const validPoint = (point: unknown): point is Point =>
            object(point) &&
            ['x', 'y'].every(
                (key) =>
                    typeof point[key] === 'number' &&
                    Number.isFinite(point[key]) &&
                    Math.abs(point[key] as number) <= 1000000,
            );
        if (!Array.isArray(p.recoverySignals) || p.recoverySignals.length > RECOVERY.signalLimit)
            return null;
        const allShipIds = ships.map((ship) => ship.id);
        const allPilotIds = [...ids];
        for (const signal of p.recoverySignals) {
            if (
                !object(signal) ||
                !integer(signal.id) ||
                signal.id < 1 ||
                signal.id >= (p.nextShipId as number) ||
                !integer(signal.seed, 0xffffffff) ||
                !validPoint(signal) ||
                (signal.area !== undefined && signal.area !== 'surface') ||
                (signal.area === 'surface'
                    ? signal.seed !== STORY_SECTORS.lunar.seed ||
                      moonDistance(signal) > MOON.radius - 200
                    : Math.hypot(signal.x, signal.y) < 649 ||
                      Math.hypot(signal.x, signal.y) > GAME.sectorRadius - 299) ||
                (signal.ship === null && signal.pilot === null) ||
                (signal.ship !== null && (!validShip(signal.ship) || signal.ship.id !== signal.id))
            )
                return null;
            if (allShipIds.includes(signal.id)) return null;
            allShipIds.push(signal.id);
            if (signal.pilot !== null) {
                if (
                    !object(signal.pilot) ||
                    !integer(signal.pilot.id) ||
                    signal.pilot.id < 1 ||
                    signal.pilot.id >= (p.nextPilotId as number) ||
                    !integer(signal.pilot.archetype, 3) ||
                    allPilotIds.includes(signal.pilot.id)
                )
                    return null;
                allPilotIds.push(signal.pilot.id);
            }
        }
        if (allPilotIds.length > 8) return null;
        if (p.version === 4) {
            p.version = 5;
            p.contractCompletions = CONTRACTS.map(() => 0);
        }
        if (p.version === 5) {
            p.version = 6;
            p.pilots = p.pilots.map((pilot) => ({ ...pilot, xp: 0, skills: newPilot().skills }));
            for (const signal of p.recoverySignals) {
                if (object(signal.pilot))
                    signal.pilot = { ...signal.pilot, xp: 0, skills: newPilot().skills };
            }
        }
        if (
            !Array.isArray(p.pilots) ||
            !p.pilots.every(validPilotProgress) ||
            !p.recoverySignals.every(
                (signal) => signal.pilot === null || validPilotProgress(signal.pilot),
            )
        )
            return null;
        // v5-v7 had four contracts. Pad only a valid legacy journal, preserving all progress.
        if (
            (p.version as number) < 8 &&
            Array.isArray(p.contractCompletions) &&
            p.contractCompletions.length === 4 &&
            p.contractCompletions.every((count) => integer(count))
        )
            p.contractCompletions.push(0);
        if (
            (p.version as number) < 9 &&
            Array.isArray(p.contractCompletions) &&
            p.contractCompletions.length === 5 &&
            p.contractCompletions.every((count) => integer(count))
        )
            p.contractCompletions.push(0);
        if (
            (p.version as number) < 13 &&
            Array.isArray(p.contractCompletions) &&
            p.contractCompletions.length === 6 &&
            p.contractCompletions.every((count) => integer(count))
        )
            p.contractCompletions.push(0);
        if (
            (p.version as number) < 14 &&
            Array.isArray(p.contractCompletions) &&
            p.contractCompletions.length === 7 &&
            p.contractCompletions.every((count) => integer(count))
        )
            p.contractCompletions.push(0);
        if (
            !Array.isArray(p.contractCompletions) ||
            p.contractCompletions.length !== CONTRACTS.length ||
            !p.contractCompletions.every((count) => integer(count))
        )
            return null;
        if (p.activeRun !== null) {
            const run = p.activeRun as Record<string, unknown>;
            if (
                !validPoint(run.lastPosition) ||
                (run.recoveryId !== null &&
                    !p.recoverySignals.some(
                        (signal) => signal.id === run.recoveryId && signal.seed === run.seed,
                    ))
            )
                return null;
        }
        if (p.version === 6) {
            const migrate = (ship: any) => {
                if (!ship) return;
                ship.handling = 0;
                if (ship.hull === 'prospector') ship.hull = 'fighter';
            };
            migrate(p.ship);
            p.reserveShips.forEach(migrate);
            p.recoverySignals.forEach((signal) => migrate(signal.ship));
            p.version = 7;
        }
        if ((p.version as number) < 11) {
            const migrateWeapon = (ship: any) => {
                if (ship) {
                    ship.weapon = 'standard';
                    ship.weapons = ['standard'];
                }
            };
            migrateWeapon(p.ship);
            p.reserveShips.forEach(migrateWeapon);
            p.recoverySignals.forEach((signal) => migrateWeapon(signal.ship));
        }
        if ((p.version as number) < 15)
            for (const ship of [p.ship, ...p.reserveShips, ...p.recoverySignals.map((s) => s.ship)])
                if (ship) ship.shield ??= 0;
        if ((p.version as number) < 18) {
            for (const ship of [
                ...ships,
                ...p.recoverySignals.map((signal) => signal.ship).filter(Boolean),
            ] as Ship[])
                if (ship.hull === 'swift') ship.hull = 'widmo';
        }
        p.crew.mechanicAboard = false;
        p.crew.quartermasterAboard = false;
        if ((p.version as number) < 19) p.story = null;
        if ((p.version as number) < 20 && p.story)
            p.story = migrateStoryV1(p.story) as StoryProgress;
        if ((p.version as number) < 21 && p.story)
            p.story = migrateStoryV2(p.story) as StoryProgress;
        if ((p.version as number) < 22 && p.story)
            p.story = migrateStoryV3(p.story) as StoryProgress;
        if ((p.version as number) < 23 && p.story)
            p.story = migrateStoryV4(p.story) as StoryProgress;
        if ((p.version as number) < 24 && p.story)
            p.story = migrateStoryV5(p.story) as StoryProgress;
        if ((p.version as number) < 25 && p.story)
            p.story = migrateStoryV6(p.story) as StoryProgress;
        if (p.story !== null && !validStory(p.story)) return null;
        if (
            object(p.activeRun) &&
            p.activeRun.area !== undefined &&
            (p.activeRun.area !== 'surface' ||
                p.story?.sector !== 'lunar' ||
                !p.story.claimed.includes('lunar-survey'))
        )
            return null;
        const story = p.story as StoryProgress | null;
        if (
            p.recoverySignals.some(
                (s) => s.area === 'surface' && (!story || !story.claimed.includes('lunar-survey')),
            )
        )
            return null;
        if (p.story && object(p.activeRun) && p.activeRun.sector !== p.story.sector) return null;
        if (
            p.story &&
            object(p.activeRun) &&
            p.activeRun.seed !== STORY_SECTORS[p.story.sector].seed
        )
            return null;
        if (p.story?.claimed.includes('earth-workshop') && (p.station.workshop as number) < 1)
            return null;
        if (!p.story && object(p.activeRun) && p.activeRun.sector !== undefined) return null;
        p.version = 25;
        const campaign = p as unknown as Campaign;
        if (campaign.activeRun?.freight !== undefined) {
            const initial = campaign.activeRun.freight;
            if (
                !campaign.story ||
                campaign.story.sector !== 'lunar' ||
                !cargo(initial) ||
                initial.ore + initial.parts + (initial.crystals ?? 0) > capacity(campaign)
            )
                return null;
        }
        if (campaign.repairKits + (campaign.activeRun?.repairKits ?? 0) > CREW.kitLimit)
            return null;
        if (storageUsed(campaign) > storageCapacity(campaign)) return null;
        return campaign;
    } catch {
        return null;
    }
}

export function newStoryCampaign(): Campaign {
    return { ...newCampaign(), story: newStoryProgress() };
}
export function selectedPilot(c: Campaign) {
    const pilot = c.pilots.find((p) => p.id === c.selectedPilot);
    return pilot ? pilotProfile(pilot) : null;
}
export function capacity(c: Campaign) {
    return c.ship ? HULLS[c.ship.hull].cargo + c.ship.cargo * 15 : 0;
}
export function shipHealth(ship: Ship) {
    return HULLS[ship.hull].health + ship.armor * 25;
}
export function ownedShips(c: Campaign) {
    return [...(c.ship ? [c.ship] : []), ...c.reserveShips];
}
export function scrapRefund(ship: Ship): Cargo {
    let ore = HULLS[ship.hull].ore,
        parts = HULLS[ship.hull].parts;
    for (const key of ['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const) {
        const levels = (ship[key] * (ship[key] + 1)) / 2;
        ore += UPGRADES[key].ore * levels;
        parts += UPGRADES[key].parts * levels;
    }
    for (const weapon of ship.weapons) {
        ore += WEAPONS[weapon].ore;
        parts += WEAPONS[weapon].parts;
    }
    const crystals = (['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const).reduce(
        (sum, key) => sum + (ship[key] * (ship[key] - 1)) / 2,
        0,
    );
    return {
        ore: Math.floor(ore / 2),
        parts: Math.floor(parts / 2),
        ...(crystals >= 2 ? { crystals: Math.floor(crystals / 2) } : {}),
    };
}
export function canScrapShip(c: Campaign, id: number): boolean {
    if (c.activeRun) return false;
    const ship = c.reserveShips.find((ship) => ship.id === id);
    if (!ship) return false;
    const refund = scrapRefund(ship);
    return (
        storageUsed(c) + refund.ore + refund.parts + (refund.crystals ?? 0) <= storageCapacity(c)
    );
}
export function scrapShip(c: Campaign, id: number): boolean {
    if (!canScrapShip(c, id)) return false;
    const ship = c.reserveShips.find((ship) => ship.id === id)!;
    const refund = scrapRefund(ship);
    c.bank.ore += refund.ore;
    c.bank.parts += refund.parts;
    if (refund.crystals) c.bank.crystals = (c.bank.crystals ?? 0) + refund.crystals;
    c.reserveShips = c.reserveShips.filter((ship) => ship.id !== id);
    return true;
}
export function selectShip(c: Campaign, id: number): boolean {
    if (c.activeRun || c.ship?.id === id) return false;
    const index = c.reserveShips.findIndex((ship) => ship.id === id);
    if (index < 0) return false;
    const [selected] = c.reserveShips.splice(index, 1);
    if (c.ship) c.reserveShips.push(c.ship);
    c.ship = selected;
    return true;
}
export function storageCapacity(c: Campaign) {
    return 150 + c.station.storage * 100;
}
export function storageUsed(c: Campaign) {
    return c.bank.ore + c.bank.parts + (c.bank.crystals ?? 0) + reservedResources(c);
}
export function upgradePrice(c: Campaign, upgrade: Upgrade): Cargo {
    const level =
        upgrade === 'storage' || upgrade === 'workshop'
            ? c.station[upgrade]
            : (c.ship?.[upgrade] ?? 0);
    return {
        ore: UPGRADES[upgrade].ore * (level + 1),
        parts: UPGRADES[upgrade].parts * (level + 1),
        ...(level > 0 ? { crystals: upgrade === 'workshop' ? 2 : level } : {}),
    };
}
export function buyUpgrade(c: Campaign, upgrade: Upgrade): boolean {
    if (c.activeRun) return false;
    const station = upgrade === 'storage' || upgrade === 'workshop';
    if (!station && !c.ship) return false;
    const target = station ? c.station : c.ship!;
    const level = (target as Record<string, number>)[upgrade];
    const limit = upgrade === 'workshop' ? 2 : station ? 3 : c.station.workshop + 1;
    const price = upgradePrice(c, upgrade);
    if (
        level >= limit ||
        c.bank.ore < price.ore ||
        c.bank.parts < price.parts ||
        (c.bank.crystals ?? 0) < (price.crystals ?? 0)
    )
        return false;
    c.bank.ore -= price.ore;
    c.bank.parts -= price.parts;
    if (price.crystals) c.bank.crystals = (c.bank.crystals ?? 0) - price.crystals;
    (target as Record<string, number>)[upgrade]++;
    return true;
}
export function hirePilot(c: Campaign, archetype: number): boolean {
    if (c.activeRun || !integer(archetype, 2) || pilotSlots(c) >= 8 || c.bank.ore < 12)
        return false;
    c.bank.ore -= 12;
    const pilot = newPilot(c.nextPilotId++, archetype);
    c.pilots.push(pilot);
    c.selectedPilot = pilot.id;
    return true;
}
export function buyShip(c: Campaign, hull: HullId = 'prospector'): boolean {
    if (c.activeRun || !Object.hasOwn(HULLS, hull) || ownedShips(c).length >= FLEET_LIMIT)
        return false;
    const config = HULLS[hull];
    if ('salvageOnly' in config) return false;
    if (
        c.station.workshop < config.workshop ||
        c.bank.ore < config.ore ||
        c.bank.parts < config.parts
    )
        return false;
    c.bank.ore -= config.ore;
    c.bank.parts -= config.parts;
    if (c.ship) c.reserveShips.push(c.ship);
    c.ship = newShip(c.nextShipId++, hull);
    return true;
}
export function emergencyKit(c: Campaign): boolean {
    if (c.activeRun || (c.ship && c.pilots.length)) return false;
    if (!c.ship && c.reserveShips.length) c.ship = c.reserveShips.shift()!;
    // Only supply items that the player cannot afford. Paid replacements remain meaningful.
    if (!c.ship && c.bank.ore < HULLS.prospector.ore) c.ship = newShip(c.nextShipId++);
    if (!c.pilots.length && c.bank.ore < 12) {
        const pilot = newPilot(c.nextPilotId++, 3);
        c.pilots.push(pilot);
        c.selectedPilot = pilot.id;
    }
    return !!c.ship && c.pilots.length > 0;
}
export function pilotSlots(c: Campaign) {
    return c.pilots.length + c.recoverySignals.filter((signal) => signal.pilot).length;
}
export function beginRun(
    c: Campaign,
    seed: number,
    recoveryId: number | null = null,
    loadConstruction = false,
): boolean {
    if (
        c.activeRun ||
        !c.ship ||
        !selectedPilot(c) ||
        (!c.story && contractLockReason(c, c.contract))
    )
        return false;
    const signal = c.recoverySignals.find((signal) => signal.id === recoveryId);
    if (recoveryId !== null && !signal) return false;
    if (c.story && signal && signal.seed !== STORY_SECTORS[c.story.sector].seed) return false;
    const freight =
        loadConstruction && recoveryId === null ? constructionManifest(c) : { ore: 0, parts: 0 };
    if (loadConstruction && freight.ore + freight.parts <= 0) return false;
    c.bank.ore -= freight.ore;
    c.bank.parts -= freight.parts;
    c.crew.mechanicAboard = false;
    c.crew.quartermasterAboard = false;
    const repairKits = Math.min(c.repairKits, CREW.embarkKits);
    c.repairKits -= repairKits;
    c.activeRun = {
        pilotId: c.selectedPilot,
        seed: signal?.seed ?? (c.story ? STORY_SECTORS[c.story.sector].seed : seed >>> 0),
        contract: c.contract,
        repairKits,
        recoveryId,
        lastPosition: { x: 240, y: 0 },
        ...(c.story ? { sector: c.story.sector } : {}),
        ...(loadConstruction ? { freight } : {}),
    };
    c.sorties++;
    return true;
}
export function deliverSalvage(
    c: Campaign,
    id: number,
    source: SalvageDelivery['source'],
): SalvageDelivery | null {
    const active = c.activeRun;
    if (
        !active ||
        active.deliveries?.some((d) => d.id === id) ||
        (active.deliveries?.length ?? 0) >= 64
    )
        return null;
    let refund: Cargo = { ore: 0, parts: 0 },
        description = '',
        rescueXp = 0;
    if (source === 'recovery') {
        const signal = c.recoverySignals.find((s) => s.id === active.recoveryId && -s.id === id);
        if (!signal) return null;
        description = `Odzysk: ${recoveryDescription(signal)}`;
        if (signal.pilot) {
            c.pilots.push(clonePilot(signal.pilot));
            rescueXp += 15;
        }
        if (signal.ship) {
            rescueXp += 5;
            if (ownedShips(c).length < FLEET_LIMIT) c.reserveShips.push({ ...signal.ship });
            else refund = scrapRefund(signal.ship);
        }
        c.recoverySignals = c.recoverySignals.filter((s) => s.id !== signal.id);
        active.recoveryId = null;
    } else {
        if ((source !== 'patrol' && source !== 'lancer') || !integer(id) || id < 1) return null;
        const recipe = SALVAGE[source];
        refund = {
            ore: recipe.ore,
            parts: recipe.parts,
            ...(recipe.crystals ? { crystals: recipe.crystals } : {}),
        };
        description = `Wrak ${source === 'lancer' ? 'Lancer' : 'drona'} #${id}`;
        const rng = random(active.seed ^ Math.imul(id, 0x45d9f3b) ^ 0x16a4c2);
        const rebuild = rng() < 0.3;
        if (rebuild && ownedShips(c).length < FLEET_LIMIT) {
            const ship = newShip(c.nextShipId++, source === 'lancer' ? 'lancer' : 'raider');
            c.reserveShips.push(ship);
            description += ` · odbudowano ${HULLS[ship.hull].name} #${ship.id}`;
        } else {
            // Upgrade a docked reserve; never change the active ship's loadout mid-flight.
            const options = c.reserveShips.flatMap((ship) =>
                (['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const)
                    .filter((key) => ship[key] < Math.min(3, c.station.workshop + 1))
                    .map((key) => ({ ship, key })),
            );
            if (options.length) {
                const { ship, key } = options[Math.floor(rng() * options.length)];
                ship[key]++;
                description += ` · ${HULLS[ship.hull].name} #${ship.id}: ${UPGRADES[key].title} +1`;
            } else description += ' · brak wolnego kadłuba do modernizacji';
        }
    }
    const free = Math.max(0, storageCapacity(c) - storageUsed(c));
    const crystals = Math.min(free, refund.crystals ?? 0),
        parts = Math.min(free - crystals, refund.parts),
        ore = Math.min(free - crystals - parts, refund.ore);
    c.bank.ore += ore;
    c.bank.parts += parts;
    if (crystals) c.bank.crystals = (c.bank.crystals ?? 0) + crystals;
    const record: SalvageDelivery = {
        id,
        source,
        description,
        materials: { ore, parts, ...(crystals ? { crystals } : {}) },
        overflow: refund.ore + refund.parts + (refund.crystals ?? 0) - ore - parts - crystals,
        rescueXp,
    };
    (active.deliveries ??= []).push(record);
    return record;
}
export function finishRun(
    c: Campaign,
    success: boolean,
    collected: Cargo,
    duration: number,
    reason: string,
    unusedRepairKits = 0,
    recovery: {
        securedId?: number;
        destroyedRecoveryId?: number;
        wreckVisited?: boolean;
        assaultWon?: boolean;
        venusDefenseWon?: boolean;
        patrolKills?: number;
        recycledWreck?: 'patrol' | 'lancer';
        lossPosition?: Point;
        data?: readonly ScanSiteId[];
        kills?: number;
        equipment?: WeaponId;
    } = {},
): RunResult | null {
    const active = c.activeRun;
    if (!active) return null;
    const pilot = c.pilots.find((p) => p.id === active.pilotId)!;
    const result: RunResult = {
        success,
        cargo: { ...collected },
        pilotName: pilotName(pilot),
        shipName: HULLS[c.ship!.hull].name,
        duration,
        reason,
        reward: { ore: 0, parts: 0 },
        overflow: 0,
        recoveryText: '',
        equipmentText: '',
        contractText: c.story
            ? success
                ? 'Postęp sektora zachowany.'
                : 'Dane i ładunek wyprawy przepadły. Wcześniejszy postęp zadań pozostaje.'
            : success
              ? 'Cel kontraktu nie został wykonany.'
              : 'Kontrakt nie został rozliczony. Dane wyprawy przepadły.',
        pilotProgress: null,
        deliveries: (active.deliveries ?? []).map((d) => ({ ...d, materials: { ...d.materials } })),
    };
    const destroyed = c.recoverySignals.find(
        (signal) => signal.id === active.recoveryId && signal.id === recovery.destroyedRecoveryId,
    );
    if (destroyed) {
        if (destroyed.pilot) c.lostPilots++;
        c.recoverySignals = c.recoverySignals.filter((signal) => signal.id !== destroyed.id);
        result.recoveryText = 'Holowany cel ratunkowy został zniszczony. ';
    }
    if (success) {
        const signal = c.recoverySignals.find((signal) => signal.id === active.recoveryId);
        if (signal && recovery.securedId === signal.id) {
            let salvage: Cargo = { ore: 0, parts: 0 };
            if (signal.pilot) c.pilots.push(clonePilot(signal.pilot));
            if (signal.ship) {
                if (ownedShips(c).length < FLEET_LIMIT) c.reserveShips.push({ ...signal.ship });
                else salvage = scrapRefund(signal.ship);
            }
            c.recoverySignals = c.recoverySignals.filter((s) => s.id !== signal.id);
            result.recoveryText = `Odzysk zabezpieczony: ${recoveryDescription(signal)}.`;
            if (salvage.ore || salvage.parts)
                result.recoveryText =
                    (signal.pilot ? `Uratowano ${pilotName(signal.pilot)}. ` : '') +
                    'Hangar pełny: wrak rozebrano na materiały.';
            result.reward.ore += salvage.ore;
            result.reward.parts += salvage.parts;
            if (salvage.crystals) result.reward.crystals = salvage.crystals;
        } else if (signal)
            result.recoveryText = 'Nie podjęto celu ratunkowego. Sygnał pozostaje dostępny.';
        const recycled = recovery.recycledWreck;
        if (recycled === 'patrol' || recycled === 'lancer') {
            const refund = SALVAGE[recycled];
            result.reward.ore += refund.ore;
            result.reward.parts += refund.parts;
            if (refund.crystals)
                result.reward.crystals = (result.reward.crystals ?? 0) + refund.crystals;
            result.recoveryText += `Recykling wraku ${recycled === 'lancer' ? 'Lancer' : 'drona'}: ${refund.ore} rudy / ${refund.parts} komponentów${refund.crystals ? ' / 1 kryształ' : ''}.`;
        }
        const contract = CONTRACTS[active.contract];
        const data = (recovery.data ?? []).filter((site) => Object.hasOwn(SCAN_SITES, site));
        const equipment = recovery.equipment;
        if (
            equipment &&
            equipment !== 'standard' &&
            Object.hasOwn(WEAPONS, equipment) &&
            data.includes('outpost')
        ) {
            const weapon = WEAPONS[equipment];
            if (c.ship!.weapons.includes(equipment)) {
                result.reward.ore += Math.floor(weapon.ore / 2);
                result.reward.parts += Math.floor(weapon.parts / 2);
                result.equipmentText = `Duplikat ${weapon.name} rozebrano: ${Math.floor(weapon.ore / 2)} rudy / ${Math.floor(weapon.parts / 2)} komponentów.`;
            } else {
                c.ship!.weapons.push(equipment);
                result.equipmentText = `Odzyskano ${weapon.name} · dostępne w Hangar → Uzbrojenie.`;
            }
        }
        const kills =
            Number.isInteger(recovery.kills) && (recovery.kills ?? 0) >= 0 ? recovery.kills! : 0;
        if (!c.story && contractReady(active.contract, collected, data, kills)) {
            result.reward.ore += contract.rewardOre;
            result.reward.parts += contract.rewardParts;
            c.contractCompletions[active.contract]++;
            result.contractText = `✓ ${contract.title} · kontrakt rozliczony`;
        }
        result.pilotProgress = awardPilotXp(
            pilot,
            Math.min(
                50,
                expeditionXp(
                    active.freight
                        ? {
                              ore: Math.max(0, collected.ore - active.freight.ore),
                              parts: Math.max(0, collected.parts - active.freight.parts),
                              crystals: collected.crystals,
                          }
                        : collected,
                    data,
                    !c.story && contractReady(active.contract, collected, data, kills),
                    signal && recovery.securedId === signal.id ? signal : null,
                    kills,
                ) + (active.deliveries ?? []).reduce((sum, d) => sum + d.rescueXp, 0),
            ),
        );
        const free = Math.max(0, storageCapacity(c) - storageUsed(c));
        c.repairKits += Math.max(0, Math.min(active.repairKits, Math.floor(unusedRepairKits)));
        const crystals = Math.min(free, (collected.crystals ?? 0) + (result.reward.crystals ?? 0));
        const parts = Math.min(free - crystals, collected.parts + result.reward.parts);
        const ore = Math.min(free - crystals - parts, collected.ore + result.reward.ore);
        c.bank.ore += ore;
        c.bank.parts += parts;
        if (crystals) c.bank.crystals = (c.bank.crystals ?? 0) + crystals;
        result.overflow =
            collected.ore +
            collected.parts +
            (collected.crystals ?? 0) +
            result.reward.ore +
            result.reward.parts +
            (result.reward.crystals ?? 0) -
            ore -
            parts -
            crystals;
        c.recovered++;
        if (active.sector && c.story) {
            const closingAct = !c.story.claimed.includes('lunar-attack');
            const closingBelt = active.sector === 'mars' && !c.story.claimed.includes('mars-belt');
            const change = recordStoryReturn(
                c,
                active.sector,
                data,
                !!recovery.wreckVisited,
                !!recovery.assaultWon,
                recovery.patrolKills ?? 0,
                !!recovery.venusDefenseWon,
            );
            if (change) {
                result.reward.ore += change.reward.ore;
                result.reward.parts += change.reward.parts;
                result.overflow += change.overflow;
                if (closingAct && actOneComplete(c.story))
                    result.reason =
                        'Akt I ukończony. Stacja księżycowa obroniona. Następny kierunek: Mars.';
                if (closingBelt && c.story.claimed.includes('mars-belt'))
                    result.reason =
                        'Pas asteroid blokuje pościg. Dalszy przelot wymaga nowej technologii.';
                result.contractText = change.titles.length
                    ? `Zadania ukończone: ${change.titles.join(' · ')}`
                    : 'Postęp sektora zachowany. Surowce możesz przekazać w panelu wyprawy.';
            }
        }
    } else {
        const target = c.recoverySignals.find((signal) => signal.id === active.recoveryId);
        if (target) {
            if (target.pilot) c.lostPilots++;
            c.recoverySignals = c.recoverySignals.filter((signal) => signal.id !== target.id);
            result.recoveryText = 'Cel poprzedniej akcji ratunkowej został utracony. ';
        }
        const loss = recovery.lossPosition ?? active.lastPosition;
        const signal = createRecoverySignal(
            c.ship!,
            pilot,
            active.seed,
            active.area === 'surface'
                ? { x: loss.x - MOON.center.x, y: loss.y - MOON.center.y }
                : loss,
        );
        if (signal) {
            if (active.area === 'surface') {
                const distance = Math.hypot(signal.x, signal.y);
                const scale = Math.min(1, (MOON.radius - 200) / distance);
                signal.x = MOON.center.x + signal.x * scale;
                signal.y = MOON.center.y + signal.y * scale;
                signal.area = 'surface';
            } else if (c.story) {
                const limit = storyRadius(c.story) - 200;
                const scale = Math.min(1, limit / Math.hypot(signal.x, signal.y));
                signal.x *= scale;
                signal.y *= scale;
            }
            c.recoverySignals.push(signal);
            result.recoveryText +=
                'Nowy sygnał ratunkowy w bazie: ' + recoveryDescription(signal) + '.';
            if (c.recoverySignals.length > RECOVERY.signalLimit) {
                const expired = c.recoverySignals.shift()!;
                if (expired.pilot) c.lostPilots++;
                result.recoveryText += ' Najstarszy sygnał wygasł (limit 3).';
            }
        } else result.recoveryText += 'Brak sygnału kapsuły lub wraku. Strata jest trwała.';
        c.pilots = c.pilots.filter((p) => p.id !== active.pilotId);
        c.selectedPilot = c.pilots[0]?.id ?? 0;
        c.ship = null;
        if (!signal?.pilot) c.lostPilots++;
    }
    c.activeRun = null;
    return result;
}

export class SaveRepository {
    warning = '';
    constructor(
        private storage: Pick<Storage, 'getItem' | 'setItem'>,
        private options: { key?: string; create?: () => Campaign } = {},
    ) {}
    private fresh() {
        return this.options.create?.() ?? newCampaign();
    }
    load() {
        try {
            const json = this.storage.getItem(this.options.key ?? SAVE_KEY);
            const campaign = parseCampaign(json);
            if (json && !campaign) this.warning = 'Nieprawidłowy zapis. Uruchomiono nową kampanię.';
            return campaign ?? this.fresh();
        } catch {
            this.warning = 'Zapis lokalny jest niedostępny. Kampania działa w tej sesji.';
            return this.fresh();
        }
    }
    save(campaign: Campaign): boolean {
        try {
            this.storage.setItem(this.options.key ?? SAVE_KEY, JSON.stringify(campaign));
            return true;
        } catch {
            this.warning = 'Nie udało się zapisać. Postęp pozostaje w tej sesji.';
            return false;
        }
    }
}
