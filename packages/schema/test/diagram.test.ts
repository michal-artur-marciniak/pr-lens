import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDiagramDoc, safeParseDiagramDoc } from "../src/diagram.js";

const source = (): unknown => JSON.parse(readFileSync(new URL("../../../docs/experiments/flowchart/cache.diagram.json", import.meta.url), "utf8"));

describe("native flowchart documents", () => {
  it("validates the hit and miss paths", () => {
    const doc = parseDiagramDoc(source());
    if (doc.diagram.kind !== "flowchart") throw new Error("expected flowchart fixture");
    expect(doc.diagram.scenarios.map((item) => item.id)).toEqual(["cache-hit", "cache-miss"]);
  });

  it("rejects disconnected paths and unresolved references", () => {
    const doc = parseDiagramDoc(source());
    if (doc.diagram.kind !== "flowchart") throw new Error("expected flowchart fixture");
    const bad = safeParseDiagramDoc({ ...doc, diagram: { ...doc.diagram, scenarios: [{ id: "bad", label: "Bad", path: ["lookup", "write", "missing"] }] } });
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.error.issues.map((issue) => issue.code)).toEqual(["INVALID_DOCUMENT", "BROKEN_REFERENCE"]);
  });

  it("rejects duplicate element ids and unknown groups", () => {
    const doc = parseDiagramDoc(source());
    if (doc.diagram.kind !== "flowchart") throw new Error("expected flowchart fixture");
    const result = safeParseDiagramDoc({ ...doc, diagram: { ...doc.diagram, nodes: [...doc.diagram.nodes, { id: "request", kind: "process", label: "Duplicate", group: "missing" }] } });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.issues.map((issue) => issue.code)).toContain("DUPLICATE_ID");
    expect(result.error.issues.map((issue) => issue.code)).toContain("BROKEN_REFERENCE");
  });
});
