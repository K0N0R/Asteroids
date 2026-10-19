import { constructionCosts } from './constructionCosts';
import { WEAPON_PARTS, canAffordEquipment } from '../state/equipmentCosts';
import { HULL_CONSTRUCTION, HULL_PARTS, hasHullParts } from '../state/fleetConstruction';
import { itemIllustration } from '../graphics/items';
import { stationShieldContent, stationDronesContent } from './stationShield';
import { laboratoryOverview, workshopOverview } from './production';
import {
    RESOURCE_IDS,
    RESOURCES,
    resourceTotal,
    resourceSummary,
    type ResourceStore,
} from '../state/resources';
import { hullUnlockReason } from '../state/fleetUnlocks';
import { latestDialogue } from '../state/dialogues';
import { storyOverview } from './storyOverview';
import {
    STORY_SECTORS,
    constructionManifest,
    actOneComplete,
    actTwoComplete,
    storyAct,
    type StorySectorId,
} from '../state/story';
import { previewModules, moduleComparison, type ModulePreviewMode } from './modulePreview';
import { ARMAMENT_KITS, armamentName } from '../config';
import { ATLAS_WEAPONS, GAME, PHOENIX, STINGER_AMMO, WEAPONS, type WeaponId } from '../config';
import { Container, Graphics } from 'pixi.js';
import {
    CONTRACTS,
    REPAIR_KITS,
    FLEET_LIMIT,
    HULLS,
    HullId,
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
    storageUsed,
    upgradePrice,
    ownedShips,
    shipHealth,
    scrapRefund,
    canScrapShip,
    pilotSlots,
} from '../state/campaign';
import { RECIPES, type RecipeId } from '../state/chemistry';
import { recoveryChances } from '../state/recovery';
import { contractLockReason } from '../state/contracts';
import { MAX_PILOT_XP, pilotLevel, pilotPoints, pilotName } from '../state/pilots';
import { C } from '../graphics/shapes';
import { button, clear, label, panel, illustrationInBox, STATION_LAYOUT } from './primitives';

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
    productionBayScene,
} from './lobbyGraphics';

export type LobbyTab =
    | 'overview'
    | 'hangar'
    | 'station'
    | 'pilots'
    | 'warehouse'
    | 'recovery'
    | 'laboratory'
    | 'workshop';
export interface LobbyActions {
    replayDialogue?: () => void;
    openSandbox?: () => void;
    switchProfile?: () => void;
    travel?: (id: StorySectorId) => void;
    contribute?: (id: string) => void;
    briefing?: () => void;
    launch: (
        recoveryId: number | null,
        loadConstruction?: boolean,
        missionTask?: string | null,
        supplies?: ResourceStore,
    ) => void;
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
    installStationShield?: () => void;
    installKineticShield?: () => void;
    installReinforcedBay?: () => void;
    installStationDrones?: () => void;
    manufacture: (kind: RecipeId, batches: number) => void;
}

