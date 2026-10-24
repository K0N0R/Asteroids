import { cargoCapacity } from '../config';
import { Container, Graphics } from 'pixi.js';
import {
    HULLS,
    FLEET_LIMIT,
    WEAPONS,
    ARMAMENT_KITS,
    armamentName,
    shipUpgradeDefinition,
    type HullId,
    type WeaponId,
} from '../config';
import { ownedShips, type Campaign, type Ship } from '../state/campaign';
import { moduleParts, WEAPON_PARTS, canAffordEquipment } from '../state/equipmentCosts';
import { HULL_CONSTRUCTION, hasHullParts } from '../state/fleetConstruction';
import { hullUnlockReason, hullUnlocked } from '../state/fleetUnlocks';
import { recipeDiscovered } from '../state/discovery';
import { RESOURCE_IDS, RESOURCES, type ResourceStore } from '../state/resources';
import { RECIPE_IDS, RECIPES, type RecipeId } from '../state/chemistry';
import { itemIllustration } from '../graphics/items';
import { C, ShipView } from '../graphics/shapes';
import { MODULE_KEYS, moduleComparison, previewModules, type ModuleKey } from './modulePreview';
import { bareModules, fittedShip, hullPreview, choiceCard, stat, segments } from './lobbyGraphics';
import { panel, label, button, illustrationInBox } from './primitives';

export interface HangarState {
    shipId: number | null;
    hull: HullId;
    page: number;
    tab: 'stats' | 'construction' | 'upgrades' | 'variants';
    module: ModuleKey;
    previewLevel: number;
    variant: WeaponId;
}
export const newHangarState = (): HangarState => ({
    shipId: null,
    hull: 'swift',
    page: 0,
    tab: 'stats',
    module: 'engine',
    previewLevel: 1,
    variant: 'standard',
});
interface HangarActions {
    refresh: () => void;
    openRecipe: (id: RecipeId) => void;
    openStation: () => void;
    openFleet: () => void;
    buyShip: (hull: HullId) => void;
    selectShip: (id: number) => void;
    scrapShip: (id: number) => void;
    upgrade: (key: ModuleKey) => void;
    equipWeapon: (id: WeaponId) => void;
}
export function moduleOffer(
    c: Campaign,
    ship: Ship,
    key: ModuleKey,
    project = false,
    previewLevel = 1,
) {
    const current = project ? 0 : ship[key];
    const knownLimit = Math.max(current, c.station.workshopLevel);
    const next = Math.min(
        knownLimit,
        project ? Math.max(1, Math.min(3, previewLevel)) : current + 1,
    );
    const cost = next <= current ? {} : moduleParts(key, next - 1);
    const active = c.ship?.id === ship.id;
    const reason =
        ship.hull === 'prospector'
            ? 'Prospector 0 · statek startowy i awaryjny, bez ulepszeń.'
            : project
              ? 'Podgląd projektu · moduły zamontujesz po zbudowaniu statku.'
              : next <= current
                ? 'Moduł zamontowany i gotowy do pracy.'
                : c.activeRun
                  ? 'Montaż dostępny po powrocie do bazy.'
                  : !active
                    ? 'Ustaw ten statek jako aktywny, aby montować ulepszenia.'
                    : next > c.station.workshopLevel
                      ? `Wymagany Warsztat ${['0', 'I', 'II', 'III'][next]}.`
                      : !canAffordEquipment(c.bank, cost)
                        ? 'Skompletuj części do ulepszenia.'
                        : null;
    return { current, next, cost, active, reason, comparison: moduleComparison(ship, key, next) };
}
/** Spacious ingredient cards, reused by hulls, modules and armament variants. */
export function hangarRequirements(
    ui: Container,
    c: Campaign,
    bill: Readonly<ResourceStore>,
    x: number,
    y: number,
    width: number,
    openRecipe: (id: RecipeId) => void,
    columns = 2,
) {
    const ids = RESOURCE_IDS.filter((id) => (bill[id] ?? 0) > 0);
    const gap = 16,
        cardWidth = (width - gap * (columns - 1)) / columns;
    ids.forEach((id, i) => {
        const left = x + (i % columns) * (cardWidth + gap),
            top = y + Math.floor(i / columns) * 76;
        const card = ui.addChild(new Container({ label: `hangar-cost:${id}` }));
        card.position.set(left, top);
        card.addChild(
            new Graphics()
                .roundRect(0, 0, cardWidth, 64, 10)
                .fill({ color: C.raised, alpha: 0.65 }),
        );
        illustrationInBox(card, itemIllustration(id), 10, 12, 38, 38);
        label(card, RESOURCES[id].name, 60, 9, 15, C.text, cardWidth - 72);
        label(
            card,
            `${c.bank[id] ?? 0} / ${bill[id]}`,
            60,
            39,
            15,
            (c.bank[id] ?? 0) >= bill[id]! ? C.mint : C.gold,
        );
        const recipe = RECIPE_IDS.find((key) => RECIPES[key].output === id);
        if (recipe && recipeDiscovered(c, recipe))
            button(
                card,
                'STWÓRZ',
                cardWidth - 98,
                34,
                86,
                () => openRecipe(recipe),
                false,
                true,
                24,
                11,
            ).label = `craft:${id}`;
    });
}

