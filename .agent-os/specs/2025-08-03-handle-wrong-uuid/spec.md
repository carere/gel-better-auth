<high-level-objective>
- Handle wrong uuid (00000000-0000-0000-0000-000000000000)
</high-level-objective>

<mid-level-objective>
- Improve the `formatFilterParams` function to handle wrong uuid.
</mid-level-objective>

<implementation-notes>
- Use `bun run test` to run the tests
</implementation-notes>

<beginning-context>
- `src/index.ts`
- `src/utils.ts`
- `tests/gel-adapter.spec.ts`
</beginning-context>

<ending-context>
- `src/index.ts`
- `src/utils.ts`
- `tests/gel-adapter.spec.ts`
</ending-context>

<low-level-tasks instruction="execute the following tasks in order">
  <task title="improve the `formatFilterParams` function">
    - UPDATE `formatFilterParams` signature to accept model and schema.
    - USE `fieldMapping` to get the proper field attributes and to know if the field is referencing another model.
    - If the value of key `id` isn't a uuid, replace it with a default uuid value (00000000-0000-0000-0000-000000000000).
    - If the value of reference key isn't a uuid, replace it with a default uuid value (00000000-0000-0000-0000-000000000000).
  </task>
</low-level-tasks>

<success-criteria>
- Pass all the tests
</success-criteria>