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
