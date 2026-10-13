import { Container, Graphics } from 'pixi.js';
import {
    CONTRACTS,
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
import { recoveryChances, recoveryDescription } from '../state/recovery';
import { contractLockReason } from '../state/contracts';
import { MAX_PILOT_XP, pilotLevel, pilotPoints } from '../state/pilots';
import { C, ShipView, stationView } from '../graphics/shapes';
import { button, clear, label, panel } from './primitives';

export type LobbyTab = 'overview' | 'hangar' | 'station' | 'pilots' | 'crew' | 'recovery';
export interface LobbyActions {
    launch: (recoveryId: number | null) => void;
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
    queueJob: (kind: JobKind) => void;
    cancelJob: (id: number) => void;
}
export class LobbyView extends Container {
    private content = new Container();
    private station = new Container();
    private tab: LobbyTab = 'overview';
    private time = 0;
    private message = '';
    private hangarMode: 'modules' | 'fleet' = 'modules';
    private pilotMode: 'roster' | 'skills' = 'roster';
    private scrapCandidate: number | null = null;
    private recoveryId: number | null = null;
    constructor(
        private campaign: Campaign,
        private actions: LobbyActions,
    ) {
        super();
        this.addChild(this.station, this.content);
        this.refresh();
    }
    refresh(message = this.message) {
        this.message = message;
        clear(this.content);
        clear(this.station);
        const c = this.campaign,
            p = selectedPilot(c),
            ui = this.content;
        if (!c.recoverySignals.some((signal) => signal.id === this.recoveryId))
            this.recoveryId = null;
        const station = stationView(c.station.workshop + c.station.storage);
        station.position.set(1130, 435);
        station.scale.set(1.65);
        this.station.addChild(station);
        const orbit = new Graphics()
            .ellipse(1130, 435, 390, 300)
            .stroke({ color: C.cyan, alpha: 0.1, width: 1 });
        this.station.addChild(orbit);
        if (c.ship) {
            const ship = new ShipView(c.ship);
            ship.position.set(1470, 435);
            ship.rotation = Math.PI;
            ship.scale.set(1.4 * HULLS[c.ship.hull].size);
            this.station.addChild(ship);
        }
        label(ui, 'O R B I T  /  A S T E R O I D S', 60, 42, 17, C.mint);
        label(ui, 'Dom pośród gwiazd.', 60, 75, 42);
        label(ui, 'STACJA AURORA', 1190, 58, 16, C.muted);
        label(ui, '●  DOK BEZPIECZNY', 1190, 86, 17, C.mint);
        const tabs: [LobbyTab, string][] = [
            ['overview', 'Wyprawa'],
            ['hangar', 'Hangar'],
            ['station', 'Stacja'],
            ['pilots', `Piloci${c.pilots.some((pilot) => pilotPoints(pilot) > 0) ? ' (+)' : ''}`],
            ['crew', 'Załoga'],
            ['recovery', `Ratunek (${c.recoverySignals.length})`],
        ];
        tabs.forEach(([tab, text], i) =>
            button(
                ui,
                text,
                60 + i * 126,
                151,
                118,
                () => {
                    this.tab = tab;
                    this.refresh();
                },
                this.tab === tab,
            ),
        );
        panel(ui, 60, 218, 624, 475);
        label(ui, `${c.bank.ore}  RUDA`, 90, 240, 23, C.mint);
        label(ui, `${c.bank.parts}  KOMPONENTY`, 314, 240, 23, C.gold);
        label(
            ui,
            `${storageUsed(c)} / ${storageCapacity(c)} w magazynie · wraz z rezerwacją zadań`,
            90,
            275,
            15,
            C.muted,
        );
        if (this.tab === 'overview') this.overview(ui);
        if (this.tab === 'hangar') this.hangar(ui);
        if (this.tab === 'station') this.upgrades(ui, ['workshop', 'storage']);
        if (this.tab === 'pilots') this.pilots(ui);
        if (this.tab === 'crew') this.crew(ui);
        if (this.tab === 'recovery') this.recovery(ui);
        const ready = !!c.ship && !!p;
        button(
            ui,
            ready
                ? this.recoveryId !== null
                    ? 'ROZPOCZNIJ AKCJĘ RATUNKOWĄ  →'
                    : 'ROZPOCZNIJ WYPRAWĘ  →'
                : 'PRZYGOTUJ STATEK I PILOTA',
            60,
            714,
            624,
            () => this.actions.launch(this.recoveryId),
            true,
            ready,
            58,
        );
        label(
            ui,
            this.message || 'Łup jest bezpieczny dopiero po powrocie do bazy.',
            64,
            791,
            16,
            this.message ? C.gold : C.muted,
        );
        label(ui, 'AURORA / 01', 983, 745, 29);
        label(ui, 'Warsztat i magazyn · Twój stały punkt powrotu', 885, 791, 17, C.muted);
        const pilot = c.pilots.find((pilot) => pilot.id === c.selectedPilot);
        if (c.ship && pilot) {
            const chances = recoveryChances(c.ship, pilot);
            label(
                ui,
                `Szanse po stracie: kapsuła ${Math.round(chances.pilot * 100)}% · wrak ${Math.round(chances.ship * 100)}%`,
                885,
                818,
                15,
                C.gold,
            );
        }
        label(
            ui,
            `Wyprawy: ${c.sorties}    Powroty: ${c.recovered}    Utraceni piloci: ${c.lostPilots}`,
            60,
            850,
            15,
            C.muted,
        );
        label(ui, 'PROTOTYP 0.7 / PATROLE AI', 1090, 850, 13, C.muted);
        if (this.scrapCandidate !== null) this.scrapConfirmation(ui);
    }
    private overview(ui: Container) {
        const c = this.campaign,
            pilot = selectedPilot(c);
        label(
            ui,
            this.recoveryId === null
                ? 'NASTĘPNA WYPRAWA'
                : `AKCJA RATUNKOWA / SYGNAŁ #${this.recoveryId}`,
            90,
            320,
            14,
            C.muted,
        );
        label(
            ui,
            pilot ? `${pilot.name} · P${pilot.level}  /  ${pilot.trait}` : 'Brak aktywnego pilota',
            90,
            351,
            21,
            pilot ? C.text : C.red,
        );
        label(
            ui,
            c.ship
                ? `${HULLS[c.ship.hull].name} · ładownia ${capacity(c)} · kadłub ${shipHealth(c.ship)}`
                : 'Statek został utracony. Odwiedź hangar.',
            90,
            386,
            17,
            C.muted,
        );
        label(ui, 'WYBIERZ KONTRAKT', 90, 436, 14, C.muted);
        label(
            ui,
            `Zestawy naprawcze: ${Math.min(c.repairKits, CREW.embarkKits)} na pokład / ${c.repairKits} w bazie`,
            90,
            410,
            15,
            C.gold,
        );
        CONTRACTS.forEach((contract, i) => {
            const lock = contractLockReason(c, i);
            button(
                ui,
                `${lock ? '🔒 ' : ''}${contract.title}`,
                90 + (i % 2) * 283,
                459 + Math.floor(i / 2) * 43,
                267,
                () => this.actions.contract(i),
                c.contract === i,
                !lock,
                36,
            );
        });
        const contract = CONTRACTS[c.contract];
        label(ui, contract.detail, 90, 550, 16, C.text, 550);
        label(
            ui,
            `Premia po powrocie: ${contract.rewardOre} rudy + ${contract.rewardParts} komponentów`,
            90,
            593,
            16,
            C.gold,
        );
        label(
            ui,
            `Wykonane: ${c.contractCompletions[c.contract]} · nagroda po bezpiecznym powrocie`,
            90,
            623,
            14,
            C.muted,
        );
        if (!c.ship || !c.pilots.length)
            button(
                ui,
                'Odbierz dostępne wyposażenie awaryjne',
                90,
                656,
                550,
                this.actions.rescue,
                false,
                true,
                28,
            );
        else {
            label(
                ui,
                !c.recovered
                    ? 'Nasłuch: pierwszy powrót · Ślad gwiazd: nasłuch + warsztat I'
                    : !c.contractCompletions[2]
                      ? 'Ślad dawnych gwiazd: wykonaj Nasłuch sektora + warsztat I'
                      : c.station.workshop < 1
                        ? 'Ślad dawnych gwiazd: rozbuduj warsztat do poziomu I'
                        : 'Skanowanie: E przez 3 s spokojnego lotu · cele 7 i 8',
                90,
                655,
                13,
                C.muted,
            );
        }
    }
    private recovery(ui: Container) {
        const c = this.campaign;
        label(ui, 'SYGNAŁY RATUNKOWE', 90, 320, 19, C.mint);
        button(
            ui,
            'Nowy sektor',
            475,
            314,
            170,
            () => {
                this.recoveryId = null;
                this.refresh();
            },
            this.recoveryId === null,
            true,
            36,
        );
        if (!c.recoverySignals.length) {
            label(ui, 'Brak kapsuł i wraków do odzyskania.', 90, 381, 22);
            label(ui, 'Po stracie sprawdzamy szansę przetrwania.', 90, 430, 17, C.muted);
            label(ui, 'Liczy się pilot, model statku i poziom pancerza.', 90, 466, 17, C.muted);
        }
        c.recoverySignals.forEach((signal, i) => {
            const y = 368 + i * 87;
            label(
                ui,
                `Sygnał #${signal.id} · ${(Math.hypot(signal.x, signal.y) / 1000).toFixed(1)} km od bazy`,
                90,
                y,
                18,
            );
            label(ui, recoveryDescription(signal), 90, y + 28, 15, C.gold);
            button(
                ui,
                'Wybierz',
                475,
                y - 6,
                170,
                () => {
                    this.recoveryId = signal.id;
                    this.refresh();
                },
                this.recoveryId === signal.id,
                true,
                32,
            );
        });
        label(ui, '6 → cel · E przez 4 s spokojnego lotu · potem dokowanie', 90, 632, 15, C.mint);
        label(
            ui,
            'Porażka akcji traci jej cel. Pamiętamy 3 ostatnie sygnały.',
            90,
            660,
            14,
            C.muted,
        );
        label(ui, 'Hangar pełny? Odzyskany wrak daje materiały.', 90, 601, 15, C.muted);
    }
    private crew(ui: Container) {
        const c = this.campaign;
        label(ui, 'Mechanik stacji · Ada Vale', 90, 320, 21, c.crew.mechanic ? C.mint : C.text);
        label(
            ui,
            c.crew.mechanic
                ? 'Praca podczas lotu · pauza zatrzymuje postęp'
                : 'Zatrudnij mechanika, aby uruchomić warsztat.',
            90,
            352,
            15,
            C.muted,
        );
        if (!c.crew.mechanic)
            button(
                ui,
                'Zatrudnij · 12 R',
                475,
                316,
                170,
                this.actions.hireMechanic,
                false,
                c.bank.ore >= CREW.hireOre,
                40,
            );
        const kinds: JobKind[] = ['refine', 'kit'];
        kinds.forEach((kind, i) => {
            const job = JOBS[kind];
            const enabled =
                c.crew.mechanic &&
                c.crew.jobs.length < CREW.queueLimit &&
                c.bank.ore >= job.ore &&
                c.bank.parts >= job.parts &&
                (kind !== 'kit' ||
                    c.repairKits + c.crew.jobs.filter((j) => j.kind === 'kit').length <
                        CREW.kitLimit);
            button(
                ui,
                kind === 'refine' ? 'Rafinuj rudę · 8 R' : 'Zestaw · 6 R + 1 K',
                90 + i * 283,
                393,
                267,
                () => this.actions.queueJob(kind),
                false,
                enabled,
                42,
            );
            label(
                ui,
                kind === 'refine' ? '45 s → 1 komponent' : '30 s → 1 zestaw naprawczy',
                90 + i * 283,
                445,
                15,
                C.muted,
            );
        });
        label(
            ui,
            `KOLEJKA ${c.crew.jobs.length}/${CREW.queueLimit}   ·   ZESTAWY ${c.repairKits}/${CREW.kitLimit}`,
            90,
            482,
            14,
            C.gold,
        );
        if (!c.crew.jobs.length) {
            label(ui, 'Dodaj zadania przed rozpoczęciem wyprawy.', 90, 526, 19);
            label(
                ui,
                'Surowce są rezerwowane. Anulowanie zwraca cały koszt.',
                90,
                569,
                15,
                C.muted,
            );
            label(ui, 'Mechanik pozostaje w bazie także po utracie statku.', 90, 602, 15, C.muted);
            label(ui, `Zakończone zadania: ${c.crew.completed}`, 90, 644, 16, C.mint);
        }
        c.crew.jobs.forEach((job, i) => {
            const y = 512 + i * 54;
            label(ui, `${i + 1}. ${JOBS[job.kind].title}`, 90, y, 18);
            label(
                ui,
                `${Math.ceil(job.remaining)} s pracy · ${i === 0 ? 'następne do wykonania' : 'oczekuje w kolejce'}`,
                90,
                y + 26,
                14,
                C.muted,
            );
            button(ui, 'Anuluj', 553, y, 92, () => this.actions.cancelJob(job.id), false, true, 32);
        });
    }
    private hangar(ui: Container) {
        const c = this.campaign;
        if (this.hangarMode === 'fleet' || !c.ship) {
            this.fleet(ui);
            return;
        }
        label(ui, `${HULLS[c.ship.hull].name} #${c.ship.id}`, 90, 318, 22, C.mint);
        button(
            ui,
            'Flota / zakup',
            475,
            314,
            170,
            () => {
                this.hangarMode = 'fleet';
                this.refresh();
            },
            false,
            true,
            36,
        );
        label(
            ui,
            `Kadłub ${shipHealth(c.ship)} · ładownia ${capacity(c)} · prędkość ${HULLS[c.ship.hull].maxSpeed}`,
            90,
            358,
            15,
            C.muted,
        );
        this.upgrades(ui, ['engine', 'cargo', 'drill', 'armor'], 396, 65);
    }
    private fleet(ui: Container) {
        const c = this.campaign,
            ships = ownedShips(c);
        label(ui, `FLOTA ${ships.length}/${FLEET_LIMIT}`, 90, 320, 20, C.mint);
        button(
            ui,
            'Moduły',
            475,
            314,
            170,
            () => {
                this.hangarMode = 'modules';
                this.refresh();
            },
            false,
            !!c.ship,
            36,
        );
        if (!ships.length) {
            label(ui, 'Brak kadłuba w hangarze.', 90, 371, 20, C.red);
            label(ui, 'Zestaw awaryjny odbierzesz w zakładce Wyprawa.', 90, 407, 16, C.muted);
        }
        ships.forEach((ship, i) => {
            const y = 359 + i * 50,
                active = c.ship?.id === ship.id;
            label(ui, `${HULLS[ship.hull].name} #${ship.id}`, 90, y, 19);
            label(
                ui,
                `${HULLS[ship.hull].role} · kadłub ${shipHealth(ship)} · ładownia ${HULLS[ship.hull].cargo + ship.cargo * 15}`,
                90,
                y + 26,
                14,
                C.muted,
            );
            if (active) {
                const activeButton = button(ui, 'Aktywny', 475, y, 170, () => {}, true, false, 32);
                activeButton.alpha = 1;
            } else {
                button(
                    ui,
                    'Wybierz',
                    475,
                    y,
                    80,
                    () => this.actions.selectShip(ship.id),
                    false,
                    true,
                    32,
                );
                button(
                    ui,
                    'Złomuj',
                    563,
                    y,
                    82,
                    () => {
                        this.scrapCandidate = ship.id;
                        this.refresh();
                    },
                    false,
                    true,
                    32,
                );
            }
        });
        label(ui, 'STOCZNIA / NOWE KADŁUBY', 90, 520, 14, C.gold);
        (Object.keys(HULLS) as HullId[]).forEach((hull, i) => {
            const config = HULLS[hull],
                y = 550 + i * 40;
            const locked = c.station.workshop < config.workshop;
            label(ui, `${config.name} · ${config.role}`, 90, y, 17);
            label(
                ui,
                `Kadłub ${config.health} / ładownia ${config.cargo} / lot ${config.maxSpeed}${config.miningPower > 1 ? ' / działko +30%' : ''}`,
                90,
                y + 22,
                13,
                C.muted,
            );
            button(
                ui,
                locked
                    ? 'Warsztat I'
                    : ships.length >= FLEET_LIMIT
                      ? 'Hangar pełny'
                      : `${config.ore} R + ${config.parts} K`,
                475,
                y,
                170,
                () => this.actions.buyShip(hull),
                false,
                !locked &&
                    ships.length < FLEET_LIMIT &&
                    c.bank.ore >= config.ore &&
                    c.bank.parts >= config.parts,
                32,
            );
        });
        label(
            ui,
            'Zakup zachowuje poprzedni statek i jego moduły w rezerwie.',
            90,
            674,
            13,
            C.muted,
        );
    }
    private scrapConfirmation(ui: Container) {
        const ship = this.campaign.reserveShips.find((ship) => ship.id === this.scrapCandidate);
        if (!ship) {
            this.scrapCandidate = null;
            return;
        }
        const refund = scrapRefund(ship);
        const enoughRoom =
            storageUsed(this.campaign) + refund.ore + refund.parts <=
            storageCapacity(this.campaign);
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.8 });
        shade.eventMode = 'static';
        ui.addChild(shade);
        panel(ui, 425, 260, 750, 370);
        label(ui, `Zezłomować ${HULLS[ship.hull].name} #${ship.id}?`, 470, 306, 29);
        label(ui, 'Kadłub i zainstalowane moduły zostaną usunięte.', 470, 368, 19, C.red);
        label(
            ui,
            `Odzyskasz ${refund.ore} rudy i ${refund.parts} komponentów.`,
            470,
            415,
            22,
            C.gold,
        );
        label(
            ui,
            enoughRoom
                ? 'Możesz anulować i zachować statek w rezerwie.'
                : 'Brak miejsca w magazynie na odzyskane materiały.',
            470,
            466,
            17,
            C.muted,
        );
        button(ui, 'Anuluj', 470, 538, 300, () => {
            this.scrapCandidate = null;
            this.refresh();
        });
        button(
            ui,
            'Zezłomuj',
            810,
            538,
            320,
            () => {
                const id = this.scrapCandidate!;
                this.scrapCandidate = null;
                this.actions.scrapShip(id);
            },
            false,
            enoughRoom,
        );
    }
    private upgrades(ui: Container, upgrades: Upgrade[], top = 326, spacing = 84) {
        const c = this.campaign;
        upgrades.forEach((upgrade, i) => {
            const config = UPGRADES[upgrade],
                price = upgradePrice(c, upgrade);
            const station = upgrade === 'workshop' || upgrade === 'storage';
            const level = station ? c.station[upgrade] : c.ship![upgrade];
            const limit = upgrade === 'workshop' ? 2 : station ? 3 : c.station.workshop + 1;
            const y = top + i * spacing;
            label(ui, `${config.title}  /  ${level}`, 90, y, 19);
            label(ui, config.detail, 90, y + 30, 15, C.muted);
            button(
                ui,
                level >= limit ? 'Maks. poziom' : `${price.ore} R + ${price.parts} K`,
                475,
                y,
                170,
                () => this.actions.upgrade(upgrade),
                false,
                level < limit && c.bank.ore >= price.ore && c.bank.parts >= price.parts,
                48,
            );
        });
        if (upgrades.length === 2) {
            label(ui, 'Baza pozostaje z Tobą po utracie pilota i statku.', 90, 532, 19, C.mint);
            label(ui, 'Warsztat zwiększa limit poziomów części statku.', 90, 573, 17, C.muted);
            label(ui, 'Magazyn przechowuje rudę i komponenty.', 90, 606, 17, C.muted);
        } else
            label(
                ui,
                `Limit modułów: ${c.station.workshop + 1} · rozbuduj warsztat, aby go podnieść.`,
                90,
                666,
                14,
                C.muted,
            );
    }
    private pilots(ui: Container) {
        const c = this.campaign;
        const selected = c.pilots.find((pilot) => pilot.id === c.selectedPilot);
        if (this.pilotMode === 'skills' && selected) {
            this.pilotSkills(ui, selected);
            return;
        }
        label(ui, `TWOI PILOCI · MIEJSCA ${pilotSlots(c)}/8 (także kapsuły)`, 90, 318, 14, C.muted);
        button(
            ui,
            selected ? `Rozwój (+${pilotPoints(selected)})` : 'Rozwój',
            475,
            310,
            170,
            () => {
                this.pilotMode = 'skills';
                this.refresh();
            },
            false,
            !!selected,
            36,
        );
        if (!c.pilots.length) label(ui, 'Brak pilotów. Zatrudnij następcę.', 90, 350, 19, C.red);
        c.pilots.forEach((pilot, i) => {
            const p = PILOTS[pilot.archetype];
            button(
                ui,
                `${p.name} #${pilot.id} · P${pilotLevel(pilot)}`,
                90 + (i % 2) * 283,
                350 + Math.floor(i / 2) * 43,
                267,
                () => {
                    this.pilotMode = 'skills';
                    this.actions.selectPilot(pilot.id);
                },
                c.selectedPilot === pilot.id,
                true,
                35,
            );
        });
        label(ui, 'NABÓR / 12 RUDY', 90, 535, 14, C.muted);
        PILOTS.slice(0, 3).forEach((pilot, i) => {
            const y = 566 + i * 37;
            label(ui, `${pilot.name} · ${pilot.trait}`, 90, y + 5, 17);
            button(
                ui,
                'Zatrudnij',
                510,
                y,
                135,
                () => this.actions.hire(i),
                false,
                c.bank.ore >= 12 && pilotSlots(c) < 8,
                30,
            );
        });
    }
    private pilotSkills(ui: Container, pilot: Campaign['pilots'][number]) {
        const level = pilotLevel(pilot),
            points = pilotPoints(pilot);
        label(
            ui,
            `${PILOTS[pilot.archetype].name} #${pilot.id} · poziom ${level}`,
            90,
            318,
            21,
            C.mint,
        );
        button(
            ui,
            'Lista / nabór',
            475,
            310,
            170,
            () => {
                this.pilotMode = 'roster';
                this.refresh();
            },
            false,
            true,
            36,
        );
        const next = PILOT_PROGRESSION.thresholds[level];
        label(
            ui,
            `${pilot.xp}/${next ?? MAX_PILOT_XP} PD · ${next ? `następny poziom ${level + 1}` : 'maksymalny poziom'} · punkty ${points}`,
            90,
            355,
            16,
            C.gold,
        );
        const start = PILOT_PROGRESSION.thresholds[level - 1];
        const progress = next ? (pilot.xp - start) / (next - start) : 1;
        ui.addChild(
            new Graphics()
                .roundRect(90, 385, 550, 7, 3)
                .fill(C.line)
                .roundRect(90, 385, Math.max(1, progress * 550), 7, 3)
                .fill(C.mint),
        );
        (Object.keys(PILOT_SKILLS) as PilotSkillId[]).forEach((skill, i) => {
            const y = 410 + i * 73,
                definition = PILOT_SKILLS[skill];
            label(
                ui,
                `${definition.title} / ${pilot.skills[skill]}/${PILOT_PROGRESSION.skillLimit}`,
                90,
                y,
                19,
            );
            label(ui, definition.detail, 90, y + 32, 14, C.muted);
            button(
                ui,
                pilot.skills[skill] >= PILOT_PROGRESSION.skillLimit
                    ? 'Maks. poziom'
                    : 'Rozwiń · 1 pkt',
                475,
                y,
                170,
                () => this.actions.trainPilot(pilot.id, skill),
                false,
                points > 0 && pilot.skills[skill] < PILOT_PROGRESSION.skillLimit,
                48,
            );
        });
        label(
            ui,
            'Punkt za każdy awans. Przypisanie umiejętności jest trwałe.',
            90,
            645,
            14,
            C.muted,
        );
        label(ui, 'PD: ładunek, skany, kontrakty i odzysk · po dokowaniu', 90, 672, 13, C.muted);
    }
    update(deltaMS: number) {
        this.time += deltaMS / 1000;
        this.station.y = Math.sin(this.time * 0.3) * 5;
    }
}
