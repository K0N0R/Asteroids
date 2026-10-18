import { segmentDistance, type Hyperlane } from '../systems/hyperdrive';
import { random, type Point, type RockSpec } from './sector';

export interface AsteroidDrift extends Point {
    radius: number;
    phase: number;
}

// A slow, bounded tidal flow. Rapier still resolves impacts; never teleport a rock.
export function driftVelocity(
    p: Point,
    velocity: Point,
    drift: AsteroidDrift,
    time: number,
    dt: number,
) {
    const goal = {
        x: drift.x + Math.sin(time * 0.041 + drift.phase) * drift.radius * 0.65,
        y: drift.y + Math.sin(time * 0.029 + drift.phase * 1.7) * drift.radius * 0.65,
    };
    const dx = (goal.x - p.x) * 0.12,
        dy = (goal.y - p.y) * 0.12,
        scale = Math.min(1, 6 / Math.max(0.001, Math.hypot(dx, dy))),
        ex = dx * scale - velocity.x,
        ey = dy * scale - velocity.y,
        response = Math.min(1, (1.8 * dt) / Math.max(0.001, Math.hypot(ex, ey)));
    return { x: velocity.x + ex * response, y: velocity.y + ey * response };
}

export function driftingField(
    seed: number,
    center: Point,
    lanes: readonly Hyperlane[],
): RockSpec[] {
    const rng = random(seed),
        rocks: RockSpec[] = [];
    const groups = [
        { x: -220, y: -20 },
        { x: 220, y: 20 },
        { x: 0, y: -260 },
    ];
    for (let i = 0; i < 12; i++) {
        for (let attempt = 0; attempt < 1000; attempt++) {
            const group = groups[i % groups.length],
                angle = rng() * Math.PI * 2,
                distance = Math.sqrt(rng()) * 130,
                radius = 28 + (i % 3) * 5,
                excursion = 35 + rng() * 20,
                p = {
                    x: center.x + group.x + Math.cos(angle) * distance,
                    y: center.y + group.y + Math.sin(angle) * distance,
                };
            if (
                Math.hypot(p.x - center.x, p.y - center.y) > 410 ||
                lanes.some((l) => segmentDistance(p, l.a, l.b) <= radius + excursion + 150) ||
                rocks.some((r) => Math.hypot(r.x - p.x, r.y - p.y) <= r.radius + radius + 25)
            )
                continue;
            rocks.push({
                ...p,
                radius,
                rich: true,
                copper: i % 3 === 0,
                variant: Math.floor(rng() * 128),
                vx: 0,
                vy: 0,
                drift: { ...p, radius: excursion, phase: rng() * Math.PI * 2 },
            });
            break;
        }
    }
    return rocks;
}
