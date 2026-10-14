import { HULLS, WEAPONS, type WeaponId } from '../config';
import type { Campaign } from './campaign';

/** Purchased mounts belong to a hull; switching an owned mount is free, only in base. */
export function equipWeapon(c: Campaign, id: WeaponId) {
    const ship = c.ship;
    if (
        c.activeRun ||
        !ship ||
        ship.hull === 'aegis' ||
        ship.hull === 'stinger' ||
        !HULLS[ship.hull].guns.length ||
        !Object.hasOwn(WEAPONS, id) ||
        ship.weapon === id
    )
        return false;
    const weapon = WEAPONS[id];
    if (!ship.weapons.includes(id)) {
        if (
            c.station.workshop < weapon.workshop ||
            c.bank.ore < weapon.ore ||
            c.bank.parts < weapon.parts
        )
            return false;
        c.bank.ore -= weapon.ore;
        c.bank.parts -= weapon.parts;
        ship.weapons.push(id);
    }
    ship.weapon = id;
    return true;
}
