import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
    storageCapacity,
} from '../frontend/game/state/campaign';
import { receiveEarthCargo } from '../frontend/game/state/earthLogistics';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { STORY_TASKS, storySectorUnlocked } from '../frontend/game/state/story';
import { expeditionXp } from '../frontend/game/state/pilots';

before(async () => RAPIER.init());
const idle = {
    target: { x: 1500, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function run(mission?: string) {
    const c = newStoryCampaign();
    assert.ok(beginRun(c, 1, null, false, mission));
    return { c, s: new MissionSimulation(c, c.activeRun!.seed) };
}
function grant(c: ReturnType<typeof newStoryCampaign>, id: string) {
    const t = STORY_TASKS.find((t) => t.id === id)!;
    for (const d of t.dependencies) if (!c.story!.claimed.includes(d)) grant(c, d);
    if (!c.story!.claimed.includes(id)) {
        c.story!.claimed.push(id);
        c.story!.progress[id] = t.target;
    }
}
function advance(s: MissionSimulation, frames: number) {
    for (let i = 0; i < frames && !s.ended; i++) {
        s.step(idle);
        s.events.length = 0;
    }
}

test('Earth data is confirmed in flight, survives loss and cannot pay again after reload or docking', () => {
    const { c, s } = run('earth-relay');
    try {
        s.surveyData.add('relay');
        s.step(idle);
        assert.equal(c.story!.progress['earth-relay'], 1);
        assert.equal(s.missionReturnBlocked, false);
        assert.match(s.missionStatus, /Raport przyjęty/);
        assert.equal(s.radioMessages.length, 1);
        const bank = structuredClone(c.bank);
        advance(s, 120);
        assert.equal(s.radioMessages.length, 1);
        assert.deepEqual(c.bank, bank);
        const loaded = parseCampaign(JSON.stringify(c))!;
        assert.ok(loaded);
        finishRun(loaded, false, { ore: 0, parts: 0 }, s.elapsed, 'loss', 0, s.missionReport);
        assert.equal(loaded.story!.progress['earth-relay'], 1);
        assert.deepEqual(loaded.bank, bank);
        const result = finishRun(
            c,
            true,
            { ore: 0, parts: 0 },
            s.elapsed,
            'dock',
            s.repairKits,
            s.missionReport,
        )!;
        assert.ok(result);
        assert.equal(result.reward.ore, 0);
        assert.deepEqual(c.bank, bank);
    } finally {
        s.dispose();
    }
});

test('satellite sync opens two gates live and supplies remain independent of Moon arrival', () => {
    const { c, s } = run();
    try {
        s.surveyData.add('relay');
        s.step(idle);
        assert.ok(!s.sector.landmarks.some((l) => l.siteId === 'archive'));
        s.cargo.ore = 24;
        s.ship.setTranslation({ x: 4, y: 0 }, true);
        s.step({ ...idle, unload: true });
        advance(s, 150);
        assert.equal(s.ended, null);
        assert.equal(c.story!.progress['earth-supply'], 24);
        assert.equal(
            c.story!.progress['earth-reserve'],
            0,
            'rewards must not finance the next delivery',
        );
        assert.ok(s.sector.landmarks.some((l) => l.siteId === 'lunarProbe'));
        assert.equal(s.sector.hyperlanes.length, 2);
        assert.equal(s.sectorRadius, 7500);
        s.surveyData.add('archive');
        s.step(idle);
        assert.equal(
            c.story!.progress['earth-route'],
            0,
            'obsolete archive does not credit Moon arrival',
        );
        assert.ok(
            storySectorUnlocked(c.story!, 'lunar'),
            'satellite unlocks the route without a drive upgrade',
        );
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('C transfers at 400 m without docking, supports multiple loads and gives cargo XP once on return', () => {
    const { c, s } = run();
    try {
        c.bank = { ore: 0, parts: 0 };
        s.ship.setTranslation({ x: 4, y: 0 }, true);
        s.cargo = { ore: 10, parts: 2 };
        s.step({ ...idle, unload: true });
        assert.ok(s.cargoTransferRemaining > 0);
        assert.equal(
            c.story!.progress['earth-supply'],
            0,
            'cargo must not move before the animation ends',
        );
        advance(s, 150);
        assert.equal(s.ended, null);
        assert.equal(c.story!.progress['earth-supply'], 10);
        assert.equal(s.cargo.ore, 0);
        assert.equal(c.bank.parts, 2);
        s.cargo.ore = 18;
        s.step({ ...idle, unload: true });
        advance(s, 150);
        assert.equal(c.story!.progress['earth-supply'], 24);
        assert.equal(c.story!.progress['earth-reserve'], 4);
        assert.equal(c.activeRun!.unloaded!.ore, 28);
        assert.ok(parseCampaign(JSON.stringify(c)));
        const bank = structuredClone(c.bank);
        const result = finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits)!;
        assert.equal(result.cargo.ore, 28);
        assert.deepEqual(c.bank, bank, 'secured cargo must never be deposited twice');
        assert.equal(
            result.pilotProgress!.gainedXp,
            expeditionXp({ ore: 28, parts: 2 }, [], false, null),
        );
    } finally {
        s.dispose();
    }
});

test('large inventories accept all cargo but an interrupted animation transfers nothing', () => {
    const { c, s } = run();
    try {
        grant(c, 'earth-supply');
        grant(c, 'earth-reserve');
        c.bank = { ore: 2_000_000, parts: 0 };
        s.ship.setTranslation({ x: 4, y: 0 }, true);
        s.cargo = { ore: 10, parts: 0 };
        s.step({ ...idle, unload: true });
        advance(s, 30);
        s.step({ ...idle, thrust: true });
        assert.equal(s.cargoTransferRemaining, 0);
        assert.equal(s.cargo.ore, 10);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        s.step({ ...idle, unload: true });
        advance(s, 150);
        assert.equal(s.cargo.ore, 0);
        assert.equal(c.bank.ore, 2_000_010);
        assert.equal(c.activeRun!.unloaded!.ore, 10);
        const total = structuredClone(c.activeRun!.unloaded);
        s.step({ ...idle, unload: true });
        advance(s, 150);
        assert.equal(s.cargo.ore, 0);
        assert.deepEqual(c.activeRun!.unloaded, total);
    } finally {
        s.dispose();
    }
});

test('damage and excess speed cancel transfers; a lethal hit cannot commit delivery or a report', () => {
    for (const lethal of [false, true]) {
        const { c, s } = run();
        try {
            s.ship.setTranslation({ x: 4, y: 0 }, true);
            s.cargo = { ore: 10, parts: 0 };
            s.step({ ...idle, unload: true });
            advance(s, 50);
            s.kineticShield.charge = 0;
            const p = s.position;
            s.bullets.set(99999, {
                id: 99999,
                x: p.x + 80,
                y: p.y,
                vx: -6000,
                vy: 0,
                damage: lethal ? 999 : 1,
                team: 'enemy',
                life: 1,
            });
            if (lethal) s.surveyData.add('relay');
            s.step(idle);
            assert.equal(c.story!.progress['earth-supply'], 0);
            assert.equal(s.cargo.ore, 10);
            if (lethal) {
                assert.equal(s.ended, 'destroyed');
                assert.equal(c.story!.progress['earth-relay'], 0);
            } else assert.equal(s.cargoTransferRemaining, 0);
        } finally {
            s.dispose();
        }
    }
    const { c, s } = run();
    try {
        s.cargo.ore = 10;
        s.ship.setLinvel({ x: 1, y: 0 }, true);
        s.step({ ...idle, unload: true });
        assert.equal(s.cargoTransferRemaining, 0);
        assert.equal(c.story!.progress['earth-supply'], 0);
    } finally {
        s.dispose();
    }
});

test('aborted and foreign sorties cannot use Earth radio or unload; the old format is rejected', () => {
    const { c, s } = run('earth-relay');
    try {
        assert.ok(s.abortMission());
        s.surveyData.add('relay');
        s.cargo.ore = 10;
        s.step({ ...idle, unload: true });
        advance(s, 150);
        assert.equal(c.story!.progress['earth-relay'], 0);
        assert.equal(c.story!.progress['earth-supply'], 0);
        assert.equal(s.radioMessages.length, 0);
        const old = JSON.parse(JSON.stringify(c));
        old.version = 43;
        assert.equal(parseCampaign(JSON.stringify(old)), null);
        const malformed = JSON.parse(JSON.stringify(c));
        malformed.activeRun.unloaded = { ore: -1, parts: 0 };
        assert.equal(parseCampaign(JSON.stringify(malformed)), null);
        c.activeRun!.sector = 'lunar';
        assert.equal(receiveEarthCargo(c, { ore: 10, parts: 0 }), null);
    } finally {
        s.dispose();
    }
});
