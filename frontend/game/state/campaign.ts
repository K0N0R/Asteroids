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
    validPilotProgress,
} from './pilots';

export interface Cargo {
    ore: number;
    parts: number;
}
export interface Pilot {
    id: number;
    archetype: number;
    xp: number;
    skills: Record<PilotSkillId, number>;
}
export type ShipModules = Record<'engine' | 'handling' | 'cargo' | 'drill' | 'armor', number>;
export interface Ship extends ShipModules {
    id: number;
    hull: HullId;
}
export interface Campaign {
    version: 10;
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
    contractText: string;
    pilotProgress: PilotProgress | null;
}

export const SAVE_KEY = 'asteroids.campaign.v1';
export const newShip = (id = 1, hull: HullId = 'prospector'): Ship => ({
    id,
    hull,
    engine: 0,
    handling: 0,
    cargo: 0,
    drill: 0,
    armor: 0,
});
export function newCampaign(): Campaign {
    return {
        version: 10,
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
    object(value) && integer(value.ore) && integer(value.parts);

export function parseCampaign(json: string | null): Campaign | null {
    try {
        const p: unknown = JSON.parse(json ?? 'null');
        if (
            !object(p) ||
            ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(p.version as number) ||
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
        if (p.version === 1) {
            p.version = 2;
            p.crew = newCrew();
            p.repairKits = p.sorties === 0 ? 1 : 0;
            if (object(p.activeRun)) p.activeRun.repairKits = 0;
        }
        if ((p.version as number) < 10 && object(p.crew)) p.crew.quartermaster = false;
        if (
            !object(p.crew) ||
            typeof p.crew.mechanic !== 'boolean' ||
            typeof p.crew.quartermaster !== 'boolean' ||
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
            p.activeRun !== null &&
            (!object(p.activeRun) || !integer(p.activeRun.repairKits, CREW.embarkKits))
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
            ((p.version as number) < 7 || integer(ship.handling, 3));
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
                Math.hypot(signal.x, signal.y) < 649 ||
                Math.hypot(signal.x, signal.y) > GAME.sectorRadius - 299 ||
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
        p.version = 10;
        const campaign = p as unknown as Campaign;
        if (campaign.repairKits + (campaign.activeRun?.repairKits ?? 0) > CREW.kitLimit)
            return null;
        if (storageUsed(campaign) > storageCapacity(campaign)) return null;
        return campaign;
    } catch {
        return null;
    }
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
    for (const key of ['engine', 'handling', 'cargo', 'drill', 'armor'] as const) {
        const levels = (ship[key] * (ship[key] + 1)) / 2;
        ore += UPGRADES[key].ore * levels;
        parts += UPGRADES[key].parts * levels;
    }
    return { ore: Math.floor(ore / 2), parts: Math.floor(parts / 2) };
}
export function scrapShip(c: Campaign, id: number): boolean {
    if (c.activeRun) return false;
    const ship = c.reserveShips.find((ship) => ship.id === id);
    if (!ship) return false;
    const refund = scrapRefund(ship);
    if (storageUsed(c) + refund.ore + refund.parts > storageCapacity(c)) return false;
    c.bank.ore += refund.ore;
    c.bank.parts += refund.parts;
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
    return c.bank.ore + c.bank.parts + reservedResources(c);
}
export function upgradePrice(c: Campaign, upgrade: Upgrade): Cargo {
    const level =
        upgrade === 'storage' || upgrade === 'workshop'
            ? c.station[upgrade]
            : (c.ship?.[upgrade] ?? 0);
    return {
        ore: UPGRADES[upgrade].ore * (level + 1),
        parts: UPGRADES[upgrade].parts * (level + 1),
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
    if (level >= limit || c.bank.ore < price.ore || c.bank.parts < price.parts) return false;
    c.bank.ore -= price.ore;
    c.bank.parts -= price.parts;
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
export function beginRun(c: Campaign, seed: number, recoveryId: number | null = null): boolean {
    if (c.activeRun || !c.ship || !selectedPilot(c) || contractLockReason(c, c.contract))
        return false;
    const signal = c.recoverySignals.find((signal) => signal.id === recoveryId);
    if (recoveryId !== null && !signal) return false;
    const repairKits = Math.min(c.repairKits, CREW.embarkKits);
    c.repairKits -= repairKits;
    c.activeRun = {
        pilotId: c.selectedPilot,
        seed: signal?.seed ?? seed >>> 0,
        contract: c.contract,
        repairKits,
        recoveryId,
        lastPosition: { x: 240, y: 0 },
    };
    c.sorties++;
    return true;
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
        lossPosition?: Point;
        data?: readonly ScanSiteId[];
        kills?: number;
    } = {},
): RunResult | null {
    const active = c.activeRun;
    if (!active) return null;
    const pilot = c.pilots.find((p) => p.id === active.pilotId)!;
    const result: RunResult = {
        success,
        cargo: { ...collected },
        pilotName: PILOTS[pilot.archetype].name,
        shipName: HULLS[c.ship!.hull].name,
        duration,
        reason,
        reward: { ore: 0, parts: 0 },
        overflow: 0,
        recoveryText: '',
        contractText: success
            ? 'Cel kontraktu nie został wykonany.'
            : 'Kontrakt nie został rozliczony. Dane wyprawy przepadły.',
        pilotProgress: null,
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
            if (salvage.ore || salvage.parts)
                result.recoveryText =
                    (signal.pilot ? `Uratowano ${PILOTS[signal.pilot.archetype].name}. ` : '') +
                    'Hangar pełny: wrak rozebrano na materiały.';
            result.reward.ore += salvage.ore;
            result.reward.parts += salvage.parts;
        } else if (signal)
            result.recoveryText = 'Nie podjęto celu ratunkowego. Sygnał pozostaje dostępny.';
        const contract = CONTRACTS[active.contract];
        const data = (recovery.data ?? []).filter((site) => Object.hasOwn(SCAN_SITES, site));
        const kills =
            Number.isInteger(recovery.kills) && (recovery.kills ?? 0) >= 0 ? recovery.kills! : 0;
        if (contractReady(active.contract, collected, data, kills)) {
            result.reward.ore += contract.rewardOre;
            result.reward.parts += contract.rewardParts;
            c.contractCompletions[active.contract]++;
            result.contractText = `✓ ${contract.title} · kontrakt rozliczony`;
        }
        result.pilotProgress = awardPilotXp(
            pilot,
            expeditionXp(
                collected,
                data,
                contractReady(active.contract, collected, data, kills),
                signal && recovery.securedId === signal.id ? signal : null,
                kills,
            ),
        );
        const free = Math.max(0, storageCapacity(c) - storageUsed(c));
        c.repairKits += Math.max(0, Math.min(active.repairKits, Math.floor(unusedRepairKits)));
        const parts = Math.min(free, collected.parts + result.reward.parts);
        const ore = Math.min(free - parts, collected.ore + result.reward.ore);
        c.bank.ore += ore;
        c.bank.parts += parts;
        result.overflow =
            collected.ore + collected.parts + result.reward.ore + result.reward.parts - ore - parts;
        c.recovered++;
    } else {
        const target = c.recoverySignals.find((signal) => signal.id === active.recoveryId);
        if (target) {
            if (target.pilot) c.lostPilots++;
            c.recoverySignals = c.recoverySignals.filter((signal) => signal.id !== target.id);
            result.recoveryText = 'Cel poprzedniej akcji ratunkowej został utracony. ';
        }
        const signal = createRecoverySignal(
            c.ship!,
            pilot,
            active.seed,
            recovery.lossPosition ?? active.lastPosition,
        );
        if (signal) {
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
    constructor(private storage: Pick<Storage, 'getItem' | 'setItem'>) {}
    load() {
        try {
            const json = this.storage.getItem(SAVE_KEY);
            const campaign = parseCampaign(json);
            if (json && !campaign) this.warning = 'Nieprawidłowy zapis. Uruchomiono nową kampanię.';
            return campaign ?? newCampaign();
        } catch {
            this.warning = 'Zapis lokalny jest niedostępny. Kampania działa w tej sesji.';
            return newCampaign();
        }
    }
    save(campaign: Campaign): boolean {
        try {
            this.storage.setItem(SAVE_KEY, JSON.stringify(campaign));
            return true;
        } catch {
            this.warning = 'Nie udało się zapisać. Postęp pozostaje w tej sesji.';
            return false;
        }
    }
}
