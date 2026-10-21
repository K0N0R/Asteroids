import type { Campaign } from './campaign';
import type { StoryProgress } from './story';

export const SPEAKERS = {
    guide: {
        name: 'Tomas Vale',
        role: 'PROSPECTOR / ESKADRA SZKOLENIOWA',
    },
    operations: {
        name: 'Ada Serrin',
        role: 'SATUK 15 / DOWODZENIE',
    },
    science: { name: 'dr Ivo Nadir', role: 'SATUK 15 / BADANIA' },
} as const;
export interface DialogueLine {
    speaker: keyof typeof SPEAKERS;
    text: string;
}
export interface DialogueDefinition {
    id: string;
    title: string;
    sector: 'earth' | 'mars';
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
                text: 'Witaj na Satuk 15, admirale. Dobrze mieć Cię na pokładzie. Stacja jest na orbicie Ziemi, a załoga czeka na Twoje rozkazy.',
            },
            {
                speaker: 'science',
                text: 'Coś dziwnego dzieje się w Układzie Słonecznym. Odczyty coraz bardziej odbiegają od normy. Przywróć łączność z przekaźnikiem orbitalnym — bez jego danych niewiele ustalimy.',
            },
            {
                speaker: 'operations',
                text: 'Przyda nam się też sprawne zaplecze. Zbierz materiały i rozbuduj stację. Ty zdecyduj, od czego zaczniesz. Listę potrzebnych rzeczy znajdziesz w zadaniach.',
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
                text: 'Mamy łączność! Śluzy na Księżyc i do wraków satelit są już otwarte. Prospector poradzi sobie z lotem na Księżyc. Wraki mogą poczekać, jeśli wolisz od razu ruszyć dalej.',
            },
            {
                speaker: 'operations',
                text: 'Zaplecze działa, zapasy mamy na miejscu. To dobry początek. Teraz możemy zająć się placówką na Księżycu.',
            },
            {
                speaker: 'science',
                text: 'Gdy zabraknie materiałów, zajrzyj do złóż przy Ziemi. Jest tam więcej niż żelazo. Skan skały pokaże Ci, co kryje się w środku.',
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
                text: 'Trasa na Księżyc potwierdzona. Skompletuj wyposażenie w Satuk 15, a przygotujemy paczkę do holowania. Dostarcz ją do placówki — na miejscu czekają na sprzęt.',
            },
            {
                speaker: 'science',
                text: 'Po drodze połącz się z sondą księżycową. Potrzebujemy jej danych do lądowania i otwarcia śluzy przy bogatej asteroidzie. Do Ziemi zawsze możesz wrócić po więcej zasobów.',
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
                text: 'Placówka jest bezpieczna. Dobra robota. Napastnicy uciekają w stronę Marsa — ruszamy za nimi. Chcę wiedzieć, kto ich przysłał.',
            },
            {
                speaker: 'science',
                text: 'Sprawdzę zapis ich sygnałów. Ty przygotuj statek. Nie odcinamy tras do Ziemi ani Księżyca, więc do zaległych spraw będzie można wrócić.',
            },
        ],
    },
    {
        id: 'mars-offensive',
        title: 'Pierwsza ofensywa',
        sector: 'mars',
        after: [],
        tasks: [],
        lines: [
            {
                speaker: 'operations',
                text: 'Stacja księżycowa jest bezpieczna. Zaczynamy operację w sektorze Marsa: przygotuj tarcze Satuk 15 i zbadaj możliwość założenia placówki.',
            },
            {
                speaker: 'science',
                text: 'Orbita jest spokojna, lecz anomalie blokują podejście do powierzchni. Potrzebuję potwierdzenia z bliska. Na razie eksploruj i zbieraj materiały.',
            },
        ],
    },
    {
        id: 'mars-ai',
        title: 'Wróg bez załogi',
        sector: 'mars',
        after: ['mars-offensive'],
        tasks: ['mars-ai-discovery'],
        lines: [
            {
                speaker: 'science',
                text: 'Moduł z Fobosa nie zawiera zapisów załogi. Te jednostki są autonomiczne: steruje nimi sztuczna inteligencja. Potrafimy już przeprogramować część zachowanych kadłubów.',
            },
            {
                speaker: 'operations',
                text: 'Zidentyfikowaliśmy zakład przemysłowy przy dużej asteroidzie. Ujawniamy hiperśluzę na orbicie Fobosa. Zniszcz produkcję i usuń pozostałe zagrożenia.',
            },
            {
                speaker: 'science',
                text: 'Nie wiemy, kto zaprojektował ten system ani jakie są jego długofalowe cele. Dane mówią nam tylko o jego działaniu tutaj.',
            },
        ],
    },
    {
        id: 'mars-research-done',
        title: 'Pomiary zakończone',
        sector: 'mars',
        after: ['mars-offensive'],
        tasks: ['mars-anomaly-research'],
        lines: [
            {
                speaker: 'science',
                text: 'Trzy serie pomiarów są kompletne. Wycofujemy siły i analizujemy próbki. Potrzebujemy technologii, której jeszcze nie mamy.',
            },
            {
                speaker: 'operations',
                text: 'Odbierz w Satuk 15 odprawę Nowy kierunek. Przy Wenus przygotujemy osłony, a na Merkurym poszukamy rozwiązania bariery.',
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
/** Presentation time is transient; a stalled frame never emits a burst of sounds. */
export class DialogueReveal {
    private characters: string[];
    private cursor = 0;
    private wait = 0;
    constructor(text: string) {
        this.characters = Array.from(text);
    }
    get text() {
        return this.characters.slice(0, this.cursor).join('');
    }
    get typing() {
        return this.cursor < this.characters.length;
    }
    finish() {
        this.cursor = this.characters.length;
    }
    update(deltaMS: number) {
        if (!this.typing || !Number.isFinite(deltaMS) || deltaMS <= 0) return false;
        this.wait -= Math.min(deltaMS, 100);
        let audible = false;
        while (this.typing && this.wait <= 0) {
            const character = this.characters[this.cursor++];
            audible ||= /[\p{L}\p{N}]/u.test(character);
            this.wait += /[.!?…]/u.test(character) ? 230 : /[,;:—]/u.test(character) ? 110 : 28;
        }
        return audible;
    }
}

/** Explicit input reveals the current line first, then advances on a fresh press. */
export class DialoguePlayback {
    index = 0;
    private held = new Set<string>();
    private reveal: DialogueReveal;
    constructor(readonly definition: DialogueDefinition) {
        this.reveal = new DialogueReveal(this.line?.text ?? '');
    }
    get visibleText() {
        return this.reveal.text;
    }
    get typing() {
        return this.reveal.typing;
    }
    update(deltaMS: number) {
        return this.reveal.update(deltaMS);
    }
    interact() {
        if (this.complete) return false;
        if (this.typing) {
            this.reveal.finish();
            return true;
        }
        return this.advance();
    }
    get line() {
        return this.definition.lines[this.index] ?? null;
    }
    get complete() {
        return this.index >= this.definition.lines.length;
    }
    advance() {
        if (this.complete) return false;
        this.index++;
        this.reveal = new DialogueReveal(this.line?.text ?? '');
        return true;
    }
    key(key: string, down: boolean) {
        if (!down) {
            this.held.delete(key);
            return false;
        }
        if (!['enter', 'space'].includes(key) || this.held.has(key)) return false;
        this.held.add(key);
        return this.interact();
    }
}
