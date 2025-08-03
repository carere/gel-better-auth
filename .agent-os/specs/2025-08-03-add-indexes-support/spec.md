<high-level-objective>
- Add indexes support to the Gel Better Auth adapter
</high-level-objective>

<mid-level-objective>
- Add indexes option to the adapter config options
- Add indexes to the schema's generation
</mid-level-objective>

<implementation-notes>
- The index are related to the fields of the model.
- Simple Gel indexes are created using `index on (.<property>);`
- Composite Gel indexes are created using `index on (.<property1>, <property2>);`
</implementation-notes>

<beginning-context>
- `src/index.ts`
- `src/utils.ts`
</beginning-context>

<ending-context>
- `src/index.ts`
- `src/utils.ts`
</ending-context>

<low-level-tasks instruction="execute the following tasks in order">
  <task title="add indexes option to the adapter config">
    - APPEND to `GelAdapterConfig` interface the following property:
    ```ts
      /**
      * The indexes to add to the schema.
      */
      indexes?: Record<string, Array<string | string[]>>;
    ``` 
  </task>
  <task title="add indexes support to the schema geneartion">
    - UPDATE `generateFieldsString` function to accept record of indexes.
    - MIRROR `referenceStr` implementation to add indexes to the schema.
    - FILTER the indexes to add only the ones that pass the following criteria:
      - The field does not have an unique constraint.
      - The field is not a reference.
      - The index is a composite index.
    - CONCAT the filtered indexes to the `referenceStr` array.
  </task>
</low-level-tasks>