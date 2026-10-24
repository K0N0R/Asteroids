import type { Campaign } from './campaign';

/** Only a recorded technical interruption qualifies; ordinary abandonment/death is unchanged. */
export function recoverTechnicalInterruption(c: Campaign) {
    if (!c.activeRun?.technicalInterruption) return false;
    // Deposited cargo and acknowledged story events are already persisted. Do not settle
    // a fabricated victory, grant expedition XP, or create a rescue/loss from a GPU failure.
    c.activeRun = null;
    return true;
}
