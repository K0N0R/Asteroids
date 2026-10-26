import { Container, Graphics } from 'pixi.js';
import { C } from './shapes';
import { worldLabel } from '../ui/primitives';
import { V, VENUS_MAPS, VENUS_SAMPLES, venusStorms } from '../worlds/venusLayout';
import { VenusRelayView } from './venusRelayView';
import { VenusLaboratoryView } from './venusLaboratoryView';
import { VenusProbe } from '../systems/venusProbe';
import { drawResearchScan } from './researchScan';
import { rotateVector } from '../systems/flight';
import type { MissionSimulation } from '../systems/mission';
import type { Point } from '../worlds/sector';

/** Scene composition only. Planet and cloud scenery belong to the parallax background. */
export class VenusActView extends Container {
    private orbit = new Container();
    private relay = new VenusRelayView();
    private lab = new VenusLaboratoryView();
    private installation = new Container();
    private dynamic = new Graphics();
    private scan = new Graphics();
    private labels: {
        id: string;
        origin: Point;
        offset: number;
        view: ReturnType<typeof worldLabel>;
    }[] = [];
    constructor() {
        super();
        this.label = 'venus-act-structures';
        this.eventMode = 'none';
        this.orbit.addChild(this.relay);
        this.relay.position.copyFrom(V.relay);
        this.lab.position.copyFrom(VENUS_MAPS.station.center);
        this.addChild(this.orbit, this.lab, this.installation, this.dynamic, this.scan);
        this.buildInstallation();
        for (const [id, origin, name, offset] of [
            ['relay', V.relay, 'Przekaźnik orbitalny', 170],
            ['power', V.power, 'Zasilanie awaryjne', 90],
            ['archive', V.archive, 'Terminal archiwum', 90],
            ['terminal', V.terminal, 'Terminal instalacji', 140],
        ] as const)
            this.labels.push({
                id: 'venus:' + id,
                origin,
                offset,
                view: worldLabel(this, name, origin.x, origin.y + offset, 17, C.cyan),
            });
        VENUS_SAMPLES.forEach((p, i) =>
            this.labels.push({
                id: 'sample:' + i,
                origin: p,
                offset: 90,
                view: worldLabel(this, i + 1 + ' · ' + p.name, p.x, p.y + 90, 16, C.mint),
            }),
        );
    }
    private buildInstallation() {
        const g = this.installation.addChild(new Graphics()),
            p = V.guardian;
        for (const radius of [310, 350])
            g.circle(p.x, p.y, radius).stroke({ color: 0x516775, width: 18 });
        for (let i = 0; i < 12; i++) {
            const a = (i * Math.PI) / 6,
                x = p.x + Math.cos(a) * 330,
                y = p.y + Math.sin(a) * 330;
            g.circle(x, y, 18).fill(0x22394b).stroke({ color: 0x9faaa3, width: 3 });
            g.moveTo(p.x + Math.cos(a) * 290, p.y + Math.sin(a) * 290)
                .lineTo(p.x + Math.cos(a) * 370, p.y + Math.sin(a) * 370)
                .stroke({ color: 0xa89782, width: 6 });
        }
        for (const q of [...V.anchors, V.terminal]) {
            g.moveTo(p.x, p.y)
                .lineTo(q.x, q.y)
                .stroke({ color: 0x182b3b, width: 55 })
                .moveTo(p.x, p.y)
                .lineTo(q.x, q.y)
                .stroke({ color: 0x657c87, width: 33 })
                .moveTo(p.x, p.y)
                .lineTo(q.x, q.y)
                .stroke({ color: 0x233e50, width: 15 });
            g.roundRect(q.x - 90, q.y - 70, 180, 140, 18)
                .fill(0x425b6c)
                .stroke({ color: 0xa4b3ae, width: 5 });
            g.roundRect(q.x - 66, q.y - 48, 132, 96, 10)
                .fill(0x1c3449)
                .stroke({ color: 0x668798, width: 3 });
            for (let i = 0; i < 5; i++) g.rect(q.x - 53 + i * 23, q.y + 27, 14, 8).fill(0x91bebf);
            for (const sign of [-1, 1])
                g.rect(q.x + sign * 70 - 6, q.y - 42, 12, 62).fill(0xb2a78d);
        }
        g.rect(V.terminal.x - 43, V.terminal.y - 27, 86, 35).fill(0x70c9c2);
    }
    update(s: MissionSimulation, time: number, angle: number) {
        const act = s.venusAct;
        this.visible = !!act;
        if (!act) return;
        this.orbit.visible = s.inVisibleMap(VENUS_MAPS.orbit.center);
        this.lab.visible = s.inVisibleMap(VENUS_MAPS.station.center);
        this.installation.visible = s.inVisibleMap(VENUS_MAPS.installation.center);
        this.relay.update(s.campaign.story!.claimed.includes('venus-toxic-orbit'), time);
        if (this.lab.visible)
            this.lab.update(
                s.campaign.story!.venus!.powerRestored,
                s.campaign.story!.venus!.powerGrid,
                time,
                act.powerPuzzle?.systems,
            );
        for (const item of this.labels) {
            item.view.visible = item.id.startsWith('sample:')
                ? act.area === 'atmosphere'
                : act.targets.some((t) => t.id === item.id);
            item.view.rotation = -angle;
            const offset = rotateVector({ x: 0, y: item.offset }, -angle);
            item.view.position.set(item.origin.x + offset.x, item.origin.y + offset.y);
        }
        const g = this.dynamic.clear();
        this.scan.clear();
        if (act.area === 'atmosphere') {
            for (const h of venusStorms(time)) {
                for (let rim = 4; rim >= 0; rim--)
                    g.circle(h.x, h.y, h.radius + rim * 22).fill({ color: 0x403646, alpha: 0.1 });
                g.circle(h.x, h.y, h.radius).stroke({ color: 0xe8b887, width: 3, alpha: 0.65 });
                for (let i = 0; i < 5; i++) {
                    const a = time * 0.12 + i * 1.7;
                    g.ellipse(
                        h.x + Math.cos(a) * h.radius * 0.35,
                        h.y + Math.sin(a) * h.radius * 0.25,
                        h.radius * 0.5,
                        h.radius * 0.25,
                    ).fill({ color: 0xd8b99a, alpha: 0.11 });
                }
                const pulse = (time % 7) / 7;
                if (pulse > 0.8)
                    g.poly([
                        h.x - 110,
                        h.y - 100,
                        h.x + 15,
                        h.y - 15,
                        h.x - 28,
                        h.y + 35,
                        h.x + 100,
                        h.y + 135,
                    ]).stroke({
                        color: 0xffe5b5,
                        width: 4,
                        alpha: Math.sin(((pulse - 0.8) * Math.PI) / 0.2) * 0.7,
                    });
            }
            VENUS_SAMPLES.forEach((p, i) => {
                const done = i < s.campaign.story!.venus!.transmission;
                g.circle(p.x, p.y, done ? 22 : 34).stroke({
                    color: done ? C.mint : C.cyan,
                    width: 2,
                    alpha: 0.7,
                });
                if (done)
                    g.moveTo(p.x - 10, p.y)
                        .lineTo(p.x - 2, p.y + 8)
                        .lineTo(p.x + 13, p.y - 10)
                        .stroke({ color: C.mint, width: 3 });
                else
                    for (let j = 0; j < 3; j++)
                        g.beginPath()
                            .arc(p.x, p.y, 48 + j * 19, time * 0.13 + j, time * 0.13 + j + 1.5)
                            .stroke({ color: 0xd1d4be, width: 2, alpha: 0.25 });
            });
            if (s.escort instanceof VenusProbe && s.escort.state === 'research')
                drawResearchScan(
                    this.scan,
                    s.escort.position,
                    s.escort.sampleTarget,
                    time,
                    s.escort.scanning,
                );
        }
        const core = s.enemies.enemies.get(81900);
        if (core && act.area === 'installation') {
            const p = core.body.translation(),
                x = p.x * 100,
                y = p.y * 100;
            g.circle(x, y, 75).stroke({
                color: act.guardianPhase === 0 ? C.cyan : C.red,
                width: 10,
                alpha: 0.8,
            });
            if (act.guardianPhase === 0)
                g.circle(x, y, 105).stroke({ color: C.cyan, width: 5, alpha: 0.45 });
            if (core.charge > 0)
                g.circle(x, y, 125 + core.charge * 25).stroke({
                    color: C.gold,
                    width: 5,
                    alpha: 0.6,
                });
        }
    }
}
