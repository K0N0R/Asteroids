import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    genericPortrait,
    STORY_PORTRAITS,
    HAIRSTYLES,
    OUTFITS,
    FACE_SHAPES,
    SKIN_TONES,
    HAIR_COLORS,
    ACCENTS,
} from '../frontend/game/graphics/portraitAppearance';
import { portraitView } from '../frontend/game/graphics/portraitView';
import { newCampaign, hirePilot, parseCampaign } from '../frontend/game/state/campaign';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';

test('the pool uses every hairstyle, outfit and face for both men and women without coupling skin to profession', () => {
    for (const presentation of ['woman', 'man'] as const) {
        const looks = Array.from({ length: 1500 }, (_, i) => genericPortrait(i + 2, i % 3)).filter(
            (p) => p.presentation === presentation,
        );
        assert.equal(new Set(looks.map((p) => p.hair)).size, HAIRSTYLES.length);
        assert.equal(new Set(looks.map((p) => p.outfit)).size, OUTFITS.length);
        assert.equal(new Set(looks.map((p) => p.face)).size, FACE_SHAPES.length);
        assert.equal(new Set(looks.map((p) => p.skin)).size, SKIN_TONES.length);
        assert.equal(new Set(looks.map((p) => p.hairColor)).size, HAIR_COLORS.length);
        assert.equal(new Set(looks.map((p) => p.accent)).size, ACCENTS.length);
    }
    for (let id = 2; id < 100; id++) {
        const candidates = [0, 1, 2].map((archetype) => genericPortrait(id, archetype));
        assert.equal(new Set(candidates.map((p) => p.hair)).size, 3);
        assert.equal(new Set(candidates.map((p) => p.skin)).size, 3);
    }
});

test('a hired pilot retains the advertised appearance after loading and independent renders', () => {
    for (const archetype of [0, 1, 2]) {
        const c = newCampaign();
        c.nextPilotId = 17;
        c.bank.ore = 20;
        const advertised = genericPortrait(c.nextPilotId, archetype);
        assert.ok(hirePilot(c, archetype));
        const loaded = parseCampaign(JSON.stringify(c))!;
        const hired = loaded.pilots.find((p) => p.id === 17)!;
        assert.deepEqual(genericPortrait(hired.id, hired.archetype), advertised);
        const first = portraitView(advertised),
            second = portraitView(genericPortrait(hired.id, hired.archetype));
        assert.deepEqual(first.getLocalBounds().rectangle, second.getLocalBounds().rectangle);
        destroyDisplayTree(first);
        assert.equal(second.destroyed, false);
        destroyDisplayTree(second);
    }
    assert.equal(genericPortrait(1, 0).presentation, 'woman');
    assert.equal(genericPortrait(1, 1).presentation, 'man');
    assert.equal(genericPortrait(1, 2).presentation, 'woman');
});

test('all interchangeable hair and outfit combinations fit the portrait viewport in either pose', () => {
    for (const hair of HAIRSTYLES)
        for (const outfit of OUTFITS)
            for (const facing of [-1, 1] as const) {
                const view = portraitView({ ...genericPortrait(2, 0), hair, outfit, facing });
                const bounds = view.getLocalBounds();
                assert.ok(
                    bounds.width <= 290 && bounds.height <= 290,
                    `${hair}/${outfit}: ${bounds.width} x ${bounds.height}`,
                );
                assert.ok(Number.isFinite(bounds.x) && Number.isFinite(bounds.y));
                destroyDisplayTree(view);
            }
    assert.equal(new Set(Object.values(STORY_PORTRAITS).map((p) => JSON.stringify(p))).size, 4);
    assert.equal(new Set(Object.values(STORY_PORTRAITS).map((p) => p.hair)).size, 4);
});

test('complexions use a weighted varied pool and hair follows every face width', () => {
    const looks = Array.from({ length: 1000 }, (_, i) => genericPortrait(i + 2, 0));
    const lighter = looks.filter((p) =>
        SKIN_TONES.slice(0, 3).includes(p.skin as (typeof SKIN_TONES)[number]),
    ).length;
    assert.ok(lighter > 550 && lighter < 750);
    for (const face of FACE_SHAPES) {
        const view = portraitView({ ...genericPortrait(1, 0), face, hair: 'swept' });
        const bounds = view.getLocalBounds();
        assert.ok(bounds.width <= 290 && bounds.height <= 290);
        destroyDisplayTree(view);
    }
});
