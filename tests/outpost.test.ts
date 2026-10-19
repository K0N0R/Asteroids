import { solveTerminal, terminalMoves } from './terminal-test-helper';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { GAME, HULLS, OUTPOST } from '../frontend/game/config';
import { generateSector } from '../frontend/game/worlds/sector';
import { OutpostSecurity } from '../frontend/game/systems/outpost';
import { FlightInput, MissionSimulation } from '../frontend/game/systems/mission';
import {
    beginRun,
    finishRun,
    newCampaign,
    newShip,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { contractReady, selectContract } from '../frontend/game/state/contracts';
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
function campaign(hull: 'prospector' | 'swift' | 'widmo' = 'swift') {
    const c = newCampaign();
    c.ship = newShip(1, hull);
    c.recovered = 1;
    c.station.workshop = 1;
    c.contractCompletions[2] = 1;
    assert.ok(selectContract(c, 4));
    assert.ok(beginRun(c, 71));
    return c;
}
function isolate(sim: MissionSimulation) {
    for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
    sim.rocks.clear();
    for (const id of [...sim.enemies.enemies.keys()]) sim.enemies.damage(id, 10000);
    sim.loot.clear();
    sim.events.length = 0;
}
function atTerminal(sim: MissionSimulation) {
    const p = sim.sector.outpost.terminal;
    sim.ship.setTranslation({ x: p.x / GAME.pixelsPerMeter, y: p.y / GAME.pixelsPerMeter }, true);
    sim.ship.setLinvel({ x: 0, y: 0 }, true);
    sim.ship.setAngvel(0, true);
}
function step(sim: MissionSimulation, seconds: number, input = idle) {
    for (let i = 0; i < Math.ceil(seconds / GAME.step); i++) sim.step(input);
}

test('outposts have deterministic clear terminals and guard launch areas across 500 seeds', () => {
    for (let seed = 0; seed < 500; seed++) {
        const sector = generateSector(seed),
            p = sector.outpost;
        assert.deepEqual(p, generateSector(seed).outpost);
        assert.ok(Math.hypot(p.x, p.y) >= 2800 && Math.hypot(p.x, p.y) <= 4500);
        assert.ok(
            Math.hypot(p.terminal.x, p.terminal.y) + OUTPOST.interactRadius < GAME.sectorRadius,
        );
        assert.ok(sector.rocks.every((r) => Math.hypot(r.x - p.x, r.y - p.y) >= r.radius + 440));
        assert.ok(sector.caches.every((c) => Math.hypot(c.x - p.x, c.y - p.y) >= 700));
        assert.ok(sector.landmarks.every((l) => Math.hypot(l.x - p.x, l.y - p.y) >= 800));
        assert.equal(sector.enemies.length, 8);
        assert.deepEqual(
            p.guards.map((g) => g.id),
            [101, 102],
        );
        assert.ok(p.guards.every((g) => Math.hypot(g.x - p.x, g.y - p.y) > OUTPOST.radius + 26));
    }
});

test('rotating scanner respects angle wrap, range, asteroid cover and each hull camouflage', () => {
    const spec = {
        x: 0,
        y: 0,
        phase: Math.PI * 2 - 0.01,
        name: 'test',
        terminal: { x: -260, y: 0 },
        guards: [],
    };
    const security = new OutpostSecurity(spec);
    assert.ok(security.sees({ x: 260, y: 0 }, 0, 1, true));
    assert.equal(security.sees({ x: 260, y: 0 }, 0, 1 - HULLS.widmo.radarJamming, true), false);
    assert.ok(security.sees({ x: 260, y: 0 }, 0, 1 - HULLS.falcon.radarJamming, true));
    assert.equal(security.sees({ x: 260, y: 0 }, 0, 1, false), false);
    assert.equal(security.sees({ x: 561, y: 0 }, 0, 1, true), false);
    assert.equal(security.sees({ x: -260, y: 0 }, 0, 1, true), false);
    assert.ok(security.sees({ x: -260, y: 0 }, Math.PI / OUTPOST.scanSpeed, 1, true));
});

test('detection gives a warning, decays behind cover and calls reinforcements only once', () => {
    const security = new OutpostSecurity(generateSector(7).outpost);
    security.update(1, true);
    assert.equal(security.alarm, 0);
    security.update(0.5, false);
    assert.equal(security.detection, 0);
    assert.ok(security.update(2, true).callGuards);
    assert.equal(security.alarm, OUTPOST.alarmSeconds);
    assert.equal(security.update(1, true).callGuards, false);
    security.update(8, false);
    assert.equal(security.alarm, 0);
    assert.equal(security.update(2, true).callGuards, false);
});

test('a quiet approach can steal data without camouflage, loot uses arms and theft cannot repeat', () => {
    const c = campaign('prospector'),
        sim = new MissionSimulation(c, 71);
    try {
        isolate(sim);
        atTerminal(sim);
        solveTerminal(sim, 'breach');
        assert.ok(sim.outpost.secured);
        assert.ok(sim.surveyData.has('outpost'));
        assert.equal(sim.enemies.enemies.size, 0);
        assert.equal(sim.cargoUsed, 0);
        assert.equal(sim.loot.size, 10);
        assert.equal(c.contractCompletions[4], 0);
        assert.deepEqual(c.bank, { ore: 0, parts: 0 });
        const count = sim.events.filter((e) => e.kind === 'collect').length;
        step(sim, 3, { ...idle, interact: true });
        assert.ok(sim.cargoUsed > 0 && sim.cargoUsed <= sim.cargoCapacity);
        assert.equal(
            sim.cargoUsed + sim.loot.size + sim.grippers.arms.filter((a) => a.held).length,
            10,
        );
        assert.equal(sim.events.filter((e) => e.kind === 'collect').length, count + sim.cargoUsed);
    } finally {
        sim.dispose();
    }
});

test('terminal remains open after releasing E but tools, acceleration, speed and range invalidate it', () => {
    const sim = new MissionSimulation(campaign(), 71);
    try {
        isolate(sim);
        for (const interruption of [
            { ...idle, thrust: true },
            { ...idle, brake: true },
            { ...idle, fire: true },
            { ...idle, mine: true },
            { ...idle, repair: true },
        ]) {
            atTerminal(sim);
            sim.step(idle);
            sim.step({ ...idle, interact: true });
            assert.ok(sim.terminalPuzzle);
            sim.step(idle);
            assert.ok(sim.terminalPuzzle, 'release is normal during a mouse-controlled minigame');
            sim.step(interruption);
            assert.equal(sim.terminalPuzzle, null);
            assert.equal(sim.outpost.secured, false);
        }
        for (const leave of [false, true]) {
            atTerminal(sim);
            sim.step(idle);
            sim.step({ ...idle, interact: true });
            if (leave) sim.ship.setTranslation({ x: 0, y: 0 }, true);
            else sim.ship.setLinvel({ x: 2, y: 0 }, true);
            assert.equal(sim.terminalAction({ confirm: true }), false);
            assert.equal(sim.terminalPuzzle, null);
        }
    } finally {
        sim.dispose();
    }
});

test('real scanner alarm spawns two pursuing drones once and locks a download', () => {
    const sim = new MissionSimulation(campaign('prospector'), 71);
    try {
        isolate(sim);
        atTerminal(sim);
        sim.elapsed = (Math.PI - OUTPOST.scanHalfAngle) / OUTPOST.scanSpeed;
        step(sim, 2.05, { ...idle, interact: true });
        assert.ok(sim.outpost.alarm > 0);
        assert.equal(sim.terminalPuzzle, null);
        assert.equal(sim.enemies.enemies.size, 2);
        assert.ok([...sim.enemies.enemies.values()].every((e) => e.state === 'chase'));
        assert.equal(sim.surveyData.has('outpost'), false);
        for (const id of [101, 102]) sim.enemies.damage(id, 10000);
        atTerminal(sim);
        sim.elapsed = (Math.PI - OUTPOST.scanHalfAngle) / OUTPOST.scanSpeed;
        sim.outpost.alarm = 0;
        step(sim, 2.05);
        assert.ok(sim.outpost.alarm > 0);
        assert.equal(sim.enemies.enemies.size, 0);
    } finally {
        sim.dispose();
    }
});

test('Widmo optical camouflage hides from the scanner for three seconds even while firing or boosting', () => {
    const sim = new MissionSimulation(campaign('widmo'), 71);
    try {
        isolate(sim);
        atTerminal(sim);
        sim.elapsed = Math.PI / OUTPOST.scanSpeed;
        sim.step({ ...idle, mine: true });
        step(sim, 2.5, { ...idle, interact: true });
        assert.ok(sim.cloaked);
        assert.ok(sim.terminalPuzzle);
        solveTerminal(sim);
        assert.equal(sim.outpost.detection, 0);
        step(sim, 1.5, { ...idle, interact: true });
        assert.ok(sim.outpost.secured);
        assert.equal(sim.cloaked, false);
        assert.equal(sim.outpost.alarm, 0);
        assert.equal(sim.enemies.enemies.size, 0);
        sim.opticalCloakCooldown = 0;
        sim.elapsed = Math.PI / OUTPOST.scanSpeed;
        sim.step({ ...idle, mine: true });
        for (const input of [
            { ...idle, fire: false },
            { ...idle, mine: true },
            { ...idle, thrust: true, boost: true },
        ]) {
            atTerminal(sim);
            sim.elapsed = Math.PI / OUTPOST.scanSpeed;
            sim.revealTime = 0;
            sim.step(input);
            assert.equal(sim.cloaked, true);
            assert.equal(sim.outpost.detection, 0);
        }
        step(sim, 3.1);
        atTerminal(sim);
        sim.elapsed = Math.PI / OUTPOST.scanSpeed;
        sim.step(idle);
        assert.equal(sim.cloaked, false);
        assert.ok(sim.outpost.detection > 0);
    } finally {
        sim.dispose();
    }
});

test('incoming shots reset a download and lethal damage on its final frame cannot grant data', () => {
    const sim = new MissionSimulation(campaign(), 71);
    try {
        isolate(sim);
        atTerminal(sim);
        const p = sim.position;
        sim.step({ ...idle, interact: true });
        assert.ok(sim.terminalPuzzle);
        for (const action of terminalMoves(sim.terminalPuzzle)) sim.terminalAction(action);
        sim.kineticShield.charge = 0;
        sim.kineticShield.cooldown = 1000;
        sim.hull = 1;
        sim.bullets.set(9999, {
            id: 9999,
            x: p.x - 80,
            y: p.y,
            vx: 10000,
            vy: 0,
            life: 1,
            team: 'enemy',
            damage: 12,
        });
        sim.step({ ...idle, interact: true });
        assert.equal(sim.ended, 'destroyed');
        assert.equal(sim.terminalPuzzle, null);
        assert.equal(sim.outpost.secured, false);
        assert.equal(sim.surveyData.size, 0);
        assert.equal(sim.loot.size, 0);
    } finally {
        sim.dispose();
    }
});

test('station hull blocks bullets and mining rays and physically prevents flying through it', () => {
    const sim = new MissionSimulation(campaign('prospector'), 71);
    try {
        isolate(sim);
        const p = sim.sector.outpost;
        sim.ship.setTranslation({ x: (p.x - 210) / 100, y: p.y / 100 }, true);
        sim.ship.setRotation(0, true);
        sim.bullets.set(9999, {
            id: 9999,
            x: p.x - 160,
            y: p.y,
            vx: 10000,
            vy: 0,
            life: 1,
            team: 'player',
            damage: 18,
        });
        sim.step({ ...idle, mine: true, target: { x: p.x + 500, y: p.y } });
        assert.equal(sim.bullets.size, 0);
        assert.ok(sim.laserBeam!.to.x <= p.x - OUTPOST.radius + 1);
        step(sim, 1, { ...idle, thrust: true, target: p });
        assert.ok(sim.position.x < p.x - OUTPOST.radius);
    } finally {
        sim.dispose();
    }
});

test('infiltration contract requires stolen data and safe return, pays once, and never carries data to another run', () => {
    const c = campaign(),
        sim = new MissionSimulation(c, 71);
    try {
        isolate(sim);
        atTerminal(sim);
        solveTerminal(sim, 'breach');
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        step(sim, 1.4, { ...idle, interact: true });
        assert.equal(sim.ended, 'returned');
        const result = finishRun(c, true, sim.cargo, sim.elapsed, 'dock', sim.repairKits, {
            data: [...sim.surveyData],
        });
        assert.deepEqual(result!.reward, { ore: 32, parts: 8 });
        assert.equal(c.contractCompletions[4], 1);
        assert.equal(finishRun(c, true, sim.cargo, 5, 'again', 0, { data: ['outpost'] }), null);
        assert.ok(beginRun(c, 72));
        const next = new MissionSimulation(c, 72);
        try {
            assert.equal(next.surveyData.size, 0);
            assert.equal(next.outpost.secured, false);
        } finally {
            next.dispose();
        }
        const bank = { ...c.bank };
        finishRun(c, false, { ore: 9, parts: 9 }, 1, 'death', 0, { data: ['outpost'] });
        assert.deepEqual(c.bank, bank);
        assert.equal(c.contractCompletions[4], 1);
    } finally {
        sim.dispose();
    }
    assert.equal(contractReady(4, { ore: 100, parts: 100 }, ['relay', 'archive']), false);
    assert.deepEqual(
        missionObjectives(4, { ore: 0, parts: 0 }, ['outpost'], false, false).map((g) => [
            g.id,
            g.complete,
        ]),
        [
            ['outpost', true],
            ['return', false],
        ],
    );
});

test('an overlapping rescue takes priority over the terminal and data can be taken afterwards', () => {
    const c = campaign(),
        port = generateSector(71).outpost.terminal;
    c.nextShipId = 3;
    c.recoverySignals = [{ id: 2, seed: 71, ...port, ship: newShip(2), pilot: null }];
    c.activeRun!.recoveryId = 2;
    const sim = new MissionSimulation(c, 71);
    try {
        isolate(sim);
        atTerminal(sim);
        sim.cargo.parts = 1;
        step(sim, 3, { ...idle, sabotage: true });
        assert.equal(sim.terminalPuzzle, null);
        assert.equal(sim.cargo.parts, 1);
        step(sim, 3, { ...idle, tow: true });
        assert.ok(sim.recoveryProgress > 0);
        assert.equal(sim.terminalPuzzle, null);
        step(sim, 1.1, { ...idle, tow: true });
        assert.ok(sim.recoverySecured);
        assert.equal(sim.outpost.secured, false);
        solveTerminal(sim, 'breach');
        assert.ok(sim.outpost.secured);
    } finally {
        sim.dispose();
    }
});

test('prototype choice freezes detection, alarm and scanner time; resuming advances them again', () => {
    const sim = new MissionSimulation(campaign(), 71);
    try {
        isolate(sim);
        const cache = sim.sector.caches[0];
        sim.ship.setTranslation({ x: cache.x / 100, y: cache.y / 100 }, true);
        step(sim, 2.6, { ...idle, interact: true });
        assert.ok(sim.pendingChoice);
        sim.outpost.alarm = 3;
        sim.outpost.detection = 1;
        const time = sim.elapsed,
            angle = sim.outpost.scannerAngle(time);
        step(sim, 10);
        assert.equal(sim.outpost.alarm, 3);
        assert.equal(sim.outpost.detection, 1);
        assert.equal(sim.outpost.scannerAngle(sim.elapsed), angle);
        assert.ok(sim.choosePrototype(null));
        sim.step(idle);
        assert.ok(sim.outpost.alarm < 3);
        assert.ok(sim.outpost.detection < 1);
        assert.ok(sim.elapsed > time);
    } finally {
        sim.dispose();
    }
});

test('sabotage spends mission cargo once, clears alarm, enables theft but leaves launched guards alive', () => {
    const c = campaign(),
        sim = new MissionSimulation(c, 71);
    try {
        isolate(sim);
        atTerminal(sim);
        c.bank.parts = 8;
        sim.cargo.parts = 2;
        sim.enemies.add(sim.sector.outpost.guards);
        sim.outpost.reinforcementsCalled = true;
        sim.outpost.alarm = 8;
        sim.outpost.detection = 2;
        // Prevent already launched guards from hitting us while testing the terminal.
        for (const e of sim.enemies.enemies.values()) {
            e.home = { x: 0, y: 0 };
            e.body.setTranslation({ x: 0, y: 0 }, true);
        }
        step(sim, 2, { ...idle, sabotage: true });
        assert.equal(sim.cargo.parts, 2);
        assert.equal(sim.outpost.sabotaged, false);
        solveTerminal(sim, 'power');
        assert.equal(sim.cargo.parts, 1);
        assert.equal(c.bank.parts, 8);
        assert.ok(sim.outpost.sabotaged);
        assert.ok(sim.outpost.disabledTime > 19.9);
        assert.equal(sim.outpost.alarm, 0);
        assert.equal(sim.outpost.detection, 0);
        assert.equal(sim.enemies.enemies.size, 2);
        assert.equal(sim.surveyData.size, 0);
        solveTerminal(sim, 'breach');
        step(sim, 4, idle);
        assert.ok(sim.surveyData.has('outpost'));
        step(sim, 3); // Finish collecting the freshly spawned data crates first.
        const parts = sim.cargo.parts;
        step(sim, 3, { ...idle, sabotage: true });
        assert.equal(sim.cargo.parts, parts);
        assert.ok(sim.outpost.disabledTime < 13.1);
    } finally {
        sim.dispose();
    }
});

test('power rerouting requires mission cargo, calm flight and a live terminal connection', () => {
    const sim = new MissionSimulation(campaign(), 71);
    try {
        isolate(sim);
        atTerminal(sim);
        sim.step({ ...idle, sabotage: true });
        assert.equal(sim.terminalPuzzle, null);
        sim.cargo.parts = 1;
        for (const interruption of [
            { ...idle, fire: true },
            { ...idle, mine: true },
            { ...idle, thrust: true },
            { ...idle, repair: true },
            { ...idle, interact: true, sabotage: true },
        ]) {
            atTerminal(sim);
            sim.step(idle);
            sim.step({ ...idle, sabotage: true });
            assert.equal(sim.terminalPuzzle?.mode, 'power');
            sim.step(interruption);
            assert.equal(sim.terminalPuzzle, null);
            assert.equal(sim.cargo.parts, 1);
        }
        atTerminal(sim);
        sim.step(idle);
        sim.step({ ...idle, sabotage: true });
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        sim.step(idle);
        assert.equal(sim.terminalPuzzle, null);
        assert.equal(sim.outpost.sabotaged, false);
    } finally {
        sim.dispose();
    }
});

test('damage interrupts sabotage; lethal final-frame damage cannot spend its component', () => {
    for (const hp of [1, 60]) {
        const sim = new MissionSimulation(campaign(), 71);
        try {
            isolate(sim);
            atTerminal(sim);
            sim.cargo.parts = 1;
            sim.kineticShield.charge = 0;
            sim.kineticShield.cooldown = 1000;
            sim.hull = hp;
            sim.step({ ...idle, sabotage: true });
            assert.ok(sim.terminalPuzzle);
            for (const action of terminalMoves(sim.terminalPuzzle)) sim.terminalAction(action);
            const p = sim.position;
            sim.bullets.set(9999, {
                id: 9999,
                x: p.x - 80,
                y: p.y,
                vx: 10000,
                vy: 0,
                life: 1,
                team: 'enemy',
                damage: 12,
            });
            sim.step({ ...idle, sabotage: true });
            assert.equal(sim.terminalPuzzle, null);
            assert.equal(sim.outpost.sabotaged, false);
            assert.equal(sim.cargo.parts, 1);
            assert.equal(sim.ended, hp === 1 ? 'destroyed' : null);
        } finally {
            sim.dispose();
        }
    }
});

test('scanner resumes detection after the timed shutdown and cannot be sabotaged twice', () => {
    const security = new OutpostSecurity(generateSector(71).outpost);
    assert.ok(security.disable());
    const p = {
        x: security.spec.x + 200 * Math.cos(security.spec.phase),
        y: security.spec.y + 200 * Math.sin(security.spec.phase),
    };
    assert.equal(security.sees(p, 0, 1, true), false);
    security.update(19, true);
    assert.equal(security.detection, 0);
    security.update(1, true);
    assert.equal(security.disabledTime, 0);
    assert.ok(security.sees(p, 0, 1, true));
    assert.equal(security.disable(), false);
    security.update(2, true);
    assert.equal(security.alarm, OUTPOST.alarmSeconds);
    assert.ok(security.reinforcementsCalled);
});

test('prototype menu freezes sabotage duration and a fresh mission has its own opportunity', () => {
    const c = campaign(),
        sim = new MissionSimulation(c, 71);
    try {
        isolate(sim);
        sim.outpost.disable();
        const cache = sim.sector.caches[0];
        sim.ship.setTranslation({ x: cache.x / 100, y: cache.y / 100 }, true);
        step(sim, 2.6, { ...idle, interact: true });
        assert.ok(sim.pendingChoice);
        const remaining = sim.outpost.disabledTime;
        step(sim, 10);
        assert.equal(sim.outpost.disabledTime, remaining);
        sim.choosePrototype(null);
        sim.step(idle);
        assert.ok(sim.outpost.disabledTime < remaining);
        const fresh = new MissionSimulation(c, 71);
        try {
            assert.equal(fresh.outpost.sabotaged, false);
            assert.equal(fresh.outpost.disabledTime, 0);
        } finally {
            fresh.dispose();
        }
    } finally {
        sim.dispose();
    }
});

test('Cerber equipment requires a separate hold after data, reserves cargo and cannot be stolen twice', () => {
    const c = campaign(),
        sim = new MissionSimulation(c, 71);
    try {
        isolate(sim);
        atTerminal(sim);
        sim.outpost.disable();
        solveTerminal(sim, 'breach');
        assert.ok(sim.outpost.secured);
        assert.equal(sim.stolenEquipment, undefined);
        sim.step(idle);
        step(sim, 5, { ...idle, interact: true });
        assert.equal(sim.stolenEquipment, sim.outpostEquipment);
        assert.equal(sim.cargoUsed, sim.cargo.ore + sim.cargo.parts + OUTPOST.equipmentSlots);
        assert.deepEqual(c.ship!.weapons, ['standard']);
        const count = sim.events.filter((e) => e.sound === 'complete').length;
        step(sim, 6, { ...idle, interact: true });
        assert.equal(sim.events.filter((e) => e.sound === 'complete').length, count);
    } finally {
        sim.dispose();
    }
});

test('equipment respects full cargo, in-flight gripper reservations and interruption', () => {
    const sim = new MissionSimulation(campaign(), 71);
    try {
        isolate(sim);
        atTerminal(sim);
        sim.outpost.disable();
        sim.outpost.secured = true;
        sim.outpost.equipmentArmed = true;
        sim.cargo.ore = sim.cargoCapacity - 2;
        step(sim, 5, { ...idle, interact: true });
        assert.equal(sim.stolenEquipment, undefined);
        sim.cargo.ore = sim.cargoCapacity - 3;
        const arm = sim.grippers.arms[0];
        arm.held = 'ore';
        arm.phase = 'return';
        arm.tip = { x: sim.position.x + 100, y: sim.position.y };
        sim.outpost.equipmentProgress = OUTPOST.equipmentSeconds - GAME.step;
        sim.step({ ...idle, interact: true });
        assert.equal(sim.stolenEquipment, undefined);
        assert.equal(sim.outpost.equipmentProgress, 0);
        sim.grippers.clear();
        sim.cargo.ore = 0;
        step(sim, 2, { ...idle, interact: true });
        assert.ok(sim.outpost.equipmentProgress > 0);
        sim.step({ ...idle, interact: true, fire: true });
        assert.equal(sim.outpost.equipmentProgress, 0);
        step(sim, 5, { ...idle, interact: true });
        assert.ok(sim.stolenEquipment);
        step(sim, 2);
        assert.ok(sim.cargoUsed <= sim.cargoCapacity);
    } finally {
        sim.dispose();
    }
});

test('lethal damage on the final equipment frame grants no stolen mount', () => {
    const sim = new MissionSimulation(campaign(), 71);
    try {
        isolate(sim);
        atTerminal(sim);
        sim.outpost.secured = true;
        sim.outpost.equipmentArmed = true;
        sim.outpost.equipmentProgress = OUTPOST.equipmentSeconds - GAME.step;
        sim.kineticShield.charge = 0;
        sim.kineticShield.cooldown = 1000;
        sim.hull = 1;
        const p = sim.position;
        sim.bullets.set(9999, {
            id: 9999,
            x: p.x - 80,
            y: p.y,
            vx: 10000,
            vy: 0,
            life: 1,
            team: 'enemy',
            damage: 12,
        });
        sim.step({ ...idle, interact: true });
        assert.equal(sim.ended, 'destroyed');
        assert.equal(sim.stolenEquipment, undefined);
        assert.equal(sim.outpost.equipmentProgress, 0);
    } finally {
        sim.dispose();
    }
});

test('stolen equipment unlocks only after safe return, leaves mounted weapon unchanged and duplicate pays once', () => {
    const c = campaign();
    c.contract = 0;
    c.activeRun!.contract = 0; // Isolate the equipment payout from the data contract reward.
    const bank = { ...c.bank };
    const result = finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', 0, {
        data: ['outpost'],
        equipment: 'rail',
    })!;
    assert.ok(c.ship!.weapons.includes('rail'));
    assert.equal(c.ship!.weapon, 'standard');
    assert.ok(result.equipmentText.includes('Kinetic'));
    assert.equal(
        finishRun(c, true, { ore: 0, parts: 0 }, 10, 'again', 0, {
            data: ['outpost'],
            equipment: 'rail',
        }),
        null,
    );
    beginRun(c, 72);
    const duplicate = finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', 0, {
        data: ['outpost'],
        equipment: 'rail',
    })!;
    assert.equal(duplicate.reward.ore, 0);
    assert.equal(duplicate.reward.parts, 1);
    assert.equal(duplicate.reward.storageFrames, 1);
    assert.equal(duplicate.reward.powerModules, 1);
    assert.ok(duplicate.equipmentText.includes('Duplikat'));
    assert.equal(c.ship!.weapons.filter((w) => w === 'rail').length, 1);
    assert.equal(c.bank.ore, bank.ore);
    assert.equal(c.bank.parts, bank.parts + 1);
    assert.equal(c.bank.storageFrames, (bank.storageFrames ?? 0) + 1);
    assert.equal(c.bank.powerModules, (bank.powerModules ?? 0) + 1);
    const lost = campaign();
    finishRun(lost, false, { ore: 0, parts: 0 }, 10, 'death', 0, {
        data: ['outpost'],
        equipment: 'rail',
    });
    assert.ok(lost.recoverySignals.every((signal) => !signal.ship?.weapons.includes('rail')));
    const noData = campaign();
    finishRun(noData, true, { ore: 0, parts: 0 }, 10, 'dock', 0, { equipment: 'rail' });
    assert.deepEqual(noData.ship!.weapons, ['standard']);
});
