import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from 'pixi.js';
import { newStoryCampaign, beginRun } from '../frontend/game/state/campaign';
import { STORY_TASKS, travelStory } from '../frontend/game/state/story';
import { solarSystem, SOLAR_MAP } from '../frontend/game/ui/solarSystem';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
function unlocked() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const t of STORY_TASKS) {
        c.story!.progress[t.id] = t.target;
        if (!c.story!.claimed.includes(t.id)) c.story!.claimed.push(t.id);
    }
    return c;
}
test('solar map contains all ten selectable sectors and cannot select a locked destination', () => {
    const c = newStoryCampaign(),
        ui = new Container();
    let requests = 0;
    try {
        solarSystem(ui, c, () => requests++);
        assert.equal(SOLAR_MAP.length, 10);
        for (const sector of SOLAR_MAP) assert.ok(ui.getChildByLabel(`solar-sector-${sector.id}`));
        ui.getChildByLabel('solar-sector-mars')!.emit('pointertap', {});
        assert.equal(requests, 0);
        assert.equal(c.story!.sector, 'earth');
    } finally {
        destroyDisplayTree(ui);
    }
});
test('map selection uses real campaign travel and rebuilding the map retains the destination', () => {
    const c = unlocked(),
        ui = new Container();
    let requests = 0;
    try {
        solarSystem(ui, c, (id) => {
            requests++;
            assert.equal(travelStory(c, id), true);
        });
        ui.getChildByLabel('solar-sector-mars')!.emit('pointertap', {});
        assert.equal(requests, 1);
        assert.equal(c.story!.sector, 'mars');
        const next = new Container();
        solarSystem(next, c, () => {});
        assert.ok(next.getChildByLabel('solar-sector-mars'));
        assert.equal(c.story!.sector, 'mars');
        destroyDisplayTree(next);
    } finally {
        destroyDisplayTree(ui);
    }
});
test('a running sortie prevents sector changes even when all destinations are unlocked', () => {
    const c = unlocked(),
        ui = new Container();
    assert.equal(beginRun(c, 1), true);
    let requests = 0;
    try {
        solarSystem(ui, c, () => requests++);
        ui.getChildByLabel('solar-sector-mars')!.emit('pointertap', {});
        assert.equal(requests, 0);
        assert.equal(c.story!.sector, 'earth');
    } finally {
        destroyDisplayTree(ui);
    }
});
