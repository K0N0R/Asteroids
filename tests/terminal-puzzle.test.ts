import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { TerminalPuzzle, terminalProfile } from '../frontend/game/systems/terminalPuzzle';
import { terminalMoves, solveTerminal } from './terminal-test-helper';
import { newCampaign, newShip, beginRun } from '../frontend/game/state/campaign';
import { MissionSimulation } from '../frontend/game/systems/mission';
import type { HullId } from '../frontend/game/config';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function fixture(hull: HullId = 'prospector') {
    const c = newCampaign();
    c.ship = newShip(1, hull);
    beginRun(c, 71);
    const s = new MissionSimulation(c, 71);
    for (const rock of s.rocks.values()) s.world.removeRigidBody(rock.body);
    s.rocks.clear();
    for (const id of [...s.enemies.enemies.keys()]) s.enemies.damage(id, 10000);
    const p = s.sector.outpost.terminal;
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
    return s;
}

test('1000 seeded boards have visible solutions, varied routes and conserved solvable power budgets', () => {
    const layouts = new Set<string>();
    for (let seed = 0; seed < 1000; seed++)
        for (const mode of ['breach', 'power'] as const) {
            const p = new TerminalPuzzle(mode, 'prospector', seed);
            assert.equal(p.matched, false);
            assert.deepEqual(p.tiles, new TerminalPuzzle(mode, 'prospector', seed).tiles);
            layouts.add(`${p.start},${p.goal},${p.tiles}`);
            for (const action of terminalMoves(p)) {
                assert.equal(p.act(action), 'none');
                assert.equal(
                    p.power.reduce((a, b) => a + b),
                    6,
                );
            }
            assert.ok(p.matched);
            assert.equal(p.act({ confirm: true }), 'success');
            assert.equal(p.act({ confirm: true }), 'none');
        }
    assert.ok(layouts.size > 100);
});

test('Sokol has a longer connection and half trace per mistake, Phoenix alone can force a noisy breach', () => {
    assert.equal(terminalProfile('falcon').seconds, 45);
    for (const hull of ['prospector', 'falcon', 'phoenix'] as const) {
        const p = new TerminalPuzzle('breach', hull, 1);
        p.act({ confirm: true });
        assert.equal(p.trace, hull === 'falcon' ? 15 : 30);
        const before = [...p.tiles];
        assert.equal(p.act({ overload: true }), hull === 'phoenix' ? 'success' : 'none');
        if (hull !== 'phoenix') assert.deepEqual(p.tiles, before);
        else assert.equal(p.trace, 100);
    }
    assert.equal(new TerminalPuzzle('power', 'phoenix', 1).act({ overload: true }), 'none');
});

test('invalid actions cannot rotate or spend power; timeout ends the session without success', () => {
    const p = new TerminalPuzzle('power', 'prospector', 1);
    const original = [...p.power];
    for (const channel of [-1, 3, NaN, 0.5]) p.act({ channel, delta: 1 });
    assert.deepEqual(p.power, original);
    p.tick(NaN);
    p.tick(-1);
    assert.equal(p.remaining, 30);
    assert.equal(p.tick(30), true);
    assert.equal(p.trace, 100);
    assert.equal(p.act({ confirm: true }), 'none');
    const b = new TerminalPuzzle('breach', 'prospector', 1),
        tiles = [...b.tiles];
    for (const rotate of [-1, 12, NaN, 0.5]) b.act({ rotate });
    assert.deepEqual(b.tiles, tiles);
});

test('holding E never downloads data; a real puzzle success grants loot exactly once and permits equipment access separately', () => {
    const s = fixture();
    try {
        for (let frame = 0; frame < 300; frame++) s.step({ ...idle, interact: true });
        assert.ok(s.terminalPuzzle);
        assert.equal(s.outpost.secured, false);
        assert.ok(!s.surveyData.has('outpost'));
        const loot = s.loot.size;
        solveTerminal(s);
        assert.ok(s.outpost.secured);
        assert.ok(s.surveyData.has('outpost'));
        const after = s.loot.size;
        assert.equal(after, loot + 10);
        assert.equal(s.terminalAction({ confirm: true }), false);
        assert.equal(s.loot.size, after);
        assert.equal(s.stolenEquipment, undefined);
    } finally {
        s.dispose();
    }
});

