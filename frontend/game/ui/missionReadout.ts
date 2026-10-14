import { CONTRACTS, GAME, OUTPOST, RECOVERY, SCAN, SCAN_SITES, ScanSiteId } from '../config';
import type { Cargo } from '../state/campaign';
import type { MissionSimulation } from '../systems/mission';
import { CACHE } from '../systems/prototypes';

export interface MissionObjective {
    id: string;
    title: string;
    progress: string;
    complete: boolean;
}

export function missionObjectives(
    contractId: number,
    cargo: Cargo,
    data: readonly ScanSiteId[],
    recovery: boolean,
    secured: boolean,
    returned = false,
): MissionObjective[] {
    const contract = CONTRACTS[contractId];
    const goals: MissionObjective[] = [];
    if (contract.ore > 0)
        goals.push({
            id: 'ore',
            title: 'Ruda',
            progress: `${cargo.ore}/${contract.ore}`,
            complete: cargo.ore >= contract.ore,
        });
    if (contract.parts > 0)
        goals.push({
            id: 'parts',
            title: 'Komponenty',
            progress: `${cargo.parts}/${contract.parts}`,
            complete: cargo.parts >= contract.parts,
        });
    for (const site of contract.sites)
        goals.push({
            id: site,
            title: SCAN_SITES[site].name,
            progress: '',
            complete: data.includes(site),
        });
    if (recovery)
        goals.push({
            id: 'rescue',
            title: secured ? 'Cel na holu' : 'Podejmij cel ratunkowy',
            progress: '',
            complete: secured,
        });
    goals.push({ id: 'return', title: 'Powrót do Aurory', progress: '', complete: returned });
    return goals;
}

// Only actionable context belongs on the flight HUD. Explanations live under Tab.
export function flightHint(s: MissionSimulation) {
    const percent = (progress: number, seconds: number) =>
        `${Math.min(100, Math.floor((progress / seconds) * 100))}%`;
    if (s.pendingChoice) return '';
    if (s.outpost.download > 0)
        return `E  Przechwyt · ${percent(s.outpost.download, OUTPOST.downloadSeconds)}`;
    if (s.repairProgress > 0)
        return `R  Naprawa · ${percent(s.repairProgress, GAME.repairSeconds)}`;
    if (s.recoveryProgress > 0)
        return `E  Odzysk · ${percent(s.recoveryProgress, RECOVERY.seconds)}`;
    if (s.scanProgress > 0) return `E  Skan · ${percent(s.scanProgress, SCAN.seconds)}`;
    if (s.cacheProgress > 0) return `E  Skrytka · ${percent(s.cacheProgress, CACHE.seconds)}`;
    if (s.dockProgress > 0) return `E  Dokowanie · ${percent(s.dockProgress, 1.2)}`;
    const signal = s.recoverySignal,
        p = s.position;
    if (
        signal &&
        !s.recoverySecured &&
        Math.hypot(p.x - signal.x, p.y - signal.y) < RECOVERY.radius
    )
        return s.speed > RECOVERY.speed
            ? 'S  Wyhamuj do odzysku · <80 m/s'
            : 'E  Podejmij cel · przytrzymaj 4 s';
    if (s.nearbyCache)
        return s.speed > CACHE.speed
            ? 'S  Wyhamuj przy skrytce · <60 m/s'
            : 'E  Otwórz skrytkę · przytrzymaj 2,5 s';
    if (s.nearbyOutpost) {
        if (s.outpost.alarm > 0)
            return `Alarm · terminal zablokowany ${Math.ceil(s.outpost.alarm)} s`;
        if (s.outpost.secured) return 'Dane zabezpieczone · 1  Baza';
        return s.speed > OUTPOST.interactSpeed
            ? 'S  Wyhamuj przy terminalu · <60 m/s'
            : 'E  Wykradnij dane · przytrzymaj 4 s';
    }
    if (s.outpost.detection > 0)
        return `Skaner wykrywa statek · ${percent(s.outpost.detection, OUTPOST.detectSeconds)}`;
    const site = s.nearbyScanSite;
    if (site?.siteId && !s.surveyData.has(site.siteId))
        return s.speed > SCAN.speed
            ? 'S  Wyhamuj do skanu · <60 m/s'
            : 'E  Skanuj · przytrzymaj 3 s';
    if (s.distanceHome < 350) {
        if (s.grippers.arms.some((arm) => arm.held)) return 'Chwytaki zaciągają łup…';
        return s.dockable
            ? 'E  Dokuj · przytrzymaj'
            : s.speed >= GAME.dockSpeed
              ? 'S  Wyhamuj do dokowania · <65 m/s'
              : 'Zbliż się do pierścienia dokowania';
    }
    if (s.engineFault)
        return s.repairKits ? 'R  Napraw napęd · przytrzymaj 5 s' : 'Napęd uszkodzony · 1  Baza';
    const wreck = s.sector.landmarks[2];
    if (!s.wreckVisited && Math.hypot(wreck.x - p.x, wreck.y - p.y) < 160)
        return 'E  Przeszukaj wrak';
    if (s.cargoUsed >= s.cargoCapacity) return 'Ładownia pełna · 1  Baza';
    if (s.hull < s.maxHull && s.repairKits > 0) return 'R  Napraw kadłub · przytrzymaj 5 s';
    return '';
}
