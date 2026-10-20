import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dialogueTick } from '../frontend/game/systems/audio';
import { SoundManager } from '../frontend/core/systems/soundManager';
import { GameSettings } from '../frontend/core/systems/gameSettings';

test('speech ticks are quiet, throttled and obey master/effects switches and volume', () => {
    const originalPlay = SoundManager.play,
        originalDuration = SoundManager.getMinDurationFromStart;
    const settings = [
        GameSettings.soundEnabled,
        GameSettings.effectsEnabled,
        GameSettings.effectsVolume,
    ] as const;
    const calls: { volume?: number; group?: string }[] = [];
    let elapsed = Infinity;
    SoundManager.play = (config) => {
        calls.push(config);
        return undefined;
    };
    SoundManager.getMinDurationFromStart = () => elapsed;
    try {
        GameSettings.soundEnabled = true;
        GameSettings.effectsEnabled = true;
        GameSettings.effectsVolume = 1;
        dialogueTick();
        assert.equal(calls.length, 1);
        assert.equal(calls[0].group, 'interface');
        assert.ok(calls[0].volume! <= 0.03);
        elapsed = 60;
        dialogueTick();
        assert.equal(calls.length, 1);
        elapsed = Infinity;
        GameSettings.soundEnabled = false;
        dialogueTick();
        GameSettings.soundEnabled = true;
        GameSettings.effectsEnabled = false;
        dialogueTick();
        GameSettings.effectsEnabled = true;
        GameSettings.effectsVolume = 0;
        dialogueTick();
        assert.equal(calls.length, 1);
    } finally {
        SoundManager.play = originalPlay;
        SoundManager.getMinDurationFromStart = originalDuration;
        [GameSettings.soundEnabled, GameSettings.effectsEnabled, GameSettings.effectsVolume] =
            settings;
    }
});
