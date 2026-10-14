import type { Point } from '../worlds/sector';

/** First entry into a circular shield, including projectiles that start inside it. */
export function shieldEntry(from: Point, to: Point, radius: number): Point | null {
    if (Math.hypot(from.x, from.y) < radius) return { ...from };
    const dx = to.x - from.x,
        dy = to.y - from.y;
    const a = dx * dx + dy * dy;
    if (a < 1e-12) return null;
    const b = 2 * (from.x * dx + from.y * dy);
    const c = from.x * from.x + from.y * from.y - radius * radius;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;
    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    if (t < 0 || t > 1 || b >= 0) return null;
    return { x: from.x + dx * t, y: from.y + dy * t };
}

export function impactParticleCount(kind: string, strength = 12) {
    if (kind === 'weld') return 10;
    if (kind === 'collect') return 3;
    if (kind === 'shield') return Math.min(32, 8 + Math.ceil(strength * 0.5));
    if (kind === 'break') return Math.min(100, 30 + Math.ceil(strength));
    return Math.min(55, 4 + Math.ceil(Math.max(0, strength) * 1.2));
}
