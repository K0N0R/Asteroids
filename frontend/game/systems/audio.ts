import { SoundManager, type TSound } from '../../core/systems/soundManager';
import { GameSettings } from '../../core/systems/gameSettings';
import { CUES, cuePath, MissionAudio, voiceAdmission, type SoundCue } from './audioPolicy';
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
export const createMissionAudio = () =>
    new MissionAudio<TSound>(
        {
            play: playCue,
            stop: (s) => {
                // One-shot charging may finish before the state transition. Its
                // pooled media instance must not stop a subsequently reused voice.
                if (SoundManager.currentSounds.includes(s)) SoundManager.stop(s);
            },
            volume: (s, v) => {
                s.volume = v;
                s.instance.volume = v * GameSettings.effectsVolume;
            },
        },
        audioEnabled,
    );
export function uiCue(cue: 'click' | 'confirm' | 'error' | 'launch' | 'complete' | 'destroy') {
    if (SoundManager.getMinDurationFromStart(cuePath(cue)) > CUES[cue].interval * 1000)
        playCue(cue, CUES[cue].volume, false, 'interface');
}
