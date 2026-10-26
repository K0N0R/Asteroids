import { Container, Graphics } from 'pixi.js';
import { VENUS_LAB_MODULES, laboratoryHull } from '../worlds/venusLaboratory';
import { VenusPower, type VenusPowerState } from '../systems/venusPower';

/** Static industrial detail in two batches; only power signals animate. */
export class VenusLaboratoryView extends Container {
    private lamps = new Graphics();
    private grid: VenusPowerState | undefined;
    private systems: readonly boolean[] = [false, false, false];
    constructor() {
        super();
        this.label = 'venus-dead-laboratory';
        const g = new Graphics(),
            detail = new Graphics();
        this.addChild(g, detail, this.lamps);
        for (const m of VENUS_LAB_MODULES.filter((m) => m.id !== 'hub')) {
            g.moveTo(0, 0)
                .lineTo(m.x, m.y)
                .stroke({ color: 0x162635, width: 80, cap: 'round' })
                .moveTo(0, 0)
                .lineTo(m.x, m.y)
                .stroke({ color: 0x657b88, width: 52, cap: 'round' })
                .moveTo(0, 0)
                .lineTo(m.x, m.y)
                .stroke({ color: 0x293d4c, width: 35, cap: 'round' });
            for (let t = 0.2; t < 0.9; t += 0.17) {
                const x = m.x * t,
                    y = m.y * t;
                detail.circle(x, y, 26).stroke({ color: 0xa8ada1, width: 5, alpha: 0.7 });
            }
        }
        for (const sign of [-1, 1]) {
            const x = sign < 0 ? -780 : 540,
                y = sign < 0 ? -80 : -590;
            g.moveTo(sign * 160, -60)
                .lineTo(x + 125, y + 100)
                .stroke({ color: 0x8095a0, width: 24 });
            for (let p = 0; p < 2; p++) {
                const px = x + p * 138;
                g.rect(px, y, 126, 340).fill(0x1b2e41).stroke({ color: 0x9c9f8e, width: 8 });
                for (let row = 0; row < 9; row++)
                    for (let col = 0; col < 3; col++) {
                        if (sign === 1 && p === 1 && row < 3 && col > 0) continue;
                        detail
                            .rect(px + 9 + col * 37, y + 10 + row * 35, 31, 29)
                            .fill(sign > 0 && row % 4 === 0 ? 0x263845 : 0x3f6279)
                            .moveTo(px + 12 + col * 37, y + 15 + row * 35)
                            .lineTo(px + 34 + col * 37, y + 15 + row * 35)
                            .stroke({ color: 0x8cadb8, width: 1, alpha: 0.5 });
                    }
            }
        }
        for (const m of VENUS_LAB_MODULES) {
            const x = m.x,
                y = m.y,
                w = m.width / 2,
                h = m.height / 2;
            const hull = laboratoryHull(m).flatMap((p) => [p.x, p.y]);
            g.poly(hull.map((v, i) => v + (i % 2 ? 12 : 9))).fill({ color: 0x050e1d, alpha: 0.7 });
            g.poly(hull).fill(0x667882).stroke({ color: 0xa3b1ae, width: 6 });
            detail
                .roundRect(x - w + 15, y - h + 16, m.width - 30, m.height - 32, 17)
                .fill(0x354a59)
                .stroke({ color: 0x899c9d, width: 2 });
            detail.roundRect(x - w + 30, y - h + 30, m.width - 60, 22, 5).fill(0x859697);
            for (let i = 0; i < 5; i++)
                detail
                    .rect(x - w + 36 + i * 19, y - h + 34, 9, 14)
                    .fill(i % 2 ? 0x304958 : 0xb9b394);
            for (let i = 0; i < 4; i++)
                detail
                    .roundRect(
                        x - w + 40 + (i * (m.width - 80)) / 4,
                        y - 26,
                        (m.width - 100) / 4,
                        49,
                        8,
                    )
                    .fill(0x162b3b)
                    .stroke({ color: 0x718c98, width: 3 })
                    .rect(x - w + 45 + (i * (m.width - 80)) / 4, y - 21, (m.width - 120) / 4, 6)
                    .fill(0x506c7b);
            for (const sign of [-1, 1]) {
                for (let i = 0; i < 7; i++)
                    detail
                        .rect(x - w + 25 + (i * (m.width - 55)) / 7, y + sign * (h - 25), 10, 5)
                        .fill(0xd3c6a1);
                detail
                    .moveTo(x + sign * (w - 24), y - h + 50)
                    .lineTo(x + sign * (w - 24), y + h - 45)
                    .stroke({ color: 0x203745, width: 7 });
            }
            detail
                .roundRect(x - 39, y + h - 68, 78, 40, 8)
                .fill(0x708a91)
                .stroke({ color: 0xc0c6b0, width: 2 });
            for (let i = 0; i < 4; i++)
                detail.rect(x - 27 + i * 16, y + h - 56, 9, 4).fill(0x243e4e);
            // Service panels, fastening points and heat exchangers give each hull a useful scale.
            for (const side of [-1, 1]) {
                const px = x + side * (w - 46);
                detail
                    .roundRect(px - 12, y - 45, 24, 88, 3)
                    .fill(0x1d303f)
                    .stroke({ color: 0x9baaab, width: 1 });
                for (let fin = 0; fin < 9; fin++)
                    detail
                        .moveTo(px - 8, y - 38 + fin * 9)
                        .lineTo(px + 8, y - 38 + fin * 9)
                        .stroke({ color: 0x7d959b, width: 2 });
                for (let row = 0; row < 4; row++)
                    detail
                        .circle(x + side * (w - 9), y - h + 40 + (row * (m.height - 80)) / 3, 2.5)
                        .fill(0xd6d4be);
            }
            detail
                .moveTo(x - w + 36, y + h - 85)
                .lineTo(x + w - 35, y + h - 85)
                .stroke({ color: 0x142a3a, width: 5 });
            detail
                .moveTo(x - w + 36, y + h - 89)
                .lineTo(x + w - 35, y + h - 89)
                .stroke({ color: 0x96a9a7, width: 1 });
            for (let panel = 0; panel < 3; panel++)
                detail
                    .rect(
                        x - w + 40 + (panel * (m.width - 80)) / 3,
                        y - h + 63,
                        (m.width - 100) / 3,
                        17,
                    )
                    .fill(0x506978)
                    .stroke({ color: 0x829897, width: 1 });
        }
        // A breach and torn radiator sell the station's history without obscuring its silhouette.
        detail
            .poly([99, -110, 145, -91, 128, -58, 157, -29, 115, -13, 95, -43, 73, -35, 88, -80])
            .fill(0x111d29)
            .moveTo(96, -102)
            .lineTo(110, -78)
            .lineTo(100, -53)
            .stroke({ color: 0xc49a6c, width: 4 });
        for (let i = 0; i < 9; i++)
            detail
                .poly([
                    790 + i * 12,
                    -620 + i * 21,
                    807 + i * 12,
                    -613 + i * 21,
                    795 + i * 12,
                    -601 + i * 21,
                ])
                .fill(0x70838b);
        detail.moveTo(-475, -590).lineTo(-475, -550).stroke({ color: 0xa6bbb7, width: 10 });
        detail
            .roundRect(-488, -686, 96, 65, 8)
            .fill(0x293e4c)
            .stroke({ color: 0xd5b37e, width: 4 });
        for (let i = 0; i < 3; i++) detail.rect(-475 + i * 22, -671, 15, 18).fill(0x817b62);
        detail
            .moveTo(620, 300)
            .lineTo(700, 300)
            .stroke({ color: 0x8fa4a6, width: 16 })
            .roundRect(705, 267, 90, 66, 8)
            .fill(0x304a5b)
            .stroke({ color: 0xa8beb5, width: 4 })
            .rect(720, 279, 56, 24)
            .fill(0x122936);
        detail.circle(0, -70, 47).fill(0x1d3548).stroke({ color: 0xb6b8a5, width: 7 });
        for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            detail
                .moveTo(Math.cos(a) * 30, -70 + Math.sin(a) * 30)
                .lineTo(Math.cos(a) * 43, -70 + Math.sin(a) * 43)
                .stroke({ color: 0x728d9a, width: 4 });
        }
    }
    update(
        restored: boolean,
        saved: VenusPowerState | undefined,
        time: number,
        live?: readonly boolean[],
    ) {
        if (saved !== this.grid) {
            this.grid = saved;
            this.systems = saved ? new VenusPower(saved).systems : [false, false, false];
        }
        const systems = restored ? [true, true, true] : (live ?? this.systems);
        const g = this.lamps.clear();
        for (const m of VENUS_LAB_MODULES) {
            const on = systems[m.system];
            for (let i = 0; i < 4; i++)
                g.roundRect(m.x - 43 + i * 25, m.y - 48, 15, 7, 2).fill(on ? 0x81e6c6 : 0x493b3e);
            g.circle(m.x + m.width / 2 - 19, m.y + m.height / 2 - 18, 5).fill(
                on ? 0x9bf0d5 : Math.sin(time * 2) > 0 ? 0xe09c6b : 0x4e4246,
            );
        }
        g.roundRect(722, 281, 52, 19, 3).fill(restored ? 0x7bdbc4 : 0x2d424c);
        if (restored) for (let i = 0; i < 3; i++) g.circle(-460 + i * 22, -663, 5).fill(0x8ee9c8);
    }
}
