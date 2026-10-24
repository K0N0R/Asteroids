import type { DialogueLine } from './dialogues';
import type { StoryProgress } from './story';

export interface RadioJournal {
    pending: DialogueLine[];
    acknowledged: string[];
}
export function radioKey(line: DialogueLine) {
    // A stable identifier avoids storing a second copy of every acknowledged paragraph.
    let hash = 2166136261;
    for (const char of `${line.speaker}:${line.text}`)
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return (hash >>> 0).toString(16);
}
export function enqueueRadio(story: StoryProgress, line: DialogueLine) {
    const journal = (story.radio ??= { pending: [], acknowledged: [] });
    const key = radioKey(line);
    if (
        journal.acknowledged.includes(key) ||
        journal.pending.some((item) => radioKey(item) === key)
    )
        return false;
    journal.pending.push(line);
    return true;
}
export function acknowledgeRadio(story: StoryProgress, lines: readonly DialogueLine[]) {
    const journal = (story.radio ??= { pending: [], acknowledged: [] });
    const keys = new Set(lines.map(radioKey));
    journal.pending = journal.pending.filter((line) => !keys.has(radioKey(line)));
    journal.acknowledged = [...new Set([...journal.acknowledged, ...keys])];
}
export function validRadio(value: unknown): value is RadioJournal {
    if (!value || typeof value !== 'object') return false;
    const journal = value as RadioJournal;
    return (
        Array.isArray(journal.pending) &&
        journal.pending.length <= 1000 &&
        journal.pending.every(
            (line) =>
                line &&
                ['guide', 'operations', 'science'].includes(line.speaker) &&
                typeof line.text === 'string' &&
                line.text.length <= 4000,
        ) &&
        Array.isArray(journal.acknowledged) &&
        journal.acknowledged.length <= 10000 &&
        journal.acknowledged.every(
            (key) => typeof key === 'string' && /^[a-f0-9]{1,8}$/.test(key),
        ) &&
        new Set(journal.acknowledged).size === journal.acknowledged.length &&
        new Set(journal.pending.map(radioKey)).size === journal.pending.length
    );
}

/** Prune an obsolete objective saved by earlier builds once its mission is complete. */
export function pruneObsoleteMarsRadio(story: StoryProgress) {
    if (!story.claimed.includes('mars-sector-secure')) return false;
    const stale =
        story.radio?.pending.filter((line) =>
            line.text.includes('Wyeliminuj pozostałe wymagane jednostki'),
        ) ?? [];
    if (!stale.length) return false;
    acknowledgeRadio(story, stale);
    return true;
}
