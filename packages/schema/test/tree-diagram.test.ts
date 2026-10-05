import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc, safeParseDiagramDoc } from "../src/diagram.js";
const input = () => JSON.parse(readFileSync(new URL("../../../docs/experiments/tree/modules.diagram.json", import.meta.url), "utf8"));
it("accepts a module hierarchy and selected paths", () => expect(parseDiagramDoc(input()).diagram.scenarios).toHaveLength(2));
it("rejects multiple roots, cycles and missing parents", () => {
  for (const parent of [undefined, "inventory", "missing"]) {
    const raw = input(); raw.diagram.nodes[1].parent = parent; expect(safeParseDiagramDoc(raw).ok).toBe(false);
  }
});
it("rejects scenario jumps across siblings", () => {
  const raw = input(); raw.diagram.scenarios[0].path = ["app", "checkout", "orders"]; expect(safeParseDiagramDoc(raw).ok).toBe(false);
});
