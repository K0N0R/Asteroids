import { genericPortrait, STORY_PORTRAITS } from '../graphics/portraitAppearance';
import { portraitView } from '../graphics/portraitView';
import { KineticShield, shieldProfile } from '../systems/kineticShield';
import { drawKineticShield } from '../graphics/kineticShieldView';
import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, ShipView, stationView, DroneView } from '../graphics/shapes';
import { HullId, WeaponId } from '../config';
import type { ShipModules } from '../state/campaign';
import type { RecoverySignal } from '../state/recovery';
import { label } from './primitives';

export type LobbyIcon =
    | 'system'
    | 'flight'
    | 'ship'
    | 'station'
    | 'pilot'
    | 'crew'
    | 'laboratory'
    | 'signal'
    | 'ore'
    | 'parts'
    | 'crystals'
    | 'cargo'
    | 'health'
    | 'shield';
export function lobbyIcon(kind: LobbyIcon, color: number = C.mint) {
    const g = new Graphics();
    if (kind === 'system') {
        g.circle(0, 0, 4).fill(color).ellipse(0, 0, 13, 8).stroke({ color, width: 1.5 });
        g.circle(10, -5, 3).fill(color);
    }
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
    if (kind === 'laboratory') {
        g.roundRect(-4, -13, 8, 17, 3).roundRect(-8, -14, 16, 5, 2).fill(color);
        g.circle(0, 5, 11).fill(color);
        g.circle(-3, 3, 3).fill(C.ink);
        g.circle(4, 8, 2).fill(C.ink);
    }
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
    if (kind === 'crystals')
        g.poly([0, -13, 8, 0, 0, 13, -8, 0])
            .stroke({ color, width: 2 })
            .moveTo(0, -13)
            .lineTo(0, 13)
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
    if (kind === 'shield')
        g.poly([0, -12, 10, -6, 10, 6, 0, 12, -10, 6, -10, -6]).stroke({ color: C.cyan, width: 2 });
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
            .roundRect(0, 0, width, height, 14)
            .fill({ color: selected || hover ? C.raised : C.panel, alpha: 0.97 });
        if (selected) bg.roundRect(0, 12, 5, height - 24, 2.5).fill(C.mint);
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
    crystals = 0,
) {
    if (crystals) {
        const icon = lobbyIcon('crystals', 0xc2a0ec);
        icon.position.set(x + 250, y + 11);
        parent.addChild(icon);
        label(parent, `${crystals}`, x + 272, y, 20, 0xc2a0ec);
        label(parent, 'Krzem (Si)', x + 250, y + 23, 10, C.muted);
    }
    const rock = lobbyIcon('ore', C.gold);
    rock.position.set(x + 10, y + 11);
    parent.addChild(rock);
    label(parent, `${ore}`, x + 30, y, 20, C.gold);
    label(parent, 'Żelazo (Fe)', x, y + 23, 10, C.muted);
    if (parts || showZeroParts) {
        const chip = lobbyIcon('parts', C.cyan);
        chip.position.set(x + 125, y + 11);
        parent.addChild(chip);
        label(parent, `${parts}`, x + 146, y, 20, C.cyan);
        label(parent, 'Poszycie stalowe I', x + 115, y + 23, 10, C.muted);
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

export function fittedShip(
    modules: ShipModules & { hull: HullId; weapon?: WeaponId },
    width: number,
    height: number,
) {
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
export function hullPreview(modules: ShipModules & { hull: HullId; weapon?: WeaponId }) {
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
    if (modules.shield) {
        const shield = new Graphics();
        drawKineticShield(
            shield,
            new KineticShield(shieldProfile(modules.hull, modules.shield)),
            138,
            0,
            modules.shield,
        );
        shield.scale.y = 0.82;
        root.addChild(shield);
    }
    root.addChild(g, ship);
    return root;
}

export function pilotPortrait(archetype: number, mechanic = false, identity = archetype + 1) {
    return portraitView(mechanic ? STORY_PORTRAITS.mechanic : genericPortrait(identity, archetype));
}

/** Production bay: machines, workbench and material processing unlocked by each tier. */
export function productionBayScene(level: number) {
    const root = new Container(),
        g = new Graphics();
    // A cutaway assembly room, with rounded machinery instead of a station overview.
    g.roundRect(-270, -150, 540, 300, 40).fill(0x253855);
    g.roundRect(-250, -132, 500, 224, 30).fill(0x1b2944);
    g.roundRect(-240, 103, 480, 26, 13).fill(0x526d88);
    for (const x of [-215, 175]) g.roundRect(x, -109, 40, 150, 19).fill(0x7d9bb1);
    g.roundRect(-185, -90, 370, 15, 7).fill(0xa7c4d6);
    g.roundRect(-130, -90, 66, 47, 14).fill(C.cyan);
    g.roundRect(-108, -48, 22, 53, 10).fill(0xbcd5df);
    g.roundRect(-126, -2, 57, 16, 8).fill(C.mint);
    g.roundRect(-155, 45, 310, 29, 12).fill(0xb4cad8);
    for (const x of [-140, 118]) g.roundRect(x, 69, 22, 36, 8).fill(0x7891aa);
    // Workpiece and control display.
    g.roundRect(-53, 5, 109, 34, 12).fill(0xf0c47f);
    g.roundRect(-32, 14, 68, 9, 4).fill(0xffe3ab);
    g.roundRect(84, -43, 77, 63, 14).fill(0x647e9a);
    g.roundRect(94, -33, 57, 42, 9).fill(0x13213a);
    for (let i = 0; i < 3; i++) g.roundRect(103, -23 + i * 11, 25 + i * 7, 5, 2).fill(C.mint);
    for (let i = 0; i < 3; i++)
        g.circle(-211, -82 + i * 29, 6).fill(i <= level ? C.mint : 0x405574);
    if (level >= 1) {
        g.roundRect(183, 37, 47, 56, 15).fill(0xe7b979);
        g.roundRect(193, 49, 27, 20, 7).fill(0x637a92);
    }
    if (level >= 2) {
        g.roundRect(-228, 37, 53, 56, 15).fill(0x8bcfc6);
        g.roundRect(-217, 49, 31, 20, 7).fill(0x324d6a);
    }
    root.addChild(g);
    return root;
}

export function operationScene(research: boolean, combat = false) {
    const root = new Container(),
        g = new Graphics(),
        home = stationView();
    home.scale.set(0.55);
    home.position.set(-160, 0);
    g.moveTo(-85, 0)
        .bezierCurveTo(0, -70, 65, 75, 170, 0)
        .stroke({ color: C.gold, width: 2, alpha: 0.5 });
    const goal = combat
        ? new DroneView()
        : research
          ? lobbyIcon('signal', C.cyan)
          : lobbyIcon('ore', C.gold);
    goal.scale.set(combat ? 1.8 : 3);
    goal.position.set(215, 0);
    g.beginPath()
        .circle(215, 0, 66)
        .stroke({ color: combat ? C.red : research ? C.cyan : C.gold, alpha: 0.25, width: 1 });
    root.addChild(g, home, goal);
    label(root, 'Aurora', -189, 91, 15, C.muted);
    label(
        root,
        combat ? 'Wrogi patrol' : research ? 'Dane sektora' : 'Złoża surowców',
        155,
        91,
        15,
        C.muted,
    );
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
export function bareModules(hull: HullId): ShipModules & { hull: HullId; weapon?: WeaponId } {
    return { hull, engine: 0, handling: 0, cargo: 0, drill: 0, armor: 0, shield: 0 };
}
