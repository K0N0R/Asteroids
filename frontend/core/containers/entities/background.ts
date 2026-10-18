import { Container, Graphics, GraphicsContext } from 'pixi.js';
import { random } from '../../../game/worlds/sector';
import type { StorySectorId } from '../../../game/state/story';
import { planetView } from '../../../game/graphics/planetView';
import { C } from '../../../game/graphics/theme';
import { destroyDisplayTree } from '../../systems/destroyDisplayTree';
import { parallaxPoint } from '../../../game/graphics/parallax';
import { MOON } from '../../../game/worlds/moon';

export class Background extends Container {
    camera = { x: 0, y: 0 };
    cameraAngle = 0;
    cameraZoom = 1;
    surface = false;
    private flight = false;
    private region: StorySectorId | null = null;
    private clouds = new Container();
    private scenery = new Container();
    private stars: { view: Graphics; x: number; y: number; depth: number; phase: number }[] = [];
    private time = 0;
    private illustration: Container;
    constructor() {
        super();
        this.eventMode = 'none';
        this.addChild(new Graphics().rect(0, 0, 1600, 900).fill(C.space));
        const clouds = new Graphics();
        clouds
            .ellipse(1200, 210, 590, 300)
            .fill({ color: 0x282154, alpha: 0.32 })
            .ellipse(1330, 180, 430, 200)
            .fill({ color: 0x343064, alpha: 0.2 })
            .ellipse(520, 830, 650, 260)
            .fill({ color: 0x292253, alpha: 0.18 });
        this.clouds.addChild(clouds);
        this.addChild(this.clouds);
        const rng = random(819),
            contexts = [
                new GraphicsContext().circle(0, 0, 1.1).fill(0x8298cf),
                new GraphicsContext().circle(0, 0, 1.7).fill(0x9dcde6),
                new GraphicsContext().circle(0, 0, 2.1).fill(0xd5aac4),
                new GraphicsContext()
                    .poly([0, -4, 1, -1, 4, 0, 1, 1, 0, 4, -1, 1, -4, 0, -1, -1])
                    .fill(0xc2c7e6),
            ];
        for (let i = 0; i < 260; i++) {
            const view = new Graphics(contexts[i % 31 === 0 ? 3 : i % 3]);
            this.stars.push({
                view,
                x: rng() * 2300,
                y: rng() * 2300,
                depth: 0.03 + rng() * 0.12,
                phase: rng() * 6.28,
            });
            this.addChild(view);
        }
        this.illustration = planetView(null);
        this.scenery.addChild(this.illustration);
        this.addChild(this.scenery);
        const viewportMask = new Graphics().rect(0, 0, 1600, 900).fill(0xffffff);
        this.addChild(viewportMask);
        this.mask = viewportMask;
        this.setFlight(false);
        this.update(0);
    }
    setRegion(region: StorySectorId | null) {
        this.region = region;
        destroyDisplayTree(this.illustration);
        this.illustration = planetView(region);
        this.scenery.addChild(this.illustration);
    }
    setFlight(active: boolean) {
        this.flight = active;
        this.scenery.position.set(1360, 190);
        this.scenery.scale.set(active ? 0.95 : 1);
        this.scenery.alpha = active ? 0.38 : 0.95;
    }
    update(deltaMS: number) {
        this.time += deltaMS / 1000;
        this.scenery.visible = !this.flight || !this.surface;
        if (this.flight) {
            const position = parallaxPoint(
                this.region === 'lunar' ? MOON.entrance : { x: 12000, y: 6000 },
                this.camera,
                this.cameraAngle,
                this.region === 'lunar' ? 0.2 : 0.035,
                this.cameraZoom,
            );
            this.scenery.position.copyFrom(position);
            this.scenery.rotation = this.cameraAngle;
            this.scenery.scale.set(0.95 * this.cameraZoom);
            this.clouds.pivot.set(800, 450);
            this.clouds.position.copyFrom(
                parallaxPoint(
                    { x: 0, y: 0 },
                    this.camera,
                    this.cameraAngle,
                    0.025,
                    this.cameraZoom,
                ),
            );
            this.clouds.rotation = this.cameraAngle;
        } else {
            this.scenery.rotation = 0;
            this.clouds.pivot.set(0, 0);
            this.clouds.position.set(0, 0);
            this.clouds.rotation = 0;
        }
        const wrap = (v: number, max: number) => ((v % max) + max) % max;
        for (const star of this.stars) {
            const anchor = {
                x:
                    (wrap(star.x - this.camera.x * star.depth, 2300) - 1150) / star.depth +
                    this.camera.x,
                y:
                    (wrap(star.y - this.camera.y * star.depth, 2300) - 1150) / star.depth +
                    this.camera.y,
            };
            const position = parallaxPoint(
                anchor,
                this.camera,
                this.flight ? this.cameraAngle : 0,
                star.depth,
            );
            const offset = { x: position.x - 800, y: position.y - 450 };
            star.view.position.copyFrom(position);
            star.view.visible =
                offset.x >= -805 && offset.x <= 805 && offset.y >= -455 && offset.y <= 455;
            star.view.alpha = 0.45 + Math.sin(this.time * 0.35 + star.phase) * 0.12;
        }
    }
}
