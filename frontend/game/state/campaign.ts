import { installStationProject, stationProjectCost } from './stationProgression';
import { cargoCapacity } from '../config';
import { nearestMarsOrbit } from '../worlds/marsLayout';
import {
    packLunarShipment,
    lunarShipmentPending,
    lunarShipmentLock,
    type LunarShipment,
} from './lunarShipment';
import { SATELLITES } from '../worlds/earthSystem';
import { recordSatelliteDelivery } from './story';
import { inEarthSystem } from '../worlds/moon';
import { marsSurfaceAt, nearestMarsSurface } from '../worlds/marsMoons';
import { phobosOrbitSecured } from './marsAct';
import { WORKSHOP_CONSTRUCTION } from './stationConstruction';
import { moduleParts, WEAPON_PARTS, spendEquipment } from './equipmentCosts';
import { HULL_CONSTRUCTION, hasHullParts } from './fleetConstruction';
import { RESOURCE_IDS, STORAGE_PRIORITY, resourceTotal, type ResourceStore } from './resources';
import { receiveStationCargo } from './earthLogistics';
import { STATION_DRONES, type StationDroneState } from './stationDrones';
import { hullUnlocked } from './fleetUnlocks';
import { selectableMission, missionObjectiveMet, type MissionOrder } from './missionOrders';
import {
    syncStory,
    newStoryProgress,
    STORY_TASKS,
    storyRadius,
    constructionManifest,
    validStory,
    STORY_SECTORS,
    recordStoryReturn,
    actOneComplete,
    beltTechnologyReady,
    beltPassageReady,
    storySectorComplete,
    type StoryProgress,
    type StorySectorId,
} from './story';
import { random } from '../worlds/sector';
import { MOON, moonDistance } from '../worlds/moon';
import { SALVAGE } from '../systems/salvage';
import { WEAPONS, type WeaponId } from '../config';
import {
    CONTRACTS,
    REPAIR_KITS,
    FLEET_LIMIT,
    GAME,
    HULLS,
    HullId,
    PILOTS,
    PilotSkillId,
    RECOVERY,
    SCAN_SITES,
    ScanSiteId,
    UPGRADES,
    Upgrade,
} from '../config';
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
    pilotLevel,
    pilotPoints,
    pilotName,
    validPilotProgress,
} from './pilots';

export interface Cargo extends ResourceStore {
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
    source: 'patrol' | 'lancer' | 'satellite' | 'recovery';
    description: string;
    materials: Cargo;
    overflow: number;
    rescueXp: number;
}
export interface Campaign {
    version: 67;
    story: StoryProgress | null;
    bank: Cargo;
    lunarStation: { bank: Cargo };
    lunarShipment: LunarShipment | null;
    ship: Ship | null;
    reserveShips: Ship[];
    nextShipId: number;
    recoverySignals: RecoverySignal[];
    magneticRelays: number[];
    nextSalvageId: number;
    worldSalvage: {
        id: number;
        seed: number;
        x: number;
        y: number;
        source: 'patrol' | 'lancer' | 'satellite';
        area?: 'surface';
    }[];
    rescueSites: Partial<
        Record<'lunar-rescue' | 'jupiter-recovery', Point & { stabilized: boolean; health: number }>
    >;
    station: {
        workshopLevel: number;
        laboratoryLevel: number;
        extraction: boolean;
        anomalySampleDelivered: boolean;
        storage: number;
        cargoBays?: number;
        shield: boolean;
        shieldLevel: number;
        reinforcedBays: number;
        sentries: StationDroneState[] | null;
    };
    pilots: Pilot[];
    selectedPilot: number;
    nextPilotId: number;
    activeRun: {
        /** A recorded renderer failure must not be settled as a ship/pilot loss on reload. */
        technicalInterruption?: boolean;
        mission?: MissionOrder;
        pilotId: number;
        seed: number;
        contract: number;
        recoveryId: number | null;
        lastPosition: Point;
        sector?: StorySectorId;
        area?: 'surface';
        /** Supplies loaded at departure that have not yet been delivered. */
        freight?: Cargo;
        lunarShipment?: number;
        /** Mined cargo already delivered during this sortie; XP only, never deposit twice. */
        unloaded?: Cargo;
        /** Cumulative patrol kills acknowledged during this sortie. */
        reportedPatrolKills?: number;
        /** Boss bonus earned by an acknowledged victory, paid with pilot XP on return. */
        reportedBossXp?: 12 | 18;
        questXp?: number;
        deliveries?: SalvageDelivery[];
    } | null;
    repairKits: number;
    sorties: number;
    recovered: number;
    lostPilots: number;
    contract: number;
    contractCompletions: number[];
}

