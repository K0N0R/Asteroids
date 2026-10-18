import RAPIER from '@dimforge/rapier2d-compat';
import { ENEMY_MINES as M, GAME } from '../config';
import type { Point } from '../worlds/sector';
import { enemyPosition, type Enemy, type EnemyFleet } from './enemies';

export interface EnemyMine extends Point {
    id: number;
    owner: number;
    collider: RAPIER.Collider;
    armRemaining: number;
    life: number;
    health: number;
}

export class EnemyMines {
    readonly mines = new Map<number, EnemyMine>();
    readonly colliders = new Map<number, number>();
    private cooldowns = new Map<number, number>();
    private sequence = 0;

    constructor(private world: RAPIER.World) {}

    private lay(
        owner: Enemy,
        safeRadius: number,
        isObstacle: (collider: RAPIER.Collider) => boolean,
    ) {
        if (
            this.mines.size >= M.limit ||
            [...this.mines.values()].filter((mine) => mine.owner === owner.id).length >=
                M.limitPerLayer
        )
            return;
        const position = enemyPosition(owner),
            angle = owner.body.rotation();
        const offset = owner.config.radius + M.radius + 10;
        const point = {
            x: position.x - Math.cos(angle) * offset,
            y: position.y - Math.sin(angle) * offset,
        };
        if (Math.hypot(point.x, point.y) < safeRadius + M.radius) return;
        const occupied = this.world.intersectionWithShape(
            { x: point.x / GAME.pixelsPerMeter, y: point.y / GAME.pixelsPerMeter },
            0,
            new RAPIER.Ball(M.radius / GAME.pixelsPerMeter),
            undefined,
            undefined,
            undefined,
            undefined,
            (collider) => isObstacle(collider) || this.colliders.has(collider.handle),
        );
        if (occupied) return;
        const collider = this.world.createCollider(
            RAPIER.ColliderDesc.ball(M.radius / GAME.pixelsPerMeter)
                .setTranslation(point.x / GAME.pixelsPerMeter, point.y / GAME.pixelsPerMeter)
                .setSensor(true),
        );
        const id = ++this.sequence;
        const mine: EnemyMine = {
            ...point,
            id,
            owner: owner.id,
            collider,
            armRemaining: M.armSeconds,
            life: M.lifetime,
            health: M.hull,
        };
        this.mines.set(id, mine);
        this.colliders.set(collider.handle, id);
    }

    update(
        dt: number,
        fleet: EnemyFleet,
        safeRadius: number,
        targets: readonly Point[],
        isObstacle: (collider: RAPIER.Collider) => boolean,
        detonate: (mine: EnemyMine) => void,
    ) {
        for (const mine of [...this.mines.values()]) {
            mine.life -= dt;
            mine.armRemaining = Math.max(0, mine.armRemaining - dt);
            if (mine.life <= 0 || Math.hypot(mine.x, mine.y) < safeRadius + M.radius) {
                this.remove(mine.id);
                continue;
            }
            if (mine.armRemaining > 1e-8) continue;
            const triggered = targets.some((target) => {
                if (
                    Math.hypot(target.x, target.y) < safeRadius ||
                    Math.hypot(target.x - mine.x, target.y - mine.y) > M.triggerRadius
                )
                    return false;
                return fleet.lineClear(mine, target, isObstacle);
            });
            if (triggered) {
                this.remove(mine.id);
                detonate(mine);
            }
        }
        for (const id of this.cooldowns.keys())
            if (!fleet.enemies.has(id)) this.cooldowns.delete(id);
        for (const owner of fleet.enemies.values()) {
            if (owner.kind !== 'minelayer' || owner.state !== 'chase' || owner.weaponDisabled)
                continue;
            const remaining = Math.max(0, (this.cooldowns.get(owner.id) ?? M.interval) - dt);
            this.cooldowns.set(owner.id, remaining);
            if (remaining > 1e-8) continue;
            this.lay(owner, safeRadius, isObstacle);
            this.cooldowns.set(owner.id, M.interval);
        }
    }

    damage(id: number, amount: number) {
        const mine = this.mines.get(id);
        if (!mine || !Number.isFinite(amount) || amount <= 0) return null;
        mine.health = Math.max(0, mine.health - amount);
        if (mine.health > 0) return null;
        this.remove(id);
        return mine;
    }

    private remove(id: number) {
        const mine = this.mines.get(id);
        if (!mine) return;
        this.colliders.delete(mine.collider.handle);
        this.world.removeCollider(mine.collider, true);
        this.mines.delete(id);
    }

    removeOwners(owners: ReadonlySet<number>) {
        for (const mine of [...this.mines.values()])
            if (owners.has(mine.owner)) this.remove(mine.id);
        for (const owner of owners) this.cooldowns.delete(owner);
    }
    clear() {
        for (const id of this.mines.keys()) this.remove(id);
        this.cooldowns.clear();
    }
}
