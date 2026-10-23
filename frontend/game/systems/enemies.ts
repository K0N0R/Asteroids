import { firstBossProfile, finalBossProfile } from './firstBoss';
import RAPIER from '@dimforge/rapier2d-compat';
import { DRONES, ENEMY_PROFILES, ENEMY_SUPPORT, EnemyKind, GAME } from '../config';
import type { EnemySpec, Point } from '../worlds/sector';

const P = GAME.pixelsPerMeter;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export type EnemyState = 'patrol' | 'chase' | 'return';
export type EnemyProfile = {
    [K in keyof (typeof ENEMY_PROFILES)['lancer']]: K extends 'name' ? string : number;
};
export interface Enemy extends EnemySpec {
    kind: EnemyKind;
    config: EnemyProfile;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    health: number;
    state: EnemyState;
    previous: Point;
    previousAngle: number;
    cooldown: number;
    charge: number;
    lostSight: number;
    hitFlash: number;
    impactCooldown: number;
    weaponDisabled?: number;
    empImmunity?: number;
    thrusting: boolean;
    lastSeen: Point;
    routeIndex: number;
    repairTarget: number | null;
    target: 'player' | 'escort' | 'station' | `sentry:${number}`;
}
export const enemyPosition = (enemy: Enemy): Point => {
    const p = enemy.body.translation();
    return { x: p.x * P, y: p.y * P };
};

function interceptTime(
    dx: number,
    dy: number,
    vx: number,
    vy: number,
    shotSpeed: number,
    shotLife: number,
) {
    const a = vx * vx + vy * vy - shotSpeed * shotSpeed,
        b = 2 * (dx * vx + dy * vy),
        c = dx * dx + dy * dy;
    let time = Math.sqrt(c) / shotSpeed;
    if (Math.abs(a) < 1e-6) {
        if (Math.abs(b) > 1e-6 && -c / b > 0) time = -c / b;
    } else {
        const discriminant = b * b - 4 * a * c;
        if (discriminant >= 0) {
            const times = [
                (-b - Math.sqrt(discriminant)) / (2 * a),
                (-b + Math.sqrt(discriminant)) / (2 * a),
            ].filter((t) => t > 0);
            if (times.length) time = Math.min(...times);
        }
    }
    return Math.min(shotLife, time);
}

