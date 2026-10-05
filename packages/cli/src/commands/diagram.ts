import { parseDiagramDoc, PrLensSchemaError, type Theme } from "@coldtea/pr-lens-schema";
import { contentHash, DiagramRenderError, renderDiagram } from "@coldtea/pr-lens-renderer";
import { join } from "node:path";
import { expectOne, parseOptions, readString } from "../args.js";
import { readTextFile, writeJsonFile, writeTextFile } from "../io.js";
import { prepareWorkspace } from "../workspace.js";
import { PrLensCliError, usageError } from "../errors.js";
import type { Terminal } from "../terminal.js";

export const USAGE = `pr-lens diagram <diagram.json> [options]

Draws a native experimental diagram as a self-contained SVG.

  --theme <theme>     light | dark | both | neutral (default light)
  --scenario <id>     animate this scenario (default static)
  -o, --out <dir>     output directory (default .pr-lens/diagrams)`;

export const diagramAssetFileName = (kind: string, theme: Theme, hash: string): string =>
  `diagram-${kind}-${theme}-${hash}.svg`;

export const diagramCommand = async (args: readonly string[], terminal: Terminal): Promise<void> => {
  const { values, positionals } = parseOptions(args, { theme: { type: "string" }, scenario: { type: "string" }, out: { type: "string", short: "o" } });
  const file = expectOne(positionals, "one diagram document to render");
  const raw = await readTextFile(file);
  const doc = (() => {
    try { return parseDiagramDoc(JSON.parse(raw)); }
    catch (error) {
      if (error instanceof PrLensSchemaError) throw new PrLensCliError("INVALID_DOCUMENT", error.message, error.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
      if (error instanceof SyntaxError) throw new PrLensCliError("UNREADABLE_FILE", `${file} is not valid JSON`);
      throw error;
    }
  })();
  const selection = readString(values.theme, "theme") ?? "light";
  let themes: Theme[];
  switch (selection) {
    case "light": case "dark": case "neutral": themes = [selection]; break;
    case "both": themes = ["light", "dark"]; break;
    default: throw usageError(`unknown theme '${selection}'`);
  }
  const scenario = readString(values.scenario, "scenario");
  const rendered = themes.map((theme) => {
    try {
      const picture = renderDiagram(doc, { theme, playback: scenario === undefined ? { kind: "static" } : { kind: "scenario", scenario } });
      const hash = contentHash(picture.svg);
      return { picture, theme, hash, path: diagramAssetFileName(doc.diagram.kind, theme, hash) };
    } catch (error) {
      if (error instanceof DiagramRenderError) throw new PrLensCliError("RENDER_FAILED", `${error.message} [${error.code}]`);
      throw error;
    }
  });
  const out = readString(values.out, "out") ?? ".pr-lens/diagrams";
  await prepareWorkspace(out, terminal);
  for (const { picture, path } of rendered) await writeTextFile(join(out, path), picture.svg);
  await writeJsonFile(join(out, "drawn.diagram.json"), doc);
  await writeJsonFile(join(out, "diagram-render.json"), { kind: "diagram-render", sourceHash: contentHash(raw), diagram: doc.diagram.kind, scenario, assets: rendered.map(({ picture, theme, hash, path }) => ({ path, theme, contentHash: hash, width: picture.width, height: picture.height, animated: picture.animated, atlas: picture.atlas })) });
  terminal.out(rendered.map(({ path }) => join(out, path)).join("\n"));
};
