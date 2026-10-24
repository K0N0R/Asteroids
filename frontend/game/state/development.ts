import { STORY_TASKS, beltTechnologyReady, type StorySectorId } from './story';
import { newStoryCampaign, newShip, type Campaign } from './campaign';
import { DIALOGUES, dialogueReady } from './dialogues';
import { MARS_AMBUSH, MARS_SURFACE_PATROLS, MARS_YARD_PATROLS } from './marsAct';
import { RECIPES, RECIPE_IDS } from './chemistry';
import { awardPilotXp, MAX_PILOT_XP } from './pilots';

export const DEVELOPMENT_SAVE_KEY = 'asteroids.development.v1';
export const DEVELOPMENT_MODE_KEY = 'asteroids.development.active';
export const DEVELOPMENT_STARTS = [
    { id: 'act-1', act: 1, sector: 'earth', label: 'I · Ziemia' },
    { id: 'moon', act: 1, sector: 'lunar', label: 'I · Księżyc' },
    { id: 'act-2', act: 2, sector: 'mars', label: 'II · Mars' },
    { id: 'act-3', act: 3, sector: 'venus', label: 'III · Wenus' },
    { id: 'act-4', act: 4, sector: 'mercury', label: 'IV · Merkury' },
    { id: 'act-5', act: 5, sector: 'mars', label: 'V · Mars' },
    { id: 'act-6', act: 6, sector: 'belt', label: 'VI · Pas' },
    { id: 'act-7', act: 7, sector: 'jupiter', label: 'VII · Jowisz' },
    { id: 'act-8', act: 8, sector: 'saturn', label: 'VIII · Saturn' },
    { id: 'act-9', act: 9, sector: 'uranus', label: 'IX · Uran' },
    { id: 'neptune', act: 9, sector: 'neptune', label: 'IX · Neptun' },
    { id: 'act-10', act: 10, sector: 'pluto', label: 'X · Pluton' },
] as const satisfies readonly { id: string; act: number; sector: StorySectorId; label: string }[];
export type DevelopmentStartId = (typeof DEVELOPMENT_STARTS)[number]['id'];

