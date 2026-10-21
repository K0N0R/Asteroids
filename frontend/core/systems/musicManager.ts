import { Bus } from './bus';
import { GameSettings } from './gameSettings';

export const THEME_MUSIC = 'sounds/cc0/music/theme_loop.mp3';
export interface MusicElement {
    loop: boolean;
    volume: number;
    paused: boolean;
    play(): Promise<void>;
    pause(): void;
}
/** HTML media retains the full-track loop boundaries when paused and resumed. */
export class LoopingTheme {
    current?: MusicElement;
    private pending = false;
    private shouldPlay = false;
    private revision = 0;
    private volume = 0;
    constructor(
        private create: () => MusicElement = () =>
            new Audio(new URL(`assets/${THEME_MUSIC}`, document.baseURI).href),
    ) {}
    update(enabled: boolean, volume: number, foreground: boolean) {
        this.shouldPlay = enabled && foreground;
        this.volume = volume;
        this.revision++;
        if (!this.current && enabled) this.current = this.create();
        const audio = this.current;
        if (!audio) return;
        audio.loop = true;
        audio.volume = Math.max(0, Math.min(1, volume)) * 0.35;
        if (!enabled || !foreground) {
            audio.pause();
            return;
        }
        if (!audio.paused || this.pending) return;
        this.pending = true;
        const attempt = this.revision;
        let retry = false;
        audio
            .play()
            .then(() => {
                retry = true;
            })
            .catch((error: unknown) => {
                // A blur can abort play while a newer focus already requested a resume.
                retry =
                    error instanceof Error &&
                    error.name === 'AbortError' &&
                    this.revision > attempt;
                // Autoplay denial waits for the next user gesture instead of retrying forever.
            })
            .finally(() => {
                this.pending = false;
                if (retry && this.shouldPlay && audio.paused) this.update(true, this.volume, true);
            });
    }
}
/** One streaming element across all views, with one owner of focus/visibility pauses. */
export class MusicManagerBase {
    readonly player = new LoopingTheme();
    private initialized = false;
    private ready = false;
    private foreground = true;
    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.foreground = !document.hidden && document.hasFocus();
        Bus.subscribe(
            'state',
            () => {
                this.ready = true;
                this.refresh();
            },
            this,
        );
        GameSettings.subscribe('sound', () => this.refresh());
        window.addEventListener('blur', () => {
            this.foreground = false;
            this.refresh();
        });
        window.addEventListener('focus', () => {
            this.foreground = !document.hidden;
            this.refresh();
        });
        document.addEventListener('visibilitychange', () => {
            this.foreground = !document.hidden;
            this.refresh();
        });
        window.addEventListener('pointerdown', () => this.refresh());
        window.addEventListener('keydown', () => this.refresh());
    }
    private refresh() {
        const enabled =
            this.ready &&
            GameSettings.soundEnabled &&
            GameSettings.musicEnabled &&
            GameSettings.musicVolume > 0;
        this.player.update(enabled, GameSettings.musicVolume, this.foreground);
    }
}
export const MusicManager = new MusicManagerBase();
