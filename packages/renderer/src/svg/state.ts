import { assertNever, type StateDiagram } from "@coldtea/pr-lens-schema";
import type { Palette } from "../theme.js";
import { paintFlowchart } from "./flowchart.js";
import { paintCardSurface, paintMultilineTitle } from "./components.js";
import { diagramDelta, diagramText, timedFocus } from "./diagram-primitives.js";
import { tag } from "./primitives.js";
export const paintState = (diagram: StateDiagram, palette: Palette, path: readonly string[] | undefined) => {
  const active = path === undefined ? [] : [diagram.states.find((state) => state.kind === "initial")?.id, ...path.map((id) => diagram.transitions.find((transition) => transition.id === id)?.to)];
  return paintFlowchart({ kind: "flowchart", direction: diagram.direction, groups: [], scenarios: [], nodes: diagram.states.map((state) => ({ id: state.id, kind: "process", label: state.label, delta: state.delta })), edges: diagram.transitions.map((transition) => ({ ...transition, label: transition.guard === undefined ? transition.label : `${transition.label} [${transition.guard}]` })) }, palette, path, (node, box, labels) => {
    const state = diagram.states.find((state) => state.id === node.id);
    if (state === undefined) return "";
    const x = box.x + box.width / 2;
    const body = (colour: string): string => {
      switch (state.kind) {
        case "initial": return tag("circle", { cx: diagram.direction === "down" ? x : box.x + box.width - 9, cy: diagram.direction === "down" ? box.y + box.height - 9 : box.y + box.height / 2, r: 9, fill: colour }) + diagramText(state.label, x, box.y + 16, palette, "caption");
        case "final": return tag("circle", { cx: diagram.direction === "down" ? x : box.x + 12, cy: diagram.direction === "down" ? box.y + 12 : box.y + box.height / 2, r: 12, fill: palette.card, stroke: colour, "stroke-width": 1.5 }) + tag("circle", { cx: diagram.direction === "down" ? x : box.x + 12, cy: diagram.direction === "down" ? box.y + 12 : box.y + box.height / 2, r: 7, fill: colour }) + diagramText(state.label, x, box.y + 43, palette, "caption");
        case "state": return paintCardSurface(box, node.delta, colour === palette.selection && node.delta === "unchanged" ? { ...palette, card: palette.neutralFill } : palette) + paintMultilineTitle(labels, x, box.y + box.height / 2, palette);
        default: return assertNever(state.kind);
      }
    };
    return body(palette.foreground) + active.map((id, index) => id === node.id ? timedFocus(body(palette.selection), index, 1, active.length, `state-${node.id}-${index}`) : "").join("") + diagramDelta(node.delta, box, palette);
  });
};
