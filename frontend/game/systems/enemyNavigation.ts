import { enemyPosition, type EnemyFleet } from './enemies';
import type { Point } from '../worlds/sector';

/** Keep a chosen moving target until destroyed; nearby drones do not cause flickering. */
export class EnemyNavigation {
    selectedId: number | null = null;
    select(fleet: EnemyFleet, player: Point) {
        let distance = Infinity;
        this.selectedId = null;
        for (const enemy of fleet.enemies.values()) {
            const p = enemyPosition(enemy),
                d = Math.hypot(p.x - player.x, p.y - player.y);
            if (d < distance) {
                distance = d;
                this.selectedId = enemy.id;
            }
        }
    }
    waypoint(fleet: EnemyFleet, player: Point) {
        if (this.selectedId === null || !fleet.enemies.has(this.selectedId))
            this.select(fleet, player);
        const enemy = this.selectedId === null ? undefined : fleet.enemies.get(this.selectedId);
        return enemy
            ? { ...enemyPosition(enemy), name: `${enemy.config.name} #${enemy.id}` }
            : { x: 0, y: 0, name: 'Aurora / brak dronów' };
    }
}
