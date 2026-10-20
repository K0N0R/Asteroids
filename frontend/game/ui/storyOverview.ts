import { RESOURCES, type ResourceId } from '../state/resources';
import type { Container } from 'pixi.js';
import { HULLS } from '../config';
import { capacity, selectedPilot, shipHealth, type Campaign } from '../state/campaign';
import {
    STORY_SECTORS,
    STORY_TASKS,
    EARTH_BRIEFING,
    storyNextStep,
    storyVisibleTasks,
    storyDiscoveredTasks,
    storySectorUnlocked,
    storyTaskAvailable,
    storyRadius,
    actOneComplete,
    storyAct,
    storyRewardText,
    type StorySectorId,
} from '../state/story';
import { C } from '../graphics/shapes';
import { button, label, panel } from './primitives';
import { RECIPES, RECIPE_IDS, type RecipeId } from '../state/chemistry';

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

    const pages = Math.max(1, Math.ceil(tasks.length / 2));
    const page = Math.max(0, Math.min(pages - 1, actions.page ?? 0));
    tasks.slice(page * 2, page * 2 + 2).forEach((task, i) => {
        const x = 280,
            y = 310 + i * 228;
        const complete = p.claimed.includes(task.id),
            available = storyTaskAvailable(p, task);
        const items =
            task.deliveryItems?.map((item) => ({
                resource: item.resource,
                have: p.progress[item.id],
                need: item.target,
            })) ??
            (task.requirements
                ? Object.entries(task.requirements).map(([id, need]) => ({
                      resource: id as ResourceId,
                      have:
                          task.id === 'earth-supply' && p.claimed.includes('earth-materials')
                              ? need
                              : (c.bank[id as ResourceId] ?? 0),
                      need,
                  }))
                : task.kind === 'delivery' && task.resource
                  ? [{ resource: task.resource, have: p.progress[task.id], need: task.target }]
                  : []);
        panel(ui, x, y, 725, 210);
        label(
            ui,
            task.required ? 'GŁÓWNE' : 'DODATKOWE',
            x + 18,
            y + 14,
            12,
            task.required ? C.cyan : C.gold,
        );
        label(
            ui,
            complete ? '✓' : items.length ? '' : `${p.progress[task.id]}/${task.target}`,
            x + 659,
            y + 14,
            17,
            complete ? C.mint : C.muted,
        );
        label(
            ui,
            task.title,
            x + 18,
            y + 39,
            24,
            complete ? C.mint : C.text,
            items.length ? 355 : 670,
        );
        label(
            ui,
            complete ? 'Zadanie ukończone.' : task.detail,
            x + 18,
            y + 83,
            16,
            C.muted,
            items.length ? 340 : 650,
        );
        if (!complete)
            items.forEach((item, row) => {
                const rowY = y + 85 + row * 26;
                label(ui, RESOURCES[item.resource].name, x + 390, rowY, 15, C.text, 180);
                label(
                    ui,
                    `${item.have}/${item.need}`,
                    x + 584,
                    rowY,
                    15,
                    item.have >= item.need ? C.mint : C.gold,
                );
                const recipe = RECIPE_IDS.find((id) => RECIPES[id].output === item.resource);
                if (recipe && actions.openRecipe)
                    button(
                        ui,
                        'STWÓRZ',
                        x + 636,
                        rowY - 3,
                        73,
                        () => actions.openRecipe?.(recipe),
                        false,
                        true,
                        23,
                        11,
                    );
            });
        if (!complete && task.id === 'earth-supply')
            label(ui, 'Zaplecze stacji I · 0/1', x + 18, y + 130, 15, C.gold);
        const destination =
            task.id === 'earth-ship-upgrade'
                ? 'hangar'
                : ['earth-supply', 'earth-workshop'].includes(task.id) ||
                    task.kind === 'kineticShield'
                  ? 'station'
                  : null;
        if (!complete && destination && actions.openDestination)
            button(
                ui,
                destination === 'hangar' ? 'OTWÓRZ HANGAR →' : 'ROZBUDOWA STACJI →',
                x + 18,
                y + 158,
                305,
                () => actions.openDestination?.(destination),
                false,
                true,
                32,
                14,
            );
        else if (!complete && available && (task.kind === 'ore' || task.kind === 'parts'))
            button(
                ui,
                `PRZEKAŻ ${task.kind === 'parts' ? 'KOMPONENTY' : 'RUDĘ'}`,
                x + 18,
                y + 158,
                305,
                () => actions.contribute?.(task.id),
                false,
                (c.bank[task.kind === 'parts' ? 'parts' : 'ore'] ?? 0) > 0 && !!actions.contribute,
                32,
                14,
            );
        else if (!complete && available && task.kind === 'briefing')
            button(
                ui,
                'ZATWIERDŹ PLAN DO WENUS',
                x + 18,
                y + 158,
                305,
                () => actions.briefing?.(),
                false,
                !!actions.briefing && !c.activeRun,
                32,
                14,
            );
        const reward = storyRewardText(task);
        if (reward) label(ui, `Premia: ${reward}`, x + 18, y + 194, 14, C.mint, 365);
    });
    if (pages > 1) {
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
        label(ui, `Zadania · strona ${page + 1}/${pages}`, 495, 770, 14, C.muted);
        button(
            ui,
            'KOLEJNE →',
            825,
            765,
            180,
            () => actions.setPage?.(page + 1),
            false,
            page < pages - 1,
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
