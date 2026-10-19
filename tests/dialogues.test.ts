import { fundEquipment } from './fleet-fixtures';
import { WORKSHOP_CONSTRUCTION } from '../frontend/game/state/stationConstruction';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    beginRun,
    buyUpgrade,
    finishRun,
    newCampaign,
    newStoryCampaign,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    DIALOGUES,
    DialoguePlayback,
    completeDialogue,
    latestDialogue,
    pendingDialogue,
} from '../frontend/game/state/dialogues';
import {
    contributeStory,
    storyDiscoveredTasks,
    storyObjectives,
    syncStory,
    travelStory,
} from '../frontend/game/state/story';

function expanded() {
    const c = newStoryCampaign();
    c.bank.ore = 24;
    contributeStory(c, 'earth-supply');
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', c.activeRun!.repairKits, {
        data: ['relay'],
    });
    return c;
}
function finishSequence(c: ReturnType<typeof newStoryCampaign>) {
    const d = pendingDialogue(c)!;
    assert.ok(d);
    const playback = new DialoguePlayback(d);
    while (!playback.complete) playback.advance();
    assert.ok(completeDialogue(c, d.id));
    return d.id;
}

test('an explicit press advances exactly one line and holding a key, unrelated controls or completed playback cannot skip the sequence', () => {
    const playback = new DialoguePlayback(DIALOGUES[0]);
    assert.equal(playback.index, 0);
    assert.equal(playback.key('e', true), false);
    assert.equal(playback.key('enter', true), true);
    for (let n = 0; n < 120; n++) playback.key('enter', true);
    assert.equal(playback.index, 1);
    playback.key('enter', false);
    assert.equal(playback.key('enter', true), true);
    assert.equal(playback.complete, false);
    playback.key('space', true);
    assert.equal(playback.complete, true);
    assert.equal(playback.line, null);
    assert.equal(playback.advance(), false);
    assert.equal(playback.index, 3);
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
    finishSequence(d);
    assert.equal(finishSequence(d), 'earth-open-orbit');
    assert.equal(pendingDialogue(d), null);
    fundEquipment(d, WORKSHOP_CONSTRUCTION[d.station.workshop]);
    assert.ok(buyUpgrade(d, 'workshop'));
    syncStory(d);
    assert.equal(pendingDialogue(d), null);
    beginRun(d, 1);
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
    assert.ok(travelStory(d, 'lunar'));
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
    assert.equal(completeDialogue(c, 'earth-command'), false);
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
        ['earth-supply', 'earth-relay', 'earth-reserve'],
    );
    assert.deepEqual(
        storyObjectives(c).map((t) => t.id),
        ['earth-supply', 'earth-relay', 'earth-reserve'],
    );
    c.bank.ore = 24;
    contributeStory(c, 'earth-supply');
    assert.equal(storyObjectives(c).find((t) => t.id === 'earth-supply')!.complete, true);
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
    assert.ok(storyObjectives(c).some((t) => t.id === 'earth-workshop'));
    assert.ok(storyObjectives(c).some((t) => t.id === 'earth-route'));
    assert.ok(storyObjectives(c).some((t) => t.id === 'earth-reserve'));
    assert.deepEqual(c.story!.dialogues, []);
});
