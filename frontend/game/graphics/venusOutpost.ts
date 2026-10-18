import { Container, Graphics } from 'pixi.js';
import { worldLabel as label } from '../ui/primitives';
import { C } from './shapes';
import { rotateVector } from '../systems/flight';
import type { MissionSimulation } from '../systems/mission';

export class OrbitalOutpostView extends Container {
    private structure = new Graphics();
    private markers = new Graphics();
    private title: ReturnType<typeof label>;
    private stage = -1;
    constructor() {
        super();
        this.eventMode = 'none';

        this.addChild(this.structure, this.markers);
        this.title = label(this, '', 0, 155, 17, C.gold);
    }
    update(s: MissionSimulation, angle: number) {
        const stage = s.orbitalBaseStage;
        this.position.copyFrom(s.assaultSite);
        this.visible = stage >= 0;
        if (!this.visible) return;
        this.title.rotation = -angle;
        this.title.position.copyFrom(rotateVector({ x: 0, y: 155 }, -angle));
        const built = stage > 0,
            shielded = stage > 1;
        if (stage !== this.stage) {
            this.stage = stage;
            const g = this.structure.clear();
            g.circle(0, 0, 135).stroke({ color: C.line, width: 3, alpha: 0.6 });
            if (!built) {
                g.rect(-65, -55, 130, 110).stroke({ color: C.gold, width: 4 });
                for (const x of [-100, 100])
                    g.moveTo(x, -70).lineTo(x, 70).stroke({ color: C.muted, width: 5 });
            } else {
                for (const x of [-120, 70]) {
                    g.roundRect(x, -80, 50, 160, 5).fill(0x23556b);
                    for (let y = -50; y <= 50; y += 25)
                        g.moveTo(x, y)
                            .lineTo(x + 50, y)
                            .stroke({ color: C.line, width: 2 });
                }
                g.roundRect(-75, -50, 150, 100, 12).fill(0x5b6e74).circle(0, 0, 34).fill(0x285a71);
                if (shielded)
                    g.circle(0, 0, 102).stroke({
                        color: s.marsBaseSector ? C.mint : C.gold,
                        width: 9,
                        alpha: 0.8,
                    });
            }
        }
        const a = s.activeAssault,
            g = this.markers.clear();
        this.title.setText(
            !built
                ? s.orbitalBuildReady
                    ? 'Plac budowy · E przez 2 s'
                    : 'Plac budowy · zgromadź materiały'
                : a.active
                  ? `${s.marsBaseSector ? 'Baza' : 'Placówka'} · ${a.health}/180 HP`
                  : s.orbitalBaseName,
        );
        if (a.active) {
            g.rect(-90, 125, 180, 8)
                .fill(C.line)
                .rect(-90, 125, a.health, 8)
                .fill(a.health < 60 ? C.red : C.mint);
        }
    }
}