export interface RunResult {
    aborted?: boolean;
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
        version: 67,
        story: null,
        bank: { ore: 0, parts: 0 },
        lunarStation: { bank: { ore: 0, parts: 0 } },
        lunarShipment: null,
        ship: newShip(),
        reserveShips: [],
        nextShipId: 2,
        recoverySignals: [],
        nextSalvageId: 100000,
        worldSalvage: [],
        rescueSites: {},
        magneticRelays: [],
        station: {
            workshopLevel: 0,
            laboratoryLevel: 0,
            extraction: false,
            anomalySampleDelivered: false,
            storage: 0,
            shield: false,
            shieldLevel: 0,
            reinforcedBays: 0,
            sentries: null,
        },
        pilots: [newPilot()],
        selectedPilot: 1,
        nextPilotId: 2,
        activeRun: null,
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
    integer(value.ore, Number.MAX_SAFE_INTEGER) &&
    integer(value.parts, Number.MAX_SAFE_INTEGER) &&
    RESOURCE_IDS.every(
        (id) => value[id] === undefined || integer(value[id], Number.MAX_SAFE_INTEGER),
    ) &&
    Object.keys(value).every((key) => RESOURCE_IDS.some((id) => id === key));

export function parseCampaign(json: string | null): Campaign | null {
    try {
        const p: unknown = JSON.parse(json ?? 'null');
        if (!object(p) || p.version !== 67 || !cargo(p.bank) || !object(p.station)) return null;
        // Starter hulls are destroyed on signal loss; keep any independently surviving capsule.
        // Apply the same rule to old beacons so saved wrecks cannot fund repeated free starters.
        if (Array.isArray(p.recoverySignals)) {
            const removed = new Set<unknown>();
            p.recoverySignals = p.recoverySignals.filter((signal: unknown) => {
                if (!object(signal)) return true;
                if (object(signal.ship) && signal.ship.hull === 'prospector') {
                    signal.ship = null;
                    if (!signal.pilot) removed.add(signal.id);
                    return !!signal.pilot;
                }
                return true;
            });
            if (object(p.activeRun) && removed.has(p.activeRun.recoveryId))
                p.activeRun.recoveryId = null;
        }
        if (!object(p.lunarStation) || !cargo(p.lunarStation.bank)) return null;
        if (
            !integer(p.station.workshopLevel, 3) ||
            !integer(p.station.laboratoryLevel, 3) ||
            (p.station.workshopLevel as number) > (p.station.laboratoryLevel as number) ||
            (p.station.laboratoryLevel as number) > (p.station.workshopLevel as number) + 1 ||
            typeof p.station.extraction !== 'boolean' ||
            typeof p.station.anomalySampleDelivered !== 'boolean' ||
            !integer(p.station.storage, 3) ||
            (p.station.cargoBays !== undefined && !integer(p.station.cargoBays, 3)) ||
            typeof p.station.shield !== 'boolean' ||
            !integer(p.station.shieldLevel, 2) ||
            !integer(p.station.reinforcedBays, 2) ||
            ((p.station.shieldLevel as number) > 0 && !p.station.shield)
        )
            return null;
        if (
            p.station.sentries !== null &&
            (!Array.isArray(p.station.sentries) ||
                p.station.sentries.length !== STATION_DRONES.count ||
                !p.station.sentries.every(
                    (drone) =>
                        object(drone) &&
                        typeof drone.hull === 'number' &&
                        Number.isFinite(drone.hull) &&
                        drone.hull >= 0 &&
                        drone.hull <= STATION_DRONES.hull &&
                        typeof drone.rebuildRemaining === 'number' &&
                        Number.isFinite(drone.rebuildRemaining) &&
                        drone.rebuildRemaining >= 0 &&
                        drone.rebuildRemaining <= STATION_DRONES.rebuildSeconds &&
                        (drone.hull === 0 || drone.rebuildRemaining === 0),
                ))
        )
            return null;
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
                (p.activeRun.technicalInterruption !== undefined &&
                    typeof p.activeRun.technicalInterruption !== 'boolean') ||
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
                        ['patrol', 'lancer', 'satellite', 'recovery'].includes(
                            d.source as string,
                        ) &&
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
        if (
            object(p.activeRun) &&
            p.activeRun.unloaded !== undefined &&
            (!['earth', 'lunar', 'mars', 'venus'].includes(p.activeRun.sector as string) ||
                !cargo(p.activeRun.unloaded))
        )
            return null;
        if (
            object(p.activeRun) &&
            ((p.activeRun.questXp !== undefined &&
                (!p.story || !integer(p.activeRun.questXp, 35))) ||
                (p.activeRun.reportedPatrolKills !== undefined &&
                    (!p.story || !integer(p.activeRun.reportedPatrolKills))) ||
                (p.activeRun.reportedBossXp !== undefined &&
                    !(
                        (p.activeRun.sector === 'neptune' && p.activeRun.reportedBossXp === 12) ||
                        (p.activeRun.sector === 'pluto' && p.activeRun.reportedBossXp === 18)
                    )))
        )
            return null;
        if (!integer(p.repairKits, REPAIR_KITS.kitLimit)) return null;

        const validShip = (ship: unknown): ship is Ship =>
            object(ship) &&
            integer(ship.id) &&
            ship.id > 0 &&
            typeof ship.hull === 'string' &&
            Object.hasOwn(HULLS, ship.hull) &&
            ['engine', 'cargo', 'drill', 'armor'].every((key) => integer(ship[key], 3)) &&
            integer(ship.shield, 3) &&
            integer(ship.handling, 3) &&
            typeof ship.weapon === 'string' &&
            Object.hasOwn(WEAPONS, ship.weapon) &&
            Array.isArray(ship.weapons) &&
            ship.weapons.length <= 3 &&
            ship.weapons.every((w) => typeof w === 'string' && Object.hasOwn(WEAPONS, w)) &&
            new Set(ship.weapons).size === ship.weapons.length &&
            ship.weapons.includes('standard') &&
            ship.weapons.includes(ship.weapon) &&
            (ship.hull !== 'prospector' ||
                (['engine', 'cargo', 'drill', 'armor', 'shield', 'handling'].every(
                    (key) => ship[key] === 0,
                ) &&
                    ship.weapon === 'standard' &&
                    ship.weapons.length === 1));
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
        const validPoint = (point: unknown): point is Point =>
            object(point) &&
            ['x', 'y'].every(
                (key) =>
                    typeof point[key] === 'number' &&
                    Number.isFinite(point[key]) &&
                    Math.abs(point[key] as number) <= 1000000,
            );
        if (
            p.lunarShipment !== null &&
            (!object(p.lunarShipment) ||
                !validPoint(p.lunarShipment) ||
                !integer(p.lunarShipment.id) ||
                p.lunarShipment.id < 100000 ||
                p.lunarShipment.id >= (p.nextSalvageId as number) ||
                (p.lunarShipment.area !== undefined && p.lunarShipment.area !== 'surface') ||
                !(p.story as StoryProgress | null)?.claimed.includes('lunar-survey') ||
                (p.story as StoryProgress | null)?.claimed.includes('lunar-equipment'))
        )
            return null;
        if (
            object(p.activeRun) &&
            p.activeRun.lunarShipment !== undefined &&
            (!integer(p.activeRun.lunarShipment) ||
                !object(p.lunarShipment) ||
                p.activeRun.lunarShipment !== p.lunarShipment.id)
        )
            return null;
        if (
            !Array.isArray(p.magneticRelays) ||
            !p.magneticRelays.every((id) => integer(id, 2)) ||
            new Set(p.magneticRelays).size !== p.magneticRelays.length ||
            !integer(p.nextSalvageId) ||
            (p.nextSalvageId as number) < 100000 ||
            !Array.isArray(p.worldSalvage) ||
            !object(p.rescueSites) ||
            !p.worldSalvage.every(
                (item) =>
                    object(item) &&
                    integer(item.id) &&
                    item.id >= 100000 &&
                    item.id < (p.nextSalvageId as number) &&
                    integer(item.seed, 0xffffffff) &&
                    validPoint(item) &&
                    ['patrol', 'lancer', 'satellite'].includes(item.source as string) &&
                    (item.area === undefined || item.area === 'surface'),
            ) ||
            new Set(p.worldSalvage.map((item) => item.id)).size !== p.worldSalvage.length ||
            !Object.entries(p.rescueSites).every(
                ([key, item]) =>
                    ['lunar-rescue', 'jupiter-recovery'].includes(key) &&
                    object(item) &&
                    validPoint(item) &&
                    typeof item.stabilized === 'boolean' &&
                    typeof item.health === 'number' &&
                    item.health >= 1 &&
                    item.health <= 120,
            )
        )
            return null;
        if (!Array.isArray(p.recoverySignals) || p.recoverySignals.length > RECOVERY.signalLimit)
            return null;
        if (p.story !== null && !validStory(p.story)) return null;
        const allShipIds = ships.map((ship) => ship.id);
        const allPilotIds = [...ids];
        for (const signal of p.recoverySignals) {
            const sectorId = (Object.keys(STORY_SECTORS) as StorySectorId[]).find(
                (id) => STORY_SECTORS[id].seed === signal?.seed,
            );
            const signalRadius =
                p.story && sectorId
                    ? Math.max(GAME.sectorRadius, storyRadius({ ...p.story, sector: sectorId }))
                    : GAME.sectorRadius;
            if (
                !object(signal) ||
                !integer(signal.id) ||
                signal.id < 1 ||
                signal.id >= (p.nextShipId as number) ||
                !integer(signal.seed, 0xffffffff) ||
                !validPoint(signal) ||
                (signal.area !== undefined && signal.area !== 'surface') ||
                (signal.area === 'surface'
                    ? signal.seed === STORY_SECTORS.mars.seed
                        ? !marsSurfaceAt(signal) ||
                          Math.hypot(
                              signal.x - nearestMarsSurface(signal).center.x,
                              signal.y - nearestMarsSurface(signal).center.y,
                          ) >
                              nearestMarsSurface(signal).radius - 200
                        : (signal.seed !== STORY_SECTORS.lunar.seed &&
                              signal.seed !== STORY_SECTORS.earth.seed) ||
                          moonDistance(signal) > MOON.radius - 200
                    : signal.seed === STORY_SECTORS.mars.seed
                      ? Math.hypot(
                            signal.x - nearestMarsOrbit(signal).center.x,
                            signal.y - nearestMarsOrbit(signal).center.y,
                        ) >
                        nearestMarsOrbit(signal).radius - 200
                      : Math.hypot(signal.x, signal.y) > signalRadius - 200) ||
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
        if (
            !Array.isArray(p.pilots) ||
            !p.pilots.every(validPilotProgress) ||
            !p.recoverySignals.every(
                (signal) => signal.pilot === null || validPilotProgress(signal.pilot),
            )
        )
            return null;
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
        if (
            object(p.activeRun) &&
            p.activeRun.area !== undefined &&
            (p.activeRun.area !== 'surface' ||
                (p.story?.sector === 'mars'
                    ? nearestMarsSurface(p.activeRun.lastPosition as Point).id === 'phobos' &&
                      !phobosOrbitSecured(p.story) &&
                      !beltTechnologyReady(p.story)
                    : !inEarthSystem(p.story?.sector) || !p.story.claimed.includes('lunar-survey')))
        )
            return null;
        const story = p.story as StoryProgress | null;
        if (
            p.recoverySignals.some(
                (s) =>
                    s.area === 'surface' &&
                    (s.seed === STORY_SECTORS.mars.seed
                        ? !story ||
                          (nearestMarsSurface(s).id === 'phobos' &&
                              !phobosOrbitSecured(story) &&
                              !beltTechnologyReady(story))
                        : !story || !story.claimed.includes('lunar-survey')),
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
        if (p.story?.claimed.includes('earth-workshop') && (p.station.workshopLevel as number) < 1)
            return null;
        if (!p.story && object(p.activeRun) && p.activeRun.sector !== undefined) return null;
        if (object(p.activeRun) && p.activeRun.mission !== undefined) {
            const order = p.activeRun.mission;
            if (
                !object(order) ||
                typeof order.task !== 'string' ||
                typeof order.aborted !== 'boolean' ||
                p.activeRun.recoveryId !== null ||
                !selectableMission(p as unknown as Campaign, order.task, true)
            )
                return null;
        }
        const campaign = p as unknown as Campaign;
        if (campaign.activeRun?.freight !== undefined) {
            const initial = campaign.activeRun.freight;
            if (!cargo(initial) || resourceTotal(initial) > capacity(campaign)) return null;
        }
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
    return c.ship ? cargoCapacity(c.ship.hull, c.ship.cargo) : 0;
}
export function shipHealth(ship: Ship) {
    return HULLS[ship.hull].health + ship.armor * 25;
}
export function ownedShips(c: Campaign) {
    return [...(c.ship ? [c.ship] : []), ...c.reserveShips];
}
export function scrapRefund(ship: Ship): Cargo {
    if (ship.hull === 'prospector') return { ore: 0, parts: 0 };
    const spent: Cargo = { ore: 0, parts: 0, ...HULL_CONSTRUCTION[ship.hull] };
    for (const key of ['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const) {
        for (let level = 0; level < ship[key]; level++) {
            const bill = moduleParts(key, level);
            for (const id of RESOURCE_IDS) spent[id] = (spent[id] ?? 0) + (bill[id] ?? 0);
        }
    }
    for (const weapon of ship.weapons) {
        const bill: ResourceStore = WEAPON_PARTS[weapon];
        for (const id of RESOURCE_IDS) spent[id] = (spent[id] ?? 0) + (bill[id] ?? 0);
    }
    const refund: Cargo = { ore: 0, parts: 0 };
    for (const id of RESOURCE_IDS) {
        const count = Math.floor((spent[id] ?? 0) / 2);
        if (count) refund[id] = count;
    }
    return refund;
}
export function canScrapShip(c: Campaign, id: number): boolean {
    if (c.activeRun) return false;
    const ship = c.reserveShips.find((ship) => ship.id === id);
    if (!ship) return false;
    const refund = scrapRefund(ship);
    return RESOURCE_IDS.every((id) => Number.isSafeInteger((c.bank[id] ?? 0) + (refund[id] ?? 0)));
}
export function scrapShip(c: Campaign, id: number): boolean {
    if (!canScrapShip(c, id)) return false;
    const ship = c.reserveShips.find((ship) => ship.id === id)!;
    const refund = scrapRefund(ship);
    for (const id of RESOURCE_IDS) if (refund[id]) c.bank[id] = (c.bank[id] ?? 0) + refund[id]!;
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
/** Computed only, never serialized. Station storage has no gameplay capacity. */
export function storageCapacity(_c: Campaign) {
    return Number.POSITIVE_INFINITY;
}
export function storageUsed(c: Campaign) {
    return resourceTotal(c.bank);
}
export function upgradePrice(c: Campaign, upgrade: Upgrade): Cargo {
    if (upgrade !== 'workshop' && upgrade !== 'storage')
        return { ore: 0, parts: 0, ...moduleParts(upgrade, c.ship?.[upgrade] ?? 0) };
    return {
        ore: 0,
        parts: 0,
        ...(upgrade === 'workshop' ? stationProjectCost(c, 'workshop') : {}),
    };
}
export function buyUpgrade(c: Campaign, upgrade: Upgrade): boolean {
    if (upgrade === 'workshop') return installStationProject(c, 'workshop');
    if (c.activeRun || upgrade === 'storage' || !c.ship || c.ship.hull === 'prospector')
        return false;
    const level = c.ship[upgrade];
    if (
        level >= Math.min(3, c.station.workshopLevel) ||
        !spendEquipment(c.bank, upgradePrice(c, upgrade))
    )
        return false;
    c.ship[upgrade]++;
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
export function buyShip(c: Campaign, hull: HullId = 'swift'): boolean {
    if (c.activeRun || !Object.hasOwn(HULLS, hull) || ownedShips(c).length >= FLEET_LIMIT)
        return false;
    const config = HULLS[hull];
    if (hull === 'prospector' || 'salvageOnly' in config || !hullUnlocked(c, hull)) return false;
    if (c.station.workshopLevel < config.workshop || !hasHullParts(c.bank, hull)) return false;
    for (const id of RESOURCE_IDS) {
        const amount = (HULL_CONSTRUCTION[hull] as Readonly<ResourceStore>)[id] ?? 0;
        if (amount) c.bank[id] = (c.bank[id] ?? 0) - amount;
    }
    if (c.ship) c.reserveShips.push(c.ship);
    c.ship = newShip(c.nextShipId++, hull);
    return true;
}
export function emergencyKit(c: Campaign): boolean {
    if (c.activeRun || (c.ship && c.pilots.length)) return false;
    let changed = false;
    if (!c.ship && c.reserveShips.length) {
        c.ship = c.reserveShips.shift()!;
        changed = true;
    }
    // A stock of raw elements cannot replace a ship needed to gather and process resources.
    if (!c.ship) {
        c.ship = newShip(c.nextShipId++);
        changed = true;
    }
    if (!c.pilots.length && c.bank.ore < 12) {
        const pilot = newPilot(c.nextPilotId++, 3);
        c.pilots.push(pilot);
        c.selectedPilot = pilot.id;
        changed = true;
    }
    return changed;
}
export function pilotSlots(c: Campaign) {
    return c.pilots.length + c.recoverySignals.filter((signal) => signal.pilot).length;
}
export function beginRun(
    c: Campaign,
    seed: number,
    recoveryId: number | null = null,
    loadConstruction = false,
    missionTask: string | null = null,
): boolean {
    if (
        c.activeRun ||
        !c.ship ||
        !selectedPilot(c) ||
        (!c.story && contractLockReason(c, c.contract))
    )
        return false;
    if (
        missionTask !== null &&
        (!selectableMission(c, missionTask) || recoveryId !== null || loadConstruction)
    )
        return false;
    const signal = c.recoverySignals.find((signal) => signal.id === recoveryId);
    if (recoveryId !== null && !signal) return false;
    if (c.story && signal && signal.seed !== STORY_SECTORS[c.story.sector].seed) return false;
    const packingShipment = loadConstruction && lunarShipmentPending(c);
    if (packingShipment && lunarShipmentLock(c)) return false;
    const freight: Cargo =
        !packingShipment && loadConstruction && recoveryId === null
            ? constructionManifest(c)
            : { ore: 0, parts: 0 };
    if (
        loadConstruction &&
        (recoveryId !== null || (!packingShipment && resourceTotal(freight) <= 0))
    )
        return false;
    if (
        resourceTotal(freight) > capacity(c) ||
        RESOURCE_IDS.some((id) => (freight[id] ?? 0) > (c.bank[id] ?? 0))
    )
        return false;
    for (const id of RESOURCE_IDS) if (freight[id]) c.bank[id] = (c.bank[id] ?? 0) - freight[id]!;
    const shipment = packingShipment ? packLunarShipment(c) : null;
    if (packingShipment && !shipment) return false;
    c.activeRun = {
        ...(shipment ? { lunarShipment: shipment.id } : {}),
        ...(missionTask ? { mission: { task: missionTask, aborted: false } } : {}),
        pilotId: c.selectedPilot,
        seed: signal?.seed ?? (c.story ? STORY_SECTORS[c.story.sector].seed : seed >>> 0),
        contract: c.contract,
        recoveryId,
        lastPosition: { x: 240, y: 0 },
        ...(c.story ? { sector: c.story.sector } : {}),
        ...(resourceTotal(freight) ? { freight } : {}),
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
        active.mission?.aborted ||
        active.deliveries?.some((d) => d.id === id) ||
        (active.deliveries?.length ?? 0) >= 64
    )
        return null;
    let refund: Cargo = { ore: 0, parts: 0 },
        description = '',
        rescueXp = 0;
    if (source === 'recovery') {
        const signal = c.recoverySignals.find((s) => -s.id === id && s.seed === active.seed);
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
    } else if (source === 'satellite') {
        const satellite = SATELLITES.find((item) => item.id === id);
        if (
            !satellite ||
            !c.story ||
            active.sector !== 'earth' ||
            active.area ||
            !c.story.claimed.includes('earth-relay') ||
            c.story.claimed.includes(satellite.task)
        )
            return null;
        refund = { ore: 0, parts: 0, ...satellite.parts };
        description = 'Odzysk części satelity';
        recordSatelliteDelivery(c, satellite.task);
    } else {
        if ((source !== 'patrol' && source !== 'lancer') || !integer(id) || id < 1) return null;
        c.worldSalvage = c.worldSalvage.filter((item) => item.id !== id);
        const recipe = SALVAGE[source];
        refund = {
            ore: recipe.ore,
            parts: recipe.parts,
            ...(recipe.crystals ? { crystals: recipe.crystals } : {}),
        };
        description = `Wrak ${source === 'lancer' ? 'Lancer' : 'drona'} #${id}`;
        const rng = random(active.seed ^ Math.imul(id, 0x45d9f3b) ^ 0x16a4c2);
        const rebuild = (!c.story || c.story.mars.aiIdentified) && rng() < 0.3;
        if (rebuild && ownedShips(c).length < FLEET_LIMIT) {
            const ship = newShip(c.nextShipId++, source === 'lancer' ? 'lancer' : 'raider');
            c.reserveShips.push(ship);
            description += ` · odbudowano ${HULLS[ship.hull].name} #${ship.id}`;
        } else {
            // Upgrade a docked reserve; never change the active ship's loadout mid-flight.
            const options = c.reserveShips
                .filter((ship) => ship.hull !== 'prospector')
                .flatMap((ship) =>
                    (['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const)
                        .filter((key) => ship[key] < Math.min(3, c.station.workshopLevel))
                        .map((key) => ({ ship, key })),
                );
            if (options.length && (!c.story || c.story.mars.aiIdentified)) {
                const { ship, key } = options[Math.floor(rng() * options.length)];
                ship[key]++;
                description += ` · ${HULLS[ship.hull].name} #${ship.id}: ${UPGRADES[key].title} +1`;
            } else description += ' · brak wolnego kadłuba do modernizacji';
        }
    }
    for (const resource of RESOURCE_IDS)
        if (refund[resource]) c.bank[resource] = (c.bank[resource] ?? 0) + refund[resource]!;
    const record: SalvageDelivery = {
        id,
        source,
        description,
        materials: { ...refund },
        overflow: 0,
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
    _unusedRepairKits = 0,
    recovery: {
        securedId?: number;
        destroyedRecoveryId?: number;
        wreckVisited?: boolean;
        assaultWon?: boolean;
        venusDefenseWon?: boolean;
        marsDefenseWon?: boolean;
        firstBossWon?: boolean;
        finalBossWon?: boolean;
        patrolKills?: number;
        clearedBeltRocks?: readonly number[];
        recycledWreck?: 'patrol' | 'lancer';
        lossPosition?: Point;
        data?: readonly ScanSiteId[];
        kills?: number;
        equipment?: WeaponId;
    } = {},
): RunResult | null {
    const active = c.activeRun;
    if (!active) return null;
    if (success && active.mission && !active.mission.aborted && !missionObjectiveMet(c, recovery))
        return null;
    collected = { ...collected };
    const aborted = success && !!active.mission?.aborted;
    if (aborted) {
        collected = { ore: 0, parts: 0 };
        recovery = {};
    }
    if (success && !aborted) receiveStationCargo(c, collected);
    const pilot = c.pilots.find((p) => p.id === active.pilotId)!;
    const securedCargo = { ...collected };
    if (success && !aborted)
        for (const id of RESOURCE_IDS) {
            const delivered = active.unloaded?.[id] ?? 0;
            if (delivered) securedCargo[id] = (securedCargo[id] ?? 0) + delivered;
        }
    const result: RunResult = {
        ...(aborted ? { aborted: true } : {}),
        success,
        cargo: securedCargo,
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
                : active.sector
                  ? 'Nieprzekazany ładunek przepadł. Potwierdzone raporty i dostawy pozostają w stacji.'
                  : 'Dane i ładunek wyprawy przepadły. Wcześniejszy postęp zadań pozostaje.'
            : success
              ? 'Cel kontraktu nie został wykonany.'
              : 'Kontrakt nie został rozliczony. Dane wyprawy przepadły.',
        pilotProgress: null,
        deliveries: (active.deliveries ?? []).map((d) => ({ ...d, materials: { ...d.materials } })),
    };
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
            if (resourceTotal(salvage))
                result.recoveryText =
                    (signal.pilot ? `Uratowano ${pilotName(signal.pilot)}. ` : '') +
                    'Hangar pełny: wrak rozebrano na materiały.';
            for (const id of RESOURCE_IDS)
                if (salvage[id]) result.reward[id] = (result.reward[id] ?? 0) + salvage[id]!;
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
            if (c.ship!.hull === 'prospector' || c.ship!.weapons.includes(equipment)) {
                const bill: ResourceStore = WEAPON_PARTS[equipment];
                for (const id of RESOURCE_IDS) {
                    const count = Math.floor((bill[id] ?? 0) / 2);
                    if (count) result.reward[id] = (result.reward[id] ?? 0) + count;
                }
                result.equipmentText =
                    c.ship!.hull === 'prospector'
                        ? `${weapon.name} rozebrano na części · Prospector 0 zachowuje wyposażenie startowe.`
                        : `Duplikat ${weapon.name} rozebrano na części.`;
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
        const finalBossXp =
            recovery.finalBossWon &&
            active.sector === 'pluto' &&
            c.story?.claimed.includes('pluto-base') &&
            c.story.claimed.includes('pluto-patrol') &&
            !c.story.claimed.includes('pluto-boss')
                ? 18
                : 0;
        const firstBossXp =
            recovery.firstBossWon &&
            active.sector === 'neptune' &&
            c.story?.claimed.includes('neptune-base') &&
            !c.story.claimed.includes('neptune-boss')
                ? 12
                : 0;
        const mined: Cargo = { ore: 0, parts: 0 };
        for (const id of RESOURCE_IDS)
            mined[id] =
                Math.max(0, (collected[id] ?? 0) - (active.freight?.[id] ?? 0)) +
                (active.unloaded?.[id] ?? 0);
        result.pilotProgress = awardPilotXp(
            pilot,
            Math.min(
                50,
                expeditionXp(
                    mined,
                    data,
                    !c.story && contractReady(active.contract, collected, data, kills),
                    signal && recovery.securedId === signal.id ? signal : null,
                    kills,
                ) +
                    Math.max(firstBossXp + finalBossXp, active.reportedBossXp ?? 0) +
                    (active.deliveries ?? []).reduce((sum, d) => sum + d.rescueXp, 0),
            ),
        );
        const free = Math.max(0, storageCapacity(c) - storageUsed(c));
        let available = free,
            accepted = 0;
        for (const id of STORAGE_PRIORITY) {
            const amount = Math.min(available, (collected[id] ?? 0) + (result.reward[id] ?? 0));
            if (amount) c.bank[id] = (c.bank[id] ?? 0) + amount;
            available -= amount;
            accepted += amount;
        }
        if ((collected.anomalyOre ?? 0) > 0 && c.station.extraction)
            c.station.anomalySampleDelivered = true;
        result.overflow = resourceTotal(collected) + resourceTotal(result.reward) - accepted;
        c.recovered++;
        if (active.sector && c.story) {
            const closingPluto =
                active.sector === 'pluto' && !storySectorComplete(c.story, 'pluto');
            const closingNeptune =
                active.sector === 'neptune' && !storySectorComplete(c.story, 'neptune');
            const closingSaturn =
                active.sector === 'saturn' && !storySectorComplete(c.story, 'saturn');
            const closingJupiter =
                active.sector === 'jupiter' && !storySectorComplete(c.story, 'jupiter');
            const closingPassage = !storySectorComplete(c.story, 'belt');
            const closingMars = !beltPassageReady(c.story);
            const closingTechnology = !beltTechnologyReady(c.story);
            const closingAct = !c.story.claimed.includes('lunar-attack');
            const closingBelt =
                active.sector === 'mars' && !c.story.claimed.includes('mars-anomaly-research');
            const closingVenus =
                active.sector === 'venus' &&
                (!storySectorComplete(c.story, 'venus') || !!recovery.venusDefenseWon);
            const change = recordStoryReturn(
                c,
                active.sector,
                data,
                !!recovery.wreckVisited,
                !!recovery.assaultWon,
                recovery.patrolKills ?? 0,
                !!recovery.venusDefenseWon,
                !!recovery.marsDefenseWon,
                recovery.clearedBeltRocks ?? [],
                Math.max(0, collected.ore - (active.freight?.ore ?? 0)),
                !!recovery.firstBossWon,
                !!recovery.finalBossWon,
            );
            if (change) {
                result.reward.ore += change.reward.ore;
                result.reward.parts += change.reward.parts;
                result.overflow += change.overflow;
                if (
                    (closingAct || (inEarthSystem(active.sector) && recovery.assaultWon)) &&
                    actOneComplete(c.story)
                )
                    result.reason =
                        'Akt I ukończony. Stacja księżycowa obroniona. Następny kierunek: Mars.';
                if (closingBelt && c.story.claimed.includes('mars-anomaly-research'))
                    result.reason =
                        'Badania anomalii zakończone. Odbierz odprawę Nowy kierunek w Satuk 15.';
                if (closingVenus && storySectorComplete(c.story, 'venus'))
                    result.reason =
                        'Akt III ukończony. Placówka obroniona, osłona gotowa. Następny kierunek: Merkury.';
                if (closingTechnology && beltTechnologyReady(c.story))
                    result.reason =
                        'Akt IV ukończony. Technologia przejścia pasa zabezpieczona. Następny kierunek: Mars.';
                if (closingMars && beltPassageReady(c.story))
                    result.reason =
                        'Akt V ukończony. Baza i korytarz zabezpieczone. Ekspedycja gotowa do przejścia pasa.';
                if (closingPassage && storySectorComplete(c.story, 'belt'))
                    result.reason =
                        'Akt VI ukończony. Przejście pasa potwierdzone. Następny kierunek: Jowisz.';
                if (closingJupiter && storySectorComplete(c.story, 'jupiter'))
                    result.reason =
                        'Pakiet obserwacyjny zabezpieczony. Cele operacyjne Jowisza ukończone.';
                if (closingSaturn && storySectorComplete(c.story, 'saturn'))
                    result.reason =
                        'Cele operacyjne Saturna ukończone. Zaopatrzenie i dalsza trasa zabezpieczone.';
                if (closingNeptune && storySectorComplete(c.story, 'neptune'))
                    result.reason =
                        'Cele operacyjne aktu IX ukończone. Starcie odparte, zewnętrzna trasa zabezpieczona.';
                if (closingPluto && storySectorComplete(c.story, 'pluto'))
                    result.reason =
                        'Cele operacyjne kampanii ukończone. Raport finałowego starcia zabezpieczony. Wcześniejsze sektory pozostają dostępne.';
                result.contractText = change.titles.length
                    ? `Zadania ukończone: ${change.titles.join(' · ')}`
                    : 'Postęp sektora zachowany. Surowce możesz przekazać w panelu wyprawy.';
            }
        }
    } else {
        const loss = recovery.lossPosition ?? active.lastPosition;
        const site =
            active.sector === 'mars'
                ? active.area === 'surface'
                    ? nearestMarsSurface(loss)
                    : nearestMarsOrbit(loss)
                : active.area === 'surface'
                  ? MOON
                  : null;
        const signal = createRecoverySignal(
            c.ship!,
            pilot,
            active.seed,
            site ? { x: loss.x - site.center.x, y: loss.y - site.center.y } : loss,
            site?.radius ?? (c.story ? storyRadius(c.story) : GAME.sectorRadius),
        );
        if (signal) {
            if (site) {
                const distance = Math.hypot(signal.x, signal.y);
                const scale = Math.min(1, (site.radius - 200) / distance);
                signal.x = site.center.x + signal.x * scale;
                signal.y = site.center.y + signal.y * scale;
                if (active.area === 'surface') signal.area = 'surface';
            } else if (c.story) {
                const limit = storyRadius(c.story) - 200;
                const scale = Math.min(1, limit / Math.hypot(signal.x, signal.y));
                signal.x *= scale;
                signal.y *= scale;
            }
            c.recoverySignals.push(signal);
            result.recoveryText +=
                'Nowy sygnał ratunkowy w bazie: ' + recoveryDescription(signal) + '.';
        } else result.recoveryText += 'Brak sygnału kapsuły lub wraku. Strata jest trwała.';
        c.pilots = c.pilots.filter((p) => p.id !== active.pilotId);
        c.selectedPilot = c.pilots[0]?.id ?? 0;
        c.ship = null;
        if (!signal?.pilot) c.lostPilots++;
    }
    if (aborted) {
        result.reason =
            'Misja przerwana. Pilot i statek wrócili; ładunek z pokładu oraz raport odrzucono.';
        result.contractText =
            'Brak nagrody i PD za przerwaną wyprawę. Wcześniej zabezpieczone dostawy pozostają.';
    }
    if (result.pilotProgress && active.questXp) {
        result.pilotProgress.gainedXp += active.questXp;
        result.pilotProgress.levelBefore = pilotLevel({
            ...pilot,
            xp: Math.max(0, pilot.xp - result.pilotProgress.gainedXp),
        });
        result.pilotProgress.levelAfter = pilotLevel(pilot);
        result.pilotProgress.points = pilotPoints(pilot);
    }
    c.activeRun = null;
    if (c.story) syncStory(c);
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
            if (json && !campaign)
                this.warning =
                    'Niekompatybilny lub nieprawidłowy zapis. Ta wersja wymaga nowej kampanii.';
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
