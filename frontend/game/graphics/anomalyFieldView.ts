import { Container, Graphics } from 'pixi.js';
import { ANOMALY, ANOMALY_BANDS } from '../systems/anomalyField';
import { label } from '../ui/primitives';

export function anomalyFieldView() {
    const view = new Container(),
        ink = new Graphics();
    view.eventMode = 'none';
    view.addChild(ink);
    for (const band of ANOMALY_BANDS) {
        const coordinates = band.flatMap((p) => [p.x, p.y]);
        ink.poly(coordinates)
            .fill({ color: 0x4a225f, alpha: 0.65 })
            .stroke({ color: 0xce6ddd, width: 5, alpha: 0.85 });
        const center = band.reduce(
            (sum, p) => ({ x: sum.x + p.x / band.length, y: sum.y + p.y / band.length }),
            { x: 0, y: 0 },
        );
        for (const point of band)
            ink.moveTo(center.x, center.y)
                .lineTo(point.x, point.y)
                .stroke({ color: 0xad55c6, width: 2, alpha: 0.16 });
    }
    const points = [...ANOMALY.waypoints, ANOMALY.probe];
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i],
            b = points[i + 1],
            distance = Math.hypot(b.x - a.x, b.y - a.y);
        for (let step = 0; step < distance; step += 90) {
            const t = step / distance;
            ink.circle(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 4).fill({
                color: 0x71dab3,
                alpha: 0.4,
            });
        }
    }
    ANOMALY.waypoints.forEach((p, i) => {
        ink.circle(p.x, p.y, 90).stroke({ color: 0x71dab3, width: 3, alpha: 0.7 });
        const text = label(view, `${3 + i} · KORYTARZ`, p.x - 55, p.y + 105, 16, 0x71dab3);
        text.rotation = 0;
    });
    return view;
}

export function recoveryProbeView() {
    const view = new Container();
    view.addChild(
        new Graphics()
            .roundRect(-24, -19, 48, 38, 9)
            .fill(0xc1c9d4)
            .stroke({ color: 0x526583, width: 3 })
            .rect(-14, -51, 28, 26)
            .fill(0x597fa8)
            .stroke({ color: 0x8cbed4, width: 2 })
            .rect(-14, 25, 28, 26)
            .fill(0x597fa8)
            .stroke({ color: 0x8cbed4, width: 2 })
            .circle(5, 0, 10)
            .fill(0x69d9d3)
            .moveTo(23, 0)
            .lineTo(42, 0)
            .stroke({ color: 0xd3d6df, width: 3 })
            .circle(44, 0, 5)
            .fill(0xf5d572),
    );
    return view;
}
