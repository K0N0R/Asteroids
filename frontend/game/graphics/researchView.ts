import { Container, Graphics } from 'pixi.js';

export function researchShipView() {
    const view = new Container(),
        g = new Graphics();
    for (const side of [-1, 1]) {
        g.roundRect(-24, side * 36 - 10, 48, 20, 4)
            .fill(0x294556)
            .stroke({ color: 0x849da9, width: 1.5 });
        for (let x = -16; x <= 16; x += 8)
            g.moveTo(x, side * 36 - 8)
                .lineTo(x, side * 36 + 8)
                .stroke({ color: 0x4b6a80, width: 1 });
        g.poly([-29, side * 19 - 9, -42, side * 19 - 12, -42, side * 19 + 12, -29, side * 19 + 9])
            .fill(0x354955)
            .stroke({ color: 0x94a7ae, width: 1 });
        g.circle(-4, side * 28, 8)
            .fill(0x5c737f)
            .stroke({ color: 0xb3c9d3, width: 1 })
            .circle(-4, side * 28, 4)
            .fill(0x90c7d9);
    }
    g.ellipse(0, 0, 42, 26)
        .fill(0x697e89)
        .stroke({ color: 0xbbcbd2, width: 2 })
        .ellipse(-8, 0, 24, 22)
        .fill(0x3d5360)
        .roundRect(-24, -8, 18, 16, 4)
        .fill(0x9dafb7)
        .ellipse(18, 0, 18, 17)
        .fill(0x223c50)
        .stroke({ color: 0xa4c6d6, width: 2 })
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
            .stroke({ color: 0x93a6bd, width: 2 })
            .poly([x, y - 20, x + 10, y + 2, x - 3, y + 14, x - 10, y - 5])
            .fill(0x9bbbe0)
            .circle(x + 2, y, 30)
            .fill({ color: 0x77bce6, alpha: 0.05 });
    }
    g.circle(0, 0, 15).fill({ color: 0xbde5f6, alpha: 0.2 }).circle(0, 0, 6).fill(0xc4eaf3);
    view.addChild(g);
    return view;
}
