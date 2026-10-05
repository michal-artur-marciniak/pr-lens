import { MatrixDiagram, matrixIssues } from "./matrix-diagram.js";
import { SankeyDiagram, sankeyIssues } from "./sankey-diagram.js";
import { TreeDiagram, treeIssues } from "./tree-diagram.js";
import { GanttDiagram, ganttIssues } from "./gantt-diagram.js";
import { StateDiagram, stateIssues } from "./state-diagram.js";
import { assertNever } from "./utils.js";
import { SequenceDiagram, sequenceIssues } from "./sequence-diagram.js";
import { EntityRelationshipDiagram, entityRelationshipIssues } from "./entity-relationship-diagram.js";
import { z } from "zod";
import { Delta, Id, Label, Summary } from "./primitives.js";
import { PrLensSchemaError, type Parsed, type SchemaIssue } from "./errors.js";

export const DIAGRAM_SCHEMA_VERSION = "0.8.0" as const;

export const DiagramNode = z.strictObject({
  id: Id,
  kind: z.enum(["start", "end", "process", "decision", "datastore"]),
  label: Label,
  delta: Delta.default("unchanged"),
  group: Id.optional(),
});
export type DiagramNode = z.infer<typeof DiagramNode>;

export const FlowchartDiagram = z.strictObject({
  kind: z.literal("flowchart"),
  direction: z.enum(["down", "right"]).default("down"),
  nodes: z.array(DiagramNode).min(1).max(64),
  edges: z.array(z.strictObject({
    id: Id, from: Id, to: Id, label: Label.optional(), delta: Delta.default("unchanged"),
  })).max(128).default([]),
  groups: z.array(z.strictObject({ id: Id, label: Label })).max(16).default([]),
  scenarios: z.array(z.strictObject({
    id: Id, label: Label, path: z.array(Id).min(1).max(256),
  })).max(16).default([]),
});
export type FlowchartDiagram = z.infer<typeof FlowchartDiagram>;

export const DiagramDoc = z.strictObject({
  schemaVersion: z.string().regex(/^0\.[12345678]\.\d+$/, "unsupported experimental diagram version"),
  kind: z.literal("diagram"),
  title: Label,
  summary: Summary.optional(),
  diagram: z.discriminatedUnion("kind", [FlowchartDiagram, SequenceDiagram, EntityRelationshipDiagram, StateDiagram, GanttDiagram, TreeDiagram, SankeyDiagram, MatrixDiagram]),
});
export type DiagramDoc = z.infer<typeof DiagramDoc>;

export const flowchartIssues = (diagram: FlowchartDiagram): SchemaIssue[] => {
  const issues: SchemaIssue[] = [];
  const ids = new Set<string>();
  const checkId = (id: string, path: string) => {
    if (ids.has(id)) issues.push({ code: "DUPLICATE_ID", path, message: `duplicate id '${id}'` });
    ids.add(id);
  };
  const nodes = new Map(diagram.nodes.map((node) => [node.id, node]));
  const edges = new Map(diagram.edges.map((edge) => [edge.id, edge]));
  const groups = new Set(diagram.groups.map((group) => group.id));
  diagram.groups.forEach((group, i) => checkId(group.id, `diagram.groups[${i}].id`));
  diagram.nodes.forEach((node, i) => {
    checkId(node.id, `diagram.nodes[${i}].id`);
    if (node.group !== undefined && !groups.has(node.group))
      issues.push({ code: "BROKEN_REFERENCE", path: `diagram.nodes[${i}].group`, message: `unknown group '${node.group}'` });
  });
  diagram.edges.forEach((edge, i) => {
    checkId(edge.id, `diagram.edges[${i}].id`);
    for (const end of ["from", "to"] as const)
      if (!nodes.has(edge[end])) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.edges[${i}].${end}`, message: `unknown node '${edge[end]}'` });
  });
  const scenarios = new Set<string>();
  diagram.scenarios.forEach((scenario, i) => {
    if (scenarios.has(scenario.id)) issues.push({ code: "DUPLICATE_ID", path: `diagram.scenarios[${i}].id`, message: `duplicate scenario '${scenario.id}'` });
    scenarios.add(scenario.id);
    let previous: string | undefined;
    scenario.path.forEach((id, step) => {
      const edge = edges.get(id);
      const path = `diagram.scenarios[${i}].path[${step}]`;
      if (edge === undefined) issues.push({ code: "BROKEN_REFERENCE", path, message: `unknown edge '${id}'` });
      else {
        if (previous !== undefined && previous !== edge.from)
          issues.push({ code: "INVALID_DOCUMENT", path, message: "scenario edges must form a continuous path" });
        previous = edge.to;
      }
    });
  });
  return issues;
};

export const safeParseDiagramDoc = (input: unknown): Parsed<DiagramDoc> => {
  try {
    const parsed = DiagramDoc.safeParse(input);
    if (!parsed.success) {
      const issues: SchemaIssue[] = parsed.error.issues.map((issue) => ({
        code: issue.path[0] === "schemaVersion" ? "UNSUPPORTED_SCHEMA_VERSION" : "INVALID_DOCUMENT", path: issue.path.join("."), message: issue.message,
      }));
      return { ok: false, error: new PrLensSchemaError(issues[0]?.code ?? "INVALID_DOCUMENT", "invalid diagram document", issues) };
    }
    const issues = (() => {
      switch (parsed.data.diagram.kind) {
        case "matrix": return matrixIssues(parsed.data.diagram);
        case "sankey": return sankeyIssues(parsed.data.diagram);
        case "tree": return treeIssues(parsed.data.diagram);
        case "gantt": return ganttIssues(parsed.data.diagram);
        case "state": return stateIssues(parsed.data.diagram);
        case "flowchart": return flowchartIssues(parsed.data.diagram);
        case "sequence": return sequenceIssues(parsed.data.diagram);
        case "entity-relationship": return entityRelationshipIssues(parsed.data.diagram);
        default: return assertNever(parsed.data.diagram);
      }
    })();
    if (issues.length > 0) return { ok: false, error: new PrLensSchemaError(issues[0]?.code ?? "INVALID_DOCUMENT", "invalid diagram document", issues) };
    return { ok: true, value: parsed.data };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, error: new PrLensSchemaError("INVALID_DOCUMENT", "diagram nests too deeply") };
  }
};

export const parseDiagramDoc = (input: unknown): DiagramDoc => {
  const result = safeParseDiagramDoc(input);
  if (!result.ok) throw result.error;
  return result.value;
};
