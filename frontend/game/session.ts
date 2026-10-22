import { cargoReceipt } from './ui/cargoReceipt';
import { LunarStationView } from './ui/lunarStation';
import { RESOURCE_IDS, RESOURCES } from './state/resources';
import { manufacture } from './state/production';
import { installKineticUpgrade } from './state/kineticIndustry';
import { terminalPuzzlePanel } from './ui/terminalPuzzle';
import { rescueRepairPanel } from './ui/rescueRepair';
import { relayTuningPanel } from './ui/relayTuning';
import { installStationShield } from './state/stationShield';
import { installStationDrones } from './state/stationDrones';
import { resourceSummary } from './state/resources';
import {
    DialoguePlayback,
    pendingDialogue,
    latestDialogue,
    completeDialogue,
    type DialogueDefinition,
} from './state/dialogues';
import { dialogueView } from './ui/dialogue';
import {
    STORY_SAVE_KEY,
    STORY_SECTORS,
    contributeStory,
    acknowledgeStoryBriefing,
    syncStory,
    travelStory,
    storyObjectives,
    storyAct,
    type StoryChange,
} from './state/story';
import { destroyDisplayTree } from '../core/systems/destroyDisplayTree';
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
    newStoryCampaign,
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

import { selectContract } from './state/contracts';
import { trainPilot } from './state/pilots';
import { PROTOTYPES, PrototypeId } from './systems/prototypes';
import {
    SandboxRun,
    SANDBOX_SCENARIOS,
    defaultSandboxConfig,
    type SandboxConfig,
    type SandboxReport,
    type SandboxOutcome,
} from './systems/sandbox';
import { SandboxSetup, sandboxResult } from './ui/sandbox';
import { FrameDiagnostics } from '../core/systems/frameDiagnostics';
import { releaseSceneBuffers } from '../core/systems/renderMemory';

