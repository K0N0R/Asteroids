import { Application, Rectangle } from 'pixi.js';
import { HULLS } from '../../frontend/game/config';
import { ANOMALY_FEATHER, polygonDistance } from '../../frontend/game/systems/anomalyField';
import {
    AnomalyCloudView,
    anomalyCanvasStats,
} from '../../frontend/game/graphics/anomalyCloudView';
import {
    PHOBOS_MAZE_BANDS,
    PHOBOS_ORBIT_BANDS,
    PHOBOS_MAZE_ROUTE,
    marsAnomalyClearance,
    marsAnomalyTouches,
} from '../../frontend/game/worlds/phobosMaze';
import { MARS_MAPS, inMarsMap } from '../../frontend/game/worlds/marsLayout';

const result = document.querySelector('#result')!;
try {
    const app = new Application();
    await app.init({ width: 800, height: 450, resolution: 1, backgroundAlpha: 0 });
    document.body.appendChild(app.canvas);
    const cloud = new AnomalyCloudView([...PHOBOS_MAZE_BANDS, ...PHOBOS_ORBIT_BANDS]);
    app.stage.addChild(cloud);
    const haze = (
        cloud as unknown as {
            haze: {
                sprite: { x: number; y: number; scale: { x: number } };
                raster: { width: number; height: number; pixels: Uint8Array };
            };
        }
    ).haze;
    const alphaAt = (point: { x: number; y: number }) => {
        const x = Math.floor((point.x - haze.sprite.x) / haze.sprite.scale.x),
            y = Math.floor((point.y - haze.sprite.y) / haze.sprite.scale.x);
        return haze.raster.pixels[(y * haze.raster.width + x) * 4 + 3] ?? 0;
    };
    const hullRadius = Math.max(...Object.values(HULLS).map((h) => Math.max(...h.hitbox) * h.size));
    let hazardous = 0,
        markedInteriors = 0;
    for (const map of [MARS_MAPS.mars, MARS_MAPS.phobos])
        for (let y = map.center.y - map.radius; y <= map.center.y + map.radius; y += 80)
            for (let x = map.center.x - map.radius; x <= map.center.x + map.radius; x += 80) {
                const point = { x, y };
                if (!inMarsMap(map.id, point) || !marsAnomalyTouches(point, map.id, hullRadius))
                    continue;
                hazardous++;
                if (marsAnomalyClearance(point, map.id) > -120) continue;
                markedInteriors++;
                if (alphaAt(point) < 25)
                    throw new Error(
                        `Unmarked hull contact at ${JSON.stringify(point)}: clearance ${marsAnomalyClearance(point, map.id)}, hull ${hullRadius}, alpha ${alphaAt(point)}`,
                    );
            }
    for (const point of PHOBOS_MAZE_ROUTE)
        if (alphaAt(point) !== 0)
            throw new Error(`Safe maze center covered at ${JSON.stringify(point)}`);
    const point = { x: 4000, y: -4000 };
    const gpuAlphaAt = (target: AnomalyCloudView, p: { x: number; y: number }) =>
        app.renderer.extract.pixels({
            target,
            frame: new Rectangle(p.x, p.y, 2, 2),
            resolution: 1,
            antialias: false,
        }).pixels[3];
    const square = [
        { x: -200, y: -200 },
        { x: 200, y: -200 },
        { x: 200, y: 200 },
        { x: -200, y: 200 },
    ];
    const edge = new AnomalyCloudView([square]);
    app.stage.addChild(edge);
    const outside = [
        { x: 200 + ANOMALY_FEATHER + 6, y: 0 },
        { x: -206 - ANOMALY_FEATHER, y: 0 },
        { x: 0, y: 200 + ANOMALY_FEATHER + 6 },
        { x: 0, y: -206 - ANOMALY_FEATHER },
    ];
    for (const p of outside)
        if (gpuAlphaAt(edge, p) !== 0)
            throw new Error(`Visible fringe beyond the shared damage margin: ${JSON.stringify(p)}`);
    const gradient = [198, 204, 212, 220, 228, 238].map((x) => gpuAlphaAt(edge, { x, y: 0 }));
    if (gradient.filter((a) => a > 0 && a < 90).length < 3)
        throw new Error(`No smooth transition: ${gradient}`);
    for (let i = 1; i < gradient.length; i++)
        if (gradient[i] > gradient[i - 1])
            throw new Error(`Gradient does not decrease: ${gradient}`);
    for (const x of [204, 212, 220, 228])
        if (
            !gpuAlphaAt(edge, { x, y: 0 }) ||
            polygonDistance({ x, y: 0 }, square) > ANOMALY_FEATHER
        )
            throw new Error('Visible gradient and damage margin disagree');
    const before = gpuAlphaAt(cloud, point);
    if (before < 90) throw new Error(`Invisible before tile delivery: ${before}`);
    const builds = anomalyCanvasStats().builds;
    const tiles = (view: AnomalyCloudView) =>
        (view as unknown as { tiles: Map<string, unknown> }).tiles.size;
    for (let frame = 0; frame < 120 && (!tiles(cloud) || !tiles(edge)); frame++) {
        cloud.update(point, 400, 225, 0);
        edge.update({ x: 0, y: 0 }, 400, 225, 0, 13.7);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    cloud.update(point, 400, 225, 0);
    edge.update({ x: 0, y: 0 }, 400, 225, 0, 13.7);
    for (const p of outside)
        if (gpuAlphaAt(edge, p) !== 0)
            throw new Error(`Animated detail moved beyond collision contour: ${JSON.stringify(p)}`);
    if (gpuAlphaAt(edge, { x: 185, y: 0 }) < 90)
        throw new Error('Dense edge missing inside collision contour');
    const after = gpuAlphaAt(cloud, point);
    if (anomalyCanvasStats().builds === builds) throw new Error('No worker tile received');
    if (after < 90) throw new Error(`Invisible after tile delivery: ${after}`);
    result.textContent = `PASS · ${hazardous} hull contact samples / ${markedInteriors} dense interiors checked · narrow maze centers clear · gradient ${gradient.join(' → ')} · visible fringe equals damage margin · GPU alpha ${before} before tiles / ${after} after tiles`;
    document.title = 'PASS · Anomaly visibility';
    cloud.destroy({ children: true });
    edge.destroy({ children: true });
    app.destroy(true);
} catch (error) {
    result.textContent = `FAIL · ${String(error)}`;
    document.title = 'FAIL · Anomaly visibility';
}
