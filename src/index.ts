import { writeFile } from "node:fs/promises";
import { join as nodeJoin } from "node:path";
import { type AdapterDebugLogs, createAdapter } from "better-auth/adapters";
import type { Client } from "gel";
import { join, map, merge, pipe, values } from "remeda";
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

export const gelAdapter = (_: Client, config: GelAdapterConfig = { moduleName: "auth" }) =>
  createAdapter({
    config: {
      adapterId: "gel-adapter",
      adapterName: "Gel Adapter",
      usePlural: config.usePlural ?? false,
      debugLogs: config.debugLogs ?? false,
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: false,
    },
    adapter: () => ({
      create: async () => {
        throw new Error("Not implemented");
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
      findOne: async () => {
        throw new Error("Not implemented");
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
            const { scalarEnumTypes, fields: fieldString } = generateFieldsString(fields);
            rootScalarEnumTypes = merge(rootScalarEnumTypes, scalarEnumTypes);
            return `  type ${modelName} {\n    ${fieldString}\n  };`;
          }),
          join("\n\n"),
          (str) => {
            const scalarEnumTypesString =
              values(rootScalarEnumTypes).length > 0
                ? `  ${values(rootScalarEnumTypes).join("\n  ")}\n\n`
                : "";

            return `module ${config.moduleName} {\n\n${scalarEnumTypesString}${str}\n}\n`;
          },
        );

        await writeFile(nodeJoin(process.cwd(), file), schema);

        return { path: file, append: false, overwrite: true, code: schema };
      },
    }),
  });
