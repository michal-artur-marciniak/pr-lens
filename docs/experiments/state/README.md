# State diagrams

Native PR Lens JSON describes the lifecycle of an object. Initial states are solid circles, ordinary states use PR Lens cards, and final states use double circles. Transitions have event labels and optional guards. A guard is a caption, not an executable expression.

```sh
pnpm build
node packages/cli/dist/bin.js diagram docs/experiments/state/order.diagram.json --scenario fulfill --theme both
node packages/cli/dist/bin.js diagram docs/experiments/state/order.diagram.json --scenario cancel-order --theme both
node packages/cli/dist/bin.js diagram docs/experiments/state/order.diagram.json --scenario return-order --theme both
```

Omit the scenario for a static map. During playback, a pulse follows the selected transitions and the current state gets a gentle fill. Code-change badges and colours remain independent. All exports are self-contained SVGs suitable for Markdown; light, dark, neutral and reduced motion are supported.

There must be exactly one initial state. Initial states have no incoming transitions; final states have no outgoing transitions. Each scenario starts at the initial state and follows a continuous path. It may stop at an intermediate state. Limits: 32 states, 64 transitions, 16 scenarios, 128 transitions per scenario. Flat states, loops and guarded transitions are supported; nested and concurrent states are deferred. Guards do not select a path automatically.
