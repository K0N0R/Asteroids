import { WEAPON_PARTS, spendEquipment } from './equipmentCosts';
import { WEAPONS, type WeaponId } from '../config';
import type { Campaign } from './campaign';

/** Purchased mounts belong to a hull; switching an owned mount is free, only in base. */
export function equipWeapon(c: Campaign, id: WeaponId) {
    const ship = c.ship;
    if (c.activeRun || !ship || !Object.hasOwn(WEAPONS, id) || ship.weapon === id) return false;
    const weapon = WEAPONS[id];
    if (!ship.weapons.includes(id)) {
        if (c.station.workshop < weapon.workshop || !spendEquipment(c.bank, WEAPON_PARTS[id]))
            return false;
        ship.weapons.push(id);
    }
    ship.weapon = id;
    return true;
}
