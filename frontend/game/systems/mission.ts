import { MAGNETIC_RELAYS, REMOTE_MAGNETIC_ZONE, magneticCoverage } from './magneticZones';
import { type ResourceId, RESOURCE_IDS, RESOURCES } from '../state/resources';
import { ANOMALY, AnomalyExposure } from './anomalyField';
import { EarthGuide } from './earthGuide';
import { Hyperdrive, HYPERDRIVE, nearestGate, segmentDistance } from './hyperdrive';
import { recycleAsteroid, cruisingVelocity } from '../worlds/asteroidFields';
import { receiveStationCargo } from '../state/earthLogistics';
import { recordStoryReturn } from '../state/story';
import { resourceSummary } from '../state/resources';
import { MERCURY_VEINS } from '../worlds/mercuryVeins';
import { TerminalPuzzle, type TerminalAction } from './terminalPuzzle';
import { ENEMY_PROFILES } from '../config';
import { assaultEntry, type CombatView } from './assaultEntry';
import { EnemyFactory, ENEMY_FACTORY } from './enemyFactory';
import { EnemyMines, type EnemyMine } from './enemyMines';
import { RescueOperation, RESCUE_OPERATION } from './rescueOperation';
import { RescueRepair, type RescueRepairAction } from './rescueRepair';
import { MiningEscort, MINING_CONVOY } from './miningEscort';
import { RelayTuning, type RelayAction } from './relayTuning';
import { stationProtectionRadius } from '../state/stationShield';
import { resourceTotal } from '../state/resources';
import { missionObjectiveMet, missionOrderStatus } from '../state/missionOrders';
import { FirstBossEncounter, type FirstBossHost } from './firstBoss';
import { SolarExposure, inSolarShadow } from './solarExposure';
import { generateStorySector, marsCorridorFleet } from '../worlds/storySector';
import {
    storyRadius,
    STORY_TASKS,
    storyTaskAvailable,
    NEPTUNE_ARENA,
    PLUTO_ARENA,
    plutoFinaleReady,
    deliverLunarCargo,
    lunarBuildStage,
    recordLunarDefense,
    VENUS_OUTPOST,
    venusPreparationComplete,
    recordOrbitalConstruction,
    MARS_BASE,
    marsBaseReady,
    marsApproachOpen,
    beltTechnologyReady,
    beltPassageReady,
    solarShieldReady,
} from '../state/story';
import { LunarDefense, LUNAR_DEFENSE, type DefenseHost } from './lunarDefense';
import { LunarAssault, type AssaultHost } from './lunarAssault';
import { MOON, moonDistance } from '../worlds/moon';
import { phaseBladeScale } from '../config';
import { ARMAMENT_KITS, PHASE_DASH, FORTRESS_WALL_HALF_WIDTH } from '../config';
import { KineticShield, shieldProfile } from './kineticShield';
import { HarpoonArms, HARPOON_ARMS } from './harpoonArms';
import { AegisSupport } from './aegisSupport';
import { StationSentries, sentryPosition, type StationSentry } from './stationSentries';
import { STATION_DRONES } from '../state/stationDrones';
import { ResearchEscort, ESCORT } from './escort';
import { SalvageFleet, SALVAGE, leavesWreck, salvagePosition, type SalvageBody } from './salvage';
import type { SoundCue } from './audioPolicy';
import {
    AEGIS,
    ENEMY_MINES,
    ATLAS_WEAPONS,
    CREW,
    JOBS,
    PHOENIX,
    STINGER_AMMO,
    WIDMO,
    WEAPONS,
    type WeaponId,
} from '../config';
import RAPIER from '@dimforge/rapier2d-compat';
import { DRONES, GAME, HULLS, OUTPOST, RECOVERY, SCAN, ScanSiteId } from '../config';
import { Campaign, Cargo, capacity, shipHealth, deliverSalvage } from '../state/campaign';
import { generateSector, Point, random, RockSpec } from '../worlds/sector';
import { RecoverySignal } from '../state/recovery';
import { pilotProfile } from '../state/pilots';
import { Enemy, EnemyFleet, enemyPosition } from './enemies';
import { aimAngle, mountPosition, rotateVector } from './flight';
import { TowBody } from './tow';
import { GripperSystem } from './grippers';
import { OutpostSecurity } from './outpost';
import { shieldEntry } from './impact';
import { CACHE, PROTOTYPES, PrototypeId, prototypeOffers } from './prototypes';

export interface FlightInput {
    unload?: boolean;
    hyperdrive?: boolean;
    target: Point;
    thrust: boolean;
    brake: boolean;
    fire: boolean;
    interact: boolean;
    repair?: boolean;
    sabotage?: boolean;
    turn?: number;
    boost?: boolean;
    mine?: boolean;
}
export interface Rock {
    surface?: boolean;
    drift?: RockSpec['drift'];
    mercuryVein?: boolean;
    anchored?: boolean;
    beltBarrier?: number;
    defense?: boolean;
    id: number;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    radius: number;
    rich: boolean;
    copper?: boolean;
    crystal?: boolean;
    orbit?: RockSpec['orbit'];
    variant: number;
    health: number;
    previous: Point;
    previousAngle: number;
    previousVelocity: Point;
}
export interface Projectile extends Point {
    id: number;
    vx: number;
    vy: number;
    life: number;
    team: 'player' | 'enemy';
    heavy?: boolean;
    stingerAmmo?: keyof typeof STINGER_AMMO;
    damage: number;
    explosive?: 'rocket' | 'grenade';
    targetId?: number;
    energy?: boolean;
    source?: 'drone' | 'sentry';
    shooterId?: number;
}
export interface Loot extends Point {
    source?: 'asteroid';
    id: number;
    kind: ResourceId;
    amount: number;
}
export interface MissionEvent extends Point {
    sound?: SoundCue;
    kind: 'break' | 'hit' | 'collect' | 'shot' | 'weld' | 'shield' | 'explosion';
    strength?: number;
    velocity?: Point;
    rich?: boolean;
}
const P = GAME.pixelsPerMeter;
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));

export class MissionSimulation {
    readonly sector;
    readonly world = new RAPIER.World({ x: 0, y: 0 });
    readonly mines = new EnemyMines(this.world);
    private mineAreaRevision = 0;
    readonly kineticShield: KineticShield;
    readonly harpoonArms: HarpoonArms | null;
    readonly aegis: AegisSupport | null;
    readonly sentries: StationSentries;
    readonly atlasLock = {
        target: null as number | null,
        progress: 0,
        locked: null as number | null,
    };
    escort: ResearchEscort | null;
    rescueOperation: RescueOperation | null;
    readonly anomalyExposure = new AnomalyExposure();
    get anomalyMission() {
        return this.rescueOperation?.probe ?? false;
    }
    readonly salvage: SalvageFleet;
    salvageProgress = 0;
    salvageTarget: number | null = null;
    recoveryDestroyed = false;
    recoveryDelivered = false;
    deliveryRevision = 0;
    readonly radioMessages: string[] = [];
    readonly guideMessages: string[] = [];
    readonly guide: EarthGuide | null;
    cargoTransferRemaining = 0;
    private unloadHeld = false;
    get earthLogistics() {
        return (
            this.campaign.story?.sector === 'earth' && this.campaign.activeRun?.sector === 'earth'
        );
    }
    get stationLogistics() {
        const p = this.campaign.story;
        return (
            !!p &&
            ['earth', 'lunar'].includes(p.sector) &&
            this.campaign.activeRun?.sector === p.sector
        );
    }
    get cargoDestination(): Point {
        return this.area === 'surface' ? MOON.construction : { x: 0, y: 0 };
    }
    private get cargoRecipientAvailable() {
        return this.area === 'orbit'
            ? this.distanceHome < 650
            : this.surfaceUnlocked &&
                  this.buildStage < 2 &&
                  Math.hypot(
                      this.position.x - MOON.construction.x,
                      this.position.y - MOON.construction.y,
                  ) < 300;
    }
    get canTransferCargo() {
        return (
            this.stationLogistics &&
            !this.ended &&
            this.hull > 0 &&
            this.cargoRecipientAvailable &&
            this.speed < 35 &&
            this.damageCooldown <= 0 &&
            !this.hyperdrive.active &&
            !this.terminalPuzzle &&
            !this.relayTuning &&
            !this.pendingChoice &&
            !this.transferActive &&
            !this.campaign.activeRun?.mission?.aborted &&
            !this.grippers.arms.some((a) => a.held || a.phase !== 'idle') &&
            Object.values(this.cargo).some((n) => n > 0)
        );
    }
    private updateStationLogistics(input: FlightInput, dt: number) {
        const press = !!input.unload && !this.unloadHeld;
        this.unloadHeld = !!input.unload;
        if (!this.stationLogistics || this.campaign.activeRun?.mission?.aborted || this.ended) {
            this.cargoTransferRemaining = 0;
            return;
        }
        if (press && this.cargoTransferRemaining === 0) {
            if (this.canTransferCargo) this.cargoTransferRemaining = 2.4;
            else
                this.setNotice(
                    'Transfer: poniżej 35 m/s, do 650 m od Satuk 15 albo do 300 m od budowy na powierzchni.',
                );
        }
        if (this.cargoTransferRemaining > 0) {
            if (
                !this.canTransferCargo ||
                input.thrust ||
                input.brake ||
                input.turn ||
                input.fire ||
                input.mine ||
                input.interact ||
                input.repair ||
                input.sabotage
            ) {
                this.cargoTransferRemaining = 0;
                this.setNotice(
                    'Transfer przerwany · cały nieprzekazany ładunek pozostaje na statku.',
                );
            } else {
                this.cargoTransferRemaining = Math.max(0, this.cargoTransferRemaining - dt);
                if (this.cargoTransferRemaining === 0) {
                    const construction =
                        this.area === 'surface'
                            ? deliverLunarCargo(this.campaign, this.cargo)
                            : null;
                    const delivery =
                        this.area === 'surface'
                            ? construction && {
                                  accepted: {
                                      ore: 0,
                                      parts: 0,
                                      [construction.resource]: construction.amount,
                                  },
                                  ...construction.change,
                              }
                            : receiveStationCargo(this.campaign, this.cargo);
                    if (delivery) {
                        this.deliveryRevision++;
                        this.radioMessages.push(
                            `Ładunek przyjęty: ${resourceSummary(delivery.accepted)}. ${delivery.titles.length ? `Ukończono: ${delivery.titles.join(', ')}. ` : ''}${delivery.overflow ? `Nagrody ponad pojemność magazynu: ${delivery.overflow}. ` : ''}Możesz kontynuować lot.`,
                        );
                        this.events.push({ ...this.position, kind: 'collect', sound: 'complete' });
                    } else
                        this.setNotice(
                            this.area === 'surface'
                                ? 'Brak wymaganych materiałów · ładunek pozostaje na statku.'
                                : 'Magazyn pełny · ładunek pozostaje na statku.',
                        );
                }
            }
        }
        this.updateRadioReports();
    }
    private updateRadioReports() {
        const run = this.campaign.activeRun,
            story = this.campaign.story;
        if (!run || !story || run.sector !== story.sector || run.mission?.aborted || this.ended)
            return;
        const previousKills = run.reportedPatrolKills ?? 0;
        const change = recordStoryReturn(
            this.campaign,
            this.campaign.story!.sector,
            [...this.surveyData],
            this.wreckVisited,
            this.lunarAssault.state === 'complete',
            this.storyPatrolKills,
            this.venusAssault.state === 'complete',
            this.marsAssault.state === 'complete',
            [...this.clearedBeltRocks],
            0, // Physical supplies are credited only on delivery, never over radio.
            this.firstBoss.complete && !this.firstBoss.finale,
            this.firstBoss.complete && this.firstBoss.finale,
        );
        if ((run.reportedPatrolKills ?? 0) !== previousKills) this.deliveryRevision++;
        this.unlockLunarSurface();
        if (change?.titles.length) {
            this.deliveryRevision++;
            const confirmation =
                story.sector === 'pluto' && story.claimed.includes('pluto-boss')
                    ? 'Cele operacyjne kampanii ukończone. Raport finałowego starcia zabezpieczony.'
                    : story.sector === 'lunar' && story.claimed.includes('lunar-attack')
                      ? 'Stacja księżycowa obroniona. Akt I ukończony. Następny kierunek: Mars.'
                      : 'Potwierdzamy odbiór raportu.';
            this.radioMessages.push(
                `${confirmation} Ukończono: ${change.titles.join(', ')}. Raport został zapisany w dzienniku. ${!['earth', 'lunar'].includes(story.sector) ? 'Nowo otwarte miejsca przygotujemy na następny wylot z Satuk 15. ' : ''}${change.overflow ? `Magazyn pełny: nadwyżka nagród ${change.overflow}.` : ''}`,
            );
        }
        if (
            this.earthLogistics &&
            storyRadius(this.campaign.story!) > 1450 &&
            !this.sector.landmarks.some((l) => l.siteId === 'archive')
        )
            this.sector.landmarks.push({
                x: -1750,
                y: 700,
                name: 'Węzeł dalszej orbity',
                key: 8,
                kind: 'archive',
                siteId: 'archive',
                radius: 180,
            });
    }
    readonly queue = new RAPIER.EventQueue(true);
    readonly ship: RAPIER.RigidBody;
    readonly shipCollider: RAPIER.Collider;
    readonly rocks = new Map<number, Rock>();
    readonly bullets = new Map<number, Projectile>();
    readonly loot = new Map<number, Loot>();
    readonly events: MissionEvent[] = [];
    readonly enemies: EnemyFleet;
    readonly outpost: OutpostSecurity;
    readonly outpostCollider: RAPIER.Collider;
    readonly fortressColliders = new Set<number>();
    enemyKills = 0;
    storyPatrolKills = 0;
    readonly firstBoss: FirstBossEncounter;
    bossStartProgress = 0;
    private bossArmed = true;
    readonly clearedBeltRocks = new Set<number>();
    readonly statistics = {
        hullDamage: 0,
        shieldDamage: 0,
        enemyDamage: 0,
        environmentalEnemyDamage: 0,
        rocksDestroyed: 0,
        repairKitsUsed: 0,
        distance: 0,
    };
    deathReason = 'Zniszczony kadłub.';
    readonly pilot;
    readonly cargo: Cargo = { ore: 0, parts: 0 };
    private readonly baseCargoCapacity: number;
    private readonly baseMaxHull: number;
    readonly hullConfig;
    readonly grippers: GripperSystem;
    recoverySignal: RecoverySignal | null;
    recoveryProgress = 0;
    recoverySecured = false;
    readonly surveyData = new Set<ScanSiteId>();
    terminalPuzzle: TerminalPuzzle | null = null;
    private terminalInteractHeld = false;
    private terminalSabotageHeld = false;
    relayTuning: RelayTuning | null = null;
    private relayInteractHeld = false;
    scanProgress = 0;
    scanTarget: ScanSiteId | null = null;
    hull: number;
    elapsed = 0;
    ended: 'returned' | 'destroyed' | null = null;
    previous: Point = { x: 0, y: 0 };
    previousAngle = 0;
    thrusting = false;
    braking = false;
    reversing = false;
    boosting = false;
    aimTarget: Point = { x: 1000, y: 0 };
    laserBeam: { from: Point; to: Point } | null = null;
    readonly laserBeams: { from: Point; to: Point }[] = [];
    readonly burning = new Map<number, { remaining: number; damage: number }>();
    dashTime = 0;
    dashCooldown = 0;
    private dashPressed = false;
    private dashAngle = 0;
    readonly dashTrail: { x: number; y: number; angle: number; age: number }[] = [];
    private dashHits = new Set<number>();
    readonly destroyedFortressWalls = new Set<number>();
    readonly enemyFactory: EnemyFactory | null;
    readonly structureHealth = new Map<number, number>();
    opticalCloakTime = 0;
    opticalCloakCooldown = 0;
    private opticalCloakPressed = false;
    revealTime = 0;
    tow: TowBody | null = null;
    dockProgress = 0;
    engineFault = false;
    repairProgress = 0;
    repairKits: number;
    wreckVisited = false;
    area: 'orbit' | 'surface' = 'orbit';
    areaRevision = 0;
    transferRemaining = 0;
    get transferActive() {
        return this.transferRemaining > 1e-8;
    }
    get transferFraction() {
        return 1 - this.transferRemaining / MOON.arrivalSeconds;
    }
    passageProgress = 0;
    constructionProgress = 0;
    readonly lunarDefense = new LunarDefense();
    readonly lunarAssault = new LunarAssault();
    readonly venusAssault = new LunarAssault('venus');
    readonly marsAssault = new LunarAssault('mars');
    readonly solar = new SolarExposure();
    readonly hyperdrive = new Hyperdrive();
    private hyperHeld = false;
    private orbitalBuildProgress = 0;
    private stationCollider: RAPIER.Collider | null = null;
    private assaultSequence = 100000;
    private combatCamera: { angle: number; zoom: number } | null = null;
    setCombatCamera(angle: number, zoom: number) {
        if (Number.isFinite(angle) && Number.isFinite(zoom) && zoom > 0)
            this.combatCamera = { angle, zoom };
    }
    get combatView(): CombatView {
        return {
            center: this.position,
            angle: this.combatCamera?.angle ?? -Math.PI / 2 - this.ship.rotation(),
            zoom: this.combatCamera?.zoom ?? 0.64,
        };
    }
    defenseStartProgress = 0;
    private defenseArmed = true;
    private passageArmed = false;
    notice = '';
    noticeTime = 0;
    readonly openedCaches = new Set<number>();
    cacheProgress = 0;
    cacheTarget: number | null = null;
    private installed: PrototypeId[] = [];
    private choice: { cacheId: number; offers: readonly PrototypeId[] } | null = null;
    private ids = 0;
    private shotCooldown = 0;
    private grenadeCooldown = 0;
    private laserEffectCooldown = 0;
    private gunIndex = 0;
    private damageCooldown = 0;
    private rng;
    private asteroidColliders = new Map<number, number>();
    private modules;
    private disposed = false;

