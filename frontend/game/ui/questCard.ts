import { CanvasTextMetrics, Container, Graphics, TextStyle } from 'pixi.js';
import type { Campaign } from '../state/campaign';
import { RECIPES, RECIPE_IDS, type RecipeId } from '../state/chemistry';
import { RESOURCES, type ResourceId } from '../state/resources';
import { storyRewardText, storyTaskAvailable, type StoryTask } from '../state/story';
import { itemIllustration } from '../graphics/items';
import { C } from '../graphics/shapes';
import { button, illustrationInBox, label, panel } from './primitives';

export interface QuestCardActions {
    openRecipe?: (id: RecipeId) => void;
    openDestination?: (tab: 'station' | 'hangar') => void;
    contribute?: (id: string) => void;
    briefing?: () => void;
}

const WIDTH = 725;
const PADDING = 24;
const TABLE_WIDTH = 318;
const COLUMN_GAP = 28;

/** Match Typography's doubled font and wrap width before its 0.5 display scale. */
function textHeight(text: string, width: number, size: number) {
    if (!text) return 0;
    return (
        CanvasTextMetrics.measureText(
            text,
            new TextStyle({
                fontFamily: 'Trebuchet MS',
                fontSize: size * 2,
                lineHeight: size * 2,
                fontWeight: size >= 23 ? '600' : '400',
                wordWrap: true,
                wordWrapWidth: width * 2,
            }),
        ).height / 2
    );
}

export function questCardLayout(c: Campaign, task: StoryTask, actions: QuestCardActions) {
    const p = c.story!;
    const complete = p.claimed.includes(task.id);
    const items = complete
        ? []
        : (
              task.deliveryItems?.map((item) => ({
                  resource: item.resource,
                  have: p.progress[item.id],
                  need: item.target,
              })) ??
              (task.requirements
                  ? Object.entries(task.requirements).map(([id, need]) => ({
                        resource: id as ResourceId,
                        have:
                            task.id === 'earth-supply' && p.claimed.includes('earth-materials')
                                ? need
                                : (c.bank[id as ResourceId] ?? 0),
                        need,
                    }))
                  : task.kind === 'delivery' && task.resource
                    ? [{ resource: task.resource, have: p.progress[task.id], need: task.target }]
                    : [])
          ).map((item) => {
              const recipe = actions.openRecipe
                  ? RECIPE_IDS.find((id) => RECIPES[id].output === item.resource)
                  : undefined;
              const nameHeight = textHeight(RESOURCES[item.resource].name, recipe ? 252 : 180, 16);
              return {
                  ...item,
                  recipe,
                  height: Math.max(24, nameHeight) + (recipe ? 26 : 8),
              };
          });
    const bodyWidth = items.length
        ? WIDTH - PADDING * 2 - TABLE_WIDTH - COLUMN_GAP
        : WIDTH - PADDING * 2;
    const titleHeight = Math.max(36, textHeight(task.title, WIDTH - PADDING * 2 - 52 - 72, 24));
    const bodyY = PADDING + titleHeight + 20;
    const description = complete ? '' : task.detail;
    const descriptionHeight = textHeight(description, bodyWidth, 17);
    const stage = !complete && task.id === 'earth-supply';
    const destination =
        task.id === 'earth-ship-upgrade'
            ? 'hangar'
            : ['earth-supply', 'earth-workshop'].includes(task.id) || task.kind === 'kineticShield'
              ? 'station'
              : null;
    const action = complete
        ? null
        : destination && actions.openDestination
          ? {
                title: destination === 'hangar' ? 'OTWÓRZ HANGAR →' : 'ROZBUDOWA STACJI →',
                run: () => actions.openDestination?.(destination),
                enabled: true,
            }
          : storyTaskAvailable(p, task) &&
              ['ore', 'parts'].includes(task.kind) &&
              actions.contribute
            ? {
                  title: `PRZEKAŻ ${task.kind === 'parts' ? 'KOMPONENTY' : 'RUDĘ'}`,
                  run: () => actions.contribute?.(task.id),
                  enabled: (c.bank[task.kind === 'parts' ? 'parts' : 'ore'] ?? 0) > 0,
              }
            : storyTaskAvailable(p, task) && task.kind === 'briefing' && actions.briefing
              ? {
                    title: 'ZATWIERDŹ PLAN DO WENUS',
                    run: () => actions.briefing?.(),
                    enabled: !c.activeRun,
                }
              : null;
    const stageY = bodyY + descriptionHeight + 16;
    const actionY = stage ? stageY + 24 + 18 : bodyY + descriptionHeight + 20;
    const leftHeight = action
        ? actionY - bodyY + 36
        : stage
          ? stageY - bodyY + 24
          : descriptionHeight;
    const tableHeight = items.length
        ? 34 + items.reduce((sum, item) => sum + item.height, 0) + 12
        : 0;
    const bodyHeight = Math.max(leftHeight, tableHeight);
    const reward = storyRewardText(task);
    const rewardHeight = reward ? textHeight(`Nagroda: ${reward}`, WIDTH - PADDING * 2, 16) : 0;
    const footerY = complete ? PADDING + titleHeight + 16 : bodyY + bodyHeight + PADDING;
    const height = footerY + (reward ? rewardHeight + 32 : 0);
    return {
        complete,
        items,
        bodyWidth,
        bodyY,
        bodyHeight,
        description,
        stage,
        stageY,
        action,
        actionY,
        reward,
        footerY,
        height,
    };
}

