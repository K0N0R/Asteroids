var canvas;
var ctx: CanvasRenderingContext2D;
var Player1: Player;
var Health1: Health;
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
    } else {
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
    image_player.src = "spaceship.png";
    image_bullet.src = "bullet.png";
    image_asteroid.src = "asteroid2.png";
    image_health.src = "health.png"
    image_shipshield.src = "shipshield.png";
    var counter = 0;
    image_bullet.onload = function () {
        counter++;
        if (counter === 5) { loop(); }
    }
    image_player.onload = function () {
        counter++;
        if (counter === 5) { loop(); }
    }
    image_asteroid.onload = function () {
        counter++;
        if (counter === 5) { loop(); }
    }
    image_health.onload = function () {
        counter++
        if (counter === 5) { loop(); }
    }
    image_shipshield.onload = function () {
        counter++
        if (counter === 5) { loop(); }
    }
}
    function bgrTranslation() {
        x += 0.0001;
        var bgr_x = Math.cos(x) * 10000;
        var bgr_y = Math.sin(x) * 10000;
        canvas.style.backgroundPositionX = bgr_x.toString() + "px";
        canvas.style.backgroundPositionY = bgr_y.toString() + "px";
}
  