import type { Campaign } from '../state/campaign';
import type { Point } from '../worlds/sector';
export interface ExtractionNode extends Point {
    remaining: number;
    id: number;
}
/** Each active sortie has a finite stock; a new sortie regenerates only the resource. */
export class AnomalyExtraction {
    readonly nodes: ExtractionNode[];
    progress = 0;
    target: ExtractionNode | null = null;
    constructor(c: Campaign) {
        this.nodes =
            c.story?.sector === 'mars' &&
            c.station.extraction &&
            c.story.claimed.includes('mercury-technology')
                ? [
                      { x: -1600, y: -700 },
                      { x: 800, y: -1600 },
                      { x: 1800, y: 1200 },
                  ].map((point, id) => ({ ...point, id, remaining: 32 }))
                : [];
    }
    step(dt: number, position: Point, aim: Point, range: number, operating: boolean, free: number) {
        const node =
            operating && free >= 4
                ? this.nodes.find(
                      (n) =>
                          n.remaining >= 4 &&
                          Math.hypot(n.x - position.x, n.y - position.y) <= range &&
                          Math.hypot(n.x - aim.x, n.y - aim.y) <= 110,
                  )
                : undefined;
        if (!node) {
            this.target = null;
            this.progress = 0;
            return 0;
        }
        if (this.target !== node) this.progress = 0;
        this.target = node;
        this.progress += dt;
        if (this.progress + 1e-8 < 2) return 0;
        node.remaining -= 4;
        this.progress = 0;
        return 4;
    }
}
