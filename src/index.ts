import { writeFile } from "node:fs/promises";
import { join as nodeJoin } from "node:path";
import { type AdapterDebugLogs, createAdapter } from "better-auth/adapters";
import type { Client } from "gel";
import { filter, join, keys, map, mapToObj, merge, pipe, values } from "remeda";
import { match } from "ts-pattern";
import { generateFieldsString, getGelType, selectClause, whereClause } from "./utils";

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
          const dataKeys = keys(data) as string[];
          const fieldKeys = keys(options.schema[model]?.fields ?? {});

          const query = `
          select (
            insert ${config.moduleName ?? "default"}::${model} {
              ${pipe(
                fieldKeys,
                filter((key) =>
                  dataKeys.includes(options.getFieldName({ model, field: key }) ?? key),
                ),
                map((key) => {
                  const fieldName = options.getFieldName({ model, field: key });
                  const fieldAttributes = options.getFieldAttributes({ model, field: key });
                  return `${key} := <${getGelType(key, fieldAttributes.type, fieldName)}>$${fieldName}`;
                }),
                join(",\n    "),
              )}
            }
          ) {
            ${selectClause(model, options.schema, select)}
          }`;

          options.debugLog("[Create] Query: ", query);

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
          const whereClauseString = whereClause(where, model, options.schema);

          const query = `
          select ${config.moduleName ?? "default"}::${model} {
            ${selectClause(model, options.schema, select)}
          } filter ${whereClauseString} limit 1`;

          options.debugLog("[Find One] Query: ", query);

          const params = where
            ? mapToObj(where, (v) => [
                v.field,
                match(v.operator)
                  .with("contains", () => `%${v.value}%`)
                  .with("starts_with", () => `${v.value}%`)
                  .with("ends_with", () => `%${v.value}`)
                  .otherwise(() => v.value),
              ])
            : undefined;

          return await db.queryRequiredSingle(query, params);
        },
        findMany: async ({ model, where, limit, sortBy, offset }) => {
          let query = `select ${config.moduleName ?? "default"}::${model} { * }`;

          if (where && where.length > 0) {
            const whereConditions = whereClause(where, model, options.schema);
            query += ` filter ${whereConditions}`;
          }

          if (sortBy) {
            query += ` order by .${sortBy.field} ${sortBy.direction === "desc" ? "desc" : "asc"}`;
          }

          if (offset) {
            query += ` offset ${offset}`;
          }

          if (limit) {
            query += ` limit ${limit}`;
          }

          options.debugLog("[Find Many] Query: ", query);

          const params = where
            ? mapToObj(where, (v) => [
                v.field,
                match(v.operator)
                  .with("contains", () => `%${v.value}%`)
                  .with("starts_with", () => `${v.value}%`)
                  .with("ends_with", () => `%${v.value}`)
                  .otherwise(() => v.value),
              ])
            : undefined;

          return await db.query(query, params);
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
