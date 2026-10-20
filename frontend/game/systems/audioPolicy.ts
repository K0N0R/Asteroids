const effect = (
    file: string,
    volume: number,
    interval: number,
    voices: number,
    priority = 1,
    loop = false,
) => ({ file: `production076/${file}`, volume, interval, voices, priority, loop });
export const CUES = {
    standard: effect('standard', 0.24, 0.075, 3),
    pulse: effect('pulse', 0.22, 0.075, 3),
    rail: effect('rail', 0.34, 0.2, 2, 2),
    enemy: effect('enemy', 0.18, 0.12, 3),
    lancer: effect('lancer', 0.26, 0.2, 2, 2),
    hit: effect('hit', 0.3, 0.09, 3, 2),
    rockHit: effect('rockHit', 0.14, 0.14, 2),
    break: effect('break', 0.32, 0.14, 2),
    destroy: effect('destroy', 0.42, 0.3, 2, 3),
    collect: effect('collect', 0.12, 0.16, 2),
    complete: effect('complete', 0.32, 0.4, 1, 3),
    shield: effect('shield', 0.22, 0.2, 2, 2),
    engine: effect('engine', 0.12, 0, 1, 0, true),
    mining: effect('mining', 0.13, 0, 1, 0, true),
    repair: effect('repair', 0.1, 0, 1, 0, true),
    click: effect('click', 0.14, 0.06, 2),
    confirm: effect('confirm', 0.24, 0.15, 2, 3),
    error: effect('error', 0.25, 0.3, 1, 3),
    launch: effect('launch', 0.28, 0.5, 1, 3),
    hyperCharge: effect('hyperCharge', 0.22, 0.5, 1, 3),
    hyperJump: effect('hyperJump', 0.3, 0.5, 1, 3),
    alarm: effect('alarm', 0.2, 0, 1, 3, true),
} as const;
export type SoundCue = keyof typeof CUES;
export const cuePath = (cue: SoundCue) => `sounds/cc0/${CUES[cue].file}.ogg`;

/** Reserve four voices for warnings/results. Critical cues can replace an older
 * ordinary one-shot, while continuous machinery is never cut mid-loop. */
export function voiceAdmission(cue: SoundCue, active: readonly (SoundCue | null)[], ui = false) {
    if (active.filter((c) => c === cue).length >= CUES[cue].voices) return { allow: false };
    const ordinary = ui ? 6 : 14,
        total = ui ? 8 : 18;
    if (active.length < (CUES[cue].priority >= 3 ? total : ordinary)) return { allow: true };
    if (CUES[cue].priority < 3) return { allow: false };
    let replace = -1,
        priority = CUES[cue].priority;
    active.forEach((current, index) => {
        const p = current ? CUES[current].priority : 0;
        if ((!current || !CUES[current].loop) && p < priority) {
            replace = index;
            priority = p;
        }
    });
    return replace >= 0 ? { allow: true, replace } : { allow: false };
}

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
    private combatUntil = 0;
    private hyperState = 'idle';
    private charging: H | undefined;
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
        position?: { x: number; y: number };
        guide?: {
            state: string;
            position: { x: number; y: number };
            velocity: { x: number; y: number };
            beams: readonly unknown[];
        } | null;
        miningEscort?: {
            state: string;
            position: { x: number; y: number };
            velocity: { x: number; y: number };
            beams: readonly unknown[];
        } | null;
        elapsed?: number;
        hyperdrive?: { state: string };
        anomalyMission?: boolean;
        anomalyExposure?: { contaminated: boolean };
    }) {
        const previousHyper = this.hyperState;
        this.hyperState = state.hyperdrive?.state ?? 'idle';
        if (!this.enabled() || state.ended || state.pendingChoice) {
            this.pause();
            return;
        }
        if (this.hyperState !== 'charging' && this.charging !== undefined) {
            this.port.stop(this.charging);
            this.charging = undefined;
        }
        if (previousHyper !== this.hyperState) {
            if (this.hyperState === 'charging')
                this.charging = this.port.play('hyperCharge', CUES.hyperCharge.volume, false);
            if (this.hyperState === 'transit')
                this.port.play('hyperJump', CUES.hyperJump.volume, false);
        }
        const warning = !!state.anomalyMission && !!state.anomalyExposure?.contaminated;
        const machinery = warning ? 0.4 : (state.elapsed ?? 0) < this.combatUntil ? 0.65 : 1;
        const listener = state.position ?? { x: 0, y: 0 };
        const supports = [state.guide, state.miningEscort].filter(
            (unit) => unit && !['destroyed', 'complete'].includes(unit.state),
        );
        let allyEngine = 0,
            allyMining = 0;
        for (const unit of supports) {
            if (!unit) continue;
            const attenuation =
                Math.max(
                    0,
                    1 -
                        Math.hypot(unit.position.x - listener.x, unit.position.y - listener.y) /
                            1300,
                ) ** 2;
            if (Math.hypot(unit.velocity.x, unit.velocity.y) > 12)
                allyEngine = Math.max(allyEngine, attenuation * 0.8);
            if (unit.beams.length) allyMining = Math.max(allyMining, attenuation);
        }
        const desired: [SoundCue, boolean, number][] = [
            [
                'engine',
                (state.thrusting || allyEngine > 0.005) && this.hyperState === 'idle',
                machinery *
                    Math.max(
                        state.thrusting
                            ? state.boosting
                                ? 1.45
                                : state.engineFault
                                  ? 0.65
                                  : 1
                            : 0,
                        allyEngine,
                    ),
            ],
            [
                'mining',
                state.laserBeams.length > 0 || allyMining > 0.005,
                machinery * Math.max(state.laserBeams.length ? 1 : 0, allyMining),
            ],
            ['repair', state.repairProgress > 0, machinery],
            ['alarm', warning, 1],
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
        if (['standard', 'pulse', 'rail', 'enemy', 'lancer', 'hit', 'destroy'].includes(cue))
            this.combatUntil = time + 0.25;
        this.next.set(cue, time + CUES[cue].interval);
        this.port.play(cue, volume, false);
    }
    pause() {
        if (this.charging !== undefined) this.port.stop(this.charging);
        this.charging = undefined;
        for (const handle of this.loops.values()) this.port.stop(handle);
        this.loops.clear();
    }
}
