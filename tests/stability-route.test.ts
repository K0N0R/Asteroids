import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    newShip,
    beginRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { recoverTechnicalInterruption } from '../frontend/game/state/technicalRecovery';
import {
    marsSecurityObjective,
    MARS_AMBUSH,
    MARS_SURFACE_PATROLS,
    MARS_ACT,
} from '../frontend/game/state/marsAct';
import { marsRequiredFleet } from '../frontend/game/worlds/marsSystem';
import { MARS_GATES } from '../frontend/game/worlds/marsLayout';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { grantStoryTasks } from './fleet-fixtures';
import { enqueueRadio, pruneObsoleteMarsRadio } from '../frontend/game/state/communications';
import { solveTerminal } from './terminal-test-helper';
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
before(async () => RAPIER.init());
function campaign() {
    const c = newStoryCampaign();
    grantStoryTasks(c, ['mars-landing-blocked', 'mars-shields']);
    c.story!.sector = 'mars';
    c.ship = newShip(1, 'swift');
    return c;
}
function at(s: MissionSimulation, p: { x: number; y: number }) {
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
test('recorded GPU interruption preserves ship, pilot and progression without rewards', () => {
    const c = newStoryCampaign();
    assert.ok(beginRun(c, 123));
    c.activeRun!.technicalInterruption = true;
    const loaded = parseCampaign(JSON.stringify(c))!;
    assert.ok(loaded);
    const ship = JSON.stringify(loaded.ship),
        pilots = JSON.stringify(loaded.pilots),
        bank = JSON.stringify(loaded.bank),
        story = JSON.stringify(loaded.story);
    assert.equal(recoverTechnicalInterruption(loaded), true);
    assert.equal(loaded.activeRun, null);
    assert.equal(JSON.stringify(loaded.ship), ship);
    assert.equal(JSON.stringify(loaded.pilots), pilots);
    assert.equal(JSON.stringify(loaded.bank), bank);
    assert.equal(JSON.stringify(loaded.story), story);
    assert.equal(recoverTechnicalInterruption(loaded), false);
    assert.ok(beginRun(loaded, 124));
    assert.equal(recoverTechnicalInterruption(loaded), false);
    assert.ok(loaded.activeRun);
});
test('Kepler objective supersedes sector clearing and stale saved radio is acknowledged', () => {
    const c = campaign();
    grantStoryTasks(c, ['mars-sector-secure']);
    enqueueRadio(c.story!, {
        speaker: 'operations',
        text: 'Wyeliminuj pozostałe wymagane jednostki',
    });
    enqueueRadio(c.story!, { speaker: 'science', text: 'Pomiary gotowe.' });
    assert.equal(pruneObsoleteMarsRadio(c.story!), true);
    assert.equal(c.story!.radio!.pending.length, 1);
    assert.match(marsSecurityObjective(c.story!), /Keplera/);
    assert.equal(pruneObsoleteMarsRadio(c.story!), false);
});
test('Phobos ambush spawns on arrival, attacks immediately and is explained only after the fight', () => {
    const c = campaign();
    assert.ok(!marsRequiredFleet(c.story!).some((e) => MARS_AMBUSH.includes(e.id)));
    assert.ok(beginRun(c, 123));
    const s = new MissionSimulation(c, 123);
    try {
        s.radioMessages.length = 0;
        s.marsOrbit = 'phobos';
        at(s, MARS_GATES.phobosArrival);
        s.step(idle);
        assert.ok(c.story!.mars.ambushEntered);
        for (const id of MARS_AMBUSH) {
            const e = s.enemies.enemies.get(id)!;
            assert.ok(e);
            assert.equal(e.state, 'chase');
            assert.ok(Math.hypot(e.x - s.position.x, e.y - s.position.y) < 1100);
        }
        assert.ok(!s.radioMessages.some((t) => /zasadzka|Trzy wrogie kontakty/.test(t)));
        for (const id of MARS_AMBUSH) {
            s.enemies.remove(id);
            s.marsAct!.killed(id);
        }
        s.step(idle);
        assert.equal(s.radioMessages.filter((t) => t.includes('To była zasadzka')).length, 1);
        s.step(idle);
        assert.equal(s.radioMessages.filter((t) => t.includes('To była zasadzka')).length, 1);
    } finally {
        s.dispose();
    }
});
test('one slow patrol explores Phobos and a full hold-F starts a hack at its terminal', () => {
    const c = campaign();
    c.story!.mars.ambushEntered = true;
    c.story!.mars.kills.push(...MARS_AMBUSH);
    const fleet = marsRequiredFleet(c.story!).filter((e) => MARS_SURFACE_PATROLS.includes(e.id));
    assert.equal(fleet.length, 1);
    assert.equal(fleet[0].patrolSpeed, 42);
    assert.equal(fleet[0].routeLoopFrom, 1);
    assert.ok(
        fleet[0].route!.some(
            (p) => Math.hypot(p.x - MARS_ACT.base.x, p.y - MARS_ACT.base.y) > 1800,
        ),
    );
    assert.ok(beginRun(c, 123));
    const s = new MissionSimulation(c, 123);
    try {
        s.area = 'surface';
        s.marsOrbit = 'phobos';
        at(s, MARS_ACT.terminal);
        // Patrol is elsewhere on its long route. Scanner is the remaining stealth hazard.
        const patrol = s.enemies.enemies.get(MARS_SURFACE_PATROLS[0])!;
        patrol.body.setTranslation({ x: 52.5, y: 56 }, true);
        s.marsAct!.security.disabledTime = 100;
        for (let i = 0; i < 62; i++) s.step({ ...idle, target: MARS_ACT.terminal, interact: true });
        assert.equal(s.interactionProgress?.target.id, 'mars-terminal');
        assert.ok(s.marsAct!.hacking);
        assert.ok(s.terminalPuzzle);
        solveTerminal(s);
        assert.ok(c.story!.mars.quietHack);
    } finally {
        s.dispose();
    }
});
test('the surface patrol raises the base alarm on spotting the player', () => {
    const c = campaign();
    c.story!.mars.ambushEntered = true;
    c.story!.mars.kills.push(...MARS_AMBUSH);
    assert.ok(beginRun(c, 123));
    const s = new MissionSimulation(c, 123);
    try {
        s.area = 'surface';
        s.marsOrbit = 'phobos';
        at(s, { x: 7800, y: 6200 });
        const e = s.enemies.enemies.get(MARS_SURFACE_PATROLS[0])!;
        e.body.setTranslation({ x: 78, y: 63 }, true);
        e.state = 'chase';
        e.target = 'player';
        s.marsAct!.security.disabledTime = 100;
        s.marsAct!.update(idle, 1 / 60);
        assert.equal(c.story!.mars.baseAlarm, true);
    } finally {
        s.dispose();
    }
});
