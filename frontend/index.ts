import * as PIXI from 'pixi.js';
import { SoundManager } from '@systems/soundManager';
import { GameSettings } from '@systems/gameSettings';
import { InputHandler } from '@systems/inputHandler';
import { MusicManager } from '@systems/musicManager';
import { PopupContainer } from '@popup/popupContainer';
import { GameState } from '@systems/gameState';

import { Core } from './core/core';
import { preload } from './core/preload';
import { prepreload } from './core/prepreload';
import RAPIER from '@dimforge/rapier2d-compat';

const init = async () => {
    const core = new Core();

    if (DEBUG) {
        console.log('debug build');
        (window as any).devApi = {
            PIXI,
            Assets: PIXI.Assets,
            SoundManager,
            core,
            textures: () => Object.fromEntries((PIXI.Assets.cache as any)._cache.entries()),
        };
    } else {
        console.log('production build');
    }
    GameSettings.init();
    InputHandler.init();
    SoundManager.init();
    MusicManager.init();
    await prepreload();
    await core.init();
    globalThis.__PIXI_APP__ = core.app; // for pixi chrome plugin to work, can be behind DEBUG flag
    PopupContainer.showLoader();
    await Promise.all([preload(), RAPIER.init()]);
    core.instantiateComponents();
    PopupContainer.instantiatePopups();
    PopupContainer.hideLoader();
    GameState.goToLobby();
};
init().catch((error) => {
    console.error(error);
    document.body.textContent =
        'Nie udało się uruchomić Asteroids. Odśwież stronę, aby spróbować ponownie.';
});
