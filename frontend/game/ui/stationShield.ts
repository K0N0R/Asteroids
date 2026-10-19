import { kineticInstallationLock, KINETIC_SHIELD_COSTS } from '../state/kineticIndustry';
import { resourceSummary } from '../state/resources';
import { Container, Graphics } from 'pixi.js';
import type { Campaign } from '../state/campaign';
import { STATION_SHIELD, stationProtectionRadius, stationShieldLock } from '../state/stationShield';
import { C } from '../graphics/shapes';
import { button, label, STATION_LAYOUT } from './primitives';
import { STATION_DRONES as D, stationDronesLock } from '../state/stationDrones';
import { StationSentryView } from '../graphics/stationSentryView';

export function stationShieldContent(
    ui: Container,
    c: Campaign,
    install?: () => void,
    upgrade?: () => void,
) {
    const active = !c.story || c.station.shield;
    const upgradeMode = c.station.shield;
    const level = c.station.shieldLevel;
    const nextCost = KINETIC_SHIELD_COSTS[level];
    const g = new Graphics(),
        x = 640,
        y = 515;
    const radius = active ? 220 : 68;
    g.circle(x, y, 220).stroke({ color: C.line, width: 2, alpha: 0.6 });
    g.circle(x, y, radius).fill({ color: C.cyan, alpha: 0.07 }).stroke({ color: C.cyan, width: 3 });
    for (let i = 0; i < level; i++)
        g.circle(x, y, 230 + i * 10).stroke({ color: 0x91b8ef, width: 4, alpha: 0.6 });
    g.circle(x, y, 44).fill(C.ink).stroke({ color: C.mint, width: 3 });
    g.circle(x, y, 16).fill(C.cyan);
    for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        g.moveTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18)
            .lineTo(x + Math.cos(a) * 42, y + Math.sin(a) * 42)
            .stroke({ color: C.mint, width: 2 });
    }
    ui.addChild(g);
    label(ui, 'SATUK 15', x, y + 60, 16, C.text).setHorizontalAlign('center');
    label(
        ui,
        `Obszar ochrony: ${stationProtectionRadius(c)} m`,
        x,
        755,
        22,
        C.cyan,
        580,
    ).setHorizontalAlign('center');
    label(ui, 'MODUŁ OBRONNY / STACJA', 1072, 244, 13, C.mint);
    label(ui, 'Generator tarczy', 1072, 278, 30, C.text);
    label(
        ui,
        active ? `AKTYWNY · KINETYCZNY ${level}/2` : 'NIEZAMONTOWANY',
        1072,
        326,
        17,
        active ? C.mint : C.gold,
    );
    label(
        ui,
        `Po montażu: bezpieczny obszar ${upgradeMode ? stationProtectionRadius(c) : STATION_SHIELD.radius} m wokół stacji na orbicie. Odrzuca asteroidy i wrogów oraz zatrzymuje pociski na granicy.`,
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
    label(
        ui,
        upgradeMode
            ? nextCost
                ? `Poziom ${level + 1}: ${resourceSummary(nextCost)} · +150 m`
                : 'Poziom II · maksymalny zasięg 1150 m'
            : 'Montaż: 30 Fe · 6 K · 3 MZ',
        1072,
        597,
        19,
        C.gold,
        456,
    );
    const lock = upgradeMode ? kineticInstallationLock(c, 'shield') : stationShieldLock(c);
    label(
        ui,
        upgradeMode
            ? (lock ?? 'Moduł gotowy · montaż zwiększy rzeczywisty obszar osłony.')
            : active
              ? 'Tryb testowy korzysta z pełnej osłony od początku.'
              : (lock ?? 'Zaplecze i składniki gotowe. Można rozpocząć montaż.'),
        1072,
        644,
        15,
        C.muted,
        456,
    );
    button(
        ui,
        upgradeMode
            ? level < 2
                ? 'ROZBUDUJ TARCZĘ KINETYCZNĄ'
                : 'TARCZA KINETYCZNA II'
            : active
              ? 'TARCZA ZAMONTOWANA'
              : 'ZAMONTUJ GENERATOR',
        1072,
        STATION_LAYOUT.actionY,
        456,
        () => (upgradeMode ? upgrade?.() : install?.()),
        true,
        (upgradeMode ? !!upgrade : !!install) && !lock,
        STATION_LAYOUT.actionHeight,
        16,
    );
}

