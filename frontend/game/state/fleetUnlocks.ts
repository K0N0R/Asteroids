import { HULLS, type HullId } from '../config';
import type { Campaign } from './campaign';

export const HULL_UNLOCKS: Partial<Record<HullId, { task: string; label: string }>> = {
    mule: {
        task: 'lunar-foundation',
        label: 'Ukończ fundamenty stacji na Księżycu z dostawami Muła',
    },
    tug: { task: 'lunar-survey', label: 'Zakończ zwiad trasy księżycowej' },
    fighter: { task: 'lunar-commission', label: 'Zakończ odbiór stacji księżycowej' },
    falcon: { task: 'earth-debrief', label: 'Zatwierdź ziemską odprawę przed Wenus' },
    widmo: { task: 'venus-build', label: 'Zbuduj placówkę Wenus' },
    harpoon: { task: 'venus-shield', label: 'Przygotuj osłonę przed wyprawą na Merkurego' },
    aegis: { task: 'mercury-technology', label: 'Zabezpiecz technologię z Merkurego' },
    atlas: { task: 'mars-base-build', label: 'Zbuduj bazę marsjańską' },
    stinger: { task: 'belt-exit', label: 'Potwierdź przejście pasa asteroid' },
    phoenix: { task: 'jupiter-observations', label: 'Zabezpiecz pakiet obserwacyjny Jowisza' },
};
export function hullUnlocked(c: Campaign, hull: HullId) {
    return (
        !c.story ||
        hull === 'prospector' ||
        hull === 'swift' ||
        !!(HULL_UNLOCKS[hull] && c.story.claimed.includes(HULL_UNLOCKS[hull]!.task))
    );
}
export function hullUnlockReason(c: Campaign, hull: HullId) {
    if ('salvageOnly' in HULLS[hull]) return 'Kadłub wyłącznie z odzysku';
    return hullUnlocked(c, hull) ? '' : (HULL_UNLOCKS[hull]?.label ?? 'Projekt nieodblokowany');
}
