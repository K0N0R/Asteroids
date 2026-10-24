import { STARTER_MATERIALS } from '../state/stationConstruction';
import type { ResourceId } from '../state/resources';
import { EARTH_MOON_LANE } from '../worlds/moon';
import type RAPIER from '@dimforge/rapier2d-compat';
import { HULLS } from '../config';
import type { Campaign, Cargo } from '../state/campaign';
import { capacity } from '../state/campaign';
import { resourceTotal } from '../state/resources';
import type { Point } from '../worlds/sector';
import { ResearchEscort, type NavigationRock } from './escort';

export interface GuideGoal extends Point {
    id: string;
    title: string;
    message: string;
}
export function earthGuideGoal(c: Campaign, cargo: Cargo): GuideGoal {
    const claimed = c.story!.claimed;
    const home = { x: 400, y: -140 };
    if (claimed.includes('earth-route'))
        return {
            ...home,
            id: 'return',
            title: 'Powrót do stacji',
            message:
                'Trasa potwierdzona. Wracam do Satuk 15. Możesz dokończyć wydobycie lub przygotować wyprawę na Księżyc.',
        };
    if (c.activeRun?.mission?.aborted)
        return {
            ...home,
            id: 'abort',
            title: 'Odwrót',
            message:
                'Wracamy do stacji. Odwrót nie oddaje nieprzekazanego ładunku ani niepotwierdzonych danych.',
        };
    if (c.activeRun?.mission?.task === 'earth-relay' && !claimed.includes('earth-relay'))
        return relay();
    if (!claimed.includes('earth-supply')) {
        const missing = Object.entries(STARTER_MATERIALS).filter(
            ([id, count]) => (c.bank[id as ResourceId] ?? 0) < count,
        );
        if (!missing.length)
            return {
                ...home,
                id: 'laboratory',
                title: 'Laboratorium stacji',
                message:
                    'Materiały są na miejscu. Wróć do Satuk 15 i zamontuj Laboratorium I w Rozbudowie stacji.',
            };
        const cargoCompletes = missing.every(
            ([id, count]) =>
                (c.bank[id as ResourceId] ?? 0) + (cargo[id as ResourceId] ?? 0) >= count,
        );
        if (cargoCompletes || resourceTotal(cargo) >= capacity(c))
            return {
                ...home,
                id: 'delivery',
                title: 'Przekaż ładunek',
                message:
                    'Masz ładunek do przekazania. Przy Satuk 15 wyhamuj poniżej 35 m/s i naciśnij C. Nie musisz dokować; częściowa dostawa też zostanie zapisana.',
            };
        return {
            x: 880,
            y: 0,
            id: 'mining',
            title: 'Wydobycie',
            message:
                'Lecę na skraj złoża. Celuj myszą w skały i wydobywaj prawym przyciskiem. Do Laboratorium potrzebujemy 8 Fe, 2 Cu i 2 Si. Zaczekam, jeśli zostaniesz z tyłu.',
        };
    }
    if (!claimed.includes('earth-relay')) return relay();
    return {
        x: EARTH_MOON_LANE.a.x + 240,
        y: EARTH_MOON_LANE.a.y + 100,
        id: 'moon-gate',
        title: 'Śluza na Księżyc',
        message:
            'Przy śluzie na Księżyc wyhamuj i przytrzymaj F przez 1 sekundę. Prospector może wykonać ten skok. Na miejscu odszukaj sondę księżycową i zsynchronizuj ją przez F.',
    };
}
function relay(): GuideGoal {
    return {
        x: 590,
        y: 650,
        id: 'relay',
        title: 'Przekaźnik orbitalny',
        message:
            'Leć do przekaźnika. Zatrzymaj się, przytrzymaj F i dopasuj trzy kanały. Potwierdzenie przyjdzie przez radio. Ja czekam obok; samo dotarcie mojego statku nie zalicza zadania.',
    };
}

/** A physical instructor. Helps mine; collection and objective delivery remain with the player. */
export class EarthGuide extends ResearchEscort {
    goal: GuideGoal;
    minedOre = 0;
    private rangeReported = false;
    readonly beams: { from: Point; to: Point }[] = [];
    private announced = new Set<string>();
    constructor(world: RAPIER.World, c: Campaign, cargo: Cargo) {
        const goal = earthGuideGoal(c, cargo);
        super(world, { x: goal.x, y: goal.y });
        this.goal = goal;
        this.health = HULLS.prospector.health;
        this.body.setTranslation({ x: 2.6, y: -1.7 }, true);
        this.collider.setCollisionGroups(0x0008fff8);
        this.state = 'travel';
        this.previous = this.position;
    }
    guide(
        dt: number,
        c: Campaign,
        cargo: Cargo,
        player: Point,
        obstacles: readonly NavigationRock[],
        say: (text: string) => void,
    ) {
        this.beams.length = 0;
        if (this.state === 'destroyed') return;
        const goal = earthGuideGoal(c, cargo);
        if (goal.id !== this.goal.id) {
            this.goal = goal;
            this.setDestination(goal);
            this.state = 'travel';
        }
        this.once(goal.id, goal.message, say);
        if (this.state === 'complete') {
            super.update(dt, player, obstacles, true);
            return;
        }
        const returning = goal.id === 'return' || goal.id === 'abort';
        super.update(dt, returning || this.rangeReported ? this.position : player, obstacles, true);
        if (this.waitingReason === 'player') this.rangeReported = true;
        if (returning && this.state === 'research') {
            this.state = 'complete';
            this.collider.setSensor(true);
            this.body.setLinvel({ x: 0, y: 0 }, true);
        }
    }
    private once(id: string, message: string, say: (text: string) => void) {
        if (this.announced.has(id)) return;
        this.announced.add(id);
        say(message);
    }
    approachMining(point: Point) {
        if (this.goal.id !== 'mining' || this.state !== 'research') return;
        this.setDestination(point);
        this.state = 'travel';
    }
    get status() {
        if (this.state === 'destroyed')
            return 'Instruktor utracony · zadania możesz kontynuować samodzielnie';
        if (this.state === 'complete') return 'Instruktor wrócił do Satuk 15';
        if (this.waitingReason === 'player') return 'Instruktor czeka na kontakt · V pozycja';
        if (this.waitingReason === 'route') return 'Instruktor szuka przejścia · V pozycja';
        return `Instruktor · ${this.goal.title} · ${this.beams.length ? 'wydobywa' : this.state === 'research' ? 'czeka przy celu' : 'prowadzi'} · V pozycja`;
    }
}
