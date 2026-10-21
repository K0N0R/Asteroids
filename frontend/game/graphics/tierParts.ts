import { Container, Graphics } from 'pixi.js';
import { RESOURCES, type ResourceId } from '../state/resources';
import type { PartFamily, PartTier } from '../state/partTiers';

/** Different hardware silhouettes at each tier, shared by large artwork and inventory icons. */
export function advancedPartIllustration(id: ResourceId, family: PartFamily, tier: PartTier) {
    const root = new Container({ label: `${family}-tier-${tier}` });
    const g = new Graphics();
    root.addChild(g);
    const third = tier === 3;
    const color = RESOURCES[id].color;
    const dark = 0x263654,
        frame = 0x718ba2,
        bright = third ? 0xdac9ff : 0xbceee5;
    if (family === 'plating' || family === 'lightPlating') {
        g.roundRect(-62, -42, 124, 86, 16).fill(dark);
        if (third) {
            for (const x of [-39, 0, 39])
                g.poly([x - 17, -24, x, -35, x + 17, -24, x + 17, 18, x, 29, x - 17, 18]).fill(
                    color,
                );
            g.roundRect(-48, 33, 96, 9, 4).fill(bright);
            for (const x of [-55, 55]) g.roundRect(x - 4, -20, 8, 44, 4).fill(frame);
        } else {
            g.roundRect(-54, -35, 108, 70, 12).fill(color);
            for (const x of [-32, 0, 32]) g.roundRect(x - 5, -28, 10, 56, 5).fill(frame);
            g.roundRect(-43, -5, 86, 10, 5).fill(bright);
        }
    } else if (family === 'electronics') {
        if (third) g.roundRect(-68, -31, 136, 78, 12).fill(frame);
        g.roundRect(-60, -44, 120, 84, 14).fill(third ? 0x40768b : 0x328b88);
        for (const x of [-44, -22, 0, 22, 44]) {
            g.moveTo(x, -36).lineTo(x, 32).stroke({ color: 0xe8bf80, width: 4 });
            g.roundRect(x - 4, 37, 8, 14, 2).fill(0xe8bf80);
        }
        for (const x of third ? [-32, 0, 32] : [-25, 25]) {
            g.roundRect(x - 13, -19, 26, 32, 5).fill(dark);
            g.roundRect(x - 6, -12, 12, 18, 3).fill(bright);
        }
        if (third) g.roundRect(-46, -54, 92, 8, 3).fill(bright);
    } else if (family === 'machinery') {
        g.roundRect(-66, -35, 132, 85, 14).fill(dark);
        const gear = (x: number, y: number, r: number) => {
            const points = Array.from({ length: 32 }, (_, i) => {
                const a = (i * Math.PI) / 16;
                const n = r * (i % 4 === 1 || i % 4 === 2 ? 1 : 0.78);
                return [x + Math.cos(a) * n, y + Math.sin(a) * n];
            }).flat();
            g.poly(points).fill(color);
            g.circle(x, y, r * 0.4).fill(frame);
            g.circle(x, y, r * 0.18).fill(dark);
        };
        if (third) {
            gear(-35, 9, 30);
            gear(7, -15, 25);
            gear(38, 18, 22);
            g.roundRect(-47, -48, 94, 10, 4).fill(bright);
        } else {
            gear(-25, 4, 34);
            gear(31, -4, 26);
        }
        g.roundRect(-48, 42, 96, 12, 5).fill(frame);
        for (const x of [-50, 50]) g.circle(x, -24, 5).fill(bright);
    } else if (family === 'lifeSupport') {
        for (const x of third ? [-42, 42] : [-32, 32]) {
            g.roundRect(x - 18, -48, 36, 93, 17).fill(color);
            g.roundRect(x - 11, -27, 22, 42, 8).fill(dark);
            g.roundRect(x - 7, -22, 14, 29, 5).fill(0x89e2e4);
        }
        g.roundRect(-57, 28, 114, 14, 6).fill(frame);
        g.roundRect(
            third ? -22 : -14,
            third ? -37 : -10,
            third ? 44 : 28,
            third ? 83 : 54,
            10,
        ).fill(dark);
        if (third) for (const y of [-22, -3, 16]) g.roundRect(-14, y, 28, 9, 4).fill(bright);
        else g.circle(0, 7, 10).fill(bright);
        for (const x of [-30, 30]) g.roundRect(x - 4, -53, 8, 14, 3).fill(frame);
    } else if (family === 'propulsion') {
        g.roundRect(-54, -50, 108, 47, 12).fill(frame);
        for (const y of [-43, -31, -19]) g.roundRect(-60, y, 120, 5, 2).fill(color);
        for (const x of third ? [-39, 0, 39] : [-27, 27]) {
            g.poly([x - 12, -5, x + 12, -5, x + 24, 31, x - 24, 31]).fill(dark);
            g.ellipse(x, 31, 23, 7).fill(0x172139).stroke({ color: bright, width: 4 });
            g.poly([x - 13, 40, x, third ? 73 : 65, x + 13, 40]).fill(0x63d7ef);
            g.poly([x - 6, 40, x, 54, x + 6, 40]).fill(0xffe6a3);
        }
        if (third) g.roundRect(-17, -66, 34, 15, 5).fill(bright);
    } else if (family === 'power') {
        g.roundRect(-61, -40, 122, 85, 14).fill(dark);
        for (const x of third ? [-37, 0, 37] : [-27, 27]) {
            g.roundRect(x - 13, -31, 26, 61, 8).fill(color);
            g.roundRect(x - 7, -43, 14, 12, 3).fill(0xe8bf80);
            g.poly([x + 2, -18, x - 8, 4, x + 1, 4, x - 3, 20, x + 10, -3, x + 3, -3]).fill(
                0xffce78,
            );
        }
        g.roundRect(-47, 36, 94, 10, 4).fill(bright);
        if (third) for (const x of [-67, 67]) g.roundRect(x - 5, -18, 10, 48, 4).fill(frame);
    }
    return root;
}
