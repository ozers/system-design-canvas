import type { Connection } from '@xyflow/react';

type HandleId = string | null | undefined;

/**
 * Give a handle id the given role, keeping its side: ("bottom-source", "target") → "bottom-target".
 * Persisted handle ids are `{top|right|bottom|left}-{source|target}`; anything else is returned as is.
 */
export function withHandleRole<T extends HandleId>(handle: T, role: 'source' | 'target'): T | string {
  if (!handle) return handle;
  const match = /^(top|right|bottom|left)-(source|target)$/.exec(handle);
  return match ? `${match[1]}-${role}` : handle;
}

/**
 * Make a new connection point away from the node the drag started on.
 *
 * Every side of a system node has a visible handle and an invisible one of the opposite type
 * stacked on it, and the canvas runs in `ConnectionMode.Loose`. When the pointer grabs the
 * invisible target handle, React Flow builds the connection with the start node as the target,
 * so a drag from A to B was saved as B → A. The user's intent is always "from where I started
 * to where I let go", so we orient by the start node and give each handle id the role it plays.
 */
export function normalizeConnection(connection: Connection, fromNodeId: string | null | undefined): Connection {
  const reversed =
    !!fromNodeId && connection.target === fromNodeId && connection.source !== fromNodeId;
  const oriented = reversed
    ? {
        ...connection,
        source: connection.target,
        sourceHandle: connection.targetHandle,
        target: connection.source,
        targetHandle: connection.sourceHandle,
      }
    : connection;
  return {
    ...oriented,
    sourceHandle: withHandleRole(oriented.sourceHandle, 'source') ?? null,
    targetHandle: withHandleRole(oriented.targetHandle, 'target') ?? null,
  };
}
