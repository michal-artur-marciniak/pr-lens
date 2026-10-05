# Native diagram experiment

PR Lens keeps its own structured JSON and SVG renderer. Mermaid is a reference for visual conventions, not an input language or dependency.

The first experiment adds three families:

- [Flowcharts](flowchart/README.md): shapes, groups, decisions, back edges and explicit scenario paths.
- [Sequences](sequence/README.md): lifelines, messages, choices, repeats and parallel branches with a shared clock.
- [Entity relationships](entity-relationship/README.md): typed fields, keys, cardinality and narrated schema changes.

Each family exports self-contained static or animated SVGs suitable for Markdown. Themes and scenarios share geometry. Existing PR Lens graph rendering remains available through its existing commands. These additions use the separate experimental `diagram` command and schema.

The next decision is whether these examples are readable enough in actual review comments to justify expanding layout support. Compare static and animated versions, light and dark themes, and diagrams at the width of a Markdown column. A scenario must help explain a concrete behavior; animation should never carry the only explanation of a change.

## Later references

[Sideshow ideas](SIDESHOW.md) remain a separate direction. They are not implemented by this experiment. Further visual families such as states, timelines and dependency maps should follow only after these first three have been evaluated.
