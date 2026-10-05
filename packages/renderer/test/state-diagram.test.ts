import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc } from "@coldtea/pr-lens-schema";
import { renderDiagram } from "../src/diagram.js";
const doc = parseDiagramDoc(JSON.parse(readFileSync(new URL("../../../docs/experiments/state/order.diagram.json", import.meta.url), "utf8")));
it("renders state symbols, guards, changes and deterministic selected playback", () => {
  const options = { theme: "light", playback: { kind: "scenario", scenario: "return-order" } } as const;
  const picture = renderDiagram(doc, options);
  expect(picture.svg).toContain("Pay [approved]");
  expect(picture.svg).toContain("Refund [accepted]");
  expect(picture.svg.match(/<animateMotion/g)).toHaveLength(5);
  expect(picture.svg).toContain('data-focus="state-refunded-4"');
  expect(picture.svg).toContain("NEW");
  expect(picture.svg).toContain('r="7"');
  expect(renderDiagram(doc, options).svg).toBe(picture.svg);
  expect(renderDiagram(doc, { theme: "dark" }).svg).not.toContain("<animateMotion");
  expect(renderDiagram(doc, { theme: "dark", playback: options.playback }).atlas).toEqual(picture.atlas);
});
