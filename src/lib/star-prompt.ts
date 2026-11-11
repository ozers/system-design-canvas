/**
 * One-time "Star it on GitHub" prompt after the first successful export.
 * The flag lives in localStorage; once set, the prompt never shows again.
 */
export const STAR_PROMPT_KEY = 'sdc.star-prompt-shown';

type FlagStorage = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): FlagStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Returns true exactly once per browser: the first call records the flag and
 * says "show"; later calls say "don't". If storage can't be read or written,
 * it says "don't" so the prompt can never repeat on every export.
 */
export function claimStarPrompt(storage: FlagStorage | null = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    if (storage.getItem(STAR_PROMPT_KEY) !== null) return false;
    storage.setItem(STAR_PROMPT_KEY, '1');
    return true;
  } catch {
    return false;
  }
}
