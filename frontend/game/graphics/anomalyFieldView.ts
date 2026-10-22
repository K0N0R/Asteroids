import { Container, Graphics } from 'pixi.js';
import { AnomalyCloudView } from './anomalyCloudView';
import { ANOMALY, ANOMALY_BANDS } from '../systems/anomalyField';
import { hudLabel as label } from '../ui/hudIcons';

export function anomalyFieldView() {
    const view = Object.assign(new Container(), { cloud: new AnomalyCloudView(ANOMALY_BANDS) }),
        ink = new Graphics();
    view.eventMode = 'none';
    view.addChild(view.cloud);
    // Navigation stays above the cloud texture, including at band overlaps.
    view.addChild(ink);
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
