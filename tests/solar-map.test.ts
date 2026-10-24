import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from 'pixi.js';
import { newStoryCampaign, beginRun } from '../frontend/game/state/campaign';
import { STORY_TASKS, travelStory } from '../frontend/game/state/story';
import { solarSystem, SOLAR_MAP } from '../frontend/game/ui/solarSystem';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
function unlocked() {
    const c = newStoryCampaign();
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    for (const t of STORY_TASKS) {
        c.story!.progress[t.id] = t.target;
        if (!c.story!.claimed.includes(t.id)) c.story!.claimed.push(t.id);
    }
    return c;
}
test('solar map only exposes known destinations while retaining all ten sector definitions', () => {
    const c = newStoryCampaign(),
        ui = new Container();
    let requests = 0;
    try {
        solarSystem(ui, c, () => requests++);
        assert.equal(SOLAR_MAP.length, 10);
        assert.ok(ui.getChildByLabel('solar-sector-earth'));
        for (const sector of SOLAR_MAP.filter((body) => body.id !== 'earth'))
            assert.equal(ui.getChildByLabel(`solar-sector-${sector.id}`), null);
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
