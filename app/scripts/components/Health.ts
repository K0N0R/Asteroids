class Health {
    pos = { x: 0, y: 0 };
    angle = 0;
    isAlive = false;
    private TimeoutHandle: number;
    isWoring = false;
    constructor(pos: { x: number; y: number }) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
    }

    Draw() {
        if (this.isAlive) {
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(this.angle);
            ctx.drawImage(image_health, -25.5, -25.5)
            ctx.restore();
            this.angle += 0.02;
        }
    }

    StartApprinng() {
        if (this.isWoring) { return };
        this.isWoring = true;

        var callback = () => {
            this.isAlive = !this.isAlive;
            this.pos.x = 1000 * Math.random() + 100;
            this.pos.y = 600 * Math.random() + 100;
            this.TimeoutHandle = setTimeout(callback, Math.random() * 10000 + 10000);
        }
        this.TimeoutHandle = setTimeout(callback, Math.random() * 10000 + 10000);
    }

    StopApprinng() {
        if (!this.isWoring) { return };
        this.isWoring = false;
        clearTimeout(this.TimeoutHandle);
    }
 
}