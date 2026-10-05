import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc } from "@coldtea/pr-lens-schema";
import { renderDiagram } from "../src/diagram.js";
const doc = parseDiagramDoc(JSON.parse(readFileSync(new URL("../../../docs/experiments/gantt/deploy.diagram.json", import.meta.url), "utf8")));
it("uses duration-proportional bars and preserves geometry during playback", () => {
  const staticPicture = renderDiagram(doc, { theme: "light" });
  const animated = renderDiagram(doc, { theme: "dark", playback: { kind: "scenario", scenario: "release" } });
  expect(animated.atlas).toEqual(staticPicture.atlas);
  expect(animated.atlas.elements.integration?.width).toBe((animated.atlas.elements.unit?.width ?? 0) * 2);
  expect(animated.atlas.elements.integration?.x).toBe(animated.atlas.elements.unit?.x);
  expect(animated.svg).toContain('data-focus="time-cursor"');
  expect(staticPicture.svg).not.toContain("<animateTransform");
  expect(animated.svg).toContain("NEW"); expect(animated.svg).toContain("CHANGED");
});
