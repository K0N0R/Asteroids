import type { Point } from '../worlds/sector';
export class RadarTrail {
    readonly points: (Point & { time: number })[] = [];
    update(position: Point, time: number) {
        while (this.points.length && time - this.points[0].time > 75) this.points.shift();
        const last = this.points[this.points.length - 1];
        if (
            last &&
            (time - last.time < 0.25 || Math.hypot(position.x - last.x, position.y - last.y) < 80)
        )
            return;
        this.points.push({ ...position, time });
        if (this.points.length > 240) this.points.shift();
    }
    opacity(time: number, point: { time: number }) {
        return Math.max(0, 1 - (time - point.time) / 75) * 0.5;
    }
}
