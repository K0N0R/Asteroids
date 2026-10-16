import type { Campaign } from './campaign';
import { STORY_TASKS, storyTaskAvailable } from './story';
import type { ScanSiteId } from '../config';

export interface MissionOrder {
    task: string;
    aborted: boolean;
}
export interface MissionReport {
    data?: readonly ScanSiteId[];
    patrolKills?: number;
    firstBossWon?: boolean;
    finalBossWon?: boolean;
}
/** Initial sortie orders cover repeatable flight reports, not station projects or deliveries. */
export function selectableMission(c: Campaign, id: string) {
    const p = c.story,
        task = STORY_TASKS.find((t) => t.id === id);
    return p &&
        task &&
        task.sector === p.sector &&
        ['scan', 'patrol', 'boss'].includes(task.kind) &&
        !p.claimed.includes(task.id) &&
        storyTaskAvailable(p, task)
        ? task
        : null;
}
export function missionObjectiveMet(c: Campaign, report: MissionReport) {
    const order = c.activeRun?.mission;
    if (!order || order.aborted) return false;
    const task = selectableMission(c, order.task);
    if (!task) return false;
    if (task.kind === 'scan') return !!task.site && !!report.data?.includes(task.site);
    if (task.kind === 'patrol')
        return (
            Number.isInteger(report.patrolKills) &&
            (report.patrolKills ?? 0) >= task.target - c.story!.progress[task.id]
        );
    return task.sector === 'pluto'
        ? !!report.finalBossWon
        : task.sector === 'neptune' && !!report.firstBossWon;
}
export function missionOrderStatus(c: Campaign, report: MissionReport) {
    const order = c.activeRun?.mission;
    if (!order) return '';
    const name = STORY_TASKS.find((t) => t.id === order.task)?.title ?? 'Misja';
    if (order.aborted) return `Odwrót: ${name} · wróć do Satuk 15 · bez ładunku i raportu`;
    return missionObjectiveMet(c, report)
        ? `Cel wykonany: ${name} · wróć z raportem do Satuk 15`
        : `Misja: ${name} · cel przed dokowaniem · TAB: odwrót`;
}
