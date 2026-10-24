// Isolated browser QA: no storage access, immortal ship, scripted camera path and real combat/rendering.
// Build with node scripts/qa-stability.mjs after starting the development server.
import { destroyDisplayTree } from '../../frontend/core/systems/destroyDisplayTree';
import { Application } from 'pixi.js';
import RAPIER from '@dimforge/rapier2d-compat';
import { newStoryCampaign, newShip, beginRun } from '../../frontend/game/state/campaign';
import { grantStoryTasks } from '../fleet-fixtures';
import { MissionSimulation } from '../../frontend/game/systems/mission';
import { MissionWorld } from '../../frontend/game/worlds/missionWorld';
import { MissionHud } from '../../frontend/game/ui/hud';
import { GameSettings } from '../../frontend/core/systems/gameSettings';
import { bindRenderContextRecovery } from '../../frontend/core/systems/renderContextRecovery';
import { anomalyCanvasStats } from '../../frontend/game/graphics/anomalyCloudView';
import { PHOBOS_MAZE_ROUTE } from '../../frontend/game/worlds/phobosMaze';
import { MARS_GATES } from '../../frontend/game/worlds/marsLayout';
import { enemyPosition } from '../../frontend/game/systems/enemies';
GameSettings.soundEnabled = false;
await RAPIER.init();
const app = new Application();
await app.init({ width: 1600, height: 900, background: 0x10152b, resolution: 1, antialias: true });
document.querySelector('#stage')!.appendChild(app.canvas);
(document.querySelector('#stage') as HTMLElement).style.transform = `scale(${innerWidth / 1600})`;
let c,
    s: MissionSimulation,
    world: MissionWorld,
    hud: MissionHud,
    frame = 0,
    lap = 0,
    peak = 0,
    error = '',
    lost = 0,
    restored = 0,
    running = false,
    segment = 0,
    t = 0,
    fight = 0,
    maxFrame = 0,
    restarts = 0;
const route = [
    ...PHOBOS_MAZE_ROUTE,
    { ...MARS_GATES.phobosArrival, jump: true, orbit: 'phobos' },
    { x: 30500, y: 600, orbit: 'phobos' },
    { ...MARS_GATES.asteroidArrival, jump: true, orbit: 'asteroid', fight: true },
    { ...MARS_GATES.phobosArrival, jump: true, orbit: 'phobos' },
    { ...PHOBOS_MAZE_ROUTE.at(-1)!, jump: true, orbit: 'mars' },
    ...PHOBOS_MAZE_ROUTE.slice().reverse(),
].map((p) => ({ ...p })) as any[];
function button(name: string, act: () => void) {
    const b = document.createElement('button');
    b.textContent = name;
    b.onclick = act;
    document.querySelector('#controls')!.appendChild(b);
}
function setup() {
    app.ticker.start();
    if (world) {
        world.dispose();
        destroyDisplayTree(hud);
        restarts++;
    }
    c = newStoryCampaign();
    grantStoryTasks(c, ['mars-ai-discovery']);
    c.story!.sector = 'mars';
    c.ship = newShip(1, 'phoenix');
    beginRun(c, 123);
    s = new MissionSimulation(c, 123);
    world = new MissionWorld(s, c.ship!, false);
    hud = new MissionHud(s, 0);
    app.stage.addChild(world, hud);
    segment = 0;
    t = 0;
    fight = 0;
}
function stats() {
    const r: any = app.renderer,
        m = (performance as any).memory,
        heap = m ? Math.round(m.usedJSHeapSize / 1048576) : 0;
    peak = Math.max(peak, heap);
    document.querySelector('#stats')!.textContent = JSON.stringify({
        lap,
        running,
        segment,
        segments: route.length,
        frame,
        elapsed: s?.elapsed,
        heapMB: heap,
        peakHeapMB: peak,
        anomaly: anomalyCanvasStats(),
        gpuTextures: Object.values(r.texture?._glTextures ?? {}).filter(Boolean).length,
        graphics: Object.values(r.graphicsContext?._gpuContextHash ?? {}).filter(Boolean).length,
        resolutionListeners: r.runners.resolutionChange.items.length,
        lost,
        restored,
        restarts,
        maxFrameMS: Math.round(maxFrame),
        area: s?.area,
        orbit: s?.marsOrbit,
        dockable: s?.dockable,
        progress: s?.interactionProgress,
        ended: s?.ended,
        notice: s?.notice,
        error,
    });
    if (heap > 700) {
        running = false;
        error = 'memory guard >700MB';
        app.ticker.stop();
    }
}
setup();
bindRenderContextRecovery(app, {
    lost: () => {
        lost++;
        stats();
    },
    restored: () => {
        restored++;
        stats();
    },
});
const gl = (app.renderer as any).gl,
    ext = gl.getExtension('WEBGL_lose_context');
