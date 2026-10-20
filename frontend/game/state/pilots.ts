import {
    PILOTS,
    PILOT_PROGRESSION,
    PILOT_SKILLS,
    PilotSkillId,
    SCAN_SITES,
    ScanSiteId,
} from '../config';
import type { Campaign, Cargo, Pilot } from './campaign';
import type { RecoverySignal } from './recovery';

const FIRST_NAMES = [
    'Lena',
    'Kai',
    'Rhea',
    'Noah',
    'Inez',
    'Leon',
    'Aya',
    'Oren',
    'Nadia',
    'Elias',
    'Sora',
    'Milo',
    'Talia',
    'Aron',
    'Vera',
    'Finn',
    'Nila',
    'Dorian',
    'Ada',
    'Ravi',
];
const LAST_NAMES = [
    'Vale',
    'Chen',
    'Orlov',
    'Solis',
    'Reed',
    'Kade',
    'Moreau',
    'Novak',
    'Renn',
    'Navarro',
    'Ash',
    'Okoye',
    'Marin',
    'Sato',
    'Kovac',
    'Hale',
    'Mercer',
    'Vega',
];
export function pilotName(pilot: Pick<Pilot, 'id' | 'archetype'>) {
    if (pilot.id === 1) return PILOTS[pilot.archetype].name;
    const index = pilot.id - 2 + pilot.archetype * 7;
    return `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[(Math.floor(index / FIRST_NAMES.length) + pilot.archetype * 3) % LAST_NAMES.length]}`;
}

// Recruitment previews share the next roster ID; include their role in visual identity.
export const pilotAppearanceId = (pilot: Pick<Pilot, 'id' | 'archetype'>) =>
    pilot.id + pilot.archetype * 7;

export const MAX_PILOT_XP = PILOT_PROGRESSION.thresholds[PILOT_PROGRESSION.thresholds.length - 1];
export const newPilot = (id = 1, archetype = 0): Pilot => ({
    id,
    archetype,
    xp: 0,
    skills: { handling: 0, mining: 0, survival: 0 },
});
export const clonePilot = (pilot: Pilot): Pilot => ({ ...pilot, skills: { ...pilot.skills } });
export const pilotLevel = (pilot: Pick<Pilot, 'xp'>) =>
    PILOT_PROGRESSION.thresholds.filter((threshold) => pilot.xp >= threshold).length;
export function pilotPoints(pilot: Pilot) {
    return (
        pilotLevel(pilot) -
        1 -
        Object.values(pilot.skills).reduce((total, value) => total + value, 0)
    );
}
export function pilotProfile(pilot: Pilot) {
    const base = PILOTS[pilot.archetype];
    const handling = 1 + pilot.skills.handling * PILOT_SKILLS.handling.bonus;
    return {
        ...base,
        name: pilotName(pilot),
        level: pilotLevel(pilot),
        turn: base.turn * handling,
        brake: base.brake * handling,
        mining: base.mining * (1 + pilot.skills.mining * PILOT_SKILLS.mining.bonus),
        escape: base.escape + pilot.skills.survival * PILOT_SKILLS.survival.bonus,
    };
}
export function trainPilot(c: Campaign, id: number, skill: PilotSkillId): boolean {
    if (c.activeRun || !Object.hasOwn(PILOT_SKILLS, skill)) return false;
    const pilot = c.pilots.find((pilot) => pilot.id === id);
    if (!pilot || pilotPoints(pilot) <= 0 || pilot.skills[skill] >= PILOT_PROGRESSION.skillLimit)
        return false;
    pilot.skills[skill]++;
    return true;
}

export function expeditionXp(
    cargo: Cargo,
    data: readonly ScanSiteId[],
    completedContract: boolean,
    recovery: RecoverySignal | null,
    kills = 0,
) {
    const load = cargo.ore + (cargo.copperOre ?? 0) + cargo.parts * 2 + (cargo.crystals ?? 0) * 4;
    const cargoXp = Number.isFinite(load) ? Math.max(0, Math.min(20, Math.floor(load))) : 0;
    const combatXp = Number.isInteger(kills) && kills >= 0 ? Math.min(10, kills * 2) : 0;
    const scans = new Set(data.filter((site) => Object.hasOwn(SCAN_SITES, site))).size;
    return Math.min(
        PILOT_PROGRESSION.maxXpPerRun,
        cargoXp +
            combatXp +
            scans * 5 +
            (completedContract ? 10 : 0) +
            (recovery?.pilot ? 15 : 0) +
            (recovery?.ship ? 5 : 0),
    );
}

export interface PilotProgress {
    gainedXp: number;
    levelBefore: number;
    levelAfter: number;
    points: number;
}
export function awardPilotXp(pilot: Pilot, xp: number): PilotProgress {
    const levelBefore = pilotLevel(pilot),
        previous = pilot.xp;
    if (Number.isFinite(xp))
        pilot.xp = Math.min(MAX_PILOT_XP, pilot.xp + Math.max(0, Math.floor(xp)));
    return {
        gainedXp: pilot.xp - previous,
        levelBefore,
        levelAfter: pilotLevel(pilot),
        points: pilotPoints(pilot),
    };
}

export function validPilotProgress(value: unknown): boolean {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const pilot = value as Pilot;
    if (
        !Number.isInteger(pilot.xp) ||
        pilot.xp < 0 ||
        pilot.xp > MAX_PILOT_XP ||
        !pilot.skills ||
        typeof pilot.skills !== 'object' ||
        Array.isArray(pilot.skills) ||
        Object.keys(pilot.skills).length !== Object.keys(PILOT_SKILLS).length
    )
        return false;
    if (
        !Object.keys(PILOT_SKILLS).every((key) => {
            const level = pilot.skills[key as PilotSkillId];
            return (
                Object.hasOwn(pilot.skills, key) &&
                Number.isInteger(level) &&
                level >= 0 &&
                level <= PILOT_PROGRESSION.skillLimit
            );
        })
    )
        return false;
    return pilotPoints(pilot) >= 0;
}
