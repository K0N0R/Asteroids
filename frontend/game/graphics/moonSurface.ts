import { Container, Graphics } from 'pixi.js';
import { MOON } from '../worlds/moon';
import { random } from '../worlds/sector';
import { worldLabel as label } from '../ui/primitives';
import { rotateVector } from '../systems/flight';
import type { Point } from '../worlds/sector';
import { C } from './shapes';
import { drawLunarTerrain } from './lunarTerrain';

export class MoonSurfaceView extends Container {
    private ground = new Container();
    private details = new Graphics();
    private horizon = new Graphics();
    private site = new Graphics();
    private orbitGate = new Container();
    private passageProgress = new Graphics({ label: 'lunar-passage-progress' });
    private status: ReturnType<typeof label> | null = null;
    private titles: { view: ReturnType<typeof label>; anchor: Point; offset: Point }[] = [];
    private stage = -1;
    private defenseMarkers = new Graphics();
    constructor(enabled: boolean) {
        super();
        this.visible = enabled;
        this.eventMode = 'none';
        if (!enabled) return;
        this.label = 'moon-surface';
        this.ground.position.copyFrom(MOON.center);
        const overview = new Graphics();
        drawLunarTerrain(overview, MOON.radius);
        const terrain = this.details;
        const terrainMask = new Graphics().circle(0, 0, MOON.radius).fill(0xffffff);
        this.ground.addChild(terrainMask);
        this.ground.mask = terrainMask;
        const rng = random(150015);
        for (let i = 0; i < 170; i++) {
            const x = (rng() - 0.5) * (MOON.radius * 2.3),
                y = (rng() - 0.5) * (MOON.radius * 2.3),
                r = 24 + rng() * 140;
            terrain
                .ellipse(x + 4, y + 9, r, r * 0.82)
                .fill(0xd9d8e7)
                .ellipse(x, y, r, r * 0.82)
                .fill(0x8588aa)
                .ellipse(x - r * 0.13, y - r * 0.13, r * 0.65, r * 0.52)
                .fill(0x999dbb);
        }
        for (let i = 0; i < 220; i++)
            terrain
                .circle(
                    (rng() - 0.5) * (MOON.radius * 2.3),
                    (rng() - 0.5) * (MOON.radius * 2.3),
                    1 + rng() * 3,
                )
                .fill({ color: 0x9b9cba, alpha: 0.2 });
        // Broad dark shelves distinguish the distant extraction site from the base basin.
        const ridgeX = MOON.copperRidge.x - MOON.center.x;
        const ridgeY = MOON.copperRidge.y - MOON.center.y;
        for (let i = 0; i < 5; i++)
            terrain
                .ellipse(ridgeX + i * 65 - 130, ridgeY + i * 45 - 90, 230, 115)
                .fill({ color: 0x2b3051, alpha: 0.65 });
        this.horizon
            .moveTo(0, -MOON.radius)
            .arc(0, 0, MOON.radius, -Math.PI / 2, Math.PI / 2)
            .lineTo(0, -MOON.radius)
            .closePath()
            .fill(0x202b61);
        this.ground.addChild(overview, terrain, this.horizon);
        const gate = (host: Container, x: number, y: number, title: string) => {
            const g = new Container();
            g.position.set(x, y);
            g.addChild(
                new Graphics()
                    .circle(0, 0, 145)
                    .fill({ color: C.cyan, alpha: 0.04 })
                    .beginPath()
                    .poly([-40, 15, 0, -25, 40, 15])
                    .stroke({ color: C.mint, width: 5 }),
            );
            this.addTitle(g, title, { x: 0, y: 0 }, { x: 0, y: 170 }, 20, C.cyan, 260);
            this.addTitle(g, 'E · 2 s', { x: 0, y: 0 }, { x: 0, y: 201 }, 16, C.muted);
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
        this.status = this.addTitle(
            this.ground,
            '',
            { x: MOON.construction.x - MOON.center.x, y: 0 },
            { x: 0, y: 150 },
            20,
            C.mint,
            340,
        );
        this.addTitle(
            this.ground,
            'Złoże powierzchniowe · 2',
            { x: MOON.quarry.x - MOON.center.x, y: MOON.quarry.y - MOON.center.y },
            { x: 0, y: 220 },
            20,
            C.gold,
        );
        this.addTitle(
            this.ground,
            'Grzbiet miedziowy · 5',
            { x: ridgeX, y: ridgeY },
            { x: 0, y: 390 },
            20,
            C.gold,
        );
        this.addTitle(
            this.ground,
            'Cu · opcjonalne wydobycie',
            { x: ridgeX, y: ridgeY },
            { x: 0, y: 425 },
            16,
            C.muted,
        );
        this.addChild(this.ground, this.orbitGate, this.passageProgress);
    }
    private addTitle(
        host: Container,
        text: string,
        anchor: Point,
        offset: Point,
        size: number,
        color: number,
        width?: number,
    ) {
        const view = label(
            host,
            text,
            anchor.x + offset.x,
            anchor.y + offset.y,
            size,
            color,
            width,
        );
        this.titles.push({ view, anchor, offset });
        return view;
    }
    update(surface: boolean, stage: number, cameraAngle: number, detail = 1, progress = 0) {
        if (!this.visible) return;
        this.passageProgress.clear();
        if (progress > 0) {
            const anchor = surface ? MOON.exit : MOON.entrance;
            this.passageProgress
                .beginPath()
                .arc(
                    anchor.x,
                    anchor.y,
                    155,
                    -Math.PI / 2,
                    -Math.PI / 2 + Math.min(1, progress / MOON.transferSeconds) * Math.PI * 2,
                )
                .stroke({ color: C.mint, width: 4 });
        }
        this.details.alpha = detail;
        this.horizon.alpha = (1 - detail) * 0.24;
        for (const title of this.titles) {
            title.view.visible = detail > 0.35;
            title.view.rotation = -cameraAngle;
            const offset = rotateVector(title.offset, -cameraAngle);
            title.view.position.set(title.anchor.x + offset.x, title.anchor.y + offset.y);
        }
        this.ground.visible = surface;
        this.orbitGate.visible = !surface;
        if (stage === this.stage) return;
        this.stage = stage;
        const g = this.site.clear();
        g.roundRect(-175, -125, 350, 250, 28)
            .fill(0x26353e)
            .circle(0, 0, 75)
            .stroke({ color: C.cyan, width: 2, alpha: 0.4 });
        if (stage === 0) {
            for (const side of [-1, 1]) g.rect(side * 130 - 12, -80, 24, 160).fill(0x796f59);
        } else {
            g.roundRect(-110, -85, 220, 170, 18).fill(0x6c8087);
            g.roundRect(-35, -70, 70, 140, 10).fill(0x3b525e);
            if (stage >= 2) {
                for (const side of [-1, 1])
                    g.roundRect(side * 100 - 27, -70, 54, 140, 18).fill(0x9a8967);
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
        showApproach = true,
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
        if (showApproach && d.state === 'warning') {
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