button('Trzy przebiegi trasy', () => {
    running = true;
    lap = 0;
    segment = 0;
    t = 0;
});
button('Utrata WebGL', () => {
    ext.loseContext();
});
button('Restore WebGL', () => {
    ext.restoreContext();
});
button('Stop', () => {
    running = false;
    stats();
});
button('Restart sceny', () => {
    running = false;
    setup();
});
button('Dok F', () => {
    running = false;
    for (const id of [...s.enemies.enemies.keys()]) s.enemies.remove(id);
    s.area = 'orbit';
    s.marsOrbit = 'mars';
    s.ship.setTranslation({ x: 0, y: -1.2 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
    for (let i = 0; i < 30; i++) {
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        world.update(1000 / 60, {
            target: { x: 0, y: 0 },
            thrust: false,
            brake: false,
            fire: false,
            interact: true,
        });
    }
    hud.update(16);
    app.render();
    app.ticker.stop();
    stats();
});
button('10 restarts', async () => {
    running = false;
    for (let i = 0; i < 10; i++) {
        setup();
        s.marsOrbit = 'mars';
        s.ship.setTranslation({ x: 65, y: -42 }, true);
        await new Promise((r) => setTimeout(r, 1500));
        stats();
        if (error) break;
    }
});
button('Anomalia', () => {
    running = false;
    s.marsOrbit = 'mars';
    s.ship.setTranslation({ x: 65, y: -42 }, true);
    app.ticker.start();
});
window.addEventListener('error', (e) => {
    error = e.message;
    stats();
});
app.ticker.add((tick) => {
    const start = performance.now();
    try {
        const dt = Math.min(33, tick.deltaMS) / 1000;
        s.hull = s.maxHull;
        let fire = false,
            target = { x: s.position.x + 500, y: s.position.y };
        if (running) {
            const p = route[segment];
            if (p.orbit) s.marsOrbit = p.orbit;
            if (p.jump) {
                s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
                t = 1;
            } else {
                const a = segment ? route[segment - 1] : route[0];
                t += (dt * 3000) / Math.max(1, Math.hypot(p.x - a.x, p.y - a.y));
                const f = Math.min(1, t);
                s.ship.setTranslation(
                    { x: (a.x + (p.x - a.x) * f) / 100, y: (a.y + (p.y - a.y) * f) / 100 },
                    true,
                );
            }
            s.ship.setLinvel({ x: 0, y: 0 }, true);
            if (p.fight) {
                fight += dt;
                fire = true;
                const e = [...s.enemies.enemies.values()].find((e) => e.body.isEnabled());
                if (e) {
                    target = enemyPosition(e);
                    s.ship.setRotation(
                        Math.atan2(target.y - s.position.y, target.x - s.position.x),
                        true,
                    );
                }
                if (fight < 4) t = 0;
            }
            if (t >= 1) {
                segment++;
                t = 0;
                fight = 0;
                if (segment >= route.length) {
                    lap++;
                    segment = 0;
                    if (lap === 3) running = false;
                }
            }
        }
        world.update(1000 / 60, {
            target,
            thrust: false,
            brake: false,
            fire,
            mine: fire,
            interact: false,
        });
        hud.update(1000 / 60);
        frame++;
        maxFrame = Math.max(maxFrame, performance.now() - start);
        if (frame % 30 === 0) stats();
    } catch (e) {
        error = String(e);
        running = false;
        stats();
    }
});
