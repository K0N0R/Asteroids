import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { GAME } from '../frontend/game/config';
import { beginRun, finishRun, newCampaign, parseCampaign } from '../frontend/game/state/campaign';
import { contractReady, selectContract } from '../frontend/game/state/contracts';
import { expeditionXp } from '../frontend/game/state/pilots';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { EnemyNavigation } from '../frontend/game/systems/enemyNavigation';
import { missionObjectives } from '../frontend/game/ui/missionReadout';

before(async () => {
    await RAPIER.init();
});
const idle: FlightInput = {
    target: { x: 10000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready() {
    const c = newCampaign();
    c.recovered = 1;
    c.station.workshop = 1;
    c.ship!.hull = 'fighter';
    assert.ok(selectContract(c, 5));
    return c;
}
test('combat contract unlocks after a safe return and workshop I, and cannot be selected mid-run', () => {
    const c = newCampaign();
    assert.equal(selectContract(c, 5), false);
    c.recovered = 1;
    assert.equal(selectContract(c, 5), false);
    c.station.workshop = 1;
    assert.ok(selectContract(c, 5));
    assert.ok(beginRun(c, 7));
    assert.equal(selectContract(c, 0), false);
});
test('combat goals require three kills from this sortie; cargo, scans and malformed counts cannot substitute', () => {
    for (const kills of [0, 2, -1, 3.5, NaN, Infinity])
        assert.equal(
            contractReady(5, { ore: 100, parts: 100 }, ['relay', 'archive', 'outpost'], kills),
            false,
        );
    assert.ok(contractReady(5, { ore: 0, parts: 0 }, [], 3));
    assert.deepEqual(
        missionObjectives(5, { ore: 0, parts: 0 }, [], false, false, false, 2).map((g) => [
            g.id,
            g.progress,
            g.complete,
        ]),
        [
            ['kills', '2/3', false],
            ['return', '', false],
        ],
    );
    assert.deepEqual(
        missionObjectives(5, { ore: 0, parts: 0 }, [], false, false, false, 3).map(
            (g) => g.complete,
        ),
        [true, false],
    );
});
test('three actual swept bullet kills complete a goal only after docking, with reward and pilot XP exactly once', () => {
    const c = ready();
    beginRun(c, 7);
    const sim = new MissionSimulation(c, 7);
    try {
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        const enemies = [...sim.enemies.enemies.values()].slice(0, 3);
        for (let i = 0; i < 3; i++) {
            const enemy = enemies[i];
            enemy.body.setTranslation({ x: 20, y: 0 }, true);
            enemy.body.setLinvel({ x: 0, y: 0 }, true);
            sim.bullets.set(9000 + i, {
                id: 9000 + i,
                x: 1900,
                y: 0,
                vx: 10000,
                vy: 0,
                life: 1,
                team: 'player',
                damage: 100,
            });
            sim.step(idle);
            assert.equal(sim.enemyKills, i + 1);
        }
        assert.equal(c.contractCompletions[5], 0);
        assert.equal(c.bank.parts, 0);
        assert.equal(sim.loot.size, 15);
        for (let i = 0; i < 80; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.ended, 'returned');
        const result = finishRun(c, true, sim.cargo, sim.elapsed, 'dock', sim.repairKits, {
            kills: sim.enemyKills,
        });
        assert.deepEqual(result!.reward, { ore: 24, parts: 6 });
        assert.equal(result!.pilotProgress!.gainedXp, 16);
        assert.equal(c.contractCompletions[5], 1);
        assert.equal(finishRun(c, true, sim.cargo, 1, 'again', 0, { kills: 3 }), null);
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
        beginRun(c, 8);
        const next = new MissionSimulation(c, 8);
        try {
            assert.equal(next.enemyKills, 0);
        } finally {
            next.dispose();
        }
    } finally {
        sim.dispose();
    }
});
test('partial returns keep salvage and combat experience; death and refresh give no rewards or experience', () => {
    const c = ready();
    beginRun(c, 7);
    const result = finishRun(c, true, { ore: 3, parts: 2 }, 1, 'partial', 0, { kills: 2 });
    assert.deepEqual(result!.reward, { ore: 0, parts: 0 });
    assert.equal(result!.pilotProgress!.gainedXp, 11);
    assert.equal(c.contractCompletions[5], 0);
    const bank = { ...c.bank };
    beginRun(c, 8);
    const loaded = parseCampaign(JSON.stringify(c))!;
    const lost = finishRun(loaded, false, { ore: 20, parts: 5 }, 10, 'refresh', 0, { kills: 10 });
    assert.equal(lost!.pilotProgress, null);
    assert.deepEqual(loaded.bank, bank);
    assert.equal(loaded.contractCompletions[5], 0);
    assert.equal(expeditionXp({ ore: 0, parts: 0 }, [], false, null, 100), 10);
    for (const bad of [-1, NaN, Infinity, 1.5])
        assert.equal(expeditionXp({ ore: 0, parts: 0 }, [], false, null, bad), 0);
});
test('navigation follows one moving drone, switches after destruction and returns home when none remain', () => {
    const sim = new MissionSimulation(ready(), 7),
        nav = new EnemyNavigation();
    try {
        const player = { x: 0, y: 0 };
        nav.select(sim.enemies, player);
        const id = nav.selectedId!;
        const selected = sim.enemies.enemies.get(id)!;
        selected.body.setTranslation({ x: 50, y: 0 }, true);
        const other = [...sim.enemies.enemies.values()].find((e) => e.id !== id)!;
        other.body.setTranslation({ x: 10, y: 0 }, true);
        assert.equal(nav.waypoint(sim.enemies, player).x, 50 * GAME.pixelsPerMeter);
        assert.equal(nav.selectedId, id);
        nav.select(sim.enemies, player);
        assert.equal(nav.selectedId, other.id);
        sim.enemies.damage(other.id, 10000);
        assert.notEqual(nav.waypoint(sim.enemies, player).name, `Dron #${other.id}`);
        sim.enemies.dispose();
        assert.deepEqual(nav.waypoint(sim.enemies, player), {
            x: 0,
            y: 0,
            name: 'Aurora / brak dronów',
        });
    } finally {
        sim.dispose();
    }
});
test('v8 journal migrates to v9 without losing active marker, history, fleet or bank; new incomplete journals fail', () => {
    const c = ready();
    c.contract = 4;
    c.contractCompletions = [1, 2, 3, 4, 5, 0, 0, 0];
    c.bank = { ore: 15, parts: 3 };
    beginRun(c, 7);
    const old = { ...c, version: 8, contractCompletions: [1, 2, 3, 4, 5] };
    const loaded = parseCampaign(JSON.stringify(old));
    assert.deepEqual(loaded, c);
    assert.equal(
        parseCampaign(JSON.stringify({ ...c, contractCompletions: [1, 2, 3, 4, 5] })),
        null,
    );
    assert.equal(
        parseCampaign(JSON.stringify({ ...old, contractCompletions: [1, 2, 3, 4, -1] })),
        null,
    );
});
