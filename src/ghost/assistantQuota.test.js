import { describe, expect, test } from "bun:test";
import { DAILY_LIMIT, computeState, nextReset, resetLabel } from "./assistantQuota";

describe("assistant daily quota", () => {
  const now = new Date(2026, 9, 10, 18, 30); // Oct 10 2026 18:30 local

  test("limit is 100 messages per day", () => {
    expect(DAILY_LIMIT).toBe(100);
    expect(computeState(null, now).remaining).toBe(100);
  });

  test("counts sent messages and shows remaining", () => {
    const s = computeState(JSON.stringify({ day: "2026-10-10", used: 37 }), now);
    expect(s.used).toBe(37);
    expect(s.remaining).toBe(63);
  });

  test("resets to 0 on a new day", () => {
    const s = computeState(JSON.stringify({ day: "2026-10-09", used: 100 }), now);
    expect(s.used).toBe(0);
    expect(s.remaining).toBe(100);
  });

  test("used never exceeds the limit", () => {
    const s = computeState(JSON.stringify({ day: "2026-10-10", used: 250 }), now);
    expect(s.used).toBe(100);
    expect(s.remaining).toBe(0);
  });

  test("reset time is next local midnight", () => {
    expect(nextReset(now)).toBe(new Date(2026, 9, 11, 0, 0, 0, 0).getTime());
    expect(resetLabel(nextReset(now), now)).toMatch(/^resets in 5h 3?0?m$/);
  });
});