export class EnemyFleet {
    readonly enemies = new Map<number, Enemy>();
    readonly colliders = new Map<number, number>();
    private disposed = false;
    constructor(
        private world: RAPIER.World,
        specs: readonly EnemySpec[],
    ) {
        this.add(specs);
    }
    add(specs: readonly EnemySpec[]) {
        if (this.disposed) return;
        for (const spec of specs) {
            if (this.enemies.has(spec.id)) continue;
            const kind = spec.kind ?? 'patrol',
                config = spec.finalBoss
                    ? finalBossProfile()
                    : spec.boss
                      ? firstBossProfile()
                      : ENEMY_PROFILES[kind];
            const body = this.world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(spec.x / P, spec.y / P)
                    .setRotation(spec.phase)
                    .setLinearDamping(0)
                    .setAngularDamping(0)
                    .setCcdEnabled(true),
            );
            const collider = this.world.createCollider(
                RAPIER.ColliderDesc.ball(config.radius / P)
                    .setDensity(config.density)
                    .setRestitution(0.25)
                    .setFriction(0.1)
                    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
                body,
            );
            this.enemies.set(spec.id, {
                ...spec,
                route: spec.route?.map((point) => ({ ...point })),
                routeIndex: 0,
                repairTarget: null,
                target: 'player',
                kind,
                config,
                home: { ...spec.home },
                body,
                collider,
                health: config.hull,
                state: 'patrol',
                previous: { x: spec.x, y: spec.y },
                previousAngle: spec.phase,
                cooldown: 0,
                charge: 0,
                lostSight: 0,
                hitFlash: 0,
                impactCooldown: 0,
                thrusting: false,
                lastSeen: { x: spec.x, y: spec.y },
            });
            this.colliders.set(collider.handle, spec.id);
        }
    }
    alert(ids: readonly number[], player: Point) {
        if (this.disposed) return;
        for (const id of ids) {
            const enemy = this.enemies.get(id);
            if (!enemy) continue;
            enemy.state = 'chase';
            enemy.lastSeen = { ...player };
            enemy.lostSight = 0;
            enemy.charge = 0;
        }
    }
    lineClear(from: Point, to: Point, isRock: (collider: RAPIER.Collider) => boolean) {
        const ray = new RAPIER.Ray(
            { x: from.x / P, y: from.y / P },
            { x: (to.x - from.x) / P, y: (to.y - from.y) / P },
        );
        return !this.world.castRay(
            ray,
            1,
            true,
            undefined,
            undefined,
            undefined,
            undefined,
            isRock,
        );
    }
    update(
        dt: number,
        playerPosition: Point,
        playerVelocity: Point,
        isRock: (collider: RAPIER.Collider) => boolean,
        fire: (enemy: Enemy) => boolean,
        signature = 1,
        ally?: { position: Point; velocity: Point; kind?: 'station' },
        safeRadius: number = DRONES.safeRadius,
        sentries: readonly { id: number; position: Point; velocity: Point }[] = [],
    ) {
        if (this.disposed) return;
        for (const enemy of this.enemies.values()) {
            if (!enemy.body.isEnabled()) continue;
            const config = enemy.config,
                p0 = enemyPosition(enemy);
            const allyDistance = ally
                ? Math.hypot(ally.position.x - p0.x, ally.position.y - p0.y)
                : Infinity;
            const playerDistance = Math.hypot(playerPosition.x - p0.x, playerPosition.y - p0.y);
            const playerVisible =
                Math.hypot(playerPosition.x, playerPosition.y) >= safeRadius &&
                playerDistance < config.loseRange * signature &&
                this.lineClear(p0, playerPosition, isRock);
            const chooseAlly =
                !!ally &&
                Math.hypot(ally.position.x, ally.position.y) >= safeRadius &&
                allyDistance < config.loseRange &&
                this.lineClear(p0, ally.position, isRock) &&
                (!playerVisible || allyDistance < playerDistance);
            let target: Enemy['target'] = chooseAlly ? (ally!.kind ?? 'escort') : 'player';
            let player = chooseAlly ? ally!.position : playerPosition,
                velocity = chooseAlly ? ally!.velocity : playerVelocity;
            let nearest = chooseAlly ? allyDistance : playerVisible ? playerDistance : Infinity;
            for (const drone of sentries) {
                const distance = Math.hypot(drone.position.x - p0.x, drone.position.y - p0.y);
                if (
                    distance >= nearest ||
                    distance >= config.loseRange ||
                    Math.hypot(drone.position.x, drone.position.y) < safeRadius ||
                    !this.lineClear(p0, drone.position, isRock)
                )
                    continue;
                target = `sentry:${drone.id}`;
                player = drone.position;
                velocity = drone.velocity;
                nearest = distance;
            }
            if (enemy.target !== target) enemy.charge = 0;
            enemy.target = target;
            const targetSignature = target === 'player' ? signature : 1;
            const p = enemyPosition(enemy),
                dx = player.x - p.x,
                dy = player.y - p.y;
            const distance = Math.hypot(dx, dy),
                homeDistance = Math.hypot(p.x - enemy.home.x, p.y - enemy.home.y);
            const safe = Math.hypot(player.x, player.y) < safeRadius;
            const visible =
                !safe &&
                distance < config.loseRange * targetSignature &&
                this.lineClear(p, player, isRock);
            if (visible) enemy.lastSeen = { ...player };
            enemy.previous = p;
            enemy.previousAngle = enemy.body.rotation();
            enemy.cooldown = Math.max(0, enemy.cooldown - dt);
            enemy.empImmunity = Math.max(0, (enemy.empImmunity ?? 0) - dt);
            enemy.weaponDisabled = Math.max(0, (enemy.weaponDisabled ?? 0) - dt);
            enemy.impactCooldown = Math.max(0, enemy.impactCooldown - dt);
            enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
            enemy.phase += dt * 0.35;
            if (enemy.state === 'chase') {
                enemy.lostSight = visible ? 0 : enemy.lostSight + dt;
                if (
                    safe ||
                    distance > config.loseRange ||
                    homeDistance > config.leash ||
                    enemy.lostSight > 2.5
                ) {
                    enemy.state = 'return';
                    enemy.charge = 0;
                }
            } else if (enemy.state === 'return') {
                if (homeDistance < 210) enemy.state = 'patrol';
            } else if (visible && distance < config.detectRange * targetSignature) {
                if (enemy.route) enemy.home = { ...p };
                enemy.state = 'chase';
                enemy.lostSight = 0;
            }
            let vx: number, vy: number;
            const speed = enemy.state === 'chase' ? config.chaseSpeed : config.patrolSpeed;
            const pursuitTime =
                enemy.kind === 'interceptor' && visible
                    ? Math.min(0.9, distance / config.chaseSpeed)
                    : 0;
            const tracked = visible
                ? { x: player.x + velocity.x * pursuitTime, y: player.y + velocity.y * pursuitTime }
                : enemy.lastSeen;
            const tx = tracked.x - p.x,
                ty = tracked.y - p.y,
                trackedDistance = Math.hypot(tx, ty);
            if (enemy.state === 'chase') {
                const radial = clamp((trackedDistance - config.preferredRange) / 140, -1, 1);
                const tangent = (enemy.id % 2 ? 1 : -1) * config.strafe;
                vx =
                    ((tx / Math.max(1, trackedDistance)) * radial -
                        (ty / Math.max(1, trackedDistance)) * tangent) *
                    speed;
                vy =
                    ((ty / Math.max(1, trackedDistance)) * radial +
                        (tx / Math.max(1, trackedDistance)) * tangent) *
                    speed;
            } else {
                if (enemy.state === 'patrol' && enemy.route?.length) {
                    const point = enemy.route[enemy.routeIndex];
                    if (Math.hypot(point.x - p.x, point.y - p.y) < 180)
                        enemy.routeIndex = (enemy.routeIndex + 1) % enemy.route.length;
                }
                const target =
                    enemy.state === 'return'
                        ? enemy.home
                        : (enemy.route?.[enemy.routeIndex] ?? {
                              x: enemy.home.x + Math.cos(enemy.phase) * 170,
                              y: enemy.home.y + Math.sin(enemy.phase) * 170,
                          });
                const tx = target.x - p.x,
                    ty = target.y - p.y,
                    length = Math.hypot(tx, ty);
                const approach = Math.min(speed, length * 1.5);
                vx = (tx / Math.max(1, length)) * approach;
                vy = (ty / Math.max(1, length)) * approach;
            }
            enemy.repairTarget = null;
            if (
                enemy.kind === 'support' &&
                !enemy.weaponDisabled &&
                !safe &&
                Math.hypot(p.x, p.y) >= safeRadius
            ) {
                const wounded = [...this.enemies.values()]
                    .filter((ally) => {
                        const position = enemyPosition(ally);
                        return (
                            ally.id !== enemy.id &&
                            !ally.boss &&
                            ally.state === 'chase' &&
                            ally.health > 0 &&
                            ally.health < ally.config.hull &&
                            Math.hypot(position.x - p.x, position.y - p.y) <=
                                ENEMY_SUPPORT.followRange &&
                            this.lineClear(p, position, isRock)
                        );
                    })
                    .sort(
                        (first, second) =>
                            first.health / first.config.hull - second.health / second.config.hull ||
                            first.id - second.id,
                    )[0];
                if (wounded) {
                    const position = enemyPosition(wounded);
                    const dx = position.x - p.x,
                        dy = position.y - p.y;
                    const length = Math.max(1, Math.hypot(dx, dy));
                    if (length <= ENEMY_SUPPORT.range) {
                        wounded.health = Math.min(
                            wounded.config.hull,
                            wounded.health + ENEMY_SUPPORT.repairPerSecond * dt,
                        );
                        enemy.repairTarget = wounded.id;
                        vx *= 0.25;
                        vy *= 0.25;
                    } else {
                        vx = (dx / length) * speed;
                        vy = (dy / length) * speed;
                    }
                }
            }
            // Short forward feelers add avoidance; Rapier resolves contact with moving rocks.
            const travelAngle = Math.atan2(vy, vx);
            for (const offset of [0, -0.6, 0.6]) {
                const ray = new RAPIER.Ray(
                    { x: p.x / P, y: p.y / P },
                    { x: Math.cos(travelAngle + offset), y: Math.sin(travelAngle + offset) },
                );
                const hit = this.world.castRay(
                    ray,
                    1.7,
                    true,
                    undefined,
                    undefined,
                    enemy.collider,
                    undefined,
                    isRock,
                );
                if (hit) {
                    const obstacle = hit.collider.translation();
                    const ax = p.x - obstacle.x * P,
                        ay = p.y - obstacle.y * P,
                        length = Math.hypot(ax, ay);
                    const push = speed * (1.8 - hit.timeOfImpact);
                    vx += (ax / Math.max(1, length)) * push;
                    vy += (ay / Math.max(1, length)) * push;
                }
            }
            if (Math.hypot(p.x, p.y) < safeRadius) {
                const radius = Math.max(1, Math.hypot(p.x, p.y));
                vx = (p.x / radius) * speed;
                vy = (p.y / radius) * speed;
                enemy.state = 'return';
                enemy.charge = 0;
            }
            const targetLength = Math.hypot(vx, vy),
                limit = targetLength > speed ? speed / targetLength : 1;
            vx *= limit;
            vy *= limit;
            const shooterVelocity = enemy.body.linvel();
            const relative = {
                x: velocity.x - shooterVelocity.x * P,
                y: velocity.y - shooterVelocity.y * P,
            };
            const lead =
                enemy.state === 'chase' && visible
                    ? interceptTime(
                          dx,
                          dy,
                          relative.x,
                          relative.y,
                          config.shotSpeed,
                          config.shotLife,
                      )
                    : 0;
            const angle =
                enemy.state === 'chase'
                    ? Math.atan2(dy + relative.y * lead, dx + relative.x * lead)
                    : Math.atan2(vy, vx);
            const error = Math.atan2(
                Math.sin(angle - enemy.body.rotation()),
                Math.cos(angle - enemy.body.rotation()),
            );
            const angular = clamp(error * 12, -config.turnSpeed, config.turnSpeed);
            enemy.body.applyTorqueImpulse(
                (angular - enemy.body.angvel()) * enemy.body.effectiveAngularInertia(),
                true,
            );
            const current = enemy.body.linvel(),
                mass = enemy.body.mass();
            const ex = vx / P - current.x,
                ey = vy / P - current.y,
                difference = Math.hypot(ex, ey);
            const fraction =
                difference > 0 ? Math.min(1, ((config.acceleration / P) * dt) / difference) : 0;
            enemy.body.applyImpulse({ x: ex * mass * fraction, y: ey * mass * fraction }, true);
            enemy.thrusting = targetLength > 10;
            if (
                enemy.state === 'chase' &&
                visible &&
                !enemy.weaponDisabled &&
                enemy.repairTarget === null &&
                distance < config.fireRange &&
                Math.abs(error) < 0.2 &&
                enemy.cooldown <= 0 &&
                this.lineClear(
                    p,
                    { x: player.x + velocity.x * lead, y: player.y + velocity.y * lead },
                    isRock,
                )
            ) {
                enemy.charge = Math.min(config.windup, enemy.charge + dt);
                if (enemy.charge + 1e-8 >= config.windup && fire(enemy)) {
                    enemy.charge = 0;
                    enemy.cooldown = config.shotInterval;
                }
            } else enemy.charge = 0;
        }
    }
    damage(id: number, amount: number, interrupt = true) {
        const enemy = this.enemies.get(id);
        if (!enemy) return null;
        enemy.health = Math.max(0, enemy.health - amount);
        enemy.hitFlash = 0.15;
        if (enemy.route && enemy.state !== 'chase') enemy.home = enemyPosition(enemy);
        if (interrupt || enemy.state !== 'chase') enemy.charge = 0;
        enemy.state = 'chase';
        enemy.lostSight = 0;
        if (enemy.health > 0) return null;
        const p = enemyPosition(enemy);
        this.colliders.delete(enemy.collider.handle);
        this.world.removeRigidBody(enemy.body);
        this.enemies.delete(id);
        return p;
    }
    remove(id: number) {
        const enemy = this.enemies.get(id);
        if (!enemy) return;
        this.colliders.delete(enemy.collider.handle);
        this.world.removeRigidBody(enemy.body);
        this.enemies.delete(id);
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        for (const enemy of this.enemies.values()) this.world.removeRigidBody(enemy.body);
        this.enemies.clear();
        this.colliders.clear();
    }
}
