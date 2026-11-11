import { describe, expect, it } from 'vitest';
import { STAR_PROMPT_KEY, claimStarPrompt } from './star-prompt';

function memoryStorage(opts: { failGet?: boolean; failSet?: boolean } = {}) {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => {
      if (opts.failGet) throw new Error('SecurityError');
      return map.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (opts.failSet) throw new Error('QuotaExceededError');
      map.set(k, String(v));
    },
  };
}

describe('claimStarPrompt', () => {
  it('shows the prompt on the first export and records the flag', () => {
    const storage = memoryStorage();
    expect(claimStarPrompt(storage)).toBe(true);
    expect(storage.map.get(STAR_PROMPT_KEY)).toBe('1');
  });

  it('never shows it again once the flag is set', () => {
    const storage = memoryStorage();
    claimStarPrompt(storage);
    expect(claimStarPrompt(storage)).toBe(false);
    expect(claimStarPrompt(storage)).toBe(false);
  });

  it('respects a flag stored by an earlier session', () => {
    const storage = memoryStorage();
    storage.map.set(STAR_PROMPT_KEY, '1');
    expect(claimStarPrompt(storage)).toBe(false);
  });

  it('stays silent when storage is unavailable or unwritable', () => {
    expect(claimStarPrompt(null)).toBe(false);
    expect(claimStarPrompt(memoryStorage({ failGet: true }))).toBe(false);
    // Without a stored flag the prompt would repeat on every export, so don't show it at all.
    expect(claimStarPrompt(memoryStorage({ failSet: true }))).toBe(false);
  });

  it('returns false outside the browser', () => {
    expect(claimStarPrompt()).toBe(false);
  });
});
