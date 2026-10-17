import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    beginRun,
    newCampaign,
    newStoryCampaign,
    parseCampaign,
    SaveRepository,
    SAVE_KEY,
} from '../frontend/game/state/campaign';
import { STORY_SAVE_KEY } from '../frontend/game/state/story';

test('only the current campaign and journal formats can be opened, including active orders', () => {
    const c = newStoryCampaign();
    for (let version = 1; version <= 40; version++)
        assert.equal(parseCampaign(JSON.stringify({ ...c, version })), null);
    assert.equal(parseCampaign(JSON.stringify({ ...c, version: 42 })), null);
    for (let version = 1; version <= 18; version++)
        assert.equal(parseCampaign(JSON.stringify({ ...c, story: { ...c.story, version } })), null);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    beginRun(c, 1, null, false, 'earth-relay');
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('an incompatible save starts a clean campaign with an explicit warning and no inherited resources or hulls', () => {
    const previous = newStoryCampaign();
    previous.bank = { ore: 100, parts: 20 };
    const values = new Map<string, string>([
        [STORY_SAVE_KEY, JSON.stringify({ ...previous, version: 33 })],
    ]);
    const storage = {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
            values.set(key, value);
        },
    };
    const repository = new SaveRepository(storage, {
        key: STORY_SAVE_KEY,
        create: newStoryCampaign,
    });
    const fresh = repository.load();
    assert.deepEqual(fresh, newStoryCampaign());
    assert.match(repository.warning, /Niekompatybilny/);
    repository.save(fresh);
    assert.deepEqual(parseCampaign(values.get(STORY_SAVE_KEY)!), fresh);
});

test('story and test-mode repositories retain separate current-format campaigns', () => {
    const values = new Map<string, string>();
    const storage = {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
            values.set(key, value);
        },
    };
    const story = new SaveRepository(storage, { key: STORY_SAVE_KEY, create: newStoryCampaign }),
        testMode = new SaveRepository(storage);
    const a = newStoryCampaign(),
        b = newCampaign();
    a.bank.ore = 40;
    b.bank.parts = 17;
    story.save(a);
    testMode.save(b);
    assert.deepEqual(story.load(), a);
    assert.deepEqual(testMode.load(), b);
    assert.notEqual(values.get(STORY_SAVE_KEY), values.get(SAVE_KEY));
});
