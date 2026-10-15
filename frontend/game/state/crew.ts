import { CREW, JOBS, JobKind, CrewRole } from '../config';
import { storageCapacity, storageUsed, type Campaign } from './campaign';

export interface CrewJob {
    id: number;
    kind: JobKind;
    remaining: number;
}
export interface CrewState {
    mechanic: boolean;
    /** Legacy save compatibility: normalized to false since v18. */
    mechanicAboard: boolean;
    quartermaster: boolean;
    /** Legacy save compatibility: normalized to false since v18. */
    quartermasterAboard: boolean;
    jobs: CrewJob[];
    nextJobId: number;
    completed: number;
}
export const newCrew = (): CrewState => ({
    mechanic: false,
    mechanicAboard: false,
    quartermaster: false,
    quartermasterAboard: false,
    jobs: [],
    nextJobId: 1,
    completed: 0,
});

export function jobStorage(kind: JobKind) {
    const recipe = JOBS[kind];
    return Math.max(recipe.ore + recipe.parts, recipe.output === 'kit' ? 0 : recipe.amount);
}
export function workerJobs(c: Campaign, role: CrewRole) {
    return c.crew.jobs.filter((job) => JOBS[job.kind].worker === role);
}
export function assignMechanic(c: Campaign, aboard: boolean) {
    return assignCrew(c, 'mechanic', aboard);
}
export function crewAboard(c: Campaign, role: CrewRole) {
    return role === 'mechanic' ? c.crew.mechanicAboard : c.crew.quartermasterAboard;
}
export function assignCrew(c: Campaign, role: CrewRole, aboard: boolean) {
    if (
        aboard ||
        c.activeRun ||
        typeof aboard !== 'boolean' ||
        !c.crew[role] ||
        crewAboard(c, role) === aboard ||
        (aboard && workerJobs(c, role).length > 0)
    )
        return false;
    c.crew[role === 'mechanic' ? 'mechanicAboard' : 'quartermasterAboard'] = aboard;
    return true;
}
// Reserve enough room for either a refund or the finished output.
export function reservedResources(c: Campaign) {
    return c.crew.jobs.reduce((sum, job) => sum + jobStorage(job.kind), 0);
}
export function hireMechanic(c: Campaign) {
    if (c.activeRun || c.crew.mechanic || c.bank.ore < CREW.hireOre) return false;
    c.bank.ore -= CREW.hireOre;
    c.crew.mechanic = true;
    return true;
}
export function hireQuartermaster(c: Campaign) {
    if (
        c.activeRun ||
        c.crew.quartermaster ||
        c.station.workshop < 1 ||
        c.bank.ore < CREW.quartermasterOre ||
        c.bank.parts < CREW.quartermasterParts
    )
        return false;
    c.bank.ore -= CREW.quartermasterOre;
    c.bank.parts -= CREW.quartermasterParts;
    c.crew.quartermaster = true;
    return true;
}
export function queueJob(c: Campaign, kind: JobKind) {
    if (c.activeRun || !Object.hasOwn(JOBS, kind)) return false;
    const recipe = JOBS[kind];
    if (crewAboard(c, recipe.worker)) return false;
    if ('workshop' in recipe && c.station.workshop < recipe.workshop) return false;
    if (!c.crew[recipe.worker] || workerJobs(c, recipe.worker).length >= CREW.queueLimit)
        return false;
    if (storageUsed(c) + jobStorage(kind) - recipe.ore - recipe.parts > storageCapacity(c))
        return false;
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
    if (!c.activeRun || !Number.isFinite(seconds) || seconds <= 0) return 0;
    let completed = 0;
    for (const role of ['mechanic', 'quartermaster'] as const) {
        if (!c.crew[role]) continue;
        if (crewAboard(c, role)) continue;
        let available = seconds;
        for (const job of workerJobs(c, role)) {
            if (available <= 0) break;
            if (job.kind === 'kit' && c.repairKits + c.activeRun.repairKits >= CREW.kitLimit) break;
            const work = Math.min(available, job.remaining);
            job.remaining -= work;
            available -= work;
            if (job.remaining > 1e-8) break;
            const recipe = JOBS[job.kind];
            if (recipe.output === 'kit') c.repairKits += recipe.amount;
            else c.bank[recipe.output] = (c.bank[recipe.output] ?? 0) + recipe.amount;
            c.crew.jobs = c.crew.jobs.filter((other) => other.id !== job.id);
            c.crew.completed++;
            completed++;
        }
    }
    return completed;
}
