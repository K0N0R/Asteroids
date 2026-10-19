import type { Campaign } from './campaign';
import { capacity } from './campaign';
import type { MissionSimulation } from '../systems/mission';
import { RESOURCE_IDS, resourceTotal, type ResourceId } from './resources';
import { recordCargoDelivery } from './earthLogistics';
import { REPAIR_KITS } from '../config';

/** Physical access is rechecked on each transaction; the two station banks never alias. */
export function transferLunarResource(
    c: Campaign,
    sim: MissionSimulation,
    id: ResourceId,
    amount: number,
    withdraw = false,
) {
    if (
        !sim.canUseLunarStationFor(c) ||
        !c.activeRun ||
        !RESOURCE_IDS.includes(id) ||
        !Number.isSafeInteger(amount) ||
        amount <= 0
    )
        return false;
    const source = withdraw ? c.lunarStation.bank : sim.cargo;
    const target = withdraw ? sim.cargo : c.lunarStation.bank;
    if (
        (source[id] ?? 0) < amount ||
        !Number.isSafeInteger((target[id] ?? 0) + amount) ||
        (withdraw && resourceTotal(sim.cargo) + amount > capacity(c))
    )
        return false;
    if (withdraw && !Number.isSafeInteger((c.activeRun.freight?.[id] ?? 0) + amount)) return false;
    source[id] = (source[id] ?? 0) - amount;
    target[id] = (target[id] ?? 0) + amount;
    if (withdraw) {
        c.activeRun.freight ??= { ore: 0, parts: 0 };
        c.activeRun.freight[id] = (c.activeRun.freight[id] ?? 0) + amount;
    } else recordCargoDelivery(c, { ore: 0, parts: 0, [id]: amount });
    sim.deliveryRevision++;
    return true;
}
export function takeLunarRepairKit(c: Campaign, sim: MissionSimulation) {
    if (
        !sim.canUseLunarStationFor(c) ||
        !c.activeRun ||
        sim.hullId === 'mule' ||
        c.lunarStation.repairKits < 1 ||
        sim.repairKits >= REPAIR_KITS.embarkKits
    )
        return false;
    c.lunarStation.repairKits--;
    sim.repairKits++;
    c.activeRun.repairKits = sim.repairKits;
    sim.deliveryRevision++;
    return true;
}
