var Bullet = (function () {
    function Bullet(pos, movV) {
        this.pos = { x: 600, y: 383 };
        this.movV = { x: 0, y: 0 };
        this.angle = 0;
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.movV.x = movV.x;
        this.movV.y = movV.y;
    }
    Bullet.prototype.Draw = function () {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.drawImage(image_bullet, -45, -50);
        ctx.restore();
    };
    return Bullet;
})();
//# sourceMappingURL=Bullet.js.map