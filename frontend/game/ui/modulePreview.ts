import { cargoCapacity } from '../config';
import {
    AEGIS,
    ARMAMENT_KITS,
    ATLAS_WEAPONS,
    HULLS,
    PHASE_DASH,
    WIDMO,
    type HullId,
    type WeaponId,
} from '../config';
import type { ShipModules } from '../state/campaign';
import { HARPOON_ARMS } from '../systems/harpoonArms';

export const MODULE_KEYS = ['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];
export type ModulePreviewMode = 'current' | 'single' | 'all';

// A preview is always a detached copy. Purchases and mission launch use the source ship.
export function previewModules<T extends ShipModules>(
    source: T,
    mode: ModulePreviewMode,
    key: ModuleKey,
    level: number,
): T {
    const result = { ...source };
    if (mode === 'single') result[key] = Math.max(0, Math.min(3, Math.round(level)));
    if (mode === 'all') for (const module of MODULE_KEYS) result[module] = 3;
    return result;
}

export function moduleComparison(
    source: ShipModules & { hull: HullId; weapon?: WeaponId },
    key: ModuleKey,
    level: number,
) {
    const config = HULLS[source.hull],
        kit = ARMAMENT_KITS[source.weapon ?? 'standard'];
    let title: string,
        unit = '',
        value: (level: number) => number;
    switch (key) {
        case 'engine':
            title = 'Ciąg';
            value = (l) => config.thrust * (1 + l * 0.15);
            break;
        case 'cargo':
            title = 'Ładownia';
            value = (l) => cargoCapacity(source.hull, l);
            break;
        case 'armor':
            title = 'Kadłub';
            value = (l) => config.health + l * 25;
            break;
        case 'shield':
            title = 'Pojemność tarczy';
            value = (l) => Math.round(config.shield.capacity * (1 + l * 0.25));
            break;
        case 'handling':
            if (source.hull === 'widmo') {
                title = 'Siła dasha';
                value = (l) => PHASE_DASH.damage * kit.power * (1 + l * 0.25);
            } else if (source.hull === 'harpoon') {
                title = 'Zasięg ramion';
                unit = ' m';
                value = (l) => HARPOON_ARMS.reach * (1 + l * 0.15) * config.size;
            } else if (source.hull === 'aegis') {
                title = 'Kadłub drona';
                value = (l) => AEGIS.droneHull * (1 + l * 0.25);
            } else if (source.hull === 'atlas' || source.hull === 'phoenix') {
                title = 'Siła rakiety';
                value = (l) => ATLAS_WEAPONS.rocket.damage * kit.power * (1 + l * 0.25);
            } else {
                title = 'Skręt';
                value = (l) => config.turnSpeed * (1 + l * 0.2);
            }
            break;
        case 'drill':
            if (source.hull === 'widmo') {
                title = 'Odnowienie maskowania';
                unit = ' s';
                value = (l) => WIDMO.cooldown / (1 + l * 0.2);
            } else if (source.hull === 'atlas' || source.hull === 'fighter') {
                title = 'Granaty w salwie';
                value = (l) => 1 + l;
            } else {
                title = 'Moc modułu';
                unit = '%';
                value = (l) => 100 * (1 + l * 0.25);
            }
            break;
    }
    const format = (n: number) => `${Number(n.toFixed(2))}${unit}`;
    return {
        title,
        before: format(value(source[key])),
        after: format(value(Math.max(0, Math.min(3, Math.round(level))))),
    };
}
