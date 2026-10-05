import { assertNever, compileSequence, type SequenceDiagram, type SequenceScenario, type SequenceStep } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import { measure } from "../text.js";
import type { Palette } from "../theme.js";
import { paintCardGroup, paintCardSurface, paintLaneSurface, paintLifeline, paintText } from "./components.js";
import { diagramDelta, diagramLabel, diagramText, timedFocus, timedPulse, timedRouteHighlight } from "./diagram-primitives.js";
import { markerFor, openMarkerFor, toneFor } from "./document.js";
import { messageAttributes } from "./styles.js";
import { tag, wrap } from "./primitives.js";

export const paintSequenceScenario = (diagram: SequenceDiagram, palette: Palette, scenario: SequenceScenario) => {
  const timeline = compileSequence(diagram, scenario);
  const cycle = timeline.duration + 1;
  const column = Math.max(210, ...diagram.participants.map((participant) => measure(participant.label, "sans", 13) + 64), ...diagram.messages.filter((message) => message.kind !== "self").map((message) => measure(message.label, "sans-bold", 9.5) + 56));
  const centres = new Map(diagram.participants.map((participant, index) => [participant.id, 110 + index * column]));
  const selfWidth = Math.max(0, ...diagram.messages.filter((message) => message.kind === "self").map((message) => measure(message.label, "sans-bold", 9.5) + 60));
  const width = 110 + (diagram.participants.length - 1) * column + Math.max(column / 2, selfWidth + 10);
  const elements: Record<string, Box> = {};
  const occurrences: Record<string, Box> = {};
  const rows = new Map<number, number>();
  const bandTop = new Map<number, number>();
  const bandBottom = new Map<number, number>();
  let top = 160;
  for (let time = 0; time < timeline.duration; time++) {
    const events = timeline.events.map((event, index) => ({ event, index })).filter(({ event }) => event.start === time);
    const starts = timeline.parallels.filter((visit) => visit.start === time).length;
    top += starts * 38;
    bandTop.set(time, top);
    events.forEach(({ index }, slot) => rows.set(index, top + 30 + slot * 52));
    top += 74 + Math.max(0, events.length - 1) * 38;
    bandBottom.set(time, top);
    top += timeline.parallels.filter((visit) => visit.start + visit.duration === time + 1).length * 32;
  }
  const height = top + 24;
  const frames: string[] = [];
  const lines = diagram.participants.map((participant) => paintLifeline(centres.get(participant.id) ?? 0, 118, height - 18, palette));
  const headers = diagram.participants.map((participant) => {
    const centre = centres.get(participant.id) ?? 0;
    const box = { x: centre - (column - 44) / 2, y: 70, width: column - 44, height: 48 };
    elements[participant.id] = box;
    return paintCardGroup(participant.delta, palette, paintCardSurface(box, participant.delta, palette) + diagramText(participant.label, centre, 100, palette) + diagramDelta(participant.delta, box, palette), { "data-element": participant.id });
  });
  const repeatMessages = new Map<string, Set<string>>();
  const collect = (steps: readonly SequenceStep[], parents: string[] = []): void => {
    for (const step of steps) switch (step.kind) {
      case "message": for (const id of parents) repeatMessages.get(id)?.add(step.message); break;
      case "repeat": repeatMessages.set(step.id, new Set()); collect(step.steps, [...parents, step.id]); break;
      case "choice": case "parallel": for (const branch of step.branches) collect(branch.steps, parents); break;
      default: assertNever(step);
    }
  };
  collect(diagram.steps);
  for (const [index, visit] of timeline.parallels.entries()) {
    const involved = visit.branches.flatMap((branch) => branch.events).flatMap((eventIndex) => {
      const event = timeline.events[eventIndex];
      const message = diagram.messages.find((message) => message.id === event?.message);
      return message === undefined ? [] : [centres.get(message.from) ?? 0, centres.get(message.to) ?? 0];
    });
    const left = Math.max(24, Math.min(...involved) - 56 - index % 3 * 8);
    const right = Math.min(width - 20, Math.max(...involved) + 80);
    const y = (bandTop.get(visit.start) ?? 0) - 36;
    const bottom = bandBottom.get(visit.start + visit.duration - 1) ?? y;
    const box = { x: left, y, width: right - left, height: bottom - y + 24 };
    occurrences[`parallel-${index}`] = box;
    elements[visit.id] ??= box;
    frames.push(paintLaneSurface(box, palette, { stroke: palette.cardBorder, "stroke-opacity": 0.65 }) + paintText({ x: left + 16, y: y + 22 }, `PARALLEL · ${visit.label}`, "laneLabel", palette));
    const joinX = involved[0] ?? left + 24;
    frames.push(tag("line", { x1: joinX - 10, y1: bottom + 10, x2: joinX + 10, y2: bottom + 10, stroke: palette.muted, "stroke-width": 3, "stroke-linecap": "round" }) + diagramText("All branches complete", joinX + 24, bottom + 14, palette, "caption", "start"));
  }
  const arrows: string[] = [];
  const labels: string[] = [];
  for (const [visitIndex, visit] of timeline.parallels.entries()) for (const branch of visit.branches) {
    if (branch.duration >= visit.duration) continue;
    const lastIndex = branch.events.at(-1);
    const event = lastIndex === undefined ? undefined : timeline.events[lastIndex];
    const message = diagram.messages.find((message) => message.id === event?.message);
    if (message === undefined) continue;
    const participant = message.kind === "return" ? message.from : message.to;
    const x = centres.get(participant) ?? 0;
    const y = (bandTop.get(visit.start + branch.duration) ?? 0) + 12;
    labels.push(timedFocus(diagramLabel("Complete", x, y, palette), visit.start + branch.duration, visit.duration - branch.duration, cycle, `complete-${visitIndex}-${branch.id}`));
  }
  for (const [index, event] of timeline.events.entries()) {
    const message = diagram.messages.find((message) => message.id === event.message);
    const y = rows.get(index);
    if (message === undefined || y === undefined) continue;
    const x1 = centres.get(message.from) ?? 0;
    const x2 = centres.get(message.to) ?? 0;
    const self = message.kind === "self";
    const path = self ? `M${x1},${y} L${x1 + 28},${y} Q${x1 + 34},${y} ${x1 + 34},${y + 6} L${x1 + 34},${y + 14} Q${x1 + 34},${y + 20} ${x1 + 28},${y + 20} L${x1},${y + 20}` : `M${x1},${y} L${x2},${y}`;
    const labelX = self ? x1 + 50 + measure(message.label, "sans-bold", 9.5) / 2 : (x1 + x2) / 2;
    const labelY = y - 10;
    const box = { x: Math.min(x1, x2), y: y - 22, width: self ? selfWidth : Math.abs(x2 - x1), height: self ? 44 : 24 };
    elements[message.id] ??= box;
    occurrences[`event-${index}`] = box;
    let marker: string;
    switch (message.kind) {
      case "async": marker = openMarkerFor(toneFor(message.delta)); break;
      case "sync": case "return": case "self": marker = markerFor(toneFor(message.delta)); break;
      default: marker = assertNever(message.kind);
    }
    arrows.push(wrap("g", { "data-element": message.id, "data-event": index, "data-start": event.start }, tag("path", { d: path, ...messageAttributes(message, palette), "marker-end": marker })));
    labels.push(diagramLabel(message.label, labelX, labelY, palette));
    labels.push(timedFocus(diagramLabel(message.label, labelX, labelY, { ...palette, pill: palette.neutralFill, pillBorder: palette.selection, muted: palette.selection }), event.start, event.duration, cycle, `event-${index}`));
    for (const visit of timeline.repeats.filter((visit) => repeatMessages.get(visit.id)?.has(message.id) && visit.start <= event.start && event.start < visit.start + visit.duration))
      labels.push(timedFocus(paintText({ x: labelX, y: labelY - 19, "text-anchor": "middle" }, `Attempt ${visit.iteration}/${visit.total}`, "caption", palette, { "font-size": 9, fill: palette.selection }), event.start, event.duration, cycle, `attempt-${index}-${visit.id}`));
    arrows.push(timedRouteHighlight(path, event.start, event.start + event.duration, cycle, message.delta, palette), timedPulse(path, event.start, event.duration, cycle, palette.selection));
  }
  return { width, height, body: [...frames, ...lines, ...headers, ...arrows, ...labels].join(""), atlas: { elements, occurrences } };
};
