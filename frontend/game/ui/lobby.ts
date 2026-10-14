import {
    AEGIS,
    ATLAS_WEAPONS,
    GAME,
    PHOENIX,
    STINGER_AMMO,
    WIDMO,
    WEAPONS,
    type WeaponId,
} from '../config';
import { HarpoonArms, HARPOON_ARMS } from '../systems/harpoonArms';
import { Container, Graphics } from 'pixi.js';
import {
    CONTRACTS,
    CrewRole,
    CREW,
    FLEET_LIMIT,
    HULLS,
    HullId,
    JOBS,
    JobKind,
    PILOTS,
    PILOT_PROGRESSION,
    PILOT_SKILLS,
    PilotSkillId,
    UPGRADES,
    shipUpgradeDefinition,
    Upgrade,
} from '../config';
import {
    Campaign,
    capacity,
    selectedPilot,
    storageCapacity,
    storageUsed,
    upgradePrice,
    ownedShips,
    shipHealth,
    scrapRefund,
    pilotSlots,
} from '../state/campaign';
import { workerJobs, jobStorage } from '../state/crew';
import { recoveryChances } from '../state/recovery';
import { contractLockReason } from '../state/contracts';
import { MAX_PILOT_XP, pilotLevel, pilotPoints, pilotName } from '../state/pilots';
import { C } from '../graphics/shapes';
import { button, clear, label, panel } from './primitives';

import {
    bareModules,
    choiceCard,
    cost,
    fittedShip,
    fittedScene,
    hullPreview,
    lobbyIcon,
    operationScene,
    pilotPortrait,
    segments,
    signalScene,
    stat,
    stationScene,
    workshopScene,
} from './lobbyGraphics';

export type LobbyTab = 'overview' | 'hangar' | 'station' | 'pilots' | 'crew' | 'recovery';
export interface LobbyActions {
    launch: (recoveryId: number | null) => void;
    equipWeapon: (weapon: WeaponId) => void;
    upgrade: (upgrade: Upgrade) => void;
    hire: (archetype: number) => void;
    selectPilot: (id: number) => void;
    trainPilot: (id: number, skill: PilotSkillId) => void;
    contract: (id: number) => void;
    buyShip: (hull: HullId) => void;
    selectShip: (id: number) => void;
    scrapShip: (id: number) => void;
    rescue: () => void;
    hireMechanic: () => void;
    hireQuartermaster: () => void;
    queueJob: (kind: JobKind) => void;
    cancelJob: (id: number) => void;
}

