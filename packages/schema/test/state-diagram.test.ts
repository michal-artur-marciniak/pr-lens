import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc, safeParseDiagramDoc } from "../src/diagram.js";
const input = () => JSON.parse(readFileSync(new URL("../../../docs/experiments/state/order.diagram.json", import.meta.url), "utf8"));
it("accepts fulfillment, cancellation and refund paths", () => expect(parseDiagramDoc(input()).diagram.scenarios).toHaveLength(3));
it("rejects transitions out of final states, missing states and discontinuous paths", () => {
  for (const patch of [{ from: "done" }, { to: "missing" }]) {
    const raw = input(); Object.assign(raw.diagram.transitions[0], patch); expect(safeParseDiagramDoc(raw).ok).toBe(false);
  }
  const raw = input(); raw.diagram.scenarios[0].path = ["ship"]; expect(safeParseDiagramDoc(raw).ok).toBe(false);
});
it("rejects multiple initial states and duplicate transition IDs", () => {
  const raw = input(); raw.diagram.states[1].kind = "initial"; expect(safeParseDiagramDoc(raw).ok).toBe(false);
  const duplicate = input(); duplicate.diagram.transitions[1].id = "create"; expect(safeParseDiagramDoc(duplicate).ok).toBe(false);
});
