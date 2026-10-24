import { Container, Graphics, Circle } from 'pixi.js';
import { planetView } from '../graphics/planetView';
import { C } from '../graphics/shapes';
import { random } from '../worlds/sector';
import type { Campaign } from '../state/campaign';
import { STORY_SECTORS, storySectorUnlocked, type StorySectorId } from '../state/story';
import { illustrationInBox, label } from './primitives';

/** Schematic orbits: deliberately spread labels and bodies, with the Sun at the center. */
export const SOLAR_MAP = [
    { id: 'mercury', orbit: 105, angle: -1.1, radius: 16 },
    { id: 'venus', orbit: 165, angle: 2.55, radius: 23 },
    { id: 'earth', orbit: 225, angle: -2.15, radius: 27 },
    { id: 'mars', orbit: 285, angle: 0.58, radius: 22 },
    { id: 'belt', orbit: 330, angle: 2.65, radius: 29 },
    { id: 'jupiter', orbit: 375, angle: 3.45, radius: 42 },
    { id: 'saturn', orbit: 435, angle: -0.65, radius: 43 },
    { id: 'uranus', orbit: 485, angle: 1.75, radius: 30 },
    { id: 'neptune', orbit: 535, angle: -1.5, radius: 30 },
    { id: 'pluto', orbit: 580, angle: 0.17, radius: 15 },
] as const satisfies readonly { id: StorySectorId; orbit: number; angle: number; radius: number }[];

/** Local sunlight stays behind map symbols and labels. */
function solarBackdrop(ui: Container, center: { x: number; y: number }) {
    const backdrop = ui.addChild(new Container());
    backdrop.label = 'solar-map-backdrop';
    backdrop.eventMode = 'none';
    const glow = backdrop.addChild(new Graphics());
    for (let i = 0; i < 80; i++)
        glow.circle(center.x, center.y, 205 - i * 2).fill({
            color: 0xffbd70,
            alpha: 0.003 + i * 0.00004,
        });
}

export function solarSystem(ui: Container, c: Campaign, select: (id: StorySectorId) => void) {
    const planets: ReturnType<typeof planetView>[] = [];
    if (!c.story) return planets;
    const center = { x: 920, y: 490 };
    const destinations = SOLAR_MAP.filter((body) => storySectorUnlocked(c.story!, body.id));
    solarBackdrop(ui, center);
    const g = ui.addChild(new Graphics());
    for (const body of destinations)
        g.ellipse(center.x, center.y, body.orbit, body.orbit * 0.46).stroke({
            color: C.line,
            alpha: 0.28,
            width: 1,
        });
    const belt = SOLAR_MAP.find((body) => body.id === 'belt')!;
    const rng = random(150099);
    const debris = ui.addChild(new Graphics());
    debris.eventMode = 'none';
    for (let i = 0; i < (destinations.some((body) => body.id === 'belt') ? 1000 : 0); i++) {
        const angle = rng() * Math.PI * 2;
        // One radial corridor cuts the belt; the rest is a continuous orbital band.
        if (
            Math.abs(Math.atan2(Math.sin(angle - belt.angle), Math.cos(angle - belt.angle))) < 0.075
        )
            continue;
        const radius = belt.orbit + (rng() + rng() - 1) * 23;
        const x = center.x + Math.cos(angle) * radius,
            y = center.y + Math.sin(angle) * radius * 0.46;
        const size = 0.8 + rng() * 2.1;
        debris
            .ellipse(x, y, size, size * (0.5 + rng() * 0.4))
            .fill({ color: [0xa6aac6, 0x7d879e, 0xd1bdad][i % 3], alpha: 0.3 + rng() * 0.5 });
    }
    g.circle(center.x, center.y, 39).fill(C.gold);
    g.circle(center.x - 9, center.y - 10, 25).fill(0xffdf9f);
    label(ui, 'Słońce', center.x - 30, center.y + 53, 16, C.gold);
    for (const body of destinations) {
        const node = ui.addChild(new Container());
        node.label = `solar-sector-${body.id}`;
        node.position.set(
            center.x + Math.cos(body.angle) * body.orbit,
            center.y + Math.sin(body.angle) * body.orbit * 0.46,
        );
        const unlocked = storySectorUnlocked(c.story, body.id),
            selected =
                c.story.sector === body.id || (body.id === 'earth' && c.story.sector === 'lunar');
        const canSelect = unlocked && !c.activeRun;
        const ring = node.addChild(new Graphics());
        const draw = (hover = false) => {
            ring.clear();
            if (selected) ring.circle(0, 0, body.radius + 12).stroke({ color: C.mint, width: 3 });
            else if (hover && canSelect)
                ring.circle(0, 0, body.radius + 10).stroke({
                    color: C.cyan,
                    alpha: 0.65,
                    width: 2,
                });
        };
        draw();
        if (body.id === 'belt') {
            const passage = node.addChild(new Graphics());
            passage.rotation = Math.atan2(Math.sin(body.angle) * 0.46, Math.cos(body.angle));
            const color = unlocked ? C.mint : C.muted;
            passage
                .moveTo(-25, -10)
                .lineTo(25, -10)
                .moveTo(-25, 10)
                .lineTo(25, 10)
                .stroke({ color, width: 2 });
            passage.moveTo(-9, 0).lineTo(9, 0).stroke({ color, width: 3 });
            passage.circle(-25, 0, 3).circle(25, 0, 3).fill(color);
        } else {
            const planet = planetView(body.id);
            planets.push(planet);
            const art = illustrationInBox(
                node,
                planet,
                -body.radius,
                -body.radius,
                body.radius * 2,
                body.radius * 2,
            );
            art.alpha = unlocked ? 1 : 0.5;
        }
        if (body.id === 'earth') illustrationInBox(node, planetView('lunar'), 31, 8, 18, 18);
        const name = label(
            node,
            body.id === 'earth'
                ? 'Ziemia–Księżyc'
                : body.id === 'belt'
                  ? 'Przejście przez pas'
                  : STORY_SECTORS[body.id].shortName,
            -85,
            body.id === 'mercury' ? -body.radius - 42 : body.radius + 20,
            16,
            selected ? C.mint : unlocked ? C.text : C.muted,
            170,
        );
        name.setHorizontalAlign('center');
        name.x = 0;
        const status = label(
            node,
            selected ? 'Wybrany sektor' : unlocked ? 'Dostępny' : 'Zablokowany',
            0,
            body.id === 'mercury' ? -body.radius - 21 : body.radius + 41,
            12,
            selected ? C.mint : C.muted,
        );
        status.setHorizontalAlign('center');
        node.eventMode = canSelect ? 'static' : 'none';
        node.cursor = canSelect ? 'pointer' : 'default';
        node.hitArea = new Circle(0, 10, body.radius + 25);
        node.on('pointertap', () => {
            if (canSelect) select(body.id);
        });
        node.on('pointerover', () => draw(true));
        node.on('pointerout', () => draw());
    }
    label(ui, 'WYBRANY SEKTOR', 300, 789, 12, C.muted);
    label(ui, STORY_SECTORS[c.story.sector].name, 300, 811, 20, C.mint);
    return planets;
}