const NAV: { tab: LobbyTab; title: string; icon: Parameters<typeof lobbyIcon>[0] }[] = [
    { tab: 'overview', title: 'Wyprawa', icon: 'flight' },
    { tab: 'hangar', title: 'Hangar', icon: 'ship' },
    { tab: 'station', title: 'Stacja', icon: 'station' },
    { tab: 'pilots', title: 'Piloci', icon: 'pilot' },
    { tab: 'crew', title: 'Załoga', icon: 'crew' },
    { tab: 'recovery', title: 'Ratunek', icon: 'signal' },
];
export class LobbyView extends Container {
    private content = new Container();
    private visual = new Container();
    private tab: LobbyTab = 'overview';
    private time = 0;
    private message = '';
    private messageUntil = 0;
    private toast: ReturnType<typeof label> | null = null;
    private hangarMode: 'owned' | 'shop' | 'weapons' = 'owned';
    private chosenShipId: number | null = null;
    private weaponFocus: WeaponId = 'standard';
    private shopHull: HullId = 'swift';
    private shopPage = 0;
    private pilotMode: 'roster' | 'recruit' = 'roster';
    private chosenPilotId: number | null = null;
    private recruit = 0;
    private stationPart: 'workshop' | 'storage' = 'workshop';
    private recipe: JobKind = 'refine';
    private crewRole: CrewRole = 'mechanic';
    private moduleFocus: 'engine' | 'handling' | 'cargo' | 'drill' | 'armor' | 'shield' = 'engine';
    private scrapCandidate: number | null = null;
    private recoveryId: number | null = null;
    constructor(
        private campaign: Campaign,
        private actions: LobbyActions,
    ) {
        super();
        this.addChild(this.visual, this.content);
        this.refresh();
    }
    private go(tab: LobbyTab) {
        this.tab = tab;
        this.refresh();
    }
    private art(view: Container, x = 625, y = 440) {
        view.position.set(x, y);
        this.visual.addChild(view);
    }
    private section(title: string, subtitle: string) {
        const ui = this.content;
        label(ui, title, 280, 111, 39);
        label(ui, subtitle, 282, 166, 16, C.muted);
        panel(ui, 1040, 214, 520, 591);
    }
    refresh(message?: string) {
        if (message !== undefined) {
            this.message = message;
            this.messageUntil = this.time + 6;
        }
        clear(this.content);
        clear(this.visual);
        this.visual.y = 0;
        const c = this.campaign,
            ui = this.content;
        if (!ownedShips(c).some((ship) => ship.id === this.chosenShipId))
            this.chosenShipId = c.ship?.id ?? ownedShips(c)[0]?.id ?? null;
        if (!c.pilots.some((pilot) => pilot.id === this.chosenPilotId))
            this.chosenPilotId = c.selectedPilot || c.pilots[0]?.id || null;
        if (!c.recoverySignals.some((signal) => signal.id === this.recoveryId))
            this.recoveryId = c.recoverySignals[0]?.id ?? null;
        ui.addChild(
            new Graphics()
                .rect(0, 0, 235, 900)
                .fill({ color: C.ink, alpha: 0.9 })
                .moveTo(235, 30)
                .lineTo(235, 870)
                .stroke({ color: C.line, width: 1 }),
        );
        const logo = lobbyIcon('station');
        logo.position.set(50, 56);
        ui.addChild(logo);
        label(ui, 'AURORA', 75, 43, 23, C.text);
        label(ui, 'DOM POŚRÓD GWIAZD', 31, 91, 11, C.muted);
        NAV.forEach(({ tab, title, icon }, i) => {
            const card = choiceCard(ui, 25, 184 + i * 65, 185, 51, this.tab === tab, () =>
                this.go(tab),
            );
            const mark = lobbyIcon(icon, this.tab === tab ? C.mint : C.muted);
            mark.position.set(24, 25);
            card.addChild(mark);
            label(card, title, 49, 15, 17, this.tab === tab ? C.mint : C.text);
            const badge =
                tab === 'pilots'
                    ? c.pilots.reduce((sum, p) => sum + pilotPoints(p), 0)
                    : tab === 'recovery'
                      ? c.recoverySignals.length
                      : 0;
            if (badge) label(card, tab === 'pilots' ? '+' : `${badge}`, 163, 16, 15, C.gold);
        });
        label(ui, 'ESC · USTAWIENIA', 30, 818, 12, C.muted);
        label(ui, 'ORBIT / 0.31', 30, 851, 11, C.muted);
        label(ui, '● DOK BEZPIECZNY', 282, 44, 13, C.mint);
        cost(ui, c.bank.ore, c.bank.parts, 1130, 37, true);
        const crystalIcon = lobbyIcon('crystals', 0xc2a0ec);
        crystalIcon.position.set(1410, 48);
        ui.addChild(crystalIcon);
        label(ui, `${c.bank.crystals ?? 0}`, 1435, 37, 20, 0xc2a0ec);
        if (this.tab === 'overview') this.overview(ui);
        if (this.tab === 'hangar') this.hangar(ui);
        if (this.tab === 'station') this.station(ui);
        if (this.tab === 'pilots') this.pilots(ui);
        if (this.tab === 'crew') this.crew(ui);
        if (this.tab === 'recovery') this.recovery(ui);
        this.toast = label(
            ui,
            this.time < this.messageUntil ? this.message : '',
            282,
            847,
            16,
            C.gold,
            1260,
        );
        if (this.scrapCandidate !== null) this.scrapConfirmation(ui);
    }
    private departure(ui: Container, recoveryId: number | null = null) {
        const c = this.campaign,
            ready = !!c.ship && !!selectedPilot(c);
        button(
            ui,
            ready
                ? recoveryId === null
                    ? 'WYRUSZ →'
                    : 'WYRUSZ NA RATUNEK →'
                : !c.ship
                  ? 'PRZYGOTUJ STATEK →'
                  : 'ZATRUDNIJ PILOTA →',
            1072,
            719,
            456,
            () => {
                if (ready) this.actions.launch(recoveryId);
                else this.go(!c.ship ? 'hangar' : 'pilots');
            },
            true,
            !c.activeRun,
            52,
        );
        if (
            !ready &&
            ((!c.ship && (c.reserveShips.length > 0 || c.bank.ore < HULLS.prospector.ore)) ||
                (!c.pilots.length && c.bank.ore < 12))
        )
            button(
                ui,
                'Wyposażenie awaryjne',
                1072,
                775,
                456,
                this.actions.rescue,
                false,
                true,
                27,
            );
    }
    private overview(ui: Container) {
        const c = this.campaign,
            pilot = selectedPilot(c),
            contract = CONTRACTS[c.contract];
        this.section('Dokąd dziś polecisz?', 'Wybierz kontrakt i przygotuj wyprawę.');
        CONTRACTS.forEach((entry, id) => {
            const lock = contractLockReason(c, id);
            const card = choiceCard(
                ui,
                280 + (id % 3) * 240,
                232 + Math.floor(id / 3) * 137,
                225,
                118,
                c.contract === id,
                () => this.actions.contract(id),
                !lock,
            );
            label(card, entry.title, 16, 15, 18, lock ? C.muted : C.text, 193);
            label(
                card,
                lock ||
                    (entry.sites.includes('escort')
                        ? 'Lot i badania · N Kepler'
                        : entry.sites.includes('fortress')
                          ? '5 obrońców · dane rdzenia'
                          : entry.kills
                            ? `${entry.kills} drony`
                            : entry.sites.includes('outpost')
                              ? 'Przechwyt danych'
                              : entry.sites.length
                                ? `${entry.sites.length} ${entry.sites.length === 1 ? 'skan' : 'skany'}`
                                : `${entry.ore} rudy${entry.parts ? ` · ${entry.parts} komponenty` : ''}`),
                16,
                61,
                14,
                C.muted,
                193,
            );
            label(
                card,
                lock ? 'ZABLOKOWANY' : `+${entry.rewardOre} R · +${entry.rewardParts} K`,
                16,
                94,
                12,
                lock ? C.muted : C.gold,
            );
        });
        this.art(operationScene(!!contract.sites.length, !!contract.kills), 625, 735);
        label(ui, 'WYBRANY KONTRAKT', 1072, 244, 13, C.muted);
        label(ui, contract.title, 1072, 276, 29, C.text, 456);
        label(ui, contract.detail, 1072, 328, 18, C.muted, 456);
        label(ui, 'PREMIA PO POWROCIE', 1072, 403, 12, C.muted);
        cost(ui, contract.rewardOre, contract.rewardParts, 1072, 430);
        ui.addChild(
            new Graphics().moveTo(1072, 481).lineTo(1528, 481).stroke({ color: C.line, width: 1 }),
        );
        label(
            ui,
            c.ship ? HULLS[c.ship.hull].name : 'Brak statku',
            1072,
            506,
            23,
            c.ship ? C.text : C.red,
        );
        label(
            ui,
            c.ship
                ? `Kadłub ${shipHealth(c.ship)} · ładownia ${capacity(c)}`
                : 'Wybierz statek w hangarze',
            1072,
            542,
            16,
            C.muted,
        );
        label(
            ui,
            pilot ? `${pilot.name} · P${pilot.level}` : 'Brak pilota',
            1072,
            584,
            20,
            pilot ? C.text : C.red,
        );
        label(
            ui,
            `${Math.min(c.repairKits, CREW.embarkKits)} zest. naprawczych na pokład`,
            1072,
            623,
            15,
            C.muted,
        );
        label(
            ui,
            contract.kills
                ? 'Wróć do Aurory, aby rozliczyć zwycięstwa.'
                : 'Dostarcz ładunek i dane do Aurory.',
            1072,
            675,
            15,
            C.muted,
        );
        this.departure(ui);
    }
    private hangar(ui: Container) {
        const c = this.campaign,
            ships = ownedShips(c),
            catalogue = Object.keys(HULLS) as HullId[];
        this.section(
            'Twój statek. Twój styl.',
            'Wybierz kadłub, zmień statek lub zamontuj moduły.',
        );
        button(
            ui,
            `Moje statki · ${ships.length}/${FLEET_LIMIT}`,
            280,
            220,
            235,
            () => {
                this.hangarMode = 'owned';
                this.refresh();
            },
            this.hangarMode === 'owned',
            true,
            38,
        );
        button(
            ui,
            'Stocznia',
            529,
            220,
            170,
            () => {
                this.hangarMode = 'shop';
                this.refresh();
            },
            this.hangarMode === 'shop',
            true,
            38,
        );
        button(
            ui,
            'Uzbrojenie',
            713,
            220,
            240,
            () => {
                this.hangarMode = 'weapons';
                this.weaponFocus = c.ship?.weapon ?? 'standard';
                this.refresh();
            },
            this.hangarMode === 'weapons',
            true,
            38,
        );
        if (this.hangarMode === 'weapons') {
            this.weaponPanel(ui);
            return;
        }
        const ship = ships.find((entry) => entry.id === this.chosenShipId);
        const modules = this.hangarMode === 'shop' ? bareModules(this.shopHull) : ship;
        if (modules) this.art(hullPreview(modules), 625, 430);
        else {
            label(ui, 'Hangar czeka na nowy statek.', 392, 431, 25, C.muted);
            button(ui, 'Otwórz stocznię', 425, 494, 330, () => {
                this.hangarMode = 'shop';
                this.refresh();
            });
        }
        const pages = Math.ceil(catalogue.length / FLEET_LIMIT);
        if (this.hangarMode === 'shop' && pages > 1) {
            const changePage = (direction: number) => {
                this.shopPage = (this.shopPage + direction + pages) % pages;
                this.shopHull = catalogue[this.shopPage * FLEET_LIMIT];
                this.refresh();
            };
            button(ui, '←', 280, 548, 48, () => changePage(-1), false, true, 32);
            label(ui, `${this.shopPage + 1} / ${pages}`, 614, 554, 15, C.muted);
            button(ui, '→', 937, 548, 48, () => changePage(1), false, true, 32);
        }
        const entries =
            this.hangarMode === 'shop'
                ? catalogue.slice(this.shopPage * FLEET_LIMIT, (this.shopPage + 1) * FLEET_LIMIT)
                : ships;
        entries.forEach((entry, i) => {
            const hull = typeof entry === 'string' ? entry : entry.hull,
                config = HULLS[hull];
            const selected =
                typeof entry === 'string' ? this.shopHull === hull : this.chosenShipId === entry.id;
            const card = choiceCard(
                ui,
                280 + (i % 3) * 240,
                594 + Math.floor(i / 3) * 109,
                225,
                91,
                selected,
                () => {
                    if (typeof entry === 'string') this.shopHull = entry;
                    else this.chosenShipId = entry.id;
                    this.refresh();
                },
            );
            const thumbnail = fittedShip(
                typeof entry === 'string' ? bareModules(hull) : entry,
                52,
                72,
            );
            thumbnail.position.set(37, 45);
            card.addChild(thumbnail);
            label(card, config.name, 75, 16, 16, C.text, 140);
            label(
                card,
                typeof entry === 'string'
                    ? config.role
                    : c.ship?.id === entry.id
                      ? 'Aktywny'
                      : `Rezerwa #${entry.id}`,
                75,
                51,
                13,
                typeof entry !== 'string' && c.ship?.id === entry.id ? C.mint : C.muted,
                140,
            );
        });
        if (!modules) {
            label(ui, 'Brak statku', 1072, 252, 28);
            label(ui, 'Wybierz kadłub w stoczni.', 1072, 311, 18, C.muted);
            return;
        }
        const config = HULLS[modules.hull],
            owned = this.hangarMode === 'owned';
        label(ui, owned ? 'WYBRANY STATEK' : 'STOCZNIA / KADŁUB', 1072, 244, 13, C.muted);
        label(
            ui,
            `${config.name}${ship && owned ? ` #${ship.id}` : ''}`,
            1072,
            276,
            29,
            C.text,
            456,
        );
        label(ui, config.role, 1072, 318, 15, C.muted);
        stat(ui, 'KADŁUB', `${config.health + modules.armor * 25}`, 1072, 358, 'health');
        stat(ui, 'ŁADOWNIA', `${config.cargo + modules.cargo * 15}`, 1230, 358, 'cargo');
        stat(ui, 'PRĘDKOŚĆ', `${config.maxSpeed}`, 1390, 358);
        label(
            ui,
            `Tarcza ${Math.round(config.shield.capacity * (1 + modules.shield * 0.25))} · regeneracja ${(config.shield.regen * (1 + modules.shield * 0.15)).toFixed(1)}/s`,
            1072,
            400,
            13,
            C.cyan,
        );
        if (owned && ship) {
            label(
                ui,
                modules.hull === 'harpoon'
                    ? `Ramiona 2 · chwytaki ${config.grabbers.length} · zasięg ${Math.round(new HarpoonArms(modules.handling).reach * config.size)} m`
                    : modules.hull === 'atlas'
                      ? `Rakieta · salwa ${1 + modules.drill} granatów · 4 chwytaki`
                      : modules.hull === 'aegis'
                        ? `Energia · dron ${AEGIS.droneHull * (1 + modules.handling * 0.25)} HP · impuls · 1 chwytak`
                        : modules.hull === 'swift'
                          ? `Działko · kamuflaż 3 s / ${(WIDMO.cooldown / (1 + modules.drill * 0.2)).toFixed(1)} s · 1 chwytak`
                          : modules.hull === 'mule'
                            ? `Lasery 2 · zestaw ${JOBS.kit.ore * 2}/${JOBS.kit.parts * 2} · chwytaki 3`
                            : modules.hull === 'fighter'
                              ? `Działa 2 · granaty ${1 + modules.drill} · 1 chwytak`
                              : modules.hull === 'tug'
                                ? 'Działko · laser · 2 hole · 2 chwytaki'
                                : `Działa ${config.guns.length} · lasery ${config.lasers.length} · chwytaki ${config.grabbers.length} · skręt ${(config.turnSpeed * (1 + modules.handling * 0.2)).toFixed(2)}`,
                1072,
                421,
                14,
                C.muted,
            );
            this.shipModules(ui, ship);
            if (c.ship?.id !== ship.id) {
                button(
                    ui,
                    'USTAW AKTYWNY',
                    1072,
                    721,
                    285,
                    () => this.actions.selectShip(ship.id),
                    true,
                );
                button(ui, 'Złomuj', 1373, 721, 155, () => {
                    this.scrapCandidate = ship.id;
                    this.refresh();
                });
            } else label(ui, '● Aktywny statek na następną wyprawę', 1072, 754, 15, C.mint);
        } else {
            stat(ui, 'SKRĘT', `${config.turnSpeed.toFixed(2)}`, 1072, 427);
            stat(ui, 'BOOST', `×${config.boost}`, 1230, 427);
            stat(
                ui,
                'KAMUFLAŻ',
                modules.hull === 'swift'
                    ? '3 s / PPM'
                    : !config.cloak
                      ? 'Brak'
                      : config.cloak >= 0.5
                        ? 'Dobry'
                        : config.cloak >= 0.35
                          ? 'Średni'
                          : 'Słaby',
                1390,
                427,
            );
            label(
                ui,
                modules.hull === 'harpoon'
                    ? '2 ramiona bojowe · 4 chwytaki'
                    : modules.hull === 'atlas'
                      ? 'Rakieta · granaty · 4 chwytaki'
                      : modules.hull === 'aegis'
                        ? 'Działko energetyczne · dron · 1 chwytak'
                        : `${config.guns.length} ${config.guns.length === 1 ? 'działo' : 'działa'} · ${config.lasers.length} ${config.lasers.length === 1 ? 'laser' : 'lasery'} · ${config.grabbers.length} ${config.grabbers.length === 1 ? 'chwytak' : 'chwytaki'}`,
                1072,
                493,
                16,
                C.text,
            );
            label(
                ui,
                modules.hull === 'harpoon'
                    ? `Ramiona ${Math.round(HARPOON_ARMS.reach * config.size)} m · chwytaki ${config.grabberRange} m`
                    : modules.hull === 'atlas'
                      ? 'Namierzanie 3 s · granaty 0,7 s'
                      : modules.hull === 'aegis'
                        ? 'Impuls tarcz 420 m · ochrona 6 s'
                        : modules.hull === 'swift'
                          ? 'Kamuflaż 3 s · odnowienie 12 s'
                          : modules.hull === 'fighter'
                            ? 'Granaty: wybuch 65 m · zapalnik 0,7 s'
                            : modules.hull === 'tug'
                              ? 'Laser 320 m · dwa niezależne hole'
                              : `${config.lasers.length ? `Laser ${config.laserRange} m · ` : ''}chwytaki ${config.grabberRange} m`,
                1072,
                522,
                15,
                C.muted,
            );
            label(ui, config.detail, 1072, 564, 16, C.muted, 456);
            const locked = c.station.workshop < config.workshop,
                full = ships.length >= FLEET_LIMIT;
            label(
                ui,
                locked
                    ? `Wymagany warsztat ${config.workshop === 2 ? 'II' : 'I'}`
                    : full
                      ? 'Hangar pełny · zwolnij miejsce we flocie'
                      : 'KOSZT NOWEGO STATKU',
                1072,
                639,
                13,
                locked || full ? C.gold : C.muted,
            );
            cost(ui, config.ore, config.parts, 1072, 671);
            button(
                ui,
                locked ? 'ROZBUDUJ WARSZTAT →' : full ? 'OTWÓRZ FLOTĘ →' : 'KUP STATEK →',
                1072,
                719,
                456,
                () => {
                    if (locked) {
                        this.stationPart = 'workshop';
                        this.go('station');
                    } else if (full) {
                        this.hangarMode = 'owned';
                        this.refresh();
                    } else {
                        this.chosenShipId = null;
                        this.hangarMode = 'owned';
                        this.actions.buyShip(modules.hull);
                    }
                },
                true,
                locked || full || (c.bank.ore >= config.ore && c.bank.parts >= config.parts),
                52,
            );
        }
    }
    private weaponPanel(ui: Container) {
        const c = this.campaign,
            ship = c.ship;
        if (!ship) {
            label(ui, 'Wybierz aktywny statek we flocie.', 390, 430, 23, C.muted);
            return;
        }
        if (ship.hull === 'phoenix') {
            this.art(hullPreview(ship), 625, 430);
            label(ui, 'UZBROJENIE / FENIKS', 1072, 244, 13, C.muted);
            label(ui, 'Laser i rakieta', 1072, 279, 30, C.text, 456);
            const multiplier = 1 + ship.drill * 0.25;
            stat(ui, 'LASER / HP/S', `${PHOENIX.laserDamage * multiplier}`, 1072, 365);
            stat(
                ui,
                'PODPALENIE',
                `${PHOENIX.burnDamage * multiplier}/s · ${PHOENIX.burnSeconds} s`,
                1298,
                365,
            );
            stat(ui, 'LASER / ZASIĘG', `${HULLS.phoenix.laserRange} m`, 1072, 446);
            stat(
                ui,
                'RAKIETA / HP',
                `${ATLAS_WEAPONS.rocket.damage * (1 + ship.handling * 0.25)}`,
                1298,
                446,
            );
            label(
                ui,
                `Wydobycie ${PHOENIX.rockDamage * multiplier}/s · 2 krótkie chwytaki\nRakieta ${ATLAS_WEAPONS.rocket.speed * ATLAS_WEAPONS.rocket.life} m · cykl ${ATLAS_WEAPONS.rocket.interval} s`,
                1072,
                541,
                17,
                C.muted,
                456,
            );
            label(
                ui,
                'LPM: wiązka bojowa i wydobycie\nPPM: rakieta · namierzanie kursorem 3 s\nPodpalenie odnawia czas, nie kumuluje siły.',
                1072,
                604,
                15,
                C.muted,
                456,
            );
            label(
                ui,
                'Stałe uzbrojenie · projektor i układ rakietowy.',
                1072,
                719,
                16,
                C.mint,
                456,
            );
            return;
        }
        if (ship.hull === 'stinger') {
            this.art(hullPreview(ship), 625, 430);
            label(ui, 'UZBROJENIE / ŻĄDŁO', 1072, 244, 13, C.muted);
            label(ui, 'Cztery działka', 1072, 279, 30, C.text, 456);
            const multiplier = 1 + ship.drill * 0.25;
            stat(
                ui,
                'LPM / LEKKIE',
                `4 × ${(STINGER_AMMO.light.damage * STINGER_AMMO.light.patrol * multiplier).toFixed(1)}`,
                1072,
                365,
            );
            stat(
                ui,
                'PPM / PANCERZ',
                `4 × ${(STINGER_AMMO.armor.damage * STINGER_AMMO.armor.lancer * multiplier).toFixed(1)}`,
                1298,
                365,
            );
            stat(ui, 'CYKL LPM', `${STINGER_AMMO.light.interval} s`, 1072, 446);
            stat(ui, 'CYKL PPM', `${STINGER_AMMO.armor.interval} s`, 1298, 446);
            label(
                ui,
                'Po 2 działka na skrzydło · dziób bez broni\nBrak lasera · jeden chwytak',
                1072,
                541,
                17,
                C.muted,
                456,
            );
            label(
                ui,
                'LPM: lekki patrol ×1,5 · Lancer ×0,4\nPPM: lekki patrol ×0,45 · Lancer ×1,5\nWspólny cykl salwy · PPM ma pierwszeństwo',
                1072,
                604,
                15,
                C.muted,
                456,
            );
            label(ui, 'Stałe uzbrojenie · ulepszaj układ amunicji.', 1072, 719, 16, C.mint, 456);
            return;
        }
        if (ship.hull === 'mule') {
            this.art(hullPreview(ship), 625, 430);
            label(ui, 'WYDOBYCIE / MULE', 1072, 244, 13, C.muted);
            label(ui, 'Lasery i naprawy', 1072, 279, 30, C.text, 456);
            stat(
                ui,
                'LASERY / MOC',
                `2 × ${(GAME.laserDamage * HULLS.mule.miningPower * (1 + ship.drill * 0.25)).toFixed(0)}/s`,
                1072,
                365,
            );
            stat(ui, 'ZASIĘG', `${HULLS.mule.laserRange} m`, 1298, 365);
            stat(ui, 'ZESTAW / RUDA', `${JOBS.kit.ore * 2}`, 1072, 446);
            stat(ui, 'KOMPONENTY', `${JOBS.kit.parts * 2}`, 1298, 446);
            label(ui, 'Produkcja przy zapasie 0 · surowce z ładowni', 1072, 526, 15, C.muted, 456);
            label(
                ui,
                'Brak działek · lasery zadają małe obrażenia statkom',
                1072,
                570,
                15,
                C.muted,
                456,
            );
            button(
                ui,
                'MODUŁY WYDOBYWCZE →',
                1072,
                719,
                456,
                () => {
                    this.hangarMode = 'owned';
                    this.chosenShipId = ship.id;
                    this.moduleFocus = 'drill';
                    this.refresh();
                },
                true,
            );
            return;
        }
        if (ship.hull === 'aegis') {
            this.art(hullPreview(ship), 625, 430);
            label(ui, 'OBROŃCA / AEGIS', 1072, 244, 13, C.muted);
            label(ui, 'Energia i osłony', 1072, 279, 30, C.text, 456);
            stat(ui, 'DZIAŁKO / OBRAŻENIA', `${AEGIS.damage * (1 + ship.drill * 0.25)}`, 1072, 365);
            stat(ui, 'BLOKADA BRONI', `${AEGIS.disable} s`, 1298, 365);
            stat(
                ui,
                'DRON / ATAK / HP',
                `${AEGIS.droneDamage * (1 + ship.handling * 0.25)} / ${AEGIS.droneHull * (1 + ship.handling * 0.25)}`,
                1072,
                446,
            );
            stat(
                ui,
                'ODNOWIENIE IMPULSU',
                `${(AEGIS.cooldown / (1 + ship.shield * 0.2)).toFixed(1)} s`,
                1298,
                446,
            );
            label(
                ui,
                `Osłony ${AEGIS.range} m · ${AEGIS.duration} s · bufor ${AEGIS.buffer * (1 + ship.shield * 0.25)}`,
                1072,
                526,
                15,
                C.muted,
                456,
            );
            label(
                ui,
                'Ogniwo: obrażenia · system drona: atak i kadłub\nImpuls: szybsze odnowienie i mocniejsze tarcze',
                1072,
                570,
                15,
                C.muted,
                456,
            );
            button(
                ui,
                'MODUŁY WSPARCIA →',
                1072,
                719,
                456,
                () => {
                    this.hangarMode = 'owned';
                    this.chosenShipId = ship.id;
                    this.moduleFocus = 'drill';
                    this.refresh();
                },
                true,
            );
            return;
        }
        if (ship.hull === 'atlas') {
            this.art(hullPreview(ship), 625, 430);
            label(ui, 'GRENADIER / ATLAS', 1072, 244, 13, C.muted);
            label(ui, 'Rakiety i granaty', 1072, 279, 30, C.text, 456);
            stat(
                ui,
                'RAKIETA / OBRAŻENIA',
                `${ATLAS_WEAPONS.rocket.damage * (1 + ship.handling * 0.25)}`,
                1072,
                365,
            );
            stat(ui, 'PROMIEŃ WYBUCHU', `${ATLAS_WEAPONS.rocket.radius} m`, 1298, 365);
            stat(
                ui,
                'GRANATY / SALWA',
                `${1 + ship.drill} × ${ATLAS_WEAPONS.grenade.damage}`,
                1072,
                446,
            );
            stat(
                ui,
                'PROMIEŃ / ZAPALNIK',
                `${ATLAS_WEAPONS.grenade.radius} m / ${ATLAS_WEAPONS.grenade.life} s`,
                1298,
                446,
            );
            label(ui, 'Rakieta · namierzanie 3 s · zasięg 2880 m', 1072, 526, 15, C.muted, 456);
            label(
                ui,
                shipUpgradeDefinition('atlas', 'handling').detail,
                1072,
                565,
                15,
                C.muted,
                456,
            );
            label(ui, shipUpgradeDefinition('atlas', 'drill').detail, 1072, 617, 15, C.muted, 456);
            button(
                ui,
                'MODUŁY UZBROJENIA →',
                1072,
                719,
                456,
                () => {
                    this.hangarMode = 'owned';
                    this.chosenShipId = ship.id;
                    this.moduleFocus = 'drill';
                    this.refresh();
                },
                true,
            );
            return;
        }
        if (ship.hull === 'harpoon') {
            const arms = new HarpoonArms(ship.handling, ship.drill);
            this.art(hullPreview(ship), 625, 430);
            label(ui, 'RAMIONA / HARPUN', 1072, 244, 13, C.muted);
            label(ui, 'Szczęki hydrauliczne', 1072, 279, 30, C.text, 456);
            stat(
                ui,
                'SKAŁY / ZACISK',
                `${HARPOON_ARMS.rockDamage * arms.damageMultiplier}`,
                1072,
                365,
            );
            stat(
                ui,
                'STATKI / ZACISK',
                `${HARPOON_ARMS.shipDamage * arms.damageMultiplier}`,
                1298,
                365,
            );
            stat(ui, 'ZASIĘG', `${Math.round(arms.reach * HULLS.harpoon.size)} m`, 1072, 446);
            stat(ui, 'CYKL SZCZĘK', `${HARPOON_ARMS.cycle} s`, 1298, 446);
            label(
                ui,
                shipUpgradeDefinition('harpoon', 'handling').detail,
                1072,
                544,
                16,
                C.muted,
                456,
            );
            label(
                ui,
                shipUpgradeDefinition('harpoon', 'drill').detail,
                1072,
                582,
                16,
                C.muted,
                456,
            );
            button(
                ui,
                'MODUŁY RAMION →',
                1072,
                719,
                456,
                () => {
                    this.hangarMode = 'owned';
                    this.chosenShipId = ship.id;
                    this.moduleFocus = 'drill';
                    this.refresh();
                },
                true,
            );
            return;
        }
        const id = this.weaponFocus,
            w = WEAPONS[id],
            owned = ship.weapons.includes(id),
            mounted = ship.weapon === id;
        this.art(hullPreview({ ...ship, weapon: id }), 625, 430);
        label(ui, `UZBROJENIE / ${HULLS[ship.hull].name}`, 388, 285, 16, C.muted);
        (Object.keys(WEAPONS) as WeaponId[]).forEach((key, i) => {
            const definition = WEAPONS[key],
                card = choiceCard(ui, 280 + i * 240, 650, 225, 141, id === key, () => {
                    this.weaponFocus = key;
                    this.refresh();
                });
            label(card, definition.name, 18, 22, 24);
            label(
                card,
                `${definition.damage} DMG · ${(1 / definition.interval).toFixed(1)}/s`,
                18,
                66,
                15,
                C.muted,
            );
            label(
                card,
                ship.weapon === key
                    ? '● Zamontowane'
                    : ship.weapons.includes(key)
                      ? 'Posiadane'
                      : 'Do kupienia',
                18,
                104,
                14,
                ship.weapon === key ? C.mint : C.muted,
            );
        });
        label(ui, 'DZIAŁKA / AKTYWNY STATEK', 1072, 244, 13, C.muted);
        label(ui, w.name, 1072, 279, 34);
        label(ui, w.detail, 1072, 341, 18, C.muted, 456);
        stat(ui, 'OBRAŻENIA', `${w.damage}`, 1072, 429);
        stat(ui, 'STRZAŁY / S', (1 / w.interval).toFixed(1), 1298, 429);
        stat(ui, 'ZASIĘG', `${Math.round(w.speed * w.life)} m`, 1072, 516);
        stat(ui, 'POCISK', `${w.speed} m/s`, 1298, 516);
        label(
            ui,
            ship.hull === 'fighter'
                ? `Granaty: ${1 + ship.drill} × ${ATLAS_WEAPONS.grenade.damage} · wybuch ${ATLAS_WEAPONS.grenade.radius} m`
                : ship.hull === 'swift'
                  ? `Kamuflaż optyczny ${WIDMO.duration} s · odnowienie ${(WIDMO.cooldown / (1 + ship.drill * 0.2)).toFixed(1)} s`
                  : 'Zmienia wszystkie działka kadłuba.\nLasery: wydobycie i małe obrażenia statkom.',
            1072,
            602,
            15,
            C.muted,
            456,
        );
        if (!owned) cost(ui, w.ore, w.parts, 1072, 679);
        else label(ui, 'Zmiana posiadanej broni jest bezpłatna.', 1072, 679, 15, C.muted);
        button(
            ui,
            mounted
                ? 'ZAMONTOWANE'
                : !owned && c.station.workshop < w.workshop
                  ? 'WYMAGANY WARSZTAT I'
                  : owned
                    ? 'ZAMONTUJ →'
                    : 'KUP I ZAMONTUJ →',
            1072,
            728,
            456,
            () => this.actions.equipWeapon(id),
            true,
            !mounted &&
                (owned ||
                    (c.station.workshop >= w.workshop &&
                        c.bank.ore >= w.ore &&
                        c.bank.parts >= w.parts)),
            48,
        );
    }
    private shipModules(ui: Container, ship: ReturnType<typeof ownedShips>[number]) {
        const c = this.campaign,
            active = c.ship?.id === ship.id,
            limit = c.station.workshop + 1;
        label(
            ui,
            active ? `MODUŁY · LIMIT ${limit}` : 'MODUŁY · AKTYWUJ STATEK, ABY ZMIENIAĆ',
            1072,
            454,
            12,
            C.muted,
        );
        const hint = label(
            ui,
            shipUpgradeDefinition(ship.hull, this.moduleFocus).detail,
            1072,
            733,
            13,
            C.muted,
        );
        (['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const).forEach((key, i) => {
            const level = ship[key],
                price = upgradePrice({ ...c, ship }, key),
                definition = shipUpgradeDefinition(ship.hull, key),
                y = 487 + i * 40;
            label(ui, definition.title, 1072, y, 16);
            segments(ui, level, 3, 1288, y + 5, 69);
            const buy = button(
                ui,
                level >= limit
                    ? 'MAX'
                    : `${price.ore}R ${price.parts}K${price.crystals ? ` ${price.crystals}◆` : ''}`,
                1390,
                y - 6,
                138,
                () => {
                    this.moduleFocus = key;
                    this.actions.upgrade(key);
                },
                false,
                active &&
                    level < limit &&
                    c.bank.ore >= price.ore &&
                    c.bank.parts >= price.parts &&
                    (c.bank.crystals ?? 0) >= (price.crystals ?? 0),
                30,
            );
            buy.config.onHover = () => {
                this.moduleFocus = key;
                hint.setText(definition.detail);
            };
        });
    }
    private station(ui: Container) {
        const c = this.campaign,
            part = this.stationPart,
            level = c.station[part],
            limit = part === 'workshop' ? 2 : 3,
            price = upgradePrice(c, part);
        this.section(
            'Rozwijaj swój dom.',
            'Warsztat i magazyn pozostają z Tobą po każdej wyprawie.',
        );
        this.art(
            fittedScene(stationScene(c.station.workshop + c.station.storage, part), 680, 360),
            625,
            438,
        );
        (['workshop', 'storage'] as const).forEach((key, i) => {
            const card = choiceCard(ui, 280 + i * 240, 650, 225, 141, part === key, () => {
                this.stationPart = key;
                this.refresh();
            });
            const icon = lobbyIcon(key === 'workshop' ? 'crew' : 'cargo');
            icon.position.set(33, 37);
            card.addChild(icon);
            label(card, key === 'workshop' ? 'Warsztat' : 'Magazyn', 64, 23, 23);
            label(card, `Poziom ${c.station[key]}`, 64, 60, 15, C.muted);
            segments(card, c.station[key], key === 'workshop' ? 2 : 3, 24, 109, 177);
        });
        label(ui, 'MODUŁ STACJI', 1072, 244, 13, C.muted);
        label(ui, part === 'workshop' ? 'Warsztat' : 'Magazyn', 1072, 276, 31);
        label(ui, `Poziom ${level} / ${limit}`, 1072, 326, 18, C.mint);
        segments(ui, level, limit, 1072, 367, 456);
        if (part === 'workshop') {
            label(ui, `Moduły statku do poziomu ${level + 1}`, 1072, 405, 24, C.text, 456);
            label(
                ui,
                level === 0
                    ? 'Warsztat I odblokuje nowe kadłuby.'
                    : level < limit
                      ? `Po rozbudowie: moduły do poziomu ${level + 2}.`
                      : 'Najwyższy poziom warsztatu.',
                1072,
                447,
                16,
                C.muted,
                456,
            );
            button(
                ui,
                'Zobacz moduły statku',
                1072,
                511,
                456,
                () => {
                    this.hangarMode = 'owned';
                    this.chosenShipId = c.ship?.id ?? null;
                    this.go('hangar');
                },
                false,
                true,
                40,
            );
        } else {
            stat(
                ui,
                'ZAJĘTE / POJEMNOŚĆ',
                `${storageUsed(c)} / ${storageCapacity(c)}`,
                1072,
                405,
                'cargo',
            );
            label(
                ui,
                `W tym rezerwacje zadań: ${storageUsed(c) - c.bank.ore - c.bank.parts - (c.bank.crystals ?? 0)}`,
                1072,
                468,
                15,
                C.muted,
            );
            label(
                ui,
                level < limit
                    ? 'Rozbudowa: +100 miejsca na surowce.'
                    : 'Najwyższa pojemność magazynu.',
                1072,
                503,
                16,
                C.muted,
            );
        }
        label(ui, 'WYPRAWY', 1072, 576, 12, C.muted);
        label(ui, `${c.sorties}`, 1072, 598, 24);
        label(ui, 'POWROTY', 1245, 576, 12, C.muted);
        label(ui, `${c.recovered}`, 1245, 598, 24);
        label(ui, level >= limit ? 'MAKSYMALNY POZIOM' : 'KOSZT ROZBUDOWY', 1072, 649, 12, C.muted);
        if (level < limit) cost(ui, price.ore, price.parts, 1072, 674, false, price.crystals ?? 0);
        button(
            ui,
            level >= limit ? 'MAKSYMALNY POZIOM' : 'ROZBUDUJ →',
            1072,
            719,
            456,
            () => this.actions.upgrade(part),
            true,
            level < limit &&
                c.bank.ore >= price.ore &&
                c.bank.parts >= price.parts &&
                (c.bank.crystals ?? 0) >= (price.crystals ?? 0),
            52,
        );
    }
    private pilots(ui: Container) {
        const c = this.campaign,
            pilot = c.pilots.find((entry) => entry.id === this.chosenPilotId);
        const recruiting = this.pilotMode === 'recruit',
            profile = recruiting
                ? {
                      ...PILOTS[this.recruit],
                      name: pilotName({ id: c.nextPilotId, archetype: this.recruit }),
                  }
                : pilot
                  ? { ...PILOTS[pilot.archetype], name: pilotName(pilot) }
                  : null;
        this.section(
            'Kto zasiądzie za sterami?',
            'Wybierz pilota, rozwiń umiejętności albo zaproś nową osobę.',
        );
        button(
            ui,
            `Moi piloci · ${c.pilots.length}`,
            280,
            220,
            220,
            () => {
                this.pilotMode = 'roster';
                this.refresh();
            },
            !recruiting,
            true,
            38,
        );
        button(
            ui,
            'Nabór',
            514,
            220,
            170,
            () => {
                this.pilotMode = 'recruit';
                this.refresh();
            },
            recruiting,
            true,
            38,
        );
        if (profile)
            this.art(
                pilotPortrait(
                    recruiting ? this.recruit : pilot!.archetype,
                    false,
                    recruiting ? c.nextPilotId : pilot!.id,
                ),
                625,
                435,
            );
        else {
            label(ui, 'Potrzebujesz nowego pilota.', 391, 417, 26, C.muted);
            button(ui, 'Otwórz nabór', 434, 480, 310, () => {
                this.pilotMode = 'recruit';
                this.refresh();
            });
        }
        if (recruiting)
            PILOTS.slice(0, 3).forEach((entry, i) => {
                const card = choiceCard(
                    ui,
                    280 + i * 240,
                    650,
                    225,
                    139,
                    this.recruit === i,
                    () => {
                        this.recruit = i;
                        this.refresh();
                    },
                );
                label(card, pilotName({ id: c.nextPilotId, archetype: i }), 20, 21, 21);
                label(card, entry.role, 20, 58, 14, C.muted, 185);
                label(card, entry.trait, 20, 98, 14, C.mint);
            });
        else
            c.pilots.forEach((entry, i) => {
                const card = choiceCard(
                    ui,
                    280 + (i % 4) * 181,
                    594 + Math.floor(i / 4) * 109,
                    167,
                    91,
                    this.chosenPilotId === entry.id,
                    () => {
                        this.chosenPilotId = entry.id;
                        this.refresh();
                    },
                );
                const portrait = pilotPortrait(entry.archetype, false, entry.id);
                portrait.scale.set(0.18);
                portrait.position.set(29, 42);
                card.addChild(portrait);
                label(card, pilotName(entry), 58, 15, 14, C.text, 100);
                label(
                    card,
                    `P${pilotLevel(entry)}${c.selectedPilot === entry.id ? ' · aktywny' : ` · #${entry.id}`}`,
                    58,
                    56,
                    12,
                    c.selectedPilot === entry.id ? C.mint : C.muted,
                );
            });
        if (!profile) {
            label(ui, 'Brak pilotów', 1072, 252, 28);
            label(
                ui,
                'Zatrudnij pilota albo odbierz zestaw awaryjny w zakładce Wyprawa.',
                1072,
                316,
                18,
                C.muted,
                456,
            );
            return;
        }
        label(ui, recruiting ? 'NABÓR / PILOT' : 'WYBRANY PILOT', 1072, 244, 13, C.muted);
        label(ui, recruiting ? profile.name : `${profile.name} #${pilot!.id}`, 1072, 276, 31);
        label(ui, profile.role, 1072, 325, 16, C.muted);
        label(ui, profile.trait, 1072, 360, 18, C.mint);
        if (recruiting) {
            label(ui, `Miejsca ${pilotSlots(c)} / 8`, 1072, 425, 22);
            label(ui, 'Piloci w kapsułach też rezerwują miejsce.', 1072, 464, 15, C.muted, 456);
            label(ui, 'Nowy pilot · poziom 1', 1072, 536, 18, C.muted);
            label(ui, 'KOSZT ZATRUDNIENIA', 1072, 649, 12, C.muted);
            cost(ui, 12, 0, 1072, 674);
            button(
                ui,
                pilotSlots(c) >= 8 ? 'ZAŁOGA PEŁNA' : 'ZATRUDNIJ PILOTA →',
                1072,
                719,
                456,
                () => {
                    this.chosenPilotId = null;
                    this.pilotMode = 'roster';
                    this.actions.hire(this.recruit);
                },
                true,
                c.bank.ore >= 12 && pilotSlots(c) < 8,
                52,
            );
        } else if (pilot) {
            const level = pilotLevel(pilot),
                next = PILOT_PROGRESSION.thresholds[level],
                start = PILOT_PROGRESSION.thresholds[level - 1],
                points = pilotPoints(pilot);
            label(
                ui,
                `Poziom ${level} · ${pilot.xp}/${next ?? MAX_PILOT_XP} PD`,
                1072,
                403,
                17,
                C.muted,
            );
            ui.addChild(
                new Graphics()
                    .roundRect(1072, 438, 456, 6, 3)
                    .fill(C.line)
                    .roundRect(
                        1072,
                        438,
                        Math.max(1, 456 * (next ? (pilot.xp - start) / (next - start) : 1)),
                        6,
                        3,
                    )
                    .fill(C.mint),
            );
            label(ui, `UMIEJĘTNOŚCI · ${points} PKT`, 1072, 472, 12, C.gold);
            (Object.keys(PILOT_SKILLS) as PilotSkillId[]).forEach((skill, i) => {
                const y = 502 + i * 55,
                    def = PILOT_SKILLS[skill];
                label(ui, def.title, 1072, y, 18);
                label(ui, def.detail, 1072, y + 25, 13, C.muted);
                segments(ui, pilot.skills[skill], 2, 1330, y + 6, 59);
                button(
                    ui,
                    pilot.skills[skill] >= 2 ? 'MAX' : '+ 1 pkt',
                    1410,
                    y - 3,
                    118,
                    () => this.actions.trainPilot(pilot.id, skill),
                    false,
                    points > 0 && pilot.skills[skill] < 2,
                    32,
                );
            });
            if (c.ship) {
                const chances = recoveryChances(c.ship, pilot);
                label(
                    ui,
                    `Po stracie: kapsuła ${Math.round(chances.pilot * 100)}% · wrak ${Math.round(chances.ship * 100)}%`,
                    1072,
                    688,
                    14,
                    C.muted,
                );
            }
            if (c.selectedPilot !== pilot.id)
                button(
                    ui,
                    'USTAW AKTYWNEGO PILOTA →',
                    1072,
                    731,
                    456,
                    () => this.actions.selectPilot(pilot.id),
                    true,
                    true,
                    48,
                );
            else label(ui, '● Aktywny pilot na następną wyprawę', 1072, 754, 15, C.mint);
        }
    }
    private crew(ui: Container) {
        const c = this.campaign,
            recipe = JOBS[this.recipe],
            role = this.crewRole,
            hired = c.crew[role],
            jobs = workerJobs(c, role),
            quartermaster = role === 'quartermaster';
        this.section(
            'Załoga trzyma wszystko w ruchu.',
            'Zaplanuj pracę warsztatu na czas swojej wyprawy.',
        );
        (['mechanic', 'quartermaster'] as const).forEach((worker, i) => {
            button(
                ui,
                worker === 'mechanic' ? 'Mechanik' : 'Intendent',
                280 + i * 240,
                218,
                225,
                () => {
                    this.crewRole = worker;
                    this.recipe = worker === 'mechanic' ? 'refine' : 'recycle';
                    this.refresh();
                },
                role === worker,
                true,
                38,
            );
        });
        this.art(workshopScene(this.recipe), 625, 441);
        label(
            ui,
            quartermaster ? 'NIKO RELL / INTENDENT BAZY' : 'ADA VALE / MECHANIK STACJI',
            388,
            286,
            16,
            hired ? C.mint : C.muted,
        );
        ((quartermaster ? ['recycle'] : ['refine', 'kit', 'crystallize']) as JobKind[]).forEach(
            (kind, i) => {
                const job = JOBS[kind],
                    card = choiceCard(
                        ui,
                        280 + i * 240,
                        650,
                        225,
                        141,
                        this.recipe === kind,
                        () => {
                            this.recipe = kind;
                            this.refresh();
                        },
                    );
                label(card, job.title, 16, 23, 20, C.text, 190);
                label(
                    card,
                    `${job.seconds} s · ${kind === 'crystallize' ? '1 kryształ' : kind === 'recycle' ? '5 rudy' : kind === 'refine' ? '1 komponent' : '1 zestaw'}`,
                    20,
                    64,
                    15,
                    C.muted,
                );
                cost(card, job.ore, job.parts, 20, 99);
            },
        );
        label(
            ui,
            hired
                ? quartermaster
                    ? 'ODZYSK / KOLEJKA'
                    : 'WARSZTAT / KOLEJKA'
                : quartermaster
                  ? 'ZAŁOGA / INTENDENT'
                  : 'ZAŁOGA / MECHANIK',
            1072,
            244,
            13,
            C.muted,
        );
        label(
            ui,
            hired
                ? `Zadania ${jobs.length}/${CREW.queueLimit}`
                : quartermaster
                  ? 'Niko Rell'
                  : 'Ada Vale',
            1072,
            276,
            31,
        );
        if (!hired) {
            const portrait = pilotPortrait(
                quartermaster ? 2 : 0,
                !quartermaster,
                quartermaster ? 92 : 91,
            );
            portrait.scale.set(0.6);
            portrait.position.set(1300, 447);
            ui.addChild(portrait);
            label(
                ui,
                quartermaster
                    ? 'Odzyska rudę z nadmiarowych komponentów.'
                    : 'Uruchomi rafinację i produkcję zestawów.',
                1072,
                567,
                17,
                C.muted,
                456,
            );
            label(ui, 'KOSZT ZATRUDNIENIA', 1072, 649, 12, C.muted);
            cost(
                ui,
                quartermaster ? CREW.quartermasterOre : CREW.hireOre,
                quartermaster ? CREW.quartermasterParts : 0,
                1072,
                674,
            );
            button(
                ui,
                quartermaster && c.station.workshop < 1
                    ? 'WYMAGANY WARSZTAT I'
                    : quartermaster
                      ? 'ZATRUDNIJ INTENDENTA →'
                      : 'ZATRUDNIJ MECHANIKA →',
                1072,
                719,
                456,
                quartermaster ? this.actions.hireQuartermaster : this.actions.hireMechanic,
                true,
                quartermaster
                    ? c.station.workshop >= 1 &&
                          c.bank.ore >= CREW.quartermasterOre &&
                          c.bank.parts >= CREW.quartermasterParts
                    : c.bank.ore >= CREW.hireOre,
                52,
            );
            return;
        }
        label(
            ui,
            quartermaster
                ? 'Recykling · 1 komponent → 5 rudy'
                : `Zestawy w bazie ${c.repairKits}/${CREW.kitLimit}`,
            1072,
            326,
            16,
            C.muted,
        );
        if (!jobs.length) label(ui, 'Kolejka jest pusta.', 1072, 404, 21, C.muted);
        jobs.forEach((job, i) => {
            const y = 370 + i * 77;
            label(ui, `${i + 1}. ${JOBS[job.kind].title}`, 1072, y, 18);
            label(
                ui,
                `${Math.ceil(job.remaining)} s${i ? ' · w kolejce' : ' · następne do wykonania'}`,
                1072,
                y + 28,
                13,
                C.muted,
            );
            ui.addChild(
                new Graphics()
                    .rect(1072, y + 52, 365, 3)
                    .fill(C.line)
                    .rect(
                        1072,
                        y + 52,
                        Math.max(1, 365 * (1 - job.remaining / JOBS[job.kind].seconds)),
                        3,
                    )
                    .fill(C.mint),
            );
            button(ui, '×', 1468, y + 4, 60, () => this.actions.cancelJob(job.id), false, true, 36);
        });
        label(ui, 'Praca podczas lotu · stanowiska działają równolegle.', 1072, 615, 14, C.muted);
        label(ui, recipe.title, 1072, 654, 17);
        cost(ui, recipe.ore, recipe.parts, 1072, 680);
        const noStorage =
            storageUsed(c) + jobStorage(this.recipe) - recipe.ore - recipe.parts >
            storageCapacity(c);
        const full = jobs.length >= CREW.queueLimit,
            kitsFull =
                this.recipe === 'kit' &&
                c.repairKits + c.crew.jobs.filter((job) => job.kind === 'kit').length >=
                    CREW.kitLimit;
        button(
            ui,
            full
                ? 'KOLEJKA PEŁNA'
                : kitsFull
                  ? 'LIMIT ZESTAWÓW'
                  : noStorage
                    ? 'MAGAZYN PEŁNY'
                    : this.recipe === 'crystallize' && c.station.workshop < 1
                      ? 'WYMAGANY WARSZTAT I'
                      : 'DODAJ ZADANIE →',
            1072,
            728,
            456,
            () => this.actions.queueJob(this.recipe),
            true,
            !full &&
                (this.recipe !== 'crystallize' || c.station.workshop >= 1) &&
                !kitsFull &&
                c.bank.ore >= recipe.ore &&
                c.bank.parts >= recipe.parts &&
                storageUsed(c) + jobStorage(this.recipe) - recipe.ore - recipe.parts <=
                    storageCapacity(c),
            48,
        );
    }
    private recovery(ui: Container) {
        const c = this.campaign,
            signal = c.recoverySignals.find((entry) => entry.id === this.recoveryId);
        this.section(
            'Sygnał wciąż dociera.',
            'Wybierz kapsułę lub wrak i zaplanuj akcję ratunkową.',
        );
        this.art(
            signalScene(c.recoverySignals, this.recoveryId, (id) => {
                this.recoveryId = id;
                this.refresh();
            }),
            625,
            429,
        );
        c.recoverySignals.forEach((entry, i) => {
            const card = choiceCard(
                ui,
                280 + i * 240,
                683,
                225,
                108,
                entry.id === this.recoveryId,
                () => {
                    this.recoveryId = entry.id;
                    this.refresh();
                },
            );
            label(card, `Sygnał #${entry.id}`, 18, 18, 21);
            label(
                card,
                `${(Math.hypot(entry.x, entry.y) / 1000).toFixed(1)} km od Aurory`,
                18,
                49,
                14,
                C.muted,
            );
            label(
                card,
                `${entry.pilot ? 'Kapsuła' : ''}${entry.pilot && entry.ship ? ' + ' : ''}${entry.ship ? 'wrak' : ''}`,
                18,
                78,
                13,
                C.gold,
            );
        });
        if (!signal) {
            label(ui, 'Brak sygnałów do odzyskania.', 381, 718, 22, C.muted);
            label(ui, 'Cisza w eterze.', 1072, 279, 30);
            label(
                ui,
                'Gdy pojawi się sygnał kapsuły lub wraku, znajdziesz go tutaj.',
                1072,
                347,
                18,
                C.muted,
                456,
            );
            button(
                ui,
                'ZAPLANUJ WYPRAWĘ →',
                1072,
                719,
                456,
                () => this.go('overview'),
                true,
                true,
                52,
            );
            return;
        }
        label(ui, 'AKCJA RATUNKOWA', 1072, 244, 13, C.muted);
        label(ui, `Sygnał #${signal.id}`, 1072, 276, 31);
        label(
            ui,
            `${(Math.hypot(signal.x, signal.y) / 1000).toFixed(1)} km od Aurory`,
            1072,
            326,
            17,
            C.muted,
        );
        if (signal.ship) {
            const view = fittedShip(signal.ship, 175, 150);
            view.position.set(1300, 430);
            view.alpha = 0.7;
            ui.addChild(view);
        } else {
            const portrait = pilotPortrait(
                signal.pilot?.archetype ?? 0,
                false,
                signal.pilot?.id ?? 1,
            );
            portrait.scale.set(0.46);
            portrait.position.set(1300, 430);
            ui.addChild(portrait);
        }
        label(
            ui,
            signal.pilot ? pilotName(signal.pilot) : 'Brak kapsuły pilota',
            1072,
            529,
            21,
            signal.pilot ? C.mint : C.muted,
        );
        label(
            ui,
            signal.ship ? HULLS[signal.ship.hull].name : 'Brak wraku statku',
            1072,
            564,
            20,
            signal.ship ? C.text : C.muted,
        );
        label(ui, '6 · cel    E · podjęcie    1 · powrót', 1072, 616, 16, C.muted);
        label(ui, 'Nieudana akcja traci ten cel.', 1072, 656, 15, C.gold);
        if (signal.ship && ownedShips(c).length >= FLEET_LIMIT)
            label(ui, 'Pełny hangar: wrak da materiały.', 1072, 684, 14, C.muted);
        this.departure(ui, signal.id);
    }
    private scrapConfirmation(ui: Container) {
        const ship = this.campaign.reserveShips.find((entry) => entry.id === this.scrapCandidate);
        if (!ship) {
            this.scrapCandidate = null;
            return;
        }
        const refund = scrapRefund(ship),
            room =
                storageUsed(this.campaign) + refund.ore + refund.parts <=
                storageCapacity(this.campaign);
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.88 });
        shade.eventMode = 'static';
        ui.addChild(shade);
        panel(ui, 425, 265, 750, 370);
        label(ui, `Zezłomować ${HULLS[ship.hull].name} #${ship.id}?`, 469, 302, 29);
        label(ui, 'Kadłub i zamontowane moduły zostaną usunięte.', 469, 360, 18, C.red);
        label(ui, 'ODZYSKANE SUROWCE', 469, 409, 12, C.muted);
        cost(ui, refund.ore, refund.parts, 469, 435);
        if (!room) label(ui, 'Brak miejsca w magazynie na odzysk.', 469, 482, 16, C.gold);
        button(ui, 'Anuluj', 469, 544, 300, () => {
            this.scrapCandidate = null;
            this.refresh();
        });
        button(
            ui,
            'Zezłomuj',
            809,
            544,
            320,
            () => {
                const id = this.scrapCandidate!;
                this.scrapCandidate = null;
                this.chosenShipId = null;
                this.actions.scrapShip(id);
            },
            false,
            room,
        );
    }
    update(deltaMS: number) {
        this.time += deltaMS / 1000;
        this.visual.y = this.tab === 'recovery' ? 0 : Math.sin(this.time * 0.25) * 2;
        if (this.toast && this.time >= this.messageUntil) this.toast.setText('');
    }
}
