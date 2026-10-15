import { Container, Graphics } from 'pixi.js';
import { MOON } from '../worlds/moon';
import { random } from '../worlds/sector';
import { label } from '../ui/primitives';
import { C } from './shapes';

export class MoonSurfaceView extends Container {
    private ground = new Container();
    private site = new Graphics();
    private orbitGate = new Container();
    private status: ReturnType<typeof label> | null = null;
    private titles: ReturnType<typeof label>[] = [];
    private stage = -1;
    private defenseMarkers = new Graphics();
    constructor(enabled: boolean) {
        super();
        this.visible = enabled;
        this.eventMode = 'none';
        if (!enabled) return;
        this.ground.position.copyFrom(MOON.center);
        const terrain = new Graphics().rect(-6000, -6000, 12000, 12000).fill(0x343f48);
        const rng = random(150015);
        for (let i = 0; i < 100; i++) {
            const x = (rng() - 0.5) * 4000,
                y = (rng() - 0.5) * 4000,
                r = 24 + rng() * 140;
            terrain
                .ellipse(x + 4, y + 9, r, r * 0.82)
                .fill(0x46515a)
                .ellipse(x, y, r, r * 0.82)
                .fill(0x29353f)
                .ellipse(x - r * 0.13, y - r * 0.13, r * 0.65, r * 0.52)
                .fill(0x303c45);
        }
        for (let i = 0; i < 480; i++)
            terrain
                .circle((rng() - 0.5) * 4000, (rng() - 0.5) * 4000, 1 + rng() * 3)
                .fill({ color: 0x8b9499, alpha: 0.2 });
        this.ground.addChild(terrain);
        const gate = (host: Container, x: number, y: number, title: string) => {
            const g = new Container();
            g.position.set(x, y);
            g.addChild(
                new Graphics()
                    .circle(0, 0, 145)
                    .fill({ color: C.cyan, alpha: 0.04 })
                    .stroke({ color: C.cyan, width: 3, alpha: 0.65 })
                    .poly([-40, 15, 0, -25, 40, 15])
                    .stroke({ color: C.mint, width: 5 }),
            );
            this.titles.push(label(g, title, -125, 170, 20, C.cyan, 260));
            this.titles.push(label(g, 'E · 2 s', -40, 201, 16, C.muted));
            host.addChild(g);
        };
        gate(this.orbitGate, MOON.entrance.x, MOON.entrance.y, 'Podejście do Księżyca');
        gate(
            this.ground,
            MOON.exit.x - MOON.center.x,
            MOON.exit.y - MOON.center.y,
            'Powrót na orbitę',
        );
        this.site.position.set(
            MOON.construction.x - MOON.center.x,
            MOON.construction.y - MOON.center.y,
        );
        this.ground.addChild(this.site, this.defenseMarkers);
        this.status = label(this.ground, '', 140, 150, 20, C.mint, 340);
        this.titles.push(
            this.status,
            label(this.ground, 'Złoże powierzchniowe · 2', -280, 1060, 20, C.gold),
        );
        this.addChild(this.ground, this.orbitGate);
    }
    update(surface: boolean, stage: number, cameraAngle: number) {
        if (!this.visible) return;
        for (const title of this.titles) title.rotation = -cameraAngle;
        this.ground.visible = surface;
        this.orbitGate.visible = !surface;
        if (stage === this.stage) return;
        this.stage = stage;
        const g = this.site.clear();
        g.roundRect(-175, -125, 350, 250, 28)
            .fill(0x26353e)
            .stroke({ color: 0x899ca5, width: 7 })
            .circle(0, 0, 75)
            .stroke({ color: C.cyan, width: 2, alpha: 0.4 });
        if (stage === 0) {
            for (const side of [-1, 1]) g.rect(side * 130 - 12, -80, 24, 160).fill(0x796f59);
        } else {
            g.roundRect(-110, -85, 220, 170, 18)
                .fill(0x6c8087)
                .stroke({ color: 0xb2c3c6, width: 4 });
            g.roundRect(-35, -70, 70, 140, 10).fill(0x3b525e);
            if (stage >= 2) {
                for (const side of [-1, 1])
                    g.roundRect(side * 100 - 27, -70, 54, 140, 18)
                        .fill(0x9a8967)
                        .stroke({ color: 0xc1b38e, width: 4 });
                g.circle(0, 0, 23).fill(stage === 3 ? C.mint : C.cyan);
            }
        }
        this.status!.setText(
            [
                'Budowa · fundamenty / ruda',
                'Budowa · instalacje / komponenty',
                'Instalacje gotowe · E odbiór',
                'Stacja paliw · odbiór zakończony',
            ][stage],
        );
    }
    updateDefense(
        d: { state: string; health: number; angle: number },
        threats: { x: number; y: number; radius: number }[],
        maxHealth = 100,
    ) {
        const g = this.defenseMarkers.clear();
        if (!this.visible || d.state === 'idle') return;
        const x = MOON.construction.x - MOON.center.x,
            y = MOON.construction.y - MOON.center.y;
        const color = d.state === 'complete' ? C.mint : d.health < 40 ? C.red : C.gold;
        g.circle(x, y, 155)
            .stroke({ color, width: 3, alpha: 0.65 })
            .rect(x - 125, y - 165, 250, 10)
            .fill(0x15232d)
            .rect(x - 125, y - 165, (250 * d.health) / maxHealth, 10)
            .fill(color);
        if (d.state === 'warning') {
            const sx = x + Math.cos(d.angle) * 850,
                sy = y + Math.sin(d.angle) * 850;
            g.moveTo(sx, sy)
                .lineTo(x, y)
                .stroke({ color: C.red, alpha: 0.35, width: 3 })
                .circle(sx, sy, 60)
                .stroke({ color: C.gold, alpha: 0.7, width: 4 });
        }
        for (const rock of threats) {
            const rx = rock.x - MOON.center.x,
                ry = rock.y - MOON.center.y;
            g.circle(rx, ry, rock.radius + 13)
                .stroke({ color: C.red, width: 3, alpha: 0.85 })
                .moveTo(rx, ry)
                .lineTo(x, y)
                .stroke({ color: C.red, width: 1, alpha: 0.16 });
        }
    }
}
