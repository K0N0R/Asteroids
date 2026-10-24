import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { newStoryCampaign, beginRun, parseCampaign } from '../frontend/game/state/campaign';
import { enqueueRadio, acknowledgeRadio, validRadio } from '../frontend/game/state/communications';
import { pendingDialogue } from '../frontend/game/state/dialogues';
import { grantStoryTasks } from './fleet-fixtures';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import {
    engineSpeed,
    MissionAudio,
    scheduleAudioLease,
} from '../frontend/game/systems/audioPolicy';

before(async () => {
    await RAPIER.init();
});
test('engine safety fade expires without callbacks and simulation updates renew its audio deadline', () => {
    let events: { value: number; time: number; ramp: boolean }[] = [];
    const gain = {
        cancelScheduledValues(time: number) {
            events = events.filter((event) => event.time < time);
            return gain;
        },
        setValueAtTime(value: number, time: number) {
            events.push({ value, time, ramp: false });
            return gain;
        },
        linearRampToValueAtTime(value: number, time: number) {
            events.push({ value, time, ramp: true });
            return gain;
        },
    };
    const valueAt = (time: number) => {
        const sorted = [...events].sort((a, b) => a.time - b.time);
        let previous = { value: 1, time: 0, ramp: false };
        for (const event of sorted) {
            if (event.time > time)
                return event.ramp
                    ? previous.value +
                          ((event.value - previous.value) * (time - previous.time)) /
                              (event.time - previous.time)
                    : previous.value;
            previous = event;
        }
        return previous.value;
    };
    scheduleAudioLease(gain as unknown as AudioParam, 10);
    assert.equal(valueAt(10.3), 1);
    assert.ok(valueAt(10.42) > 0 && valueAt(10.42) < 1);
    assert.equal(valueAt(10.51), 0, 'audio clock fades the engine even with no more JS updates');
    scheduleAudioLease(gain as unknown as AudioParam, 10.2);
    assert.ok(valueAt(10.6) > 0, 'a fresh simulation frame moves the deadline');
    assert.equal(valueAt(10.71), 0);
});

const idle: FlightInput = {
    target: { x: 1000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};

test('radio waits across save/reload, acknowledges explicitly and suppresses repeated crew reports', () => {
    const c = newStoryCampaign(),
        line = { speaker: 'operations' as const, text: 'Raport przyjęty.' };
    assert.ok(enqueueRadio(c.story!, line));
    assert.equal(enqueueRadio(c.story!, line), false);
    const restored = parseCampaign(JSON.stringify(c))!;
    assert.deepEqual(restored.story!.radio!.pending, [line]);
    const nextLine = { speaker: 'science' as const, text: 'Analizuję kolejny raport.' };
    enqueueRadio(restored.story!, nextLine);
    acknowledgeRadio(restored.story!, [line]);
    assert.deepEqual(
        restored.story!.radio!.pending,
        [nextLine],
        'acknowledging one message preserves unread follow-ups',
    );
    const saved = parseCampaign(JSON.stringify(restored))!;
    assert.equal(enqueueRadio(saved.story!, line), false);
    assert.equal(
        validRadio({ pending: [{ speaker: 'nobody', text: 'x' }], acknowledged: [] }),
        false,
    );
});

test('a completed lunar campaign never repeats satellite tuning instructions', () => {
    const c = newStoryCampaign();
    grantStoryTasks(c, ['earth-workshop']);
    assert.equal(pendingDialogue(c), null, 'all early instructions are obsolete');
    assert.ok(beginRun(c, 301));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.ok(s.surveyData.has('relay'));
        assert.ok(s.surveyData.has('lunarProbe'));
        const relay = s.sector.landmarks.find((site) => site.siteId === 'relay')!;
        s.ship.setTranslation({ x: relay.x / 100, y: relay.y / 100 }, true);
        for (let i = 0; i < 90; i++) s.step({ ...idle, target: relay, interact: true });
        assert.equal(s.relayTuning, null);
    } finally {
        s.dispose();
    }
});

test('H only acquires a tow after one second and reports its real circular progress', () => {
    const c = newStoryCampaign();
    grantStoryTasks(c, ['earth-workshop']);
    assert.ok(beginRun(c, 302));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        for (const id of [...s.enemies.enemies.keys()]) s.enemies.remove(id);
        s.ship.setTranslation({ x: 10, y: 0 }, true);
        for (const rock of s.rocks.values())
            if (Math.hypot(rock.body.translation().x - 10, rock.body.translation().y) < 5)
                rock.body.setTranslation({ x: 1000, y: 1000 }, true);
        const wreck = s.salvage.add(82001, 'patrol', { x: 1080, y: 0 }, { x: 0, y: 0 })!;
        for (let i = 0; i < 90; i++) s.step({ ...idle, target: { x: 1080, y: 0 }, interact: true });
        assert.equal(s.salvage.towing.size, 0, 'F cannot acquire a tow');
        s.step(idle);
        for (let i = 0; i < 30; i++) s.step({ ...idle, target: { x: 1080, y: 0 }, tow: true });
        assert.ok(s.interactionProgress!.fraction > 0.49 && s.interactionProgress!.fraction < 0.51);
        assert.equal(s.salvage.towing.size, 0);
        for (let i = 0; i < 30; i++) s.step({ ...idle, target: { x: 1080, y: 0 }, tow: true });
        assert.ok(s.salvage.towing.has(wreck.id));
    } finally {
        s.dispose();
    }
});

test('engine pitch differs for every tier and expired loop handles restart safely', () => {
    const speeds = [0, 1, 2, 3].map((tier) => engineSpeed(tier));
    assert.equal(new Set(speeds).size, 4);
    assert.ok(engineSpeed(3, true) > engineSpeed(3));
    let plays = 0,
        live = true;
    const audio = new MissionAudio<number>(
        { play: () => ++plays, stop: () => {}, volume: () => {}, active: () => live },
        () => true,
    );
    const state = {
        ended: null,
        pendingChoice: null,
        thrusting: true,
        boosting: false,
        engineFault: false,
        laserBeams: [],
        repairProgress: 0,
    };
    audio.update(state);
    live = false;
    audio.update(state);
    assert.equal(plays, 2);
    audio.pause();
});
