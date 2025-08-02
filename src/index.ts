import { writeFile } from "node:fs/promises";
import { join as nodeJoin } from "node:path";
import { type AdapterDebugLogs, createAdapter } from "better-auth/adapters";
import type { Client } from "gel";
import { capitalize, concat, join, keys, map, mapToObj, merge, pipe, values } from "remeda";
import { match } from "ts-pattern";
import { generateFieldsString } from "./utils";

interface GelAdapterConfig {
  /**
   * Helps you debug issues with the adapter.
   */
  debugLogs?: AdapterDebugLogs;
  /**
   * If the table names in the schema are plural.
   */
  usePlural?: boolean;
  /**
   * The name of the generated module.
   * defaults to "auth"
   */
  moduleName?: string;
}

export const gelAdapter = (db: Client, config: GelAdapterConfig) =>
  createAdapter({
    config: {
      adapterId: "gel-adapter",
      adapterName: "Gel Adapter",
      usePlural: config.usePlural ?? false,
      debugLogs: config.debugLogs ?? false,
      disableIdGeneration: true,
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: false,
    },
    adapter: (options) => {
      return {
        create: async ({ data, model, select }) => {
          const query = `
select (
  insert ${config.moduleName ?? "default"}::${model} {
    ${pipe(
      keys(data) as string[],
      map((key) => {
        console.log("[Create] Key: ", key);
        const fieldAttributes = options.getFieldAttributes({ model, field: key });
        //TODO: Create method which return the fieldAttributes depending on the key or the fieldName
        return `${key} := <${match(fieldAttributes.type)
          .with("string", () => "str")
          .with("number", () => "int")
          .with("boolean", () => "bool")
          .with("date", () => "datetime")
          .with("string[]", () => "array<str>")
          .with("number[]", () => "array<int>")
          .otherwise(() => capitalize(fieldAttributes.fieldName ?? key))}>$${key}`;
      }),
      join(",\n    "),
    )}
  }
) {
  ${pipe(select ?? concat(keys(data) as string[], ["id"]), join(",\n  "))}
}`;

          return await db.queryRequiredSingle(query, data);
        },
        update: async () => {
          throw new Error("Not implemented");
        },
        updateMany: async () => {
          throw new Error("Not implemented");
        },
        delete: async () => {
          throw new Error("Not implemented");
        },
        count: async () => {
          throw new Error("Not implemented");
        },
        findOne: async ({ model, where, select }) => {
          const fieldKeys = keys(options.schema[model]?.fields ?? {});

          const whereClause = pipe(
            where,
            map(({ connector, field, operator }, index) => {
              console.log("[Where Clause] Field: ", field);
              const fieldAttributes = options.getFieldAttributes({ model, field });

              return pipe(
                index === 0 ? "" : connector === "AND" ? "and " : "or ",
                (str) =>
                  `${str}.${fieldAttributes.fieldName ?? field} ${match(operator)
                    .with("eq", () => "=")
                    .with("ne", () => "!=")
                    .with("lt", () => "<")
                    .with("lte", () => "<=")
                    .with("gt", () => ">")
                    .with("gte", () => ">=")
                    .with("in", () => "in")
                    .with("contains", () => "like")
                    .with("starts_with", () => "like")
                    .with("ends_with", () => "like")
                    .exhaustive()} <${
                    field === "id"
                      ? "uuid"
                      : match(fieldAttributes.type)
                          .with("string", () => "str")
                          .with("number", () => "int")
                          .with("boolean", () => "bool")
                          .with("date", () => "datetime")
                          .with("string[]", () => "array<str>")
                          .with("number[]", () => "array<int>")
                          .otherwise(() => capitalize(fieldAttributes.fieldName ?? field))
                  }>$${fieldAttributes.fieldName ?? field}`,
              );
            }),
            join("\n"),
          );

          const query = `
select ${config.moduleName ?? "default"}::${model} {
  ${pipe(select ?? fieldKeys, join(",\n  "))},
} filter ${whereClause} limit 1`;

          options.debugLog("[Find One] Query: ", query);

          const data = mapToObj(where, (v) => [v.field, v.value]);

          return await db.queryRequiredSingle(query, data);
        },
        findMany: async () => {
          throw new Error("Not implemented");
        },
        deleteMany: async () => {
          throw new Error("Not implemented");
        },
        createSchema: async ({ tables, file = `./dbschema/${config.moduleName}.gel` }) => {
          let rootScalarEnumTypes: Record<Capitalize<string>, string> = {};
          const schema = pipe(
            values(tables),
            map(({ modelName, fields }) => {
              const { scalarEnumTypes, fields: fieldStr } = generateFieldsString(fields);
              rootScalarEnumTypes = merge(rootScalarEnumTypes, scalarEnumTypes);
              return `  type ${modelName} {\n    ${fieldStr}\n  };`;
            }),
            join("\n\n"),
            (schemaStr) => {
              const scalarEnumTypesString =
                values(rootScalarEnumTypes).length > 0
                  ? `  ${values(rootScalarEnumTypes).join("\n  ")}\n\n`
                  : "";

              return `module ${config.moduleName} {\n\n${scalarEnumTypesString}${schemaStr}\n}\n`;
            },
          );

          await writeFile(nodeJoin(process.cwd(), file), schema);

          return { path: file, append: false, overwrite: true, code: schema };
        },
      };
    },
  });