/** Keep complete cards inside a page; long checklists get their own page. */
export function questPages(heights: readonly number[], availableHeight = 438, gap = 16) {
    const pages: number[][] = [];
    let used = 0;
    heights.forEach((height, index) => {
        if (!pages.length || used + gap + height > availableHeight) {
            pages.push([]);
            used = 0;
        }
        const page = pages[pages.length - 1];
        used += (page.length ? gap : 0) + height;
        page.push(index);
    });
    return pages.length ? pages : [[]];
}

function categoryBadge(card: Container, required: boolean) {
    const badge = card.addChild(new Container());
    badge.position.set(PADDING, PADDING);
    badge.label = required ? 'quest-main' : 'quest-side';
    const color = required ? C.cyan : C.gold;
    const g = badge.addChild(
        new Graphics().roundRect(0, 0, 36, 36, 11).fill({ color, alpha: 0.12 }),
    );
    if (required) {
        g.poly([18, 6, 29, 18, 18, 30, 7, 18]).stroke({ color, width: 2 });
        g.circle(18, 18, 3).fill(color);
    } else {
        const points = Array.from({ length: 10 }, (_, i) => {
            const angle = -Math.PI / 2 + (i * Math.PI) / 5,
                r = i % 2 ? 5 : 12;
            return [18 + Math.cos(angle) * r, 18 + Math.sin(angle) * r];
        }).flat();
        g.poly(points).stroke({ color, width: 2 });
    }
    const tooltip = new Container();
    tooltip.position.set(PADDING, PADDING + 42);
    tooltip.addChild(new Graphics().roundRect(0, 0, 182, 30, 8).fill(C.raised));
    label(tooltip, required ? 'Zadanie główne' : 'Zadanie dodatkowe', 10, 7, 13, color);
    tooltip.visible = false;
    tooltip.eventMode = 'none';
    badge.eventMode = 'static';
    badge.cursor = 'help';
    badge.on('pointerenter', () => {
        tooltip.visible = true;
    });
    badge.on('pointerleave', () => {
        tooltip.visible = false;
    });
    return tooltip;
}

export function questCard(
    c: Campaign,
    task: StoryTask,
    actions: QuestCardActions,
    layout = questCardLayout(c, task, actions),
) {
    const card = new Container();
    card.label = `quest-card-${task.id}`;
    panel(card, 0, 0, WIDTH, layout.height);
    const tooltip = categoryBadge(card, task.required);
    label(
        card,
        task.title,
        PADDING + 52,
        PADDING + 3,
        24,
        layout.complete ? C.mint : C.text,
        WIDTH - PADDING * 2 - 52 - 72,
    );
    if (layout.complete || !layout.items.length)
        label(
            card,
            layout.complete ? '✓' : `${c.story!.progress[task.id]}/${task.target}`,
            WIDTH - PADDING - 58,
            PADDING + 10,
            18,
            layout.complete ? C.mint : C.muted,
            58,
        );
    if (layout.description)
        label(card, layout.description, PADDING, layout.bodyY, 17, C.muted, layout.bodyWidth);
    if (layout.stage)
        label(
            card,
            'Zaplecze stacji I · 0/1',
            PADDING,
            layout.stageY,
            16,
            C.gold,
            layout.bodyWidth,
        );
    if (layout.action)
        button(
            card,
            layout.action.title,
            PADDING,
            layout.actionY,
            Math.min(331, layout.bodyWidth),
            layout.action.run,
            false,
            layout.action.enabled,
            36,
            14,
        );
    if (layout.items.length) {
        const x = WIDTH - PADDING - TABLE_WIDTH;
        card.addChild(
            new Graphics()
                .roundRect(x, layout.bodyY, TABLE_WIDTH, layout.bodyHeight, 13)
                .fill({ color: C.ink, alpha: 0.3 }),
        );
        label(
            card,
            task.deliveryItems || task.kind === 'delivery' ? 'DO DOSTARCZENIA' : 'MATERIAŁY',
            x + 16,
            layout.bodyY + 12,
            12,
            C.muted,
        );
        let rowY = layout.bodyY + 34;
        for (const item of layout.items) {
            illustrationInBox(card, itemIllustration(item.resource), x + 16, rowY, 24, 24);
            label(
                card,
                RESOURCES[item.resource].name,
                x + 50,
                rowY + 3,
                16,
                C.text,
                item.recipe ? 252 : 180,
            );
            label(
                card,
                `${item.have} / ${item.need}`,
                item.recipe ? x + 50 : x + 244,
                item.recipe ? rowY + 24 : rowY + 3,
                16,
                item.have >= item.need ? C.mint : C.gold,
                62,
            );
            if (item.recipe)
                button(
                    card,
                    'STWÓRZ',
                    x + 224,
                    rowY + 22,
                    78,
                    () => actions.openRecipe?.(item.recipe!),
                    false,
                    true,
                    24,
                    11,
                );
            rowY += item.height;
        }
    }
    if (layout.reward) {
        card.addChild(
            new Graphics()
                .moveTo(PADDING, layout.footerY)
                .lineTo(WIDTH - PADDING, layout.footerY)
                .stroke({ color: C.line, alpha: 0.45, width: 1 }),
        );
        label(
            card,
            `Nagroda: ${layout.reward}`,
            PADDING,
            layout.footerY + 16,
            16,
            C.mint,
            WIDTH - PADDING * 2,
        );
    }
    card.addChild(tooltip);
    return card;
}
