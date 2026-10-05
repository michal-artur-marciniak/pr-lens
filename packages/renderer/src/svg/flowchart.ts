import { paintCardGroup, paintCardSurface, paintLaneSurface, paintText } from "./components.js";
import { assertNever, type FlowchartDiagram } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import { CARD_HEIGHT, ROW_GAP } from "../design.js";
import { cardAttributes, connectionAttributes } from "./styles.js";
import { measure } from "../text.js";
import type { Palette } from "../theme.js";
import { diagramColour, diagramDelta, diagramLabel, diagramText, roundedDiagramRoute, timedPulse } from "./diagram-primitives.js";
import { markerFor, toneFor } from "./document.js";
import { tag, wrap } from "./primitives.js";

export const paintFlowchart = (diagram: FlowchartDiagram, palette: Palette, path: readonly string[] | undefined) => {
  const ranks = new Map<string, number>();
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const backEdges = new Set<string>();
  const visit = (id: string, rank: number): void => {
    if (visiting.has(id)) return;
    ranks.set(id, Math.max(ranks.get(id) ?? 0, rank));
    if (visited.has(id)) return;
    visiting.add(id);
    for (const edge of diagram.edges.filter((edge) => edge.from === id)) {
      if (visiting.has(edge.to)) backEdges.add(edge.id);
      else visit(edge.to, rank + 1);
    }
    visiting.delete(id);
    visited.add(id);
  };
  const incoming = new Set(diagram.edges.map((edge) => edge.to));
  for (const node of diagram.nodes.filter((node) => !incoming.has(node.id))) visit(node.id, 0);
  for (const node of diagram.nodes) if (!visited.has(node.id)) visit(node.id, 0);
  // Relax forward edges so a join stays below every branch; back edges keep their return route.
  for (let pass = 0; pass < diagram.nodes.length; pass++)
    for (const edge of diagram.edges) {
      const from = ranks.get(edge.from) ?? 0;
      const to = ranks.get(edge.to) ?? 0;
      if (!backEdges.has(edge.id)) ranks.set(edge.to, Math.max(to, from + 1));
    }
  const width = Math.max(190, ...diagram.nodes.map((node) => Math.ceil(measure(node.label, "sans", 13) + (node.kind === "decision" ? 100 : 36))));
  const height = CARD_HEIGHT;
  const layerIds = Array.from(new Set(ranks.values())).sort((a, b) => a - b);
  const layers = layerIds.map((rank) => diagram.nodes.filter((node) => ranks.get(node.id) === rank));
  const widest = Math.max(...layers.map((layer) => layer.length));
  const elements: Record<string, Box> = {};
  const down = diagram.direction === "down";
  const canvasWidth = down ? widest * (width + 70) + 100 : layers.length * (width + 100) + 100;
  const canvasHeight = down ? layers.length * (height + ROW_GAP) + 120 : widest * (height + 80) + 120;
  layers.forEach((layer, rank) => layer.forEach((node, column) => {
    elements[node.id] = down
      ? { x: 50 + (widest - layer.length) * (width + 70) / 2 + column * (width + 70), y: 70 + rank * (height + ROW_GAP), width, height }
      : { x: 50 + rank * (width + 100), y: 70 + (widest - layer.length) * (height + 80) / 2 + column * (height + 80), width, height };
  }));
  const bodies: string[] = [];
  for (const group of diagram.groups) {
    const boxes = diagram.nodes.filter((node) => node.group === group.id).flatMap((node) => {
      const box = elements[node.id];
      return box === undefined ? [] : [box];
    });
    if (boxes.length === 0) continue;
    const x = Math.min(...boxes.map((box) => box.x)) - 18;
    const y = Math.min(...boxes.map((box) => box.y)) - 32;
    const box = { x, y, width: Math.max(...boxes.map((box) => box.x + box.width)) - x + 18, height: Math.max(...boxes.map((box) => box.y + box.height)) - y + 18 };
    elements[group.id] = box;
    bodies.push(paintLaneSurface(box, palette) + paintText({ x: x + 14, y: y + 17 }, group.label, "laneLabel", palette));
  }
  for (const [index, edge] of diagram.edges.entries()) {
    const from = elements[edge.from];
    const to = elements[edge.to];
    if (from === undefined || to === undefined) continue;
    const sx = down ? from.x + from.width / 2 : from.x + from.width;
    const sy = down ? from.y + from.height : from.y + from.height / 2;
    const tx = down ? to.x + to.width / 2 : to.x;
    const ty = down ? to.y : to.y + to.height / 2;
    const back = backEdges.has(edge.id) || (down ? ty <= sy : tx <= sx);
    const middle = down ? (ty - sy > height + ROW_GAP ? ty - 28 : (sy + ty) / 2) : (sx + tx) / 2;
    const corridor = down ? 22 + index * 3 : 25 + index * 3;
    const route = roundedDiagramRoute(back
      ? down ? `M${sx},${sy} L${sx},${sy + 22} L${corridor},${sy + 22} L${corridor},${ty - 20} L${tx},${ty - 20} L${tx},${ty}`
        : `M${sx},${sy} L${sx + 22},${sy} L${sx + 22},${corridor} L${tx - 20},${corridor} L${tx - 20},${ty} L${tx},${ty}`
      : down ? `M${sx},${sy} L${sx},${middle} L${tx},${middle} L${tx},${ty}` : `M${sx},${sy} L${middle},${sy} L${middle},${ty} L${tx},${ty}`);
    elements[edge.id] = { x: Math.min(sx, tx, back && down ? corridor : sx), y: Math.min(sy, ty, back && !down ? corridor : sy), width: Math.max(sx, tx) - Math.min(sx, tx, back && down ? corridor : sx) + (back && !down ? 22 : 4), height: Math.max(sy, ty) - Math.min(sy, ty, back && !down ? corridor : sy) + (back && down ? 22 : 4) };
    bodies.push(wrap("g", { "data-element": edge.id }, tag("path", { d: route, ...connectionAttributes(edge.delta, palette), "marker-end": markerFor(toneFor(edge.delta)) }) +
      (edge.label === undefined ? "" : diagramLabel(edge.label, down ? (back ? corridor + 20 : (sx + tx) / 2) : (back ? (sx + tx) / 2 : middle), down ? middle - 6 : (back ? corridor - 6 : (sy + ty) / 2 - 6), palette))));
    if (path !== undefined) path.forEach((id, step) => {
      if (id === edge.id) bodies.push(timedPulse(route, step, 1, path.length + 1, edge.delta === "unchanged" ? palette.edge : diagramColour(edge.delta, palette)));
    });
  }
  for (const node of diagram.nodes) {
    const box = elements[node.id];
    if (box === undefined) continue;
    const attrs = cardAttributes(node.delta, palette);
    let shape: string;
    switch (node.kind) {
      case "start": case "end": shape = tag("rect", { ...box, ...attrs, rx: height / 2 }); break;
      case "process": shape = paintCardSurface(box, node.delta, palette); break;
      case "decision": shape = tag("path", { d: `M${box.x + box.width / 2},${box.y} L${box.x + box.width},${box.y + box.height / 2} L${box.x + box.width / 2},${box.y + box.height} L${box.x},${box.y + box.height / 2} Z`, ...attrs }); break;
      case "datastore": shape = tag("rect", { ...box, ...attrs, rx: 12 }) + tag("ellipse", { cx: box.x + box.width / 2, cy: box.y + 12, rx: box.width / 2, ry: 12, ...attrs }); break;
      default: return assertNever(node.kind);
    }
    bodies.push(paintCardGroup(node.delta, palette, shape + diagramText(node.label, box.x + box.width / 2, box.y + box.height / 2 + 5, palette) + diagramDelta(node.delta, box, palette), { "data-element": node.id }));
  }
  return { width: canvasWidth, height: canvasHeight, body: bodies.join(""), atlas: { elements } };
};
