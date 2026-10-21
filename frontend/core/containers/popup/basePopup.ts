import * as PIXI from 'pixi.js';
import { IPromise } from '@common';

export class BasePopup<TData> extends PIXI.Container {
    promise!: IPromise;

    show(data: TData) {}

    /** Release per-opening content and callbacks when this reusable popup closes. */
    hide() {}

    createBaseComponents() {}

    update(deltaMS: number) {}
}
