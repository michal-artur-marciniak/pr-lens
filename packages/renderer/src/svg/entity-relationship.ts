import { paintCardGroup, paintCardSurface, paintText } from "./components.js";
import type { EntityRelationshipDiagram, EntityRelationshipScenario } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import type { Palette } from "../theme.js";
import { SUBTITLE_SIZE, TITLE_SIZE_SMALL } from "../design.js";
import { connectionAttributes, badgeColours, stylesFor } from "./styles.js";
import { toneFor } from "./document.js";
import { badgeWidth, deltaBadgeText } from "../layout/architecture.js";
import { measure } from "../text.js";
import { diagramDelta, diagramLabel, diagramText, timedFocus } from "./diagram-primitives.js";
import { tag, wrap } from "./primitives.js";

export const paintEntityRelationship = (model: EntityRelationshipDiagram, palette: Palette, scenario: EntityRelationshipScenario | undefined) => {
  const column = Math.max(250, ...model.entities.map((entity) => {
    const names = Math.max(70, ...entity.fields.map((field) => measure(field.label, "sans-bold", TITLE_SIZE_SMALL) + 12));
    const types = Math.max(...entity.fields.map((field) => measure(field.previous === undefined ? field.type : `${field.previous.type} → ${field.type}`, "mono", SUBTITLE_SIZE)));
    const badges = Math.max(0, ...entity.fields.map((field) => { const label = deltaBadgeText(field.delta); return label === undefined ? 0 : badgeWidth(label) + 16; }));
    return Math.max(measure(entity.label, "sans-bold", 13) + 60, 58 + names + types + badges + 14);
  }));
  const vertical = model.entities.length > 2;
  const tableHeight = Math.max(...model.entities.map((entity) => entity.fields.length * 34 + 40));
  const width = vertical ? Math.ceil(column + 240 + model.relations.length * 24) : Math.ceil(model.entities.length * column + (model.entities.length - 1) * 140 + 80);
  const height = vertical ? 90 + model.entities.length * (tableHeight + 70) : Math.max(...model.entities.map((entity) => entity.fields.length * 34 + 130)) + 70 + model.relations.length * 24;
  const elements: Record<string, Box> = {};
  const tables: string[] = [];
  model.entities.forEach((entity, i) => {
    const box = { x: vertical ? 40 : 40 + i * (column + 140), y: vertical ? 90 + i * (tableHeight + 70) : 90, width: column, height: 40 + entity.fields.length * 34 };
    elements[entity.id] = box;
    const nameWidth = Math.max(70, ...entity.fields.map((field) => measure(field.label, "sans-bold", TITLE_SIZE_SMALL) + 12));
    const rows = entity.fields.map((field, row) => {
      const fieldBox = { x: box.x, y: box.y + 40 + row * 34, width: column, height: 34 };
      elements[field.id] = fieldBox;
      const colours = badgeColours(toneFor(field.delta), palette);
      const keyX = fieldBox.x + 12;
      const nameX = fieldBox.x + 58;
      const typeX = nameX + nameWidth;
      const type = field.previous === undefined ? field.type : `${field.previous.type} → ${field.type}`;
      const text = (label: string, x: number, mono: boolean) => paintText({ x, y: fieldBox.y + 22, "font-size": mono ? undefined : TITLE_SIZE_SMALL }, label, mono ? "subtitle" : "title", palette, { "text-decoration": field.delta === "removed" ? "line-through" : undefined });
      const badgeBox = { ...fieldBox, y: fieldBox.y + 15 };
      return wrap("g", { "data-element": field.id, opacity: field.delta === "removed" ? 0.55 : 1 }, tag("rect", { ...fieldBox, fill: palette.card }) + (field.delta === "unchanged" ? "" : tag("rect", { ...fieldBox, fill: colours.fill, "fill-opacity": 0.3 })) + tag("line", { x1: fieldBox.x + 12, x2: fieldBox.x + column - 12, y1: fieldBox.y, y2: fieldBox.y, stroke: palette.cardBorder, "stroke-opacity": 0.45 }) + text(field.keys.join(" "), keyX, true) + text(field.label, nameX, false) + text(type, typeX, true) + diagramDelta(field.delta, badgeBox, palette));
    });
    tables.push(paintCardGroup(entity.delta, palette, paintCardSurface(box, entity.delta, palette) + diagramText(entity.label, box.x + column / 2, box.y + 25, palette) + diagramDelta(entity.delta, box, palette) + rows.join(""), { "data-element": entity.id }));
  });
  const cardinality = (value: EntityRelationshipDiagram["relations"][number]["from"]["cardinality"], x: number, y: number, direction: number): string => {
    const bar = (distance: number) => tag("line", { x1: x + direction * distance, x2: x + direction * distance, y1: y - 7, y2: y + 7, stroke: palette.edge, "stroke-width": 1.5 });
    const optional = value === "zero-or-one" || value === "zero-or-many";
    const many = value === "one-or-many" || value === "zero-or-many";
    const outer = optional ? tag("circle", { cx: x + direction * 22, cy: y, r: 5, fill: palette.background, stroke: palette.edge, "stroke-width": 1.5 }) : bar(22);
    const inner = many ? [-7, 0, 7].map((offset) => tag("line", { x1: x, y1: y + offset, x2: x + direction * 12, y2: y, stroke: palette.edge, "stroke-width": 1.5 })).join("") : bar(10);
    return inner + outer;
  };
  const relations: string[] = [];
  const relationPaths = new Map<string, string>();
  model.relations.forEach((relation, i) => {
    const from = elements[relation.from.entity];
    const to = elements[relation.to.entity];
    if (from === undefined || to === undefined) return;
    const direction = vertical || from.x < to.x ? 1 : -1;
    const a = elements[relation.from.field ?? relation.from.entity] ?? from;
    const b = elements[relation.to.field ?? relation.to.entity] ?? to;
    const x1 = direction === 1 ? from.x + from.width : from.x;
    const x2 = vertical ? to.x + to.width : direction === 1 ? to.x : to.x + to.width;
    const y1 = a.y + a.height / 2;
    const y2 = b.y + b.height / 2;
    const adjacent = Math.abs(model.entities.findIndex((entity) => entity.id === relation.from.entity) - model.entities.findIndex((entity) => entity.id === relation.to.entity)) === 1;
    const middle = vertical ? x1 + 40 + i * 24 : (x1 + x2) / 2 + i * 8;
    const bottom = Math.max(...model.entities.map((entity) => (elements[entity.id]?.y ?? 0) + (elements[entity.id]?.height ?? 0))) + 40 + i * 24;
    const path = vertical ? `M${x1},${y1} H${middle} V${y2} H${x2}` : adjacent ? `M${x1},${y1} H${middle} V${y2} H${x2}` : `M${x1},${y1} H${x1 + direction * 35} V${bottom} H${x2 - direction * 35} V${y2} H${x2}`;
    const box = vertical ? { x: x1, y: Math.min(y1, y2), width: middle - x1, height: Math.abs(y2 - y1) } : { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.max(16, (adjacent ? Math.max(y1, y2) : bottom) - Math.min(y1, y2)) };
    elements[relation.id] = box;
    relationPaths.set(relation.id, path);
    relations.push(wrap("g", { "data-element": relation.id }, tag("path", { d: path, ...connectionAttributes(relation.delta, palette) }) + cardinality(relation.from.cardinality, x1, y1, direction) + cardinality(relation.to.cardinality, x2, y2, vertical ? direction : -direction) + (relation.label === undefined && relation.delta === "unchanged" ? "" : diagramLabel([relation.label, relation.delta === "unchanged" ? undefined : relation.delta].filter((part) => part !== undefined).join(" · "), vertical ? middle + measure(relation.label ?? relation.delta, "sans-bold", 9.5) / 2 + 28 : adjacent ? middle : (x1 + x2) / 2, vertical ? (y1 + y2) / 2 : adjacent ? Math.min(y1, y2) - 18 : bottom - 8, palette))));
  });
  const focus = scenario?.steps.flatMap((step, index) => step.elements.map((id) => {
    const box = elements[id];
    if (box === undefined) return "";
    const cycle = scenario.steps.length + 1;
    const path = relationPaths.get(id);
    const body = path === undefined
      ? tag("rect", { x: box.x + 2, y: box.y + 1, width: box.width - 4, height: box.height - 2, rx: 5, ...stylesFor(palette).focus })
      : tag("path", { d: path, stroke: palette.selection, ...stylesFor(palette).glow });
    return timedFocus(body, index, 1, cycle, id);
  })) ?? [];
  return { width, height, atlas: { elements }, body: [...relations, ...tables, ...focus].join("") };
};
