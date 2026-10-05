# Native sequence diagrams

These diagrams borrow visual conventions from sequence diagrams. Input is PR Lens JSON; no Mermaid dependency or syntax is involved.

Participants have lifelines. Messages support synchronous calls, asynchronous calls, dashed returns and self calls. Structured steps draw choice, repeat and parallel frames. Scenarios explicitly choose a branch for each choice visit and an iteration count for each repeat visit. Parallel branches share a clock and join after the longest branch.

## Try the examples

```sh
pnpm install --frozen-lockfile
pnpm build
node packages/cli/dist/bin.js diagram docs/experiments/sequence/retry.diagram.json --scenario fast-success --theme both
node packages/cli/dist/bin.js diagram docs/experiments/sequence/retry.diagram.json --scenario retry-success --theme both
node packages/cli/dist/bin.js diagram docs/experiments/sequence/parallel.diagram.json --scenario dashboard --theme both
```

Omit `--scenario` for a static SVG. Each output is self-contained and can be embedded with `![Sequence](path.svg)`.

`retry.diagram.json` renders either a first-attempt success or a success after two timeouts. Animated scenarios expand each executed attempt onto the timeline; their heights and message positions differ. Choices are arrays because a repeated choice can have a different outcome on each visit. `parallel.diagram.json` shows concurrent account and billing calls followed by a shared response.

## Experiment limits

Up to eight participants and 64 message definitions; nesting is limited to eight levels and playback to 256 step visits. Each repeat visit has one to eight iterations. Message definitions occupy one structural position.

Static exports retain the complete structural picture with choice, repeat and parallel frames. Selecting a scenario renders its executed trace: unused branches are omitted, retries occupy separate rows, and concurrent messages share a time band with enough vertical separation to keep their labels readable. These are logical steps, not measured durations. Parallel frames end with a join after their slowest branch. Scenario geometry depends on the selected execution.

The active message label gets a subtle blue pill while a pulse and trace travel along its route. Attempt counters appear beside messages belonging to that repeat, including nested repeats; nested counters share one caption, ordered from the innermost repeat outward. Unrelated parallel calls do not inherit a counter. No branch dots or active frame borders remain. Change colours on message strokes are preserved. Reduced motion leaves the selected execution readable without moving effects. SVGs are self-contained, with no runtime scripts.

The atlas maps message IDs to their first occurrence and exposes `occurrences` keyed by `event-N` and `parallel-N` for the selected execution. Static exports retain the original structural atlas.

`checkout.diagram.json` combines authentication, parallel pricing and inventory calls, and a repeated choice inside the inventory branch. The `checkout-retry` scenario reserves stock on the second attempt; `unauthorized` takes only the rejection branch.

```sh
node packages/cli/dist/bin.js diagram docs/experiments/sequence/checkout.diagram.json --scenario checkout-retry --theme both
node packages/cli/dist/bin.js diagram docs/experiments/sequence/checkout.diagram.json --scenario unauthorized --theme both
```
