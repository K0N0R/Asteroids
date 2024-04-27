import { getRandomValueFromRange } from "../utils/utils";

export class Health {
    pos = { x: 0, y: 0 }
    angle = 0;
    available = false;
    private TimeoutHandler: NodeJS.Timeout;
    isShowing = false;

    constructor(private asset: HTMLImageElement, private canvas: HTMLCanvasElement ) {
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.available) {
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(this.angle);
            ctx.drawImage(this.asset, -25.5, -25.5)
            ctx.restore();
            this.angle += 0.02;
        }
    }

    show() {
        if (this.isShowing) { return };
        this.isShowing = true;

        var callback = () => {
            this.available = !this.available;
            this.pos.x = getRandomValueFromRange(this.canvas.width*0.1, this.canvas.width*0.9);
            this.pos.y = getRandomValueFromRange(this.canvas.height*0.1, this.canvas.height*0.9);
            this.TimeoutHandler = setTimeout(callback, Math.random() * 10000 + 10000);
        }
        this.TimeoutHandler = setTimeout(callback, Math.random() * 10000 + 10000);
    }

    hide() {
        if (!this.isShowing) { return };
        this.isShowing = false;
        clearTimeout(this.TimeoutHandler);
    }
 
}