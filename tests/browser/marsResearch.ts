import { Application } from 'pixi.js';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    newShip,
    beginRun,
    parseCampaign,
} from '../../frontend/game/state/campaign';
import { STORY_TASKS, travelStory, syncStory } from '../../frontend/game/state/story';
import { MARS_ACT } from '../../frontend/game/state/marsAct';
import { grantStoryTasks } from '../fleet-fixtures';
import { MissionSimulation } from '../../frontend/game/systems/mission';
import { MarsResearchEscort } from '../../frontend/game/systems/marsResearchEscort';
import { MissionWorld } from '../../frontend/game/worlds/missionWorld';
import { MissionHud } from '../../frontend/game/ui/hud';
import { GameSettings } from '../../frontend/core/systems/gameSettings';
import { enemyPosition } from '../../frontend/game/systems/enemies';
import { marsAnomalyClearance } from '../../frontend/game/worlds/phobosMaze';
import { destroyDisplayTree } from '../../frontend/core/systems/destroyDisplayTree';
GameSettings.soundEnabled = false;
await RAPIER.init();
const app = new Application();
await app.init({ width: 1600, height: 900, background: 0x10152b, resolution: 1, antialias: true });
document.querySelector('#stage')!.appendChild(app.canvas);
(document.querySelector('#stage') as HTMLElement).style.transform = `scale(${innerWidth / 1600})`;
let sim: MissionSimulation,
    world: MissionWorld,
    hud: MissionHud,
    mode: 'route' | 'scan' | 'attack' = 'scan',
    frame = 0,
    error = '',
    maxMS = 0,
    initial = 0,
    index = 0,
    arrivals = 0,
    peakMB = 0;
let ending = false;
const spawned = new Set<number>();
const idle = {
    target: { x: 380, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function setup() {
    app.ticker.start();
    if (world) {
        world.dispose();
        destroyDisplayTree(hud);
    }
    const c = newStoryCampaign();
    for (const task of STORY_TASKS.filter((t) => t.act === 1)) {
        c.story!.progress[task.id] = task.target;
        c.story!.claimed.push(task.id);
    }
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    travelStory(c, 'mars');
    grantStoryTasks(c, ['mars-asteroid-yard', 'mars-sector-secure']);
    syncStory(c);
    c.ship = newShip(1, 'swift');
    if (!parseCampaign(JSON.stringify(c))) throw Error('Invalid fixture');
    beginRun(c, 123);
    sim = new MissionSimulation(c, 123);
    world = new MissionWorld(sim, c.ship!, false);
    hud = new MissionHud(
        sim,
        c.contract,
        () => {},
        () => [],
        'QA KEPLER',
    );
    app.stage.addChild(world, hud);
    frame = 0;
    initial = 0;
    ending = false;
    spawned.clear();
    arrivals = 0;
    error = '';
}
function scan(site: number, attack = false) {
    setup();
    index = site;
    mode = attack ? 'attack' : 'scan';
    const p = MARS_ACT.research[site],
        e = sim.escort as MarsResearchEscort;
    sim.campaign.story!.mars.researchSites = site;
    sim.campaign.story!.mars.researchWaves = attack ? site : site + 1;
    e.resumeResearch(p);
    e.body.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    e.previous = { ...p };
    e.body.setLinvel({ x: 0, y: 0 }, true);
    e.state = 'research';
    sim.ship.setTranslation({ x: (p.x + 140) / 100, y: p.y / 100 }, true);
}
function button(name: string, action: () => void) {
    const b = document.createElement('button');
    b.textContent = name;
    b.onclick = action;
    document.querySelector('#controls')!.appendChild(b);
}
button('Scan I', () => scan(0));
button('Scan II', () => scan(1));
button('Scan III', () => scan(2));
button('Incoming III', () => scan(2, true));
button('Full route 4x', () => {
    setup();
    mode = 'route';
});
button('Stop', () => {
    app.ticker.stop();
    stats();
});
function stats() {
    const e = sim.escort as MarsResearchEscort,
        p = sim.campaign.story!.mars,
        heap = Math.round(((performance as any).memory?.usedJSHeapSize ?? 0) / 1048576);
    peakMB = Math.max(peakMB, heap);
    document.querySelector('#stats')!.textContent = JSON.stringify({
        mode,
        frame,
        seconds: Math.round(sim.elapsed),
        site: p.researchSites,
        waves: p.researchWaves,
        returned: p.researchReturned,
        state: e.state,
        scanning: e.scanning,
        progress: Math.round(e.researchProgress * 10) / 10,
        position: e.position,
        clearance: Math.round(marsAnomalyClearance(e.position, 'mars')),
        spawned: spawned.size,
        arrivals,
        status: sim.missionStatus,
        success: sim.campaign.story!.claimed.includes('mars-anomaly-research'),
        heapMB: heap,
        peakMB,
        maxUpdateMS: Math.round(maxMS),
        error,
    });
    if (heap > 700) {
        error = 'Memory guard';
        app.ticker.stop();
    }
}
window.addEventListener('error', (event) => {
    error = event.message;
    stats();
});
scan(0);
app.ticker.add(() => {
    const start = performance.now();
    try {
        const e = sim.escort as MarsResearchEscort,
            p = e.position;
        sim.hull = sim.maxHull;
        e.health = 140;
        sim.ship.setTranslation({ x: (p.x + 140) / 100, y: p.y / 100 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        if (mode === 'scan') e.researchProgress = 5;
        let input = idle;
        if (mode === 'route' && initial < 65) {
            input = { ...idle, interact: true, target: e.position };
            initial++;
        }
        world.update(mode === 'route' ? 1000 / 15 : 1000 / 60, input);
        hud.update(1000 / 60);
        for (const enemy of [...sim.enemies.enemies.values()])
            if (enemy.id >= 74010) {
                spawned.add(enemy.id);
                const q = enemyPosition(enemy);
                if (mode === 'route' && Math.hypot(q.x - e.position.x, q.y - e.position.y) < 580) {
                    arrivals++;
                    sim.enemies.remove(enemy.id);
                    sim.marsAct!.killed(enemy.id);
                }
            }
        frame++;
        maxMS = Math.max(maxMS, performance.now() - start);
        if (frame % 30 === 0) stats();
        if (sim.campaign.story!.mars.researchReturned && !ending) {
            ending = true;
            setTimeout(() => {
                world.update(0, idle);
                hud.update(200);
                app.render();
                stats();
                app.ticker.stop();
            }, 200);
        }
    } catch (err) {
        error = String(err);
        stats();
        app.ticker.stop();
    }
});
