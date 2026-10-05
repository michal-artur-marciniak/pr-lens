import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { run } from "../src/cli.js";

const source = new URL("../../../docs/experiments/flowchart/cache.diagram.json", import.meta.url).pathname;

test("validates and exports a native scenario through the CLI", async () => {
  const out = await mkdtemp(join(tmpdir(), "pr-lens-diagram-"));
  const messages: string[] = [];
  const terminal = { out: (line: string) => messages.push(line), err: (line: string) => messages.push(line) };
  expect(await run(["validate", source], terminal, {})).toBe(0);
  expect(await run(["diagram", source, "--scenario", "cache-hit", "--theme", "both", "--out", out], terminal, {})).toBe(0);
  const files = await readdir(out);
  expect(files.filter((file) => file.endsWith(".svg"))).toHaveLength(2);
  expect(await readFile(join(out, "diagram-render.json"), "utf8")).toContain('"animated": true');
});

test("rejects an unknown scenario without writing an output", async () => {
  const parent = await mkdtemp(join(tmpdir(), "pr-lens-diagram-error-"));
  const errors: string[] = [];
  expect(await run(["diagram", source, "--scenario", "missing", "--out", join(parent, "output")], { out: () => {}, err: (line) => errors.push(line) }, {})).toBe(1);
  expect(errors.join("\n")).toContain("UNKNOWN_SCENARIO");
  expect(await readdir(parent)).toEqual([]);
});
