import { generateStorySector } from '../frontend/game/worlds/storySector';
import { STORY_TASKS } from '../frontend/game/state/story';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    newShip,
    beginRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    magneticCoverage,
    MAGNETIC_RELAYS,
    REMOTE_MAGNETIC_ZONE,
} from '../frontend/game/systems/magneticZones';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { HarpoonArms } from '../frontend/game/systems/harpoonArms';
before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
test('new ships have neither hyperdrive purchase levels nor fuel', () => {
    const c = newStoryCampaign();
    assert.equal(Object.hasOwn(c.ship!, 'hyperdriveLevel'), false);
    assert.equal(Object.hasOwn(c.ship!, 'hyperFuel'), false);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    assert.equal(Object.hasOwn(newShip(9), 'hyperdriveLevel'), false);
});

test('remote magnetic coverage has a real gap and relays expand local coverage without joining the distant deposit', () => {
    assert.equal(magneticCoverage({ x: 0, y: 0 }, []), true);
    assert.equal(magneticCoverage({ x: 0, y: -2800 }, [0, 1, 2]), false);
    assert.equal(magneticCoverage(REMOTE_MAGNETIC_ZONE, []), true);
    assert.equal(magneticCoverage(MAGNETIC_RELAYS[1], []), false);
    assert.equal(magneticCoverage(MAGNETIC_RELAYS[1], [1]), true);
});
test('jettison conserves selected cargo, disables new collection and rejects absent cargo', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        s.cargo.copperOre = 7;
        s.selectedCargo = 'copperOre';
        assert.ok(s.jettisonCargo());
        assert.equal(s.cargo.copperOre, 2);
        assert.equal([...s.loot.values()].filter((l) => l.kind === 'copperOre').length, 5);
        assert.equal(s.grippers.enabled, false);
        s.toggleCollection();
        assert.equal(s.grippers.enabled, true);
        assert.equal(s.jettisonCargo('hydrogen'), false);
    } finally {
        s.dispose();
    }
});
test('mining beam ends at cursor and cannot damage a rock behind it', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        const target = { x: s.position.x + 85, y: s.position.y + 50 };
        s.step({ ...idle, target, mine: true });
        assert.ok(s.laserBeams.length);
        for (const beam of s.laserBeams) {
            assert.ok(Math.hypot(beam.to.x - target.x, beam.to.y - target.y) < 0.01);
        }
        const arms = new HarpoonArms();
        for (let i = 0; i < 60; i++) arms.update(1 / 60, { x: 30, y: 0 }, true, false);
        assert.ok(arms.poses.every((p) => Math.hypot(p.tip.x, p.tip.y) <= 30.001));
    } finally {
        s.dispose();
    }
});

test('relay activation expands coverage, persists on loss and requires the southern station upgrade', () => {
    const c = newStoryCampaign();
    for (const id of ['earth-supply', 'earth-relay', 'earth-workshop']) {
        c.story!.claimed.push(STORY_TASKS.find((t) => t.id === id)!.id);
        const task = STORY_TASKS.find((t) => t.id === id)!;
        c.story!.progress[task.id] = task.target;
    }
    c.station.workshop = 1;
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        s.ship.setTranslation(
            { x: MAGNETIC_RELAYS[1].x / 100, y: MAGNETIC_RELAYS[1].y / 100 },
            true,
        );
        s.step({ ...idle, interact: true });
        assert.ok(c.magneticRelays.includes(1));
        assert.ok(parseCampaign(JSON.stringify(c)));
        s.ship.setTranslation({ x: 15, y: -15 }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        s.step({ ...idle, interact: true });
        assert.equal(c.magneticRelays.includes(2), false);
        c.station.workshop = 2;
        s.step({ ...idle, interact: true });
        assert.ok(c.magneticRelays.includes(2));
    } finally {
        s.dispose();
    }
});

test('the first hydrogen batch can be mined inside local magnetic coverage before owning a hyperdrive', () => {
    const c = newStoryCampaign();
    c.story!.claimed.push('earth-workshop');
    const rocks = generateStorySector(c.story!).rocks.filter(
        (r) => r.crystal && Math.hypot(r.x, r.y) < 1450 && r.radius <= 44,
    );
    assert.ok(rocks.length >= 2);
});

test('every Earth hyperlane reaches the remote island outside all station relay coverage', () => {
    const c = newStoryCampaign();
    c.story!.claimed.push('earth-workshop');
    for (const lane of generateStorySector(c.story!).hyperlanes) {
        assert.ok(Math.hypot(lane.b.x, lane.b.y) > 1450);
        assert.ok(
            MAGNETIC_RELAYS.every((r) => Math.hypot(lane.b.x - r.x, lane.b.y - r.y) > r.radius),
        );
        assert.ok(magneticCoverage(lane.b, []));
    }
});

test('Earth magnetic relays are separated from survey objects', () => {
    const c = newStoryCampaign();
    c.story!.claimed.push('earth-workshop');
    const sites = generateStorySector(c.story!).landmarks.filter((l) => l.siteId);
    for (const relay of MAGNETIC_RELAYS.filter((r) => r.id !== 0))
        for (const site of sites)
            assert.ok(
                Math.hypot(relay.x - site.x, relay.y - site.y) > site.radius + 160,
                `${relay.name} overlaps ${site.name}`,
            );
});
