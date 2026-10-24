import { Container, Graphics } from 'pixi.js';
import type { StationProject } from '../state/stationProgression';
import { C } from './theme';

/** Distinct silhouettes and installed equipment for every discovered facility tier. */
export function stationDeviceScene(project: StationProject, level: number) {
    const root = new Container({ label: `station-art:${project}:${level}` });
    const g = root.addChild(new Graphics());
    const tier = Math.max(0, Math.min(3, level));
    const accent = project === 'laboratory' ? C.cyan : project === 'workshop' ? C.gold : 0xb49bea;
    g.roundRect(-255, -160, 510, 320, 36)
        .fill(0x263b55)
        .roundRect(-237, -142, 474, 266, 25)
        .fill(0x17283e)
        .roundRect(-235, 128, 470, 16, 8)
        .fill(0x698b9f);
    if (project === 'laboratory') {
        // Glassware and fluid circuit become a sealed reactor, then an analytical chamber.
        g.roundRect(-210, 72, 420, 25, 10).fill(0xa5c2c9);
        const flasks = tier >= 2 ? [-155, -60] : [-145, -20];
        for (const [i, x] of flasks.entries()) {
            g.roundRect(x - 10, -48, 20, 47, 5)
                .fill(0xa4d8df)
                .poly([x - 10, -6, x - 40, 57, x + 40, 57, x + 10, -6])
                .fill(0xb1d6df)
                .poly([x - 23, 24, x - 34, 51, x + 34, 51, x + 23, 24])
                .fill(i ? 0x8bb8df : C.mint);
            for (let bubble = 0; bubble < 3; bubble++)
                g.circle(x - 8 + bubble * 7, 35 - (bubble % 2) * 7, 3).fill(0xe5f5ed);
        }
        g.roundRect(61, -115, 127, 68, 12)
            .fill(0x66889b)
            .roundRect(70, -106, 109, 50, 7)
            .fill(0x0f2135);
        for (let i = 0; i < 4; i++)
            g.moveTo(82 + i * 22, -72)
                .lineTo(90 + i * 22, -92 + (i % 2) * 14)
                .stroke({ color: accent, width: 4 });
        if (tier >= 2) {
            g.roundRect(58, -27, 133, 89, 19)
                .fill(0x607e97)
                .roundRect(71, -14, 107, 63, 14)
                .fill(0x243b58)
                .ellipse(124, 18, 34, 24)
                .fill({ color: accent, alpha: 0.4 })
                .circle(124, 18, 13)
                .fill(tier >= 3 ? 0xc3a2f2 : C.mint);
            g.moveTo(-59, -70)
                .lineTo(-59, -93)
                .lineTo(28, -93)
                .lineTo(28, 18)
                .lineTo(58, 18)
                .stroke({ color: 0x80a5b5, width: 10 });
        } else {
            g.roundRect(74, -26, 105, 88, 14)
                .fill(0x7095aa)
                .circle(127, 14, 29)
                .fill(0x19344b)
                .circle(127, 14, 17)
                .fill(accent);
        }
        if (tier >= 3) {
            g.roundRect(-205, -123, 175, 49, 12).fill(0x57718b);
            for (let i = 0; i < 5; i++)
                g.roundRect(-190 + i * 30, -113, 18, 29, 6).fill(i % 2 ? C.mint : 0xb49bea);
            g.ellipse(124, 18, 49, 34).stroke({ color: 0xd0b8f0, width: 3 });
        }
    } else if (project === 'workshop') {
        // Assembly fixture, articulated tools and a conveyor with a real hull workpiece.
        g.roundRect(-205, 72, 410, 35, 15).fill(0x617e92);
        for (let x = -180; x <= 180; x += 45) g.circle(x, 89, 9).fill(0x263e56);
        g.poly([-81, 48, -54, 0, 24, -9, 90, 40, 55, 61, -46, 61])
            .fill(0xa7bdc6)
            .poly([-28, 2, 12, 0, 48, 28, -23, 30])
            .fill(accent);
        const arms = tier >= 2 ? [-170, 170] : [-170];
        for (const x of arms) {
            const direction = x < 0 ? 1 : -1;
            g.roundRect(x - 24, 19, 48, 52, 10)
                .fill(0x758fa4)
                .moveTo(x, 26)
                .lineTo(x - direction * 7, -56)
                .lineTo(x + direction * 78, -71)
                .lineTo(x + direction * 97, -26)
                .stroke({ color: 0x9dbbc7, width: 17 });
            for (const [a, b] of [
                [x, 26],
                [x - direction * 7, -56],
                [x + direction * 78, -71],
            ])
                g.circle(a, b, 11).fill(accent);
            g.poly([
                x + direction * 87,
                -28,
                x + direction * 101,
                -18,
                x + direction * 111,
                -33,
            ]).stroke({ color: accent, width: 7 });
        }
        if (tier >= 3) {
            g.roundRect(-210, -121, 420, 24, 10)
                .fill(0x6f8da5)
                .roundRect(-24, -118, 48, 39, 9)
                .fill(C.cyan)
                .moveTo(0, -79)
                .lineTo(0, -19)
                .stroke({ color: C.cyan, width: 4 });
            for (let x = -55; x <= 55; x += 22)
                g.moveTo(x, 52)
                    .lineTo(x + 7, 41)
                    .stroke({ color: C.gold, width: 3 });
        }
        g.roundRect(120, -125, 80, 50, 10)
            .fill(0x425f77)
            .roundRect(129, -116, 62, 32, 5)
            .fill(0x132a40);
        for (let i = 0; i < 3; i++) g.rect(138, -109 + i * 8, 20 + i * 10, 3).fill(C.mint);
    } else {
        // Anomaly intake: scanning before research, a contained extraction head after approval.
        const active = tier > 0;
        for (let i = 0; i < 5; i++) {
            const y = -111 + i * 39;
            g.moveTo(-218, y)
                .bezierCurveTo(-174, y - 40, -163, y + 44, -104, y - 9)
                .stroke({ color: accent, alpha: active ? 0.65 : 0.25, width: 6 });
        }
        g.roundRect(-58, -100, 92, 204, 29)
            .fill(0x69889e)
            .roundRect(-42, -77, 59, 158, 22)
            .fill(0x20374d)
            .ellipse(-13, 3, 24, 59)
            .stroke({ color: accent, width: 5 });
        if (active) {
            g.moveTo(-105, 0)
                .lineTo(-43, 0)
                .stroke({ color: accent, width: 9 })
                .moveTo(32, 0)
                .lineTo(99, 0)
                .lineTo(99, 64)
                .stroke({ color: 0x9db9c7, width: 17 });
            g.poly([-13, -27, 4, 0, -13, 27, -30, 0])
                .fill(0xc6a7f0)
                .roundRect(61, 55, 104, 52, 13)
                .fill(0x7195a7)
                .roundRect(74, 65, 78, 31, 8)
                .fill(accent);
            if (tier >= 2) {
                g.roundRect(66, -115, 101, 66, 13)
                    .fill(0x5c7f96)
                    .roundRect(77, -105, 79, 45, 9)
                    .fill(0x192e47)
                    .moveTo(112, -49)
                    .lineTo(112, -20)
                    .lineTo(32, -20)
                    .stroke({ color: 0x91b3c3, width: 10 });
                for (let i = 0; i < 3; i++)
                    g.circle(93 + i * 18, -83, 6).fill(i % 2 ? C.cyan : accent);
            }
            if (tier >= 3) {
                g.roundRect(-77, -120, 130, 246, 36).stroke({ color: 0xc6a7f0, width: 4 });
                for (const y of [-62, 62]) g.roundRect(-87, y - 10, 150, 20, 6).fill(0x96b8c7);
                g.roundRect(181, -31, 32, 139, 12).fill(0x7295a6);
                for (let i = 0; i < 4; i++)
                    g.roundRect(188, -18 + i * 28, 18, 17, 5).fill(i % 2 ? C.mint : accent);
            }
        } else {
            g.circle(114, 5, 55)
                .stroke({ color: 0x7fa7ba, width: 3 })
                .circle(114, 5, 25)
                .stroke({ color: accent, width: 3 })
                .moveTo(114, -50)
                .lineTo(114, 60)
                .moveTo(59, 5)
                .lineTo(169, 5)
                .stroke({ color: 0x7fa7ba, alpha: 0.4, width: 2 });
        }
    }
    for (let i = 0; i < Math.max(1, tier); i++)
        g.circle(-12 + i * 15 - (Math.max(1, tier) - 1) * 7.5, 136, 3).fill(accent);
    return root;
}
