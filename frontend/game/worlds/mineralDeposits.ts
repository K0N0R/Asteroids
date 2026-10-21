import { ELEMENT_IDS, type ElementId, type ResourceStore } from '../state/resources';
import { MERCURY_VEINS } from './mercuryVeins';

export interface MineralSpec {
    radius: number;
    variant: number;
    rich: boolean;
    copper?: boolean;
    crystal?: boolean;
    mercuryVein?: boolean;
    defense?: boolean;
}
export interface MineralDeposit {
    readonly name: string;
    /** Recoverable game portions, including every descendant fragment. Not mass percentages. */
    readonly total: Readonly<ResourceStore>;
    readonly loose: Readonly<ResourceStore>;
    readonly fragments: readonly { spec: MineralSpec; deposit: MineralDeposit }[];
}
const TRACES: readonly ElementId[] = ['carbon', 'oxygen', 'aluminium', 'magnesium', 'nitrogen'];
const TRACE_NAMES = ['węgla', 'tlenu', 'glinu', 'magnezu', 'azotu'];
export const MINERAL_SCAN_RANGE = 950;

/** Resolve the complete deposit once. Fracturing reveals stored contents, never rolls new ones. */
export function mineralDeposit(spec: MineralSpec): MineralDeposit {
    const copper = spec.copper ?? (spec.rich && !spec.crystal && spec.variant % 5 === 2);
    const loose: ResourceStore = {};
    const fragments: { spec: MineralSpec; deposit: MineralDeposit }[] = [];
    const trace = ((spec.variant % 5) + 5) % 5;
    const name = spec.defense
        ? 'Skała obrony — bez urobku'
        : spec.mercuryVein
          ? 'Złoże tytanu — wymagany Harpun'
          : spec.crystal
            ? 'Złoże krzemu i wodoru'
            : copper
              ? 'Złoże miedzi i żelaza'
              : spec.rich
                ? `Żelazo z domieszką ${TRACE_NAMES[trace]}`
                : 'Złoże żelaza i minerałów tlenowych';
    if (spec.defense)
        return Object.freeze({
            name,
            loose: Object.freeze(loose),
            total: Object.freeze({}),
            fragments: Object.freeze(fragments),
        });
    if (spec.mercuryVein) loose.mercuryOre = MERCURY_VEINS.yield;
    else {
        const count = Math.ceil(spec.radius / 17);
        // Oxygen-bearing minerals are common feedstock, not a rare bonus replacing iron.
        loose.ore = count;
        loose.oxygen = count;
        loose.carbon = Math.max(1, Math.ceil(count / 2));
        const traceYield = spec.rich ? Math.max(1, Math.ceil(count / 2)) : 1;
        loose[TRACES[trace]] = (loose[TRACES[trace]] ?? 0) + traceYield;
        if (spec.radius <= 44) {
            if (copper) loose.copperOre = 4;
            if (spec.crystal) {
                loose.crystals = 4;
                loose.hydrogen = 4;
            }
        } else
            for (const side of [-1, 1]) {
                const child: MineralSpec = {
                    radius: spec.radius * 0.43,
                    variant: (spec.variant * 7 + (side > 0 ? 3 : 1)) % 128,
                    rich: spec.rich,
                    copper,
                    crystal: spec.crystal,
                };
                fragments.push({ spec: Object.freeze(child), deposit: mineralDeposit(child) });
            }
    }
    const total: ResourceStore = { ...loose };
    for (const { deposit } of fragments)
        for (const id of ELEMENT_IDS)
            if (deposit.total[id]) total[id] = (total[id] ?? 0) + deposit.total[id]!;
    return Object.freeze({
        name,
        total: Object.freeze(total),
        loose: Object.freeze(loose),
        fragments: Object.freeze(fragments),
    });
}

/** The instructor only extracts a small sample; the unmined body retains everything else. */
export function mineralSample(deposit: MineralDeposit, limit: number) {
    const count = Math.min(Math.max(0, Math.floor(limit)), deposit.total.ore ?? 0);
    const rest = { ...deposit.total, ore: (deposit.total.ore ?? 0) - count };
    return {
        count,
        rest: Object.freeze({
            name: deposit.name,
            total: Object.freeze(rest),
            loose: Object.freeze(rest),
            fragments: Object.freeze([]),
        }) satisfies MineralDeposit,
    };
}
