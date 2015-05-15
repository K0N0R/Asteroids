function GetAngleFromVector(v: { x: number; y: number }): number {
    return Math.atan2(v.y, v.x) + Math.PI/2;
}

function NormalizeVectorFromPoints(v1: { x: number; y: number }, v2: { x: number; y: number }): { x: number; y: number } {
    var Vlength = GetDistance(v1, v2);
    return { x: (v1.x - v2.x) / Vlength, y: (v1.y - v2.y) / Vlength };

}

function GetDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    var vx = p1.x - p2.x;
    var vy = p1.y - p2.y;
    var Vlength = Math.sqrt(vx * vx + vy * vy)
    return Vlength;
}
function SwapAndSlow(v1: { x: number; y: number }, v2: { x: number; y: number }) {
    var tmp = v1.x;
    v1.x = v2.x;
    v2.x = tmp;

    tmp = v1.y; 
    v1.y = v2.y;
    v2.y = tmp;
    return [v1, v2];
}







