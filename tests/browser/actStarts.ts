import { Core } from '../../frontend/core/core';
import { Assets } from 'pixi.js';
import RAPIER from '@dimforge/rapier2d-compat';
import { PopupContainer } from '../../frontend/core/containers/popup/popupContainer';
import { GameSettings } from '../../frontend/core/systems/gameSettings';
import {
    createDevelopmentAct,
    developmentControls,
    DEVELOPMENT_SAVE_KEY,
    DEVELOPMENT_MODE_KEY,
} from '../../frontend/game/state/development';
import { STORY_SAVE_KEY, syncStory } from '../../frontend/game/state/story';
import { parseCampaign } from '../../frontend/game/state/campaign';
// All reads and writes stay in this page's memory. Never use the player's storage.
const primary = JSON.stringify(createDevelopmentAct('act-10')),
    values = new Map<string, string>([[STORY_SAVE_KEY, primary]]);
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
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
let frame = 0,
    error = '';
function stats() {
    const c = session.campaign,
        p = c.story;
    document.querySelector('#qa-state')!.textContent = JSON.stringify({
        test: values.get(DEVELOPMENT_MODE_KEY) === 'true',
        start: developmentControls.actions!.currentStart(),
        sector: p?.sector,
        lab: c.station.laboratoryLevel,
        workshop: c.station.workshopLevel,
        ship: c.ship?.hull,
        shield: c.station.shield,
        extraction: c.station.extraction,
        scan: p?.mars.researchSites,
        landing: p?.mars.landingBlocked,
        radio: p?.radio?.pending.length ?? 0,
        normalUnchanged: values.get(STORY_SAVE_KEY) === primary,
        validTest:
            !values.get(DEVELOPMENT_SAVE_KEY) || !!parseCampaign(values.get(DEVELOPMENT_SAVE_KEY)!),
        mission: !!session.mission,
        dialogue: session.dialogue?.definition.id ?? null,
        overlay: session.hasOverlay,
        error,
    });
}
function button(name: string, action: () => void) {
    const b = document.createElement('button');
    b.textContent = name;
    b.onclick = action;
    document.querySelector('#qa-controls')!.appendChild(b);
}
button('Open ESC menu', () => {
    PopupContainer.show('configuration');
    stats();
});
button('Dirty Mars progress', () => {
    const c = session.campaign;
    c.station.shield = true;
    c.story.mars.landingBlocked = true;
    c.story.mars.researchSites = 2;
    c.story.mars.researchWaves = 2;
    c.story.radio = {
        pending: [{ speaker: 'science', text: 'Old queued objective' }],
        acknowledged: [],
    };
    syncStory(c);
    session.saves.save(c);
    stats();
});
button('Launch mission', () => {
    PopupContainer.hide('configuration');
    session.launch();
    stats();
});
button('Inspect', stats);
window.addEventListener('error', (e) => {
    error = e.message;
    stats();
});
core.app.ticker.add(() => {
    if (++frame % 30 === 0) stats();
});
PopupContainer.show('configuration');
stats();
