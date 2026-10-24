import { C } from '../../../game/graphics/theme';
import * as PIXI from 'pixi.js';
import { BasePopup } from './basePopup';
import { Button } from '@components/button';
import { Typography } from '@components/typography';
import { Box } from '@components/box';
import { GameSettings } from '@systems/gameSettings';
import { SoundSliderOption } from '@components/soundSliderOption';
import { developmentControls } from '../../../game/state/development';
import { STORY_SECTORS, type StorySectorId } from '../../../game/state/story';
import { button, clear, label, panel } from '../../../game/ui/primitives';

export class ConfigurationPopup extends BasePopup<undefined> {
    private soundSlider: SoundSliderOption;
    private musicSlider: SoundSliderOption;
    private developmentPanel = new PIXI.Container();
    constructor() {
        super();
        const backdrop = new PIXI.Graphics()
            .rect(0, 0, 1600, 900)
            .fill({ color: C.ink, alpha: 0.82 });
        backdrop.eventMode = 'static';
        this.addChild(backdrop);
        this.addChild(
            new Box({
                x: 800,
                y: 475,
                width: 760,
                height: 690,
                tint: C.panel,
                outlineWidth: 1,
                outlineTint: C.line,
                roundness: 14,
                alpha: 1,
            }),
        );
        const text = (value: string, x: number, y: number, size = 20, color: number = C.text) => {
            const view = new Typography({
                text: value,
                size,
                color,
                horizontalAlign: 'left',
                verticalAlign: 'top',
                fontFamily: 'Trebuchet MS',
            });
            view.position.set(x, y);
            this.addChild(view);
        };
        text('ORBIT / PRZERWA W LOCIE', 470, 171, 15, C.mint);
        text('Chwila oddechu.', 470, 210, 38);
        text('Symulacja jest zatrzymana.', 470, 268, 18, C.muted);
        const controls = [
            ['W / A / D', 'Przyspieszanie / skręt w lewo / skręt w prawo'],
            ['S / SHIFT', 'Hamowanie i wsteczny / boost podczas lotu W'],
            ['MYSZ', 'Celowanie niezależnie od kadłuba'],
            ['LPM / PPM', 'Uzbrojenie / narzędzie przypisane do kadłuba'],
            ['F / H / J', 'Interakcje i śluzy / holowanie / zwolnij hol'],
            [', / .', 'Poprzedni / następny cel nawigacji'],
            ['Q / E', 'Zdolności statków II / III; R: naprawa'],
            ['TAB', 'Pokład · szczegóły statku, pilot, prototypy i załoga'],
        ];
        controls.forEach(([key, detail], i) => {
            text(key, 470, 323 + i * 33, 17, C.mint);
            text(detail, 590, 323 + i * 33, 17);
        });
        text('Zamknięcie lub odświeżenie gry oznacza utratę wyprawy.', 470, 584, 17, C.gold);
        this.soundSlider = new SoundSliderOption(
            'Efekty',
            () => {
                GameSettings.effectsEnabled = !GameSettings.effectsEnabled;
            },
            (value) => {
                GameSettings.effectsVolume = value;
            },
            () => GameSettings.effectsEnabled,
            () => (GameSettings.effectsEnabled ? GameSettings.effectsVolume : 0),
        );
        this.soundSlider.position.set(470, 635);
        this.addChild(this.soundSlider);
        this.musicSlider = new SoundSliderOption(
            'Muzyka',
            () => {
                if (!GameSettings.musicEnabled && GameSettings.musicVolume <= 0)
                    GameSettings.musicVolume = 0.25;
                else GameSettings.musicEnabled = !GameSettings.musicEnabled;
            },
            (value) => {
                GameSettings.musicVolume = value;
            },
            () => GameSettings.musicEnabled,
            () => (GameSettings.musicEnabled ? GameSettings.musicVolume : 0),
        );
        this.musicSlider.position.set(470, 695);
        this.addChild(this.musicSlider);
        this.addChild(
            new Button({
                x: 800,
                y: 760,
                width: 660,
                height: 52,
                tint: C.mint,
                roundness: 14,
                children: [
                    new Typography({
                        text: 'WRÓĆ DO GRY  /  ESC',
                        size: 18,
                        color: C.ink,
                        fontFamily: 'Trebuchet MS',
                    }),
                ],
                onClick: () => this.promise.resolve(),
            }),
        );
        this.addChild(this.developmentPanel);
    }
    override show() {
        clear(this.developmentPanel);
        const actions = developmentControls.actions;
        if (!actions) return;
        const host = this.developmentPanel;
        panel(host, 1200, 130, 360, 690);
        label(host, 'NARZĘDZIA TESTOWE', 1222, 157, 16, C.gold);
        label(
            host,
            actions.active()
                ? 'Osobny zapis testowy jest aktywny.'
                : 'Wybór sektora tworzy osobny zapis testowy.',
            1222,
            190,
            16,
            C.muted,
            310,
        );
        const run = (action: () => void) => {
            this.promise.resolve();
            action();
        };
        button(
            host,
            'Powrót do bazy',
            1222,
            247,
            316,
            () => run(actions.returnToBase),
            false,
            actions.canReturn(),
            42,
        );
        label(host, 'PRZEJDŹ DO SEKTORA · BEZ BLOKAD', 1222, 314, 13, C.mint);
        (Object.keys(STORY_SECTORS) as StorySectorId[]).forEach((id, i) => {
            button(
                host,
                STORY_SECTORS[id].shortName,
                1222 + (i % 2) * 162,
                346 + Math.floor(i / 2) * 49,
                154,
                () => run(() => actions.chooseSector(id)),
                false,
                true,
                40,
                15,
            );
        });
        button(
            host,
            'Wróć do zwykłej kampanii',
            1222,
            704,
            316,
            () => run(actions.leave),
            false,
            actions.active(),
            42,
            15,
        );
        label(
            host,
            'Powrót kończy wyprawę bez utraty statku.\nWybór sektora nie zmienia zwykłego zapisu.',
            1222,
            763,
            13,
            C.muted,
            312,
        );
    }
    override hide() {
        clear(this.developmentPanel);
    }
    update(deltaMS: number) {
        this.soundSlider.update(deltaMS);
        this.musicSlider.update(deltaMS);
    }
}
