import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newCampaign,
    beginRun,
    finishRun,
    parseCampaign,
    emergencyKit,
    newShip,
} from '../frontend/game/state/campaign';
import { GAME } from '../frontend/game/config';
import { MissionSimulation, FlightInput } from '../frontend/game/systems/mission';
import {
    CACHE,
    PROTOTYPES,
    PrototypeId,
    prototypeOffers,
} from '../frontend/game/systems/prototypes';
import { generateSector } from '../frontend/game/worlds/sector';

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
function clean(sim: MissionSimulation) {
    // These fixtures isolate hull/interaction behavior; kinetic shielding has separate integration tests.
    sim.kineticShield.charge = 0;
    sim.kineticShield.cooldown = 1000;

    for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
    sim.rocks.clear();
    sim.enemies.dispose();
}
function approach(sim: MissionSimulation, index = 0) {
    const cache = sim.sector.caches[index];
    sim.ship.setTranslation(
        { x: cache.x / GAME.pixelsPerMeter, y: cache.y / GAME.pixelsPerMeter },
        true,
    );
    sim.ship.setLinvel({ x: 0, y: 0 }, true);
    sim.ship.setAngvel(0, true);
}
function open(sim: MissionSimulation, index = 0) {
    approach(sim, index);
    for (let i = 0; i < Math.ceil(CACHE.seconds / GAME.step); i++)
        sim.step({ ...idle, interact: true });
    assert.ok(sim.pendingChoice);
}
function withPrototype(
    id: PrototypeId,
    run: (sim: MissionSimulation, base: MissionSimulation) => void,
) {
    let seed = 1;
    while (!prototypeOffers(seed, 1, []).includes(id)) seed++;
    const sim = new MissionSimulation(newCampaign(), seed),
        base = new MissionSimulation(newCampaign(), seed);
    try {
        clean(sim);
        clean(base);
        open(sim);
        assert.ok(sim.choosePrototype(id));
        sim.ship.setTranslation({ x: 2.4, y: 0 }, true);
        run(sim, base);
    } finally {
        sim.dispose();
        base.dispose();
    }
}

