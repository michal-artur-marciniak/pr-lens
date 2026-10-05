import type { TreeDiagram } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import { measure, wrapLabel } from "../text.js";
import type { Palette } from "../theme.js";
import { paintCardGroup, paintCardSurface, paintMultilineTitle } from "./components.js";
import { diagramDelta, roundedDiagramRoute, timedFocus, timedPulse, timedRouteHighlight } from "./diagram-primitives.js";
import { connectionAttributes } from "./styles.js";
import { tag, wrap } from "./primitives.js";
export const paintTree = (diagram: TreeDiagram, palette: Palette, path: readonly string[] | undefined) => {
  const cardWidth = Math.min(260, Math.max(180, ...diagram.nodes.map((node) => measure(node.label, "sans-bold", 13) + 36)));
  const labels = new Map(diagram.nodes.map((node) => [node.id, wrapLabel(node.label, cardWidth - 30, "sans-bold", 13)]));
  const cardHeight = Math.max(56, ...Array.from(labels.values(), (lines) => lines.length * 16 + 24));
  const row = cardHeight + 46;
  const elements: Record<string, Box> = {};
  let leaves = 0, deepest = 0;
  const place = (id: string, depth: number): number => {
    deepest = Math.max(deepest, depth);
    const children = diagram.nodes.filter((node) => node.parent === id);
    const positions = children.map((child) => place(child.id, depth + 1));
    const y = positions.length === 0 ? 100 + leaves++ * row : positions.reduce((sum, value) => sum + value, 0) / positions.length;
    elements[id] = { x: 40 + depth * (cardWidth + 100), y, width: cardWidth, height: cardHeight };
    return y;
  };
  const root = diagram.nodes.find((node) => node.parent === undefined);
  if (root !== undefined) place(root.id, 0);
  const width = 80 + (deepest + 1) * cardWidth + deepest * 100, height = 140 + Math.max(0, leaves - 1) * row + cardHeight;
  const edges: string[] = [], cards: string[] = [];
  for (const node of diagram.nodes) {
    const box = elements[node.id];
    if (box === undefined) continue;
    if (node.parent !== undefined) {
      const parent = elements[node.parent];
      if (parent !== undefined) {
        const route = roundedDiagramRoute(`M${parent.x + parent.width},${parent.y + parent.height / 2} L${parent.x + parent.width + 50},${parent.y + parent.height / 2} L${parent.x + parent.width + 50},${box.y + box.height / 2} L${box.x},${box.y + box.height / 2}`);
        edges.push(tag("path", { d: route, ...connectionAttributes(node.delta, palette) }));
        const step = path?.indexOf(node.id) ?? -1;
        if (step > 0 && path !== undefined) edges.push(timedRouteHighlight(route, step - 1, step, path.length + 1, node.delta, palette), timedPulse(route, step - 1, 1, path.length + 1, palette.selection));
      }
    }
    const title = paintMultilineTitle(labels.get(node.id) ?? [node.label], box.x + box.width / 2, box.y + box.height / 2, palette);
    const body = paintCardSurface(box, node.delta, palette) + title + diagramDelta(node.delta, box, palette);
    const step = path?.indexOf(node.id) ?? -1;
    const active = step < 0 || path === undefined ? "" : timedFocus(paintCardSurface(box, node.delta, node.delta === "unchanged" ? { ...palette, card: palette.neutralFill } : palette) + title + diagramDelta(node.delta, box, palette), step, 1, path.length + 1, `node-${node.id}`);
    cards.push(paintCardGroup(node.delta, palette, body + active, { "data-element": node.id }));
  }
  return { width, height, body: [...edges, ...cards].join(""), atlas: { elements } };
};
