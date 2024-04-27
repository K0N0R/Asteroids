export class Keyboard {
    static keys = new Array(200);
    static start() {
        window.onkeydown = function keypress(evt) {
            Keyboard.keys[evt.keyCode] = true;
        }
        window.onkeyup = function keypress(evt) {
            Keyboard.keys[evt.keyCode] = false;
        }
    }
} 