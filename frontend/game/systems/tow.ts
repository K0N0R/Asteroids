import type { Point } from '../worlds/sector';
import { angleDifference } from './flight';

export class TowBody {
    position: Point;
    previous: Point;
    velocity: Point;
    angle = 0;
    previousAngle = 0;
    constructor(
        position: Point,
        velocity: Point,
        private separation = 85,
    ) {
        this.position = { ...position };
        this.previous = { ...position };
        this.velocity = { ...velocity };
    }
    step(dt: number, anchor: Point, shipAngle: number) {
        this.previous = { ...this.position };
        this.previousAngle = this.angle;
        const dx = anchor.x - this.position.x,
            dy = anchor.y - this.position.y;
        const distance = Math.hypot(dx, dy);
        // The rope pulls only when stretched; the cargo keeps drifting on a slack rope.
        const pull = Math.max(0, distance - 110) * 16;
        const damping = Math.exp(-1.4 * dt);
        this.velocity.x = (this.velocity.x + (dx / Math.max(1, distance)) * pull * dt) * damping;
        this.velocity.y = (this.velocity.y + (dy / Math.max(1, distance)) * pull * dt) * damping;
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        const length = Math.hypot(anchor.x - this.position.x, anchor.y - this.position.y);
        if (length > 230) {
            const nx = (anchor.x - this.position.x) / length,
                ny = (anchor.y - this.position.y) / length;
            this.position.x = anchor.x - nx * 230;
            this.position.y = anchor.y - ny * 230;
            const away = Math.min(0, this.velocity.x * nx + this.velocity.y * ny);
            this.velocity.x -= away * nx;
            this.velocity.y -= away * ny;
        }
        // Keep the recovered object outside the ship while allowing tangential swing.
        const ship = {
            x: anchor.x + Math.cos(shipAngle) * 28,
            y: anchor.y + Math.sin(shipAngle) * 28,
        };
        const sx = this.position.x - ship.x,
            sy = this.position.y - ship.y,
            gap = Math.hypot(sx, sy);
        if (gap < this.separation) {
            const nx = gap > 0.001 ? sx / gap : -Math.cos(shipAngle),
                ny = gap > 0.001 ? sy / gap : -Math.sin(shipAngle);
            this.position.x = ship.x + nx * this.separation;
            this.position.y = ship.y + ny * this.separation;
            const inward = Math.min(0, this.velocity.x * nx + this.velocity.y * ny);
            this.velocity.x -= inward * nx;
            this.velocity.y -= inward * ny;
        }
        const facing =
            length > 25
                ? Math.atan2(anchor.y - this.position.y, anchor.x - this.position.x)
                : shipAngle;
        this.angle += angleDifference(facing, this.angle) * (1 - Math.exp(-2.5 * dt));
    }
}
