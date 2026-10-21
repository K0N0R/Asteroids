import { GAME } from '../config';
import { syncStory } from '../state/story';
import {
    MARS_ACT as M,
    marsArea,
    phobosRouteOpen,
    phobosOrbitSecured,
    marsSecurityObjective,
} from '../state/marsAct';
import {
    marsSystemLanes,
    marsSystemZones,
    generateMarsActSector,
    MARS_ANOMALIES,
} from '../worlds/marsSystem';
import { ANOMALY, polygonDistance } from './anomalyField';
import { enemyPosition } from './enemies';
import { salvagePosition } from './salvage';
import { awardPilotXp } from '../state/pilots';
import type { FlightInput, MissionSimulation } from './mission';
import type { Point } from '../worlds/sector';

export class MarsActMission {
    private hack = 0;
    private exposure = 0;
    private knownLayout = '';
    private warned = '';
    private lastAllowed: Point = { x: 240, y: 0 };
    constructor(private s: MissionSimulation) {
        const factory = s.enemyFactory;
        if (factory) {
            factory.launched = this.p.reinforcements.length;
            if (!factory.destroyed)
                factory.damage(900 - (this.baseFactory ? this.p.baseHealth : this.p.yardHealth));
            if (this.baseFactory) factory.active = this.p.baseAlarm;
            for (const e of this.p.reinforcements)
                if (s.enemies.enemies.has(e.id)) factory.units.add(e.id);
        }
        this.refreshLayout();
        this.spawnCargo();
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
            this.p.researchSites < 3
        )
            return `Kepler · pomiar ${this.p.researchSites + 1}/3 · ${e?.state === 'destroyed' ? 'jednostka utracona, wróć po nową' : e?.state === 'idle' ? 'E przy statku: rozpocznij eskortę' : e?.state === 'research' ? `skan ${Math.floor(e.researchProgress)}/12 s` : (e?.state ?? 'przygotowanie')}`;
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
                : `E · włamanie bez alarmu · ${Math.floor((this.hack / 5) * 100)}%`;
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
            phobosOrbitSecured(p),
            p.mars.aiIdentified,
            p.claimed.includes('mars-sector-secure'),
            p.mars.researchSites,
            p.mars.baseNeutralized,
            p.mars.baseDiscovered,
            p.mars.yardDestroyed,
        ].join();
        if (key === this.knownLayout) return;
        this.knownLayout = key;
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
            ![M.memoryId, M.probeId].includes(id as typeof M.memoryId) ||
            Math.hypot(salvagePosition(item).x, salvagePosition(item).y) > GAME.dockRadius
        )
            return false;
        if (id === M.memoryId) {
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
                'Ada Serrin: Instalacja zneutralizowana. Zabezpiecz moduł pamięci i odholuj go bezpośrednio do Satuk 15. Radio nie zastąpi dostawy danych.',
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
        if (!e) return;
        this.p.researchSites = Math.min(3, this.p.researchSites + 1);
        this.say(
            `measure-${this.p.researchSites}`,
            this.p.researchSites === 3
                ? 'Ivo Nadir: Mamy trzy komplety pomiarów. Wycofujemy ekspedycję. Wróć do Satuk 15 na analizę próbek.'
                : `Ivo Nadir: Pomiar ${this.p.researchSites}/3 zakończony. Kepler kieruje się do kolejnego miejsca.`,
        );
        if (this.p.researchSites < 3) {
            e.resumeResearch(M.research[this.p.researchSites]);
            Object.assign(s.sector.researchSite, M.research[this.p.researchSites]);
        }
        syncStory(s.campaign);
        s.deliveryRevision++;
        this.refreshLayout();
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
            Math.hypot(point.x - M.landing.x, point.y - M.landing.y) < 400
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
            this.say(
                'ambush',
                'Ada Serrin: Trzy wrogie kontakty przy Fobosie! Odeprzyj atak, zanim podejdziesz do powierzchni.',
            );
        }
        if (phobosOrbitSecured(p))
            this.say(
                'secured',
                'Ada Serrin: Orbita Fobosa zabezpieczona. Śluza lądowania otwarta. Zbadaj złoża i ukrytą instalację.',
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
                'Ivo Nadir: Wśród złóż wykryłem ukrytą instalację. Podejdź od zachodu do terminala bez alarmu albo zneutralizuj jej systemy w walce.',
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
            const near = Math.hypot(point.x - M.base.x, point.y - M.base.y) < 650;
            if (near && (point.x > M.base.x - 60 || input.fire)) factory.active = true;
            const ready =
                !factory.active &&
                this.context &&
                input.interact &&
                !input.fire &&
                !input.mine &&
                !input.thrust &&
                s.speed < 30 &&
                !s.marsUnderFire;
            this.hack = ready ? this.hack + dt : 0;
            if (this.hack >= 5) {
                this.p.quietHack = true;
                factory.damage(factory.health);
                this.factoryDestroyed();
                const pilot = s.campaign.pilots.find(
                    (pilot) => pilot.id === s.campaign.activeRun?.pilotId,
                );
                if (pilot) {
                    const result = awardPilotXp(pilot, 80);
                    if (s.campaign.activeRun)
                        s.campaign.activeRun.questXp =
                            (s.campaign.activeRun.questXp ?? 0) + result.gainedXp;
                }
                this.say(
                    'hack',
                    'Ivo Nadir: Ciche włamanie udane. Obrona wyłączona; pilot otrzymuje 80 PD.',
                );
            }
        }
        if (factory)
            for (const id of factory.units) {
                const enemy = s.enemies.enemies.get(id);
                if (enemy && !this.p.reinforcements.some((e) => e.id === id))
                    this.p.reinforcements.push({ id, kind: enemy.kind, ...enemyPosition(enemy) });
            }
        const contaminated =
            s.area === 'orbit' &&
            MARS_ANOMALIES.some(
                (band) =>
                    polygonDistance(point, band) <=
                    Math.max(...s.hullConfig.hitbox) * s.hullConfig.size,
            );
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
        const e = s.escort;
        if (
            e &&
            p.claimed.includes('mars-sector-secure') &&
            this.p.researchSites < 3 &&
            ['travel', 'waiting', 'research'].includes(e.state)
        ) {
            const index = this.p.researchSites;
            const near =
                Math.hypot(e.position.x - M.research[index].x, e.position.y - M.research[index].y) <
                500;
            if (near && this.p.researchWaves <= index) {
                this.p.researchWaves = index + 1;
                const count = index + 2;
                s.enemies.add(
                    Array.from({ length: count }, (_, i) => ({
                        id: 74010 + index * 10 + i,
                        x: M.research[index].x + Math.cos(i * 2.4) * 650,
                        y: M.research[index].y + Math.sin(i * 2.4) * 650,
                        home: { ...M.research[index] },
                        phase: 0,
                        kind: i === count - 1 ? ('lancer' as const) : ('patrol' as const),
                    })),
                );
                this.say(
                    `wave-${index}`,
                    'Ada Serrin: Jednostki ukryte w anomaliach wychodzą na przechwycenie Keplera. Osłaniaj statek badawczy!',
                );
            }
        }
        const change = syncStory(s.campaign);
        if (change?.titles.length) s.deliveryRevision++;
        this.refreshLayout();
    }
}
