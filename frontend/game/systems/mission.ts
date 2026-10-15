import { ARMAMENT_KITS, PHASE_DASH, FORTRESS_WALL_HALF_WIDTH } from '../config';
import { KineticShield, shieldProfile } from './kineticShield';
import { HarpoonArms, HARPOON_ARMS } from './harpoonArms';
import { AegisSupport } from './aegisSupport';
import { ResearchEscort, ESCORT } from './escort';
import { SalvageFleet, SALVAGE, leavesWreck, salvagePosition, type SalvageBody } from './salvage';
import type { SoundCue } from './audioPolicy';
import {
    AEGIS,
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
    id: number;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    radius: number;
    rich: boolean;
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
    source?: 'drone';
    shooterId?: number;
}
export interface Loot extends Point {
    id: number;
    kind: 'ore' | 'parts' | 'crystals';
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
    readonly kineticShield: KineticShield;
    readonly harpoonArms: HarpoonArms | null;
    readonly aegis: AegisSupport | null;
    readonly atlasLock = {
        target: null as number | null,
        progress: 0,
        locked: null as number | null,
    };
    readonly escort: ResearchEscort | null;
    readonly salvage: SalvageFleet;
    salvageProgress = 0;
    salvageTarget: number | null = null;
    recoveryDestroyed = false;
    recoveryDelivered = false;
    deliveryRevision = 0;
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
    deathReason = 'Zniszczony kadłub.';
    readonly pilot;
    readonly cargo: Cargo = { ore: 0, parts: 0 };
    private readonly baseCargoCapacity: number;
    private readonly baseMaxHull: number;
    readonly hullConfig;
    readonly grippers: GripperSystem;
    readonly recoverySignal: RecoverySignal | null;
    recoveryProgress = 0;
    recoverySecured = false;
    readonly surveyData = new Set<ScanSiteId>();
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
        seed: number,
    ) {
        this.sector = generateSector(seed);
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
                (signal) => signal.id === campaign.activeRun?.recoveryId,
            ) ?? null;
        this.rng = random(seed ^ 0xa12d9b);
        this.modules = { ...campaign.ship! };
        this.hullConfig = HULLS[this.modules.hull];
        this.salvage = new SalvageFleet(this.world, this.modules.hull === 'tug' ? 2 : 1);
        this.harpoonArms =
            this.modules.hull === 'harpoon'
                ? new HarpoonArms(this.modules.handling, this.modules.drill)
                : null;
        this.grippers = new GripperSystem(this.hullConfig.grabbers, this.hullConfig.grabberRange);
        this.pilot = pilotProfile(campaign.pilots.find((p) => p.id === campaign.selectedPilot)!);
        this.baseCargoCapacity = capacity(campaign);
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
        for (const rock of this.sector.rocks) {
            const signal = this.recoverySignal;
            // A clear initial approach; moving rocks can still drift into the salvage zone.
            if (!signal || Math.hypot(rock.x - signal.x, rock.y - signal.y) > rock.radius + 180)
                this.addRock(rock);
        }
        this.enemies = new EnemyFleet(this.world, [
            ...this.sector.enemies,
            ...this.sector.fortress.guards,
        ]);
        this.escort =
            campaign.activeRun?.contract === 7
                ? new ResearchEscort(this.world, this.sector.researchSite)
                : null;
        this.previous = this.position;
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
        return (
            this.cargo.ore +
            this.cargo.parts +
            (this.cargo.crystals ?? 0) +
            (this.stolenEquipment ? OUTPOST.equipmentSlots : 0)
        );
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
        const wrecks = [...this.salvage.towing.values()].filter(
            (item) => item.source !== 'recovery',
        );
        if (!wrecks.length) return;
        for (const item of wrecks) this.salvage.detach(item);
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
        return this.sector.landmarks.find(
            (site) => site.siteId && Math.hypot(site.x - p.x, site.y - p.y) < SCAN.radius,
        );
    }
    get context() {
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
        const w = this.sector.landmarks[2],
            p = this.position;
        if (!this.wreckVisited && Math.hypot(w.x - p.x, w.y - p.y) < 160)
            return 'E · przeszukaj wrak';
        if (this.recoveryDelivered)
            return 'Cel ratunkowy przekazany Aurorze · możesz kontynuować wyprawę';
        if (this.recoverySecured) return 'Cel zabezpieczony na holu · wróć do Aurory i zadokuj';
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
    private addRock(spec: RockSpec) {
        if (this.rocks.size >= 600) return;
        const distance = Math.hypot(spec.x, spec.y),
            boundary = DRONES.safeRadius + spec.radius + 2;
        if (distance < boundary) {
            const angle = distance > 0 ? Math.atan2(spec.y, spec.x) : this.rng() * Math.PI * 2;
            spec = { ...spec, x: Math.cos(angle) * boundary, y: Math.sin(angle) * boundary };
        }
        const body = this.world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(spec.x / P, spec.y / P)
                .setLinvel(spec.vx / P, spec.vy / P)
                .setAngvel((this.rng() - 0.5) * 0.18)
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
            id: ++this.ids,
            body,
            collider,
            health: spec.radius * (spec.crystal ? 1.8 : 1.35),
            previous: { x: spec.x, y: spec.y },
            previousAngle: 0,
            previousVelocity: { x: spec.vx, y: spec.vy },
        };
        this.rocks.set(rock.id, rock);
        this.asteroidColliders.set(collider.handle, rock.id);
    }
    setNotice(text: string) {
        this.notice = text;
        this.noticeTime = 3;
    }
    step(input: FlightInput) {
        if (this.ended || this.disposed || this.choice) return;
        const dt = GAME.step;
        this.elapsed += dt;
        this.kineticShield.update(dt, this.distanceHome < GAME.dockRadius);
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
        for (const rock of this.rocks.values()) {
            const p = rock.body.translation();
            rock.previous = { x: p.x * P, y: p.y * P };
            rock.previousAngle = rock.body.rotation();
            const v = rock.body.linvel();
            rock.previousVelocity = { x: v.x * P, y: v.y * P };
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
            (input.brake && !this.reversing) || (!this.thrusting && this.speed > GAME.stopSpeed);
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
            const retained = speed > 0 && nextSpeed * P >= GAME.stopSpeed ? nextSpeed / speed : 0;
            this.ship.applyImpulse(
                { x: velocity.x * (retained - 1) * mass, y: velocity.y * (retained - 1) * mass },
                true,
            );
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
        if (this.escort) {
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
            if (this.escort.update(dt, this.position, obstacles, hostileNear)) {
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
        const beforeImpact = this.velocity;
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
            this.escort?.vulnerable
                ? { position: this.escort.position, velocity: this.escort.velocity }
                : undefined,
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
                    this.distanceHome >= DRONES.safeRadius
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
                if (
                    this.aegis?.drone?.collider.handle === handle &&
                    this.distanceHome >= DRONES.safeRadius
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
                    this.damageEnemy(enemy, damage, point);
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
        this.syncTow();
        for (const item of [...this.salvage.towing.values()])
            if (Math.hypot(salvagePosition(item).x, salvagePosition(item).y) < GAME.dockRadius)
                this.deliverTow(item);
        this.collectLoot(dt);

        this.updateRepair(input, dt);
        this.updateEscort(input, dt);
        this.updateRecovery(input, dt);
        this.updateSalvage(input, dt);
        this.updateScan(input, dt);
        if (
            input.interact &&
            !input.repair &&
            !input.sabotage &&
            !this.thrusting &&
            !input.fire &&
            !input.mine &&
            !this.nearbyCache &&
            !this.escort?.startHeld &&
            !(this.escort?.state === 'idle' && this.nearbyEscort)
        )
            this.interact(dt);
        else this.dockProgress = 0;
        const distance = this.distanceHome;
        if (distance > GAME.sectorRadius) {
            this.hull -= dt * 10;
            if (this.hull <= 0)
                this.deathReason = 'Promieniowanie poza granicą sektora zniszczyło kadłub.';
            this.setNotice('Poza sektorem · promieniowanie uszkadza kadłub!');
        }
        if (this.hull <= 0) {
            this.hull = 0;
            this.ended = 'destroyed';
        }
        if (!this.ended) {
            this.updateOutpost(input, dt);
            this.updateCache(input, dt);
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
    private damageEscort(damage: number, point: Point) {
        if (
            !this.escort?.vulnerable ||
            Math.hypot(this.escort.position.x, this.escort.position.y) < DRONES.safeRadius
        )
            return;
        damage = this.absorbSupport('escort', damage, point);
        if (damage <= 0) return;
        this.events.push({ ...point, kind: 'hit', strength: damage });
        if (this.escort.damage(damage)) {
            this.setNotice('Kepler zniszczony · kontrakt eskorty nie został wykonany.');
            this.events.push({ ...point, kind: 'break', sound: 'destroy', strength: 40 });
        }
    }
    private updateEscort(input: FlightInput, dt: number) {
        const e = this.escort;
        if (!e) return;
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
                this.setNotice('Kepler: kurs na anomalię · trzymaj się w pobliżu.');
            }
        }
        if (
            !e.ambushed &&
            ['travel', 'waiting', 'research'].includes(e.state) &&
            Math.hypot(e.position.x, e.position.y) > 1200
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
        const canSabotage =
            input.sabotage &&
            !input.interact &&
            !input.repair &&
            !input.fire &&
            !input.mine &&
            !this.thrusting &&
            this.speed <= OUTPOST.interactSpeed &&
            this.damageCooldown <= 0 &&
            this.nearbyOutpost &&
            !recovering &&
            !this.nearbyCache &&
            !this.outpost.sabotaged &&
            this.cargo.parts >= 1;
        if (canSabotage) this.outpost.sabotageProgress += dt;
        else this.outpost.sabotageProgress = 0;
        if (this.outpost.sabotageProgress + 1e-8 >= OUTPOST.sabotageSeconds) {
            if (this.outpost.disable()) {
                this.cargo.parts--;
                this.setNotice('Skaner wyłączony na 20 s · drony nadal mogą ścigać statek.');
                this.events.push({
                    ...spec.terminal,
                    kind: 'collect',
                    rich: true,
                    sound: 'complete',
                });
            }
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
        const outcome = this.outpost.update(
            dt,
            exposed,
            !!(this.nearbyOutpost && calm && !recovering && !this.nearbyCache),
        );
        if (outcome.callGuards) {
            this.enemies.add(spec.guards);
            this.enemies.alert(
                spec.guards.map((guard) => guard.id),
                this.position,
            );
            this.setNotice('Alarm Cerbera · terminal zablokowany, drony ruszyły w pościg.');
        }
        if (this.outpost.secured && !input.interact) this.outpost.equipmentArmed = true;
        const canSteal =
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
        if (outcome.completed) {
            this.surveyData.add('outpost');
            this.addLoot(spec.terminal.x + 18, spec.terminal.y, 'parts', 6);
            this.addLoot(spec.terminal.x - 18, spec.terminal.y, 'ore', 4);
            this.setNotice('Dane wykradzione · chwytaki mogą zabrać skrzynie. Wróć do Aurory.');
            this.events.push({ ...spec.terminal, kind: 'collect', rich: true, sound: 'complete' });
        }
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
        damage = this.absorbSupport('player', damage, point);
        const hit = this.kineticShield.absorb(damage);
        if (hit.absorbed) this.events.push({ ...point, kind: 'shield', strength: hit.absorbed });
        this.hull = Math.max(0, this.hull - hit.hull);
        this.deathReason = reason;
        this.damageCooldown = 0.5;
        this.repairProgress = 0;
        this.recoveryProgress = 0;
        this.scanProgress = 0;
        this.cacheProgress = 0;
        this.cacheTarget = null;
        this.outpost.download = 0;
        this.outpost.equipmentProgress = 0;
        this.outpost.sabotageProgress = 0;
        this.revealTime = 3;
        if (hit.hull) this.events.push({ ...point, kind: 'hit', strength: hit.hull });
        return hit.hull;
    }
    private damageEnemy(enemy: Enemy, damage: number, point: Point, interrupt = true) {
        this.events.push({ ...point, kind: 'hit', strength: damage });
        const velocity = enemy.body.linvel(),
            wreckAngle = enemy.body.rotation();
        const wreck = this.enemies.damage(enemy.id, damage, interrupt);
        if (!wreck) return;
        this.aegis?.hostiles.delete(enemy.id);
        this.clearAtlasTarget(enemy.id);
        this.enemyKills++;
        this.events.push({
            ...wreck,
            sound: 'destroy',
            kind: 'break',
            strength: enemy.config.radius,
            rich: true,
            velocity: { x: velocity.x * P, y: velocity.y * P },
        });
        if (
            leavesWreck(this.sector.seed, enemy.id) &&
            this.salvage.add(
                enemy.id,
                enemy.kind,
                wreck,
                { x: velocity.x * P * 0.35, y: velocity.y * P * 0.35 },
                wreckAngle,
            )
        ) {
            this.setNotice('Wrak drona · Z wskaż · E holuj · recykling po powrocie.');
            return;
        }
        this.addLoot(wreck.x - 20, wreck.y, 'ore', enemy.config.oreLoot);
        this.addLoot(wreck.x + 20, wreck.y, 'parts', enemy.config.partsLoot);
        this.setNotice('Dron zniszczony · odzyskaj komponenty i rudę.');
    }
    private damageSalvage(item: SalvageBody, damage: number, point: Point) {
        if (Math.hypot(salvagePosition(item).x, salvagePosition(item).y) < DRONES.safeRadius)
            return;
        damage = this.absorbSupport(`salvage:${item.id}`, damage, point);
        if (damage <= 0) return;
        this.events.push({ ...point, kind: 'hit', strength: damage });
        const destroyed = this.salvage.damage(item, damage);
        if (!destroyed) return;
        if (item.source === 'recovery') {
            this.recoveryDestroyed = true;
            this.recoverySecured = false;
            this.setNotice('Cel ratunkowy zniszczony · wrak i kapsuła zostały utracone.');
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
        for (const item of selected ? [selected] : [...this.salvage.towing.values()]) {
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
            this.setNotice('Wrak na holu · wróć do Aurory · J zwolnij hol.');
            this.events.push({ ...salvagePosition(item), kind: 'collect', sound: 'complete' });
        }
        this.salvageProgress = 0;
        this.salvageTarget = null;
    }
    private enforceShield() {
        const movers = [...this.rocks.values()].map((rock) => ({
            body: rock.body,
            previous: rock.previous,
            radius: rock.radius,
            rock,
        }));
        for (const enemy of this.enemies.enemies.values()) {
            const p = enemyPosition(enemy),
                boundary = DRONES.safeRadius + enemy.config.radius + 2;
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
                boundary = DRONES.safeRadius + mover.radius + 2;
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
                    x: n.x * DRONES.safeRadius,
                    y: n.y * DRONES.safeRadius,
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
            (enemy.target === 'escort'
                ? !this.escort?.vulnerable ||
                  Math.hypot(this.escort.position.x, this.escort.position.y) < DRONES.safeRadius
                : this.opticalCloak ||
                  Math.hypot(this.position.x, this.position.y) < DRONES.safeRadius)
        )
            return false;
        if (enemy.target === 'player') this.aegis?.hostiles.add(enemy.id);
        const p = enemyPosition(enemy),
            a = enemy.body.rotation(),
            v = enemy.body.linvel(),
            id = ++this.ids;
        this.addBullet(id, {
            id,
            x: p.x + Math.cos(a) * (enemy.config.radius + 11),
            y: p.y + Math.sin(a) * (enemy.config.radius + 11),
            vx: v.x * P + Math.cos(a) * enemy.config.shotSpeed,
            vy: v.y * P + Math.sin(a) * enemy.config.shotSpeed,
            life: enemy.config.shotLife,
            team: 'enemy',
            heavy: enemy.kind === 'lancer',
            damage: enemy.config.shotDamage,
            shooterId: enemy.id,
        });
        this.events.push({
            ...p,
            kind: 'shot',
            sound: enemy.kind === 'lancer' ? 'lancer' : 'enemy',
        });
        return true;
    }
    private updateScan(input: FlightInput, dt: number) {
        const site = this.nearbyScanSite;
        const rescue = this.recoverySignal;
        const recovering =
            rescue &&
            !this.recoverySecured &&
            !this.recoveryDestroyed &&
            Math.hypot(this.position.x - rescue.x, this.position.y - rescue.y) < RECOVERY.radius;
        if (
            !site?.siteId ||
            this.surveyData.has(site.siteId) ||
            (site.siteId === 'fortress' && this.fortressGuardCount > 0) ||
            !input.interact ||
            this.thrusting ||
            input.fire ||
            input.mine ||
            input.repair ||
            input.sabotage ||
            this.speed > SCAN.speed ||
            this.hull <= 0 ||
            this.damageCooldown > 0 ||
            recovering ||
            this.nearbyCache
        ) {
            this.scanProgress = 0;
            this.scanTarget = null;
            return;
        }
        if (this.scanTarget !== site.siteId) this.scanProgress = 0;
        this.scanTarget = site.siteId;
        this.scanProgress += dt;
        if (this.scanProgress + 1e-8 >= SCAN.seconds) {
            this.surveyData.add(site.siteId);
            this.scanProgress = 0;
            this.scanTarget = null;
            this.setNotice(`Dane: ${site.name}. Dostarcz je do Aurory, aby rozliczyć kontrakt.`);
            this.events.push({
                x: site.x,
                y: site.y,
                kind: 'collect',
                rich: true,
                sound: 'complete',
            });
        }
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
            const item = this.salvage.add(
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
        const targets: { collider: RAPIER.Collider; rock?: Rock; enemy?: Enemy }[] = [];
        this.world.intersectionsWithShape(
            { x: position.x / P, y: position.y / P },
            0,
            new RAPIER.Ball(config.radius / P),
            (collider) => {
                const rock = this.rocks.get(this.asteroidColliders.get(collider.handle)!);
                const enemy = this.enemies.enemies.get(
                    this.enemies.colliders.get(collider.handle)!,
                );
                if (rock || enemy) targets.push({ collider, rock, enemy });
                return true;
            },
        );
        for (const { collider, rock, enemy } of targets) {
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
                rock.health -= damage;
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
        }
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
    private updateAegis(input: FlightInput) {
        const support = this.aegis!;
        if (input.mine && !support.pulsePressed) {
            const allies: (Point & { id: string })[] = [];
            if (support.dronePosition) allies.push({ ...support.dronePosition, id: 'drone' });
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
        const bladeRadius = this.hullConfig.hitbox[1] * this.hullConfig.size;
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
            rock.health -= damage;
            this.events.push({ ...point, kind: 'hit', strength: damage, rich: rock.rich });
            if (rock.health <= 0) this.breakRock(rock);
        }

        for (const enemy of [...this.enemies.enemies.values()]) {
            if (this.dashHits.has(enemy.collider.handle)) continue;
            const p = enemyPosition(enemy);
            if (!touches(p, enemy.config.radius)) continue;
            this.dashHits.add(enemy.collider.handle);
            this.damageEnemy(enemy, this.dashDamage, p);
        }
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
                            collider.handle === this.aegis?.drone?.collider.handle ||
                            (this.escort?.vulnerable &&
                                collider.handle === this.escort.collider.handle))) ||
                    (bullet.team === 'player'
                        ? this.enemies.colliders.has(collider.handle)
                        : this.dashTime <= 0 && collider.handle === this.shipCollider.handle),
            );
            const next = { x: bullet.x + bullet.vx * dt, y: bullet.y + bullet.vy * dt };
            const shield = shieldEntry(bullet, next, DRONES.safeRadius);
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
                if (bullet.team === 'enemy' && this.escort?.collider.handle === hit.collider.handle)
                    this.damageEscort(bullet.damage, contact);
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
                if (rock && bullet.team === 'player') {
                    const damage = bullet.energy
                        ? AEGIS.rockDamage * (1 + this.modules.drill * 0.25) * this.pilot.mining
                        : GAME.shotRockDamage;
                    rock.health -= damage;
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
                            ? STINGER_AMMO[bullet.stingerAmmo][enemy.kind]
                            : 1;
                        this.damageEnemy(enemy, bullet.damage * multiplier, contact);
                    }
                } else if (hit.collider.handle === this.shipCollider.handle) {
                    if (bullet.shooterId !== undefined) this.aegis?.hostiles.add(bullet.shooterId);
                    if (this.distanceHome >= DRONES.safeRadius)
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
                    this.isObstacle(collider) || this.enemies.colliders.has(collider.handle),
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
                    this.asteroidColliders.has(collider.handle) ||
                    this.enemies.colliders.has(collider.handle),
            );
        });
        for (const { collider, point } of contacts.values()) {
            const rock = this.rocks.get(this.asteroidColliders.get(collider.handle)!);
            if (rock) {
                const damage =
                    HARPOON_ARMS.rockDamage *
                    arms.damageMultiplier *
                    this.armament.power *
                    this.pilot.mining *
                    this.laserPowerMultiplier;
                rock.health -= damage;
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
        const a = aimAngle(from, this.aimTarget, this.ship.rotation());
        const direction = { x: Math.cos(a), y: Math.sin(a) };
        const hit = this.world.castRay(
            new RAPIER.Ray({ x: from.x / P, y: from.y / P }, direction),
            (this.laserRange * this.armament.range) / P,
            true,
            undefined,
            undefined,
            this.shipCollider,
            undefined,
            (collider) => this.isObstacle(collider) || this.enemies.colliders.has(collider.handle),
        );
        const distance = hit ? hit.timeOfImpact * P : this.laserRange * this.armament.range;
        const to = { x: from.x + direction.x * distance, y: from.y + direction.y * distance };
        this.laserBeam = { from, to };
        this.laserBeams.push({ from, to });
        if (!hit) return;
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
        rock.health -=
            (this.modules.hull === 'phoenix' ? PHOENIX.rockDamage : GAME.laserDamage) *
            this.armament.power *
            this.laserPowerMultiplier *
            dt *
            this.hullConfig.miningPower *
            this.pilot.mining *
            (1 + 0.25 * this.modules.drill);
        if (this.laserEffectCooldown <= 0) {
            this.events.push({ ...to, kind: 'hit', rich: rock.rich, strength: 4 });
            this.laserEffectCooldown = 0.12;
        }
        if (rock.health <= 0) this.breakRock(rock);
    }
    private breakRock(rock: Rock) {
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
                    orbit: rock.orbit,
                    variant: (rock.variant * 7 + (side > 0 ? 3 : 1)) % 128,
                });
        }
        if (rock.crystal && rock.radius <= 44) this.addLoot(x, y, 'crystals', 1);
        const count = Math.ceil(rock.radius / 17);
        for (let i = 0; i < count; i++)
            this.addLoot(
                x + (this.rng() - 0.5) * 50,
                y + (this.rng() - 0.5) * 50,
                rock.rich && i === 0 ? 'parts' : 'ore',
                1,
            );
    }
    private addLoot(x: number, y: number, kind: Loot['kind'], amount: number) {
        for (let i = 0; i < amount && this.loot.size < 400; i++) {
            const id = ++this.ids,
                a = i * 2.4,
                r = amount > 1 ? 8 + 5 * i : 0;
            this.loot.set(id, {
                id,
                x: x + Math.cos(a) * r,
                y: y + Math.sin(a) * r,
                kind,
                amount: 1,
            });
        }
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
    private interact(dt: number) {
        if (this.dockable) {
            this.dockProgress += dt;
            if (this.dockProgress >= 1.2 && this.hull > 0) {
                this.deliverTow();
                this.ended = 'returned';
            }
        } else {
            this.dockProgress = 0;
            const p = this.position,
                w = this.sector.landmarks[2];
            if (!this.wreckVisited && Math.hypot(w.x - p.x, w.y - p.y) < 160) {
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
        this.escort?.dispose();
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
