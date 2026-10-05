import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDiagramDoc } from "@coldtea/pr-lens-schema";
import { DiagramRenderError, renderDiagram } from "../src/diagram.js";

const doc = parseDiagramDoc(JSON.parse(readFileSync(new URL("../../../docs/experiments/flowchart/cache.diagram.json", import.meta.url), "utf8")));

describe("flowchart SVG", () => {
  it("keeps geometry across themes and scenarios", () => {
    const hit = renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "cache-hit" } });
    const miss = renderDiagram(doc, { theme: "dark", playback: { kind: "scenario", scenario: "cache-miss" } });
    expect(hit.atlas).toEqual(miss.atlas);
    expect(hit.atlas.elements.response?.y).toBeGreaterThan(hit.atlas.elements.store?.y ?? 0);
    expect(hit.svg.match(/<animateMotion/g)).toHaveLength(4);
    expect(miss.svg.match(/<animateMotion/g)).toHaveLength(5);
    expect(renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "cache-hit" } }).svg).toBe(hit.svg);
  });

  it("exports static SVG with escaped text and no external resources", () => {
    const picture = renderDiagram({ ...doc, title: '<script>alert("x")</script>' }, { theme: "light" });
    expect(picture.animated).toBe(false);
    expect(picture.svg).toContain("&lt;script&gt;");
    expect(picture.svg).not.toMatch(/<script|<foreignObject|<animateMotion|href=/);
  });

  it("routes the hit past the cache-write node instead of through it", () => {
    const picture = renderDiagram(doc, { theme: "light" });
    const response = picture.atlas.elements.response;
    const store = picture.atlas.elements.store;
    expect(response).toBeDefined();
    expect(store).toBeDefined();
    if (response === undefined || store === undefined) return;
    const route = picture.svg.match(/data-element="cached-response"[^>]*><path[^>]*\sd="([^"]+)"/);
    expect(route?.[1]).toContain(`,${response.y - 28}`);
    expect(response.y - 28).toBeGreaterThan(store.y + store.height);
  });

  it("rejects an unknown scenario", () => {
    expect(() => renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "missing" } })).toThrow(DiagramRenderError);
  });
});

it("keeps the selected scenario path visible without animation", () => {
  const hit = renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "cache-hit" } });
  const miss = renderDiagram(doc, { theme: "light", playback: { kind: "scenario", scenario: "cache-miss" } });
  const selected = (svg: string) => Array.from(svg.matchAll(/data-element="([^"]+)" data-selected="true"/g), (match) => match[1]);
  expect(selected(hit.svg)).toEqual(["lookup", "check-cache", "hit", "cached-response"]);
  expect(selected(miss.svg)).toEqual(["lookup", "check-cache", "miss", "write", "stored-response"]);
  expect(hit.svg).toMatch(/data-element="hit" data-selected="true"><path[^>]*stroke="#0969da"/);
  expect(hit.svg).toMatch(/data-element="miss"><path[^>]*stroke="#8c959f"/);
  expect(selected(renderDiagram(doc, { theme: "light" }).svg)).toEqual([]);
  expect(hit.atlas).toEqual(miss.atlas);
});

it("preserves delta colour on a selected changed edge", () => {
  if (doc.diagram.kind !== "flowchart") throw new Error("expected flowchart");
  const changed = parseDiagramDoc({ ...doc, diagram: { ...doc.diagram, edges: doc.diagram.edges.map((edge) => edge.id === "hit" ? { ...edge, delta: "added" } : edge) } });
  const svg = renderDiagram(changed, { theme: "light", playback: { kind: "scenario", scenario: "cache-hit" } }).svg;
  expect(svg).toMatch(/data-element="hit" data-selected="true"><path[^>]*stroke="#1f883d"/);
  expect(svg).toMatch(/data-element="hit" data-selected="true">[^]*?<path[^>]*stroke="#0969da"[^>]*stroke-width="7"/);
});
