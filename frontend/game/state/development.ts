import { STORY_SECTORS, type StorySectorId } from './story';
import type { Campaign } from './campaign';

export const DEVELOPMENT_SAVE_KEY = 'asteroids.development.v1';
export const DEVELOPMENT_MODE_KEY = 'asteroids.development.active';
export function developmentCopy(c: Campaign, sector: StorySectorId): Campaign {
    const copy = structuredClone(c);
    if (!copy.story || !Object.hasOwn(STORY_SECTORS, sector)) throw new Error('Brak kampanii');
    copy.activeRun = null;
    copy.story.development = true;
    copy.story.sector = sector;
    return copy;
}
export interface DevelopmentActions {
    canReturn: () => boolean;
    returnToBase: () => void;
    chooseSector: (sector: StorySectorId) => void;
    leave: () => void;
    active: () => boolean;
}
/** Bound by the active game session, read when ESC is opened. */
export const developmentControls: { actions: DevelopmentActions | null } = { actions: null };
