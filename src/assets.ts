import { addImageProcess } from "./utils/utils";

export class Assets {
    image_spaceship: HTMLImageElement;
    image_spaceship_engines: HTMLImageElement;
    image_bullet: HTMLImageElement;
    image_asteroid_1: HTMLImageElement;
    image_asteroid_2: HTMLImageElement;
    image_health: HTMLImageElement;
    image_shipshield: HTMLImageElement;
    constructor() {}

    async preload() {
        return  [this.image_spaceship, this.image_spaceship_engines, this.image_bullet, this.image_asteroid_1, this.image_asteroid_2, this.image_health, this.image_shipshield]= await Promise.all([
            addImageProcess("./spaceship.png"),
            addImageProcess("./spaceship-engines.png"),
            addImageProcess("./bullet.png"),
            addImageProcess("./asteroid1.png"),
            addImageProcess("./asteroid2.png"),
            addImageProcess("./health.png"),
            addImageProcess("./shipshield.png"),
        ])
    }
}