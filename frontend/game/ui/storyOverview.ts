import type { Container } from 'pixi.js';
import { HULLS } from '../config';
import { capacity, selectedPilot, shipHealth, type Campaign } from '../state/campaign';
import {
    STORY_SECTORS,
    EARTH_BRIEFING,
    storyNextStep,
    storyVisibleTasks,
    storyDiscoveredTasks,
    storySectorUnlocked,
    storyRadius,
    actOneComplete,
    storyAct,
    type StorySectorId,
} from '../state/story';
import { C } from '../graphics/shapes';
import { button, label } from './primitives';
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
        travel?: (id: StorySectorId) => void;
        station: () => void;
        page?: number;
        filter?: 'active' | 'completed';
        setFilter?: (filter: 'active' | 'completed') => void;
        setPage?: (page: number) => void;
        openRecipe?: (id: RecipeId) => void;
        openDestination?: (tab: 'station' | 'hangar') => void;
    },
) {
    const p = c.story!;
    const sectorIds = (Object.keys(STORY_SECTORS) as StorySectorId[]).filter(
        (id) => id !== 'lunar',
    );
    const tabGap = sectorIds.length > 8 ? 6 : 12;
    const tabWidth = (725 - (sectorIds.length - 1) * tabGap) / sectorIds.length;
    sectorIds.forEach((id, i) => {
        const def = STORY_SECTORS[id],
            unlocked = storySectorUnlocked(p, id);
        button(
            ui,
            `${def.shortName}${unlocked ? '' : ' ×'}`,
            280 + i * (tabWidth + tabGap),
            213,
            tabWidth,
            () => actions.travel?.(id),
            id === p.sector,
            unlocked && !c.activeRun,
            44,
            sectorIds.length > 10 ? 12 : sectorIds.length > 8 ? 14 : 17,
        );
    });
    const allTasks = storyVisibleTasks(p);
    const discovered = storyDiscoveredTasks(p);
    const filter = actions.filter ?? 'active';
    const tasks = discovered.filter(
        (task) => p.claimed.includes(task.id) === (filter === 'completed'),
    );
    (['active', 'completed'] as const).forEach((id, i) =>
        button(
            ui,
            `${id === 'active' ? 'Aktywne' : 'Ukończone'} (${discovered.filter((task) => p.claimed.includes(task.id) === (id === 'completed')).length})`,
            280 + i * 370,
            266,
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
            340,
            22,
            C.muted,
        );

    const layouts = tasks.map((task) => questCardLayout(c, task, actions));
    const pages = questPages(layouts.map((layout) => layout.height));
    const page = Math.max(0, Math.min(pages.length - 1, actions.page ?? 0));
    let cardY = 310;
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
        pilot = selectedPilot(c);
    label(ui, `SATUK 15 / ${storyAct(p)}`, 1072, 244, 13, C.mint);
    label(ui, def.name, 1072, 276, 27, C.text, 456);
    label(
        ui,
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
              : p.sector === 'earth' && p.claimed.includes('mars-belt')
                ? EARTH_BRIEFING
                : p.sector === 'venus'
                  ? complete || p.claimed.includes('venus-build')
                      ? storyNextStep(p)
                      : 'Przed wyprawą na Merkurego potrzebujesz zaplecza przy Wenus. Rozpoznaj orbitę, wybierz miejsce pod placówkę i zgromadź materiały. Ziemia, Księżyc i Mars pozostają dostępne.'
                  : p.sector === 'mars'
                    ? complete
                        ? storyNextStep(p)
                        : 'Podejmij pościg w stronę Marsa. Rozpoznaj przekaźnik i zabezpiecz podejście, aby dotrzeć do pasa asteroid. Dalszy przelot wymaga nowej technologii.'
                    : actOneComplete(p)
                      ? 'Stacja księżycowa działa, a atak został odparty. Podejmij pościg na Marsie lub wróć do wcześniejszych zadań.'
                      : p.sector === 'earth'
                        ? p.claimed.includes('lunar-survey')
                            ? 'Sonda księżycowa zsynchronizowana. Rozbuduj placówkę na powierzchni; zasoby możesz przywozić z orbity Ziemi i bogatej asteroidy.'
                            : p.claimed.includes('earth-relay')
                              ? 'Trasy na Księżyc i do wraków satelit są otwarte. Przygotuj zaplecze Satuk 15 i nawiąż kontakt z sondą księżycową.'
                              : 'Naukowcy zgłaszają narastające anomalie. Przygotuj zaplecze stacji i przywróć łączność na orbicie Ziemi.'
                        : storyNextStep(p),
        1072,
        320,
        17,
        C.muted,
        456,
    );
    label(
        ui,
        `Obszar działań: ${(storyRadius(p) / 1000).toFixed(2)} km · rozmiar ${def.size}`,
        1072,
        405,
        16,
        C.cyan,
    );
    label(
        ui,
        `Główne cele: ${allTasks.filter((t) => t.required && p.claimed.includes(t.id)).length}/${allTasks.filter((t) => t.required).length}`,
        1072,
        439,
        17,
        C.mint,
    );
    label(
        ui,
        c.ship ? HULLS[c.ship.hull].name : 'Brak statku',
        1072,
        500,
        24,
        c.ship ? C.text : C.red,
    );
    label(
        ui,
        c.ship
            ? `Kadłub ${shipHealth(c.ship)} · ładownia ${capacity(c)}`
            : 'Wybierz statek w hangarze.',
        1072,
        539,
        16,
        C.muted,
    );
    label(
        ui,
        pilot ? `${pilot.name} · P${pilot.level}` : 'Brak pilota',
        1072,
        581,
        20,
        pilot ? C.text : C.red,
    );
    label(
        ui,
        c.ship?.hull === 'mule'
            ? 'Muł · darmowa samonaprawa, bez zestawów'
            : `Zestawy naprawcze: ${c.repairKits}`,
        1072,
        619,
        15,
        C.muted,
    );
}