test('power rerouting spends only one carried component after confirmation, never on cancel or an invalidated connection', () => {
    const s = fixture();
    try {
        s.cargo.parts = 1;
        s.step({ ...idle, sabotage: true });
        assert.equal(s.terminalPuzzle?.mode, 'power');
        s.terminalAction({ cancel: true });
        assert.equal(s.cargo.parts, 1);
        solveTerminal(s, 'power');
        assert.equal(s.cargo.parts, 0);
        assert.ok(s.outpost.sabotaged);
        assert.ok(s.outpost.disabledTime > 19.9);
        assert.equal(s.terminalAction({ confirm: true }), false);
        assert.equal(s.cargo.parts, 0);
    } finally {
        s.dispose();
    }
});

test('mistakes retain trace across reconnects and full trace summons physical guards only once', () => {
    const s = fixture();
    try {
        s.step({ ...idle, interact: true });
        s.terminalAction({ confirm: true });
        assert.equal(s.outpost.trace, 30);
        s.terminalAction({ cancel: true });
        s.step(idle);
        s.step({ ...idle, interact: true });
        assert.ok(s.terminalPuzzle!.trace > 29);
        for (let i = 0; i < 3; i++) s.terminalAction({ confirm: true });
        assert.equal(s.terminalPuzzle, null);
        assert.ok(s.outpost.alarm > 0);
        assert.equal(s.enemies.enemies.size, 2);
        assert.ok(!s.outpost.secured);
        for (const id of [...s.enemies.enemies.keys()]) s.enemies.damage(id, 10000);
        s.outpost.alarm = 0;
        s.step(idle);
        s.step({ ...idle, interact: true });
        assert.ok(s.terminalPuzzle);
        s.terminalAction({ confirm: true });
        assert.equal(
            s.enemies.enemies.size,
            0,
            'the same base has only one reinforcement dispatch per sortie',
        );
    } finally {
        s.dispose();
    }
});

test('connection timeout triggers a real alarm while simulation time continues', () => {
    const s = fixture();
    try {
        s.step({ ...idle, interact: true });
        const elapsed = s.elapsed;
        // Prepare only the timeout boundary; the mission still performs the expiration and guard dispatch.
        s.terminalPuzzle!.remaining = 0.05;
        for (let i = 0; i < 4; i++) s.step(idle);
        assert.ok(s.elapsed > elapsed + 0.05);
        assert.equal(s.terminalPuzzle, null);
        assert.ok(s.outpost.alarm > 7);
        assert.equal(s.outpost.secured, false);
        assert.equal(s.enemies.enemies.size, 2);
    } finally {
        s.dispose();
    }
});

test('Phoenix can obtain data immediately but raises a real alarm even after shutting down the scanner', () => {
    const s = fixture('phoenix');
    try {
        s.outpost.disable();
        s.step({ ...idle, interact: true });
        assert.ok(s.terminalAction({ overload: true }));
        assert.ok(s.outpost.secured);
        assert.ok(s.outpost.alarm > 7);
        assert.equal(s.enemies.enemies.size, 2);
        s.step(idle);
        assert.ok(
            s.outpost.alarm > 7,
            'scanner shutdown does not erase a terminal intrusion alarm',
        );
        assert.ok([...s.enemies.enemies.values()].every((e) => e.state === 'chase'));
    } finally {
        s.dispose();
    }
});

test('a shield hit invalidates a fully solved puzzle before confirmation, without granting data', () => {
    const s = fixture();
    try {
        s.step({ ...idle, interact: true });
        const p = s.terminalPuzzle!;
        for (const action of terminalMoves(p)) s.terminalAction(action);
        assert.ok(p.matched);
        const point = s.position;
        s.bullets.set(999999, {
            id: 999999,
            x: point.x - 80,
            y: point.y,
            vx: 10000,
            vy: 0,
            life: 1,
            team: 'enemy',
            damage: 5,
        });
        s.step(idle);
        assert.equal(s.terminalPuzzle, null);
        assert.equal(s.terminalAction({ confirm: true }), false);
        assert.equal(s.outpost.secured, false);
        assert.ok(!s.surveyData.has('outpost'));
    } finally {
        s.dispose();
    }
});
