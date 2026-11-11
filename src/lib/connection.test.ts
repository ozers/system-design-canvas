import { describe, expect, it } from 'vitest';
import { normalizeConnection, withHandleRole } from './connection';

describe('withHandleRole', () => {
  it('keeps the side and swaps the role', () => {
    expect(withHandleRole('bottom-source', 'target')).toBe('bottom-target');
    expect(withHandleRole('left-target', 'source')).toBe('left-source');
    expect(withHandleRole('right-source', 'source')).toBe('right-source');
  });

  it('leaves empty and unknown ids alone', () => {
    expect(withHandleRole(null, 'source')).toBeNull();
    expect(withHandleRole(undefined, 'target')).toBeUndefined();
    expect(withHandleRole('custom', 'target')).toBe('custom');
  });
});

describe('normalizeConnection', () => {
  it('keeps a drag that started on a source handle as is', () => {
    const c = { source: 'a', sourceHandle: 'right-source', target: 'b', targetHandle: 'left-target' };
    expect(normalizeConnection(c, 'a')).toEqual(c);
  });

  it('reverses a drag that started on the hidden target handle of A (the QA #1 case)', () => {
    // Grabbing A's visible right dot hit the invisible right-target handle on top of it,
    // and React Flow (Loose mode) built B → A.
    const fromLoose = { source: 'b', sourceHandle: 'left-source', target: 'a', targetHandle: 'right-target' };
    expect(normalizeConnection(fromLoose, 'a')).toEqual({
      source: 'a',
      sourceHandle: 'right-source',
      target: 'b',
      targetHandle: 'left-target',
    });
  });

  it('fixes handle roles when the drop landed on a same-type handle', () => {
    const c = { source: 'a', sourceHandle: 'bottom-source', target: 'b', targetHandle: 'top-source' };
    expect(normalizeConnection(c, 'a')).toEqual({ ...c, targetHandle: 'top-target' });
  });

  it('covers every side', () => {
    for (const from of ['top', 'right', 'bottom', 'left']) {
      for (const to of ['top', 'right', 'bottom', 'left']) {
        const c = { source: 'b', sourceHandle: `${to}-source`, target: 'a', targetHandle: `${from}-target` };
        const out = normalizeConnection(c, 'a');
        expect(out.source).toBe('a');
        expect(out.target).toBe('b');
        expect(out.sourceHandle).toBe(`${from}-source`);
        expect(out.targetHandle).toBe(`${to}-target`);
      }
    }
  });

  it('does not touch the direction without a known start node or on a self-loop', () => {
    const c = { source: 'b', sourceHandle: 'left-source', target: 'a', targetHandle: 'right-target' };
    expect(normalizeConnection(c, null)).toEqual(c);
    const self = { source: 'a', sourceHandle: 'right-source', target: 'a', targetHandle: 'left-target' };
    expect(normalizeConnection(self, 'a')).toEqual(self);
  });
});
