import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc, safeParseDiagramDoc } from "../src/diagram.js";
const input = () => JSON.parse(readFileSync(new URL("../../../docs/experiments/sankey/traffic.diagram.json", import.meta.url), "utf8"));
it("accepts conserved traffic splits and merges", () => expect(parseDiagramDoc(input()).diagram.kind).toBe("sankey"));
it("rejects unbalanced internal nodes, missing references and backward flows", () => {
  for (const patch of [{ value: 10 }, { to: "missing" }, { to: "requests" }]) {
    const raw = input(); Object.assign(raw.diagram.flows[3], patch); expect(safeParseDiagramDoc(raw).ok).toBe(false);
  }
});
it("rejects discontinuous selected paths and zero volume", () => {
  const raw = input(); raw.diagram.scenarios[0].path = ["hit", "backend-error"]; expect(safeParseDiagramDoc(raw).ok).toBe(false);
  const zero = input(); zero.diagram.flows[0].value = 0; expect(safeParseDiagramDoc(zero).ok).toBe(false);
});
