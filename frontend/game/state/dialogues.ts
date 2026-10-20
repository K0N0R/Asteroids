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
                text: 'Łączność przywrócona. Otworzyliśmy dwie śluzy: na Księżyc i do wraków satelit. Wraki są dodatkową okazją do odzyskania części na Swifta; na Księżyc możesz lecieć Prospectorem.',
            },
            {
                speaker: 'operations',
                text: 'Zapasy są zabezpieczone. Przygotuj materiały w Laboratorium, złóż części w Warsztacie, a potem zamontuj zaplecze w Rozbudowie stacji. Potrzebujemy dwóch poszyć, jednej maszynerii i jednej elektroniki.',
            },
            {
                speaker: 'science',
                text: 'Samo żelazo nie wystarczy. W początkowym złożu znajdziesz także Węgiel (C), Miedź (Cu), Krzem (Si) i Tlen (O). Najedź celownikiem na skałę, aby odczytać jej skład. Nie musisz szukać ich w kolejnym sektorze.',
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
                text: 'Warsztat działa, a trasa została potwierdzona. Przywieź części przez śluzę do Księżyca i przygotuj budowę placówki.',
            },
            {
                speaker: 'science',
                text: 'Zsynchronizuj sondę księżycową. Otworzy lądowanie i śluzę do bogatej asteroidy. Wcześniejsze obszary pozostają dostępne — możesz wrócić po zasoby i dokończyć zadania dodatkowe.',
            },
        ],
    },
    {
        id: 'earth-act-one-finale',
        title: 'Pościg ku Marsowi',
        sector: 'earth',
        after: ['earth-lunar-route'],
        tasks: ['lunar-attack'],
        lines: [
            {
                speaker: 'operations',
                text: 'Odparliśmy atak na stację księżycową. Napastnicy wycofali się w stronę Marsa. Musimy ruszyć ich śladem i ustalić, kto kieruje tymi jednostkami.',
            },
            {
                speaker: 'science',
                text: 'Ziemia, Księżyc i nasze placówki pozostają dostępne. Przygotuj statek do pościgu; niewykonane zadania dodatkowe możesz dokończyć później.',
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
