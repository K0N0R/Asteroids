import { MarsResearchEscort } from './marsResearchEscort';
import { MarsResearchWaves } from './marsResearchWaves';
import { GAME } from '../config';
import { syncStory } from '../state/story';
import {
    MARS_ACT as M,
    MARS_SURFACE_PATROLS,
    MARS_AMBUSH,
    marsArea,
    phobosRouteOpen,
    phobosOrbitSecured,
    marsSecurityObjective,
    marsResearchComplete,
} from '../state/marsAct';
import { marsSystemLanes, marsSystemZones, generateMarsActSector } from '../worlds/marsSystem';
import { ANOMALY } from './anomalyField';
import { marsAnomalyClearance } from '../worlds/phobosMaze';
import { enemyPosition } from './enemies';
import { salvagePosition } from './salvage';
import { awardPilotXp } from '../state/pilots';
import type { FlightInput, MissionSimulation } from './mission';
import type { Point } from '../worlds/sector';
import { OutpostSecurity } from './outpost';
import { TerminalPuzzle, type TerminalAction } from './terminalPuzzle';

export class MarsActMission {
    readonly researchWaves: MarsResearchWaves;
    readonly security = new OutpostSecurity({
        ...M.base,
        name: 'Instalacja Fobosa',
        phase: 0,
        terminal: M.terminal,
        guards: [],
    });
    hacking = false;
    private interactHeld = false;
    private exposure = 0;
    private knownLayout = '';
    private warned = '';
    private lastAllowed: Point = { x: 240, y: 0 };
    constructor(private s: MissionSimulation) {
        this.researchWaves = new MarsResearchWaves(s, (id, text) => this.say(id, text));
        const factory = s.enemyFactory;
        if (factory) {
            factory.launched = this.p.reinforcements.length;
            if (!factory.destroyed)
                factory.damage(900 - (this.baseFactory ? this.p.baseHealth : this.p.yardHealth));
            if (this.baseFactory) factory.active = this.p.baseAlarm;
            for (const e of this.p.reinforcements)
                if (
                    s.enemies.enemies.has(e.id) &&
                    marsArea(e) === (this.baseFactory ? 'surface' : 'asteroid')
                )
                    factory.units.add(e.id);
        }
        this.refreshLayout();
        this.spawnCargo();
        this.security.secured = this.p.baseNeutralized;
        if (this.p.baseNeutralized) this.security.disabledTime = Infinity;
        if (!s.campaign.story!.claimed.includes('mars-sector-secure'))
            this.say(
                'intro',
                'Ada Serrin: Rozpoczynamy operację. Przygotuj tarcze Satuk 15 i rozpoznaj możliwość lądowania na Marsie. Orbita jest na razie spokojna.',
            );
    }
    private get p() {
        return this.s.campaign.story!.mars;
    }
    get baseFactory() {
        return this.s.enemyFactory?.position.x === M.base.x;
    }
    get baseDiscovered() {
        return this.p.baseDiscovered || this.p.baseNeutralized;
    }
    get canProduce() {
        return (
            this.p.reinforcements.length < 1000 &&
            (!this.baseFactory || !!this.s.enemyFactory?.active)
        );
    }
    get status() {
        const e = this.s.escort;
        if (
            this.s.campaign.story!.claimed.includes('mars-sector-secure') &&
            !marsResearchComplete(this.s.campaign.story!)
        ) {
            if (e?.state === 'destroyed')
                return 'Kepler utracony · wróć do Satuk 15 po nową jednostkę';
            const waiting =
                e?.waitingReason === 'player'
                    ? 'zbliż się do Keplera'
                    : 'oczekiwanie na wolną trasę';
            if (e instanceof MarsResearchEscort && e.returning)
                return `Kepler · powrót do Satuk 15 · ${e.state === 'waiting' ? waiting : 'osłaniaj transport danych'}`;
            const action =
                e?.state === 'idle'
                    ? 'F przy statku: rozpocznij eskortę'
                    : e?.state === 'research'
                      ? e.scanning
                          ? `skan ${Math.floor(e.researchProgress)}/12 s`
                          : 'skan wstrzymany · osłaniaj Keplera'
                      : e?.state === 'waiting'
                        ? waiting
                        : 'lot do stanowiska';
            return `Kepler · pomiar ${this.p.researchSites + 1}/3 · ${action}`;
        }
        return marsSecurityObjective(this.s.campaign.story!);
    }
    get context() {
        if (this.exposure > 0) return 'ANOMALIA · 15 kadłuba/s · prędkość ograniczona do 25 m/s';
        if (
            this.baseFactory &&
            !this.p.baseNeutralized &&
            Math.hypot(this.s.position.x - M.terminal.x, this.s.position.y - M.terminal.y) < 125
        )
            return this.s.enemyFactory?.active
                ? 'Alarm instalacji · zniszcz rdzeń i odeprzyj posiłki'
                : 'F · szybkie włamanie: ułóż ścieżkę · uważaj na obracający się skaner';
        return '';
    }
    private say(id: string, text: string) {
        if (this.p.announcements.includes(id)) return;
        this.p.announcements.push(id);
        this.s.deliveryRevision++;
        this.s.radioMessages.push(text);
    }
    private refreshLayout() {
        const s = this.s,
            p = s.campaign.story!;
        const key = [
            phobosRouteOpen(p),
            p.mars.ambushEntered,
            phobosOrbitSecured(p),
            p.mars.aiIdentified,
            p.claimed.includes('mars-sector-secure'),
            p.mars.researchSites,
            p.mars.researchReturned,
            p.mars.baseNeutralized,
            p.mars.baseDiscovered,
            p.mars.yardDestroyed,
        ].join();
        if (key === this.knownLayout) return;
        this.knownLayout = key;
        s.ensureMarsResearchEscort();
        const generated = generateMarsActSector(p);
        s.syncMarsLayout(generated);
        s.sector.hyperlanes = marsSystemLanes(p);
        s.sector.regions = marsSystemZones(p);
        s.sector.landmarks = generated.landmarks;
        s.areaRevision++;
        this.spawnCargo();
    }
    private spawnCargo() {
        const s = this.s;
        if (
            phobosRouteOpen(s.campaign.story!) &&
            !this.p.announcements.includes('old-ship-delivery') &&
            !s.salvage.items.has(M.oldShipId)
        )
            s.salvage.add(M.oldShipId, 'patrol', M.oldShip, { x: 0, y: 0 });
        if (this.p.baseNeutralized && !this.p.memoryDelivered && !s.salvage.items.has(M.memoryId))
            s.salvage.add(M.memoryId, 'satellite', this.p.memoryPosition ?? M.memory, {
                x: 0,
                y: 0,
            });
        if (
            phobosRouteOpen(s.campaign.story!) &&
            !this.p.probeDelivered &&
            !s.salvage.items.has(M.probeId)
        )
            s.salvage.add(M.probeId, 'satellite', M.probe, { x: 0, y: 0 });
    }
    deliver(id: number) {
        const s = this.s,
            item = s.salvage.items.get(id);
        if (
            !item ||
            !([M.memoryId, M.probeId, M.oldShipId] as number[]).includes(id) ||
            Math.hypot(salvagePosition(item).x, salvagePosition(item).y) > GAME.dockRadius
        )
            return false;
        if (id === M.oldShipId) this.p.announcements.push('old-ship-delivery');
        else if (id === M.memoryId) {
            if (!this.p.baseNeutralized || this.p.memoryDelivered) return false;
            this.p.memoryDelivered = true;
            this.say(
                'memory-delivery',
                'Ivo Nadir: Moduł pamięci jest fizycznie w Satuk 15. Zakończ wyprawę — rozpoczynamy analizę danych.',
            );
        } else this.p.probeDelivered = true;
        s.salvage.remove(item);
        s.deliveryRevision++;
        syncStory(s.campaign);
        return true;
    }
    killed(id: number) {
        if (id >= 71000 && id < 75000 && !this.p.kills.includes(id)) this.p.kills.push(id);
    }
    factoryDestroyed() {
        if (this.baseFactory) {
            this.p.baseNeutralized = true;
            this.p.baseHealth = 0;
            this.say(
                'base',
                'Ada Serrin: Instalacja zneutralizowana. Odholuj moduł pamięci do Satuk 15 na analizę. Odzysk wraków statków i wyłączonych dronów jest opcjonalny.',
            );
        } else {
            this.p.yardDestroyed = true;
            this.p.yardHealth = 0;
            this.say(
                'yard',
                'Ada Serrin: Produkcja zatrzymana. Wypuszczone jednostki nadal są aktywne — oczyść dostępne obszary.',
            );
        }
        this.spawnCargo();
        syncStory(this.s.campaign);
        this.refreshLayout();
    }
    researchCompleted() {
        const s = this.s,
            e = s.escort;
        if (!(e instanceof MarsResearchEscort) || e.health <= 0) return;
        if (e.returning) {
            if (this.p.researchWaves < 4) return;
            this.p.researchReturned = true;
            this.say(
                'research-home',
                'Ivo Nadir: Kepler bezpiecznie wrócił do Satuk 15. Dane z trzech skanów są w stacji. Ekspedycja zakończona sukcesem.',
            );
        } else {
            this.p.researchSites = Math.min(3, this.p.researchSites + 1);
            this.say(
                `measure-${this.p.researchSites}`,
                this.p.researchSites === 3
                    ? 'Ivo Nadir: Trzeci skan zakończony. Kepler wraca z danymi do Satuk 15. Osłaniaj go do samej stacji.'
                    : `Ivo Nadir: Skan ${this.p.researchSites}/3 zakończony. Kepler leci do kolejnego stanowiska.`,
            );
            if (this.p.researchSites < 3) {
                e.resumeResearch(M.research[this.p.researchSites]);
                Object.assign(s.sector.researchSite, M.research[this.p.researchSites]);
            } else e.returnToStation();
        }
        syncStory(s.campaign);
        s.deliveryRevision++;
        this.refreshLayout();
    }
    private canHack() {
        const s = this.s;
        return (
            s.area === 'surface' &&
            !s.ended &&
            s.speed < 30 &&
            !s.thrusting &&
            !s.marsUnderFire &&
            !this.p.baseNeutralized &&
            !this.p.baseAlarm &&
            Math.hypot(s.position.x - M.terminal.x, s.position.y - M.terminal.y) < 125
        );
    }
    private alarmBase() {
        this.p.baseAlarm = true;
        this.security.raiseAlarm();
        if (this.baseFactory && this.s.enemyFactory) this.s.enemyFactory.active = true;
        this.hacking = false;
        this.s.terminalPuzzle = null;
        this.s.setNotice('Alarm Fobosa · wykryto intruza · baza produkuje posiłki');
        this.s.deliveryRevision++;
    }
    terminalAction(action: TerminalAction) {
        const s = this.s,
            puzzle = s.terminalPuzzle;
        if (!this.hacking || !puzzle) return false;
        if ('cancel' in action || !this.canHack()) {
            this.hacking = false;
            s.terminalPuzzle = null;
            return false;
        }
        const outcome = puzzle.act(action);
        if (outcome === 'alarm' || puzzle.trace >= 100) {
            this.alarmBase();
            return false;
        }
        if (outcome !== 'success') return false;
        this.hacking = false;
        s.terminalPuzzle = null;
        this.p.quietHack = true;
        this.security.secured = true;
        this.security.disabledTime = Infinity;
        this.security.alarm = 0;
        s.disableMarsPatrols(MARS_SURFACE_PATROLS);
        s.enemyFactory!.damage(s.enemyFactory!.health);
        this.factoryDestroyed();
        const pilot = s.campaign.pilots.find((p) => p.id === s.campaign.activeRun?.pilotId);
        if (pilot) {
            const result = awardPilotXp(pilot, 25);
            if (s.campaign.activeRun)
                s.campaign.activeRun.questXp =
                    (s.campaign.activeRun.questXp ?? 0) + result.gainedXp;
        }
        s.events.push({ ...M.base, kind: 'collect', sound: 'complete' });
        this.say(
            'hack',
            'Ivo Nadir: Ścieżka połączona. Baza i patrole wyłączone. Moduł pamięci trzeba odholować do Satuk 15; odzysk dronów jest opcjonalny.',
        );
        return true;
    }
    private updateBase(input: FlightInput, dt: number) {
        const s = this.s,
            pressed =
                input.interact && (s.interactionProgress?.fraction ?? 0) >= 1 && !this.interactHeld;
        this.interactHeld = input.interact && (s.interactionProgress?.fraction ?? 0) >= 1;
        const seen = this.security.sees(
            s.position,
            s.elapsed,
            s.opticalCloak ? 0 : 1,
            s.scannerLineClear(M.base, s.position),
        );
        const patrolSpotted =
            !s.opticalCloak &&
            MARS_SURFACE_PATROLS.some((id) => {
                const enemy = s.enemies.enemies.get(id);
                return (
                    enemy?.body.isEnabled() &&
                    enemy.state === 'chase' &&
                    enemy.target === 'player' &&
                    Math.hypot(
                        enemyPosition(enemy).x - s.position.x,
                        enemyPosition(enemy).y - s.position.y,
                    ) < enemy.config.detectRange &&
                    s.scannerLineClear(enemyPosition(enemy), s.position)
                );
            });
        if (
            !this.p.baseAlarm &&
            (patrolSpotted ||
                this.security.update(dt, seen).callGuards ||
                (Math.hypot(s.position.x - M.base.x, s.position.y - M.base.y) < 850 &&
                    (input.fire || s.marsUnderFire)))
        )
            this.alarmBase();
        if (this.hacking && (!s.terminalPuzzle || !this.canHack())) {
            this.hacking = false;
            s.terminalPuzzle = null;
        }
        if (this.hacking && s.terminalPuzzle?.tick(dt)) {
            this.alarmBase();
            return;
        }
        if (pressed && !this.hacking && this.canHack()) {
            s.terminalPuzzle = new TerminalPuzzle(
                'breach',
                s.hullId,
                s.campaign.activeRun!.seed ^ 0x7150,
            );
            s.terminalPuzzle.remaining = s.hullId === 'falcon' ? 20 : 15;
            this.hacking = true;
            s.setNotice('Połącz ścieżkę przed wykryciem · skaner i patrole nadal działają');
        }
    }
    update(input: FlightInput, dt: number) {
        const s = this.s,
            p = s.campaign.story!,
            point = s.position;
        const area = marsArea(point);
        const memory = s.salvage.items.get(M.memoryId);
        if (memory) this.p.memoryPosition = salvagePosition(memory);
        const allowed =
            area === 'orbit' ||
            (area === 'phobos' && phobosRouteOpen(p)) ||
            (area === 'surface' && s.area === 'surface' && phobosOrbitSecured(p)) ||
            (area === 'asteroid' && this.p.aiIdentified);
        if (!allowed && (!s.hyperdrive.active || area === 'surface')) {
            s.ship.setTranslation(
                {
                    x: this.lastAllowed.x / GAME.pixelsPerMeter,
                    y: this.lastAllowed.y / GAME.pixelsPerMeter,
                },
                true,
            );
            s.ship.setLinvel({ x: 0, y: 0 }, true);
            s.radioMessages.push(
                'Ada Serrin: Ten obszar pozostaje niedostępny. Zaczekaj na potwierdzenie trasy.',
            );
        } else if (allowed) this.lastAllowed = { ...point };
        if (
            !this.p.landingBlocked &&
            Math.hypot(point.x - M.landing.x, point.y - M.landing.y) < 1100
        ) {
            this.p.landingBlocked = true;
            this.say(
                'barrier',
                'Ivo Nadir: Próba lądowania nieudana. Bariera anomalii odcina powierzchnię Marsa. Obecna technologia nie pozwala jej bezpiecznie pokonać. Zbadamy dostępne obszary sektora.',
            );
        }
        if (phobosRouteOpen(p))
            this.say(
                'route',
                'Ada Serrin: Tarcze Satuk 15 działają. Skany wykryły korytarz przez anomalie do hiperśluzy na Fobosa.',
            );
        if (area === 'phobos' && phobosRouteOpen(p) && !this.p.ambushEntered) {
            this.p.ambushEntered = true;
            this.refreshLayout();
            s.enemies.alert(MARS_AMBUSH, point);
            s.deliveryRevision++;
        }
        if (phobosOrbitSecured(p))
            this.say(
                'secured',
                'Ada Serrin: To była zasadzka. Drony zostały zniszczone, ale zachowaj ostrożność. Zejdź na Fobosa i sprawdź, co się tam dzieje.',
            );
        const factory = s.enemyFactory;
        if (
            area === 'surface' &&
            s.area === 'surface' &&
            Math.hypot(point.x - M.base.x, point.y - M.base.y) < 650 &&
            !this.p.baseDiscovered
        ) {
            this.p.baseDiscovered = true;
            this.say(
                'discovery',
                'Ivo Nadir: Wśród złóż wykryłem ukrytą instalację. Podejdź od wschodu do terminala bez alarmu albo zneutralizuj jej systemy w walce.',
            );
        }
        if (factory) {
            if (this.baseFactory) {
                this.p.baseHealth = factory.health;
                this.p.baseAlarm = factory.active;
            } else this.p.yardHealth = factory.health;
        }
        if (
            this.baseFactory &&
            factory &&
            !factory.destroyed &&
            area === 'surface' &&
            s.area === 'surface'
        ) {
            this.updateBase(input, dt);
        }
        if (factory)
            for (const id of factory.units) {
                const enemy = s.enemies.enemies.get(id);
                if (enemy && !this.p.reinforcements.some((e) => e.id === id))
                    this.p.reinforcements.push({ id, kind: enemy.kind, ...enemyPosition(enemy) });
            }
        const contaminated =
            s.area === 'orbit' &&
            marsAnomalyClearance(point, s.marsOrbit) <=
                Math.max(...s.hullConfig.hitbox) * s.hullConfig.size;
        this.exposure = contaminated && !s.hyperdrive.active ? this.exposure + dt : 0;
        if (this.exposure > 0) {
            s.applyAnomalyExposure(ANOMALY.damagePerSecond * dt);
            if (this.warned !== 'anomaly') {
                this.warned = 'anomaly';
                this.say(
                    'anomaly',
                    'Ivo Nadir: Skażenie anomalią! Opuść włókna. Potrzebujemy innej technologii, aby wyciąć tu przejście.',
                );
            }
        }
        this.researchWaves.update(dt);
        const change = syncStory(s.campaign);
        if (change?.titles.length) s.deliveryRevision++;
        this.refreshLayout();
    }
}
