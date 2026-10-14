import { SoundManager, type TSound } from '../../core/systems/soundManager';
import { GameSettings } from '../../core/systems/gameSettings';
import { CUES, cuePath, MissionAudio, type SoundCue } from './audioPolicy';
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
    if (
        SoundManager.currentSounds.filter((s) => s.soundName === soundName).length >=
            CUES[cue].voices ||
        SoundManager.currentSounds.filter((s) => s.group === group).length >= 18
    )
        return;
    return SoundManager.play({ soundName, volume, loop, group });
}
export const createMissionAudio = () =>
    new MissionAudio<TSound>(
        {
            play: playCue,
            stop: (s) => SoundManager.stop(s),
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
