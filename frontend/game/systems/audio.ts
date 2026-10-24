import { SoundManager, type TSound } from '../../core/systems/soundManager';
import { GameSettings } from '../../core/systems/gameSettings';
import {
    CUES,
    cuePath,
    MissionAudio,
    voiceAdmission,
    scheduleAudioLease,
    type SoundCue,
} from './audioPolicy';
interface LoopEnvelope {
    gain: AudioParam;
    now: () => number;
    destroy: () => void;
}
let createEnvelope: (sound: TSound) => LoopEnvelope | null = () => null;
/** The browser supplies WebAudio; simulation modules remain usable without a DOM. */
export function configureMissionAudioEnvelopes(factory: typeof createEnvelope) {
    createEnvelope = factory;
}
export const audioEnabled = () =>
    GameSettings.soundEnabled && GameSettings.effectsEnabled && GameSettings.effectsVolume > 0;
export function playCue(
    cue: SoundCue,
    volume: number = CUES[cue].volume,
    loop = false,
    group = 'gameplay',
): TSound | undefined {
    if (!audioEnabled()) return;
    const soundName = cuePath(cue);
    const active = SoundManager.currentSounds.filter((s) => s.group === group);
    const cues = Object.keys(CUES) as SoundCue[];
    const admission = voiceAdmission(
        cue,
        active.map((s) => cues.find((c) => cuePath(c) === s.soundName) ?? null),
        group === 'interface',
    );
    if (!admission.allow) return;
    if (admission.replace !== undefined) SoundManager.stop(active[admission.replace]);
    return SoundManager.play({ soundName, volume, loop, group });
}
export const createMissionAudio = () => {
    // A loop has a short lease renewed by simulation updates. A stopped render loop,
    // exception or a suspended tab must not leave the last engine voice running.
    const leases = new Map<TSound, ReturnType<typeof setTimeout>>();
    const envelopes = new Map<TSound, LoopEnvelope>();
    const expire = (sound: TSound) => {
        const timer = leases.get(sound);
        if (timer !== undefined) clearTimeout(timer);
        leases.delete(sound);
        if (SoundManager.currentSounds.includes(sound)) SoundManager.stop(sound);
        const envelope = envelopes.get(sound);
        if (envelope) {
            envelope.destroy();
            envelopes.delete(sound);
        }
    };
    const renew = (sound: TSound) => {
        const envelope = envelopes.get(sound);
        if (envelope) scheduleAudioLease(envelope.gain, envelope.now());
        const previous = leases.get(sound);
        if (previous !== undefined) clearTimeout(previous);
        leases.set(
            sound,
            setTimeout(() => expire(sound), 500),
        );
    };
    return new MissionAudio<TSound>(
        {
            play: (cue, volume, loop) => {
                const sound = playCue(cue, volume, loop);
                if (sound && loop) {
                    const envelope = createEnvelope(sound);
                    if (envelope) envelopes.set(sound, envelope);
                    renew(sound);
                }
                return sound;
            },
            stop: (s) => {
                // One-shot charging may finish before the state transition. Its
                // pooled media instance must not stop a subsequently reused voice.
                expire(s);
            },
            volume: (s, v) => {
                s.volume = v;
                s.instance.volume = v * GameSettings.effectsVolume;
                renew(s);
            },
            speed: (s, speed) => {
                s.instance.speed = speed;
            },
            active: (s) => SoundManager.currentSounds.includes(s),
        },
        audioEnabled,
    );
};
export function uiCue(cue: 'click' | 'confirm' | 'error' | 'launch' | 'complete' | 'destroy') {
    if (SoundManager.getMinDurationFromStart(cuePath(cue)) > CUES[cue].interval * 1000)
        playCue(cue, CUES[cue].volume, false, 'interface');
}

/** A quiet physical pulse follows speech cadence, respecting the effects settings. */
export function dialogueTick() {
    if (SoundManager.getMinDurationFromStart(cuePath('collect')) > 100)
        playCue('collect', 0.025, false, 'interface');
}
