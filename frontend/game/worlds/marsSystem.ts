import { generateSector, random, type EnemySpec, type Landmark, type RockSpec } from './sector';
import type { StoryProgress } from '../state/story';
import {
    MARS_ACT as M,
    MARS_AMBUSH,
    MARS_SURFACE_PATROLS,
    MARS_YARD_PATROLS,
    phobosRouteOpen,
    phobosOrbitSecured,
} from '../state/marsAct';
import { MARS_MAPS, MARS_GATES, inMarsMap, type MarsOrbitId } from './marsLayout';
import {
    PHOBOS_MAZE_BANDS,
    PHOBOS_ORBIT_BANDS,
    PHOBOS_MAZE_ENTRY,
    PHOBOS_MAZE_GATE,
    marsAnomalyClearance,
} from './phobosMaze';
import { MARS_MOONS } from './marsMoons';
export const MARS_ANOMALIES = PHOBOS_MAZE_BANDS;
export function marsAnomaliesFor(id: MarsOrbitId) {
    return id === 'mars' ? MARS_ANOMALIES : id === 'phobos' ? PHOBOS_ORBIT_BANDS : [];
}
export function marsSystemLanes(p: StoryProgress) {
    return [
        ...(phobosRouteOpen(p)
            ? [{ name: 'Mars — orbita Fobosa', a: PHOBOS_MAZE_GATE, b: MARS_GATES.phobosArrival }]
            : []),
        ...(p.mars.aiIdentified
            ? [
                  {
                      name: 'Fobos — duża asteroida',
                      a: MARS_GATES.asteroidExit,
                      b: MARS_GATES.asteroidArrival,
                  },
              ]
            : []),
    ];
}
export function marsSystemZones(p: StoryProgress) {
    return [
        {
            ...MARS_MAPS.mars.center,
            radius: MARS_MAPS.mars.radius,
            name: 'Orbita Marsa · Satuk 15',
        },
        ...(phobosRouteOpen(p)
            ? [
                  {
                      ...MARS_MAPS.phobos.center,
                      radius: MARS_MAPS.phobos.radius,
                      name: 'Orbita Fobosa',
                  },
              ]
            : []),
        ...(p.mars.aiIdentified
            ? [
                  {
                      ...MARS_MAPS.asteroid.center,
                      radius: MARS_MAPS.asteroid.radius,
                      name: 'Obszar asteroidy',
                  },
              ]
            : []),
    ];
}
export function marsRequiredFleet(p: StoryProgress): EnemySpec[] {
    const make = (
        id: number,
        x: number,
        y: number,
        kind: EnemySpec['kind'],
        route?: EnemySpec['route'],
    ): EnemySpec => ({ id, x, y, kind, home: { x, y }, phase: 0, route });
    return [
        ...(phobosRouteOpen(p) && p.mars.ambushEntered
            ? MARS_AMBUSH.map((id, i) =>
                  make(
                      id,
                      MARS_GATES.phobosArrival.x + 500 + i * 160,
                      MARS_GATES.phobosArrival.y - 300 - i * 180,
                      'patrol',
                  ),
              )
            : []),
        ...(phobosOrbitSecured(p) && !p.mars.baseNeutralized
            ? MARS_SURFACE_PATROLS.map((id) => {
                  // One approach to the base, then a slow circuit across the moon.
                  const route = [
                      { x: 6900, y: 6700 },
                      { x: 7550, y: 7000 },
                      { x: 6600, y: 7450 },
                      { x: 5300, y: 6800 },
                      { x: 5250, y: 5600 },
                      { x: 6250, y: 4600 },
                      { x: 7650, y: 5200 },
                      { x: 7900, y: 6150 },
                  ];
                  return {
                      ...make(id, 7500, 6600, 'patrol', route),
                      patrolSpeed: 42,
                      routeLoopFrom: 1,
                  };
              })
            : []),
        ...(p.mars.aiIdentified
            ? MARS_YARD_PATROLS.map((id, i) => {
                  const a = (i * Math.PI) / 6;
                  return make(
                      id,
                      M.asteroid.x + Math.cos(a) * (850 + (i % 3) * 180),
                      M.asteroid.y + Math.sin(a) * (850 + (i % 3) * 180),
                      i % 4 === 3 ? 'heavy' : i % 4 === 2 ? 'support' : 'lancer',
                  );
              })
            : []),
        ...p.mars.reinforcements.map((e) => ({
            ...make(e.id, e.x, e.y, e.kind as EnemySpec['kind']),
            factorySpawn: true,
        })),
        ...Array.from({ length: p.mars.researchWaves }, (_, index) =>
            Array.from({ length: index + 2 }, (_, i) =>
                make(
                    74010 + index * 10 + i,
                    M.research[index].x + Math.cos(i * 2.4) * 650,
                    M.research[index].y + Math.sin(i * 2.4) * 650,
                    i === index + 1 ? 'lancer' : 'patrol',
                ),
            ),
        ).flat(),
    ].filter((e) => !p.mars.kills.includes(e.id));
}
export function generateMarsActSector(p: StoryProgress) {
    const sector = generateSector(150073),
        rng = random(220123);
    sector.enemies = marsRequiredFleet(p);
    sector.caches = [];
    sector.outpost = {
        ...sector.outpost,
        x: 120000,
        y: 0,
        terminal: { x: 120200, y: 0 },
        guards: [],
    };
    sector.fortress = { ...sector.fortress, x: 124000, y: 0, walls: [], guards: [] };
    sector.researchSite = {
        ...M.research[p.mars.researchSites % 3],
        name: 'Pomiary anomalii Marsa',
    };
    sector.hyperlanes = marsSystemLanes(p);
    sector.regions = marsSystemZones(p);
    const landmarks: Landmark[] = [
        { x: 0, y: -1300, key: 2, kind: 'field', radius: 800, name: 'Pas asteroid nad Satuk 15' },
        { x: 0, y: 1300, key: 0, kind: 'field', radius: 850, name: 'Pas asteroid pod Satuk 15' },
        {
            ...M.landing,
            key: 3,
            kind: 'field',
            radius: 190,
            name: 'Mars · zejście odcięte anomalią',
        },
        {
            ...M.deimosGate,
            key: 9,
            kind: 'field',
            radius: 190,
            name: 'Deimos · śluza całkowicie odcięta anomalią',
        },
    ];
    if (phobosRouteOpen(p))
        landmarks.push(
            {
                ...PHOBOS_MAZE_ENTRY,
                key: 0,
                kind: 'field',
                radius: 150,
                name: 'Wejście do labiryntu · śluza Fobosa',
            },
            {
                ...M.phobos,
                key: 4,
                kind: phobosOrbitSecured(p) ? 'passage' : 'field',
                surfaceBody: 'phobos',
                radius: 200,
                name: phobosOrbitSecured(p) ? 'Fobos · lądowanie' : 'Fobos',
            },
            { ...M.probe, key: 6, kind: 'wreck', radius: 120, name: 'Zapomniana ziemska sonda' },
            { ...M.oldShip, key: 0, kind: 'wreck', radius: 120, name: 'Wrak starego Prospectora' },
        );
    if (phobosOrbitSecured(p)) {
        const b = MARS_MOONS.phobos;
        landmarks.push(
            {
                ...b.exit,
                key: 1,
                area: 'surface',
                surfaceBody: 'phobos',
                kind: 'passage',
                radius: 200,
                name: 'Fobos · powrót na orbitę',
            },
            {
                x: 6100,
                y: 6000,
                key: 2,
                area: 'surface',
                surfaceBody: 'phobos',
                kind: 'field',
                radius: 500,
                name: 'Złoża powierzchniowe Fobosa',
            },
        );
        if (p.mars.baseDiscovered || p.mars.baseNeutralized)
            landmarks.push({
                ...M.terminal,
                key: 7,
                area: 'surface',
                surfaceBody: 'phobos',
                kind: 'field',
                radius: 120,
                name: p.mars.baseNeutralized
                    ? 'Instalacja wyłączona · moduł pamięci'
                    : 'Terminal bazy · E: ułóż ścieżkę',
            });
    }
    if (p.mars.aiIdentified)
        landmarks.push(
            {
                ...M.yard,
                key: 5,
                kind: 'factory',
                radius: 120,
                name: p.mars.yardDestroyed
                    ? 'Ruiny zakładu przemysłowego'
                    : 'Zakład przemysłowy SI',
            },
            {
                ...M.asteroid,
                key: 2,
                kind: 'cluster',
                radius: 500,
                name: 'Duża asteroida · skupisko skał',
            },
        );
    if (p.claimed.includes('mars-sector-secure') && p.mars.researchSites < 3)
        landmarks.push({
            ...M.research[p.mars.researchSites],
            key: 8,
            kind: 'field',
            radius: 150,
            name: `Pomiar anomalii ${p.mars.researchSites + 1}/3 · Kepler`,
        });
    sector.landmarks = landmarks;
    const rocks: RockSpec[] = [];
    const fields = [
        { x: 0, y: -1300, radius: 850, count: 100, surface: false },
        { x: 0, y: 1300, radius: 900, count: 100, surface: false },
        ...(phobosRouteOpen(p)
            ? [{ x: 30000, y: 500, radius: 1850, count: 90, surface: false }]
            : []),
        ...(phobosOrbitSecured(p)
            ? [{ ...M.surface, radius: 1400, count: 130, surface: true }]
            : []),
        ...(p.mars.aiIdentified
            ? [{ ...M.asteroid, radius: 1500, count: 300, surface: false }]
            : []),
    ];
    if (p.mars.aiIdentified)
        rocks.push({
            ...M.asteroid,
            radius: 420,
            variant: 911,
            rich: true,
            anchored: true,
            vx: 0,
            vy: 0,
        });
    for (const field of fields)
        for (let i = 0; i < field.count; i++) {
            const a = rng() * Math.PI * 2,
                d = Math.sqrt(rng()) * field.radius,
                asteroid = field.x > 50000;
            const r: RockSpec = {
                x: field.x + Math.cos(a) * d,
                y: field.y + Math.sin(a) * d,
                radius: asteroid
                    ? 18 + rng() * 47
                    : field.surface
                      ? 28 + rng() * 32
                      : 20 + rng() * 27,
                rich: i % 2 === 0,
                copper: i % 4 === 0,
                crystal: i % 5 === 0,
                variant: Math.floor(rng() * 128),
                anchored: field.surface,
                vx: field.surface ? 0 : 30 + rng() * 30,
                vy: field.surface ? 0 : (rng() - 0.5) * 12,
            };
            const orbit = field.x > 50000 ? 'asteroid' : field.x > 20000 ? 'phobos' : 'mars';
            if (!field.surface && !inMarsMap(orbit, r, -r.radius - 40)) continue;
            if (
                !field.surface &&
                marsAnomalyClearance(
                    r,
                    field.x > 50000 ? 'asteroid' : field.x > 20000 ? 'phobos' : 'mars',
                ) <
                    r.radius + 80
            )
                continue;
            if (
                [
                    ...landmarks.filter(
                        (l) => l.kind === 'passage' || l.key === 7 || l.kind === 'wreck',
                    ),
                    ...sector.hyperlanes.flatMap((l) => [l.a, l.b]),
                ].some((l) => Math.hypot(l.x - r.x, l.y - r.y) < r.radius + 200)
            )
                continue;
            if (
                [M.base, M.yard, { x: 0, y: 0 }].some(
                    (l) => Math.hypot(l.x - r.x, l.y - r.y) < r.radius + (l.x === 0 ? 550 : 220),
                )
            )
                continue;
            if (
                rocks.some(
                    (old) => Math.hypot(old.x - r.x, old.y - r.y) < old.radius + r.radius + 14,
                )
            )
                continue;
            rocks.push(r);
        }
    sector.rocks = rocks;
    return sector;
}
