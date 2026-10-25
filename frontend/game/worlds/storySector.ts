import { generateVenusSector } from './venusSystem';
import { generateMarsActSector } from './marsSystem';
import { MARS_MOONS } from './marsMoons';
import {
    earthSystemLanes,
    earthSystemZones,
    LUNAR_PROBE,
    SATELLITE_FIELD,
    ASTEROID_FIELD,
} from './earthSystem';
import { driftingField } from './asteroidFields';
import { segmentDistance } from '../systems/hyperdrive';
import { MERCURY_VEINS } from './mercuryVeins';
import { generateSector, random, type RockSpec, type EnemySpec } from './sector';
import {
    storyRadius,
    OUTER_BASES,
    NEPTUNE_ARENA,
    PLUTO_ARENA,
    plutoFinaleReady,
    outerRouteOpen,
    saturnRouteOpen,
    JUPITER_UPLINK,
    jupiterObservationsOpen,
    BELT_BARRIERS,
    beltRouteCleared,
    beltTechnologyReady,
    MARS_BASE,
    STORY_SECTORS,
    type StoryProgress,
} from '../state/story';
import { MERCURY_SHELTERS } from '../systems/solarExposure';
import { MOON, inEarthSystem } from './moon';

const MARS_CORRIDOR_POINTS = [
    { x: 1400, y: -1500 },
    { x: 2500, y: -800 },
    { x: 3900, y: 1700 },
];
export function marsCorridorFleet(progress: StoryProgress): EnemySpec[] {
    return progress.claimed.includes('mars-base-build')
        ? MARS_CORRIDOR_POINTS.slice(progress.progress['mars-corridor']).map((point, i) => ({
              ...point,
              home: { ...point },
              id: 9000 + i,
              phase: 0,
              kind: point.x > 2000 ? 'lancer' : 'patrol',
              storyPatrol: true,
          }))
        : [];
}
export function generateStorySector(progress: StoryProgress) {
    if (progress.sector === 'venus') return generateVenusSector(progress);
    if (progress.sector === 'mars' && !beltTechnologyReady(progress))
        return generateMarsActSector(progress);
    const def = STORY_SECTORS[progress.sector],
        sector = generateSector(def.seed);
    const earth = progress.sector === 'earth',
        radius = storyRadius(progress),
        rng = random(def.seed ^ 0x5815),
        fieldRng = random(def.seed ^ 0x7010);
    sector.enemies = [];
    sector.caches = [];
    sector.researchSite = { x: 20000, y: 0, name: 'Poza obszarem wyprawy' };
    // Unused legacy structures remain outside the playable sector, without guards or walls.
    sector.outpost = {
        ...sector.outpost,
        x: 12000,
        y: 0,
        terminal: { x: 12200, y: 0 },
        guards: [],
    };
    sector.fortress = { ...sector.fortress, x: 14000, y: 0, walls: [], guards: [] };
    const relay = earth ? { x: 750, y: 650 } : { x: 1700, y: 700 };
    sector.landmarks = [
        {
            x: 1100,
            y: 0,
            name: earth ? 'Złoże orbitalne' : 'Złoże na trasie',
            key: 2,
            kind: 'field',
            radius: 330,
        },
        {
            ...relay,
            name: earth ? 'Przekaźnik orbitalny' : 'Punkt zwiadu księżycowego',
            key: 7,
            kind: 'relay',
            siteId: 'relay',
            radius: 180,
        },
        ...(!earth
            ? [
                  {
                      x: 850,
                      y: -550,
                      name: 'Pozostałości konstrukcji',
                      key: 4,
                      kind: 'wreck' as const,
                      radius: 100,
                  },
              ]
            : []),
    ];
    if (inEarthSystem(progress.sector) && progress.claimed.includes('lunar-survey')) {
        sector.landmarks.push(
            {
                ...MOON.entrance,
                key: 3,
                kind: 'passage',
                name: 'Podejście do Księżyca',
                radius: 160,
            },
            {
                ...MOON.exit,
                area: 'surface',
                key: 1,
                kind: 'passage',
                name: 'Powrót na orbitę',
                radius: 160,
            },
            {
                ...MOON.construction,
                area: 'surface',
                key: 7,
                kind: 'construction',
                siteId: 'archive',
                name: 'Budowa stacji księżycowej',
                radius: 180,
            },
            {
                ...MOON.copperRidge,
                area: 'surface',
                key: 5,
                kind: 'field',
                name: 'Grzbiet miedziowy · Cu',
                radius: 350,
            },
            {
                ...MOON.quarry,
                area: 'surface',
                key: 2,
                kind: 'field',
                name: 'Złoże powierzchniowe',
                radius: 360,
            },
        );
    }
    sector.rocks = Array.from({ length: earth ? 23 : 48 }, (_, i): RockSpec => {
        const angle = rng() * Math.PI * 2,
            distance = 880 + rng() * ((earth ? 1450 : radius) - 1050);
        return {
            x: i < 9 ? 1100 + (fieldRng() - 0.5) * 440 : Math.cos(angle) * distance,
            y: i < 9 ? (fieldRng() - 0.5) * 540 : Math.sin(angle) * distance,
            radius: i < 9 ? 28 : 25 + rng() * 25,
            rich: i % 3 === 0,
            copper: earth ? i % 6 === 1 : undefined,
            crystal: earth ? i % 6 === 4 : i > 12 && i % 11 === 0,
            variant: Math.floor(rng() * 128),
            vx: 0,
            vy: 0,
        };
    }).filter((r) =>
        sector.landmarks
            .filter((l) => l.siteId || l.kind === 'wreck' || l.kind === 'passage')
            .every((l) => Math.hypot(r.x - l.x, r.y - l.y) > r.radius + 220),
    );
    if (inEarthSystem(progress.sector) && progress.claimed.includes('lunar-survey')) {
        // Keep the introductory approach clear; mining fields remain outside this corridor.
        sector.rocks = sector.rocks.filter((r) => {
            const end = MOON.entrance;
            const t = Math.max(
                0,
                Math.min(1, (r.x * end.x + r.y * end.y) / (end.x * end.x + end.y * end.y)),
            );
            return Math.hypot(r.x - t * end.x, r.y - t * end.y) > r.radius + 150;
        });
        const outcrops: { x: number; y: number; radius: number }[] = [];
        const scatter = random(150015);
        for (let i = 0; i < 24; i++) {
            const radius = 24 + rng() * 12;
            let x = 0,
                y = 0;
            for (let attempt = 0; attempt < 256; attempt++) {
                const angle = scatter() * Math.PI * 2,
                    distance = Math.sqrt(scatter()) * 390;
                x = MOON.quarry.x + Math.cos(angle) * distance;
                y = MOON.quarry.y + Math.sin(angle) * distance * 0.85;
                if (
                    outcrops.every(
                        (rock) => Math.hypot(rock.x - x, rock.y - y) > rock.radius + radius + 16,
                    )
                )
                    break;
            }
            outcrops.push({ x, y, radius });
            sector.rocks.push({
                x,
                y,
                radius,
                rich: i % 2 === 0,
                variant: Math.floor(rng() * 128),
                vx: 0,
                vy: 0,
            });
        }
    }
    if (inEarthSystem(progress.sector) && progress.claimed.includes('lunar-survey')) {
        // Irregular, attached outcrops; broken fragments become loose bodies.
        for (let i = 0; i < 12; i++) {
            const angle = rng() * Math.PI * 2;
            const distance = 85 + rng() * 220;
            sector.rocks.push({
                anchored: true,
                x: MOON.copperRidge.x + Math.cos(angle) * distance,
                y: MOON.copperRidge.y + Math.sin(angle) * distance,
                radius: 42 + rng() * 22,
                rich: true,
                copper: true,
                variant: Math.floor(rng() * 128),
                vx: 0,
                vy: 0,
            });
        }
    }
    if (progress.sector === 'mars' && beltTechnologyReady(progress)) {
        sector.landmarks = [
            { x: 1100, y: 0, name: 'Złoże marsjańskie', key: 2, kind: 'field', radius: 330 },
            {
                ...MARS_BASE,
                name: progress.claimed.includes('mars-base-build')
                    ? 'Baza marsjańska'
                    : 'Plac budowy bazy',
                key: 7,
                kind: 'construction',
                radius: 180,
            },
            { x: 850, y: -550, name: 'Pozostałości na trasie', key: 4, kind: 'wreck', radius: 100 },
            {
                x: 4300,
                y: -1700,
                name: 'Pomiary dalszej trasy',
                key: 8,
                kind: 'archive',
                siteId: 'archive',
                radius: 180,
            },
        ];
        for (const body of Object.values(MARS_MOONS)) {
            sector.landmarks.push(
                {
                    ...body.entrance,
                    key: body.id === 'phobos' ? 5 : 9,
                    surfaceBody: body.id,
                    name: `${body.name} · lądowanie`,
                    kind: 'passage',
                    radius: 200,
                },
                {
                    ...body.exit,
                    key: 1,
                    area: 'surface',
                    surfaceBody: body.id,
                    name: `${body.name} · powrót na orbitę`,
                    kind: 'passage',
                    radius: 200,
                },
            );
        }
        const contacts = MARS_CORRIDOR_POINTS;
        sector.enemies = marsCorridorFleet(progress);
        sector.rocks = sector.rocks.filter((r) =>
            [MARS_BASE, ...contacts, ...sector.landmarks.filter((l) => l.siteId)].every(
                (p) => Math.hypot(r.x - p.x, r.y - p.y) > r.radius + 360,
            ),
        );
    }
    if (progress.sector === 'mercury') {
        const expanded = progress.claimed.includes('mercury-survey');
        sector.landmarks = [
            { x: 1100, y: -300, name: 'Złoże przy Merkurym', key: 2, kind: 'field', radius: 300 },
            {
                ...MERCURY_SHELTERS[0],
                name: 'Pomiary podejścia · cień skały',
                key: 7,
                kind: 'relay',
                siteId: 'relay',
                radius: 180,
            },
            {
                ...MERCURY_SHELTERS[0],
                name: 'Bliskie schronienie · skała od strony Słońca',
                key: 3,
                kind: 'field',
                radius: 100,
            },
            {
                ...MERCURY_SHELTERS[1],
                name: 'Schronienie na podejściu',
                key: 4,
                kind: 'field',
                radius: 100,
            },
            ...(expanded
                ? [
                      {
                          ...MERCURY_SHELTERS[2],
                          name: 'Dalsze schronienie',
                          key: 5,
                          kind: 'field' as const,
                          radius: 100,
                      },
                  ]
                : []),
            ...(expanded
                ? [
                      {
                          x: MERCURY_VEINS.x,
                          y: MERCURY_VEINS.y,
                          name: 'Spiek merkuriański · tylko Harpun',
                          key: 6,
                          kind: 'field' as const,
                          radius: MERCURY_VEINS.radius,
                      },
                  ]
                : []),
            ...(progress.claimed.includes('mercury-patrol')
                ? [
                      {
                          ...MERCURY_SHELTERS[2],
                          name: 'Pakiet technologii przejścia',
                          key: 8,
                          kind: 'archive' as const,
                          siteId: 'archive' as const,
                          radius: 180,
                      },
                  ]
                : []),
        ];
        const contacts = [
            { x: 2200, y: -850 },
            { x: 3400, y: 200 },
        ];
        sector.enemies = expanded
            ? contacts.slice(progress.progress['mercury-patrol']).map((point, i) => ({
                  ...point,
                  home: { ...point },
                  id: 8000 + i,
                  kind: (point.x > 3000 ? 'lancer' : 'patrol') as 'lancer' | 'patrol',
                  phase: 0,
                  storyPatrol: true,
              }))
            : [];
        sector.rocks = sector.rocks.filter((r) =>
            [...MERCURY_SHELTERS, ...contacts, MERCURY_VEINS].every(
                (p) => Math.hypot(r.x - p.x, r.y - p.y) > r.radius + 420,
            ),
        );
        for (const point of MERCURY_SHELTERS.slice(0, expanded ? 3 : 2))
            sector.rocks.push({
                x: point.x + 240,
                y: point.y,
                radius: 110,
                rich: false,
                variant: 42,
                vx: 0,
                vy: 0,
            });
        if (expanded)
            sector.rocks.push({
                x: MERCURY_VEINS.x + 250,
                y: MERCURY_VEINS.y,
                radius: 110,
                anchored: true,
                rich: false,
                variant: 45,
                vx: 0,
                vy: 0,
            });
        if (expanded)
            MERCURY_VEINS.nodes.forEach((point, index) =>
                sector.rocks.push({
                    ...point,
                    radius: 26,
                    anchored: true,
                    mercuryVein: true,
                    rich: false,
                    variant: 90 + index,
                    vx: 0,
                    vy: 0,
                }),
            );
    }
    if (progress.sector === 'belt') {
        const surveyed = progress.claimed.includes('belt-survey');
        sector.landmarks = [
            {
                x: 1500,
                y: 0,
                key: 7,
                kind: 'relay',
                siteId: 'relay',
                name: 'Wejście w pas · pomiary trasy',
                radius: 180,
            },
            ...(surveyed
                ? BELT_BARRIERS.filter((_, i) => !progress.claimed.includes(`belt-clear-${i}`)).map(
                      (point) => ({
                          ...point,
                          kind: 'field' as const,
                          name: `Przeszkoda ${point.key - 2} · usuń skałę`,
                          radius: 100,
                      }),
                  )
                : []),
            ...(beltRouteCleared(progress)
                ? [
                      {
                          x: 5200,
                          y: 0,
                          key: 8,
                          kind: 'archive' as const,
                          siteId: 'archive' as const,
                          name: 'Zewnętrzna granica pasa',
                          radius: 180,
                      },
                  ]
                : []),
        ];
        // A readable central lane remains flyable; obstacles are actual destructible bodies.
        // Moving debris crosses the lane rather than permanently sealing it.
        sector.rocks = [];
        for (let i = 0; i < (surveyed ? 150 : 48); i++) {
            const x = 850 + rng() * (surveyed ? 4400 : 1100),
                y = (rng() > 0.5 ? 1 : -1) * (260 + rng() * 650),
                rockRadius = 24 + rng() * 46;
            const safe = [{ x: 1500, y: 0 }, { x: 5200, y: 0 }, ...BELT_BARRIERS];
            if (
                BELT_BARRIERS.some(
                    (p) =>
                        Math.abs(x - p.x) < rockRadius + 140 && Math.abs(y) < Math.abs(p.y) + 120,
                ) ||
                Math.hypot(x, y) > radius - 120 ||
                safe.some((p) => Math.hypot(x - p.x, y - p.y) < rockRadius + 260)
            )
                continue;
            if (sector.rocks.some((r) => Math.hypot(x - r.x, y - r.y) < r.radius + rockRadius + 15))
                continue;
            sector.rocks.push({
                x,
                y,
                radius: rockRadius,
                rich: i % 4 === 0,
                variant: i % 128,
                vx: 0,
                vy: i % 7 === 0 ? (y > 0 ? -12 : 12) : 0,
            });
        }
        if (surveyed)
            BELT_BARRIERS.forEach((point, index) => {
                if (!progress.claimed.includes(`belt-clear-${index}`))
                    sector.rocks.push({
                        ...point,
                        beltBarrier: index,
                        rich: false,
                        variant: 90 + index,
                        vx: 0,
                        vy: 0,
                    });
            });
        sector.enemies = surveyed
            ? [
                  { x: 2900, y: -1400 },
                  { x: 4300, y: 1500 },
              ]
                  .slice(progress.progress['belt-patrol'])
                  .map((point, i) => ({
                      ...point,
                      id: 11000 + i,
                      home: { ...point },
                      phase: 0,
                      kind: 'patrol',
                      storyPatrol: true,
                  }))
            : [];
    }
    if (progress.sector === 'jupiter') {
        const surveyed = progress.claimed.includes('jupiter-survey');
        const contacts = [
            { x: 1500, y: -1300 },
            { x: 2900, y: -1600 },
        ];
        sector.landmarks = [
            { x: 1100, y: 0, key: 2, kind: 'field', name: 'Złoże na podejściu', radius: 330 },
            {
                x: 1600,
                y: 650,
                key: 7,
                kind: 'relay',
                siteId: 'relay',
                name: 'Pomiary podejścia do Jowisza',
                radius: 180,
            },
            {
                x: 850,
                y: -550,
                key: 4,
                kind: 'wreck',
                name: 'Pozostałości na podejściu',
                radius: 100,
            },
            ...(surveyed
                ? [
                      {
                          ...JUPITER_UPLINK.terminal,
                          key: 0,
                          kind: 'cluster' as const,
                          name: 'Terminal chronionego węzła',
                          radius: 100,
                      },
                  ]
                : []),
            ...(jupiterObservationsOpen(progress)
                ? [
                      {
                          x: 5400,
                          y: -900,
                          key: 8,
                          kind: 'archive' as const,
                          siteId: 'archive' as const,
                          name: 'Pakiet obserwacyjny',
                          radius: 180,
                      },
                  ]
                : []),
        ];
        if (surveyed)
            sector.outpost = {
                ...JUPITER_UPLINK,
                terminal: { ...JUPITER_UPLINK.terminal },
                name: 'Chroniony węzeł',
                phase: 0,
                guards: [-1, 1].map((side, i) => ({
                    id: 12010 + i,
                    x: JUPITER_UPLINK.x + 200,
                    y: JUPITER_UPLINK.y + side * 330,
                    home: { x: JUPITER_UPLINK.x, y: JUPITER_UPLINK.y },
                    phase: 0,
                    kind: 'patrol',
                })),
            };
        sector.enemies = surveyed
            ? contacts.slice(progress.progress['jupiter-patrol']).map((point, i) => ({
                  ...point,
                  home: { ...point },
                  id: 12000 + i,
                  phase: 0,
                  kind: point.x > 2000 ? 'lancer' : 'patrol',
                  storyPatrol: true,
              }))
            : [];
        sector.rocks = sector.rocks.filter((r) =>
            [
                JUPITER_UPLINK,
                JUPITER_UPLINK.terminal,
                ...contacts,
                ...sector.landmarks.filter((l) => l.siteId || l.kind === 'wreck'),
            ].every((point) => Math.hypot(r.x - point.x, r.y - point.y) > r.radius + 410),
        );
    }
    if (progress.sector === 'saturn') {
        const surveyed = progress.claimed.includes('saturn-survey');
        const contact = { x: -2200, y: -1100 };
        sector.landmarks = [
            { x: 1100, y: 0, key: 2, kind: 'field', name: 'Bliskie złoże pierścieni', radius: 330 },
            {
                x: 1500,
                y: 650,
                key: 7,
                kind: 'relay',
                siteId: 'relay',
                name: 'Rozpoznanie pierścieni',
                radius: 180,
            },
            {
                x: 800,
                y: -650,
                key: 4,
                kind: 'wreck',
                name: 'Pozostałości w pierścieniach',
                radius: 100,
            },
            ...(surveyed
                ? [
                      {
                          x: 3000,
                          y: 1100,
                          key: 5,
                          kind: 'cluster' as const,
                          name: 'Złoże kryształów w pierścieniach',
                          radius: 220,
                      },
                  ]
                : []),
            ...(saturnRouteOpen(progress)
                ? [
                      {
                          x: 4800,
                          y: -600,
                          key: 8,
                          kind: 'archive' as const,
                          siteId: 'archive' as const,
                          name: 'Węzeł dalszej trasy',
                          radius: 180,
                      },
                  ]
                : []),
        ];
        sector.rocks = [];
        const add = (rock: RockSpec) => {
            if (Math.hypot(rock.x, rock.y) + rock.radius >= radius - 70) return;
            if (
                sector.rocks.some(
                    (r) => Math.hypot(r.x - rock.x, r.y - rock.y) < r.radius + rock.radius + 18,
                )
            )
                return;
            if (
                [contact, ...sector.landmarks.filter((l) => l.siteId || l.kind === 'wreck')].some(
                    (p) => Math.hypot(rock.x - p.x, rock.y - p.y) < rock.radius + 240,
                )
            )
                return;
            sector.rocks.push(rock);
        };
        // The nearby field is calm; the lone combat contact stays on the opposite side.
        for (let i = 0; i < 15; i++)
            add({
                x: 1000 + (i % 5) * 110,
                y: (Math.floor(i / 5) - 1) * 150,
                radius: 36,
                rich: i % 3 === 0,
                variant: i * 7,
                vx: 0,
                vy: 0,
            });
        if (surveyed)
            for (let i = 0; i < 3; i++)
                add({
                    x: 2900 + i * 110,
                    y: 1100,
                    radius: 32,
                    rich: true,
                    crystal: true,
                    variant: 22 + i,
                    vx: 0,
                    vy: 0,
                });
        for (let i = 0; i < (surveyed ? 100 : 45); i++) {
            const angle = rng() * Math.PI * 2,
                band = 700 + rng() * 550;
            add({
                x: 2100 + Math.cos(angle) * band,
                y: Math.sin(angle) * band * 0.75,
                radius: 27 + rng() * 15,
                rich: i % 4 === 0,
                variant: i % 128,
                vx: 0,
                vy: 0,
            });
        }
        sector.enemies =
            surveyed && !progress.claimed.includes('saturn-patrol')
                ? [
                      {
                          ...contact,
                          id: 13000,
                          home: { ...contact },
                          phase: 0,
                          kind: 'patrol',
                          storyPatrol: true,
                      },
                  ]
                : [];
    }
    if (
        progress.sector === 'uranus' ||
        progress.sector === 'neptune' ||
        progress.sector === 'pluto'
    ) {
        const id = progress.sector,
            surveyed = progress.claimed.includes(`${id}-survey`),
            base = OUTER_BASES[id];
        const contacts =
            id !== 'neptune'
                ? [
                      { x: 1500, y: -1300 },
                      { x: 2800, y: -1600 },
                  ]
                : [
                      { x: -1500, y: -1400 },
                      { x: -2400, y: 1000 },
                  ];
        const routeOpen =
            id === 'pluto'
                ? surveyed
                : id === 'uranus'
                  ? outerRouteOpen(progress, id)
                  : progress.claimed.includes('neptune-boss');
        sector.landmarks = [
            { x: 1100, y: 0, key: 2, kind: 'field', name: 'Złoże na podejściu', radius: 330 },
            {
                x: 1500,
                y: 650,
                key: 7,
                kind: 'relay',
                siteId: 'relay',
                name:
                    id === 'pluto'
                        ? 'Zwiad Plutona'
                        : id === 'uranus'
                          ? 'Rozpoznanie rejonu Urana'
                          : 'Zwiad podejścia do Neptuna',
                radius: 180,
            },
            {
                x: 800,
                y: -650,
                key: 4,
                kind: 'wreck',
                name: 'Pozostałości na podejściu',
                radius: 100,
            },
            ...(surveyed
                ? [
                      {
                          ...base.terminal,
                          key: 0,
                          kind: 'cluster' as const,
                          name: 'Terminal chronionej bazy',
                          radius: 100,
                      },
                  ]
                : []),
            ...((id === 'neptune' && progress.claimed.includes('neptune-base')) ||
            (id === 'pluto' && plutoFinaleReady(progress))
                ? [
                      {
                          ...(id === 'pluto' ? PLUTO_ARENA : NEPTUNE_ARENA),
                          key: 3,
                          kind: 'field' as const,
                          name:
                              id === 'pluto'
                                  ? 'Finałowe starcie · G'
                                  : 'Rejon pierwszego starcia · G',
                          radius: 180,
                      },
                  ]
                : []),
            ...(routeOpen || (id === 'pluto' && surveyed)
                ? [
                      {
                          x: id === 'pluto' ? 3800 : id === 'uranus' ? 4900 : 5100,
                          y: id === 'uranus' ? -650 : 1000,
                          key: 8,
                          kind: 'archive' as const,
                          siteId: 'archive' as const,
                          name:
                              id === 'pluto'
                                  ? 'Dodatkowe odczyty'
                                  : id === 'uranus'
                                    ? 'Trasa do Neptuna'
                                    : 'Zewnętrzna trasa',
                          radius: 180,
                      },
                  ]
                : []),
        ];
        if (surveyed)
            sector.outpost = {
                ...base,
                terminal: { ...base.terminal },
                name: 'Chroniona baza',
                phase: 0,
                guards: [-1, 1].map((side, i) => ({
                    id: (id === 'pluto' ? 18010 : id === 'uranus' ? 14010 : 15010) + i,
                    x: base.x + 200,
                    y: base.y + side * 330,
                    home: { x: base.x, y: base.y },
                    phase: 0,
                    kind: 'patrol',
                })),
            };
        sector.enemies = surveyed
            ? contacts.slice(progress.progress[`${id}-patrol`]).map((point, i) => ({
                  ...point,
                  id: (id === 'pluto' ? 18000 : id === 'uranus' ? 14000 : 15000) + i,
                  home: { ...point },
                  phase: 0,
                  kind: id !== 'neptune' && point.x > 2000 ? 'lancer' : 'patrol',
                  storyPatrol: true,
              }))
            : [];
        sector.rocks = sector.rocks.filter((r) =>
            [
                base,
                base.terminal,
                ...contacts,
                ...sector.landmarks.filter((l) => l.siteId || l.kind === 'wreck'),
            ].every((p) => Math.hypot(r.x - p.x, r.y - p.y) > r.radius + 410),
        );
        if (id === 'pluto')
            sector.rocks = sector.rocks.filter(
                (r) => Math.hypot(r.x - PLUTO_ARENA.x, r.y - PLUTO_ARENA.y) > r.radius + 1200,
            );
        if (id === 'neptune')
            sector.rocks = sector.rocks.filter(
                (r) => Math.hypot(r.x - NEPTUNE_ARENA.x, r.y - NEPTUNE_ARENA.y) > r.radius + 1200,
            );
    }
    if (earth) {
        // All ingredients for electronics and the first production upgrade must be
        // reachable in one initial sector, without resetting rocks for the first upgrade.
        const veins = [
            { x: 1060, y: -180, radius: 48, rich: true, copper: true, variant: 2 },
            { x: 1210, y: 150, radius: 48, rich: true, copper: true, variant: 7 },
            { x: 970, y: 300, radius: 32, rich: true, variant: 0 },
            { x: 1120, y: -360, radius: 32, rich: true, variant: 1 },
            { x: 950, y: 420, radius: 32, rich: true, variant: 6 },
            { x: 950, y: -200, radius: 48, rich: false, crystal: true, variant: 71 },
            { x: 1220, y: 330, radius: 48, rich: false, crystal: true, variant: 72 },
        ];
        sector.rocks = sector.rocks.filter((r) =>
            veins.every((p) => Math.hypot(r.x - p.x, r.y - p.y) > r.radius + p.radius + 20),
        );
        for (const vein of veins) sector.rocks.push({ ...vein, vx: 0, vy: 0 });
        const field = sector.landmarks.find((l) => l.key === 2);
        if (field) field.name = 'Złoże pierwiastków';
    }
    if (earth && progress.claimed.includes('earth-relay')) {
        sector.hyperlanes = earthSystemLanes(progress);
        sector.regions = earthSystemZones(progress);
        sector.landmarks = sector.landmarks.filter((l) => l.kind !== 'wreck');
        sector.landmarks.push(
            { ...SATELLITE_FIELD, key: 4, kind: 'field' },
            {
                ...LUNAR_PROBE,
                key: 8,
                kind: 'relay',
                siteId: 'lunarProbe',
                radius: 120,
                name: 'Sonda księżycowa',
            },
        );
        if (progress.claimed.includes('lunar-survey')) {
            sector.landmarks.push({ ...ASTEROID_FIELD, key: 5, kind: 'field' });
            sector.rocks.push(
                {
                    x: ASTEROID_FIELD.x,
                    y: ASTEROID_FIELD.y,
                    radius: 180,
                    rich: true,
                    copper: true,
                    variant: 777,
                    vx: 0.6,
                    vy: 0.3,
                    anchored: true,
                },
                ...driftingField(def.seed ^ 0x7070, ASTEROID_FIELD, sector.hyperlanes),
            );
        }
        sector.rocks = sector.rocks.filter((r) =>
            sector.hyperlanes.every((l) => segmentDistance(r, l.a, l.b) > r.radius + 150),
        );
    }
    // Seeded rejection sampling removes rows, rings and overlapping orbital deposits.
    const placed: RockSpec[] = [];
    for (const original of sector.rocks) {
        let rock = { ...original };
        const surface =
            Math.hypot(rock.x - MOON.center.x, rock.y - MOON.center.y) < MOON.radius + 500;
        if (!surface && rock.beltBarrier === undefined && !rock.anchored) {
            const origin = { ...rock };
            for (let attempt = 0; attempt < 60; attempt++) {
                const candidate = {
                    x: origin.x + (fieldRng() - 0.5) * 130,
                    y: origin.y + (fieldRng() - 0.5) * 130,
                };
                if (
                    placed.some(
                        (r) =>
                            Math.hypot(r.x - candidate.x, r.y - candidate.y) <
                            r.radius + rock.radius + 20,
                    )
                )
                    continue;
                if (
                    sector.hyperlanes.some(
                        (l) => segmentDistance(candidate, l.a, l.b) < rock.radius + 150,
                    )
                )
                    continue;
                rock = { ...rock, ...candidate };
                break;
            }
            const heading = fieldRng() * Math.PI * 2,
                speed = rock.radius >= 100 ? 0.6 + fieldRng() * 1.8 : 3 + fieldRng() * 27;
            rock.vx = Math.cos(heading) * speed;
            rock.vy = Math.sin(heading) * speed;
            delete rock.orbit;
            delete rock.drift;
        }
        if (surface) rock = { ...rock, vx: 0, vy: 0 };
        placed.push(rock);
    }
    sector.rocks = placed;
    return sector;
}
