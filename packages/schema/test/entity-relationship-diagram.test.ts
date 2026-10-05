import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc, safeParseDiagramDoc } from "../src/diagram.js";
const fixture = () => parseDiagramDoc(JSON.parse(readFileSync(new URL("../../../docs/experiments/entity-relationship/migration.diagram.json", import.meta.url), "utf8")));
it("accepts a schema migration and rejects a foreign field endpoint", () => {
  const doc = fixture();
  if (doc.diagram.kind !== "entity-relationship") throw new Error("expected ER");
  expect(doc.diagram.entities[1]?.fields[0]?.previous?.type).toBe("int32");
  const relation = doc.diagram.relations[0];
  if (relation === undefined) throw new Error("missing relation");
  const result = safeParseDiagramDoc({ ...doc, diagram: { ...doc.diagram, relations: [{ ...relation, to: { ...relation.to, field: "email" } }] } });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.issues.some((issue) => issue.code === "BROKEN_REFERENCE")).toBe(true);
});
it("rejects a previous type on an unchanged field and unknown focus elements", () => {
  const doc = fixture();
  if (doc.diagram.kind !== "entity-relationship") throw new Error("expected ER");
  const entities = doc.diagram.entities.map((entity) => ({ ...entity, fields: entity.fields.map((field) => ({ ...field, delta: "unchanged" })) }));
  expect(safeParseDiagramDoc({ ...doc, diagram: { ...doc.diagram, entities } }).ok).toBe(false);
  expect(safeParseDiagramDoc({ ...doc, diagram: { ...doc.diagram, scenarios: [{ id: "bad", label: "Bad", steps: [{ elements: ["missing"] }] }] } }).ok).toBe(false);
});
