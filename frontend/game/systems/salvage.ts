import { INTERACTION_SECONDS } from './interactionTarget';
import RAPIER from '@dimforge/rapier2d-compat';
import { GAME } from '../config';
import type { EnemyKind } from '../config';
import type { ResourceId, ResourceStore } from '../state/resources';
import { random, type Point } from '../worlds/sector';

export const SALVAGE = {
    chance: 0.35,
    limit: 12,
    range: 160,
    speed: 80,
    seconds: INTERACTION_SECONDS,
    shipment: { health: 100, radius: 34, ore: 0, parts: 0, crystals: 0 },
    satellite: { health: 80, radius: 35, ore: 0, parts: 0, crystals: 0 },
    patrol: { health: 70, radius: 24, parts: 4 },
    lancer: { health: 120, radius: 34, parts: 7 },
} as const;
export type ComponentTier = 1 | 2 | 3;
export function droneComponentTier(kind: EnemyKind, boss = false): ComponentTier {
    if (boss || kind === 'heavy') return 3;
    return kind === 'patrol' || kind === 'interceptor' ? 1 : 2;
}
/** A deterministic mix of finished hull, electronic and engine components. */
export function droneComponents(tier: ComponentTier, count: number): ResourceStore {
    const suffix = tier === 1 ? '' : tier === 2 ? 'II' : 'III';
    const kinds = ['parts', 'electronics', 'propulsion', 'powerModules', 'storageFrames'].map(
        (id) => `${id}${suffix}` as ResourceId,
    );
    const result: ResourceStore = {};
    for (let i = 0; i < count; i++) {
        const id = kinds[i % kinds.length];
        result[id] = (result[id] ?? 0) + 1;
    }
    return result;
}
export function wreckComponents(
    source: 'patrol' | 'lancer',
    tier: ComponentTier = source === 'lancer' ? 2 : 1,
) {
    return droneComponents(tier, SALVAGE[source].parts);
}
export function leavesWreck(seed: number, id: number) {
    return random(seed ^ Math.imul(id, 0x9e3779b1))() < SALVAGE.chance;
}
export interface SalvageBody {
    id: number;
    source: 'patrol' | 'lancer' | 'satellite' | 'recovery' | 'shipment';
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    radius: number;
    health: number;
    maxHealth: number;
    previous: Point;
    previousAngle: number;
    cooldown: number;
    componentTier: ComponentTier;
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
    /** Quest probes, rescue targets and shipments retain their interaction mechanics. */
    canDismantle(handle: number) {
        const item = this.items.get(this.colliders.get(handle)!);
        return !!item && item.id >= 0 && (item.source === 'patrol' || item.source === 'lancer');
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
        componentTier: ComponentTier = source === 'lancer' ? 2 : 1,
    ) {
        if (
            this.items.has(id) ||
            (id >= 0 &&
                source !== 'recovery' &&
                source !== 'shipment' &&
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
            componentTier,
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
        const used = new Set([...this.ropes.values()].map((rope) => rope.anchor.y));
        const slots =
            this.capacity === 1
                ? [0]
                : Array.from(
                      { length: this.capacity },
                      (_, i) => (i - (this.capacity - 1) / 2) * 52,
                  );
        const anchor = { x: -28, y: slots.find((y) => !used.has(y)) ?? 0 };
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
            const collider = this.towing.get(id)?.collider;
            collider?.setEnabled(true);
            collider?.setCollisionGroups(0x0002ffff);
            this.ropes.delete(id);
            this.towing.delete(id);
        }
    }
    beforeStep(dt: number, anchor: Point, angle = 0, transporting = false) {
        for (const item of this.items.values()) {
            if (!transporting || !this.towing.has(item.id)) {
                item.previous = salvagePosition(item);
                item.previousAngle = item.body.rotation();
            }
            item.cooldown = Math.max(0, item.cooldown - dt);
        }
        if (transporting) return;
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
        if (!this.items.has(item.id) || item.source === 'shipment') return false;
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
