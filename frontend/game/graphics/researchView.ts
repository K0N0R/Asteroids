import { Container, Graphics } from 'pixi.js';

export function researchShipView() {
    const view = new Container(),
        g = new Graphics();
    const exhaust = new Graphics({ label: 'kepler-exhaust' });
    for (const y of [-19, 19]) {
        exhaust.poly([-39, y - 9, -80, y, -39, y + 9]).fill({ color: 0x64d9f1, alpha: 0.22 });
        exhaust.poly([-40, y - 5, -67, y, -40, y + 5]).fill({ color: 0x8ceaff, alpha: 0.8 });
        exhaust.poly([-40, y - 3, -54, y, -40, y + 3]).fill(0xe6fcff);
    }
    exhaust.visible = false;
    view.addChild(exhaust);
    for (const side of [-1, 1]) {
        g.roundRect(-24, side * 36 - 10, 48, 20, 8).fill(0x426b96);
        for (let x = -18; x <= 12; x += 10) g.roundRect(x, side * 36 - 6, 7, 12, 3).fill(0x729fc3);
        g.poly([
            -29,
            side * 19 - 9,
            -42,
            side * 19 - 12,
            -42,
            side * 19 + 12,
            -29,
            side * 19 + 9,
        ]).fill(0x354955);
        g.circle(-4, side * 28, 8)
            .fill(0x5c737f)
            .circle(-4, side * 28, 4)
            .fill(0x90c7d9);
    }
    g.ellipse(0, 0, 42, 26)
        .fill(0x697e89)
        .ellipse(-8, 0, 24, 22)
        .fill(0x3d5360)
        .roundRect(-24, -8, 18, 16, 4)
        .fill(0x9dafb7)
        .ellipse(18, 0, 18, 17)
        .fill(0x223c50)
        .ellipse(20, 0, 13, 12)
        .fill(0x91cbe2)
        .ellipse(24, -5, 5, 4)
        .fill({ color: 0xf1fbff, alpha: 0.8 })
        .circle(14, 6, 3)
        .fill({ color: 0xf1fbff, alpha: 0.55 })
        .roundRect(-10, -24, 18, 4, 2)
        .roundRect(-10, 20, 18, 4, 2)
        .fill(0x78b6b6);
    view.addChild(g);
    return view;
}
export function updateResearchDrive(view: Container, thrusting: boolean, time: number) {
    const exhaust =
        view.getChildByLabel('engine-exhaust') ?? view.getChildByLabel('kepler-exhaust');
    if (!exhaust) return;
    exhaust.visible = thrusting;
    // Scale around the nozzle, so the plume remains attached to the engine.
    const pulse = 0.9 + Math.sin(time * 37) * 0.08 + Math.sin(time * 53) * 0.04;
    exhaust.scale.set(pulse, 1);
    exhaust.x = -40 * (1 - pulse);
    exhaust.alpha = 0.85 + Math.sin(time * 29) * 0.15;
}
export function researchAnomalyView() {
    const view = new Container(),
        g = new Graphics();
    for (const r of [110, 160])
        g.beginPath().circle(0, 0, r).stroke({ color: 0x86b8db, width: 1, alpha: 0.22 });
    for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3,
            x = Math.cos(a) * 65,
            y = Math.sin(a) * 65;
        g.poly([x - 20, y - 10, x + 8, y - 36, x + 26, y + 6, x - 6, y + 28])
            .fill(0x3c4c65)
            .poly([x, y - 20, x + 10, y + 2, x - 3, y + 14, x - 10, y - 5])
            .fill(0x9bbbe0)
            .circle(x + 2, y, 30)
            .fill({ color: 0x77bce6, alpha: 0.05 });
    }
    g.circle(0, 0, 15).fill({ color: 0xbde5f6, alpha: 0.2 }).circle(0, 0, 6).fill(0xc4eaf3);
    view.addChild(g);
    return view;
}
