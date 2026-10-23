import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
    buyUpgrade,
} from '../frontend/game/state/campaign';
import { STARTER_MATERIALS } from '../frontend/game/state/stationConstruction';
import { receiveEarthCargo } from '../frontend/game/state/earthLogistics';
import {
    syncStory,
    STORY_TASKS,
    storyDiscoveredTasks,
    storyRewardText,
    recordStoryReturn,
} from '../frontend/game/state/story';
import { manufacture } from '../frontend/game/state/production';
import { pilotLevel } from '../frontend/game/state/pilots';

test('first supply asks for the complete level-zero raw bill and preserves every ingredient for real construction', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    receiveEarthCargo(c, { ore: 4, parts: 0, carbon: 1, copperOre: 4, crystals: 3, oxygen: 1 });
    assert.equal(c.story!.claimed.includes('earth-supply'), false);
    assert.equal(c.pilots[0].xp, 0);
    receiveEarthCargo(c, { ore: 0, parts: 0, oxygen: 1 });
    assert.equal(c.story!.claimed.includes('earth-supply'), false);
    assert.ok(c.story!.claimed.includes('earth-materials'));
    for (const [id, count] of Object.entries(STARTER_MATERIALS))
        assert.equal(c.bank[id as keyof typeof c.bank], count);
    assert.equal(c.pilots[0].xp, 0);
    assert.ok(parseCampaign(JSON.stringify(c)));
    finishRun(c, true, { ore: 0, parts: 0 }, 0, 'dock');
    for (const [recipe, batches] of [
        ['steel', 1],
        ['copper', 2],
        ['conductors', 2],
        ['silicon', 1],
        ['silica', 1],
        ['plating', 2],
        ['machinery', 1],
        ['electronics', 1],
    ] as const)
        assert.ok(manufacture(c, recipe, batches), recipe);
    const beforeUpgradeXp = c.pilots[0].xp;
    assert.ok(buyUpgrade(c, 'workshop'));
    assert.equal(c.station.workshopLevel, 1);
    syncStory(c);
    assert.ok(c.story!.claimed.includes('earth-supply'));
    assert.equal(c.pilots[0].xp, beforeUpgradeXp + 40);
    syncStory(c);
    assert.equal(c.pilots[0].xp, beforeUpgradeXp + 40);
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('iron alone cannot complete supply and no resources are donated or rewarded as iron', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    receiveEarthCargo(c, { ore: 24, parts: 0 });
    assert.equal(c.story!.claimed.includes('earth-supply'), false);
    assert.equal(c.bank.ore, 24);
    assert.equal(c.pilots[0].xp, 0);
    assert.equal(
        STORY_TASKS.some((t) => t.id === 'earth-reserve'),
        false,
    );
    assert.deepEqual(
        storyDiscoveredTasks(c.story!).map((t) => t.id),
        ['earth-supply', 'earth-relay', 'earth-ship-upgrade'],
    );
});

test('satellite rewards one life support system exactly once, with no raw iron or plating bonus', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    recordStoryReturn(c, 'earth', ['relay']);
    assert.equal(c.bank.lifeSupport, 1);
    assert.equal(c.bank.ore, 0);
    assert.equal(c.bank.parts, 0);
    const before = structuredClone(c.bank);
    recordStoryReturn(c, 'earth', ['relay']);
    syncStory(c);
    assert.deepEqual(c.bank, before);
    assert.match(
        storyRewardText(STORY_TASKS.find((t) => t.id === 'earth-relay')!),
        /1 × System podtrzymywania życia/,
    );
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('optional ship upgrade grants 15 PD once to the selected pilot and survives saving', () => {
    const c = newStoryCampaign();
    assert.equal(c.pilots[0].xp, 0);
    c.bank = { ore: 0, parts: 4, storageFrames: 1 };
    assert.ok(buyUpgrade(c, 'armor'));
    syncStory(c);
    assert.ok(c.story!.claimed.includes('earth-ship-upgrade'));
    assert.equal(c.pilots[0].xp, 15);
    syncStory(c);
    assert.equal(c.pilots[0].xp, 15);
    const restored = parseCampaign(JSON.stringify(c))!;
    assert.ok(restored);
    syncStory(restored);
    assert.equal(restored.pilots[0].xp, 15);
});

test('raw cargo delivery awards ordinary expedition PD without completing the station quest', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    receiveEarthCargo(c, { ore: 4, parts: 0, carbon: 1, copperOre: 4, crystals: 3, oxygen: 2 });
    const restored = parseCampaign(JSON.stringify(c))!;
    assert.ok(restored);
    const result = finishRun(restored, true, { ore: 0, parts: 0 }, 0, 'dock')!;
    assert.equal(result.pilotProgress!.gainedXp, restored.pilots[0].xp);
    assert.equal(result.pilotProgress!.gainedXp, 20);
    assert.equal(result.pilotProgress!.levelBefore, 1);
    assert.equal(result.pilotProgress!.levelAfter, pilotLevel(restored.pilots[0]));
    const xp = restored.pilots[0].xp;
    syncStory(restored);
    assert.equal(restored.pilots[0].xp, xp);
    assert.equal(parseCampaign(JSON.stringify({ ...restored, version: 59 })), null);
});
