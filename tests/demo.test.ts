import { describe, expect, it } from "vitest";
import { isDemo } from "@/lib/demo";

describe("isDemo", () => {
  it("defaults to demo mode", () => expect(isDemo({})).toBe(true));
  it("turns off only on explicit false", () => {
    expect(isDemo({ NECTARA_DEMO: "false" })).toBe(false);
    expect(isDemo({ NECTARA_DEMO: "true" })).toBe(true);
  });
});
