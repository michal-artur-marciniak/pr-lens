import { assertNever, matrixPositionKey, type MatrixDiagram } from "@coldtea/pr-lens-schema";
import type { Box } from "../geometry.js";
import { measure, wrapLabel } from "../text.js";
import type { Palette } from "../theme.js";
import { paintCardGroup, paintCardSurface, paintMultilineTitle, paintText } from "./components.js";
import { diagramDelta, diagramText, timedFocus } from "./diagram-primitives.js";
import { tag } from "./primitives.js";
export const paintMatrix = (diagram: MatrixDiagram, palette: Palette, steps: MatrixDiagram["scenarios"][number]["steps"] | undefined) => {
  const rowWidth = Math.min(260, Math.max(170, ...diagram.rows.map((row) => measure(row.label, "sans-bold", 13) + 36)));
  const columnWidth = 132;
  const rowLabels = new Map(diagram.rows.map((row) => [row.id, wrapLabel(row.label, rowWidth - 28, "sans-bold", 13)]));
  const columnLabels = new Map(diagram.columns.map((column) => [column.id, wrapLabel(column.label, columnWidth - 24, "sans-bold", 13)]));
  const cellCaption = (cell: MatrixDiagram["cells"][number]): string => {
    let glyph: string;
    switch (cell.kind) {
      case "present": glyph = "✓"; break;
      case "absent": glyph = "—"; break;
      case "unknown": glyph = "?"; break;
      default: return assertNever(cell.kind);
    }
    return cell.label === undefined ? glyph : `${glyph} ${cell.label}`;
  };
  const cellLabels = new Map(diagram.cells.map((cell) => [cell.id, wrapLabel(cellCaption(cell), columnWidth - 24, "sans", 11)]));
  const headerHeight = Math.max(56, ...Array.from(columnLabels.values(), (labels) => labels.length * 16 + 24));
  const rowHeight = Math.max(56, ...Array.from(rowLabels.values(), (labels) => labels.length * 16 + 24), ...Array.from(cellLabels.values(), (labels) => labels.length * 15 + 24));
  const width = 56 + rowWidth + diagram.columns.length * (columnWidth + 14);
  const height = 136 + headerHeight + diagram.rows.length * (rowHeight + 18);
  const elements: Record<string, Box> = {}, headers: string[] = [], cells: string[] = [], focus: string[] = [];
  diagram.columns.forEach((column, index) => {
    const box = { x: 38 + rowWidth + index * (columnWidth + 14), y: 84, width: columnWidth, height: headerHeight };
    elements[column.id] = box;
    headers.push(paintCardGroup(column.delta, palette, paintCardSurface(box, column.delta, palette) + paintMultilineTitle(columnLabels.get(column.id) ?? [column.label], box.x + box.width / 2, box.y + box.height / 2, palette) + diagramDelta(column.delta, box, palette), { "data-element": column.id }));
  });
  const positions = new Map(diagram.cells.map((cell) => [matrixPositionKey(cell.row, cell.column), cell]));
  diagram.rows.forEach((row, rowIndex) => {
    const y = 84 + headerHeight + 22 + rowIndex * (rowHeight + 18);
    const rowBox = { x: 24, y, width: rowWidth, height: rowHeight };
    elements[row.id] = rowBox;
    headers.push(paintCardGroup(row.delta, palette, paintCardSurface(rowBox, row.delta, palette) + paintMultilineTitle(rowLabels.get(row.id) ?? [row.label], rowBox.x + rowWidth / 2, y + rowHeight / 2, palette) + diagramDelta(row.delta, rowBox, palette), { "data-element": row.id }));
    diagram.columns.forEach((column, columnIndex) => {
      const box = { x: 38 + rowWidth + columnIndex * (columnWidth + 14), y, width: columnWidth, height: rowHeight };
      const cell = positions.get(matrixPositionKey(row.id, column.id));
      if (cell === undefined) { cells.push(tag("rect", { ...box, rx: 10, fill: palette.lane, stroke: palette.cardBorder, "stroke-opacity": 0.5 }) + diagramText("·", box.x + box.width / 2, y + rowHeight / 2 + 4, palette, "caption")); return; }
      elements[cell.id] = box;
      const caption = (active: boolean) => (cellLabels.get(cell.id) ?? []).map((label, line, labels) => paintText({ x: box.x + box.width / 2, y: y + rowHeight / 2 + 4 + (line - (labels.length - 1) / 2) * 15, "text-anchor": "middle" }, label, "caption", palette, active && cell.delta === "unchanged" ? { fill: palette.selection } : {})).join("");
      cells.push(paintCardGroup(cell.delta, palette, paintCardSurface(box, cell.delta, palette) + caption(false) + diagramDelta(cell.delta, box, palette), { "data-element": cell.id }));
      steps?.forEach((step, index) => {
        if (step.cells.includes(cell.id)) focus.push(timedFocus(paintCardSurface(box, cell.delta, cell.delta === "unchanged" ? { ...palette, card: palette.neutralFill } : palette) + caption(true) + diagramDelta(cell.delta, box, palette), index, 1, steps.length + 1, `cell-${cell.id}-${index}`));
      });
    });
    steps?.forEach((step, index) => {
      if (step.row === row.id) focus.push(timedFocus(tag("rect", { x: rowBox.x + 8, y: y + rowHeight / 2 - 10, width: 3, height: 20, rx: 1.5, fill: palette.selection }), index, 1, steps.length + 1, `row-${row.id}-${index}`));
    });
  });
  const legend = diagramText("✓ Present   — Absent   ? Unknown   · Unspecified", 24, height - 18, palette, "caption", "start");
  return { width, height, body: [...headers, ...cells, ...focus, legend].join(""), atlas: { elements } };
};
