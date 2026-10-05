import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc } from "@coldtea/pr-lens-schema";
import { renderDiagram } from "../src/diagram.js";
it("keeps retry geometry while changing playback", () => {
  const doc = parseDiagramDoc(JSON.parse(readFileSync(new URL("../../../docs/experiments/sequence/retry.diagram.json", import.meta.url), "utf8")));
  const fast = renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "fast-success" } });
  const retry = renderDiagram(doc, { theme: "dark", playback: { kind: "scenario", scenario: "retry-success" } });
  expect(fast.atlas).toEqual(retry.atlas);
  expect(fast.svg.match(/<animateMotion/g)).toHaveLength(4);
  expect(retry.svg.match(/<animateMotion/g)).toHaveLength(8);
  expect(renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "fast-success" } }).svg).toBe(fast.svg);
  expect(renderDiagram(doc, { theme: "light" }).svg).not.toContain("<animateMotion");
});

it("focuses only visited nested branches and shares geometry with rejection", () => {
  const doc = parseDiagramDoc(JSON.parse(readFileSync(new URL("../../../docs/experiments/sequence/checkout.diagram.json", import.meta.url), "utf8")));
  const checkout = renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "checkout-retry" } });
  const denied = renderDiagram(doc, { theme: "dark", playback: { kind: "scenario", scenario: "unauthorized" } });
  expect(checkout.atlas).toEqual(denied.atlas);
  expect(checkout.svg).not.toMatch(/data-focus="[^"]+"[^>]*><rect/);
  expect(checkout.svg).not.toContain('data-focus="authorized"');
  expect(checkout.svg).toContain("attempt 1/2");
  expect(checkout.svg).toContain("attempt 2/2");
  expect(denied.svg).not.toContain("attempt 1/2");
  expect(checkout.svg).toContain('data-focus="inventory-branch"');
  expect(checkout.svg).toContain('data-focus="pricing-branch"');
  expect(checkout.svg).not.toContain('data-focus="denied"');
  expect(denied.svg).toContain('data-focus="denied"');
  expect(denied.svg).not.toContain('data-focus="inventory-branch"');
  expect(denied.svg.match(/<animateMotion/g)).toHaveLength(3);
});
