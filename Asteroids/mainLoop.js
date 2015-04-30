var canvas;
var ctx;
var Player1;
var image_player = new Image();
var image_bullet = new Image();
var x = 0;
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Player1.Render();
    bgrTranslation();
    requestAnimationFrame(loop);
}
window.onload = function () {
    canvas = document.getElementById('MainCanvas');
    ctx = canvas.getContext('2d');
    Player1 = new Player();
    Player1.StartCheckingMousePosition();
    Keyboard.start();
    image_player.src = "spaceship.png";
    image_bullet.src = "bullet.png";
    image_bullet.onload = function () {
        if (image_player.complete) {
            alert("Chuj Ci w dupe");
            loop();
        }
    };
    image_player.onload = function () {
        if (image_bullet.complete) {
            alert("i tOBIE TEŻ");
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
//# sourceMappingURL=mainLoop.js.map