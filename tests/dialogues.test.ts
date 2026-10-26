import { installStationProject } from '../frontend/game/state/stationProgression';
import { fundEquipment } from './fleet-fixtures';
import { LABORATORY_CONSTRUCTION } from '../frontend/game/state/stationConstruction';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    beginRun,
    finishRun,
    newCampaign,
    newStoryCampaign,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    DIALOGUES,
    DialoguePlayback,
    DialogueReveal,
    completeDialogue,
    latestDialogue,
    pendingDialogue,
} from '../frontend/game/state/dialogues';
import {
    contributeStory,
    storyDiscoveredTasks,
    storyObjectives,
    syncStory,
    recordMoonArrival,
} from '../frontend/game/state/story';

function expanded() {
    const c = newStoryCampaign();
    fundEquipment(c, LABORATORY_CONSTRUCTION[0]);
    assert.ok(installStationProject(c, 'laboratory'));
    syncStory(c);
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', c.activeRun!.repairKits, {
        data: ['relay'],
    });
    return c;
}

test('radio dismissal waits three seconds after typing or manual reveal and resets for each line', () => {
    const playback = new DialoguePlayback({
        ...DIALOGUES[0],
        lines: [
            { speaker: 'operations', text: 'Próba wiadomości.' },
            { speaker: 'science', text: 'Druga próba.' },
        ],
    });
    for (let i = 0; i < 4; i++) playback.update(100);
    assert.equal(playback.autoAdvanceReady, false);
    playback.interact(); // Manual reveal starts the readable period, it does not skip it.
    for (let i = 0; i < 29; i++) playback.update(100);
    assert.equal(playback.autoAdvanceReady, false);
    playback.update(100);
    assert.equal(playback.autoAdvanceReady, true);
    playback.advance();
    assert.equal(playback.autoAdvanceReady, false);
    while (playback.typing) playback.update(100);
    for (let i = 0; i < 29; i++) playback.update(100);
    assert.equal(playback.autoAdvanceReady, false);
    playback.update(100);
    assert.equal(playback.autoAdvanceReady, true);
    playback.advance();
    assert.equal(playback.complete, true);
    assert.equal(playback.autoAdvanceReady, false);
});
function finishSequence(c: ReturnType<typeof newStoryCampaign>) {
    const d = pendingDialogue(c)!;
    assert.ok(d);
    const playback = new DialoguePlayback(d);
    while (!playback.complete) playback.advance();
    assert.ok(completeDialogue(c, d.id));
    return d.id;
}

test('click reveals before advancing, while Space and Enter dismiss immediately without repeating', () => {
    const playback = new DialoguePlayback(DIALOGUES[0]);
    assert.equal(playback.visibleText, '');
    assert.equal(playback.key('e', true), false);
    assert.equal(playback.interact(), true);
    assert.equal(playback.visibleText, playback.line!.text);
    for (const key of ['space', 'enter']) {
        const p = new DialoguePlayback(DIALOGUES[0]);
        for (let index = 0; index < p.definition.lines.length; index++) {
            assert.equal(p.typing, true);
            assert.equal(p.key(key, true), true);
            assert.equal(p.index, index + 1);
            for (let n = 0; n < 120; n++) assert.equal(p.key(key, true), false);
            assert.equal(p.index, index + 1);
            p.key(key, false);
        }
        assert.equal(p.complete, true);
        assert.equal(p.line, null);
        assert.equal(p.interact(), false);
        assert.equal(p.update(100), false);
    }
});

test('reveal follows elapsed time, pauses at punctuation and limits stalls without audio bursts', () => {
    const reveal = new DialogueReveal('Ż. Ą!');
    assert.equal(reveal.update(0), false);
    assert.equal(reveal.update(1), true);
    assert.equal(reveal.text, 'Ż');
    assert.equal(reveal.update(28), false);
    assert.equal(reveal.text, 'Ż.');
    reveal.update(100);
    reveal.update(100);
    assert.equal(reveal.text, 'Ż.');
    assert.equal(reveal.update(60), true);
    assert.equal(reveal.text, 'Ż. Ą');
    reveal.finish();
    assert.equal(reveal.text, 'Ż. Ą!');
    assert.equal(reveal.update(100), false);
    const stalled = new DialogueReveal('abcdefghijklmnop');
    assert.equal(stalled.update(10000), true);
    assert.ok(stalled.text.length <= 4);
    const before = stalled.text;
    for (const delta of [NaN, Infinity, -1, 0]) assert.equal(stalled.update(delta), false);
    assert.equal(stalled.text, before);
});

