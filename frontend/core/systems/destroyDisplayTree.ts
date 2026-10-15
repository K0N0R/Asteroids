import type { Container } from 'pixi.js';

/** Let each Graphics release its owned context, while preserving shared library contexts.
 * Pixi 8's destroy({children:true}) does not destroy owned GraphicsContexts.
 */
export function destroyDisplayTree(view: Container) {
    if (view.destroyed) return;
    for (const child of view.removeChildren()) destroyDisplayTree(child);
    view.destroy();
}