const NAV: { tab: LobbyTab; title: string; icon: Parameters<typeof lobbyIcon>[0] }[] = [
    { tab: 'overview', title: 'Wyprawa', icon: 'flight' },
    { tab: 'hangar', title: 'Hangar', icon: 'ship' },
    { tab: 'station', title: 'Rozbudowa stacji', icon: 'station' },
    { tab: 'laboratory', title: 'Laboratorium', icon: 'laboratory' },
    { tab: 'workshop', title: 'Warsztat', icon: 'crew' },
    { tab: 'warehouse', title: 'Magazyn', icon: 'cargo' },
    { tab: 'pilots', title: 'Piloci', icon: 'pilot' },
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
    private hullDetailMode: 'stats' | 'construction' | 'upgrades' = 'stats';
    private modulePreviewMode: ModulePreviewMode = 'current';
    private modulePreviewLevel = 1;
    private pilotMode: 'roster' | 'recruit' = 'roster';
    private chosenPilotId: number | null = null;
    private recruit = 0;
    private stationSection: 'facilities' | 'shield' | 'drones' = 'facilities';
    private recipeHistory: RecipeId[] = [];
    private laboratoryRecipe: RecipeId = 'water';
    private workshopRecipe: RecipeId = 'plating';
    private inventoryPage = 0;
    private supplyParts = 0;
    private moduleFocus: 'engine' | 'handling' | 'cargo' | 'drill' | 'armor' | 'shield' = 'engine';
    private scrapCandidate: number | null = null;
    private recoveryId: number | null = null;
    private recoveryPage = 0;
    private storyPage = 0;
    private storyPageSector: StorySectorId | null = null;
    constructor(
        private campaign: Campaign,
        private actions: LobbyActions,
    ) {
        super();
        this.addChild(this.visual, this.content);
        this.refresh();
    }
    resetProfile() {
        this.recipeHistory = [];
        this.tab = 'overview';
        this.supplyParts = 0;
        this.storyPage = 0;
        this.storyPageSector = null;
        this.scrapCandidate = null;
        this.recoveryId = null;
    }
    private go(tab: LobbyTab) {
        this.recipeHistory = [];
        this.tab = tab;
        this.refresh();
    }
    private showRecipe(id: RecipeId) {
        this.tab = RECIPES[id].category;
        if (this.tab === 'laboratory') this.laboratoryRecipe = id;
        else this.workshopRecipe = id;
        this.refresh();
    }
    private get productionNavigation() {
        return {
            openRecipe: (id: RecipeId) => {
                this.recipeHistory.push(
                    this.tab === 'laboratory' ? this.laboratoryRecipe : this.workshopRecipe,
                );
                this.showRecipe(id);
            },
            back: this.recipeHistory.length
                ? () => this.showRecipe(this.recipeHistory.pop()!)
                : undefined,
        };
    }
    private art(view: Container, x = 625, y = 440) {
        view.position.set(x, y);
        this.visual.addChild(view);
    }
    private section(title: string, subtitle: string, detailPanel = true) {
        const ui = this.content;
        label(ui, title, 280, 111, 39);
        label(ui, subtitle, 282, 166, 16, C.muted);
        if (detailPanel) panel(ui, 1040, STATION_LAYOUT.top, 520, 591);
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
                .fill({ color: C.ink, alpha: 0.98 })
                .moveTo(235, 30)
                .lineTo(235, 870)
                .stroke({ color: C.line, width: 1 }),
        );
        const logo = lobbyIcon('station');
        logo.position.set(50, 56);
        ui.addChild(logo);
        label(ui, c.story ? 'SATUK 15' : 'AURORA', 75, 43, 23, C.text);
        ui.addChild(
            new Graphics()
                .roundRect(31, 128, 64, 5, 2.5)
                .fill(C.mint)
                .roundRect(105, 128, 27, 5, 2.5)
                .fill(C.coral),
        );
        label(ui, 'DOM POŚRÓD GWIAZD', 31, 91, 11, C.muted);
        NAV.forEach(({ tab, title, icon }, i) => {
            const active = this.tab === tab;
            const card = choiceCard(ui, 25, 170 + i * 55, 185, 46, active, () => this.go(tab));
            const mark = lobbyIcon(icon, active ? C.mint : C.muted);
            mark.position.set(24, 23);
            card.addChild(mark);
            label(card, title, 49, 14, tab === 'station' ? 15 : 17, active ? C.mint : C.text);
            const badge =
                tab === 'pilots'
                    ? c.pilots.reduce((sum, p) => sum + pilotPoints(p), 0)
                    : tab === 'recovery'
                      ? c.recoverySignals.length
                      : 0;
            if (badge) label(card, tab === 'pilots' ? '+' : `${badge}`, 163, 16, 15, C.gold);
        });
        if (this.actions.replayDialogue && latestDialogue(c))
            button(
                ui,
                'POWTÓRZ ODPRAWĘ',
                25,
                625,
                185,
                this.actions.replayDialogue,
                false,
                true,
                38,
                14,
            );
        if (this.actions.openSandbox) {
            button(ui, 'SANDBOX / TESTY', 25, 710, 185, this.actions.openSandbox, false, true, 37);
            label(ui, 'Bez zmiany kampanii', 31, 757, 12, C.muted);
        }
        if (this.actions.switchProfile)
            button(
                ui,
                c.story ? 'TRYB TESTOWY' : 'KAMPANIA SATUK 15',
                25,
                775,
                185,
                this.actions.switchProfile,
                false,
                true,
                30,
            );
        label(ui, 'ESC · USTAWIENIA', 30, 818, 12, C.muted);
        label(ui, 'ORBIT / 0.90', 30, 851, 11, C.muted);
        label(ui, '● DOK BEZPIECZNY', 282, 44, 13, C.mint);
        if (this.tab === 'overview') this.overview(ui);
        if (this.tab === 'hangar') this.hangar(ui);
        if (this.tab === 'station') this.station(ui);
        if (this.tab === 'laboratory') {
            this.section(
                'Laboratorium',
                'Przetwarzaj pierwiastki w materiały. Poznawaj cząsteczki, struktury i procesy.',
            );
            laboratoryOverview(
                ui,
                c,
                this.actions,
                this.laboratoryRecipe,
                (id) => {
                    this.laboratoryRecipe = id;
                    this.refresh();
                },
                undefined,
                this.productionNavigation,
            );
        }
        if (this.tab === 'workshop') {
            this.section('Warsztat', 'Wytwarzaj części i zestawy z przygotowanych materiałów.');
            workshopOverview(
                ui,
                c,
                this.actions,
                this.workshopRecipe,
                (id) => {
                    this.workshopRecipe = id;
                    this.refresh();
                },
                undefined,
                this.productionNavigation,
            );
        }
        if (this.tab === 'pilots') this.pilots(ui);
        if (this.tab === 'warehouse') this.warehouse(ui);
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
    private departure(ui: Container) {
        const c = this.campaign,
            ready = !!c.ship && !!selectedPilot(c);
        if (ready)
            button(
                ui,
                `Zabierz poszycie I: ${this.supplyParts} · zmień`,
                1072,
                670,
                456,
                () => {
                    const choices = [0, 1, 2, 5];
                    this.supplyParts =
                        choices[(choices.indexOf(this.supplyParts) + 1) % choices.length];
                    this.refresh();
                },
                false,
                !c.activeRun,
                30,
                14,
            );
        button(
            ui,
            ready ? 'WYLOT DO SEKTORA →' : !c.ship ? 'PRZYGOTUJ STATEK →' : 'ZATRUDNIJ PILOTA →',
            1072,
            STATION_LAYOUT.actionY,
            456,
            () => {
                if (ready) this.actions.launch(null, false, null, { parts: this.supplyParts });
                else this.go(!c.ship ? 'hangar' : 'pilots');
            },
            true,
            !c.activeRun && this.supplyParts <= c.bank.parts,
            STATION_LAYOUT.actionHeight,
        );
        if (
            !ready &&
            ((!c.ship && (c.reserveShips.length > 0 || !hasHullParts(c.bank, 'prospector'))) ||
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
        const manifest = constructionManifest(c);
        if (ready && resourceTotal(manifest) > 0)
            button(
                ui,
                `WYLOT Z DOSTAWĄ · ${resourceTotal(manifest)} części / porcji`,
                1072,
                775,
                456,
                () => this.actions.launch(null, true),
                false,
                !c.activeRun,
                30,
            );
    }
    private overview(ui: Container) {
        if (this.campaign.story) {
            const p = this.campaign.story;
            if (this.storyPageSector !== p.sector) {
                this.storyPage = 0;
                this.storyPageSector = p.sector;
            }
            this.section(
                p.sector === 'pluto'
                    ? 'Akt X · Rejon Plutona'
                    : p.sector === 'uranus' || p.sector === 'neptune'
                      ? `Akt IX · ${p.sector === 'uranus' ? 'Rejon Urana' : 'Podejście do Neptuna'}`
                      : p.sector === 'saturn'
                        ? 'Akt VIII · Pierścienie Saturna'
                        : p.sector === 'jupiter'
                          ? 'Akt VII · Podejście do Jowisza'
                          : p.sector === 'belt'
                            ? 'Akt VI · Przejście pasa'
                            : storyAct(p) === 'AKT V'
                              ? 'Akt V · Baza marsjańska'
                              : p.sector === 'mercury'
                                ? 'Akt IV · Blisko Słońca'
                                : p.sector === 'venus'
                                  ? 'Akt III · Przygotowania'
                                  : storyAct(p) === 'AKT II'
                                    ? 'Akt II · Nowy kierunek'
                                    : actOneComplete(p)
                                      ? 'Akt I ukończony'
                                      : 'Dowodzenie Satuk 15',
                p.sector === 'pluto'
                    ? 'Rozpoznaj podejście i przygotuj finałowe starcie. Raport wymaga bezpiecznego powrotu.'
                    : p.sector === 'uranus' || p.sector === 'neptune'
                      ? 'Odkryj chronione bazy, zabezpiecz dane i przygotuj się do pierwszego starcia.'
                      : p.sector === 'saturn'
                        ? 'Rozpoznaj pierścienie, przywieź zaopatrzenie i zabezpiecz dalszą trasę.'
                        : p.sector === 'jupiter'
                          ? 'Rozpoznaj rejon, zabezpiecz podejście i przechwyć dane z chronionego węzła.'
                          : p.sector === 'belt'
                            ? 'Wytycz trasę, usuń przeszkody i potwierdź przejście do zewnętrznej granicy pasa.'
                            : storyAct(p) === 'AKT V'
                              ? 'Zbuduj bazę i zabezpiecz dalszą ekspedycję przed wrogimi jednostkami.'
                              : p.sector === 'mercury'
                                ? 'Wykorzystaj osłonę słoneczną i cień skał. Zabezpiecz dane potrzebne do dalszej drogi.'
                                : p.sector === 'venus'
                                  ? 'Zbuduj placówkę, przygotuj osłonę i zabezpiecz wyprawę na Merkurego.'
                                  : actTwoComplete(p)
                                    ? 'Akt II ukończony. Trasa do Wenus otwarta.'
                                    : p.claimed.includes('mars-belt')
                                      ? 'Pas blokuje pościg. Odbierz odprawę w sektorze Ziemi.'
                                      : p.sector === 'mars'
                                        ? 'Podejście do Marsa. Rozpoznaj trasę i zabezpiecz sektor.'
                                        : actOneComplete(p)
                                          ? 'Atak odparty. Stacja paliw działa. Następny kierunek: Mars.'
                                          : 'Akt I · Pierwsze sygnały. Wybierz sektor i przygotuj wyprawę.',
            );
            storyOverview(ui, this.campaign, {
                contribute: this.actions.contribute,
                briefing: this.actions.briefing,
                travel: this.actions.travel,
                station: () => this.go('station'),
                page: this.storyPage,
                setPage: (page) => {
                    this.storyPage = page;
                    this.refresh();
                },
            });
            this.departure(ui);
            return;
        }
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
                        ? 'Lot i badania · Kepler'
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
            c.ship?.hull === 'mule'
                ? 'Muł · darmowa samonaprawa, bez zestawów'
                : `${Math.min(c.repairKits, REPAIR_KITS.embarkKits)} zest. naprawczych na pokład`,
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
            catalogue = (Object.keys(HULLS) as HullId[]).filter(
                (id) => !('salvageOnly' in HULLS[id]),
            );
        this.section('Hangar', 'Wybierz kadłub, zmień statek lub zamontuj moduły.');
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
                this.hullDetailMode = 'construction';
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
        const previewing = this.hullDetailMode === 'upgrades';
        const visualModules =
            modules && previewing
                ? previewModules(
                      modules,
                      this.modulePreviewMode,
                      this.moduleFocus,
                      this.modulePreviewLevel,
                  )
                : modules;
        if (modules && previewing) {
            label(ui, 'PODGLĄD', 280, 266, 11, C.muted);
            const modes = ['current', 'single', 'all'] as const;
            for (const [i, mode] of modes.entries())
                button(
                    ui,
                    mode === 'current'
                        ? this.hangarMode === 'shop'
                            ? 'Bazowy'
                            : 'Zamontowane'
                        : mode === 'single'
                          ? 'Wybrany moduł'
                          : 'Wszystkie III',
                    280,
                    285 + i * 42,
                    160,
                    () => {
                        this.modulePreviewMode = mode;
                        this.refresh();
                    },
                    this.modulePreviewMode === mode,
                    true,
                    34,
                );
            if (this.modulePreviewMode === 'single') {
                label(
                    ui,
                    shipUpgradeDefinition(modules.hull, this.moduleFocus).title,
                    280,
                    418,
                    14,
                    C.mint,
                    165,
                );
                for (const [i, text] of ['0', 'I', 'II', 'III'].entries())
                    button(
                        ui,
                        text,
                        280 + i * 41,
                        463,
                        34,
                        () => {
                            this.modulePreviewLevel = i;
                            this.refresh();
                        },
                        this.modulePreviewLevel === i,
                        true,
                        30,
                    );
                const comparison = moduleComparison(
                    modules,
                    this.moduleFocus,
                    this.modulePreviewLevel,
                );
                label(ui, comparison.title, 280, 504, 12, C.muted, 165);
                label(ui, `${comparison.before} → ${comparison.after}`, 280, 523, 16, C.cyan, 165);
            } else
                label(
                    ui,
                    this.modulePreviewMode === 'all'
                        ? 'Podgląd kompletu. Moduły kupujesz osobno.'
                        : 'Kliknij nazwę modułu, aby porównać poziomy.',
                    280,
                    422,
                    13,
                    C.muted,
                    165,
                );
        }
        if (visualModules) this.art(hullPreview(visualModules), 625, 430);
        else {
            label(ui, 'Hangar czeka na nowy statek.', 392, 431, 25, C.muted);
            button(ui, 'Otwórz stocznię', 425, 494, 330, () => {
                this.hangarMode = 'shop';
                this.hullDetailMode = 'construction';
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
                STATION_LAYOUT.actionHeight,
                72,
            );
            thumbnail.position.set(37, 45);
            card.addChild(thumbnail);
            label(card, config.name, 75, 16, 16, C.text, 140);
            label(
                card,
                typeof entry === 'string'
                    ? hullUnlockReason(c, hull)
                        ? 'Projekt zablokowany'
                        : config.role
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
        if (owned && this.hullDetailMode === 'construction') this.hullDetailMode = 'stats';
        const modes = owned
            ? (['stats', 'upgrades'] as const)
            : (['stats', 'construction', 'upgrades'] as const);
        const modeWidth = (456 - (modes.length - 1) * 12) / modes.length;
        for (const [i, mode] of modes.entries())
            button(
                ui,
                mode === 'stats' ? 'Parametry' : mode === 'construction' ? 'Budowa' : 'Ulepszenia',
                1072 + i * (modeWidth + 12),
                350,
                modeWidth,
                () => {
                    this.hullDetailMode = mode;
                    this.refresh();
                },
                this.hullDetailMode === mode,
                true,
                34,
                15,
            );
        if (this.hullDetailMode === 'construction') {
            label(ui, 'CZĘŚCI DO BUDOWY · POZIOM I', 1072, 400, 12, C.muted);
            HULL_PARTS.forEach((id, i) => {
                const need = HULL_CONSTRUCTION[modules.hull][id],
                    have = c.bank[id] ?? 0;
                illustrationInBox(ui, itemIllustration(id), 1072, 413 + i * 38, 28, 28);
                label(ui, RESOURCES[id].name, 1112, 420 + i * 38, 15, C.text, 285);
                const amount = label(
                    ui,
                    `${Math.min(have, need)} / ${need}`,
                    1528,
                    420 + i * 38,
                    16,
                    have >= need ? C.mint : C.gold,
                );
                amount.setHorizontalAlign('right');
            });
        } else if (this.hullDetailMode === 'upgrades')
            this.shipModules(
                ui,
                {
                    ...modules,
                    id: ship?.id ?? 0,
                    weapon: modules.weapon ?? 'standard',
                    weapons: ship?.weapons ?? ['standard'],
                },
                !owned,
            );
        else {
            stat(ui, 'KADŁUB', `${config.health + modules.armor * 25}`, 1072, 408, 'health');
            stat(
                ui,
                'TARCZA',
                `${Math.round(config.shield.capacity * (1 + modules.shield * 0.25))}`,
                1230,
                408,
                'shield',
            );
            stat(ui, 'ŁADOWNIA', `${config.cargo + modules.cargo * 15}`, 1390, 408, 'cargo');
            label(
                ui,
                `+${(config.shield.regen * (1 + modules.shield * 0.15)).toFixed(1)}/s`,
                1264,
                455,
                13,
                C.cyan,
            );
            stat(ui, 'PRĘDKOŚĆ', `${config.maxSpeed}`, 1072, 486);
            stat(
                ui,
                'SKRĘT',
                `${(config.turnSpeed * (1 + modules.handling * 0.2)).toFixed(2)}`,
                1230,
                486,
            );
            stat(ui, 'BOOST', `×${config.boost}`, 1390, 486);
            label(
                ui,
                `Zakłócanie radarów ${Math.round(config.radarJamming * 100)}%`,
                1072,
                550,
                15,
                C.cyan,
            );
            label(
                ui,
                modules.hull === 'widmo'
                    ? 'Dash LPM · kamuflaż optyczny PPM'
                    : modules.hull === 'atlas'
                      ? 'Rakiety · granaty · 4 chwytaki'
                      : modules.hull === 'harpoon'
                        ? '2 ramiona bojowe · 4 chwytaki'
                        : modules.hull === 'aegis'
                          ? 'Działko energetyczne · dron · impuls ochronny'
                          : modules.hull === 'phoenix'
                            ? 'Projektor bojowy · rakiety · chwytak'
                            : `${config.guns.length} ${config.guns.length === 1 ? 'działo' : 'działa'} · ${config.lasers.length} ${config.lasers.length === 1 ? 'laser' : 'lasery'} · ${config.grabbers.length} ${config.grabbers.length === 1 ? 'chwytak' : 'chwytaki'}`,
                1072,
                578,
                15,
                C.text,
            );
            label(ui, config.detail, 1072, 605, 14, C.muted, 456);
        }
        if (owned && ship) {
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
            const projectLock = hullUnlockReason(c, modules.hull),
                locked = c.station.workshop < config.workshop,
                full = ships.length >= FLEET_LIMIT;
            label(
                ui,
                projectLock
                    ? projectLock
                    : locked
                      ? `Wymagany warsztat ${config.workshop === 2 ? 'II' : 'I'}`
                      : full
                        ? 'Hangar pełny · zwolnij miejsce we flocie'
                        : 'BUDOWA KADŁUBA Z CZĘŚCI',
                1072,
                650,
                12,
                projectLock || locked || full ? C.gold : C.muted,
                456,
            );
            const completed = HULL_PARTS.filter(
                (id) => (c.bank[id] ?? 0) >= HULL_CONSTRUCTION[modules.hull][id],
            ).length;
            const materials = label(
                ui,
                `Części gotowe: ${completed} / ${HULL_PARTS.length}`,
                1072,
                688,
                15,
                hasHullParts(c.bank, modules.hull) ? C.mint : C.gold,
                456,
            );
            materials.eventMode = 'static';
            materials.cursor = 'pointer';
            materials.on('pointertap', () => {
                this.hullDetailMode = 'construction';
                this.refresh();
            });
            button(
                ui,
                projectLock
                    ? 'PROJEKT ZABLOKOWANY'
                    : locked
                      ? 'ROZBUDUJ ZAPLECZE →'
                      : full
                        ? 'OTWÓRZ FLOTĘ →'
                        : 'ZBUDUJ STATEK →',
                1072,
                STATION_LAYOUT.actionY,
                456,
                () => {
                    if (locked) {
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
                !projectLock && (locked || full || hasHullParts(c.bank, modules.hull)),
                STATION_LAYOUT.actionHeight,
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
        const id = this.weaponFocus,
            w = WEAPONS[id],
            special = ['widmo', 'mule', 'atlas', 'harpoon', 'aegis', 'stinger', 'phoenix'].includes(
                ship.hull,
            ),
            beam = ship.hull === 'mule' || ship.hull === 'phoenix',
            owned = ship.weapons.includes(id),
            mounted = ship.weapon === id;
        this.art(hullPreview({ ...ship, weapon: id }), 625, 430);
        (Object.keys(WEAPONS) as WeaponId[]).forEach((key, i) => {
            const definition = WEAPONS[key],
                card = choiceCard(ui, 280 + i * 240, 650, 225, 141, id === key, () => {
                    this.weaponFocus = key;
                    this.refresh();
                });
            label(
                card,
                special
                    ? key === 'standard'
                        ? 'Standard'
                        : key === 'pulse'
                          ? 'Impulsowy'
                          : 'Ciężki'
                    : definition.name,
                18,
                22,
                24,
            );
            label(
                card,
                special
                    ? `Moc ×${ARMAMENT_KITS[key].power} · ${beam ? `zasięg ×${ARMAMENT_KITS[key].range}` : `cykl ×${ARMAMENT_KITS[key].cooldown}`}`
                    : `${definition.damage} DMG · ${(1 / definition.interval).toFixed(1)}/s`,
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
        label(ui, 'SYSTEM UZBROJENIA / AKTYWNY STATEK', 1072, 244, 13, C.muted);
        label(ui, special ? armamentName(ship.hull, id) : w.name, 1072, 279, 26, C.text, 456);
        label(
            ui,
            special
                ? 'Wariant wyspecjalizowanego uzbrojenia tego kadłuba. Zachowuje jego rolę i sposób obsługi.'
                : w.detail,
            1072,
            341,
            18,
            C.muted,
            456,
        );
        stat(
            ui,
            special ? 'MOC' : 'OBRAŻENIA',
            special ? `×${ARMAMENT_KITS[id].power}` : `${w.damage}`,
            1072,
            429,
        );
        stat(
            ui,
            special ? (beam ? 'ZASIĘG WIĄZKI' : 'CZAS CYKLU') : 'STRZAŁY / S',
            special
                ? beam
                    ? `${Math.round(HULLS[ship.hull].laserRange * ARMAMENT_KITS[id].range)} m`
                    : `×${ARMAMENT_KITS[id].cooldown}`
                : (1 / w.interval).toFixed(1),
            1298,
            429,
        );
        label(ui, HULLS[ship.hull].detail, 1072, 530, 17, C.muted, 456);
        label(
            ui,
            owned
                ? 'Wariant należy do tego statku.'
                : `Koszt: ${resourceSummary(WEAPON_PARTS[id])}`,
            1072,
            620,
            16,
            C.cyan,
            456,
        );
        if (!owned && c.station.workshop < w.workshop)
            label(ui, `Wymagane zaplecze produkcyjne ${w.workshop}.`, 1072, 690, 14, C.gold, 456);
        button(
            ui,
            mounted ? 'ZAMONTOWANE' : owned ? 'ZAMONTUJ →' : 'KUP I ZAMONTUJ →',
            1072,
            STATION_LAYOUT.actionY,
            456,
            () => this.actions.equipWeapon(id),
            true,
            !c.activeRun &&
                !mounted &&
                (owned ||
                    (c.station.workshop >= w.workshop &&
                        canAffordEquipment(c.bank, WEAPON_PARTS[id]))),
            48,
        );
    }
    private shipModules(
        ui: Container,
        ship: ReturnType<typeof ownedShips>[number],
        preview = false,
    ) {
        const c = this.campaign,
            active = c.ship?.id === ship.id,
            limit = preview ? 3 : c.station.workshop + 1;
        label(
            ui,
            preview
                ? 'MODUŁY BAZOWE · KOSZT POZIOMU I'
                : active
                  ? `MODUŁY · LIMIT ${limit}`
                  : 'AKTYWUJ STATEK, ABY KUPOWAĆ MODUŁY',
            1072,
            399,
            12,
            C.muted,
        );
        const describe = (key: typeof this.moduleFocus) => {
            const level = preview ? 0 : ship[key];
            const detail = shipUpgradeDefinition(ship.hull, key).detail;
            return `${detail}\n${!preview && level >= limit ? 'Osiągnięto limit zaplecza.' : `Koszt: ${resourceSummary(upgradePrice({ ...c, ship: { ...ship, [key]: level } }, key))}`}`;
        };
        const hint = label(ui, describe(this.moduleFocus), 1072, 610, 13, C.muted, 456);
        (['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const).forEach((key, i) => {
            const level = ship[key],
                price = upgradePrice(
                    {
                        ...c,
                        ship: preview
                            ? {
                                  ...ship,
                                  engine: 0,
                                  handling: 0,
                                  cargo: 0,
                                  drill: 0,
                                  armor: 0,
                                  shield: 0,
                              }
                            : ship,
                    },
                    key,
                ),
                definition = shipUpgradeDefinition(ship.hull, key),
                y = 427 + i * 30;
            const title = label(
                ui,
                definition.title,
                1072,
                y,
                16,
                this.modulePreviewMode === 'single' && key === this.moduleFocus ? C.mint : C.text,
            );
            title.eventMode = 'static';
            title.cursor = 'pointer';
            title.on('pointertap', () => {
                this.moduleFocus = key;
                this.modulePreviewMode = 'single';
                this.modulePreviewLevel = Math.min(3, ship[key] + 1);
                this.refresh();
            });
            title.on('pointerenter', () => {
                hint.setText(describe(key));
            });
            title.on('pointerleave', () => hint.setText(describe(this.moduleFocus)));
            segments(ui, level, 3, 1288, y + 5, 69);
            const buy = button(
                ui,
                !preview && level >= limit ? 'MAX' : preview ? 'PODGLĄD' : 'ULEPSZ',
                1390,
                y - 6,
                138,
                () => {
                    this.moduleFocus = key;
                    if (preview) {
                        this.modulePreviewMode = 'single';
                        this.modulePreviewLevel = 1;
                        this.refresh();
                    } else {
                        this.modulePreviewMode = 'current';
                        this.actions.upgrade(key);
                    }
                },
                false,
                preview ||
                    (active && !c.activeRun && level < limit && canAffordEquipment(c.bank, price)),
                26,
            );
            buy.config.onHover = () => {
                hint.setText(describe(key));
            };
        });
    }
    private station(ui: Container) {
        const c = this.campaign,
            level = c.station.workshop,
            limit = 2;
        const price = upgradePrice(c, 'workshop');
        this.section('Rozbudowa stacji', 'Ulepszaj zaplecze i wyposażenie stacji.');
        const sections = [
            { id: 'facilities', title: 'Zaplecze' },
            { id: 'shield', title: 'Tarcze stacji' },
            { id: 'drones', title: 'Drony' },
        ] as const;
        sections.forEach((section, i) => {
            button(
                ui,
                section.title,
                280 + i * 245,
                218,
                235,
                () => {
                    this.stationSection = section.id;
                    this.refresh();
                },
                this.stationSection === section.id,
                true,
                38,
                16,
            );
        });
        if (this.stationSection === 'shield') {
            stationShieldContent(
                ui,
                c,
                this.actions.installStationShield,
                this.actions.installKineticShield,
            );
            return;
        }
        if (this.stationSection === 'drones') {
            stationDronesContent(ui, c, this.actions.installStationDrones);
            return;
        }
        this.art(fittedScene(productionBayScene(level), 650, 350), 640, 520);
        label(ui, 'ZAPLECZE PRODUKCYJNE', 640, 755, 16, C.mint).setHorizontalAlign('center');
        label(ui, 'ROZWÓJ TECHNOLOGII', 1072, 244, 13, C.muted);
        label(ui, 'Zaplecze produkcyjne', 1072, 276, 30, C.text, 456);
        label(ui, `Poziom ${level} / ${limit}`, 1072, 326, 18, C.mint);
        segments(ui, level, limit, 1072, 367, 456);
        label(ui, `Moduły statku do poziomu ${level + 1}`, 1072, 405, 24, C.text, 456);
        label(
            ui,
            level === 0
                ? 'Podstawowa produkcja jest już dostępna. Rozbudowa I odblokuje nowe kadłuby i bardziej złożone części.'
                : level < limit
                  ? 'Rozbudowa II odblokuje zaawansowane procesy, osłony i kolejne ulepszenia statków.'
                  : 'Najwyższy poziom zaplecza.',
            1072,
            447,
            17,
            C.muted,
            456,
        );
        if (level < limit) constructionCosts(ui, c.bank, price);
        else label(ui, 'MAKSYMALNY POZIOM', 1072, 649, 12, C.muted);
        button(
            ui,
            level >= limit ? 'MAKSYMALNY POZIOM' : 'ROZBUDUJ ZAPLECZE →',
            1072,
            STATION_LAYOUT.actionY,
            456,
            () => this.actions.upgrade('workshop'),
            true,
            !c.activeRun && level < limit && canAffordEquipment(c.bank, price),
            STATION_LAYOUT.actionHeight,
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
        this.section('Piloci', 'Wybierz pilota, rozwiń umiejętności albo zaproś nową osobę.');
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
                STATION_LAYOUT.actionY,
                456,
                () => {
                    this.chosenPilotId = null;
                    this.pilotMode = 'roster';
                    this.actions.hire(this.recruit);
                },
                true,
                c.bank.ore >= 12 && pilotSlots(c) < 8,
                STATION_LAYOUT.actionHeight,
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
                    STATION_LAYOUT.actionY,
                    456,
                    () => this.actions.selectPilot(pilot.id),
                    true,
                    true,
                    48,
                );
            else label(ui, '● Aktywny pilot na następną wyprawę', 1072, 754, 15, C.mint);
        }
    }
    private warehouse(ui: Container) {
        const c = this.campaign;
        this.section(
            'Magazyn',
            'Pierwiastki, materiały i części przechowywane na stacji. Pojemność bez limitu.',
            false,
        );
        const categoryOrder = { PIERWIASTKI: 0, MATERIAŁY: 1, CZĘŚCI: 2 };
        const entries = RESOURCE_IDS.filter((id) => (c.bank[id] ?? 0) > 0).sort(
            (a, b) => categoryOrder[RESOURCES[a].category] - categoryOrder[RESOURCES[b].category],
        );
        if (!entries.length) {
            panel(ui, 280, 214, 1280, 591);
            label(ui, 'Tu trafią Twoje znaleziska', 320, 250, 30, C.text);
            label(
                ui,
                'Wydobywaj pierwiastki ze skał, odzyskuj części z wraków i dostarczaj je do stacji.',
                320,
                300,
                18,
                C.muted,
                1120,
            );
            const categories = [
                { id: 'ore', title: 'Pierwiastki', detail: 'Wydobywane ze skał i asteroid' },
                { id: 'water', title: 'Materiały', detail: 'Przygotowywane w Laboratorium' },
                {
                    id: 'electronics',
                    title: 'Części',
                    detail: 'Wytwarzane w Warsztacie lub odzyskiwane z wraków',
                },
            ] as const;
            categories.forEach((entry, i) => {
                const x = 320 + i * 410;
                illustrationInBox(ui, itemIllustration(entry.id), x + 100, 390, 170, 150);
                label(ui, entry.title, x, 580, 25, C.text, 365);
                label(ui, entry.detail, x, 622, 17, C.muted, 350);
            });
            button(
                ui,
                'PRZYGOTUJ WYPRAWĘ',
                1072,
                STATION_LAYOUT.actionY,
                456,
                () => this.go('overview'),
                true,
                true,
                STATION_LAYOUT.actionHeight,
            );
            return;
        }
        const last = Math.max(0, Math.ceil(entries.length / 15) - 1);
        this.inventoryPage = Math.min(this.inventoryPage, last);
        entries.slice(this.inventoryPage * 15, this.inventoryPage * 15 + 15).forEach((id, i) => {
            const x = 280 + (i % 3) * 432,
                y = 260 + Math.floor(i / 3) * 96;
            panel(ui, x, y, 416, 82);
            illustrationInBox(ui, itemIllustration(id), x + 14, y + 14, 56, 54);
            label(ui, RESOURCES[id].category, x + 88, y + 12, 11, C.muted);
            label(ui, RESOURCES[id].name, x + 88, y + 33, 16, RESOURCES[id].color, 210);
            const quantity = c.bank[id] ?? 0;
            const amountText = new Intl.NumberFormat('pl-PL', {
                notation: quantity >= 100000 ? 'compact' : 'standard',
                maximumFractionDigits: 1,
            }).format(quantity);
            const amount = label(ui, amountText, x + 394, y + 16, 20, C.text);
            amount.setHorizontalAlign('right');
        });
        label(
            ui,
            `${entries.length} rodzajów zasobów · ${resourceTotal(c.bank).toLocaleString('pl-PL')} szt.`,
            280,
            218,
            16,
            C.muted,
        );
        if (last > 0) {
            label(ui, `Strona ${this.inventoryPage + 1}/${last + 1}`, 840, 780, 16, C.muted);
            button(
                ui,
                '←',
                700,
                769,
                90,
                () => {
                    this.inventoryPage--;
                    this.refresh();
                },
                false,
                this.inventoryPage > 0,
                36,
            );
            button(
                ui,
                '→',
                1030,
                769,
                90,
                () => {
                    this.inventoryPage++;
                    this.refresh();
                },
                false,
                this.inventoryPage < last,
                36,
            );
        }
    }
    private recovery(ui: Container) {
        const c = this.campaign,
            signal = c.recoverySignals.find((entry) => entry.id === this.recoveryId);
        this.section(
            'Ratunek',
            'Położenie wraków i kapsuł. Możesz je odzyskać podczas zwykłego lotu.',
        );
        this.art(
            signalScene(c.recoverySignals, this.recoveryId, (id) => {
                this.recoveryId = id;
                this.refresh();
            }),
            625,
            429,
        );
        const lastPage = Math.max(0, Math.ceil(c.recoverySignals.length / 3) - 1);
        this.recoveryPage = Math.min(this.recoveryPage, lastPage);
        c.recoverySignals
            .slice(this.recoveryPage * 3, this.recoveryPage * 3 + 3)
            .forEach((entry, i) => {
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
                    entry.area === 'surface'
                        ? 'Powierzchnia Księżyca'
                        : `${(Math.hypot(entry.x, entry.y) / 1000).toFixed(1)} km od ${c.story ? 'Satuk 15' : 'Aurory'}`,
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
        if (lastPage > 0) {
            button(
                ui,
                '←',
                280,
                808,
                80,
                () => {
                    this.recoveryPage = Math.max(0, this.recoveryPage - 1);
                    this.refresh();
                },
                false,
                this.recoveryPage > 0,
                27,
            );
            label(ui, `${this.recoveryPage + 1}/${lastPage + 1}`, 620, 814, 14, C.muted);
            button(
                ui,
                '→',
                900,
                808,
                80,
                () => {
                    this.recoveryPage = Math.min(lastPage, this.recoveryPage + 1);
                    this.refresh();
                },
                false,
                this.recoveryPage < lastPage,
                27,
            );
        }
        if (!signal) {
            label(ui, 'Brak sygnałów do odzyskania.', 625, 718, 22, C.muted).setHorizontalAlign(
                'center',
            );
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
                STATION_LAYOUT.actionY,
                456,
                () => this.go('overview'),
                true,
                true,
                STATION_LAYOUT.actionHeight,
            );
            return;
        }
        const sectorName =
            Object.values(STORY_SECTORS).find((sector) => sector.seed === signal.seed)?.name ??
            'Sektor swobodny';
        label(ui, 'POŁOŻENIE SYGNAŁU', 1072, 244, 13, C.muted);
        label(ui, `Sygnał #${signal.id}`, 1072, 276, 31);
        label(
            ui,
            signal.area === 'surface'
                ? 'Powierzchnia Księżyca'
                : `${(Math.hypot(signal.x, signal.y) / 1000).toFixed(1)} km od ${c.story ? 'Satuk 15' : 'Aurory'}`,
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
        label(
            ui,
            `${sectorName} · ${signal.area === 'surface' ? 'powierzchnia' : 'orbita'} · ${Math.round(signal.x)}, ${Math.round(signal.y)}`,
            1072,
            656,
            15,
            C.muted,
            456,
        );
        if (signal.ship && ownedShips(c).length >= FLEET_LIMIT)
            label(ui, 'Pełny hangar: wrak da materiały.', 1072, 684, 14, C.muted);
        button(
            ui,
            'WRÓĆ DO DOWODZENIA',
            1072,
            STATION_LAYOUT.actionY,
            456,
            () => this.go('overview'),
            true,
            true,
            STATION_LAYOUT.actionHeight,
        );
    }
    private scrapConfirmation(ui: Container) {
        const ship = this.campaign.reserveShips.find((entry) => entry.id === this.scrapCandidate);
        if (!ship) {
            this.scrapCandidate = null;
            return;
        }
        const refund = scrapRefund(ship),
            room = canScrapShip(this.campaign, ship.id);
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.88 });
        shade.eventMode = 'static';
        ui.addChild(shade);
        panel(ui, 425, 265, 750, 370);
        label(ui, `Zezłomować ${HULLS[ship.hull].name} #${ship.id}?`, 469, 302, 29);
        label(ui, 'Kadłub i zamontowane moduły zostaną usunięte.', 469, 360, 18, C.red);
        label(ui, 'ODZYSKANE CZĘŚCI I MATERIAŁY', 469, 409, 12, C.muted);
        label(ui, resourceSummary(refund), 469, 435, 17, C.cyan, 650);
        if (!room)
            label(ui, 'Zbyt duża ilość zasobów do rozliczenia odzysku.', 469, 508, 16, C.gold);
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
