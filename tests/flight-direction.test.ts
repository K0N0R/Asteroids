import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FlightDirection, type DirectionSnapshot } from '../frontend/game/systems/flightDirection';
import RAPIER from '@dimforge/rapier2d-compat';
import { GameSettings } from '../frontend/core/systems/gameSettings';
import { newStoryCampaign, beginRun } from '../frontend/game/state/campaign';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { MissionWorld } from '../frontend/game/worlds/missionWorld';
GameSettings.soundEnabled = false;

const quiet = (): DirectionSnapshot => ({
    returned: false,
    destroyed: false,
    interrupted: false,
    threat: false,
    hullFraction: 1,
    heat: 0,
    discoveries: [],
});
function advance(direction: FlightDirection, state: DirectionSnapshot, seconds: number) {
    for (let i = 0; i < Math.ceil(seconds / 0.05); i++) direction.advance(0.05, state);
}
test('launch is bounded, optional for the sandbox, and docking completion has a separate gate', () => {
    const direction = new FlightDirection(),
        state = quiet();
    assert.equal(direction.phase, 'launch');
    advance(direction, state, 1);
    assert.equal(direction.active, true);
    advance(direction, state, 1);
    assert.equal(direction.phase, 'flight');
    assert.equal(new FlightDirection(false).active, false);
    state.returned = true;
    advance(direction, state, 0.7);
    assert.equal(direction.phase, 'dock');
    assert.equal(direction.returnFinished, false);
    advance(direction, state, 1);
    assert.equal(direction.returnFinished, true);
    assert.equal(direction.fraction, 1);
});
test('quiet discoveries frame a nearby object once and release the camera when the pilot manoeuvres', () => {
    const direction = new FlightDirection(false),
        state = quiet();
    state.discoveries = [{ id: 'relay', name: 'przekaźnik', position: { x: 400, y: 50 } }];
    advance(direction, state, 1);
    assert.equal(direction.cue?.id, 'relay');
    assert.ok(direction.focusWeight > 0 && direction.focusWeight <= 0.28);
    state.interrupted = true;
    direction.advance(0.05, state);
    assert.equal(direction.focusWeight, 0);
    assert.equal(direction.cue?.focus, undefined);
    state.interrupted = false;
    advance(direction, state, 10);
    assert.equal(direction.cue, null);
});
test('threats interrupt a discovery immediately and critical hull takes priority over a contact', () => {
    const direction = new FlightDirection(false),
        state = quiet();
    state.discoveries = [{ id: 'archive', name: 'archiwum', position: { x: 50, y: 50 } }];
    advance(direction, state, 1);
    state.threat = true;
    state.hullFraction = 0.2;
    direction.advance(0.05, state);
    assert.equal(direction.cue?.id, 'hull');
    assert.equal(direction.cue?.warning, true);
    assert.equal(direction.focusWeight, 0);
    advance(direction, state, 10);
    assert.equal(direction.cue, null);
});
test('heat warning is issued once per sortie; destruction clears commentary and framing', () => {
    const direction = new FlightDirection(false),
        state = quiet();
    state.heat = 80;
    direction.advance(0.05, state);
    assert.equal(direction.cue?.id, 'heat');
    advance(direction, state, 10);
    assert.equal(direction.cue, null);
    state.destroyed = true;
    direction.advance(0.05, state);
    assert.equal(direction.active, false);
    assert.equal(direction.focusWeight, 0);
});
test('large frame gaps cannot finish an entire cinematic and presentation never changes the snapshot', () => {
    const direction = new FlightDirection(),
        state = quiet(),
        before = structuredClone(state);
    direction.advance(60, state);
    assert.equal(direction.phase, 'launch');
    assert.deepEqual(state, before);
});

test('world launch pauses physics and a real docking interaction waits for the return animation', async () => {
    await RAPIER.init();
    const campaign = newStoryCampaign();
    assert.ok(beginRun(campaign, 1234));
    const sim = new MissionSimulation(campaign, campaign.activeRun!.seed);
    const world = new MissionWorld(sim, campaign.ship!);
    const input = {
        target: { x: 0, y: 0 },
        thrust: false,
        brake: false,
        fire: false,
        interact: false,
    };
    try {
        const position = { ...sim.position };
        for (let i = 0; i < 60; i++) world.update(1000 / 60, input);
        assert.equal(sim.elapsed, 0);
        assert.deepEqual(sim.position, position);
        for (let i = 0; i < 60; i++) world.update(1000 / 60, input);
        assert.equal(world.direction.phase, 'flight');
        assert.ok(sim.elapsed > 0);
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        for (let i = 0; i < 90 && !sim.ended; i++)
            world.update(1000 / 60, { ...input, interact: true });
        assert.equal(sim.ended, 'returned');
        assert.equal(world.returnFinished, false);
        const elapsed = sim.elapsed;
        for (let i = 0; i < 100; i++) world.update(1000 / 60, input);
        assert.equal(world.returnFinished, true);
        assert.equal(sim.elapsed, elapsed);
        assert.ok(campaign.activeRun, 'presentation must leave settlement to the session');
    } finally {
        world.dispose();
    }
});
