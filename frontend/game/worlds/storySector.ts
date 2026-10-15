import { generateSector, random, type RockSpec } from './sector';
import { storyRadius, marsApproachOpen, STORY_SECTORS, type StoryProgress } from '../state/story';
import { MOON } from './moon';

export function generateStorySector(progress: StoryProgress) {
    const def = STORY_SECTORS[progress.sector],
        sector = generateSector(def.seed);
    const earth = progress.sector === 'earth',
        radius = storyRadius(progress),
        rng = random(def.seed ^ 0x5815);
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
        ...(earth && radius > 1450
            ? [
                  {
                      x: -1750,
                      y: 700,
                      name: 'Węzeł dalszej orbity',
                      key: 8,
                      kind: 'archive' as const,
                      siteId: 'archive' as const,
                      radius: 180,
                  },
              ]
            : []),
        { x: 850, y: -550, name: 'Pozostałości konstrukcji', key: 4, kind: 'wreck', radius: 100 },
    ];
    if (progress.sector === 'lunar' && progress.claimed.includes('lunar-survey')) {
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
                name: 'Budowa stacji paliw',
                radius: 180,
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
            distance = 880 + rng() * (radius - 1050);
        return {
            x: i < 9 ? 1040 + (i % 3) * 100 : Math.cos(angle) * distance,
            y: i < 9 ? (Math.floor(i / 3) - 1) * 140 : Math.sin(angle) * distance,
            radius: i < 9 ? 28 : 25 + rng() * 25,
            rich: i % 3 === 0,
            crystal: i > 12 && i % 11 === 0,
            variant: Math.floor(rng() * 128),
            vx: 0,
            vy: 0,
        };
    }).filter((r) =>
        sector.landmarks
            .filter((l) => l.siteId || l.kind === 'wreck' || l.kind === 'passage')
            .every((l) => Math.hypot(r.x - l.x, r.y - l.y) > r.radius + 220),
    );
    if (progress.sector === 'lunar' && progress.claimed.includes('lunar-survey')) {
        // Keep the introductory approach clear; mining fields remain outside this corridor.
        sector.rocks = sector.rocks.filter((r) => {
            const end = MOON.entrance;
            const t = Math.max(
                0,
                Math.min(1, (r.x * end.x + r.y * end.y) / (end.x * end.x + end.y * end.y)),
            );
            return Math.hypot(r.x - t * end.x, r.y - t * end.y) > r.radius + 150;
        });
        for (let i = 0; i < 24; i++) {
            const angle = i * 2.4,
                distance = 140 + (i % 4) * 60;
            sector.rocks.push({
                x: MOON.quarry.x + Math.cos(angle) * distance,
                y: MOON.quarry.y + Math.sin(angle) * distance,
                radius: 24 + rng() * 12,
                rich: i % 2 === 0,
                variant: Math.floor(rng() * 128),
                vx: 0,
                vy: 0,
            });
        }
    }
    if (progress.sector === 'mars') {
        sector.landmarks = [
            { x: 1100, y: 0, name: 'Złoże podejścia', key: 2, kind: 'field', radius: 330 },
            {
                x: 1300,
                y: 1100,
                name: 'Przekaźnik trasy pościgu',
                key: 7,
                kind: 'relay',
                siteId: 'relay',
                radius: 180,
            },
            { x: 850, y: -550, name: 'Pozostałości na trasie', key: 4, kind: 'wreck', radius: 100 },
            ...(marsApproachOpen(progress)
                ? [
                      {
                          x: 3600,
                          y: 600,
                          name: 'Pas asteroid · przelot zablokowany',
                          key: 8,
                          kind: 'archive' as const,
                          siteId: 'archive' as const,
                          radius: 180,
                      },
                  ]
                : []),
        ];
        const contacts = [
            { x: -1600, y: -800 },
            { x: -1900, y: 900 },
        ];
        const remaining = Math.max(0, 2 - progress.progress['mars-patrol']);
        sector.enemies = contacts.slice(0, remaining).map((point, i) => ({
            ...point,
            home: { ...point },
            id: 7000 + i,
            phase: 0,
            kind: 'patrol',
            storyPatrol: true,
        }));
        sector.rocks = sector.rocks.filter((r) =>
            [...sector.landmarks.filter((l) => l.siteId), ...contacts].every(
                (p) => Math.hypot(r.x - p.x, r.y - p.y) > r.radius + 330,
            ),
        );
    }
    if (progress.sector === 'venus') {
        sector.landmarks = [
            { x: 1100, y: 0, name: 'Złoże przy Wenus', key: 2, kind: 'field', radius: 330 },
            {
                x: -1300,
                y: 800,
                name: 'Przekaźnik orbity Wenus',
                key: 7,
                kind: 'relay',
                siteId: 'relay',
                radius: 180,
            },
            {
                x: 850,
                y: -550,
                name: 'Pozostałości na orbicie',
                key: 4,
                kind: 'wreck',
                radius: 100,
            },
            ...(progress.claimed.includes('venus-survey')
                ? [
                      {
                          x: 2700,
                          y: -1100,
                          name: progress.claimed.includes('venus-build')
                              ? 'Placówka badawcza Wenus'
                              : 'Miejsce pod placówkę',
                          key: 8,
                          kind: 'archive' as const,
                          siteId: 'archive' as const,
                          radius: 180,
                      },
                  ]
                : []),
        ];
        sector.rocks = sector.rocks.filter((r) =>
            sector.landmarks
                .filter((l) => l.siteId)
                .every((l) => Math.hypot(r.x - l.x, r.y - l.y) > r.radius + 360),
        );
    }
    return sector;
}
