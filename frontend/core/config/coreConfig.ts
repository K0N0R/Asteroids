import { C } from '../../game/graphics/theme';
export class CoreConfigBase {
    ratio = {
        x: 16,
        y: 9,
    };
    width = this.ratio.x * 100;
    height = this.ratio.y * 100;
    centerX = this.width / 2;
    centerY = this.height / 2;

    primaryColor = C.raised;
    primaryDarkColor = C.ink;
    primaryLightColor = C.line;
    primaryContrastColor = C.text;
    darkColor = C.ink;
    roundness = 18;
}

export const CoreConfig = new CoreConfigBase();
