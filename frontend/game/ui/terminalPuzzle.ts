import { Container, Graphics } from 'pixi.js';
import { PORTS, type TerminalPuzzle, type TerminalAction } from '../systems/terminalPuzzle';
import { C } from '../graphics/shapes';
import { button, label, panel } from './primitives';

export function terminalPuzzlePanel(
    ui: Container,
    puzzle: TerminalPuzzle,
    act: (action: TerminalAction) => void,
) {
    panel(ui, 330, 180, 940, 620);
    label(
        ui,
        puzzle.mode === 'breach' ? 'TERMINAL / WŁAMANIE' : 'TERMINAL / ZASILANIE SKANERA',
        360,
        204,
        13,
        C.mint,
    );
    label(
        ui,
        puzzle.mode === 'breach' ? 'Połącz wejście z wyjściem' : 'Przekieruj zasilanie',
        360,
        235,
        28,
        C.text,
    );
    label(
        ui,
        puzzle.mode === 'breach'
            ? 'Klikaj płytki, aby je obracać. Doprowadź sygnał od IN do OUT i zatwierdź pobranie danych.'
            : 'Przenieś energię między sąsiednimi kanałami. Dopasuj wszystkie trzy wartości do celu; suma energii pozostaje stała.',
        360,
        284,
        16,
        C.muted,
        870,
    );
    const g = new Graphics();
    g.eventMode = 'none';
    if (puzzle.mode === 'breach') {
        const energized = puzzle.energized;
        for (let i = 0; i < 12; i++) {
            const x = 450 + (i % 4) * 98,
                y = 345 + Math.floor(i / 4) * 90;
            button(ui, '', x, y, 80, () => act({ rotate: i }), false, true, 76);
            const color = energized.has(i) ? C.mint : C.text;
            const cx = x + 40,
                cy = y + 38;
            const ends = [
                [cx, y + 5],
                [x + 75, cy],
                [cx, y + 71],
                [x + 5, cy],
            ];
            PORTS.forEach((port, direction) => {
                if (puzzle.tiles[i] & port)
                    g.moveTo(cx, cy)
                        .lineTo(ends[direction][0], ends[direction][1])
                        .stroke({ color, width: 6 });
            });
            g.circle(cx, cy, 6).fill(color);
        }
        label(ui, 'IN →', 380, 370 + Math.floor(puzzle.start / 4) * 90, 17, C.mint);
        label(ui, '→ OUT', 850, 370 + Math.floor(puzzle.goal / 4) * 90, 17, C.gold);
        label(
            ui,
            'Obrót: 90°\n\nJasny obwód: połączony z wejściem\n\nCel: sygnał na OUT',
            980,
            355,
            16,
            C.muted,
            240,
        );
    } else {
        ['SKANER', 'ŁĄCZNOŚĆ', 'CHŁODZENIE'].forEach((name, channel) => {
            const y = 350 + channel * 88;
            label(ui, name, 380, y, 16, C.text);
            label(
                ui,
                `${puzzle.power[channel]} / cel ${puzzle.targetPower[channel]}`,
                580,
                y,
                19,
                puzzle.power[channel] === puzzle.targetPower[channel] ? C.mint : C.gold,
            );
            for (let level = 0; level < 4; level++)
                g.roundRect(580 + level * 46, y + 32, 38, 16, 4).fill(
                    level < puzzle.power[channel] ? C.cyan : C.line,
                );
            button(ui, '−1', 860, y, 90, () => act({ channel, delta: -1 }), false, true, 50, 20);
            button(ui, '+1', 970, y, 90, () => act({ channel, delta: 1 }), false, true, 50, 20);
            label(ui, `↔ kanał ${((channel + 1) % 3) + 1}`, 1090, y + 12, 14, C.muted);
        });
    }
    ui.addChild(g);
    label(
        ui,
        `${puzzle.profile.name} · czas ${Math.ceil(puzzle.remaining)} s · ślad ${Math.ceil(puzzle.trace)}/100`,
        360,
        630,
        16,
        C.gold,
    );
    label(
        ui,
        puzzle.message ||
            'Błędne zatwierdzenie zostawia ślad. Pełny ślad lub koniec czasu wywołuje alarm.',
        360,
        661,
        14,
        C.muted,
        870,
    );
    button(ui, 'PRZERWIJ', 360, 704, 180, () => act({ cancel: true }), false, true, 44, 15);
    if (puzzle.mode === 'breach' && puzzle.profile.overload)
        button(
            ui,
            'PRZEŁAM / ALARM',
            565,
            704,
            260,
            () => act({ overload: true }),
            false,
            true,
            44,
            15,
        );
    button(
        ui,
        puzzle.mode === 'breach' ? 'POBIERZ DANE' : 'ZATWIERDŹ · 1 KOMPONENT',
        850,
        704,
        390,
        () => act({ confirm: true }),
        true,
        true,
        44,
        15,
    );
    label(
        ui,
        'Ruch, trafienie lub utrata zasięgu przerywają połączenie.',
        360,
        766,
        12,
        C.muted,
        870,
    );
}