export function hangarScreen(
    ui: Container,
    c: Campaign,
    state: HangarState,
    project: boolean,
    actions: HangarActions,
) {
    const ships = ownedShips(c);
    if (!ships.some((ship) => ship.id === state.shipId))
        state.shipId = c.ship?.id ?? ships[0]?.id ?? null;
    const catalogue = (Object.keys(HULLS) as HullId[]).filter((id) => hullUnlocked(c, id));
    if (project && catalogue.length && !catalogue.includes(state.hull)) state.hull = catalogue[0];
    const entries = project ? catalogue : ships;
    const pageCount = Math.max(1, Math.ceil(entries.length / 6));
    state.page = Math.min(state.page, pageCount - 1);
    panel(ui, 280, 214, 255, 591);
    label(
        ui,
        project ? 'PROJEKTY KADŁUBÓW' : `MOJA FLOTA · ${ships.length}/${FLEET_LIMIT}`,
        300,
        242,
        13,
        C.mint,
    );
    entries.slice(state.page * 6, (state.page + 1) * 6).forEach((entry, i) => {
        const hull = typeof entry === 'string' ? entry : entry.hull;
        const selected =
            typeof entry === 'string' ? state.hull === hull : state.shipId === entry.id;
        const card = choiceCard(ui, 294, 281 + i * 72, 227, 62, selected, () => {
            if (typeof entry === 'string') state.hull = hull;
            else {
                state.shipId = entry.id;
                state.variant = entry.weapon;
            }
            actions.refresh();
        });
        const thumbnail = fittedShip(typeof entry === 'string' ? bareModules(hull) : entry, 42, 49);
        thumbnail.position.set(33, 31);
        card.addChild(thumbnail);
        label(
            card,
            `${HULLS[hull].name.replace(' odzyskany', '')}${typeof entry === 'string' ? '' : ` #${entry.id}`}`,
            65,
            10,
            16,
            C.text,
            153,
        );
        label(
            card,
            typeof entry === 'string'
                ? hullUnlockReason(c, hull)
                    ? 'Projekt zablokowany'
                    : `Warsztat ${['0', 'I', 'II', 'III'][HULLS[hull].workshop]}`
                : c.ship?.id === entry.id
                  ? '● Aktywny'
                  : 'W rezerwie',
            65,
            37,
            12,
            typeof entry !== 'string' && c.ship?.id === entry.id ? C.mint : C.muted,
            153,
        );
    });
    if (pageCount > 1) {
        const turn = (d: number) => {
            state.page = (state.page + d + pageCount) % pageCount;
            if (project) state.hull = catalogue[state.page * 6];
            actions.refresh();
        };
        button(ui, '←', 296, 748, 54, () => turn(-1), false, true, 32);
        label(ui, `${state.page + 1} / ${pageCount}`, 382, 756, 14, C.muted);
        button(ui, '→', 465, 748, 54, () => turn(1), false, true, 32);
    }
    const owned = ships.find((ship) => ship.id === state.shipId);
    const ship: Ship | undefined = project
        ? catalogue.length
            ? { ...bareModules(state.hull), id: 0, weapon: 'standard', weapons: ['standard'] }
            : undefined
        : owned;
    panel(ui, 555, 214, 1005, 591);
    if (!ship) {
        label(ui, project ? 'Brak dostępnych projektów' : 'Brak statków w hangarze', 585, 273, 30);
        label(
            ui,
            project
                ? 'Katalog nie zawiera obecnie projektów do budowy.'
                : 'W hangarze nie ma teraz żadnego statku.',
            585,
            328,
            18,
            C.muted,
            900,
        );
        return;
    }
    const config = HULLS[ship.hull];
    label(
        ui,
        project
            ? 'PROJEKT / PODGLĄD'
            : c.ship?.id === ship.id
              ? 'AKTYWNY STATEK'
              : 'STATEK REZERWOWY',
        580,
        240,
        12,
        C.mint,
    );
    label(ui, `${config.name}${project ? '' : ` #${ship.id}`}`, 580, 269, 30, C.text, 610);
    label(ui, config.role, 580, 313, 16, C.muted, 700);
    if (state.tab === 'variants' || state.tab === 'construction') {
        const thumbnail = fittedShip(
            { ...ship, weapon: state.tab === 'variants' ? state.variant : ship.weapon },
            100,
            80,
        );
        thumbnail.position.set(1460, 282);
        ui.addChild(thumbnail);
    }
    const tabs =
        ship.hull === 'prospector'
            ? (['stats'] as const)
            : project
              ? (['stats', 'construction', 'upgrades', 'variants'] as const)
              : (['stats', 'upgrades', 'variants'] as const);
    if ((!project && state.tab === 'construction') || ship.hull === 'prospector')
        state.tab = 'stats';
    const tabWidth = (950 - (tabs.length - 1) * 14) / tabs.length;
    tabs.forEach((tab, i) => {
        const names = {
            stats: 'Parametry',
            construction: 'Budowa',
            upgrades: 'Ulepszenia',
            variants: 'Warianty',
        };
        button(
            ui,
            names[tab],
            580 + i * (tabWidth + 14),
            350,
            tabWidth,
            () => {
                state.tab = tab;
                actions.refresh();
            },
            state.tab === tab,
            true,
            36,
            15,
        ).label = `hangar-tab:${tab}`;
    });
    if (state.tab === 'upgrades') moduleScreen(ui, c, ship, state, project, actions);
    else if (state.tab === 'construction') constructionScreen(ui, c, ship, actions);
    else if (state.tab === 'variants') variantScreen(ui, c, ship, state, project, actions);
    else
        statsScreen(ui, c, ship, project, actions, () => {
            state.tab = 'construction';
            actions.refresh();
        });
}
function statsScreen(
    ui: Container,
    c: Campaign,
    ship: Ship,
    project: boolean,
    actions: HangarActions,
    construction: () => void,
) {
    const config = HULLS[ship.hull];
    const art = hullPreview(ship);
    art.position.set(800, 555);
    art.scale.set(0.69);
    ui.addChild(art);
    stat(ui, 'KADŁUB', `${config.health + ship.armor * 25}`, 1070, 416, 'health');
    stat(
        ui,
        'TARCZA',
        `${Math.round(config.shield.capacity * (1 + ship.shield * 0.25))}`,
        1307,
        416,
        'shield',
    );
    stat(ui, 'ŁADOWNIA', `${cargoCapacity(ship.hull, ship.cargo)}`, 1070, 495, 'cargo');
    stat(ui, 'PRĘDKOŚĆ', `${config.maxSpeed} m/s`, 1307, 495);
    stat(
        ui,
        'SKRĘT',
        `${Number((config.turnSpeed * (1 + ship.handling * 0.2)).toFixed(2))}`,
        1070,
        574,
    );
    stat(ui, 'BOOST', `×${config.boost}`, 1307, 574);
    label(
        ui,
        `Regeneracja tarczy: +${(config.shield.regen * (1 + ship.shield * 0.15)).toFixed(1)}/s`,
        1070,
        637,
        13,
        C.cyan,
        450,
    );
    label(ui, config.detail, 1070, 668, 16, C.muted, 450);
    label(
        ui,
        `Zakłócanie radarów: ${Math.round(config.radarJamming * 100)}%`,
        580,
        703,
        14,
        C.cyan,
        450,
    );
    if (project) button(ui, 'CZĘŚCI I BUDOWA →', 1070, 749, 460, construction, true, true, 38, 15);
    else if (c.ship?.id !== ship.id) {
        button(
            ui,
            'USTAW AKTYWNY →',
            580,
            749,
            310,
            () => actions.selectShip(ship.id),
            true,
            !c.activeRun,
            38,
            15,
        );
        button(
            ui,
            'ZŁOMUJ',
            910,
            749,
            145,
            () => actions.scrapShip(ship.id),
            false,
            !c.activeRun,
            38,
            14,
        );
    } else label(ui, '● Gotowy na następną wyprawę', 580, 762, 15, C.mint, 450);
}
function constructionScreen(ui: Container, c: Campaign, ship: Ship, actions: HangarActions) {
    label(ui, 'CZĘŚCI DO BUDOWY · MAGAZYN / WYMÓG', 580, 412, 13, C.mint);
    hangarRequirements(ui, c, HULL_CONSTRUCTION[ship.hull], 580, 441, 950, actions.openRecipe);
    const story = hullUnlockReason(c, ship.hull),
        tech = c.station.workshopLevel < HULLS[ship.hull].workshop,
        full = ownedShips(c).length >= FLEET_LIMIT;
    const reason =
        ship.hull === 'prospector'
            ? 'Prospector 0 nie podlega produkcji.'
            : c.activeRun
              ? 'Budowa dostępna po powrocie do bazy.'
              : story ||
                (tech
                    ? 'Rozbuduj zaplecze, aby budować ten projekt.'
                    : full
                      ? 'Hangar pełny · zwolnij miejsce we flocie.'
                      : hasHullParts(c.bank, ship.hull)
                        ? 'Komplet części gotowy.'
                        : 'Skompletuj części w warsztacie.');
    label(ui, reason, 580, 693, 16, story || tech || full ? C.gold : C.muted, 930);
    button(
        ui,
        tech ? 'ROZBUDOWA STACJI →' : full ? 'OTWÓRZ HANGAR →' : 'ZBUDUJ STATEK →',
        1070,
        749,
        460,
        () => {
            if (tech) actions.openStation();
            else if (full) actions.openFleet();
            else actions.buyShip(ship.hull);
        },
        true,
        !c.activeRun && !story && (tech || full || hasHullParts(c.bank, ship.hull)),
        38,
        15,
    ).label = 'hangar-build';
}
function moduleScreen(
    ui: Container,
    c: Campaign,
    ship: Ship,
    state: HangarState,
    project: boolean,
    actions: HangarActions,
) {
    MODULE_KEYS.forEach((key, i) => {
        const tab = choiceCard(ui, 580, 410 + i * 57, 225, 49, state.module === key, () => {
            state.module = key;
            actions.refresh();
        });
        tab.label = `module-tab:${key}`;
        label(
            tab,
            shipUpgradeDefinition(ship.hull, key).title,
            12,
            8,
            14,
            state.module === key ? C.mint : C.text,
            200,
        );
        segments(tab, ship[key], Math.max(1, ship[key], c.station.workshopLevel), 13, 33, 71);
        label(tab, project ? 'Podgląd' : `Poziom ${ship[key]}`, 111, 31, 11, C.muted, 102);
    });
    const offer = moduleOffer(c, ship, state.module, project, state.previewLevel),
        definition = shipUpgradeDefinition(ship.hull, state.module);
    label(ui, definition.title, 835, 410, 25, C.text, 690);
    if (project)
        [1, 2, 3]
            .filter((level) => level <= c.station.workshopLevel)
            .forEach((level, i) =>
                button(
                    ui,
                    ['I', 'II', 'III'][i],
                    1328 + i * 67,
                    445,
                    57,
                    () => {
                        state.previewLevel = level;
                        actions.refresh();
                    },
                    state.previewLevel === level,
                    true,
                    30,
                    13,
                ),
            );
    label(
        ui,
        project
            ? 'BAZOWY → PODGLĄD'
            : offer.next > offer.current
              ? `POZIOM ${offer.current} → ${offer.next}`
              : `POZIOM ${offer.current}`,
        835,
        455,
        12,
        C.muted,
    );
    label(ui, offer.comparison.title, 835, 482, 16, C.muted, 370);
    label(
        ui,
        offer.next > offer.current || project
            ? `${offer.comparison.before} → ${offer.comparison.after}`
            : offer.comparison.before,
        835,
        506,
        31,
        C.cyan,
        500,
    );
    const art = new ShipView(previewModules(ship, 'single', state.module, offer.next));
    const bounds = art.getLocalBounds();
    const scale = Math.min(170 / Math.max(1, bounds.height), 102 / Math.max(1, bounds.width));
    art.rotation = -Math.PI / 2;
    art.scale.set(scale);
    art.position.set(
        1445 - ((bounds.minY + bounds.maxY) / 2) * scale,
        544 + ((bounds.minX + bounds.maxX) / 2) * scale,
    );
    art.label = 'module-ship-preview';
    ui.addChild(art);
    label(ui, definition.detail, 835, 554, 15, C.muted, 490);
    if (offer.next > offer.current) {
        label(ui, `CZĘŚCI DO POZIOMU ${['0', 'I', 'II', 'III'][offer.next]}`, 835, 609, 12, C.mint);
        hangarRequirements(ui, c, offer.cost, 835, 634, 695, actions.openRecipe);
    }
    label(
        ui,
        offer.reason ?? 'Gotowe do montażu.',
        835,
        712,
        14,
        offer.reason ? C.gold : C.mint,
        695,
    );
    if (project)
        button(
            ui,
            'PRZEJDŹ DO BUDOWY →',
            1070,
            749,
            460,
            () => {
                state.tab = 'construction';
                actions.refresh();
            },
            false,
            true,
            38,
            14,
        );
    else if (!offer.active)
        button(
            ui,
            'USTAW TEN STATEK AKTYWNY →',
            835,
            749,
            695,
            () => actions.selectShip(ship.id),
            true,
            !c.activeRun,
            38,
            14,
        );
    else
        button(
            ui,
            offer.next <= offer.current
                ? 'ZAMONTOWANO'
                : `ZAMONTUJ ULEPSZENIE ${['0', 'I', 'II', 'III'][offer.next]} →`,
            835,
            749,
            695,
            () => actions.upgrade(state.module),
            true,
            !offer.reason,
            38,
            15,
        ).label = 'hangar-upgrade';
}
export function variantStats(ship: Ship, id: WeaponId) {
    const special = ['widmo', 'mule', 'atlas', 'harpoon', 'aegis', 'stinger', 'phoenix'].includes(
            ship.hull,
        ),
        beam = ['mule', 'phoenix'].includes(ship.hull),
        w = WEAPONS[id],
        kit = ARMAMENT_KITS[id];
    return {
        special,
        title: special ? armamentName(ship.hull, id) : w.name,
        metrics: special
            ? `Moc ×${kit.power} · ${beam ? `zasięg ×${kit.range}` : `cykl ×${kit.cooldown}`}`
            : `${w.damage} obrażeń · ${(1 / w.interval).toFixed(1)} strz./s`,
        detail: special
            ? id === 'standard'
                ? 'Fabryczne parametry systemu.'
                : id === 'pulse'
                  ? 'Mniejsza moc; dłuższy zasięg wiązek lub szybszy cykl działania.'
                  : 'Większa moc; krótszy zasięg wiązek lub dłuższy cykl działania.'
            : w.detail,
    };
}
function variantScreen(
    ui: Container,
    c: Campaign,
    ship: Ship,
    state: HangarState,
    project: boolean,
    actions: HangarActions,
) {
    const variants = (Object.keys(WEAPONS) as WeaponId[]).filter(
        (id) => ship.weapons.includes(id) || c.station.workshopLevel >= WEAPONS[id].workshop,
    );
    if (!variants.includes(state.variant)) state.variant = ship.weapon;
    variants.forEach((id, i) => {
        const data = variantStats(ship, id);
        const card = choiceCard(ui, 580 + i * 322, 410, 306, 107, state.variant === id, () => {
            state.variant = id;
            actions.refresh();
        });
        card.label = `variant-tab:${id}`;
        label(
            card,
            id === 'standard' ? 'Standard' : id === 'pulse' ? 'Impulsowy' : 'Ciężki',
            16,
            14,
            21,
            state.variant === id ? C.mint : C.text,
            272,
        );
        label(card, data.metrics, 16, 48, 14, C.muted, 274);
        label(
            card,
            !project && ship.weapon === id
                ? '● Zamontowany'
                : !project && ship.weapons.includes(id)
                  ? 'Odblokowany'
                  : 'Kierunek rozwoju',
            16,
            80,
            12,
            C.muted,
        );
    });
    const data = variantStats(ship, state.variant),
        owned = ship.weapons.includes(state.variant),
        mounted = ship.weapon === state.variant,
        active = c.ship?.id === ship.id;
    label(ui, data.title, 580, 537, 23, C.text, 950);
    label(ui, data.detail, 580, 573, 16, C.muted, 940);
    if (project && state.variant === 'standard') {
        label(ui, 'Wyposażenie fabryczne · bez dodatkowych części.', 580, 635, 17, C.cyan, 900);
    } else if (project || !owned) {
        label(ui, 'CZĘŚCI DO ODBLOKOWANIA WARIANTU', 580, 612, 12, C.mint);
        hangarRequirements(
            ui,
            c,
            WEAPON_PARTS[state.variant],
            580,
            635,
            950,
            actions.openRecipe,
            3,
        );
    } else
        label(
            ui,
            'Ten wariant należy do statku. Zmiana posiadanego wariantu jest bezpłatna.',
            580,
            635,
            17,
            C.cyan,
            900,
        );
    const tech = c.station.workshopLevel < WEAPONS[state.variant].workshop;
    label(
        ui,
        project
            ? 'Podgląd projektu · wybór wariantu nie zmienia posiadanej floty.'
            : !active
              ? 'Ustaw ten statek jako aktywny, aby zmienić wariant.'
              : tech && !owned
                ? 'Wymagane zaplecze produkcyjne I.'
                : mounted
                  ? 'Wariant zamontowany.'
                  : owned
                    ? 'Gotowy do zamontowania.'
                    : 'Odblokowanie jest jednorazowym zakupem dla tego statku.',
        580,
        project || !owned ? 715 : 704,
        14,
        C.muted,
        950,
    );
    // Armament bills fit one row of three spacious cards.
    if (project) return;
    if (!active)
        button(
            ui,
            'USTAW TEN STATEK AKTYWNY →',
            1070,
            752,
            460,
            () => actions.selectShip(ship.id),
            true,
            !c.activeRun,
            36,
            14,
        );
    else
        button(
            ui,
            mounted ? 'ZAMONTOWANY' : owned ? 'ZAMONTUJ WARIANT →' : 'ODBLOKUJ I ZAMONTUJ →',
            1070,
            752,
            460,
            () => actions.equipWeapon(state.variant),
            true,
            !c.activeRun &&
                !mounted &&
                (owned || (!tech && canAffordEquipment(c.bank, WEAPON_PARTS[state.variant]))),
            36,
            14,
        ).label = 'hangar-variant';
}
