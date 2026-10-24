import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Ticker } from 'pixi.js';

test('consecutive slow frames advance gameplay, UI and scenery with bounded simulation time', async () => {
    const previous = globalThis.window;
    globalThis.window = { innerWidth: 1600, innerHeight: 900 } as never;
    const { Core } = await import('../frontend/core/core');
    const { GameState } = await import('../frontend/core/systems/gameState');
    const { UiTime, WorldTime } = await import('../frontend/core/systems/time');
    const originalState = GameState.state;
    const uiStart = UiTime.timeCounterMS,
        worldStart = WorldTime.timeCounterMS;
    const frames = {
        ui: [] as number[],
        popup: [] as number[],
        world: [] as number[],
        background: [] as number[],
    };
    try {
        const core = new Core();
        core.uiContainer = { update: (dt: number) => frames.ui.push(dt) } as never;
        core.popupContainer = { update: (dt: number) => frames.popup.push(dt) } as never;
        core.worldContainer = { update: (dt: number) => frames.world.push(dt) } as never;
        core.background = { update: (dt: number) => frames.background.push(dt) } as never;
        GameState.state = 'gameplay';
        for (const deltaMS of [150, 250, 1000, 16]) core.update({ deltaMS } as Ticker);
        for (const steps of Object.values(frames)) assert.deepEqual(steps, [100, 100, 100, 16]);
        assert.equal(UiTime.timeCounterMS - uiStart, 316);
        assert.equal(WorldTime.timeCounterMS - worldStart, 316);
    } finally {
        GameState.state = originalState;
        UiTime.timeCounterMS = uiStart;
        WorldTime.timeCounterMS = worldStart;
        globalThis.window = previous;
    }
});
