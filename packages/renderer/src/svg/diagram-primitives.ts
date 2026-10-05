import type { Delta } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import { BADGE_HEIGHT, BADGE_RADIUS, PILL_HEIGHT, PILL_PADDING_X, PILL_TEXT_SIZE } from "../design.js";
import { PULSE_RADIUS } from "./pulse.js";
import { badgeColours, stylesFor } from "./styles.js";
import { measure } from "../text.js";
import type { Palette } from "../theme.js";
import { toneColour, toneFor } from "./document.js";
import { escapeXml, tag, wrap } from "./primitives.js";

export const diagramText = (label: string, x: number, y: number, palette: Palette, size = 13, anchor = "middle"): string =>
  wrap("text", { x, y, fill: palette.foreground, "font-size": size, "text-anchor": anchor, "font-weight": size >= 13 ? 600 : 400, ...(size < 13 ? { fill: palette.muted } : {}) }, escapeXml(label));

export const diagramLabel = (label: string, x: number, y: number, palette: Palette): string => {
  const width = Math.ceil(measure(label, "sans-bold", PILL_TEXT_SIZE) + PILL_PADDING_X * 2);
  const styles = stylesFor(palette);
  return tag("rect", { x: x - width / 2, y: y - 11, width, height: PILL_HEIGHT, rx: PILL_HEIGHT / 2, ...styles.pill }) + wrap("text", { x, y, "text-anchor": "middle", ...styles.pillText, fill: palette.muted }, escapeXml(label));
};

export const diagramColour = (delta: Delta, palette: Palette): string =>
  delta === "unchanged" ? palette.cardBorder : toneColour(palette, toneFor(delta));

export const diagramDelta = (delta: Delta, box: Box, palette: Palette): string => {
  if (delta === "unchanged") return "";
  const colours = badgeColours(toneFor(delta), palette);
  const width = Math.ceil(measure(delta, "sans-bold", 8.5) + 22);
  const x = box.x + box.width - width - 8;
  const y = box.y - BADGE_HEIGHT / 2;
  return tag("rect", { x, y, width, height: BADGE_HEIGHT, rx: BADGE_RADIUS, fill: colours.fill, stroke: colours.stroke }) + wrap("text", { x: x + width / 2, y: y + 11, "text-anchor": "middle", ...stylesFor(palette).badgeText, fill: colours.text }, escapeXml(delta));
};

export const timedPulse = (path: string, start: number, duration: number, cycle: number, colour: string): string => {
  const begin = start / cycle;
  const end = (start + duration) / cycle;
  const time = [0, begin, end, 1];
  const keys = Array.from(new Set(time));
  const positions = keys.map((key) => key <= begin ? 0 : 1);
  const visible = keys.map((key) => key === begin ? 1 : 0);
  return wrap("g", { class: "diagram-motion" }, wrap("circle", { r: PULSE_RADIUS, fill: colour, opacity: 0 },
    tag("animateMotion", { path, dur: `${cycle}s`, repeatCount: "indefinite", keyTimes: keys.join(";"), keyPoints: positions.join(";"), calcMode: "linear" }) +
    tag("animate", { attributeName: "opacity", dur: `${cycle}s`, repeatCount: "indefinite", keyTimes: keys.join(";"), values: visible.join(";"), calcMode: "discrete" })));
};
