import { C } from '../../../game/graphics/theme';
import * as PIXI from 'pixi.js';
import { BasePopup } from './basePopup';
import { Button } from '@components/button';
import { Typography } from '@components/typography';
import { Box } from '@components/box';
import { GameSettings } from '@systems/gameSettings';
import { SoundSliderOption } from '@components/soundSliderOption';

export class ConfigurationPopup extends BasePopup<undefined> {
    private soundSlider: SoundSliderOption;
    private musicSlider: SoundSliderOption;
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
            ['LPM / PPM', 'Broń / narzędzie; Widmo: kamuflaż 3 s; Mule: lasery / zestaw'],
            ['E / H / J', 'Interakcja / podłącz hol / zwolnij hol'],
            [', / .', 'Poprzedni / następny cel nawigacji'],
            ['R', 'Naprawa; Widmo: LPM dash / PPM kamuflaż optyczny'],
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
    }
    update(deltaMS: number) {
        this.soundSlider.update(deltaMS);
        this.musicSlider.update(deltaMS);
    }
}
