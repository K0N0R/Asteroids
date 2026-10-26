/** Local coordinates are shared by hull art and physical hulls; terminals remain outside. */
export const VENUS_LAB_MODULES = [
    { id: 'hub', x: 0, y: 0, width: 320, height: 270, system: 1 },
    { id: 'reactor', x: -440, y: -420, width: 260, height: 220, system: 0 },
    { id: 'archive', x: 430, y: 300, width: 380, height: 260, system: 2 },
    { id: 'dock', x: 260, y: 690, width: 250, height: 170, system: 1 },
] as const;
export function laboratoryHull(m: { x: number; y: number; width: number; height: number }) {
    const x = m.x,
        y = m.y,
        w = m.width / 2,
        h = m.height / 2,
        b = 26;
    return [
        [x - w + b, y - h],
        [x + w - b, y - h],
        [x + w, y - h + b],
        [x + w, y + h - b],
        [x + w - b, y + h],
        [x - w + b, y + h],
        [x - w, y + h - b],
        [x - w, y - h + b],
    ].map(([x, y]) => ({ x, y }));
}