export class GameSession {
    private profile: 'story' | 'legacy' = (() => {
        try {
            return localStorage.getItem('asteroids.activeProfile') === 'legacy'
                ? 'legacy'
                : 'story';
        } catch {
            return 'story';
        }
    })();
    private legacySaves = new SaveRepository({
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
    });
    private storySaves = new SaveRepository(
        {
            getItem: (key) => localStorage.getItem(key),
            setItem: (key, value) => localStorage.setItem(key, value),
        },
        { key: STORY_SAVE_KEY, create: newStoryCampaign },
    );
    get saves() {
        return this.profile === 'story' ? this.storySaves : this.legacySaves;
    }
    readonly campaign: Campaign;
    mission: MissionWorld | null = null;
    hud: MissionHud | null = null;
    lobby: LobbyView;
    private overlay = new Container();
    private hasOverlay = false;
    private lunarStationOpen = false;
    private interactionPanel: Container | null = null;
    private interactionRevision = -1;
    private interactionModel: object | null = null;
    private dialogue: DialoguePlayback | null = null;
    private dialoguePanel: ReturnType<typeof dialogueView> | null = null;
    private launching = false;
    private autosaveSeconds = 0;
    private savedDeliveryRevision = 0;
    private sandboxRun: SandboxRun | null = null;
    private sandboxSetup: SandboxSetup | null = null;
    private sandboxConfig = defaultSandboxConfig();
    private sandboxReports: SandboxReport[] = [];
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
            replayDialogue: () => {
                const d = latestDialogue(this.campaign);
                if (d) this.openDialogue(d);
            },
            openSandbox: () => this.openSandbox(),
            switchProfile: () => this.switchProfile(),
            travel: (sector) =>
                this.change(() => travelStory(this.campaign, sector), 'Wybrano sektor wypraw.'),
            briefing: () =>
                this.change(
                    () => !!acknowledgeStoryBriefing(this.campaign),
                    'Akt II ukończony. Trasa do Wenus otwarta. Wybierz Wenus w zakładce Układ słoneczny.',
                ),
            contribute: (id) => {
                if (this.mission || this.hasOverlay) return;
                const change = contributeStory(this.campaign, id);
                this.saves.save(this.campaign);
                this.lobby.refresh(
                    change
                        ? this.storyMessage(change, 'Materiały przekazane na zadanie.')
                        : 'Brak materiałów lub zadanie niedostępne.',
                );
            },
            launch: (recoveryId, loadConstruction, missionTask) =>
                this.launch(recoveryId, loadConstruction, missionTask),
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
            installKineticShield: () =>
                this.change(
                    () => installKineticUpgrade(this.campaign, 'shield'),
                    'Tarcza kinetyczna rozbudowana · obszar ochrony wzrósł o 150 m.',
                ),
            installReinforcedBay: () =>
                this.change(
                    () => installKineticUpgrade(this.campaign, 'storage'),
                    'Wzmocniony magazyn zamontowany · pojemność wzrosła o 400.',
                ),
            installStationShield: () =>
                this.change(
                    () => installStationShield(this.campaign),
                    'Generator tarczy aktywny. Satuk 15 chroni obszar w promieniu 850 m.',
                ),
            installStationDrones: () =>
                this.change(
                    () => installStationDrones(this.campaign),
                    'Hangar gotowy. Trzy drony strażnicze rozpoczną patrol przy kolejnym wylocie.',
                ),
            manufacture: (kind, batches) =>
                this.change(
                    () => manufacture(this.campaign, kind, batches),
                    'Partia gotowa. Produkty trafiły do magazynu.',
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
        this.background.setRegion(this.campaign.story?.sector ?? null);
        if (interrupted) this.showResult(interrupted);
        Bus.subscribe(
            'input',
            (message) => {
                if (this.dialogue) {
                    if (
                        (!PopupContainer.hasActivePopup() || message.name === 'keyup') &&
                        (message.name === 'keydown' || message.name === 'keyup') &&
                        this.dialogue.key(message.data, message.name === 'keydown')
                    )
                        this.renderDialogue();
                    return;
                }
                if (
                    this.mission?.simulation.ended &&
                    message.name === 'keydown' &&
                    message.data !== 'escape'
                )
                    return;
                if (
                    (this.mission?.simulation.terminalPuzzle ||
                        this.mission?.simulation.relayTuning ||
                        this.mission?.simulation.rescueOperation?.repair ||
                        this.mission?.simulation.transferActive) &&
                    message.name === 'keydown' &&
                    !['escape', 'tab'].includes(message.data)
                )
                    return;
                if (this.lunarStationOpen) return;
                if (message.name === 'keydown') {
                    this.sandboxSetup?.handleKey(message.data);
                    if (this.sandboxRun && !this.hasOverlay && !PopupContainer.hasActivePopup()) {
                        if (message.data === 'f6') {
                            this.finishSandbox('restart', true);
                            return;
                        }
                        if (message.data === 'f7') {
                            this.finishSandbox('stopped');
                            return;
                        }
                    }
                }
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
                    [',', '.'].includes(message.data)
                )
                    this.hud.cycleTarget(message.data === '.' ? 1 : -1);
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
    private openDialogue(definition: DialogueDefinition, radio = false) {
        if (
            this.hasOverlay ||
            (this.mission && !radio) ||
            this.launching ||
            PopupContainer.hasActivePopup()
        )
            return;
        this.hasOverlay = true;
        InputHandler.clear();
        this.dialogue = new DialoguePlayback(definition);
        this.renderDialogue();
    }
    private renderDialogue() {
        const playback = this.dialogue;
        if (!playback) return;
        if (
            this.dialoguePanel &&
            !this.dialoguePanel.destroyed &&
            this.dialoguePanel.lineIndex === playback.index
        ) {
            this.dialoguePanel.update(0);
            return;
        }
        clear(this.overlay);
        this.dialoguePanel = null;
        if (playback.complete) {
            if (playback.definition.id !== 'radio-report')
                completeDialogue(this.campaign, playback.definition.id);
            this.saves.save(this.campaign);
            this.dialogue = null;
            this.hasOverlay = false;
            InputHandler.clear();
            if (this.mission) return;
            this.lobby.refresh(
                this.saves.warning || 'Odprawa zakończona. Cele dostępne w panelu wyprawy.',
            );
            return;
        }
        this.dialoguePanel = this.overlay.addChild(
            dialogueView(playback, () => {
                if (PopupContainer.hasActivePopup() || this.dialogue !== playback) return;
                playback.interact();
                this.renderDialogue();
            }),
        );
    }
    private storyMessage(change: StoryChange, fallback: string) {
        return `${change.titles.length ? `Ukończono: ${change.titles.join(' · ')}.` : fallback}${change.overflow ? ` Magazyn pełny: nadwyżka ${change.overflow}.` : ''}`;
    }
    private switchProfile() {
        if (this.mission || this.launching || this.hasOverlay) return;
        this.saves.save(this.campaign);
        this.profile = this.profile === 'story' ? 'legacy' : 'story';
        try {
            localStorage.setItem('asteroids.activeProfile', this.profile);
        } catch {
            /* Session-only selection is still usable. */
        }
        const next = this.saves.load();
        const interrupted = next.activeRun
            ? finishRun(
                  next,
                  false,
                  { ore: 0, parts: 0 },
                  0,
                  'Poprzednia wyprawa została przerwana przez zamknięcie gry.',
              )
            : null;
        Object.assign(this.campaign, next);
        this.saves.save(this.campaign);
        this.background.setRegion(this.campaign.story?.sector ?? null);
        this.lobby.resetProfile();
        this.lobby.refresh(
            this.saves.warning ||
                (this.campaign.story
                    ? `Satuk 15 · ${storyAct(this.campaign.story)} · ${STORY_SECTORS[this.campaign.story.sector].name}. Postęp kampanii wczytany.`
                    : 'Wczytano tryb testowy. Kampania Satuk 15 ma osobny zapis.'),
        );
        if (interrupted) this.showResult(interrupted);
    }
    private change(action: () => boolean, message: string) {
        if (this.mission || this.hasOverlay) return;
        const success = action();
        const storyChange = success ? syncStory(this.campaign) : null;
        this.background.setRegion(this.campaign.story?.sector ?? null);
        uiCue(success ? 'confirm' : 'error');
        this.saves.save(this.campaign);
        this.lobby.refresh(
            this.saves.warning ||
                (success
                    ? storyChange?.titles.length
                        ? this.storyMessage(storyChange, message)
                        : message
                    : 'Brak surowców lub osiągnięty limit.'),
        );
    }
    private requestAbortMission() {
        const sim = this.mission?.simulation;
        if (!sim?.canAbortMission || this.hasOverlay) return;
        PopupContainer.hide('missionInfo');
        this.hasOverlay = true;
        InputHandler.clear();
        clear(this.overlay);
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: C.ink, alpha: 0.88 });
        shade.eventMode = 'static';
        this.overlay.addChild(shade);
        panel(this.overlay, 400, 280, 800, 340);
        label(this.overlay, 'PRZERWANIE MISJI', 440, 315, 15, C.gold);
        label(this.overlay, 'Zarządzić odwrót?', 440, 350, 34);
        label(
            this.overlay,
            'Otworzysz dokowanie. Po powrocie ładunek pozostały na pokładzie i raport tej wyprawy przepadną. Nie otrzymasz nagrody ani PD. Pilot, statek i wcześniejszy postęp pozostaną.',
            440,
            410,
            20,
            C.muted,
            710,
        );
        const close = () => {
            clear(this.overlay);
            this.hasOverlay = false;
            InputHandler.clear();
        };
        button(this.overlay, 'KONTYNUUJ MISJĘ', 440, 540, 340, close, false, true, 44, 15);
        button(
            this.overlay,
            'PRZERWIJ I WRÓĆ',
            800,
            540,
            350,
            () => {
                sim.abortMission();
                this.saves.save(this.campaign);
                close();
            },
            true,
            true,
            44,
            15,
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
            abortMission: !this.sandboxRun ? () => this.requestAbortMission() : undefined,
            campaign: this.sandboxRun?.campaign ?? this.campaign,
            contract: (this.sandboxRun?.campaign ?? this.campaign).contract,
            objectives:
                this.sandboxRun?.objectives() ??
                (this.campaign.story
                    ? storyObjectives(
                          this.campaign,
                          [...this.mission.simulation.surveyData],
                          this.mission.simulation.lunarAssault.state === 'complete',
                          this.mission.simulation.storyPatrolKills,
                          this.mission.simulation.venusAssault.state === 'complete',
                          this.mission.simulation.marsAssault.state === 'complete',
                          [...this.mission.simulation.clearedBeltRocks],
                          this.mission.simulation.cargo.ore,
                          this.mission.simulation.firstBoss.complete &&
                              !this.mission.simulation.firstBoss.finale,
                          this.mission.simulation.firstBoss.complete &&
                              this.mission.simulation.firstBoss.finale,
                          this.mission.simulation.cargo,
                      )
                    : undefined),
            objectivesTitle:
                !this.sandboxRun && this.campaign.story
                    ? `${storyAct(this.campaign.story)} · ${STORY_SECTORS[this.campaign.story.sector].name}`
                    : undefined,
        });
    }
    private closeSandbox() {
        this.sandboxSetup = null;
        clear(this.overlay);
        this.hasOverlay = false;
        InputHandler.clear();
    }
    private openSandbox() {
        if (this.mission || this.launching) return;
        clear(this.overlay);
        this.hasOverlay = true;
        this.sandboxSetup = new SandboxSetup(
            this.sandboxConfig,
            (config) => this.launchSandbox(config),
            () => this.closeSandbox(),
        );
        this.overlay.addChild(this.sandboxSetup);
        InputHandler.clear();
    }
    private launchSandbox(config: SandboxConfig) {
        if (this.mission || this.launching) return;
        this.launching = true;
        let run: SandboxRun | null = null;
        try {
            run = new SandboxRun(config);
            this.sandboxConfig = { ...run.config };
            this.sandboxRun = run;
            this.background.setRegion(null);
            this.mission = new MissionWorld(run.simulation, run.campaign.ship!, false);
            this.hud = new MissionHud(
                run.simulation,
                run.campaign.contract,
                () => this.toggleMissionInfo(),
                () => run!.objectives(),
            );
            this.hud.target = SANDBOX_SCENARIOS[run.config.scenario].target;
            this.hud.cameraAngle = this.mission.camera.rotation;
            label(
                this.hud,
                `SANDBOX · ${SANDBOX_SCENARIOS[run.config.scenario].name} · seed ${run.config.seed}`,
                510,
                15,
                14,
                C.gold,
            );
            button(
                this.hud,
                'F6 · RESTART',
                535,
                47,
                140,
                () => this.finishSandbox('restart', true),
                false,
                true,
                28,
            );
            button(
                this.hud,
                'F7 · WYNIK',
                690,
                47,
                140,
                () => this.finishSandbox('stopped'),
                false,
                true,
                28,
            );
            this.worldHost.addChild(this.mission);
            this.uiHost.addChildAt(this.hud, 0);
            this.lobby.visible = false;
            this.closeSandbox();
            GameState.goToGameplay();
            FrameDiagnostics.start(() => !this.hasOverlay && !PopupContainer.hasActivePopup());
            uiCue('launch');
        } catch (error) {
            FrameDiagnostics.stop();
            if (this.mission) this.mission.dispose();
            else run?.simulation.dispose();
            this.mission = null;
            this.syncInteractionPanel();
            if (this.hud) destroyDisplayTree(this.hud);
            this.hud = null;
            releaseSceneBuffers();
            this.sandboxRun = null;
            this.background.setRegion(this.campaign.story?.sector ?? null);
            this.lobby.visible = true;
            this.closeSandbox();
            this.lobby.refresh(
                'Nie udało się uruchomić próby. Zapis kampanii nie został zmieniony.',
            );
            console.error(error);
        } finally {
            this.launching = false;
        }
    }
    private finishSandbox(outcome: SandboxOutcome, restart = false) {
        if (!this.sandboxRun || !this.mission) return;
        const report = this.sandboxRun.report(outcome),
            config = { ...this.sandboxRun.config };
        report.performance = FrameDiagnostics.stop();
        const previous = [...this.sandboxReports];
        this.sandboxReports.push(report);
        this.sandboxReports = this.sandboxReports.slice(-20);
        this.mission.dispose();
        this.mission = null;
        this.syncInteractionPanel();
        if (this.hud) destroyDisplayTree(this.hud);
        this.hud = null;
        releaseSceneBuffers();
        this.sandboxRun = null;
        this.background.setRegion(this.campaign.story?.sector ?? null);
        SoundManager.stopGroup('gameplay');
        this.background.camera = { x: 0, y: 0 };
        this.lobby.visible = true;
        GameState.goToLobby();
        InputHandler.clear();
        this.closeSandbox();
        if (restart) {
            this.launchSandbox(config);
            return;
        }
        this.hasOverlay = true;
        sandboxResult(
            this.overlay,
            report,
            previous,
            () => this.launchSandbox(config),
            () => this.openSandbox(),
            () => this.closeSandbox(),
        );
    }
    launch(
        recoveryId: number | null = null,
        loadConstruction = false,
        missionTask: string | null = null,
    ) {
        if (this.launching || this.mission || this.hasOverlay) return;
        this.launching = true;
        const randomSeed = crypto.getRandomValues(new Uint32Array(1))[0];
        if (!beginRun(this.campaign, randomSeed, recoveryId, loadConstruction, missionTask)) {
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
            this.hud = new MissionHud(
                simulation,
                this.campaign.contract,
                () => this.toggleMissionInfo(),
                this.campaign.story
                    ? () =>
                          storyObjectives(
                              this.campaign,
                              [...simulation.surveyData],
                              simulation.lunarAssault.state === 'complete',
                              simulation.storyPatrolKills,
                              simulation.venusAssault.state === 'complete',
                              simulation.marsAssault.state === 'complete',
                              [...simulation.clearedBeltRocks],
                              simulation.cargo.ore,
                              simulation.firstBoss.complete && !simulation.firstBoss.finale,
                              simulation.firstBoss.complete && simulation.firstBoss.finale,
                              simulation.cargo,
                          )
                    : undefined,
                this.campaign.story
                    ? `${storyAct(this.campaign.story)} · ${STORY_SECTORS[this.campaign.story.sector].name}`
                    : undefined,
            );
            if (this.campaign.story)
                simulation.setNotice(
                    this.campaign.story?.sector === 'pluto'
                        ? 'Akt X: zwiad · baza / osłona · finał po obu raportach: G 2 s · dodatkowy odczyt · powrót.'
                        : simulation.outerSector
                          ? 'Akt IX: zwiad · baza po zwiadzie · kontakty · dalsza trasa · Neptun: starcie / G 2 s.'
                          : simulation.saturnSector
                            ? 'Saturn: złoże · zwiad · kryształy po zwiadzie · patrol · trasa po raportach · powrót.'
                            : simulation.jupiterSector
                              ? 'Jowisz: zwiad · terminal po zwiadzie · patrole · pakiet po raportach · powrót.'
                              : simulation.beltSector
                                ? 'Pas asteroid: pomiary · przeszkody po zwiadzie · granica po oczyszczeniu · powrót.'
                                : 'Satuk 15: złoże · przekaźnik · E odczyt / dokowanie. Zadania możesz realizować równolegle.',
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
            const freight = this.campaign.activeRun!.freight;
            if (freight) {
                for (const id of RESOURCE_IDS)
                    if (freight[id])
                        this.campaign.bank[id] = (this.campaign.bank[id] ?? 0) + freight[id]!;
            }
            this.campaign.activeRun = null;
            this.campaign.sorties--;
            this.saves.save(this.campaign);
            this.mission?.dispose();
            this.mission = null;
            this.syncInteractionPanel();
            if (this.hud) destroyDisplayTree(this.hud);
            this.hud = null;
            releaseSceneBuffers();
            this.lobby.visible = true;
            this.lobby.refresh('Nie udało się uruchomić sektora. Spróbuj ponownie.');
            console.error(error);
        }
        this.launching = false;
    }
    private closeLunarStation() {
        this.lunarStationOpen = false;
        this.hasOverlay = false;
        clear(this.overlay);
        InputHandler.clear();
        if (this.hud) this.hud.visible = true;
        this.saves.save(this.campaign);
    }
    private openLunarStation() {
        const world = this.mission;
        if (!world?.simulation.canUseLunarStationFor(this.campaign) || this.hasOverlay) return;
        this.hasOverlay = true;
        this.lunarStationOpen = true;
        world.audio.pause();
        SoundManager.stopGroup('gameplay');
        InputHandler.clear();
        if (this.hud) this.hud.visible = false;
        clear(this.overlay);
        this.overlay.addChild(
            new LunarStationView(
                this.campaign,
                world.simulation,
                () => this.closeLunarStation(),
                () => this.saves.save(this.campaign),
            ),
        );
    }
    update(deltaMS: number) {
        if (this.dialogue && !PopupContainer.hasActivePopup()) this.dialoguePanel?.update(deltaMS);
        this.background.setFlight(!!this.mission);
        if (this.mission) {
            this.background.lunarTransfer = this.mission.simulation.transferActive;
            this.background.camera = this.mission.backgroundCamera;
            this.background.cameraAngle = this.mission.camera.rotation;
            this.background.cameraZoom = this.mission.backgroundZoom;
            this.background.surface =
                this.mission.simulation.area === 'surface' ||
                this.mission.simulation.transferActive;
        }
        if (!this.mission) {
            this.syncInteractionPanel();
            this.lobby.update(deltaMS);
            if (!this.hasOverlay && !this.launching && !PopupContainer.hasActivePopup()) {
                const d = pendingDialogue(this.campaign);
                if (d) this.openDialogue(d);
            }
            return;
        }
        if (this.hasOverlay || PopupContainer.hasActivePopup()) {
            this.mission.audio.pause();
            SoundManager.stopGroup('gameplay');
            return;
        }
        const simInput = this.mission.simulation;
        const tuning =
            this.mission.direction.active ||
            !!simInput.terminalPuzzle ||
            !!simInput.relayTuning ||
            !!simInput.rescueOperation?.repair ||
            simInput.transferActive ||
            simInput.hyperdrive.active ||
            !!simInput.ended;
        if (simInput.transferActive || this.mission.direction.active) InputHandler.clear();
        const local = this.mission.camera.toLocal(InputHandler.pointer);
        const elapsedBefore = simInput.elapsed;
        this.mission.update(deltaMS, {
            unload: InputHandler.isKeyPressed('UNLOAD'),
            hyperdrive:
                !simInput.terminalPuzzle &&
                !simInput.relayTuning &&
                !simInput.rescueOperation?.repair &&
                !simInput.transferActive &&
                InputHandler.isKeyPressed('HYPERDRIVE'),
            target: tuning ? simInput.position : local,
            thrust: !tuning && InputHandler.isKeyPressed('THRUST'),
            brake: !tuning && InputHandler.isKeyPressed('BRAKE'),
            turn: tuning
                ? 0
                : Number(InputHandler.isKeyPressed('RIGHT')) -
                  Number(InputHandler.isKeyPressed('LEFT')),
            boost: !tuning && InputHandler.isKeyPressed('BOOST'),
            fire: !tuning && InputHandler.primaryPressed && InputHandler.pointerInCanvas,
            mine: !tuning && InputHandler.secondaryPressed && InputHandler.pointerInCanvas,
            interact: !tuning && InputHandler.isKeyPressed('INTERACT'),
            tow: !tuning && InputHandler.isKeyPressed('TOW'),
            repair: !tuning && InputHandler.isKeyPressed('REPAIR'),
            sabotage: !tuning && InputHandler.isKeyPressed('SABOTAGE'),
        });
        if (simInput.lunarStationRequested) {
            simInput.lunarStationRequested = false;
            this.openLunarStation();
            if (this.lunarStationOpen) return;
        }
        this.background.lunarTransfer = this.mission.simulation.transferActive;
        this.background.transferBody = this.mission.simulation.marsMoon?.id ?? 'moon';
        this.background.setMarsArea(this.mission.simulation.marsMap?.id ?? null);
        this.background.camera = this.mission.backgroundCamera;
        this.background.cameraAngle = this.mission.camera.rotation;
        this.background.cameraZoom = this.mission.backgroundZoom;
        this.background.surface =
            this.mission.simulation.area === 'surface' || this.mission.simulation.transferActive;
        this.syncInteractionPanel();
        if (this.hud)
            this.hud.visible =
                !this.mission.simulation.transferActive &&
                !this.mission.direction.active &&
                this.mission.simulation.ended !== 'destroyed';
        if (this.sandboxRun) {
            const sim = this.mission.simulation;
            this.background.camera = this.mission.backgroundCamera;
            if (this.hud) this.hud.cameraAngle = this.mission.camera.rotation;
            this.hud?.update(deltaMS);
            if (sim.pendingChoice && !sim.ended) this.showPrototypeChoice();
            if (
                sim.ended &&
                (sim.ended !== 'destroyed' || this.mission.deathFinished) &&
                (sim.ended !== 'returned' || this.mission.returnFinished)
            )
                this.finishSandbox(sim.ended);
            return;
        }
        const elapsed = this.mission.simulation.elapsed - elapsedBefore;
        this.autosaveSeconds += elapsed;
        if (this.autosaveSeconds >= 5) {
            if (this.campaign.activeRun)
                this.campaign.activeRun.lastPosition = this.mission.simulation.position;
            this.saves.save(this.campaign);
            this.autosaveSeconds = 0;
        }
        if (this.mission.simulation.deliveryRevision !== this.savedDeliveryRevision) {
            this.savedDeliveryRevision = this.mission.simulation.deliveryRevision;
            if (this.campaign.activeRun)
                this.campaign.activeRun.lastPosition = this.mission.simulation.position;
            this.saves.save(this.campaign);
        }
        this.background.camera = this.mission.backgroundCamera;
        if (this.hud) this.hud.cameraAngle = this.mission.camera.rotation;
        this.hud?.update(deltaMS);
        const sim = this.mission.simulation;
        if (
            !sim.ended &&
            (sim.radioMessages.length || sim.guideMessages.length) &&
            !sim.hyperdrive.active &&
            !sim.transferActive &&
            !sim.terminalPuzzle &&
            !sim.relayTuning &&
            !sim.pendingChoice
        ) {
            this.hud?.update(101);
            this.openDialogue(
                {
                    id: 'radio-report',
                    title: 'Potwierdzenie Satuk 15',
                    sector: 'earth',
                    after: [],
                    tasks: [],
                    lines: [
                        ...sim.radioMessages
                            .splice(0)
                            .map((text) => ({ speaker: 'operations' as const, text })),
                        ...sim.guideMessages
                            .splice(0)
                            .map((text) => ({ speaker: 'guide' as const, text })),
                    ],
                },
                true,
            );
        }
        if (sim.pendingChoice && !sim.ended) this.showPrototypeChoice();
        if (sim.ended === 'destroyed' && !this.mission.deathFinished) return;
        if (sim.ended === 'returned' && !this.mission.returnFinished) return;
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
                    wreckVisited: sim.wreckVisited,
                    assaultWon: sim.lunarAssault.state === 'complete',
                    venusDefenseWon: sim.venusAssault.state === 'complete',
                    marsDefenseWon: sim.marsAssault.state === 'complete',
                    firstBossWon: sim.firstBoss.complete && !sim.firstBoss.finale,
                    finalBossWon: sim.firstBoss.complete && sim.firstBoss.finale,
                    patrolKills: sim.storyPatrolKills,
                    clearedBeltRocks: [...sim.clearedBeltRocks],
                    securedId: sim.recoverySecured ? sim.recoverySignal?.id : undefined,
                    data: [...sim.surveyData],
                    kills: sim.enemyKills,
                    equipment: sim.stolenEquipment,
                    recycledWreck:
                        sim.recycledWreck === 'satellite' ? undefined : sim.recycledWreck,
                    destroyedRecoveryId: sim.recoveryDestroyed ? sim.recoverySignal?.id : undefined,
                },
            );
            this.saves.save(this.campaign);
            this.mission.dispose();
            SoundManager.stopGroup('gameplay');
            this.mission = null;
            this.syncInteractionPanel();
            if (this.hud) destroyDisplayTree(this.hud);
            this.hud = null;
            releaseSceneBuffers();
            this.background.camera = { x: 0, y: 0 };
            this.lobby.visible = true;
            this.lobby.refresh('');
            GameState.goToLobby();
            InputHandler.clear();
            if (result) this.showResult(result);
        }
    }
    private syncInteractionPanel() {
        const sim = this.mission?.simulation;
        const tuning = !sim?.ended
            ? (sim?.terminalPuzzle ?? sim?.relayTuning ?? sim?.rescueOperation?.repair)
            : null;
        if (!tuning) {
            if (this.interactionPanel) destroyDisplayTree(this.interactionPanel);
            this.interactionPanel = null;
            this.interactionRevision = -1;
            this.interactionModel = null;
            return;
        }
        if (
            this.interactionPanel &&
            this.interactionModel === tuning &&
            this.interactionRevision === tuning.revision
        )
            return;
        if (!this.interactionPanel) {
            this.interactionPanel = new Container();
            this.uiHost.addChild(this.interactionPanel);
            InputHandler.clear();
        } else clear(this.interactionPanel);
        this.interactionRevision = tuning.revision;
        this.interactionModel = tuning;
        if (sim?.terminalPuzzle) {
            terminalPuzzlePanel(this.interactionPanel, sim.terminalPuzzle, (action) => {
                sim.terminalAction(action);
                InputHandler.clear();
                this.syncInteractionPanel();
            });
            return;
        }
        if (sim?.rescueOperation?.repair) {
            rescueRepairPanel(this.interactionPanel, sim.rescueOperation.repair, (action) => {
                sim.rescueRepairAction(action);
                InputHandler.clear();
                this.syncInteractionPanel();
            });
            return;
        }
        relayTuningPanel(this.interactionPanel, sim!.relayTuning!, (action) => {
            sim!.relayAction(action);
            InputHandler.clear();
            this.syncInteractionPanel();
        });
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
    private showResult(result: RunResult, page = 0) {
        uiCue(result.success ? 'complete' : 'destroy');
        clear(this.overlay);
        this.hasOverlay = true;
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.8 });
        shade.eventMode = 'static';
        this.overlay.addChild(shade);
        panel(this.overlay, 405, 200, 790, 590);
        label(
            this.overlay,
            `${this.campaign.story ? 'SATUK 15' : 'AURORA'} / ${result.aborted ? 'MISJA PRZERWANA' : result.success ? 'ŁADUNEK ZABEZPIECZONY' : 'UTRACONA WYPRAWA'}`,
            450,
            236,
            15,
            result.success ? C.mint : C.red,
        );
        label(
            this.overlay,
            result.aborted
                ? 'Powrót po odwrocie.'
                : result.success
                  ? 'Witaj w domu.'
                  : 'Sygnał urwał się.',
            450,
            277,
            42,
        );
        label(this.overlay, `${result.pilotName} / ${result.shipName}`, 450, 345, 23, C.muted);
        if (result.success) {
            const resources = RESOURCE_IDS.filter((id) => (result.cargo[id] ?? 0) > 0);
            const pages = Math.max(1, Math.ceil(resources.length / 8));
            page = Math.max(0, Math.min(page, pages - 1));
            label(this.overlay, 'ZEBRANO → W MAGAZYNIE', 450, 389, 13, C.muted);
            if (!resources.length) label(this.overlay, 'Ładownia pusta.', 450, 422, 19, C.muted);
            cargoReceipt(
                this.overlay,
                resources.slice(page * 8, page * 8 + 8),
                result.cargo,
                this.campaign.bank,
            );
            if (pages > 1) {
                button(
                    this.overlay,
                    '←',
                    450,
                    602,
                    65,
                    () => this.showResult(result, page - 1),
                    false,
                    page > 0,
                    24,
                    14,
                );
                label(this.overlay, `${page + 1} / ${pages}`, 775, 605, 14, C.muted);
                button(
                    this.overlay,
                    '→',
                    1085,
                    602,
                    65,
                    () => this.showResult(result, page + 1),
                    false,
                    page + 1 < pages,
                    24,
                    14,
                );
            }
        } else {
            label(this.overlay, 'Pilot i statek nie wrócili do bazy.', 450, 395, 22, C.red, 700);
            label(this.overlay, result.contractText, 450, 435, 16, C.mint, 700);
            label(this.overlay, result.reason, 450, 471, 17, C.muted, 700);
            if (result.equipmentText)
                label(this.overlay, result.equipmentText, 450, 540, 16, C.mint, 700);
            if (result.recoveryText)
                label(this.overlay, result.recoveryText, 450, 580, 16, C.gold, 700);
        }
        if (result.deliveries.length)
            button(
                this.overlay,
                `ODHOLOWANE OBIEKTY · ${result.deliveries.length}`,
                450,
                632,
                700,
                () => this.showDeliveries(result),
                false,
                true,
                26,
                14,
            );
        const progress = result.pilotProgress;
        if (progress)
            label(
                this.overlay,
                `+${progress.gainedXp} PD · ${progress.levelAfter > progress.levelBefore ? `Awans na poziom ${progress.levelAfter}!` : `Poziom ${progress.levelAfter}`} · Punkty rozwoju: ${progress.points}`,
                450,
                665,
                16,
                C.mint,
                700,
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
