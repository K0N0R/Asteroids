import { Core } from '../../frontend/core/core';
import { Assets } from 'pixi.js';
import RAPIER from '@dimforge/rapier2d-compat';
import { PopupContainer } from '../../frontend/core/containers/popup/popupContainer';
import { GameSettings } from '../../frontend/core/systems/gameSettings';
import {
    createDevelopmentAct,
    developmentControls,
    DEVELOPMENT_SAVE_KEY,
} from '../../frontend/game/state/development';
import { STORY_SAVE_KEY } from '../../frontend/game/state/story';
import { parseCampaign } from '../../frontend/game/state/campaign';
import { completeVenusTask, venusStationAction } from '../../frontend/game/state/venusActions';
import { VENUS_TASK_IDS } from '../../frontend/game/state/venusAct';
import { V } from '../../frontend/game/worlds/venusLayout';
const original = JSON.stringify(createDevelopmentAct('act-3')),
    store = new Map([[STORY_SAVE_KEY, original]]);
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
    },
});
GameSettings.soundEnabled = false;
await RAPIER.init();
for (const name of ['sound-enabled.png', 'sound-disabled.png']) {
    Assets.add({ alias: name, src: `/assets/${name}` });
    await Assets.load(name);
}
const core = new Core();
await core.init();
PopupContainer.instantiatePopups();
core.instantiateComponents();
const session: any = core.worldContainer.session;
let frames = 0,
    follow = false,
    stress = 0,
    stressTick = 0,
    error = '',
    peak = 0;
const samples: number[] = [];
function stats() {
    const s = session.mission?.simulation,
        c = session.campaign;
    const heap = (performance as any).memory?.usedJSHeapSize / 1048576;
    peak = Math.max(peak, heap || 0);
    document.querySelector('#qa-state')!.textContent = JSON.stringify({
        area: s?.venusAct?.area ?? 'lobby',
        frames,
        elapsed: s?.elapsed,
        direction: session.mission?.direction.phase,
        hud: session.hud?.visible,
        tasks: c.story.claimed.filter((id: string) => id.startsWith('venus-')),
        transmission: c.story.venus.transmission,
        probe: s?.escort?.state,
        guardian: s?.venusAct?.guardianPhase,
        enemies: s?.enemies.enemies.size,
        worlds: session.worldHost.children.length,
        valid: !!parseCampaign(JSON.stringify(c)),
        primaryUnchanged: store.get(STORY_SAVE_KEY) === original,
        heapMB: Math.round(heap),
        peakMB: Math.round(peak),
        resolutionSubscribers: core.app.renderer.runners.resolutionChange.items.length,
        stressRemaining: stress,
        stressSamples: samples,
        error,
    });
}
function button(name: string, action: () => void) {
    const b = document.createElement('button');
    b.textContent = name;
    b.onclick = () => {
        try {
            action();
            stats();
        } catch (e) {
            error = String(e);
            stats();
            throw e;
        }
    };
    document.querySelector('#qa-controls')!.appendChild(b);
}
function prepare(stage: number) {
    follow = false;
    developmentControls.actions!.startAct('act-3');
    const c = session.campaign;
    for (const id of VENUS_TASK_IDS.slice(0, stage)) completeVenusTask(c, id);
    session.saves.save(c);
}
function launch(
    area: 'orbit' | 'station' | 'atmosphere' | 'installation',
    p: { x: number; y: number },
) {
    session.launch();
    session.mission.direction.launchTime = 1.8;
    const s = session.mission.simulation;
    s.venusAct.area = area;
    s.areaRevision++;
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
    s.previous = p;
    s.hull = s.maxHull;
}
button('Nowy akt III', () => prepare(0));
button('Orbita', () => {
    prepare(0);
    launch('orbit', { x: V.relay.x - 200, y: V.relay.y + 100 });
});
button('Martwe laboratorium', () => {
    prepare(1);
    launch('station', { x: 20000, y: -100 });
});
button('Sonda i atmosfera', () => {
    prepare(2);
    venusStationAction(session.campaign, 'venus-probe-build');
    launch('atmosphere', { x: 40150, y: -350 });
    const s = session.mission.simulation,
        e = s.escort;
    e.body.setTranslation({ x: 400, y: -3.5 }, true);
    e.previous = e.position;
    e.resumeResearch(V.scan);
    s.venusAct.probeStarted = true;
    s.venusAct.probeStage = 'atmosphere';
    follow = true;
});
button('Strażnik', () => {
    prepare(4);
    launch('installation', { x: V.guardian.x, y: V.guardian.y + 250 });
    const s = session.mission.simulation;
    s.venusAct.activate('venus:terminal');
});
button('Warsztat: sonda', () => {
    prepare(2);
    session.lobby.go('workshop');
});
button('Laboratorium: analiza', () => {
    prepare(3);
    session.lobby.go('laboratory');
});
button('10 resetów', () => {
    stress = 10;
    stressTick = 0;
    samples.length = 0;
});
button('ESC', () => PopupContainer.show('configuration'));
button('Przechwyć drony (QA)', () => {
    const s = session.mission?.simulation;
    if (s)
        for (const id of [...s.enemies.enemies.keys()] as number[])
            if (id >= 81200 && id < 81900) s.enemies.remove(id);
});
button('Inspekcja', stats);
window.addEventListener('error', (e) => {
    error = e.message;
    stats();
});
core.app.ticker.add(() => {
    const s = session.mission?.simulation;
    if (s) {
        s.hull = s.maxHull;
        if (s.escort) s.escort.health = 140;
    }
    if (follow && s?.escort) {
        const p = s.escort.position;
        s.ship.setTranslation({ x: (p.x + 180) / 100, y: p.y / 100 }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
    }
    if (stress && ++stressTick % 3 === 0) {
        const stage = stress % 4;
        prepare(stage === 3 ? 4 : stage);
        launch(
            stage === 3
                ? 'installation'
                : stage === 1
                  ? 'station'
                  : stage === 2
                    ? 'atmosphere'
                    : 'orbit',
            stage === 3 ? V.terminal : stage === 1 ? V.power : stage === 2 ? V.scan : V.relay,
        );
        stress--;
        samples.push(Math.round((performance as any).memory?.usedJSHeapSize / 1048576));
    }
    if (++frames % 5 === 0) stats();
});
stats();
