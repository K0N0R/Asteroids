import RAPIER from '@dimforge/rapier2d-compat';
import { AEGIS, GAME } from '../config';
import type { Point } from '../worlds/sector';

export interface SupportDrone {
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    hull: number;
    cooldown: number;
}
export class AegisSupport {
    drone: SupportDrone | null = null;
    readonly hostiles = new Set<number>();
    readonly shields = new Map<string, { charge: number; capacity: number; time: number }>();
    cooldown = 0;
    pulsePressed = false;
    private angle = 0;

    constructor(
        private world: RAPIER.World,
        readonly droneLevel: number,
        readonly shieldLevel: number,
    ) {}

    get droneHull() {
        return AEGIS.droneHull * (1 + this.droneLevel * 0.25);
    }
    get droneDamage() {
        return AEGIS.droneDamage * (1 + this.droneLevel * 0.25);
    }
    get pulseCooldown() {
        return AEGIS.cooldown / (1 + this.shieldLevel * 0.2);
    }
    get dronePosition(): Point | null {
        const position = this.drone?.body.translation();
        return position
            ? { x: position.x * GAME.pixelsPerMeter, y: position.y * GAME.pixelsPerMeter }
            : null;
    }
    rebuild(position: Point) {
        if (this.drone) return false;
        const body = this.world.createRigidBody(
            RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
                (position.x + AEGIS.orbit) / GAME.pixelsPerMeter,
                position.y / GAME.pixelsPerMeter,
            ),
        );
        const collider = this.world.createCollider(
            RAPIER.ColliderDesc.ball(AEGIS.droneRadius / GAME.pixelsPerMeter)
                .setCollisionGroups(0x0008fff8)
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
            body,
        );
        this.drone = { body, collider, hull: this.droneHull, cooldown: 0 };
        this.angle = 0;
        return true;
    }
    update(dt: number, mother: Point) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        for (const [id, shield] of this.shields) {
            shield.time -= dt;
            if (shield.time <= 0 || shield.charge <= 0) this.shields.delete(id);
        }
        if (this.drone) {
            this.angle += dt * 1.2;
            this.drone.cooldown = Math.max(0, this.drone.cooldown - dt);
            this.drone.body.setNextKinematicTranslation({
                x: (mother.x + Math.cos(this.angle) * AEGIS.orbit) / GAME.pixelsPerMeter,
                y: (mother.y + Math.sin(this.angle) * AEGIS.orbit) / GAME.pixelsPerMeter,
            });
        }
    }
    pulse(mother: Point, allies: readonly (Point & { id: string })[]) {
        if (this.cooldown > 1e-8) return false;
        const capacity = AEGIS.buffer * (1 + this.shieldLevel * 0.25);
        for (const ally of [{ ...mother, id: 'player' }, ...allies])
            if (Math.hypot(ally.x - mother.x, ally.y - mother.y) <= AEGIS.range)
                this.shields.set(ally.id, { charge: capacity, capacity, time: AEGIS.duration });
        this.cooldown = this.pulseCooldown;
        return true;
    }
    absorb(id: string, damage: number) {
        const shield = this.shields.get(id);
        if (!shield) return damage;
        const absorbed = Math.min(shield.charge, damage);
        shield.charge -= absorbed;
        return damage - absorbed;
    }
    damageDrone(damage: number) {
        if (!this.drone) return false;
        this.drone.hull = Math.max(0, this.drone.hull - this.absorb('drone', damage));
        if (this.drone.hull > 0) return false;
        this.world.removeRigidBody(this.drone.body);
        this.drone = null;
        this.shields.delete('drone');
        return true;
    }
    dispose() {
        if (this.drone) this.world.removeRigidBody(this.drone.body);
        this.drone = null;
        this.shields.clear();
        this.hostiles.clear();
    }
}
