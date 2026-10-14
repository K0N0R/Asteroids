import RAPIER from '@dimforge/rapier2d-compat';
import { DRONES, ENEMY_PROFILES, EnemyKind, GAME } from '../config';
import type { EnemySpec, Point } from '../worlds/sector';

const P = GAME.pixelsPerMeter;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export type EnemyState = 'patrol' | 'chase' | 'return';
export interface Enemy extends EnemySpec {
    kind: EnemyKind;
    config: (typeof ENEMY_PROFILES)[EnemyKind];
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
    thrusting: boolean;
    lastSeen: Point;
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
                config = ENEMY_PROFILES[kind];
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
                    .setFriction(0.1),
                body,
            );
            this.enemies.set(spec.id, {
                ...spec,
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
        player: Point,
        velocity: Point,
        isRock: (collider: RAPIER.Collider) => boolean,
        fire: (enemy: Enemy) => boolean,
        signature = 1,
    ) {
        if (this.disposed) return;
        for (const enemy of this.enemies.values()) {
            const config = enemy.config;
            const p = enemyPosition(enemy),
                dx = player.x - p.x,
                dy = player.y - p.y;
            const distance = Math.hypot(dx, dy),
                homeDistance = Math.hypot(p.x - enemy.home.x, p.y - enemy.home.y);
            const safe = Math.hypot(player.x, player.y) < DRONES.safeRadius;
            const visible =
                !safe &&
                distance < config.loseRange * signature &&
                this.lineClear(p, player, isRock);
            if (visible) enemy.lastSeen = { ...player };
            enemy.previous = p;
            enemy.previousAngle = enemy.body.rotation();
            enemy.cooldown = Math.max(0, enemy.cooldown - dt);
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
            } else if (visible && distance < config.detectRange * signature) {
                enemy.state = 'chase';
                enemy.lostSight = 0;
            }
            let vx: number, vy: number;
            const speed = enemy.state === 'chase' ? config.chaseSpeed : config.patrolSpeed;
            const tracked = visible ? player : enemy.lastSeen;
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
                const target =
                    enemy.state === 'return'
                        ? enemy.home
                        : {
                              x: enemy.home.x + Math.cos(enemy.phase) * 170,
                              y: enemy.home.y + Math.sin(enemy.phase) * 170,
                          };
                const tx = target.x - p.x,
                    ty = target.y - p.y,
                    length = Math.hypot(tx, ty);
                const approach = Math.min(speed, length * 1.5);
                vx = (tx / Math.max(1, length)) * approach;
                vy = (ty / Math.max(1, length)) * approach;
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
            if (Math.hypot(p.x, p.y) < DRONES.safeRadius) {
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
                          tx,
                          ty,
                          relative.x,
                          relative.y,
                          config.shotSpeed,
                          config.shotLife,
                      )
                    : 0;
            const angle =
                enemy.state === 'chase'
                    ? Math.atan2(ty + relative.y * lead, tx + relative.x * lead)
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
    damage(id: number, amount: number) {
        const enemy = this.enemies.get(id);
        if (!enemy) return null;
        enemy.health = Math.max(0, enemy.health - amount);
        enemy.hitFlash = 0.15;
        enemy.state = 'chase';
        enemy.lostSight = 0;
        enemy.charge = 0;
        if (enemy.health > 0) return null;
        const p = enemyPosition(enemy);
        this.colliders.delete(enemy.collider.handle);
        this.world.removeRigidBody(enemy.body);
        this.enemies.delete(id);
        return p;
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        for (const enemy of this.enemies.values()) this.world.removeRigidBody(enemy.body);
        this.enemies.clear();
        this.colliders.clear();
    }
}
