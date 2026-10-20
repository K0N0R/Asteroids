import { milkyWayView } from '../../../game/graphics/milkyWayView';
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
    private moonScenery = new Container();
    private stars: { view: Graphics; x: number; y: number; depth: number; phase: number }[] = [];
    private time = 0;
    private illustration: Container;
    constructor() {
        super();
        this.eventMode = 'none';
        this.addChild(new Graphics().rect(0, 0, 1600, 900).fill(C.space));
        const clouds = milkyWayView();
        for (const [x, y, tilt] of [
            [310, 180, -0.4],
            [1240, 650, 0.6],
            [710, 790, -0.8],
        ]) {
            const galaxy = new Graphics();
            galaxy
                .ellipse(0, 0, 11, 3)
                .fill({ color: 0x9e9cc1, alpha: 0.22 })
                .ellipse(0, 0, 5, 2)
                .fill({ color: 0xe7ced3, alpha: 0.36 })
                .circle(0, 0, 1.2)
                .fill({ color: 0xf4e1d8, alpha: 0.65 });
            galaxy.position.set(x, y);
            galaxy.rotation = tilt;
            this.clouds.addChild(galaxy);
        }
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
        this.scenery.label = 'world-planet';
        this.scenery.addChild(this.illustration);
        this.addChild(this.scenery);
        this.moonScenery.addChild(planetView('lunar'));
        this.addChild(this.moonScenery);
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
        if (!active) this.scenery.position.set(1360, 190);
        if (!active) this.scenery.scale.set(1);
        this.scenery.alpha = 1;
    }
    update(deltaMS: number) {
        this.time += deltaMS / 1000;
        this.scenery.visible = !this.flight || !this.surface;
        this.moonScenery.visible = this.flight && !this.surface && this.region === 'earth';
        if (this.moonScenery.visible) {
            this.moonScenery.position.copyFrom(
                parallaxPoint(MOON.entrance, this.camera, this.cameraAngle, 1, this.cameraZoom),
            );
            this.moonScenery.rotation = this.cameraAngle;
            this.moonScenery.scale.set(1.4 * this.cameraZoom);
        }
        if (this.flight) {
            const position = parallaxPoint(
                this.region === 'lunar'
                    ? MOON.entrance
                    : this.region === 'earth'
                      ? { x: 0, y: 850 }
                      : { x: 12000, y: 6000 },
                this.camera,
                this.cameraAngle,
                this.region === 'earth' ? 1 : this.region === 'lunar' ? 0.2 : 0.035,
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
                    0.002,
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
