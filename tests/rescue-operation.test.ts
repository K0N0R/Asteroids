import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    buyUpgrade,
    finishRun,
    newStoryCampaign,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { contributeStory, syncStory, travelStory } from '../frontend/game/state/story';
import { selectableMission } from '../frontend/game/state/missionOrders';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { RescueRepair } from '../frontend/game/systems/rescueRepair';
import { RESCUE_OPERATION } from '../frontend/game/systems/rescueOperation';
import { enemyPosition } from '../frontend/game/systems/enemies';
import { angleDifference } from '../frontend/game/systems/flight';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready() {
    const c = newStoryCampaign();
    c.bank.ore = 24;
    contributeStory(c, 'earth-supply');
    const report = (site: 'relay' | 'archive') => {
        beginRun(c, 1);
        finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', c.activeRun!.repairKits, {
            data: [site],
        });
    };
    report('relay');
    buyUpgrade(c, 'workshop');
    syncStory(c);
    report('archive');
    travelStory(c, 'lunar');
    report('relay');
    assert.ok(beginRun(c, 1, null, false, 'lunar-rescue'));
    return c;
}
function solve(s: MissionSimulation) {
    const repair = s.rescueOperation!.repair!;
    assert.ok(repair);
    for (let i = 0; i < 3; i++) {
        s.rescueRepairAction({ side: 'left', index: i });
        s.rescueRepairAction({ side: 'right', index: repair.rightOrder.indexOf(i) });
    }
    assert.ok(s.rescueRepairAction({ confirm: true }));
}
function atTarget(s: MissionSimulation) {
    s.enemies.dispose();
    const p = s.rescueOperation!.position;
    s.ship.setTranslation({ x: (p.x - 100) / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
function steer(s: MissionSimulation, target: { x: number; y: number }, radius = 80): FlightInput {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y,
        d = Math.hypot(dx, dy),
        err = angleDifference(Math.atan2(dy, dx), s.ship.rotation());
    const stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, err * 2.5)),
        thrust: Math.abs(err) < 0.3 && d > radius + stop + 15,
        brake: s.speed > 20 && (d < radius + stop || Math.abs(err) > 0.6),
    };
}

test('wiring requires three matching pairs and explicit confirmation; mismatches and invalid endpoints cannot complete it', () => {
    const r = new RescueRepair(71);
    assert.deepEqual([...r.rightOrder].sort(), [0, 1, 2]);
    assert.equal(r.act({ confirm: true }), false);
    r.act({ side: 'left', index: 0 });
    r.act({ side: 'right', index: r.rightOrder.indexOf(1) });
    assert.equal(r.connected.size, 0);
    r.act({ side: 'left', index: 10 });
    assert.equal(r.connected.size, 0);
    for (let i = 0; i < 3; i++) {
        r.act({ side: 'left', index: i });
        r.act({ side: 'right', index: r.rightOrder.indexOf(i) });
    }
    assert.equal(r.connected.size, 3);
    assert.ok(r.act({ confirm: true }));
});

test('holding E cannot tow an unsecured prom and cancelling or leaving range does not grant progress', () => {
    const c = ready(),
        s = new MissionSimulation(c, 1);
    try {
        atTarget(s);
        for (let i = 0; i < 240; i++) s.step({ ...idle, interact: true });
        const r = s.rescueOperation!;
        assert.ok(r.repair);
        assert.ok(s.elapsed > 3.9);
        assert.equal(s.salvage.towing.size, 0);
        assert.equal(r.stabilized, false);
        assert.equal(s.rescueRepairAction({ confirm: true }), false);
        s.ship.setTranslation({ x: 0, y: 0 }, true);
        s.step(idle);
        assert.equal(r.repair, null);
        assert.equal(r.state, 'distress');
        atTarget(s);
        s.step({ ...idle, interact: true });
        assert.ok(r.repair);
        assert.equal(r.repair.connected.size, 0);
        assert.equal(c.story!.progress['lunar-rescue'], 0);
        assert.equal(s.surveyData.has('rescue'), false);
    } finally {
        s.dispose();
    }
});