test('Earth briefings follow real mission reports, survive saves and replay without granting rewards or mission progress', () => {
    const c = newStoryCampaign();
    assert.equal(pendingDialogue(c)!.id, 'earth-command');
    const before = structuredClone(c);
    finishSequence(c);
    before.story!.dialogues.push('earth-command');
    assert.deepEqual(c, before);
    assert.equal(pendingDialogue(parseCampaign(JSON.stringify(c))!), null);
    assert.equal(latestDialogue(c)!.id, 'earth-command');
    assert.equal(completeDialogue(c, 'earth-command'), false);
    assert.equal(completeDialogue(c, 'earth-open-orbit'), false);
    const d = expanded();
    assert.equal(finishSequence(d), 'earth-open-orbit');
    assert.equal(pendingDialogue(d), null);
    assert.equal(d.station.laboratoryLevel, 1);
    assert.equal(d.station.workshopLevel, 0);
    assert.equal(pendingDialogue(d), null);
    beginRun(d, 1);
    assert.ok(recordMoonArrival(d));
    finishRun(d, true, { ore: 0, parts: 0 }, 10, 'dock', d.activeRun!.repairKits, {
        data: ['archive'],
    });
    assert.equal(finishSequence(d), 'earth-lunar-route');
    const bank = { ...d.bank },
        tasks = { ...d.story!.progress };
    const replay = new DialoguePlayback(latestDialogue(d)!);
    while (!replay.complete) replay.advance();
    assert.equal(completeDialogue(d, replay.definition.id), false);
    assert.deepEqual(d.bank, bank);
    assert.deepEqual(d.story!.progress, tasks);
    assert.ok(parseCampaign(JSON.stringify(d)));
    assert.ok(beginRun(d, 1));
    assert.equal(pendingDialogue(d), null);
    assert.equal(latestDialogue(d), null);
});

test('interrupted sequences restart unread, do not run during sorties, and legacy profiles have no story dialogue', () => {
    const c = newStoryCampaign(),
        p = new DialoguePlayback(pendingDialogue(c)!);
    p.advance();
    const restored = parseCampaign(JSON.stringify(c))!;
    assert.equal(new DialoguePlayback(pendingDialogue(restored)!).index, 0);
    assert.ok(beginRun(c, 1));
    assert.equal(pendingDialogue(c), null);
    assert.equal(latestDialogue(c), null);
    assert.equal(completeDialogue(c, 'earth-command'), true);
    assert.equal(pendingDialogue(newCampaign()), null);
    assert.equal(completeDialogue(newCampaign(), 'earth-command'), false);
});

test('current saves reject unknown, duplicate, missing and premature dialogue history', () => {
    for (const history of [
        undefined,
        null,
        'earth-command',
        ['unknown'],
        ['earth-command', 'earth-command'],
        ['earth-open-orbit'],
    ]) {
        const c = JSON.parse(JSON.stringify(newStoryCampaign()));
        c.story.dialogues = history;
        assert.equal(parseCampaign(JSON.stringify(c)), null);
    }
});

test('journal and flight objectives hide future tasks but preserve completed, parallel and optional goals', () => {
    const c = newStoryCampaign();
    assert.deepEqual(
        storyDiscoveredTasks(c.story!).map((t) => t.id),
        ['earth-supply', 'earth-relay'],
    );
    assert.deepEqual(
        storyObjectives(c).map((t) => t.id),
        ['earth-supply', 'earth-relay'],
    );
    c.bank.ore = 24;
    contributeStory(c, 'earth-supply');
    assert.equal(storyObjectives(c).find((t) => t.id === 'earth-supply')!.complete, false);
    assert.equal(
        storyObjectives(c).some((t) => t.id === 'earth-workshop'),
        false,
    );
    beginRun(c, 1);
    assert.equal(
        storyObjectives(c, ['relay']).some((t) => t.id === 'earth-workshop'),
        false,
    );
    finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', c.activeRun!.repairKits, {
        data: ['relay'],
    });
    fundEquipment(c, LABORATORY_CONSTRUCTION[0]);
    assert.ok(installStationProject(c, 'laboratory'));
    syncStory(c);
    assert.ok(storyObjectives(c).find((t) => t.id === 'earth-supply')!.complete);
    assert.equal(
        storyObjectives(c).some((t) => t.id === 'earth-workshop'),
        false,
    );
    assert.ok(storyObjectives(c).some((t) => t.id === 'earth-route'));
    assert.equal(
        storyObjectives(c).some((t) => t.id === 'earth-ship-upgrade'),
        false,
    );
    assert.deepEqual(c.story!.dialogues, []);
});
