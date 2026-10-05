import type { Delta } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import { measure } from "../text.js";
import type { Palette } from "../theme.js";
import { toneColour, toneFor } from "./document.js";
import { escapeXml, tag, wrap } from "./primitives.js";

export const diagramText = (label: string, x: number, y: number, palette: Palette, size = 13, anchor = "middle"): string =>
  wrap("text", { x, y, fill: palette.foreground, "font-size": size, "text-anchor": anchor }, escapeXml(label));

export const diagramLabel = (label: string, x: number, y: number, palette: Palette): string => {
  const width = Math.ceil(measure(label, "sans", 11) + 14);
  return tag("rect", { x: x - width / 2, y: y - 12, width, height: 18, rx: 4, fill: palette.background }) + diagramText(label, x, y, palette, 11);
};

export const diagramColour = (delta: Delta, palette: Palette): string =>
  delta === "unchanged" ? palette.cardBorder : toneColour(palette, toneFor(delta));

export const diagramDelta = (delta: Delta, box: Box, palette: Palette): string =>
  delta === "unchanged" ? "" : diagramText(delta, box.x + box.width - 6, box.y + 12, palette, 9, "end");

export const timedPulse = (path: string, start: number, duration: number, cycle: number, colour: string): string => {
  const begin = start / cycle;
  const end = (start + duration) / cycle;
  const time = [0, begin, end, 1];
  const keys = Array.from(new Set(time));
  const positions = keys.map((key) => key <= begin ? 0 : 1);
  const visible = keys.map((key) => key === begin ? 1 : 0);
  return wrap("g", { class: "diagram-motion" }, wrap("circle", { r: 3.5, fill: colour, opacity: 0 },
    tag("animateMotion", { path, dur: `${cycle}s`, repeatCount: "indefinite", keyTimes: keys.join(";"), keyPoints: positions.join(";"), calcMode: "linear" }) +
    tag("animate", { attributeName: "opacity", dur: `${cycle}s`, repeatCount: "indefinite", keyTimes: keys.join(";"), values: visible.join(";"), calcMode: "discrete" })));
};
