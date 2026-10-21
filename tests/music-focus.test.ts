import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LoopingTheme, type MusicElement } from '../frontend/core/systems/musicManager';

class Track implements MusicElement {
    loop = false;
    volume = 0;
    paused = true;
    currentTime = 123;
    plays = 0;
    reject = false;
    async play() {
        this.plays++;
        if (this.reject) throw new Error('Autoplay');
        this.paused = false;
    }
    pause() {
        this.paused = true;
    }
}
const settle = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
};

test('one full-track music loop retains position across 100 focus and setting changes', async () => {
    const track = new Track();
    let created = 0;
    const theme = new LoopingTheme(() => {
        created++;
        return track;
    });
    for (let i = 0; i < 100; i++) {
        theme.update(true, 0.8, true);
        await settle();
        theme.update(true, 0.8, false);
        assert.equal(track.paused, true);
    }
    theme.update(true, 0.8, true);
    await settle();
    assert.equal(created, 1);
    assert.equal(track.plays, 101);
    assert.equal(track.currentTime, 123);
    assert.equal(track.loop, true);
    assert.ok(Math.abs(track.volume - 0.28) < 1e-9);
    theme.update(false, 1, true);
    assert.equal(track.paused, true);
});

test('autoplay rejection can retry on a gesture without spawning a second track', async () => {
    const track = new Track();
    track.reject = true;
    const theme = new LoopingTheme(() => track);
    theme.update(true, 1, true);
    theme.update(true, 1, true);
    assert.equal(track.plays, 1);
    await settle();
    track.reject = false;
    theme.update(true, 1, true);
    await settle();
    assert.equal(track.paused, false);
    assert.equal(track.plays, 2);
});
test('blur followed by focus during a pending play retries an aborted start with the latest volume', async () => {
    const track = new Track();
    let abort!: (reason: Error) => void;
    track.play = () => {
        track.plays++;
        if (track.plays === 1)
            return new Promise<void>((_resolve, reject) => {
                abort = reject;
            });
        track.paused = false;
        return Promise.resolve();
    };
    const theme = new LoopingTheme(() => track);
    theme.update(true, 1, true);
    theme.update(true, 1, false);
    theme.update(true, 0.2, true);
    const error = new Error('Paused while loading');
    error.name = 'AbortError';
    abort(error);
    await settle();
    await settle();
    assert.equal(track.plays, 2);
    assert.equal(track.paused, false);
    assert.ok(Math.abs(track.volume - 0.07) < 1e-9);
});
