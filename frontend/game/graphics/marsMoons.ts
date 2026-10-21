import { Container, Graphics } from 'pixi.js';

export type MarsMoonId = 'phobos' | 'deimos';

/** Independent reusable artwork; no orbit, mission point or collision geometry. */
export function marsMoonView(id: MarsMoonId) {
    const root = new Container();
    root.eventMode = 'none';
    root.label = `mars-moon-${id}`;
    const phobos = id === 'phobos';
    const body = new Container(),
        g = new Graphics();
    const outline = (ink: Graphics, color: number) => {
        if (phobos) {
            ink.moveTo(-70, 38)
                .bezierCurveTo(-84, 12, -62, -40, -33, -58)
                .bezierCurveTo(-14, -76, 17, -63, 35, -43)
                .bezierCurveTo(53, -32, 72, -6, 72, 22)
                .bezierCurveTo(77, 40, 42, 46, 13, 50)
                .bezierCurveTo(-18, 65, -47, 64, -70, 38);
        } else {
            ink.moveTo(-70, -18)
                .bezierCurveTo(-77, -42, -49, -54, -29, -50)
                .bezierCurveTo(-13, -67, 9, -61, 30, -49)
                .bezierCurveTo(54, -51, 60, -33, 69, -10)
                .bezierCurveTo(82, 11, 62, 33, 48, 44)
                .bezierCurveTo(29, 58, 4, 55, -20, 53)
                .bezierCurveTo(-47, 58, -58, 29, -63, 8)
                .bezierCurveTo(-71, -1, -64, -10, -70, -18);
        }
        ink.closePath().fill(color);
    };
    outline(g, phobos ? 0xb5a58c : 0x898182);
    const mask = new Graphics();
    outline(mask, 0xffffff);
    body.addChild(g, mask);
    body.mask = mask;
    g.ellipse(-22, -20, 63, 47).fill(phobos ? 0xd4c6a4 : 0xa69c93);
    g.ellipse(-24, -34, 40, 23).fill(phobos ? 0xe5dbb9 : 0xb4aaa0);
    g.moveTo(-78, 21)
        .bezierCurveTo(-24, 5, -10, 43, 78, 0)
        .lineTo(80, 75)
        .lineTo(-80, 75)
        .closePath()
        .fill(phobos ? 0x8e867b : 0x716e78);
    // Broad surface patches and asymmetric crater rims suggest regolith and relief.
    for (const [x, y, rx, ry] of [
        [-38, -18, 17, 11],
        [7, -34, 18, 10],
        [40, 6, 20, 14],
        [-29, 34, 18, 10],
    ])
        g.ellipse(x, y, rx, ry).fill({ color: phobos ? 0xe0d3b6 : 0xb1a69b, alpha: 0.3 });
    const craters = phobos
        ? [
              [27, -5, 18],
              [-31, 16, 8],
              [1, 34, 6],
              [-24, -39, 5],
              [46, 25, 6],
              [-48, -8, 4],
          ]
        : [
              [-22, -23, 10],
              [23, 13, 8],
              [-43, 5, 5],
              [6, -37, 5],
              [39, -16, 4],
              [-5, 37, 5],
              [48, 25, 3],
          ];
    for (const [x, y, r] of craters) {
        g.ellipse(x - 1, y - 2, r + 2, r * 0.83 + 2).fill(phobos ? 0xe4d6b3 : 0xc0b3a1);
        g.ellipse(x, y, r, r * 0.82).fill(phobos ? 0x8a7d6c : 0x6f6970);
        g.ellipse(x + 2, y + 2, r * 0.7, r * 0.54).fill(phobos ? 0xa7977d : 0x918986);
    }
    if (phobos) {
        for (let i = 0; i < 5; i++)
            g.moveTo(-45 + i * 13, 5)
                .bezierCurveTo(-27 + i * 11, 0, -22 + i * 12, 24, -7 + i * 11, 33)
                .stroke({ color: 0x706c65, width: 1.4, alpha: 0.35, cap: 'round' });
    } else {
        for (const [x, y] of [
            [-51, -25],
            [-39, -37],
            [3, 4],
            [30, 39],
            [49, -1],
            [-18, 42],
        ])
            g.circle(x, y, 2).fill(0x716b6c);
    }
    g.moveTo(28, -72)
        .bezierCurveTo(52, -17, 12, 19, -24, 68)
        .lineTo(90, 70)
        .lineTo(90, -75)
        .closePath()
        .fill({ color: 0x252b42, alpha: 0.22 });
    root.addChild(body);
    return root;
}
