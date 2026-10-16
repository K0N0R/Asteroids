import { Container, Graphics, GraphicsContext } from 'pixi.js';
import { random } from '../../../game/worlds/sector';
import type { StorySectorId } from '../../../game/state/story';
import { rotateVector } from '../../../game/systems/flight';

export class Background extends Container {
    camera = { x: 0, y: 0 };
    cameraAngle = 0;
    private scenery = new Container();
    private stars: { view: Graphics; x: number; y: number; depth: number; phase: number }[] = [];
    private time = 0;
    private planet: Graphics;
    private regionArt = new Graphics();
    constructor() {
        super();
        this.eventMode = 'none';
        this.addChild(new Graphics().rect(0, 0, 1600, 900).fill(0x050d18));
        const nebula = new Graphics();
        for (let i = 26; i > 0; i--) {
            nebula.ellipse(1190, 260, i * 28, i * 18).fill({ color: 0x154452, alpha: 0.012 });
            nebula.ellipse(810, 740, i * 20, i * 12).fill({ color: 0x24425f, alpha: 0.009 });
        }
        this.scenery.addChild(nebula);
        this.planet = new Graphics()
            .circle(1370, 210, 138)
            .fill(0x0e2336)
            .circle(1370, 210, 139)
            .stroke({ color: 0x45859d, width: 2, alpha: 0.35 })
            .circle(1410, 181, 135)
            .fill(0x07111e);
        this.scenery.addChild(this.planet, this.regionArt);
        this.scenery.pivot.set(800, 450);
        this.scenery.position.set(800, 450);
        this.addChild(this.scenery);
        const rng = random(819),
            contexts = [
                new GraphicsContext().circle(0, 0, 0.8).fill(0x6c899e),
                new GraphicsContext().circle(0, 0, 1.2).fill(0xc2e0e8),
                new GraphicsContext().circle(0, 0, 1.8).fill(0xf1d8aa),
            ];
        for (let i = 0; i < 1000; i++) {
            const view = new Graphics(contexts[i % 3]);
            const star = {
                view,
                x: rng() * 2300,
                y: rng() * 2300,
                depth: 0.03 + rng() * 0.16,
                phase: rng() * 6.28,
            };
            this.stars.push(star);
            this.addChild(view);
        }
        const viewportMask = new Graphics().rect(0, 0, 1600, 900).fill(0xffffff);
        this.addChild(viewportMask);
        this.mask = viewportMask;
        this.update(0);
    }
    setRegion(region: StorySectorId | null) {
        this.planet.visible = region === null;
        const g = this.regionArt.clear();
        if (region === 'earth') {
            g.circle(1370, 210, 144)
                .fill({ color: 0x77c8ff, alpha: 0.12 })
                .circle(1370, 210, 138)
                .fill(0x143d69)
                .ellipse(1332, 163, 42, 26)
                .fill(0x397b76)
                .ellipse(1322, 224, 22, 44)
                .fill(0x397b76)
                .ellipse(1419, 193, 41, 31)
                .fill(0x477e70)
                .ellipse(1431, 257, 19, 15)
                .fill(0x477e70)
                .beginPath()
                .arc(1370, 210, 103, 3.3, 5.3)
                .stroke({ color: 0xd4e8ea, width: 11, alpha: 0.4 })
                .circle(1370, 210, 138)
                .stroke({ color: 0x8ddaf1, width: 2, alpha: 0.5 });
        } else if (region === 'pluto') {
            g.circle(1370, 210, 90)
                .fill(0x948c86)
                .ellipse(1391, 200, 33, 38)
                .fill(0xbfb4a5)
                .circle(1338, 230, 20)
                .fill(0x706866)
                .circle(1370, 210, 90)
                .stroke({ color: 0xd2c8ba, width: 2, alpha: 0.5 });
        } else if (region === 'uranus' || region === 'neptune') {
            const pale = region === 'uranus';
            g.circle(1370, 210, 145)
                .fill({ color: pale ? 0x9de0e2 : 0x557fe3, alpha: 0.12 })
                .circle(1370, 210, 138)
                .fill(pale ? 0x629fa8 : 0x294f9c);
            for (let i = -4; i <= 4; i++) {
                const y = i * 24,
                    halfWidth = Math.sqrt(138 * 138 - (Math.abs(y) + 5) ** 2);
                g.rect(1370 - halfWidth, 210 + y - 5, halfWidth * 2, 10).fill({
                    color: pale ? 0x91c4c7 : 0x416cb9,
                    alpha: 0.3,
                });
            }
            g.ellipse(1405, 246, 27, 10)
                .fill({ color: pale ? 0x7db5bb : 0x17376e, alpha: 0.45 })
                .circle(1370, 210, 138)
                .stroke({ color: pale ? 0xb4e1df : 0x7eaeef, width: 2, alpha: 0.5 });
        } else if (region === 'saturn') {
            g.ellipse(1370, 230, 215, 55).stroke({ color: 0xc6b89a, width: 16, alpha: 0.65 });
            g.ellipse(1370, 230, 235, 64).stroke({ color: 0x807b70, width: 6, alpha: 0.5 });
            g.circle(1370, 200, 110).fill(0xb9a47b);
            for (let i = -4; i <= 4; i++) {
                const y = i * 20,
                    halfWidth = Math.sqrt(110 * 110 - (Math.abs(y) + 6) ** 2);
                g.rect(1370 - halfWidth, 200 + y - 6, halfWidth * 2, 12).fill({
                    color: i % 2 ? 0x94825f : 0xd6c59c,
                    alpha: 0.5,
                });
            }
            g.moveTo(1155, 230)
                .bezierCurveTo(1165, 310, 1575, 310, 1585, 230)
                .stroke({ color: 0xd4c4a2, width: 10, alpha: 0.8 });
            g.circle(1370, 200, 110).stroke({ color: 0xe3d1a3, width: 2, alpha: 0.4 });
        } else if (region === 'jupiter') {
            g.circle(1370, 210, 148)
                .fill({ color: 0xd5ac80, alpha: 0.1 })
                .circle(1370, 210, 140)
                .fill(0xb89c7e);
            for (let i = -6; i <= 6; i++) {
                const y = i * 19,
                    halfWidth = Math.sqrt(140 * 140 - (Math.abs(y) + 7) ** 2);
                g.rect(1370 - halfWidth, 210 + y - 7, halfWidth * 2, 14).fill({
                    color: i % 2 ? 0x805b4b : 0xe0c4a0,
                    alpha: 0.65,
                });
            }
            g.ellipse(1412, 246, 29, 14)
                .fill(0x9f5e4c)
                .ellipse(1410, 245, 20, 8)
                .fill(0xba7d62)
                .circle(1370, 210, 140)
                .stroke({ color: 0xe7cfad, width: 2, alpha: 0.45 });
        } else if (region === 'belt') {
            const rng = random(150076);
            for (let i = 0; i < 65; i++) {
                const x = 250 + rng() * 1250,
                    y = 700 - x * 0.32 + (rng() - 0.5) * 180;
                g.ellipse(x, y, 4 + rng() * 12, 3 + rng() * 7).fill({
                    color: 0x7b776e,
                    alpha: 0.09 + rng() * 0.1,
                });
            }
        } else if (region === 'mercury') {
            g.circle(1370, 210, 138)
                .fill(0x77736d)
                .circle(1320, 178, 26)
                .fill(0x565450)
                .circle(1405, 247, 34)
                .fill(0x565450)
                .circle(1370, 210, 138)
                .stroke({ color: 0xe6ac66, width: 3, alpha: 0.5 });
            for (let i = 10; i > 0; i--)
                g.circle(1600, 430, 65 + i * 8).fill({ color: 0xf0a543, alpha: 0.018 });
        } else if (region === 'venus') {
            g.circle(1370, 210, 145)
                .fill({ color: 0xe0bf79, alpha: 0.12 })
                .circle(1370, 210, 138)
                .fill(0x9d804e)
                .beginPath()
                .arc(1370, 210, 109, 3.5, 5.7)
                .stroke({ color: 0xd3b67b, width: 24, alpha: 0.65 })
                .beginPath()
                .arc(1370, 210, 81, 0.4, 2.8)
                .stroke({ color: 0xc8aa73, width: 19, alpha: 0.65 })
                .circle(1370, 210, 138)
                .stroke({ color: 0xead1a1, width: 2, alpha: 0.4 });
        } else if (region === 'mars') {
            g.circle(1370, 210, 142)
                .fill({ color: 0xe29568, alpha: 0.09 })
                .circle(1370, 210, 138)
                .fill(0x9a513e)
                .ellipse(1330, 200, 43, 26)
                .fill(0x713c33)
                .ellipse(1408, 247, 35, 19)
                .fill(0x713c33)
                .ellipse(1370, 82, 35, 9)
                .fill(0xc4b6a5)
                .circle(1370, 210, 138)
                .stroke({ color: 0xe5a77b, width: 2, alpha: 0.4 });
        } else if (region === 'lunar') {
            g.circle(1370, 210, 138)
                .fill(0x687781)
                .circle(1320, 176, 29)
                .fill(0x53616c)
                .circle(1419, 225, 41)
                .fill(0x53616c)
                .circle(1348, 268, 15)
                .fill(0x87939a)
                .circle(1370, 210, 138)
                .stroke({ color: 0xc0cbd1, width: 2, alpha: 0.4 });
        }
    }
    update(deltaMS: number) {
        this.time += deltaMS / 1000;
        const wrap = (v: number, max: number) => ((v % max) + max) % max;
        this.scenery.rotation = this.cameraAngle;
        for (const star of this.stars) {
            const offset = rotateVector(
                {
                    x: wrap(star.x - this.camera.x * star.depth, 2300) - 1150,
                    y: wrap(star.y - this.camera.y * star.depth, 2300) - 1150,
                },
                this.cameraAngle,
            );
            star.view.position.set(800 + offset.x, 450 + offset.y);
            star.view.visible =
                offset.x >= -805 && offset.x <= 805 && offset.y >= -455 && offset.y <= 455;
            star.view.alpha = 0.45 + Math.sin(this.time * 0.4 + star.phase) * 0.18;
        }
    }
}
