import { Container, Graphics, GraphicsContext } from 'pixi.js';
import { random } from '../../../game/worlds/sector';

export class Background extends Container {
    camera = { x: 0, y: 0 };
    private stars: { view: Graphics; x: number; y: number; depth: number; phase: number }[] = [];
    private time = 0;
    constructor() {
        super();
        this.eventMode = 'none';
        this.addChild(new Graphics().rect(0, 0, 1600, 900).fill(0x050d18));
        const nebula = new Graphics();
        for (let i = 26; i > 0; i--) {
            nebula.ellipse(1190, 260, i * 28, i * 18).fill({ color: 0x154452, alpha: 0.012 });
            nebula.ellipse(810, 740, i * 20, i * 12).fill({ color: 0x24425f, alpha: 0.009 });
        }
        this.addChild(nebula);
        const planet = new Graphics()
            .circle(1370, 210, 138)
            .fill(0x0e2336)
            .circle(1370, 210, 139)
            .stroke({ color: 0x45859d, width: 2, alpha: 0.35 })
            .circle(1410, 181, 135)
            .fill(0x07111e);
        this.addChild(planet);
        const rng = random(819),
            contexts = [
                new GraphicsContext().circle(0, 0, 0.8).fill(0x6c899e),
                new GraphicsContext().circle(0, 0, 1.2).fill(0xc2e0e8),
                new GraphicsContext().circle(0, 0, 1.8).fill(0xf1d8aa),
            ];
        for (let i = 0; i < 320; i++) {
            const view = new Graphics(contexts[i % 3]);
            const star = {
                view,
                x: rng() * 1600,
                y: rng() * 900,
                depth: 0.03 + rng() * 0.16,
                phase: rng() * 6.28,
            };
            this.stars.push(star);
            this.addChild(view);
        }
        this.update(0);
    }
    update(deltaMS: number) {
        this.time += deltaMS / 1000;
        const wrap = (v: number, max: number) => ((v % max) + max) % max;
        for (const star of this.stars) {
            star.view.position.set(
                wrap(star.x - this.camera.x * star.depth, 1600),
                wrap(star.y - this.camera.y * star.depth, 900),
            );
            star.view.alpha = 0.45 + Math.sin(this.time * 0.4 + star.phase) * 0.18;
        }
    }
}
