import {
    CONTRACTS,
    GAME,
    OUTPOST,
    WEAPONS,
    RECOVERY,
    SCAN,
    SCAN_SITES,
    ScanSiteId,
} from '../config';
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
    kills = 0,
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
    if (contract.kills)
        goals.push({
            id: 'kills',
            title: 'Drony',
            progress: `${kills}/${contract.kills}`,
            complete: kills >= contract.kills,
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
    if (s.escort?.state === 'idle' && s.nearbyEscort)
        return s.escort.startProgress > 0
            ? `E Eskorta · ${percent(s.escort.startProgress, 2)}`
            : 'E Rozpocznij eskortę Keplera · 2 s';
    if (s.escort?.state === 'waiting')
        return s.escort.waitingReason === 'player'
            ? 'N Wróć do Keplera · czeka na eskortę'
            : 'Kepler szuka bezpiecznej drogi';
    if (s.escort?.state === 'research')
        return 'Osłaniaj Keplera · badania wymagają spokojnego otoczenia';
    if (s.outpost.sabotageProgress > 0)
        return `G  Sabotaż · ${percent(s.outpost.sabotageProgress, OUTPOST.sabotageSeconds)}`;
    if (s.outpost.equipmentProgress > 0)
        return `E  Magazyn · ${percent(s.outpost.equipmentProgress, OUTPOST.equipmentSeconds)}`;
    if (s.outpost.download > 0)
        return `E  Przechwyt · ${percent(s.outpost.download, OUTPOST.downloadSeconds)}`;
    if (s.repairProgress > 0)
        return `R  Naprawa · ${percent(s.repairProgress, GAME.repairSeconds)}`;
    if (s.salvageProgress > 0)
        return `E Holowanie wraku · ${percent(s.salvageProgress, s.salvageSeconds)}`;
    if (s.recoveryProgress > 0)
        return `E  Odzysk · ${percent(s.recoveryProgress, s.recoverySeconds)}`;
    if (s.scanProgress > 0) return `E  Skan · ${percent(s.scanProgress, SCAN.seconds)}`;
    if (s.cacheProgress > 0) return `E  Skrytka · ${percent(s.cacheProgress, CACHE.seconds)}`;
    if (s.dockProgress > 0) return `E  Dokowanie · ${percent(s.dockProgress, 1.2)}`;
    const signal = s.recoverySignal,
        p = s.position;
    if (
        signal &&
        !s.recoverySecured &&
        !s.recoveryDestroyed &&
        Math.hypot(p.x - signal.x, p.y - signal.y) < RECOVERY.radius
    )
        return s.salvage.full
            ? 'J Zwolnij wrak, aby podjąć cel ratunkowy'
            : s.speed > RECOVERY.speed
              ? 'S  Wyhamuj do odzysku · <80 m/s'
              : `E  Podejmij cel · przytrzymaj ${s.recoverySeconds} s`;
    if (s.nearbyWreck)
        return s.speed > 80
            ? 'S Wyhamuj przy wraku · <80 m/s'
            : `E Holuj wrak · przytrzymaj ${s.salvageSeconds} s`;
    if (s.salvage.towed) {
        const item = s.salvage.towed;
        if (s.distanceHome > 350)
            return s.salvage.towing.size > 1
                ? `Hol ${s.salvage.towing.size}/${s.salvage.capacity} · 1 Aurora · J zwolnij wraki`
                : `Hol ${Math.ceil(item.health)}/${item.maxHealth} · 1 Aurora${item.source !== 'recovery' ? ' · J zwolnij' : ''}`;
    }
    if (s.nearbyCache)
        return s.speed > CACHE.speed
            ? 'S  Wyhamuj przy skrytce · <60 m/s'
            : 'E  Otwórz skrytkę · przytrzymaj 2,5 s';
    if (s.nearbyOutpost) {
        if (s.speed > OUTPOST.interactSpeed) return 'S  Wyhamuj przy terminalu · <60 m/s';
        const sabotage = s.outpost.sabotaged
            ? ''
            : s.cargo.parts >= 1
              ? ' · G  Sabotaż: 3 s / 1 komponent'
              : ' · Sabotaż wymaga 1 komponentu w ładowni';
        const action = s.outpost.equipmentSecured
            ? '1  Baza'
            : s.outpost.secured
              ? !s.equipmentRoom
                  ? 'Magazyn wymaga 3 wolnych miejsc w ładowni'
                  : !s.outpost.equipmentArmed
                    ? 'Puść E · dostęp do magazynu'
                    : `E  Zabierz ${WEAPONS[s.outpostEquipment].name} · 5 s / 3 miejsca`
              : 'E  Wykradnij dane · 4 s';
        if (s.outpost.disabledTime > 0)
            return `${action} · skaner wyłączony ${Math.ceil(s.outpost.disabledTime)} s`;
        if (s.outpost.alarm > 0)
            return `Alarm · terminal zablokowany ${Math.ceil(s.outpost.alarm)} s${sabotage}`;
        if (s.outpost.secured) return `${action}${sabotage}`;
        return `E  Wykradnij dane · 4 s${sabotage}`;
    }
    if (s.outpost.detection > 0)
        return `Skaner wykrywa statek · ${percent(s.outpost.detection, OUTPOST.detectSeconds)}`;
    const site = s.nearbyScanSite;
    if (site?.siteId === 'fortress' && s.fortressGuardCount)
        return `Rdzeń zablokowany · obrońcy ${s.fortressGuardCount}/5`;
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
