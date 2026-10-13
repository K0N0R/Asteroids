import { CONTRACTS, SCAN_SITES, ScanSiteId } from '../config';
import type { Campaign, Cargo } from './campaign';

export function contractLockReason(c: Campaign, id: number): string {
    if (!Number.isInteger(id) || !CONTRACTS[id]) return 'Nieznany kontrakt';
    const contract = CONTRACTS[id];
    if (contract.unlock === 'return' && c.recovered < 1) return 'Wróć raz do bazy';
    if (contract.unlock === 'research') {
        if (!c.contractCompletions[2]) return 'Wykonaj Nasłuch sektora';
        if (c.station.workshop < 1) return 'Wymagany warsztat I';
    }
    return '';
}

export function selectContract(c: Campaign, id: number): boolean {
    if (c.activeRun || contractLockReason(c, id)) return false;
    c.contract = id;
    return true;
}

export function contractReady(id: number, cargo: Cargo, data: readonly ScanSiteId[] = []) {
    const contract = CONTRACTS[id];
    return (
        !!contract &&
        cargo.ore >= contract.ore &&
        cargo.parts >= contract.parts &&
        contract.sites.every((site) => data.includes(site))
    );
}

export function contractProgress(id: number, cargo: Cargo, data: readonly ScanSiteId[]) {
    const contract = CONTRACTS[id];
    if (contractReady(id, cargo, data)) return '✓ Cel wykonany · wróć do bazy';
    if (contract.sites.length)
        return contract.sites
            .map((site) => `${data.includes(site) ? '✓' : '○'} ${SCAN_SITES[site].name}`)
            .join('\n');
    return `Ruda ${cargo.ore}/${contract.ore}\nKomponenty ${cargo.parts}/${contract.parts}`;
}
