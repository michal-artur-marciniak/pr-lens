import { z } from "zod";
import { Delta, Id, Label } from "./primitives.js";
import type { SchemaIssue } from "./errors.js";
export const SankeyDiagram = z.strictObject({
  kind: z.literal("sankey"), unit: Label.default("Units"),
  nodes: z.array(z.strictObject({ id: Id, label: Label, layer: z.int().min(0).max(7), delta: Delta.default("unchanged") })).min(2).max(32),
  flows: z.array(z.strictObject({ id: Id, from: Id, to: Id, value: z.number().finite().positive().max(1e9), delta: Delta.default("unchanged") })).min(1).max(64),
  scenarios: z.array(z.strictObject({ id: Id, label: Label, path: z.array(Id).min(1).max(7) })).max(16).default([]),
});
export type SankeyDiagram = z.infer<typeof SankeyDiagram>;
export const sankeyIssues = (diagram: SankeyDiagram): SchemaIssue[] => {
  const issues: SchemaIssue[] = [], ids = new Set<string>();
  for (const item of [...diagram.nodes, ...diagram.flows]) {
    if (ids.has(item.id)) issues.push({ code: "DUPLICATE_ID", path: "diagram", message: `duplicate id '${item.id}'` });
    ids.add(item.id);
  }
  const nodes = new Map(diagram.nodes.map((node) => [node.id, node]));
  for (const flow of diagram.flows) {
    const from = nodes.get(flow.from), to = nodes.get(flow.to);
    if (from === undefined || to === undefined) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.flows.${flow.id}`, message: "flow endpoints must name nodes" });
    else if (to.layer !== from.layer + 1) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.flows.${flow.id}`, message: "flows must connect adjacent forward layers" });
  }
  for (const node of diagram.nodes) {
    const incoming = diagram.flows.filter((flow) => flow.to === node.id).reduce((sum, flow) => sum + flow.value, 0);
    const outgoing = diagram.flows.filter((flow) => flow.from === node.id).reduce((sum, flow) => sum + flow.value, 0);
    if (incoming === 0 && outgoing === 0) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.nodes.${node.id}`, message: "Sankey nodes must be connected" });
    if (incoming > 0 && outgoing > 0 && Math.abs(incoming - outgoing) > Math.max(incoming, outgoing) * 1e-9) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.nodes.${node.id}`, message: "internal nodes must conserve flow volume" });
  }
  const flows = new Map(diagram.flows.map((flow) => [flow.id, flow]));
  const scenarios = new Set<string>();
  for (const scenario of diagram.scenarios) {
    if (scenarios.has(scenario.id)) issues.push({ code: "DUPLICATE_ID", path: "diagram.scenarios", message: "scenario IDs must be unique" });
    scenarios.add(scenario.id);
    let previous: string | undefined;
    for (const id of scenario.path) {
      const flow = flows.get(id);
      if (flow === undefined) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.scenarios.${scenario.id}`, message: `unknown flow '${id}'` });
      else { if (previous !== undefined && previous !== flow.from) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.scenarios.${scenario.id}`, message: "scenario flows must form a continuous path" }); previous = flow.to; }
    }
  }
  return issues;
};
