import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { recycleAsteroid, cruisingVelocity } from '../frontend/game/worlds/asteroidFields';
import { random } from '../frontend/game/worlds/sector';
import { newStoryCampaign, beginRun } from '../frontend/game/state/campaign';
import { STORY_SECTORS } from '../frontend/game/state/story';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { MOON } from '../frontend/game/worlds/moon';
before(async () => RAPIER.init());
const idle = {
    target: { x: 1000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
test('all campaign sectors have irregular moving orbital deposits and stationary lunar outcrops', () => {
    for (const sector of Object.keys(STORY_SECTORS) as (keyof typeof STORY_SECTORS)[]) {
        const c = newStoryCampaign();
        c.story!.sector = sector;
        const generated = generateStorySector(c.story!);
        assert.deepEqual(generated, generateStorySector(c.story!));
        const rocks = generated.rocks.filter((r) => !r.anchored && r.beltBarrier === undefined);
        assert.ok(rocks.length > 0);
        assert.ok(rocks.every((r) => Math.hypot(r.vx, r.vy) >= 0.5));
        assert.ok(new Set(rocks.slice(0, 9).map((r) => Math.round(r.y))).size >= 7);
    }
    const c = newStoryCampaign();
    c.story!.sector = 'lunar';
    c.story!.claimed.push('lunar-survey');
    const surface = generateStorySector(c.story!).rocks.filter(
        (r) => Math.hypot(r.x - MOON.center.x, r.y - MOON.center.y) < MOON.radius,
    );
    assert.ok(surface.length > 0);
    assert.ok(surface.every((r) => r.vx === 0 && r.vy === 0));
});
test('edge recycling places asteroids outside the opposite edge on a course intersecting the sector', () => {
    const rng = random(815);
    for (let i = 0; i < 100; i++) {
        const a = rng() * Math.PI * 2;
        const result = recycleAsteroid(
            { x: Math.cos(a) * 6400, y: Math.sin(a) * 6400 },
            { x: 32, y: 18 },
            5500,
            50,
            rng,
        )!;
        assert.ok(result);
        assert.ok(Math.hypot(result.position.x, result.position.y) > 5500 + 300);
        assert.ok(result.position.x * Math.cos(a) + result.position.y * Math.sin(a) < 0);
        const v = result.velocity,
            p = result.position,
            t = -(p.x * v.x + p.y * v.y) / (v.x * v.x + v.y * v.y);
        assert.ok(t > 0);
        assert.ok(Math.hypot(p.x + v.x * t, p.y + v.y * t) < 5500);
    }
    assert.equal(recycleAsteroid({ x: 100, y: 0 }, { x: 20, y: 0 }, 5500, 50, rng), null);
});
test('Rapier asteroids keep collision momentum, restart when stopped and recycle without a visible interpolation streak', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        const rock = [...s.rocks.values()][0],
            initial = { ...rock.previous };
        for (let i = 0; i < 60; i++) s.step(idle);
        assert.ok(Math.hypot(rock.previous.x - initial.x, rock.previous.y - initial.y) > 2);
        rock.body.setLinvel({ x: 0, y: 0 }, true);
        s.step(idle);
        assert.ok(Math.hypot(rock.body.linvel().x, rock.body.linvel().y) > 0.02);
        rock.body.setTranslation({ x: (s.sectorRadius + 900) / 100, y: 0 }, true);
        s.step(idle);
        assert.ok(rock.previous.x < 0);
        assert.ok(Math.hypot(rock.previous.x, rock.previous.y) > s.sectorRadius);
        assert.ok(rock.body.linvel().x > 0);
        assert.deepEqual(cruisingVelocity({ x: 40, y: 7 }, 0), { x: 40, y: 7 });
    } finally {
        s.dispose();
    }
});