    constructor(
        private campaign: Campaign,
        private readonly seed: number,
        sector?: ReturnType<typeof generateSector>,
    ) {
        this.sector =
            sector ?? (campaign.story ? generateStorySector(campaign.story) : generateSector(seed));
        this.storyPatrolKills = campaign.activeRun?.reportedPatrolKills ?? 0;
        this.wreckVisited = !!campaign.story?.searchedWrecks.includes(campaign.story.sector);
        this.outpost = new OutpostSecurity(this.sector.outpost);
        this.outpostCollider = this.world.createCollider(
            RAPIER.ColliderDesc.ball(OUTPOST.radius / P)
                .setTranslation(this.sector.outpost.x / P, this.sector.outpost.y / P)
                .setRestitution(0.25)
                .setFriction(0.1),
        );
        const fortress = this.sector.fortress;
        for (const wall of fortress.walls) {
            const dx = wall.to.x - wall.from.x,
                dy = wall.to.y - wall.from.y;
            const collider = this.world.createCollider(
                RAPIER.ColliderDesc.cuboid(Math.hypot(dx, dy) / 2 / P, FORTRESS_WALL_HALF_WIDTH / P)
                    .setTranslation(
                        (wall.from.x + wall.to.x) / 2 / P,
                        (wall.from.y + wall.to.y) / 2 / P,
                    )
                    .setRotation(Math.atan2(dy, dx))
                    .setRestitution(0.3)
                    .setFriction(0.2),
            );
            this.fortressColliders.add(collider.handle);
            this.structureHealth.set(collider.handle, 180);
        }
        const core = this.world.createCollider(
            RAPIER.ColliderDesc.ball(100 / P)
                .setTranslation(fortress.x / P, fortress.y / P)
                .setRestitution(0.25),
        );
        this.fortressColliders.add(core.handle);
        this.recoverySignal =
            campaign.recoverySignals.find(
                (signal) => signal.seed === campaign.activeRun?.seed && signal.area !== 'surface',
            ) ?? null;
        this.rng = random(seed ^ 0xa12d9b);
        this.modules = { ...campaign.ship! };
        this.hullConfig = HULLS[this.modules.hull];
        this.salvage = new SalvageFleet(this.world, this.modules.hull === 'tug' ? 2 : 1);
        this.rescueOperation =
            campaign.story?.sector === 'lunar' &&
            !campaign.story.claimed.includes('lunar-rescue') &&
            storyTaskAvailable(campaign.story, STORY_TASKS.find((t) => t.id === 'lunar-rescue')!)
                ? new RescueOperation(this.salvage)
                : campaign.story?.sector === 'jupiter' &&
                    !campaign.story.claimed.includes('jupiter-recovery') &&
                    storyTaskAvailable(
                        campaign.story,
                        STORY_TASKS.find((t) => t.id === 'jupiter-recovery')!,
                    )
                  ? new RescueOperation(this.salvage, true)
                  : null;
        if (this.rescueOperation) {
            const saved =
                campaign.rescueSites[
                    this.rescueOperation.probe ? 'jupiter-recovery' : 'lunar-rescue'
                ];
            if (saved) {
                this.rescueOperation.item.body.setTranslation(
                    { x: saved.x / P, y: saved.y / P },
                    true,
                );
                this.rescueOperation.stabilized = saved.stabilized;
                this.rescueOperation.item.health = saved.health;
            }
        }
        for (const item of campaign.worldSalvage.filter(
            (entry) => entry.seed === campaign.activeRun?.seed,
        ))
            this.salvage.add(item.id, item.source, item, { x: 0, y: 0 });
        this.harpoonArms =
            this.modules.hull === 'harpoon'
                ? new HarpoonArms(this.modules.handling, this.modules.drill)
                : null;
        this.grippers = new GripperSystem(this.hullConfig.grabbers, this.hullConfig.grabberRange);
        this.pilot = pilotProfile(campaign.pilots.find((p) => p.id === campaign.selectedPilot)!);
        this.baseCargoCapacity = capacity(campaign);
        Object.assign(this.cargo, campaign.activeRun?.freight ?? {});
        this.baseMaxHull = shipHealth(campaign.ship!);
        this.kineticShield = new KineticShield(
            shieldProfile(this.modules.hull, this.modules.shield),
        );
        this.hull = this.maxHull;
        this.repairKits = campaign.activeRun?.repairKits ?? 0;
        this.world.timestep = GAME.step;
        this.ship = this.world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(2.4, 0)
                .setLinearDamping(0)
                .setAngularDamping(0)
                .setCcdEnabled(true),
        );
        this.shipCollider = this.world.createCollider(
            RAPIER.ColliderDesc.roundCuboid(
                (this.hullConfig.hitbox[0] * this.hullConfig.size) / P,
                (this.hullConfig.hitbox[1] * this.hullConfig.size) / P,
                0.04,
            )
                .setCollisionGroups(0x0001fff9)
                .setDensity(5)
                .setRestitution(0.35)
                .setFriction(0.1)
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
            this.ship,
        );
        this.aegis =
            this.modules.hull === 'aegis'
                ? new AegisSupport(this.world, this.modules.handling, this.modules.shield)
                : null;
        this.aegis?.rebuild(this.position);
        if (
            campaign.story?.sector === 'lunar' &&
            campaign.story.claimed.includes('lunar-survey') &&
            !campaign.story.claimed.includes('lunar-foundation')
        ) {
            this.prepareMiningField(false);
        }
        if (this.anomalyMission) {
            this.sector.landmarks = this.sector.landmarks.filter((l) => ![3, 4, 5].includes(l.key));
            for (const [i, point] of ANOMALY.waypoints.entries())
                this.sector.landmarks.push({
                    ...point,
                    key: 3 + i,
                    kind: 'field',
                    name: `Korytarz anomalii ${i + 1}`,
                    radius: 90,
                });
            // Keep the entire corridor free of random rocks, including the towing clearance.
            this.sector.rocks = this.sector.rocks.filter(
                (r) => Math.hypot(r.x - ANOMALY.center.x, r.y - ANOMALY.center.y) > 1700 + r.radius,
            );
        }
        if (this.rescueOperation && !this.anomalyMission) {
            const p = RESCUE_OPERATION.site;
            this.sector.rocks = this.sector.rocks.filter(
                (r) => Math.hypot(r.x - p.x, r.y - p.y) > r.radius + 270,
            );
            this.sector.enemies.push(
                ...[-1, 1].map((side, i) => ({
                    id: 941 + i,
                    x: p.x + side * 380,
                    y: p.y + side * 140,
                    home: { x: p.x + side * 380, y: p.y + side * 140 },
                    phase: 0,
                    kind: 'patrol' as const,
                })),
            );
        }
        for (const rock of this.sector.rocks) {
            const signal = this.recoverySignal;
            // A clear initial approach; moving rocks can still drift into the salvage zone.
            if (
                rock.beltBarrier !== undefined ||
                !signal ||
                Math.hypot(rock.x - signal.x, rock.y - signal.y) > rock.radius + 180
            )
                this.addRock(rock);
        }
        this.enemies = new EnemyFleet(this.world, [
            ...this.sector.enemies,
            ...this.sector.fortress.guards,
        ]);
        this.sentries = new StationSentries(this.world, campaign);
        this.sentries.update(
            0,
            true,
            this.enemies,
            (collider) => this.isObstacle(collider),
            () => false,
        );
        this.enemyFactory =
            campaign.story?.sector === 'mars' && marsApproachOpen(campaign.story)
                ? new EnemyFactory(this.world, campaign.story.claimed.includes('mars-factory'))
                : null;
        this.escort =
            campaign.story?.sector === 'lunar' &&
            campaign.story.claimed.includes('lunar-survey') &&
            !campaign.story.claimed.includes('lunar-foundation')
                ? new MiningEscort(this.world)
                : campaign.activeRun?.contract === 7
                  ? new ResearchEscort(this.world, this.sector.researchSite)
                  : null;
        this.guide =
            campaign.story?.sector === 'earth' &&
            campaign.activeRun?.sector === 'earth' &&
            !campaign.story.claimed.includes('earth-route')
                ? new EarthGuide(this.world, campaign, this.cargo)
                : null;
        this.firstBoss = new FirstBossEncounter(this.campaign.story?.sector === 'pluto');
        if (this.anomalyMission)
            this.radioMessages.push(
                'Sonda pomiarowa utknęła w anomalii. 3, 4 i 5 wskazują bezpieczny objazd, N wskazuje sondę. Fioletowe pasma zadają 10 obrażeń na sekundę po krótkim ostrzeżeniu; jasne korytarze są bezpieczne. Sonda ma własną osłonę pomiarową przed skażeniem. Podejdź, przytrzymaj E przez 3 sekundy i odholuj ją do Satuk 15.',
            );
        this.previous = this.position;
    }
    get factoryMission() {
        return (
            !!this.campaign.story &&
            this.campaign.story.sector === 'mars' &&
            storyTaskAvailable(
                this.campaign.story,
                STORY_TASKS.find((t) => t.id === 'mars-factory')!,
            )
        );
    }
    get miningEscort() {
        return this.escort instanceof MiningEscort ? this.escort : null;
    }
    get escortName() {
        return this.miningEscort ? 'Muł' : 'Kepler';
    }
    get missionReport() {
        return {
            data: [...this.surveyData],
            patrolKills: this.storyPatrolKills,
            firstBossWon: this.firstBoss.complete && !this.firstBoss.finale,
            finalBossWon: this.firstBoss.complete && this.firstBoss.finale,
        };
    }
    get missionStatus() {
        return missionOrderStatus(this.campaign, this.missionReport);
    }
    get missionReturnBlocked() {
        return (
            !!this.campaign.activeRun?.mission &&
            !this.campaign.activeRun.mission.aborted &&
            !missionObjectiveMet(this.campaign, this.missionReport)
        );
    }
    get canAbortMission() {
        return (
            !!this.campaign.activeRun?.mission &&
            !this.campaign.activeRun.mission.aborted &&
            !this.ended
        );
    }
    abortMission() {
        if (!this.canAbortMission) return false;
        this.campaign.activeRun!.mission!.aborted = true;
        this.dockProgress = 0;
        this.setNotice(this.missionStatus);
        return true;
    }
    get storyMode() {
        return !!this.campaign.story;
    }
    get outerSector() {
        return (
            this.campaign.story?.sector === 'pluto' ||
            this.campaign.story?.sector === 'uranus' ||
            this.campaign.story?.sector === 'neptune'
        );
    }
    get outerSurveyed() {
        const p = this.campaign.story;
        return !!p && this.outerSector && p.claimed.includes(`${p.sector}-survey`);
    }
    get firstBossAvailable() {
        const p = this.campaign.story;
        return (
            (p?.sector === 'pluto' && plutoFinaleReady(p) && !p.claimed.includes('pluto-boss')) ||
            (p?.sector === 'neptune' &&
                p.claimed.includes('neptune-base') &&
                !p.claimed.includes('neptune-boss'))
        );
    }
    get bossArena() {
        return this.campaign.story?.sector === 'pluto' ? PLUTO_ARENA : NEPTUNE_ARENA;
    }
    get nearbyBossArena() {
        return (
            this.firstBossAvailable &&
            Math.hypot(this.position.x - this.bossArena.x, this.position.y - this.bossArena.y) < 180
        );
    }
    get outerStatus() {
        const p = this.campaign.story!;
        if (this.firstBossAvailable) return this.firstBoss.summary;
        if (p.sector === 'pluto' && p.claimed.includes('pluto-boss'))
            return 'Cele operacyjne kampanii ukończone · wcześniejsze sektory dostępne';
        if (p.claimed.includes(`${p.sector}-route`))
            return p.sector === 'uranus'
                ? 'Trasa do Neptuna otwarta · wybierz sektor w stacji'
                : 'Cele aktu IX rozliczone · zewnętrzna trasa zabezpieczona';
        if (!this.outerSurveyed) return '7 zwiad podejścia · E odczyt / 1 powrót';
        if (this.outpost.secured && !p.claimed.includes(`${p.sector}-base`))
            return 'Dane bazy na pokładzie · wróć do Satuk 15';
        if (this.outpost.alarm > 0)
            return `Baza · alarm ${Math.ceil(this.outpost.alarm)} s · terminal zablokowany`;
        return p.sector === 'pluto'
            ? '0 terminal bazy · E dane / G skaner: 1 komponent · F osłona · 8 dodatkowe odczyty'
            : '0 terminal bazy · E dane / G skaner: 1 komponent · F kontakty · 8 dalszy odczyt po raportach';
    }
    get saturnSector() {
        return this.campaign.story?.sector === 'saturn';
    }
    get saturnStatus() {
        const p = this.campaign.story!;
        if (p.claimed.includes('saturn-route'))
            return 'Cele Saturna ukończone · zaopatrzenie i trasa zabezpieczone';
        if (!p.claimed.includes('saturn-survey'))
            return 'Saturn · 7 rozpoznanie · 2 złoże · E odczyt / 1 powrót';
        if (p.claimed.includes('saturn-supply') && p.claimed.includes('saturn-patrol'))
            return 'Zaopatrzenie i rejon zabezpieczone · 8 dalsza trasa · E odczyt';
        return `Zaopatrzenie ${p.progress['saturn-supply']}/36 · na pokładzie ${this.cargo.ore} rudy · 2 złoże / 5 kryształy / F patrol`;
    }
    get jupiterSurveyed() {
        return this.jupiterSector && !!this.campaign.story?.claimed.includes('jupiter-survey');
    }
    get jupiterSector() {
        return this.campaign.story?.sector === 'jupiter';
    }
    get jupiterStatus() {
        const p = this.campaign.story!;
        if (p.claimed.includes('jupiter-observations'))
            return 'Pakiet obserwacyjny zabezpieczony · oczekuj dalszych rozkazów';
        if (!p.claimed.includes('jupiter-survey'))
            return 'Jowisz · 7 zwiad podejścia · E odczyt / 1 powrót';
        if (p.claimed.includes('jupiter-uplink'))
            return 'Dane węzła zabezpieczone · F patrole / 8 pakiet po raportach';
        if (this.outpost.secured) return 'Dane węzła na pokładzie · wróć do Satuk 15';
        if (this.outpost.alarm > 0)
            return `Węzeł · alarm ${Math.ceil(this.outpost.alarm)} s · terminal zablokowany`;
        if (this.outpost.disabledTime > 0)
            return `Węzeł · skaner wyłączony ${Math.ceil(this.outpost.disabledTime)} s · E otwórz obwód`;
        return '0 terminal · E dane bez alarmu · G wyłącza skaner: 1 komponent / 20 s · F patrole';
    }
    get beltSector() {
        return this.campaign.story?.sector === 'belt';
    }
    get beltStatus() {
        const p = this.campaign.story!;
        if (p.claimed.includes('belt-exit'))
            return 'Akt VI ukończony · przejście pasa potwierdzone';
        if (!p.claimed.includes('belt-survey'))
            return 'Pas asteroid · 7 pomiary wejścia · wróć z odczytem';
        const confirmed = [0, 1, 2].filter((i) => p.claimed.includes(`belt-clear-${i}`)).length;
        if (confirmed === 3)
            return 'Trasa oczyszczona · 8 zewnętrzna granica · E odczyt / 1 powrót';
        return `Przeszkody ${confirmed}/3 zatwierdzone · ${this.clearedBeltRocks.size} na raport · 3 / 4 / 5 skały · PPM laser`;
    }
    get mercurySector() {
        return this.campaign.story?.sector === 'mercury';
    }
    get solarCovered() {
        if (this.distanceHome < 650) return true;
        return [...this.rocks.values()].some((r) => {
            const p = r.body.translation();
            return inSolarShadow(this.position, { x: p.x * P, y: p.y * P, radius: r.radius });
        });
    }
    private updateSolarExposure(dt: number) {
        if (!this.mercurySector) return;
        const damage = this.solar.step(
            dt,
            this.solarCovered,
            solarShieldReady(this.campaign.story!),
        );
        if (damage <= 0) return;
        this.statistics.hullDamage += Math.min(this.hull, damage);
        this.hull = Math.max(0, this.hull - damage);
        this.deathReason = 'Przegrzanie w promieniowaniu słonecznym zniszczyło kadłub.';
        this.damageCooldown = 0.5;
        this.relayTuning = null;
        this.terminalPuzzle = null;
        this.scanProgress = 0;
        this.repairProgress = 0;
    }
    get marsBaseSector() {
        return this.campaign.story?.sector === 'mars' && beltTechnologyReady(this.campaign.story);
    }
    get orbitalBaseSector() {
        return this.venusSector || this.marsBaseSector;
    }
    get orbitalBuildReady() {
        return this.marsBaseSector ? marsBaseReady(this.campaign.story!) : this.venusBuildReady;
    }
    get orbitalBaseStage() {
        if (this.marsBaseSector)
            return this.campaign.story!.claimed.includes('mars-base-build')
                ? this.campaign.story!.claimed.includes('mars-base-defense')
                    ? 2
                    : 1
                : 0;
        return this.venusOutpostStage;
    }
    get orbitalBaseName() {
        return this.marsBaseSector ? 'Baza marsjańska' : 'Placówka badawcza Wenus';
    }
    get nearbyOrbitalBase() {
        return (
            this.orbitalBaseSector &&
            Math.hypot(this.position.x - this.assaultSite.x, this.position.y - this.assaultSite.y) <
                180
        );
    }
    get marsBaseStatus() {
        const p = this.campaign.story;
        if (!this.marsBaseSector || !p) return '';
        if (beltPassageReady(p)) return 'Akt V ukończony · baza i korytarz zabezpieczone';
        if (p.claimed.includes('mars-base-defense'))
            return 'Baza obroniona · F wskaż kontakt w dalszym korytarzu · raport przez radio';
        if (this.marsAssault.state !== 'idle') return this.marsAssault.summary;
        if (p.claimed.includes('mars-base-build'))
            return 'Baza gotowa · G przy obiekcie rozpoczyna obronę · F kontakty w korytarzu';
        return this.orbitalBuildProgress > 0
            ? `Montaż bazy · ${Math.floor((this.orbitalBuildProgress / 2) * 100)}%`
            : this.orbitalBuildReady
              ? '7 baza · E przez 2 s montuje opłacone instalacje'
              : 'Baza wymaga 40 rudy i 10 komponentów · przekaż materiały w stacji';
    }
    get venusBuildReady() {
        return !!this.campaign.story && venusPreparationComplete(this.campaign.story);
    }
    get venusOutpostStage() {
        const p = this.campaign.story;
        return !this.venusSector || !p?.claimed.includes('venus-site')
            ? -1
            : p.claimed.includes('venus-build')
              ? p.claimed.includes('venus-shield')
                  ? 2
                  : 1
              : 0;
    }
    get venusSector() {
        return this.campaign.story?.sector === 'venus';
    }
    get activeAssault() {
        return this.marsBaseSector
            ? this.marsAssault
            : this.venusSector
              ? this.venusAssault
              : this.lunarAssault;
    }
    get assaultSite() {
        return this.marsBaseSector
            ? MARS_BASE
            : this.venusSector
              ? VENUS_OUTPOST
              : MOON.construction;
    }
    get nearbyVenusOutpost() {
        return (
            this.venusSector &&
            Math.hypot(this.position.x - VENUS_OUTPOST.x, this.position.y - VENUS_OUTPOST.y) < 180
        );
    }
    get venusStatus() {
        const p = this.campaign.story;
        if (!this.venusSector || !p) return '';
        if (p.claimed.includes('venus-defense'))
            return p.claimed.includes('venus-shield')
                ? 'Akt III ukończony · placówka obroniona · osłona słoneczna gotowa'
                : 'Placówka obroniona · przekaż w stacji 12 komponentów na osłonę';
        if (this.venusAssault.state !== 'idle') return this.venusAssault.summary;
        if (p.claimed.includes('venus-build'))
            return `Placówka gotowa · G przy obiekcie rozpoczyna obronę · osłona: ${p.claimed.includes('venus-shield') ? 'gotowa' : 'projekt w stacji'}`;
        if (venusPreparationComplete(p))
            return this.orbitalBuildProgress > 0
                ? `Budowa placówki · ${Math.floor((this.orbitalBuildProgress / 2) * 100)}%`
                : '8 placówka · E przez 2 s przy obiekcie rozpoczyna budowę';
        return '';
    }
    get stationSafeRadius() {
        return this.area === 'orbit' ? stationProtectionRadius(this.campaign) : 0;
    }
    get stationShieldActive() {
        return this.area === 'orbit' && (!this.campaign.story || this.campaign.station.shield);
    }
    get stationName() {
        return this.campaign.story ? 'Satuk 15' : 'Aurora';
    }
    get surfaceUnlocked() {
        return (
            this.campaign.story?.sector === 'lunar' &&
            this.campaign.story.claimed.includes('lunar-survey')
        );
    }
    get buildStage() {
        return this.campaign.story ? lunarBuildStage(this.campaign.story) : 0;
    }
    get defenseAvailable() {
        return (
            this.campaign.story?.sector === 'lunar' &&
            this.campaign.story.claimed.includes('lunar-foundation') &&
            !this.campaign.story.claimed.includes('lunar-defense')
        );
    }
    get defenseSummary() {
        if (this.marsBaseSector) return this.marsBaseStatus;
        if (this.venusSector) return this.venusStatus;
        if (this.campaign.story?.claimed.includes('lunar-attack'))
            return 'Akt I ukończony · stacja księżycowa obroniona';
        if (this.assaultAvailable || this.lunarAssault.state === 'complete')
            return this.lunarAssault.summary;
        if (this.campaign.story?.claimed.includes('lunar-defense'))
            return 'Osłona budowy ukończona · postęp zapisany';
        return this.defenseAvailable ? this.lunarDefense.summary : '';
    }
    get assaultAvailable() {
        if (this.marsBaseSector)
            return (
                !!this.campaign.story?.claimed.includes('mars-base-build') &&
                !this.campaign.story.claimed.includes('mars-base-defense')
            );
        if (this.venusSector)
            return (
                !!this.campaign.story?.claimed.includes('venus-build') &&
                !this.campaign.story.claimed.includes('venus-defense')
            );
        const p = this.campaign.story;
        return (
            p?.sector === 'lunar' &&
            ['lunar-commission', 'lunar-defense'].every((id) => p.claimed.includes(id)) &&
            !p.claimed.includes('lunar-attack')
        );
    }
    get landmarks() {
        const landmarks = this.beltSector
            ? this.sector.landmarks.flatMap((l) => {
                  if (l.key < 3 || l.key > 5) return [l];
                  const rock = [...this.rocks.values()].find((r) => r.beltBarrier === l.key - 3);
                  return rock
                      ? [
                            {
                                ...l,
                                x: rock.body.translation().x * P,
                                y: rock.body.translation().y * P,
                            },
                        ]
                      : [];
              })
            : this.sector.landmarks;
        return landmarks.filter(
            (l) =>
                (l.area ?? 'orbit') === this.area &&
                (!this.marsBaseSector || this.orbitalBaseStage > 0 || l.siteId !== 'archive'),
        );
    }
    get mapCenter(): Point {
        return this.area === 'surface' ? MOON.center : { x: 0, y: 0 };
    }
    get nearbyPassage() {
        return this.landmarks.find(
            (l) =>
                l.kind === 'passage' &&
                Math.hypot(l.x - this.position.x, l.y - this.position.y) < l.radius,
        );
    }
    get nearbyConstruction() {
        return (
            this.area === 'surface' &&
            Math.hypot(
                this.position.x - MOON.construction.x,
                this.position.y - MOON.construction.y,
            ) < 180
        );
    }
    get surfaceContext() {
        if (this.outerSector && (this.firstBoss.active || this.nearbyBossArena))
            return this.bossStartProgress > 0
                ? `Przygotowanie starcia · ${Math.floor((this.bossStartProgress / 2) * 100)}%`
                : this.firstBoss.summary;
        if (this.marsBaseSector)
            return this.nearbyOrbitalBase || this.marsAssault.active ? this.marsBaseStatus : '';
        if (this.venusSector)
            return this.nearbyVenusOutpost || this.venusAssault.active ? this.venusStatus : '';
        if (this.lunarAssault.active && this.area === 'surface')
            return this.nearbyPassage
                ? 'Wyjście przerwie obronę stacji · przytrzymaj E przez 2 s'
                : this.lunarAssault.summary;
        if (this.nearbyConstruction && this.assaultAvailable) return this.lunarAssault.summary;
        if (this.area === 'surface' && this.lunarDefense.active)
            return this.nearbyPassage
                ? 'Wyjście na orbitę przerwie obronę · przytrzymaj E przez 2 s'
                : this.lunarDefense.summary;
        if (this.nearbyConstruction && this.defenseStartProgress > 0)
            return `Przygotowanie obrony · ${Math.floor((this.defenseStartProgress / 2) * 100)}% · przytrzymaj G`;
        if (this.nearbyPassage)
            return this.grippers.arms.some((a) => a.held)
                ? 'Chwytaki zaciągają łup · zaczekaj przed zmianą obszaru'
                : this.passageProgress > 0
                  ? `Zmiana obszaru · ${Math.floor((this.passageProgress / MOON.transferSeconds) * 100)}%`
                  : `Przytrzymaj E przez 2 s · ${this.area === 'orbit' ? 'lot nad Księżycem' : 'powrót na orbitę'} · poniżej 60 m/s`;
        if (this.nearbyConstruction && this.buildStage < 2) {
            const key = this.buildStage === 0 ? 'lunar-foundation' : 'lunar-installations';
            const n = this.campaign.story!.progress[key],
                target = STORY_TASKS.find((t) => t.id === key)!.target;
            return `Budowa · ${this.buildStage === 0 ? 'ruda' : 'komponenty'} ${n}/${target} · C transfer lub E 2 s · dostawa pozostaje na budowie`;
        }
        return this.nearbyConstruction && this.defenseAvailable ? this.lunarDefense.summary : '';
    }
    get stationDestination() {
        return this.campaign.story ? 'stacji Satuk 15' : 'Aurory';
    }
    get stationRecipient() {
        return this.campaign.story ? 'stacji Satuk 15' : 'Aurorze';
    }
    get sectorRadius() {
        if (this.area === 'surface') return MOON.radius;
        return this.campaign.story ? storyRadius(this.campaign.story) : GAME.sectorRadius;
    }
    get position(): Point {
        const p = this.ship.translation();
        return { x: p.x * P, y: p.y * P };
    }
    get velocity(): Point {
        const v = this.ship.linvel();
        return { x: v.x * P, y: v.y * P };
    }
    get speed() {
        const v = this.velocity;
        return Math.hypot(v.x, v.y);
    }
    get outpostEquipment(): WeaponId {
        return random(this.sector.seed ^ 0x723ba1)() < 0.5 ? 'pulse' : 'rail';
    }
    get stolenEquipment(): WeaponId | undefined {
        return this.outpost.equipmentSecured ? this.outpostEquipment : undefined;
    }
    get equipmentRoom() {
        return (
            this.cargoCapacity -
                this.cargoUsed -
                this.grippers.arms.filter((a) => a.held || a.phase === 'extend').length >=
            OUTPOST.equipmentSlots
        );
    }
    get cargoUsed() {
        return resourceTotal(this.cargo) + (this.stolenEquipment ? OUTPOST.equipmentSlots : 0);
    }
    get prototypes(): readonly PrototypeId[] {
        return this.installed;
    }
    get pendingChoice(): Readonly<{ cacheId: number; offers: readonly PrototypeId[] }> | null {
        return this.choice;
    }
    get cargoCapacity() {
        return this.baseCargoCapacity + (this.installed.includes('cargo') ? 20 : 0);
    }
    get maxHull() {
        return this.baseMaxHull + (this.installed.includes('hull') ? 30 : 0);
    }
    get driveMultiplier() {
        return this.installed.includes('drive') ? 1.2 : 1;
    }
    get handlingMultiplier() {
        return this.installed.includes('handling') ? 1.25 : 1;
    }
    get laserRange() {
        return this.hullConfig.laserRange * (this.installed.includes('laser') ? 1.25 : 1);
    }
    get laserPowerMultiplier() {
        return this.installed.includes('laser') ? 1.35 : 1;
    }
    get weaponConfig() {
        return WEAPONS[this.modules.weapon];
    }
    get gunDamage() {
        return (
            this.weaponConfig.damage *
            (this.installed.includes('guns') ? 1.35 : 1) *
            (this.hullId === 'raider' || this.hullId === 'lancer'
                ? 1 + this.modules.drill * 0.25
                : 1)
        );
    }
    get salvageSeconds() {
        return SALVAGE.seconds / this.hullConfig.towPickupSpeed;
    }
    get recoverySeconds() {
        return RECOVERY.seconds / this.hullConfig.towPickupSpeed;
    }
    get repairKitCost() {
        return { ore: JOBS.kit.ore * 2, parts: JOBS.kit.parts * 2 };
    }
    get nearbyWreck() {
        if (this.salvage.full) return undefined;
        return [...this.salvage.items.values()]
            .filter(
                (w) =>
                    w.source !== 'recovery' &&
                    !this.salvage.towing.has(w.id) &&
                    Math.hypot(
                        salvagePosition(w).x - this.position.x,
                        salvagePosition(w).y - this.position.y,
                    ) < SALVAGE.range,
            )
            .sort(
                (a, b) =>
                    Math.hypot(
                        salvagePosition(a).x - this.position.x,
                        salvagePosition(a).y - this.position.y,
                    ) -
                    Math.hypot(
                        salvagePosition(b).x - this.position.x,
                        salvagePosition(b).y - this.position.y,
                    ),
            )[0];
    }
    get recycledWreck() {
        const item = this.salvage.towed;
        return item && item.source !== 'recovery' && item.health > 0 ? item.source : undefined;
    }
    releaseWreck() {
        const held = [...this.salvage.towing.values()];
        const ordinary = held.filter(
            (item) => item.source !== 'recovery' || item.id === this.rescueOperation?.item.id,
        );
        const wrecks = ordinary.length ? ordinary : held;
        if (!wrecks.length) return;
        for (const item of wrecks) this.salvage.detach(item);
        if (!this.salvage.towing.has(-(this.recoverySignal?.id ?? 0))) this.recoverySecured = false;
        this.syncTow();
        this.salvageProgress = 0;
        this.setNotice('Hol zwolniony · wrak pozostaje w kosmosie.');
    }
    get nearbyCache() {
        const p = this.position,
            signal = this.recoverySignal;
        if (
            signal &&
            !this.recoverySecured &&
            !this.recoveryDestroyed &&
            Math.hypot(p.x - signal.x, p.y - signal.y) < RECOVERY.radius
        )
            return undefined;
        return this.sector.caches.find(
            (cache) =>
                !this.openedCaches.has(cache.id) &&
                Math.hypot(cache.x - p.x, cache.y - p.y) < CACHE.radius,
        );
    }
    get nextCache() {
        const p = this.position;
        return this.sector.caches
            .filter((cache) => !this.openedCaches.has(cache.id))
            .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    }
    choosePrototype(id: PrototypeId | null) {
        if (
            !this.choice ||
            this.ended ||
            this.disposed ||
            (id !== null && !this.choice.offers.includes(id))
        )
            return false;
        if (id) {
            this.installed.push(id);
            if (id === 'hull') this.hull = Math.min(this.maxHull, this.hull + 30);
            if (id === 'grippers') {
                this.grippers.range = this.hullConfig.grabberRange * 1.4;
                this.grippers.speedMultiplier = 1.25;
            }
            this.setNotice(`Zamontowano: ${PROTOTYPES[id].name}. Działa do końca wyprawy.`);
        } else this.setNotice('Skrytka opróżniona bez montażu prototypu.');
        this.choice = null;
        return true;
    }
    get turnSpeed() {
        return (
            this.hullConfig.turnSpeed *
            this.pilot.turn *
            (1 + 0.2 * this.modules.handling) *
            this.handlingMultiplier
        );
    }
    get cloaked() {
        return this.opticalCloak;
    }
    get opticalCloak() {
        return this.opticalCloakTime > 1e-8;
    }
    get opticalCloakInterval() {
        return WIDMO.cooldown / (1 + this.modules.drill * 0.2);
    }
    get enemySignature() {
        return this.opticalCloak ? 0 : 1 - this.hullConfig.radarJamming;
    }
    toggleCloak() {
        if (this.ended || this.disposed || this.choice) return;
        this.setNotice(
            this.hullId === 'widmo'
                ? 'PPM: kamuflaż optyczny.'
                : `Pasywne zakłócanie radarów: ${Math.round(this.hullConfig.radarJamming * 100)}%.`,
        );
    }
    get armament() {
        return ARMAMENT_KITS[this.modules.weapon];
    }
    get dashDamage() {
        return PHASE_DASH.damage * this.armament.power * (1 + this.modules.handling * 0.25);
    }
    get distanceHome() {
        const p = this.position;
        return Math.hypot(p.x, p.y);
    }
    get dockable() {
        return (
            this.area === 'orbit' &&
            this.distanceHome < GAME.dockRadius &&
            this.speed < GAME.dockSpeed &&
            [...this.salvage.towing.values()].every(
                (item) => Math.hypot(salvagePosition(item).x, salvagePosition(item).y) < 350,
            ) &&
            !this.grippers.arms.some((arm) => arm.held)
        );
    }
    get nearbyOutpost() {
        const terminal = this.sector.outpost.terminal;
        return (
            Math.hypot(this.position.x - terminal.x, this.position.y - terminal.y) <
            OUTPOST.interactRadius
        );
    }
    private isObstacle(collider: RAPIER.Collider) {
        return (
            collider.handle === this.enemyFactory?.collider?.handle ||
            this.asteroidColliders.has(collider.handle) ||
            collider.handle === this.outpostCollider.handle ||
            this.fortressColliders.has(collider.handle)
        );
    }
    get fortressGuardCount() {
        return this.sector.fortress.guards.filter((g) => this.enemies.enemies.has(g.id)).length;
    }
    get nearbyScanSite() {
        const p = this.position;
        return this.landmarks.find(
            (site) =>
                site.siteId &&
                (site.kind !== 'construction' || this.buildStage >= 2) &&
                Math.hypot(site.x - p.x, site.y - p.y) < SCAN.radius,
        );
    }
    get context() {
        if (this.cargoTransferRemaining > 0)
            return `Transfer ładunku · ${Math.floor((1 - this.cargoTransferRemaining / 2.4) * 100)}% · ruch lub ogień przerywa`;
        if (this.stationLogistics && this.canTransferCargo)
            return this.area === 'surface'
                ? 'C · transfer do budowy · E dostawa / odbiór techniczny'
                : 'C · przekaż ładunek do Satuk 15 bez dokowania · E dokowanie przy pierścieniu';
        if (this.terminalPuzzle)
            return this.terminalPuzzle.mode === 'breach'
                ? 'Włamanie · połącz obwód terminala'
                : 'Sabotaż · przekieruj zasilanie skanera';
        if (this.nearbyOutpost && !this.outpost.secured)
            return this.outpost.alarm > 0
                ? 'Alarm · G przekieruj zasilanie (1 komponent)'
                : 'E włamanie · G przekieruj zasilanie (1 komponent)';
        if (this.relayTuning) return 'Strojenie przekaźnika · dopasuj fazy sygnału';
        if (this.relayRequired && !this.surveyData.has('relay'))
            return 'E · otwórz strojenie łączności · poniżej 60 m/s';
        if (this.surfaceContext) return this.surfaceContext;
        if (this.choice) return 'Skrytka otwarta · wybierz prototyp, aby kontynuować lot';
        if (
            this.recoverySignal &&
            !this.recoverySecured &&
            !this.recoveryDestroyed &&
            Math.hypot(
                this.position.x - this.recoverySignal.x,
                this.position.y - this.recoverySignal.y,
            ) < RECOVERY.radius
        )
            return this.recoveryProgress > 0
                ? `Podejmowanie celu · ${Math.floor((this.recoveryProgress / this.recoverySeconds) * 100)}%`
                : `Przytrzymaj E · odzysk ${this.recoverySeconds} s · bez ciągu i ognia, poniżej 80 m/s`;
        if (this.nearbyWreck)
            return this.salvageProgress > 0
                ? 'Podłączanie holu · przytrzymaj E'
                : `E Holuj wrak · ${this.salvageSeconds} s · poniżej 80 m/s`;
        if (this.nearbyCache)
            return this.cacheProgress > 0
                ? `Otwieranie skrytki · ${Math.floor((this.cacheProgress / CACHE.seconds) * 100)}%`
                : 'Przytrzymaj E · skrytka 2,5 s · bez ciągu i ognia, poniżej 60 m/s';
        const site = this.nearbyScanSite;
        if (site?.siteId === 'fortress' && this.fortressGuardCount)
            return `Rdzeń zablokowany · obrońcy ${this.fortressGuardCount}/5`;
        if (site?.siteId && !this.surveyData.has(site.siteId))
            return this.scanProgress > 0
                ? `Skanowanie · ${Math.floor((this.scanProgress / SCAN.seconds) * 100)}%`
                : 'Przytrzymaj E · skan 3 s · bez ciągu i ognia, poniżej 60 m/s';
        if (this.repairProgress > 0)
            return `${this.aegis && !this.aegis.drone ? 'Odbudowa drona' : 'Naprawa napędu / kadłuba'} · ${Math.ceil((this.repairProgress / this.repairSeconds) * 100)}%`;
        if (this.aegis && !this.aegis.drone)
            return this.repairKits > 0
                ? 'Dron zniszczony · przytrzymaj R, aby odbudować'
                : 'Dron zniszczony · brak zestawu naprawczego';
        if (this.engineFault)
            return this.repairKits > 0
                ? 'AWARIA NAPĘDU · zwolnij poniżej 80 m/s i przytrzymaj R'
                : 'AWARIA NAPĘDU · brak zestawów · wróć do bazy z ograniczonym ciągiem';
        if (
            this.distanceHome < GAME.dockRadius &&
            this.speed < GAME.dockSpeed &&
            this.grippers.arms.some((arm) => arm.held)
        )
            return 'Chwytaki zaciągają łup · zaczekaj przed dokowaniem';
        if (this.distanceHome < 350)
            return this.dockable
                ? 'Przytrzymaj E · dokowanie'
                : 'Zbliż się do pierścienia · prędkość poniżej 65 m/s';
        const w = this.sector.landmarks.find((l) => l.kind === 'wreck'),
            p = this.position;
        if (w && !this.wreckVisited && Math.hypot(w.x - p.x, w.y - p.y) < 160)
            return 'E · przeszukaj wrak';
        if (this.recoveryDelivered)
            return `Cel ratunkowy przekazany ${this.stationRecipient} · możesz kontynuować wyprawę`;
        if (this.recoverySecured)
            return `Cel zabezpieczony na holu · wróć do ${this.stationDestination} i zadokuj`;
        return this.cargoUsed >= this.cargoCapacity
            ? 'Ładownia pełna · wróć do bazy'
            : this.harpoonArms
              ? 'LPM · zacisk szczęk    /    PPM · wysuw ramion ku celowi'
              : this.hasRocketLauncher
                ? this.atlasLock.locked !== null
                    ? 'Rakieta · cel zablokowany'
                    : this.atlasLock.target !== null
                      ? `Namierzanie · ${this.atlasLock.progress.toFixed(1)} / 3 s`
                      : this.hullId === 'phoenix'
                        ? 'LPM · laser bojowy    /    PPM · rakieta'
                        : 'LPM · rakieta    /    PPM · granaty'
                : this.aegis
                  ? `LPM · energia    /    PPM · impuls ${this.aegis.cooldown > 0 ? `${Math.ceil(this.aegis.cooldown)} s` : 'gotowy'}`
                  : this.hullId === 'widmo'
                    ? this.opticalCloak
                        ? `Kamuflaż optyczny · ${this.opticalCloakTime.toFixed(1)} s`
                        : `PPM · kamuflaż ${this.opticalCloakCooldown > 1e-8 ? `${Math.ceil(this.opticalCloakCooldown)} s` : 'gotowy'}`
                    : this.hullId === 'mule'
                      ? `LPM · lasery    /    PPM · zestaw ${this.repairKits ? 'zapas musi wynosić 0' : `${this.repairKitCost.ore} rudy / ${this.repairKitCost.parts} komponenty`}`
                      : this.hullId === 'fighter'
                        ? 'LPM · działka    /    PPM · granaty'
                        : 'LPM · działka bojowe    /    PPM · laser wydobywczy';
    }
    private prepareMiningField(live: boolean) {
        const site = MINING_CONVOY.site;
        this.sector.researchSite = { ...site, name: 'Złoże wydobywcze Muła' };
        this.sector.rocks = this.sector.rocks.filter(
            (r) => Math.hypot(r.x - site.x, r.y - site.y) > r.radius + 390,
        );
        const fieldStart = this.sector.rocks.length;
        for (let row = -4; row <= 4; row++) {
            for (let col = -4; col <= 4; col++) {
                if (!row || !col) continue; // Cross-shaped corridors for both ships.
                this.sector.rocks.push({
                    anchored: true,
                    x: site.x + col * 140,
                    y: site.y + row * 140,
                    radius: 40,
                    rich: (row + col) % 3 === 0,
                    copper: false,
                    variant: (row + 4) * 9 + col + 4,
                    vx: 0,
                    vy: 0,
                });
            }
        }
        if (live) {
            const site = MINING_CONVOY.site;
            for (const rock of [...this.rocks.values()]) {
                const p = rock.body.translation();
                if (Math.hypot(p.x * P - site.x, p.y * P - site.y) < rock.radius + 390) {
                    this.world.removeRigidBody(rock.body);
                    this.asteroidColliders.delete(rock.collider.handle);
                    this.rocks.delete(rock.id);
                }
            }
            for (const spec of this.sector.rocks.slice(fieldStart)) this.addRock(spec);
        }
    }
    private unlockLunarSurface() {
        if (!this.surfaceUnlocked || this.sector.landmarks.some((l) => l.area === 'surface'))
            return;
        const generated = generateStorySector(this.campaign.story!);
        this.sector.landmarks.push(
            ...generated.landmarks.filter((l) => l.area === 'surface' || l.kind === 'passage'),
        );
        for (const spec of generated.rocks.filter((r) => Math.hypot(r.x, r.y) > 10000)) {
            this.sector.rocks.push(spec);
            this.addRock(spec);
        }
        for (const rock of [...this.rocks.values()]) {
            const p = rock.body.translation(),
                point = { x: p.x * P, y: p.y * P };
            if (segmentDistance(point, { x: 0, y: 0 }, MOON.entrance) <= rock.radius + 150) {
                this.world.removeRigidBody(rock.body);
                this.asteroidColliders.delete(rock.collider.handle);
                this.rocks.delete(rock.id);
            }
        }
        if (!this.campaign.story!.claimed.includes('lunar-foundation')) {
            this.prepareMiningField(true);
            this.escort = new MiningEscort(this.world);
        }
        this.areaRevision++;
    }
    private addRock(spec: RockSpec) {
        // Surface outcrops remain fixed; every orbital rock starts in motion.
        if (Math.hypot(spec.x - MOON.center.x, spec.y - MOON.center.y) >= MOON.radius + 500) {
            const massive = spec.anchored || spec.beltBarrier !== undefined || spec.radius >= 100;
            spec = { ...spec, anchored: false, orbit: undefined };
            if (Math.hypot(spec.vx, spec.vy) < (massive ? 0.5 : 2.5)) {
                const angle = this.rng() * Math.PI * 2,
                    speed = massive ? 0.6 + this.rng() * 1.8 : 3 + this.rng() * 42;
                spec = { ...spec, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
            }
        }
        if (this.rocks.size >= 600) return;
        const distance = Math.hypot(spec.x, spec.y),
            boundary = this.stationSafeRadius + spec.radius + 2;
        if (this.stationSafeRadius > 0 && distance < boundary) {
            const angle = distance > 0 ? Math.atan2(spec.y, spec.x) : this.rng() * Math.PI * 2;
            spec = { ...spec, x: Math.cos(angle) * boundary, y: Math.sin(angle) * boundary };
        }
        const body = this.world.createRigidBody(
            (spec.anchored ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic())
                .setTranslation(spec.x / P, spec.y / P)
                .setLinvel(spec.vx / P, spec.vy / P)
                .setAngvel(
                    spec.anchored || Math.hypot(spec.vx, spec.vy) === 0
                        ? 0
                        : (this.rng() - 0.5) * 0.18,
                )
                .setLinearDamping(0),
        );
        const collider = this.world.createCollider(
            RAPIER.ColliderDesc.ball((spec.radius * 0.89) / P)
                .setDensity(3)
                .setRestitution(0.55)
                .setFriction(0.15),
            body,
        );
        const rock: Rock = {
            ...spec,
            surface: Math.hypot(spec.x - MOON.center.x, spec.y - MOON.center.y) < MOON.radius + 500,
            copper: spec.copper ?? (!!spec.rich && !spec.crystal && spec.variant % 5 === 2),
            id: ++this.ids,
            body,
            collider,
            health: spec.mercuryVein
                ? MERCURY_VEINS.health
                : spec.radius * (spec.crystal ? 1.8 : 1.35),
            previous: { x: spec.x, y: spec.y },
            previousAngle: 0,
            previousVelocity: { x: spec.vx, y: spec.vy },
        };
        this.rocks.set(rock.id, rock);
        this.asteroidColliders.set(collider.handle, rock.id);
        return rock;
    }
    setNotice(text: string) {
        this.notice = text;
        this.noticeTime = 3;
    }
    get magneticNetwork() {
        return (
            this.campaign.story?.sector === 'earth' &&
            this.area === 'orbit' &&
            this.campaign.story.claimed.includes('earth-workshop')
        );
    }
    get magneticRelays() {
        return this.magneticNetwork ? MAGNETIC_RELAYS : [];
    }
    get activeMagneticRelays() {
        const active = [...this.campaign.magneticRelays];
        if (this.campaign.story?.claimed.includes('earth-relay') && !active.includes(0))
            active.push(0);
        return active;
    }
    get magneticZones() {
        return this.magneticNetwork
            ? [
                  { x: 0, y: 0, radius: 1450, name: 'Satuk 15 · osłona magnetyczna' },
                  ...MAGNETIC_RELAYS.filter((r) => this.activeMagneticRelays.includes(r.id)),
                  REMOTE_MAGNETIC_ZONE,
              ]
            : [];
    }
    private updateMagneticRelay(input: FlightInput) {
        if (
            !this.magneticNetwork ||
            !input.interact ||
            this.speed > 60 ||
            this.thrusting ||
            input.fire ||
            input.mine
        )
            return;
        const relay = this.magneticRelays.find(
            (r) =>
                r.id !== 0 &&
                !this.activeMagneticRelays.includes(r.id) &&
                Math.hypot(this.position.x - r.x, this.position.y - r.y) < 150,
        );
        if (!relay) return;
        if (relay.id === 2 && this.campaign.station.workshop < 2) {
            this.setNotice('Przekaźnik południowy wymaga warsztatu II · rozbuduj stację.');
            return;
        }
        this.campaign.magneticRelays.push(relay.id);
        this.deliveryRevision++;
        this.setNotice(`${relay.name} zsynchronizowany · osłona sektora rozszerzona`);
        this.events.push({ ...relay, kind: 'collect', sound: 'complete' });
    }
    get hyperFuel() {
        return this.campaign.ship?.hyperFuel ?? 0;
    }
    get hyperCapacity() {
        return this.hyperUnlocked ? 2 + this.campaign.ship!.hyperdriveLevel : 0;
    }
    get hyperUnlocked() {
        return (this.campaign.ship?.hyperdriveLevel ?? 0) > 0;
    }
    get nearestHypergate() {
        return this.area === 'orbit' ? nearestGate(this.sector.hyperlanes, this.position) : null;
    }
    get hyperdriveLock(): string | null {
        if (!this.hyperUnlocked) return 'Brak hipernapędu · zainstaluj moduł w Przemysł → Paliwo.';
        if (this.area !== 'orbit') return 'Hipernapęd działa tylko na orbicie.';
        if (this.hyperFuel <= 0) return 'Brak paliwa · tankowanie w Przemysł → Nawigacja.';
        if (this.engineFault || this.hull <= 0 || this.ended) return 'Napęd lub statek niesprawny.';
        if (this.speed > 60 || this.damageCooldown > 0)
            return 'Wyhamuj poniżej 60 m/s i zerwij ostrzał.';
        if (
            this.salvage.towing.size ||
            this.grippers.arms.some((a) => a.held || a.phase !== 'idle')
        )
            return 'Odłącz hol i zakończ pracę chwytaków.';
        if (this.activeAssault.active || this.firstBoss.active)
            return 'Hipernapęd zablokowany podczas obrony lub starcia.';
        if (
            this.terminalPuzzle ||
            this.relayTuning ||
            this.rescueOperation?.repair ||
            this.transferActive ||
            this.cargoTransferRemaining > 0 ||
            this.pendingChoice
        )
            return 'Zakończ bieżącą interakcję.';
        return null;
    }
    private hyperInput(input: FlightInput) {
        const pressed = !!input.hyperdrive && !this.hyperHeld;
        this.hyperHeld = !!input.hyperdrive;
        if (pressed && this.hyperdrive.state === 'charging') {
            this.hyperdrive.cancel();
            this.setNotice('Ładowanie hipernapędu przerwane · paliwo zachowane.');
            return;
        }
        if (!pressed || this.hyperdrive.active) return;
        const lock = this.hyperdriveLock;
        if (
            lock ||
            input.thrust ||
            input.fire ||
            input.mine ||
            input.repair ||
            input.sabotage ||
            input.interact
        ) {
            this.setNotice(lock ?? 'Zwolnij sterowanie i narzędzia przed skokiem.');
            return;
        }
        const from = this.position,
            gate = this.nearestHypergate;
        let target: Point;
        let guided = false;
        if (
            gate &&
            Math.hypot(from.x - gate.from.x, from.y - gate.from.y) < HYPERDRIVE.gateRadius
        ) {
            target = { ...gate.to };
            guided = true;
        } else {
            const dx = input.target.x - from.x,
                dy = input.target.y - from.y,
                length = Math.hypot(dx, dy);
            if (length < 10) {
                this.setNotice('Wskaż kurs myszą. K prowadzi do najbliższej śluzy.');
                return;
            }
            let distance = HYPERDRIVE.range as number;
            while (
                distance >= HYPERDRIVE.minimum &&
                Math.hypot(
                    from.x + (dx / length) * distance - this.mapCenter.x,
                    from.y + (dy / length) * distance - this.mapCenter.y,
                ) >
                    this.sectorRadius - 130
            )
                distance -= 100;
            target = { x: from.x + (dx / length) * distance, y: from.y + (dy / length) * distance };
        }
        if (
            Math.hypot(target.x - from.x, target.y - from.y) < HYPERDRIVE.minimum ||
            Math.hypot(target.x - this.mapCenter.x, target.y - this.mapCenter.y) >
                this.sectorRadius - 100
        ) {
            this.setNotice('Za mało miejsca na skok wewnątrz sektora.');
            return;
        }
        if (guided && this.hyperPathHit(from, target)) {
            this.setNotice('Śluza zablokowana · poczekaj na wolny korytarz.');
            return;
        }
        if (this.hyperdrive.start(from, target, guided))
            this.setNotice(
                'Ładowanie · ponowna spacja anuluje · kolizja w przelocie niszczy statek.',
            );
    }
    private hyperPathHit(from: Point, to: Point) {
        const radius = (Math.hypot(...this.hullConfig.hitbox) + 4) * this.hullConfig.size;
        return this.world.castShape(
            { x: from.x / P, y: from.y / P },
            0,
            { x: (to.x - from.x) / P, y: (to.y - from.y) / P },
            new RAPIER.Ball(radius / P),
            0,
            1,
            true,
            undefined,
            undefined,
            this.shipCollider,
            this.ship,
            (c) => !c.isSensor(),
        );
    }
    private advanceHyperdrive(dt: number) {
        const drive = this.hyperdrive;
        if (!drive.active) return;
        if (this.hull <= 0 || this.damageCooldown > 0 || this.area !== 'orbit') {
            drive.cancel();
            return;
        }
        this.ship.setLinvel({ x: 0, y: 0 }, true);
        this.ship.setAngvel(0, true);
        if (drive.state === 'charging') {
            if (!drive.charge(dt)) return;
            if (drive.guided && this.hyperPathHit(this.position, drive.target)) {
                drive.cancel();
                this.setNotice('Śluza zablokowana podczas ładowania · paliwo zachowane.');
                return;
            }
            if (!this.campaign.ship || this.hyperFuel <= 0) {
                drive.cancel();
                return;
            }
            this.campaign.ship.hyperFuel--;
            this.deliveryRevision++;
        }
        const from = this.position,
            next = drive.next(from, dt),
            dx = next.point.x - from.x,
            dy = next.point.y - from.y;
        this.ship.setRotation(Math.atan2(dy, dx), true);
        const hit = this.hyperPathHit(from, next.point);
        const fraction = hit ? Math.max(0, hit.time_of_impact) : 1;
        this.ship.setTranslation(
            { x: (from.x + dx * fraction) / P, y: (from.y + dy * fraction) / P },
            true,
        );
        if (hit) {
            this.statistics.hullDamage += this.hull;
            this.hull = 0;
            this.ended = 'destroyed';
            this.deathReason = 'Zderzenie podczas hiperskoku zniszczyło statek.';
            drive.cancel();
            return;
        }
        if (next.complete) {
            drive.cancel();
            this.setNotice('Hiperskok zakończony · odzyskano sterowanie.');
        }
    }
    step(input: FlightInput) {
        if (this.ended || this.disposed || this.choice) return;
        const dt = GAME.step;
        this.selectWorldRecovery();
        if (this.transferActive) {
            this.transferRemaining = Math.max(0, this.transferRemaining - dt);
            return;
        }
        this.hyperInput(input);
        const hyperFrame = this.hyperdrive.active;
        if (hyperFrame)
            input = {
                ...input,
                target: this.position,
                thrust: false,
                brake: false,
                turn: 0,
                boost: false,
                fire: false,
                mine: false,
                repair: false,
                sabotage: false,
                interact: false,
            };
        this.elapsed += dt;
        if (this.mineAreaRevision !== this.areaRevision) {
            this.mines.clear();
            this.mineAreaRevision = this.areaRevision;
        }
        this.kineticShield.update(dt, this.area === 'orbit' && this.distanceHome < GAME.dockRadius);
        this.shotCooldown -= dt;
        this.laserEffectCooldown -= dt;
        this.laserBeam = null;
        this.laserBeams.length = 0;
        this.revealTime = Math.max(0, this.revealTime - dt);
        if (this.modules.hull === 'widmo') {
            this.opticalCloakTime = Math.max(0, this.opticalCloakTime - dt);
            this.opticalCloakCooldown = Math.max(0, this.opticalCloakCooldown - dt);
            if (input.mine && !this.opticalCloakPressed && this.opticalCloakCooldown <= 1e-8) {
                this.opticalCloakTime = WIDMO.duration;
                this.opticalCloakCooldown = this.opticalCloakInterval;
                this.setNotice('Kamuflaż optyczny aktywny · 3 s.');
            }
            this.opticalCloakPressed = !!input.mine;
        }
        if (
            input.fire ||
            (input.mine && !this.opticalCloak && this.modules.hull !== 'mule') ||
            (input.boost && input.thrust)
        )
            this.revealTime = 3;
        if (
            this.modules.hull === 'mule' &&
            input.mine &&
            this.repairKits === 0 &&
            this.campaign.repairKits < CREW.kitLimit &&
            this.cargo.ore >= this.repairKitCost.ore &&
            this.cargo.parts >= this.repairKitCost.parts
        ) {
            this.cargo.ore -= this.repairKitCost.ore;
            this.cargo.parts -= this.repairKitCost.parts;
            this.supplyRepairKit();
            this.setNotice('Utworzono zestaw naprawczy · przytrzymaj R, aby użyć.');
            this.events.push({ ...this.position, kind: 'collect', sound: 'complete' });
        }
        this.aimTarget = { ...input.target };
        if (this.aegis) {
            this.aegis.update(dt, this.position);
            this.updateAegis(input);
        }
        this.damageCooldown -= dt;
        this.noticeTime -= dt;
        this.previous = this.position;
        this.previousAngle = this.ship.rotation();
        if (hyperFrame) {
            this.thrusting = false;
            this.boosting = false;
            this.braking = false;
            this.reversing = false;
            this.advanceHyperdrive(dt);
            if (this.ended) return;
        }
        for (const rock of this.rocks.values()) {
            const p = rock.body.translation();
            rock.previous = { x: p.x * P, y: p.y * P };
            rock.previousAngle = rock.body.rotation();
            const v = rock.body.linvel();
            rock.previousVelocity = { x: v.x * P, y: v.y * P };
            if (!rock.surface && !rock.anchored && !rock.defense) {
                const recycled = recycleAsteroid(
                    rock.previous,
                    rock.previousVelocity,
                    this.campaign.story ? storyRadius(this.campaign.story) : GAME.sectorRadius,
                    rock.radius,
                    this.rng,
                );
                if (recycled) {
                    rock.body.setTranslation(
                        { x: recycled.position.x / P, y: recycled.position.y / P },
                        true,
                    );
                    rock.body.setLinvel(
                        { x: recycled.velocity.x / P, y: recycled.velocity.y / P },
                        true,
                    );
                    rock.previous = { ...recycled.position };
                } else {
                    const next = cruisingVelocity(
                        rock.previousVelocity,
                        rock.variant,
                        rock.radius >= 100 || rock.mercuryVein || rock.beltBarrier !== undefined,
                    );
                    rock.body.setLinvel({ x: next.x / P, y: next.y / P }, true);
                }
            }
            if (rock.orbit) {
                const flow = rock.orbit,
                    dx = rock.previous.x - flow.x,
                    dy = rock.previous.y - flow.y;
                const distance = Math.max(1, Math.hypot(dx, dy));
                const radial = clamp((flow.radius - distance) * 0.15, -30, 30);
                const desired = {
                    x: ((-dy / distance) * flow.speed + (dx / distance) * radial) / P,
                    y: ((dx / distance) * flow.speed + (dy / distance) * radial) / P,
                };
                const ex = desired.x - v.x,
                    ey = desired.y - v.y;
                const fraction = Math.min(
                    1,
                    ((60 / P) * dt) / Math.max(0.00001, Math.hypot(ex, ey)),
                );
                rock.body.applyImpulse(
                    { x: ex * rock.body.mass() * fraction, y: ey * rock.body.mass() * fraction },
                    true,
                );
            }
        }
        if (!hyperFrame) {
            const maxTurn = this.turnSpeed;
            const desiredAngularVelocity = clamp(input.turn ?? 0, -1, 1) * maxTurn;
            const response =
                1 -
                Math.exp(
                    -GAME.turnResponse *
                        (1 + 0.2 * this.modules.handling) *
                        this.handlingMultiplier *
                        dt,
                );
            const angularError = desiredAngularVelocity - this.ship.angvel();
            this.ship.applyTorqueImpulse(
                angularError * response * this.ship.effectiveAngularInertia(),
                true,
            );
            const mass = this.ship.mass(),
                velocity = this.ship.linvel();
            const a = this.ship.rotation() + this.ship.angvel() * dt;
            const forward = (velocity.x * Math.cos(a) + velocity.y * Math.sin(a)) * P;
            const sideways = Math.abs(-velocity.x * Math.sin(a) + velocity.y * Math.cos(a)) * P;
            this.reversing = input.brake && forward <= GAME.stopSpeed && sideways < 20;
            this.thrusting = (input.thrust && !input.brake) || this.reversing;
            this.boosting = !!input.boost && this.thrusting && !this.reversing;
            this.braking =
                (input.brake && !this.reversing) ||
                (!this.thrusting && this.speed > GAME.stopSpeed);
            if (this.thrusting) {
                // Arcade assistance follows the hull, independently of mouse aim.
                const power = this.engineFault ? GAME.damagedThrust : 1;
                const multiplier = this.reversing
                    ? -GAME.reverseSpeed
                    : this.boosting
                      ? this.hullConfig.boost
                      : 1;
                const targetSpeed =
                    (this.hullConfig.maxSpeed * this.driveMultiplier * power * multiplier) / P;
                const dx = Math.cos(a) * targetSpeed - velocity.x;
                const dy = Math.sin(a) * targetSpeed - velocity.y;
                const difference = Math.hypot(dx, dy);
                const change =
                    ((this.hullConfig.thrust *
                        (1 + 0.15 * this.modules.engine) *
                        this.driveMultiplier *
                        power *
                        (this.reversing ? 0.5 : this.boosting ? GAME.boostThrust : 1)) /
                        P) *
                    dt;
                const ratio = difference > 0 ? Math.min(1, change / difference) : 0;
                this.ship.applyImpulse({ x: dx * ratio * mass, y: dy * ratio * mass }, true);
            } else {
                const speed = Math.hypot(velocity.x, velocity.y);
                const nextSpeed = input.brake
                    ? Math.max(0, speed - ((this.hullConfig.brake * this.pilot.brake) / P) * dt)
                    : speed * Math.exp(-GAME.releaseDrag * this.pilot.brake * dt);
                const retained =
                    speed > 0 && nextSpeed * P >= GAME.stopSpeed ? nextSpeed / speed : 0;
                this.ship.applyImpulse(
                    {
                        x: velocity.x * (retained - 1) * mass,
                        y: velocity.y * (retained - 1) * mass,
                    },
                    true,
                );
            }
        }
        const anchor = this.position,
            shipAngle = this.ship.rotation();
        this.salvage.beforeStep(
            dt,
            {
                x: anchor.x - Math.cos(shipAngle) * 28,
                y: anchor.y - Math.sin(shipAngle) * 28,
            },
            shipAngle,
        );
        if (this.escort && (!this.miningEscort || this.area === 'surface')) {
            const obstacles = [...this.rocks.values()]
                .map((r) => ({ ...r.body.translation(), radius: r.radius }))
                .map((r) => ({ x: r.x * P, y: r.y * P, radius: r.radius }));
            obstacles.push({ ...this.sector.outpost, radius: OUTPOST.radius });
            const hostileNear = [...this.enemies.enemies.values()].some(
                (e) =>
                    Math.hypot(
                        enemyPosition(e).x - this.escort!.position.x,
                        enemyPosition(e).y - this.escort!.position.y,
                    ) < 750,
            );
            const completed = this.escort.update(dt, this.position, obstacles, hostileNear);
            if (this.miningEscort) this.updateMiningEscort(dt, hostileNear);
            if (
                this.miningEscort &&
                this.miningEscort.state !== 'destroyed' &&
                this.campaign.story!.claimed.includes('lunar-foundation')
            ) {
                this.miningEscort.complete();
            } else if (completed && this.miningEscort) {
                const e = this.miningEscort;
                const cargo = { ore: e.cargoOre, parts: e.cargoParts };
                const result = deliverLunarCargo(this.campaign, cargo, false);
                if (result?.change.titles.length)
                    this.radioMessages.push(
                        `Budowa potwierdza dostawę Muła. Ukończono: ${result.change.titles.join(', ')}.`,
                    );
                e.deliveredOre += e.cargoOre - cargo.ore;
                e.cargoOre = cargo.ore;
                e.cargoParts = cargo.parts;
                e.trips++;
                this.deliveryRevision++;
                if (this.campaign.story!.claimed.includes('lunar-foundation')) {
                    e.complete();
                    this.setNotice('Fundamenty ukończone · kadłub Muła odblokowany.');
                } else {
                    e.resumeMining();
                    this.setNotice(`Muł dostarczył ${result?.amount ?? 0} Fe · kolejny kurs.`);
                }
            } else if (completed) {
                this.surveyData.add('escort');
                this.setNotice('Kepler: badania ukończone · wróć z danymi do Aurory.');
                this.events.push({
                    ...this.escort.position,
                    kind: 'collect',
                    sound: 'complete',
                    rich: true,
                });
            }
        }
        if (this.miningEscort && this.area !== 'surface') {
            this.miningEscort.body.setLinvel({ x: 0, y: 0 }, true);
            this.miningEscort.body.setAngvel(0, true);
            this.miningEscort.previous = this.miningEscort.position;
        }
        this.guide?.guide(
            dt,
            this.campaign,
            this.cargo,
            this.position,
            [...this.rocks.values()].map((r) => {
                const p = r.body.translation();
                return { x: p.x * P, y: p.y * P, radius: r.radius };
            }),
            (text) => this.guideMessages.push(text),
        );
        this.updateGuideMining(dt);
        const beforeImpact = this.velocity;
        this.sentries.update(
            dt,
            this.area === 'orbit',
            this.enemies,
            (collider) => this.isObstacle(collider),
            (drone, enemy) => this.fireSentry(drone, enemy),
        );
        const chasingBefore = [...this.enemies.enemies.values()].filter(
            (enemy) => enemy.state === 'chase',
        ).length;
        this.enemies.update(
            dt,
            this.position,
            beforeImpact,
            (collider) => this.isObstacle(collider),
            (enemy) => this.fireEnemy(enemy),
            this.enemySignature,
            this.activeAssault.active
                ? { position: this.assaultSite, velocity: { x: 0, y: 0 }, kind: 'station' }
                : this.escort?.vulnerable && (!this.miningEscort || this.area === 'surface')
                  ? { position: this.escort.position, velocity: this.escort.velocity }
                  : undefined,
            this.stationSafeRadius,
            this.sentries.allies,
        );
        if (
            !chasingBefore &&
            [...this.enemies.enemies.values()].some((enemy) => enemy.state === 'chase')
        )
            this.setNotice('Patrol wykrył statek · walcz, wykorzystaj osłonę lub zerwij pościg.');
        this.enforceShield();
        const velocities = new Map<number, Point>();
        velocities.set(this.shipCollider.handle, beforeImpact);
        for (const rock of this.rocks.values())
            velocities.set(rock.collider.handle, rock.previousVelocity);
        for (const enemy of this.enemies.enemies.values()) {
            const v = enemy.body.linvel();
            velocities.set(enemy.collider.handle, { x: v.x * P, y: v.y * P });
        }
        for (const item of this.salvage.items.values()) {
            const v = item.body.linvel();
            velocities.set(item.collider.handle, { x: v.x * P, y: v.y * P });
        }
        if (this.escort) velocities.set(this.escort.collider.handle, this.escort.velocity);
        for (const drone of this.sentries.drones.values()) {
            const velocity = drone.body.linvel();
            velocities.set(drone.collider.handle, { x: velocity.x * P, y: velocity.y * P });
        }
        if (this.aegis?.drone) {
            const velocity = this.aegis.drone.body.linvel();
            velocities.set(this.aegis.drone.collider.handle, {
                x: velocity.x * P,
                y: velocity.y * P,
            });
        }
        this.updateDash(input, dt);
        const dashFrom = { ...this.position };
        this.world.step(this.queue);
        if (this.anomalyMission && this.area === 'orbit') {
            const damage = this.anomalyExposure.step(
                dashFrom,
                this.position,
                dt,
                Math.max(...this.hullConfig.hitbox) * this.hullConfig.size,
            );
            if (damage) this.takeDamage(damage, 'Statek zniszczony przez skażenie anomalii.');
        }
        this.statistics.distance += Math.hypot(
            this.position.x - dashFrom.x,
            this.position.y - dashFrom.y,
        );
        this.queue.drainCollisionEvents((a, b, started) => {
            if (!started) return;
            if (
                this.dashTime > 0 &&
                (a === this.shipCollider.handle || b === this.shipCollider.handle)
            )
                return;
            const ca = this.world.getCollider(a),
                cb = this.world.getCollider(b);
            if (!ca || !cb) return;
            const va = velocities.get(a) ?? { x: 0, y: 0 },
                vb = velocities.get(b) ?? { x: 0, y: 0 };
            const impact = Math.hypot(va.x - vb.x, va.y - vb.y);
            const damage = clamp((impact - 65) * 0.12, 0, 48);
            if (damage <= 0) return;
            let point: Point | undefined;
            this.world.contactPair(ca, cb, (manifold) => {
                if (point || !manifold.numSolverContacts()) return;
                const p = manifold.solverContactPoint(0);
                if (p) point = { x: p.x * P, y: p.y * P };
            });
            point ??= {
                x: ((ca.translation().x + cb.translation().x) * P) / 2,
                y: ((ca.translation().y + cb.translation().y) * P) / 2,
            };
            for (const handle of [a, b]) {
                if (
                    handle === this.shipCollider.handle &&
                    this.dashTime <= 0 &&
                    this.damageCooldown <= 0 &&
                    this.distanceHome >= this.stationSafeRadius
                ) {
                    const hullDamage = this.takeDamage(
                        damage,
                        'Kadłub zniszczony przez zderzenie.',
                        point,
                    );
                    if (hullDamage >= GAME.faultDamage && !this.engineFault) {
                        this.engineFault = true;
                        this.setNotice('Uszkodzone dysze · ciąg napędu spadł do 45%');
                    }
                }
                if (this.escort?.collider.handle === handle && this.escort.cooldown <= 0)
                    this.damageEscort(damage, point);
                if (this.guide?.collider.handle === handle && this.guide.cooldown <= 0)
                    this.damageGuide(damage, point);
                const sentryId = this.sentries.colliders.get(handle);
                const sentry =
                    sentryId === undefined ? undefined : this.sentries.drones.get(sentryId);
                if (
                    sentry &&
                    sentry.impactCooldown <= 0 &&
                    Math.hypot(sentryPosition(sentry).x, sentryPosition(sentry).y) >=
                        this.stationSafeRadius
                ) {
                    sentry.impactCooldown = 0.5;
                    this.damageSentry(sentry.id, damage, point);
                }
                if (
                    this.aegis?.drone?.collider.handle === handle &&
                    this.distanceHome >= this.stationSafeRadius
                )
                    this.damageSupportDrone(damage, point);
                const item = this.salvage.items.get(this.salvage.colliders.get(handle)!);
                if (item && item.cooldown <= 0) {
                    item.cooldown = 0.5;
                    this.damageSalvage(item, damage, point);
                }
                const id = this.enemies.colliders.get(handle),
                    enemy = id === undefined ? undefined : this.enemies.enemies.get(id);
                if (enemy && enemy.impactCooldown <= 0) {
                    enemy.impactCooldown = 0.5;
                    this.damageEnemy(enemy, damage, point, true, true);
                }
            }
        });
        if (this.dashTime > 0) this.damageDash(dashFrom);
        this.enforceShield();
        if (this.harpoonArms) this.updateHarpoon(input, dt);
        else if (this.modules.hull === 'widmo') {
            /* LPM is the phase drive. */
        } else if (this.modules.hull === 'atlas') this.updateAtlas(input, dt);
        else if (this.modules.hull === 'phoenix') {
            this.updateRocketLock(input, dt);
            if (input.mine && this.shotCooldown <= 0 && this.bullets.size < 80) {
                this.launchAtlas('rocket');
                this.shotCooldown = ATLAS_WEAPONS.rocket.interval * this.armament.cooldown;
            }
        } else if (this.modules.hull === 'stinger') {
            if ((input.fire || input.mine) && this.shotCooldown <= 0 && this.bullets.size <= 76)
                this.fireStinger(input.mine ? 'armor' : 'light');
        } else {
            if (this.modules.hull === 'fighter') this.updateGrenades(input, dt);
            if (
                input.fire &&
                this.hullConfig.guns.length &&
                this.shotCooldown <= 0 &&
                this.bullets.size < 80
            )
                this.fire();
        }
        this.updateBullets(dt);
        this.updateBurning(dt);
        if (
            this.modules.hull === 'mule' || this.modules.hull === 'phoenix'
                ? input.fire
                : input.mine
        )
            this.mine(dt);
        this.updateEnemyMines(dt);
        this.syncTow();
        for (const item of [...this.salvage.towing.values()])
            if (Math.hypot(salvagePosition(item).x, salvagePosition(item).y) < GAME.dockRadius)
                this.deliverTow(item);
        this.collectLoot(dt);
        this.updateMagneticRelay(input);

        this.updateSolarExposure(dt);
        this.updateRepair(input, dt);
        this.updateEscort(input, dt);
        this.updateRescueOperation(input, dt);
        if (this.enemyFactory && this.area === 'orbit') {
            const spawned = this.enemyFactory.update(dt, this.position, this.enemies, (point) => {
                let blocked = false;
                this.world.intersectionsWithShape(
                    { x: point.x / P, y: point.y / P },
                    0,
                    new RAPIER.Ball(38 / P),
                    (c) => {
                        if (!c.isSensor()) blocked = true;
                        return !blocked;
                    },
                );
                return blocked || Math.hypot(point.x, point.y) < this.stationSafeRadius + 80;
            });
            if (spawned)
                this.setNotice('Stocznia wypuściła posiłki · 5 wskazuje rdzeń produkcyjny.');
        }
        this.updateRecovery(input, dt);
        this.updateSalvage(input, dt);
        this.updateSurface(input, dt);
        this.updateOrbitalBase(input, dt);
        this.updateFirstBoss(input, dt);
        this.updateLunarDefense(input, dt);
        this.updateScan(input, dt);
        if (
            input.interact &&
            !input.repair &&
            !input.sabotage &&
            !this.thrusting &&
            !input.fire &&
            !input.mine &&
            !this.nearbyCache &&
            !this.nearbyPassage &&
            !this.nearbyConstruction &&
            !this.escort?.startHeld &&
            !(this.escort?.state === 'idle' && this.nearbyEscort)
        )
            this.interact(dt);
        else this.dockProgress = 0;
        const distance = this.area === 'surface' ? moonDistance(this.position) : this.distanceHome;
        const unprotected =
            this.magneticNetwork &&
            !this.hyperdrive.active &&
            !magneticCoverage(this.position, this.activeMagneticRelays);
        if (distance > this.sectorRadius || unprotected) {
            this.statistics.hullDamage += Math.min(this.hull, dt * 10);
            this.hull -= dt * 10;
            if (this.hull <= 0)
                this.deathReason = 'Promieniowanie poza granicą sektora zniszczyło kadłub.';
            this.setNotice(
                this.area === 'surface'
                    ? 'Poza korytarzem lotu · kadłub jest uszkadzany!'
                    : unprotected
                      ? 'Poza osłoną magnetyczną · użyj hipernapędu lub wróć do strefy!'
                      : 'Poza sektorem · promieniowanie uszkadza kadłub!',
            );
        }
        if (this.hull <= 0) {
            this.hull = 0;
            this.ended = 'destroyed';
        }
        if (!this.ended) {
            this.updateOutpost(input, dt);
            this.updateCache(input, dt);
            this.updateStationLogistics(input, dt);
            if (!this.ended && !this.stationLogistics) this.updateRadioReports();
        }
    }
    get nearbyEscort() {
        return (
            !!this.escort &&
            Math.hypot(
                this.escort.position.x - this.position.x,
                this.escort.position.y - this.position.y,
            ) < ESCORT.startRange
        );
    }
    private damageGuide(damage: number, point: Point) {
        const g = this.guide;
        if (!g?.vulnerable) return;
        const before = g.health;
        const destroyed = g.damage(damage, this.stationSafeRadius);
        if (g.health !== before) this.events.push({ ...point, kind: 'hit', strength: damage });
        if (destroyed) {
            this.events.push({ ...g.position, kind: 'explosion', sound: 'destroy', strength: 65 });
            this.guideMessages.push(
                'Sygnał instruktora zanikł. Kontynuuj zadania samodzielnie: 2 złoże, 7 przekaźnik, C dostawa przy stacji. Satuk 15 wyśle zastępcę przy następnym wylocie, jeśli szkolenie nadal trwa.',
            );
        }
    }
    private damageEscort(damage: number, point: Point) {
        if (
            !this.escort?.vulnerable ||
            Math.hypot(this.escort.position.x, this.escort.position.y) < this.stationSafeRadius
        )
            return;
        damage = this.absorbSupport('escort', damage, point);
        if (damage <= 0) return;
        this.events.push({ ...point, kind: 'hit', strength: damage });
        if (this.escort.damage(damage, this.stationSafeRadius)) {
            this.setNotice(`${this.escortName} zniszczony · misja eskorty nie została wykonana.`);
            this.events.push({ ...point, kind: 'break', sound: 'destroy', strength: 40 });
        }
    }
    private updateMiningEscort(dt: number, hostileNear: boolean) {
        const e = this.miningEscort!;
        if (!e.extracting || hostileNear || e.cooldown > 0) return;
        if (e.cargoUsed >= MINING_CONVOY.target) {
            e.returnToStation();
            return;
        }
        const p = e.position;
        const loot = [...this.loot.values()].find(
            (l) =>
                (l.kind === 'ore' ||
                    (l.kind === 'parts' && e.cargoParts < MINING_CONVOY.kitCost.parts * 2)) &&
                l.source === 'asteroid' &&
                Math.hypot(l.x - p.x, l.y - p.y) < MINING_CONVOY.radius &&
                !this.grippers.arms.some((a) => a.targetId === l.id),
        );
        if (loot) {
            this.loot.delete(loot.id);
            if (loot.kind === 'ore') e.cargoOre += loot.amount;
            else e.cargoParts += loot.amount;
            this.events.push({ ...loot, kind: 'collect' });
            if (e.cargoUsed >= MINING_CONVOY.target) {
                e.returnToStation();
                this.setNotice('Muł załadowany. Osłaniaj dostawę do budowy na Księżycu.');
            }
            return;
        }
        const rock = [...this.rocks.values()]
            .filter(
                (r) =>
                    !r.defense &&
                    !r.crystal &&
                    Math.hypot(r.body.translation().x * P - p.x, r.body.translation().y * P - p.y) <
                        MINING_CONVOY.radius,
            )
            .sort((a, b) => a.id - b.id)[0];
        if (!rock) {
            const remaining = [...this.rocks.values()]
                .filter(
                    (r) =>
                        !r.defense &&
                        !r.crystal &&
                        Math.hypot(
                            r.previous.x - MINING_CONVOY.site.x,
                            r.previous.y - MINING_CONVOY.site.y,
                        ) < 1150,
                )
                .sort(
                    (a, b) =>
                        Math.hypot(a.previous.x - p.x, a.previous.y - p.y) -
                        Math.hypot(b.previous.x - p.x, b.previous.y - p.y),
                )[0];
            if (remaining) {
                const rp = remaining.previous;
                const d = Math.hypot(rp.x - p.x, rp.y - p.y) || 1;
                e.resumeMining({
                    x: rp.x + ((p.x - rp.x) / d) * (remaining.radius + 120),
                    y: rp.y + ((p.y - rp.y) / d) * (remaining.radius + 120),
                });
            } else if (e.cargoOre) e.returnToStation();
            else e.fail('złoże wyczerpane');
            return;
        }
        const q = rock.body.translation();
        const angle = Math.atan2(q.y * P - p.y, q.x * P - p.x);
        const error = Math.atan2(
            Math.sin(angle - e.body.rotation()),
            Math.cos(angle - e.body.rotation()),
        );
        e.body.setAngvel(Math.max(-1.5, Math.min(1.5, error * 4)), true);
        if (Math.abs(error) > 0.25) return;
        e.beams.push(...this.supportMiningBeams('mule', p, e.body.rotation(), rock));
        e.beam = e.beams[0] ?? null;
        this.damageRock(rock, MINING_CONVOY.damagePerSecond * dt);
        if (rock.health <= 0) this.breakRock(rock);
    }
    private supportMiningBeams(hull: 'mule' | 'prospector', p: Point, angle: number, rock: Rock) {
        const q = rock.body.translation();
        return HULLS[hull].lasers.map((mount) => {
            const from = mountPosition(p, angle, HULLS[hull].size, mount);
            const dx = q.x * P - from.x,
                dy = q.y * P - from.y;
            const distance = Math.hypot(dx, dy) || 1;
            const reach = Math.max(0, distance - rock.radius * 0.8);
            return {
                from,
                to: { x: from.x + (dx / distance) * reach, y: from.y + (dy / distance) * reach },
            };
        });
    }
    private updateGuideMining(dt: number) {
        const guide = this.guide;
        if (
            !guide ||
            guide.goal.id !== 'mining' ||
            guide.minedOre >= 2 ||
            guide.state !== 'research' ||
            guide.cooldown > 0
        )
            return;
        const p = guide.position;
        const rock = [...this.rocks.values()]
            .filter(
                (r) =>
                    !r.defense &&
                    !r.crystal &&
                    !r.anchored &&
                    Math.hypot(r.previous.x - guide.goal.x, r.previous.y - guide.goal.y) < 900,
            )
            .sort(
                (a, b) =>
                    Math.hypot(a.previous.x - p.x, a.previous.y - p.y) -
                    Math.hypot(b.previous.x - p.x, b.previous.y - p.y),
            )[0];
        if (!rock) return;
        const q = rock.body.translation();
        const distance = Math.hypot(q.x * P - p.x, q.y * P - p.y);
        if (distance - rock.radius > HULLS.prospector.laserRange) {
            const standOff = rock.radius + HULLS.prospector.laserRange * 0.7;
            guide.approachMining({
                x: q.x * P + ((p.x - q.x * P) / distance) * standOff,
                y: q.y * P + ((p.y - q.y * P) / distance) * standOff,
            });
            return;
        }
        const angle = Math.atan2(q.y * P - p.y, q.x * P - p.x);
        const error = Math.atan2(
            Math.sin(angle - guide.body.rotation()),
            Math.cos(angle - guide.body.rotation()),
        );
        guide.body.setAngvel(Math.max(-1.5, Math.min(1.5, error * 4)), true);
        if (Math.abs(error) > 0.25) return;
        guide.beams.push(...this.supportMiningBeams('prospector', p, guide.body.rotation(), rock));
        this.damageRock(rock, GAME.laserDamage * 0.5 * dt);
        if (rock.health <= 0) {
            const units = Math.min(2 - guide.minedOre, Math.ceil(rock.radius / 17));
            this.breakRock(rock, units);
            guide.minedOre += units;
        }
    }
    private updateEscort(input: FlightInput, dt: number) {
        const e = this.escort;
        if (!e || (this.miningEscort && this.area !== 'surface')) return;
        if (!input.interact) e.startHeld = false;
        if (e.state === 'idle') {
            const canStart =
                this.nearbyEscort &&
                input.interact &&
                !this.thrusting &&
                !input.fire &&
                !input.mine &&
                !input.repair &&
                !input.sabotage &&
                this.speed < 60 &&
                this.damageCooldown <= 0 &&
                this.hull > 0;
            e.startProgress = canStart ? e.startProgress + dt : 0;
            if (e.startProgress + 1e-8 >= ESCORT.startSeconds) {
                e.state = 'travel';
                e.startHeld = true;
                e.startProgress = 0;
                this.setNotice(
                    this.miningEscort
                        ? 'Muł: kurs na złoże · trzymaj się w pobliżu.'
                        : 'Kepler: kurs na anomalię · trzymaj się w pobliżu.',
                );
            }
        }
        if (
            !e.ambushed &&
            ['travel', 'waiting', 'research'].includes(e.state) &&
            Math.hypot(
                e.position.x - (this.miningEscort ? MINING_CONVOY.home.x : 0),
                e.position.y - (this.miningEscort ? MINING_CONVOY.home.y : 0),
            ) > (this.miningEscort ? 400 : 1200)
        ) {
            e.ambushed = true;
            const rng = random(this.sector.seed ^ 0x78ad31),
                p = e.position;
            const forward = Math.atan2(e.destination.y - p.y, e.destination.x - p.x);
            for (let i = 0; i < 2; i++)
                for (let attempt = 0; attempt < 100; attempt++) {
                    const angle = forward + (rng() - 0.5) * 1.8,
                        d = 420 + rng() * 180;
                    const point = { x: p.x + Math.cos(angle) * d, y: p.y + Math.sin(angle) * d };
                    if (
                        Math.hypot(point.x, point.y) < 1200 ||
                        [...this.rocks.values()].some(
                            (r) =>
                                Math.hypot(
                                    r.body.translation().x * P - point.x,
                                    r.body.translation().y * P - point.y,
                                ) <
                                r.radius + 60,
                        ) ||
                        [...this.enemies.enemies.values()].some(
                            (enemy) =>
                                Math.hypot(
                                    enemyPosition(enemy).x - point.x,
                                    enemyPosition(enemy).y - point.y,
                                ) < 90,
                        )
                    )
                        continue;
                    this.enemies.add([
                        {
                            ...point,
                            id: 301 + i,
                            kind: 'patrol',
                            home: { ...p },
                            phase: angle + Math.PI,
                        },
                    ]);
                    break;
                }
        }
    }
    private updateOutpost(input: FlightInput, dt: number) {
        const spec = this.sector.outpost;
        const signal = this.recoverySignal;
        const recovering =
            signal &&
            !this.recoverySecured &&
            !this.recoveryDestroyed &&
            Math.hypot(this.position.x - signal.x, this.position.y - signal.y) < RECOVERY.radius;
        const pressed = !!input.interact && !this.terminalInteractHeld;
        const sabotagePressed = !!input.sabotage && !this.terminalSabotageHeld;
        this.terminalInteractHeld = !!input.interact;
        this.terminalSabotageHeld = !!input.sabotage;
        const busy =
            this.thrusting ||
            input.fire ||
            input.mine ||
            input.repair ||
            (input.interact && input.sabotage);
        if (
            this.terminalPuzzle &&
            (busy || !this.terminalConnectionValid(this.terminalPuzzle.mode))
        ) {
            this.terminalAction({ cancel: true });
        }
        if (
            !this.terminalPuzzle &&
            !busy &&
            !recovering &&
            !this.nearbyCache &&
            !this.relayTuning &&
            !this.rescueOperation?.repair
        ) {
            const mode = sabotagePressed ? 'power' : pressed ? 'breach' : null;
            if (mode && this.terminalConnectionValid(mode)) {
                this.terminalPuzzle = new TerminalPuzzle(
                    mode,
                    this.hullId,
                    this.seed ^ 0x713,
                    this.outpost.trace,
                );
                this.setNotice('Terminal połączony · świat nadal działa.');
            }
        }
        if (this.terminalPuzzle?.tick(dt)) {
            this.outpost.trace = 100;
            this.terminalPuzzle = null;
            this.triggerTerminalAlarm();
            this.setNotice('Upłynął czas połączenia · alarm · możesz ponowić po wyciszeniu.');
        }
        const exposed = this.outpost.sees(
            this.position,
            this.elapsed,
            this.opticalCloak ? 0 : 1,
            this.enemies.lineClear(spec, this.position, (collider) =>
                this.asteroidColliders.has(collider.handle),
            ),
        );
        const calm =
            input.interact &&
            !this.thrusting &&
            !input.fire &&
            !input.mine &&
            !input.repair &&
            !input.sabotage &&
            this.speed <= OUTPOST.interactSpeed &&
            this.damageCooldown <= 0;
        const outcome = this.outpost.update(dt, exposed);
        if (outcome.callGuards) this.deployOutpostGuards();
        if (this.outpost.alarm > 0 && this.terminalPuzzle?.mode === 'breach')
            this.terminalAction({ cancel: true });
        if (!this.terminalPuzzle) this.outpost.trace = Math.max(0, this.outpost.trace - dt * 2);
        if (this.outpost.secured && !input.interact) this.outpost.equipmentArmed = true;
        const canSteal =
            !this.campaign.story &&
            this.outpost.secured &&
            this.outpost.equipmentArmed &&
            !this.outpost.equipmentSecured &&
            this.outpost.alarm <= 0 &&
            calm &&
            this.nearbyOutpost &&
            !recovering &&
            !this.nearbyCache &&
            this.equipmentRoom;
        if (canSteal) this.outpost.equipmentProgress += dt;
        else this.outpost.equipmentProgress = 0;
        if (this.outpost.equipmentProgress + 1e-8 >= OUTPOST.equipmentSeconds) {
            this.outpost.equipmentSecured = true;
            this.outpost.equipmentProgress = 0;
            this.setNotice(
                `Sprzęt ${WEAPONS[this.outpostEquipment].name} zabezpieczony · dowieź do Aurory.`,
            );
            this.events.push({ ...spec.terminal, kind: 'collect', rich: true, sound: 'complete' });
        }
    }
    private terminalConnectionValid(mode: 'breach' | 'power') {
        const signal = this.recoverySignal;
        const recovering =
            signal &&
            !this.recoverySecured &&
            !this.recoveryDestroyed &&
            Math.hypot(this.position.x - signal.x, this.position.y - signal.y) < RECOVERY.radius;
        return (
            !this.ended &&
            !this.pendingChoice &&
            !this.transferActive &&
            this.area === 'orbit' &&
            this.hull > 0 &&
            !this.thrusting &&
            this.speed <= OUTPOST.interactSpeed &&
            this.damageCooldown <= 0 &&
            this.nearbyOutpost &&
            !recovering &&
            !this.nearbyCache &&
            (mode === 'breach'
                ? !this.outpost.secured && this.outpost.alarm <= 0
                : !this.outpost.sabotaged && this.cargo.parts >= 1)
        );
    }
    private deployOutpostGuards() {
        const spec = this.sector.outpost;
        this.enemies.add(spec.guards);
        this.enemies.alert(
            spec.guards.map((guard) => guard.id),
            this.position,
        );
        this.setNotice(`Alarm: ${spec.name} · drony ruszyły w pościg.`);
    }
    private triggerTerminalAlarm() {
        if (this.outpost.raiseAlarm()) this.deployOutpostGuards();
    }
    terminalAction(action: TerminalAction) {
        const puzzle = this.terminalPuzzle;
        if (!puzzle) return false;
        if ('cancel' in action || !this.terminalConnectionValid(puzzle.mode)) {
            this.terminalPuzzle = null;
            this.setNotice('Połączenie przerwane · E włamanie / G zasilanie, aby ponowić.');
            return false;
        }
        const outcome = puzzle.act(action);
        this.outpost.trace = puzzle.trace;
        if (outcome === 'alarm') {
            this.terminalPuzzle = null;
            this.triggerTerminalAlarm();
            return false;
        }
        if (outcome !== 'success') return false;
        this.terminalPuzzle = null;
        const spec = this.sector.outpost;
        if (puzzle.mode === 'power') {
            if (!this.outpost.disable()) return false;
            this.cargo.parts--;
            this.setNotice('Zasilanie przekierowane · skaner wyłączony na 20 s.');
        } else {
            this.outpost.secured = true;
            this.surveyData.add('outpost');
            this.addLoot(spec.terminal.x + 18, spec.terminal.y, 'parts', 6);
            this.addLoot(spec.terminal.x - 18, spec.terminal.y, 'ore', 4);
            this.setNotice(`Dane wykradzione · wróć do ${this.stationDestination}.`);
        }
        this.events.push({ ...spec.terminal, kind: 'collect', rich: true, sound: 'complete' });
        if (puzzle.trace >= 100) this.triggerTerminalAlarm();
        return true;
    }
    private updateCache(input: FlightInput, dt: number) {
        const cache = this.nearbyCache;
        if (
            !cache ||
            !input.interact ||
            this.thrusting ||
            input.fire ||
            input.mine ||
            input.repair ||
            input.sabotage ||
            this.speed > CACHE.speed ||
            this.damageCooldown > 0
        ) {
            this.cacheProgress = 0;
            this.cacheTarget = null;
            return;
        }
        if (this.cacheTarget !== cache.id) this.cacheProgress = 0;
        this.cacheTarget = cache.id;
        this.cacheProgress += dt;
        if (this.cacheProgress + 1e-8 >= CACHE.seconds) {
            this.openedCaches.add(cache.id);
            this.choice = {
                cacheId: cache.id,
                offers: prototypeOffers(this.sector.seed, cache.id, this.installed),
            };
            this.cacheProgress = 0;
            this.cacheTarget = null;
            this.events.push({ ...cache, kind: 'collect', rich: true, sound: 'complete' });
        }
    }
    private takeDamage(damage: number, reason: string, point: Point = this.position) {
        if (this.hull <= 0) return 0;
        const incoming = damage;
        damage = this.absorbSupport('player', damage, point);
        const hit = this.kineticShield.absorb(damage);
        this.statistics.shieldDamage += incoming - damage + hit.absorbed;
        this.statistics.hullDamage += Math.min(this.hull, hit.hull);
        if (hit.absorbed) this.events.push({ ...point, kind: 'shield', strength: hit.absorbed });
        this.hull = Math.max(0, this.hull - hit.hull);
        this.deathReason = reason;
        this.damageCooldown = 0.5;
        this.relayTuning = null;
        this.terminalPuzzle = null;
        if (this.rescueOperation) this.rescueOperation.repair = null;
        this.repairProgress = 0;
        this.recoveryProgress = 0;
        this.scanProgress = 0;
        this.cacheProgress = 0;
        this.cacheTarget = null;
        this.outpost.equipmentProgress = 0;
        this.revealTime = 3;
        if (hit.hull) this.events.push({ ...point, kind: 'hit', strength: hit.hull });
        return hit.hull;
    }
    private damageEnemy(
        enemy: Enemy,
        damage: number,
        point: Point,
        interrupt = true,
        environmental = false,
    ) {
        if (enemy.boss)
            damage = Math.min(
                Math.max(0, damage),
                Math.max(0, enemy.health - this.firstBoss.damageFloor),
            );
        const actualDamage = Math.min(Math.max(0, enemy.health), Math.max(0, damage));
        if (environmental) this.statistics.environmentalEnemyDamage += actualDamage;
        else this.statistics.enemyDamage += actualDamage;
        this.events.push({ ...point, kind: 'hit', strength: damage });
        const velocity = enemy.body.linvel(),
            wreckAngle = enemy.body.rotation();
        const wreck = this.enemies.damage(enemy.id, damage, enemy.boss ? false : interrupt);
        if (!wreck) return;
        this.aegis?.hostiles.delete(enemy.id);
        this.clearAtlasTarget(enemy.id);
        this.enemyKills++;
        if (enemy.storyPatrol) this.storyPatrolKills++;
        this.events.push({
            ...wreck,
            sound: 'destroy',
            kind: 'break',
            strength: enemy.config.radius,
            rich: true,
            velocity: { x: velocity.x * P, y: velocity.y * P },
        });
        if (enemy.assault || enemy.factorySpawn) return; // Failed attempts must not farm loot or recoverable hulls.
        if (
            leavesWreck(this.sector.seed, enemy.id) &&
            this.salvage.add(
                this.campaign.nextSalvageId,
                enemy.kind === 'lancer' || enemy.kind === 'heavy' ? 'lancer' : 'patrol',
                wreck,
                { x: velocity.x * P * 0.35, y: velocity.y * P * 0.35 },
                wreckAngle,
            )
        ) {
            const id = this.campaign.nextSalvageId++;
            const item = this.salvage.items.get(id)!;
            this.campaign.worldSalvage.push({
                id,
                seed: this.campaign.activeRun?.seed ?? this.seed,
                ...salvagePosition(item),
                source: enemy.kind === 'lancer' || enemy.kind === 'heavy' ? 'lancer' : 'patrol',
                ...(this.area === 'surface' ? { area: 'surface' as const } : {}),
            });

            this.setNotice('Wrak drona · Z wskaż · E holuj · recykling po powrocie.');
            return;
        }
        this.addLoot(wreck.x - 20, wreck.y, 'ore', enemy.config.oreLoot);
        this.addLoot(wreck.x + 20, wreck.y, 'parts', enemy.config.partsLoot);
        this.setNotice('Dron zniszczony · odzyskaj komponenty i rudę.');
    }
    private damageFactory(damage: number, point: Point) {
        const factory = this.enemyFactory;
        if (!factory || factory.destroyed) return;
        factory.active = true;
        this.events.push({ ...point, kind: 'hit', strength: damage });
        if (factory.damage(damage)) {
            this.surveyData.add('factory');
            this.setNotice(
                'Stocznia zniszczona · produkcja zatrzymana. Wróć z raportem do Satuk 15.',
            );
            this.events.push({
                ...ENEMY_FACTORY.position,
                kind: 'break',
                sound: 'destroy',
                strength: 160,
                rich: true,
            });
        }
    }
    private damageSalvage(item: SalvageBody, damage: number, point: Point) {
        if (Math.hypot(salvagePosition(item).x, salvagePosition(item).y) < this.stationSafeRadius)
            return;
        damage = this.absorbSupport(`salvage:${item.id}`, damage, point);
        if (damage <= 0) return;
        this.events.push({ ...point, kind: 'hit', strength: damage });
        if (item.id === this.rescueOperation?.item.id) {
            this.rescueOperation.repair = null;
            this.rescueOperation.attachProgress = 0;
            item.cooldown = 0.5;
        }
        if (item.source === 'recovery' && damage >= item.health) {
            this.salvage.detach(item);
            item.health = 1;
            item.cooldown = 1;
            if (item.id === this.rescueOperation?.item.id) {
                this.rescueOperation.stabilized = this.rescueOperation.probe;
                this.rescueOperation.repair = null;
                this.campaign.rescueSites[
                    this.rescueOperation.probe ? 'jupiter-recovery' : 'lunar-rescue'
                ] = {
                    ...salvagePosition(item),
                    stabilized: this.rescueOperation.stabilized,
                    health: 1,
                };
            } else {
                this.recoverySecured = false;
                const signal = this.campaign.recoverySignals.find((entry) => entry.id === -item.id);
                if (signal) {
                    Object.assign(signal, salvagePosition(item));
                    if (this.salvage.towing.has(item.id)) {
                        if (this.area === 'surface') signal.area = 'surface';
                        else delete signal.area;
                    }
                }
            }
            this.syncTow();
            this.setNotice(
                'Uszkodzony cel pozostał na planszy. Możesz ponownie zabezpieczyć go i podjąć hol.',
            );
            return;
        }
        const destroyed = this.salvage.damage(item, damage);
        if (!destroyed) return;
        this.campaign.worldSalvage = this.campaign.worldSalvage.filter(
            (entry) => entry.id !== item.id,
        );
        if (item.id === this.rescueOperation?.item.id) {
            this.rescueOperation.repair = null;
            this.setNotice(this.rescueOperation.status);
        } else if (item.source === 'recovery') {
            const signal = this.campaign.recoverySignals.find((entry) => entry.id === -item.id);
            if (signal) Object.assign(signal, point);
            this.recoveryDestroyed = false;
            this.recoverySecured = false;
            this.setNotice(
                'Hol zerwany. Wrak i kapsuła pozostają w sektorze do ponownego podjęcia.',
            );
        } else this.setNotice('Wrak zniszczony · recykling niemożliwy.');
        this.syncTow();
        this.events.push({ ...point, kind: 'break', sound: 'destroy', strength: item.radius });
    }
    private syncTow() {
        const item =
            [...this.salvage.towing.values()].find((held) => held.source === 'recovery') ??
            this.salvage.towed;
        if (!item) {
            this.tow = null;
            return;
        }
        this.tow ??= new TowBody(salvagePosition(item), { x: 0, y: 0 });
        this.tow.previous = { ...item.previous };
        this.tow.previousAngle = item.previousAngle;
        this.tow.position = salvagePosition(item);
        this.tow.angle = item.body.rotation();
        const velocity = item.body.linvel();
        this.tow.velocity = { x: velocity.x * P, y: velocity.y * P };
    }
    private deliverTow(selected?: SalvageBody) {
        if (this.campaign.activeRun?.mission?.aborted) return;
        for (const item of selected ? [selected] : [...this.salvage.towing.values()]) {
            if (item.id === this.rescueOperation?.item.id) {
                this.rescueOperation.delivered = true;
                this.rescueOperation.repair = null;
                this.surveyData.add(this.rescueOperation.siteId);
                const p = salvagePosition(item);
                this.salvage.remove(item);
                this.deliveryRevision++;
                this.setNotice(this.rescueOperation.status);
                this.events.push({ ...p, kind: 'collect', sound: 'complete', rich: true });
                continue;
            }
            const record = deliverSalvage(this.campaign, item.id, item.source);
            if (!record) continue;
            const p = salvagePosition(item);
            if (item.source === 'recovery') this.recoveryDelivered = true;
            this.salvage.remove(item);
            this.deliveryRevision++;
            this.setNotice(`Dostawa: ${record.description}`);
            this.events.push({ ...p, kind: 'collect', sound: 'complete', rich: true });
        }
        this.syncTow();
    }
    private updateSalvage(input: FlightInput, dt: number) {
        const item = this.nearbyWreck;
        const rescuing =
            this.recoverySignal &&
            !this.recoverySecured &&
            !this.recoveryDestroyed &&
            Math.hypot(
                this.position.x - this.recoverySignal.x,
                this.position.y - this.recoverySignal.y,
            ) < RECOVERY.radius;
        if (
            !item ||
            rescuing ||
            !input.interact ||
            this.thrusting ||
            input.fire ||
            input.mine ||
            input.repair ||
            input.sabotage ||
            this.speed > SALVAGE.speed ||
            this.damageCooldown > 0 ||
            this.hull <= 0
        ) {
            this.salvageProgress = 0;
            this.salvageTarget = null;
            return;
        }
        if (this.salvageTarget !== item.id) this.salvageProgress = 0;
        this.salvageTarget = item.id;
        this.salvageProgress += dt;
        if (this.salvageProgress + 1e-8 < this.salvageSeconds) return;
        if (this.salvage.attach(item, this.ship)) {
            this.syncTow();
            this.setNotice(`Wrak na holu · wróć do ${this.stationDestination} · J zwolnij hol.`);
            this.events.push({ ...salvagePosition(item), kind: 'collect', sound: 'complete' });
        }
        this.salvageProgress = 0;
        this.salvageTarget = null;
    }
    private enforceShield() {
        if (this.stationSafeRadius <= 0) return;
        const movers = [...this.rocks.values()].map((rock) => ({
            body: rock.body,
            previous: rock.previous,
            radius: rock.radius,
            rock,
        }));
        for (const enemy of this.enemies.enemies.values()) {
            const p = enemyPosition(enemy),
                boundary = this.stationSafeRadius + enemy.config.radius + 2;
            const entry = shieldEntry(enemy.previous, p, boundary);
            if (Math.hypot(p.x, p.y) < boundary || entry) {
                const source =
                        Math.hypot((entry ?? p).x, (entry ?? p).y) > 1e-6
                            ? (entry ?? p)
                            : { x: 1, y: 0 },
                    length = Math.hypot(source.x, source.y) || 1;
                enemy.body.setTranslation(
                    {
                        x: ((source.x / length) * boundary) / P,
                        y: ((source.y / length) * boundary) / P,
                    },
                    true,
                );
                enemy.body.setLinvel(
                    {
                        x: ((source.x / length) * enemy.config.patrolSpeed) / P,
                        y: ((source.y / length) * enemy.config.patrolSpeed) / P,
                    },
                    true,
                );
                enemy.previous = enemyPosition(enemy);
                enemy.state = 'return';
                enemy.charge = 0;
            }
        }
        for (const mover of movers) {
            const p = mover.body.translation(),
                now = { x: p.x * P, y: p.y * P },
                boundary = this.stationSafeRadius + mover.radius + 2;
            const entry = shieldEntry(mover.previous, now, boundary);
            if (Math.hypot(now.x, now.y) >= boundary && !entry) continue;
            const source =
                    Math.hypot((entry ?? now).x, (entry ?? now).y) > 1e-6
                        ? (entry ?? now)
                        : { x: 1, y: 0 },
                length = Math.hypot(source.x, source.y) || 1,
                n = { x: source.x / length, y: source.y / length };
            const v = mover.body.linvel(),
                inward = v.x * n.x + v.y * n.y;
            mover.body.setTranslation({ x: (n.x * boundary) / P, y: (n.y * boundary) / P }, true);
            if (inward < 0) {
                mover.body.setLinvel(
                    { x: v.x - n.x * inward * 1.55, y: v.y - n.y * inward * 1.55 },
                    true,
                );
                this.events.push({
                    x: n.x * this.stationSafeRadius,
                    y: n.y * this.stationSafeRadius,
                    kind: 'shield',
                    strength: Math.abs(inward) * P * 0.2,
                });
            }
            mover.rock.previous = { x: n.x * boundary, y: n.y * boundary };
        }
    }
    private fireEnemy(enemy: Enemy) {
        if (
            enemy.weaponDisabled ||
            this.bullets.size >= 80 ||
            (enemy.target === 'station'
                ? !this.activeAssault.active || this.activeAssault.health <= 0
                : enemy.target === 'escort'
                  ? !this.escort?.vulnerable ||
                    Math.hypot(this.escort.position.x, this.escort.position.y) <
                        this.stationSafeRadius
                  : enemy.target.startsWith('sentry:')
                    ? !this.sentries.drones.has(Number(enemy.target.slice(7)))
                    : this.opticalCloak ||
                      Math.hypot(this.position.x, this.position.y) < this.stationSafeRadius)
        )
            return false;
        if (enemy.target === 'player') this.aegis?.hostiles.add(enemy.id);
        const p = enemyPosition(enemy),
            a = enemy.body.rotation(),
            v = enemy.body.linvel();
        for (const offset of enemy.boss && this.firstBoss.phase === 3
            ? [-0.3, -0.15, 0, 0.15, 0.3]
            : enemy.boss && this.firstBoss.phase === 2
              ? [-0.18, 0, 0.18]
              : enemy.kind === 'heavy'
                ? [-0.16, 0, 0.16]
                : [0]) {
            if (this.bullets.size >= 80) break;
            const id = ++this.ids,
                shotAngle = a + offset;
            this.addBullet(id, {
                id,
                x: p.x + Math.cos(shotAngle) * (enemy.config.radius + 11),
                y: p.y + Math.sin(shotAngle) * (enemy.config.radius + 11),
                vx: v.x * P + Math.cos(shotAngle) * enemy.config.shotSpeed,
                vy: v.y * P + Math.sin(shotAngle) * enemy.config.shotSpeed,
                life: enemy.config.shotLife,
                team: 'enemy',
                heavy: enemy.kind === 'lancer' || enemy.kind === 'heavy',
                damage: enemy.config.shotDamage,
                shooterId: enemy.id,
            });
        }
        this.events.push({
            ...p,
            kind: 'shot',
            sound: enemy.kind === 'lancer' || enemy.kind === 'heavy' ? 'lancer' : 'enemy',
        });
        return true;
    }
    get relayRequired() {
        return (
            this.campaign.story?.sector === 'earth' &&
            this.area === 'orbit' &&
            this.nearbyScanSite?.siteId === 'relay'
        );
    }
    private get relayConnectionValid() {
        return (
            this.relayRequired &&
            !this.surveyData.has('relay') &&
            !this.ended &&
            !this.thrusting &&
            this.speed <= SCAN.speed &&
            this.hull > 0 &&
            this.damageCooldown <= 0
        );
    }
    relayAction(action: RelayAction) {
        const tuning = this.relayTuning;
        if (!tuning) return false;
        if ('cancel' in action || !this.relayConnectionValid) {
            this.relayTuning = null;
            this.setNotice(
                'Strojenie przerwane. Podejdź do przekaźnika i naciśnij E, aby ponowić.',
            );
            return false;
        }
        if (!tuning.act(action)) return false;
        const site = this.nearbyScanSite!;
        this.relayTuning = null;
        this.completeScan(site);
        return true;
    }
    private completeScan(site: { siteId?: ScanSiteId; name: string; x: number; y: number }) {
        if (!site.siteId || this.surveyData.has(site.siteId)) return;
        this.surveyData.add(site.siteId);
        this.scanProgress = 0;
        this.scanTarget = null;
        this.setNotice(`Dane: ${site.name}. Dostarcz je do ${this.stationDestination}.`);
        this.events.push({ x: site.x, y: site.y, kind: 'collect', rich: true, sound: 'complete' });
    }
    private updateScan(input: FlightInput, dt: number) {
        const site = this.nearbyScanSite;
        const pressed = !!input.interact && !this.relayInteractHeld;
        this.relayInteractHeld = !!input.interact;
        const rescue = this.recoverySignal;
        const recovering =
            rescue &&
            !this.recoverySecured &&
            !this.recoveryDestroyed &&
            Math.hypot(this.position.x - rescue.x, this.position.y - rescue.y) < RECOVERY.radius;
        const invalid =
            !site?.siteId ||
            this.surveyData.has(site.siteId) ||
            (site.siteId === 'fortress' && this.fortressGuardCount > 0) ||
            this.thrusting ||
            input.fire ||
            input.mine ||
            input.repair ||
            input.sabotage ||
            this.speed > SCAN.speed ||
            this.hull <= 0 ||
            this.damageCooldown > 0 ||
            recovering ||
            this.nearbyCache;
        if (this.relayTuning && (invalid || !this.relayRequired))
            this.relayAction({ cancel: true });
        if (this.relayRequired) {
            this.scanProgress = 0;
            this.scanTarget = null;
            if (!invalid && pressed && !this.relayTuning) {
                this.relayTuning = new RelayTuning(this.seed);
                this.setNotice('Strojenie łączności · świat nadal działa.');
            }
            return;
        }
        if (invalid || !input.interact) {
            this.scanProgress = 0;
            this.scanTarget = null;
            return;
        }
        if (this.scanTarget !== site!.siteId) this.scanProgress = 0;
        this.scanTarget = site!.siteId!;
        this.scanProgress += dt;
        if (this.scanProgress + 1e-8 >= SCAN.seconds) this.completeScan(site!);
    }
    private get rescueConnectionValid() {
        const r = this.rescueOperation;
        return (
            !!r &&
            !['destroyed', 'delivered', 'towing'].includes(r.state) &&
            this.area === 'orbit' &&
            !this.ended &&
            !this.thrusting &&
            this.speed < 60 &&
            this.hull > 0 &&
            this.damageCooldown <= 0 &&
            r.item.cooldown <= 0 &&
            Math.hypot(this.position.x - r.position.x, this.position.y - r.position.y) <
                RESCUE_OPERATION.range
        );
    }
    rescueRepairAction(action: RescueRepairAction) {
        const r = this.rescueOperation;
        if (!r?.repair) return false;
        if ('cancel' in action || !this.rescueConnectionValid) {
            r.repair = null;
            this.setNotice('Zabezpieczenie przerwane. Naciśnij E przy promie, aby ponowić.');
            return false;
        }
        if (!r.repair.act(action)) return false;
        r.stabilized = true;
        r.repair = null;
        this.setNotice('Obwody zabezpieczone. Przytrzymaj E przy promie, aby podłączyć hol.');
        return true;
    }
    private updateRescueOperation(input: FlightInput, dt: number) {
        const r = this.rescueOperation;
        if (!r) return;
        const pressed = !!input.interact && !r.interactHeld;
        r.interactHeld = !!input.interact;
        const valid =
            this.rescueConnectionValid &&
            !input.fire &&
            !input.mine &&
            !input.repair &&
            !input.sabotage;
        if (r.repair && !valid) this.rescueRepairAction({ cancel: true });
        if (!valid) {
            r.attachProgress = 0;
            return;
        }
        if (!r.stabilized) {
            if (pressed && !r.repair) r.repair = new RescueRepair(this.seed);
            return;
        }
        if (!input.interact || this.salvage.full) {
            r.attachProgress = 0;
            return;
        }
        r.attachProgress += dt;
        if (r.attachProgress + 1e-8 >= RESCUE_OPERATION.attachSeconds) {
            if (this.salvage.attach(r.item, this.ship)) {
                this.syncTow();
                this.setNotice(r.status);
            }
            r.attachProgress = 0;
        }
    }
    get worldRecoverySignals() {
        return this.campaign.recoverySignals.filter(
            (signal) =>
                signal.seed === this.campaign.activeRun?.seed &&
                (signal.area === 'surface') === (this.area === 'surface'),
        );
    }
    private selectWorldRecovery() {
        if (
            !this.rescueOperation &&
            this.campaign.story?.sector === 'lunar' &&
            !this.campaign.story.claimed.includes('lunar-rescue') &&
            storyTaskAvailable(
                this.campaign.story,
                STORY_TASKS.find((t) => t.id === 'lunar-rescue')!,
            )
        ) {
            this.rescueOperation = new RescueOperation(this.salvage);
            const saved = this.campaign.rescueSites['lunar-rescue'];
            if (saved) {
                this.rescueOperation.item.body.setTranslation(
                    { x: saved.x / P, y: saved.y / P },
                    true,
                );
                this.rescueOperation.stabilized = saved.stabilized;
                this.rescueOperation.item.health = saved.health;
            }
        }

        for (const item of this.salvage.items.values()) {
            const signal =
                item.source === 'recovery'
                    ? this.campaign.recoverySignals.find((entry) => entry.id === -item.id)
                    : this.campaign.worldSalvage.find((entry) => entry.id === item.id);
            if (signal) {
                Object.assign(signal, salvagePosition(item));
                if (this.salvage.towing.has(item.id)) {
                    if (this.area === 'surface') signal.area = 'surface';
                    else delete signal.area;
                }
            }
        }
        const rescue = this.rescueOperation;
        if (rescue && !rescue.delivered)
            this.campaign.rescueSites[rescue.probe ? 'jupiter-recovery' : 'lunar-rescue'] = {
                ...rescue.position,
                stabilized: rescue.stabilized,
                health: rescue.item.health,
            };

        if (this.recoverySecured) {
            const item = this.salvage.items.get(-(this.recoverySignal?.id ?? 0));
            if (item && this.recoverySignal)
                Object.assign(this.recoverySignal, salvagePosition(item));
            if (item && this.salvage.towing.has(item.id) && this.salvage.full) return;
            this.recoverySecured = false;
        }
        const next =
            this.worldRecoverySignals
                .filter((signal) => !this.salvage.towing.has(-signal.id))
                .sort(
                    (a, b) =>
                        Math.hypot(a.x - this.position.x, a.y - this.position.y) -
                        Math.hypot(b.x - this.position.x, b.y - this.position.y),
                )[0] ??
            this.worldRecoverySignals.find((signal) => this.salvage.towing.has(-signal.id)) ??
            null;
        if (next?.id !== this.recoverySignal?.id) {
            this.recoverySignal = next;
            this.recoveryProgress = 0;
            this.recoveryDestroyed = false;
            this.recoveryDelivered = false;
        }
        this.recoverySecured = !!next && this.salvage.towing.has(-next.id);
    }
    private updateRecovery(input: FlightInput, dt: number) {
        const signal = this.recoverySignal;
        if (
            !signal ||
            this.recoverySecured ||
            this.recoveryDestroyed ||
            this.salvage.full ||
            !input.interact ||
            this.thrusting ||
            input.fire ||
            input.mine ||
            input.repair ||
            input.sabotage ||
            this.speed > RECOVERY.speed ||
            this.hull <= 0 ||
            this.damageCooldown > 0 ||
            Math.hypot(this.position.x - signal.x, this.position.y - signal.y) >= RECOVERY.radius
        ) {
            this.recoveryProgress = 0;
            return;
        }
        this.recoveryProgress += dt;
        if (this.recoveryProgress + 1e-8 >= this.recoverySeconds) {
            this.recoverySecured = true;
            this.tow = this.attachTow();
            const item =
                this.salvage.items.get(-signal.id) ??
                this.salvage.add(
                    -signal.id,
                    'recovery',
                    this.tow.position,
                    this.tow.velocity,
                    this.ship.rotation(),
                    !signal.ship,
                );
            if (!item || !this.salvage.attach(item, this.ship)) {
                this.recoverySecured = false;
                this.tow = null;
                this.setNotice('Hol niedostępny.');
                return;
            }
            this.recoveryProgress = 0;
            this.setNotice(
                'Cel podjęty · wróć do bazy. Odzysk jest bezpieczny dopiero po dokowaniu.',
            );
            this.events.push({
                x: signal.x,
                y: signal.y,
                kind: 'collect',
                rich: true,
                sound: 'complete',
            });
        }
    }
    get repairSeconds() {
        return GAME.repairSeconds;
    }
    private supplyRepairKit() {
        this.repairKits++;
        if (this.campaign.activeRun) this.campaign.activeRun.repairKits = this.repairKits;
    }
    private updateRepair(input: FlightInput, dt: number) {
        if (
            !input.repair ||
            this.thrusting ||
            input.fire ||
            input.mine ||
            input.interact ||
            input.sabotage ||
            this.speed > GAME.repairSpeed ||
            this.repairKits <= 0 ||
            this.hull <= 0 ||
            (!this.engineFault && this.hull >= this.maxHull && (!this.aegis || this.aegis.drone))
        ) {
            this.repairProgress = 0;
            return;
        }
        const before = Math.floor(this.repairProgress * 12);
        this.repairProgress += dt;
        if (Math.floor(this.repairProgress * 12) > before) {
            const sites = [
                { x: -18, y: -12 },
                { x: 11, y: 13 },
                { x: -10, y: 14 },
                { x: 18, y: -10 },
            ];
            const point = mountPosition(
                this.position,
                this.ship.rotation(),
                this.hullConfig.size,
                sites[before % sites.length],
            );
            this.events.push({ ...point, kind: 'weld', strength: 3, velocity: this.velocity });
        }
        if (this.repairProgress + 1e-8 >= this.repairSeconds) {
            this.repairKits--;
            this.statistics.repairKitsUsed++;
            if (this.campaign.activeRun) this.campaign.activeRun.repairKits = this.repairKits;
            this.engineFault = false;
            this.repairProgress = 0;
            this.hull = Math.min(this.maxHull, this.hull + GAME.repairHull);
            const rebuilt = this.aegis?.rebuild(this.position);
            this.setNotice(
                rebuilt
                    ? 'Naprawa zakończona · dron odbudowany'
                    : 'Naprawa zakończona · pełny ciąg przywrócony',
            );
            this.events.push({ ...this.position, kind: 'collect', rich: true, sound: 'complete' });
        }
    }
    private attachTow() {
        const p = this.position,
            a = this.ship.rotation();
        return new TowBody(
            { x: p.x - Math.cos(a) * 140, y: p.y - Math.sin(a) * 140 },
            { x: this.velocity.x * 0.4, y: this.velocity.y * 0.4 },
            this.recoverySignal?.ship ? (this.recoverySignal.pilot ? 130 : 85) : 50,
        );
    }
    get isAtlas() {
        return this.modules.hull === 'atlas';
    }
    get hasRocketLauncher() {
        return this.isAtlas || this.modules.hull === 'phoenix';
    }
    get phoenixLaserMultiplier() {
        return this.laserPowerMultiplier * (1 + this.modules.drill * 0.25) * this.armament.power;
    }
    get hullId() {
        return this.modules.hull;
    }
    get grenadeCount() {
        return 1 + this.modules.drill;
    }
    get rocketDamage() {
        return (
            ATLAS_WEAPONS.rocket.damage * (1 + this.modules.handling * 0.25) * this.armament.power
        );
    }
    private clearAtlasTarget(id: number) {
        this.burning.delete(id);
        if (this.atlasLock.target === id) {
            this.atlasLock.target = null;
            this.atlasLock.progress = 0;
        }
        if (this.atlasLock.locked === id) this.atlasLock.locked = null;
        for (const bullet of this.bullets.values())
            if (bullet.targetId === id) delete bullet.targetId;
    }
    private updateRocketLock(input: FlightInput, dt: number) {
        for (const id of [this.atlasLock.target, this.atlasLock.locked])
            if (id !== null && !this.enemies.enemies.has(id)) this.clearAtlasTarget(id);
        const candidate = [...this.enemies.enemies.values()].find((enemy) => {
            const position = enemyPosition(enemy);
            return (
                Math.hypot(position.x - input.target.x, position.y - input.target.y) <=
                    enemy.config.radius + 8 &&
                Math.hypot(position.x - this.position.x, position.y - this.position.y) <=
                    ATLAS_WEAPONS.rocket.speed * ATLAS_WEAPONS.rocket.life
            );
        });
        const target = candidate?.id ?? null;
        if (target !== this.atlasLock.target) {
            this.atlasLock.target = target;
            this.atlasLock.progress = 0;
        }
        this.atlasLock.progress =
            target === null ? 0 : Math.min(ATLAS_WEAPONS.lockTime, this.atlasLock.progress + dt);
        if (target !== null && this.atlasLock.progress >= ATLAS_WEAPONS.lockTime - 1e-8)
            this.atlasLock.locked = target;
    }
    private updateAtlas(input: FlightInput, dt: number) {
        this.updateRocketLock(input, dt);
        if (input.fire && this.shotCooldown <= 0 && this.bullets.size < 80) {
            this.launchAtlas('rocket');
            this.shotCooldown = ATLAS_WEAPONS.rocket.interval * this.armament.cooldown;
        }
        this.updateGrenades(input, dt);
    }
    private updateGrenades(input: FlightInput, dt: number) {
        this.grenadeCooldown -= dt;
        const count = this.grenadeCount;
        if (input.mine && this.grenadeCooldown <= 0 && this.bullets.size + count <= 80) {
            for (let index = 0; index < count; index++)
                this.launchAtlas(
                    'grenade',
                    (index - (count - 1) / 2) * ATLAS_WEAPONS.grenade.spread,
                );
            this.grenadeCooldown = ATLAS_WEAPONS.grenade.interval * this.armament.cooldown;
        }
    }
    private launchAtlas(kind: 'rocket' | 'grenade', offset = 0) {
        const config = ATLAS_WEAPONS[kind];
        const position =
            this.modules.hull === 'atlas' && kind === 'rocket'
                ? mountPosition(
                      this.position,
                      this.ship.rotation(),
                      this.hullConfig.size,
                      ATLAS_WEAPONS.launcher,
                  )
                : this.position;
        const angle = aimAngle(position, this.aimTarget, this.ship.rotation()) + offset;
        const id = ++this.ids;
        const muzzle =
            (this.modules.hull === 'atlas' && kind === 'rocket'
                ? ATLAS_WEAPONS.launcher.length
                : 65) * this.hullConfig.size;
        this.addBullet(id, {
            id,
            x: position.x + Math.cos(angle) * muzzle,
            y: position.y + Math.sin(angle) * muzzle,
            vx: Math.cos(angle) * config.speed,
            vy: Math.sin(angle) * config.speed,
            life: config.life,
            team: 'player',
            explosive: kind,
            damage: kind === 'rocket' ? this.rocketDamage : config.damage * this.armament.power,
            ...(kind === 'rocket' && this.atlasLock.locked !== null
                ? { targetId: this.atlasLock.locked }
                : {}),
        });
        this.events.push({ ...position, kind: 'shot', sound: 'standard' });
    }
    private explodeAtlas(bullet: Projectile, position: Point, source?: number) {
        const config = ATLAS_WEAPONS[bullet.explosive!];
        this.events.push({
            ...position,
            kind: 'explosion',
            strength: config.radius,
            sound: 'destroy',
        });
        const targets: {
            collider: RAPIER.Collider;
            rock?: Rock;
            enemy?: Enemy;
            factory?: boolean;
            mine?: number;
        }[] = [];
        this.world.intersectionsWithShape(
            { x: position.x / P, y: position.y / P },
            0,
            new RAPIER.Ball(config.radius / P),
            (collider) => {
                const rock = this.rocks.get(this.asteroidColliders.get(collider.handle)!);
                const enemy = this.enemies.enemies.get(
                    this.enemies.colliders.get(collider.handle)!,
                );
                const factory = collider.handle === this.enemyFactory?.collider?.handle;
                const mine = this.mines.colliders.get(collider.handle);
                if (rock || enemy || factory || mine !== undefined)
                    targets.push({ collider, rock, enemy, factory, mine });
                return true;
            },
        );
        for (const { collider, rock, enemy, factory, mine } of targets) {
            const center = collider.translation();
            const obstruction = this.world.castRay(
                new RAPIER.Ray(
                    { x: position.x / P, y: position.y / P },
                    { x: center.x - position.x / P, y: center.y - position.y / P },
                ),
                1,
                true,
                undefined,
                undefined,
                collider,
                undefined,
                (other) =>
                    !(other.handle === source && this.asteroidColliders.has(other.handle)) &&
                    this.isObstacle(other),
            );
            if (obstruction) continue;
            if (rock && this.rocks.has(rock.id)) {
                const damage = bullet.damage * this.pilot.mining;
                this.damageRock(rock, damage);
                this.events.push({
                    x: center.x * P,
                    y: center.y * P,
                    kind: 'hit',
                    strength: damage,
                });
                if (rock.health <= 0) this.breakRock(rock);
            }
            if (enemy && this.enemies.enemies.has(enemy.id))
                this.damageEnemy(enemy, bullet.damage, { x: center.x * P, y: center.y * P });
            if (factory) this.damageFactory(bullet.damage, { x: center.x * P, y: center.y * P });
            if (mine !== undefined) this.damageMine(mine, bullet.damage);
        }
    }
    private damageMine(id: number, damage: number) {
        const mine = this.mines.mines.get(id);
        if (!mine) return;
        this.events.push({ ...mine, kind: 'hit', strength: damage });
        if (this.mines.damage(id, damage))
            this.events.push({ ...mine, kind: 'break', strength: ENEMY_MINES.radius });
    }
    private updateEnemyMines(dt: number) {
        const targets: Point[] = this.dashTime > 0 ? [] : [this.position];
        for (const drone of this.sentries.drones.values()) targets.push(sentryPosition(drone));
        if (this.aegis?.dronePosition) targets.push(this.aegis.dronePosition);
        if (this.guide?.vulnerable) targets.push(this.guide.position);
        if (this.escort?.vulnerable && (!this.miningEscort || this.area === 'surface'))
            targets.push(this.escort.position);
        for (const item of this.salvage.items.values()) targets.push(salvagePosition(item));
        if (this.activeAssault.active) targets.push(this.assaultSite);
        this.mines.update(
            dt,
            this.enemies,
            this.stationSafeRadius,
            targets,
            (collider) => this.isObstacle(collider),
            (mine) => this.explodeEnemyMine(mine),
        );
    }
    private explodeEnemyMine(mine: EnemyMine) {
        this.events.push({
            ...mine,
            kind: 'explosion',
            sound: 'destroy',
            strength: ENEMY_MINES.blastRadius,
        });
        const exposed = (point: Point) =>
            Math.hypot(point.x, point.y) >= this.stationSafeRadius &&
            Math.hypot(point.x - mine.x, point.y - mine.y) <= ENEMY_MINES.blastRadius &&
            !shieldEntry(mine, point, this.stationSafeRadius) &&
            this.enemies.lineClear(mine, point, (collider) => this.isObstacle(collider));
        if (this.dashTime <= 0 && exposed(this.position))
            this.takeDamage(ENEMY_MINES.damage, 'Kadłub zniszczony przez minę.', this.position);
        for (const drone of [...this.sentries.drones.values()])
            if (exposed(sentryPosition(drone)))
                this.damageSentry(drone.id, ENEMY_MINES.damage, sentryPosition(drone));
        if (this.aegis?.dronePosition && exposed(this.aegis.dronePosition))
            this.damageSupportDrone(ENEMY_MINES.damage, this.aegis.dronePosition);
        if (this.guide?.vulnerable && exposed(this.guide.position))
            this.damageGuide(ENEMY_MINES.damage, this.guide.position);
        if (
            this.escort?.vulnerable &&
            (!this.miningEscort || this.area === 'surface') &&
            exposed(this.escort.position)
        )
            this.damageEscort(ENEMY_MINES.damage, this.escort.position);
        for (const item of [...this.salvage.items.values()])
            if (exposed(salvagePosition(item)))
                this.damageSalvage(item, ENEMY_MINES.damage, salvagePosition(item));
        if (this.activeAssault.active && exposed(this.assaultSite))
            this.activeAssault.damage(ENEMY_MINES.damage);
    }
    get energyDamage() {
        return (
            AEGIS.damage *
            this.armament.power *
            (1 + this.modules.drill * 0.25) *
            (this.installed.includes('guns') ? 1.35 : 1)
        );
    }
    private absorbSupport(id: string, damage: number, point: Point) {
        const remaining = this.aegis?.absorb(id, damage) ?? damage;
        if (remaining < damage)
            this.events.push({ ...point, kind: 'shield', strength: damage - remaining });
        return remaining;
    }
    private damageSupportDrone(damage: number, point: Point) {
        const support = this.aegis;
        if (!support?.drone) return;
        const remaining = this.absorbSupport('drone', damage, point);
        this.events.push({ ...point, kind: 'hit', strength: remaining });
        if (support.damageDrone(remaining)) {
            this.setNotice('Dron zniszczony · R i zestaw naprawczy odbudują pomocnika');
            this.events.push({
                ...point,
                kind: 'break',
                sound: 'destroy',
                strength: AEGIS.droneRadius,
            });
        }
    }
    private damageSentry(id: number, damage: number, point: Point) {
        const remaining = this.absorbSupport(`sentry:${id}`, damage, point);
        this.events.push({ ...point, kind: 'hit', strength: remaining });
        if (this.sentries.damage(id, remaining)) {
            this.events.push({
                ...point,
                kind: 'break',
                sound: 'destroy',
                strength: STATION_DRONES.radius,
            });
            this.setNotice(
                'Dron strażniczy zniszczony · odbudowa: 2 K + 1 MZ, wolny mechanik w stacji.',
            );
        }
    }
    private fireSentry(drone: StationSentry, target: Enemy) {
        if (this.bullets.size >= 80) return false;
        const position = sentryPosition(drone),
            enemy = enemyPosition(target);
        const angle = Math.atan2(enemy.y - position.y, enemy.x - position.x);
        const id = ++this.ids;
        this.addBullet(id, {
            id,
            x: position.x + Math.cos(angle) * (STATION_DRONES.radius + 4),
            y: position.y + Math.sin(angle) * (STATION_DRONES.radius + 4),
            vx: Math.cos(angle) * 850,
            vy: Math.sin(angle) * 850,
            life: STATION_DRONES.range / 850,
            team: 'player',
            source: 'sentry',
            damage: STATION_DRONES.damage,
        });
        this.events.push({ ...position, kind: 'shot', sound: 'standard' });
        return true;
    }
    private updateAegis(input: FlightInput) {
        const support = this.aegis!;
        if (input.mine && !support.pulsePressed) {
            const allies: (Point & { id: string })[] = [];
            if (support.dronePosition) allies.push({ ...support.dronePosition, id: 'drone' });
            for (const drone of this.sentries.drones.values())
                allies.push({ ...sentryPosition(drone), id: `sentry:${drone.id}` });
            if (this.escort && this.escort.state !== 'destroyed')
                allies.push({ ...this.escort.position, id: 'escort' });
            for (const item of this.salvage.items.values())
                allies.push({ ...salvagePosition(item), id: `salvage:${item.id}` });
            if (support.pulse(this.position, allies)) {
                this.kineticShield.charge = this.kineticShield.profile.capacity;
                this.kineticShield.cooldown = 0;
                this.kineticShield.flash = 0.35;
                this.events.push({
                    ...this.position,
                    kind: 'shield',
                    strength: this.kineticShield.charge,
                });
                this.setNotice('Impuls Aegisa · tarcza odnowiona, sojusznicy osłonięci');
            }
        }
        support.pulsePressed = !!input.mine;
        for (const id of support.hostiles)
            if (!this.enemies.enemies.has(id)) support.hostiles.delete(id);
        const drone = support.drone,
            position = support.dronePosition;
        if (!drone || !position || drone.cooldown > 0 || this.bullets.size >= 80) return;
        const targets = [...support.hostiles]
            .map((id) => this.enemies.enemies.get(id)!)
            .filter(
                (enemy) =>
                    enemy &&
                    Math.hypot(
                        enemyPosition(enemy).x - position.x,
                        enemyPosition(enemy).y - position.y,
                    ) < AEGIS.droneRange,
            )
            .sort(
                (a, b) =>
                    Math.hypot(enemyPosition(a).x - position.x, enemyPosition(a).y - position.y) -
                    Math.hypot(enemyPosition(b).x - position.x, enemyPosition(b).y - position.y),
            );
        const target = targets.find((enemy) => {
            const p = enemyPosition(enemy);
            return !this.world.castRay(
                new RAPIER.Ray(
                    { x: position.x / P, y: position.y / P },
                    { x: (p.x - position.x) / P, y: (p.y - position.y) / P },
                ),
                1,
                true,
                undefined,
                undefined,
                drone.collider,
                undefined,
                (collider) =>
                    (this.dashTime <= 0 && collider.handle === this.shipCollider.handle) ||
                    this.isObstacle(collider),
            );
        });
        if (!target) return;
        const angle = aimAngle(position, enemyPosition(target), this.ship.rotation());
        const id = ++this.ids;
        this.addBullet(id, {
            id,
            x: position.x + Math.cos(angle) * 16,
            y: position.y + Math.sin(angle) * 16,
            vx: Math.cos(angle) * 650,
            vy: Math.sin(angle) * 650,
            life: 1,
            team: 'player',
            source: 'drone',
            damage: support.droneDamage,
        });
        drone.cooldown = AEGIS.droneInterval;
        drone.body.setRotation(angle, true);
        this.events.push({ ...position, kind: 'shot', sound: 'standard' });
    }
    get stingerDamageMultiplier() {
        return (
            (1 + this.modules.drill * 0.25) *
            this.armament.power *
            (this.installed.includes('guns') ? 1.35 : 1)
        );
    }
    private fireStinger(mode: keyof typeof STINGER_AMMO) {
        const ammo = STINGER_AMMO[mode];
        for (const mount of this.hullConfig.guns) {
            const position = mountPosition(
                this.position,
                this.ship.rotation(),
                this.hullConfig.size,
                mount,
            );
            const angle = aimAngle(position, this.aimTarget, this.ship.rotation());
            const id = ++this.ids;
            this.addBullet(id, {
                id,
                x: position.x + Math.cos(angle) * this.weaponConfig.length * this.hullConfig.size,
                y: position.y + Math.sin(angle) * this.weaponConfig.length * this.hullConfig.size,
                vx: this.velocity.x + Math.cos(angle) * ammo.speed,
                vy: this.velocity.y + Math.sin(angle) * ammo.speed,
                life: ammo.life,
                team: 'player',
                heavy: mode === 'armor',
                stingerAmmo: mode,
                damage: ammo.damage * this.stingerDamageMultiplier,
            });
        }
        this.shotCooldown = ammo.interval * this.armament.cooldown;
        this.events.push({
            ...this.position,
            kind: 'shot',
            sound: mode === 'armor' ? 'rail' : 'pulse',
        });
    }
    private fire() {
        if (this.aegis) {
            const position = mountPosition(
                this.position,
                this.ship.rotation(),
                this.hullConfig.size,
                HULLS.aegis.guns[0],
            );
            const angle = aimAngle(position, this.aimTarget, this.ship.rotation());
            const id = ++this.ids;
            this.addBullet(id, {
                id,
                x: position.x + Math.cos(angle) * 24,
                y: position.y + Math.sin(angle) * 24,
                vx: this.velocity.x + Math.cos(angle) * AEGIS.speed,
                vy: this.velocity.y + Math.sin(angle) * AEGIS.speed,
                life: AEGIS.life,
                team: 'player',
                energy: true,
                damage: this.energyDamage,
            });
            this.shotCooldown = AEGIS.interval * this.armament.cooldown;
            this.events.push({ ...position, kind: 'shot', sound: 'pulse' });
            return;
        }
        const p = mountPosition(
                this.position,
                this.ship.rotation(),
                this.hullConfig.size,
                this.hullConfig.guns[this.gunIndex],
            ),
            v = this.velocity,
            a = aimAngle(p, this.aimTarget, this.ship.rotation());
        this.gunIndex = (this.gunIndex + 1) % this.hullConfig.guns.length;
        const id = ++this.ids;
        this.addBullet(id, {
            id,
            x: p.x + Math.cos(a) * this.weaponConfig.length * this.hullConfig.size,
            y: p.y + Math.sin(a) * this.weaponConfig.length * this.hullConfig.size,
            vx: v.x + Math.cos(a) * this.weaponConfig.speed,
            vy: v.y + Math.sin(a) * this.weaponConfig.speed,
            life: this.weaponConfig.life,
            heavy: this.modules.weapon === 'rail',
            team: 'player',
            damage: this.gunDamage,
        });
        this.shotCooldown = this.weaponConfig.interval;
        this.events.push({ ...p, kind: 'shot', sound: this.modules.weapon });
    }
    private updateDash(input: FlightInput, dt: number) {
        if (this.hullId !== 'widmo') return;
        this.dashCooldown = Math.max(0, this.dashCooldown - dt);
        for (const point of this.dashTrail) point.age += dt;
        while (this.dashTrail.length && this.dashTrail[0].age > 0.36) this.dashTrail.shift();
        if (this.dashTime > 0) {
            this.dashTime = Math.max(0, this.dashTime - dt);
            if (this.dashTime === 0) {
                // Do not leave the ship embedded in geometry at the end of a phase.
                let blocked = false;
                this.world.intersectionsWithShape(
                    this.ship.translation(),
                    this.ship.rotation(),
                    this.shipCollider.shape,
                    (collider) => {
                        if (
                            this.isObstacle(collider) ||
                            this.enemies.colliders.has(collider.handle)
                        )
                            blocked = true;
                        return true;
                    },
                    undefined,
                    undefined,
                    this.shipCollider,
                );
                if (blocked) {
                    // Continue the physical sweep until the whole hull clears the obstacle.
                    // Never jump back to an earlier position.
                    this.dashTime = dt;
                } else {
                    this.shipCollider.setSensor(false);
                    this.ship.setLinvel({ x: 0, y: 0 }, true);
                }
            }
        }
        if (input.fire && !this.dashPressed && this.dashCooldown <= 0) {
            this.dashAngle = aimAngle(this.position, input.target, this.ship.rotation());
            this.dashTime = PHASE_DASH.seconds;
            this.dashCooldown =
                (PHASE_DASH.cooldown * this.armament.cooldown) / (1 + this.modules.handling * 0.15);
            this.dashHits.clear();
            this.shipCollider.setSensor(true);
            this.events.push({ ...this.position, kind: 'shield', strength: 50 });
        }
        this.dashPressed = !!input.fire;
        if (this.dashTime > 0) {
            this.ship.setRotation(this.dashAngle, true);
            this.ship.setAngvel(0, true);
            this.ship.setLinvel(
                {
                    x:
                        (Math.cos(this.dashAngle) *
                            PHASE_DASH.speed *
                            this.armament.range *
                            (1 + this.modules.handling * 0.1)) /
                        P,
                    y:
                        (Math.sin(this.dashAngle) *
                            PHASE_DASH.speed *
                            this.armament.range *
                            (1 + this.modules.handling * 0.1)) /
                        P,
                },
                true,
            );
        }
    }
    private damageDash(from: Point) {
        const to = this.position,
            dx = to.x - from.x,
            dy = to.y - from.y;
        const length = Math.hypot(dx, dy);
        this.dashTrail.push({ ...to, angle: this.dashAngle, age: 0 });
        const bladeRadius =
            this.hullConfig.hitbox[1] *
            this.hullConfig.size *
            phaseBladeScale(this.modules.handling);
        const touches = (p: Point, radius: number) => {
            const t = clamp(
                ((p.x - from.x) * dx + (p.y - from.y) * dy) / (length * length || 1),
                0,
                1,
            );
            return Math.hypot(p.x - from.x - t * dx, p.y - from.y - t * dy) <= radius + bladeRadius;
        };
        for (const rock of [...this.rocks.values()]) {
            if (this.dashHits.has(rock.collider.handle)) continue;
            const p = rock.body.translation(),
                point = { x: p.x * P, y: p.y * P };
            if (!touches(point, rock.radius)) continue;
            this.dashHits.add(rock.collider.handle);
            const damage = this.dashDamage * 0.12;
            this.damageRock(rock, damage);
            this.events.push({ ...point, kind: 'hit', strength: damage, rich: rock.rich });
            if (rock.health <= 0) this.breakRock(rock);
        }

        const factory = this.enemyFactory;
        if (
            factory?.collider &&
            !this.dashHits.has(factory.collider.handle) &&
            touches(ENEMY_FACTORY.position, ENEMY_FACTORY.radius)
        ) {
            this.dashHits.add(factory.collider.handle);
            this.damageFactory(this.dashDamage, ENEMY_FACTORY.position);
        }
        for (const enemy of [...this.enemies.enemies.values()]) {
            if (this.dashHits.has(enemy.collider.handle)) continue;
            const p = enemyPosition(enemy);
            if (!touches(p, enemy.config.radius)) continue;
            this.dashHits.add(enemy.collider.handle);
            this.damageEnemy(enemy, this.dashDamage, p);
        }
        for (const mine of [...this.mines.mines.values()])
            if (touches(mine, ENEMY_MINES.radius)) this.damageMine(mine.id, this.dashDamage);
        if (!length) return;
        const ray = new RAPIER.Ray(
            { x: from.x / P, y: from.y / P },
            { x: dx / length, y: dy / length },
        );
        for (const [handle, health] of this.structureHealth) {
            if (this.dashHits.has(handle)) continue;
            const collider = this.world.getCollider(handle);
            if (!collider?.castRayAndGetNormal(ray, (length + 24) / P, true)) continue;
            this.dashHits.add(handle);
            const remaining = health - this.dashDamage;
            this.events.push({ ...to, kind: 'hit', strength: 40 });
            if (remaining > 0) this.structureHealth.set(handle, remaining);
            else {
                const index = [...this.fortressColliders].indexOf(handle);
                this.destroyedFortressWalls.add(index);
                // Keep handles in the set to preserve wall indices for the view.
                this.structureHealth.delete(handle);
                this.world.removeCollider(collider, true);
            }
        }
    }
    private addBullet(id: number, bullet: Projectile) {
        // Check the whole breech-to-muzzle segment, including a muzzle beyond a thin wall.
        if (bullet.team === 'player' && bullet.source !== 'drone') {
            const from = this.position,
                dx = bullet.x - from.x,
                dy = bullet.y - from.y;
            const length = Math.hypot(dx, dy);
            if (
                length > 0 &&
                this.world.castRay(
                    new RAPIER.Ray(
                        { x: from.x / P, y: from.y / P },
                        { x: dx / length, y: dy / length },
                    ),
                    length / P,
                    true,
                    undefined,
                    undefined,
                    this.shipCollider,
                    undefined,
                    (collider) => this.isObstacle(collider),
                )
            )
                return;
        }
        this.bullets.set(id, bullet);
    }
    private updateBullets(dt: number) {
        for (const bullet of this.bullets.values()) {
            if (bullet.explosive === 'rocket' && bullet.targetId !== undefined) {
                const target = this.enemies.enemies.get(bullet.targetId);
                if (!target) delete bullet.targetId;
                else {
                    const position = enemyPosition(target);
                    const current = Math.atan2(bullet.vy, bullet.vx);
                    const desired = Math.atan2(position.y - bullet.y, position.x - bullet.x);
                    const difference = Math.atan2(
                        Math.sin(desired - current),
                        Math.cos(desired - current),
                    );
                    const turn = ATLAS_WEAPONS.rocket.turn * (1 + this.modules.handling * 0.2) * dt;
                    const angle = current + clamp(difference, -turn, turn);
                    bullet.vx = Math.cos(angle) * ATLAS_WEAPONS.rocket.speed;
                    bullet.vy = Math.sin(angle) * ATLAS_WEAPONS.rocket.speed;
                }
            }
            const ray = new RAPIER.Ray(
                { x: bullet.x / P, y: bullet.y / P },
                { x: (bullet.vx * dt) / P, y: (bullet.vy * dt) / P },
            );
            const hit = this.world.castRay(
                ray,
                1,
                true,
                undefined,
                undefined,
                bullet.team === 'player' ? this.shipCollider : undefined,
                undefined,
                (collider) =>
                    this.isObstacle(collider) ||
                    (bullet.team === 'enemy' &&
                        (this.salvage.colliders.has(collider.handle) ||
                            collider.handle === this.stationCollider?.handle ||
                            collider.handle === this.aegis?.drone?.collider.handle ||
                            this.sentries.colliders.has(collider.handle) ||
                            (this.guide?.vulnerable &&
                                collider.handle === this.guide.collider.handle) ||
                            (this.escort?.vulnerable &&
                                collider.handle === this.escort.collider.handle))) ||
                    (bullet.team === 'player'
                        ? this.enemies.colliders.has(collider.handle) ||
                          this.mines.colliders.has(collider.handle)
                        : this.dashTime <= 0 && collider.handle === this.shipCollider.handle),
            );
            const next = { x: bullet.x + bullet.vx * dt, y: bullet.y + bullet.vy * dt };
            const shield =
                this.stationSafeRadius > 0
                    ? shieldEntry(bullet, next, this.stationSafeRadius)
                    : null;
            if (
                shield &&
                (!hit ||
                    Math.hypot(shield.x - bullet.x, shield.y - bullet.y) <=
                        Math.hypot(next.x - bullet.x, next.y - bullet.y) * hit.timeOfImpact)
            ) {
                this.events.push({ ...shield, kind: 'shield', strength: bullet.damage });
                this.bullets.delete(bullet.id);
                continue;
            }
            if (hit) {
                const contact = {
                    x: bullet.x + bullet.vx * dt * hit.timeOfImpact,
                    y: bullet.y + bullet.vy * dt * hit.timeOfImpact,
                };
                if (bullet.explosive) {
                    const speed = Math.max(1, Math.hypot(bullet.vx, bullet.vy));
                    this.explodeAtlas(
                        bullet,
                        {
                            x: contact.x - bullet.vx / speed,
                            y: contact.y - bullet.vy / speed,
                        },
                        hit.collider.handle,
                    );
                    this.bullets.delete(bullet.id);
                    continue;
                }
                if (this.fortressColliders.has(hit.collider.handle))
                    this.events.push({ ...contact, kind: 'hit', strength: bullet.damage });
                if (
                    bullet.team === 'enemy' &&
                    this.stationCollider?.handle === hit.collider.handle
                ) {
                    this.activeAssault.damage(bullet.damage);
                    this.events.push({
                        ...contact,
                        kind: 'hit',
                        strength: bullet.damage,
                        sound: 'hit',
                    });
                }
                if (bullet.team === 'enemy' && this.escort?.collider.handle === hit.collider.handle)
                    this.damageEscort(bullet.damage, contact);
                if (bullet.team === 'enemy' && this.guide?.collider.handle === hit.collider.handle)
                    this.damageGuide(bullet.damage, contact);
                const sentryId = this.sentries.colliders.get(hit.collider.handle);
                if (bullet.team === 'enemy' && sentryId !== undefined)
                    this.damageSentry(sentryId, bullet.damage, contact);
                if (
                    bullet.team === 'enemy' &&
                    this.aegis?.drone?.collider.handle === hit.collider.handle
                )
                    this.damageSupportDrone(bullet.damage, contact);
                const salvage = this.salvage.items.get(
                    this.salvage.colliders.get(hit.collider.handle)!,
                );
                if (salvage && bullet.team === 'enemy')
                    this.damageSalvage(salvage, bullet.damage, contact);
                const rock = this.rocks.get(this.asteroidColliders.get(hit.collider.handle)!);
                const mineId = this.mines.colliders.get(hit.collider.handle);
                if (bullet.team === 'player' && mineId !== undefined) {
                    this.damageMine(mineId, bullet.damage);
                    this.bullets.delete(bullet.id);
                    continue;
                }
                if (
                    hit.collider.handle === this.enemyFactory?.collider?.handle &&
                    bullet.team === 'player'
                ) {
                    this.damageFactory(bullet.damage, contact);
                } else if (rock && bullet.team === 'player' && bullet.source !== 'sentry') {
                    const damage = bullet.energy
                        ? AEGIS.rockDamage * (1 + this.modules.drill * 0.25) * this.pilot.mining
                        : GAME.shotRockDamage;
                    this.damageRock(rock, damage);
                    this.events.push({
                        ...contact,
                        kind: 'hit',
                        rich: rock.rich,
                        strength: damage,
                    });
                    if (rock.health <= 0) this.breakRock(rock);
                } else if (bullet.team === 'player') {
                    const enemyId = this.enemies.colliders.get(hit.collider.handle);
                    if (enemyId !== undefined) {
                        const enemy = this.enemies.enemies.get(enemyId)!;
                        if (bullet.energy) {
                            enemy.weaponDisabled = AEGIS.disable;
                            enemy.charge = 0;
                            this.aegis?.hostiles.add(enemy.id);
                        }
                        const multiplier = bullet.stingerAmmo
                            ? STINGER_AMMO[bullet.stingerAmmo][
                                  enemy.kind === 'lancer' || enemy.kind === 'heavy'
                                      ? 'lancer'
                                      : 'patrol'
                              ]
                            : 1;
                        this.damageEnemy(enemy, bullet.damage * multiplier, contact);
                    }
                } else if (hit.collider.handle === this.shipCollider.handle) {
                    if (bullet.shooterId !== undefined) this.aegis?.hostiles.add(bullet.shooterId);
                    if (this.distanceHome >= this.stationSafeRadius)
                        this.takeDamage(
                            bullet.damage,
                            'Kadłub zniszczony przez ostrzał dronów.',
                            contact,
                        );
                } else if (rock) {
                    this.events.push({ ...contact, kind: 'hit', strength: bullet.damage });
                }
                this.bullets.delete(bullet.id);
            } else {
                bullet.x += bullet.vx * dt;
                bullet.y += bullet.vy * dt;
                bullet.life -= dt;
                if (bullet.life <= 0) {
                    if (bullet.explosive) this.explodeAtlas(bullet, bullet);
                    this.bullets.delete(bullet.id);
                }
            }
        }
    }
    private updateHarpoon(input: FlightInput, dt: number) {
        const arms = this.harpoonArms!;
        const position = this.position,
            angle = this.ship.rotation(),
            size = this.hullConfig.size;
        const local = rotateVector(
            { x: input.target.x - position.x, y: input.target.y - position.y },
            -angle,
        );
        const strike = arms.update(
            dt / this.armament.cooldown,
            { x: local.x / size, y: local.y / size },
            !!input.mine,
            input.fire,
        );
        const contacts = new Map<number, { collider: RAPIER.Collider; point: Point }>();
        arms.poses.forEach((pose, index) => {
            const shoulder = mountPosition(position, angle, size, pose.shoulder);
            let tip = mountPosition(position, angle, size, pose.tip);
            const ray = new RAPIER.Ray(
                { x: shoulder.x / P, y: shoulder.y / P },
                { x: (tip.x - shoulder.x) / P, y: (tip.y - shoulder.y) / P },
            );
            const obstruction = this.world.castRay(
                ray,
                1,
                true,
                undefined,
                undefined,
                this.shipCollider,
                undefined,
                (collider) =>
                    this.isObstacle(collider) ||
                    this.enemies.colliders.has(collider.handle) ||
                    this.mines.colliders.has(collider.handle),
            );
            if (obstruction) {
                tip = {
                    x: shoulder.x + (tip.x - shoulder.x) * obstruction.timeOfImpact,
                    y: shoulder.y + (tip.y - shoulder.y) * obstruction.timeOfImpact,
                };
                const clipped = rotateVector(
                    { x: tip.x - position.x, y: tip.y - position.y },
                    -angle,
                );
                arms.constrainTip(index, { x: clipped.x / size, y: clipped.y / size });
            }
            if (!strike) return;
            if (obstruction && this.fortressColliders.has(obstruction.collider.handle)) {
                this.events.push({ ...tip, kind: 'hit', strength: 8 });
                return;
            }
            this.world.intersectionsWithShape(
                { x: tip.x / P, y: tip.y / P },
                0,
                new RAPIER.Ball((HARPOON_ARMS.jawRadius * size) / P),
                (collider) => {
                    const end = collider.translation();
                    const blocked = this.world.castRay(
                        new RAPIER.Ray(
                            { x: shoulder.x / P, y: shoulder.y / P },
                            { x: end.x - shoulder.x / P, y: end.y - shoulder.y / P },
                        ),
                        1,
                        true,
                        undefined,
                        undefined,
                        this.shipCollider,
                        undefined,
                        (other) => other.handle !== collider.handle && this.isObstacle(other),
                    );
                    if (!blocked) contacts.set(collider.handle, { collider, point: { ...tip } });
                    return true;
                },
                undefined,
                undefined,
                this.shipCollider,
                undefined,
                (collider) =>
                    collider.handle === this.enemyFactory?.collider?.handle ||
                    this.asteroidColliders.has(collider.handle) ||
                    this.enemies.colliders.has(collider.handle) ||
                    this.mines.colliders.has(collider.handle),
            );
        });
        for (const { collider, point } of contacts.values()) {
            const mineId = this.mines.colliders.get(collider.handle);
            if (mineId !== undefined) {
                this.damageMine(
                    mineId,
                    HARPOON_ARMS.shipDamage * arms.damageMultiplier * this.armament.power,
                );
                continue;
            }
            if (collider.handle === this.enemyFactory?.collider?.handle) {
                this.damageFactory(
                    HARPOON_ARMS.shipDamage * arms.damageMultiplier * this.armament.power,
                    point,
                );
                continue;
            }
            const rock = this.rocks.get(this.asteroidColliders.get(collider.handle)!);
            if (rock) {
                const damage =
                    HARPOON_ARMS.rockDamage *
                    arms.damageMultiplier *
                    this.armament.power *
                    this.pilot.mining *
                    this.laserPowerMultiplier;
                this.damageRock(rock, damage, true);
                this.events.push({ ...point, kind: 'hit', strength: damage, rich: rock.rich });
                if (rock.health <= 0) this.breakRock(rock);
            } else {
                const enemy = this.enemies.enemies.get(
                    this.enemies.colliders.get(collider.handle)!,
                );
                if (enemy)
                    this.damageEnemy(
                        enemy,
                        HARPOON_ARMS.shipDamage *
                            arms.damageMultiplier *
                            this.armament.power *
                            (this.installed.includes('guns') ? 1.35 : 1),
                        point,
                    );
            }
        }
    }
    private updateBurning(dt: number) {
        for (const [id, burn] of this.burning) {
            const enemy = this.enemies.enemies.get(id);
            if (!enemy) {
                this.burning.delete(id);
                continue;
            }
            const elapsed = Math.min(dt, burn.remaining);
            burn.remaining = Math.max(0, burn.remaining - elapsed);
            this.damageEnemy(enemy, burn.damage * elapsed, enemyPosition(enemy), false);
            if (burn.remaining <= 1e-8) this.burning.delete(id);
        }
    }
    private mine(dt: number) {
        for (const mount of this.hullConfig.lasers)
            this.mineFrom(
                dt,
                mountPosition(this.position, this.ship.rotation(), this.hullConfig.size, mount),
            );
    }
    private mineFrom(dt: number, from: Point) {
        const a = Math.atan2(this.aimTarget.y - from.y, this.aimTarget.x - from.x);
        const reach = Math.min(
            this.laserRange * this.armament.range,
            Math.hypot(this.aimTarget.x - from.x, this.aimTarget.y - from.y),
        );
        const direction = { x: Math.cos(a), y: Math.sin(a) };
        const hit = this.world.castRay(
            new RAPIER.Ray({ x: from.x / P, y: from.y / P }, direction),
            reach / P,
            true,
            undefined,
            undefined,
            this.shipCollider,
            undefined,
            (collider) =>
                this.isObstacle(collider) ||
                this.enemies.colliders.has(collider.handle) ||
                this.mines.colliders.has(collider.handle),
        );
        const distance = hit ? hit.timeOfImpact * P : reach;
        const to = { x: from.x + direction.x * distance, y: from.y + direction.y * distance };
        this.laserBeam = { from, to };
        this.laserBeams.push({ from, to });
        if (!hit) return;
        const mineId = this.mines.colliders.get(hit.collider.handle);
        if (mineId !== undefined) {
            this.damageMine(mineId, GAME.laserDamage * this.hullConfig.miningPower * dt);
            return;
        }
        if (hit.collider.handle === this.enemyFactory?.collider?.handle) {
            this.damageFactory(
                (this.modules.hull === 'phoenix'
                    ? PHOENIX.laserDamage * this.phoenixLaserMultiplier
                    : GAME.laserShipDamage *
                      this.armament.power *
                      this.laserPowerMultiplier *
                      this.hullConfig.miningPower *
                      (1 + 0.25 * this.modules.drill)) * dt,
                to,
            );
            return;
        }
        const enemy = this.enemies.enemies.get(this.enemies.colliders.get(hit.collider.handle)!);
        if (enemy) {
            if (this.modules.hull === 'phoenix') {
                this.damageEnemy(
                    enemy,
                    PHOENIX.laserDamage * this.phoenixLaserMultiplier * dt,
                    to,
                    false,
                );
                if (this.enemies.enemies.has(enemy.id))
                    this.burning.set(enemy.id, {
                        remaining: PHOENIX.burnSeconds,
                        damage: PHOENIX.burnDamage * this.phoenixLaserMultiplier,
                    });
                return;
            }
            this.damageEnemy(
                enemy,
                GAME.laserShipDamage *
                    this.armament.power *
                    this.laserPowerMultiplier *
                    dt *
                    this.hullConfig.miningPower *
                    this.pilot.mining *
                    (1 + 0.25 * this.modules.drill),
                to,
                false,
            );
            return;
        }
        const rock = this.rocks.get(this.asteroidColliders.get(hit.collider.handle)!);
        if (!rock) return;
        this.damageRock(
            rock,
            (this.modules.hull === 'phoenix' ? PHOENIX.rockDamage : GAME.laserDamage) *
                this.armament.power *
                this.laserPowerMultiplier *
                dt *
                this.hullConfig.miningPower *
                this.pilot.mining *
                (1 + 0.25 * this.modules.drill),
        );
        if (this.laserEffectCooldown <= 0) {
            this.events.push({ ...to, kind: 'hit', rich: rock.rich, strength: 4 });
            this.laserEffectCooldown = 0.12;
        }
        if (rock.health <= 0) this.breakRock(rock);
    }
    private damageRock(rock: Rock, amount: number, harpoon = false) {
        if (rock.mercuryVein && !harpoon) {
            this.setNotice(
                'Spiek odporny na ostrzał · Harpun: PPM wysuń ramiona, LPM wyrwij złoże.',
            );
            return;
        }
        rock.health -= amount;
    }
    private breakRock(rock: Rock, oreLimit?: number) {
        this.statistics.rocksDestroyed++;
        if (this.beltSector && rock.beltBarrier !== undefined) {
            this.clearedBeltRocks.add(rock.beltBarrier);
            this.setNotice(
                `Przeszkoda ${rock.beltBarrier + 1} usunięta. Wróć z raportem do Satuk 15.`,
            );
        }
        const p = rock.body.translation(),
            v = rock.body.linvel();
        const x = p.x * P,
            y = p.y * P;
        this.world.removeRigidBody(rock.body);
        this.rocks.delete(rock.id);
        this.asteroidColliders.delete(rock.collider.handle);
        this.events.push({
            x,
            y,
            kind: 'break',
            rich: rock.rich,
            strength: rock.radius,
            velocity: { x: v.x * P, y: v.y * P },
        });
        if (rock.mercuryVein) {
            this.addLoot(x, y, 'mercuryOre', MERCURY_VEINS.yield, true);
            this.setNotice('Spiek wyrwany · zbierz chwytakami i dostarcz do Satuk 15.');
            return;
        }
        if (oreLimit !== undefined) {
            for (let i = 0; i < oreLimit; i++) this.addLoot(x + i * 12, y, 'ore', 1, true);
            return;
        }
        if (rock.defense) return; // Retry attempts cannot generate an infinite supply of loot.
        if (rock.radius > 44) {
            for (const side of [-1, 1])
                this.addRock({
                    x: x + side * rock.radius * 0.5,
                    y,
                    radius: rock.radius * 0.43,
                    vx: v.x * P + side * 34,
                    vy: v.y * P + (this.rng() - 0.5) * 30,
                    rich: rock.rich,
                    crystal: rock.crystal,
                    copper: rock.copper,
                    orbit: rock.orbit,
                    variant: (rock.variant * 7 + (side > 0 ? 3 : 1)) % 128,
                });
        }
        if (rock.copper && rock.radius <= 44) this.addLoot(x, y, 'copperOre', 1);
        if (rock.crystal && rock.radius <= 44) {
            this.addLoot(x, y, 'crystals', 1);
            this.addLoot(x + 14, y, 'hydrogen', 3);
        }
        const count = Math.ceil(rock.radius / 17);
        for (let i = 0; i < count; i++)
            this.addLoot(
                x + (this.rng() - 0.5) * 50,
                y + (this.rng() - 0.5) * 50,
                rock.rich && i === 0 ? 'parts' : 'ore',
                1,
                true,
            );
    }
    private addLoot(x: number, y: number, kind: Loot['kind'], amount: number, fromRock = false) {
        for (let i = 0; i < amount && this.loot.size < 400; i++) {
            const id = ++this.ids,
                a = i * 2.4,
                r = amount > 1 ? 8 + 5 * i : 0;
            this.loot.set(id, {
                ...(fromRock ? { source: 'asteroid' as const } : {}),
                id,
                x: x + Math.cos(a) * r,
                y: y + Math.sin(a) * r,
                kind,
                amount: 1,
            });
        }
    }
    selectedCargo: ResourceId = 'ore';
    cycleCargo() {
        const available = RESOURCE_IDS.filter((id) => (this.cargo[id] ?? 0) > 0);
        this.selectedCargo =
            available[(available.indexOf(this.selectedCargo) + 1) % available.length] ?? 'ore';
        this.setNotice(`Ładunek: ${RESOURCES[this.selectedCargo].name} · X wyrzuć do 5 szt.`);
    }
    toggleCollection() {
        this.grippers.enabled = !this.grippers.enabled;
        this.setNotice(
            `Autozbieranie ${this.grippers.enabled ? 'włączone' : 'wyłączone'} · O przełącz`,
        );
    }
    jettisonCargo(kind: ResourceId = this.selectedCargo) {
        if (
            this.ended ||
            this.hyperdrive.active ||
            this.transferActive ||
            this.cargoTransferRemaining > 0
        )
            return false;
        const amount = Math.min(5, this.cargo[kind] ?? 0);
        if (!amount || this.loot.size + amount > 400) return false;
        this.cargo[kind] = (this.cargo[kind] ?? 0) - amount;
        // Disable new pickup so ejected ore is not immediately collected again.
        this.grippers.enabled = false;
        const a = this.ship.rotation() + Math.PI;
        this.addLoot(
            this.position.x + Math.cos(a) * 120,
            this.position.y + Math.sin(a) * 120,
            kind,
            amount,
        );
        this.setNotice(
            `Wyrzucono ${amount} ${RESOURCES[kind].short} · autozbieranie wyłączone (O)`,
        );
        return true;
    }
    private collectLoot(dt: number) {
        this.grippers.update(
            dt,
            this.position,
            this.ship.rotation(),
            this.hullConfig.size,
            this.cargoCapacity - this.cargoUsed,
            this.loot,
            (kind) => {
                this.cargo[kind] = (this.cargo[kind] ?? 0) + 1;
                this.events.push({ ...this.position, kind: 'collect', rich: kind === 'parts' });
            },
            (a, b) =>
                this.enemies.lineClear(
                    a,
                    b,
                    (collider) =>
                        this.isObstacle(collider) || this.enemies.colliders.has(collider.handle),
                ),
        );
    }
    private defenseHost: DefenseHost = {
        spawn: (angle, speed) =>
            this.addRock({
                x: MOON.construction.x + Math.cos(angle) * LUNAR_DEFENSE.spawnDistance,
                y: MOON.construction.y + Math.sin(angle) * LUNAR_DEFENSE.spawnDistance,
                vx: -Math.cos(angle) * speed,
                vy: -Math.sin(angle) * speed,
                radius: 23 + this.lunarDefense.wave * 2,
                rich: false,
                variant: this.lunarDefense.wave * 19 + this.lunarDefense.remaining,
                defense: true,
            })?.id,
        rock: (id) => {
            const r = this.rocks.get(id);
            if (!r) return null;
            const p = r.body.translation();
            return { position: { x: p.x * P, y: p.y * P }, previous: r.previous, radius: r.radius };
        },
        remove: (id, impact) => {
            const r = this.rocks.get(id);
            if (!r) return;
            const p = r.body.translation();
            this.world.removeRigidBody(r.body);
            this.rocks.delete(id);
            this.asteroidColliders.delete(r.collider.handle);
            if (impact)
                this.events.push({
                    x: p.x * P,
                    y: p.y * P,
                    kind: 'explosion',
                    strength: 50,
                    sound: 'destroy',
                });
        },
    };
    private firstBossHost: FirstBossHost = {
        spawn: () => {
            const point = { x: this.bossArena.x + 320, y: this.bossArena.y };
            this.enemies.add([
                {
                    ...point,
                    id: this.firstBoss.rules.id,
                    home: { ...this.bossArena },
                    phase: Math.PI,
                    kind: 'lancer',
                    boss: true,
                    finalBoss: this.firstBoss.finale,
                },
            ]);
            this.enemies.alert([this.firstBoss.rules.id], this.position);
        },
        enemy: () => this.enemies.enemies.get(this.firstBoss.rules.id),
        remove: () => {
            this.enemies.remove(this.firstBoss.rules.id);
            this.aegis?.hostiles.delete(this.firstBoss.rules.id);
            this.clearAtlasTarget(this.firstBoss.rules.id);
            for (const [id, bullet] of this.bullets)
                if (bullet.shooterId === this.firstBoss.rules.id) this.bullets.delete(id);
        },
    };
    private updateFirstBoss(input: FlightInput, dt: number) {
        if (!this.firstBossAvailable) return;
        if (!input.sabotage) this.bossArmed = true;
        const ready =
            this.bossArmed &&
            this.nearbyBossArena &&
            !this.firstBoss.active &&
            !this.firstBoss.complete &&
            input.sabotage &&
            !input.interact &&
            !input.fire &&
            !input.mine &&
            !input.repair &&
            !this.thrusting &&
            this.speed < 60 &&
            this.hull > 0 &&
            this.damageCooldown <= 0;
        if (!ready) this.bossStartProgress = 0;
        else if ((this.bossStartProgress += dt) + 1e-8 >= 2 && this.firstBoss.start()) {
            this.bossStartProgress = 0;
            this.bossArmed = false;
            this.setNotice(this.firstBoss.summary);
        }
        if (!this.firstBoss.active) return;
        if (
            this.hull <= 0 ||
            Math.hypot(this.position.x - this.bossArena.x, this.position.y - this.bossArena.y) >
                this.firstBoss.rules.arenaRadius
        ) {
            this.firstBoss.fail(
                this.firstBossHost,
                this.hull <= 0 ? 'Statek utracony' : 'Opuszczono rejon starcia',
            );
            this.bossArmed = false;
            this.setNotice(this.firstBoss.summary);
            return;
        }
        const phase = this.firstBoss.phase;
        const contact = this.firstBossHost.enemy();
        const contactPoint = contact ? enemyPosition(contact) : this.bossArena;
        this.firstBoss.step(dt, this.firstBossHost);
        if (phase !== this.firstBoss.phase)
            this.setNotice(
                `Ciężka jednostka · faza ${this.firstBoss.phase} · uwaga na salwy wachlarzowe`,
            );
        if (this.firstBoss.complete) {
            this.setNotice(this.firstBoss.summary);
            this.events.push({ ...this.bossArena, kind: 'collect', sound: 'complete' });
            if (this.firstBoss.finale)
                this.events.push({
                    ...contactPoint,
                    kind: 'explosion',
                    strength: 52,
                    sound: 'destroy',
                });
        } else if (this.firstBoss.state === 'failed') {
            this.bossArmed = false;
            this.setNotice(this.firstBoss.summary);
        }
    }
    private assaultHost: AssaultHost = {
        spawn: (kind, wave, slot) => {
            const radius = ENEMY_PROFILES[kind].radius;
            const point = assaultEntry(
                this.assaultSite,
                radius,
                this.combatView,
                this.mapCenter,
                this.sectorRadius,
                this.sector.seed * 0.001 + wave * 2.4 + slot * 1.2,
                (p) => {
                    let blocked = Math.hypot(p.x, p.y) < this.stationSafeRadius + radius + 40;
                    this.world.intersectionsWithShape(
                        { x: p.x / P, y: p.y / P },
                        0,
                        new RAPIER.Ball((radius + 30) / P),
                        (c) => {
                            if (!c.isSensor()) blocked = true;
                            return !blocked;
                        },
                    );
                    return blocked;
                },
            );
            if (!point) return undefined;
            const id = ++this.assaultSequence;
            const angle = Math.atan2(point.y - this.assaultSite.y, point.x - this.assaultSite.x);
            this.enemies.add([
                {
                    id,
                    kind,
                    assault: true,
                    ...point,
                    home: { ...this.assaultSite },
                    phase: angle + Math.PI,
                },
            ]);
            this.enemies.alert([id], this.assaultSite);
            return id;
        },
        alive: (id) => this.enemies.enemies.has(id),
        remove: (id) => this.enemies.remove(id),
    };
    private clearAssault() {
        this.mines.removeOwners(this.activeAssault.spawned);
        if (this.stationCollider) {
            this.world.removeCollider(this.stationCollider, true);
            this.stationCollider = null;
        }
        for (const [id, shot] of this.bullets)
            if (shot.shooterId !== undefined && this.activeAssault.spawned.has(shot.shooterId))
                this.bullets.delete(id);
    }
    private updateAssault(input: FlightInput, dt: number) {
        const a = this.activeAssault;
        if (!input.sabotage) this.defenseArmed = true;
        const ready =
            this.assaultAvailable &&
            (this.orbitalBaseSector
                ? this.nearbyOrbitalBase
                : this.area === 'surface' && this.nearbyConstruction) &&
            this.defenseArmed &&
            input.sabotage &&
            !input.interact &&
            !input.fire &&
            !input.mine &&
            !input.repair &&
            !this.thrusting &&
            this.speed < 60 &&
            this.hull > 0 &&
            this.damageCooldown <= 0;
        if (!ready || a.active || a.state === 'complete') this.defenseStartProgress = 0;
        else if ((this.defenseStartProgress += dt) + 1e-8 >= 2 && a.start()) {
            this.defenseStartProgress = 0;
            this.defenseArmed = false;
            this.stationCollider = this.world.createCollider(
                RAPIER.ColliderDesc.ball(130 / P)
                    .setTranslation(this.assaultSite.x / P, this.assaultSite.y / P)
                    .setSensor(true),
            );
            this.setNotice('Nieznane jednostki na podejściu · broń stacji · F wskaż napastnika');
        }
        if (!a.active) return;
        if (
            (!this.orbitalBaseSector && this.area !== 'surface') ||
            this.hull <= 0 ||
            Math.hypot(this.position.x - this.assaultSite.x, this.position.y - this.assaultSite.y) >
                1350
        ) {
            a.fail(this.assaultHost, 'Obrona stacji przerwana');
            this.clearAssault();
            this.setNotice(a.summary);
            return;
        }
        a.step(dt, this.assaultHost);
        if (!a.active) {
            this.clearAssault();
            this.setNotice(a.summary);
        }
    }
    private updateLunarDefense(input: FlightInput, dt: number) {
        if (this.orbitalBaseSector) {
            this.updateAssault(input, dt);
            return;
        }
        if (
            this.assaultAvailable ||
            this.lunarAssault.active ||
            this.lunarAssault.state === 'complete'
        ) {
            this.updateAssault(input, dt);
            return;
        }
        const d = this.lunarDefense;
        if (!input.sabotage) this.defenseArmed = true;
        const starting =
            this.defenseAvailable &&
            this.area === 'surface' &&
            this.nearbyConstruction &&
            !d.active &&
            d.state !== 'complete' &&
            this.defenseArmed &&
            input.sabotage &&
            !input.interact &&
            !input.fire &&
            !input.mine &&
            !input.repair &&
            !this.thrusting &&
            this.speed < 60 &&
            this.hull > 0 &&
            this.damageCooldown <= 0;
        if (!starting) this.defenseStartProgress = 0;
        else {
            this.defenseStartProgress += dt;
            if (this.defenseStartProgress + 1e-8 >= 2 && d.start()) {
                this.defenseStartProgress = 0;
                this.defenseArmed = false;
                this.setNotice(
                    'Obrona rozpoczęta · niszcz oznaczone asteroidy · 3 fale · wyjście przerwie próbę',
                );
            }
        }
        if (!d.active) return;
        if (
            this.area !== 'surface' ||
            this.hull <= 0 ||
            Math.hypot(
                this.position.x - MOON.construction.x,
                this.position.y - MOON.construction.y,
            ) > 1250
        ) {
            d.fail(this.defenseHost, 'Obrona przerwana · dostawy zachowane');
            this.setNotice(d.summary);
            return;
        }
        d.step(dt, this.defenseHost);
        if (d.state === 'complete') {
            const change = recordLunarDefense(this.campaign);
            if (change?.titles.length)
                this.radioMessages.push(
                    'Osłona budowy potwierdzona. Konstrukcja jest bezpieczna; postęp i nagroda zapisane.',
                );
            if (change) {
                this.deliveryRevision++;
                this.setNotice(
                    `Budowa obroniona · postęp zapisany · premia ${change.reward.ore} rudy / ${change.reward.parts} komponentów${change.overflow ? ` · nadwyżka magazynu ${change.overflow}` : ''}`,
                );
                this.events.push({ ...MOON.construction, kind: 'collect', sound: 'complete' });
            }
        } else if (d.state === 'failed') this.setNotice(d.summary);
    }
    private updateOrbitalBase(input: FlightInput, dt: number) {
        const p = this.campaign.story;
        if (
            !this.orbitalBaseSector ||
            !p ||
            p.claimed.includes(this.marsBaseSector ? 'mars-base-build' : 'venus-build')
        )
            return;
        const ready =
            this.nearbyOrbitalBase &&
            this.orbitalBuildReady &&
            input.interact &&
            !input.sabotage &&
            !input.fire &&
            !input.mine &&
            !input.repair &&
            !this.thrusting &&
            this.speed < 60 &&
            this.hull > 0 &&
            this.damageCooldown <= 0;
        if (!ready) {
            this.orbitalBuildProgress = 0;
            return;
        }
        this.orbitalBuildProgress += dt;
        if (this.orbitalBuildProgress + 1e-8 >= 2 && recordOrbitalConstruction(this.campaign)) {
            this.orbitalBuildProgress = 0;
            const site = this.sector.landmarks.find((l) => l.key === (this.marsBaseSector ? 7 : 8));
            if (site) site.name = this.orbitalBaseName;
            this.deliveryRevision++;
            if (this.marsBaseSector) this.enemies.add(marsCorridorFleet(p));
            this.setNotice(
                this.marsBaseSector
                    ? 'Baza zbudowana · postęp zapisany · obroń obiekt i zabezpiecz dalszy korytarz'
                    : 'Placówka zbudowana · postęp zapisany · przygotuj osłonę w stacji i osłoń obiekt przed atakiem',
            );
            this.events.push({ ...this.assaultSite, kind: 'collect', sound: 'complete' });
        }
    }
    private updateSurface(input: FlightInput, dt: number) {
        if (!input.interact) this.passageArmed = true;
        const ready =
            input.interact &&
            !this.thrusting &&
            !input.fire &&
            !input.mine &&
            !input.repair &&
            !input.sabotage &&
            this.speed < 60 &&
            this.damageCooldown <= 0 &&
            this.hull > 0;
        if (
            !this.nearbyPassage ||
            !ready ||
            !this.passageArmed ||
            this.grippers.arms.some((a) => a.held)
        )
            this.passageProgress = 0;
        else {
            this.passageProgress += dt;
            if (this.passageProgress + 1e-8 >= MOON.transferSeconds) {
                const target = this.area === 'orbit' ? MOON.exit : MOON.entrance;
                const dx = target.x - this.position.x,
                    dy = target.y - this.position.y;
                const move = (body: RAPIER.RigidBody) => {
                    const p = body.translation();
                    body.setTranslation({ x: p.x + dx / P, y: p.y + dy / P }, true);
                    body.setLinvel({ x: 0, y: 0 }, true);
                    body.setAngvel(0, true);
                };
                move(this.ship);
                for (const item of this.salvage.towing.values()) {
                    move(item.body);
                    item.previous = salvagePosition(item);
                    item.previousAngle = item.body.rotation();
                }
                if (this.aegis?.drone) move(this.aegis.drone.body);
                this.grippers.clear();
                this.syncTow();
                this.previous = this.position;
                this.dashTrail.length = 0;
                this.area = this.area === 'orbit' ? 'surface' : 'orbit';
                if (this.campaign.activeRun) {
                    if (this.area === 'surface') this.campaign.activeRun.area = 'surface';
                    else delete this.campaign.activeRun.area;
                    this.campaign.activeRun.lastPosition = this.position;
                }
                this.transferRemaining = MOON.arrivalSeconds;
                this.areaRevision++;
                this.deliveryRevision++;
                this.passageArmed = false;
                this.passageProgress = 0;
                this.setNotice(
                    this.area === 'surface'
                        ? 'Powierzchnia Księżyca · 7 budowa · 2 złoże · 5 miedź · 1 orbita'
                        : 'Orbita księżycowa · 1 Satuk 15 · puść E przed kolejnym przejściem',
                );
            }
        }
        if (!this.nearbyConstruction || !ready || this.buildStage >= 2)
            this.constructionProgress = 0;
        else {
            this.constructionProgress += dt;
            if (this.constructionProgress + 1e-8 >= MOON.deliverySeconds) {
                const result = deliverLunarCargo(this.campaign, this.cargo);
                this.constructionProgress = 0;
                if (result) {
                    this.radioMessages.push(
                        `Budowa przyjęła ${result.amount} ${result.resource === 'ore' ? 'Fe' : 'komponentów'}. ${result.change.titles.length ? `Ukończono: ${result.change.titles.join(', ')}.` : 'Dostawa częściowa zapisana.'}`,
                    );
                    this.deliveryRevision++;
                    this.setNotice(
                        `Dostarczono ${result.amount} ${result.resource === 'ore' ? 'rudy' : 'komponentów'} · postęp budowy zapisany`,
                    );
                    this.events.push({ ...this.position, kind: 'collect', sound: 'complete' });
                } else this.setNotice('Brak wymaganych materiałów w ładowni · 2 wskazuje złoże');
            }
        }
    }
    private interact(dt: number) {
        if (this.dockable) {
            if (this.missionReturnBlocked) {
                this.dockProgress = 0;
                this.setNotice('Najpierw wykonaj cel misji · TAB: awaryjne przerwanie');
                return;
            }
            this.dockProgress += dt;
            if (this.dockProgress >= 1.2 && this.hull > 0) {
                this.deliverTow();
                this.ended = 'returned';
            }
        } else {
            this.dockProgress = 0;
            const p = this.position,
                w = this.sector.landmarks.find((l) => l.kind === 'wreck');
            if (w && !this.wreckVisited && Math.hypot(w.x - p.x, w.y - p.y) < 160) {
                this.wreckVisited = true;
                this.addLoot(w.x + 25, w.y, 'parts', 4);
                this.addLoot(w.x - 25, w.y, 'ore', 6);
                this.setNotice('Odzyskano skrzynie z wraku · zbierz ładunek');
            }
        }
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        this.choice = null;
        this.dashHits.clear();
        this.dashTrail.length = 0;
        this.structureHealth.clear();
        this.destroyedFortressWalls.clear();
        this.aegis?.dispose();
        this.mines.clear();
        this.sentries.clear();
        this.escort?.dispose();
        this.guide?.dispose();
        this.salvage.dispose();
        this.enemies.dispose();
        this.queue.free();
        this.world.free();
        this.rocks.clear();
        this.bullets.clear();
        this.burning.clear();
        this.loot.clear();
        this.grippers.clear();
        this.laserBeams.length = 0;
        this.events.length = 0;
    }
}
