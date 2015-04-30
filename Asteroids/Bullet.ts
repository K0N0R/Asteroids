class Bullet {
    pos = { x: 600, y: 400 };
    movV = { x: 0, y: 0 };
    angle = 0;
    constructor(pos: { x: number; y: number }, movV: { x: number; y: number }) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.movV.x = movV.x * 20;
        this.movV.y = movV.y * 20;
        this.angle = GetAngleFromVector(movV);
    }
    Draw() {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.drawImage(image_bullet, 2.5, 0);
        ctx.restore();
        this.pos.x += this.movV.x;
        this.pos.y += this.movV.y;
    }

} 