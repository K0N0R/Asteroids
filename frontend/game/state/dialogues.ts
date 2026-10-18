import type { Campaign } from './campaign';
import type { StoryProgress } from './story';

export const SPEAKERS = {
    guide: {
        name: 'Pilot instruktor',
        role: 'PROSPECTOR / ESKADRA SZKOLENIOWA',
        archetype: 0,
        identity: 43,
    },
    operations: {
        name: 'Oficer operacyjna',
        role: 'SATUK 15 / DOWODZENIE',
        archetype: 2,
        identity: 41,
    },
    science: { name: 'Oficer naukowy', role: 'SATUK 15 / BADANIA', archetype: 1, identity: 42 },
} as const;
export interface DialogueLine {
    speaker: keyof typeof SPEAKERS;
    text: string;
}
export interface DialogueDefinition {
    id: string;
    title: string;
    sector: 'earth';
    after: readonly string[];
    tasks: readonly string[];
    lines: readonly DialogueLine[];
}
export const DIALOGUES: readonly DialogueDefinition[] = [
    {
        id: 'earth-command',
        title: 'Objęcie dowodzenia',
        sector: 'earth',
        after: [],
        tasks: [],
        lines: [
            {
                speaker: 'operations',
                text: 'Admirał, witamy na Satuk 15. Stacja pozostaje na orbicie Ziemi. Dowodzenie i przygotowanie wypraw należą teraz do Ciebie.',
            },
            {
                speaker: 'science',
                text: 'Obserwujemy narastające anomalie w Układzie Słonecznym. Potrzebujemy danych z przekaźnika orbitalnego, zanim rozszerzymy obszar badań.',
            },
            {
                speaker: 'operations',
                text: 'Najpierw zabezpiecz zaopatrzenie i przywróć łączność. Te cele możesz realizować w dowolnej kolejności. Odczyty potwierdzimy przez radio. Ładunek przekaż klawiszem C w pobliżu stacji, po wyhamowaniu poniżej 35 m/s.',
            },
        ],
    },
    {
        id: 'earth-open-orbit',
        title: 'Dalsza orbita',
        sector: 'earth',
        after: ['earth-command'],
        tasks: ['earth-supply', 'earth-relay'],
        lines: [
            {
                speaker: 'science',
                text: 'Łączność przywrócona. Mamy współrzędne węzła na dalszej orbicie. Jego odczyt pozwoli przygotować trasę ku Księżycowi.',
            },
            {
                speaker: 'operations',
                text: 'Zapasy są zabezpieczone. Uruchom warsztat stacji i wykonaj odczyt dalszego węzła. Oba zadania są już dostępne; kolejność wybierasz samodzielnie.',
            },
        ],
    },
    {
        id: 'earth-lunar-route',
        title: 'Kierunek: Księżyc',
        sector: 'earth',
        after: ['earth-open-orbit'],
        tasks: ['earth-workshop', 'earth-route'],
        lines: [
            {
                speaker: 'operations',
                text: 'Warsztat działa, a trasa została potwierdzona. Możemy skierować Satuk 15 do rejonu Księżyca i przygotować budowę stacji paliw.',
            },
            {
                speaker: 'science',
                text: 'Zacznij od rozpoznania trasy księżycowej. Wcześniejsze obszary pozostają dostępne — możesz wrócić po zasoby i dokończyć zadania dodatkowe.',
            },
        ],
    },
];

export function dialogueReady(p: StoryProgress, definition: DialogueDefinition) {
    return (
        definition.after.every((id) => p.dialogues.includes(id)) &&
        definition.tasks.every((id) => p.claimed.includes(id))
    );
}
export function pendingDialogue(c: Campaign) {
    const p = c.story;
    if (!p || c.activeRun) return null;
    return (
        DIALOGUES.find(
            (d) => d.sector === p.sector && !p.dialogues.includes(d.id) && dialogueReady(p, d),
        ) ?? null
    );
}
export function latestDialogue(c: Campaign) {
    const p = c.story;
    if (!p || c.activeRun) return null;
    return (
        DIALOGUES.filter((d) => d.sector === p.sector && p.dialogues.includes(d.id)).at(-1) ?? null
    );
}
/** Acknowledgement records presentation only. It never grants mission progress or rewards. */
export function completeDialogue(c: Campaign, id: string) {
    const p = c.story,
        d = DIALOGUES.find((d) => d.id === id);
    if (
        !p ||
        !d ||
        c.activeRun ||
        p.sector !== d.sector ||
        p.dialogues.includes(id) ||
        !dialogueReady(p, d)
    )
        return false;
    p.dialogues.push(id);
    return true;
}
export function validDialogueHistory(p: StoryProgress) {
    return (
        Array.isArray(p.dialogues) &&
        new Set(p.dialogues).size === p.dialogues.length &&
        p.dialogues.every((id) => {
            const d = DIALOGUES.find((d) => d.id === id);
            return !!d && dialogueReady(p, d);
        })
    );
}
/** Each explicit advance consumes one line; repeats after completion do nothing. */
export class DialoguePlayback {
    index = 0;
    private held = new Set<string>();
    constructor(readonly definition: DialogueDefinition) {}
    get line() {
        return this.definition.lines[this.index] ?? null;
    }
    get complete() {
        return this.index >= this.definition.lines.length;
    }
    advance() {
        if (this.complete) return false;
        this.index++;
        return true;
    }
    key(key: string, down: boolean) {
        if (!down) {
            this.held.delete(key);
            return false;
        }
        if (!['enter', 'space'].includes(key) || this.held.has(key)) return false;
        this.held.add(key);
        return this.advance();
    }
}
