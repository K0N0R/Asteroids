var Player = (function () {
    function Player() {
        this.pos = { x: 600, y: 383 };
        this.rotV = { x: 0, y: 0 };
        this.movV = { x: 0, y: 0 };
        this.MousePos = { x: 0, y: 0 };
        this.Bullets = new Array();
    }
    Player.prototype.StartCheckingMousePosition = function () {
        var _this = this;
        canvas.onmousemove = function (evt) {
            _this.MousePos.x = evt.offsetX;
            _this.MousePos.y = evt.offsetY;
        };
        canvas.onmousedown = function (evt) {
            _this.Bullets.push(new Bullet(_this.pos, _this.rotV));
        };
    };
    Player.prototype.Render = function () {
        this.pos.x += this.movV.x;
        this.pos.y += this.movV.y;
        this.rotV = NormalizeVectorFromPoints({ x: this.MousePos.x + 10, y: this.MousePos.y - 25 }, this.pos);
        if (Keyboard.keys[32]) {
            var dist = GetDistance(this.pos, this.MousePos);
            dist = Math.sqrt(dist);
            dist -= 7;
            this.movV.x += this.rotV.x * dist / 15;
            this.movV.y += this.rotV.y * dist / 15;
        }
        this.movV.x *= 0.93;
        this.movV.y *= 0.93;
        this.CheckCollision();
        this.Draw();
        for (var i = 0; i < this.Bullets.length; i++) {
            this.Bullets[i].Draw();
        }
    };
    Player.prototype.CheckCollision = function () {
        if (this.pos.y > canvas.height - 50) {
            this.pos.y = canvas.height - 50;
            this.movV.y = -this.movV.y * 0.6;
        }
        if (this.pos.y < 50) {
            this.pos.y = 50;
            this.movV.y = -this.movV.y * 0.6;
        }
        if (this.pos.x > canvas.width - 45) {
            this.pos.x = canvas.width - 45;
            this.movV.x = -this.movV.x * 1.2;
        }
        if (this.pos.x < 45) {
            this.pos.x = 45;
            this.movV.x = -this.movV.x * 1.2;
        }
    };
    Player.prototype.Draw = function () {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(GetAngleFromVector(this.rotV));
        ctx.drawImage(image_player, -45, -50);
        ctx.restore();
    };
    return Player;
})();
//# sourceMappingURL=Player.js.map