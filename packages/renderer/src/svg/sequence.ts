import { assertNever, compileSequence, type SequenceDiagram, type SequenceScenario, type SequenceStep } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import { CARD_RADIUS } from "../design.js";
import { cardAttributes, cardGroupAttributes } from "./styles.js";
import { measure } from "../text.js";
import type { Palette } from "../theme.js";
import { diagramColour, diagramDelta, diagramLabel, diagramText, timedPulse } from "./diagram-primitives.js";
import { markerFor, openMarkerFor, toneFor } from "./document.js";
import { tag, wrap } from "./primitives.js";

export const paintSequence = (diagram: SequenceDiagram, palette: Palette, scenario: SequenceScenario | undefined) => {
  const column = Math.max(190, ...diagram.participants.map((participant) => Math.ceil(measure(participant.label, "sans", 13) + 64)));
  const selfWidth = Math.max(0, ...diagram.messages.filter((message) => message.kind === "self").map((message) => measure(message.label, "sans-bold", 9.5) + 20));
  const width = diagram.participants.length * column + 80 + selfWidth;
  const elements: Record<string, Box> = {};
  const centres = new Map<string, number>();
  const rows = new Map<string, number>();
  const frames: string[] = [];
  const headers: string[] = [];
  diagram.participants.forEach((participant, i) => {
    const box = { x: 40 + i * column, y: 70, width: column - 30, height: 48 };
    const centre = box.x + box.width / 2;
    elements[participant.id] = box;
    centres.set(participant.id, centre);
    headers.push(wrap("g", { "data-element": participant.id, ...cardGroupAttributes(participant.delta, palette) }, tag("rect", { ...box, rx: CARD_RADIUS, ...cardAttributes(participant.delta, palette) }) + diagramText(participant.label, centre, 100, palette) + diagramDelta(participant.delta, box, palette)));
  });
  const layout = (steps: readonly SequenceStep[], top: number, depth: number): number => {
    let y = top;
    for (const step of steps) {
      const start = y;
      switch (step.kind) {
        case "message":
          rows.set(step.message, y + 24);
          elements[step.id] = { x: 30, y, width: width - 60, height: 52 };
          y += 52;
          break;
        case "repeat": y = layout(step.steps, y + 34, depth + 1) + 16; break;
        case "choice": case "parallel":
          y += 32;
          for (const branch of step.branches) {
            frames.push(diagramText(branch.label, 35 + depth * 10, y + 14, palette, 11, "start"));
            const branchTop = y;
            y = layout(branch.steps, y + 22, depth + 1);
            elements[branch.id] = { x: 30 + depth * 10, y: branchTop, width: width - 60 - depth * 20, height: y - branchTop };
            frames.push(tag("line", { x1: 30 + depth * 10, y1: y, x2: width - 30 - depth * 10, y2: y, stroke: palette.cardBorder, "stroke-dasharray": "3 4" }));
          }
          y += 16;
          break;
        default: assertNever(step);
      }
      if (step.kind !== "message") {
        const box = { x: 20 + depth * 10, y: start, width: width - 40 - depth * 20, height: y - start };
        elements[step.id] = box;
        frames.unshift(tag("rect", { ...box, rx: 10, fill: palette.lane, stroke: palette.cardBorder }) + diagramText(`${step.kind}: ${step.label}`, box.x + 8, box.y + 20, palette, 11, "start"));
      }
    }
    return y;
  };
  const height = layout(diagram.steps, 160, 0) + 44;
  const lines = diagram.participants.map((participant) => tag("line", { x1: centres.get(participant.id), x2: centres.get(participant.id), y1: 118, y2: height - 22, stroke: palette.lifeline, "stroke-dasharray": "4 4" }));
  const timeline = scenario === undefined ? undefined : compileSequence(diagram, scenario);
  const arrows: string[] = [];
  for (const message of diagram.messages) {
    const x1 = centres.get(message.from);
    const x2 = centres.get(message.to);
    const y = rows.get(message.id);
    if (x1 === undefined || x2 === undefined || y === undefined) continue;
    const self = message.kind === "self";
    const path = self ? `M${x1},${y} L${x1 + 30},${y} L${x1 + 30},${y + 18} L${x1},${y + 18}` : `M${x1},${y} L${x2},${y}`;
    const box = { x: Math.min(x1, x2), y: y - 16, width: Math.max(Math.abs(x2 - x1), 30), height: self ? 36 : 22 };
    elements[message.id] = box;
    let marker: string;
    switch (message.kind) {
      case "async": marker = openMarkerFor(toneFor(message.delta)); break;
      case "sync": case "return": case "self": marker = markerFor(toneFor(message.delta)); break;
      default: marker = assertNever(message.kind);
    }
    const matchingReturn = diagram.messages.find((candidate) => candidate.kind === "return" && candidate.from === message.to && candidate.to === message.from && (rows.get(candidate.id) ?? 0) > y);
    const returnY = matchingReturn === undefined ? undefined : rows.get(matchingReturn.id);
    if (message.kind === "sync" && returnY !== undefined) arrows.push(tag("rect", { x: x2 - 4, y, width: 8, height: returnY - y, fill: palette.chip, stroke: palette.cardBorder }));
    arrows.push(wrap("g", { "data-element": message.id }, tag("path", { d: path, fill: "none", stroke: message.delta === "unchanged" ? palette.edge : diagramColour(message.delta, palette), "stroke-width": 1.5, "stroke-dasharray": message.kind === "return" || message.delta === "removed" ? "5 4" : undefined, "marker-end": marker }) + diagramLabel(message.label, self ? x1 + 45 + measure(message.label, "sans-bold", 9.5) / 2 : (x1 + x2) / 2, y - 8, palette)));
    for (const event of timeline?.events ?? []) if (event.message === message.id)
      arrows.push(timedPulse(path, event.start, event.duration, (timeline?.duration ?? 0) + 1, message.delta === "unchanged" ? palette.edge : diagramColour(message.delta, palette)));
  }
  return { width, height, body: [...frames, ...lines, ...headers, ...arrows].join(""), atlas: { elements } };
};
