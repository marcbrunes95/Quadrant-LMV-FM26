import { describe, it, expect } from "vitest";
import { countdownParts, formatCountdown } from "../countdown";

const TARGET = "2026-09-19T19:00:00+02:00"; // = 17:00 UTC

describe("countdownParts", () => {
  it("desglossa dies, hores i minuts", () => {
    expect(countdownParts(TARGET, new Date("2026-09-09T17:00:00Z")))
      .toEqual({ days: 10, hours: 0, minutes: 0 });
    expect(countdownParts(TARGET, new Date("2026-09-19T13:25:00Z")))
      .toEqual({ days: 0, hours: 3, minutes: 35 });
    expect(countdownParts(TARGET, new Date("2026-09-18T16:30:00Z")))
      .toEqual({ days: 1, hours: 0, minutes: 30 });
  });

  it("retorna null just a l'hora i quan ja ha passat", () => {
    expect(countdownParts(TARGET, new Date("2026-09-19T17:00:00Z"))).toBeNull();
    expect(countdownParts(TARGET, new Date("2026-09-20T10:00:00Z"))).toBeNull();
  });

  it("interpreta l'objectiu com un instant absolut, no com una hora local", () => {
    const a = countdownParts("2026-09-19T19:00:00+02:00", new Date("2026-09-19T16:00:00Z"));
    const b = countdownParts("2026-09-19T17:00:00Z", new Date("2026-09-19T16:00:00Z"));
    expect(a).toEqual(b);
    expect(a).toEqual({ days: 0, hours: 1, minutes: 0 });
  });

  it("retorna null si la data no és vàlida", () => {
    expect(countdownParts("no és una data", new Date("2026-01-01T00:00:00Z"))).toBeNull();
  });
});

describe("formatCountdown", () => {
  it("escriu el text en català segons la magnitud", () => {
    expect(formatCountdown({ days: 10, hours: 4, minutes: 3 })).toBe("Falten 10 dies i 4 h");
    expect(formatCountdown({ days: 10, hours: 0, minutes: 3 })).toBe("Falten 10 dies");
    expect(formatCountdown({ days: 1, hours: 0, minutes: 0 })).toBe("Falta 1 dia");
    expect(formatCountdown({ days: 0, hours: 3, minutes: 35 })).toBe("Falten 3 h 35 min");
    expect(formatCountdown({ days: 0, hours: 0, minutes: 12 })).toBe("Falten 12 min");
    expect(formatCountdown({ days: 0, hours: 0, minutes: 0 })).toBe("Comença ara!");
  });
});
