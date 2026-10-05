import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc } from "@coldtea/pr-lens-schema";
import { renderDiagram } from "../src/diagram.js";
const doc = parseDiagramDoc(JSON.parse(readFileSync(new URL("../../../docs/experiments/sankey/traffic.diagram.json", import.meta.url), "utf8")));
it("keeps proportional flow widths and highlights only the selected path", () => {
  const picture = renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "cache-hit" } });
  const thickness = (id: string) => Number(picture.svg.match(new RegExp(`data-element="${id}" data-value="[^"]+" data-thickness="([^"]+)"`))?.[1]);
  expect(thickness("hit") / thickness("miss")).toBeCloseTo(700 / 250);
  expect(thickness("backend-success") + thickness("backend-error")).toBeCloseTo(thickness("miss"));
  expect(picture.svg.match(/<animateMotion/g)).toHaveLength(2);
  expect(picture.svg).toContain('data-focus="flow-hit"');
  expect(picture.svg).not.toContain('data-focus="flow-miss"');
  expect(renderDiagram(doc, { theme: "dark" }).atlas).toEqual(picture.atlas);
});
