class Player {
    pos = { x: 600, y: 400 };
    rotV = { x: 0, y: 0 };
    movV = { x: 0, y: 0 };
    MousePos = { x: 0, y: 0 };
    Bullets = new Array<Bullet>();

    public lifesNumber = 3;

    private blinkingProgress = 0;
    isImmortal = false;


    StartCheckingMousePosition() {
        canvas.onmousemove = (evt:any) => {
            this.MousePos.x = evt.offsetX;
            this.MousePos.y = evt.offsetY;
        }
        canvas.onmousedown = (evt:any) => {
            var angle = GetAngleFromVector(this.rotV) - Math.PI / 2;
            var translationX1 = Math.cos(angle - 0.58) * 47;
            var translationY1 = Math.sin(angle - 0.58) * 47;
            var translationX2 = Math.cos(angle + 0.51) * 45;
            var translationY2 = Math.sin(angle + 0.51) * 45;
            //var translationX3 = Math.cos(angle - 0.107) * 73;
            //var translationY3 = Math.sin(angle - 0.107) * 73;
            //var translationX4 = Math.cos(angle + 0.045) * 73;
            //var translationY4 = Math.sin(angle + 0.045) * 73;
            this.Bullets.push(new Bullet({ x: this.pos.x + translationX1, y: this.pos.y + translationY1 }, this.rotV));
            this.Bullets.push(new Bullet({ x: this.pos.x + translationX2, y: this.pos.y + translationY2 }, this.rotV));
            //this.Bullets.push(new Bullet({ x: this.pos.x + translationX3, y: this.pos.y + translationY3 }, this.rotV));
            //this.Bullets.push(new Bullet({ x: this.pos.x + translationX4, y: this.pos.y + translationY4 }, this.rotV));

        }
    }
    public Render() {
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
            this.Bullets[i].Draw();//DrawingBullets
        }
        this.RemovingBulletsAndAsteroids();
    }
    private CheckCollision() {
        if (this.pos.y > canvas.height - 50) {
            this.pos.y = canvas.height - 50
            this.movV.y = -this.movV.y * 0.6
        }
        if (this.pos.y < 50) {
            this.pos.y = 50
            this.movV.y = -this.movV.y * 0.6
        }
        if (this.pos.x > canvas.width - 45) {
            this.pos.x = canvas.width - 45
            this.movV.x = -this.movV.x * 0.6
        }
        if (this.pos.x < 45) {
            this.pos.x = 45
            this.movV.x = -this.movV.x * 0.6
        }
    }

    RemovingBulletsAndAsteroids() {
        for (var i = this.Bullets.length - 1; i >= 0; i--) {
            if (((this.Bullets[i].pos.x > 1250) || (this.Bullets[i].pos.x < -50)) || ((this.Bullets[i].pos.y > 850) || (this.Bullets[i].pos.y < -50))) {
                this.Bullets.splice(i, 1);
                i--;
            }
        }
        for (var j = 0; j < this.Bullets.length; j++) {
            for (var k = 0; k < Asteroid.Asteroids.length; k++) {
                if (GetDistance(this.Bullets[j].pos, Asteroid.Asteroids[k].pos) < 30) {
                    if (this.isImmortal) { continue; }
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
    }

    GetLifeNumber(): number {
        return this.lifesNumber;
    }
    LifeNumberChecker() {
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
                setTimeout(() => { this.isImmortal = false }, 3000);
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
                Health1.pos = { x: -100, y: -100 }
            }
            if (this.lifesNumber === 1) {
                life2.style.display = "inline";
                this.lifesNumber++;
                Health1.StopApprinng();
                Health1.pos = { x: -100, y: -100 }
            }

        }
    }
    Draw() {
        if (this.isImmortal) {
            this.blinkingProgress += 0.1;
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(GetAngleFromVector(this.rotV));
            ctx.globalAlpha = Math.sin(this.blinkingProgress)/2+0.5;
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
    }
}
