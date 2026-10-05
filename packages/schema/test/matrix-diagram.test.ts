import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc, safeParseDiagramDoc } from "../src/diagram.js";
const input = () => JSON.parse(readFileSync(new URL("../../../docs/experiments/matrix/permissions.diagram.json", import.meta.url), "utf8"));
it("accepts explicit relationships and sparse unspecified positions", () => expect(parseDiagramDoc(input()).diagram.kind).toBe("matrix"));
it("rejects duplicate positions and missing references", () => {
  const raw = input(); raw.diagram.cells[1].column = "orders"; expect(safeParseDiagramDoc(raw).ok).toBe(false);
  const missing = input(); missing.diagram.cells[0].row = "missing"; expect(safeParseDiagramDoc(missing).ok).toBe(false);
});
it("rejects scenario cells belonging to another row", () => {
  const raw = input(); raw.diagram.scenarios[0].steps[0].cells = ["billing-orders"]; expect(safeParseDiagramDoc(raw).ok).toBe(false);
});
