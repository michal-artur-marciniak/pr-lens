import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc } from "@coldtea/pr-lens-schema";
import { renderDiagram } from "../src/diagram.js";
const doc = parseDiagramDoc(JSON.parse(readFileSync(new URL("../../../docs/experiments/tree/modules.diagram.json", import.meta.url), "utf8")));
it("separates siblings, preserves geometry and animates only the chosen hierarchy", () => {
  const picture = renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "reservation" } });
  expect(picture.atlas).toEqual(renderDiagram(doc, { theme: "dark" }).atlas);
  expect(picture.svg.match(/<animateMotion/g)).toHaveLength(2);
  expect(picture.svg).toContain('data-focus="node-inventory"');
  expect(picture.svg).not.toContain('data-focus="node-pricing"');
  const nodes = Object.values(picture.atlas.elements);
  for (let i = 0; i < nodes.length; i++) for (const other of nodes.slice(i + 1)) {
    const node = nodes[i]; if (node === undefined) continue;
    expect(node.x >= other.x + other.width || other.x >= node.x + node.width || node.y >= other.y + other.height || other.y >= node.y + node.height).toBe(true);
  }
});
