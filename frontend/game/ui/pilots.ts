import { Container, Graphics } from 'pixi.js';
import { PILOTS, PILOT_SKILLS, PILOT_PROGRESSION, type PilotSkillId } from '../config';
import { pilotSlots, type Campaign, type Pilot } from '../state/campaign';
import { newPilot, pilotName, pilotProfile, pilotLevel, pilotPoints } from '../state/pilots';
import { recoveryChances } from '../state/recovery';
import { pilotPortrait, choiceCard, segments } from './lobbyGraphics';
import { button, label, panel, illustrationInBox } from './primitives';
import { itemIllustration } from '../graphics/items';
import { C } from '../graphics/shapes';
import type { LobbyActions } from './lobby';

export interface PilotSelection {
    recruiting: boolean;
    chosenId: number | null;
    recruit: number;
    mode: (recruiting: boolean) => void;
    choose: (id: number) => void;
    candidate: (archetype: number) => void;
}
const bonus = (multiplier: number) => `${Math.round((multiplier - 1) * 100)}%`;
function trainingDetail(c: Campaign, pilot: Pilot, skill: PilotSkillId) {
    const current = pilotProfile(pilot),
        max = pilot.skills[skill] >= PILOT_PROGRESSION.skillLimit;
    const next = pilotProfile({
        ...pilot,
        skills: {
            ...pilot.skills,
            [skill]: Math.min(PILOT_PROGRESSION.skillLimit, pilot.skills[skill] + 1),
        },
    });
    const arrow = (before: string, after: string) => (max ? before : `${before} → ${after}`);
    if (skill === 'handling')
        return `Obrót +${arrow(bonus(current.turn), bonus(next.turn))} · hamowanie +${arrow(bonus(current.brake), bonus(next.brake))}`;
    if (skill === 'mining')
        return `Moc wydobycia +${arrow(bonus(current.mining), bonus(next.mining))}`;
    const odds = (p: Pilot) =>
        c.ship
            ? Math.round(recoveryChances(c.ship, p).pilot * 100)
            : Math.round(pilotProfile(p).escape * 100);
    const trained = {
        ...pilot,
        skills: {
            ...pilot.skills,
            survival: Math.min(PILOT_PROGRESSION.skillLimit, pilot.skills.survival + 1),
        },
    };
    return `${c.ship ? 'Szansa kapsuły' : 'Premia kapsuły'} ${arrow(`${odds(pilot)}%`, `${odds(trained)}%`)}`;
}
/** Candidate comparison and training share one selection and one explicit action footer. */
export function pilotScreen(
    ui: Container,
    c: Campaign,
    selection: PilotSelection,
    actions: Pick<LobbyActions, 'hire' | 'trainPilot' | 'selectPilot'>,
) {
    const { recruiting } = selection;
    button(
        ui,
        `Moi piloci · ${c.pilots.length}`,
        280,
        220,
        210,
        () => selection.mode(false),
        !recruiting,
        true,
        38,
    );
    button(ui, 'Nabór', 502, 220, 160, () => selection.mode(true), recruiting, true, 38);
    label(ui, `ZAŁOGA ${pilotSlots(c)} / 8`, 680, 231, 13, C.muted);
    if (recruiting)
        PILOTS.slice(0, 3).forEach((def, i) => {
            const card = choiceCard(ui, 280, 278 + i * 164, 430, 152, selection.recruit === i, () =>
                selection.candidate(i),
            );
            illustrationInBox(card, pilotPortrait(i, false, c.nextPilotId), 14, 14, 94, 110);
            label(card, pilotName({ id: c.nextPilotId, archetype: i }), 122, 20, 22, C.text, 292);
            label(card, def.role, 122, 54, 15, C.muted, 292);
            label(card, def.trait, 122, 91, 17, C.mint, 292);
            label(card, 'Poziom 1', 122, 120, 12, C.muted);
        });
    else
        c.pilots.forEach((p, i) => {
            const card = choiceCard(
                ui,
                280,
                278 + i * 64,
                430,
                57,
                selection.chosenId === p.id,
                () => selection.choose(p.id),
            );
            illustrationInBox(card, pilotPortrait(p.archetype, false, p.id), 10, 4, 49, 49);
            label(card, pilotName(p), 74, 8, 18, C.text, 230);
            label(
                card,
                `${PILOTS[p.archetype].role} · P${pilotLevel(p)}`,
                74,
                33,
                12,
                C.muted,
                230,
            );
            const points = pilotPoints(p);
            label(
                card,
                points ? `+${points} PKT` : c.selectedPilot === p.id ? 'AKTYWNY' : '',
                330,
                23,
                12,
                points ? C.gold : C.mint,
            );
        });
    if (pilotSlots(c) > c.pilots.length)
        label(
            ui,
            'Miejsca rezerwują też piloci w kapsułach ratunkowych.',
            280,
            818,
            13,
            C.muted,
            430,
        );
    const p = recruiting
        ? newPilot(c.nextPilotId, selection.recruit)
        : c.pilots.find((p) => p.id === selection.chosenId);
    panel(ui, 738, 278, 822, 527);
    if (!p) {
        label(ui, 'Załoga czeka na pilota', 770, 313, 27);
        label(ui, 'Przejdź do naboru, aby wybrać nową osobę.', 770, 363, 18, C.muted, 750);
        return;
    }
    const profile = pilotProfile(p),
        level = pilotLevel(p),
        points = pilotPoints(p);
    illustrationInBox(ui, pilotPortrait(p.archetype, false, p.id), 760, 296, 134, 134);
    label(ui, recruiting ? 'KANDYDAT / SPECJALIZACJA' : 'PILOT / ROZWÓJ', 918, 299, 12, C.mint);
    label(ui, profile.name, 918, 322, 30, C.text, 608);
    label(ui, profile.role, 918, 365, 16, C.muted);
    if (!recruiting) {
        const next = PILOT_PROGRESSION.thresholds[level],
            start = PILOT_PROGRESSION.thresholds[level - 1];
        label(
            ui,
            `Poziom ${level} · ${p.xp}${next ? ` / ${next}` : ''} PD${next ? '' : ' · maksimum'}`,
            918,
            392,
            15,
            C.muted,
        );
        ui.addChild(
            new Graphics()
                .roundRect(918, 420, 608, 5, 2)
                .fill(C.line)
                .roundRect(
                    918,
                    420,
                    Math.max(1, 608 * (next ? (p.xp - start) / (next - start) : 1)),
                    5,
                    2,
                )
                .fill(C.mint),
        );
    } else label(ui, 'Poziom 1 · rozwój od pierwszej wyprawy', 918, 398, 14, C.muted);
    panel(ui, 762, 444, 774, 88);
    label(ui, profile.trait, 780, 455, 20, C.mint);
    label(ui, profile.perkDetail, 780, 486, 16, C.text, 736);
    if (recruiting) {
        const stats = [
            ['Obrót / hamowanie', `+${bonus(profile.turn)} / +${bonus(profile.brake)}`],
            ['Wydobycie', `+${bonus(profile.mining)}`],
            ['Tempo skanowania', `+${bonus(profile.scan)}`],
            ['Premia do kapsuły', `+${Math.round(profile.escape * 100)} p.p.`],
        ];
        stats.forEach(([title, value], i) => {
            const x = 780 + (i % 2) * 390,
                y = 550 + Math.floor(i / 2) * 70;
            label(ui, title, x, y, 13, C.muted);
            label(ui, value, x, y + 23, 23, C.text);
        });
        illustrationInBox(ui, itemIllustration('ore'), 780, 716, 35, 35);
        label(ui, 'ZATRUDNIENIE', 831, 710, 12, C.muted);
        label(
            ui,
            `Żelazo (Fe) · ${c.bank.ore} / 12`,
            831,
            732,
            20,
            c.bank.ore >= 12 ? C.mint : C.gold,
        );
        const full = pilotSlots(c) >= 8,
            missing = Math.max(0, 12 - c.bank.ore);
        const text = c.activeRun
            ? 'PILOCI SĄ NA WYPRAWIE'
            : full
              ? 'BRAK WOLNYCH MIEJSC'
              : missing
                ? `BRAKUJE ${missing} ŻELAZA (Fe)`
                : 'ZATRUDNIJ PILOTA →';
        if (c.activeRun || full || missing)
            label(
                ui,
                c.activeRun
                    ? 'Nabór będzie dostępny po zakończeniu wyprawy.'
                    : full
                      ? 'Wszystkie miejsca załogi są zajęte.'
                      : `Do zatrudnienia brakuje ${missing} żelaza (Fe).`,
                780,
                778,
                14,
                C.gold,
                738,
            );
        button(
            ui,
            text,
            762,
            818,
            774,
            () => actions.hire(selection.recruit),
            true,
            !c.activeRun && !full && !missing,
            46,
            17,
        );
    } else {
        label(
            ui,
            `SZKOLENIE · ${points} ${points === 1 ? 'PUNKT' : 'PKT'} DO WYDANIA`,
            780,
            548,
            12,
            points ? C.gold : C.muted,
        );
        (Object.keys(PILOT_SKILLS) as PilotSkillId[]).forEach((skill, i) => {
            const y = 578 + i * 70,
                rank = p.skills[skill],
                max = rank >= PILOT_PROGRESSION.skillLimit;
            label(ui, PILOT_SKILLS[skill].title, 780, y, 19, C.text);
            label(ui, trainingDetail(c, p, skill), 780, y + 28, 14, max ? C.muted : C.mint, 590);
            segments(ui, rank, PILOT_PROGRESSION.skillLimit, 1260, y + 7, 65);
            button(
                ui,
                max ? 'MAKS.' : 'ROZWIŃ · 1 PKT',
                1360,
                y - 2,
                164,
                () => actions.trainPilot(p.id, skill),
                false,
                !c.activeRun && points > 0 && !max,
                34,
                13,
            );
        });
        label(
            ui,
            points
                ? 'Wybierz umiejętność. Każdy awans daje 1 punkt.'
                : level === PILOT_PROGRESSION.thresholds.length
                  ? 'Osiągnięto maksymalny poziom pilota.'
                  : 'Kolejny awans daje 1 punkt szkolenia.',
            780,
            786,
            12,
            C.muted,
        );
        if (c.selectedPilot === p.id)
            label(ui, '● Aktywny pilot na następną wyprawę', 780, 835, 16, C.mint);
        else
            button(
                ui,
                'USTAW AKTYWNEGO PILOTA →',
                762,
                818,
                774,
                () => actions.selectPilot(p.id),
                true,
                !c.activeRun,
                46,
                17,
            );
    }
}
