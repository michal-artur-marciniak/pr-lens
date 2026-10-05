# Tree diagrams

A tree shows ownership or containment. Each node has one optional parent; exactly one node is the root. Cards use the shared PR Lens style, with wrapped titles and change badges. Connectors express hierarchy, not request direction.

```sh
pnpm build
node packages/cli/dist/bin.js diagram docs/experiments/tree/modules.diagram.json --scenario reservation --theme both
node packages/cli/dist/bin.js diagram docs/experiments/tree/modules.diagram.json --scenario history --theme neutral
```

The module example highlights where a new inventory reservation module belongs. A pulse walks the chosen root-to-descendant path; cards receive a gentle temporary fill. The full tree remains visible. Geometry does not depend on the scenario or theme; reduced motion keeps the static tree readable.

Limits: 64 nodes, 16 parent levels and 16 scenarios. Missing parents, cycles, multiple roots and discontinuous scenario paths are rejected. Layout grows to the right and allocates space by leaf count. Multiple parents, cross-links, collapsible nodes and interactive navigation are deferred. Self-contained SVGs can be embedded in Markdown.
