import { z } from "zod";
import { Delta, Id, Label } from "./primitives.js";
import type { SchemaIssue } from "./errors.js";
const Axis = z.strictObject({ id: Id, label: Label, delta: Delta.default("unchanged") });
export const MatrixDiagram = z.strictObject({
  kind: z.literal("matrix"),
  rows: z.array(Axis).min(1).max(16), columns: z.array(Axis).min(1).max(12),
  cells: z.array(z.strictObject({ id: Id, row: Id, column: Id, kind: z.enum(["present", "absent", "unknown"]).default("present"), label: Label.optional(), delta: Delta.default("unchanged") })).max(192).default([]),
  scenarios: z.array(z.strictObject({ id: Id, label: Label, steps: z.array(z.strictObject({ row: Id, cells: z.array(Id).min(1).max(12) })).min(1).max(64) })).max(16).default([]),
});
export type MatrixDiagram = z.infer<typeof MatrixDiagram>;
export const matrixPositionKey = (row: string, column: string): string => `${row.length}:${row}:${column}`;
export const matrixIssues = (diagram: MatrixDiagram): SchemaIssue[] => {
  const issues: SchemaIssue[] = [], ids = new Set<string>();
  for (const item of [...diagram.rows, ...diagram.columns, ...diagram.cells]) {
    if (ids.has(item.id)) issues.push({ code: "DUPLICATE_ID", path: "diagram", message: `duplicate id '${item.id}'` });
    ids.add(item.id);
  }
  const rows = new Set(diagram.rows.map((row) => row.id)), columns = new Set(diagram.columns.map((column) => column.id));
  const positions = new Set<string>();
  for (const cell of diagram.cells) {
    if (!rows.has(cell.row) || !columns.has(cell.column)) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.cells.${cell.id}`, message: "cell must reference a declared row and column" });
    const key = matrixPositionKey(cell.row, cell.column);
    if (positions.has(key)) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.cells.${cell.id}`, message: "only one cell is allowed at each position" });
    positions.add(key);
  }
  const cells = new Map(diagram.cells.map((cell) => [cell.id, cell]));
  const scenarios = new Set<string>();
  for (const scenario of diagram.scenarios) {
    if (scenarios.has(scenario.id)) issues.push({ code: "DUPLICATE_ID", path: "diagram.scenarios", message: "scenario IDs must be unique" });
    scenarios.add(scenario.id);
    for (const step of scenario.steps) {
      if (!rows.has(step.row)) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.scenarios.${scenario.id}`, message: "step must reference a declared row" });
      if (new Set(step.cells).size !== step.cells.length) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.scenarios.${scenario.id}`, message: "step cells must be unique" });
      for (const id of step.cells) {
        const cell = cells.get(id);
        if (cell === undefined) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.scenarios.${scenario.id}`, message: `unknown cell '${id}'` });
        else if (cell.row !== step.row) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.scenarios.${scenario.id}`, message: "step cells must belong to the selected row" });
      }
    }
  }
  return issues;
};