export function stationDronesContent(ui: Container, c: Campaign, install?: () => void) {
    const diagram = new Graphics();
    const x = 640,
        y = 515;
    diagram.circle(x, y, 220).stroke({ color: C.line, width: 2, alpha: 0.6 });
    diagram
        .beginPath()
        .circle(x, y, 120)
        .fill({ color: C.cyan, alpha: 0.07 })
        .stroke({ color: C.cyan, width: 2 });
    diagram.beginPath().circle(x, y, 44).fill(C.ink).stroke({ color: C.mint, width: 3 });
    diagram.beginPath().circle(x, y, 16).fill(C.cyan);
    ui.addChild(diagram);
    for (let id = 0; id < D.count; id++) {
        const angle = (id * Math.PI * 2) / D.count;
        const view = new StationSentryView();
        view.position.set(x + Math.cos(angle) * 175, y + Math.sin(angle) * 175);
        view.rotation = angle + Math.PI / 2;
        view.scale.set(1.6);
        view.alpha = c.station.sentries ? (c.station.sentries[id].hull > 0 ? 1 : 0.25) : 0.45;
        ui.addChild(view);
    }
    label(ui, 'SATUK 15', x, y + 60, 16, C.text).setHorizontalAlign('center');
    label(
        ui,
        `Patrol ${D.orbit} m · granica ${D.leash} m`,
        x,
        755,
        22,
        C.mint,
        580,
    ).setHorizontalAlign('center');
    label(ui, 'MODUŁ OBRONNY / STACJA', 1072, 244, 13, C.mint);
    label(ui, 'Drony strażnicze', 1072, 278, 30, C.text);
    label(
        ui,
        c.station.sentries ? 'HANGAR AKTYWNY' : 'NIEZAMONTOWANY',
        1072,
        326,
        17,
        c.station.sentries ? C.mint : C.gold,
    );
    label(
        ui,
        `Garnizon: ${D.count} × ${D.hull} HP · wykrywanie ${D.detection} m\nDziało: ${D.damage} obrażeń / ${D.shotInterval} s · zasięg ${D.range} m`,
        1072,
        367,
        17,
        C.text,
        456,
    );
    for (let id = 0; id < D.count; id++) {
        const state = c.station.sentries?.[id];
        const status = !state
            ? 'brak jednostki'
            : state.hull > 0
              ? `${Math.ceil(state.hull)} / ${D.hull} HP`
              : state.rebuildRemaining > 0
                ? `odbudowa ${Math.ceil(state.rebuildRemaining)} s`
                : 'utracony · oczekuje na odbudowę';
        label(
            ui,
            `Strażnik ${id + 1} · ${status}`,
            1072,
            438 + id * 29,
            16,
            state?.hull ? C.mint : C.muted,
            456,
        );
    }
    label(
        ui,
        'Naprawa w hangarze: 4 HP/s po 8 s bez kontaktu. Odbudowę uruchamiasz ręcznie w bazie: 2 poszycia stalowe I + 1 układ zasilania za utraconą jednostkę.',
        1072,
        543,
        16,
        C.muted,
        456,
    );
    label(ui, 'Montaż z 3 dronami: 40 Fe · 12 K · 3 MZ', 1072, 633, 18, C.gold, 456);
    const lock = stationDronesLock(c);
    label(
        ui,
        c.station.sentries
            ? 'Garnizon pozostaje przy stacji. Nie osłania powierzchni.'
            : (lock ?? 'Zaplecze i materiały gotowe.'),
        1072,
        674,
        15,
        C.muted,
        456,
    );
    button(
        ui,
        c.station.sentries ? 'ODBUDUJ UTRACONE DRONY' : 'ZAMONTUJ HANGAR',
        1072,
        STATION_LAYOUT.actionY,
        456,
        () => install?.(),
        true,
        !!install && !lock,
        STATION_LAYOUT.actionHeight,
        16,
    );
}
