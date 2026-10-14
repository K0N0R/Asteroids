import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, ShipView, stationView } from '../graphics/shapes';
import { HullId } from '../config';
import type { ShipModules } from '../state/campaign';
import type { RecoverySignal } from '../state/recovery';
import { label } from './primitives';

export type LobbyIcon =
    | 'flight'
    | 'ship'
    | 'station'
    | 'pilot'
    | 'crew'
    | 'signal'
    | 'ore'
    | 'parts'
    | 'cargo'
    | 'health';
export function lobbyIcon(kind: LobbyIcon, color: number = C.mint) {
    const g = new Graphics();
    if (kind === 'flight')
        g.beginPath()
            .circle(0, 0, 12)
            .stroke({ color, width: 1 })
            .poly([0, -9, 5, 7, 0, 3, -5, 7])
            .stroke({ color, width: 2 });
    if (kind === 'ship') g.poly([0, -12, 10, 10, 0, 5, -10, 10]).stroke({ color, width: 2 });
    if (kind === 'station')
        g.rect(-6, -6, 12, 12)
            .stroke({ color, width: 2 })
            .moveTo(-6, 0)
            .lineTo(-13, 0)
            .moveTo(6, 0)
            .lineTo(13, 0)
            .moveTo(0, -6)
            .lineTo(0, -13)
            .moveTo(0, 6)
            .lineTo(0, 13)
            .stroke({ color, width: 2 });
    if (kind === 'pilot')
        g.circle(0, -4, 7)
            .stroke({ color, width: 2 })
            .moveTo(-12, 11)
            .quadraticCurveTo(-10, 2, 0, 3)
            .quadraticCurveTo(10, 2, 12, 11)
            .stroke({ color, width: 2 });
    if (kind === 'crew')
        g.poly([
            -10, 10, -3, 3, -8, -4, -6, -11, -1, -5, 4, -7, 5, -12, 10, -6, 7, 1, 1, 4, -6, 12,
        ]).stroke({ color, width: 2 });
    if (kind === 'signal')
        g.beginPath()
            .circle(0, 0, 3)
            .fill(color)
            .beginPath()
            .arc(0, 0, 8, -1, 1)
            .stroke({ color, width: 2 })
            .beginPath()
            .arc(0, 0, 13, -1, 1)
            .stroke({ color, width: 1 })
            .beginPath()
            .arc(0, 0, 8, Math.PI - 1, Math.PI + 1)
            .stroke({ color, width: 2 });
    if (kind === 'ore')
        g.poly([0, -12, 10, -3, 6, 10, -6, 10, -10, -3])
            .stroke({ color, width: 2 })
            .moveTo(0, -12)
            .lineTo(-2, 3)
            .lineTo(6, 10)
            .stroke({ color, width: 1 });
    if (kind === 'parts')
        g.rect(-8, -8, 16, 16).stroke({ color, width: 2 }).rect(-3, -3, 6, 6).fill(color);
    if (kind === 'cargo')
        g.poly([0, -11, 10, -5, 10, 7, 0, 13, -10, 7, -10, -5])
            .stroke({ color, width: 2 })
            .moveTo(-10, -5)
            .lineTo(0, 1)
            .lineTo(10, -5)
            .moveTo(0, 1)
            .lineTo(0, 13)
            .stroke({ color, width: 1 });
    if (kind === 'health')
        g.poly([-9, -10, 9, -10, 9, 2, 0, 12, -9, 2]).stroke({ color, width: 2 });
    g.eventMode = 'none';
    return g;
}

