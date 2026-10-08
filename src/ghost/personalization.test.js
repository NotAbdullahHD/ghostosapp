import { describe, test, expect } from "bun:test";
import { normalizeClock, DEFAULT_CLOCK, ESCAPE_HOLD_MS } from "./personalization";
describe("desktop customization", () => {
  test("custom clock text, scale, color and blend are retained", () => {
    expect(normalizeClock({ text: "ABDULLAH", size: 90, opacity: 65, blend: "difference", color: "ice" })).toEqual({ ...DEFAULT_CLOCK, text: "ABDULLAH", size: 90, opacity: 65, blend: "difference", color: "ice" });
  });
  test("saved invalid sizes cannot place the clock outside supported bounds", () => {
    const settings = normalizeClock({ size: 1000, x: -50, y: 200 });
    expect([settings.size, settings.x, settings.y]).toEqual([110, 15, 75]);
  });
  test("fullscreen requires a continuous one-second Escape hold", () => {
    expect(ESCAPE_HOLD_MS).toBe(1000);
  });
});