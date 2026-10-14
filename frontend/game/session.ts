import { uiCue } from './systems/audio';
import { equipWeapon } from './state/weapons';
import { Container, Graphics } from 'pixi.js';
import { Background } from '../core/containers/entities/background';
import { Bus } from '../core/systems/bus';
import { InputHandler } from '../core/systems/inputHandler';
import { GameState } from '../core/systems/gameState';
import { PopupContainer } from '../core/containers/popup/popupContainer';
import {
    Campaign,
    beginRun,
    buyShip,
    buyUpgrade,
    emergencyKit,
    finishRun,
    hirePilot,
    RunResult,
    SaveRepository,
    selectShip,
    scrapShip,
} from './state/campaign';
import { MissionSimulation } from './systems/mission';
import { MissionWorld } from './worlds/missionWorld';
import { LobbyView } from './ui/lobby';
import { MissionHud } from './ui/hud';
import { button, clear, label, panel } from './ui/primitives';
import { C } from './graphics/shapes';
import { SoundManager } from '../core/systems/soundManager';
import { advanceCrew, cancelJob, hireMechanic, hireQuartermaster, queueJob } from './state/crew';
import { selectContract } from './state/contracts';
import { trainPilot } from './state/pilots';
import { PROTOTYPES, PrototypeId } from './systems/prototypes';