export function choiceCard(
    parent: Container,
    x: number,
    y: number,
    width: number,
    height: number,
    selected: boolean,
    onClick: () => void,
    enabled = true,
) {
    const root = new Container();
    root.position.set(x, y);
    const bg = new Graphics();
    const draw = (hover: boolean) => {
        bg.clear()
            .roundRect(0, 0, width, height, 10)
            .fill({ color: selected ? 0x102b37 : C.ink, alpha: hover ? 0.98 : 0.8 })
            .stroke({
                color: selected ? C.mint : hover ? C.muted : C.line,
                width: selected ? 2 : 1,
            });
    };
    draw(false);
    root.addChild(bg);
    root.eventMode = enabled ? 'static' : 'none';
    root.hitArea = new Rectangle(0, 0, width, height);
    root.cursor = enabled ? 'pointer' : 'default';
    root.on('pointertap', onClick)
        .on('pointerover', () => draw(true))
        .on('pointerout', () => draw(false));
    parent.addChild(root);
    return root;
}
export function cost(
    parent: Container,
    ore: number,
    parts: number,
    x: number,
    y: number,
    showZeroParts = false,
) {
    const rock = lobbyIcon('ore', C.gold);
    rock.position.set(x + 10, y + 11);
    parent.addChild(rock);
    label(parent, `${ore}`, x + 30, y, 20, C.gold);
    if (parts || showZeroParts) {
        const chip = lobbyIcon('parts', C.cyan);
        chip.position.set(x + 125, y + 11);
        parent.addChild(chip);
        label(parent, `${parts}`, x + 146, y, 20, C.cyan);
    }
}
export function segments(
    parent: Container,
    value: number,
    limit: number,
    x: number,
    y: number,
    width = 150,
) {
    const g = new Graphics();
    for (let i = 0; i < limit; i++)
        g.roundRect(x + i * (width / limit), y, width / limit - 5, 6, 2).fill(
            i < value ? C.mint : C.line,
        );
    parent.addChild(g);
}
export function stat(
    parent: Container,
    title: string,
    value: string,
    x: number,
    y: number,
    kind?: LobbyIcon,
) {
    if (kind) {
        const icon = lobbyIcon(kind);
        icon.position.set(x + 11, y + 24);
        parent.addChild(icon);
    }
    const left = x + (kind ? 34 : 0);
    label(parent, title, left, y, 12, C.muted);
    label(parent, value, left, y + 21, 22);
}

export function fittedShip(modules: ShipModules & { hull: HullId }, width: number, height: number) {
    const root = new Container(),
        ship = new ShipView(modules),
        bounds = ship.getLocalBounds();
    const scale = Math.min(width / Math.max(1, bounds.height), height / Math.max(1, bounds.width));
    ship.rotation = -Math.PI / 2;
    ship.scale.set(scale);
    ship.position.set(
        (-(bounds.minY + bounds.maxY) / 2) * scale,
        ((bounds.minX + bounds.maxX) / 2) * scale,
    );
    root.addChild(ship);
    return root;
}
export function fittedScene(view: Container, width: number, height: number) {
    const root = new Container(),
        bounds = view.getLocalBounds();
    const scale = Math.min(width / Math.max(1, bounds.width), height / Math.max(1, bounds.height));
    view.scale.set(scale);
    view.position.set(
        (-(bounds.minX + bounds.maxX) / 2) * scale,
        (-(bounds.minY + bounds.maxY) / 2) * scale,
    );
    root.addChild(view);
    return root;
}
export function hullPreview(modules: ShipModules & { hull: HullId }) {
    const root = new Container(),
        g = new Graphics();
    g.ellipse(0, 25, 235, 115)
        .stroke({ color: C.line, width: 1 })
        .ellipse(0, 25, 205, 100)
        .stroke({ color: C.cyan, alpha: 0.2, width: 1 });
    for (const side of [-1, 1])
        g.moveTo(side * 270, -140)
            .lineTo(side * 225, -140)
            .lineTo(side * 225, -105)
            .moveTo(side * 270, 145)
            .lineTo(side * 225, 145)
            .lineTo(side * 225, 115);
    g.stroke({ color: C.cyan, alpha: 0.4, width: 2 });
    const ship = fittedShip(modules, 350, 300);
    root.addChild(g, ship);
    return root;
}

export function pilotPortrait(archetype: number, mechanic = false) {
    const root = new Container(),
        g = new Graphics(),
        tint = mechanic ? C.gold : [C.mint, C.gold, C.cyan][archetype % 3];
    g.circle(0, 0, 132).fill({ color: C.ink, alpha: 0.8 }).stroke({ color: C.line, width: 1 });
    g.poly([-104, 109, -91, 61, -48, 40, 48, 40, 91, 61, 104, 109])
        .fill(0x253942)
        .stroke({ color: tint, width: 2 });
    g.roundRect(-64, -100, 128, 152, 46).fill(0x4c545b).stroke({ color: 0x737373, width: 5 });
    g.roundRect(-53, -67, 106, 56, 21).fill(0x10242b).stroke({ color: tint, width: 3 });
    g.moveTo(-36, -56).lineTo(30, -56).stroke({ color: tint, width: 2, alpha: 0.55 });
    g.rect(-76, -49, 13, 52)
        .fill(0x33373a)
        .rect(63, -49, 13, 52)
        .fill(0x33373a)
        .roundRect(-30, 5, 60, 22, 7)
        .fill(0x33373a);
    g.moveTo(-23, 16).lineTo(23, 16).stroke({ color: tint, width: 2 });
    for (let i = -1; i <= 1; i++) g.rect(-6 + i * 14, 73, 8, 4).fill(tint);
    root.addChild(g);
    return root;
}

