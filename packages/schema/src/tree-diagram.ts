import { z } from "zod";
import { Delta, Id, Label } from "./primitives.js";
import type { SchemaIssue } from "./errors.js";
export const TreeDiagram = z.strictObject({
  kind: z.literal("tree"),
  nodes: z.array(z.strictObject({ id: Id, label: Label, parent: Id.optional(), delta: Delta.default("unchanged") })).min(1).max(64),
  scenarios: z.array(z.strictObject({ id: Id, label: Label, path: z.array(Id).min(1).max(17) })).max(16).default([]),
});
export type TreeDiagram = z.infer<typeof TreeDiagram>;
export const treeIssues = (diagram: TreeDiagram): SchemaIssue[] => {
  const issues: SchemaIssue[] = [];
  const nodes = new Map(diagram.nodes.map((node) => [node.id, node]));
  if (nodes.size !== diagram.nodes.length) issues.push({ code: "DUPLICATE_ID", path: "diagram.nodes", message: "node IDs must be unique" });
  const roots = diagram.nodes.filter((node) => node.parent === undefined);
  if (roots.length !== 1) issues.push({ code: "INVALID_DOCUMENT", path: "diagram.nodes", message: "tree needs exactly one root" });
  for (const node of diagram.nodes) {
    if (node.parent !== undefined && !nodes.has(node.parent)) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.nodes.${node.id}.parent`, message: `unknown parent '${node.parent}'` });
    const seen = new Set<string>();
    let current = node;
    while (current.parent !== undefined) {
      if (seen.has(current.id)) { issues.push({ code: "INVALID_DOCUMENT", path: "diagram.nodes", message: "tree must not contain cycles" }); break; }
      seen.add(current.id);
      if (seen.size > 16) { issues.push({ code: "INVALID_DOCUMENT", path: "diagram.nodes", message: "tree depth exceeds 16 levels" }); break; }
      const parent = nodes.get(current.parent);
      if (parent === undefined) break;
      current = parent;
    }
  }
  const ids = new Set<string>();
  for (const scenario of diagram.scenarios) {
    if (ids.has(scenario.id)) issues.push({ code: "DUPLICATE_ID", path: "diagram.scenarios", message: "scenario IDs must be unique" });
    ids.add(scenario.id);
    scenario.path.forEach((id, index) => {
      const node = nodes.get(id);
      if (node === undefined) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.scenarios.${scenario.id}`, message: `unknown node '${id}'` });
      else if (index === 0 ? id !== roots[0]?.id : node.parent !== scenario.path[index - 1]) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.scenarios.${scenario.id}`, message: "scenario must follow a root-to-descendant path" });
    });
  }
  return issues;
};