export class GameSession {
    readonly saves = new SaveRepository({
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
    });
    readonly campaign: Campaign;
    mission: MissionWorld | null = null;
    hud: MissionHud | null = null;
    lobby: LobbyView;
    private overlay = new Container();
    private hasOverlay = false;
    private launching = false;
    private crewSaveSeconds = 0;
    private savedDeliveryRevision = 0;
    constructor(
        private worldHost: Container,
        private uiHost: Container,
        private background: Background,
    ) {
        this.campaign = this.saves.load();
        const interrupted = this.campaign.activeRun
            ? finishRun(
                  this.campaign,
                  false,
                  { ore: 0, parts: 0 },
                  0,
                  'Wyprawa została przerwana przez zamknięcie lub odświeżenie gry.',
              )
            : null;
        this.saves.save(this.campaign);
        this.lobby = new LobbyView(this.campaign, {
            launch: (recoveryId) => this.launch(recoveryId),
            equipWeapon: (weapon) =>
                this.change(() => equipWeapon(this.campaign, weapon), 'Uzbrojenie zamontowane.'),
            upgrade: (upgrade) =>
                this.change(() => buyUpgrade(this.campaign, upgrade), 'Ulepszenie zamontowane.'),
            hire: (archetype) =>
                this.change(() => hirePilot(this.campaign, archetype), 'Pilot dołączył do załogi.'),
            selectPilot: (id) =>
                this.change(() => {
                    if (!this.campaign.pilots.some((p) => p.id === id)) return false;
                    this.campaign.selectedPilot = id;
                    return true;
                }, 'Wybrano aktywnego pilota.'),
            trainPilot: (id, skill) =>
                this.change(
                    () => trainPilot(this.campaign, id, skill),
                    'Umiejętność rozwinięta. Premia działa od kolejnej wyprawy.',
                ),
            contract: (id) =>
                this.change(
                    () => selectContract(this.campaign, id),
                    'Kontrakt przyjęty. Premia zostanie rozliczona po powrocie.',
                ),
            buyShip: (hull) =>
                this.change(
                    () => buyShip(this.campaign, hull),
                    'Nowy statek jest gotowy. Poprzedni pozostaje w rezerwie.',
                ),
            selectShip: (id) =>
                this.change(
                    () => selectShip(this.campaign, id),
                    'Zmieniono aktywny statek. Moduły pozostały na swoich kadłubach.',
                ),
            scrapShip: (id) =>
                this.change(
                    () => scrapShip(this.campaign, id),
                    'Kadłub zezłomowany. Odzyskane materiały trafiły do magazynu.',
                ),
            hireMechanic: () =>
                this.change(() => hireMechanic(this.campaign), 'Mechanik stacji gotowy do pracy.'),
            hireQuartermaster: () =>
                this.change(
                    () => hireQuartermaster(this.campaign),
                    'Intendent uruchomił stanowisko odzysku.',
                ),
            queueJob: (kind) =>
                this.change(
                    () => queueJob(this.campaign, kind),
                    'Zadanie dodane. Mechanik rozpocznie pracę po starcie wyprawy.',
                ),
            cancelJob: (id) =>
                this.change(
                    () => cancelJob(this.campaign, id),
                    'Zadanie anulowane. Surowce wróciły do magazynu.',
                ),
            rescue: () => {
                const ready = emergencyKit(this.campaign);
                this.saves.save(this.campaign);
                this.lobby.refresh(
                    ready
                        ? 'Zestaw awaryjny gotowy. Moduły odbudujesz podczas kolejnych wypraw.'
                        : 'Odebrano dostępny zestaw. Brakujące elementy kupisz w hangarze lub panelu pilotów.',
                );
            },
        });
        this.uiHost.addChild(this.lobby, this.overlay);
        this.lobby.refresh(this.saves.warning);
        if (interrupted) this.showResult(interrupted);
        Bus.subscribe(
            'input',
            (message) => {
                if (
                    message.name === 'focus-lost' ||
                    (message.name === 'keydown' && ['escape', 'tab'].includes(message.data))
                )
                    this.mission?.audio.pause();
                if (message.name === 'keydown' && message.data === 'tab') this.toggleMissionInfo();
                if (
                    message.name === 'keydown' &&
                    this.hud &&
                    !this.hasOverlay &&
                    !PopupContainer.hasActivePopup() &&
                    (/^[0-9]$/.test(message.data) || ['t', 'h'].includes(message.data))
                )
                    this.hud.target =
                        message.data === 'h'
                            ? 13
                            : message.data === 't'
                              ? this.hud.target === 11
                                  ? 12
                                  : 11
                              : Number(message.data) - 1;
                if (
                    message.name === 'keydown' &&
                    message.data === 'f' &&
                    this.hud &&
                    !this.hasOverlay &&
                    !PopupContainer.hasActivePopup()
                )
                    this.hud.trackEnemy();
                if (
                    message.name === 'keydown' &&
                    message.data === 'n' &&
                    this.hud &&
                    !this.hasOverlay &&
                    !PopupContainer.hasActivePopup()
                )
                    this.hud.target = 15;
                if (
                    message.name === 'keydown' &&
                    message.data === 'z' &&
                    this.hud &&
                    !this.hasOverlay &&
                    !PopupContainer.hasActivePopup()
                )
                    this.hud.trackWreck();
                if (
                    message.name === 'keydown' &&
                    message.data === 'j' &&
                    this.mission &&
                    !this.hasOverlay &&
                    !PopupContainer.hasActivePopup()
                )
                    this.mission.simulation.releaseWreck();
                if (
                    message.name === 'keydown' &&
                    message.data === 'c' &&
                    this.mission &&
                    !this.hasOverlay &&
                    !PopupContainer.hasActivePopup()
                )
                    this.mission.simulation.toggleCloak();
                if (
                    message.name === 'focus-lost' &&
                    this.mission &&
                    !this.hasOverlay &&
                    !PopupContainer.hasActivePopup()
                )
                    PopupContainer.show('configuration');
            },
            this,
        );
    }
    private change(action: () => boolean, message: string) {
        if (this.mission || this.hasOverlay) return;
        const success = action();
        uiCue(success ? 'confirm' : 'error');
        this.saves.save(this.campaign);
        this.lobby.refresh(
            this.saves.warning || (success ? message : 'Brak surowców lub osiągnięty limit.'),
        );
    }
    private toggleMissionInfo() {
        if (!this.mission || this.hasOverlay) return;
        if (PopupContainer.instance.popupPromises.missionInfo) {
            PopupContainer.hide('missionInfo');
            return;
        }
        if (PopupContainer.hasActivePopup()) return;
        PopupContainer.show('missionInfo', {
            simulation: this.mission.simulation,
            campaign: this.campaign,
            contract: this.campaign.contract,
        });
    }
    launch(recoveryId: number | null = null) {
        if (this.launching || this.mission || this.hasOverlay) return;
        this.launching = true;
        const randomSeed = crypto.getRandomValues(new Uint32Array(1))[0];
        if (!beginRun(this.campaign, randomSeed, recoveryId)) {
            this.launching = false;
            return;
        }
        // Persist the active marker before entering the sector; refresh counts as a loss.
        this.saves.save(this.campaign);
        try {
            const seed = this.campaign.activeRun!.seed;
            const simulation = new MissionSimulation(this.campaign, seed);
            this.savedDeliveryRevision = 0;
            this.mission = new MissionWorld(simulation, this.campaign.ship!);
            this.hud = new MissionHud(simulation, this.campaign.contract, () =>
                this.toggleMissionInfo(),
            );
            this.hud.cameraAngle = this.mission.camera.rotation;
            this.worldHost.addChild(this.mission);
            this.uiHost.addChildAt(this.hud, 0);
            this.lobby.visible = false;
            InputHandler.clear();
            GameState.goToGameplay();
            uiCue('launch');
        } catch (error) {
            // Initialization failures are not gameplay deaths.
            this.campaign.repairKits += this.campaign.activeRun!.repairKits;
            this.campaign.activeRun = null;
            this.campaign.sorties--;
            this.saves.save(this.campaign);
            this.mission?.dispose();
            this.mission = null;
            this.hud?.destroy({ children: true });
            this.hud = null;
            this.lobby.visible = true;
            this.lobby.refresh('Nie udało się uruchomić sektora. Spróbuj ponownie.');
            console.error(error);
        }
        this.launching = false;
    }
    update(deltaMS: number) {
        if (!this.mission) {
            this.lobby.update(deltaMS);
            return;
        }
        if (this.hasOverlay || PopupContainer.hasActivePopup()) {
            this.mission.audio.pause();
            SoundManager.stopGroup('gameplay');
            return;
        }
        const local = this.mission.camera.toLocal(InputHandler.pointer);
        const elapsedBefore = this.mission.simulation.elapsed;
        this.mission.update(deltaMS, {
            target: local,
            thrust: InputHandler.isKeyPressed('THRUST'),
            brake: InputHandler.isKeyPressed('BRAKE'),
            turn:
                Number(InputHandler.isKeyPressed('RIGHT')) -
                Number(InputHandler.isKeyPressed('LEFT')),
            boost: InputHandler.isKeyPressed('BOOST'),
            fire: InputHandler.primaryPressed && InputHandler.pointerInCanvas,
            mine: InputHandler.secondaryPressed && InputHandler.pointerInCanvas,
            interact: InputHandler.isKeyPressed('INTERACT'),
            repair: InputHandler.isKeyPressed('REPAIR'),
            sabotage: InputHandler.isKeyPressed('SABOTAGE'),
        });
        const elapsed = this.mission.simulation.elapsed - elapsedBefore;
        const completed = advanceCrew(this.campaign, elapsed);
        this.crewSaveSeconds += elapsed;
        if (completed || this.crewSaveSeconds >= 5) {
            if (this.campaign.activeRun)
                this.campaign.activeRun.lastPosition = this.mission.simulation.position;
            this.saves.save(this.campaign);
            this.crewSaveSeconds = 0;
            if (completed) this.mission.simulation.setNotice('Załoga zakończyła zadanie w bazie.');
        }
        if (this.mission.simulation.deliveryRevision !== this.savedDeliveryRevision) {
            this.savedDeliveryRevision = this.mission.simulation.deliveryRevision;
            if (this.campaign.activeRun)
                this.campaign.activeRun.lastPosition = this.mission.simulation.position;
            this.saves.save(this.campaign);
        }
        this.background.camera = this.mission.simulation.position;
        this.background.cameraAngle = this.mission.camera.rotation;
        if (this.hud) this.hud.cameraAngle = this.mission.camera.rotation;
        this.hud?.update(deltaMS);
        const sim = this.mission.simulation;
        if (sim.pendingChoice && !sim.ended) this.showPrototypeChoice();
        if (sim.ended) {
            const result = finishRun(
                this.campaign,
                sim.ended === 'returned',
                sim.cargo,
                sim.elapsed,
                sim.ended === 'returned'
                    ? 'Dokowanie zakończone. Ładunek przekazano do magazynu.'
                    : `${sim.deathReason} Ładunek i zestawy przepadły.`,
                sim.repairKits,
                {
                    lossPosition: sim.position,
                    securedId: sim.recoverySecured ? sim.recoverySignal?.id : undefined,
                    data: [...sim.surveyData],
                    kills: sim.enemyKills,
                    equipment: sim.stolenEquipment,
                    recycledWreck: sim.recycledWreck,
                    destroyedRecoveryId: sim.recoveryDestroyed ? sim.recoverySignal?.id : undefined,
                },
            );
            this.saves.save(this.campaign);
            this.mission.dispose();
            SoundManager.stopGroup('gameplay');
            this.mission = null;
            this.hud?.destroy({ children: true });
            this.hud = null;
            this.background.camera = { x: 0, y: 0 };
            this.background.cameraAngle = 0;
            this.lobby.visible = true;
            this.lobby.refresh('');
            GameState.goToLobby();
            InputHandler.clear();
            if (result) this.showResult(result);
        }
    }
    private showPrototypeChoice() {
        const sim = this.mission?.simulation;
        const choice = sim?.pendingChoice;
        if (!sim || !choice || this.hasOverlay) return;
        this.hud?.update(101);
        this.hasOverlay = true;
        InputHandler.clear();
        clear(this.overlay);
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.88 });
        shade.eventMode = 'static';
        this.overlay.addChild(shade);
        panel(this.overlay, 240, 180, 1120, 540);
        label(this.overlay, 'ODZYSK / TECHNOLOGIA EKSPERYMENTALNA', 280, 213, 15, C.mint);
        label(this.overlay, 'Wybierz prototyp.', 280, 248, 38);
        label(
            this.overlay,
            'Jeden moduł ze skrytki. Działa do końca tej wyprawy; baza i załoga czekają.',
            280,
            305,
            18,
            C.muted,
        );
        const choose = (id: PrototypeId | null) => {
            if (!sim.choosePrototype(id)) return;
            clear(this.overlay);
            this.hasOverlay = false;
            InputHandler.clear();
            this.hud?.update(101);
        };
        choice.offers.forEach((id, index) => {
            const x = 280 + index * 350;
            const prototype = PROTOTYPES[id];
            panel(this.overlay, x, 357, 330, 257);
            label(this.overlay, `PROTOTYP 0${index + 1}`, x + 20, 380, 13, C.mint);
            label(this.overlay, prototype.name, x + 20, 416, 23, C.text, 285);
            label(this.overlay, prototype.detail, x + 20, 480, 17, C.muted, 280);
            button(this.overlay, 'ZAMONTUJ →', x + 20, 552, 290, () => choose(id), true);
        });
        label(
            this.overlay,
            'Montaż jest bezpłatny. Nie można zmienić wyboru ani otworzyć skrytki ponownie.',
            280,
            650,
            15,
            C.muted,
            730,
        );
        button(this.overlay, 'POMIŃ SKRYTKĘ', 1070, 642, 250, () => choose(null));
    }
    private showDeliveries(result: RunResult, page = 0) {
        clear(this.overlay);
        this.hasOverlay = true;
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.8 });
        shade.eventMode = 'static';
        this.overlay.addChild(shade);
        panel(this.overlay, 405, 200, 790, 590);
        label(this.overlay, 'ODHOLOWANE DO AURORY', 450, 235, 24, C.mint);
        label(
            this.overlay,
            'Przekazane bazie · zachowane także po utracie wyprawy',
            450,
            275,
            16,
            C.muted,
        );
        const perPage = 5,
            pages = Math.ceil(result.deliveries.length / perPage);
        result.deliveries.slice(page * perPage, (page + 1) * perPage).forEach((d, i) => {
            label(
                this.overlay,
                `${page * perPage + i + 1}. ${d.description}`,
                450,
                320 + i * 63,
                17,
                C.text,
                690,
            );
            const m = d.materials;
            label(
                this.overlay,
                `${m.ore} R · ${m.parts} K · ${m.crystals ?? 0} X${d.source === 'recovery' ? ' · cel ratunkowy zabezpieczony' : ''}${d.overflow ? ` · nadwyżka ${d.overflow}` : ''}`,
                450,
                345 + i * 63,
                14,
                C.muted,
                690,
            );
        });
        if (pages > 1) {
            button(
                this.overlay,
                '←',
                450,
                650,
                70,
                () => this.showDeliveries(result, page - 1),
                false,
                page > 0,
                32,
            );
            label(this.overlay, `${page + 1} / ${pages}`, 765, 654, 16, C.muted);
            button(
                this.overlay,
                '→',
                1080,
                650,
                70,
                () => this.showDeliveries(result, page + 1),
                false,
                page + 1 < pages,
                32,
            );
        }
        button(
            this.overlay,
            'PODSUMOWANIE',
            450,
            692,
            700,
            () => this.showResult(result),
            true,
            true,
            56,
        );
    }
    private showResult(result: RunResult) {
        uiCue(result.success ? 'complete' : 'destroy');
        clear(this.overlay);
        this.hasOverlay = true;
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.8 });
        shade.eventMode = 'static';
        this.overlay.addChild(shade);
        panel(this.overlay, 405, 200, 790, 590);
        label(
            this.overlay,
            result.success ? 'AURORA / ŁADUNEK ZABEZPIECZONY' : 'AURORA / UTRACONA WYPRAWA',
            450,
            236,
            15,
            result.success ? C.mint : C.red,
        );
        label(this.overlay, result.success ? 'Witaj w domu.' : 'Sygnał urwał się.', 450, 277, 42);
        label(this.overlay, `${result.pilotName} / ${result.shipName}`, 450, 345, 23, C.muted);
        label(
            this.overlay,
            result.success
                ? `Dostarczono: ${result.cargo.ore} rudy · ${result.cargo.parts} komponentów · ${result.cargo.crystals ?? 0} kryształów`
                : 'Pilot i statek nie wrócili do bazy.',
            450,
            395,
            22,
            result.success ? C.mint : C.red,
        );
        if (result.success)
            label(
                this.overlay,
                `Premia i odzysk: ${result.reward.ore} rudy · ${result.reward.parts} komponentów · ${result.reward.crystals ?? 0} kryształów`,
                450,
                435,
                20,
                C.gold,
            );
        label(this.overlay, result.contractText, 450, result.success ? 470 : 435, 16, C.mint, 700);
        label(this.overlay, result.reason, 450, result.success ? 500 : 471, 17, C.muted, 700);
        if (result.equipmentText)
            label(this.overlay, result.equipmentText, 450, 615, 16, C.mint, 700);
        const progress = result.pilotProgress;
        if (progress)
            label(
                this.overlay,
                `Pilot: +${progress.gainedXp} PD · ${progress.levelAfter > progress.levelBefore ? `awans do poziomu ${progress.levelAfter}` : `poziom ${progress.levelAfter}`} · punkty rozwoju ${progress.points}`,
                450,
                536,
                17,
                C.mint,
                700,
            );
        label(this.overlay, result.recoveryText, 450, 574, 16, C.gold, 700);
        label(
            this.overlay,
            result.overflow
                ? `Magazyn pełny. Nadwyżka ${result.overflow} jednostek przepadła.`
                : result.success
                  ? 'Czas na naprawę, ulepszenia i kolejną wyprawę.'
                  : 'Baza, magazyn i statki rezerwowe pozostają.',
            450,
            659,
            15,
            C.muted,
        );
        if (result.deliveries.length)
            button(
                this.overlay,
                `ODHOLOWANE OBIEKTY · ${result.deliveries.length}`,
                450,
                647,
                700,
                () => this.showDeliveries(result),
                false,
                true,
                34,
            );
        button(
            this.overlay,
            'WRÓĆ DO BAZY  →',
            450,
            692,
            700,
            () => {
                clear(this.overlay);
                this.hasOverlay = false;
                InputHandler.clear();
            },
            true,
            true,
            56,
        );
    }
}
