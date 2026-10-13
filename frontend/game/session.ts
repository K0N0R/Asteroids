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
import { advanceCrew, cancelJob, hireMechanic, queueJob } from './state/crew';
import { selectContract } from './state/contracts';
import { trainPilot } from './state/pilots';

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
                if (message.name === 'keydown' && this.hud && /^[1-8]$/.test(message.data))
                    this.hud.target = Number(message.data) - 1;
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
        this.saves.save(this.campaign);
        this.lobby.refresh(
            this.saves.warning || (success ? message : 'Brak surowców lub osiągnięty limit.'),
        );
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
            this.mission = new MissionWorld(simulation, this.campaign.ship!);
            this.hud = new MissionHud(simulation, this.campaign.contract, this.campaign);
            this.worldHost.addChild(this.mission);
            this.uiHost.addChildAt(this.hud, 0);
            this.lobby.visible = false;
            InputHandler.clear();
            GameState.goToGameplay();
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
        if (this.hasOverlay || PopupContainer.hasActivePopup()) return;
        const local = this.mission.camera.toLocal(InputHandler.pointer);
        const elapsedBefore = this.mission.simulation.elapsed;
        this.mission.update(deltaMS, {
            target: local,
            thrust: InputHandler.isKeyPressed('THRUST'),
            brake: InputHandler.isKeyPressed('BRAKE'),
            fire: InputHandler.primaryPressed && InputHandler.pointerInCanvas,
            interact: InputHandler.isKeyPressed('INTERACT'),
            repair: InputHandler.isKeyPressed('REPAIR'),
        });
        const elapsed = this.mission.simulation.elapsed - elapsedBefore;
        const completed = advanceCrew(this.campaign, elapsed);
        this.crewSaveSeconds += elapsed;
        if (completed || this.crewSaveSeconds >= 5) {
            if (this.campaign.activeRun)
                this.campaign.activeRun.lastPosition = this.mission.simulation.position;
            this.saves.save(this.campaign);
            this.crewSaveSeconds = 0;
            if (completed) this.mission.simulation.setNotice('Mechanik zakończył zadanie w bazie.');
        }
        this.background.camera = this.mission.simulation.position;
        this.hud?.update(deltaMS);
        const sim = this.mission.simulation;
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
                },
            );
            this.saves.save(this.campaign);
            this.mission.dispose();
            SoundManager.stopGroup('gameplay');
            this.mission = null;
            this.hud?.destroy({ children: true });
            this.hud = null;
            this.background.camera = { x: 0, y: 0 };
            this.lobby.visible = true;
            this.lobby.refresh('');
            GameState.goToLobby();
            InputHandler.clear();
            if (result) this.showResult(result);
        }
    }
    private showResult(result: RunResult) {
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
                ? `Dostarczono: ${result.cargo.ore} rudy · ${result.cargo.parts} komponentów`
                : 'Pilot i statek nie wrócili do bazy.',
            450,
            395,
            22,
            result.success ? C.mint : C.red,
        );
        if (result.success)
            label(
                this.overlay,
                `Premia i odzysk: ${result.reward.ore} rudy · ${result.reward.parts} komponentów`,
                450,
                435,
                20,
                C.gold,
            );
        label(this.overlay, result.contractText, 450, result.success ? 470 : 435, 16, C.mint, 700);
        label(this.overlay, result.reason, 450, result.success ? 500 : 471, 17, C.muted, 700);
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
