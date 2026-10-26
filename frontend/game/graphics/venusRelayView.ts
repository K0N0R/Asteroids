import { Container, Graphics } from 'pixi.js';

/** A serviceable communications satellite: truss, segmented arrays and steerable dish. */
export class VenusRelayView extends Container {
    private dish = new Container();
    private lights = new Graphics();
    constructor() {
        super();
        this.label = 'venus-orbital-relay';
        const frame = new Graphics();
        this.addChild(frame);
        frame.roundRect(-150, -12, 300, 24, 7).fill(0x172b3c).stroke({ color: 0x718a9c, width: 3 });
        for (const sign of [-1, 1]) {
            const x = sign * 145;
            frame
                .roundRect(x - 42, -128, 84, 256, 7)
                .fill(0x24364b)
                .stroke({ color: 0xb2a484, width: 4 });
            for (let row = 0; row < 8; row++)
                for (let col = 0; col < 3; col++) {
                    const px = x - 35 + col * 23,
                        py = -120 + row * 30;
                    frame
                        .rect(px, py, 20, 26)
                        .fill(sign < 0 && row === 6 && col === 1 ? 0x223044 : 0x3d6485)
                        .moveTo(px + 3, py + 3)
                        .lineTo(px + 16, py + 3)
                        .stroke({ color: 0x789bb4, width: 1, alpha: 0.7 });
                }
            frame
                .roundRect(sign * 63 - 9, -26, 18, 52, 4)
                .fill(0x8899a0)
                .stroke({ color: 0x233846, width: 2 });
            for (const y of [-16, 0, 16]) frame.circle(sign * 63, y, 2).fill(0xd6d2bc);
        }
        frame
            .poly([-47, -58, 30, -58, 49, -38, 49, 38, 30, 58, -47, 58, -56, 35, -56, -35])
            .fill(0x243543)
            .stroke({ color: 0x93a6ad, width: 4 });
        frame
            .poly([-43, -48, 27, -48, 39, -33, 39, 32, 26, 47, -43, 47])
            .fill(0x687d85)
            .stroke({ color: 0xaeb7ac, width: 2 });
        frame.roundRect(-40, -34, 31, 68, 5).fill(0x304a5b);
        for (let y = -27; y <= 25; y += 10) frame.rect(-34, y, 19, 4).fill(0x80949e);
        frame.roundRect(5, 12, 23, 23, 4).fill(0x243c4e).stroke({ color: 0xb3a68c, width: 2 });
        frame.moveTo(-47, 49).lineTo(-33, 32).lineTo(-8, 51).stroke({ color: 0xd9b77b, width: 3 });
        for (const x of [-44, 30])
            for (const y of [-45, 44]) frame.circle(x, y, 2.5).fill(0xe1dbc2);
        frame
            .moveTo(-25, -60)
            .lineTo(-25, -100)
            .stroke({ color: 0x9aaab0, width: 4 })
            .circle(-25, -104, 5)
            .fill(0xe6bd76);
        const dish = new Graphics();
        dish.ellipse(0, 0, 39, 29)
            .fill(0x253e51)
            .stroke({ color: 0xd3ded8, width: 4 })
            .ellipse(0, -3, 31, 21)
            .fill(0x8fbbc4)
            .stroke({ color: 0xe2e7d5, width: 2 });
        for (const a of [0, Math.PI / 3, (Math.PI * 2) / 3])
            dish.moveTo(-Math.cos(a) * 29, -3 - Math.sin(a) * 20)
                .lineTo(Math.cos(a) * 29, -3 + Math.sin(a) * 20)
                .stroke({ color: 0xd6e1d5, width: 1.5 });
        dish.moveTo(-23, 10)
            .lineTo(3, -31)
            .lineTo(22, 11)
            .stroke({ color: 0x2b4758, width: 3 })
            .circle(3, -31, 5)
            .fill(0xb6f3ea);
        this.dish.addChild(dish);
        this.dish.position.set(11, -16);
        this.addChild(this.dish, this.lights);
    }
    update(active: boolean, time: number) {
        this.dish.rotation = Math.sin(time * 0.18) * 0.12;
        this.lights.clear();
        for (let i = 0; i < 3; i++)
            this.lights
                .roundRect(-6 + i * 10, 42, 6, 4, 1)
                .fill(active ? 0x80e9cb : i === Math.floor(time) % 3 ? 0xe1b567 : 0x4b5459);
    }
}
