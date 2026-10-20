import { Container, Graphics } from 'pixi.js';
import { C } from './theme';
import { FACE_PROPORTIONS, type PortraitAppearance } from './portraitAppearance';

function hairBack(g: Graphics, p: PortraitAppearance) {
    const color = p.hairColor;
    if (['bob', 'waves', 'long', 'fringe'].includes(p.hair)) {
        const bottom = p.hair === 'long' ? 73 : p.hair === 'waves' ? 36 : 10;
        g.moveTo(-51, -59)
            .bezierCurveTo(-63, -118, 53, -125, 55, -57)
            .quadraticCurveTo(53, -8, 67, bottom)
            .quadraticCurveTo(34, bottom + 16, 9, bottom - 3)
            .lineTo(-18, bottom + 4)
            .quadraticCurveTo(-72, bottom + 13, -59, -7)
            .closePath()
            .fill(color);
        if (p.hair === 'waves')
            for (let i = 0; i < 6; i++)
                g.ellipse(i % 2 ? 49 : -49, -39 + i * 13, 17, 22).fill(color);
    }
    if (p.hair === 'ponytail') {
        g.moveTo(26, -94)
            .bezierCurveTo(77, -155, 111, -96, 80, -45)
            .bezierCurveTo(70, -13, 115, 10, 72, 60)
            .quadraticCurveTo(89, 15, 53, 0)
            .quadraticCurveTo(30, -21, 51, -69)
            .closePath()
            .fill(color);
        g.ellipse(45, -100, 17, 7).fill(0x2d3947);
    }
    if (p.hair === 'bun') {
        g.circle(34, -108, 26).circle(13, -116, 19).circle(45, -124, 17).fill(color);
        g.ellipse(33, -91, 19, 7).fill(p.accent);
    }
    if (p.hair === 'locs')
        for (let i = 0; i < 8; i++) {
            const x = -48 + i * 13,
                end = 35 + (i % 3) * 12;
            g.moveTo(x, -72)
                .bezierCurveTo(x - 17, -30, x + 13, 6, x - 6, end)
                .stroke({ color, width: 12, cap: 'round' });
            g.roundRect(x - 12, end - 18, 11, 6, 2).fill(i % 2 ? p.accent : 0x36434d);
        }
}
function outfit(g: Graphics, p: PortraitAppearance) {
    const width = p.presentation === 'woman' ? 109 : 119,
        base = p.fabric,
        dark = 0x253340;
    g.moveTo(-width, 112)
        .quadraticCurveTo(-width + 4, 68, -59, 48)
        .lineTo(-29, 37)
        .lineTo(31, 40)
        .lineTo(66, 52)
        .quadraticCurveTo(width, 66, width + 4, 113)
        .quadraticCurveTo(12, 145, -width, 112)
        .closePath()
        .fill(base);
    g.poly([-33, 40, 31, 40, 48, 127, -42, 128]).fill(dark);
    g.poly([-width + 3, 91, -94, 70, -67, 55, -49, 118, -88, 124]).fill(p.accent);
    g.poly([67, 56, 96, 73, width, 98, 91, 121, 51, 122]).fill(p.accent);
    // One shoulder recedes: a slight three-quarter pose without facial features.
    g.poly([-94, 72, -77, 60, -52, 117, -67, 128, -91, 121]).fill(0x304352);
    g.poly([77, 64, 94, 77, 79, 123, 61, 129, 49, 118]).fill(0x304352);
    if (p.outfit === 'flight' || p.outfit === 'command' || p.outfit === 'field') {
        g.poly([-27, 44, -45, 27, -65, 43, -45, 65, -24, 122, -12, 125]).fill(p.accent);
        g.poly([28, 46, 47, 30, 65, 48, 44, 69, 22, 129, 11, 129]).fill(p.accent);
        g.poly([-46, 38, -55, 44, -35, 73, -23, 119, -32, 115, -55, 67, -64, 46]).fill(0xe6e1d6);
        g.poly([49, 40, 59, 48, 42, 79, 25, 127, 36, 124, 57, 72, 66, 50]).fill(0xe6e1d6);
    }
    if (p.outfit === 'science') {
        g.poly([-32, 40, -59, 50, -42, 129, -5, 133, -17, 67]).fill(0xe2e0d5);
        g.poly([32, 43, 61, 54, 45, 129, 8, 134, 20, 65]).fill(0xe2e0d5);
        g.poly([-35, 42, -23, 58, -10, 76, -25, 65, -43, 47]).fill(p.accent);
        g.poly([34, 44, 22, 61, 10, 78, 29, 65, 44, 48]).fill(p.accent);
        g.roundRect(32, 90, 30, 5, 2).fill(p.accent);
        g.roundRect(39, 82, 5, 23, 1).fill(0x4d6572);
    }
    if (p.outfit === 'utility' || p.outfit === 'vest') {
        g.poly([-55, 48, -35, 38, -21, 69, -26, 129, -63, 126, -72, 69]).fill(
            p.outfit === 'utility' ? base : 0x6b7858,
        );
        g.poly([53, 50, 34, 41, 21, 70, 27, 131, 68, 124, 72, 69]).fill(
            p.outfit === 'utility' ? base : 0x6b7858,
        );
        for (const x of [-61, 34]) {
            g.roundRect(x, 85, 29, 25, 4).fill(0x354550);
            g.roundRect(x + 3, 87, 23, 5, 1).fill(0x9aa7a7);
        }
        g.poly([-28, 38, -39, 49, -23, 79, -12, 76]).fill(p.accent);
        g.poly([29, 41, 41, 51, 23, 82, 12, 77]).fill(p.accent);
    }
    if (p.outfit === 'utility') {
        g.roundRect(-66, 94, 33, 9, 2).fill(p.accent);
        g.poly([64, 82, 86, 88, 82, 96, 62, 90]).fill(0xcbbd96);
    }
    if (p.outfit === 'vest') {
        g.poly([-31, 71, 30, 71, 35, 87, -33, 87]).fill(0x364551);
        g.roundRect(-9, 73, 19, 13, 2).fill(0x9aa7a7);
        g.roundRect(-5, 76, 11, 7, 1).fill(0x253340);
    }
    for (const side of [-1, 1]) {
        const angle = side * 0.3,
            x = side * 72,
            y = 65;
        const plate = (points: number[], color: number) => {
            const transformed: number[] = [];
            for (let i = 0; i < points.length; i += 2) {
                const px = points[i],
                    py = points[i + 1];
                transformed.push(
                    x + px * Math.cos(angle) - py * Math.sin(angle),
                    y + px * Math.sin(angle) + py * Math.cos(angle),
                );
            }
            g.poly(transformed).fill(color);
        };
        plate([-11, -15, 11, -15, 11, 16, -11, 16], 0x2c3c4a);
        plate([-7, -10, 7, -10, 7, 0, -7, 0], 0x4b5d6c);
    }
    g.roundRect(37, 105, 26, 6, 1).fill(p.accent);
    if (p.outfit === 'command')
        for (let i = 0; i < 3; i++) g.roundRect(-67 + i * 10, 100, 6, 13, 1).fill(0xe5c680);
    if (p.outfit === 'field') {
        g.poly([-37, 91, 42, 91, 48, 118, -40, 118]).fill(0x465657);
        g.roundRect(-11, 94, 28, 18, 3).fill(0xa0aaa2);
        g.roundRect(-6, 98, 18, 10, 1).fill(dark);
    }
    g.poly([0, 57, 10, 69, 18, 130, 8, 133]).fill({ color: 0x12212f, alpha: 0.12 });
}
function face(g: Graphics, p: PortraitAppearance) {
    const [width, jaw, chin] = FACE_PROPORTIONS[p.face],
        narrow = p.presentation === 'woman' ? 0.95 : 1;
    const w = width * narrow;
    g.roundRect(-21, 12, 39, 46, 9).fill(p.skin);
    g.poly([-20, 18, 18, 17, 16, 40, -12, 33]).fill({ color: 0x3d2829, alpha: 0.14 });
    g.ellipse(-w, -29, 8, 16)
        .ellipse(w - 1, -26, 8, 15)
        .fill(p.skin);
    g.moveTo(-w, -59)
        .bezierCurveTo(-w - 2, -101, w - 4, -110, w, -64)
        .lineTo(w - 3, -12)
        .quadraticCurveTo(w - 6, 6, jaw, 20)
        .quadraticCurveTo(10, chin + 5, -5, chin)
        .quadraticCurveTo(-jaw, 30, -w + 4, 1)
        .closePath()
        .fill(p.skin);
    // Only an edge plane for volume: no eyes, eyebrows, nose or mouth.
    g.moveTo(w - 9, -65)
        .quadraticCurveTo(w + 1, -30, w - 3, -12)
        .quadraticCurveTo(w - 6, 6, jaw, 20)
        .quadraticCurveTo(10, chin + 5, -5, chin)
        .quadraticCurveTo(jaw - 7, 20, w - 15, -15)
        .closePath()
        .fill({ color: 0x58352e, alpha: 0.12 });
    g.moveTo(-w + 5, -55)
        .quadraticCurveTo(-w + 6, -85, -13, -88)
        .quadraticCurveTo(-w + 12, -62, -w + 10, -19)
        .closePath()
        .fill({ color: 0xffedcf, alpha: 0.08 });
}
function hairFront(g: Graphics, p: PortraitAppearance) {
    const c = p.hairColor;
    switch (p.hair) {
        case 'shaved':
            g.moveTo(-48, -47)
                .quadraticCurveTo(-54, -99, -3, -106)
                .quadraticCurveTo(50, -105, 49, -48)
                .lineTo(39, -73)
                .quadraticCurveTo(7, -67, -31, -79)
                .closePath()
                .fill({ color: c, alpha: 0.75 });
            break;
        case 'crop':
            g.moveTo(-48, -29)
                .lineTo(-52, -77)
                .quadraticCurveTo(-45, -110, 1, -108)
                .quadraticCurveTo(47, -105, 50, -72)
                .lineTo(44, -31)
                .lineTo(35, -76)
                .lineTo(10, -70)
                .lineTo(-30, -80)
                .lineTo(-40, -45)
                .closePath()
                .fill(c);
            break;
        case 'quiff':
        case 'undercut':
            g.poly([
                -47, -35, -49, -83, -36, -103, -42, -113, -17, -108, 4, -125, 0, -111, 35, -119, 29,
                -108, 54, -103, 41, -87, 51, -74, 39, -51, 31, -80, 5, -79, -15, -92, -34, -74, -40,
                -36,
            ]).fill(c);
            if (p.hair === 'undercut') {
                g.poly([32, -78, 47, -63, 44, -29, 36, -43]).fill({ color: c, alpha: 0.6 });
                g.moveTo(36, -62)
                    .lineTo(44, -56)
                    .moveTo(36, -54)
                    .lineTo(44, -48)
                    .stroke({ color: p.skin, width: 3 });
            }
            break;
        case 'swept':
            g.moveTo(-47, -22)
                .bezierCurveTo(-58, -67, -44, -104, -7, -109)
                .bezierCurveTo(34, -114, 55, -83, 49, -37)
                .lineTo(41, -18)
                .quadraticCurveTo(43, -50, 30, -75)
                .quadraticCurveTo(0, -68, -35, -29)
                .lineTo(-39, -52)
                .quadraticCurveTo(-45, -40, -47, -22)
                .closePath()
                .fill(c);
            break;
        case 'bob':
        case 'fringe':
            g.moveTo(-52, 1)
                .quadraticCurveTo(-72, -109, -9, -112)
                .quadraticCurveTo(60, -120, 54, -7)
                .lineTo(43, 6)
                .lineTo(40, -67)
                .quadraticCurveTo(17, -76, -7, -65)
                .lineTo(-40, -56)
                .lineTo(-39, 12)
                .closePath()
                .fill(c);
            if (p.hair === 'fringe')
                g.poly([
                    -41, -74, 38, -81, 42, -48, 29, -53, 24, -47, 10, -53, 4, -46, -9, -52, -17,
                    -48, -23, -53, -40, -45,
                ]).fill(c);
            break;
        case 'ponytail':
        case 'braid':
        case 'bun':
        case 'long':
            g.moveTo(-47, -14)
                .quadraticCurveTo(-73, -92, -17, -109)
                .quadraticCurveTo(44, -129, 51, -68)
                .lineTo(43, -20)
                .lineTo(32, -76)
                .quadraticCurveTo(13, -82, -8, -52)
                .quadraticCurveTo(-34, -27, -46, -9)
                .quadraticCurveTo(-47, -45, -30, -70)
                .closePath()
                .fill(c);
            break;
        case 'curls':
        case 'coils':
        case 'locs':
        case 'waves':
            g.moveTo(-48, -32)
                .quadraticCurveTo(-68, -101, -10, -108)
                .quadraticCurveTo(53, -116, 52, -44)
                .lineTo(42, -26)
                .lineTo(34, -74)
                .quadraticCurveTo(0, -65, -24, -79)
                .lineTo(-41, -47)
                .closePath()
                .fill(c);
            for (let i = 0; i < 11; i++) {
                const a = Math.PI + (i / 10) * Math.PI;
                g.ellipse(
                    Math.cos(a) * 48,
                    -66 + Math.sin(a) * 38,
                    p.hair === 'coils' ? 14 : 17,
                    p.hair === 'waves' ? 22 : 16,
                ).fill(c);
            }
            if (p.hair === 'waves' || p.hair === 'curls')
                g.moveTo(-20, -86)
                    .bezierCurveTo(-41, -64, -14, -44, -31, -25)
                    .stroke({ color: c, width: 14, cap: 'round' });
            break;
    }
    if (p.hair !== 'shaved') {
        g.moveTo(-38, -83)
            .quadraticCurveTo(-17, -112, 13, -99)
            .quadraticCurveTo(-13, -99, -38, -83)
            .fill({ color: 0xffe9cc, alpha: 0.09 });
        g.moveTo(13, -93)
            .quadraticCurveTo(36, -99, 43, -78)
            .quadraticCurveTo(24, -89, 13, -93)
            .fill({ color: 0x101d2c, alpha: 0.13 });
    }
}
function frontBraid(g: Graphics, p: PortraitAppearance) {
    if (p.hair !== 'braid') return;
    g.moveTo(-44, -4)
        .bezierCurveTo(-62, 22, -36, 55, -56, 102)
        .stroke({ color: p.hairColor, width: 25, cap: 'round' });
    for (let i = 0; i < 7; i++) {
        const y = 8 + i * 13,
            x = -48 + (i % 2 ? 5 : -3);
        g.ellipse(x, y, 13, 11).fill(p.hairColor);
        g.ellipse(x - 4, y - 2, 5, 7).fill({ color: 0xf8d8bb, alpha: 0.08 });
    }
    g.roundRect(-64, 99, 19, 7, 2).fill(p.accent);
    g.poly([-61, 106, -45, 106, -49, 126, -58, 118]).fill(p.hairColor);
}
/** Shared vector parts for authored speakers and reproducible roster portraits. */
export function portraitView(p: PortraitAppearance) {
    const root = new Container();
    const hairFit = (FACE_PROPORTIONS[p.face][0] * (p.presentation === 'woman' ? 0.95 : 1)) / 46;
    root.label = 'portrait';
    root.eventMode = 'none';
    root.addChild(
        new Graphics().circle(0, 0, 132).fill(0x152733).stroke({ color: C.line, width: 1 }),
    );
    const back = root.addChild(new Graphics());
    back.label = 'portrait-hair-back';
    back.scale.x = p.facing * hairFit;
    back.position.set(4, -2);
    hairBack(back, p);
    const clothes = root.addChild(new Graphics());
    clothes.label = 'portrait-outfit';
    outfit(clothes, p);
    const head = root.addChild(new Container());
    head.position.set(4, -2);
    head.scale.x = p.facing;
    const skin = head.addChild(new Graphics());
    skin.label = 'portrait-face';
    face(skin, p);
    const hair = head.addChild(new Graphics());
    hair.label = 'portrait-hair-front';
    hair.scale.x = hairFit;
    hairFront(hair, p);
    if (p.headset) {
        const headset = head.addChild(new Graphics());
        headset.label = 'portrait-headset';
        headset.scale.x = hairFit;
        headset
            .moveTo(-53, -42)
            .quadraticCurveTo(-59, -104, -15, -112)
            .stroke({ color: 0x293846, width: 7 });
        headset.ellipse(-52, -26, 12, 24).fill(0x293846);
        headset.roundRect(-58, -36, 6, 20, 3).fill(p.accent);
        headset
            .moveTo(-52, -6)
            .quadraticCurveTo(-48, 13, -21, 20)
            .stroke({ color: 0x293846, width: 5, cap: 'round' });
        headset.roundRect(-26, 16, 16, 7, 3).fill(0x344754);
    }
    const braid = root.addChild(new Graphics());
    braid.label = 'portrait-braid';
    braid.scale.x = p.facing * hairFit;
    braid.x = 4;
    frontBraid(braid, p);
    return root;
}
