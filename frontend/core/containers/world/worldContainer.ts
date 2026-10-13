import * as PIXI from 'pixi.js';
import { GameSession } from '../../../game/session';
import { Background } from '../entities/background';
import { UiContainer } from '../ui/uiContainer';

export class WorldContainer extends PIXI.Container {
    session!: GameSession;
    constructor() {
        super();
        this.sortableChildren = true;
    }

    start(ui: UiContainer, background: Background) {
        this.session = new GameSession(this, ui, background);
    }
    update(deltaMS: number) {
        this.session?.update(deltaMS);
    }
}
