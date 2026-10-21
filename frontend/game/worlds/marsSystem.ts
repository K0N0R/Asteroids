import { generateSector, random, type EnemySpec, type Landmark, type RockSpec } from './sector';
import type { StoryProgress } from '../state/story';
import { MARS_MOONS } from './marsMoons';
import { PHOBOS_MAZE_BANDS, PHOBOS_MAZE_GATE, PHOBOS_MAZE_ENTRY } from './phobosMaze';
import {
    MARS_ACT as M,
    MARS_AMBUSH,
    MARS_YARD_PATROLS,
    phobosRouteOpen,
    phobosOrbitSecured,
} from '../state/marsAct';

export const MARS_ANOMALIES = [
    [
        { x: -2400, y: 1000 },
        { x: -1200, y: 1000 },
        { x: -1100, y: 2200 },
        { x: -2400, y: 2300 },
    ],
    [
        { x: -2800, y: -2200 },
        { x: -1800, y: -2200 },
        { x: -1800, y: -1400 },
        { x: -2800, y: -1400 },
    ],
    ...PHOBOS_MAZE_BANDS,
    [
        { x: 7200, y: -1100 },
        { x: 7900, y: -1100 },
        { x: 7900, y: 600 },
        { x: 7200, y: 500 },
    ],
] as const;
export function marsSystemLanes(p: StoryProgress) {
    return [
        ...(phobosRouteOpen(p)
            ? [{ name: 'Mars — orbita Fobosa', a: PHOBOS_MAZE_GATE, b: { x: 5300, y: 0 } }]
            : []),
        { name: 'Mars — Deimos', a: { x: -1000, y: -600 }, b: { x: -4600, y: -1700 } },
        ...(p.mars.aiIdentified
            ? [{ name: 'Fobos — duża asteroida', a: { x: 5400, y: 700 }, b: { x: 700, y: 5700 } }]
            : []),
    ];
}
export function marsSystemZones(p: StoryProgress) {
    return [
        { x: 0, y: 0, radius: 3100, name: 'Orbita Marsa · Satuk 15' },
        { ...M.deimosGate, radius: 1400, name: 'Orbita Deimosa' },
        ...(phobosRouteOpen(p) ? [{ ...M.phobos, radius: 1800, name: 'Orbita Fobosa' }] : []),
        ...(p.mars.aiIdentified ? [{ ...M.asteroid, radius: 1800, name: 'Duża asteroida' }] : []),
    ];
}
export function marsRequiredFleet(p: StoryProgress): EnemySpec[] {
    const make = (id: number, x: number, y: number, kind: EnemySpec['kind']): EnemySpec => ({
        id,
        x,
        y,
        kind,
        home: { x, y },
        phase: 0,
    });
    return [
        ...(phobosRouteOpen(p)
            ? MARS_AMBUSH.map((id, i) =>
                  make(id, 6000 + i * 260, -450 + i * 300, i === 2 ? 'lancer' : 'patrol'),
              )
            : []),
        ...(p.mars.aiIdentified
            ? MARS_YARD_PATROLS.map((id, i) => {
                  const group = Math.floor(i / 4),
                      angle = ((i % 4) * Math.PI) / 2;
                  return make(
                      id,
                      -1200 + group * 650 + Math.cos(angle) * 230,
                      5900 + (group % 2) * 950 + Math.sin(angle) * 230,
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
        rng = random(220118);
    sector.enemies = marsRequiredFleet(p);
    sector.caches = [];
    sector.outpost = {
        ...sector.outpost,
        x: 22000,
        y: 0,
        terminal: { x: 22200, y: 0 },
        guards: [],
    };
    sector.fortress = { ...sector.fortress, x: 24000, y: 0, walls: [], guards: [] };
    sector.researchSite = {
        ...M.research[p.mars.researchSites % 3],
        name: 'Pomiary anomalii Marsa',
    };
    sector.hyperlanes = marsSystemLanes(p);
    sector.regions = marsSystemZones(p);
    const landmarks: Landmark[] = [
        {
            x: 1100,
            y: 0,
            key: 2,
            kind: 'field',
            radius: 600,
            name: 'Złoże orbitalne · surowce produkcyjne',
        },
        { x: -500, y: -850, key: 0, kind: 'field', radius: 650, name: 'Bogate złoże pierwiastków' },
        {
            ...M.landing,
            key: 3,
            kind: 'field',
            radius: 190,
            name: 'Mars · podejście do bariery lądowania',
        },
        {
            ...M.deimosGate,
            key: 9,
            kind: 'passage',
            radius: 190,
            surfaceBody: 'deimos',
            name: 'Deimos · lądowanie',
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
                radius: 180,
                name: phobosOrbitSecured(p)
                    ? 'Orbita Fobosa · zabezpieczona'
                    : 'Orbita Fobosa · nieznane kontakty',
            },
            { ...M.probe, key: 6, kind: 'wreck', radius: 120, name: 'Zapomniana ziemska sonda' },
            {
                x: 7600,
                y: -550,
                key: 0,
                kind: 'field',
                radius: 100,
                name: 'Sonda i stara instalacja za anomalią · brak dostępu',
            },
        );
    if (phobosOrbitSecured(p) && (p.mars.baseDiscovered || p.mars.baseNeutralized))
        landmarks.push(
            {
                ...M.terminal,
                area: 'surface',
                surfaceBody: 'phobos',
                key: 7,
                kind: 'field',
                radius: 100,
                name: p.mars.baseNeutralized
                    ? 'Instalacja zneutralizowana · moduł pamięci'
                    : 'Ukryta instalacja · E: terminal bez alarmu',
            },
            {
                x: 6100,
                y: 6000,
                area: 'surface',
                surfaceBody: 'phobos',
                key: 2,
                kind: 'field',
                radius: 500,
                name: 'Bogactwa Fobosa',
            },
        );
    for (const body of Object.values(MARS_MOONS)) {
        if (body.id === 'phobos' && !phobosOrbitSecured(p)) continue;
        landmarks.push({
            ...body.exit,
            key: 1,
            area: 'surface',
            surfaceBody: body.id,
            kind: 'passage',
            radius: 200,
            name: `${body.name} · powrót na orbitę`,
        });
    }
    if (p.mars.aiIdentified)
        landmarks.push({
            ...M.yard,
            key: 5,
            kind: 'factory',
            radius: 100,
            name: p.mars.yardDestroyed
                ? 'Ruiny zakładu przemysłowego'
                : 'Zakład przemysłowy SI · silna obrona',
        });
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
    const areas = [
        { x: 1100, y: 0, radius: 600, count: 80 },
        { x: -500, y: -850, radius: 650, count: 70 },
        ...(phobosRouteOpen(p) ? [{ ...M.phobos, radius: 1400, count: 34 }] : []),
        ...(phobosOrbitSecured(p) ? [{ ...M.surface, radius: 1350, count: 100 }] : []),
        ...(p.mars.aiIdentified ? [{ ...M.asteroid, radius: 1400, count: 60 }] : []),
    ];
    for (const area of areas)
        for (let i = 0; i < area.count; i++) {
            const angle = rng() * Math.PI * 2,
                d = Math.sqrt(rng()) * area.radius;
            const rock: RockSpec = {
                x: area.x + Math.cos(angle) * d,
                y: area.y + Math.sin(angle) * d,
                radius: 28 + rng() * 32,
                rich: i % 2 === 0,
                copper: i % 4 === 0,
                crystal: i % 5 === 0,
                variant: Math.floor(rng() * 128),
                vx: 0,
                vy: 0,
                anchored: area.y > 4000,
            };
            // Keep the steering challenge readable; mining rocks must not plug the maze lanes.
            if (rock.x > 1900 && rock.x < 5800 && rock.y > -3400 && rock.y < 2000) continue;
            if (
                [
                    ...landmarks.filter((l) => l.kind !== 'field' || l.key === 7),
                    ...sector.enemies,
                    ...sector.hyperlanes.flatMap((l) => [l.a, l.b]),
                ].some((l) => Math.hypot(l.x - rock.x, l.y - rock.y) < rock.radius + 190)
            )
                continue;
            if (
                Math.hypot(rock.x - M.base.x, rock.y - M.base.y) < rock.radius + 175 ||
                Math.hypot(rock.x - M.yard.x, rock.y - M.yard.y) < rock.radius + 200
            )
                continue;
            if (
                rocks.some(
                    (r) => Math.hypot(r.x - rock.x, r.y - rock.y) < r.radius + rock.radius + 14,
                )
            )
                continue;
            rocks.push(rock);
        }
    sector.rocks = rocks;
    return sector;
}
