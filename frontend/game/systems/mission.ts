import RAPIER from '@dimforge/rapier2d-compat';
import { DRONES, GAME, HULLS, OUTPOST, RECOVERY, SCAN, ScanSiteId } from '../config';
import { Campaign, Cargo, capacity, shipHealth } from '../state/campaign';
import { generateSector, Point, random, RockSpec } from '../worlds/sector';
import { RecoverySignal } from '../state/recovery';
import { pilotProfile } from '../state/pilots';
import { Enemy, EnemyFleet, enemyPosition } from './enemies';
import { aimAngle, mountPosition } from './flight';
import { TowBody } from './tow';
import { GripperSystem } from './grippers';
import { OutpostSecurity } from './outpost';
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
    damage: number;
}
export interface Loot extends Point {
    id: number;
    kind: 'ore' | 'parts';
    amount: number;
}
export interface MissionEvent extends Point {
    kind: 'break' | 'hit' | 'collect' | 'shot';
    rich?: boolean;
}
const P = GAME.pixelsPerMeter;
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));

export class MissionSimulation {
    readonly sector;
    readonly world = new RAPIER.World({ x: 0, y: 0 });
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
    cloakEnabled = false;
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
    private laserEffectCooldown = 0;
    private gunIndex = 0;
    private damageCooldown = 0;
    private rng;
    private asteroidColliders = new Map<number, number>();
    private modules;
    private disposed = false;

