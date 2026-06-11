import { afterEach, describe, expect, it, vi } from "vitest";
import { nowUtc } from "../../lib/share/clock";
import { pinnedNowUtc } from "../_fixtures/snapshots";

describe("T55 — S11: nowUtc clock helper — fake-timers style pins the instant", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the pinned UTC instant when fake timers are set", () => {
    vi.useFakeTimers();
    vi.setSystemTime(pinnedNowUtc);

    const t1 = nowUtc();
    const t2 = nowUtc();
    expect(t1.getTime()).toBe(pinnedNowUtc.getTime());
    expect(t2.getTime()).toBe(pinnedNowUtc.getTime());
  });

  it("returns a Date instance and tracks setSystemTime updates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(pinnedNowUtc);
    expect(nowUtc()).toBeInstanceOf(Date);

    const later = new Date(pinnedNowUtc.getTime() + 1000);
    vi.setSystemTime(later);
    expect(nowUtc().getTime()).toBe(later.getTime());
  });
});