test('two deterministic caches have clear approaches and avoid science sites and drone homes across 200 seeds', () => {
    for (let seed = 0; seed < 200; seed++) {
        const sector = generateSector(seed);
        assert.deepEqual(sector, generateSector(seed));
        assert.equal(sector.caches.length, 2);
        for (const cache of sector.caches) {
            assert.ok(Math.hypot(cache.x, cache.y) >= 1100);
            assert.ok(Math.hypot(cache.x, cache.y) <= 3900);
            assert.ok(
                sector.rocks.every(
                    (rock) => Math.hypot(rock.x - cache.x, rock.y - cache.y) >= rock.radius + 220,
                ),
            );
            assert.ok(
                sector.landmarks.every(
                    (site) =>
                        !(site.siteId || site.kind === 'wreck') ||
                        Math.hypot(site.x - cache.x, site.y - cache.y) >= 450,
                ),
            );
            assert.ok(
                sector.enemies.every(
                    (enemy) => Math.hypot(enemy.home.x - cache.x, enemy.home.y - cache.y) >= 1100,
                ),
            );
        }
    }
});
test('offers are stable, distinct, seed-dependent and exclude already installed prototypes', () => {
    const offers = prototypeOffers(7, 1, []);
    assert.deepEqual(offers, prototypeOffers(7, 1, []));
    assert.equal(new Set(offers).size, 3);
    assert.ok(offers.every((id) => id in PROTOTYPES));
    assert.ok(prototypeOffers(7, 2, offers).every((id) => !offers.includes(id)));
    assert.ok(
        Array.from({ length: 10 }, (_, seed) => prototypeOffers(seed, 1, []).join()).some(
            (value) => value !== offers.join(),
        ),
    );
});
test('a rescue overlapping a cache is secured first, then the cache remains available', () => {
    const c = newCampaign(),
        cache = generateSector(7).caches[0];
    c.recoverySignals.push({ ...cache, seed: 7, pilot: null, ship: newShip(2) });
    c.nextShipId = 3;
    assert.ok(beginRun(c, 7, cache.id));
    const sim = new MissionSimulation(c, 7);
    try {
        clean(sim);
        approach(sim);
        for (let i = 0; i < 240; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.recoverySecured, true);
        assert.equal(sim.pendingChoice, null);
        assert.equal(sim.openedCaches.size, 0);
        open(sim);
        assert.equal(sim.pendingChoice!.cacheId, cache.id);
    } finally {
        sim.dispose();
    }
});
test('refreshing during prototype selection resolves the saved marker as a loss without saving the choice', () => {
    const c = newCampaign();
    beginRun(c, 7);
    const sim = new MissionSimulation(c, 7);
    try {
        clean(sim);
        open(sim);
        const restored = parseCampaign(JSON.stringify(c))!;
        assert.ok(restored.activeRun);
        const result = finishRun(restored, false, { ore: 0, parts: 0 }, 0, 'Odświeżenie');
        assert.equal(result!.success, false);
        assert.equal(restored.activeRun, null);
        assert.equal(restored.ship, null);
        assert.equal(JSON.stringify(restored).includes('pendingChoice'), false);
    } finally {
        sim.dispose();
    }
});
test('opening requires uninterrupted calm interaction and completing the hold pauses every simulation system', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        clean(sim);
        approach(sim);
        for (let i = 0; i < 60; i++) sim.step({ ...idle, interact: true });
        assert.ok(sim.cacheProgress > 0);
        sim.step({ ...idle, interact: true, fire: true });
        assert.equal(sim.cacheProgress, 0);
        sim.step({ ...idle, interact: true, mine: true });
        assert.equal(sim.cacheProgress, 0);
        sim.step({ ...idle, interact: true, repair: true });
        assert.equal(sim.cacheProgress, 0);
        sim.ship.setLinvel({ x: 4, y: 0 }, true);
        sim.step({ ...idle, interact: true });
        assert.equal(sim.cacheProgress, 0);
        open(sim);
        const before = {
            elapsed: sim.elapsed,
            position: sim.position,
            hull: sim.hull,
            bullets: JSON.stringify([...sim.bullets.values()]),
            reveal: sim.revealTime,
        };
        for (let i = 0; i < 300; i++) sim.step({ ...idle, fire: true, thrust: true });
        assert.deepEqual(
            {
                elapsed: sim.elapsed,
                position: sim.position,
                hull: sim.hull,
                bullets: JSON.stringify([...sim.bullets.values()]),
                reveal: sim.revealTime,
            },
            before,
        );
    } finally {
        sim.dispose();
    }
});
test('leaving a cache resets progress; incoming fire prevents opening and lethal fire cannot create a choice', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        clean(sim);
        approach(sim);
        for (let i = 0; i < 60; i++) sim.step({ ...idle, interact: true });
        sim.ship.setTranslation({ x: 2.4, y: 0 }, true);
        sim.step({ ...idle, interact: true });
        assert.equal(sim.cacheProgress, 0);
        approach(sim, 1);
        for (let i = 0; i < 149; i++) sim.step({ ...idle, interact: true });
        const hit = () =>
            sim.bullets.set(999, {
                id: 999,
                ...sim.position,
                vx: 1,
                vy: 0,
                life: 1,
                team: 'enemy',
                damage: 12,
            });
        hit();
        sim.step({ ...idle, interact: true });
        assert.ok(sim.hull < sim.maxHull);
        assert.equal(sim.pendingChoice, null);
        assert.equal(sim.cacheProgress, 0);
        for (let i = 0; i < 180; i++) sim.step(idle);
        sim.hull = 1;
        for (let i = 0; i < 149; i++) sim.step({ ...idle, interact: true });
        hit();
        sim.step({ ...idle, interact: true });
        assert.equal(sim.ended, 'destroyed');
        assert.equal(sim.pendingChoice, null);
    } finally {
        sim.dispose();
    }
});
test('only an offered choice is accepted once, caches cannot be rerolled, and skipping consumes a cache', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        clean(sim);
        open(sim);
        const offers = [...sim.pendingChoice!.offers];
        const invalid = (Object.keys(PROTOTYPES) as PrototypeId[]).find(
            (id) => !offers.includes(id),
        )!;
        assert.equal(sim.choosePrototype(invalid), false);
        assert.deepEqual(sim.pendingChoice!.offers, offers);
        assert.ok(sim.choosePrototype(offers[0]));
        assert.equal(sim.choosePrototype(offers[1]), false);
        for (let i = 0; i < 200; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.pendingChoice, null);
        open(sim, 1);
        assert.ok(!sim.pendingChoice!.offers.includes(offers[0]));
        assert.ok(sim.choosePrototype(null));
        assert.equal(sim.prototypes.length, 1);
        assert.equal(sim.openedCaches.size, 2);
        assert.equal(sim.nextCache, undefined);
    } finally {
        sim.dispose();
    }
});
test('drive prototype changes physical acceleration and maximum speed, including boost', () => {
    withPrototype('drive', (sim, base) => {
        for (let i = 0; i < 10; i++) {
            sim.step({ ...idle, thrust: true });
            base.step({ ...idle, thrust: true });
        }
        assert.ok(sim.speed > base.speed * 1.19);
        for (let i = 0; i < 120; i++) {
            sim.step({ ...idle, thrust: true, boost: true });
            base.step({ ...idle, thrust: true, boost: true });
        }
        assert.ok(Math.abs(sim.speed / base.speed - 1.2) < 0.001);
    });
});
test('maneuvering prototype changes actual angular velocity without modifying the camera response', () => {
    withPrototype('handling', (sim, base) => {
        for (let i = 0; i < 60; i++) {
            sim.step({ ...idle, turn: 1 });
            base.step({ ...idle, turn: 1 });
        }
        assert.ok(sim.ship.angvel() > base.ship.angvel() * 1.24);
    });
});
test('laser prototype changes ray reach and real asteroid damage', () => {
    let seed = 1;
    while (!prototypeOffers(seed, 1, []).includes('laser')) seed++;
    const sim = new MissionSimulation(newCampaign(), seed);
    try {
        sim.enemies.dispose();
        const rock = [...sim.rocks.values()][0];
        for (const other of sim.rocks.values())
            if (other !== rock) {
                sim.world.removeRigidBody(other.body);
                sim.rocks.delete(other.id);
            }
        rock.body.setTranslation({ x: 10, y: 0 }, true);
        rock.body.setLinvel({ x: 0, y: 0 }, true);
        rock.health = 10000;
        open(sim);
        sim.choosePrototype('laser');
        sim.ship.setTranslation({ x: 8.4, y: 0 }, true);
        const health = rock.health;
        sim.step({ ...idle, mine: true });
        assert.ok(
            Math.abs(
                health -
                    rock.health -
                    GAME.laserDamage *
                        GAME.step *
                        sim.hullConfig.miningPower *
                        sim.pilot.mining *
                        1.35,
            ) < 0.001,
        );
        assert.equal(sim.laserRange, sim.hullConfig.laserRange * 1.25);
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        sim.step({ ...idle, mine: true });
        const beam = sim.laserBeams[0];
        assert.ok(
            Math.abs(
                Math.hypot(beam.to.x - beam.from.x, beam.to.y - beam.from.y) - sim.laserRange,
            ) < 0.001,
        );
    } finally {
        sim.dispose();
    }
});
test('gun prototype applies to emitted combat rounds while asteroid damage stays small', () => {
    withPrototype('guns', (sim) => {
        sim.ship.setTranslation({ x: 20, y: 0 }, true);
        sim.step({ ...idle, fire: true });
        assert.equal(sim.bullets.size, 1);
        assert.ok(
            [...sim.bullets.values()].every((bullet) => bullet.damage === GAME.shotDamage * 1.35),
        );
        assert.equal(sim.gunDamage, GAME.shotDamage * 1.35);
    });
});
test('cargo, gripper and hull prototypes increase actual storage, arm reach and health', () => {
    withPrototype('cargo', (sim, base) => assert.equal(sim.cargoCapacity, base.cargoCapacity + 20));
    withPrototype('hull', (sim, base) => {
        assert.equal(sim.maxHull, base.maxHull + 30);
        assert.equal(sim.hull, sim.maxHull);
    });
    withPrototype('grippers', (sim, base) => {
        assert.equal(sim.grippers.range, base.grippers.range * 1.4);
        const origin = sim.grippers.origin(
            sim.grippers.arms[0],
            sim.position,
            0,
            sim.hullConfig.size,
        );
        const distance = base.grippers.range + 10;
        sim.loot.set(999, { id: 999, x: origin.x + distance, y: origin.y, kind: 'ore', amount: 1 });
        for (let i = 0; i < 120; i++) sim.step(idle);
        assert.equal(sim.cargo.ore, 1);
    });
});
test('temporary bonuses never change campaign modules and expire on the next sortie after return or death', () => {
    for (const success of [true, false]) {
        const campaign = newCampaign(),
            seed = 7;
        beginRun(campaign, seed);
        const before = JSON.stringify(campaign.ship);
        const sim = new MissionSimulation(campaign, seed);
        try {
            clean(sim);
            open(sim);
            sim.choosePrototype(sim.pendingChoice!.offers[0]);
            assert.equal(JSON.stringify(campaign.ship), before);
            finishRun(campaign, success, { ore: 5, parts: 0 }, 10, 'test', 0, {
                lossPosition: sim.position,
            });
            if (!success) emergencyKit(campaign);
            const next = new MissionSimulation(campaign, seed);
            try {
                assert.equal(next.prototypes.length, 0);
                assert.equal(next.openedCaches.size, 0);
            } finally {
                next.dispose();
            }
            const restored = parseCampaign(JSON.stringify(campaign))!;
            assert.equal(JSON.stringify(restored).includes('prototypes'), false);
            assert.equal(JSON.stringify(restored).includes('openedCaches'), false);
        } finally {
            sim.dispose();
        }
    }
});
