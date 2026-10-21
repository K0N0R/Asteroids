import { Container } from 'pixi.js';
import { destroyDisplayTree } from '../../core/systems/destroyDisplayTree';
import { planetView } from './planetView';
import { parallaxPoint } from './parallax';
import type { CelestialBodySpec } from '../worlds/celestialBodies';
import type { Point } from '../worlds/sector';

/** Independent distant planes behind the playable orbital space. */
export class CelestialLayer extends Container {
    private bodies: { spec: CelestialBodySpec; view: ReturnType<typeof planetView> }[] = [];
    private signature = '';
    constructor() {
        super();
        this.label = 'celestial-layer';
        this.eventMode = 'none';
    }
    setBodies(specs: readonly CelestialBodySpec[]) {
        for (const spec of specs)
            if (!(spec.depth > 0 && spec.depth < 1) || !(spec.scale > 0))
                throw new Error(`Invalid distant body: ${spec.id}`);
        const signature = JSON.stringify(specs);
        if (this.signature === signature) return;
        this.signature = signature;
        for (const body of this.bodies) destroyDisplayTree(body.view);
        this.bodies = [...specs]
            .sort((a, b) => a.depth - b.depth)
            .map((spec) => {
                const view = planetView(spec.appearance);
                view.label = `celestial-${spec.id}`;
                this.addChild(view);
                return { spec, view };
            });
    }
    update(
        camera: Point,
        angle: number,
        zoom: number,
        hiddenIds: readonly string[] = [],
        seconds = 0,
    ) {
        for (const { spec, view } of this.bodies) {
            view.updateAppearance(seconds);
            view.visible = !hiddenIds.includes(spec.id);
            view.position.copyFrom(parallaxPoint(spec.anchor, camera, angle, spec.depth, zoom));
            view.rotation = angle;
            view.scale.set(spec.scale * zoom);
        }
    }
}
