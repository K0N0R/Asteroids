import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    newShip,
    beginRun,
    finishRun,
    emergencyKit,
    parseCampaign,
    deliverSalvage,
} from '../frontend/game/state/campaign';
import { STORY_TASKS } from '../frontend/game/state/story';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { parallaxPoint } from '../frontend/game/graphics/parallax';
import { Background } from '../frontend/core/containers/entities/background';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
import { MOON } from '../frontend/game/worlds/moon';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function grant(c: ReturnType<typeof newStoryCampaign>, id: string) {
    const task = STORY_TASKS.find((task) => task.id === id)!;
    for (const dep of task.dependencies) if (!c.story!.claimed.includes(dep)) grant(c, dep);
    if (!c.story!.claimed.includes(id)) c.story!.claimed.push(id);
    c.story!.progress[id] = task.target;
}

test('ordinary flight exposes all local recovery signals and a failed sortie retains both', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const seed = c.activeRun!.seed;
    c.nextShipId = 4;
    c.recoverySignals = [2, 3].map((id) => ({
        id,
        seed,
        x: id * 450,
        y: 400,
        ship: newShip(id, 'swift'),
        pilot: null,
    }));
    const s = new MissionSimulation(c, seed);
    try {
        assert.equal(c.activeRun!.mission, undefined);
        assert.equal(c.activeRun!.recoveryId, null);
        assert.equal(s.worldRecoverySignals.length, 2);
        assert.ok(deliverSalvage(c, -2, 'recovery'));
        assert.equal(c.recoverySignals.length, 1);
        assert.equal(c.recoverySignals[0].id, 3);
        finishRun(c, false, { ore: 0, parts: 0 }, 5, 'loss');
        assert.ok(c.recoverySignals.some((signal) => signal.id === 3));
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('abandoned physical wreck position survives loss and a new ordinary sortie', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const seed = c.activeRun!.seed;
    c.worldSalvage = [{ id: 100000, seed, x: 1100, y: 500, source: 'patrol' }];
    c.nextSalvageId = 100001;
    const s = new MissionSimulation(c, seed);
    try {
        const item = s.salvage.items.get(100000)!;
        assert.ok(item);
        item.body.setTranslation({ x: 12, y: 5 }, true);
        s.step(idle);
        assert.equal(c.worldSalvage[0].x, 1200);
        finishRun(c, false, { ore: 0, parts: 0 }, 5, 'loss');
    } finally {
        s.dispose();
    }
    emergencyKit(c);
    assert.ok(beginRun(c, 1));
    const again = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(again.salvage.items.get(100000)!.body.translation().x, 12);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        again.dispose();
    }
});

test('lunar rescue coexists with construction escort without selecting a mission or blocking the surface passage', () => {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    grant(c, 'earth-workshop');
    grant(c, 'earth-route');
    grant(c, 'lunar-survey');
    c.story!.sector = 'lunar';
    assert.ok(beginRun(c, 1));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.ok(s.rescueOperation);
        assert.ok(s.miningEscort);
        assert.equal(s.missionReturnBlocked, false);
        s.ship.setTranslation({ x: MOON.entrance.x / 100, y: MOON.entrance.y / 100 }, true);
        assert.ok(s.nearbyPassage);
    } finally {
        s.dispose();
    }
});

test('distant planet follows camera projection and repeated flight updates cannot pin it back to a corner', () => {
    const anchor = MOON.entrance;
    const p = parallaxPoint(anchor, { x: 0, y: 0 }, 0, 0.2);
    const turned = parallaxPoint(anchor, { x: 0, y: 0 }, Math.PI / 2, 0.2);
    assert.ok(Math.hypot(p.x - turned.x, p.y - turned.y) > 100);
    assert.deepEqual(parallaxPoint(anchor, anchor, 1.3, 0.2), { x: 800, y: 450 });
    const bg = new Background();
    try {
        bg.setRegion('lunar');
        bg.setFlight(true);
        bg.camera = { ...anchor };
        bg.cameraAngle = 0;
        bg.update(16);
        const planet = bg.getChildByLabel('celestial-moon', true)!;
        assert.equal(planet.x, 800);
        assert.equal(planet.y, 450);
        bg.cameraAngle = 1;
        bg.update(16);
        assert.equal(planet.rotation, bg.cameraAngle);
        assert.equal(planet.rotation - bg.cameraAngle, 0);
        bg.setFlight(true);
        assert.equal(planet.x, 800);
        assert.equal(planet.y, 450);
        bg.setFlight(false);
        bg.update(16);
        assert.equal(bg.getChildByLabel('world-planet')!.rotation, 0);
    } finally {
        destroyDisplayTree(bg);
    }
});

test('opaque planets cover the Milky Way and move on a distinctly nearer parallax plane', () => {
    const bg = new Background();
    try {
        bg.setFlight(true);
        bg.update(0);
        const planet = bg.getChildByLabel('celestial-distant', true)!;
        const galaxy = bg.getChildByLabel('milky-way', true)!.parent!;
        assert.ok(bg.getChildIndex(galaxy) < bg.getChildIndex(planet.parent!));
        assert.equal(planet.alpha, 1);
        const planetX = planet.x,
            galaxyX = galaxy.x;
        bg.camera = { x: 1000, y: 0 };
        bg.update(16);
        const planetMotion = planetX - planet.x,
            galaxyMotion = galaxyX - galaxy.x;
        assert.ok(galaxyMotion > 0);
        assert.ok(planetMotion > galaxyMotion * 10);
        bg.cameraAngle = -0.7;
        bg.cameraZoom = 1.4;
        bg.update(16);
        assert.equal(planet.rotation, galaxy.rotation);
        assert.equal(planet.scale.x, 0.95 * bg.cameraZoom);
        bg.surface = true;
        bg.update(16);
        assert.equal(planet.parent!.visible, false);
    } finally {
        destroyDisplayTree(bg);
    }
});
