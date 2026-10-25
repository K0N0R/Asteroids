import { Container, Graphics } from 'pixi.js';
import { planetView } from './planetView';
import { C } from './shapes';
import { worldLabel } from '../ui/primitives';
import { V, VENUS_MAPS, venusStorms } from '../worlds/venusLayout';
import type { MissionSimulation } from '../systems/mission';

/** Reused vector layers: no render textures, workers, filters or per-frame text allocation. */
export class VenusActView extends Container {
    private orbit = new Container();
    private lab = new Container();
    private atmosphere = new Container();
    private installation = new Container();
    private dynamic = new Graphics();
    private labels = new Map<string, ReturnType<typeof worldLabel>>();
    constructor() {
        super();
        this.eventMode = 'none';
        this.addChild(this.orbit, this.lab, this.atmosphere, this.installation, this.dynamic);
        const globe = planetView('venus');
        globe.scale.set(7);
        globe.position.set(0, 3600);
        this.orbit.addChild(globe);
        const relay = this.orbit.addChild(new Graphics());
        relay
            .roundRect(V.relay.x - 70, V.relay.y - 75, 140, 150, 28)
            .fill(C.line)
            .circle(V.relay.x, V.relay.y, 40)
            .fill(C.cyan);
        for (const sign of [-1, 1])
            relay
                .roundRect(V.relay.x + sign * 140 - 40, V.relay.y - 100, 80, 200, 12)
                .fill(0x34516d);
        const g = this.lab.addChild(new Graphics());
        for (const [x, y, w, h] of [
            [19300, -120, 500, 240],
            [19800, -700, 400, 400],
            [20400, 0, 650, 450],
        ]) {
            g.roundRect(x, y, w, h, 45).fill(0x384759).stroke({ color: 0x6e879b, width: 10 });
            for (let i = 0; i < 3; i++)
                g.roundRect(x + 35 + i * 70, y + 40, 40, 65, 10).fill(0x547d8c);
        }
        g.moveTo(19700, 0)
            .lineTo(20000, -500)
            .lineTo(20700, 250)
            .stroke({ color: 0x617d8e, width: 35 });
        g.circle(V.power.x, V.power.y, 60)
            .fill(C.gold)
            .roundRect(V.archive.x - 70, V.archive.y - 60, 140, 120, 20)
            .fill(0x607f90);
        const at = this.atmosphere.addChild(new Graphics());
        at.circle(40000, 0, 2600).fill({ color: 0x7e6147, alpha: 0.45 });
        for (let i = 0; i < 18; i++)
            at.ellipse(
                40000 + Math.sin(i * 3.3) * 1800,
                Math.cos(i * 2.1) * 2100,
                650 + (i % 4) * 130,
                240 + (i % 3) * 60,
            ).fill({
                color: i % 2 ? 0xb48c64 : 0xe4c594,
                alpha: 0.08,
            });
        const ai = this.installation.addChild(new Graphics());
        ai.circle(60300, -200, 950).stroke({ color: 0x543449, width: 35, alpha: 0.8 });
        ai.roundRect(V.terminal.x - 95, V.terminal.y - 85, 190, 170, 30)
            .fill(0x43576b)
            .stroke({ color: C.cyan, width: 8 });
        for (const p of V.anchors)
            ai.moveTo(p.x, p.y)
                .lineTo(V.guardian.x, V.guardian.y)
                .stroke({ color: 0x62506b, width: 14 });
        for (const [id, p, name] of [
            ['relay', V.relay, 'Przekaźnik orbitalny'],
            ['power', V.power, 'Zasilanie awaryjne'],
            ['archive', V.archive, 'Archiwum'],
            ['terminal', V.terminal, 'Terminal instalacji'],
        ] as const) {
            this.labels.set(`venus:${id}`, worldLabel(this, name, p.x, p.y + 140, 17, C.cyan));
        }
    }
    update(s: MissionSimulation, time: number, angle: number) {
        const v = s.venusAct;
        if (!v) {
            this.visible = false;
            return;
        }
        this.visible = true;
        this.orbit.visible = s.inVisibleMap(VENUS_MAPS.orbit.center);
        this.lab.visible = s.inVisibleMap(VENUS_MAPS.station.center);
        this.atmosphere.visible = s.inVisibleMap(VENUS_MAPS.atmosphere.center);
        this.installation.visible = s.inVisibleMap(VENUS_MAPS.installation.center);
        for (const [id, label] of this.labels) {
            label.visible = v.targets.some((t) => t.id === id);
            label.rotation = -angle;
        }
        const g = this.dynamic.clear();
        if (v.area === 'atmosphere')
            for (const h of venusStorms(time)) {
                g.circle(h.x, h.y, h.radius + 50).stroke({ color: C.gold, width: 5, alpha: 0.35 });
                for (let i = 0; i < 5; i++)
                    g.ellipse(
                        h.x + Math.sin(time * 0.2 + i) * 70,
                        h.y + Math.cos(time * 0.15 + i) * 50,
                        h.radius - i * 45,
                        h.radius * 0.65 - i * 25,
                    ).fill({ color: 0xe0af78, alpha: 0.08 });
                const phase = time % 6;
                if (phase > 4.8)
                    g.poly([
                        h.x - 80,
                        h.y - 200,
                        h.x + 30,
                        h.y - 40,
                        h.x - 30,
                        h.y + 30,
                        h.x + 100,
                        h.y + 200,
                    ]).stroke({ color: 0xffedd1, width: 7, alpha: (phase - 4.8) / 1.2 });
            }
        const e = s.escort;
        if (e && v.area === 'atmosphere' && e.state === 'research' && e.scanning) {
            const p = e.position,
                end = { x: p.x + 300 + Math.sin(time * 0.8) * 120, y: p.y + 460 };
            g.poly([p.x, p.y, end.x - 110, end.y, end.x + 110, end.y]).fill({
                color: C.cyan,
                alpha: 0.12,
            });
            g.moveTo(p.x, p.y).lineTo(end.x, end.y).stroke({ color: C.cyan, width: 4, alpha: 0.8 });
            for (let i = 0; i < 3; i++)
                g.circle(end.x, end.y, ((time * 0.5 + i / 3) % 1) * 120).stroke({
                    color: C.mint,
                    width: 3,
                    alpha: 1 - ((time * 0.5 + i / 3) % 1),
                });
        }
        const core = s.enemies.enemies.get(81900);
        if (core && v.area === 'installation') {
            const q = core.body.translation(),
                x = q.x * 100,
                y = q.y * 100;
            g.circle(x, y, 75).stroke({
                color: v.guardianPhase === 0 ? C.cyan : C.red,
                width: 10,
                alpha: 0.8,
            });
            if (v.guardianPhase === 0)
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
