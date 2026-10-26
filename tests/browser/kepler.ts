// Isolated visual QA; campaign and crash reports are kept in memory.
import { Application, Container, Graphics, Text } from 'pixi.js';
import RAPIER from '@dimforge/rapier2d-compat';
import { createDevelopmentAct } from '../../frontend/game/state/development';
import { beginRun } from '../../frontend/game/state/campaign';
import { grantStoryTasks } from '../fleet-fixtures';
import { MissionSimulation } from '../../frontend/game/systems/mission';
import { MissionWorld } from '../../frontend/game/worlds/missionWorld';
import { GameSettings } from '../../frontend/core/systems/gameSettings';
import { bindRenderContextRecovery } from '../../frontend/core/systems/renderContextRecovery';
import { WEBGL_REPORT_KEY } from '../../frontend/core/systems/renderContextDiagnostics';

const storage = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
    },
});
GameSettings.soundEnabled = false;
await RAPIER.init();
const app = new Application();
await app.init({ width: 1600, height: 900, background: 0x10152b, antialias: true, resolution: 1 });
app.canvas.style.width = '100%';
app.canvas.style.height = 'auto';
document.querySelector('#stage')!.append(app.canvas);
const c = createDevelopmentAct('act-2');
grantStoryTasks(c, ['mars-sector-secure']);
beginRun(c, 123);
const s = new MissionSimulation(c, 123);
for (const r of s.rocks.values()) s.world.removeRigidBody(r.body);
s.rocks.clear();
s.enemies.dispose();
c.story!.mars.researchWaves = 4;
const world = new MissionWorld(s, c.ship!, false);
app.stage.addChild(world);
const label = new Text({ text: '', style: { fill: 0x8fead2, fontSize: 25, fontFamily: 'Arial' } });
label.position.set(32, 30);
app.stage.addChild(label);
const e = s.escort!;
const state = document.querySelector('#stats')!;
let mode = 'flight',
    frozen = false,
    frame = 0,
    losses = 0,
    restores = 0,
    welds = 0;
function button(name: string, action: () => void) {
    const b = document.createElement('button');
    b.textContent = name;
    b.onclick = action;
    document.querySelector('#controls')!.append(b);
}
function scene(repair = false) {
    mode = repair ? 'repair' : 'flight';
    frozen = false;
    welds = 0;
    e.body.setTranslation({ x: 8, y: -12 }, true);
    e.body.setLinvel({ x: 0, y: 0 }, true);
    e.previous = e.position;
    e.previousAngle = 0;
    e.body.setRotation(0, true);
    e.resumeResearch({ x: 1400, y: -1200 });
    e.health = repair ? 40 : 140;
    e.repairProgress = 0;
    e.repairWaiting = false;
    e.cooldown = 0;
}
button('Lot Keplera', () => scene());
button('Naprawa Keplera', () => scene(true));
button('Dokończ naprawę', () => {
    mode = 'finish';
    frozen = false;
});
const ext = (app.renderer as unknown as { gl: WebGLRenderingContext }).gl.getExtension(
    'WEBGL_lose_context',
)!;
button('Test utraty WebGL', () => {
    ext.loseContext();
    setTimeout(() => ext.restoreContext(), 1000);
});
bindRenderContextRecovery(app, {
    lost: () => losses++,
    restored: () => {
        restores++;
        setTimeout(() => {
            const report = JSON.parse(storage.get(WEBGL_REPORT_KEY) ?? 'null');
            const sample = report?.recentSamples?.at(-1)?.data;
            const pass =
                report?.restored &&
                report.gpu.renderer &&
                sample?.details[0]?.mission &&
                sample?.textures?.count > 0;
            state.textContent = `${pass ? 'PASS' : 'FAIL'}: rzeczywista utrata i odzyskanie WebGL; ${JSON.stringify({ losses, restores, samples: report?.recentSamples?.length, textures: sample?.textures?.count, mission: sample?.details[0]?.mission })}`;
        }, 0);
    },
});
scene();
app.ticker.add(() => {
    frame++;
    if (!frozen) {
        const p = e.position;
        s.ship.setTranslation({ x: (p.x - 220) / 100, y: (p.y + 160) / 100 }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        world.update(1000 / 60, {
            target: p,
            fire: false,
            interact: false,
            thrust: false,
            brake: false,
        });
        const diagnostics = world.renderDiagnostics();
        welds += diagnostics.objects.particles > 0 ? 1 : 0;
        if (mode === 'repair' && e.repairProgress >= 2.5) frozen = true;
        if (mode === 'finish' && e.repairs > 0) frozen = true;
        if (mode === 'flight' && e.state === 'research') scene();
    }
    label.text =
        mode === 'flight'
            ? 'Kepler · silniki podczas lotu'
            : `Kepler · naprawa ${e.repairProgress.toFixed(1)}/5 s · ${e.health.toFixed(0)}/140 HP`;
    if (frame % 30 === 0 && !restores)
        state.textContent = JSON.stringify({
            mode,
            thrusting: e.thrusting,
            health: e.health,
            repair: e.repairProgress,
            repairs: e.repairs,
            framesWithParticles: welds,
            frozen,
        });
});
// Retained static nodes also participate in the recovery check.
const hidden = new Container();
hidden.visible = false;
hidden.addChild(new Graphics().circle(0, 0, 1).fill(0xffffff));
app.stage.addChild(hidden);
