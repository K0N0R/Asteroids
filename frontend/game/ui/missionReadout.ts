import { ENEMY_FACTORY } from '../systems/enemyFactory';
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
    requirements?: {
        resource: import('../state/resources').ResourceId;
        have: number;
        need: number;
    }[];
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
    if (s.marsAct?.context) return s.marsAct.context;
    if (
        s.marsAct &&
        s.enemyFactory &&
        !s.enemyFactory.destroyed &&
        Math.hypot(
            s.position.x - s.enemyFactory.position.x,
            s.position.y - s.enemyFactory.position.y,
        ) < 750 &&
        (!s.marsAct.baseFactory || s.enemyFactory.active)
    )
        return `Instalacja · ${Math.ceil(s.enemyFactory.health)}/900 HP · zniszcz rdzeń produkcyjny`;

    if (
        s.enemyFactory &&
        !s.marsAct &&
        (s.factoryMission ||
            Math.hypot(
                s.position.x - ENEMY_FACTORY.position.x,
                s.position.y - ENEMY_FACTORY.position.y,
            ) < ENEMY_FACTORY.activateRange)
    ) {
        const f = s.enemyFactory;
        if (f.destroyed)
            return s.dockable
                ? 'E · dokuj i zatwierdź raport o stoczni'
                : 'Stocznia zniszczona · posiłki zatrzymane · 1: Satuk 15';
        return `Stocznia · ${Math.ceil(f.health)}/${ENEMY_FACTORY.health} HP · 5: rdzeń · zniszcz, aby zatrzymać produkcję`;
    }

    if (
        s.rescueOperation &&
        (s.rescueOperation.delivered ||
            s.rescueOperation.state === 'towing' ||
            Math.hypot(
                s.position.x - s.rescueOperation.position.x,
                s.position.y - s.rescueOperation.position.y,
            ) < 220)
    ) {
        const r = s.rescueOperation;
        if (r.delivered && s.dockable) return 'E · dokuj · dostawa potwierdzona przez radio';
        if (
            ['ready', 'distress'].includes(r.state) &&
            Math.hypot(s.position.x - r.position.x, s.position.y - r.position.y) < 170 &&
            s.speed >= 60
        )
            return `S · wyhamuj przy ${r.probe ? 'sondzie' : 'promie'} do prędkości poniżej 60 m/s`;
        if (r.state === 'ready' && s.salvage.full) return 'Hol zajęty · J zwolnij inny wrak';
        if (r.attachProgress > 0)
            return `H · podłączanie holu ${Math.floor((r.attachProgress / 3) * 100)}%`;
        return r.status;
    }
    if (s.cargoTransferRemaining > 0 || s.canTransferCargo) return s.context;
    if (s.relayTuning) return 'Strojenie łączności · dopasuj fazy i zatwierdź sygnał';
    if (s.dockable && s.missionStatus) return s.missionStatus;
    if (s.marsAct?.context) return s.marsAct.context;
    if (s.surfaceContext) return s.surfaceContext;
    const percent = (progress: number, seconds: number) =>
        `${Math.min(100, Math.floor((progress / seconds) * 100))}%`;
    if (s.pendingChoice) return '';
    if (s.escort?.state === 'idle' && s.nearbyEscort)
        return s.escort.startProgress > 0
            ? `E Eskorta · ${percent(s.escort.startProgress, 2)}`
            : `E Rozpocznij eskortę: ${s.escortName} · 2 s`;
    if (s.miningEscort && s.area === 'surface') return s.miningEscort.status;
    if (s.escort?.state === 'waiting')
        return s.escort.waitingReason === 'player'
            ? 'Kepler czeka na eskortę'
            : 'Kepler szuka bezpiecznej drogi';
    if (s.escort?.state === 'research')
        return 'Osłaniaj Keplera · badania wymagają spokojnego otoczenia';
    if (s.terminalPuzzle)
        return `${s.terminalPuzzle.mode === 'power' ? 'Zasilanie' : 'Włamanie'} · ${Math.ceil(s.terminalPuzzle.remaining)} s · ślad ${Math.ceil(s.terminalPuzzle.trace)}/100`;
    if (s.outpost.equipmentProgress > 0)
        return `E  Magazyn · ${percent(s.outpost.equipmentProgress, OUTPOST.equipmentSeconds)}`;
    if (s.repairProgress > 0) return `R  Naprawa · ${percent(s.repairProgress, s.repairSeconds)}`;
    if (s.salvageProgress > 0)
        return `H Holowanie wraku · ${percent(s.salvageProgress, s.salvageSeconds)}`;
    if (s.recoveryProgress > 0)
        return `H  Odzysk · ${percent(s.recoveryProgress, s.recoverySeconds)}`;
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
              : `H  Podejmij cel · przytrzymaj ${s.recoverySeconds} s`;
    if (s.nearbyWreck)
        return s.speed > 80
            ? 'S Wyhamuj przy wraku · <80 m/s'
            : `H Holuj wrak · przytrzymaj ${s.salvageSeconds} s`;
    if (s.salvage.towed) {
        const item = s.salvage.towed;
        if (s.distanceHome > 350)
            return s.salvage.towing.size > 1
                ? `Hol ${s.salvage.towing.size}/${s.salvage.capacity} · ${s.stationName} · J zwolnij wraki`
                : `Hol ${Math.ceil(item.health)}/${item.maxHealth} · ${s.stationName}${item.source !== 'recovery' ? ' · J zwolnij' : ''}`;
    }
    if (s.nearbyCache)
        return s.speed > CACHE.speed
            ? 'S  Wyhamuj przy skrytce · <60 m/s'
            : 'E  Otwórz skrytkę · przytrzymaj 2,5 s';
    if (s.nearbyOutpost) {
        if (s.speed > OUTPOST.interactSpeed) return 'S  Wyhamuj przy terminalu · <60 m/s';
        const sabotage = s.outpost.sabotaged ? '' : ' · G  Zasilanie: minigra';
        const action =
            s.storyMode && s.outpost.secured
                ? 'Dane zabezpieczone · raport przez radio · Satuk 15'
                : s.outpost.equipmentSecured
                  ? 'Powrót do bazy'
                  : s.outpost.secured
                    ? !s.equipmentRoom
                        ? 'Magazyn wymaga 3 wolnych miejsc w ładowni'
                        : !s.outpost.equipmentArmed
                          ? 'Puść E · dostęp do magazynu'
                          : `E  Zabierz ${WEAPONS[s.outpostEquipment].name} · 5 s / 3 miejsca`
                    : 'E  Otwórz obwód terminala';
        if (s.outpost.disabledTime > 0)
            return `${action} · skaner wyłączony ${Math.ceil(s.outpost.disabledTime)} s`;
        if (s.outpost.alarm > 0)
            return `Alarm · terminal zablokowany ${Math.ceil(s.outpost.alarm)} s${sabotage}`;
        if (s.outpost.secured) return `${action}${sabotage}`;
        return `E  Otwórz obwód terminala${sabotage}`;
    }
    if (s.outpost.detection > 0)
        return `Skaner wykrywa statek · ${percent(s.outpost.detection, OUTPOST.detectSeconds)}`;
    const site = s.nearbyScanSite;
    if (site?.siteId === 'fortress' && s.fortressGuardCount)
        return `Rdzeń zablokowany · obrońcy ${s.fortressGuardCount}/5`;
    if (site?.siteId && !s.surveyData.has(site.siteId))
        return s.speed > SCAN.speed
            ? 'S  Wyhamuj do skanu · <60 m/s'
            : s.relayRequired
              ? 'E  Otwórz strojenie łączności'
              : 'E  Skanuj · przytrzymaj 3 s';
    if (s.stationShieldActive && s.distanceHome >= 350 && s.distanceHome < s.stationSafeRadius)
        return `${s.stationName} · bezpieczny obszar tarczy`;
    if (s.distanceHome < 350) {
        if (s.grippers.arms.some((arm) => arm.held)) return 'Chwytaki zaciągają łup…';
        return s.dockable
            ? 'E  Dokuj · przytrzymaj'
            : s.speed >= GAME.dockSpeed
              ? 'S  Wyhamuj do dokowania · <65 m/s'
              : 'Zbliż się do pierścienia dokowania';
    }
    if (s.engineFault)
        return s.repairKits
            ? 'R  Napraw napęd · przytrzymaj 5 s'
            : 'Napęd uszkodzony · powrót do bazy';
    const wreck = s.sector.landmarks.find((l) => l.kind === 'wreck');
    if (wreck && !s.wreckVisited && Math.hypot(wreck.x - p.x, wreck.y - p.y) < 160)
        return 'E  Przeszukaj wrak';
    if (s.cargoUsed >= s.cargoCapacity) return 'Ładownia pełna · powrót do bazy';
    if (s.hull < s.maxHull && s.repairKits > 0) return 'R  Napraw kadłub · przytrzymaj 5 s';
    if (s.hullId === 'widmo')
        return `LPM Dash ${s.dashCooldown > 0 ? `${Math.ceil(s.dashCooldown)} s` : 'gotowy'} · PPM Kamuflaż ${s.opticalCloak ? 'aktywny' : s.opticalCloakCooldown > 0 ? `${Math.ceil(s.opticalCloakCooldown)} s` : 'gotowy'}`;
    return '';
}
