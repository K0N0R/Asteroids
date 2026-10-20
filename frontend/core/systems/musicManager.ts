import { Bus } from './bus';
import { GameSettings } from './gameSettings';
import { SoundManager, type TSound } from './soundManager';

export const THEME_MUSIC = 'sounds/cc0/music/theme_loop.mp3';

/** One native audio loop shared by the lobby and every flight. */
export class MusicManagerBase {
    currentMusic?: TSound;
    private initialized = false;
    private ready = false;

    init() {
        if (this.initialized) return;
        this.initialized = true;
        Bus.subscribe(
            'state',
            () => {
                // State events start after asset preload. View changes retain the same voice.
                this.ready = true;
                this.refresh();
            },
            this,
        );
        GameSettings.subscribe('sound', () => this.refresh());
    }

    private refresh() {
        const enabled =
            GameSettings.soundEnabled && GameSettings.musicEnabled && GameSettings.musicVolume > 0;
        if (this.currentMusic && !SoundManager.currentSounds.includes(this.currentMusic))
            this.currentMusic = undefined;
        if (!this.currentMusic && this.ready && enabled)
            this.currentMusic = SoundManager.play({
                soundName: THEME_MUSIC,
                volume: 0.35,
                loop: true,
                group: 'music',
            });
        if (this.currentMusic) this.currentMusic.instance.paused = !enabled;
    }
}

export const MusicManager = new MusicManagerBase();
