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
//# sourceMappingURL=Keyboard.js.map