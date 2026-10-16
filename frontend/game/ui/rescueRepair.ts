import { Container, Graphics } from 'pixi.js';
import type { RescueRepair, RescueRepairAction } from '../systems/rescueRepair';
import { C } from '../graphics/shapes';
import { button, label, panel } from './primitives';

const CIRCUITS = ['A · ZASILANIE', 'B · PODTRZYMANIE', 'C · STEROWANIE'];
export function rescueRepairPanel(
    ui: Container,
    repair: RescueRepair,
    act: (action: RescueRepairAction) => void,
) {
    panel(ui, 400, 240, 800, 520);
    label(ui, 'RATUNEK / ZABEZPIECZENIE PROMU', 432, 264, 13, C.mint);
    label(ui, 'Przywróć bezpieczne połączenia', 432, 298, 26, C.text);
    label(
        ui,
        'Połącz obwody o tych samych oznaczeniach A, B i C. Wybierz lewą końcówkę, potem pasującą prawą.',
        432,
        343,
        16,
        C.muted,
        735,
    );
    const g = new Graphics();
    for (let i = 0; i < 3; i++) {
        const y = 405 + i * 74;
        const done = repair.connected.has(i);
        button(
            ui,
            CIRCUITS[i],
            432,
            y,
            240,
            () => act({ side: 'left', index: i }),
            repair.selected === i,
            !done,
            44,
            14,
        );
        const value = repair.rightOrder[i];
        button(
            ui,
            CIRCUITS[value],
            928,
            y,
            240,
            () => act({ side: 'right', index: i }),
            false,
            !repair.connected.has(value),
            44,
            14,
        );
        if (done) {
            const right = repair.rightOrder.indexOf(i);
            g.moveTo(682, y + 22)
                .lineTo(740, y + 22)
                .lineTo(860, 427 + right * 74)
                .lineTo(918, 427 + right * 74)
                .stroke({ color: C.mint, width: 3 });
        }
    }
    ui.addChild(g);
    label(ui, repair.message, 432, 638, 15, C.muted, 735);
    button(ui, 'PRZERWIJ', 432, 680, 220, () => act({ cancel: true }), false, true, 40, 15);
    button(
        ui,
        'ZATWIERDŹ ZABEZPIECZENIE',
        740,
        680,
        428,
        () => act({ confirm: true }),
        true,
        true,
        40,
        14,
    );
    label(
        ui,
        'Świat nadal działa. Trafienie lub utrata zasięgu przerywa pracę. Hol podłączysz po zabezpieczeniu obwodów.',
        432,
        731,
        12,
        C.gold,
        735,
    );
}
