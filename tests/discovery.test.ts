import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Text, Graphics, CanvasTextMetrics } from 'pixi.js';
import {
    newStoryCampaign,
    newCampaign,
    newShip,
    type Campaign,
} from '../frontend/game/state/campaign';
import {
    STORY_TASKS,
    actTwoComplete,
    storyNextStep,
    EARTH_BRIEFING,
} from '../frontend/game/state/story';
import { DIALOGUES } from '../frontend/game/state/dialogues';
import { RECIPES } from '../frontend/game/state/chemistry';
import {
    visibleStationTiers,
    stationDeviceDiscovered,
    stationBlueprintReady,
    visibleRecipes,
    recipeDiscovered,
} from '../frontend/game/state/discovery';
import { stationScreen, newStationScreenState } from '../frontend/game/ui/station';
import { workshopOverview, laboratoryOverview } from '../frontend/game/ui/production';
import { hangarScreen, newHangarState, moduleOffer } from '../frontend/game/ui/hangar';
import { stationShieldContent } from '../frontend/game/ui/stationShield';
import { stationDeviceScene } from '../frontend/game/graphics/stationDevice';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
import { GameSettings } from '../frontend/core/systems/gameSettings';
import { grantStoryTasks } from './fleet-fixtures';
GameSettings.soundEnabled = false;
// These tests inspect disclosure and routes. Actual text layout is checked in browser QA.
before(() =>
    mock.method(
        CanvasTextMetrics,
        'measureText',
        () => ({ width: 30, height: 24 }) as ReturnType<typeof CanvasTextMetrics.measureText>,
    ),
);
after(() => mock.restoreAll());

function walk(root: Container): Container[] {
    return [root, ...root.children.flatMap(walk)];
}
function text(root: Container) {
    return walk(root)
        .filter((node): node is Text => node instanceof Text)
        .map((node) => node.text)
        .join('\n');
}
function finishAct(c: Campaign, act: number) {
    grantStoryTasks(
        c,
        STORY_TASKS.filter((t) => t.act <= act && t.required).map((t) => t.id),
    );
}
const noSpoilers = (value: string) =>
    assert.doesNotMatch(
        value,
        /Merkur|Jowisz|POZIOM II|TIER II|Feniks|Aegis|rezonansow|Najpierw technologia/i,
    );
const actions = {
    refresh() {},
    install() {},
    openRecipe() {},
    shield() {},
    kineticShield() {},
    drones() {},
};

test('the free-play profile with no story has safe discovery rules at every facility level', () => {
    const c = newCampaign();
    assert.equal(stationDeviceDiscovered(c, 'extraction'), false);
    assert.equal(stationDeviceDiscovered(c, 'workshop'), false);
    for (const level of [1, 2, 3]) {
        c.station.laboratoryLevel = c.station.workshopLevel = level;
        assert.equal(stationDeviceDiscovered(c, 'extraction'), true);
        assert.equal(stationDeviceDiscovered(c, 'workshop'), true);
    }
});

test('bootstrap only reveals the laboratory construction project; stale future selections are discarded', () => {
    const c = newStoryCampaign();
    assert.deepEqual(visibleStationTiers(c, 'laboratory'), [1]);
    for (const id of ['workshop', 'shield', 'drones', 'extraction'] as const)
        assert.equal(stationDeviceDiscovered(c, id), false);
    const ui = new Container(),
        state = { ...newStationScreenState(), project: 'extraction' as const, preview: 3 };
    try {
        stationScreen(ui, c, state, actions);
        assert.equal(state.project, 'laboratory');
        assert.match(text(ui), /Laboratorium I/);
        assert.doesNotMatch(text(ui), /Warsztat|Ekstrakcja|Tarcze|Drony|\/ 3/);
        noSpoilers(text(ui));
    } finally {
        destroyDisplayTree(ui);
    }
});

