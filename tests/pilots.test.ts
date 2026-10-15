import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    finishRun,
    hirePilot,
    newCampaign,
    newShip,
    parseCampaign,
    emergencyKit,
} from '../frontend/game/state/campaign';
import {
    awardPilotXp,
    expeditionXp,
    newPilot,
    pilotLevel,
    pilotPoints,
    pilotProfile,
    trainPilot,
} from '../frontend/game/state/pilots';
import { createRecoverySignal, recoveryChances } from '../frontend/game/state/recovery';
import { GAME, PILOTS } from '../frontend/game/config';
import { MissionSimulation, FlightInput } from '../frontend/game/systems/mission';

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

test('pilot ranks grant one point per promotion; training consumes it once and respects caps', () => {
    const c = newCampaign(),
        p = c.pilots[0];
    assert.equal(pilotLevel(p), 1);
    assert.equal(pilotPoints(p), 0);
    assert.equal(trainPilot(c, p.id, 'handling'), false);
    assert.deepEqual(awardPilotXp(p, 20), {
        gainedXp: 20,
        levelBefore: 1,
        levelAfter: 2,
        points: 1,
    });
    assert.ok(trainPilot(c, p.id, 'handling'));
    assert.equal(pilotPoints(p), 0);
    assert.equal(trainPilot(c, p.id, 'mining'), false);
    awardPilotXp(p, 30);
    assert.ok(trainPilot(c, p.id, 'handling'));
    awardPilotXp(p, 40);
    assert.equal(trainPilot(c, p.id, 'handling'), false);
    assert.equal(pilotPoints(p), 1);
    assert.ok(trainPilot(c, p.id, 'mining'));
    assert.equal(trainPilot(c, 999, 'survival'), false);
    assert.equal(trainPilot(c, p.id, '__proto__' as 'survival'), false);
    awardPilotXp(p, 50);
    assert.equal(pilotLevel(p), 5);
    assert.equal(pilotPoints(p), 1);
    assert.equal(awardPilotXp(p, 1000).gainedXp, 0);
    assert.equal(p.xp, 140);
    beginRun(c, 1);
    assert.equal(trainPilot(c, p.id, 'survival'), false);
    assert.equal(pilotPoints(p), 1);
});

test('experience rewards productive activities, deduplicates scans and limits each sortie', () => {
    assert.equal(expeditionXp({ ore: 0, parts: 0 }, [], false, null), 0);
    assert.equal(expeditionXp({ ore: 12, parts: 0 }, [], true, null), 22);
    assert.equal(expeditionXp({ ore: 2, parts: 3 }, [], false, null), 8);
    assert.equal(expeditionXp({ ore: 0, parts: 0 }, ['relay', 'relay'], false, null), 5);
    assert.equal(expeditionXp({ ore: 0, parts: 0 }, ['relay', 'archive'], true, null), 20);
    const signal = { id: 1, seed: 1, x: 1000, y: 0, pilot: newPilot(), ship: newShip() };
    assert.equal(expeditionXp({ ore: 0, parts: 0 }, [], false, signal), 20);
    assert.equal(expeditionXp({ ore: 99, parts: 99 }, ['relay', 'archive'], true, signal), 50);
});

