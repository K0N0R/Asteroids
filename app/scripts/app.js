var Asteroid = (function () {
    function Asteroid(pos, movV) {
        this.pos = { x: 0, y: 0 };
        this.movV = { x: 0, y: 0 };
        this.angle = 0;
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.movV.x = movV.x * 5;
        this.movV.y = movV.y * 5;
    }
    Asteroid.Render = function () {
        if (Asteroid.Asteroids.length < 5) {
            var AsteroidsSpawn = [{ x: 1200 * Math.random(), y: 0 }, { x: 1200 * Math.random(), y: 800 }, { x: 0, y: 800 * Math.random() }, { x: 1200, y: 800 * Math.random() }];
            var randomElement = (Math.random() * 4) | 0;
            Asteroid.Asteroids.push(new Asteroid({ x: AsteroidsSpawn[randomElement].x, y: AsteroidsSpawn[randomElement].y }, NormalizeVectorFromPoints(AsteroidsSpawn[randomElement], { x: (Player1.pos.x + Math.random() * 20 + 20), y: (Player1.pos.x + Math.random() * 20 + 20) })));
        }
        for (var i = 0; i < Asteroid.Asteroids.length; i++) {
            Asteroid.Asteroids[i].Draw();
        }
        Asteroid.Remove();
        Asteroid.CheckCollision();
    };
    Asteroid.Remove = function () {
        for (var i = this.Asteroids.length - 1; i >= 0; i--) {
            if (((this.Asteroids[i].pos.x > 1250) || (this.Asteroids[i].pos.x < -50)) || ((this.Asteroids[i].pos.y > 850) || (this.Asteroids[i].pos.y < -50))) {
                this.Asteroids.splice(i, 1);
                i--;
            }
        }
    };
    Asteroid.CheckCollision = function () {
        for (var i = 0; i < Asteroid.Asteroids.length; i++) {
            for (var j = 0; j < Asteroid.Asteroids.length; j++) {
                if (i === j) {
                    continue;
                }
                if (GetDistance(Asteroid.Asteroids[i].pos, Asteroid.Asteroids[j].pos) < 51) {
                    var vBetween = NormalizeVectorFromPoints(Asteroid.Asteroids[i].pos, Asteroid.Asteroids[j].pos);
                    Asteroid.Asteroids[i].pos.x += vBetween.x;
                    Asteroid.Asteroids[i].pos.y += vBetween.y;
                    Asteroid.Asteroids[j].pos.x -= vBetween.x;
                    Asteroid.Asteroids[j].pos.y -= vBetween.y;
                    var swapArray = SwapAndSlow(Asteroid.Asteroids[i].movV, Asteroid.Asteroids[j].movV);
                    Asteroid.Asteroids[i].movV = swapArray[0];
                    Asteroid.Asteroids[j].movV = swapArray[1];
                    continue;
                }
            }
        }
    };
    Asteroid.prototype.Draw = function () {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.drawImage(image_asteroid, -25.5, -25.5);
        ctx.restore();
        this.angle += 0.02;
        this.pos.x -= this.movV.x;
        this.pos.y -= this.movV.y;
    };
    Asteroid.Asteroids = new Array();
    return Asteroid;
})();
var Bullet = (function () {
    function Bullet(pos, movV) {
        this.pos = { x: 600, y: 400 };
        this.movV = { x: 0, y: 0 };
        this.angle = 0;
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.movV.x = movV.x * 20;
        this.movV.y = movV.y * 20;
        this.angle = GetAngleFromVector(movV);
    }
    Bullet.prototype.Draw = function () {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.drawImage(image_bullet, 2.5, 0);
        ctx.restore();
        this.pos.x += this.movV.x;
        this.pos.y += this.movV.y;
    };
    return Bullet;
})();
function GetAngleFromVector(v) {
    return Math.atan2(v.y, v.x) + Math.PI / 2;
}
function NormalizeVectorFromPoints(v1, v2) {
    var Vlength = GetDistance(v1, v2);
    return { x: (v1.x - v2.x) / Vlength, y: (v1.y - v2.y) / Vlength };
}
function GetDistance(p1, p2) {
    var vx = p1.x - p2.x;
    var vy = p1.y - p2.y;
    var Vlength = Math.sqrt(vx * vx + vy * vy);
    return Vlength;
}
function SwapAndSlow(v1, v2) {
    var tmp = v1.x;
    v1.x = v2.x;
    v2.x = tmp;
    tmp = v1.y;
    v1.y = v2.y;
    v2.y = tmp;
    return [v1, v2];
}
var Health = (function () {
    function Health(pos) {
        this.pos = { x: 0, y: 0 };
        this.angle = 0;
        this.isAlive = false;
        this.isWoring = false;
        this.pos.x = pos.x;
        this.pos.y = pos.y;
    }
    Health.prototype.Draw = function () {
        if (this.isAlive) {
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(this.angle);
            ctx.drawImage(image_health, -25.5, -25.5);
            ctx.restore();
            this.angle += 0.02;
        }
    };
    Health.prototype.StartApprinng = function () {
        var _this = this;
        if (this.isWoring) {
            return;
        }
        ;
        this.isWoring = true;
        var callback = function () {
            _this.isAlive = !_this.isAlive;
            _this.pos.x = 1000 * Math.random() + 100;
            _this.pos.y = 600 * Math.random() + 100;
            _this.TimeoutHandle = setTimeout(callback, Math.random() * 10000 + 10000);
        };
        this.TimeoutHandle = setTimeout(callback, Math.random() * 10000 + 10000);
    };
    Health.prototype.StopApprinng = function () {
        if (!this.isWoring) {
            return;
        }
        ;
        this.isWoring = false;
        clearTimeout(this.TimeoutHandle);
    };
    return Health;
})();
var Player = (function () {
    function Player() {
        this.pos = { x: 600, y: 400 };
        this.rotV = { x: 0, y: 0 };
        this.movV = { x: 0, y: 0 };
        this.MousePos = { x: 0, y: 0 };
        this.Bullets = new Array();
        this.lifesNumber = 3;
        this.blinkingProgress = 0;
        this.isImmortal = false;
    }
    Player.prototype.StartCheckingMousePosition = function () {
        var _this = this;
        canvas.onmousemove = function (evt) {
            _this.MousePos.x = evt.offsetX;
            _this.MousePos.y = evt.offsetY;
        };
        canvas.onmousedown = function (evt) {
            var angle = GetAngleFromVector(_this.rotV) - Math.PI / 2;
            var translationX1 = Math.cos(angle - 0.58) * 47;
            var translationY1 = Math.sin(angle - 0.58) * 47;
            var translationX2 = Math.cos(angle + 0.51) * 45;
            var translationY2 = Math.sin(angle + 0.51) * 45;
            //var translationX3 = Math.cos(angle - 0.107) * 73;
            //var translationY3 = Math.sin(angle - 0.107) * 73;
            //var translationX4 = Math.cos(angle + 0.045) * 73;
            //var translationY4 = Math.sin(angle + 0.045) * 73;
            _this.Bullets.push(new Bullet({ x: _this.pos.x + translationX1, y: _this.pos.y + translationY1 }, _this.rotV));
            _this.Bullets.push(new Bullet({ x: _this.pos.x + translationX2, y: _this.pos.y + translationY2 }, _this.rotV));
            //this.Bullets.push(new Bullet({ x: this.pos.x + translationX3, y: this.pos.y + translationY3 }, this.rotV));
            //this.Bullets.push(new Bullet({ x: this.pos.x + translationX4, y: this.pos.y + translationY4 }, this.rotV));
        };
    };
    Player.prototype.Render = function () {
        this.pos.x += this.movV.x;
        this.pos.y += this.movV.y;
        this.rotV = NormalizeVectorFromPoints({ x: this.MousePos.x + 7, y: this.MousePos.y + 7 }, { x: this.pos.x, y: this.pos.y });
        if (Keyboard.keys[32]) {
            var dist = GetDistance(this.pos, this.MousePos);
            dist = Math.sqrt(dist);
            dist -= 7;
            this.movV.x += this.rotV.x * dist / 12;
            this.movV.y += this.rotV.y * dist / 12;
        }
        this.movV.x *= 0.92;
        this.movV.y *= 0.92;
        this.CheckCollision();
        this.LifeNumberChecker();
        this.Draw();
        for (var i = 0; i < this.Bullets.length; i++) {
            this.Bullets[i].Draw(); //DrawingBullets
        }
        this.RemovingBulletsAndAsteroids();
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
            this.movV.x = -this.movV.x * 0.6;
        }
        if (this.pos.x < 45) {
            this.pos.x = 45;
            this.movV.x = -this.movV.x * 0.6;
        }
    };
    Player.prototype.RemovingBulletsAndAsteroids = function () {
        for (var i = this.Bullets.length - 1; i >= 0; i--) {
            if (((this.Bullets[i].pos.x > 1250) || (this.Bullets[i].pos.x < -50)) || ((this.Bullets[i].pos.y > 850) || (this.Bullets[i].pos.y < -50))) {
                this.Bullets.splice(i, 1);
                i--;
            }
        }
        for (var j = 0; j < this.Bullets.length; j++) {
            for (var k = 0; k < Asteroid.Asteroids.length; k++) {
                if (GetDistance(this.Bullets[j].pos, Asteroid.Asteroids[k].pos) < 30) {
                    if (this.isImmortal) {
                        continue;
                    }
                    else {
                        this.Bullets.splice(j, 1);
                        Asteroid.Asteroids.splice(k, 1);
                        scoreNumber++;
                        var score = document.getElementById('score');
                        score.innerHTML = "Score: " + scoreNumber.toString();
                        break;
                    }
                }
            }
        }
    };
    Player.prototype.GetLifeNumber = function () {
        return this.lifesNumber;
    };
    Player.prototype.LifeNumberChecker = function () {
        var _this = this;
        var life1 = document.getElementById('health1');
        var life2 = document.getElementById('health2');
        var life3 = document.getElementById('health3');
        for (var k = 0; k < Asteroid.Asteroids.length; k++) {
            if (GetDistance(Asteroid.Asteroids[k].pos, this.pos) < 65.5) {
                Asteroid.Asteroids.splice(k, 1);
                if (this.isImmortal) {
                    return;
                }
                this.isImmortal = true;
                setTimeout(function () { _this.isImmortal = false; }, 3000);
                if (this.lifesNumber === 1) {
                    life1.style.display = "none";
                    this.lifesNumber--;
                }
                if (this.lifesNumber === 2) {
                    life2.style.display = "none";
                    this.lifesNumber--;
                }
                if (this.lifesNumber === 3) {
                    life3.style.display = "none";
                    this.lifesNumber--;
                }
            }
        }
        if (GetDistance(Health1.pos, this.pos) < 30) {
            if (this.lifesNumber === 2) {
                life3.style.display = "inline";
                this.lifesNumber++;
                Health1.StopApprinng();
                Health1.pos = { x: -100, y: -100 };
            }
            if (this.lifesNumber === 1) {
                life2.style.display = "inline";
                this.lifesNumber++;
                Health1.StopApprinng();
                Health1.pos = { x: -100, y: -100 };
            }
        }
    };
    Player.prototype.Draw = function () {
        if (this.isImmortal) {
            this.blinkingProgress += 0.1;
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(GetAngleFromVector(this.rotV));
            ctx.globalAlpha = Math.sin(this.blinkingProgress) / 2 + 0.5;
            ctx.drawImage(image_shipshield, -45, -50);
            ctx.globalAlpha = 1;
            ctx.restore();
        }
        else {
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(GetAngleFromVector(this.rotV));
            ctx.globalAlpha = 1.0;
            ctx.drawImage(image_player, -45, -50);
            ctx.restore();
        }
    };
    return Player;
})();
var canvas;
var ctx;
var Player1;
var Health1;
var image_player = new Image();
var image_bullet = new Image();
var image_asteroid = new Image();
var image_health = new Image();
var image_shipshield = new Image();
var x = 0;
var scoreNumber = 0;
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Player1.Render();
    Asteroid.Render();
    Health1.Draw();
    if (Player1.GetLifeNumber() < 3) {
        Health1.StartApprinng();
    }
    else {
        Health1.StopApprinng();
    }
    if (Player1.GetLifeNumber() === 0) {
        return 0;
    }
    bgrTranslation();
    requestAnimationFrame(loop);
}
window.onload = function () {
    canvas = document.getElementById('MainCanvas');
    ctx = canvas.getContext('2d');
    Player1 = new Player();
    Health1 = new Health({ x: (1000 * Math.random() + 100), y: (600 * Math.random() + 100) });
    Player1.StartCheckingMousePosition();
    Keyboard.start();
    image_player.src = "./app/assets/images/spaceship.png";
    image_bullet.src = "./app/assets/images/bullet.png";
    image_asteroid.src = "./app/assets/images/asteroid2.png";
    image_health.src = "./app/assets/images/health.png";
    image_shipshield.src = "./app/assets/images/shipshield.png";
    var counter = 0;
    image_bullet.onload = function () {
        counter++;
        if (counter === 5) {
            loop();
        }
    };
    image_player.onload = function () {
        counter++;
        if (counter === 5) {
            loop();
        }
    };
    image_asteroid.onload = function () {
        counter++;
        if (counter === 5) {
            loop();
        }
    };
    image_health.onload = function () {
        counter++;
        if (counter === 5) {
            loop();
        }
    };
    image_shipshield.onload = function () {
        counter++;
        if (counter === 5) {
            loop();
        }
    };
};
function bgrTranslation() {
    x += 0.0001;
    var bgr_x = Math.cos(x) * 10000;
    var bgr_y = Math.sin(x) * 10000;
    canvas.style.backgroundPositionX = bgr_x.toString() + "px";
    canvas.style.backgroundPositionY = bgr_y.toString() + "px";
}
var Keyboard = (function () {
    function Keyboard() {
    }
    Keyboard.start = function () {
        window.onkeydown = function keypress(evt) {
            Keyboard.keys[evt.keyCode] = true;
        };
        window.onkeyup = function keypress(evt) {
            Keyboard.keys[evt.keyCode] = false;
        };
    };
    Keyboard.keys = new Array(200);
    return Keyboard;
})();
