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
    view.label = 'recovery-probe';
    const panels = new Graphics();
    for (const side of [-1, 1]) {
        panels
            .moveTo(0, side * 14)
            .lineTo(0, side * 34)
            .stroke({ color: 0xa6aebb, width: 4 })
            .rect(-34, side < 0 ? -65 : 33, 68, 32)
            .fill(0x244d7b)
            .stroke({ color: 0x8cbed4, width: 2 });
        for (const x of [-17, 0, 17])
            panels
                .moveTo(x, side < 0 ? -65 : 33)
                .lineTo(x, side < 0 ? -33 : 65)
                .stroke({ color: 0x598cbd, width: 1 });
    }
    view.addChild(
        panels,
        new Graphics()
            .poly([-20, -13, -8, -23, 14, -18, 23, 0, 14, 18, -8, 23, -20, 13])
            .fill(0xd1b76a)
            .stroke({ color: 0x526583, width: 3 })
            .circle(-3, 0, 7)
            .fill(0x343f52)
            .moveTo(18, 0)
            .lineTo(44, 0)
            .stroke({ color: 0xd3d6df, width: 3 })
            .arc(48, 0, 18, Math.PI / 2, -Math.PI / 2)
            .lineTo(48, 18)
            .fill(0xe1e6ed)
            .stroke({ color: 0x8799ac, width: 2 })
            .moveTo(48, -18)
            .lineTo(68, 0)
            .lineTo(48, 18)
            .stroke({ color: 0xa7b6c7, width: 2 })
            .circle(68, 0, 3)
            .fill(0x69d9d3),
    );
    return view;
}
