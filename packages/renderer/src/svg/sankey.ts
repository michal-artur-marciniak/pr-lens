import type { SankeyDiagram } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import { measure } from "../text.js";
import type { Palette } from "../theme.js";
import { paintText } from "./components.js";
import { diagramDelta, diagramText, timedFocus, timedPulse } from "./diagram-primitives.js";
import { toneColour, toneFor } from "./document.js";
import { tag, wrap } from "./primitives.js";
export const paintSankey = (diagram: SankeyDiagram, palette: Palette, path: readonly string[] | undefined) => {
  const layers = [...new Set(diagram.nodes.map((node) => node.layer))].sort((a, b) => a - b);
  const labelWidth = Math.max(150, ...diagram.nodes.map((node) => measure(node.label, "sans-bold", 11) + 90));
  const column = labelWidth + 100;
  const capacities = new Map(diagram.nodes.map((node) => [node.id, Math.max(diagram.flows.filter((flow) => flow.to === node.id).reduce((sum, flow) => sum + flow.value, 0), diagram.flows.filter((flow) => flow.from === node.id).reduce((sum, flow) => sum + flow.value, 0))]));
  const maxVolume = Math.max(...layers.map((layer) => diagram.nodes.filter((node) => node.layer === layer).reduce((sum, node) => sum + (capacities.get(node.id) ?? 0), 0)));
  const scale = 340 / maxVolume;
  const elements: Record<string, Box> = {};
  let height = 0;
  layers.forEach((layer, index) => {
    let y = 130;
    for (const node of diagram.nodes.filter((node) => node.layer === layer)) {
      const nodeHeight = (capacities.get(node.id) ?? 0) * scale;
      elements[node.id] = { x: 50 + index * column, y, width: 14, height: nodeHeight };
      y += nodeHeight + 64;
    }
    height = Math.max(height, y - 30);
  });
  const width = 50 + (layers.length - 1) * column + labelWidth + 30;
  const incoming = new Map<string, number>(), outgoing = new Map<string, number>();
  const ribbons: string[] = [], nodes: string[] = [];
  for (const flow of diagram.flows) {
    const from = elements[flow.from], to = elements[flow.to];
    if (from === undefined || to === undefined) continue;
    const thickness = flow.value * scale;
    const sx = from.x + from.width, sy = from.y + (outgoing.get(flow.from) ?? 0);
    const tx = to.x, ty = to.y + (incoming.get(flow.to) ?? 0);
    outgoing.set(flow.from, (outgoing.get(flow.from) ?? 0) + thickness); incoming.set(flow.to, (incoming.get(flow.to) ?? 0) + thickness);
    const mid = (sx + tx) / 2;
    const ribbon = `M${sx},${sy} C${mid},${sy} ${mid},${ty} ${tx},${ty} L${tx},${ty + thickness} C${mid},${ty + thickness} ${mid},${sy + thickness} ${sx},${sy + thickness} Z`;
    const route = `M${sx},${sy + thickness / 2} C${mid},${sy + thickness / 2} ${mid},${ty + thickness / 2} ${tx},${ty + thickness / 2}`;
    elements[flow.id] = { x: sx, y: Math.min(sy, ty), width: tx - sx, height: Math.abs(ty - sy) + thickness };
    ribbons.push(wrap("g", { "data-element": flow.id, "data-value": flow.value, "data-thickness": thickness }, tag("path", { d: ribbon, fill: toneColour(palette, toneFor(flow.delta)), "fill-opacity": flow.delta === "unchanged" ? 0.22 : 0.42 })));
    const step = path?.indexOf(flow.id) ?? -1;
    if (step >= 0 && path !== undefined) ribbons.push(timedFocus(tag("path", { d: ribbon, fill: palette.selection, "fill-opacity": 0.32 }), step, 1, path.length + 1, `flow-${flow.id}`), timedPulse(route, step, 1, path.length + 1, palette.selection));
  }
  for (const node of diagram.nodes) {
    const box = elements[node.id]; if (box === undefined) continue;
    nodes.push(wrap("g", { "data-element": node.id }, tag("rect", { ...box, rx: Math.min(3, box.height / 2), fill: toneColour(palette, toneFor(node.delta)) }) + paintText({ x: box.x, y: box.y - 28 }, node.label, "caption", palette, { "font-weight": 600 }) + diagramText(`${capacities.get(node.id)} ${diagram.unit}`, box.x, box.y - 12, palette, "caption", "start") + diagramDelta(node.delta, { x: box.x + measure(node.label, "sans-bold", 11) + 14, y: box.y - 28, width: 70, height: 24 }, palette)));
  }
  return { width, height, body: [...ribbons, ...nodes].join(""), atlas: { elements } };
};