test('after the Moon tier I becomes available without exposing the future facilities or ships', () => {
    const c = newStoryCampaign();
    grantStoryTasks(c, ['earth-supply', 'lunar-attack']);
    assert.equal(stationDeviceDiscovered(c, 'workshop'), true);
    assert.deepEqual(visibleStationTiers(c, 'workshop'), [1]);
    assert.equal(stationDeviceDiscovered(c, 'extraction'), false);
    const ui = new Container();
    try {
        stationScreen(ui, c, { project: 'workshop', preview: 3 }, actions);
        assert.match(text(ui), /Warsztat I/);
        assert.match(text(ui), /Swift/);
        noSpoilers(text(ui));
    } finally {
        destroyDisplayTree(ui);
    }
});

test('Mars discovery stays hidden until act II is complete, then reveals research without its future solution', () => {
    const c = newStoryCampaign();
    finishAct(c, 1);
    c.story!.sector = 'mars';
    assert.equal(stationDeviceDiscovered(c, 'extraction'), false);
    grantStoryTasks(c, ['mars-anomaly-research']);
    assert.equal(
        stationDeviceDiscovered(c, 'extraction'),
        false,
        'the debrief has not been accepted',
    );
    finishAct(c, 2);
    assert.equal(actTwoComplete(c.story!), true);
    assert.equal(stationDeviceDiscovered(c, 'extraction'), true);
    assert.equal(stationBlueprintReady(c, 'extraction'), false);
    const ui = new Container();
    try {
        stationScreen(ui, c, { project: 'extraction', preview: 0 }, actions);
        assert.match(text(ui), /BADANIA W TOKU/);
        assert.doesNotMatch(text(ui), /CZĘŚCI DO MONTAŻU|ZAMONTUJ|I–III/);
        noSpoilers(text(ui));
    } finally {
        destroyDisplayTree(ui);
    }
});

test('materials never reveal future research; acquired technology reveals only the next actionable tier', () => {
    const c = newStoryCampaign();
    finishAct(c, 3);
    c.bank = { ore: 10000, parts: 10000, anomalyOre: 10000 };
    assert.deepEqual(visibleStationTiers(c, 'laboratory'), [1]);
    grantStoryTasks(c, ['mercury-technology']);
    assert.equal(stationBlueprintReady(c, 'extraction'), true);
    assert.deepEqual(
        visibleStationTiers(c, 'laboratory'),
        [1],
        'needs installation and sample, not just a tech report',
    );
    grantStoryTasks(c, ['mars-anomaly-sample']);
    assert.deepEqual(visibleStationTiers(c, 'laboratory'), [1, 2]);
    assert.deepEqual(visibleStationTiers(c, 'workshop'), [1]);
    grantStoryTasks(c, ['mars-laboratory-ii']);
    assert.deepEqual(visibleStationTiers(c, 'workshop'), [1, 2]);
    grantStoryTasks(c, ['mars-workshop-ii']);
    assert.deepEqual(visibleStationTiers(c, 'laboratory'), [1, 2]);
    grantStoryTasks(c, ['jupiter-observations']);
    assert.deepEqual(visibleStationTiers(c, 'laboratory'), [1, 2, 3]);
    assert.deepEqual(visibleStationTiers(c, 'workshop'), [1, 2]);
});

test('production rejects a stale advanced recipe selection instead of injecting it into the tier I list', () => {
    const c = newStoryCampaign();
    finishAct(c, 1);
    const ui = new Container();
    try {
        workshopOverview(ui, c, { manufacture() {} }, 'platingIII', () => {});
        noSpoilers(text(ui));
        assert.match(text(ui), /Poszycie stalowe I/);
        assert.equal(recipeDiscovered(c, 'platingIII'), false);
        assert.equal(
            visibleRecipes(c, 'workshop').some((id) => RECIPES[id].level > 1),
            false,
        );
        destroyDisplayTree(ui);
        const laboratory = new Container();
        try {
            laboratoryOverview(laboratory, c, { manufacture() {} }, 'resonantComposite', () => {});
            noSpoilers(text(laboratory));
        } finally {
            destroyDisplayTree(laboratory);
        }
    } finally {
        destroyDisplayTree(ui);
    }
});

