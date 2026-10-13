import RAPIER from '@dimforge/rapier2d-compat';
import { DRONES, GAME, HULLS, RECOVERY, SCAN, ScanSiteId } from '../config';
import { Campaign, Cargo, capacity, shipHealth } from '../state/campaign';
import { generateSector, Point, random, RockSpec } from '../worlds/sector';
import { RecoverySignal } from '../state/recovery';
import { pilotProfile } from '../state/pilots';
import { Enemy, EnemyFleet, enemyPosition } from './enemies';

export interface FlightInput {
    target: Point;
    thrust: boolean;
    brake: boolean;
    fire: boolean;
    interact: boolean;
    repair?: boolean;
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
const angleDifference = (to: number, from: number) =>
    Math.atan2(Math.sin(to - from), Math.cos(to - from));

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
    enemyKills = 0;
    deathReason = 'Zniszczony kadłub.';
    readonly pilot;
    readonly cargo: Cargo = { ore: 0, parts: 0 };
    readonly cargoCapacity: number;
    readonly maxHull: number;
    readonly hullConfig;
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
    dockProgress = 0;
    engineFault = false;
    repairProgress = 0;
    repairKits: number;
    wreckVisited = false;
    notice = '';
    noticeTime = 0;
    private ids = 0;
    private shotCooldown = 0;
    private damageCooldown = 0;
    private rng;
    private asteroidColliders = new Map<number, number>();
    private modules;
    private disposed = false;

