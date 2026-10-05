import { assertNever } from "@coldtea/pr-lens-schema";
import type { DiagramDoc, Theme } from "@coldtea/pr-lens-schema";
import type { Box } from "./geometry.js";
import { paletteFor } from "./theme.js";
import { svgDocument } from "./svg/document.js";
import { diagramText } from "./svg/diagram-primitives.js";
import { paintSequence } from "./svg/sequence.js";
import { paintFlowchart } from "./svg/flowchart.js";

export type DiagramPlayback = { kind: "static" } | { kind: "scenario"; scenario: string };
export type DiagramRenderOptions = { theme: Theme; playback?: DiagramPlayback };
export type DiagramPicture = { svg: string; width: number; height: number; animated: boolean; atlas: { elements: Record<string, Box> } };

export class DiagramRenderError extends Error {
  constructor(readonly code: "UNKNOWN_SCENARIO", message: string) {
    super(message);
    this.name = "DiagramRenderError";
  }
}

export const renderDiagram = (doc: DiagramDoc, options: DiagramRenderOptions): DiagramPicture => {
  const playback = options.playback ?? { kind: "static" };
  const scenario = playback.kind === "scenario" ? doc.diagram.scenarios.find((item) => item.id === playback.scenario) : undefined;
  if (playback.kind === "scenario" && scenario === undefined)
    throw new DiagramRenderError("UNKNOWN_SCENARIO", `unknown scenario '${playback.scenario}'`);
  const palette = paletteFor(options.theme);
  const painted = (() => {
    switch (doc.diagram.kind) {
      case "flowchart": return paintFlowchart(doc.diagram, palette, doc.diagram.scenarios.find((item) => item.id === scenario?.id)?.path);
      case "sequence": return paintSequence(doc.diagram, palette, doc.diagram.scenarios.find((item) => item.id === scenario?.id));
      default: return assertNever(doc.diagram);
    }
  })();
  return {
    ...painted,
    animated: scenario !== undefined,
    svg: svgDocument({ ...painted, palette, title: doc.title, description: doc.summary,
      body: `<style>@media(prefers-reduced-motion:reduce){.diagram-motion{display:none}}</style>` + diagramText(doc.title, 24, 28, palette, 16, "start") + (scenario === undefined ? "" : diagramText(scenario.label, 24, 48, palette, 11, "start")) + painted.body }),
  };
};
