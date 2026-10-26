import * as PIXI from 'pixi.js';
import { WorldContainer } from '@world/worldContainer';
import { PopupContainer } from '@popup/popupContainer';
import { GameState } from '@systems/gameState';
import { CoreConfig } from '@config/coreConfig';
import { UiContainer } from '@ui/uiContainer';
import { UiTime, WorldTime } from '@systems/time';
import { EffectsManager } from '@systems/effectManager';
import { Bus } from '@systems/bus';
import { Background } from '@entities/background';
import { FrameDiagnostics } from './systems/frameDiagnostics';
import { bindRenderContextRecovery } from './systems/renderContextRecovery';
import { InputHandler } from './systems/inputHandler';
import { StableViewportResize } from './systems/stableViewportResize';

export class Core {
    app!: PIXI.Application;

    timeScale = 1;
    private viewport!: StableViewportResize;
    private contextLost = false;
    private queueViewport = () => {
        this.viewport.suspend(this.contextLost || document.hidden);
        this.viewport.request(
            window.innerWidth,
            window.innerHeight,
            Math.min(window.devicePixelRatio || 1, 2),
        );
    };
    background!: Background;
    worldContainer!: WorldContainer;

    uiContainer!: UiContainer;
    popupContainer!: PopupContainer;
    scalableContainers: PIXI.Container[] = [];

    update(ticker: PIXI.Ticker) {
        FrameDiagnostics.frame();
        // Slow frames must still advance the game; dropping them can lock a busy scene forever.
        const deltaMS = Math.max(0, Math.min(100, ticker.deltaMS));
        UiTime.update(deltaMS);
        EffectsManager.updateUi(deltaMS);
        this.uiContainer?.update(deltaMS);
        this.popupContainer.update(deltaMS);

        if (GameState.state === 'initialization') {
        } else {
            const scaledDeltaMS = deltaMS * this.timeScale;

            if (!PopupContainer.hasActivePopup()) {
                WorldTime.update(scaledDeltaMS);
                EffectsManager.updateGameplay(scaledDeltaMS);
            }
            this.worldContainer?.update(scaledDeltaMS);
        }
        this.background.update(deltaMS);
    }

    async init() {
        await this.instantiateApp();
        this.watchContainersForResize();
        this.instantiateInitialComponents();
        this.app.ticker.add(this.update.bind(this));
        this.bindEvents();
    }

    async instantiateApp() {
        this.app = new PIXI.Application();
        await this.app.init({
            backgroundColor: 0x000000,
            antialias: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2),
            autoDensity: true,
        });
        this.viewport = new StableViewportResize(({ width, height, resolution }) => {
            // Ticker owns rendering. Pixi's default ResizePlugin calls render() immediately,
            // including when the GPU context is suspended or a transient resize is undone.
            this.app.renderer.resize(width, height, resolution);
        });
        window.addEventListener('resize', this.queueViewport);
        document.addEventListener('visibilitychange', this.queueViewport);

        this.app.canvas.addEventListener('contextmenu', (evt) => evt.preventDefault());
        bindRenderContextRecovery(this.app, {
            clearInput: () => InputHandler.clear(),
            lost: () => {
                this.contextLost = true;
                this.viewport.suspend(true);
                Bus.emit('system', { name: 'render-context-lost' });
            },
            restored: () => {
                this.contextLost = false;
                this.queueViewport();
                this.viewport.flush();
                Bus.emit('system', { name: 'render-context-restored' });
            },
        });
        document.body.appendChild(this.app.canvas);
    }

    private instantiateInitialComponents() {
        this.background = new Background();
        PopupContainer.createInstance();
        this.popupContainer = PopupContainer.instance;
        InputHandler.bindUiContainer(this.popupContainer);
        this.app.stage.addChild(this.background, PopupContainer.instance);
        this.scalableContainers.push(this.background, PopupContainer.instance);
        this.triggerResize();
    }

    public instantiateComponents() {
        this.uiContainer = new UiContainer();
        InputHandler.bindUiContainer(this.uiContainer);
        this.worldContainer = new WorldContainer();
        this.app.stage.addChild(this.worldContainer, this.uiContainer);
        this.app.stage.addChild(this.popupContainer);
        this.scalableContainers.push(this.uiContainer, this.worldContainer);
        this.triggerResize();
        this.worldContainer.start(this.uiContainer, this.background);
    }

    private watchContainersForResize() {
        this.app.renderer.on('resize', (width, height) => {
            Bus.emit('input', { name: 'resize', data: { width, height } });
            this.scalableContainers.forEach((scalable) => {
                this.calculateObjectRatio(scalable, width, height);
            });
        });
    }

    private triggerResize() {
        this.queueViewport();
        this.viewport.flush();
        // Newly mounted containers need layout even when the backing size stays unchanged.
        for (const object of this.scalableContainers)
            this.calculateObjectRatio(object, this.app.screen.width, this.app.screen.height);
    }

    bindEvents() {
        Bus.subscribe(
            'system',
            (message) => {
                switch (message.name) {
                    case 'time-scale': {
                        EffectsManager.value(this, {
                            value: message.data.timeScale,
                            fieldName: 'timeScale',
                            durationMS: 500,
                        });
                    }
                }
            },
            this,
        );
    }

    calculateObjectRatio(object: PIXI.Container, width: number, height: number) {
        const targetRatio = CoreConfig.ratio.y / CoreConfig.ratio.x;
        const windowRatio = height / width;

        if (windowRatio > targetRatio) {
            const scale = width / CoreConfig.width;
            object.scale.set(scale);
            object.x = 0;
            object.y = (height - CoreConfig.height * scale) / 2;
        } else {
            const scale = height / CoreConfig.height;
            object.scale.set(scale);
            object.y = 0;
            object.x = (width - CoreConfig.width * scale) / 2;
        }
    }
}
