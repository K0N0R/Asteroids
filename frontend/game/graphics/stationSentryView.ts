import { Container, Graphics } from 'pixi.js';

export class StationSentryView extends Container {
    readonly flame = new Graphics().poly([-18, -5, -32, 0, -18, 5]).fill(0x81d4ed);

    constructor() {
        super();
        this.addChild(
            this.flame,
            new Graphics()
                .poly([-17, -8, -8, -18, 6, -13, 18, -5, 18, 5, 6, 13, -8, 18, -17, 8])
                .fill(0x526568)
                .beginPath()
                .poly([-10, -9, 5, -7, 13, 0, 5, 7, -10, 9])
                .fill(0x8ca39b)
                .beginPath()
                .rect(-8, -15, 11, 4)
                .rect(-8, 11, 11, 4)
                .fill(0x87dfbe)
                .beginPath()
                .circle(4, 0, 4)
                .fill(0xc6f5e2)
                .beginPath()
                .rect(13, -3, 14, 6)
                .fill(0xd5dddd),
        );
    }
}
