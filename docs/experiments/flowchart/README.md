# Flowcharts

A native JSON document draws decisions, processes, start/end points and datastores. Groups mark a boundary. Edges can split, join or return to an earlier step. Choose `down` for a narrow Markdown column or `right` for a horizontal drawing.

`cache.diagram.json` has two scenarios. A hit returns the cached value; a miss reads the database and writes the cache. Both SVGs keep the same layout. The moving dot follows only the selected path. `retry.diagram.json` shows a group and a return edge, visited once before finishing.

Build and draw from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
node packages/cli/dist/bin.js validate docs/experiments/flowchart/cache.diagram.json
node packages/cli/dist/bin.js diagram docs/experiments/flowchart/cache.diagram.json --scenario cache-hit --theme both --out .pr-lens/flowchart/hit
node packages/cli/dist/bin.js diagram docs/experiments/flowchart/cache.diagram.json --scenario cache-miss --theme both --out .pr-lens/flowchart/miss
node packages/cli/dist/bin.js diagram docs/experiments/flowchart/retry.diagram.json --scenario retry-once --out .pr-lens/flowchart/retry
```

Omit `--scenario` for a static diagram. The output directory contains hash-named SVGs, the parsed JSON and `diagram-render.json`, which lists the files and geometry. Use the SVG filename reported by the command in a Markdown image after uploading the file:

```markdown
![Cache hit: return the cached value](https://your-asset-host/diagram-flowchart-light-CONTENT_HASH.svg)
```

## JSON

A document has `kind: "diagram"`, `schemaVersion: "0.1.0"`, `title`, optional `summary` and a `diagram` with `kind: "flowchart"`. Each node has a stable `id`, `kind`, `label`, optional `delta` and optional `group`. Edges identify `from` and `to`; scenarios list edge ids in traversal order. See the two complete JSON files beside this page and the published `diagram-doc.schema.json`.

The parser rejects duplicate ids, missing references and disconnected scenario paths. An unknown scenario fails before any output is written. Cycles use return routes, and all coordinates are computed without a browser or font engine.

## Export behavior

SVGs are self-contained, use CSS/SMIL and render as images. Reduced-motion readers get the full static structure. No Mermaid syntax, parser or renderer is involved. Existing architecture/data-flow documents keep their original commands and contract.

The experimental layout supports one level of groups and up to 64 nodes. Large diagrams should be split into smaller explanations. Group boxes cover their members; deeply interleaved groups and dense graphs are outside this first layout's scope. Horizontal drawings need more width than the vertical cache example. The local command does not publish to the hosted canvas or infer diagrams from a diff.
