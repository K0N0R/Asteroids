import { PART_FAMILIES, TIER_NAMES, type PartFamily } from './partTiers';
import { RESOURCES, type ResourceStore } from './resources';
import type { ProcessRecipe } from './chemistry';
export type AdvancedRecipeId = `${PartFamily}${'II' | 'III'}`;
const materials: Record<PartFamily, [ResourceStore, ResourceStore]> = {
    plating: [
        {
            steel: 2,
            siliconCarbide: 1,
            stabilizedAnomaly: 1,
        },
        {
            steel: 3,
            siliconCarbide: 2,
            alumina: 1,
            resonantComposite: 1,
        },
    ],
    lightPlating: [
        {
            aluminiumAlloy: 2,
            alumina: 1,
            stabilizedAnomaly: 1,
        },
        {
            aluminiumAlloy: 3,
            siliconCarbide: 1,
            alumina: 2,
            resonantComposite: 1,
        },
    ],
    electronics: [
        {
            crystals: 2,
            copperOre: 2,
            siliconCarbide: 1,
            stabilizedAnomaly: 1,
        },
        {
            crystals: 3,
            copperOre: 3,
            siliconCarbide: 1,
            alumina: 1,
            resonantComposite: 1,
        },
    ],
    machinery: [
        {
            steel: 3,
            aluminiumAlloy: 1,
            stabilizedAnomaly: 1,
        },
        {
            steel: 4,
            aluminiumAlloy: 2,
            siliconCarbide: 1,
            resonantComposite: 1,
        },
    ],
    lifeSupport: [
        {
            steel: 1,
            water: 2,
            oxygen: 2,
            alumina: 1,
            stabilizedAnomaly: 1,
        },
        {
            steel: 2,
            water: 2,
            oxygen: 3,
            alumina: 2,
            resonantComposite: 1,
        },
    ],
    propulsion: [
        {
            steel: 2,
            aluminiumAlloy: 1,
            copperOre: 2,
            siliconCarbide: 1,
            stabilizedAnomaly: 1,
        },
        {
            aluminiumAlloy: 3,
            steel: 2,
            copperOre: 2,
            siliconCarbide: 2,
            resonantComposite: 1,
        },
    ],
    power: [
        {
            copperOre: 3,
            crystals: 1,
            alumina: 1,
            stabilizedAnomaly: 1,
        },
        {
            copperOre: 4,
            crystals: 2,
            alumina: 2,
            resonantComposite: 1,
        },
    ],
};
export const ADVANCED_RECIPES = Object.fromEntries(
    (Object.keys(PART_FAMILIES) as PartFamily[]).flatMap((family) =>
        [2, 3].map((tier) => {
            const output = PART_FAMILIES[family][tier - 1];
            return [
                `${family}${TIER_NAMES[tier - 1]}`,
                {
                    title: RESOURCES[output].name,
                    category: 'workshop',
                    inputs: materials[family][tier - 2],
                    output,
                    amount: 1,
                    level: tier,
                    explanation:
                        'Zaawansowane materiały i precyzyjny montaż tworzą podzespół gotowy do instalacji.',
                },
            ];
        }),
    ),
) as Record<AdvancedRecipeId, ProcessRecipe>;
