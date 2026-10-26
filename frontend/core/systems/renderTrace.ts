type Listener = (kind: string, detail: string) => void;
const listeners = new Set<Listener>();
/** Plain metadata only: never retain a scene, event object or GL resource. */
export function traceRenderEvent(kind: string, detail: string) {
    for (const listener of listeners) listener(kind, detail);
}
export function watchRenderTrace(listener: Listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
