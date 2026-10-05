import { assertNever, type GanttDiagram } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import { measure } from "../text.js";
import type { Palette } from "../theme.js";
import { paintCardGroup, paintCardSurface, paintText } from "./components.js";
import { diagramDelta, diagramText, roundedDiagramRoute, timedFocus } from "./diagram-primitives.js";
import { markerFor, toneFor } from "./document.js";
import { cardAttributes } from "./styles.js";
import { tag, wrap } from "./primitives.js";
export const paintGantt = (diagram: GanttDiagram, palette: Palette, animated: boolean) => {
  const labelWidth = Math.max(200, ...diagram.tasks.map((task) => measure(task.label, "sans", 11) + 110));
  const axis = labelWidth + 32, track = 540;
  const max = Math.max(1, ...diagram.tasks.map((task) => task.start + task.duration));
  const dependencies = diagram.tasks.reduce((sum, task) => sum + task.dependsOn.length, 0);
  const width = axis + track + 60 + dependencies * 4, height = 128 + diagram.tasks.length * 52;
  const elements: Record<string, Box> = {};
  const grid: string[] = [], bars: string[] = [], connectors: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const x = axis + i * track / 4;
    grid.push(diagramText(`${Number((max * i / 4).toFixed(2))}`, x, 91, palette, "caption") + tag("line", { x1: x, y1: 103, x2: x, y2: height - 24, stroke: palette.cardBorder, "stroke-opacity": 0.5, "stroke-dasharray": "2 6" }));
  }
  grid.push(diagramText(diagram.unit, 24, 91, palette, "caption", "start"));
  for (const [index, task] of diagram.tasks.entries()) {
    const y = 116 + index * 52;
    const box = { x: axis + task.start / max * track, y, width: task.duration / max * track, height: 24 };
    elements[task.id] = task.kind === "milestone" ? { ...box, x: box.x - 7, y: y + 5, width: 14, height: 14 } : box;
    bars.push(paintText({ x: 24, y: y + 16 }, task.label, "caption", palette) + diagramDelta(task.delta, { x: labelWidth - 78, y: y + 10, width: 78, height: 24 }, palette));
    switch (task.kind) {
      case "task": {
        bars.push(paintCardGroup(task.delta, palette, paintCardSurface(box, task.delta, palette), { "data-element": task.id }));
        if (animated) {
          const begin = task.start / max * 8 / 9, end = (task.start + task.duration) / max * 8 / 9;
          const keys = [...new Set([0, begin, end, 8 / 9, 1])];
          bars.push(timedFocus(wrap("rect", { x: box.x, y, width: 0, height: 24, rx: 6, fill: palette.selection, "fill-opacity": 0.15 }, tag("animate", { attributeName: "width", dur: "9s", repeatCount: "indefinite", keyTimes: keys.join(";"), values: keys.map((key) => key <= begin || key === 1 ? 0 : key >= end ? box.width : box.width * (key - begin) / (end - begin)).join(";"), calcMode: "linear" })), 0, 8, 9, `progress-${task.id}`));
        }
        break;
      }
      case "milestone": {
        const x = box.x;
        bars.push(wrap("g", { "data-element": task.id }, tag("path", { d: `M${x},${y + 5} L${x + 7},${y + 12} L${x},${y + 19} L${x - 7},${y + 12} Z`, ...cardAttributes(task.delta, palette) })));
        if (animated) bars.push(timedFocus(tag("circle", { cx: x, cy: y + 12, r: 11, fill: palette.selection, "fill-opacity": 0.15 }), task.start / max * 8, 0.5, 9, `milestone-${task.id}`));
        break;
      }
      default: assertNever(task);
    }
  }
  let edgeIndex = 0;
  for (const task of diagram.tasks) for (const dependency of task.dependsOn) {
    const from = elements[dependency], to = elements[task.id];
    if (from === undefined || to === undefined) continue;
    const corridor = axis + track + 20 + edgeIndex++ * 4;
    const path = roundedDiagramRoute(`M${from.x + from.width},${from.y + from.height / 2} L${corridor},${from.y + from.height / 2} L${corridor},${to.y - 10} L${to.x},${to.y - 10} L${to.x},${to.y}`);
    connectors.push(tag("path", { d: path, fill: "none", stroke: palette.edge, "stroke-width": 1, "stroke-opacity": 0.6, "marker-end": markerFor(toneFor("unchanged")) }));
  }
  const cursor = animated ? timedFocus(wrap("line", { x1: axis, x2: axis, y1: 102, y2: height - 20, stroke: palette.selection, "stroke-width": 1.5 }, tag("animateTransform", { attributeName: "transform", type: "translate", dur: "9s", repeatCount: "indefinite", values: `0 0;${track} 0;${track} 0`, keyTimes: "0;0.8888888889;1", calcMode: "linear" })), 0, 8, 9, "time-cursor") : "";
  return { width, height, body: [...grid, ...connectors, ...bars, cursor].join(""), atlas: { elements } };
};