    constructor(campaign: Campaign, seed: number) {
        this.sector = generateSector(seed);
        this.recoverySignal =
            campaign.recoverySignals.find(
                (signal) => signal.id === campaign.activeRun?.recoveryId,
            ) ?? null;
        this.rng = random(seed ^ 0xa12d9b);
        this.modules = { ...campaign.ship! };
        this.hullConfig = HULLS[this.modules.hull];
        this.pilot = pilotProfile(campaign.pilots.find((p) => p.id === campaign.selectedPilot)!);
        this.cargoCapacity = capacity(campaign);
        this.maxHull = shipHealth(campaign.ship!);
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
            RAPIER.ColliderDesc.capsule(0.13 * this.hullConfig.size, 0.19 * this.hullConfig.size)
                .setRotation(Math.PI / 2)
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
    get distanceHome() {
        const p = this.position;
        return Math.hypot(p.x, p.y);
    }
    get dockable() {
        return this.distanceHome < GAME.dockRadius && this.speed < GAME.dockSpeed;
    }
    get nearbyScanSite() {
        const p = this.position;
        return this.sector.landmarks.find(
            (site) => site.siteId && Math.hypot(site.x - p.x, site.y - p.y) < SCAN.radius,
        );
    }
    get context() {
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
            : 'LPM · wydobycie / walka    /    łup zbierasz automatycznie';
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
        if (this.ended || this.disposed) return;
        const dt = GAME.step;
        this.elapsed += dt;
        this.shotCooldown -= dt;
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
        const delta = { x: input.target.x - this.previous.x, y: input.target.y - this.previous.y };
        const error =
            Math.hypot(delta.x, delta.y) > 8
                ? angleDifference(Math.atan2(delta.y, delta.x), this.ship.rotation())
                : 0;
        const maxTurn = this.hullConfig.turnSpeed * this.pilot.turn;
        const desiredAngularVelocity = clamp(
            (error * (1 - Math.exp(-GAME.turnResponse * this.pilot.turn * dt))) / dt,
            -maxTurn,
            maxTurn,
        );
        const angularError = desiredAngularVelocity - this.ship.angvel();
        this.ship.applyTorqueImpulse(angularError * this.ship.effectiveAngularInertia(), true);
        this.thrusting = input.thrust && !input.brake;
        this.braking = input.brake || (!input.thrust && this.speed > GAME.stopSpeed);
        const mass = this.ship.mass(),
            velocity = this.ship.linvel();
        if (this.thrusting) {
            // Assist steers momentum toward the cursor instead of accumulating sideways drift.
            const power = this.engineFault ? GAME.damagedThrust : 1;
            const a = this.ship.rotation() + desiredAngularVelocity * dt;
            const targetSpeed = (this.hullConfig.maxSpeed * power) / P;
            const dx = Math.cos(a) * targetSpeed - velocity.x;
            const dy = Math.sin(a) * targetSpeed - velocity.y;
            const difference = Math.hypot(dx, dy);
            const change =
                ((this.hullConfig.thrust * (1 + 0.15 * this.modules.engine) * power) / P) * dt;
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
            (collider) => this.asteroidColliders.has(collider.handle),
            (enemy) => this.fireEnemy(enemy),
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
            if (!other) return;
            // Both velocities must be captured before the solver transfers momentum.
            const ov = other.previousVelocity;
            const impact = Math.hypot(beforeImpact.x - ov.x, beforeImpact.y - ov.y);
            const damage = clamp((impact - 65) * 0.12, 0, 48);
            if (damage > 0) {
                this.takeDamage(damage, 'Kadłub zniszczony przez zderzenie z asteroidą.');
                if (damage >= GAME.faultDamage && !this.engineFault) {
                    this.engineFault = true;
                    this.setNotice('Uszkodzone dysze · ciąg napędu spadł do 45%');
                }
            }
        });
        if (input.fire && this.shotCooldown <= 0 && this.bullets.size < 80) this.fire();
        this.updateBullets(dt);
        this.collectLoot(dt);
        this.updateRepair(input, dt);
        this.updateRecovery(input, dt);
        this.updateScan(input, dt);
        if (input.interact && !input.repair) this.interact(dt);
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
    }
    private takeDamage(damage: number, reason: string) {
        if (this.hull <= 0) return;
        this.hull = Math.max(0, this.hull - damage);
        this.deathReason = reason;
        this.damageCooldown = 0.5;
        this.repairProgress = 0;
        this.recoveryProgress = 0;
        this.scanProgress = 0;
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
            x: p.x + Math.cos(a) * 37,
            y: p.y + Math.sin(a) * 37,
            vx: v.x * P + Math.cos(a) * DRONES.shotSpeed,
            vy: v.y * P + Math.sin(a) * DRONES.shotSpeed,
            life: DRONES.shotLife,
            team: 'enemy',
            damage: DRONES.shotDamage,
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
            input.thrust ||
            input.fire ||
            input.repair ||
            this.speed > SCAN.speed ||
            this.hull <= 0 ||
            this.damageCooldown > 0 ||
            recovering
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
            input.thrust ||
            input.fire ||
            input.repair ||
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
            input.thrust ||
            input.fire ||
            input.interact ||
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
    private fire() {
        const p = this.position,
            v = this.velocity,
            a = this.ship.rotation();
        const id = ++this.ids;
        this.bullets.set(id, {
            id,
            x: p.x + Math.cos(a) * 38 * this.hullConfig.size,
            y: p.y + Math.sin(a) * 38 * this.hullConfig.size,
            vx: v.x + Math.cos(a) * GAME.shotSpeed,
            vy: v.y + Math.sin(a) * GAME.shotSpeed,
            life: 1.15,
            team: 'player',
            damage: GAME.shotDamage,
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
                    this.asteroidColliders.has(collider.handle) ||
                    (bullet.team === 'player'
                        ? this.enemies.colliders.has(collider.handle)
                        : collider.handle === this.shipCollider.handle),
            );
            if (hit) {
                const rock = this.rocks.get(this.asteroidColliders.get(hit.collider.handle)!);
                if (rock && bullet.team === 'player') {
                    rock.health -=
                        GAME.shotDamage *
                        this.hullConfig.miningPower *
                        this.pilot.mining *
                        (1 + 0.25 * this.modules.drill);
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
                            this.addLoot(wreck.x - 20, wreck.y, 'ore', 3);
                            this.addLoot(wreck.x + 20, wreck.y, 'parts', 2);
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
        if (this.loot.size >= 400) return;
        const id = ++this.ids;
        this.loot.set(id, { id, x, y, kind, amount });
    }
    private collectLoot(dt: number) {
        const p = this.position;
        for (const item of this.loot.values()) {
            if (this.cargoUsed >= this.cargoCapacity) break;
            const dx = p.x - item.x,
                dy = p.y - item.y,
                distance = Math.hypot(dx, dy);
            if (distance < 32) {
                const amount = Math.min(item.amount, this.cargoCapacity - this.cargoUsed);
                this.cargo[item.kind] += amount;
                item.amount -= amount;
                if (item.amount <= 0) this.loot.delete(item.id);
                this.events.push({ ...item, kind: 'collect', rich: item.kind === 'parts' });
            } else if (distance < 155) {
                const travel = Math.min(distance, 200 * dt);
                item.x += (dx / distance) * travel;
                item.y += (dy / distance) * travel;
            }
        }
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
        this.enemies.dispose();
        this.queue.free();
        this.world.free();
        this.rocks.clear();
        this.bullets.clear();
        this.loot.clear();
        this.events.length = 0;
    }
}
