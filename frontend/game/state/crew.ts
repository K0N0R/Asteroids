import { RESOURCE_IDS, resourceTotal, type ResourceStore } from './resources';
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

export function jobInputs(kind: JobKind): ResourceStore {
    const recipe = JOBS[kind];
    return {
        ore: recipe.ore,
        parts: recipe.parts,
        ...('materials' in recipe ? recipe.materials : {}),
    };
}
export function jobStorage(kind: JobKind) {
    const recipe = JOBS[kind];
    return Math.max(resourceTotal(jobInputs(kind)), recipe.output === 'kit' ? 0 : recipe.amount);
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
export function canQueueJob(c: Campaign, kind: JobKind) {
    if (c.activeRun || !Object.hasOwn(JOBS, kind)) return false;
    const recipe = JOBS[kind];
    if (
        (kind === 'kineticPlate' || kind === 'kineticModule') &&
        c.story &&
        !c.story.claimed.includes('mercury-survey')
    )
        return false;
    if (crewAboard(c, recipe.worker)) return false;
    if ('workshop' in recipe && c.station.workshop < recipe.workshop) return false;
    if (!c.crew[recipe.worker] || workerJobs(c, recipe.worker).length >= CREW.queueLimit)
        return false;
    if (storageUsed(c) + jobStorage(kind) - resourceTotal(jobInputs(kind)) > storageCapacity(c))
        return false;
    if (RESOURCE_IDS.some((id) => (c.bank[id] ?? 0) < (jobInputs(kind)[id] ?? 0))) return false;
    if (
        kind === 'kit' &&
        c.repairKits + c.crew.jobs.filter((job) => job.kind === 'kit').length >= CREW.kitLimit
    )
        return false;
    return true;
}
export function queueJob(c: Campaign, kind: JobKind) {
    if (!canQueueJob(c, kind)) return false;
    const recipe = JOBS[kind],
        inputs = jobInputs(kind);
    for (const id of RESOURCE_IDS) if (inputs[id]) c.bank[id] = (c.bank[id] ?? 0) - inputs[id]!;
    c.crew.jobs.push({ id: c.crew.nextJobId++, kind, remaining: recipe.seconds });
    return true;
}
export function cancelJob(c: Campaign, id: number) {
    if (c.activeRun) return false;
    const job = c.crew.jobs.find((job) => job.id === id);
    if (!job) return false;
    const inputs = jobInputs(job.kind);
    for (const key of RESOURCE_IDS)
        if (inputs[key]) c.bank[key] = (c.bank[key] ?? 0) + inputs[key]!;
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

export function installCargoBay(c: Campaign) {
    if (
        c.activeRun ||
        c.station.workshop < 1 ||
        !c.crew.mechanic ||
        (c.station.cargoBays ?? 0) >= 3 ||
        (c.bank.storageFrames ?? 0) < 1 ||
        c.bank.ore < 20 ||
        c.bank.parts < 2
    )
        return false;
    c.bank.storageFrames = (c.bank.storageFrames ?? 0) - 1;
    c.bank.ore -= 20;
    c.bank.parts -= 2;
    c.station.cargoBays = (c.station.cargoBays ?? 0) + 1;
    return true;
}

export function refuelHyperdrive(c: Campaign) {
    if (c.activeRun || !c.ship || c.ship.hyperFuel >= 3 || (c.bank.hyperFuel ?? 0) <= 0)
        return false;
    const amount = Math.min(3 - c.ship.hyperFuel, c.bank.hyperFuel ?? 0);
    c.bank.hyperFuel = (c.bank.hyperFuel ?? 0) - amount;
    c.ship.hyperFuel += amount;
    return true;
}
