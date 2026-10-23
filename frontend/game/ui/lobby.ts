import { hangarScreen, newHangarState, type HangarState } from './hangar';
import { pilotScreen } from './pilots';
import { milkyWayView } from '../graphics/milkyWayView';
import { solarSystem } from './solarSystem';
import { lunarShipmentPending } from '../state/lunarShipment';
import { constructionCosts } from './constructionCosts';
import { canAffordEquipment } from '../state/equipmentCosts';
import { hasHullParts } from '../state/fleetConstruction';
import { itemIllustration } from '../graphics/items';
import { stationShieldContent, stationDronesContent } from './stationShield';
import { laboratoryOverview, workshopOverview } from './production';
import { RESOURCE_IDS, RESOURCES, resourceTotal, resourceSummary } from '../state/resources';
import { latestDialogue } from '../state/dialogues';
import { storyOverview } from './storyOverview';
import {
    STORY_SECTORS,
    constructionLoadLock,
    constructionDeliveryTasks,
    actOneComplete,
    actTwoComplete,
    storyAct,
    type StorySectorId,
} from '../state/story';
import { type WeaponId } from '../config';
import { Container, Graphics } from 'pixi.js';
import { CONTRACTS, FLEET_LIMIT, HULLS, HullId, PilotSkillId, Upgrade } from '../config';
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
import { RECIPES, RECIPE_IDS, type RecipeId } from '../state/chemistry';
import { contractLockReason } from '../state/contracts';
import { pilotPoints, pilotName } from '../state/pilots';
import { C } from '../graphics/shapes';
import { button, clear, label, panel, illustrationInBox, STATION_LAYOUT } from './primitives';

import {
    choiceCard,
    cost,
    fittedShip,
    fittedScene,
    lobbyIcon,
    operationScene,
    pilotPortrait,
    segments,
    signalScene,
    productionBayScene,
} from './lobbyGraphics';

