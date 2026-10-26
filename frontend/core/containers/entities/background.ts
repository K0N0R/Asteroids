import { milkyWayView } from '../../../game/graphics/milkyWayView';
import { Container, Graphics, GraphicsContext } from 'pixi.js';
import { random } from '../../../game/worlds/sector';
import type { StorySectorId } from '../../../game/state/story';
import { planetView } from '../../../game/graphics/planetView';
import { C } from '../../../game/graphics/theme';
import { destroyDisplayTree } from '../../systems/destroyDisplayTree';
import { parallaxPoint } from '../../../game/graphics/parallax';
import { celestialBodiesFor } from '../../../game/worlds/celestialBodies';
import { CelestialLayer } from '../../../game/graphics/celestialLayer';
import { marsCelestialBodies } from '../../../game/worlds/celestialBodies';
import type { MarsOrbitId } from '../../../game/worlds/marsLayout';
import type { VenusArea } from '../../../game/worlds/venusLayout';
import { VenusCloudDeck } from '../../../game/graphics/venusCloudDeck';
import {
    venusTransferPose,
    type VenusTransferPresentation,
} from '../../../game/graphics/venusTransfer';
import { V, VENUS_MAPS } from '../../../game/worlds/venusLayout';

export class Background extends Container {
    camera = { x: 0, y: 0 };
    cameraAngle = 0;
    cameraZoom = 1;
    surface = false;
    worldPlanet = false;
    lunarTransfer = false;
    transferBody = 'moon';
    private flight = false;
    private clouds = new Container();
    private scenery = new Container();
    private celestialLayer = new CelestialLayer();
    private venusDeck = new VenusCloudDeck();
    private venusArea: VenusArea | null = null;
    private venusTransfer: VenusTransferPresentation | null = null;
    setVenusTransfer(transfer: VenusTransferPresentation | null) {
        this.venusTransfer = transfer;
    }
    setVenusArea(area: VenusArea | null) {
        this.venusArea = area;
    }
    private stars: { view: Graphics; x: number; y: number; depth: number; phase: number }[] = [];
    private time = 0;
    private region: StorySectorId | null = null;
    private marsArea: MarsOrbitId | null = null;
    setMarsArea(area: MarsOrbitId | null) {
        if (this.region !== 'mars' || this.marsArea === area) return;
        this.marsArea = area;
        this.celestialLayer.setBodies(
            area
                ? [...marsCelestialBodies('mars'), ...marsCelestialBodies('phobos')]
                : celestialBodiesFor('mars'),
        );
    }
    private starContexts: GraphicsContext[] = [];
    private illustration: ReturnType<typeof planetView>;
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
        this.starContexts = contexts;
        this.once('destroyed', () => {
            for (const context of this.starContexts) context.destroy();
            this.starContexts.length = 0;
        });
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
        this.celestialLayer.setBodies(celestialBodiesFor(null));
        this.addChild(this.celestialLayer);
        this.addChild(this.venusDeck);
        const viewportMask = new Graphics().rect(0, 0, 1600, 900).fill(0xffffff);
        this.addChild(viewportMask);
        this.mask = viewportMask;
        this.setFlight(false);
        this.update(0);
    }
    setRegion(region: StorySectorId | null) {
        if (region === this.region) return;
        this.region = region;
        this.venusArea = null;
        this.venusTransfer = null;
        this.venusDeck.alpha = 0;
        this.venusDeck.visible = false;
        this.marsArea = null;
        this.celestialLayer.setBodies(celestialBodiesFor(region));
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
        const venus = this.flight && this.region === 'venus';
        const transfer = venus ? this.venusTransfer : null;
        const venusPose = transfer
            ? venusTransferPose(transfer, this.cameraZoom)
            : venus && this.venusArea === 'atmosphere'
              ? venusTransferPose(
                    {
                        progress: 1,
                        descending: true,
                        orbitalCamera: V.atmosphereApproach,
                        atmospherePoint: this.camera,
                    },
                    this.cameraZoom,
                )
              : null;
        const cosmosCamera =
            transfer?.orbitalCamera ??
            (venus && this.venusArea === 'atmosphere' ? V.atmosphereApproach : this.camera);
        this.venusDeck.update(
            venus,
            transfer?.atmospherePoint ?? this.camera,
            this.cameraAngle,
            this.time,
            Math.min(0.1, deltaMS / 1000),
            venus ? (venusPose?.atmosphere ?? 0) : undefined,
        );
        if (!this.flight) this.venusDeck.alpha = 0;
        this.clouds.alpha = 1 - this.venusDeck.alpha;
        this.illustration.updateAppearance(this.time);
        this.scenery.visible = !this.flight;
        this.celestialLayer.visible =
            this.flight && !this.worldPlanet && (!this.surface || this.lunarTransfer || venus);
        if (this.flight) {
            this.celestialLayer.update(
                cosmosCamera,
                this.cameraAngle,
                this.cameraZoom,
                this.lunarTransfer ? [this.transferBody] : [],
                this.time,
                venusPose
                    ? {
                          venus: {
                              position: parallaxPoint(
                                  VENUS_MAPS.atmosphere.center,
                                  venusPose.pivot,
                                  this.cameraAngle,
                                  1,
                                  venusPose.zoom,
                              ),
                              scale: venusPose.planetScale,
                          },
                      }
                    : undefined,
            );
            this.clouds.pivot.set(800, 450);
            this.clouds.position.copyFrom(
                parallaxPoint(
                    { x: 0, y: 0 },
                    cosmosCamera,
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
                    (wrap(star.x - cosmosCamera.x * star.depth, 2300) - 1150) / star.depth +
                    cosmosCamera.x,
                y:
                    (wrap(star.y - cosmosCamera.y * star.depth, 2300) - 1150) / star.depth +
                    cosmosCamera.y,
            };
            const position = parallaxPoint(
                anchor,
                cosmosCamera,
                this.flight ? this.cameraAngle : 0,
                star.depth,
            );
            const offset = { x: position.x - 800, y: position.y - 450 };
            star.view.position.copyFrom(position);
            star.view.visible =
                offset.x >= -805 && offset.x <= 805 && offset.y >= -455 && offset.y <= 455;
            star.view.alpha =
                (0.45 + Math.sin(this.time * 0.35 + star.phase) * 0.12) *
                (1 - this.venusDeck.alpha);
        }
    }
}
