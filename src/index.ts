import { type AdapterDebugLogs, createAdapter } from "better-auth/adapters";
import type { Client } from "gel";
import { filter, join, keys, map, merge, pipe, values } from "remeda";
import {
  formatFilterParams,
  formatUpdateParams,
  generateFieldsString,
  getGelType,
  selectClause,
  updateClause,
  whereClause,
} from "./utils";

interface GelAdapterConfig {
  /**
   * Helps you debug issues with the adapter.
   */
  debugLogs?: AdapterDebugLogs;
  /**
   * The name of the generated module.
   * defaults to "auth"
   */
  moduleName?: string;
  /**
   * The indexes to add to the schema.
   */
  indexes?: Record<string, Array<string | string[]>>;
}

export const gelAdapter = (db: Client, config: GelAdapterConfig) =>
  createAdapter({
    config: {
      adapterId: "gel-adapter",
      adapterName: "Gel Adapter",
      usePlural: false,
      debugLogs: config.debugLogs ?? false,
      disableIdGeneration: true,
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: false,
    },
    adapter: (options) => {
      const moduleName = config.moduleName ?? "default";

      return {
        create: async ({ data, model, select }) => {
          const dataKeys = keys(data) as string[];
          const fieldKeys = keys(options.schema[model]?.fields ?? {});

          const query = `
          select (
            insert ${moduleName}::${model} {
              ${pipe(
                fieldKeys,
                filter((key) =>
                  dataKeys.includes(options.getFieldName({ model, field: key }) ?? key),
                ),
                map((key) => {
                  const fieldName = options.getFieldName({ model, field: key });
                  const fieldAttributes = options.getFieldAttributes({ model, field: key });
                  if (fieldAttributes.references) {
                    const refModel = fieldAttributes.references.model;
                    return `${refModel} := (select ${moduleName}::${refModel} filter .id = <uuid>$${fieldName})`;
                  }
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
        update: async ({ model, update, where }) => {
          let query = `update ${moduleName}::${model}`;

          if (where.length > 0) {
            query += ` filter ${whereClause(where, model, options.schema)}`;
          }

          query += ` set { ${updateClause(update as Record<string, unknown>, model, options.schema)} }`;

          query = `select (${query}) { ${selectClause(model, options.schema, [])} } limit 1`;

          options.debugLog("[Update] Query: ", query);

          return (
            await db.query(query, {
              ...formatFilterParams(where, model, options.schema),
              ...formatUpdateParams(update as Record<string, unknown>),
            })
          )[0] as null;
        },
        updateMany: async ({ model, update, where }) => {
          let query = `update ${moduleName}::${model}`;

          if (where.length > 0) {
            query += ` filter ${whereClause(where, model, options.schema)}`;
          }

          query += ` set { ${updateClause(update as Record<string, unknown>, model, options.schema)} }`;

          query = `select (${query}) { ${selectClause(model, options.schema, [])} }`;

          options.debugLog("[Update Many] Query: ", query);

          return (
            await db.query(query, {
              ...formatFilterParams(where, model, options.schema),
              ...formatUpdateParams(update as Record<string, unknown>),
            })
          ).length;
        },
        delete: async ({ model, where }) => {
          let query = `delete ${moduleName}::${model}`;

          if (where && where.length > 0) {
            query += ` filter ${whereClause(where, model, options.schema)}`;
          }

          options.debugLog("[Delete] Query: ", query);

          await db.query(query, formatFilterParams(where, model, options.schema));
        },
        count: async ({ model, where }) => {
          let query = `select ${moduleName}::${model}`;

          if (where && where.length > 0) {
            const whereConditions = whereClause(where, model, options.schema);
            query += ` filter ${whereConditions}`;
          }

          query = `select count ((${query}))`;

          options.debugLog(query);

          return (await db.query(
            query,
            formatFilterParams(where, model, options.schema),
          )) as unknown as number;
        },
        findOne: async ({ model, where, select }) => {
          const query = `
          select ${moduleName}::${model} {
            ${selectClause(model, options.schema, select)}
          } filter ${whereClause(where, model, options.schema)} limit 1`;

          options.debugLog("[Find One] Query: ", query);

          return (
            await db.query(query, formatFilterParams(where, model, options.schema))
          )[0] as null;
        },
        findMany: async ({ model, where, limit, sortBy, offset }) => {
          let query = `select ${moduleName}::${model} { * }`;

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

          return await db.query(query, formatFilterParams(where, model, options.schema));
        },
        deleteMany: async ({ model, where }) => {
          let query = `delete ${moduleName}::${model}`;

          if (where && where.length > 0) {
            query += ` filter ${whereClause(where, model, options.schema)}`;
          }

          options.debugLog("[Delete Many] Query: ", query);

          return (await db.query(query, formatFilterParams(where, model, options.schema))).length;
        },
        createSchema: async ({ tables, file = `./dbschema/${moduleName}.gel` }) => {
          let rootScalarEnumTypes: Record<Capitalize<string>, string> = {};
          const schema = pipe(
            values(tables),
            map(({ modelName, fields }) => {
              const modelIndexes = config.indexes?.[modelName];
              const { scalarEnumTypes, fields: fieldStr } = generateFieldsString(
                fields,
                modelIndexes,
              );
              rootScalarEnumTypes = merge(rootScalarEnumTypes, scalarEnumTypes);
              return `  type ${modelName} {\n    ${fieldStr}\n  };`;
            }),
            join("\n\n"),
            (schemaStr) => {
              const scalarEnumTypesString =
                values(rootScalarEnumTypes).length > 0
                  ? `  ${values(rootScalarEnumTypes).join("\n  ")}\n\n`
                  : "";

              return `module ${moduleName} {\n\n${scalarEnumTypesString}${schemaStr}\n}\n`;
            },
          );

          return { path: file, append: false, overwrite: true, code: schema };
        },
      };
    },
  });