test('only the flying pilot earns XP on a safe return, and repeated result calls cannot duplicate it', () => {
    const c = newCampaign(),
        first = c.pilots[0];
    c.bank.ore = 12;
    hirePilot(c, 1);
    const reserve = c.pilots[1];
    c.selectedPilot = first.id;
    beginRun(c, 1);
    c.selectedPilot = reserve.id;
    const result = finishRun(c, true, { ore: 12, parts: 0 }, 10, 'dock');
    assert.equal(first.xp, 22);
    assert.equal(reserve.xp, 0);
    assert.equal(result!.pilotProgress!.levelAfter, 2);
    assert.equal(result!.pilotProgress!.points, 1);
    assert.equal(finishRun(c, true, { ore: 12, parts: 0 }, 10, 'again'), null);
    assert.equal(first.xp, 22);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('empty dock loops and idle time grant no XP while a partial cargo return still teaches the pilot', () => {
    const c = newCampaign(),
        pilot = c.pilots[0];
    for (let i = 0; i < 10; i++) {
        beginRun(c, i);
        finishRun(c, true, { ore: 0, parts: 0 }, 10000, 'empty dock');
    }
    assert.equal(pilot.xp, 0);
    beginRun(c, 20);
    finishRun(c, true, { ore: 4, parts: 0 }, 1, 'early dock');
    assert.equal(pilot.xp, 4);
    assert.equal(c.contractCompletions[0], 0);
});

test('loss grants no XP, a saved capsule preserves skills, and the rescuer alone gains recovery XP', () => {
    const c = newCampaign(),
        pilot = c.pilots[0];
    pilot.xp = 90;
    trainPilot(c, pilot.id, 'handling');
    trainPilot(c, pilot.id, 'mining');
    trainPilot(c, pilot.id, 'survival');
    const expected = structuredClone(pilot);
    let seed = 0;
    while (
        !(
            createRecoverySignal(c.ship!, pilot, seed, { x: 1000, y: 0 })?.pilot &&
            createRecoverySignal(c.ship!, pilot, seed, { x: 1000, y: 0 })?.ship
        )
    )
        seed++;
    beginRun(c, seed);
    const result = finishRun(c, false, { ore: 20, parts: 3 }, 50, 'loss', 0, {
        data: ['relay', 'archive'],
    });
    assert.equal(result!.pilotProgress, null);
    assert.deepEqual(pilot, expected);
    const loaded = parseCampaign(JSON.stringify(c))!;
    assert.deepEqual(loaded.recoverySignals[0].pilot, expected);
    const id = loaded.recoverySignals[0].id;
    emergencyKit(loaded);
    const rescuer = loaded.pilots[0];
    beginRun(loaded, 999, id);
    finishRun(loaded, true, { ore: 0, parts: 0 }, 5, 'dock', 0, { securedId: id });
    assert.equal(rescuer.xp, 20);
    assert.deepEqual(
        loaded.pilots.find((p) => p.id === expected.id),
        expected,
    );
    assert.deepEqual(parseCampaign(JSON.stringify(loaded)), loaded);
});

test('survival training increases pilot odds without changing hull recovery or beginner handling', () => {
    const c = newCampaign(),
        p = c.pilots[0];
    const base = pilotProfile(p),
        chances = recoveryChances(c.ship!, p);
    assert.equal(base.turn, PILOTS[0].turn);
    assert.equal(base.brake, PILOTS[0].brake);
    assert.equal(base.mining, 1);
    p.xp = 50;
    trainPilot(c, p.id, 'survival');
    trainPilot(c, p.id, 'survival');
    const trained = recoveryChances(c.ship!, p);
    assert.ok(Math.abs(trained.pilot - chances.pilot - 0.12) < 1e-9);
    assert.equal(trained.ship, chances.ship);
    assert.equal(pilotProfile(p).turn, base.turn);
    c.ship!.hull = 'mule';
    c.ship!.armor = 3;
    p.archetype = 2;
    assert.equal(recoveryChances(c.ship!, p).pilot, 0.85);
});

test('v5 migration initializes roster and missing pilots without erasing mission history or recovery markers', () => {
    const c = newCampaign();
    c.bank = { ore: 40, parts: 5 };
    c.crew.mechanic = true;
    c.contractCompletions[0] = 2;
    c.recovered = 2;
    c.nextPilotId = 3;
    c.nextShipId = 3;
    c.recoverySignals = [
        { id: 2, seed: 42, x: 1000, y: 0, pilot: newPilot(2, 2), ship: newShip(2) },
    ];
    beginRun(c, 42, 2);
    const old = JSON.parse(JSON.stringify(c));
    old.version = 5;
    delete old.pilots[0].xp;
    delete old.pilots[0].skills;
    delete old.recoverySignals[0].pilot.xp;
    delete old.recoverySignals[0].pilot.skills;
    const loaded = parseCampaign(JSON.stringify(old))!;
    assert.ok(loaded);
    assert.deepEqual(loaded, {
        ...c,
        ship: { ...c.ship, hull: 'fighter' },
        recoverySignals: c.recoverySignals.map((signal) => ({
            ...signal,
            ship: { ...signal.ship, hull: 'fighter' },
        })),
    });
    assert.equal(loaded.version, newCampaign().version);
});

test('save validation rejects malformed XP, overspent points and malformed skills in roster or capsule', () => {
    const c = newCampaign();
    c.nextPilotId = 3;
    c.nextShipId = 3;
    c.recoverySignals = [{ id: 2, seed: 1, x: 1000, y: 0, pilot: newPilot(2), ship: null }];
    for (const place of ['roster', 'capsule']) {
        for (const xp of [-1, 141, 1.5, '20', null]) {
            const bad = JSON.parse(JSON.stringify(c));
            const p = place === 'roster' ? bad.pilots[0] : bad.recoverySignals[0].pilot;
            p.xp = xp;
            assert.equal(parseCampaign(JSON.stringify(bad)), null);
        }
        for (const skills of [
            null,
            [],
            {},
            { handling: 1, mining: 0, survival: 0 },
            { handling: 3, mining: 0, survival: 0 },
            { handling: 0.5, mining: 0, survival: 0 },
            { handling: 0, mining: 0, survival: 0, fake: 0 },
        ]) {
            const bad = JSON.parse(JSON.stringify(c));
            const p = place === 'roster' ? bad.pilots[0] : bad.recoverySignals[0].pilot;
            p.skills = skills;
            assert.equal(parseCampaign(JSON.stringify(bad)), null);
        }
    }
});

test('new recruits and emergency cadets start fresh rather than inheriting another pilot training', () => {
    const c = newCampaign();
    c.pilots[0].xp = 140;
    trainPilot(c, 1, 'survival');
    c.bank.ore = 12;
    assert.ok(hirePilot(c, 2));
    assert.deepEqual(c.pilots[1], newPilot(2, 2));
    const clean = newCampaign();
    beginRun(clean, 9);
    finishRun(clean, false, { ore: 0, parts: 0 }, 1, 'loss');
    assert.ok(emergencyKit(clean));
    assert.deepEqual(clean.pilots[0], newPilot(2, 3));
});

test('trained handling and mining alter actual Rapier flight and asteroid damage without increasing top speed', () => {
    const measure = (trained: boolean) => {
        const c = newCampaign();
        if (trained) {
            c.pilots[0].xp = 140;
            trainPilot(c, 1, 'handling');
            trainPilot(c, 1, 'handling');
            trainPilot(c, 1, 'mining');
            trainPilot(c, 1, 'mining');
        }
        const sim = new MissionSimulation(c, 7);
        try {
            const rock = [...sim.rocks.values()][0];
            for (const other of sim.rocks.values())
                if (other !== rock) {
                    sim.world.removeRigidBody(other.body);
                    sim.rocks.delete(other.id);
                }
            rock.body.setTranslation({ x: 10, y: 0 }, true);
            rock.body.setLinvel({ x: 0, y: 0 }, true);
            rock.health = 1000;
            sim.ship.setTranslation({ x: 8, y: 0 }, true);
            sim.ship.setRotation(0, true);
            for (let i = 0; i < 20; i++) sim.step({ ...idle, mine: i === 0 });
            const damage = 1000 - rock.health;
            sim.world.removeRigidBody(rock.body);
            sim.rocks.clear();
            sim.ship.setTranslation({ x: 0, y: -10 }, true);
            sim.ship.setRotation(0, true);
            sim.ship.setLinvel({ x: 4.8, y: 0 }, true);
            for (let i = 0; i < 5; i++)
                sim.step({ ...idle, target: { x: 10000, y: -1000 }, brake: true });
            const brakingSpeed = sim.speed;
            sim.ship.setLinvel({ x: 0, y: 0 }, true);
            sim.ship.setRotation(0, true);
            sim.ship.setAngvel(0, true);
            const p = sim.position;
            for (let i = 0; i < 5; i++)
                sim.step({ ...idle, turn: 1, target: { x: p.x, y: p.y + 10000 } });
            const turnError = Math.abs(Math.PI / 2 - sim.ship.rotation());
            for (let i = 0; i < 120; i++)
                sim.step({ ...idle, target: { x: 10000, y: -1000 }, thrust: true });
            assert.ok(Math.abs(sim.speed - GAME.maxSpeed) < 1);
            return { damage, brakingSpeed, turnError };
        } finally {
            sim.dispose();
        }
    };
    const base = measure(false),
        trained = measure(true);
    assert.ok(Math.abs(trained.damage - base.damage * 1.1) < 1e-6);
    assert.ok(trained.brakingSpeed < base.brakingSpeed);
    assert.ok(trained.turnError < base.turnError);
});
