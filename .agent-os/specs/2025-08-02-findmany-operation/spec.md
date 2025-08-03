<high-level-objective>
- Implementing the `findMany` operation for the Gel Better Auth adapter
</high-level-objective>

<mid-level-objective>
- Implement helper function to map between Better Auth and Gel types.
- Implement helper function to map between Better Auth and Gel operators.
- Implement helper function to map between override field's name and actual field name.
</mid-level-objective>

<implementation-notes>
- Use `bun run test` to run the tests
- Put helpers functions in `src/utils.ts`
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
  <task title="type mapping helper">
    - APPEND to `src/utils.ts` the following function:
    ```ts
    export const getGelType = (field: string, type: string, fieldName?: string): string;
    ```
    - MIRROR the type mapping implementation from the `findOne` operation.
  </task>
  <task title="operator mapping helper">
    - APPEND to `src/utils.ts` the following function:
    ```ts
    export const getGelOperator = (operator: string): string;
    ```
    - MIRROR the operator mapping implementation from the `findOne` operation.
  </task>
  <task title="field name mapping helper">
    - APPEND to `src/utils.ts` the following function:
    ```ts
    export const getModelFieldNameMapping = (model: string, schema: BetterAuthDbSchema): Record<string, FieldAttribute<FieldType>>;
    ```
    - For `schema` like this:
    ```ts
    const schema = {
      user: {
        fields: {
          name: { type: "string", fieldName: "full_name" },
          email: { type: "string" },
        },
      },
    };
    ```
    - The function should return:
    ```ts
    const fieldNameMapping = {
      name: { type: "string", fieldName: "full_name" },
      email: { type: "string" },
      "full_name": { type: "string", fieldName: "full_name" },
    };
    ```
  </task>
  <task title="where clause helper">
    - APPEND to `src/utils.ts` the following function:
    ```ts
    export const whereClause = (where: CleanedWhere[]): string;
    ```
    - MIRROR the where clause implementation from the `findOne` operation.
    - REMOVE the `limit 1` clause.
    - USE the `getModelFieldNameMapping` implement this helper.
  </task>
  <task title="find many operation">
    - IMPLEMENT the `findMany` operation in `src/index.ts`
    - USE appropriate helpers to build the query.
    - APPEND to the query the `limit`, `offset` and `order by` clauses.
  </task>
</low-level-tasks>

<success-criteria>
- Pass all the following tests:
  - `FIND_MODEL*`
  - `SHOULD_FIND_MANY*`
  - `SHOULD_FIND_*`
  - `SHOULD_SEARCH_*`
</success-criteria>