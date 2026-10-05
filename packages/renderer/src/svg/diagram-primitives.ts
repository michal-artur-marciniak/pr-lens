import type { Delta } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import { BADGE_HEIGHT, PILL_HEIGHT, PILL_PADDING_X, PILL_TEXT_SIZE, TITLE_SIZE } from "../design.js";
import { paintPulse } from "./pulse.js";
import { stylesFor } from "./styles.js";
import { paintBadge, paintLabelPill, paintText, type TextRole } from "./components.js";
import { badgeWidth, deltaBadgeText } from "../layout/architecture.js";
import { measure } from "../text.js";
import type { Palette } from "../theme.js";
import { toneColour, toneFor } from "./document.js";
import { tag, wrap } from "./primitives.js";

export const diagramText = (label: string, x: number, y: number, palette: Palette, role: TextRole = "title", anchor = "middle"): string =>
  paintText({ x, y, "font-size": role === "title" ? TITLE_SIZE : undefined, "text-anchor": anchor }, label, role, palette);

export const diagramLabel = (label: string, x: number, y: number, palette: Palette, tone = "neutral" as const): string => {
  const width = measure(label, "sans-bold", PILL_TEXT_SIZE) + PILL_PADDING_X * 2;
  return paintLabelPill(label, { x: x - width / 2, y: y - 11, width, height: PILL_HEIGHT }, tone, palette);
};

export const diagramColour = (delta: Delta, palette: Palette): string =>
  delta === "unchanged" ? palette.cardBorder : toneColour(palette, toneFor(delta));

export const diagramDelta = (delta: Delta, box: Box, palette: Palette): string => {
  if (delta === "unchanged") return "";
  const label = deltaBadgeText(delta);
  if (label === undefined) return "";
  const width = badgeWidth(label);
  return paintBadge(label, { x: box.x + box.width - width - 8, y: box.y - BADGE_HEIGHT / 2, width, height: BADGE_HEIGHT }, toneFor(delta), palette);
};

export const timedPulse = (path: string, start: number, duration: number, cycle: number, colour: string): string => {
  const begin = start / cycle;
  const end = (start + duration) / cycle;
  const time = [0, begin, end, 1];
  const keys = Array.from(new Set(time));
  const positions = keys.map((key) => key <= begin ? 0 : 1);
  const visible = keys.map((key) => key === begin ? 1 : 0);
  return wrap("g", { class: "diagram-motion" }, paintPulse(colour,
    tag("animateMotion", { path, dur: `${cycle}s`, repeatCount: "indefinite", keyTimes: keys.join(";"), keyPoints: positions.join(";"), calcMode: "linear" }) +
    tag("animate", { attributeName: "opacity", dur: `${cycle}s`, repeatCount: "indefinite", keyTimes: keys.join(";"), values: visible.join(";"), calcMode: "discrete" }), { opacity: 0 }));
};

export const roundedDiagramRoute = (route: string): string => {
  const points = Array.from(route.matchAll(/[ML]([\d.-]+),([\d.-]+)/g), (match) => ({ x: Number(match[1]), y: Number(match[2]) }));
  const first = points[0];
  if (first === undefined || points.length < 3) return route;
  let result = `M${first.x},${first.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const before = points[i - 1];
    const point = points[i];
    const after = points[i + 1];
    if (before === undefined || point === undefined || after === undefined) continue;
    const incoming = Math.hypot(point.x - before.x, point.y - before.y);
    const outgoing = Math.hypot(after.x - point.x, after.y - point.y);
    const radius = Math.min(7, incoming / 2, outgoing / 2);
    if (radius === 0) continue;
    const entry = { x: point.x + (before.x - point.x) * radius / incoming, y: point.y + (before.y - point.y) * radius / incoming };
    const exit = { x: point.x + (after.x - point.x) * radius / outgoing, y: point.y + (after.y - point.y) * radius / outgoing };
    result += ` L${entry.x},${entry.y} Q${point.x},${point.y} ${exit.x},${exit.y}`;
  }
  const last = points.at(-1);
  return last === undefined ? result : `${result} L${last.x},${last.y}`;
};

export const timedRouteHighlight = (path: string, start: number, activeDuration: number, cycle: number, delta: Delta, palette: Palette): string => {
  const begin = start / cycle;
  const end = (start + 1) / cycle;
  const visibility = [...new Set([0, begin, activeDuration / cycle, 1])];
  const reveal = [...new Set([0, begin, end, 1])];
  const animation = tag("animate", { attributeName: "stroke-dashoffset", dur: `${cycle}s`, repeatCount: "indefinite", keyTimes: reveal.join(";"), values: reveal.map((key) => key <= begin ? 1 : 0).join(";"), calcMode: "linear" });
  const line = (halo: boolean) => wrap("path", { d: path, fill: "none", stroke: palette.selection, ...(halo ? stylesFor(palette).glow : { "stroke-width": 2.25 }), pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, animation);
  return wrap("g", { class: "diagram-motion", "data-route-highlight": "true", opacity: 0 },
    tag("animate", { attributeName: "opacity", dur: `${cycle}s`, repeatCount: "indefinite", keyTimes: visibility.join(";"), values: visibility.map((key) => key >= begin && key < activeDuration / cycle ? 1 : 0).join(";"), calcMode: "discrete" }) + line(true) + (delta === "unchanged" ? line(false) : ""));
};
