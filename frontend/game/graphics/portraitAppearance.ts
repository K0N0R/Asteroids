export const HAIRSTYLES = [
    'crop',
    'swept',
    'quiff',
    'curls',
    'bob',
    'ponytail',
    'braid',
    'locs',
    'bun',
    'undercut',
    'waves',
    'fringe',
    'shaved',
    'coils',
    'long',
] as const;
export const OUTFITS = ['flight', 'command', 'science', 'utility', 'vest', 'field'] as const;
export const SKIN_TONES = [
    0xf4d6ba, 0xeac09a, 0xd7a07c, 0xbe8967, 0xa66d50, 0x89573f, 0x714735, 0x563a31,
] as const;
export const HAIR_COLORS = [
    0x272b35, 0x44312e, 0x695044, 0x9e513b, 0xc1a373, 0xe0d4bd, 0xb5bac4, 0x594065, 0x793d4b,
] as const;
export const ACCENTS = [
    0xe39c50, 0x5ab6d9, 0xb85576, 0x66b5a7, 0xa2b458, 0x9d7dca, 0xd9b367, 0x7098cd,
] as const;
export const FACE_SHAPES = [
    'oval',
    'square',
    'tapered',
    'round',
    'long',
    'angular',
    'heart',
    'wide',
] as const;
export const FACE_PROPORTIONS = {
    oval: [44, 27, 37],
    square: [49, 37, 29],
    tapered: [43, 21, 39],
    round: [49, 32, 35],
    long: [41, 24, 43],
    angular: [46, 27, 35],
    heart: [47, 20, 37],
    wide: [52, 37, 30],
} as const;
export interface PortraitAppearance {
    presentation: 'woman' | 'man';
    face: (typeof FACE_SHAPES)[number];
    hair: (typeof HAIRSTYLES)[number];
    outfit: (typeof OUTFITS)[number];
    skin: number;
    hairColor: number;
    accent: number;
    fabric: number;
    facing: -1 | 1;
    headset: boolean;
}
const hash = (seed: number, salt: number) => {
    let n = Math.imul(seed ^ salt, 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return (n ^ (n >>> 16)) >>> 0;
};
// Weighted, but sampled without replacement within a recruitment batch.
// All tones remain available; a batch does not repeatedly offer the same complexion.
const SKIN_WEIGHTS = [4, 4, 3, 2, 1, 1, 1, 1];
function rosterSkin(identity: number, archetype: number) {
    const available = SKIN_TONES.map((color, index) => ({ color, weight: SKIN_WEIGHTS[index] }));
    let selected = SKIN_TONES[0] as number;
    for (let slot = 0; slot <= archetype; slot++) {
        let ticket =
            hash(identity, 127 + slot * 19) % available.reduce((sum, tone) => sum + tone.weight, 0);
        let index = 0;
        while (ticket >= available[index].weight) ticket -= available[index++].weight;
        selected = available[index].color;
        available.splice(index, 1);
    }
    return selected;
}
/** The same roster identity always reconstructs the same interchangeable parts. */
export function genericPortrait(identity: number, archetype: number): PortraitAppearance {
    const seed = identity + archetype * 7;
    const presentation =
        identity === 1
            ? ([true, false, true, false][archetype] ?? false)
            : (identity - 2 + archetype * 7) % 2 === 0;
    return {
        presentation: presentation ? 'woman' : 'man',
        face: FACE_SHAPES[hash(seed, 19) % FACE_SHAPES.length],
        hair: HAIRSTYLES[((seed % HAIRSTYLES.length) + HAIRSTYLES.length) % HAIRSTYLES.length],
        outfit: OUTFITS[hash(seed, 71) % OUTFITS.length],
        skin: identity === 1 && archetype === 0 ? SKIN_TONES[1] : rosterSkin(identity, archetype),
        hairColor: HAIR_COLORS[hash(seed, 37) % HAIR_COLORS.length],
        accent: ACCENTS[hash(seed, 53) % ACCENTS.length],
        fabric: [0xd9d6ca, 0x334454, 0x647252, 0x83959c, 0x3b425d][hash(seed, 97) % 5],
        facing: hash(seed, 101) % 2 ? 1 : -1,
        headset: hash(seed, 113) % 3 !== 0,
    };
}
/** Authored people are not random pilot seeds: their visual identities are explicit. */
export const STORY_PORTRAITS = {
    operations: {
        presentation: 'woman',
        face: 'tapered',
        hair: 'braid',
        outfit: 'command',
        skin: SKIN_TONES[1],
        hairColor: HAIR_COLORS[8],
        accent: ACCENTS[2],
        fabric: 0xd9d6ca,
        facing: 1,
        headset: true,
    },
    science: {
        presentation: 'man',
        face: 'long',
        hair: 'coils',
        outfit: 'science',
        skin: SKIN_TONES[6],
        hairColor: HAIR_COLORS[0],
        accent: ACCENTS[3],
        fabric: 0xd9d6ca,
        facing: -1,
        headset: false,
    },
    guide: {
        presentation: 'man',
        face: 'square',
        hair: 'quiff',
        outfit: 'flight',
        skin: SKIN_TONES[2],
        hairColor: HAIR_COLORS[2],
        accent: ACCENTS[0],
        fabric: 0xd9d6ca,
        facing: 1,
        headset: true,
    },
    mechanic: {
        presentation: 'woman',
        face: 'round',
        hair: 'bun',
        outfit: 'utility',
        skin: SKIN_TONES[4],
        hairColor: HAIR_COLORS[1],
        accent: ACCENTS[6],
        fabric: 0x647252,
        facing: -1,
        headset: false,
    },
} as const satisfies Record<string, PortraitAppearance>;
