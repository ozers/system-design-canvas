export type ClientPoint = { x: number; y: number };

export type ConnectMenuRequest = { edgeId: string; position: ClientPoint };

/** Client coordinates of the pointer that ended a gesture (mouse, or the lifted touch). */
export function pointerPosition(event: MouseEvent | TouchEvent): ClientPoint {
  if ('changedTouches' in event) {
    const touch = event.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
  return { x: event.clientX, y: event.clientY };
}

/**
 * Pairs a new edge with the point where its connection drag was dropped.
 *
 * On pointer up React Flow calls `onConnect` first and `onConnectEnd` second
 * (`@xyflow/system` XYHandle `onPointerUp`), so the drop position is not known yet when the
 * edge is created. `connected` remembers the edge, `end` hands back the edge with the drop
 * point of the same gesture, and `start` forgets anything left from an earlier gesture.
 */
export function createConnectMenuTracker() {
  let edgeId: string | null = null;
  return {
    start() {
      edgeId = null;
    },
    connected(id: string) {
      edgeId = id;
    },
    end(position: ClientPoint): ConnectMenuRequest | null {
      const id = edgeId;
      edgeId = null;
      return id ? { edgeId: id, position } : null;
    },
  };
}
