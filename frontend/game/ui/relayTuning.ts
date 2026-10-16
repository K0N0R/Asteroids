import { Container, Graphics } from 'pixi.js';
import type { RelayTuning, RelayAction } from '../systems/relayTuning';
import { C } from '../graphics/shapes';
import { button, label, panel } from './primitives';

export function relayTuningPanel(
    ui: Container,
    tuning: RelayTuning,
    act: (action: RelayAction) => void,
) {
    panel(ui, 400, 240, 800, 510);
    label(ui, 'ŁĄCZNOŚĆ ORBITALNA / STROJENIE', 432, 264, 13, C.mint);
    label(ui, 'Zsynchronizuj trzy kanały', 432, 294, 27, C.text);
    label(
        ui,
        'Złota fala: wzorzec. Turkusowa: odbierany sygnał. Strzałkami przesuń fazę aż obie fale się pokryją.',
        432,
        336,
        16,
        C.muted,
        735,
    );
    for (let i = 0; i < 3; i++) {
        const y = 398 + i * 72;
        label(ui, `K${i + 1}`, 432, y + 18, 18, C.text);
        const g = new Graphics();
        g.moveTo(493, y + 30)
            .lineTo(1030, y + 30)
            .stroke({ color: C.line, width: 1 });
        for (const [phase, color, width] of [
            [tuning.targets[i], C.gold, 4],
            [tuning.phases[i], C.cyan, 2],
        ]) {
            for (let x = 0; x <= 480; x += 4) {
                const yy =
                    y + 30 + Math.sin((x / 480) * Math.PI * 4 + (phase / 8) * Math.PI * 2) * 19;
                if (x === 0) g.moveTo(493 + x, yy);
                else g.lineTo(493 + x, yy);
            }
            g.stroke({ color, width });
        }
        ui.addChild(g);
        label(
            ui,
            tuning.matched[i] ? 'ZGODNY' : 'DOSTRÓJ',
            978,
            y + 3,
            11,
            tuning.matched[i] ? C.mint : C.muted,
        );
        button(ui, '‹', 1060, y + 8, 45, () => act({ channel: i, delta: -1 }), false, true, 42, 25);
        button(ui, '›', 1117, y + 8, 45, () => act({ channel: i, delta: 1 }), false, true, 42, 25);
    }
    label(ui, tuning.message, 432, 621, 14, C.muted, 735);
    button(ui, 'PRZERWIJ', 432, 668, 220, () => act({ cancel: true }), false, true, 40, 15);
    button(ui, 'SYNCHRONIZUJ', 768, 668, 394, () => act({ confirm: true }), true, true, 40, 16);
    label(
        ui,
        'Świat nadal działa. Statek hamuje; trafienie lub utrata zasięgu przerywa strojenie.',
        432,
        719,
        12,
        C.gold,
        735,
    );
}
