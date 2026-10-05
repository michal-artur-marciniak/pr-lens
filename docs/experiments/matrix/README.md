# Matrix diagrams

Rows and columns identify two sets of objects. Explicit cells describe present, absent or unknown relationships and can carry a short label plus a change status. A missing cell means unspecified, not absent. The SVG includes a legend for all four states.

```sh
pnpm build
node packages/cli/dist/bin.js diagram docs/experiments/matrix/permissions.diagram.json --scenario review-access --theme both
node packages/cli/dist/bin.js diagram docs/experiments/matrix/permissions.diagram.json --theme neutral
```

The access example shows service permissions, a new inventory reservation permission, changed billing access and removed analytics access. Each playback step chooses a row and one or more cells belonging to it. A short marker identifies the row; exact cells receive a gentle fill while code-change colours remain visible. Animation pauses and resets. Reduced motion retains the full matrix and legend.

Limits: 16 rows, 12 columns, 192 explicit cells, 16 scenarios and 64 steps per scenario. IDs must be unique, each position has at most one cell, and scenario cells must belong to the selected row. Axis titles and cell labels wrap. Themes share geometry. This is an explanatory matrix, not an editable permission system or a numeric heatmap. SVG only, without scripts or Mermaid syntax.
