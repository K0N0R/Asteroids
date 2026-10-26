import { Graphics, type Container } from 'pixi.js';
import { C } from '../graphics/theme';
import { button, label, panel } from './primitives';
import {
    VENUS_POWER_TILES,
    VENUS_POWER_SYSTEMS,
    type VenusPower,
    type VenusPowerAction,
} from '../systems/venusPower';

export function venusPowerPanel(
    ui: Container,
    puzzle: VenusPower,
    act: (action: VenusPowerAction) => void,
) {
    const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x070e1c, alpha: 0.7 });
    shade.eventMode = 'static';
    ui.addChild(shade);
    panel(ui, 330, 160, 940, 620);
    label(ui, 'MARTWE LABORATORIUM / ZASILANIE AWARYJNE', 365, 184, 14, C.mint);
    label(ui, 'Przywróć życie stacji', 365, 214, 28, C.text);
    label(
        ui,
        '1. Odłącz przebicie.   2. Obróć łączniki.   3. Zasil wszystkie moduły.',
        365,
        256,
        16,
        C.muted,
        865,
    );
    button(
        ui,
        puzzle.state.isolated ? '✓ PRZEBICIE ODŁĄCZONE' : 'ODŁĄCZ GAŁĄŹ Z PRZEBICIEM',
        365,
        294,
        865,
        () => act({ isolate: true }),
        puzzle.state.isolated,
        !puzzle.state.isolated,
        38,
        15,
    );
    const powered = puzzle.powered;
    const g = new Graphics();
    g.eventMode = 'none';
    label(ui, 'ZASILANIE', 365, 429, 13, C.gold, 95);
    g.moveTo(453, 462).lineTo(485, 462).stroke({ color: C.gold, width: 5 });
    for (let i = 0; i < VENUS_POWER_TILES.length; i++) {
        if (!VENUS_POWER_TILES[i]) continue;
        const x = 485 + (i % 5) * 104,
            y = 350 + Math.floor(i / 5) * 78;
        const lit = powered.has(i),
            ports = puzzle.ports(i);
        button(
            ui,
            '',
            x,
            y,
            94,
            () => act({ rotate: i }),
            false,
            puzzle.state.isolated && VENUS_POWER_TILES[i] !== 15,
            68,
            12,
        );
        const cx = x + 47,
            cy = y + 34,
            color = lit ? C.gold : C.muted;
        g.circle(cx, cy, 5).fill(color);
        for (const [port, dx, dy] of [
            [1, 0, -29],
            [2, 44, 0],
            [4, 0, 29],
            [8, -44, 0],
        ])
            if (ports & port)
                g.moveTo(cx, cy)
                    .lineTo(cx + dx, cy + dy)
                    .stroke({ color, width: 5, cap: 'round' });
    }
    puzzle.systems.forEach((lit, i) => {
        const y = 384 + i * 78;
        g.moveTo(995, y)
            .lineTo(1025, y)
            .stroke({ color: lit ? C.mint : C.line, width: 5 });
        label(
            ui,
            `${lit ? '✓' : '○'} ${VENUS_POWER_SYSTEMS[i]}`,
            1035,
            y - 11,
            14,
            lit ? C.mint : C.muted,
            190,
        );
    });
    ui.addChild(g);
    label(ui, puzzle.message, 365, 602, 16, C.text, 865);
    label(
        ui,
        'Bez limitu czasu. Postęp zachowa się po zamknięciu panelu.',
        365,
        650,
        13,
        C.muted,
        865,
    );
    button(ui, 'WRÓĆ DO STACJI', 365, 704, 270, () => act({ cancel: true }), false, true, 42, 15);
    button(
        ui,
        'URUCHOM LABORATORIUM',
        665,
        704,
        565,
        () => act({ confirm: true }),
        true,
        true,
        42,
        16,
    );
}
