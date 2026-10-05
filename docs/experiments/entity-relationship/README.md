# Native entity relationship diagrams

Tables show entities, typed fields and PK/FK markers. Relations can attach to a specific field. Crow's foot notation distinguishes one, zero or one, one or many, and zero or many at each endpoint.

The migration example introduces a customer foreign key and relation, removes duplicated email, adds a status field, and changes an identifier from int32 to int64. Added, removed and modified labels survive a static export. A modified type can carry `previous.type` so the picture shows both values. Scenarios highlight declared fields and relations in order, without changing their meaning or layout.

```sh
pnpm install --frozen-lockfile
pnpm build
node packages/cli/dist/bin.js diagram docs/experiments/entity-relationship/migration.diagram.json --scenario migration --theme both
node packages/cli/dist/bin.js diagram docs/experiments/entity-relationship/cardinalities.diagram.json
```

Omit `--scenario` for a static SVG. Embed the exported file with `![Schema](path.svg)`. Input is native PR Lens JSON, with no Mermaid syntax, parser or runtime.

The experiment supports two to eight entities, 24 fields per entity and 32 relations. Entities occupy columns in input order; large schemas will need a different layout. Adjacent relations use the gap between tables; distant relations route below tables. Dense overlapping relations are not optimized. Self relations are rejected. Animations use SVG only; reduced motion hides focus rings. The renderer does not infer cardinality from key markers or compute migrations from a database.
