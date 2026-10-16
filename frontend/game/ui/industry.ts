import type { Container } from 'pixi.js';
import { JOBS, CREW, type JobKind } from '../config';
import { storageCapacity, storageUsed, type Campaign } from '../state/campaign';
import { canQueueJob, jobInputs, workerJobs } from '../state/crew';
import { RESOURCE_IDS, RESOURCES, resourceSummary } from '../state/resources';
import { C } from '../graphics/shapes';
import { button, label, panel } from './primitives';

export function industryOverview(
    ui: Container,
    c: Campaign,
    actions: {
        back: () => void;
        queueJob: (kind: JobKind) => void;
        cancelJob: (id: number) => void;
        hireMechanic: () => void;
        installCargoBay?: () => void;
    },
) {
    button(ui, '← MODUŁY STACJI', 280, 218, 225, actions.back, false, true, 34, 14);
    RESOURCE_IDS.forEach((id, i) => {
        const x = 280 + (i % 2) * 370,
            y = 280 + Math.floor(i / 2) * 54;
        label(ui, RESOURCES[id].category, x, y, 10, C.muted);
        label(
            ui,
            `${RESOURCES[id].name}: ${c.bank[id] ?? 0}`,
            x,
            y + 16,
            17,
            RESOURCES[id].color,
            350,
        );
    });
    (['smeltCopper', 'powerModule', 'storageFrame'] as const).forEach((kind, i) => {
        const x = 280 + i * 240,
            y = 520,
            recipe = JOBS[kind];
        panel(ui, x, y, 225, 215);
        label(ui, RESOURCES[recipe.output].category, x + 15, y + 14, 11, C.mint);
        label(ui, recipe.title, x + 15, y + 38, 20, C.text, 195);
        label(ui, `Wejście: ${resourceSummary(jobInputs(kind))}`, x + 15, y + 96, 14, C.muted, 195);
        label(
            ui,
            `Wyjście: ${recipe.amount} ${RESOURCES[recipe.output].short} · ${recipe.seconds} s`,
            x + 15,
            y + 139,
            14,
            C.cyan,
            195,
        );
        button(
            ui,
            'ZLEĆ PRODUKCJĘ',
            x + 10,
            y + 172,
            205,
            () => actions.queueJob(kind),
            false,
            canQueueJob(c, kind),
            30,
            13,
        );
    });
    label(
        ui,
        'Produkcja działa podczas lotu. Receptury współdzielą kolejkę mechanika z naprawami i przetopem żelaza.',
        280,
        762,
        15,
        C.muted,
        720,
    );
    label(ui, 'LOGISTYKA / SATUK 15', 1072, 244, 13, C.mint);
    label(ui, 'Magazyn i produkcja', 1072, 276, 27, C.text);
    label(ui, `Zajęte: ${storageUsed(c)} / ${storageCapacity(c)}`, 1072, 325, 19, C.cyan);
    label(
        ui,
        `Segmenty: ${c.station.cargoBays ?? 0} / 3 · każdy +200 miejsca`,
        1072,
        362,
        17,
        C.text,
    );
    label(
        ui,
        'Montaż: 1 SM + 20 Fe + 2 K. Wymaga warsztatu I i mechanika. Segment zużywany jest przy instalacji.',
        1072,
        399,
        15,
        C.muted,
        456,
    );
    button(
        ui,
        'ZAMONTUJ SEGMENT MAGAZYNOWY',
        1072,
        465,
        456,
        () => actions.installCargoBay?.(),
        true,
        !!actions.installCargoBay &&
            !c.activeRun &&
            c.station.workshop >= 1 &&
            c.crew.mechanic &&
            (c.station.cargoBays ?? 0) < 3 &&
            (c.bank.storageFrames ?? 0) >= 1 &&
            c.bank.ore >= 20 &&
            c.bank.parts >= 2,
        42,
        14,
    );
    const jobs = workerJobs(c, 'mechanic');
    label(ui, `MECHANIK · KOLEJKA ${jobs.length}/${CREW.queueLimit}`, 1072, 536, 13, C.muted);
    if (!c.crew.mechanic)
        button(
            ui,
            `ZATRUDNIJ MECHANIKA · ${CREW.hireOre} Fe`,
            1072,
            574,
            456,
            actions.hireMechanic,
            false,
            !c.activeRun && c.bank.ore >= CREW.hireOre,
            42,
            14,
        );
    else if (!jobs.length) label(ui, 'Kolejka pusta.', 1072, 575, 18, C.muted);
    jobs.forEach((job, i) => {
        const y = 575 + i * 57;
        label(
            ui,
            `${JOBS[job.kind].title} · ${Math.ceil(job.remaining)} s`,
            1072,
            y,
            16,
            C.text,
            370,
        );
        button(ui, '×', 1470, y, 58, () => actions.cancelJob(job.id), false, !c.activeRun, 30, 14);
    });
    label(
        ui,
        'Cu: miedziane żyły w bogatych asteroidach. Rudy trafiają do magazynu dopiero po bezpiecznym powrocie.',
        1072,
        760,
        13,
        C.muted,
        456,
    );
}
