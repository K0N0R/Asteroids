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
import { V, VENUS_MAPS } from '../../frontend/game/worlds/venusLayout';
import { VenusFlightPilot } from '../venus-flight-pilot';
import { clear } from '../../frontend/game/ui/primitives';
import { InputHandler } from '../../frontend/core/systems/inputHandler';
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
(window as any).devApi = { core };
await core.init();
InputHandler.init();
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
let pilot: VenusFlightPilot | null = null;
let pilotWorld: any = null;
let pilotDone = false;
let pilotSorties = 0;
let slowTransfer = false;
let transferFrame: number | null = null;
function stats() {
    const s = session.mission?.simulation,
        c = session.campaign;
    const heap = (performance as any).memory?.usedJSHeapSize / 1048576;
    const planet = core.background
        .getChildByLabel('celestial-layer')
        ?.getChildByLabel('celestial-venus');
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
        atmosphericTransfer: s?.venusAct?.transfer,
        planet: planet
            ? {
                  uid: planet.uid,
                  x: planet.x,
                  y: planet.y,
                  scale: planet.scale.x,
                  visible: planet.visible,
              }
            : null,
        atmosphere: core.background.getChildByLabel('venus-cloud-deck')?.alpha,
        slowTransfer,
        transferFrame,
        dialogue: session.dialogue
            ? {
                  id: session.dialogue.definition.id,
                  index: session.dialogue.index,
                  typing: session.dialogue.typing,
              }
            : null,
        canvas: { width: core.app.canvas.width, height: core.app.canvas.height },
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
        pilot: pilot?.phase,
        pilotDone,
        pilotSorties,
        pilotMinHull: pilot?.minHull,
        pilotHistory: pilot?.history,
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
    transferFrame = null;
    slowTransfer = false;
    core.timeScale = 1;
    pilot = null;
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
button('Pełny przelot aktu (QA)', () => {
    pilot = null;
    prepare(0);
    pilot = new VenusFlightPilot();
    pilotWorld = null;
    pilotDone = false;
    pilotSorties = 0;
    session.launch();
});
button('Orbita', () => {
    prepare(0);
    launch('orbit', { x: V.relay.x - 200, y: V.relay.y + 100 });
});
button('Martwe laboratorium', () => {
    prepare(1);
    launch('station', {
        x: VENUS_MAPS.station.center.x + 250,
        y: VENUS_MAPS.station.center.y - 220,
    });
});
button('Konsola zasilania', () => {
    prepare(1);
    launch('station', { x: V.power.x, y: V.power.y - 90 });
});
button('Sonda i atmosfera', () => {
    prepare(2);
    venusStationAction(session.campaign, 'venus-probe-build');
    launch('atmosphere', { x: V.scan.x + 200, y: V.scan.y });
    const s = session.mission.simulation,
        e = s.escort;
    e.launch();
    e.enterAtmosphere(session.campaign.story.venus.transmission);
    e.body.setTranslation({ x: e.destination.x / 100, y: e.destination.y / 100 }, true);
    e.previous = e.position;
    follow = true;
});
button('Podejście do Wenus', () => {
    prepare(2);
    venusStationAction(session.campaign, 'venus-probe-build');
    launch('orbit', { x: V.atmosphereApproach.x + 90, y: V.atmosphereApproach.y });
    const e = session.mission.simulation.escort;
    e.launch();
    e.state = 'complete';
    e.body.setTranslation(
        { x: V.atmosphereApproach.x / 100, y: V.atmosphereApproach.y / 100 },
        true,
    );
    e.previous = e.position;
});
button('Wznoszenie z Wenus', () => {
    prepare(2);
    venusStationAction(session.campaign, 'venus-probe-build');
    launch('atmosphere', { ...V.atmosphereAscent });
});
button('Zwolnij transfer (QA)', () => {
    slowTransfer = !slowTransfer;
});
for (const descending of [true, false])
    for (const progress of [0, 0.25, 0.5, 0.75, 1])
        button(`${descending ? 'Zejście' : 'Wznoszenie'} ${progress * 100}%`, () => {
            if (
                !session.mission?.simulation.venusAct.transfer ||
                session.mission.simulation.venusAct.transfer.descending !== descending
            ) {
                prepare(2);
                venusStationAction(session.campaign, 'venus-probe-build');
                const point = descending ? V.atmosphereApproach : V.atmosphereAscent;
                launch(descending ? 'orbit' : 'atmosphere', { x: point.x + 90, y: point.y });
                const s = session.mission.simulation,
                    e = s.escort;
                e.launch();
                if (!descending) e.enterAtmosphere(0);
                e.state = descending ? 'complete' : 'travel';
                e.body.setTranslation({ x: point.x / 100, y: point.y / 100 }, true);
                e.previous = e.position;
                s.venusAct.activate(descending ? 'venus:descend' : 'venus:ascend');
            }
            transferFrame = progress;
            session.mission.simulation.venusAct.transfer.elapsed = progress * 5;
            core.timeScale = 0;
        });
button('Resize 20× (QA)', () => {
    for (let i = 0; i < 20; i++)
        window.setTimeout(() => {
            (core as any).viewport.request(1920, i % 2 ? 911 : 1080, 1);
        }, i * 200);
    window.setTimeout(() => {
        (core as any).queueViewport();
    }, 4200);
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
button('Utrata WebGL (QA)', () => {
    const extension = (core.app.renderer as any).gl.getExtension('WEBGL_lose_context');
    extension?.loseContext();
    window.setTimeout(() => extension?.restoreContext(), 1000);
});
button('Ukryj pasek QA', () => {
    for (const id of ['qa-controls', 'qa-state'])
        (document.getElementById(id) as HTMLElement).style.display = 'none';
});
window.addEventListener('error', (e) => {
    error = e.message;
    stats();
});
core.app.ticker.add(() => {
    core.timeScale =
        transferFrame !== null
            ? 0
            : slowTransfer && session.mission?.simulation.venusAct?.transfer
              ? 0.25
              : 1;
    if (pilot && !pilotDone) {
        const world = session.mission;
        if (world && world !== pilotWorld) {
            pilotWorld = world;
            const step = world.simulation.step.bind(world.simulation);
            world.simulation.step = () => step(pilot!.next(world.simulation));
            const update = world.update.bind(world);
            world.update = (ms: number, input: any) => update(ms * 6, input);
        } else if (!world && pilotWorld) {
            if (pilotWorld.simulation.ended !== 'returned') {
                error = 'Pełny przelot: statek utracony';
                pilotDone = true;
            } else {
                pilotSorties++;
                clear(session.overlay);
                session.hasOverlay = false;
                const c = session.campaign;
                if (c.story.claimed.includes('venus-mercury-signal')) pilotDone = true;
                else {
                    venusStationAction(
                        c,
                        c.story.venus.probeBuilt ? 'venus-analyse' : 'venus-probe-build',
                    );
                    session.launch();
                }
            }
        }
    }
    const s = session.mission?.simulation;
    if (s && !pilot) {
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
