import { z } from "zod";
import { Delta, Id, Label } from "./primitives.js";
import type { SchemaIssue } from "./errors.js";

const Endpoint = z.strictObject({ entity: Id, field: Id.optional(), cardinality: z.enum(["one", "zero-or-one", "one-or-many", "zero-or-many"]) });
export const EntityRelationshipDiagram = z.strictObject({
  kind: z.literal("entity-relationship"),
  entities: z.array(z.strictObject({ id: Id, label: Label, delta: Delta.default("unchanged"), fields: z.array(z.strictObject({ id: Id, label: Label, type: Label, keys: z.array(z.enum(["PK", "FK"])).max(2).default([]), delta: Delta.default("unchanged"), previous: z.strictObject({ type: Label }).optional() })).min(1).max(24) })).min(2).max(8),
  relations: z.array(z.strictObject({ id: Id, from: Endpoint, to: Endpoint, label: Label.optional(), delta: Delta.default("unchanged") })).max(32).default([]),
  scenarios: z.array(z.strictObject({ id: Id, label: Label, steps: z.array(z.strictObject({ elements: z.array(Id).min(1).max(32) })).min(1).max(32) })).max(16).default([]),
});
export type EntityRelationshipDiagram = z.infer<typeof EntityRelationshipDiagram>;
export type EntityRelationshipScenario = EntityRelationshipDiagram["scenarios"][number];

export const entityRelationshipIssues = (model: EntityRelationshipDiagram): SchemaIssue[] => {
  const issues: SchemaIssue[] = [];
  const ids = new Set<string>();
  const add = (id: string) => { if (ids.has(id)) issues.push({ code: "DUPLICATE_ID", path: "diagram", message: `duplicate id '${id}'` }); ids.add(id); };
  const entities = new Map(model.entities.map((entity) => [entity.id, entity]));
  for (const entity of model.entities) {
    add(entity.id);
    for (const field of entity.fields) {
      add(field.id);
      if (new Set(field.keys).size !== field.keys.length) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.fields.${field.id}.keys`, message: "duplicate key marker" });
      if (field.previous !== undefined && (field.delta !== "modified" || field.previous.type === field.type)) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.fields.${field.id}.previous`, message: "previous type requires a modified field with a different type" });
    }
  }
  for (const relation of model.relations) {
    add(relation.id);
    for (const endpoint of [relation.from, relation.to]) {
      const entity = entities.get(endpoint.entity);
      if (entity === undefined || (endpoint.field !== undefined && !entity.fields.some((field) => field.id === endpoint.field))) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.relations.${relation.id}`, message: "endpoint must name an entity and one of its fields" });
    }
    if (relation.from.entity === relation.to.entity) issues.push({ code: "INVALID_DOCUMENT", path: `diagram.relations.${relation.id}`, message: "self relations are outside this experiment" });
  }
  const scenarios = new Set<string>();
  for (const scenario of model.scenarios) {
    if (scenarios.has(scenario.id)) issues.push({ code: "DUPLICATE_ID", path: "diagram.scenarios", message: "duplicate scenario id" });
    scenarios.add(scenario.id);
    for (const step of scenario.steps) for (const id of step.elements) if (!ids.has(id)) issues.push({ code: "BROKEN_REFERENCE", path: `diagram.scenarios.${scenario.id}`, message: `unknown element '${id}'` });
  }
  return issues;
};
