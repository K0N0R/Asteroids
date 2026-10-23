import { CanvasTextMetrics, Graphics, TextStyle, type Container } from 'pixi.js';
import { HULLS } from '../config';
import { capacity, selectedPilot, shipHealth, type Campaign } from '../state/campaign';
import {
    STORY_SECTORS,
    EARTH_BRIEFING,
    storyNextStep,
    storyVisibleTasks,
    storyDiscoveredTasks,
    actOneComplete,
    storyAct,
} from '../state/story';
import { C } from '../graphics/shapes';
import { button, label, illustrationInBox } from './primitives';
import { fittedShip, pilotPortrait, lobbyIcon } from './lobbyGraphics';
import type { RecipeId } from '../state/chemistry';
import { questCard, questCardLayout, questPages } from './questCard';

export function storyOverview(
    ui: Container,
    c: Campaign,
    actions: {
        missionTask?: string | null;
        selectMission?: (id: string | null) => void;
        contribute?: (id: string) => void;
        briefing?: () => void;
        station: () => void;
        page?: number;
        filter?: 'active' | 'completed';
        setFilter?: (filter: 'active' | 'completed') => void;
        setPage?: (page: number) => void;
        openRecipe?: (id: RecipeId) => void;
        openDestination?: (
            tab: 'station' | 'hangar',
            project?: 'laboratory' | 'workshop' | 'shield' | 'extraction',
        ) => void;
    },
) {
    const p = c.story!;
    const allTasks = storyVisibleTasks(p);
    const discovered = storyDiscoveredTasks(p);
    const filter = actions.filter ?? 'active';
    const tasks = discovered
        .filter((task) => p.claimed.includes(task.id) === (filter === 'completed'))
        .sort((a, b) => Number(b.required) - Number(a.required));
    (['active', 'completed'] as const).forEach((id, i) =>
        button(
            ui,
            `${id === 'active' ? 'Aktywne' : 'Ukończone'} (${discovered.filter((task) => p.claimed.includes(task.id) === (id === 'completed')).length})`,
            280 + i * 370,
            214,
            355,
            () => actions.setFilter?.(id),
            id === filter,
            true,
            32,
            15,
        ),
    );
    if (!tasks.length)
        label(
            ui,
            filter === 'active' ? 'Brak aktywnych zadań.' : 'Brak ukończonych zadań.',
            300,
            288,
            22,
            C.muted,
        );

    const layouts = tasks.map((task) => questCardLayout(c, task, actions));
    const pages = questPages(
        layouts.map((layout) => layout.height),
        490,
    );
    const page = Math.max(0, Math.min(pages.length - 1, actions.page ?? 0));
    let cardY = 258;
    for (const index of pages[page]) {
        const card = questCard(c, tasks[index], actions, layouts[index]);
        card.position.set(280, cardY);
        ui.addChild(card);
        cardY += layouts[index].height + 16;
    }
    if (pages.length > 1) {
        button(
            ui,
            '← POPRZEDNIE',
            280,
            765,
            180,
            () => actions.setPage?.(page - 1),
            false,
            page > 0,
            27,
        );
        label(ui, `Zadania · strona ${page + 1}/${pages.length}`, 495, 770, 14, C.muted);
        button(
            ui,
            'KOLEJNE →',
            825,
            765,
            180,
            () => actions.setPage?.(page + 1),
            false,
            page < pages.length - 1,
            27,
        );
    }
    const complete = allTasks.filter((t) => t.required).every((t) => p.claimed.includes(t.id));
    const def = STORY_SECTORS[p.sector],
        pilot = selectedPilot(c),
        pilotState = c.pilots.find((entry) => entry.id === c.selectedPilot);
    label(ui, `SATUK 15 / ${storyAct(p)}`, 1072, 244, 13, C.mint);
    label(ui, def.name, 1072, 276, 27, C.text, 456);
    const narrative =
        p.sector === 'pluto' ||
        p.sector === 'uranus' ||
        p.sector === 'neptune' ||
        p.sector === 'saturn' ||
        p.sector === 'jupiter' ||
        p.sector === 'belt' ||
        storyAct(p) === 'AKT V'
            ? storyNextStep(p)
            : p.sector === 'mercury'
              ? storyNextStep(p)
              : p.sector === 'earth' && p.claimed.includes('mars-anomaly-research')
                ? EARTH_BRIEFING
                : p.sector === 'venus'
                  ? complete || p.claimed.includes('venus-build')
                      ? storyNextStep(p)
                      : 'Przed wyprawą na Merkurego potrzebujesz zaplecza przy Wenus. Rozpoznaj orbitę, wybierz miejsce pod placówkę i zgromadź materiały. Ziemia, Księżyc i Mars pozostają dostępne.'
                  : p.sector === 'mars'
                    ? complete
                        ? storyNextStep(p)
                        : 'Zbuduj tarcze Satuk 15 i zbadaj barierę lądowania. Odkrywaj dostępne obszary, zabezpiecz sektor i osłaniaj badania anomalii.'
                    : actOneComplete(p)
                      ? 'Stacja księżycowa działa, a atak został odparty. Podejmij pościg na Marsie lub wróć do wcześniejszych zadań.'
                      : p.sector === 'earth'
                        ? p.claimed.includes('lunar-survey')
                            ? 'Sonda księżycowa zsynchronizowana. Rozbuduj placówkę na powierzchni; zasoby możesz przywozić z orbity Ziemi i bogatej asteroidy.'
                            : p.claimed.includes('earth-relay')
                              ? 'Trasy na Księżyc i do wraków satelit są otwarte. Przygotuj zaplecze Satuk 15 i nawiąż kontakt z sondą księżycową.'
                              : 'Naukowcy zgłaszają narastające anomalie. Przygotuj zaplecze stacji i przywróć łączność na orbicie Ziemi.'
                        : storyNextStep(p);
    const lines = CanvasTextMetrics.measureText(
        narrative,
        new TextStyle({
            fontFamily: 'Trebuchet MS',
            fontSize: 32,
            lineHeight: 32,
            wordWrap: true,
            wordWrapWidth: 912,
        }),
    ).lines;
    const brief =
        lines.length > 3
            ? lines
                  .slice(0, 3)
                  .join('\n')
                  .replace(/\s+\S*$/, '') + '…'
            : narrative;
    label(ui, brief, 1072, 320, 16, C.muted, 456);
    const main = allTasks.filter((task) => task.required),
        done = main.filter((task) => p.claimed.includes(task.id)).length;
    label(ui, `Główne cele: ${done}/${main.length}`, 1072, 391, 16, C.mint);
    ui.addChild(new Graphics().roundRect(1072, 416, 456, 4, 2).fill(C.line));
    if (done && main.length)
        ui.addChild(
            new Graphics().roundRect(1072, 416, (456 * done) / main.length, 4, 2).fill(C.mint),
        );
    for (const y of [430, 534])
        ui.addChild(
            new Graphics().roundRect(1072, y, 456, 94, 14).fill({ color: C.ink, alpha: 0.3 }),
        );
    if (c.ship) {
        const ship = fittedShip(c.ship, 90, 78);
        ship.position.set(1130, 477);
        ui.addChild(ship);
    } else illustrationInBox(ui, lobbyIcon('ship', C.muted), 1093, 451, 70, 50);
    label(
        ui,
        c.ship?.hull === 'mule'
            ? 'STATEK · SAMONAPRAWA'
            : `STATEK · ZESTAWY NAPRAWCZE: ${c.repairKits}`,
        1200,
        443,
        11,
        C.muted,
        306,
    );
    label(
        ui,
        c.ship ? HULLS[c.ship.hull].name : 'Brak statku',
        1200,
        463,
        21,
        c.ship ? C.text : C.coral,
        306,
    );
    label(
        ui,
        c.ship
            ? `Kadłub ${shipHealth(c.ship)} · ładownia ${capacity(c)}`
            : 'Wybierz statek w Hangarze.',
        1200,
        494,
        14,
        C.muted,
        306,
    );
    if (pilotState)
        illustrationInBox(
            ui,
            pilotPortrait(pilotState.archetype, false, pilotState.id),
            1086,
            545,
            88,
            72,
        );
    else illustrationInBox(ui, lobbyIcon('pilot', C.muted), 1093, 555, 70, 50);
    label(ui, 'PILOT', 1200, 547, 11, C.muted);
    label(ui, pilot ? pilot.name : 'Brak pilota', 1200, 567, 21, pilot ? C.text : C.coral, 306);
    label(
        ui,
        pilot
            ? `Poziom ${pilot.level} · ${pilotState?.xp ?? 0} PD`
            : 'Wybierz pilota przed wyprawą.',
        1200,
        598,
        14,
        C.muted,
        306,
    );
}
