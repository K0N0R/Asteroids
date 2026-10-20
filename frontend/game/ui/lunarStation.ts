import { Container, Graphics } from 'pixi.js';
import type { Campaign } from '../state/campaign';
import { capacity } from '../state/campaign';
import type { MissionSimulation } from '../systems/mission';
import { manufacture, type ProductionScope } from '../state/production';
import { transferLunarResource } from '../state/lunarIndustry';
import { RESOURCE_IDS, RESOURCES, resourceTotal, type ResourceId } from '../state/resources';
import { RECIPES, type RecipeId } from '../state/chemistry';
import { itemIllustration } from '../graphics/items';
import { C } from '../graphics/shapes';
import { button, label, panel, clear, illustrationInBox } from './primitives';
import { laboratoryOverview, workshopOverview } from './production';

export class LunarStationView extends Container {
    private tab: 'laboratory' | 'workshop' | 'warehouse' = 'warehouse';
    private recipe: RecipeId = 'water';
    private recipeHistory: RecipeId[] = [];
    private item: ResourceId = 'ore';
    private page = 0;
    private readonly scope: ProductionScope;
    constructor(
        private c: Campaign,
        private sim: MissionSimulation,
        private close: () => void,
        private save: () => void,
    ) {
        super();
        this.scope = { site: 'lunar', canAccess: () => sim.canUseLunarStationFor(c) };
        this.refresh();
    }
    private change(action: () => boolean) {
        if (action()) this.save();
        this.refresh();
    }
    private refresh() {
        clear(this);
        this.addChild(new Graphics().rect(0, 0, 1600, 900).fill(C.ink));
        label(this, 'BAZA\nKSIĘŻYCOWA', 28, 38, 22, C.text, 180);
        label(this, 'PRODUKCJA NA MIEJSCU', 28, 112, 10, C.mint);
        label(this, 'POSTÓJ PRZY PLACÓWCE', 280, 46, 12, C.mint);
        const title = {
            laboratory: 'Laboratorium',
            workshop: 'Warsztat',
            warehouse: 'Magazyn księżycowy',
        }[this.tab];
        label(this, title, 280, 105, 34, C.text);
        label(this, 'Zapasy i produkcja tej placówki', 280, 158, 17, C.muted);
        const tabs = [
            { id: 'laboratory', name: 'Laboratorium' },
            { id: 'workshop', name: 'Warsztat' },
            { id: 'warehouse', name: 'Magazyn' },
        ] as const;
        tabs.forEach((tab, i) =>
            button(
                this,
                tab.name,
                18,
                210 + i * 58,
                190,
                () => {
                    this.recipeHistory = [];
                    this.tab = tab.id;
                    this.recipe = tab.id === 'workshop' ? 'plating' : 'water';
                    this.refresh();
                },
                this.tab === tab.id,
                true,
                44,
                16,
            ),
        );
        button(this, 'WRÓĆ DO STATKU', 18, 750, 190, this.close, true, true, 44, 14);
        label(this, 'Satuk 15 ma osobny magazyn.', 28, 818, 12, C.muted, 180);
        panel(this, 1040, 214, 520, 591);
        if (this.tab === 'warehouse') {
            this.warehouse();
            return;
        }
        const actions = {
            manufacture: (id: RecipeId, n: number) =>
                this.change(() => manufacture(this.c, id, n, this.scope)),
        };
        const select = (id: RecipeId) => {
            this.recipe = id;
            this.refresh();
        };
        const showRecipe = (id: RecipeId) => {
            this.recipe = id;
            this.tab = RECIPES[id].category;
            this.refresh();
        };
        const navigation = {
            openRecipe: (id: RecipeId) => {
                this.recipeHistory.push(this.recipe);
                showRecipe(id);
            },
            back: this.recipeHistory.length
                ? () => showRecipe(this.recipeHistory.pop()!)
                : undefined,
        };
        if (this.tab === 'laboratory')
            laboratoryOverview(this, this.c, actions, this.recipe, select, this.scope, navigation);
        else workshopOverview(this, this.c, actions, this.recipe, select, this.scope, navigation);
    }
    private warehouse() {
        const { c, sim } = this,
            bank = c.lunarStation.bank;
        const ids = RESOURCE_IDS.filter((id) => (bank[id] ?? 0) > 0 || (sim.cargo[id] ?? 0) > 0);
        const pages = Math.max(1, Math.ceil(ids.length / 10));
        this.page = Math.min(this.page, pages - 1);
        if (ids.length && !ids.includes(this.item)) this.item = ids[0];
        panel(this, 280, 214, 735, 591);
        label(this, 'ZASÓB', 304, 245, 13, C.mint);
        label(this, 'W BAZIE', 742, 245, 13, C.mint);
        label(this, 'NA STATKU', 868, 245, 13, C.mint);
        if (!ids.length) {
            illustrationInBox(this, itemIllustration('parts'), 500, 325, 280, 170);
            label(this, 'Magazyn czeka na pierwszą dostawę.', 345, 540, 22, C.text, 600);
            label(
                this,
                'Przywieź pierwiastki i części. Zapasy pozostaną na Księżycu po odlocie.',
                345,
                585,
                17,
                C.muted,
                590,
            );
        }
        ids.slice(this.page * 10, this.page * 10 + 10).forEach((id, i) => {
            const y = 284 + i * 39;
            button(
                this,
                RESOURCES[id].name,
                346,
                y,
                365,
                () => {
                    this.item = id;
                    this.refresh();
                },
                this.item === id,
                true,
                32,
                15,
            );
            illustrationInBox(this, itemIllustration(id), 304, y, 28, 28);
            label(this, `${bank[id] ?? 0}`, 742, y + 6, 16, C.cyan);
            label(this, `${sim.cargo[id] ?? 0}`, 868, y + 6, 16, C.text);
        });
        if (pages > 1) {
            button(
                this,
                '←',
                304,
                693,
                64,
                () => {
                    this.page--;
                    this.refresh();
                },
                false,
                this.page > 0,
                30,
            );
            label(this, `${this.page + 1} / ${pages}`, 620, 700, 14, C.muted);
            button(
                this,
                '→',
                922,
                693,
                64,
                () => {
                    this.page++;
                    this.refresh();
                },
                false,
                this.page + 1 < pages,
                30,
            );
        }
        label(this, `Dostępne zestawy naprawcze: ${c.repairKits}`, 304, 752, 16, C.muted);
        const id = this.item,
            held = sim.cargo[id] ?? 0,
            stored = bank[id] ?? 0;
        label(this, RESOURCES[id].name, 1072, 245, 25, C.text, 456);
        illustrationInBox(this, itemIllustration(id), 1110, 310, 370, 180);
        label(this, `W bazie: ${stored}`, 1072, 520, 20, C.cyan);
        label(
            this,
            `Na statku: ${held} · ładownia ${resourceTotal(sim.cargo)}/${capacity(c)}`,
            1072,
            558,
            17,
            C.muted,
            456,
        );
        const free = Math.max(0, capacity(c) - resourceTotal(sim.cargo));
        [1, 5, 'all'].forEach((n, i) => {
            const deposit = n === 'all' ? held : Number(n),
                withdraw = n === 'all' ? Math.min(stored, free) : Number(n);
            button(
                this,
                `ODŁÓŻ ${n === 'all' ? 'WSZYSTKO' : n}`,
                1072 + i * 155,
                628,
                146,
                () => this.change(() => transferLunarResource(c, sim, id, deposit)),
                false,
                sim.canUseLunarStation && held >= deposit && deposit > 0,
                40,
                12,
            );
            button(
                this,
                `ZABIERZ ${n === 'all' ? 'MAKS.' : n}`,
                1072 + i * 155,
                686,
                146,
                () => this.change(() => transferLunarResource(c, sim, id, withdraw, true)),
                false,
                sim.canUseLunarStation && stored >= withdraw && free >= withdraw && withdraw > 0,
                40,
                12,
            );
        });
    }
}
