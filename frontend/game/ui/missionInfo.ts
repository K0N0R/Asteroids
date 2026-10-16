import { AEGIS, ATLAS_WEAPONS, PHOENIX, STINGER_AMMO, WEAPONS } from '../config';
import { Container, Graphics } from 'pixi.js';
import { BasePopup } from '../../core/containers/popup/basePopup';
import { Campaign } from '../state/campaign';
import { MissionSimulation } from '../systems/mission';
import { CONTRACTS, GAME, JOBS } from '../config';
import { C, ShipView } from '../graphics/shapes';
import { PROTOTYPES } from '../systems/prototypes';
import { button, clear, label, panel } from './primitives';
import { workerJobs } from '../state/crew';
import { missionObjectives } from './missionReadout';
import { objectiveMark } from './hudIcons';

export interface MissionInfoData {
    simulation: MissionSimulation;
    campaign: Campaign;
    contract: number;
    objectives?: ReturnType<typeof missionObjectives>;
    objectivesTitle?: string;
    abortMission?: () => void;
}

export class MissionInfoPopup extends BasePopup<MissionInfoData> {
    private content = new Container();
    constructor() {
        super();
        this.addChild(this.content);
    }
    show({
        simulation: s,
        campaign: c,
        contract: contractId,
        objectives,
        objectivesTitle,
        abortMission,
    }: MissionInfoData) {
        clear(this.content);
        const root = this.content;
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.82 });
        shade.eventMode = 'static';
        root.addChild(shade);
        panel(root, 240, 104, 1120, 720);
        label(root, 'POKŁAD / INFORMACJE O WYPRAWIE', 280, 141, 14, C.mint);
        label(root, s.hullConfig.name, 280, 176, 36);
        label(root, 'PAUZA · TAB / ESC', 1125, 143, 14, C.muted);
        const minutes = Math.floor(s.elapsed / 60),
            seconds = Math.floor(s.elapsed % 60)
                .toString()
                .padStart(2, '0');
        label(
            root,
            `${minutes}:${seconds} lotu · zniszczone drony ${s.enemyKills}`,
            975,
            188,
            16,
            C.muted,
        );
        root.addChild(
            new Graphics()
                .moveTo(280, 229)
                .lineTo(1320, 229)
                .moveTo(820, 251)
                .lineTo(820, 714)
                .moveTo(280, 737)
                .lineTo(1320, 737)
                .stroke({ color: C.line, width: 1 }),
        );
        label(root, 'STATEK / SYSTEMY', 280, 251, 13, C.muted);
        label(
            root,
            [
                `Kadłub ${Math.ceil(s.hull)}/${s.maxHull} · ładunek ${s.cargoUsed}/${s.cargoCapacity}`,
                `Tarcza ${Math.ceil(s.kineticShield.charge)}/${s.kineticShield.profile.capacity} · ${s.kineticShield.profile.regen.toFixed(1)}/s · przerwa ${Math.ceil(s.kineticShield.cooldown)} s`,
                `Ruda ${s.cargo.ore} · komponenty ${s.cargo.parts} · kryształy ${s.cargo.crystals ?? 0}${s.stolenEquipment ? ` · sprzęt ${WEAPONS[s.stolenEquipment].name}` : ''}`,
                `Prędkość ${Math.round(s.speed)} / ${Math.round(s.hullConfig.maxSpeed * s.driveMultiplier * (s.engineFault ? GAME.damagedThrust : 1))} m/s`,
                `Skręt ${s.turnSpeed.toFixed(2)} rad/s · ${s.harpoonArms ? `ramiona ${Math.round(s.harpoonArms.reach * s.hullConfig.size)} m` : s.isAtlas ? `rakieta ${ATLAS_WEAPONS.rocket.speed * ATLAS_WEAPONS.rocket.life} m` : s.aegis ? `energia ${AEGIS.speed * AEGIS.life} m` : s.hullId === 'stinger' ? `LPM ${STINGER_AMMO.light.speed * STINGER_AMMO.light.life} / PPM ${STINGER_AMMO.armor.speed * STINGER_AMMO.armor.life} m` : s.hullConfig.lasers.length ? `laser ${Math.round(s.laserRange)} m` : `broń ${Math.round(s.weaponConfig.speed * s.weaponConfig.life)} m`}`,
                s.harpoonArms
                    ? `Szczęki · mnożnik siły ${s.harpoonArms.damageMultiplier.toFixed(2)} · zestawy ${s.repairKits}`
                    : s.isAtlas
                      ? `Rakieta ${s.rocketDamage} · granaty ${s.grenadeCount} × ${ATLAS_WEAPONS.grenade.damage} · zestawy ${s.repairKits}`
                      : s.aegis
                        ? `Energia ${s.energyDamage} · dron ${s.aegis.drone ? Math.ceil(s.aegis.drone.hull) : 0} HP · impuls ${Math.ceil(s.aegis.cooldown)} s`
                        : s.hullId === 'mule'
                          ? `Lasery ×2 · zestawy ${s.repairKits} · produkcja ${s.repairKitCost.ore}/${s.repairKitCost.parts}`
                          : s.hullId === 'stinger'
                            ? `4 działa · LPM ${(STINGER_AMMO.light.damage * s.stingerDamageMultiplier).toFixed(1)} / PPM ${(STINGER_AMMO.armor.damage * s.stingerDamageMultiplier).toFixed(1)} · zestawy ${s.repairKits}`
                            : s.hullId === 'phoenix'
                              ? `Laser ${(PHOENIX.laserDamage * s.phoenixLaserMultiplier).toFixed(0)}/s · ogień ${(PHOENIX.burnDamage * s.phoenixLaserMultiplier).toFixed(0)}/s · rakieta ${s.rocketDamage}`
                              : s.hullId === 'widmo'
                                ? `Dash ${s.dashDamage.toFixed(0)} obrażeń · odnowienie ${Math.ceil(s.dashCooldown)} s`
                                : `${s.weaponConfig.name} · ${s.gunDamage.toFixed(1)} obrażeń${s.hullId === 'fighter' ? ` · granaty ×${s.grenadeCount}` : ''} · zestawy ${s.repairKits}`,
                `Zakłócanie radarów: ${Math.round(s.hullConfig.radarJamming * 100)}%${s.hullId === 'widmo' ? ` · kamuflaż ${s.opticalCloak ? 'aktywny' : `${Math.ceil(s.opticalCloakCooldown)} s`} · dash ${Math.ceil(s.dashCooldown)} s` : ''}`,
            ].join('\n'),
            280,
            282,
            17,
            C.text,
            390,
        );
        label(
            root,
            s.engineFault ? 'AWARIA NAPĘDU · ciąg 45%' : 'Napęd sprawny',
            280,
            406,
            15,
            s.engineFault ? C.red : C.mint,
        );
        if (c.ship) {
            const view = new ShipView(c.ship);
            view.scale.set(s.hullConfig.size * 1.7);
            view.rotation = -Math.PI / 2;
            view.position.set(729, 348);
            root.addChild(view);
        }
        label(root, 'PILOT', 280, 450, 13, C.muted);
        const pilot = c.pilots.find((p) => p.id === c.activeRun?.pilotId);
        label(
            root,
            `${s.pilot.name} · ${s.pilot.role} · P${s.pilot.level}${pilot ? ` · ${pilot.xp} PD` : ''}`,
            280,
            476,
            17,
            C.text,
            500,
        );
        if (pilot)
            label(
                root,
                `Manewrowanie ${pilot.skills.handling} · wydobycie ${pilot.skills.mining} · ewakuacja ${pilot.skills.survival}`,
                280,
                502,
                15,
                C.muted,
                500,
            );
        label(root, 'PROTOTYPY / DO KOŃCA WYPRAWY', 280, 553, 13, C.muted);
        if (!s.prototypes.length)
            label(
                root,
                `Brak modułów · pozostałe skrytki: ${s.sector.caches.length - s.openedCaches.size}`,
                280,
                585,
                17,
                C.muted,
            );
        s.prototypes.forEach((id, i) => {
            label(root, PROTOTYPES[id].name, 280, 582 + i * 66, 17, C.mint);
            label(root, PROTOTYPES[id].detail, 280, 606 + i * 66, 14, C.muted, 500);
        });
        const contract = CONTRACTS[contractId];
        label(
            root,
            objectivesTitle
                ? 'KAMPANIA / CELE SEKTORA'
                : objectives
                  ? 'SANDBOX / CELE'
                  : 'KONTRAKT / CELE',
            860,
            251,
            13,
            C.muted,
        );
        label(
            root,
            objectivesTitle ?? (objectives ? 'Próba mechanik' : contract.title),
            860,
            277,
            22,
            C.text,
            460,
        );
        const checks = new Graphics();
        root.addChild(checks);
        const goalRows =
            objectives ??
            missionObjectives(
                contractId,
                s.cargo,
                [...s.surveyData],
                !!s.recoverySignal,
                s.recoverySecured,
                false,
                s.enemyKills,
            );
        const goalSpacing = goalRows.length > 6 ? 20 : goalRows.length > 5 ? 24 : 30;
        goalRows.forEach((goal, i) => {
            objectiveMark(checks, 867, 322 + i * goalSpacing, goal.complete);
            label(
                root,
                goal.id === 'escort' && s.escort?.state === 'destroyed'
                    ? 'Kepler utracony'
                    : goal.id === 'rescue' && s.recoveryDestroyed
                      ? 'Cel ratunkowy utracony'
                      : `${goal.title}${goal.progress ? `  ${goal.progress}` : ''}`,
                888,
                313 + i * goalSpacing,
                17,
                goal.id === 'rescue' && s.recoveryDestroyed
                    ? C.red
                    : goal.complete
                      ? C.mint
                      : C.muted,
                430,
            );
        });
        label(
            root,
            s.missionStatus
                ? s.missionStatus
                : s.outerSector
                  ? s.outerStatus
                  : s.saturnSector
                    ? s.saturnStatus
                    : s.jupiterSector
                      ? s.jupiterStatus
                      : s.beltSector
                        ? s.beltStatus
                        : s.mercurySector
                          ? s.solar.summary
                          : (s.area === 'surface' || s.orbitalBaseSector) && s.defenseSummary
                            ? s.defenseSummary
                            : objectivesTitle
                              ? c.story?.sector === 'venus'
                                  ? '8 placówka · E budowa · G obrona. Osłonę przygotujesz w stacji.'
                                  : c.story?.sector === 'mars'
                                    ? 'Raporty walk i odczyty zabezpieczysz po powrocie. Pas wymaga nowej technologii.'
                                    : c.story?.sector === 'lunar'
                                      ? 'Dostawy zostają na budowie. Raport odbioru dowieź do Satuk 15.'
                                      : 'Dane zabezpieczysz po powrocie. Rudę przekażesz w stacji.'
                              : objectives
                                ? 'Próba lokalna · bez nagród i strat w kampanii'
                                : `Premia po powrocie: ${contract.rewardOre} rudy · ${contract.rewardParts} komponentów`,
            860,
            456,
            15,
            C.gold,
            460,
        );
        label(root, 'ZAŁOGA STACJI', 860, 503, 13, C.muted);
        (['mechanic', 'quartermaster'] as const).forEach((role, i) => {
            const jobs = workerJobs(c, role),
                head = jobs[0];
            const title = role === 'mechanic' ? 'Mechanik' : 'Intendent';
            const state = !c.crew[role]
                ? 'niezatrudniony'
                : !head
                  ? 'brak zadań'
                  : `${JOBS[head.kind].title} · ${Math.ceil(head.remaining)} s${jobs.length > 1 ? ` · +${jobs.length - 1} w kolejce` : ''}`;
            label(root, `${title}: ${state}`, 860, 532 + i * 36, 15, head ? C.mint : C.muted, 460);
        });
        label(root, 'ODZYSK', 860, 635, 13, C.muted);
        label(
            root,
            !s.recoverySignal
                ? s.salvage.towed
                    ? `Hol ${s.salvage.towing.size}/${s.salvage.capacity} · ${[...s.salvage.towing.values()].map((item) => `${Math.ceil(item.health)}/${item.maxHealth} HP`).join(' · ')}`
                    : 'Brak akcji ratunkowej'
                : s.recoveryDelivered
                  ? `Cel ratunkowy przekazany ${s.stationRecipient}`
                  : s.recoveryDestroyed
                    ? 'Cel ratunkowy zniszczony'
                    : s.recoverySecured
                      ? 'Cel na holu · zabezpieczysz go po dokowaniu'
                      : `Sygnał #${s.recoverySignal.id} · ${s.recoverySignal.pilot ? 'kapsuła pilota' : 'bez kapsuły'} · ${s.recoverySignal.ship ? 'wrak statku' : 'bez wraku'}`,
            860,
            660,
            16,
            C.text,
            460,
        );
        label(
            root,
            c.story
                ? 'Wykonuj dostępne cele. Postęp zadań pozostaje między wyprawami.'
                : s.outpost.disabledTime > 0
                  ? `Cerber: skaner wyłączony · ${Math.ceil(s.outpost.disabledTime)} s`
                  : s.outpost.secured
                    ? s.stolenEquipment
                        ? 'Cerber: sprzęt i dane na pokładzie'
                        : `Cerber: E magazyn · ${WEAPONS[s.outpostEquipment].name} / 3 miejsca`
                    : s.outpost.alarm > 0
                      ? `Cerber: alarm · ${Math.ceil(s.outpost.alarm)} s`
                      : 'Cerber: E dane · G sabotaż: 3 s / 1 komponent',
            860,
            697,
            13,
            s.outpost.alarm > 0 ? C.red : C.muted,
            460,
        );
        label(
            root,
            c.story
                ? s.area === 'surface'
                    ? 'KSIĘŻYC · 1 Orbita · 2 Złoże · 6 Ratunek · 7 Budowa · G Obrona przy budowie: 2 s'
                    : c.story.sector === 'pluto'
                      ? 'PLUTON · 7 Zwiad · 0 Baza / F Osłona · 3 Finał po obu raportach: G 2 s · 8 Dodatkowe odczyty · 1 Powrót'
                      : s.outerSector
                        ? 'URAN / NEPTUN · 7 Zwiad · 0 Baza po zwiadzie · E Dane / G Skaner · F Kontakty · 8 Trasa · Neptun: 3 Starcie / G 2 s'
                        : s.saturnSector
                          ? 'SATURN · 1 Satuk 15 · 2 Złoże · 5 Kryształy po zwiadzie · 7 Pomiary · F Patrol · 8 Dalsza trasa po raportach'
                          : s.jupiterSector
                            ? 'JOWISZ · 1 Satuk 15 · 2 Złoże · 7 Zwiad · 0 Terminal po zwiadzie · F Patrole · 8 Pakiet po raportach'
                            : s.beltSector
                              ? 'PAS · 1 Satuk 15 · 3 / 4 / 5 Przeszkody po zwiadzie · 7 Wejście · 8 Granica po oczyszczeniu · F Opcjonalne patrole'
                              : c.story.sector === 'mercury'
                                ? 'MERKURY · 1 Satuk 15 · 3 / 4 / 5 Schronienia · 7 Pomiary · 8 Technologia po zwiadzie i walce · F Przeciwnik'
                                : c.story.sector === 'venus'
                                  ? 'WENUS · 1 Satuk 15 · 2 Złoże · 4 Pozostałości · 6 Ratunek · 7 Przekaźnik · 8 Placówka po zwiadzie'
                                  : s.marsBaseSector
                                    ? 'MARS · 1 Satuk 15 · 2 Złoże · 6 Ratunek · 7 Baza · 8 Pomiary po montażu · G Obrona przy bazie · F Patrole'
                                    : c.story.sector === 'mars'
                                      ? 'MARS · 1 Satuk 15 · 2 Złoże · 4 Pozostałości · 6 Ratunek · 7 Ślad · 8 Pas po rozpoznaniu · F Przeciwnik'
                                      : '1 Satuk 15 · 2 Złoże · 3 Księżyc po zwiadzie · 4 Pozostałości · 6 Ratunek · 7 Przekaźnik · 8 Dalsza orbita'
                : '1 Baza · 2 Ruda · 3 Pas · 4 Wrak · 5 Żyła · 6 Ratunek · 7 Lumen · 8 Mnemos · 9 Skrytki · 0 Cerber',
            280,
            753,
            13,
            C.muted,
        );
        label(
            root,
            c.story
                ? 'W / S Lot i hamowanie · A / D Skręt · PPM Wydobycie · E Skan / dokowanie · TAB Pokład'
                : 'F Dron · T Gniazdo / Prąd · H Aegis · Z Wrak · J Zwolnij hol · N Kepler',
            280,
            772,
            13,
            C.muted,
        );
        label(root, 'Lot i praca załogi są zatrzymane.', 280, 792, 14, C.muted);
        if (abortMission && s.canAbortMission)
            button(root, 'PRZERWIJ MISJĘ…', 825, 773, 270, abortMission, false, true, 36, 14);
        button(root, 'WRÓĆ DO LOTU', 1120, 773, 200, () => this.promise.resolve(), true, true, 36);
    }
}
