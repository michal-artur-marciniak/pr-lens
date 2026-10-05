import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc } from "@coldtea/pr-lens-schema";
import { renderDiagram } from "../src/diagram.js";
const doc = parseDiagramDoc(JSON.parse(readFileSync(new URL("../../../docs/experiments/matrix/permissions.diagram.json", import.meta.url), "utf8")));
it("preserves geometry and focuses exact cells while keeping relationship meanings distinct", () => {
  const picture = renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "review-access" } });
  expect(renderDiagram(doc, { theme: "dark" }).atlas).toEqual(picture.atlas);
  expect(picture.svg).toContain("✓ Present   — Absent   ? Unknown   · Unspecified");
  expect(picture.svg).toContain('data-focus="cell-checkout-inventory-0"');
  expect(picture.svg).not.toContain('data-focus="cell-checkout-orders-0"');
  expect(picture.svg).toContain("NEW"); expect(picture.svg).toContain("REMOVED");
  for (const box of Object.values(picture.atlas.elements)) {
    expect(box.x + box.width).toBeLessThanOrEqual(picture.width);
    expect(box.y + box.height).toBeLessThanOrEqual(picture.height);
  }
  expect(renderDiagram(doc, { theme: "neutral" }).svg).not.toContain("<animate");
});
