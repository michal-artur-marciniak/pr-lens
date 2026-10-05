import type { Delta } from "@coldtea/pr-lens-schema";
import { BADGE_HEIGHT, BADGE_RADIUS, CARD_RADIUS, LANE_RADIUS } from "../design.js";
import { coord, type Box } from "../geometry.js";
import type { Palette } from "../theme.js";
import type { Tone } from "./document.js";
import { badgeColours, cardAttributes, cardGroupAttributes, stylesFor } from "./styles.js";
import { tag, textNode, wrap, type Attributes } from "./primitives.js";

export type TextRole = "title" | "subtitle" | "caption" | "heading" | "laneLabel";

export const paintText = (attributes: Attributes, text: string, role: TextRole, palette: Palette, decoration: Attributes = {}): string =>
  textNode({ ...attributes, ...stylesFor(palette)[role], ...decoration }, text);

export const paintCardSurface = (box: Box, delta: Delta, palette: Palette, attributes: Attributes = {}): string =>
  tag("rect", { ...attributes, x: coord(box.x), y: coord(box.y), width: coord(box.width), height: coord(box.height), rx: CARD_RADIUS, ...cardAttributes(delta, palette) });

export const paintCardGroup = (delta: Delta, palette: Palette, children: string, attributes: Attributes = {}): string =>
  wrap("g", { ...attributes, ...cardGroupAttributes(delta, palette) }, children);

export const paintLaneSurface = (box: Box, palette: Palette, attributes: Attributes = {}): string =>
  tag("rect", { ...attributes, x: coord(box.x), y: coord(box.y), width: coord(box.width), height: coord(box.height), rx: LANE_RADIUS, ...stylesFor(palette).lane });

export const paintBadge = (text: string, box: Box, tone: Tone, palette: Palette): string => {
  const colours = badgeColours(tone, palette);
  return wrap("g", { class: `bdg bdg-${tone}` }, tag("rect", {
    x: coord(box.x), y: coord(box.y), width: coord(box.width), height: BADGE_HEIGHT, rx: BADGE_RADIUS,
    fill: colours.fill, stroke: colours.stroke, "stroke-width": 1,
  }) + textNode({ x: coord(box.x + box.width / 2), y: coord(box.y + BADGE_HEIGHT / 2 + 3), "text-anchor": "middle", ...stylesFor(palette).badgeText, fill: colours.text }, text));
};

export const paintLabelPill = (text: string, box: Box, tone: Tone, palette: Palette): string => {
  const styles = stylesFor(palette);
  return wrap(
    "g",
    {},
    tag("rect", {
      class: "lpill",
      x: coord(box.x),
      y: coord(box.y),
      width: coord(box.width),
      height: coord(box.height),
      rx: box.height / 2,
      ...styles.pill,
    }) +
      textNode(
        {
          class: tone === "neutral" ? "ltext" : `ltext ltext-${tone}`,
          x: coord(box.x + box.width / 2),
          y: coord(box.y + box.height / 2 + 3.5),
          "text-anchor": "middle",
          ...styles.pillText,
          fill: badgeColours(tone, palette).text,
        },
        text,
      ),
  );
};

export const paintLifeline = (x: number, top: number, bottom: number, palette: Palette, attributes: Attributes = {}): string =>
  tag("line", { ...attributes, x1: coord(x), y1: coord(top), x2: coord(x), y2: coord(bottom), ...stylesFor(palette).lifeline });

export const paintActivation = (box: Box, palette: Palette, tone: "added" | "neutral" = "added", attributes: Attributes = {}): string =>
  tag("rect", { ...attributes, x: coord(box.x), y: coord(box.y), width: box.width, height: coord(box.height), rx: 4, ...stylesFor(palette)[tone === "added" ? "activation" : "neutralActivation"] });
