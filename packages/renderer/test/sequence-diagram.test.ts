import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc } from "@coldtea/pr-lens-schema";
import { renderDiagram } from "../src/diagram.js";
const fixture = (name: string) => parseDiagramDoc(JSON.parse(readFileSync(new URL(`../../../docs/experiments/sequence/${name}.diagram.json`, import.meta.url), "utf8")));
it("expands retries into deterministic executed traces and retains the static structure", () => {
  const doc = fixture("retry");
  const fast = renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "fast-success" } });
  const retry = renderDiagram(doc, { theme: "dark", playback: { kind: "scenario", scenario: "retry-success" } });
  expect(retry.height).toBeGreaterThan(fast.height);
  expect(fast.svg.match(/<animateMotion/g)).toHaveLength(4);
  expect(retry.svg.match(/<animateMotion/g)).toHaveLength(8);
  expect(retry.svg.match(/data-element="attempt"/g)?.length).toBe(3);
  expect(fast.svg).not.toContain('data-element="timeout"');
  expect(renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "fast-success" } }).svg).toBe(fast.svg);
  const structural = renderDiagram(doc, { theme: "light" }).svg;
  expect(structural).not.toContain("<animateMotion");
  expect(structural).toContain('data-element="timeout"');
});
it("lays out simultaneous calls in the same band and joins before the response", () => {
  const picture = renderDiagram(fixture("checkout"), { theme: "light", playback: { kind: "scenario", scenario: "checkout-retry" } });
  const stock = picture.atlas.elements["stock-request"];
  const price = picture.atlas.elements["price-request"];
  const ready = picture.atlas.elements["stock-ready"];
  const response = picture.atlas.elements.response;
  expect(stock).toBeDefined(); expect(price).toBeDefined();
  expect(Math.abs((stock?.y ?? 0) - (price?.y ?? 0))).toBe(52);
  expect(response?.y).toBeGreaterThan(ready?.y ?? 0);
  expect(picture.svg).toContain("All branches complete");
  expect(picture.svg).toContain("Attempt 1/2"); expect(picture.svg).toContain("Attempt 2/2");
  expect(picture.svg).not.toContain('data-element="reject"');
  expect(picture.svg).not.toContain('data-focus="inventory-branch"');
  for (const box of Object.values(picture.atlas.elements)) {
    expect(box.x + box.width).toBeLessThanOrEqual(picture.width);
    expect(box.y + box.height).toBeLessThanOrEqual(picture.height);
  }
  const denied = renderDiagram(fixture("checkout"), { theme: "dark", playback: { kind: "scenario", scenario: "unauthorized" } });
  expect(denied.svg).not.toContain("Attempt");
  expect(denied.svg.match(/<animateMotion/g)).toHaveLength(3);
});
it("does not attach inventory attempt counters to concurrent pricing messages", () => {
  const svg = renderDiagram(fixture("checkout"), { theme: "light", playback: { kind: "scenario", scenario: "checkout-retry" } }).svg;
  expect(svg).toContain('data-focus="attempt-4"');
  expect(svg).not.toContain('data-focus="attempt-8"');
  expect(svg).not.toContain('data-focus="attempt-9"');
});

it("combines nested retry counters into one readable caption", () => {
  const doc = parseDiagramDoc({ schemaVersion: "0.2.0", kind: "diagram", title: "Nested retry", diagram: {
    kind: "sequence", participants: [{ id: "a", label: "Caller" }, { id: "b", label: "Service" }],
    messages: [{ id: "call", from: "a", to: "b", label: "Try" }],
    steps: [{ id: "outer", kind: "repeat", label: "Outer", steps: [{ id: "inner", kind: "repeat", label: "Inner", steps: [{ id: "send", kind: "message", message: "call" }] }] }],
    scenarios: [{ id: "nested", label: "Nested", iterations: { outer: [2], inner: [2, 1] } }],
  } });
  const picture = renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "nested" } });
  expect(picture.svg).toContain("Attempt 1/2 · 1/2");
  expect(picture.svg.match(/data-focus="attempt-0"/g)).toHaveLength(1);
});
