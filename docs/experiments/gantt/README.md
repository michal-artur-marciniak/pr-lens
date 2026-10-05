# Gantt diagrams

Tasks use numeric start times and durations in the unit named by the diagram. Milestones have zero duration. Dependencies must finish before their dependent task starts; the parser rejects cycles and missing references. Times are supplied by the author, not calculated by a scheduler.

```sh
pnpm build
node packages/cli/dist/bin.js diagram docs/experiments/gantt/deploy.diagram.json --scenario release --theme both
node packages/cli/dist/bin.js diagram docs/experiments/gantt/deploy.diagram.json --theme neutral
```

The release example shows tests running concurrently, a migration waiting for both suites, and a canary rollout ending at a milestone. A moving cursor and gentle progress fills follow the whole schedule. The preview takes eight seconds, followed by a pause; diagram units are not playback seconds. Bars retain their change colours and badges. Reduced motion leaves the static schedule, dependencies and milestone readable.

Up to 32 tasks, eight dependencies per task and one playback scenario. Light/dark/neutral; self-contained SVG, no scripts. Dates, calendars, resource assignment and automatic scheduling are deferred.
