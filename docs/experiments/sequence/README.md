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

`retry.diagram.json` keeps the same picture for a first-attempt success and a success after two timeouts. Choices are arrays because a repeated choice can have a different outcome on each visit. `parallel.diagram.json` shows concurrent account and billing calls followed by a shared response.

## Experiment limits

Up to eight participants and 64 messages; nesting is limited to eight levels and playback to 256 step visits. Each repeat visit has one to eight iterations. Message definitions occupy one structural position. Parallel branches occupy separate rows in the static picture; their pulses start together. Activation rectangles are inferred from the last subsequent reverse return message and are illustrative, rather than a full execution stack. There are no interactive controls or runtime scripts. Reduced motion hides animated pulses while retaining the full diagram.

During playback, the active branch and its enclosing blocks receive a blue outline. Parallel branches can be active together. A blue message trace exists only while that message is being delivered; the next message starts a fresh trace. Outlines fade at their interval boundaries. The neutral diagram remains readable between cycles and under reduced motion.

`checkout.diagram.json` combines authentication, parallel pricing and inventory calls, and a repeated choice inside the inventory branch. The `checkout-retry` scenario reserves stock on the second attempt; `unauthorized` takes only the rejection branch.

```sh
node packages/cli/dist/bin.js diagram docs/experiments/sequence/checkout.diagram.json --scenario checkout-retry --theme both
node packages/cli/dist/bin.js diagram docs/experiments/sequence/checkout.diagram.json --scenario unauthorized --theme both
```
