import { z } from "zod";
import { Delta, Id, Label } from "./primitives.js";
import type { SchemaIssue } from "./errors.js";
const Common = { id: Id, label: Label, start: z.number().finite().min(0).max(10000), delta: Delta.default("unchanged"), dependsOn: z.array(Id).max(8).default([]) };
export const GanttDiagram = z.strictObject({
  kind: z.literal("gantt"), unit: Label.default("Time"),
  tasks: z.array(z.discriminatedUnion("kind", [z.strictObject({ ...Common, kind: z.literal("task"), duration: z.number().finite().positive().max(10000) }), z.strictObject({ ...Common, kind: z.literal("milestone"), duration: z.literal(0).default(0) })])).min(1).max(32),
  scenarios: z.array(z.strictObject({ id: Id, label: Label })).max(1).default([]),
});
export type GanttDiagram = z.infer<typeof GanttDiagram>;
export const ganttIssues = (diagram: GanttDiagram): SchemaIssue[] => {
  const issues: SchemaIssue[] = [];
  const tasks = new Map(diagram.tasks.map((task) => [task.id, task]));
  if (tasks.size !== diagram.tasks.length) issues.push({ code: "DUPLICATE_ID", path: "diagram.tasks", message: "task IDs must be unique" });
  for (const task of diagram.tasks) {
    if (new Set(task.dependsOn).size !== task.dependsOn.length) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.tasks.${task.id}.dependsOn`, message: "dependencies must be unique" });
    for (const id of task.dependsOn) {
      const dependency = tasks.get(id);
      if (dependency === undefined) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.tasks.${task.id}.dependsOn`, message: `unknown task '${id}'` });
      else if (id === task.id || dependency.start + dependency.duration > task.start) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.tasks.${task.id}.dependsOn`, message: "dependencies must finish before a task starts" });
    }
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) { issues.push({ code: "INVALID_DOCUMENT", path: "diagram.tasks", message: "dependency cycle" }); return; }
    if (visited.has(id)) return;
    visiting.add(id); tasks.get(id)?.dependsOn.forEach(visit); visiting.delete(id); visited.add(id);
  };
  diagram.tasks.forEach((task) => visit(task.id));
  return issues;
};
