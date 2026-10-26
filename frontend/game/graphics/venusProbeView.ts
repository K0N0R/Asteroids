import { Container, Graphics } from 'pixi.js';

export function venusProbeView() {
    const root = new Container();
    root.label = 'venus-atmospheric-probe';
    const flame = new Graphics({ label: 'engine-exhaust' });
    flame
        .poly([-39, -7, -83, 0, -39, 7])
        .fill({ color: 0x71dfee, alpha: 0.3 })
        .poly([-40, -4, -65, 0, -40, 4])
        .fill(0xc2f5ee);
    flame.visible = false;
    const g = new Graphics();
    root.addChild(flame, g);
    g.roundRect(-43, -10, 19, 20, 4).fill(0x314657).stroke({ color: 0xbac5b5, width: 2 });
    g.poly([-30, -17, 11, -22, 28, -14, 32, 14, 11, 22, -30, 17])
        .fill(0xb7c0b2)
        .stroke({ color: 0x43586a, width: 3 });
    g.ellipse(25, 0, 10, 25).fill(0x544b43).stroke({ color: 0xe2c29a, width: 4 });
    for (const sign of [-1, 1]) {
        g.moveTo(-15, sign * 16)
            .lineTo(-24, sign * 34)
            .lineTo(11, sign * 31)
            .stroke({ color: 0x97b3b5, width: 4 });
        g.roundRect(-26, sign * 34 - 5, 38, 10, 3)
            .fill(0x3f647b)
            .stroke({ color: 0xb3c6be, width: 1.5 });
        for (let i = 0; i < 4; i++) g.rect(-21 + i * 8, sign * 34 - 3, 5, 6).fill(0x8cb8c2);
    }
    g.roundRect(-19, -10, 26, 20, 4)
        .fill(0x314b5f)
        .stroke({ color: 0xd9c9a7, width: 1.5 })
        .circle(13, 0, 4)
        .fill(0x8ee6da);
    g.moveTo(-14, -15)
        .lineTo(-36, -37)
        .stroke({ color: 0xcbd1be, width: 3 })
        .ellipse(-38, -39, 12, 6)
        .fill(0xa2c4c8)
        .stroke({ color: 0xe6dfc4, width: 2 })
        .circle(-38, -42, 2)
        .fill(0x7ee3d6);
    for (const y of [-12, 12]) g.circle(-23, y, 2).fill(0x556a78);
    return root;
}
