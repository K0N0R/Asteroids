import RAPIER from '@dimforge/rapier2d-compat';
import { GAME } from '../config';
import type { Point } from '../worlds/sector';
import type { EnemyFleet } from './enemies';

export const ENEMY_FACTORY = {
    position: { x: -2400, y: -1800 },
    radius: 90,
    health: 900,
    activateRange: 1200,
    firstLaunch: 6,
    interval: 14,
    limit: 4,
} as const;

export class EnemyFactory {
    collider: RAPIER.Collider | null;
    health: number;
    active = false;
    remaining: number = ENEMY_FACTORY.firstLaunch;
    launched = 0;
    readonly units = new Set<number>();
    constructor(
        private world: RAPIER.World,
        destroyed = false,
    ) {
        this.health = destroyed ? 0 : ENEMY_FACTORY.health;
        this.collider = destroyed
            ? null
            : world.createCollider(
                  RAPIER.ColliderDesc.ball(ENEMY_FACTORY.radius / GAME.pixelsPerMeter)
                      .setTranslation(
                          ENEMY_FACTORY.position.x / GAME.pixelsPerMeter,
                          ENEMY_FACTORY.position.y / GAME.pixelsPerMeter,
                      )
                      .setRestitution(0.3),
              );
    }
    get destroyed() {
        return this.health <= 0;
    }
    damage(amount: number) {
        if (this.destroyed || !Number.isFinite(amount) || amount <= 0) return false;
        this.health = Math.max(0, this.health - amount);
        if (!this.destroyed) return false;
        if (this.collider) this.world.removeCollider(this.collider, true);
        this.collider = null;
        return true;
    }
    update(dt: number, player: Point, fleet: EnemyFleet, blocked: (p: Point) => boolean) {
        for (const id of this.units) if (!fleet.enemies.has(id)) this.units.delete(id);
        if (this.destroyed) return false;
        const p = ENEMY_FACTORY.position;
        if (
            !this.active &&
            Math.hypot(player.x - p.x, player.y - p.y) < ENEMY_FACTORY.activateRange
        )
            this.active = true;
        if (!this.active) return false;
        if (this.units.size >= ENEMY_FACTORY.limit) {
            this.remaining = ENEMY_FACTORY.interval;
            return false;
        }
        this.remaining = Math.max(0, this.remaining - dt);
        if (this.remaining > 1e-8) return false;
        // Try all pads; never place a ship inside another physical body.
        for (let i = 0; i < 12; i++) {
            const a = ((i + this.launched) * Math.PI) / 6;
            const point = { x: p.x + Math.cos(a) * 220, y: p.y + Math.sin(a) * 220 };
            if (blocked(point)) continue;
            const id = 10000 + ++this.launched;
            fleet.add([
                {
                    ...point,
                    id,
                    phase: a,
                    kind: this.launched % 3 === 0 ? 'lancer' : 'patrol',
                    factorySpawn: true,
                    home: { ...p },
                },
            ]);
            this.units.add(id);
            this.remaining = ENEMY_FACTORY.interval;
            return true;
        }
        return false;
    }
}
