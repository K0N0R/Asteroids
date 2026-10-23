import type { Campaign } from './campaign';
import { canAffordEquipment, spendEquipment } from './equipmentCosts';
import {
    LABORATORY_CONSTRUCTION,
    WORKSHOP_CONSTRUCTION,
    EXTRACTION_CONSTRUCTION,
} from './stationConstruction';
import type { ResourceStore } from './resources';

export type StationProject = 'laboratory' | 'workshop' | 'extraction';
export function stationProjectLevel(c: Campaign, project: StationProject) {
    return project === 'laboratory'
        ? c.station.laboratoryLevel
        : project === 'workshop'
          ? c.station.workshopLevel
          : Number(c.station.extraction);
}
export function stationProjectCost(c: Campaign, project: StationProject): ResourceStore {
    const level = stationProjectLevel(c, project);
    return project === 'extraction'
        ? EXTRACTION_CONSTRUCTION
        : ((project === 'laboratory' ? LABORATORY_CONSTRUCTION : WORKSHOP_CONSTRUCTION)[level] ??
              {});
}
/** One authority for UI, scripted actions, and atomic installation. */
export function stationProjectLock(
    c: Campaign,
    project: StationProject,
    materials = true,
): string | null {
    if (!['laboratory', 'workshop', 'extraction'].includes(project)) return 'Nieznany projekt.';
    if (c.activeRun) return 'Montaż po powrocie do Satuk 15.';
    const level = stationProjectLevel(c, project),
        next = level + 1;
    if (level >= (project === 'extraction' ? 1 : 3)) return 'Najwyższy poziom urządzenia.';
    const claimed = c.story?.claimed;
    if (project === 'extraction') {
        if (c.station.workshopLevel < 1) return 'Wymagany Warsztat I.';
        if (claimed && !claimed.includes('mercury-technology'))
            return 'Najpierw technologia z Merkurego.';
    } else if (project === 'workshop') {
        if (c.station.laboratoryLevel < next)
            return `Najpierw Laboratorium ${['I', 'II', 'III'][next - 1]}.`;
        if (next === 1 && claimed && !claimed.includes('lunar-attack'))
            return 'Najpierw zakończ misję księżycową.';
    } else if (next > 1) {
        if (c.station.workshopLevel < level) return 'Najpierw Warsztat poprzedniego poziomu.';
        if (next === 2 && claimed && !claimed.includes('mercury-technology'))
            return 'Najpierw technologia z Merkurego.';
        if (next === 2 && (!c.station.extraction || !c.station.anomalySampleDelivered))
            return 'Zamontuj adapter i dostarcz pierwszą próbkę anomalii.';
        if (next === 3 && claimed && !claimed.includes('jupiter-observations'))
            return 'Najpierw pakiet badawczy Jowisza.';
    }
    return materials && !canAffordEquipment(c.bank, stationProjectCost(c, project))
        ? 'Brakuje materiałów do montażu.'
        : null;
}
export function installStationProject(c: Campaign, project: StationProject) {
    if (stationProjectLock(c, project) || !spendEquipment(c.bank, stationProjectCost(c, project)))
        return false;
    if (project === 'laboratory') c.station.laboratoryLevel++;
    else if (project === 'workshop') c.station.workshopLevel++;
    else c.station.extraction = true;
    return true;
}
