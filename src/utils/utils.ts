export function GetAngleFromVector(v: { x: number; y: number }): number {
    return Math.atan2(v.y, v.x) + Math.PI/2;
}

export function NormalizeVectorFromPoints(v1: { x: number; y: number }, v2: { x: number; y: number }): { x: number; y: number } {
    var Vlength = GetDistance(v1, v2);
    return { x: (v1.x - v2.x) / Vlength, y: (v1.y - v2.y) / Vlength };

}

export function GetDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    var vx = p1.x - p2.x;
    var vy = p1.y - p2.y;
    var Vlength = Math.sqrt(vx * vx + vy * vy)
    return Vlength;
}
export function SwapAndSlow(v1: { x: number; y: number }, v2: { x: number; y: number }) {
    var tmp = v1.x;
    v1.x = v2.x;
    v2.x = tmp;

    tmp = v1.y; 
    v1.y = v2.y;
    v2.y = tmp;
    return [v1, v2];
}

export function addImageProcess(src: string): Promise<HTMLImageElement>{
    return new Promise((resolve, reject) => {
      let img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

export function getRandomValueFromRange(min: number, max: number, rng = Math.random) {
    const delta = max - min

    return min + delta * rng()
}