export function currentDevelopmentStart(c: Campaign): DevelopmentStartId {
    const p = c.story;
    if (!p) return 'act-1';
    if (p.sector === 'mars') return beltTechnologyReady(p) ? 'act-5' : 'act-2';
    if (p.sector === 'earth' && p.claimed.includes('mars-anomaly-research')) return 'act-2';
    return DEVELOPMENT_STARTS.find((start) => start.sector === p.sector)!.id;
}
/** Deterministic first-entry checkpoint. Never inherit future unlocks, cargo or world objects. */
export function createDevelopmentAct(id: DevelopmentStartId): Campaign {
    const start = DEVELOPMENT_STARTS.find((s) => s.id === id);
    if (!start) throw new Error('Nieznany początek aktu.');
    const c = newStoryCampaign(),
        p = c.story!,
        complete = new Set<string>();
    const claim = (id: string) => {
        if (complete.has(id)) return;
        const task = STORY_TASKS.find((t) => t.id === id);
        if (!task) throw new Error(`Nieznane zadanie: ${id}`);
        task.dependencies.forEach(claim);
        task.deliveryItems?.forEach((t) => claim(t.id));
        complete.add(id);
    };
    for (const task of STORY_TASKS) {
        const previous =
            task.act < start.act ||
            (id === 'neptune' && task.act === 9 && task.sector === 'uranus');
        if (
            previous &&
            (task.required ||
                task.internal ||
                task.kind === 'laboratory' ||
                task.kind === 'workshop')
        )
            claim(task.id);
    }
    if (id === 'moon')
        for (const task of ['earth-materials', 'earth-supply', 'earth-relay', 'earth-route'])
            claim(task);
    for (const task of STORY_TASKS)
        if (complete.has(task.id)) {
            p.progress[task.id] = task.target;
            p.claimed.push(task.id);
            if (task.kind === 'laboratory')
                c.station.laboratoryLevel = Math.max(
                    c.station.laboratoryLevel,
                    task.facilityLevel ?? 1,
                );
            if (task.kind === 'workshop')
                c.station.workshopLevel = Math.max(
                    c.station.workshopLevel,
                    task.facilityLevel ?? 1,
                );
        }
    c.station.extraction = complete.has('mars-extraction-adapter');
    c.station.anomalySampleDelivered = complete.has('mars-anomaly-sample');
    c.station.shield = complete.has('mars-shields');
    const m = p.mars;
    m.landingBlocked = complete.has('mars-landing-blocked');
    m.ambushEntered = complete.has('mars-phobos-route');
    m.baseNeutralized = m.baseDiscovered = m.memoryDelivered = complete.has('mars-phobos-base');
    if (m.baseNeutralized) m.baseHealth = 0;
    m.aiIdentified = complete.has('mars-ai-discovery');
    m.yardDestroyed = complete.has('mars-asteroid-yard');
    if (m.yardDestroyed) m.yardHealth = 0;
    if (complete.has('mars-sector-secure'))
        m.kills = [...MARS_AMBUSH, ...MARS_SURFACE_PATROLS, ...MARS_YARD_PATROLS];
    if (complete.has('mars-anomaly-research')) {
        m.researchSites = 3;
        m.researchWaves = 4;
        m.researchReturned = true;
        m.announcements = [
            'intro',
            'barrier',
            'route',
            'ambush',
            'secured',
            'discovery',
            'base',
            'yard',
            'memory-delivery',
            'measure-1',
            'measure-2',
            'measure-3',
            'wave-0',
            'wave-1',
            'wave-2',
            'wave-3',
            'research-home',
        ];
    }
    p.lunarMule = complete.has('lunar-attack') ? 'transferred' : 'active';
    // Record only old briefings; the first briefing of the selected act remains unseen.
    for (const d of DIALOGUES)
        if (
            ((d.sector === 'earth' && (start.act > 1 || id === 'moon')) ||
                (d.sector === 'mars' && start.act > 2)) &&
            dialogueReady(p, d)
        )
            p.dialogues.push(d.id);
    p.sector = start.sector;
    // Normal story locks are intentional: previous acts are completed, bypass flags are absent.
    if (c.station.workshopLevel) {
        const hull =
            c.station.workshopLevel === 3
                ? 'aegis'
                : c.station.workshopLevel === 2
                  ? 'falcon'
                  : 'swift';
        c.ship = newShip(1, hull);
        c.reserveShips.push(newShip(c.nextShipId++, 'mule'));
        if (start.act >= 4) c.reserveShips.push(newShip(c.nextShipId++, 'harpoon'));
        for (const id of RECIPE_IDS) {
            const r = RECIPES[id];
            if (
                r.output === 'kit' ||
                r.level >
                    (r.category === 'laboratory'
                        ? c.station.laboratoryLevel
                        : c.station.workshopLevel)
            )
                continue;
            if (['kineticPlate', 'kineticModule'].includes(id)) continue;
            c.bank[r.output] =
                (c.bank[r.output] ?? 0) + (r.level === c.station.workshopLevel ? 8 : 4);
        }
    }
    if (start.act > 1 || id === 'moon') {
        Object.assign(c.bank, {
            ore: 40,
            copperOre: 12,
            crystals: 12,
            carbon: 12,
            hydrogen: 20,
            oxygen: 24,
            aluminium: 12,
            magnesium: 8,
        });
        if (complete.has('mercury-technology')) c.bank.mercuryOre = 12;
        if (c.station.anomalySampleDelivered) c.bank.anomalyOre = 8;
        c.repairKits = 3;
        awardPilotXp(
            c.pilots[0],
            Math.min(
                MAX_PILOT_XP,
                STORY_TASKS.filter((t) => complete.has(t.id)).reduce(
                    (n, t) => n + (t.rewardXp ?? 0),
                    0,
                ) +
                    (start.act - 1) * 20,
            ),
        );
    }
    return c;
}
export interface DevelopmentActions {
    canReturn: () => boolean;
    returnToBase: () => void;
    startAct: (id: DevelopmentStartId) => void;
    currentStart: () => DevelopmentStartId;
    resetCurrent: () => void;
    leave: () => void;
    active: () => boolean;
}
/** Bound by the active game session, read when ESC is opened. */
export const developmentControls: { actions: DevelopmentActions | null } = { actions: null };
