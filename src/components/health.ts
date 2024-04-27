export class Health {
    angle = 0;
    isAlive = false;
    private TimeoutHandler: NodeJS.Timeout;
    isWoring = false;

    life1: HTMLElement;
    life2: HTMLElement;
    life3: HTMLElement;

    lifesNumber: number = 3;
    constructor(private asset: HTMLImageElement, public pos: { x: number; y: number }) {
        this.life1 = document.getElementById('health1') as HTMLElement;
        this.life2 = document.getElementById('health2') as HTMLElement;
        this.life3 = document.getElementById('health3') as HTMLElement;
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.isAlive) {
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(this.angle);
            ctx.drawImage(this.asset, -25.5, -25.5)
            ctx.restore();
            this.angle += 0.02;
        }
    }

    show() {
        if (this.isWoring) { return };
        this.isWoring = true;

        var callback = () => {
            this.isAlive = !this.isAlive;
            this.pos.x = 1000 * Math.random() + 100;
            this.pos.y = 600 * Math.random() + 100;
            this.TimeoutHandler = setTimeout(callback, Math.random() * 10000 + 10000);
        }
        this.TimeoutHandler = setTimeout(callback, Math.random() * 10000 + 10000);
    }

    hide() {
        if (!this.isWoring) { return };
        this.isWoring = false;
        clearTimeout(this.TimeoutHandler);
    }
 
}