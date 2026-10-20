import * as PIXI from 'pixi.js';

type TTypographyHorizontalAlign = 'left' | 'center' | 'right';
type TTypographyVerticalAlign = 'top' | 'center' | 'bottom';
type TTypographyFontWeight = 'bold' | 'normal';

export interface ITypographyParams {
    text: string | number;
    size: number;
    fontFamily: string;
    horizontalAlign: TTypographyHorizontalAlign;
    verticalAlign: TTypographyVerticalAlign;
    color: number;
    weight: TTypographyFontWeight;
    styleProps?: Partial<PIXI.TextStyle> | PIXI.TextStyle;
}

export class Typography extends PIXI.Container {
    private text: PIXI.Text;

    private scaleRatio = 2;

    config: ITypographyParams;

    constructor(config: Partial<ITypographyParams>) {
        super();

        this.config = {
            text: '',
            fontFamily: 'Trebuchet MS',
            size: 26,
            horizontalAlign: 'center',
            verticalAlign: 'center',
            weight: 'normal',
            color: 0xffffff,
            ...config,
        };

        this.text = new PIXI.Text({
            // Font size is already doubled below; do not multiply texture memory by DPR again.
            resolution: 1,
            text: config.text,
            style: {
                fontFamily: this.config.fontFamily,
                fontSize: this.getFontSize(this.config.size),
                lineHeight: this.getFontSize(this.config.size),
                align: this.config.horizontalAlign,
                fontWeight: this.config.weight,
                fill: this.config.color,
                ...config.styleProps,
            },
        });
        this.text.scale.set(1 / this.scaleRatio);

        this.text.anchor.set(
            this.getHorizontalAnchor(config.horizontalAlign),
            this.getVerticalAnchor(config.verticalAlign),
        );

        this.addChild(this.text);
    }

    setText(text: string | number) {
        this.text.text = text;
    }
    setHorizontalAlign(align: TTypographyHorizontalAlign) {
        this.text.anchor.x = this.getHorizontalAnchor(align);
        this.text.style.align = align;
    }

    setColor(color: number) {
        this.text.style.fill = color;
    }

    private getFontSize(size: number) {
        return size * this.scaleRatio;
    }

    private getHorizontalAnchor = (horizontalAlign?: TTypographyHorizontalAlign) => {
        switch (horizontalAlign) {
            case 'left':
                return 0;
            case 'center':
                return 0.5;
            case 'right':
                return 1;
            default:
                return 0.5;
        }
    };

    private getVerticalAnchor = (verticalAlign?: TTypographyVerticalAlign) => {
        switch (verticalAlign) {
            case 'top':
                return 0;
            case 'center':
                return 0.5;
            case 'bottom':
                return 1;
            default:
                return 0.5;
        }
    };
}
