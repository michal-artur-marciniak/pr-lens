import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc } from "@coldtea/pr-lens-schema";
import { renderDiagram } from "../src/diagram.js";
it("preserves schema deltas in static output and focuses declared elements", () => {
  const doc = parseDiagramDoc(JSON.parse(readFileSync(new URL("../../../docs/experiments/entity-relationship/migration.diagram.json", import.meta.url), "utf8")));
  const still = renderDiagram(doc, { theme: "light" });
  const moving = renderDiagram(doc, { theme: "dark", playback: { kind: "scenario", scenario: "migration" } });
  expect(still.atlas).toEqual(moving.atlas);
  expect(still.svg).toContain("int32 → int64");
  expect(still.svg).toContain("removed");
  expect(still.svg).not.toContain("<animate ");
  expect(moving.svg.match(/data-focus=/g)).toHaveLength(5);
  expect(moving.svg).not.toMatch(/<script|<foreignObject|href=/);
  expect(renderDiagram(doc, { theme: "light" }).svg).toBe(still.svg);
});
