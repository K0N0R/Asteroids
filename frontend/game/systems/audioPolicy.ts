export const CUES = {
    standard: { file: 'sci-fi-sounds/laserRetro_000', volume: 0.3, interval: 0.075, voices: 3 },
    pulse: { file: 'sci-fi-sounds/laserSmall_000', volume: 0.22, interval: 0.075, voices: 3 },
    rail: { file: 'sci-fi-sounds/laserLarge_000', volume: 0.4, interval: 0.2, voices: 2 },
    enemy: { file: 'sci-fi-sounds/laserSmall_003', volume: 0.26, interval: 0.12, voices: 3 },
    lancer: { file: 'sci-fi-sounds/laserLarge_003', volume: 0.35, interval: 0.2, voices: 2 },
    hit: { file: 'sci-fi-sounds/impactMetal_002', volume: 0.4, interval: 0.09, voices: 3 },
    rockHit: { file: 'sci-fi-sounds/impactMetal_002', volume: 0.18, interval: 0.14, voices: 2 },
    break: { file: 'sci-fi-sounds/explosionCrunch_002', volume: 0.48, interval: 0.14, voices: 2 },
    destroy: {
        file: 'sci-fi-sounds/lowFrequency_explosion_000',
        volume: 0.52,
        interval: 0.3,
        voices: 2,
    },
    collect: { file: 'interface-sounds/drop_003', volume: 0.2, interval: 0.16, voices: 2 },
    complete: { file: 'digital-sounds/powerUp3', volume: 0.32, interval: 0.4, voices: 1 },
    shield: { file: 'sci-fi-sounds/forceField_000', volume: 0.22, interval: 0.2, voices: 2 },
    engine: { file: 'sci-fi-sounds/spaceEngineLow_000', volume: 0.14, interval: 0, voices: 1 },
    mining: { file: 'sci-fi-sounds/spaceEngineSmall_000', volume: 0.16, interval: 0, voices: 1 },
    repair: { file: 'sci-fi-sounds/thrusterFire_000', volume: 0.12, interval: 0, voices: 1 },
    click: { file: 'interface-sounds/click_003', volume: 0.16, interval: 0.06, voices: 2 },
    confirm: { file: 'interface-sounds/confirmation_002', volume: 0.26, interval: 0.15, voices: 2 },
    error: { file: 'interface-sounds/error_003', volume: 0.28, interval: 0.3, voices: 1 },
    launch: { file: 'digital-sounds/phaseJump3', volume: 0.3, interval: 0.5, voices: 1 },
} as const;
export type SoundCue = keyof typeof CUES;
export const cuePath = (cue: SoundCue) => `sounds/cc0/${CUES[cue].file}.ogg`;

export interface AudioEvent {
    kind: string;
    x: number;
    y: number;
    strength?: number;
    rich?: boolean;
    sound?: SoundCue;
}
export function eventCue(event: AudioEvent): SoundCue | null {
    if (event.sound) return event.sound;
    if (event.kind === 'weld' || event.kind === 'shot') return null;
    if (event.kind === 'hit') return event.rich !== undefined ? 'rockHit' : 'hit';
    return ['break', 'collect', 'shield'].includes(event.kind) ? (event.kind as SoundCue) : null;
}
export function eventVolume(event: AudioEvent, listener: { x: number; y: number }, cue: SoundCue) {
    const distance = Math.hypot(event.x - listener.x, event.y - listener.y);
    const falloff = Math.max(0, 1 - distance / 1300) ** 2;
    const strength =
        event.kind === 'hit' || event.kind === 'break'
            ? Math.min(1.25, Math.max(0.45, (event.strength ?? 18) / 30))
            : 1;
    return CUES[cue].volume * falloff * strength;
}

export interface AudioPort<H> {
    play(cue: SoundCue, volume: number, loop: boolean): H | undefined;
    stop(handle: H): void;
    volume(handle: H, volume: number): void;
}
export class MissionAudio<H> {
    private loops = new Map<SoundCue, H>();
    private next = new Map<SoundCue, number>();
    constructor(
        private port: AudioPort<H>,
        private enabled: () => boolean,
    ) {}
    update(state: {
        ended: unknown;
        pendingChoice: unknown;
        thrusting: boolean;
        boosting: boolean;
        engineFault: boolean;
        laserBeams: readonly unknown[];
        repairProgress: number;
    }) {
        if (!this.enabled() || state.ended || state.pendingChoice) {
            this.pause();
            return;
        }
        const desired: [SoundCue, boolean, number][] = [
            ['engine', state.thrusting, state.boosting ? 1.45 : state.engineFault ? 0.65 : 1],
            ['mining', state.laserBeams.length > 0, 1],
            ['repair', state.repairProgress > 0, 1],
        ];
        for (const [cue, active, multiplier] of desired) {
            const handle = this.loops.get(cue);
            if (!active) {
                if (handle) {
                    this.port.stop(handle);
                    this.loops.delete(cue);
                }
                continue;
            }
            const volume = CUES[cue].volume * multiplier;
            if (handle) this.port.volume(handle, volume);
            else {
                const created = this.port.play(cue, volume, true);
                if (created) this.loops.set(cue, created);
            }
        }
    }
    event(event: AudioEvent, listener: { x: number; y: number }, time: number) {
        if (!this.enabled()) return;
        const cue = eventCue(event);
        if (!cue || time < (this.next.get(cue) ?? 0)) return;
        const volume = eventVolume(event, listener, cue);
        if (volume < 0.005) return;
        this.next.set(cue, time + CUES[cue].interval);
        this.port.play(cue, volume, false);
    }
    pause() {
        for (const handle of this.loops.values()) this.port.stop(handle);
        this.loops.clear();
    }
}
