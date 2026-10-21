import { Container, Graphics } from 'pixi.js';
import type { EnemyKind } from '../config';
import { roundedPanel, visor } from './shipHull';

/** Roles read through silhouette and fittings, not only a change of paint. */
export function enemyHull(kind: EnemyKind) {
    const root = new Container(),
        g = new Graphics();
    const heavy = kind === 'heavy',
        lancer = kind === 'lancer';
    const accent = kind === 'support' ? 0x8ddbc7 : kind === 'minelayer' ? 0xe5bb7f : 0xe49c99;
    const shells: Record<EnemyKind, number[]> = {
        patrol: [-28, -13, -12, -27, 12, -20, 28, -8, 28, 8, 12, 20, -12, 27, -28, 13],
        lancer: [
            -30, -16, -16, -34, 10, -31, 28, -16, 21, -8, 21, 8, 28, 16, 10, 31, -16, 34, -30, 16,
        ],
        interceptor: [-27, -7, -15, -19, 0, -11, 32, 0, 0, 11, -15, 19, -27, 7],
        heavy: [-37, -25, -24, -38, 15, -38, 34, -23, 38, 0, 34, 23, 15, 38, -24, 38, -37, 25],
        support: [-28, -21, -9, -27, 9, -18, 24, -11, 24, 11, 9, 18, -9, 27, -28, 21, -18, 0],
        minelayer: [-31, -25, 10, -28, 29, -14, 31, 14, 10, 28, -31, 25, -20, 0],
    };
    const shadow = shells[kind].map((n, i) => n + (i % 2 ? 3 : 0));
    roundedPanel(g, shadow, 5, 0x242e49);
    // Engine pods and cannon barrels sit below the armoured deck.
    const barrels = heavy ? [-17, 0, 17] : kind === 'support' || kind === 'minelayer' ? [] : [0];
    for (const y of barrels) {
        g.roundRect(10, y - 4, lancer ? 42 : heavy ? 35 : 30, 8, 3).fill(0x29344e);
        g.roundRect(20, y - 2, lancer ? 29 : 21, 4, 1).fill(0xc7d0df);
        g.roundRect(lancer ? 46 : 38, y - 4, 5, 8, 2).fill(0x65728e);
    }
    for (const side of [-1, 1]) {
        g.roundRect(-33, side * (heavy || lancer ? 17 : 10) - 6, 21, 12, 4).fill(0x34425c);
        g.roundRect(-34, side * (heavy || lancer ? 17 : 10) - 3, 6, 6, 2).fill(0x86dce7);
    }
    roundedPanel(g, shells[kind], 5, kind === 'support' ? 0x648c94 : heavy ? 0x8f849e : 0x8d91b3);
    roundedPanel(
        g,
        shells[kind].map((n) => n * 0.76),
        4,
        kind === 'support' ? 0xa6c8c8 : heavy ? 0xbab0c7 : 0xc1c5db,
    );
    g.roundRect(-20, -8, 25, 16, 5).fill(0x485675);
    if (heavy) {
        for (const side of [-1, 1]) {
            g.roundRect(-25, side * 27 - 6, 39, 12, 4).fill(0x656480);
            g.roundRect(-19, side * 27 - 3, 26, 6, 2).fill(accent);
        }
        g.roundRect(-7, -22, 8, 44, 3).fill(0x7b7898);
    } else if (kind === 'support') {
        g.roundRect(-5, -13, 8, 26, 2).roundRect(-14, -4, 26, 8, 2).fill(0x2d665f);
        for (const side of [-1, 1]) {
            g.circle(18, side * 15, 7)
                .fill(0x385168)
                .circle(18, side * 15, 4)
                .fill(accent);
        }
    } else if (kind === 'minelayer') {
        for (const side of [-1, 1])
            for (let i = 0; i < 3; i++) {
                const x = -20 + i * 12,
                    y = side * 19;
                g.roundRect(x - 5, y - 5, 10, 10, 3).fill(0x45506b);
                g.circle(x, y, 2.5).fill(accent);
            }
        g.roundRect(-34, -6, 15, 12, 3).fill(0x26354d);
    } else {
        for (const side of [-1, 1]) {
            g.roundRect(-14, side * (lancer ? 23 : 16) - 3, 23, 6, 2).fill(accent);
            if (kind === 'interceptor')
                g.moveTo(-18, side * 14)
                    .lineTo(11, side * 4)
                    .stroke({ color: 0x546783, width: 3, cap: 'round' });
        }
    }
    if (kind !== 'support')
        visor(g, heavy ? 13 : kind === 'minelayer' ? 12 : -4, 0, heavy ? 8 : 7, heavy ? 9 : 6);
    for (let i = 0; i < 3; i++) g.roundRect(-23 + i * 3, -4, 1.3, 8, 0.5).fill(0x2d3b54);
    root.addChild(g);
    return root;
}
