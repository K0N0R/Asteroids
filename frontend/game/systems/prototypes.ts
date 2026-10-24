import { INTERACTION_SECONDS } from './interactionTarget';
import { random } from '../worlds/sector';

export const CACHE = { radius: 150, speed: 60, seconds: INTERACTION_SECONDS } as const;
export const PROTOTYPES = {
    drive: {
        name: 'Napęd impulsowy',
        detail: '+20% prędkości maksymalnej i ciągu, również podczas boostu.',
    },
    handling: {
        name: 'Dysze wektorowe',
        detail: '+25% skrętu i szybkości reakcji na A/D.',
    },
    laser: {
        name: 'Soczewka rezonansowa',
        detail: '+35% mocy laserów wydobywczych i +25% ich zasięgu.',
    },
    guns: {
        name: 'Akcelerator pocisków',
        detail: '+35% obrażeń działek przeciw dronom. Bez premii przeciw skałom.',
    },
    cargo: {
        name: 'Ładownia rozkładana',
        detail: '+20 miejsca na surowce. Ładunek zachowasz po udanym powrocie.',
    },
    grippers: {
        name: 'Ramiona teleskopowe',
        detail: '+40% zasięgu chwytaków i +25% szybkości wysuwania oraz powrotu.',
    },
    hull: {
        name: 'Poszycie regeneracyjne',
        detail: '+30 maksymalnego HP i natychmiastowa naprawa 30 HP.',
    },
} as const;
export type PrototypeId = keyof typeof PROTOTYPES;

// Separate RNG: opening a cache never rerolls asteroid loot or the sector layout.
export function prototypeOffers(seed: number, cacheId: number, installed: readonly PrototypeId[]) {
    const rng = random(seed ^ Math.imul(cacheId, 0x45d9f3b));
    const pool = (Object.keys(PROTOTYPES) as PrototypeId[]).filter((id) => !installed.includes(id));
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
}
