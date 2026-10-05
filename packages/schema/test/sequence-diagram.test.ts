import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDiagramDoc, safeParseDiagramDoc } from "../src/diagram.js";
import { compileSequence } from "../src/sequence-diagram.js";

const fixture = (name: string) => {
  const doc = parseDiagramDoc(JSON.parse(readFileSync(new URL(`../../../docs/experiments/sequence/${name}.diagram.json`, import.meta.url), "utf8")));
  if (doc.diagram.kind !== "sequence") throw new Error("expected sequence");
  return doc.diagram;
};
describe("sequence scenarios", () => {
  it("compiles explicit retry outcomes", () => {
    const model = fixture("retry");
    const timelines = model.scenarios.map((scenario) => compileSequence(model, scenario));
    expect(timelines.map((timeline) => timeline.events.length)).toEqual([4, 8]);
    expect(timelines[1]?.events.filter((event) => event.message === "timeout")).toHaveLength(2);
    expect(timelines.every((timeline) => timeline.issues.length === 0)).toBe(true);
  });
  it("joins parallel branches after the longest branch", () => {
    const model = fixture("parallel");
    const scenario = model.scenarios[0];
    if (scenario === undefined) throw new Error("missing scenario");
    const timeline = compileSequence(model, scenario);
    expect(timeline.events.find((event) => event.message === "get-account")?.start).toBe(1);
    expect(timeline.events.find((event) => event.message === "get-billing")?.start).toBe(1);
    expect(timeline.events.at(-1)?.start).toBe(4);
  });
  it("rejects missing choices and unused scenario values", () => {
    const model = fixture("retry");
    for (const choices of [{}, { result: ["ready", "timed-out"] }]) {
      const result = safeParseDiagramDoc({ kind: "diagram", schemaVersion: "0.2.0", title: "Invalid", diagram: { ...model, scenarios: [{ id: "bad", label: "Bad", choices, iterations: { attempts: [1] } }] } });
      expect(result.ok).toBe(false);
    }
  });
});

it("reports each executed retry iteration on the shared clock", () => {
  const model = fixture("retry");
  const scenario = model.scenarios.find((item) => item.id === "retry-success");
  if (scenario === undefined) throw new Error("missing retry scenario");
  expect(compileSequence(model, scenario).repeats).toEqual([
    { id: "attempts", start: 1, duration: 2, iteration: 1, total: 3 },
    { id: "attempts", start: 3, duration: 2, iteration: 2, total: 3 },
    { id: "attempts", start: 5, duration: 2, iteration: 3, total: 3 },
  ]);
});
