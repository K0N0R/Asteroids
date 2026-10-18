import { salvagePosition, type SalvageFleet, type SalvageBody } from './salvage';
import { ANOMALY } from './anomalyField';
import { RescueRepair } from './rescueRepair';
import type { Point } from '../worlds/sector';

export const RESCUE_OPERATION = {
    id: -90001,
    site: { x: 1450, y: -1100 },
    range: 170,
    attachSeconds: 3,
} as const;
export class RescueOperation {
    readonly item: SalvageBody;
    stabilized = false;
    delivered = false;
    repair: RescueRepair | null = null;
    attachProgress = 0;
    interactHeld = false;
    private lastPosition: Point = { ...RESCUE_OPERATION.site };
    constructor(
        private fleet: SalvageFleet,
        readonly probe = false,
    ) {
        this.item = fleet.add(
            RESCUE_OPERATION.id,
            'recovery',
            probe ? ANOMALY.probe : RESCUE_OPERATION.site,
            { x: 0, y: 0 },
            -0.7,
        )!;
        this.item.health = 80;
        this.stabilized = probe;
    }
    get name() {
        return this.probe ? 'Sonda' : 'Prom';
    }
    get siteId() {
        return this.probe ? ('anomaly' as const) : ('rescue' as const);
    }
    get state() {
        if (this.delivered) return 'delivered';
        if (!this.fleet.items.has(this.item.id)) return 'destroyed';
        if (this.fleet.towing.has(this.item.id)) return 'towing';
        return this.repair ? 'repair' : this.stabilized ? 'ready' : 'distress';
    }
    get position() {
        if (this.fleet.items.has(this.item.id)) this.lastPosition = salvagePosition(this.item);
        return this.lastPosition;
    }
    get status() {
        if (this.probe) {
            switch (this.state) {
                case 'delivered':
                    return 'Sonda dostarczona do Satuk 15 · raport przez radio';
                case 'destroyed':
                    return 'Sonda utracona · TAB: odwrót i ponowienie wyprawy';
                case 'towing':
                    return 'Sonda na holu · wróć korytarzem 5/4/3 do Satuk 15 · J: odłącz';
                default:
                    return 'N: sonda · 3/4/5: bezpieczny objazd · E przez 3 s: hol';
            }
        }
        switch (this.state) {
            case 'delivered':
                return 'Prom dostarczony do Satuk 15 · wróć z raportem';
            case 'destroyed':
                return 'Prom ratunkowy utracony · TAB: odwrót i ponowienie wyprawy';
            case 'towing':
                return 'Prom na holu · wróć do Satuk 15 · J: odłącz hol';
            case 'repair':
                return 'Zabezpieczanie obwodów promu · świat nadal działa';
            case 'ready':
                return 'Prom zabezpieczony · podejdź i przytrzymaj E przez 3 s, aby podłączyć hol';
            default:
                return 'Sygnał SOS · N: prom · E przy promie: zabezpiecz obwody';
        }
    }
}