test('the shipyard discards a stale future hull, only lists unlocked projects and caps module previews', () => {
    const c = newStoryCampaign();
    finishAct(c, 1);
    const ui = new Container(),
        state = {
            ...newHangarState(),
            hull: 'phoenix' as const,
            tab: 'upgrades' as const,
            previewLevel: 3,
        };
    try {
        hangarScreen(ui, c, state, true, {
            refresh() {},
            openRecipe() {},
            openStation() {},
            openFleet() {},
            buyShip() {},
            selectShip() {},
            scrapShip() {},
            upgrade() {},
            equipWeapon() {},
        });
        assert.equal(state.hull, 'swift');
        noSpoilers(text(ui));
        const ship = newShip(99, 'mule');
        ship.engine = 1;
        const offer = moduleOffer(c, ship, 'engine');
        assert.equal(offer.next, 1);
        assert.deepEqual(offer.cost, {});
    } finally {
        destroyDisplayTree(ui);
    }
});

test('an installed basic shield does not preview undiscovered kinetic industry', () => {
    const c = newStoryCampaign();
    finishAct(c, 1);
    c.station.shield = true;
    const ui = new Container();
    try {
        stationShieldContent(
            ui,
            c,
            () => assert.fail('installed generator cannot be installed again'),
            () => {},
        );
        assert.doesNotMatch(text(ui), /kinetyczn|Merkur|CZĘŚCI DO MONTAŻU|1150|\/2/i);
        assert.match(text(ui), /Generator pracuje/);
    } finally {
        destroyDisplayTree(ui);
    }
});

test('an installed kinetic shield does not disclose a future Mars defense requirement', () => {
    const c = newStoryCampaign();
    finishAct(c, 3);
    grantStoryTasks(c, ['mars-workshop-ii']);
    c.station.shield = true;
    c.station.shieldLevel = 1;
    const ui = new Container();
    try {
        stationShieldContent(
            ui,
            c,
            () => {},
            () => {},
        );
        assert.doesNotMatch(text(ui), /Najpierw|CZĘŚCI DO MONTAŻU|korytarz|1150/i);
        assert.match(text(ui), /WZMOCNIENIE 1/);
    } finally {
        destroyDisplayTree(ui);
    }
});

test('early briefings and the start of Venus give the current direction without naming Mercury', () => {
    assert.doesNotMatch(EARTH_BRIEFING, /Merkur/);
    for (const dialogue of DIALOGUES)
        assert.doesNotMatch(dialogue.lines.map((line) => line.text).join(' '), /Merkur|Jowisz/);
    const c = newStoryCampaign();
    finishAct(c, 2);
    c.story!.sector = 'venus';
    assert.doesNotMatch(storyNextStep(c.story!), /Merkur/);
    finishAct(c, 3);
    assert.match(
        storyNextStep(c.story!),
        /Merkur/,
        'the completed Venus expedition may reveal its next destination',
    );
});

test('facility artwork has distinct geometry by facility and tier and owns disposable graphics', () => {
    const signatures = new Set<string>();
    for (const project of ['laboratory', 'workshop', 'extraction'] as const)
        for (const level of project === 'extraction' ? [0, 1, 2, 3] : [1, 2, 3]) {
            const art = stationDeviceScene(project, level);
            const graphic = art.children[0] as Graphics;
            const context = graphic.context;
            const signature = JSON.stringify(
                context.instructions.map((instruction) =>
                    instruction.action === 'texture'
                        ? 'texture'
                        : {
                              action: instruction.action,
                              color: instruction.data.style.color,
                              path: instruction.data.path.instructions,
                          },
                ),
            );
            assert.equal(signatures.has(signature), false, `${project} ${level}`);
            signatures.add(signature);
            const bounds = art.getLocalBounds();
            assert.ok(bounds.width <= 520 && bounds.height <= 330);
            destroyDisplayTree(art);
            assert.equal(graphic.destroyed, true);
        }
});
