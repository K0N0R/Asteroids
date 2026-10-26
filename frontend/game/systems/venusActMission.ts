import { segmentDistance } from './hyperdrive';
import RAPIER from '@dimforge/rapier2d-compat';
import { GAME } from '../config';
import { venusProgress, venusObjective } from '../state/venusAct';
import { completeVenusTask } from '../state/venusActions';
import {
    V,
    VENUS_MAPS,
    venusMapAt,
    nearestVenusMap,
    venusLanes,
    venusLandmarks,
    venusStorms,
    type VenusArea,
} from '../worlds/venusLayout';
import { VenusProbe } from './venusProbe';
import { VenusPower, type VenusPowerAction } from './venusPower';
import { VENUS_LAB_MODULES, laboratoryHull } from '../worlds/venusLaboratory';
import { assaultEntry } from './assaultEntry';
import { enemyPosition } from './enemies';
import type { Point } from '../worlds/sector';
import type { FlightInput, MissionSimulation } from './mission';
import type { InteractionTarget } from './interactionTarget';

const P = GAME.pixelsPerMeter,
    CORE = 81900,
    ANCHORS = [81901, 81902];
export class VenusActMission {
    area: VenusArea = 'orbit';
    progress = 0;
    packet: 'archive' | 'final' | null = null;
    guardianAwake = false;
    guardianTime = 0;
    guardianPhase = 0;
    private held = false;
    private layout = '';
    powerPuzzle: VenusPower | null = null;
    readonly obstacles = new Set<number>();
    private hulls: RAPIER.Collider[] = [];
    private nextEnemy = 81200;
    private waves = new Set<number>();
    constructor(private s: MissionSimulation) {
        venusProgress(this.p);
        const center = VENUS_MAPS.station.center;
        for (const m of VENUS_LAB_MODULES) {
            const shape = RAPIER.ColliderDesc.convexHull(
                new Float32Array(laboratoryHull(m).flatMap((q) => [q.x / P, q.y / P])),
            )!;
            const hull = this.s.world.createCollider(
                shape.setTranslation(center.x / P, center.y / P).setRestitution(0.15),
            );
            this.hulls.push(hull);
            this.obstacles.add(hull.handle);
        }
        this.refresh();
        this.say(
            'intro',
            'Ada Serrin: Orbita Wenus jest dostępna, ale zejście na powierzchnię wykluczamy. Odczytaj lokalny przekaźnik. Widzimy opuszczoną infrastrukturę i aktywne kontakty SI.',
        );
        this.ensureProbe();
    }
    private get p() {
        return this.s.campaign.story!;
    }
    private get v() {
        return venusProgress(this.p);
    }
    private has(id: string) {
        return this.p.claimed.includes(id);
    }
    get map() {
        return VENUS_MAPS[this.area];
    }
    get stormInterference() {
        return this.area === 'atmosphere';
    }
    get status() {
        if (this.powerPuzzle) return 'Zasilanie stacji · odizoluj przebicie i połącz trzy obwody';
        if (this.packet) return 'Pakiet na pokładzie · wróć i zadokuj do Satuk 15';
        if (this.guardianAwake)
            return `Strażnik · ${this.guardianPhase === 0 ? 'zniszcz dwie kotwy osłony' : this.guardianPhase === 1 ? 'rdzeń odsłonięty' : 'rdzeń krytyczny'} · ${Math.ceil(this.s.enemies.enemies.get(CORE)?.health ?? 0)} HP`;
        if (this.v.probeBuilt && !this.has('venus-atmospheric-probe')) {
            const e = this.s.escort;
            if (e?.state === 'destroyed')
                return 'Sonda utracona · wróć do Satuk 15 po jednostkę zastępczą';
            if (e instanceof VenusProbe && e.stage === 'atmosphere') {
                const pause = {
                    threat: 'odeprzyj drony',
                    distance: 'zbliż się do sondy',
                    recovering: 'ponowna kalibracja po trafieniu',
                    incoming: 'oczekiwanie na bezpieczne podejście',
                };
                return `${e.sampleTarget.name} · dane ${this.v.transmission}/3 · ${e.state === 'research' ? `${Math.floor(e.sampleProgress)}/15 s · ${e.blocked ? pause[e.blocked] : 'transmisja aktywna'}` : 'lot do miejsca pomiaru'}`;
            }
        }
        return venusObjective(this.p);
    }
    get waypoint(): Point & { name: string } {
        let q: Point = { x: 0, y: 0 },
            name = 'Satuk 15';
        if (this.packet) {
            /* Return using the local exit first. */
        } else if (!this.has('venus-toxic-orbit')) {
            q = V.relay;
            name = 'Przekaźnik orbity Wenus';
        } else if (!this.has('venus-dead-laboratory')) {
            q = this.v.powerRestored ? V.archive : V.power;
            name = this.v.powerRestored ? 'Archiwum stacji' : 'Zasilanie awaryjne';
        } else if (!this.has('venus-atmospheric-probe') && this.v.probeBuilt) {
            q = this.s.escort?.position ?? V.probe;
            name = 'Sonda atmosferyczna';
            if (
                this.s.escort instanceof VenusProbe &&
                this.s.escort.started &&
                this.s.escort.stage === 'orbit' &&
                this.s.escort?.state === 'complete'
            ) {
                q = V.atmosphereGate;
                name = 'Wejście w górną atmosferę';
            }
        } else if (this.has('venus-horizon-project') && !this.has('venus-mercury-signal')) {
            q = V.terminal;
            name = this.guardianAwake ? 'Strażnik' : 'Terminal instalacji SI';
            if (this.guardianAwake) q = enemyPosition(this.s.enemies.enemies.get(CORE)!);
        }
        return this.navigate(q, name);
    }
    navigate(q: Point, name: string) {
        const dest = nearestVenusMap(q).id;
        if (dest !== this.area) {
            const lane = venusLanes(this.p).find((l) =>
                this.area === 'orbit'
                    ? nearestVenusMap(l.b).id === dest
                    : nearestVenusMap(l.b).id === this.area,
            );
            if (lane) return { ...(this.area === 'orbit' ? lane.a : lane.b), name: lane.name };
        }
        return { ...q, name };
    }
    private say(id: string, text: string) {
        if (this.v.announcements.includes(id)) return;
        this.v.announcements.push(id);
        this.s.radioMessages.push(text);
        this.s.deliveryRevision++;
    }
    private complete(id: string) {
        completeVenusTask(this.s.campaign, id);
        this.s.deliveryRevision++;
        this.refresh();
    }
    private refresh() {
        const key = this.p.claimed.join() + this.v.probeBuilt;
        if (key === this.layout) return;
        this.layout = key;
        this.s.sector.hyperlanes = venusLanes(this.p);
        this.s.sector.landmarks = venusLandmarks(this.p);
        this.s.areaRevision++;
    }
    private ensureProbe() {
        if (!this.v.probeBuilt || this.has('venus-atmospheric-probe') || this.s.escort) return;
        const e = new VenusProbe(this.s.world, { ...V.atmosphereGate });
        this.s.escort = e;
        e.ambushed = true;
    }
    powerAction(action: VenusPowerAction) {
        if (!this.powerPuzzle) return false;
        if ('cancel' in action) {
            this.powerPuzzle = null;
            return false;
        }
        const complete = this.powerPuzzle.act(action);
        this.v.powerGrid = {
            isolated: this.powerPuzzle.state.isolated,
            rotations: [...this.powerPuzzle.state.rotations],
        };
        this.s.deliveryRevision++;
        if (complete) {
            this.v.powerRestored = true;
            this.powerPuzzle = null;
            this.s.events.push({ ...V.power, kind: 'collect', sound: 'complete', rich: true });
            this.s.setNotice(
                'Chłodzenie, sterowanie i archiwum aktywne · podejdź do terminala archiwum',
            );
        }
        return complete;
    }
    get targets(): (InteractionTarget & { radius: number })[] {
        const list: (InteractionTarget & { radius: number })[] = [];
        const add = (id: string, p: Point, name: string, radius = 70) =>
            list.push({ ...p, id: `venus:${id}`, kind: 'world', name, radius });
        if (this.area === 'orbit' && !this.has('venus-toxic-orbit'))
            add('relay', V.relay, 'Odczytaj przekaźnik', 130);
        if (
            this.area === 'station' &&
            this.has('venus-toxic-orbit') &&
            !this.has('venus-dead-laboratory')
        ) {
            if (!this.v.powerRestored) add('power', V.power, 'Przywróć zasilanie', 95);
            else if (!this.packet) add('archive', V.archive, 'Pobierz archiwum', 100);
        }
        if (this.area === 'orbit' && this.s.escort?.state === 'idle')
            add('probe', this.s.escort.position, 'Rozpocznij eskortę sondy', 55);
        if (
            this.area === 'installation' &&
            this.has('venus-horizon-project') &&
            !this.guardianAwake &&
            !this.packet &&
            !this.has('venus-mercury-signal')
        )
            add(
                'terminal',
                V.terminal,
                this.has('venus-guardian') ? 'Pobierz pakiet danych' : 'Odzyskaj specyfikację',
                100,
            );
        return list;
    }
    candidates() {
        return this.targets.filter(
            (t) => Math.hypot(t.x - this.s.position.x, t.y - this.s.position.y) < 190,
        );
    }
    onGate(from: Point, to: Point) {
        const next = nearestVenusMap(to).id,
            e = this.s.escort;
        if (
            e &&
            e instanceof VenusProbe &&
            e.started &&
            e.state !== 'destroyed' &&
            !this.has('venus-atmospheric-probe') &&
            Math.hypot(e.position.x - from.x, e.position.y - from.y) < 750 &&
            ['orbit', 'atmosphere'].includes(next)
        ) {
            e.body.setTranslation({ x: (to.x + 90) / P, y: to.y / P }, true);
            e.body.setLinvel({ x: 0, y: 0 }, true);
            e.previous = e.position;
            if (next === 'atmosphere') e.enterAtmosphere(this.v.transmission);
            else e.launch();
        }
        if (this.area === 'installation' && next !== 'installation' && this.guardianAwake)
            this.resetGuardian();
        this.area = next;
        this.s.areaRevision++;
        if (next === 'station' && !this.v.powerRestored)
            this.say(
                'laboratory-entry',
                'Ivo Nadir: Stacja jest bez zasilania. Odszukaj zewnętrzną konsolę przy reaktorze. Najpierw odetnij przebicie, potem połącz trzy obwody. Możesz spokojnie próbować — niczego tu nie zużyjesz.',
            );
        if (next === 'atmosphere' && !this.has('venus-atmospheric-probe'))
            this.say(
                'atmosphere-entry',
                'Ivo Nadir: Jesteśmy w górnych chmurach Wenus. Sonda wykona trzy różne pomiary. Trzymaj się blisko i osłaniaj ją. Po odparciu dronów badanie wznowi się samo; zapisane próbki pozostaną bezpieczne. Omijaj oznaczone burze.',
            );
    }
    gateLock(to: Point) {
        if (nearestVenusMap(to).id === 'atmosphere' && !this.has('venus-atmospheric-probe')) {
            const e = this.s.escort;
            if (
                !e ||
                !(e instanceof VenusProbe) ||
                !e.started ||
                e.state === 'destroyed' ||
                Math.hypot(e.position.x - V.atmosphereGate.x, e.position.y - V.atmosphereGate.y) >
                    650
            )
                return 'Najpierw doprowadź sondę do wejścia w atmosferę.';
        }
        return null;
    }
    dock() {
        if (this.packet === 'archive') {
            this.complete('venus-dead-laboratory');
            this.say(
                'archive',
                'Ivo Nadir: Archiwum zabezpieczone. SI prowadziła tu eksperymenty z anomalią. Dalsze wyniki wysyłano do instalacji atmosferycznej. W Warsztacie przygotowaliśmy projekt odpornej sondy.',
            );
        }
        if (this.packet === 'final') {
            this.complete('venus-mercury-signal');
            this.say(
                'finale',
                'Ada Serrin: Pakiet zabezpieczony. Materiał rdzenia produkuje instalacja przemysłowa SI na Merkurym, zasilana energią Słońca. Mamy współrzędne podejścia i parametry ochrony termicznej. Następny kierunek: Merkury.',
            );
        }
        this.packet = null;
    }
    private activate(id: string) {
        if (id === 'venus:relay') {
            this.complete('venus-toxic-orbit');
            this.say(
                'relay',
                'Ivo Nadir: Odczyt odebrany. Odszukaliśmy stację badawczą na północnym zachodzie. Brak odpowiedzi personelu; sprawdź archiwum przez jej śluzę.',
            );
        }
        if (id === 'venus:power') {
            this.powerPuzzle = new VenusPower(this.v.powerGrid);
        }
        if (id === 'venus:archive') {
            this.packet = 'archive';
            this.s.setNotice('Archiwum na pokładzie · zadokuj do Satuk 15');
        }
        if (id === 'venus:probe' && this.s.escort instanceof VenusProbe) {
            this.s.escort.launch();
        }
        if (id === 'venus:terminal') {
            if (this.has('venus-guardian')) {
                this.packet = 'final';
                this.s.setNotice('Pakiet na pokładzie · dostarcz do Satuk 15');
            } else this.wakeGuardian();
        }
    }
    private entry(site: Point, phase: number, reserved: Point[] = []) {
        return assaultEntry(
            site,
            40,
            this.s.combatView,
            this.map.center,
            this.map.radius,
            phase,
            (p) =>
                reserved.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 120) ||
                venusStorms(this.s.elapsed).some(
                    (h) =>
                        this.area === 'atmosphere' && segmentDistance(h, p, site) < h.radius + 120,
                ) ||
                [...this.s.rocks.values()].some((r) => {
                    const q = r.body.translation();
                    return Math.hypot(p.x - q.x * P, p.y - q.y * P) < r.radius + 120;
                }),
        );
    }
    private spawnWave(count: number, key: number, site: Point) {
        if (this.waves.has(key)) return true;
        const entries: Point[] = [];
        for (let i = 0; i < count; i++) {
            const p = this.entry(site, i * 2.4 + key, entries);
            if (!p) return false;
            entries.push(p);
        }
        const ids: number[] = [];
        entries.forEach((p, i) => {
            const id = this.nextEnemy++;
            ids.push(id);
            this.s.enemies.add([
                {
                    ...p!,
                    id,
                    home: { ...site },
                    phase: 0,
                    kind: 'patrol',
                    assault: true,
                    route: [{ ...site }],
                },
            ]);
            const e = this.s.enemies.enemies.get(id)!;
            e.config = { ...e.config, detectRange: 4000, loseRange: 6000, leash: 10000 };
        });
        this.s.enemies.alert(ids, site);
        this.waves.add(key);
        return true;
    }
    private wakeGuardian() {
        this.guardianAwake = true;
        this.guardianTime = 0;
        this.guardianPhase = 0;
        this.s.enemies.add([
            {
                ...V.guardian,
                home: { ...V.guardian },
                id: CORE,
                phase: 0,
                kind: 'lancer',
                assault: true,
            },
            ...V.anchors.map((p, i) => ({
                ...p,
                home: { ...p },
                id: ANCHORS[i],
                phase: 0,
                kind: 'patrol' as const,
                assault: true,
            })),
        ]);
        for (const id of [CORE, ...ANCHORS]) {
            const e = this.s.enemies.enemies.get(id)!;
            const core = id === CORE;
            e.health = core ? 420 : 80;
            if (core) e.collider.setShape(new RAPIER.Ball(65 / P));
            e.config = {
                ...e.config,
                hull: e.health,
                radius: core ? 65 : e.config.radius,
                chaseSpeed: core ? 85 : 0,
                patrolSpeed: 0,
                strafe: 0,
                detectRange: 2600,
                loseRange: 4000,
                leash: 3000,
                windup: core ? 1.4 : 1,
                shotInterval: core ? 1.6 : 2.2,
            };
            e.weaponDisabled = 3;
        }
        this.say(
            'guardian',
            'Ada Serrin: System obronny właśnie się uruchomił. Dwie kotwy utrzymują osłonę rdzenia — odetnij je, zanim zaatakujesz centrum.',
        );
    }
    allowDamage(id: number) {
        return (
            id !== CORE ||
            (this.guardianTime >= 3 && ANCHORS.every((id) => !this.s.enemies.enemies.has(id)))
        );
    }
    killed(id: number) {
        if (id === CORE && this.guardianAwake) {
            this.guardianAwake = false;
            this.v.guardianDefeated = true;
            this.complete('venus-guardian');
            this.say(
                'victory',
                'Ada Serrin: Rdzeń wyłączony. Terminal odzyskał zasilanie awaryjne. Pobierz końcowy pakiet i dostarcz go do Satuk 15.',
            );
        }
    }
    private resetGuardian() {
        for (const id of [CORE, ...ANCHORS]) {
            const e = this.s.enemies.enemies.get(id);
            if (e) this.s.enemies.remove(e.id);
        }
        this.guardianAwake = false;
    }
    update(input: FlightInput, dt: number) {
        this.refresh();
        this.ensureProbe();
        for (const hull of this.hulls) hull.setEnabled(this.area === 'station');
        if (
            this.powerPuzzle &&
            (this.area !== 'station' ||
                Math.hypot(this.s.position.x - V.power.x, this.s.position.y - V.power.y) > 240)
        )
            this.powerPuzzle = null;
        const target = this.s.interaction.target;
        if (!input.interact) this.held = false;
        if (
            input.interact &&
            target?.id.startsWith('venus:') &&
            !this.held &&
            !input.fire &&
            !input.mine &&
            !input.thrust &&
            !input.repair &&
            this.s.speed < 60 &&
            !this.s.marsUnderFire &&
            !this.powerPuzzle
        ) {
            this.progress += dt;
            if (this.progress + 1e-8 >= 1) {
                this.held = true;
                this.progress = 0;
                this.activate(target.id);
            }
        } else this.progress = 0;
        if (this.s.hyperdrive.active) return;
        if (this.guardianAwake) {
            this.guardianTime += dt;
            const e = this.s.enemies.enemies.get(CORE);
            if (e) {
                this.guardianPhase = ANCHORS.some((id) => this.s.enemies.enemies.has(id))
                    ? 0
                    : e.health > 210
                      ? 1
                      : 2;
                if (this.guardianPhase === 2) {
                    e.config = { ...e.config, shotInterval: 1.1 };
                    this.spawnWave(2, 99, V.guardian);
                }
            }
        }
        const e = this.s.escort;
        if (
            e instanceof VenusProbe &&
            e.started &&
            !this.has('venus-atmospheric-probe') &&
            e.state !== 'destroyed' &&
            nearestVenusMap(e.position).id === this.area
        ) {
            const obstacles = [...this.s.rocks.values()]
                .filter((r) => r.body.isEnabled())
                .map((r) => {
                    const q = r.body.translation();
                    return { x: q.x * P, y: q.y * P, radius: r.radius };
                });
            const near = [...this.s.enemies.enemies.values()].some(
                (x) =>
                    x.body.isEnabled() &&
                    Math.hypot(
                        enemyPosition(x).x - e.position.x,
                        enemyPosition(x).y - e.position.y,
                    ) < 700,
            );
            const waveReady =
                e.stage !== 'atmosphere' ||
                e.state !== 'research' ||
                this.v.transmission === 2 ||
                this.spawnWave(this.v.transmission + 2, 10 + this.v.transmission, e.position);
            const sampleComplete = e.update(dt, this.s.position, obstacles, near, waveReady);
            if (e.stage === 'orbit') {
                if (
                    Math.hypot(
                        e.position.x - V.atmosphereGate.x,
                        e.position.y - V.atmosphereGate.y,
                    ) < 2300
                )
                    this.spawnWave(2, 0, e.position);
            } else if (sampleComplete) {
                this.v.transmission++;
                this.s.deliveryRevision++;
                this.s.events.push({
                    ...e.position,
                    kind: 'collect',
                    sound: 'complete',
                    rich: true,
                });
                this.s.setNotice(
                    `${e.sampleTarget.name} · próbka zapisana (${this.v.transmission}/3)${this.v.transmission < 3 ? ' · leć z sondą do następnego pomiaru' : ' · transmisja ukończona'}`,
                );
                if (this.v.transmission >= 3) {
                    e.state = 'complete';
                    e.scanning = false;
                    e.collider.setSensor(true);
                    this.complete('venus-atmospheric-probe');
                    this.say(
                        'transmission',
                        'Ivo Nadir: Pełna transmisja została odebrana w Satuk 15. Wróć do Laboratorium, żeby przeanalizować dane.',
                    );
                } else e.moveToSample(this.v.transmission);
            }
        }
        if (
            this.area === 'atmosphere' &&
            venusStorms(this.s.elapsed).some(
                (h) => Math.hypot(this.s.position.x - h.x, this.s.position.y - h.y) < h.radius,
            )
        )
            this.s.applyAnomalyExposure(8 * dt);
    }
}
