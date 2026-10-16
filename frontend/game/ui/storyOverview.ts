import { selectableMission } from '../state/missionOrders';
import type { Container } from 'pixi.js';
import { HULLS, CREW } from '../config';
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
    const sectorIds = Object.keys(STORY_SECTORS) as StorySectorId[];
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
    const pages = Math.ceil(tasks.length / 6);
    const page = Math.max(0, Math.min(pages - 1, actions.page ?? 0));
    tasks.slice(page * 6, page * 6 + 6).forEach((task, i) => {
        const x = 280 + (i % 2) * 370,
            y = 283 + Math.floor(i / 2) * 160;
        const complete = p.claimed.includes(task.id),
            available = storyTaskAvailable(p, task);
        panel(ui, x, y, 355, 150);
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
            complete ? '✓' : `${p.progress[task.id]}/${task.target}`,
            x + 294,
            y + 10,
            16,
            complete ? C.mint : C.muted,
        );
        label(ui, task.title, x + 15, y + 33, 20, complete ? C.mint : C.text, 325);
        label(
            ui,
            complete
                ? 'Zadanie ukończone · postęp zapisany.'
                : available
                  ? task.detail
                  : `Wymaga: ${task.dependencies.map((id) => STORY_TASKS.find((t) => t.id === id)!.title).join(' i ')}.`,
            x + 15,
            y + 63,
            14,
            C.muted,
            325,
        );
        if (!complete && available && (task.kind === 'ore' || task.kind === 'parts'))
            button(
                ui,
                `PRZEKAŻ ${task.kind === 'parts' ? 'KOMPONENTY' : 'RUDĘ'} · ${Math.min(c.bank[task.kind === 'parts' ? 'parts' : 'ore'], task.target - p.progress[task.id])}`,
                x + 15,
                y + 120,
                325,
                () => actions.contribute?.(task.id),
                false,
                c.bank[task.kind === 'parts' ? 'parts' : 'ore'] > 0 && !!actions.contribute,
                27,
            );
        else if (!complete && available && task.kind === 'briefing')
            button(
                ui,
                'ZATWIERDŹ PLAN DO WENUS',
                x + 15,
                y + 120,
                325,
                () => actions.briefing?.(),
                false,
                !!actions.briefing && !c.activeRun,
                27,
            );
        else if (!complete && available && task.kind === 'workshop')
            button(ui, 'OTWÓRZ STACJĘ', x + 15, y + 120, 325, actions.station, false, true, 27);
        else if (!complete && selectableMission(c, task.id) && actions.selectMission)
            button(
                ui,
                actions.missionTask === task.id ? '● CEL TEJ WYPRAWY' : 'WYBIERZ NA MISJĘ →',
                x + 15,
                y + 120,
                325,
                () => actions.selectMission?.(task.id),
                actions.missionTask === task.id,
                true,
                27,
                14,
            );
        else if (!complete)
            label(
                ui,
                available && task.kind === 'delivery'
                    ? `Dostawa na powierzchni · ${task.resource === 'ore' ? 'ruda' : 'komponenty'} · E przy budowie`
                    : available && task.kind === 'construction'
                      ? `${p.sector === 'mars' ? '7 baza' : '8 placówka'} · E przez 2 s · budowa podczas wyprawy`
                      : available
                        ? `Premia: ${task.reward.ore} rudy · ${task.reward.parts} komponentów`
                        : 'Zadanie zostanie udostępnione później.',
                x + 15,
                y + 126,
                12,
                C.muted,
                325,
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
                    ? 'Główne cele Ziemi ukończone. Możesz wybrać trasę księżycową; zadania dodatkowe pozostają dostępne.'
                    : 'Stacja paliw odebrana. Zachowujesz dostęp do Ziemi i powierzchni Księżyca.'
                : p.sector === 'lunar'
                  ? 'Powierzchnia: E dostarcza materiały. Po fundamentach G rozpoczyna obronę. Porażka nie cofa dostaw.'
                  : 'Cele realizujesz równolegle. Rozdziel rudę między zadania i rozwój stacji.'),
        280,
        808,
        15,
        complete ? C.mint : C.muted,
        720,
    );
    if (actions.missionTask)
        button(
            ui,
            'ZMIEŃ NA SWOBODNY LOT',
            1072,
            467,
            456,
            () => actions.selectMission?.(null),
            false,
            true,
            26,
            13,
        );
    const def = STORY_SECTORS[p.sector],
        pilot = selectedPilot(c);
    label(ui, `SATUK 15 / ${storyAct(p)}`, 1072, 244, 13, C.mint);
    label(ui, def.name, 1072, 276, 27, C.text, 456);
    label(
        ui,
        actions.missionTask
            ? `Wybrana misja: ${STORY_TASKS.find((t) => t.id === actions.missionTask)?.title}. Dokowanie po wykonaniu celu. TAB pozwala awaryjnie przerwać wyprawę bez nagrody i ładunku.`
            : p.sector === 'pluto' ||
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
                        ? 'Stacja paliw działa, a atak został odparty. Podejmij pościg na Marsie lub wróć do wcześniejszych zadań.'
                        : p.sector === 'earth'
                          ? 'Naukowcy zgłaszają narastające anomalie. Przygotuj zaplecze stacji i przywróć łączność na orbicie Ziemi.'
                          : 'Rozpoznaj trasę i zbuduj księżycową stację paliw: 160 rudy na fundamenty (eskorta Muła i własne dostawy), potem 12 komponentów na instalacje. Ziemia pozostaje dostępna.',
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
        `${Math.min(c.repairKits, CREW.embarkKits)} zest. naprawczych na pokład`,
        1072,
        619,
        15,
        C.muted,
    );
    label(
        ui,
        p.sector === 'pluto'
            ? '7 zwiad · 0 baza / F osłona równolegle · E dane / G skaner: komponent · 3 finał po obu raportach: G przez 2 s · 8 dodatkowy odczyt · 1 powrót.'
            : p.sector === 'uranus' || p.sector === 'neptune'
              ? '7 zwiad · 0 baza po zwiadzie · E dane / G skaner: komponent · F kontakty · 8 dalsza trasa. Neptun: 3 starcie po bazie · G przez 2 s.'
              : p.sector === 'saturn'
                ? '2 złoże · 7 zwiad · 5 kryształy po zwiadzie · F patrol · 8 trasa po zaopatrzeniu i walce · 1 powrót. Rudę przywozisz zwykłym transportem.'
                : p.sector === 'jupiter'
                  ? '7 zwiad · 0 terminal po zwiadzie · E pobieranie bez alarmu · G skaner: 1 komponent · F patrole · 8 pakiet po raportach · 1 powrót.'
                  : p.sector === 'belt'
                    ? '7 wejście · 3 / 4 / 5 przeszkody po zwiadzie · 8 granica po oczyszczeniu · F opcjonalne patrole · 1 powrót. E odczyt / dokowanie.'
                    : storyAct(p) === 'AKT V'
                      ? '7 baza · E montaż / dokowanie · G obrona przy bazie · F patrole w korytarzu · 8 pomiary po montażu. Raporty zabezpieczysz po powrocie.'
                      : p.sector === 'mercury'
                        ? '7 pomiary · F przeciwnik · 8 technologia po raportach. 3 / 4 / 5 schronienia: lewa strona dużych skał. Nie niszcz osłon bez potrzeby.'
                        : p.sector === 'venus'
                          ? '7 przekaźnik · 8 placówka · 2 złoże · 1 powrót. E odczyt / budowa / dokowanie · G obrona przy placówce. Osłona: komponenty w stacji.'
                          : p.sector === 'mars'
                            ? 'F przeciwnik · 7 ślad pościgu · 8 pas po rozpoznaniu · 1 powrót. E odczyt / dokowanie. Przelot przez pas wymaga technologii.'
                            : p.sector === 'lunar'
                              ? 'Orbita: 3 Księżyc po zwiadzie. Powierzchnia: 7 budowa · 2 złoże · 5 miedź · 1 wyjście. E odczyt / dostawa / przejście.'
                              : '2 złoże · 7 łączność · 8 dalszy węzeł po odblokowaniu · 1 powrót · E odczyt / dokowanie',
        1072,
        657,
        14,
        C.muted,
        456,
    );
}
