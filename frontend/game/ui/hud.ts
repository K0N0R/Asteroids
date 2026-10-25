import { ShipAbilityHud } from './shipAbilityHud';
import { magneticBoundaryArcs } from '../systems/magneticZones';
import { RESOURCE_IDS, RESOURCES, resourceSummary, resourceTotal } from '../state/resources';
import { salvagePosition } from '../systems/salvage';
import { radarRocks } from './radarRocks';
import { drawRadarAnomaly } from './radarAnomaly';
import { RadarTrail } from '../systems/radarTrail';
import {
    gateRadarFrame,
    radarPoint,
    RADAR_RADIUS,
    RADAR_ZOOMS,
    zoomRadarFrame,
} from '../systems/radarFrame';
import { sentryPosition } from '../systems/stationSentries';
import { Container, Graphics } from 'pixi.js';
import { Typography } from '../../core/containers/components/typography';
import { CONTRACTS, GAME, SCAN_SITES, DRONES } from '../config';
import { C } from '../graphics/shapes';
import { MissionSimulation } from '../systems/mission';
import { navigationWaypoint } from '../worlds/sector';
import { EnemyNavigation } from '../systems/enemyNavigation';
import { enemyPosition } from '../systems/enemies';
import { MOON } from '../worlds/moon';
import { PHOBOS_MAZE_ENTRY, PHOBOS_MAZE_GATE } from '../worlds/phobosMaze';
import { phobosRouteOpen, MARS_ACT } from '../state/marsAct';
import { MARS_GATES, marsOrbitAt } from '../worlds/marsLayout';
import { MARS_MOONS } from '../worlds/marsMoons';
import { STORY_TASKS } from '../state/story';
import { flightHint, missionObjectives } from './missionReadout';
import { hudLabel as label, keyHint, mouseHint, objectiveMark } from './hudIcons';

