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
    assert.equal(magneticCoverage({ x: -2100, y: 100 }, []), false);
    assert.equal(magneticCoverage({ x: 1700, y: 650 }, [0]), true);
});
test('jettison conserves selected cargo, disables new collection and rejects absent cargo', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        s.cargo.copperOre = 7;
        assert.ok(s.jettisonCargo('copperOre'));
        assert.equal(s.cargo.copperOre, 6);
        assert.equal([...s.loot.values()].filter((l) => l.kind === 'copperOre').length, 1);
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

test('only the synchronized Earth satellite expands protection; old south and west relays are absent', () => {
    const c = newStoryCampaign();
    for (const id of ['earth-supply', 'earth-relay', 'earth-workshop']) {
        const t = STORY_TASKS.find((t) => t.id === id)!;
        c.story!.progress[id] = t.target;
        c.story!.claimed.push(id);
    }
    c.station.workshop = 1;
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.deepEqual(
            s.magneticRelays.map((r) => r.id),
            [0],
        );
        assert.deepEqual(s.activeMagneticRelays, [0]);
        assert.ok(s.magneticZones.some((z) => z.name === 'Orbita Księżyca'));
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('the first hydrogen batch can be mined inside local magnetic coverage before expanding the station', () => {
    const c = newStoryCampaign();
    c.story!.claimed.push('earth-relay');
    const rocks = generateStorySector(c.story!).rocks.filter(
        (r) => r.crystal && Math.hypot(r.x, r.y) < 1450,
    );
    assert.ok(rocks.length >= 2);
});

test('every Earth hyperlane reaches the remote island outside all station relay coverage', () => {
    const c = newStoryCampaign();
    c.story!.claimed.push('earth-relay');
    for (const lane of generateStorySector(c.story!).hyperlanes) {
        assert.ok(Math.hypot(lane.b.x, lane.b.y) > 1450);
        assert.ok(
            MAGNETIC_RELAYS.every((r) => Math.hypot(lane.b.x - r.x, lane.b.y - r.y) > r.radius),
        );
        assert.ok(
            generateStorySector(c.story!).regions.some(
                (z) => Math.hypot(lane.b.x - z.x, lane.b.y - z.y) < z.radius,
            ),
        );
    }
});

test('Earth has one physical satellite and no overlapping archive object', () => {
    const c = newStoryCampaign();
    c.story!.claimed.push('earth-relay');
    const sites = generateStorySector(c.story!).landmarks.filter((l) => l.siteId);
    assert.equal(MAGNETIC_RELAYS.length, 1);
    assert.equal(sites.filter((l) => l.siteId === 'relay').length, 1);
    assert.equal(
        sites.some((l) => l.siteId === 'archive' && !l.area),
        false,
    );
});
