import { travelBeacon } from './travelBeacon';
import { Container } from 'pixi.js';
import { marsMoonView } from './marsMoons';
import { MARS_MOONS } from '../worlds/marsMoons';
import { phobosOrbitSecured } from '../state/marsAct';
import type { MissionSimulation } from '../systems/mission';
import { worldLabel } from '../ui/primitives';
import { C } from './shapes';

/** Each moon has its own ground and approach; neither is an extra dockable station. */
export class MarsMoonSurfaceView extends Container {
    private bodies = [MARS_MOONS.phobos].map((body) => {
        const ground = marsMoonView(body.id);
        ground.position.copyFrom(body.center);
        ground.scale.set(30);
        const gates = [body.entrance, body.exit].map((point, i) => {
            const gate = new Container();
            gate.position.copyFrom(point);
            gate.addChild(travelBeacon());
            const title = worldLabel(
                gate,
                `${body.name} · ${i ? 'F · orbita' : 'F · lądowanie'}`,
                0,
                170,
                18,
                C.cyan,
            );
            return { gate, title };
        });
        this.addChild(ground, ...gates.map((g) => g.gate));
        return { body, ground, gates };
    });
    update(s: MissionSimulation, angle: number) {
        for (const { body, ground, gates } of this.bodies) {
            const unlocked = !s.marsAct || phobosOrbitSecured(s.campaign.story!);
            ground.visible =
                (s.area === 'surface' && s.marsMoon?.id === body.id) ||
                (s.transferActive && s.marsMoon?.id === body.id);
            gates.forEach(({ gate, title }, i) => {
                gate.visible =
                    unlocked &&
                    !s.transferActive &&
                    (i
                        ? s.area === 'surface' && s.marsMoon?.id === body.id
                        : s.area === 'orbit' && (!s.marsAct || s.marsOrbit === 'phobos'));
                title.rotation = -angle;
            });
        }
    }
}