export class MissionHud extends Container {
    cameraAngle = 0;
    target = 1;
    private mineralTitle: Typography;
    private mineralContents: Typography;
    private mineralHint: Typography;
    private health: Typography;
    private shieldValue: Typography;
    private context: Typography;
    private direction: Typography;
    private goals: Typography[] = [];
    private selectedGoal: Typography;
    private selection = new Graphics();
    private goalStep = 28;
    private checks = new Graphics();
    private recoveryWasSecured = false;
    private towedIds = '';
    private wreckId: number | null = null;
    private lastSurveyCount = 0;
    private combatComplete = false;
    private enemyNavigation = new EnemyNavigation();
    private trail = new RadarTrail();
    private trails = new Map<string, RadarTrail>();
    private radarZoomIndex = 1;
    private radarHint: Typography;
    private radarClip = new Graphics().circle(1470, 130, RADAR_RADIUS).fill(0xffffff);
    zoomRadar(direction: number) {
        this.radarZoomIndex = Math.max(
            0,
            Math.min(RADAR_ZOOMS.length - 1, this.radarZoomIndex + direction),
        );
        this.radarHint.setText(`[ / ]  radar ×${RADAR_ZOOMS[this.radarZoomIndex]}`);
        this.throttle = 0;
        this.refresh();
    }
    private map = new Graphics();
    private meters = new Graphics();
    private arrow = new Graphics();
    private throttle = 0;
    private areaRevision = 0;
    private abilitiesHud: ShipAbilityHud;
    private noticePanel = new Container();
    private noticeInk = new Graphics();
    private noticeText: Typography;
    private orderStatus: Typography | null = null;
    private defenseStatus: Typography | null = null;
    private convoyStatus: Typography | null = null;
    private rescueStatus: Typography | null = null;
    private guideStatus: Typography | null = null;
    private anomalyStatus: Typography | null = null;
    private areaTitle: Typography | null = null;
    constructor(
        readonly sim: MissionSimulation,
        private contract: number,
        openDetails: () => void = () => {},
        private customObjectives?: () => ReturnType<typeof missionObjectives>,
        objectivesTitle = 'CEL PRÓBY',
    ) {
        super();
        this.eventMode = 'passive';
        this.goalStep = customObjectives ? 40 : 28;
        const firstSite = CONTRACTS[contract].sites[0];
        if (firstSite) this.target = SCAN_SITES[firstSite].key - 1;
        if (CONTRACTS[contract].kills) this.trackEnemy();
        if (sim.recoverySignal) this.target = 5;
        if (sim.miningEscort) this.target = 15;
        if (sim.factoryMission) this.target = 4;
        if (sim.rescueOperation) this.target = 16;
        this.addChild(
            this.selection,
            this.meters,
            this.map,
            this.radarClip,
            this.checks,
            this.arrow,
        );
        this.map.mask = this.radarClip;
        for (const graphic of [this.selection, this.meters, this.map, this.checks, this.arrow])
            graphic.eventMode = 'none';
        this.health = label(this, '', 80, 41, 20);
        this.shieldValue = label(this, '', 342, 43, 17, 0x86bded);
        if (sim.marsAct || sim.venusAct) this.areaTitle = label(this, '', 40, 145, 18, C.cyan, 700);
        if (
            sim.surfaceUnlocked ||
            sim.orbitalBaseSector ||
            sim.mercurySector ||
            sim.beltSector ||
            sim.jupiterSector ||
            sim.saturnSector ||
            sim.outerSector
        )
            this.defenseStatus = label(this, '', 40, 185, 16, C.gold, 720);
        this.abilitiesHud = new ShipAbilityHud(sim);
        this.addChild(this.abilitiesHud);
        this.noticePanel.addChild(this.noticeInk);
        label(this.noticePanel, 'INFO · ZNIKA AUTOMATYCZNIE', 580, 23, 10, C.gold);
        this.noticeText = label(this.noticePanel, '', 580, 42, 14, C.text, 610);
        this.noticePanel.eventMode = 'none';
        this.addChild(this.noticePanel);
        if (sim.anomalyMission) this.anomalyStatus = label(this, '', 40, 215, 16, 0xda8cf1, 760);
        if (sim.rescueOperation) this.rescueStatus = label(this, '', 40, 245, 16, C.gold, 720);
        if (sim.miningEscort) this.convoyStatus = label(this, '', 40, 215, 14, C.gold, 760);
        if (sim.guide) this.guideStatus = label(this, '', 40, 185, 14, C.mint, 760);
        this.radarHint = label(this, '[ / ]  radar ×1', 1360, 246, 12, C.muted, 220);
        this.direction = label(this, '', 1320, 268, 16, C.muted, 250);
        label(
            this,
            customObjectives ? objectivesTitle : CONTRACTS[contract].title,
            1320,
            315,
            16,
            C.text,
            250,
        );
        this.selectedGoal = label(this, '', 1343, 350, 15, C.cyan, 228);
        this.selectedGoal.label = 'selected-navigation-goal';
        this.selectedGoal.visible = false;
        if (sim.missionStatus) this.orderStatus = label(this, '', 40, 235, 15, C.mint, 700);
        this.mineralTitle = label(this, '', 40, 650, 17, C.cyan, 740);
        this.mineralContents = label(this, '', 40, 684, 16, C.text, 740);
        this.mineralHint = label(this, '', 40, 728, 13, C.muted, 740);
        this.context = label(this, '', 40, 763, 16, C.mint, 670);
        keyHint(this, 'WASD', 'lot', 805, 812, 54);
        keyHint(this, 'SHIFT', 'boost', 920, 812, 54);
        mouseHint(this, null, 'cel', 1045, 812);
        keyHint(this, ', / .', 'wybór', 1110, 812, 52);
        keyHint(this, 'R', 'naprawa', 1220, 812);
        keyHint(this, 'C', 'ładunek', 1335, 812);
        keyHint(this, 'G', 'obrona', 1450, 812);
        keyHint(this, 'F', 'interakcja · 1 s', 805, 856);
        keyHint(this, 'H', 'hol · 1 s', 1000, 856);
        keyHint(this, 'J', 'puść', 1140, 856);
        const details = keyHint(this, 'TAB', 'pokład', 1250, 856, 40);
        details.eventMode = 'static';
        details.cursor = 'pointer';
        details.on('pointerdown', openDetails);
        keyHint(this, 'ESC', 'pauza', 1450, 856, 40);
        this.refresh();
    }
    trackEnemy() {
        this.enemyNavigation.select(this.sim.enemies, this.sim.position);
        this.target = 10;
    }
    get availableTargets() {
        const s = this.sim;
        const targets = new Set(s.landmarks.map((site) => site.key - 1));
        if (s.venusAct) targets.add(18);
        targets.add(0);
        if (s.area === 'orbit') {
            targets.add(-1);
            if (s.nextCache) targets.add(8);
        }
        if (s.recoverySignal && !s.recoverySecured && !s.recoveryDestroyed) targets.add(5);
        if (s.enemies.enemies.size) targets.add(10);
        if (
            [...s.salvage.items.values()].some(
                (item) => item.source !== 'recovery' && !s.salvage.towing.has(item.id),
            )
        )
            targets.add(14);
        if (s.escort && !['destroyed', 'complete', 'failed'].includes(s.escort.state))
            targets.add(15);
        if (
            s.area === 'orbit' &&
            s.rescueOperation &&
            !['delivered', 'destroyed'].includes(s.rescueOperation.state)
        )
            targets.add(16);
        if (s.nearestHypergate) targets.add(17);
        if (s.guide && s.guide.state !== 'destroyed') targets.add(18);
        return [...targets].sort((a, b) => a - b);
    }
    cycleTarget(direction: -1 | 1) {
        const targets = this.availableTargets;
        const index = targets.indexOf(this.target);
        const next =
            index < 0
                ? direction === 1
                    ? 0
                    : targets.length - 1
                : (index + direction + targets.length) % targets.length;
        this.target = targets[next];
        if (this.target === 10) this.trackEnemy();
        if (this.target === 14) this.trackWreck();
        this.refresh();
    }
    private matchesObjective(goal: ReturnType<typeof missionObjectives>[number]) {
        const s = this.sim;
        const task = STORY_TASKS.find((entry) => entry.id === goal.id);
        const site = s.landmarks.find((entry) => entry.key === this.target + 1);
        if (site?.siteId && (goal.id === site.siteId || task?.site === site.siteId)) return true;
        if (this.target === 0)
            return (
                goal.id === 'return' ||
                (!!task &&
                    ['ore', 'parts', 'workshop', 'briefing', 'kineticShield'].includes(task.kind))
            );
        if (this.target === 5 || this.target === 16)
            return goal.id === 'rescue' || task?.kind === 'rescue';
        if (this.target === 10)
            return goal.id === 'kills' || (!!task && ['patrol', 'boss'].includes(task.kind));
        if (this.target === 15) return goal.id === 'escort' || task?.kind === 'delivery';
        if (this.target === -1) return goal.id === 'outpost' || task?.site === 'outpost';
        if (site?.kind === 'field' || site?.kind === 'belt')
            return (
                ['ore', 'parts'].includes(goal.id) ||
                (!!task && ['ore', 'parts', 'gather'].includes(task.kind))
            );
        if (site?.kind === 'construction')
            return !!task && ['delivery', 'construction', 'defense', 'assault'].includes(task.kind);
        if (site?.kind === 'passage' && s.surfaceUnlocked) return task?.kind === 'delivery';
        if (site?.kind === 'factory') return task?.kind === 'factory';
        if (task?.kind === 'clearance') return task.id === `belt-clear-${this.target - 2}`;
        return false;
    }
    trackWreck() {
        if (
            this.sim.marsAct &&
            this.sim.campaign.story!.mars.baseNeutralized &&
            !this.sim.campaign.story!.mars.memoryDelivered &&
            this.sim.salvage.items.has(MARS_ACT.memoryId)
        ) {
            this.wreckId = MARS_ACT.memoryId;
            this.target = 14;
            return;
        }
        const p = this.sim.position;
        this.wreckId =
            [...this.sim.salvage.items.values()]
                .filter((w) => w.source !== 'recovery' && !this.sim.salvage.towing.has(w.id))
                .sort(
                    (a, b) =>
                        Math.hypot(salvagePosition(a).x - p.x, salvagePosition(a).y - p.y) -
                        Math.hypot(salvagePosition(b).x - p.x, salvagePosition(b).y - p.y),
                )[0]?.id ?? null;
        this.target = 14;
    }
    get waypoint() {
        if (this.sim.venusAct) {
            const v = this.sim.venusAct;
            const p = this.target === 18 ? v.waypoint : this.worldWaypoint;
            return v.navigate(p, p.name);
        }
        const s = this.sim,
            recovery =
                s.marsAct && this.target === 5
                    ? s.campaign.recoverySignals.find(
                          (signal) => signal.id === s.campaign.activeRun?.recoveryId,
                      )
                    : undefined,
            p = recovery ? { ...recovery, name: 'Sygnał ratunkowy' } : this.worldWaypoint;
        if (!s.marsAct || s.inCurrentMap(p)) return p;
        if (s.area === 'surface')
            return { ...s.surfaceSite.exit, name: 'Fobos · powrót na orbitę' };
        if (s.marsOrbit === 'mars')
            return {
                ...(Math.hypot(s.position.x, s.position.y) < 2900
                    ? PHOBOS_MAZE_ENTRY
                    : PHOBOS_MAZE_GATE),
                name: 'Labirynt · śluza Fobosa',
            };
        if (s.marsOrbit === 'asteroid')
            return { ...MARS_GATES.asteroidArrival, name: 'Śluza · powrót na orbitę Fobosa' };
        const dest = marsOrbitAt(p)?.id;
        if (dest === 'asteroid' && s.campaign.story!.mars.aiIdentified)
            return { ...MARS_GATES.asteroidExit, name: 'Śluza · obszar asteroidy' };
        if (Math.hypot(p.x - MARS_MOONS.phobos.center.x, p.y - MARS_MOONS.phobos.center.y) < 2500)
            return { ...MARS_MOONS.phobos.entrance, name: 'Fobos · lądowanie' };
        return { ...MARS_GATES.phobosArrival, name: 'Śluza · powrót na orbitę Marsa' };
    }
    private get worldWaypoint() {
        const s = this.sim;
        if (
            this.target === 17 &&
            s.marsAct &&
            s.marsOrbit === 'mars' &&
            phobosRouteOpen(s.campaign.story!) &&
            !s.campaign.story!.mars.ambushEntered
        ) {
            const p = s.position;
            const inside = Math.hypot(p.x, p.y) > 2900;
            return inside
                ? { ...PHOBOS_MAZE_GATE, name: 'Śluza Fobosa · koniec labiryntu' }
                : { ...PHOBOS_MAZE_ENTRY, name: 'Labirynt Fobosa · wejście' };
        }
        if (this.target === 17)
            return s.nearestHypergate
                ? { ...s.nearestHypergate.from, name: `Śluza: ${s.nearestHypergate.name}` }
                : { x: 0, y: 0, name: 'Brak śluz · skok swobodny spacją' };
        if (this.target === 18)
            return s.guide && s.guide.state !== 'destroyed'
                ? { ...s.guide.position, name: 'Prospector / instruktor' }
                : { x: 0, y: 0, name: 'Instruktor utracony · kontynuuj samodzielnie' };
        if (this.target === 15 && s.miningEscort) {
            return s.area === 'orbit'
                ? { ...MOON.entrance, name: 'Muł · podejście do Księżyca' }
                : { ...s.miningEscort.position, name: 'Muł · budowa stacji' };
        }
        if (s.area === 'surface' && this.target !== 14) {
            if (s.marsMoon)
                return (
                    s.landmarks.find((l) => l.key === this.target + 1) ?? {
                        ...s.surfaceSite.exit,
                        name: `${s.surfaceName} · powrót na orbitę`,
                    }
                );
            if (this.target === 10)
                return s.enemies.enemies.size
                    ? this.enemyNavigation.waypoint(s.enemies, s.position)
                    : { ...MOON.construction, name: 'Stacja · oczekuj kontaktu' };
            if (
                this.target === 5 &&
                s.recoverySignal?.area === 'surface' &&
                !s.recoverySecured &&
                !s.recoveryDestroyed
            )
                return { ...s.recoverySignal, name: 'Cel ratunkowy na powierzchni' };
            return (
                s.landmarks.find((l) => l.key === this.target + 1) ?? {
                    ...s.surfaceSite.exit,
                    name: 'Powrót na orbitę',
                }
            );
        }
        if (this.target === 5 && s.recoverySignal?.area === 'surface')
            return { ...MOON.entrance, name: 'Ratunek na powierzchni · wejście' };
        if (this.target === 16 && this.sim.rescueOperation) {
            const r = this.sim.rescueOperation;
            return ['delivered', 'destroyed'].includes(r.state)
                ? { x: 0, y: 0, name: 'Satuk 15 / ratunek' }
                : { ...r.position, name: r.probe ? 'Sonda / odzysk' : 'Prom / sygnał SOS' };
        }
        if (this.target === 15) {
            const e = this.sim.escort;
            return !e || e.state === 'destroyed' || e.state === 'complete'
                ? { x: 0, y: 0, name: `${this.sim.stationName} / koniec eskorty` }
                : { ...e.position, name: this.sim.miningEscort ? 'Muł / eskorta' : 'RV Kepler' };
        }
        if (this.target === 14) {
            if (this.wreckId === null || !this.sim.salvage.items.has(this.wreckId))
                this.trackWreck();
            const item = this.sim.salvage.items.get(this.wreckId!);
            return item
                ? {
                      ...salvagePosition(item),
                      name:
                          item.id === MARS_ACT.memoryId && this.sim.marsAct
                              ? 'Moduł pamięci · wymagany do analizy'
                              : item.source === 'shipment'
                                ? 'Paczka · wyposażenie stacji księżycowej'
                                : `Wrak #${item.id}${this.sim.marsAct ? ' · odzysk opcjonalny' : ''}`,
                  }
                : { x: 0, y: 0, name: 'Aurora / brak wraków' };
        }
        if (this.target === 10)
            return this.enemyNavigation.waypoint(this.sim.enemies, this.sim.position);
        if (
            this.target === -1 &&
            ((this.sim.jupiterSector && !this.sim.jupiterSurveyed) ||
                (this.sim.outerSector && !this.sim.outerSurveyed))
        )
            return {
                ...this.sim.landmarks.find((l) => l.key === 7)!,
                name: 'Najpierw zwiad podejścia',
            };
        if (this.target === -1)
            return { ...this.sim.sector.outpost.terminal, name: this.sim.sector.outpost.name };
        if (this.target === 8)
            return this.sim.nextCache ?? { x: 0, y: 0, name: 'Aurora / skrytki puste' };
        const point = navigationWaypoint(
            this.sim.landmarks,
            this.target + 1,
            this.sim.recoveryDestroyed ? null : this.sim.recoverySignal,
        );
        return { ...point, name: point.name.replace('Aurora', this.sim.stationName) };
    }
    update(deltaMS: number) {
        this.throttle += deltaMS;
        if (this.throttle > 100) {
            this.throttle = 0;
            this.refresh();
        }
    }
    private refresh() {
        this.areaTitle?.setText(
            this.sim.area === 'surface' ? 'Fobos · powierzchnia' : (this.sim.marsMap?.name ?? ''),
        );
        if (this.sim.rescueOperation && !this.rescueStatus)
            this.rescueStatus = label(this, '', 40, 245, 14, C.gold, 720);
        this.guideStatus?.setText(
            this.sim.guide
                ? `${this.sim.guide.status} · HP ${Math.ceil(this.sim.guide.health)}`
                : '',
        );
        if (this.sim.surfaceUnlocked && !this.defenseStatus)
            this.defenseStatus = label(this, '', 40, 185, 16, C.gold, 720);
        if (this.sim.miningEscort && !this.convoyStatus)
            this.convoyStatus = label(this, '', 40, 215, 14, C.gold, 760);
        const rescue = this.sim.rescueOperation;
        this.rescueStatus?.setText(
            rescue
                ? `${rescue.name} · ${rescue.state === 'destroyed' ? 'utracony' : rescue.delivered ? 'dostarczony' : `${Math.ceil(rescue.item.health)}/${rescue.item.maxHealth} HP`}`
                : '',
        );
        this.anomalyStatus?.setText(
            this.sim.anomalyExposure.status ||
                'Sonda · bezpieczna trasa przez punkty nawigacji · fioletowe pasma zadają obrażenia',
        );
        this.anomalyStatus?.setColor(this.sim.anomalyExposure.contaminated ? C.red : 0xda8cf1);
        this.convoyStatus?.setText(
            `${(this.sim.area === 'surface' ? this.sim.miningEscort?.status : 'Muł czeka przy budowie na Księżycu') ?? ''} · HP ${Math.ceil(this.sim.escort?.health ?? 0)}`,
        );
        if (this.sim.mercurySector)
            this.defenseStatus?.setColor(
                this.sim.solar.heat >= 85
                    ? C.red
                    : this.sim.solar.phase === 'calm'
                      ? C.cyan
                      : C.gold,
            );
        this.defenseStatus?.setText(
            this.sim.marsMoon
                ? (this.sim.marsAct?.status ??
                      `${this.sim.surfaceName} · ${this.sim.area === 'surface' ? 'powierzchnia' : 'orbita'}`)
                : this.sim.rescueOperation
                  ? ''
                  : this.sim.outerSector
                    ? this.sim.outerStatus
                    : this.sim.saturnSector
                      ? this.sim.saturnStatus
                      : this.sim.jupiterSector
                        ? this.sim.jupiterStatus
                        : this.sim.beltSector
                          ? this.sim.beltStatus
                          : this.sim.mercurySector
                            ? this.sim.solar.summary
                            : this.sim.orbitalBaseSector || this.sim.area === 'surface'
                              ? this.sim.defenseSummary
                              : '',
        );
        if (this.areaRevision !== this.sim.areaRevision) {
            this.areaRevision = this.sim.areaRevision;
            this.target = this.sim.venusAct
                ? 18
                : this.sim.area === 'surface'
                  ? this.sim.miningEscort
                      ? 15
                      : 0
                  : 2;
            if (this.sim.marsAct && this.sim.area === 'orbit') {
                const mars = this.sim.campaign.story!.mars;
                this.target = !mars.landingBlocked
                    ? 2
                    : this.sim.factoryMission
                      ? 4
                      : this.sim.campaign.story!.claimed.includes('mars-anomaly-research')
                        ? 0
                        : this.sim.campaign.story!.claimed.includes('mars-sector-secure')
                          ? 15
                          : mars.baseNeutralized
                            ? 14
                            : mars.baseDiscovered
                              ? 6
                              : 17;
                if (this.target === 14) this.trackWreck();
            }
        }
        const s = this.sim,
            p = s.position,
            v = s.velocity;
        this.shieldValue.setText(
            `${Math.ceil(s.kineticShield.charge)}/${s.kineticShield.profile.capacity}`,
        );
        this.health.setText(`${Math.ceil(s.hull)} / ${s.maxHull}`);
        this.health.setColor(C.red);
        if (this.areaTitle && s.venusAct) this.areaTitle.setText(s.venusAct.map.name);
        this.abilitiesHud.update();
        this.noticePanel.visible = s.noticeTime > 0 && !!s.notice && !s.interactionProgress;
        this.noticeText.setText(s.notice);
        this.noticeInk
            .clear()
            .roundRect(564, 14, 660, 92, 12)
            .fill({ color: C.panel, alpha: 0.9 })
            .rect(580, 98, Math.max(0, Math.min(1, s.noticeTime / 3)) * 625, 2)
            .fill(C.gold);
        this.meters
            .clear()
            .poly([47, 43, 65, 43, 65, 55, 56, 65, 47, 55])
            .stroke({ color: C.red, width: 2 })
            .poly([47, 99, 56, 94, 65, 99, 65, 111, 56, 116, 47, 111])
            .stroke({ color: C.gold, width: 2 })
            .moveTo(47, 99)
            .lineTo(56, 104)
            .lineTo(65, 99)
            .moveTo(56, 104)
            .lineTo(56, 116)
            .stroke({ color: C.gold, width: 1 });
        this.meters.rect(80, 72, 190, 5).fill({ color: C.line, alpha: 0.65 });
        if (s.hull > 0)
            this.meters.rect(80, 72, 190 * Math.min(1, s.hull / s.maxHull), 5).fill(C.red);
        const shield = s.kineticShield,
            alpha = shield.charge > 0 ? 0.8 : 0.25;
        this.meters
            .poly([318, 43, 327, 48, 327, 58, 318, 63, 309, 58, 309, 48])
            .stroke({ color: 0x86bded, width: 2, alpha })
            .rect(342, 72, 100, 5)
            .fill({ color: C.line, alpha: 0.65 })
            .rect(342, 72, (100 * shield.charge) / shield.profile.capacity, 5)
            .fill(0x86bded);
        this.meters.rect(80, 104, 190, 7).fill({ color: C.line, alpha: 0.65 });
        let cargoOffset = 0;
        for (const id of RESOURCE_IDS) {
            const width =
                (190 * Math.min(s.cargo[id] ?? 0, Math.max(0, s.cargoCapacity - cargoOffset))) /
                s.cargoCapacity;
            if (width > 0)
                this.meters
                    .rect(80 + (190 * cargoOffset) / s.cargoCapacity, 104, width, 7)
                    .fill(RESOURCES[id].color);
            cargoOffset += s.cargo[id] ?? 0;
        }
        const mineral = s.mineralTarget;
        this.mineralTitle.setText(mineral ? `SKAN · ${mineral.deposit.name}` : '');
        this.mineralContents.setText(
            mineral && resourceTotal(mineral.deposit.total)
                ? `Urobek: ${resourceSummary(mineral.deposit.total)}`
                : '',
        );
        this.mineralHint.setText(
            mineral
                ? mineral.mercuryVein
                    ? 'Tylko szczęki Harpuna mogą wydobyć ten materiał.'
                    : mineral.defense
                      ? 'Zagrożenie obrony stacji nie dostarcza zasobów.'
                      : mineral.deposit.fragments.length
                        ? 'Pełny urobek wymaga rozbicia wszystkich odłamków.'
                        : ''
                : '',
        );
        this.context.setText(flightHint(s));
        this.orderStatus?.setText(s.missionStatus);
        for (const status of [
            this.guideStatus,
            this.defenseStatus,
            this.convoyStatus,
            this.rescueStatus,
            this.anomalyStatus,
            this.orderStatus,
        ])
            if (status) status.visible = false;
        if ((s.marsAct || s.venusAct) && this.orderStatus) this.orderStatus.visible = true;
        const towedIds = [...s.salvage.towing.keys()].join(',');
        if (this.towedIds !== towedIds) {
            this.towedIds = towedIds;
            if (towedIds) this.target = 0;
        }
        if (s.recoverySecured && !this.recoveryWasSecured) {
            this.recoveryWasSecured = true;
            this.target = 0;
        }
        if (!s.marsAct && !s.venusAct && s.surveyData.size !== this.lastSurveyCount) {
            this.lastSurveyCount = s.surveyData.size;
            const nextSite = CONTRACTS[this.contract].sites.find((site) => !s.surveyData.has(site));
            if (CONTRACTS[this.contract].sites.length && (!s.recoverySignal || s.recoverySecured))
                this.target = nextSite ? SCAN_SITES[nextSite].key - 1 : 0;
        }
        const kills = CONTRACTS[this.contract].kills;
        if (!s.marsAct && !s.venusAct && kills && !this.combatComplete && s.enemyKills >= kills) {
            this.combatComplete = true;
            this.target = s.recoverySignal && !s.recoverySecured ? 5 : 0;
        }
        const objectives = (
            this.customObjectives?.() ??
            missionObjectives(
                this.contract,
                s.cargo,
                [...s.surveyData],
                !!s.recoverySignal,
                s.recoverySecured,
                false,
                s.enemyKills,
            )
        ).filter((goal) => !goal.complete);
        // Campaign objectives can be revealed or removed during the same flight.
        while (this.goals.length > objectives.length) {
            const view = this.goals.pop()!;
            this.removeChild(view);
            view.destroy({ children: true });
        }
        while (this.goals.length < objectives.length) {
            const i = this.goals.length;
            this.goals.push(label(this, '', 1343, 350 + i * this.goalStep, 15, C.muted, 228));
        }
        this.checks.clear();
        this.selection.clear();
        let matches = false;
        let goalY = 350;
        objectives.forEach((goal, i) => {
            const selected = this.matchesObjective(goal);
            const rows = !goal.complete ? (goal.requirements ?? []) : [];
            const height = this.goalStep + rows.length * 18;
            this.goals[i].y = goalY;
            matches ||= selected;
            if (selected)
                this.selection
                    .beginPath()
                    .rect(1313, goalY - 5, 280, height)
                    .fill({ color: C.cyan, alpha: 0.12 })
                    .beginPath()
                    .rect(1313, goalY - 5, 3, height)
                    .fill(C.cyan);
            const text =
                goal.id === 'rescue' && s.recoveryDestroyed
                    ? 'Cel ratunkowy utracony'
                    : goal.id === 'rescue' && s.recoveryDelivered
                      ? `Cel przekazany ${s.stationRecipient}`
                      : goal.id === 'fortress'
                        ? goal.complete
                            ? 'Dane Aegis'
                            : s.fortressGuardCount
                              ? `Obrońcy Aegis ${5 - s.fortressGuardCount}/5`
                              : 'Pobierz dane rdzenia'
                        : goal.id === 'escort' && s.escort
                          ? s.escort.state === 'destroyed'
                              ? 'Kepler utracony'
                              : goal.complete
                                ? 'Badania Keplera'
                                : s.escort.state === 'research'
                                  ? `Badania ${Math.floor(s.escort.researchProgress)}/12 s`
                                  : `Kepler · ${Math.ceil(s.escort.health)} HP`
                          : `${goal.title}${goal.progress ? `  ${goal.progress}` : ''}`;
            this.goals[i].setText(
                text +
                    (rows.length
                        ? '\n' +
                          rows
                              .map(
                                  (row) =>
                                      `${RESOURCES[row.resource].name}  ${row.have}/${row.need}`,
                              )
                              .join('\n')
                        : ''),
            );
            this.goals[i].setColor(
                (goal.id === 'rescue' && s.recoveryDestroyed) ||
                    (goal.id === 'escort' && s.escort?.state === 'destroyed')
                    ? C.red
                    : selected
                      ? C.cyan
                      : goal.complete
                        ? C.mint
                        : C.muted,
            );
            objectiveMark(this.checks, 1325, goalY + 8, goal.complete);
            goalY += height;
        });
        const waypoint = this.waypoint,
            distance = Math.hypot(waypoint.x - p.x, waypoint.y - p.y);
        this.selectedGoal.visible = !matches;
        this.selectedGoal.y = goalY;
        this.selectedGoal.setText(matches ? '' : `Wybrany cel: ${waypoint.name}`);
        this.direction.setText(`${waypoint.name} · ${(distance / 1000).toFixed(1)} km`);
        const trailKey = `${s.area}:${s.area === 'surface' ? (s.marsMoon?.id ?? 'moon') : 'orbit'}`;
        if (!this.trails.has(trailKey)) this.trails.set(trailKey, new RadarTrail());
        this.trail = this.trails.get(trailKey)!;
        this.trail.update(p, s.elapsed);
        if (s.area === 'surface' || s.marsAct || s.venusAct) {
            this.surfaceRadar(waypoint);
            this.navigationArrow(waypoint, distance);
            return;
        }
        const frame = zoomRadarFrame(
                { x: 0, y: 0 },
                s.sectorRadius,
                p,
                RADAR_ZOOMS[this.radarZoomIndex],
            ),
            radius = RADAR_RADIUS,
            scale = radius / frame.radius,
            x = 1470 - frame.center.x * scale,
            y = 130 - frame.center.y * scale;
        const enemies = [...s.enemies.enemies.values()];
        const chased = s.outpost.alarm > 0 || enemies.some((enemy) => enemy.state === 'chase');
        this.map
            .clear()
            .beginPath()
            .circle(1470, 130, radius)
            .fill({ color: C.ink, alpha: 0.72 })
            .stroke({ color: chased ? C.red : C.line, width: chased ? 2 : 1 });
        this.map
            .moveTo(1470 - radius, 130)
            .lineTo(1470 + radius, 130)
            .moveTo(1470, 130 - radius)
            .lineTo(1470, 130 + radius)
            .stroke({ color: C.line, width: 1, alpha: 0.35 });
        this.map
            .beginPath()
            .circle(x, y, s.stationSafeRadius * scale)
            .fill({ color: C.cyan, alpha: 0.12 })
            .stroke({ color: C.cyan, width: 1, alpha: 0.5 });
        for (const zone of s.magneticZones) {
            this.map
                .circle(x + zone.x * scale, y + zone.y * scale, zone.radius * scale)
                .fill({ color: C.cyan, alpha: 0.06 });
        }
        for (const edge of magneticBoundaryArcs(s.magneticZones))
            this.map
                .beginPath()
                .arc(
                    x + edge.x * scale,
                    y + edge.y * scale,
                    edge.radius * scale,
                    edge.start,
                    edge.end,
                )
                .stroke({ color: C.red, width: 1.5, alpha: 0.8 });
        for (const relay of s.magneticRelays) {
            this.map
                .circle(x + relay.x * scale, y + relay.y * scale, 2)
                .fill(s.activeMagneticRelays.includes(relay.id) ? C.mint : C.gold);
        }
        const homes = new Map<string, { x: number; y: number }>();
        for (const enemy of enemies.filter((e) => !e.route))
            homes.set(`${Math.round(enemy.home.x)},${Math.round(enemy.home.y)}`, enemy.home);
        for (const home of homes.values())
            this.map
                .beginPath()
                .circle(x + home.x * scale, y + home.y * scale, DRONES.leash * scale)
                .fill({ color: C.red, alpha: 0.09 })
                .stroke({ color: C.red, width: 1, alpha: 0.35 });
        for (const point of this.trail.points) {
            if (Math.hypot(point.x - frame.center.x, point.y - frame.center.y) > frame.radius)
                continue;
            this.map
                .beginPath()
                .circle(x + point.x * scale, y + point.y * scale, 1.5)
                .fill({ color: C.cyan, alpha: this.trail.opacity(s.elapsed, point) });
        }
        this.map.circle(x, y, 3).fill(C.mint);
        if (s.area === 'orbit')
            for (const lane of s.sector.hyperlanes)
                for (const p of [lane.a, lane.b])
                    this.map
                        .circle(x + p.x * scale, y + p.y * scale, 4)
                        .stroke({ color: 0xa3a9f2, width: 1.5 });
        for (const site of s.landmarks) {
            const mx = x + site.x * scale,
                my = y + site.y * scale;
            if (site.kind === 'belt' || site.kind === 'cluster')
                this.map
                    .beginPath()
                    .circle(mx, my, site.radius * scale)
                    .stroke({
                        color: site.kind === 'cluster' ? 0xb6a1e2 : C.red,
                        alpha: 0.5,
                        width: 1,
                    });
            if (site.kind === 'fortress')
                this.map
                    .beginPath()
                    .circle(mx, my, site.radius * scale)
                    .fill({ color: s.surveyData.has('fortress') ? C.mint : C.red, alpha: 0.12 })
                    .stroke({ color: C.red, width: 1, alpha: 0.6 });
            if (site.kind === 'factory')
                this.map
                    .rect(mx - 4, my - 4, 8, 8)
                    .stroke({ color: s.enemyFactory?.destroyed ? C.muted : C.red, width: 1.5 });
            else if (site.siteId)
                this.map
                    .rect(mx - 3, my - 3, 6, 6)
                    .fill(s.surveyData.has(site.siteId) ? C.mint : C.cyan);
            else this.map.circle(mx, my, 2.5).fill(site.key === this.target + 1 ? C.text : C.gold);
        }
        if (
            s.recoverySignal &&
            !s.recoverySignal.area &&
            !s.recoverySecured &&
            !s.recoveryDestroyed
        ) {
            const mx = x + s.recoverySignal.x * scale,
                my = y + s.recoverySignal.y * scale;
            this.map
                .poly([mx, my - 5, mx + 5, my, mx, my + 5, mx - 5, my])
                .stroke({ color: C.mint, width: 1.5 });
        }
        if (s.rescueOperation && !['destroyed', 'delivered'].includes(s.rescueOperation.state)) {
            const p = s.rescueOperation.position;
            this.map
                .circle(x + p.x * scale, y + p.y * scale, 4)
                .stroke({ color: C.gold, width: 2 });
        }
        for (const item of s.salvage.items.values()) {
            if (item.source === 'recovery') continue;
            const p = salvagePosition(item),
                mx = x + p.x * scale,
                my = y + p.y * scale;
            this.map
                .beginPath()
                .poly([mx, my - 4, mx + 4, my, mx, my + 4, mx - 4, my])
                .stroke({ color: s.salvage.towing.has(item.id) ? C.mint : C.gold, width: 1 });
        }
        for (const drone of s.sentries.drones.values()) {
            const p = sentryPosition(drone),
                mx = x + p.x * scale,
                my = y + p.y * scale;
            this.map
                .beginPath()
                .poly([mx, my - 3, mx + 3, my, mx, my + 3, mx - 3, my])
                .fill(C.mint);
        }
        if (s.guide && s.guide.state !== 'destroyed' && s.guide.state !== 'complete') {
            const p = s.guide.position;
            this.map.circle(x + p.x * scale, y + p.y * scale, 3.5).fill(C.mint);
        }
        if (s.escort) {
            const site = s.sector.researchSite,
                e = s.escort;
            this.map
                .beginPath()
                .circle(x + site.x * scale, y + site.y * scale, 4)
                .stroke({ color: C.cyan, width: 1 });
            if (e.vulnerable)
                this.map
                    .beginPath()
                    .circle(x + e.position.x * scale, y + e.position.y * scale, 3)
                    .fill(C.mint);
        }
        const outpost = s.sector.outpost,
            ox = x + outpost.x * scale,
            oy = y + outpost.y * scale;
        this.map
            .poly([
                ox - 4,
                oy - 3,
                ox,
                oy - 5,
                ox + 4,
                oy - 3,
                ox + 4,
                oy + 3,
                ox,
                oy + 5,
                ox - 4,
                oy + 3,
            ])
            .stroke({ color: s.outpost.secured ? C.mint : C.red, width: 1.5 });
        for (const cache of s.sector.caches) {
            const mx = x + cache.x * scale,
                my = y + cache.y * scale;
            this.map
                .poly([mx, my - 4, mx + 4, my, mx, my + 4, mx - 4, my])
                .fill({ color: C.mint, alpha: s.openedCaches.has(cache.id) ? 0.2 : 0.8 });
        }
        for (const enemy of enemies) {
            const e = enemyPosition(enemy),
                mx = x + e.x * scale,
                my = y + e.y * scale;
            this.map
                .poly(
                    enemy.kind === 'lancer' || enemy.kind === 'heavy'
                        ? [mx + 4, my, mx, my - 3, mx - 4, my, mx, my + 3]
                        : [mx + 3, my, mx - 2, my - 2, mx - 2, my + 2],
                )
                .fill(enemy.state === 'chase' ? C.red : 0xb3696c);
        }
        for (const mine of s.mines.mines.values()) {
            if (Math.hypot(mine.x - p.x, mine.y - p.y) > 1000) continue;
            const mx = x + mine.x * scale,
                my = y + mine.y * scale;
            this.map
                .beginPath()
                .moveTo(mx - 2, my - 2)
                .lineTo(mx + 2, my + 2)
                .moveTo(mx - 2, my + 2)
                .lineTo(mx + 2, my - 2)
                .stroke({ color: mine.armRemaining > 0 ? C.gold : C.red, width: 1 });
        }
        if (distance > 1 && this.target !== 0)
            this.map
                .beginPath()
                .circle(x + waypoint.x * scale, y + waypoint.y * scale, 7)
                .stroke({ color: C.text, width: 1, alpha: 0.7 });
        // Keep the player marker within the radar when escaping the sector boundary.
        const marker = radarPoint(p, frame.center, frame.radius, true),
            mx = marker.x,
            my = marker.y;
        const a = s.ship.rotation();
        this.map
            .poly([
                mx + Math.cos(a) * 5,
                my + Math.sin(a) * 5,
                mx + Math.cos(a + 2.5) * 4,
                my + Math.sin(a + 2.5) * 4,
                mx + Math.cos(a - 2.5) * 4,
                my + Math.sin(a - 2.5) * 4,
            ])
            .fill(C.cyan);
        if (s.speed > 5)
            this.map
                .moveTo(mx, my)
                .lineTo(mx + v.x * scale * 0.3, my + v.y * scale * 0.3)
                .stroke({ color: C.cyan, width: 1 });
        this.navigationArrow(waypoint, distance);
    }
    private surfaceRadar(waypoint: { x: number; y: number }) {
        const s = this.sim,
            x = 1470,
            y = 130,
            baseFrame =
                (s.marsAct || s.venusAct) && s.area === 'orbit'
                    ? gateRadarFrame(s.mapCenter, s.sectorRadius, s.hyperdrive)
                    : { center: s.mapCenter, radius: s.sectorRadius },
            frame = zoomRadarFrame(
                baseFrame.center,
                baseFrame.radius,
                s.position,
                RADAR_ZOOMS[this.radarZoomIndex],
            );
        const point = (p: { x: number; y: number }, clamp = false) =>
            radarPoint(p, frame.center, frame.radius, clamp);
        const inside = (p: { x: number; y: number }) =>
            Math.hypot(p.x - frame.center.x, p.y - frame.center.y) <= frame.radius;
        const map = this.map
            .clear()
            .circle(x, y, RADAR_RADIUS)
            .fill({ color: 0x303c45, alpha: 0.94 })
            .stroke({ color: C.line, width: 2 });
        if (s.marsAct && s.area === 'orbit') {
            drawRadarAnomaly(map, frame);
        }
        for (const dot of this.trail.points) {
            if (!inside(dot)) continue;
            const q = point(dot);
            map.circle(q.x, q.y, 1.5).fill({
                color: C.cyan,
                alpha: this.trail.opacity(s.elapsed, dot),
            });
        }
        if (s.marsAct || s.venusAct) {
            for (const lane of s.sector.hyperlanes)
                for (const p of [lane.a, lane.b])
                    if (inside(p)) {
                        const q = point(p);
                        map.circle(q.x, q.y, 5).stroke({ color: C.cyan, width: 1.5 });
                    }
            for (const rock of radarRocks(s)) {
                const p = rock;
                if (inside(p)) {
                    const q = point(p);
                    map.circle(q.x, q.y, rock.radius > 100 ? 3 : 1).fill({
                        color: C.gold,
                        alpha: 0.5,
                    });
                }
            }
            for (const item of s.salvage.items.values()) {
                const p = salvagePosition(item);
                if (inside(p)) {
                    const q = point(p);
                    map.rect(q.x - 2, q.y - 2, 4, 4).stroke({ color: C.gold, width: 1 });
                }
            }
            if (inside({ x: 0, y: 0 })) {
                const q = point({ x: 0, y: 0 });
                map.circle(q.x, q.y, 4).fill(C.mint);
            }
        }
        for (const l of s.landmarks) {
            if (!inside(l)) continue;
            const p = point(l);
            map.circle(p.x, p.y, l.kind === 'passage' ? 5 : 3).fill(
                l.kind === 'passage' ? C.cyan : C.gold,
            );
        }
        if (s.miningEscort && s.miningEscort.state !== 'destroyed') {
            const m = point(s.miningEscort.position);
            map.circle(m.x, m.y, 4).fill(C.mint);
        }
        for (const e of s.enemies.enemies.values()) {
            const ep = enemyPosition(e);
            if (
                !inside(ep) ||
                !e.body.isEnabled() ||
                (s.venusAct?.stormInterference &&
                    Math.hypot(ep.x - s.position.x, ep.y - s.position.y) > 1200)
            )
                continue;
            const p = point(ep);
            map.circle(p.x, p.y, 3).fill(C.red);
        }
        const signal = s.recoverySignal;
        const d = s.lunarDefense;
        for (const id of s.lunarAssault.enemies) {
            const enemy = s.enemies.enemies.get(id);
            if (!enemy) continue;
            const p = point(enemyPosition(enemy));
            map.circle(p.x, p.y, 4).fill(C.red);
        }
        const warningWave = d;
        if (warningWave.state === 'warning') {
            const warning = point({
                x: MOON.construction.x + Math.cos(warningWave.angle) * 850,
                y: MOON.construction.y + Math.sin(warningWave.angle) * 850,
            });
            map.circle(warning.x, warning.y, 7).stroke({ color: C.gold, width: 2 });
        }
        for (const id of d.threats.keys()) {
            const r = s.rocks.get(id);
            if (!r) continue;
            const raw = r.body.translation(),
                p = point({ x: raw.x * GAME.pixelsPerMeter, y: raw.y * GAME.pixelsPerMeter });
            map.circle(p.x, p.y, 3).fill(C.red);
        }
        if (signal?.area === 'surface' && !s.recoverySecured && !s.recoveryDestroyed) {
            const p = point(signal);
            map.rect(p.x - 3, p.y - 3, 6, 6).stroke({ color: C.mint, width: 2 });
        }
        const p = point(s.position, true),
            w = point(waypoint, true),
            a = s.ship.rotation();
        map.circle(w.x, w.y, 7)
            .stroke({ color: C.text, width: 1 })
            .poly([
                p.x + Math.cos(a) * 5,
                p.y + Math.sin(a) * 5,
                p.x + Math.cos(a + 2.5) * 4,
                p.y + Math.sin(a + 2.5) * 4,
                p.x + Math.cos(a - 2.5) * 4,
                p.y + Math.sin(a - 2.5) * 4,
            ])
            .fill(C.cyan);
    }
    private navigationArrow(waypoint: { x: number; y: number }, distance: number) {
        const p = this.sim.position;
        this.arrow.clear();
        if (distance > 250) {
            const angle = Math.atan2(waypoint.y - p.y, waypoint.x - p.x) + this.cameraAngle;
            const ax = 800 + Math.cos(angle) * 230,
                ay = 450 + Math.sin(angle) * 160;
            this.arrow
                .poly([
                    ax + Math.cos(angle) * 8,
                    ay + Math.sin(angle) * 8,
                    ax + Math.cos(angle + 2.4) * 6,
                    ay + Math.sin(angle + 2.4) * 6,
                    ax + Math.cos(angle - 2.4) * 6,
                    ay + Math.sin(angle - 2.4) * 6,
                ])
                .fill({ color: this.target === 0 ? C.mint : C.gold, alpha: 0.7 });
        }
    }
}
