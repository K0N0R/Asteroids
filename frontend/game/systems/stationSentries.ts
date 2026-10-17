import RAPIER from '@dimforge/rapier2d-compat';
import { GAME, JOBS } from '../config';
import type { Campaign } from '../state/campaign';
import { STATION_DRONES as D, type StationDroneState } from '../state/stationDrones';
import type { Point } from '../worlds/sector';
import { enemyPosition, type Enemy, type EnemyFleet } from './enemies';

export interface StationSentry {
    id: number;
    state: StationDroneState;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    mode: 'patrol' | 'attack' | 'repair';
    target: number | null;
    cooldown: number;
    quiet: number;
    impactCooldown: number;
    previous: Point;
}

export function sentryPosition(drone: StationSentry): Point {
    const p = drone.body.translation();
    return { x: p.x * GAME.pixelsPerMeter, y: p.y * GAME.pixelsPerMeter };
}

export class StationSentries {
    readonly drones = new Map<number, StationSentry>();
    readonly colliders = new Map<number, number>();
    private angle = 0;
    private enabled = false;

    constructor(
        private world: RAPIER.World,
        private campaign: Campaign,
    ) {}

    private launch(id: number, state: StationDroneState) {
        const angle = this.angle + (id * Math.PI * 2) / D.count;
        const p = { x: Math.cos(angle) * 200, y: Math.sin(angle) * 200 };
        const body = this.world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(p.x / GAME.pixelsPerMeter, p.y / GAME.pixelsPerMeter)
                .setCcdEnabled(true),
        );
        const collider = this.world.createCollider(
            RAPIER.ColliderDesc.ball(D.radius / GAME.pixelsPerMeter)
                .setCollisionGroups(0x0008fff8)
                .setDensity(2)
                .setRestitution(0.2)
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
            body,
        );
        this.drones.set(id, {
            id,
            state,
            body,
            collider,
            mode: state.hull < D.hull ? 'repair' : 'patrol',
            target: null,
            cooldown: 0,
            quiet: 0,
            impactCooldown: 0,
            previous: p,
        });
        this.colliders.set(collider.handle, id);
    }

    get allies() {
        return [...this.drones.values()].map((drone) => {
            const v = drone.body.linvel();
            return {
                id: drone.id,
                position: sentryPosition(drone),
                velocity: { x: v.x * GAME.pixelsPerMeter, y: v.y * GAME.pixelsPerMeter },
            };
        });
    }

    update(
        dt: number,
        enabled: boolean,
        fleet: EnemyFleet,
        isObstacle: (collider: RAPIER.Collider) => boolean,
        fire: (drone: StationSentry, enemy: Enemy) => boolean,
    ) {
        const states = this.campaign.station.sentries;
        this.enabled = enabled && !!states;
        if (!this.enabled || !states) {
            this.clear();
            return;
        }
        const mechanic =
            this.campaign.crew.mechanic &&
            !this.campaign.crew.mechanicAboard &&
            !this.campaign.crew.jobs.some((job) => JOBS[job.kind].worker === 'mechanic');
        this.angle += dt * 0.12;
        states.forEach((state, id) => {
            if (state.hull <= 0) {
                if (!mechanic) return;
                if (state.rebuildRemaining <= 0) {
                    const cost = D.replacement;
                    if (
                        this.campaign.bank.parts < cost.parts ||
                        (this.campaign.bank.powerModules ?? 0) < cost.powerModules
                    )
                        return;
                    this.campaign.bank.parts -= cost.parts;
                    this.campaign.bank.powerModules =
                        (this.campaign.bank.powerModules ?? 0) - cost.powerModules;
                    state.rebuildRemaining = D.rebuildSeconds;
                }
                state.rebuildRemaining = Math.max(0, state.rebuildRemaining - dt);
                if (state.rebuildRemaining > 1e-8) return;
                state.rebuildRemaining = 0;
                state.hull = D.hull;
            }
            if (!this.drones.has(id)) this.launch(id, state);
        });
        for (const drone of this.drones.values()) {
            let p = sentryPosition(drone);
            const distance = Math.hypot(p.x, p.y);
            if (distance > D.leash) {
                p = { x: (p.x / distance) * D.leash, y: (p.y / distance) * D.leash };
                drone.body.setTranslation(
                    { x: p.x / GAME.pixelsPerMeter, y: p.y / GAME.pixelsPerMeter },
                    true,
                );
            }
            drone.previous = p;
            drone.cooldown = Math.max(0, drone.cooldown - dt);
            drone.impactCooldown = Math.max(0, drone.impactCooldown - dt);
            const visible = (enemy: Enemy) => {
                const target = enemyPosition(enemy);
                return (
                    Math.hypot(target.x, target.y) <= D.leash &&
                    Math.hypot(target.x - p.x, target.y - p.y) <= D.detection &&
                    fleet.lineClear(p, target, isObstacle)
                );
            };
            let target = fleet.enemies.get(drone.target!);
            if (!target || !visible(target)) {
                target = [...fleet.enemies.values()].filter(visible).sort((first, second) => {
                    const a = enemyPosition(first),
                        b = enemyPosition(second);
                    return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y);
                })[0];
            }
            drone.quiet = target ? 0 : drone.quiet + dt;
            if (drone.state.hull <= D.hull * 0.35) drone.mode = 'repair';
            if (drone.mode === 'repair' && drone.state.hull >= D.hull) drone.mode = 'patrol';
            const angle = this.angle + (drone.id * Math.PI * 2) / D.count;
            let destination = { x: Math.cos(angle) * D.orbit, y: Math.sin(angle) * D.orbit };
            if (drone.mode === 'repair') {
                destination = { x: Math.cos(angle) * 200, y: Math.sin(angle) * 200 };
                if (Math.hypot(p.x, p.y) < 260 && mechanic && drone.quiet >= D.repairDelay)
                    drone.state.hull = Math.min(D.hull, drone.state.hull + D.repairRate * dt);
                target = undefined;
            } else if (target) {
                const position = enemyPosition(target);
                const dx = p.x - position.x,
                    dy = p.y - position.y;
                const length = Math.max(1, Math.hypot(dx, dy));
                destination = {
                    x: position.x + (dx / length) * 320,
                    y: position.y + (dy / length) * 320,
                };
                drone.mode = 'attack';
                drone.body.setRotation(Math.atan2(-dy, -dx), true);
                if (length <= D.range && drone.cooldown <= 0 && fire(drone, target))
                    drone.cooldown = D.shotInterval;
            } else {
                if (drone.state.hull < D.hull && drone.quiet >= D.repairDelay)
                    drone.mode = 'repair';
                else drone.mode = 'patrol';
            }
            drone.target = target?.id ?? null;
            const limit = Math.hypot(destination.x, destination.y);
            if (limit > D.leash - D.radius) {
                destination.x *= (D.leash - D.radius) / limit;
                destination.y *= (D.leash - D.radius) / limit;
            }
            let dx = destination.x - p.x,
                dy = destination.y - p.y;
            const length = Math.max(1, Math.hypot(dx, dy));
            let speed = Math.min(D.speed, length * 2);
            const ahead = { x: p.x + (dx / length) * 140, y: p.y + (dy / length) * 140 };
            if (!fleet.lineClear(p, ahead, isObstacle)) {
                const side = { x: p.x - (dy / length) * 140, y: p.y + (dx / length) * 140 };
                if (!fleet.lineClear(p, side, isObstacle)) speed = 0;
                const previousDx = dx;
                dx = -dy;
                dy = previousDx;
            }
            drone.body.setLinvel(
                {
                    x: ((dx / length) * speed) / GAME.pixelsPerMeter,
                    y: ((dy / length) * speed) / GAME.pixelsPerMeter,
                },
                true,
            );
            drone.body.setAngvel(0, true);
            if (!target) drone.body.setRotation(Math.atan2(dy, dx), true);
        }
    }

    damage(id: number, damage: number) {
        const drone = this.drones.get(id);
        if (!this.enabled || !drone || damage <= 0) return false;
        drone.quiet = 0;
        drone.state.hull = Math.max(0, drone.state.hull - damage);
        if (drone.state.hull > 0) return false;
        this.colliders.delete(drone.collider.handle);
        this.world.removeRigidBody(drone.body);
        this.drones.delete(id);
        return true;
    }

    clear() {
        for (const drone of this.drones.values()) this.world.removeRigidBody(drone.body);
        this.drones.clear();
        this.colliders.clear();
    }
}
