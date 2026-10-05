import { minimalGraph } from "@coldtea/pr-lens-schema/examples";
import { parseDiagramDoc } from "@coldtea/pr-lens-schema";
import { describe, expect, it } from "vitest";
import { render, renderDiagram, THEMES } from "../src/index.js";

const appearance = (markup: string | undefined, keepDimensions = false) => {
  if (markup === undefined) throw new Error("missing rendered component");
  const geometry = new Set(["x", "y", "class", "data-element", ...(keepDimensions ? [] : ["width", "height"])]);
  return Object.fromEntries(Array.from(markup.matchAll(/([\w-]+)="([^"]*)"/g), (match) => [match[1] ?? "", match[2] ?? ""]).filter(([name]) => name !== undefined && !geometry.has(name)));
};

// Compare public renders so a native diagram cannot silently acquire a second card or badge style.
describe("shared architecture and native appearance", () => {
  for (const theme of THEMES) for (const delta of ["added", "modified", "removed", "unchanged"] as const) {
    const families = [
      { name: "state", diagram: { kind: "state", states: [{ id: "start", kind: "initial", label: "Start" }, { id: "node", label: "GET /health", delta }], transitions: [{ id: "create", from: "start", to: "node", label: "Create" }] } },
      { name: "flowchart", diagram: { kind: "flowchart", nodes: [{ id: "node", kind: "process", label: "GET /health", delta }] } },
      { name: "sequence", diagram: { kind: "sequence", participants: [{ id: "node", label: "GET /health", delta }, { id: "other", label: "Other" }], messages: [{ id: "request", from: "node", to: "other", label: "Call" }], steps: [{ id: "step", kind: "message", message: "request" }] } },
      { name: "entity-relationship", diagram: { kind: "entity-relationship", entities: [{ id: "node", label: "GET /health", delta, fields: [{ id: "field", label: "id", type: "uuid" }] }, { id: "other", label: "Other", fields: [{ id: "other-field", label: "id", type: "uuid" }] }] } },
    ];
    for (const family of families) it(`shares ${family.name} card and badge appearance for ${delta} in ${theme}`, () => {
      const graph = { ...minimalGraph, nodes: minimalGraph.nodes.map((node) => ({ ...node, delta })) };
      const doc = parseDiagramDoc({ kind: "diagram", schemaVersion: "0.1.0", title: "Native", diagram: family.diagram });
      const original = render(graph, { lens: "architecture", theme }).svg;
      const native = renderDiagram(doc, { theme }).svg;
      expect(appearance(native.match(/<g data-element="node"[^>]*><rect([^>]*)\/>/)?.[1])).toEqual(appearance(original.match(/<rect class="card(?: card-[^"]+)?"([^>]*)\/>/)?.[1]));
      const badge = /<g class="bdg bdg-(?:added|modified|removed)"><rect([^>]*)\/><text([^>]*)>([^<]*)<\/text><\/g>/;
      const expected = original.match(badge);
      const actual = native.match(badge);
      if (delta === "unchanged") {
        expect(actual).toBeNull();
        expect(expected).toBeNull();
      } else {
        expect(appearance(actual?.[1], true)).toEqual(appearance(expected?.[1], true));
        expect(appearance(actual?.[2])).toEqual(appearance(expected?.[2]));
        expect(actual?.[3]).toBe(expected?.[3]);
      }
    });
  }
});
