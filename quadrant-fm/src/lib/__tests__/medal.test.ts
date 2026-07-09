import { describe, it, expect } from "vitest";
import { tierFor } from "@/components/MedalBadge";
import { FM_EVENT, GATZARA_EVENT } from "@/lib/events";

describe("medalles per esdeveniment", () => {
  it("FM: 1/3/5 (com fins ara)", () => {
    expect(tierFor(0, FM_EVENT.medal)).toBeNull();
    expect(tierFor(1, FM_EVENT.medal)?.label).toBe("Bronze");
    expect(tierFor(3, FM_EVENT.medal)?.label).toBe("Plata");
    expect(tierFor(5, FM_EVENT.medal)?.label).toBe("Or");
  });
  it("Gatzara: 1 bronze, 2 plata, 3 or", () => {
    expect(tierFor(1, GATZARA_EVENT.medal)?.label).toBe("Bronze");
    expect(tierFor(2, GATZARA_EVENT.medal)?.label).toBe("Plata");
    expect(tierFor(3, GATZARA_EVENT.medal)?.label).toBe("Or");
  });
  it("tierFor sense llindars manté 1/3/5", () => {
    expect(tierFor(4)?.label).toBe("Plata");
  });
});
