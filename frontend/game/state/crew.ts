import { CREW, JOBS, JobKind } from '../config';
import type { Campaign } from './campaign';

export interface CrewJob {
    id: number;
    kind: JobKind;
    remaining: number;
}
export interface CrewState {
    mechanic: boolean;
    jobs: CrewJob[];
    nextJobId: number;
    completed: number;
}
export const newCrew = (): CrewState => ({ mechanic: false, jobs: [], nextJobId: 1, completed: 0 });

// Queued inputs retain their storage space, so cancelling can always return them.
export function reservedResources(c: Campaign) {
    return c.crew.jobs.reduce((sum, job) => sum + JOBS[job.kind].ore + JOBS[job.kind].parts, 0);
}
export function hireMechanic(c: Campaign) {
    if (c.activeRun || c.crew.mechanic || c.bank.ore < CREW.hireOre) return false;
    c.bank.ore -= CREW.hireOre;
    c.crew.mechanic = true;
    return true;
}
export function queueJob(c: Campaign, kind: JobKind) {
    if (
        c.activeRun ||
        !c.crew.mechanic ||
        !Object.hasOwn(JOBS, kind) ||
        c.crew.jobs.length >= CREW.queueLimit
    )
        return false;
    const recipe = JOBS[kind];
    if (c.bank.ore < recipe.ore || c.bank.parts < recipe.parts) return false;
    if (
        kind === 'kit' &&
        c.repairKits + c.crew.jobs.filter((job) => job.kind === 'kit').length >= CREW.kitLimit
    )
        return false;
    c.bank.ore -= recipe.ore;
    c.bank.parts -= recipe.parts;
    c.crew.jobs.push({ id: c.crew.nextJobId++, kind, remaining: recipe.seconds });
    return true;
}
export function cancelJob(c: Campaign, id: number) {
    if (c.activeRun) return false;
    const job = c.crew.jobs.find((job) => job.id === id);
    if (!job) return false;
    c.bank.ore += JOBS[job.kind].ore;
    c.bank.parts += JOBS[job.kind].parts;
    c.crew.jobs = c.crew.jobs.filter((job) => job.id !== id);
    return true;
}
export function advanceCrew(c: Campaign, seconds: number): number {
    if (!c.activeRun || !c.crew.mechanic || !Number.isFinite(seconds) || seconds <= 0) return 0;
    let completed = 0;
    while (seconds > 0 && c.crew.jobs.length) {
        const job = c.crew.jobs[0];
        if (job.kind === 'kit' && c.repairKits + c.activeRun.repairKits >= CREW.kitLimit) break;
        const work = Math.min(seconds, job.remaining);
        job.remaining -= work;
        seconds -= work;
        if (job.remaining > 1e-8) break;
        if (job.kind === 'kit') c.repairKits++;
        else c.bank.parts++;
        c.crew.jobs.shift();
        c.crew.completed++;
        completed++;
    }
    return completed;
}
