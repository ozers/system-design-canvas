import { describe, expect, it } from 'vitest';
import { createConnectMenuTracker, pointerPosition } from './connect-menu';

/** React Flow's order on pointer up: onConnectStart … onConnect, then onConnectEnd. */
function drag(
  tracker: ReturnType<typeof createConnectMenuTracker>,
  edgeId: string | null,
  drop: { x: number; y: number }
) {
  tracker.start();
  if (edgeId) tracker.connected(edgeId);
  return tracker.end(drop);
}

describe('createConnectMenuTracker', () => {
  it('opens the menu on the first connection at its own drop point', () => {
    const tracker = createConnectMenuTracker();
    expect(drag(tracker, 'e1', { x: 100, y: 200 })).toEqual({ edgeId: 'e1', position: { x: 100, y: 200 } });
  });

  it('uses each connection’s own drop point, never the previous one', () => {
    const tracker = createConnectMenuTracker();
    expect(drag(tracker, 'e1', { x: 10, y: 10 })?.position).toEqual({ x: 10, y: 10 });
    expect(drag(tracker, 'e2', { x: 20, y: 30 })).toEqual({ edgeId: 'e2', position: { x: 20, y: 30 } });
    expect(drag(tracker, 'e3', { x: 40, y: 50 })).toEqual({ edgeId: 'e3', position: { x: 40, y: 50 } });
  });

  it('opens nothing when the drag ends without a connection', () => {
    const tracker = createConnectMenuTracker();
    expect(drag(tracker, null, { x: 1, y: 1 })).toBeNull();
  });

  it('does not reuse an edge connected outside a drag (click-to-connect)', () => {
    const tracker = createConnectMenuTracker();
    tracker.connected('clicked');
    expect(drag(tracker, null, { x: 5, y: 5 })).toBeNull();
  });

  it('hands an edge out once', () => {
    const tracker = createConnectMenuTracker();
    tracker.start();
    tracker.connected('e1');
    expect(tracker.end({ x: 1, y: 2 })).not.toBeNull();
    expect(tracker.end({ x: 3, y: 4 })).toBeNull();
  });
});

describe('pointerPosition', () => {
  it('reads a mouse event', () => {
    expect(pointerPosition({ clientX: 3, clientY: 4 } as MouseEvent)).toEqual({ x: 3, y: 4 });
  });

  it('reads the lifted touch of a touch event', () => {
    const event = { changedTouches: [{ clientX: 7, clientY: 8 }] } as unknown as TouchEvent;
    expect(pointerPosition(event)).toEqual({ x: 7, y: 8 });
  });
});
