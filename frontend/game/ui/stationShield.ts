import { Container, Graphics } from 'pixi.js';
import type { Campaign } from '../state/campaign';
import { STATION_SHIELD, stationProtectionRadius, stationShieldLock } from '../state/stationShield';
import { C } from '../graphics/shapes';
import { button, label } from './primitives';

export function stationShieldOverview(
    ui: Container,
    c: Campaign,
    back: () => void,
    install?: () => void,
) {
    button(ui, '← PRZEMYSŁ I MAGAZYN', 280, 218, 300, back, false, true, 36, 14);
    const active = !c.story || c.station.shield;
    const g = new Graphics(),
        x = 625,
        y = 490;
    const radius = active ? 220 : 68;
    g.circle(x, y, 220).stroke({ color: C.line, width: 2, alpha: 0.6 });
    g.circle(x, y, radius).fill({ color: C.cyan, alpha: 0.07 }).stroke({ color: C.cyan, width: 3 });
    g.circle(x, y, 44).fill(C.ink).stroke({ color: C.mint, width: 3 });
    g.circle(x, y, 16).fill(C.cyan);
    for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        g.moveTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18)
            .lineTo(x + Math.cos(a) * 42, y + Math.sin(a) * 42)
            .stroke({ color: C.mint, width: 2 });
    }
    ui.addChild(g);
    label(ui, 'SATUK 15', x - 44, y + 60, 16, C.text);
    label(ui, `Obszar ochrony: ${stationProtectionRadius(c)} m`, 360, 755, 22, C.cyan, 580);
    label(ui, 'MODUŁ OBRONNY / STACJA', 1072, 244, 13, C.mint);
    label(ui, 'Generator tarczy', 1072, 278, 30, C.text);
    label(ui, active ? 'AKTYWNY' : 'NIEZAMONTOWANY', 1072, 326, 17, active ? C.mint : C.gold);
    label(
        ui,
        `Po montażu: bezpieczny obszar ${STATION_SHIELD.radius} m wokół stacji na orbicie. Odrzuca asteroidy i wrogów oraz zatrzymuje pociski na granicy.`,
        1072,
        375,
        18,
        C.text,
        456,
    );
    label(
        ui,
        'Bez generatora chronione jest tylko podejście do doku (260 m). Tarcza towarzyszy Satuk 15 między sektorami; nie osłania placówek ani powierzchni planet.',
        1072,
        482,
        16,
        C.muted,
        456,
    );
    label(ui, 'Montaż: 30 Fe · 6 K · 3 MZ', 1072, 597, 19, C.gold, 456);
    const lock = stationShieldLock(c);
    label(
        ui,
        active
            ? !c.story
                ? 'Tryb testowy korzysta z pełnej osłony od początku.'
                : 'Stałe zasilanie z instalacji stacji. Brak kosztu za każdą wyprawę.'
            : (lock ?? 'Zaplecze i składniki gotowe. Można rozpocząć montaż.'),
        1072,
        644,
        15,
        C.muted,
        456,
    );
    button(
        ui,
        active ? 'TARCZA ZAMONTOWANA' : 'ZAMONTUJ GENERATOR',
        1072,
        731,
        456,
        () => install?.(),
        true,
        !!install && !lock,
        44,
        16,
    );
}