    constructor(campaign: Campaign, seed: number) {
        this.sector = generateSector(seed);
        this.outpost = new OutpostSecurity(this.sector.outpost);
        this.outpostCollider = this.world.createCollider(
            RAPIER.ColliderDesc.ball(OUTPOST.radius / P)
                .setTranslation(this.sector.outpost.x / P, this.sector.outpost.y / P)
                .setRestitution(0.25)
                .setFriction(0.1),
        );
        this.recoverySignal =
            campaign.recoverySignals.find(
                (signal) => signal.id === campaign.activeRun?.recoveryId,
            ) ?? null;
        this.rng = random(seed ^ 0xa12d9b);
        this.modules = { ...campaign.ship! };
        this.hullConfig = HULLS[this.modules.hull];
        this.grippers = new GripperSystem(this.hullConfig.grabbers, this.hullConfig.grabberRange);
        this.pilot = pilotProfile(campaign.pilots.find((p) => p.id === campaign.selectedPilot)!);
        this.baseCargoCapacity = capacity(campaign);
        this.baseMaxHull = shipHealth(campaign.ship!);
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
                .setDensity(5)
                .setRestitution(0.35)
                .setFriction(0.1)
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
            this.ship,
        );
        for (const rock of this.sector.rocks) {
            const signal = this.recoverySignal;
            // A clear initial approach; moving rocks can still drift into the salvage zone.
            if (!signal || Math.hypot(rock.x - signal.x, rock.y - signal.y) > rock.radius + 180)
                this.addRock(rock);
        }
        this.enemies = new EnemyFleet(this.world, this.sector.enemies);
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
    get cargoUsed() {
        return this.cargo.ore + this.cargo.parts;
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
    get gunDamage() {
        return GAME.shotDamage * (this.installed.includes('guns') ? 1.35 : 1);
    }
    get nearbyCache() {
        const p = this.position,
            signal = this.recoverySignal;
        if (
            signal &&
            !this.recoverySecured &&
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
        return this.cloakEnabled && this.revealTime <= 0 && this.hullConfig.cloak > 0;
    }
    toggleCloak() {
        if (this.ended || this.disposed || this.choice) return;
        if (!this.hullConfig.cloak) {
            this.setNotice('Ten kadłub nie posiada kamuflażu.');
            return;
        }
        this.cloakEnabled = !this.cloakEnabled;
        this.setNotice(
            this.cloakEnabled
                ? 'Kamuflaż włączony · ogień, laser i boost ujawniają statek.'
                : 'Kamuflaż wyłączony.',
        );
    }
    get distanceHome() {
        const p = this.position;
        return Math.hypot(p.x, p.y);
    }
    get dockable() {
        return (
            this.distanceHome < GAME.dockRadius &&
            this.speed < GAME.dockSpeed &&
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
            collider.handle === this.outpostCollider.handle
        );
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
            Math.hypot(
                this.position.x - this.recoverySignal.x,
                this.position.y - this.recoverySignal.y,
            ) < RECOVERY.radius
        )
            return this.recoveryProgress > 0
                ? `Podejmowanie celu · ${Math.floor((this.recoveryProgress / RECOVERY.seconds) * 100)}%`
                : 'Przytrzymaj E · odzysk 4 s · bez ciągu i ognia, poniżej 80 m/s';
        if (this.nearbyCache)
            return this.cacheProgress > 0
                ? `Otwieranie skrytki · ${Math.floor((this.cacheProgress / CACHE.seconds) * 100)}%`
                : 'Przytrzymaj E · skrytka 2,5 s · bez ciągu i ognia, poniżej 60 m/s';
        const site = this.nearbyScanSite;
        if (site?.siteId && !this.surveyData.has(site.siteId))
            return this.scanProgress > 0
                ? `Skanowanie · ${Math.floor((this.scanProgress / SCAN.seconds) * 100)}%`
                : 'Przytrzymaj E · skan 3 s · bez ciągu i ognia, poniżej 60 m/s';
        if (this.repairProgress > 0)
            return `Naprawa napędu / kadłuba · ${Math.ceil((this.repairProgress / GAME.repairSeconds) * 100)}%`;
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
        if (this.recoverySecured) return 'Cel zabezpieczony na holu · wróć do Aurory i zadokuj';
        return this.cargoUsed >= this.cargoCapacity
            ? 'Ładownia pełna · wróć do bazy'
            : 'LPM · działka bojowe    /    PPM · laser wydobywczy';
    }
    private addRock(spec: RockSpec) {
        if (this.rocks.size >= 380) return;
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
            health: spec.radius * 1.35,
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
        this.shotCooldown -= dt;
        this.laserEffectCooldown -= dt;
        this.laserBeam = null;
        this.laserBeams.length = 0;
        this.revealTime = Math.max(0, this.revealTime - dt);
        if (input.fire || input.mine || (input.boost && input.thrust)) this.revealTime = 3;
        this.aimTarget = { ...input.target };
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
            this.cloaked ? 1 - this.hullConfig.cloak : 1,
        );
        if (
            !chasingBefore &&
            [...this.enemies.enemies.values()].some((enemy) => enemy.state === 'chase')
        )
            this.setNotice('Patrol wykrył statek · walcz, wykorzystaj osłonę lub zerwij pościg.');
        this.world.step(this.queue);
        this.queue.drainCollisionEvents((a, b, started) => {
            if (
                !started ||
                this.damageCooldown > 0 ||
                (a !== this.shipCollider.handle && b !== this.shipCollider.handle)
            )
                return;
            const other = this.rocks.get(
                this.asteroidColliders.get(a === this.shipCollider.handle ? b : a) ?? -1,
            );
            const stationImpact =
                (a === this.shipCollider.handle ? b : a) === this.outpostCollider.handle;
            if (!other && !stationImpact) return;
            // Both velocities must be captured before the solver transfers momentum.
            const ov = other?.previousVelocity ?? { x: 0, y: 0 };
            const impact = Math.hypot(beforeImpact.x - ov.x, beforeImpact.y - ov.y);
            const damage = clamp((impact - 65) * 0.12, 0, 48);
            if (damage > 0) {
                this.takeDamage(
                    damage,
                    stationImpact
                        ? 'Kadłub zniszczony przez zderzenie z placówką.'
                        : 'Kadłub zniszczony przez zderzenie z asteroidą.',
                );
                if (damage >= GAME.faultDamage && !this.engineFault) {
                    this.engineFault = true;
                    this.setNotice('Uszkodzone dysze · ciąg napędu spadł do 45%');
                }
            }
        });
        if (input.fire && this.shotCooldown <= 0 && this.bullets.size < 80) this.fire();
        this.updateBullets(dt);
        if (input.mine) this.mine(dt);
        if (this.recoverySecured && this.recoverySignal) {
            this.tow ??= this.attachTow();
            const p = this.position,
                a = this.ship.rotation();
            this.tow.step(dt, { x: p.x - Math.cos(a) * 28, y: p.y - Math.sin(a) * 28 }, a);
        }
        this.collectLoot(dt);
        this.updateRepair(input, dt);
        this.updateRecovery(input, dt);
        this.updateScan(input, dt);
        if (
            input.interact &&
            !input.repair &&
            !input.sabotage &&
            !this.thrusting &&
            !input.fire &&
            !input.mine &&
            !this.nearbyCache
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
    private updateOutpost(input: FlightInput, dt: number) {
        const spec = this.sector.outpost;
        const signal = this.recoverySignal;
        const recovering =
            signal &&
            !this.recoverySecured &&
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
                this.events.push({ ...spec.terminal, kind: 'collect', rich: true });
            }
        }
        const exposed = this.outpost.sees(
            this.position,
            this.elapsed,
            this.cloaked ? 1 - this.hullConfig.cloak : 1,
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
        if (outcome.completed) {
            this.surveyData.add('outpost');
            this.addLoot(spec.terminal.x + 18, spec.terminal.y, 'parts', 6);
            this.addLoot(spec.terminal.x - 18, spec.terminal.y, 'ore', 4);
            this.setNotice('Dane wykradzione · chwytaki mogą zabrać skrzynie. Wróć do Aurory.');
            this.events.push({ ...spec.terminal, kind: 'collect', rich: true });
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
            this.events.push({ ...cache, kind: 'collect', rich: true });
        }
    }
    private takeDamage(damage: number, reason: string) {
        if (this.hull <= 0) return;
        this.hull = Math.max(0, this.hull - damage);
        this.deathReason = reason;
        this.damageCooldown = 0.5;
        this.repairProgress = 0;
        this.recoveryProgress = 0;
        this.scanProgress = 0;
        this.cacheProgress = 0;
        this.cacheTarget = null;
        this.outpost.download = 0;
        this.outpost.sabotageProgress = 0;
        this.revealTime = 3;
        this.events.push({ ...this.position, kind: 'hit' });
    }
    private fireEnemy(enemy: Enemy) {
        if (
            this.bullets.size >= 80 ||
            Math.hypot(this.position.x, this.position.y) < DRONES.safeRadius
        )
            return false;
        const p = enemyPosition(enemy),
            a = enemy.body.rotation(),
            v = enemy.body.linvel(),
            id = ++this.ids;
        this.bullets.set(id, {
            id,
            x: p.x + Math.cos(a) * (enemy.config.radius + 11),
            y: p.y + Math.sin(a) * (enemy.config.radius + 11),
            vx: v.x * P + Math.cos(a) * enemy.config.shotSpeed,
            vy: v.y * P + Math.sin(a) * enemy.config.shotSpeed,
            life: enemy.config.shotLife,
            team: 'enemy',
            heavy: enemy.kind === 'lancer',
            damage: enemy.config.shotDamage,
        });
        this.events.push({ ...p, kind: 'shot' });
        return true;
    }
    private updateScan(input: FlightInput, dt: number) {
        const site = this.nearbyScanSite;
        const rescue = this.recoverySignal;
        const recovering =
            rescue &&
            !this.recoverySecured &&
            Math.hypot(this.position.x - rescue.x, this.position.y - rescue.y) < RECOVERY.radius;
        if (
            !site?.siteId ||
            this.surveyData.has(site.siteId) ||
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
            this.events.push({ x: site.x, y: site.y, kind: 'collect', rich: true });
        }
    }
    private updateRecovery(input: FlightInput, dt: number) {
        const signal = this.recoverySignal;
        if (
            !signal ||
            this.recoverySecured ||
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
        if (this.recoveryProgress + 1e-8 >= RECOVERY.seconds) {
            this.recoverySecured = true;
            this.tow = this.attachTow();
            this.recoveryProgress = 0;
            this.setNotice(
                'Cel podjęty · wróć do bazy. Odzysk jest bezpieczny dopiero po dokowaniu.',
            );
            this.events.push({ x: signal.x, y: signal.y, kind: 'collect', rich: true });
        }
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
            (!this.engineFault && this.hull >= this.maxHull)
        ) {
            this.repairProgress = 0;
            return;
        }
        this.repairProgress += dt;
        if (this.repairProgress + 1e-8 >= GAME.repairSeconds) {
            this.repairKits--;
            this.engineFault = false;
            this.repairProgress = 0;
            this.hull = Math.min(this.maxHull, this.hull + GAME.repairHull);
            this.setNotice('Naprawa zakończona · pełny ciąg przywrócony');
            this.events.push({ ...this.position, kind: 'collect', rich: true });
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
    private fire() {
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
        this.bullets.set(id, {
            id,
            x: p.x + Math.cos(a) * GAME.gunLength * this.hullConfig.size,
            y: p.y + Math.sin(a) * GAME.gunLength * this.hullConfig.size,
            vx: v.x + Math.cos(a) * GAME.shotSpeed,
            vy: v.y + Math.sin(a) * GAME.shotSpeed,
            life: 1.15,
            team: 'player',
            damage: this.gunDamage,
        });
        this.shotCooldown = GAME.shotInterval;
        this.events.push({ ...p, kind: 'shot' });
    }
    private updateBullets(dt: number) {
        for (const bullet of this.bullets.values()) {
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
                    (bullet.team === 'player'
                        ? this.enemies.colliders.has(collider.handle)
                        : collider.handle === this.shipCollider.handle),
            );
            if (hit) {
                const rock = this.rocks.get(this.asteroidColliders.get(hit.collider.handle)!);
                if (rock && bullet.team === 'player') {
                    rock.health -= GAME.shotRockDamage;
                    const p = rock.body.translation();
                    this.events.push({ x: p.x * P, y: p.y * P, kind: 'hit', rich: rock.rich });
                    if (rock.health <= 0) this.breakRock(rock);
                } else if (bullet.team === 'player') {
                    const enemyId = this.enemies.colliders.get(hit.collider.handle);
                    if (enemyId !== undefined) {
                        const enemy = this.enemies.enemies.get(enemyId)!;
                        this.events.push({ ...enemyPosition(enemy), kind: 'hit' });
                        const wreck = this.enemies.damage(enemyId, bullet.damage);
                        if (wreck) {
                            this.enemyKills++;
                            this.events.push({ ...wreck, kind: 'break', rich: true });
                            this.addLoot(wreck.x - 20, wreck.y, 'ore', enemy.config.oreLoot);
                            this.addLoot(wreck.x + 20, wreck.y, 'parts', enemy.config.partsLoot);
                            this.setNotice('Dron zniszczony · odzyskaj komponenty i rudę.');
                        }
                    }
                } else if (hit.collider.handle === this.shipCollider.handle) {
                    if (this.distanceHome >= DRONES.safeRadius)
                        this.takeDamage(bullet.damage, 'Kadłub zniszczony przez ostrzał dronów.');
                } else if (rock) {
                    const p = rock.body.translation();
                    this.events.push({ x: p.x * P, y: p.y * P, kind: 'hit' });
                }
                this.bullets.delete(bullet.id);
            } else {
                bullet.x += bullet.vx * dt;
                bullet.y += bullet.vy * dt;
                bullet.life -= dt;
                if (bullet.life <= 0) this.bullets.delete(bullet.id);
            }
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
            this.laserRange / P,
            true,
            undefined,
            undefined,
            this.shipCollider,
            undefined,
            (collider) => this.isObstacle(collider) || this.enemies.colliders.has(collider.handle),
        );
        const distance = hit ? hit.timeOfImpact * P : this.laserRange;
        const to = { x: from.x + direction.x * distance, y: from.y + direction.y * distance };
        this.laserBeam = { from, to };
        this.laserBeams.push({ from, to });
        if (!hit) return;
        const rock = this.rocks.get(this.asteroidColliders.get(hit.collider.handle)!);
        if (!rock) return;
        rock.health -=
            GAME.laserDamage *
            this.laserPowerMultiplier *
            dt *
            this.hullConfig.miningPower *
            this.pilot.mining *
            (1 + 0.25 * this.modules.drill);
        if (this.laserEffectCooldown <= 0) {
            this.events.push({ ...to, kind: 'hit', rich: rock.rich });
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
        this.events.push({ x, y, kind: 'break', rich: rock.rich });
        if (rock.radius > 44) {
            for (const side of [-1, 1])
                this.addRock({
                    x: x + side * rock.radius * 0.5,
                    y,
                    radius: rock.radius * 0.43,
                    vx: v.x * P + side * 34,
                    vy: v.y * P + (this.rng() - 0.5) * 30,
                    rich: rock.rich,
                    variant: rock.variant,
                });
        }
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
                this.cargo[kind]++;
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
            if (this.dockProgress >= 1.2 && this.hull > 0) this.ended = 'returned';
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
        this.enemies.dispose();
        this.queue.free();
        this.world.free();
        this.rocks.clear();
        this.bullets.clear();
        this.loot.clear();
        this.grippers.clear();
        this.laserBeams.length = 0;
        this.events.length = 0;
    }
}
