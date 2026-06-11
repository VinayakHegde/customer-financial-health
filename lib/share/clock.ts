/**
 * One module = one mock surface for "right now" in S11. Both the share-mint
 * Server Action and the resolver call this; tests can either mock the module
 * (`vi.mock('../../lib/share/clock', () => ({ nowUtc: () => pinned }))`) or
 * use Vitest fake timers — both styles must produce the same fixture
 * behaviour (T55).
 */
export function nowUtc(): Date {
  return new Date();
}
