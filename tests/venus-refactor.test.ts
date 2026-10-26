import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { createDevelopmentAct } from '../frontend/game/state/development';
import {
    beginRun,
    finishRun,
    parseCampaign,
    SaveRepository,
} from '../frontend/game/state/campaign';
import {
    STORY_TASKS,
    storyDiscoveredTasks,
    storySectorUnlocked,
} from '../frontend/game/state/story';
import { VENUS_TASK_IDS, VENUS_PROBE_COST } from '../frontend/game/state/venusAct';
import { completeVenusTask, venusStationAction } from '../frontend/game/state/venusActions';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { V, venusLanes, nearestVenusMap, venusStorms } from '../frontend/game/worlds/venusLayout';
import { outsideCombatView } from '../frontend/game/systems/assaultEntry';
import { enemyPosition } from '../frontend/game/systems/enemies';
import { VENUS_CONSTRUCTION, VENUS_SHIELD } from '../frontend/game/state/orbitalConstruction';
import type { Point } from '../frontend/game/worlds/sector';
import { restoreVenusPower } from './venus-power-helper';
before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function place(s: MissionSimulation, q: Point) {
    s.ship.setTranslation({ x: q.x / 100, y: q.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
    s.previous = { ...q };
}
function hold(s: MissionSimulation, q: Point) {
    s.step({ ...idle, target: q });
    place(s, q);
    for (let i = 0; i < 65 && !s.ended; i++) s.step({ ...idle, target: q, interact: true });
    s.step({ ...idle, target: q });
}
function gate(s: MissionSimulation, q: Point) {
    hold(s, q);
    assert.ok(s.hyperdrive.active || s.transferActive, 'passage starts');
    for (let i = 0; i < 600 && (s.hyperdrive.active || s.transferActive); i++) s.step(idle);
    assert.equal(s.hyperdrive.active, false);
    assert.equal(s.transferActive, false);
}
function sortie(c = createDevelopmentAct('act-3')) {
    assert.ok(beginRun(c, 1));
    return new MissionSimulation(c, c.activeRun!.seed);
}
function kill(s: MissionSimulation, id: number) {
    const e = s.enemies.enemies.get(id);
    if (e) (s as any).damageEnemy(e, 10000, enemyPosition(e));
}

test('Venus reveals one step, keeps tier I and unlocks Mercury only after final packet', () => {
    const c = createDevelopmentAct('act-3');
    assert.deepEqual(
        storyDiscoveredTasks(c.story!)
            .filter((t) => !c.story!.claimed.includes(t.id))
            .map((t) => t.id),
        [VENUS_TASK_IDS[0]],
    );
    assert.equal(c.station.workshopLevel, 1);
    assert.equal(venusLanes(c.story!).length, 0);
    assert.ok(!storySectorUnlocked(c.story!, 'mercury'));
    assert.equal(venusStationAction(c, 'venus-probe-build'), false);
    for (const id of VENUS_TASK_IDS.slice(0, 5)) completeVenusTask(c, id);
    assert.ok(!storySectorUnlocked(c.story!, 'mercury'));
    completeVenusTask(c, VENUS_TASK_IDS[5]);
    assert.ok(storySectorUnlocked(c.story!, 'mercury'));
    assert.ok(parseCampaign(JSON.stringify(c)));
});
test('probe assembly spends exact tier-I bill once, analysis requires delivered transmission', () => {
    const c = createDevelopmentAct('act-3');
    completeVenusTask(c, VENUS_TASK_IDS[0]);
    completeVenusTask(c, VENUS_TASK_IDS[1]);
    for (const [id, n] of Object.entries(VENUS_PROBE_COST)) c.bank[id as keyof typeof c.bank] = n;
    assert.ok(venusStationAction(c, 'venus-probe-build'));
    const stock = structuredClone(c.bank);
    assert.equal(venusStationAction(c, 'venus-probe-build'), false);
    assert.deepEqual(c.bank, stock);
    assert.equal(venusStationAction(c, 'venus-analyse'), false);
    completeVenusTask(c, VENUS_TASK_IDS[2]);
    assert.ok(venusStationAction(c, 'venus-analyse'));
    assert.ok(!c.station.extraction);
    assert.equal(c.station.workshopLevel, 1);
});
test('real interaction holds, both-way gates, archive delivery and packet loss', () => {
    const s = sortie(),
        c = s.campaign;
    try {
        hold(s, V.relay);
        assert.ok(c.story!.claimed.includes(VENUS_TASK_IDS[0]));
        gate(s, V.stationGate);
        assert.equal(s.venusAct!.area, 'station');
        hold(s, V.power);
        assert.equal(c.story!.venus!.powerRestored, false);
        restoreVenusPower(s);
        assert.ok(c.story!.venus!.powerRestored);
        hold(s, V.archive);
        assert.equal(s.venusAct!.packet, 'archive');
        assert.ok(!c.story!.claimed.includes(VENUS_TASK_IDS[1]));
        assert.ok(parseCampaign(JSON.stringify(c)));
        gate(s, V.stationEntry);
        assert.equal(s.venusAct!.area, 'orbit');
        hold(s, { x: 0, y: 0 });
        assert.equal(s.ended, 'returned');
        assert.ok(c.story!.claimed.includes(VENUS_TASK_IDS[1]));
        finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
    const lost = createDevelopmentAct('act-3');
    completeVenusTask(lost, VENUS_TASK_IDS[0]);
    const t = sortie(lost);
    try {
        t.venusAct!.area = 'station';
        lost.story!.venus!.powerRestored = true;
        hold(t, V.archive);
        assert.equal(t.venusAct!.packet, 'archive');
    } finally {
        t.dispose();
    }
    lost.activeRun = null;
    const next = sortie(lost);
    try {
        assert.equal(next.venusAct!.packet, null);
        assert.ok(!lost.story!.claimed.includes(VENUS_TASK_IDS[1]));
    } finally {
        next.dispose();
    }
});
test('complete physical probe voyage, safe offscreen waves, transmission and guardian finale', () => {
    const c = createDevelopmentAct('act-3');
    completeVenusTask(c, VENUS_TASK_IDS[0]);
    completeVenusTask(c, VENUS_TASK_IDS[1]);
    assert.ok(venusStationAction(c, 'venus-probe-build'));
    let s = sortie(c);
    let spawned = 0;
    try {
        hold(s, V.probe);
        assert.ok(s.escort);
        let arrived = false;
        for (let f = 0; f < 60 * 150; f++) {
            const e = s.escort!;
            place(s, { x: e.position.x + 150, y: e.position.y });
            s.hull = s.maxHull;
            const old = new Set(s.enemies.enemies.keys());
            const view = s.combatView;
            s.step(idle);
            for (const enemy of s.enemies.enemies.values())
                if (enemy.id >= 81200 && enemy.id < 81900 && !old.has(enemy.id)) {
                    assert.ok(outsideCombatView(enemyPosition(enemy), 40, view));
                    spawned++;
                }
            for (const id of [...s.enemies.enemies.keys()]) if (id < 81900) kill(s, id);
            if (e.state === 'complete') {
                arrived = true;
                break;
            }
        }
        assert.ok(arrived, 'probe physically reaches atmosphere gate');
        assert.ok(spawned >= 2);
        gate(s, V.atmosphereApproach);
        assert.equal(s.venusAct!.area, 'atmosphere');
        assert.equal(nearestVenusMap(s.escort!.position).id, 'atmosphere');
        for (let f = 0; f < 60 * 100 && !c.story!.claimed.includes(VENUS_TASK_IDS[2]); f++) {
            const e = s.escort!;
            place(s, { x: e.position.x + 150, y: e.position.y });
            s.hull = s.maxHull;
            const old = new Set(s.enemies.enemies.keys()),
                view = s.combatView;
            s.step(idle);
            for (const enemy of s.enemies.enemies.values())
                if (enemy.id >= 81200 && enemy.id < 81900 && !old.has(enemy.id)) {
                    const p = enemyPosition(enemy);
                    assert.ok(outsideCombatView(p, 40, view));
                    assert.ok(
                        venusStorms(s.elapsed).every(
                            (h) => Math.hypot(p.x - h.x, p.y - h.y) > h.radius + 40,
                        ),
                    );
                    spawned++;
                }
            for (const id of [...s.enemies.enemies.keys()]) if (id < 81900) kill(s, id);
            assert.ok(
                venusStorms(s.elapsed).every(
                    (h) => Math.hypot(e.position.x - h.x, e.position.y - h.y) > h.radius + 30,
                ),
            );
        }
        assert.equal(c.story!.venus!.transmission, 3);
        assert.ok(c.story!.claimed.includes(VENUS_TASK_IDS[2]));
        assert.equal(spawned, 7);
        gate(s, V.atmosphereAscent);
        hold(s, { x: 0, y: 0 });
        assert.equal(s.ended, 'returned');
        finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits);
    } finally {
        s.dispose();
    }
    assert.ok(venusStationAction(c, 'venus-analyse'));
    s = sortie(c);
    try {
        gate(s, V.aiGate);
        hold(s, V.terminal);
        assert.ok(s.venusAct!.guardianAwake);
        const hp = s.enemies.enemies.get(81900)!.health;
        kill(s, 81900);
        assert.equal(s.enemies.enemies.get(81900)!.health, hp);
        for (let i = 0; i < 190; i++) {
            s.hull = s.maxHull;
            s.step(idle);
        }
        kill(s, 81901);
        kill(s, 81902);
        s.step(idle);
        kill(s, 81900);
        assert.ok(c.story!.claimed.includes(VENUS_TASK_IDS[4]));
        assert.ok(!storySectorUnlocked(c.story!, 'mercury'));
        hold(s, V.terminal);
        assert.equal(s.venusAct!.packet, 'final');
        gate(s, V.aiEntry);
        hold(s, { x: 0, y: 0 });
        assert.equal(s.ended, 'returned');
        assert.ok(storySectorUnlocked(c.story!, 'mercury'));
        finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

function oldSave(done = false) {
    const c: any = createDevelopmentAct('act-3');
    c.version = 67;
    c.story.version = 32;
    delete c.story.venus;
    for (const id of VENUS_TASK_IDS) delete c.story.progress[id];
    for (const t of [
        ...VENUS_CONSTRUCTION,
        ...VENUS_SHIELD,
        ...['venus-survey', 'venus-site', 'venus-build', 'venus-shield', 'venus-defense'].map(
            (id) => ({ id, target: 1 }),
        ),
        { id: 'venus-reserve', target: 16 },
    ]) {
        c.story.progress[t.id] = done ? t.target : 0;
        if (done) c.story.claimed.push(t.id);
    }
    return c;
}
test('previous schema migrates, backs up once, refunds partial old construction and preserves later access', () => {
    const c = oldSave();
    c.story.progress['venus-stockpile'] = 3;
    const old = c.bank.parts,
        storage = new Map([['test', JSON.stringify(c)]]),
        repo = new SaveRepository(
            {
                getItem: (k) => storage.get(k) ?? null,
                setItem: (k, v) => {
                    storage.set(k, v);
                },
            },
            { key: 'test' },
        );
    const restored = repo.load();
    assert.equal(restored.version, 68);
    assert.equal(restored.bank.parts, old + 3);
    assert.ok(storage.get('test.backup-v67'));
    assert.ok(!restored.story!.claimed.some((id) => id.startsWith('venus-')));
    assert.equal(repo.load().bank.parts, old + 3);
    const done = parseCampaign(JSON.stringify(oldSave(true)))!;
    assert.ok(done);
    assert.ok(storySectorUnlocked(done.story!, 'mercury'));
    const invalid = oldSave();
    invalid.story.progress['venus-stockpile'] = 999;
    assert.equal(parseCampaign(JSON.stringify(invalid)), null);
    const broken = createDevelopmentAct('act-3');
    broken.story!.venus!.transmission = 4;
    assert.equal(parseCampaign(JSON.stringify(broken)), null);
});
