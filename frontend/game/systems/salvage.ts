import RAPIER from '@dimforge/rapier2d-compat';
import { GAME } from '../config';
import { random, type Point } from '../worlds/sector';

export const SALVAGE = {
    chance: 0.35,
    limit: 12,
    range: 160,
    speed: 80,
    seconds: 3,
    satellite: { health: 80, radius: 35, ore: 0, parts: 0, crystals: 0 },
    patrol: { health: 70, radius: 24, ore: 8, parts: 4, crystals: 0 },
    lancer: { health: 120, radius: 34, ore: 12, parts: 7, crystals: 1 },
} as const;
export function leavesWreck(seed: number, id: number) {
    return random(seed ^ Math.imul(id, 0x9e3779b1))() < SALVAGE.chance;
}
export interface SalvageBody {
    id: number;
    source: 'patrol' | 'lancer' | 'satellite' | 'recovery';
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    radius: number;
    health: number;
    maxHealth: number;
    previous: Point;
    previousAngle: number;
    cooldown: number;
}
const P = GAME.pixelsPerMeter;
export function salvagePosition(item: SalvageBody): Point {
    const p = item.body.translation();
    return { x: p.x * P, y: p.y * P };
}
export class SalvageFleet {
    readonly items = new Map<number, SalvageBody>();
    readonly colliders = new Map<number, number>();
    readonly towing = new Map<number, SalvageBody>();
    private ropes = new Map<number, { joint: RAPIER.ImpulseJoint; anchor: Point }>();
    constructor(
        private world: RAPIER.World,
        readonly capacity = 1,
    ) {}
    get towed() {
        return this.towing.values().next().value ?? null;
    }
    get full() {
        return this.towing.size >= this.capacity;
    }
    towAnchor(item: SalvageBody): Point {
        return this.ropes.get(item.id)?.anchor ?? { x: -28, y: 0 };
    }
    add(
        id: number,
        source: SalvageBody['source'],
        position: Point,
        velocity: Point,
        angle = 0,
        capsule = false,
    ) {
        if (
            this.items.has(id) ||
            (source !== 'recovery' &&
                [...this.items.values()].filter((item) => item.source !== 'recovery').length >=
                    SALVAGE.limit)
        )
            return null;
        const profile =
            source === 'recovery'
                ? { radius: capsule ? 17 : 38, health: capsule ? 45 : 120 }
                : SALVAGE[source];
        const body = this.world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(position.x / P, position.y / P)
                .setLinvel(velocity.x / P, velocity.y / P)
                .setRotation(angle)
                .setLinearDamping(0.35)
                .setAngularDamping(0.8)
                .setCcdEnabled(true),
        );
        const collider = this.world.createCollider(
            RAPIER.ColliderDesc.ball(profile.radius / P)
                .setCollisionGroups(0x0002ffff)
                .setDensity(2)
                .setRestitution(0.25)
                .setFriction(0.2)
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
            body,
        );
        const item: SalvageBody = {
            id,
            source,
            body,
            collider,
            radius: profile.radius,
            health: profile.health,
            maxHealth: profile.health,
            previous: { ...position },
            previousAngle: angle,
            cooldown: 0,
        };
        this.items.set(id, item);
        this.colliders.set(collider.handle, id);
        return item;
    }
    attach(item: SalvageBody, ship: RAPIER.RigidBody) {
        if (this.full || this.towing.has(item.id) || !this.items.has(item.id)) return false;
        const anchor = {
            x: -28,
            y:
                this.capacity === 1
                    ? 0
                    : [...this.ropes.values()].some((rope) => rope.anchor.y === -26)
                      ? 26
                      : -26,
        };
        const joint = this.world.createImpulseJoint(
            RAPIER.JointData.rope(2.3, { x: anchor.x / P, y: anchor.y / P }, { x: 0, y: 0 }),
            ship,
            item.body,
            true,
        );
        joint.setContactsEnabled(false);
        if (this.capacity > 1) item.collider.setCollisionGroups(0x0010ffef);
        this.ropes.set(item.id, { joint, anchor });
        this.towing.set(item.id, item);
        return true;
    }
    detach(item?: SalvageBody) {
        for (const [id, rope] of this.ropes) {
            if (item && id !== item.id) continue;
            this.world.removeImpulseJoint(rope.joint, true);
            this.towing.get(id)?.collider.setCollisionGroups(0x0002ffff);
            this.ropes.delete(id);
            this.towing.delete(id);
        }
    }
    beforeStep(dt: number, anchor: Point, angle = 0) {
        for (const item of this.items.values()) {
            item.previous = salvagePosition(item);
            item.previousAngle = item.body.rotation();
            item.cooldown = Math.max(0, item.cooldown - dt);
        }
        for (const item of this.towing.values()) {
            const offset = this.towAnchor(item).y,
                p = salvagePosition(item),
                dx = anchor.x - Math.sin(angle) * offset - p.x,
                dy = anchor.y + Math.cos(angle) * offset - p.y,
                d = Math.hypot(dx, dy);
            // Gentle tension leaves slack and swing; Rapier's rope sets the maximum length.
            const pull = (Math.max(0, d - 110) * 12 * dt) / P;
            item.body.applyImpulse(
                {
                    x: (dx / Math.max(1, d)) * pull * item.body.mass(),
                    y: (dy / Math.max(1, d)) * pull * item.body.mass(),
                },
                true,
            );
        }
    }
    damage(item: SalvageBody, amount: number) {
        if (!this.items.has(item.id)) return false;
        item.health = Math.max(0, item.health - amount);
        if (item.health > 0) return false;
        this.remove(item);
        return true;
    }
    remove(item: SalvageBody) {
        if (!this.items.has(item.id)) return;
        if (this.towing.has(item.id)) this.detach(item);
        this.colliders.delete(item.collider.handle);
        this.items.delete(item.id);
        this.world.removeRigidBody(item.body);
    }
    dispose() {
        this.detach();
        for (const item of this.items.values()) this.world.removeRigidBody(item.body);
        this.items.clear();
        this.colliders.clear();
    }
}
