class Asteroid {
    pos = { x: 0, y: 0 };
    movV = { x: 0, y: 0 };

    angle = 0;
    static Asteroids = new Array<Asteroid>();

    constructor(pos: { x: number; y: number }, movV: { x: number; y: number }) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.movV.x = movV.x * 5;
        this.movV.y = movV.y * 5;
    }
    static Render() {
        if (Asteroid.Asteroids.length < 20) {
            var AsteroidsSpawn = [{ x: 1200 * Math.random(), y: 0 }, { x: 1200 * Math.random(), y: 800 }, { x: 0, y: 800 * Math.random() }, { x: 1200, y: 800 * Math.random() }]
            var randomElement = (Math.random() * 4) | 0;
            Asteroid.Asteroids.push(new Asteroid({ x: AsteroidsSpawn[randomElement].x, y: AsteroidsSpawn[randomElement].y }, NormalizeVectorFromPoints(AsteroidsSpawn[randomElement], { x: (Player1.pos.x + Math.random() * 20 + 20), y: (Player1.pos.x + Math.random() * 20 + 20) })));
        }
        for (var i = 0; i < Asteroid.Asteroids.length; i++) {
            Asteroid.Asteroids[i].Draw();
        }

        Asteroid.Remove();
        Asteroid.CheckCollision();
    }
    static Remove() {
        for (var i = this.Asteroids.length - 1; i >= 0; i--) {
            if (((this.Asteroids[i].pos.x > 1250) || (this.Asteroids[i].pos.x < -50)) || ((this.Asteroids[i].pos.y > 850) || (this.Asteroids[i].pos.y < -50))) {
                this.Asteroids.splice(i, 1);
                i--;
            }
        }
    }
    static CheckCollision() {
        for (var i = 0; i < Asteroid.Asteroids.length; i++) {
            for (var j = 0; j < Asteroid.Asteroids.length; j++) {
                if (i === j) { continue; }
                if (GetDistance(Asteroid.Asteroids[i].pos, Asteroid.Asteroids[j].pos) < 51) {
                    var vBetween = NormalizeVectorFromPoints(Asteroid.Asteroids[i].pos, Asteroid.Asteroids[j].pos)
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
    }
    Draw() {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.drawImage(image_asteroid, -25.5, -25.5)
        ctx.restore();
        this.angle += 0.02;
        this.pos.x -= this.movV.x;
        this.pos.y -= this.movV.y;

    }
}