export function stationScene(level: number, selected: 'workshop' | 'storage') {
    const root = new Container(),
        view = stationView(level),
        g = new Graphics();
    view.scale.set(1.8);
    root.addChild(view);
    const x = selected === 'workshop' ? 230 : -230;
    g.moveTo(x * 0.58, 0)
        .lineTo(x, 0)
        .stroke({ color: C.mint, width: 2, alpha: 0.65 })
        .beginPath()
        .circle(x, 0, 38)
        .fill(C.ink)
        .stroke({ color: C.mint, width: 2 });
    const icon = lobbyIcon(selected === 'workshop' ? 'crew' : 'cargo');
    icon.position.set(x, 0);
    icon.scale.set(1.8);
    root.addChild(g, icon);
    return root;
}

export function workshopScene(kind: 'refine' | 'kit') {
    const root = new Container(),
        g = new Graphics();
    g.poly([-265, 76, -215, 128, 215, 128, 265, 76, 215, -115, -215, -115])
        .fill({ color: 0x0b1d2b, alpha: 0.9 })
        .stroke({ color: C.line, width: 2 });
    g.moveTo(-175, -115)
        .lineTo(-175, 80)
        .lineTo(-80, 80)
        .moveTo(175, -115)
        .lineTo(175, 80)
        .lineTo(80, 80)
        .stroke({ color: C.cyan, width: 5, alpha: 0.55 });
    for (let i = 0; i < 4; i++) g.rect(-180 + i * 120, 117, 50, 7).fill(C.gold);
    const input = lobbyIcon('ore', C.gold);
    input.scale.set(3);
    input.position.set(-135, 0);
    const output = lobbyIcon(kind === 'refine' ? 'parts' : 'health', C.mint);
    output.scale.set(3.5);
    output.position.set(130, 0);
    g.moveTo(-45, 0)
        .lineTo(45, 0)
        .moveTo(29, -13)
        .lineTo(45, 0)
        .lineTo(29, 13)
        .stroke({ color: C.mint, width: 3 });
    root.addChild(g, input, output);
    label(root, kind === 'refine' ? '8 rudy' : '6 rudy + 1 komponent', -190, 56, 15, C.gold);
    label(root, kind === 'refine' ? '1 komponent' : '1 zestaw', 77, 56, 15, C.mint);
    return root;
}

export function operationScene(research: boolean) {
    const root = new Container(),
        g = new Graphics(),
        home = stationView();
    home.scale.set(0.55);
    home.position.set(-160, 0);
    g.moveTo(-85, 0)
        .bezierCurveTo(0, -70, 65, 75, 170, 0)
        .stroke({ color: C.gold, width: 2, alpha: 0.5 });
    const goal = research ? lobbyIcon('signal', C.cyan) : lobbyIcon('ore', C.gold);
    goal.scale.set(3);
    goal.position.set(215, 0);
    g.beginPath()
        .circle(215, 0, 66)
        .stroke({ color: research ? C.cyan : C.gold, alpha: 0.25, width: 1 });
    root.addChild(g, home, goal);
    label(root, 'Aurora', -189, 91, 15, C.muted);
    label(root, research ? 'Dane sektora' : 'Złoża surowców', 155, 91, 15, C.muted);
    return root;
}

export function signalScene(
    signals: readonly RecoverySignal[],
    selected: number | null,
    choose: (id: number) => void,
) {
    const root = new Container(),
        g = new Graphics(),
        radius = 215;
    for (const r of [70, 140, radius])
        g.beginPath().circle(0, 0, r).stroke({ color: C.line, width: 1 });
    g.moveTo(-radius, 0)
        .lineTo(radius, 0)
        .moveTo(0, -radius)
        .lineTo(0, radius)
        .stroke({ color: C.line, width: 1 });
    root.addChild(g);
    const base = lobbyIcon('station');
    base.scale.set(1.4);
    root.addChild(base);
    for (const signal of signals) {
        const x = (signal.x / 5400) * radius,
            y = (signal.y / 5400) * radius;
        const mark = choiceCard(root, x - 23, y - 23, 46, 46, selected === signal.id, () =>
            choose(signal.id),
        );
        const icon = lobbyIcon('signal', selected === signal.id ? C.mint : C.gold);
        icon.position.set(23, 23);
        mark.addChild(icon);
        label(root, `#${signal.id}`, x + 29, y - 8, 15, C.text);
    }
    return root;
}
export function bareModules(hull: HullId): ShipModules & { hull: HullId } {
    return { hull, engine: 0, handling: 0, cargo: 0, drill: 0, armor: 0 };
}
