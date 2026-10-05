import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseDiagramDoc, safeParseDiagramDoc } from "../src/diagram.js";
const input = () => JSON.parse(readFileSync(new URL("../../../docs/experiments/gantt/deploy.diagram.json", import.meta.url), "utf8"));
it("accepts concurrent tasks followed by a dependent migration and milestone", () => expect(parseDiagramDoc(input()).diagram.kind).toBe("gantt"));
it("rejects missing, premature and cyclic dependencies", () => {
  for (const dependencies of [["missing"], ["rollout"], ["unit"]]) {
    const raw = input(); raw.diagram.tasks[1].dependsOn = dependencies; expect(safeParseDiagramDoc(raw).ok).toBe(false);
  }
});
it("rejects positive milestone duration and zero task duration", () => {
  const raw = input(); raw.diagram.tasks[5].duration = 1; expect(safeParseDiagramDoc(raw).ok).toBe(false);
  const task = input(); task.diagram.tasks[0].duration = 0; expect(safeParseDiagramDoc(task).ok).toBe(false);
});
