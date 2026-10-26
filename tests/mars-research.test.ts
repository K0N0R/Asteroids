import { MissionHud } from '../frontend/game/ui/hud';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    beginRun,
    finishRun,
    newShip,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    STORY_TASKS,
    travelStory,
    syncStory,
    acknowledgeStoryBriefing,
} from '../frontend/game/state/story';
import {
    MARS_ACT,
    prepareMarsResearchSortie,
    marsResearchComplete,
} from '../frontend/game/state/marsAct';
import { grantStoryTasks } from './fleet-fixtures';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { MarsResearchEscort } from '../frontend/game/systems/marsResearchEscort';
import { researchPath } from '../frontend/game/systems/escort';
import { marsAnomalyClearance, marsAnomalyTouches } from '../frontend/game/worlds/phobosMaze';
import {
    marsResearchLegClear,
    marsResearchScanTarget,
    MARS_RESEARCH_HOME,
} from '../frontend/game/worlds/marsResearch';
import { outsideCombatView } from '../frontend/game/systems/assaultEntry';
import { enemyPosition } from '../frontend/game/systems/enemies';
import { Graphics, ObservablePoint } from 'pixi.js';
import { drawResearchScan } from '../frontend/game/graphics/researchScan';
before(async () => RAPIER.init());
const idle = {
    target: { x: 380, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
export function researchCampaign() {
    const c = newStoryCampaign();
    for (const task of STORY_TASKS.filter((t) => t.act === 1)) {
        c.story!.progress[task.id] = task.target;
        c.story!.claimed.push(task.id);
    }
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    assert.ok(travelStory(c, 'mars'));
    grantStoryTasks(c, ['mars-asteroid-yard', 'mars-sector-secure']);
    syncStory(c);
    c.ship = newShip(1, 'swift');
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function sim() {
    const c = researchCampaign();
    assert.ok(beginRun(c, 123));
    return new MissionSimulation(c, 123);
}
function follow(s: MissionSimulation) {
    const p = s.escort!.position;
    s.ship.setTranslation({ x: (p.x + 80) / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
    s.setCombatCamera(0, 0.64, p);
    s.hull = s.maxHull;
}
test('three research sites face real nearby boundaries and every travel leg has a safe route', () => {
    assert.ok(MARS_ACT.research[0].y < -2000);
    assert.ok(Math.hypot(MARS_ACT.research[1].x - 1700, MARS_ACT.research[1].y - 900) < 1300);
    assert.ok(MARS_ACT.research[2].x > 4500);
    const points = [{ x: 380, y: 0 }, ...MARS_ACT.research, MARS_RESEARCH_HOME];
    for (const site of MARS_ACT.research) {
        assert.ok(marsAnomalyClearance(site, 'mars') > 100);
        const target = marsResearchScanTarget(site);
        assert.ok(marsAnomalyTouches(target, 'mars', 0));
        assert.ok(Math.hypot(site.x - target.x, site.y - target.y) < 600);
    }
    for (let i = 1; i < points.length; i++) {
        const path = researchPath(points[i - 1], points[i], [], marsResearchLegClear, 50);
        assert.ok(path.length);
        let from = points[i - 1];
        for (const to of path) {
            assert.ok(marsResearchLegClear(from, to));
            from = to;
        }
    }
});
test('all scans plus a fourth incoming wave complete only after actual return to Satuk', () => {
    const s = sim(),
        e = s.escort as MarsResearchEscort,
        p = s.campaign.story!.mars;
    const seen = new Map<number, number>();
    let returnAttack = false;
    let approached = 0,
        returned = false,
        thirdAway = false;
    try {
        for (let i = 0; i < 62; i++) s.step({ ...idle, interact: true });
        assert.notEqual(e.state, 'idle');
        for (let frame = 0; frame < 22000 && !returned; frame++) {
            follow(s);
            e.health = 140;
            const view = s.combatView;
            s.step(idle);
            assert.equal(
                marsAnomalyTouches(e.position, 'mars', 40),
                false,
                `Kepler in hazard ${JSON.stringify(e.position)}`,
            );
            for (const enemy of [...s.enemies.enemies.values()])
                if (enemy.id >= 74010 && enemy.id < 74050) {
                    const pos = enemyPosition(enemy),
                        distance = Math.hypot(pos.x - e.position.x, pos.y - e.position.y);
                    assert.equal(marsAnomalyTouches(pos, 'mars', 35), false);
                    if (!seen.has(enemy.id)) {
                        assert.ok(outsideCombatView(pos, 55, view), `spawn on screen ${enemy.id}`);
                        seen.set(enemy.id, distance);
                    }
                    if (enemy.id >= 74040 && distance < 650) returnAttack = true;
                    if (distance < 600) {
                        assert.ok(seen.get(enemy.id)! - distance > 200);
                        approached++;
                        s.enemies.remove(enemy.id);
                        s.marsAct!.killed(enemy.id);
                    }
                }
            if (p.researchSites === 3 && !p.researchReturned) {
                thirdAway = true;
                assert.ok(!s.campaign.story!.claimed.includes('mars-anomaly-research'));
                assert.ok(e.returning);
            }
            returned = !!p.researchReturned;
            if (frame === 21999)
                assert.fail(
                    JSON.stringify({
                        site: p.researchSites,
                        waves: p.researchWaves,
                        state: e.state,
                        why: e.waitingReason,
                        position: e.position,
                        target: e.destination,
                        health: e.health,
                    }),
                );
        }
        assert.ok(returned);
        assert.ok(thirdAway);
        assert.equal(p.researchSites, 3);
        assert.equal(p.researchWaves, 4);
        assert.equal(seen.size, 12);
        assert.ok(approached >= 9);
        assert.ok(returnAttack, 'the return wave must actually catch the escorted ship');
        assert.ok(Math.hypot(e.position.x, e.position.y) < 190);
        assert.ok(s.campaign.story!.claimed.includes('mars-anomaly-research'));
        assert.equal(e.state, 'complete');
        assert.equal(acknowledgeStoryBriefing(s.campaign), null);
        finishRun(s.campaign, true, { ore: 0, parts: 0 }, s.elapsed, 'dock');
        assert.ok(acknowledgeStoryBriefing(s.campaign));
        assert.ok(parseCampaign(JSON.stringify(s.campaign)));
    } finally {
        s.dispose();
    }
});
test('lost return cannot grant success; retry repeats the final scan while old completed saves stay complete', () => {
    const c = researchCampaign(),
        p = c.story!;
    p.mars.researchSites = 3;
    p.mars.researchWaves = 4;
    p.mars.researchReturned = false;
    syncStory(c);
    assert.ok(!p.claimed.includes('mars-anomaly-research'));
    assert.equal(marsResearchComplete(p), false);
    assert.ok(parseCampaign(JSON.stringify(c)));
    prepareMarsResearchSortie(p);
    assert.equal(p.mars.researchSites, 2);
    assert.equal(p.mars.researchWaves, 2);
    grantStoryTasks(c, ['mars-anomaly-research']);
    delete p.mars.researchReturned;
    prepareMarsResearchSortie(p);
    assert.ok(marsResearchComplete(p));
    assert.equal(p.mars.researchSites, 3);
    assert.ok(parseCampaign(JSON.stringify(c)));
});
test('sensor animation sweeps the real anomaly and stops its active pulses under attack', () => {
    const g = new Graphics();
    try {
        drawResearchScan(g, { x: 0, y: 0 }, { x: 250, y: 0 }, 0.2, true);
        const first = JSON.stringify(
            g.context.instructions.map((i) => ({
                action: i.action,
                path: (i.data as any).path?.instructions,
            })),
        );
        drawResearchScan(g, { x: 0, y: 0 }, { x: 250, y: 0 }, 0.8, true);
        assert.notEqual(
            JSON.stringify(
                g.context.instructions.map((i) => ({
                    action: i.action,
                    path: (i.data as any).path?.instructions,
                })),
            ),
            first,
        );
        const n = g.context.instructions.length;
        drawResearchScan(g, { x: 0, y: 0 }, { x: 250, y: 0 }, 0.8, false);
        assert.ok(g.context.instructions.length < n);
        drawResearchScan(g, { x: 5200, y: -200 }, { x: 5245, y: 258 }, 0.8, true);
        const bounds = g.getLocalBounds();
        assert.ok(
            bounds.minX > 4800 && bounds.maxX < 5500,
            'pulse paths never connect back to the world origin',
        );
    } finally {
        g.destroy();
    }
});

test('all four waves enter clear corridors outside rotated and zoomed camera bounds', () => {
    const s = sim(),
        e = s.escort as MarsResearchEscort,
        p = s.campaign.story!.mars;
    try {
        s.step(idle);
        for (const angle of [0, 0.7, 1.5, 2.8])
            for (const zoom of [0.4, 0.64, 1.2])
                for (let stage = 0; stage < 4; stage++) {
                    for (const id of [...s.enemies.enemies.keys()])
                        if (id >= 74010) s.enemies.remove(id);
                    const site = MARS_ACT.research[Math.min(2, stage)];
                    e.body.setTranslation({ x: site.x / 100, y: site.y / 100 }, true);
                    e.body.setLinvel({ x: 0, y: 0 }, true);
                    e.resumeResearch(site);
                    e.state = 'research';
                    if (stage === 3) e.returnToStation();
                    p.researchSites = Math.min(3, stage);
                    p.researchWaves = stage;
                    s.ship.setTranslation({ x: (site.x + 100) / 100, y: site.y / 100 }, true);
                    s.setCombatCamera(angle, zoom, { x: site.x + 100, y: site.y });
                    s.marsAct!.researchWaves.update(1.1);
                    assert.equal(
                        p.researchWaves,
                        stage + 1,
                        JSON.stringify({ angle, zoom, stage }),
                    );
                    for (const enemy of s.enemies.enemies.values())
                        if (enemy.id >= 74010) {
                            const point = enemyPosition(enemy);
                            assert.ok(outsideCombatView(point, 55, s.combatView));
                            assert.equal(marsAnomalyTouches(point, 'mars', 140), false);
                        }
                }
    } finally {
        s.dispose();
    }
});

test('offscreen spawn bounds retain X/Y from the real Pixi camera pivot', () => {
    const s = sim();
    try {
        const pivot = new ObservablePoint({ _onUpdate() {} }, 140, -2550);
        s.setCombatCamera(-Math.PI / 2, 1, pivot);
        assert.deepEqual(s.combatView.center, { x: 140, y: -2550 });
        const e = s.escort as MarsResearchEscort;
        e.resumeResearch(MARS_ACT.research[0]);
        e.body.setTranslation({ x: 0, y: -25.5 }, true);
        e.state = 'research';
        s.marsAct!.researchWaves.update(1.1);
        assert.equal(s.campaign.story!.mars.researchWaves, 1);
    } finally {
        s.dispose();
    }
});

test('completed expedition HUD names the success and selects Satuk instead of a future waypoint', () => {
    const s = sim();
    let hud: MissionHud | undefined;
    try {
        const p = s.campaign.story!.mars;
        p.researchSites = 3;
        p.researchWaves = 4;
        p.researchReturned = true;
        syncStory(s.campaign);
        const e = s.escort as MarsResearchEscort;
        e.returning = true;
        e.state = 'complete';
        hud = new MissionHud(
            s,
            0,
            () => {},
            () => [],
        );
        hud.update(200);
        assert.match(s.missionStatus, /Ekspedycja wróciła/);
        assert.match((hud as any).orderStatus.children[0].text, /Ekspedycja wróciła/);
        assert.equal((hud as any).target, 0);
    } finally {
        if (hud) destroyDisplayTree(hud);
        s.dispose();
    }
});
