import { z } from "zod";
import { Delta, Id, Label } from "./primitives.js";
import { MessageKind } from "./graph.js";
import { assertNever } from "./utils.js";
import type { SchemaIssue } from "./errors.js";

export type SequenceBranch = { id: string; label: string; steps: SequenceStep[] };
export type SequenceStep =
  | { id: string; kind: "message"; message: string }
  | { id: string; kind: "choice"; label: string; branches: SequenceBranch[] }
  | { id: string; kind: "repeat"; label: string; steps: SequenceStep[] }
  | { id: string; kind: "parallel"; label: string; branches: SequenceBranch[] };

export const SequenceStep: z.ZodType<SequenceStep> = z.lazy(() => z.discriminatedUnion("kind", [
  z.strictObject({ id: Id, kind: z.literal("message"), message: Id }),
  z.strictObject({ id: Id, kind: z.literal("choice"), label: Label, branches: z.array(SequenceBranch).min(2).max(8) }),
  z.strictObject({ id: Id, kind: z.literal("repeat"), label: Label, steps: z.array(SequenceStep).min(1).max(64) }),
  z.strictObject({ id: Id, kind: z.literal("parallel"), label: Label, branches: z.array(SequenceBranch).min(2).max(8) }),
]));
const SequenceBranch: z.ZodType<SequenceBranch> = z.lazy(() => z.strictObject({ id: Id, label: Label, steps: z.array(SequenceStep).min(1).max(64) }));

export const SequenceScenario = z.strictObject({
  id: Id, label: Label,
  choices: z.record(Id, z.array(Id).min(1).max(256)).default({}),
  iterations: z.record(Id, z.array(z.int().min(1).max(8)).min(1).max(256)).default({}),
});
export type SequenceScenario = z.infer<typeof SequenceScenario>;

export const SequenceDiagram = z.strictObject({
  kind: z.literal("sequence"),
  participants: z.array(z.strictObject({ id: Id, label: Label, delta: Delta.default("unchanged") })).min(2).max(8),
  messages: z.array(z.strictObject({ id: Id, from: Id, to: Id, label: Label, kind: MessageKind.default("sync"), delta: Delta.default("unchanged") })).min(1).max(64),
  steps: z.array(SequenceStep).min(1).max(64),
  scenarios: z.array(SequenceScenario).max(16).default([]),
});
export type SequenceDiagram = z.infer<typeof SequenceDiagram>;
export type SequenceEvent = { message: string; start: number; duration: number };
export type SequenceTimeline = { events: SequenceEvent[]; duration: number; issues: SchemaIssue[] };
export const MAX_SEQUENCE_VISITS = 256;

export const compileSequence = (diagram: SequenceDiagram, scenario: SequenceScenario): SequenceTimeline => {
  const events: SequenceEvent[] = [];
  const issues: SchemaIssue[] = [];
  const choices = new Map<string, number>();
  const iterations = new Map<string, number>();
  let visits = 0;
  const failure = (id: string, message: string) => issues.push({ code: "INVALID_DOCUMENT", path: `diagram.scenarios.${scenario.id}.${id}`, message });
  const walk = (steps: readonly SequenceStep[], start: number): number => {
    let time = start;
    for (const step of steps) {
      if (++visits > MAX_SEQUENCE_VISITS) { failure(step.id, `scenario exceeds ${MAX_SEQUENCE_VISITS} step visits`); return time; }
      switch (step.kind) {
        case "message": events.push({ message: step.message, start: time, duration: 1 }); time += 1; break;
        case "choice": {
          const visit = choices.get(step.id) ?? 0;
          choices.set(step.id, visit + 1);
          const selected = scenario.choices[step.id]?.[visit];
          const branch = step.branches.find((branch) => branch.id === selected);
          if (branch === undefined) failure(step.id, "each choice visit needs a declared branch");
          else time = walk(branch.steps, time);
          break;
        }
        case "repeat": {
          const visit = iterations.get(step.id) ?? 0;
          iterations.set(step.id, visit + 1);
          const count = scenario.iterations[step.id]?.[visit];
          if (count === undefined) failure(step.id, "each repeat visit needs an iteration count");
          else for (let i = 0; i < count && visits <= MAX_SEQUENCE_VISITS; i++) time = walk(step.steps, time);
          break;
        }
        case "parallel": time = Math.max(...step.branches.map((branch) => walk(branch.steps, time))); break;
        default: assertNever(step);
      }
    }
    return time;
  };
  const duration = walk(diagram.steps, 0);
  for (const [id, values] of Object.entries(scenario.choices))
    if ((choices.get(id) ?? 0) !== values.length) failure(id, "choice values must match the visits in this scenario");
  for (const [id, values] of Object.entries(scenario.iterations))
    if ((iterations.get(id) ?? 0) !== values.length) failure(id, "iteration values must match the visits in this scenario");
  return { events, duration, issues };
};

export const sequenceIssues = (diagram: SequenceDiagram): SchemaIssue[] => {
  const issues: SchemaIssue[] = [];
  const ids = new Set<string>();
  const usedMessages = new Set<string>();
  const add = (id: string) => { if (ids.has(id)) issues.push({ code: "DUPLICATE_ID", path: "diagram", message: `duplicate id '${id}'` }); ids.add(id); };
  const participants = new Set(diagram.participants.map((participant) => participant.id));
  const messages = new Set(diagram.messages.map((message) => message.id));
  diagram.participants.forEach((participant) => add(participant.id));
  diagram.messages.forEach((message) => {
    add(message.id);
    if (!participants.has(message.from) || !participants.has(message.to)) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.messages.${message.id}`, message: "message endpoints must name participants" });
    if ((message.kind === "self") !== (message.from === message.to)) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.messages.${message.id}.kind`, message: "self messages must have identical endpoints" });
  });
  let count = 0;
  const walk = (steps: readonly SequenceStep[], depth: number): void => {
    if (depth > 8) { issues.push({ code: "INVALID_DOCUMENT", path: "diagram.steps", message: "sequence nesting exceeds 8 levels" }); return; }
    for (const step of steps) {
      if (++count > MAX_SEQUENCE_VISITS) { issues.push({ code: "INVALID_DOCUMENT", path: "diagram.steps", message: "too many sequence steps" }); return; }
      add(step.id);
      switch (step.kind) {
        case "message":
          if (!messages.has(step.message)) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.steps.${step.id}`, message: `unknown message '${step.message}'` });
          if (usedMessages.has(step.message)) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.steps.${step.id}`, message: "a message must have one structural position" });
          usedMessages.add(step.message);
          break;
        case "repeat": walk(step.steps, depth + 1); break;
        case "choice": case "parallel": for (const branch of step.branches) { add(branch.id); walk(branch.steps, depth + 1); } break;
        default: assertNever(step);
      }
    }
  };
  walk(diagram.steps, 0);
  for (const message of diagram.messages) if (!usedMessages.has(message.id)) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.messages.${message.id}`, message: "message is not placed in the sequence" });
  const structureValid = issues.length === 0;
  const scenarioIds = new Set<string>();
  for (const scenario of diagram.scenarios) {
    if (scenarioIds.has(scenario.id)) issues.push({ code: "DUPLICATE_ID", path: "diagram.scenarios", message: `duplicate scenario '${scenario.id}'` });
    scenarioIds.add(scenario.id);
    if (structureValid) issues.push(...compileSequence(diagram, scenario).issues);
  }
  return issues;
};
