import { GAME, HULLS, PILOTS } from '../config';
import { Point, random } from '../worlds/sector';
import type { Pilot, Ship } from './campaign';
import { clonePilot, pilotLevel, pilotProfile } from './pilots';

export interface RecoverySignal extends Point {
    id: number;
    seed: number;
    pilot: Pilot | null;
    ship: Ship | null;
}

export function recoveryChances(ship: Ship, pilot: Pilot) {
    const quality = HULLS[ship.hull].recovery;
    return {
        pilot: Math.min(0.85, 0.2 + quality + pilotProfile(pilot).escape + ship.armor * 0.04),
        ship: Math.min(0.8, 0.35 + quality + ship.armor * 0.08),
    };
}

// Resolve once from the run seed and stable identities. Reloading never rerolls survival.
export function createRecoverySignal(
    ship: Ship,
    pilot: Pilot,
    seed: number,
    position: Point,
): RecoverySignal | null {
    const rng = random(seed ^ Math.imul(ship.id, 0x45d9f3b) ^ Math.imul(pilot.id, 0x119de1f3));
    const chances = recoveryChances(ship, pilot);
    const rescuedPilot = rng() < chances.pilot ? clonePilot(pilot) : null;
    const salvagedShip = rng() < chances.ship ? { ...ship, weapons: [...ship.weapons] } : null;
    if (!rescuedPilot && !salvagedShip) return null;
    // Keep beacons reachable even when the loss happened in the radiation zone or the dock.
    const distance = Math.hypot(position.x, position.y);
    const radius = Math.max(650, Math.min(GAME.sectorRadius - 300, distance));
    const angle = distance > 0 ? Math.atan2(position.y, position.x) : 0;
    return {
        id: ship.id,
        seed,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        pilot: rescuedPilot,
        ship: salvagedShip,
    };
}

export function recoveryDescription(signal: RecoverySignal) {
    return [
        signal.pilot
            ? `kapsuła: ${PILOTS[signal.pilot.archetype].name} · P${pilotLevel(signal.pilot)}`
            : '',
        signal.ship ? `wrak: ${HULLS[signal.ship.hull].name} #${signal.ship.id}` : '',
    ]
        .filter(Boolean)
        .join(' · ');
}
