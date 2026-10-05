import type { EntityRelationshipDiagram, EntityRelationshipScenario } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import type { Palette } from "../theme.js";
import { measure } from "../text.js";
import { diagramColour, diagramDelta, diagramLabel, diagramText } from "./diagram-primitives.js";
import { tag, wrap } from "./primitives.js";

export const paintEntityRelationship = (model: EntityRelationshipDiagram, palette: Palette, scenario: EntityRelationshipScenario | undefined) => {
  const fieldLabel = (field: EntityRelationshipDiagram["entities"][number]["fields"][number]) => `${field.keys.join(" ")} ${field.label}: ${field.previous === undefined ? field.type : `${field.previous.type} → ${field.type}`}`.trim();
  const column = Math.max(250, ...model.entities.flatMap((entity) => [measure(entity.label, "sans", 13) + 60, ...entity.fields.map((field) => measure(fieldLabel(field), "sans", 12) + 95)]));
  const width = Math.ceil(model.entities.length * column + (model.entities.length - 1) * 140 + 80);
  const height = Math.max(...model.entities.map((entity) => entity.fields.length * 34 + 130)) + 70 + model.relations.length * 24;
  const elements: Record<string, Box> = {};
  const tables: string[] = [];
  model.entities.forEach((entity, i) => {
    const box = { x: 40 + i * (column + 140), y: 90, width: column, height: 40 + entity.fields.length * 34 };
    elements[entity.id] = box;
    const rows = entity.fields.map((field, row) => {
      const fieldBox = { x: box.x, y: box.y + 40 + row * 34, width: column, height: 34 };
      elements[field.id] = fieldBox;
      return wrap("g", { "data-element": field.id }, tag("rect", { ...fieldBox, fill: palette.card, stroke: diagramColour(field.delta, palette), "stroke-dasharray": field.delta === "removed" ? "4 3" : undefined }) + diagramText(fieldLabel(field), fieldBox.x + 12, fieldBox.y + 22, palette, 12, "start") + diagramDelta(field.delta, fieldBox, palette));
    });
    tables.push(wrap("g", { "data-element": entity.id }, tag("rect", { ...box, rx: 7, fill: palette.card, stroke: diagramColour(entity.delta, palette) }) + diagramText(entity.label, box.x + column / 2, box.y + 25, palette) + diagramDelta(entity.delta, box, palette) + rows.join("")));
  });
  const cardinality = (value: EntityRelationshipDiagram["relations"][number]["from"]["cardinality"], x: number, y: number, direction: number): string => {
    const bar = (distance: number) => tag("line", { x1: x + direction * distance, x2: x + direction * distance, y1: y - 7, y2: y + 7, stroke: palette.edge, "stroke-width": 1.8 });
    const optional = value === "zero-or-one" || value === "zero-or-many";
    const many = value === "one-or-many" || value === "zero-or-many";
    const outer = optional ? tag("circle", { cx: x + direction * 22, cy: y, r: 5, fill: palette.background, stroke: palette.edge, "stroke-width": 1.8 }) : bar(22);
    const inner = many ? [-7, 0, 7].map((offset) => tag("line", { x1: x, y1: y + offset, x2: x + direction * 12, y2: y, stroke: palette.edge, "stroke-width": 1.8 })).join("") : bar(10);
    return inner + outer;
  };
  const relations: string[] = [];
  model.relations.forEach((relation, i) => {
    const from = elements[relation.from.entity];
    const to = elements[relation.to.entity];
    if (from === undefined || to === undefined) return;
    const direction = from.x < to.x ? 1 : -1;
    const a = elements[relation.from.field ?? relation.from.entity] ?? from;
    const b = elements[relation.to.field ?? relation.to.entity] ?? to;
    const x1 = direction === 1 ? from.x + from.width : from.x;
    const x2 = direction === 1 ? to.x : to.x + to.width;
    const y1 = a.y + a.height / 2;
    const y2 = b.y + b.height / 2;
    const adjacent = Math.abs(model.entities.findIndex((entity) => entity.id === relation.from.entity) - model.entities.findIndex((entity) => entity.id === relation.to.entity)) === 1;
    const middle = (x1 + x2) / 2 + i * 8;
    const bottom = Math.max(...model.entities.map((entity) => (elements[entity.id]?.y ?? 0) + (elements[entity.id]?.height ?? 0))) + 40 + i * 24;
    const path = adjacent ? `M${x1},${y1} H${middle} V${y2} H${x2}` : `M${x1},${y1} H${x1 + direction * 35} V${bottom} H${x2 - direction * 35} V${y2} H${x2}`;
    const box = { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.max(16, (adjacent ? Math.max(y1, y2) : bottom) - Math.min(y1, y2)) };
    elements[relation.id] = box;
    relations.push(wrap("g", { "data-element": relation.id }, tag("path", { d: path, fill: "none", stroke: diagramColour(relation.delta, palette), "stroke-width": 2, "stroke-dasharray": relation.delta === "removed" ? "5 4" : undefined }) + cardinality(relation.from.cardinality, x1, y1, direction) + cardinality(relation.to.cardinality, x2, y2, -direction) + (relation.label === undefined && relation.delta === "unchanged" ? "" : diagramLabel([relation.label, relation.delta === "unchanged" ? undefined : relation.delta].filter((part) => part !== undefined).join(" · "), adjacent ? middle : (x1 + x2) / 2, adjacent ? Math.min(y1, y2) - 18 : bottom - 8, palette))));
  });
  const focus = scenario?.steps.flatMap((step, index) => step.elements.map((id) => {
    const box = elements[id];
    if (box === undefined) return "";
    const cycle = scenario.steps.length + 1;
    const keys = [...new Set([0, index / cycle, (index + 1) / cycle, 1])];
    return wrap("g", { class: "diagram-motion", "data-focus": id }, wrap("rect", { x: box.x - 4, y: box.y - 3, width: box.width + 8, height: box.height + 6, rx: 5, fill: "none", stroke: palette.foreground, "stroke-width": 3, opacity: 0 }, tag("animate", { attributeName: "opacity", dur: `${cycle}s`, repeatCount: "indefinite", calcMode: "discrete", keyTimes: keys.join(";"), values: keys.map((key) => key === index / cycle ? 1 : 0).join(";") })));
  })) ?? [];
  return { width, height, atlas: { elements }, body: [...relations, ...tables, ...focus].join("") };
};