test('stock Prospector fights, secures the prom through wiring, physically tows it to the dock and returns a one-time rescue report', () => {
    const c = ready(),
        s = new MissionSimulation(c, 1),
        r = s.rescueOperation!;
    try {
        const ships = c.reserveShips.length + (c.ship ? 1 : 0),
            kits = s.repairKits;
        let sawTow = false,
            sawDelivery = false;
        for (let f = 0; f < 60 * 360 && !s.ended; f++) {
            const held = r.state === 'towing';
            const delivered = r.delivered;
            const input = steer(
                s,
                held || delivered ? { x: 0, y: 0 } : { x: r.position.x - 100, y: r.position.y },
                held || delivered ? 40 : 70,
            );
            const enemy = [...s.enemies.enemies.values()].sort(
                (a, b) =>
                    Math.hypot(
                        enemyPosition(a).x - s.position.x,
                        enemyPosition(a).y - s.position.y,
                    ) -
                    Math.hypot(
                        enemyPosition(b).x - s.position.x,
                        enemyPosition(b).y - s.position.y,
                    ),
            )[0];
            if (
                enemy &&
                Math.hypot(
                    enemyPosition(enemy).x - s.position.x,
                    enemyPosition(enemy).y - s.position.y,
                ) < 1000
            ) {
                input.target = enemyPosition(enemy);
                input.fire = true;
            } else if (delivered) input.interact = true;
            else if (!held) {
                input.interact = !r.stabilized && f % 2 === 0;
                input.tow = r.stabilized;
            }
            s.step(input);
            if (r.repair) solve(s);
            sawTow ||= r.state === 'towing';
            sawDelivery ||= r.delivered;
            if (!r.delivered) assert.equal(s.surveyData.has('rescue'), false);
            s.events.length = 0;
        }
        assert.equal(
            s.ended,
            'returned',
            `${r.state} ship ${JSON.stringify(s.position)} prom ${JSON.stringify(r.position)} health ${r.item.health}`,
        );
        assert.ok(sawTow && sawDelivery);
        assert.ok(s.enemyKills >= 2);
        assert.equal(s.repairKits, kits);
        assert.equal(c.story!.progress['lunar-rescue'], 1);
        assert.ok(s.surveyData.has('rescue'));
        assert.equal(s.salvage.items.has(r.item.id), false);
        const result = finishRun(
            c,
            true,
            s.cargo,
            s.elapsed,
            'dock',
            s.repairKits,
            s.missionReport,
        )!;
        assert.deepEqual(result.reward, { ore: 0, parts: 0 });
        assert.ok(c.story!.claimed.includes('lunar-rescue'));
        assert.ok(parseCampaign(JSON.stringify(c)));
        assert.equal(selectableMission(c, 'lunar-rescue'), null);
        assert.equal(c.reserveShips.length + (c.ship ? 1 : 0), ships);
    } finally {
        s.dispose();
    }
});

test('J releases a secured mission tow and reattachment uses the existing stabilized circuits', () => {
    const s = new MissionSimulation(ready(), 1);
    try {
        atTarget(s);
        s.step({ ...idle, interact: true });
        solve(s);
        s.step(idle);
        for (let i = 0; i < 185; i++) s.step({ ...idle, interact: true });
        assert.equal(s.rescueOperation!.state, 'ready');
        assert.equal(s.rescueOperation!.attachProgress, 0);
        for (let i = 0; i < 185; i++) s.step({ ...idle, tow: true });
        assert.equal(s.rescueOperation!.state, 'towing');
        s.releaseWreck();
        assert.equal(s.rescueOperation!.state, 'ready');
        assert.equal(s.rescueOperation!.stabilized, true);
        assert.equal(s.surveyData.has('rescue'), false);
        s.step(idle);
        for (let i = 0; i < 185; i++) s.step({ ...idle, tow: true });
        assert.equal(s.rescueOperation!.state, 'towing');
    } finally {
        s.dispose();
    }
});

test('a real projectile disables the rescue tow but leaves the damaged prom in the world without a separate mission', () => {
    const c = ready(),
        s = new MissionSimulation(c, 1);
    try {
        atTarget(s);
        s.step({ ...idle, interact: true });
        const r = s.rescueOperation!;
        assert.ok(r.repair);
        const p = r.position;
        s.bullets.set(9999, {
            id: 9999,
            x: p.x + 80,
            y: p.y,
            vx: -12000,
            vy: 0,
            damage: 200,
            team: 'enemy',
            life: 1,
        });
        s.step(idle);
        assert.equal(r.state, 'distress');
        assert.equal(r.item.health, 1);
        assert.equal(r.repair, null);
        assert.equal(s.surveyData.has('rescue'), false);
        delete c.activeRun!.mission;
        assert.equal(s.missionReturnBlocked, false);
        const bank = structuredClone(c.bank);
        finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, s.missionReport);
        assert.deepEqual(c.bank, bank);
        assert.ok(beginRun(c, 2));
        const retry = new MissionSimulation(c, 2);
        try {
            assert.equal(retry.rescueOperation!.state, 'distress');
            assert.equal(retry.rescueOperation!.item.health, 1);
        } finally {
            retry.dispose();
        }
    } finally {
        s.dispose();
    }
});
