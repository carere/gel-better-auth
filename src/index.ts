import { writeFile } from "node:fs/promises";
import { join as nodeJoin } from "node:path";
import { type AdapterDebugLogs, createAdapter } from "better-auth/adapters";
import type { Client } from "gel";
import { filter, join, keys, map, merge, pipe, values } from "remeda";
import {
  formatWhereParams,
  generateFieldsString,
  getGelType,
  selectClause,
  whereClause,
} from "./utils";

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
                join(", "),
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
        delete: async ({ model, where }) => {
          let query = `delete ${config.moduleName ?? "default"}::${model}`;

          if (where && where.length > 0) {
            query += ` filter ${whereClause(where, model, options.schema)}`;
          }

          options.debugLog("[Delete] Query: ", query);

          await db.query(query, formatWhereParams(where));
        },
        count: async () => {
          throw new Error("Not implemented");
        },
        findOne: async ({ model, where, select }) => {
          const query = `
          select ${config.moduleName ?? "default"}::${model} {
            ${selectClause(model, options.schema, select)}
          } filter ${whereClause(where, model, options.schema)} limit 1`;

          options.debugLog("[Find One] Query: ", query);

          return await db.queryRequiredSingle(query, formatWhereParams(where));
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

          return await db.query(query, formatWhereParams(where));
        },
        deleteMany: async ({ model, where }) => {
          let query = `delete ${config.moduleName ?? "default"}::${model}`;

          if (where && where.length > 0) {
            query += ` filter ${whereClause(where, model, options.schema)}`;
          }

          options.debugLog("[Delete Many] Query: ", query);

          return (await db.query(query, formatWhereParams(where))).length;
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
