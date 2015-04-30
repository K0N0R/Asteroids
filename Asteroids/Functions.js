function GetAngleFromVector(v) {
    var cos = (v.x) / (Math.sqrt(v.x * v.x + v.y * v.y));
    var angle = Math.acos(cos);
    if (v.y > 0) {
        return angle + Math.PI / 2;
    }
    else {
        return -angle + Math.PI / 2;
    }
}
function NormalizeVectorFromPoints(v1, v2) {
    var Vlength = GetDistance(v1, v2);
    return { x: (v1.x - v2.x) / Vlength, y: (v1.y - v2.y) / Vlength };
}
function GetDistance(p1, p2) {
    var vx = p1.x - p2.x;
    var vy = p1.y - p2.y;
    var Vlength = Math.sqrt(vx * vx + vy * vy);
    return Vlength;
}
console.log("Dupa");
//# sourceMappingURL=Functions.js.map