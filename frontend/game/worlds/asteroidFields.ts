import { segmentDistance, type Hyperlane } from '../systems/hyperdrive';
import { random, type Point, type RockSpec } from './sector';

export interface AsteroidDrift extends Point {
    radius: number;
    phase: number;
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

// Do not let collisions or sleeping physics turn orbital resources into static scenery.
export function cruisingVelocity(v: Point, variant: number, massive = false): Point {
    const minimum = massive ? 0.5 : 2.5;
    if (Math.hypot(v.x, v.y) >= minimum) return v;
    const angle = variant * 2.399963;
    return { x: Math.cos(angle) * (massive ? 1 : 3), y: Math.sin(angle) * (massive ? 1 : 3) };
}
export function recycleAsteroid(
    p: Point,
    v: Point,
    radius: number,
    size: number,
    rng: () => number,
) {
    const edge = radius + Math.max(400, size * 3);
    if (Math.hypot(p.x, p.y) <= edge) return null;
    const angle = Math.atan2(p.y, p.x) + Math.PI + (rng() - 0.5) * 0.7;
    const position = { x: Math.cos(angle) * edge, y: Math.sin(angle) * edge };
    const targetAngle = rng() * Math.PI * 2,
        targetRadius = Math.sqrt(rng()) * radius * 0.65;
    const dx = Math.cos(targetAngle) * targetRadius - position.x,
        dy = Math.sin(targetAngle) * targetRadius - position.y,
        length = Math.hypot(dx, dy),
        speed = Math.max(0.6, Math.min(85, Math.hypot(v.x, v.y)));
    return { position, velocity: { x: (dx / length) * speed, y: (dy / length) * speed } };
}
