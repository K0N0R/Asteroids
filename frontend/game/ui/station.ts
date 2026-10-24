import { Container } from 'pixi.js';
import type { Campaign } from '../state/campaign';
import {
    stationProjectCost,
    stationProjectLevel,
    stationProjectLock,
    type StationProject,
} from '../state/stationProgression';
import { RECIPES, RECIPE_IDS, type RecipeId } from '../state/chemistry';
import { HULLS, type HullId } from '../config';
import { C } from '../graphics/shapes';
import { fittedScene } from './lobbyGraphics';
import { stationDeviceScene } from '../graphics/stationDevice';
import {
    stationDeviceDiscovered,
    stationBlueprintReady,
    visibleStationTiers,
    recipeDiscovered,
} from '../state/discovery';
import { constructionCosts } from './constructionCosts';
import { stationShieldContent, stationDronesContent } from './stationShield';
import { button, label, panel, STATION_LAYOUT } from './primitives';

export interface StationScreenState {
    project: StationProject | 'shield' | 'drones';
    preview: number;
}
export const newStationScreenState = (): StationScreenState => ({
    project: 'laboratory',
    preview: 0,
});
export interface StationScreenActions {
    refresh: () => void;
    install: (id: StationProject) => void;
    openRecipe: (id: RecipeId) => void;
    shield?: () => void;
    kineticShield?: () => void;
    drones?: () => void;
}
/** Independent navigation state; recipe round trips preserve the selected project. */
export function stationScreen(
    ui: Container,
    c: Campaign,
    state: StationScreenState,
    actions: StationScreenActions,
) {
    const entries = [
        ['laboratory', 'Laboratorium'],
        ['workshop', 'Warsztat'],
        ['shield', 'Tarcze'],
        ['drones', 'Drony'],
        ['extraction', 'Ekstrakcja anomalii'],
    ] as const;
    const visible = entries.filter(([id]) => stationDeviceDiscovered(c, id));
    if (!visible.some(([id]) => id === state.project)) {
        state.project = 'laboratory';
        state.preview = 0;
    }
    panel(ui, 280, STATION_LAYOUT.top, 285, 591);
    label(ui, 'URZĄDZENIA STACJI', 300, 244, 14, C.mint);
    visible.forEach(([id, title], index) => {
        const level =
            id === 'shield'
                ? Number(c.station.shield) + c.station.shieldLevel
                : id === 'drones'
                  ? Number(!!c.station.sentries)
                  : stationProjectLevel(c, id);
        button(
            ui,
            `${title} · ${level}`,
            296,
            288 + index * 72,
            253,
            () => {
                state.project = id;
                state.preview = 0;
                actions.refresh();
            },
            state.project === id,
            true,
            52,
            15,
        );
    });
    if (state.project === 'shield') {
        stationShieldContent(ui, c, actions.shield, actions.kineticShield, actions.openRecipe);
        return;
    }
    if (state.project === 'drones') {
        stationDronesContent(ui, c, actions.drones, actions.openRecipe);
        return;
    }
    const id = state.project,
        current = stationProjectLevel(c, id),
        tiers = visibleStationTiers(c, id);
    const selected = tiers.includes(state.preview) ? state.preview : (tiers.at(-1) ?? 0);
    state.preview = selected;
    const preview: Campaign = { ...c, station: { ...c.station } };
    if (id === 'laboratory') preview.station.laboratoryLevel = selected - 1;
    else if (id === 'workshop') preview.station.workshopLevel = selected - 1;
    const title = entries.find(([key]) => key === id)![1];
    const tierName = ['0', 'I', 'II', 'III'][selected];
    panel(ui, 585, STATION_LAYOUT.top, 430, 591);
    label(ui, title, 609, 244, 27, C.text, 382);
    if (tiers.length > 1)
        tiers.forEach((tier, index) =>
            button(
                ui,
                `POZIOM ${['0', 'I', 'II', 'III'][tier]}`,
                605 + index * 132,
                295,
                120,
                () => {
                    state.preview = tier;
                    actions.refresh();
                },
                selected === tier,
                true,
                34,
                13,
            ),
        );
    const artLevel =
        id === 'extraction' && selected > 0 ? Math.max(1, c.station.workshopLevel) : selected;
    const art = fittedScene(stationDeviceScene(id, artLevel), 370, 290);
    art.position.set(800, 515);
    ui.addChild(art);
    label(
        ui,
        id === 'extraction'
            ? current
                ? 'Adapter zamontowany'
                : 'Projekt badawczy'
            : `Obecny poziom: ${current}`,
        609,
        710,
        18,
        C.mint,
        380,
    );
    label(
        ui,
        id === 'laboratory'
            ? 'Materiały i procesy badawcze'
            : id === 'workshop'
              ? 'Części, statki i modernizacje'
              : selected > 0
                ? 'Aktywne wydobycie na brzegu anomalii'
                : 'Badania bezpiecznego pobierania próbek',
        609,
        750,
        15,
        C.muted,
        380,
    );
    label(ui, `${title} ${id === 'extraction' ? '' : tierName}`, 1072, 244, 28, C.text, 456);
    if (id === 'extraction' && !current && !stationBlueprintReady(c, id)) {
        label(ui, 'BADANIA W TOKU', 1072, 290, 13, C.mint);
        label(
            ui,
            'Pomiary potwierdziły możliwość pozyskiwania materiału anomalii. Zespół bada sposób jego bezpiecznego pobierania.',
            1072,
            335,
            19,
            C.text,
            456,
        );
        label(
            ui,
            'Nie mamy jeszcze zatwierdzonego projektu instalacji.',
            1072,
            465,
            16,
            C.muted,
            456,
        );
        return;
    }
    const outputs =
        id === 'extraction'
            ? ['Pozyskiwanie urobku anomalii narzędziem wydobywczym']
            : RECIPE_IDS.filter(
                  (key) => RECIPES[key].category === id && RECIPES[key].level === selected,
              ).map((key) => RECIPES[key].title);
    if (id === 'workshop')
        outputs.push(
            ...(Object.keys(HULLS) as HullId[])
                .filter(
                    (hull) =>
                        hull !== 'prospector' &&
                        !('salvageOnly' in HULLS[hull]) &&
                        HULLS[hull].workshop === selected,
                )
                .map((hull) => HULLS[hull].name),
        );
    const installed = selected <= current;
    label(ui, installed ? 'UDOSTĘPNIA' : 'ODBLOKUJE', 1072, 290, 13, C.mint);
    label(ui, outputs.join(' · '), 1072, 320, 16, C.text, 456);
    const isNext = selected === current + 1;
    const lock = installed
        ? 'Poziom zamontowany · urządzenie jest gotowe do pracy.'
        : !isNext
          ? 'Zamontuj poprzedni poziom; to podgląd projektu.'
          : stationProjectLock(c, id);
    label(
        ui,
        lock ?? 'Komplet materiałów · gotowe do montażu',
        1072,
        435,
        15,
        installed || !lock ? C.mint : C.gold,
        456,
    );
    if (!installed)
        constructionCosts(
            ui,
            c.bank,
            stationProjectCost(preview, id),
            480,
            actions.openRecipe,
            (recipe) => recipeDiscovered(c, recipe),
        );
    button(
        ui,
        installed ? 'ZAMONTOWANO' : `ZAMONTUJ ${id === 'extraction' ? 'ADAPTER' : tierName}`,
        1072,
        STATION_LAYOUT.actionY,
        456,
        () => actions.install(id),
        true,
        !lock,
        STATION_LAYOUT.actionHeight,
        17,
    );
}
