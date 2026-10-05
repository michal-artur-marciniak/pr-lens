# Sankey diagrams

Ribbon thickness represents volume. Nodes occupy explicit numbered layers; flows connect adjacent forward layers. Each internal node must conserve volume, within a relative tolerance of 1e-9. Sources and sinks can appear at any layer, but isolated nodes are rejected.

```sh
pnpm build
node packages/cli/dist/bin.js diagram docs/experiments/sankey/traffic.diagram.json --scenario cache-hit --theme both
node packages/cli/dist/bin.js diagram docs/experiments/sankey/traffic.diagram.json --scenario backend-failure --theme both
```

The traffic example splits 1,000 requests into cache hits, backend requests and rejected traffic, then merges success and error outcomes. Each node displays its volume and unit. A selected path receives temporary blue ribbons and a travelling pulse. Other ribbons remain visible. Change colours are independent of playback. Reduced motion leaves the complete quantitative picture.

Limits: 32 nodes, 64 flows, eight layers and 16 scenarios. Values must be positive, finite and at most 1e9. Flows may merge and split; feedback loops and edges skipping layers are rejected. Very small values produce correspondingly thin ribbons; the renderer does not inflate their proportions. Ordering follows the input; automatic crossing minimization is deferred. Light/dark/neutral and Markdown-safe SVG, without scripts or Mermaid syntax.
