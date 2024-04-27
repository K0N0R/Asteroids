import { Assets } from "./assets";
import { Game } from "./main/game";
import { Keyboard } from "./utils/keyboard";

window.onload =  async function () {
    Keyboard.start();
    const assets = new Assets();
    await assets.preload();
    const game = new Game(assets);
    game.loop();
}