export type LobbyTab =
    | 'solar'
    | 'overview'
    | 'hangar'
    | 'shipyard'
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
    { tab: 'solar', title: 'Układ słoneczny', icon: 'system' },
    { tab: 'overview', title: 'Wyprawa', icon: 'flight' },
    { tab: 'hangar', title: 'Hangar', icon: 'ship' },
    { tab: 'shipyard', title: 'Stocznia', icon: 'shipyard' },
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
    private solarScenery: Container | null = null;
    private solarPlanets: ReturnType<typeof solarSystem> = [];
    private tab: LobbyTab = 'overview';
    private time = 0;
    private message = '';
    private messageUntil = 0;
    private toast: ReturnType<typeof label> | null = null;
    private hangarState = newHangarState();
    private shipyardState: HangarState = { ...newHangarState(), tab: 'construction' };
    private pilotMode: 'roster' | 'recruit' = 'roster';
    private chosenPilotId: number | null = null;
    private recruit = 0;
    private stationSection: 'facilities' | 'shield' | 'drones' = 'facilities';
    private recipeHistory: { tab: LobbyTab; recipe?: RecipeId }[] = [];
    private laboratoryRecipe: RecipeId = 'water';
    private workshopRecipe: RecipeId = 'plating';
    private inventoryPage = 0;
    private loadConstruction = false;
    private scrapCandidate: number | null = null;
    private scrapPage = 0;
    private recoveryId: number | null = null;
    private recoveryPage = 0;
    private storyPage = 0;
    private storyFilter: 'active' | 'completed' = 'active';
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
        this.hangarState = newHangarState();
        this.shipyardState = { ...newHangarState(), tab: 'construction' };
        this.recipeHistory = [];
        this.tab = 'overview';
        this.loadConstruction = false;
        this.storyPage = 0;
        this.storyPageSector = null;
        this.storyFilter = 'active';
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
    private backToPrevious() {
        const destination = this.recipeHistory.pop();
        if (!destination) return;
        if (destination.recipe) this.showRecipe(destination.recipe);
        else {
            this.tab = destination.tab;
            this.refresh();
        }
    }
    private openDestination(tab: 'station' | 'hangar') {
        this.recipeHistory.push({ tab: this.tab });
        this.tab = tab;
        if (tab === 'station') this.stationSection = 'facilities';
        else {
            this.hangarState.tab = 'upgrades';
        }
        this.refresh();
    }
    private get productionNavigation() {
        return {
            openRecipe: (id: RecipeId) => {
                this.recipeHistory.push({
                    tab: this.tab,
                    recipe:
                        this.tab === 'laboratory'
                            ? this.laboratoryRecipe
                            : this.tab === 'workshop'
                              ? this.workshopRecipe
                              : undefined,
                });
                this.showRecipe(id);
            },
            back: this.recipeHistory.length
                ? () => {
                      this.backToPrevious();
                  }
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
        if (this.recipeHistory.length && this.tab !== 'laboratory' && this.tab !== 'workshop')
            button(ui, '← POWRÓT', 870, 114, 135, () => this.backToPrevious(), false, true, 32, 13);
        if (detailPanel) panel(ui, 1040, STATION_LAYOUT.top, 520, 591);
    }
    refresh(message?: string) {
        if (message !== undefined) {
            this.message = message;
            this.messageUntil = this.time + 6;
        }
        clear(this.content);
        clear(this.visual);
        this.solarPlanets = [];
        this.visual.y = 0;
        const c = this.campaign,
            ui = this.content;
        if (!ownedShips(c).some((ship) => ship.id === this.hangarState.shipId))
            this.hangarState.shipId = c.ship?.id ?? ownedShips(c)[0]?.id ?? null;
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
        if (c.story?.development) label(ui, 'ZAPIS TESTOWY', 75, 76, 11, C.gold);
        NAV.filter(({ tab }) => tab !== 'solar' || !!c.story).forEach(({ tab, title, icon }, i) => {
            const active = this.tab === tab;
            const card = choiceCard(ui, 25, 110 + i * 51, 185, 43, active, () => this.go(tab));
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
        label(ui, 'ORBIT / 0.130', 30, 851, 11, C.muted);
        label(ui, '● DOK BEZPIECZNY', 282, 44, 13, C.mint);
        if (this.solarScenery) this.solarScenery.visible = this.tab === 'solar';
        if (this.tab === 'solar') {
            if (!this.solarScenery) {
                this.solarScenery = milkyWayView();
                this.solarScenery.alpha = 0.3;
                this.addChildAt(this.solarScenery, 1);
            }
            this.visual.addChild(new Graphics().rect(236, 0, 1364, 900).fill(C.space));
            this.section('Układ słoneczny', 'Wybierz sektor następnej wyprawy.', false);
            this.solarPlanets = solarSystem(ui, c, (sector) => this.actions.travel?.(sector));
            button(
                ui,
                'PRZYGOTUJ WYPRAWĘ →',
                1150,
                111,
                410,
                () => this.go('overview'),
                true,
                true,
                42,
                16,
            );
        }
        if (this.tab === 'overview') this.overview(ui);
        if (this.tab === 'hangar' || this.tab === 'shipyard') this.hangar(ui);
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
            ready = !!c.ship && !!selectedPilot(c),
            delivery = constructionDeliveryTasks(c)[0],
            cargoPurpose =
                delivery?.sector === 'lunar'
                    ? 'stację księżycową'
                    : delivery?.sector === 'mars'
                      ? 'bazę marsjańską'
                      : 'placówkę Wenus',
            loadLock = constructionLoadLock(c);
        if (this.loadConstruction && loadLock) this.loadConstruction = false;
        if (ready && delivery && !(lunarShipmentPending(c) && c.lunarShipment)) {
            button(
                ui,
                `Zabierz ładunek na ${cargoPurpose}`,
                1072,
                650,
                456,
                () => {
                    if (lunarShipmentPending(c)) {
                        this.actions.launch(null, true);
                        return;
                    }
                    this.loadConstruction = !this.loadConstruction;
                    this.refresh();
                },
                this.loadConstruction,
                !c.activeRun && !loadLock,
                36,
                15,
            );
            label(
                ui,
                loadLock ??
                    (this.loadConstruction
                        ? 'Kompletny ładunek wybrany do transportu.'
                        : 'Kompletny ładunek gotowy do transportu.'),
                1072,
                693,
                13,
                loadLock ? C.gold : C.mint,
                456,
            );
        }
        if (lunarShipmentPending(c) && c.lunarShipment) {
            label(
                ui,
                `Paczka czeka na dostawę · ${c.lunarShipment.area === 'surface' ? 'powierzchnia Księżyca' : 'orbita Ziemi i Księżyca'}`,
                1072,
                650,
                16,
                C.mint,
                456,
            );
            label(
                ui,
                'Podejmij istniejącą paczkę na hol. Części zostały już zapakowane.',
                1072,
                693,
                13,
                C.muted,
                456,
            );
        }
        button(
            ui,
            ready ? 'WYLOT DO SEKTORA →' : !c.ship ? 'PRZYGOTUJ STATEK →' : 'ZATRUDNIJ PILOTA →',
            1072,
            STATION_LAYOUT.actionY,
            456,
            () => {
                if (ready) this.actions.launch(null, this.loadConstruction);
                else this.go(!c.ship ? 'hangar' : 'pilots');
            },
            true,
            !c.activeRun,
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
                                    : p.claimed.includes('mars-anomaly-research')
                                      ? 'Pas blokuje pościg. Odbierz odprawę w sektorze Ziemi.'
                                      : p.sector === 'mars'
                                        ? 'Podejście do Marsa. Rozpoznaj trasę i zabezpiecz sektor.'
                                        : actOneComplete(p)
                                          ? 'Atak odparty. Stacja księżycowa działa. Następny kierunek: Mars.'
                                          : 'Akt I · Rozbuduj Satuk 15, nawiąż łączność i przygotuj stację na Księżycu.',
            );
            storyOverview(ui, this.campaign, {
                openRecipe: this.productionNavigation.openRecipe,
                openDestination: (tab) => this.openDestination(tab),
                contribute: this.actions.contribute,
                briefing: this.actions.briefing,
                station: () => this.go('station'),
                filter: this.storyFilter,
                setFilter: (filter) => {
                    this.storyFilter = filter;
                    this.storyPage = 0;
                    this.refresh();
                },
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
                : `Zestawy naprawcze: ${c.repairKits}`,
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
        const project = this.tab === 'shipyard';
        this.section(
            project ? 'Stocznia' : 'Hangar',
            project
                ? 'Przeglądaj projekty i buduj statki z części.'
                : 'Wybierz statek, rozwijaj moduły i dobierz wariant uzbrojenia.',
            false,
        );
        hangarScreen(ui, this.campaign, project ? this.shipyardState : this.hangarState, project, {
            refresh: () => this.refresh(),
            openRecipe: this.productionNavigation.openRecipe,
            openStation: () => this.go('station'),
            openFleet: () => this.go('hangar'),
            selectShip: this.actions.selectShip,
            upgrade: this.actions.upgrade,
            equipWeapon: this.actions.equipWeapon,
            scrapShip: (id) => {
                this.scrapCandidate = id;
                this.scrapPage = 0;
                this.refresh();
            },
            buyShip: (hull) => {
                this.hangarState.shipId = null;
                this.hangarState.tab = 'stats';
                this.hangarState.variant = 'standard';
                this.tab = 'hangar';
                this.actions.buyShip(hull);
            },
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
                this.productionNavigation.openRecipe,
            );
            return;
        }
        if (this.stationSection === 'drones') {
            stationDronesContent(
                ui,
                c,
                this.actions.installStationDrones,
                this.productionNavigation.openRecipe,
            );
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
                ? 'Podstawowa produkcja jest już dostępna. Rozbudowa I odblokuje części tieru II i nowe kadłuby.'
                : level < limit
                  ? 'Rozbudowa II odblokuje części tieru III, osłony i najwyższe ulepszenia statków.'
                  : 'Najwyższy poziom zaplecza.',
            1072,
            447,
            17,
            C.muted,
            456,
        );
        if (level < limit)
            constructionCosts(ui, c.bank, price, 542, this.productionNavigation.openRecipe);
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
        this.section(
            'Piloci',
            'Porównaj specjalizacje, wybierz załogę i zaplanuj szkolenie.',
            false,
        );
        pilotScreen(
            ui,
            this.campaign,
            {
                recruiting: this.pilotMode === 'recruit',
                chosenId: this.chosenPilotId,
                recruit: this.recruit,
                mode: (recruiting) => {
                    this.pilotMode = recruiting ? 'recruit' : 'roster';
                    this.refresh();
                },
                choose: (id) => {
                    this.chosenPilotId = id;
                    this.refresh();
                },
                candidate: (archetype) => {
                    this.recruit = archetype;
                    this.refresh();
                },
            },
            {
                ...this.actions,
                hire: (archetype) => {
                    this.chosenPilotId = this.campaign.nextPilotId;
                    this.pilotMode = 'roster';
                    this.actions.hire(archetype);
                },
            },
        );
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
        panel(ui, 330, 170, 940, 630);
        label(ui, `Zezłomować ${HULLS[ship.hull].name} #${ship.id}?`, 365, 204, 28, C.text, 870);
        label(ui, 'Kadłub i zamontowane moduły zostaną usunięte.', 365, 251, 17, C.red, 870);
        label(ui, 'ODZYSKANE CZĘŚCI', 365, 290, 13, C.mint);
        const entries = RESOURCE_IDS.filter((id) => (refund[id] ?? 0) > 0);
        const pages = Math.max(1, Math.ceil(entries.length / 8));
        this.scrapPage = Math.min(this.scrapPage, pages - 1);
        entries.slice(this.scrapPage * 8, (this.scrapPage + 1) * 8).forEach((id, i) => {
            const x = 365 + (i % 2) * 445,
                y = 322 + Math.floor(i / 2) * 70;
            ui.addChild(new Graphics().roundRect(x, y, 425, 60, 10).fill(C.raised));
            illustrationInBox(ui, itemIllustration(id), x + 12, y + 12, 36, 36);
            label(ui, RESOURCES[id].name, x + 62, y + 9, 15, C.text, 350);
            label(ui, `+${refund[id]}`, x + 62, y + 34, 16, C.cyan);
        });
        if (pages > 1) {
            button(
                ui,
                '←',
                675,
                620,
                60,
                () => {
                    this.scrapPage--;
                    this.refresh();
                },
                false,
                this.scrapPage > 0,
                30,
            );
            label(ui, `${this.scrapPage + 1} / ${pages}`, 780, 627, 14, C.muted);
            button(
                ui,
                '→',
                870,
                620,
                60,
                () => {
                    this.scrapPage++;
                    this.refresh();
                },
                false,
                this.scrapPage < pages - 1,
                30,
            );
        }
        label(
            ui,
            room
                ? 'Otrzymasz pokazane części. Tej operacji nie można cofnąć.'
                : 'Zbyt duża ilość zasobów do rozliczenia odzysku.',
            365,
            674,
            16,
            room ? C.muted : C.gold,
            870,
        );
        button(
            ui,
            'ANULUJ',
            365,
            733,
            410,
            () => {
                this.scrapCandidate = null;
                this.refresh();
            },
            false,
            true,
            42,
        );
        button(
            ui,
            'ZEZŁOMUJ STATEK',
            810,
            733,
            425,
            () => {
                const id = this.scrapCandidate!;
                this.scrapCandidate = null;
                this.hangarState.shipId = null;
                this.actions.scrapShip(id);
            },
            false,
            room,
            42,
        );
    }
    update(deltaMS: number) {
        this.time += deltaMS / 1000;
        for (const planet of this.solarPlanets) planet.updateAppearance(this.time);
        this.visual.y = this.tab === 'recovery' ? 0 : Math.sin(this.time * 0.25) * 2;
        if (this.toast && this.time >= this.messageUntil) this.toast.setText('');
    }
}
