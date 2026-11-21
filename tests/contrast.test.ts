import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// WCAG 2.x contrast for the colour pairs the UI actually uses (brief: text >= 4.5:1).
const css = readFileSync("app/globals.css", "utf8");
const tok = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))![1];
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const lum = ([r, g, b]: [number, number, number]) => {
  const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a: [number, number, number], b: [number, number, number]) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const over = (fg: [number, number, number], bg: [number, number, number], alpha: number): [number, number, number] =>
  fg.map((v, i) => v * alpha + bg[i] * (1 - alpha)) as [number, number, number];
const WHITE: [number, number, number] = [255, 255, 255];

describe("colour contrast", () => {
  const pairs: [string, string, string][] = [
    ["ink", "ivory", "body text"], ["ink", "paper", "card text"], ["ink2", "ivory", "secondary"], ["ink2", "paper", "secondary on card"],
    ["ink2", "panel", "secondary on panel"], ["ink3", "ivory", "captions"], ["ink3", "paper", "captions on card"], ["ink3", "panel", "captions on panel"],
    ["amber-ink", "ivory", "links"], ["amber-ink", "paper", "links on card"], ["amber-ink", "honeybg", "watch chip"], ["amber-ink", "panel", "link on panel"],
    ["green", "greenbg", "stable chip"], ["green", "paper", "green text"], ["terra", "terrabg", "failed chip"], ["terra", "paper", "error text"], ["terra", "ivory", "error text on page"],
    ["ivory", "ink", "primary button and dark section"], ["terra-dark", "ink", "closing line on the dark section"], ["honey", "ink", "accent text on dark"],
  ];
  for (const [fg, bg, what] of pairs) it(`${fg} on ${bg} (${what}) is at least 4.5:1`, () => expect(ratio(rgb(tok(fg)), rgb(tok(bg)))).toBeGreaterThanOrEqual(4.5));
  it("white on the button amber and on terracotta is at least 4.5:1", () => {
    expect(ratio(WHITE, rgb(tok("amber-btn")))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(WHITE, rgb(tok("terra")))).toBeGreaterThanOrEqual(4.5);
  });
  it("sidebar text (ivory at 80%) on the charcoal is at least 4.5:1", () => {
    expect(ratio(over(rgb(tok("ivory")), rgb(tok("ink")), 0.8), rgb(tok("ink")))).toBeGreaterThanOrEqual(4.5);
  });
});
