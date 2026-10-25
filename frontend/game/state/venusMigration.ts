import { STORY_TASKS } from './story';
import { VENUS_TASK_IDS, newVenusProgress } from './venusAct';
import { VENUS_CONSTRUCTION, VENUS_SHIELD } from './orbitalConstruction';

/** Only the immediately previous schema is converted. Validate the old journal before changing it. */
export function migrateVenusCampaign(value: unknown): unknown {
    if (!value || typeof value !== 'object') return value;
    const c = value as Record<string, any>;
    if (c.version !== 67) return value;
    if (c.story === null) {
        c.version = 68;
        return c;
    }
    const p = c.story;
    if (
        !p ||
        p.version !== 32 ||
        !p.progress ||
        !Array.isArray(p.claimed) ||
        !c.bank ||
        typeof c.bank !== 'object'
    )
        return value;
    const oldTasks = [
        ...VENUS_CONSTRUCTION,
        ...VENUS_SHIELD,
        ...['venus-survey', 'venus-site', 'venus-build', 'venus-shield', 'venus-defense'].map(
            (id) => ({ id, target: 1 }),
        ),
        { id: 'venus-reserve', target: 16 },
    ];
    const expected = [...STORY_TASKS.filter((t) => t.sector !== 'venus'), ...oldTasks];
    if (
        Object.keys(p.progress).length !== expected.length ||
        new Set(p.claimed).size !== p.claimed.length ||
        p.claimed.some((id: unknown) => !expected.some((t) => t.id === id)) ||
        expected.some(
            (t) =>
                !Number.isInteger(p.progress[t.id]) ||
                p.progress[t.id] < 0 ||
                p.progress[t.id] > t.target ||
                (p.progress[t.id] === t.target) !== p.claimed.includes(t.id),
        )
    )
        return value;
    const done = p.claimed.includes('venus-defense') && p.claimed.includes('venus-shield');
    const wasVenus = c.activeRun?.sector === 'venus';
    if (!done) {
        for (const t of [...VENUS_CONSTRUCTION, ...VENUS_SHIELD]) {
            const n = p.progress[t.id];
            if (typeof c.bank[t.resource] !== 'number' && c.bank[t.resource] !== undefined)
                return value;
            c.bank[t.resource] = (c.bank[t.resource] ?? 0) + n;
        }
    }
    for (const t of oldTasks) delete p.progress[t.id];
    p.claimed = p.claimed.filter((id: string) => !oldTasks.some((t) => t.id === id));
    for (const id of VENUS_TASK_IDS) {
        p.progress[id] = done ? 1 : 0;
        if (done) p.claimed.push(id);
    }
    p.venus = newVenusProgress();
    if (done)
        Object.assign(p.venus, {
            powerRestored: true,
            probeBuilt: true,
            transmission: 3,
            guardianDefeated: true,
        });
    if (p.sector === 'venus') p.radio = { pending: [], acknowledged: [] };
    // A conversion is a safe return, never a lost ship or a packet delivered by refresh.
    if (wasVenus) {
        for (const [id, n] of Object.entries(c.activeRun.freight ?? {}))
            if (typeof n === 'number' && n >= 0 && Number.isFinite(n))
                c.bank[id] = (c.bank[id] ?? 0) + n;
        c.activeRun = null;
    }
    c.version = 68;
    p.version = 33;
    return c;
}
