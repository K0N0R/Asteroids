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
        setPage?: (page: number) => void;
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
    const tasks = storyDiscoveredTasks(p);
    const pages = Math.ceil(tasks.length / 4);
    const page = Math.max(0, Math.min(pages - 1, actions.page ?? 0));
    tasks.slice(page * 4, page * 4 + 4).forEach((task, i) => {
        const x = 280 + (i % 2) * 370,
            y = 267 + Math.floor(i / 2) * 248;
        const complete = p.claimed.includes(task.id),
            available = storyTaskAvailable(p, task);
        panel(ui, x, y, 355, 232);
        label(
            ui,
            task.required ? 'GŁÓWNE' : 'DODATKOWE',
            x + 15,
            y + 12,
            11,
            task.required ? C.cyan : C.gold,
        );
        label(
            ui,
            complete
                ? '✓'
                : task.requirements || task.kind === 'delivery'
                  ? ''
                  : `${p.progress[task.id]}/${task.target}`,
            x + 294,
            y + 10,
            16,
            complete ? C.mint : C.muted,
        );
        label(ui, task.title, x + 15, y + 36, 21, complete ? C.mint : C.text, 325);
        label(
            ui,
            complete
                ? 'Zadanie ukończone · postęp zapisany.'
                : available
                  ? task.detail
                  : `Wymaga: ${task.dependencies.map((id) => STORY_TASKS.find((t) => t.id === id)!.title).join(' i ')}.`,
            x + 15,
            y + 72,
            15,
            C.muted,
            325,
        );
        if (!complete && task.requirements) {
            Object.entries(task.requirements).forEach(([id, needed], row) => {
                const resource = id as ResourceId,
                    have = c.bank[resource] ?? 0;
                label(ui, RESOURCES[resource].name, x + 16, y + 110 + row * 20, 15, C.text);
                label(
                    ui,
                    `${have}/${needed}`,
                    x + 277,
                    y + 110 + row * 20,
                    15,
                    have >= needed ? C.mint : C.gold,
                );
            });
        }
        if (!complete && task.kind === 'delivery' && task.resource) {
            label(ui, RESOURCES[task.resource].name, x + 16, y + 150, 15, C.text, 245);
            label(ui, `${p.progress[task.id]}/${task.target}`, x + 277, y + 150, 15, C.gold);
        }
        const reward = storyRewardText(task);
        if (reward) label(ui, `Premia: ${reward}`, x + 16, y + 212, 13, C.mint, 325);
        if (!complete && available && (task.kind === 'ore' || task.kind === 'parts'))
            button(
                ui,
                `PRZEKAŻ ${task.kind === 'parts' ? 'KOMPONENTY' : 'RUDĘ'}`,
                x + 16,
                y + 164,
                323,
                () => actions.contribute?.(task.id),
                false,
                c.bank[task.kind === 'parts' ? 'parts' : 'ore'] > 0 && !!actions.contribute,
                28,
            );
        else if (!complete && available && task.kind === 'briefing')
            button(
                ui,
                'ZATWIERDŹ PLAN DO WENUS',
                x + 16,
                y + 164,
                323,
                () => actions.briefing?.(),
                false,
                !!actions.briefing && !c.activeRun,
                28,
            );
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
    label(
        ui,
        storyNextStep(p) ||
            (complete
                ? p.sector === 'earth'
                    ? 'Akt I ukończony. Podejmij pościg ku Marsowi; zadania dodatkowe pozostają dostępne.'
                    : 'Stacja księżycowa odebrana. Zachowujesz dostęp do Ziemi i powierzchni Księżyca.'
                : p.sector === 'lunar'
                  ? 'Powierzchnia: E lub C dostarcza materiały, G rozpoczyna obronę. Raporty przyjmuje radio.'
                  : p.sector === 'earth'
                    ? 'Raporty przyjmuje radio. C przy Satuk 15: dostawy do zadań, nadmiar do magazynu.'
                    : 'Przygotuj części w Laboratorium i Warsztacie, a następnie dostarcz je do budowy.'),
        280,
        808,
        15,
        complete ? C.mint : C.muted,
        720,
    );
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
