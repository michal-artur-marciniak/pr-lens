import { z } from "zod";
import { Delta, Id, Label } from "./primitives.js";
import type { SchemaIssue } from "./errors.js";
export const StateDiagram = z.strictObject({
  kind: z.literal("state"),
  direction: z.enum(["down", "right"]).default("down"),
  states: z.array(z.strictObject({ id: Id, kind: z.enum(["initial", "state", "final"]).default("state"), label: Label, delta: Delta.default("unchanged") })).min(2).max(32),
  transitions: z.array(z.strictObject({ id: Id, from: Id, to: Id, label: Label, guard: Label.optional(), delta: Delta.default("unchanged") })).min(1).max(64),
  scenarios: z.array(z.strictObject({ id: Id, label: Label, path: z.array(Id).min(1).max(128) })).max(16).default([]),
});
export type StateDiagram = z.infer<typeof StateDiagram>;
export const stateIssues = (diagram: StateDiagram): SchemaIssue[] => {
  const issues: SchemaIssue[] = [];
  const ids = new Set<string>();
  for (const item of [...diagram.states, ...diagram.transitions]) {
    if (ids.has(item.id)) issues.push({ code: "DUPLICATE_ID", path: "diagram", message: `duplicate id '${item.id}'` });
    ids.add(item.id);
  }
  const states = new Map(diagram.states.map((state) => [state.id, state]));
  const initial = diagram.states.filter((state) => state.kind === "initial");
  if (initial.length !== 1) issues.push({ code: "INVALID_DOCUMENT", path: "diagram.states", message: "state diagram needs exactly one initial state" });
  for (const transition of diagram.transitions) {
    if (!states.has(transition.from) || !states.has(transition.to)) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.transitions.${transition.id}`, message: "transition endpoints must name states" });
    if (states.get(transition.from)?.kind === "final" || states.get(transition.to)?.kind === "initial") issues.push({ code: "INVALID_DOCUMENT", path: `diagram.transitions.${transition.id}`, message: "final states cannot have outgoing transitions and initial states cannot have incoming transitions" });
  }
  const transitions = new Map(diagram.transitions.map((transition) => [transition.id, transition]));
  const scenarios = new Set<string>();
  for (const scenario of diagram.scenarios) {
    if (scenarios.has(scenario.id)) issues.push({ code: "DUPLICATE_ID", path: "diagram.scenarios", message: `duplicate scenario '${scenario.id}'` });
    scenarios.add(scenario.id);
    let state = initial[0]?.id;
    for (const id of scenario.path) {
      const transition = transitions.get(id);
      if (transition === undefined) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.scenarios.${scenario.id}`, message: `unknown transition '${id}'` });
      else {
        if (transition.from !== state) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.scenarios.${scenario.id}`, message: "scenario must start at the initial state and follow continuous transitions" });
        state = transition.to;
      }
    }
  }
  return issues;
};
