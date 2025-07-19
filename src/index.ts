import { type AdapterDebugLogs, createAdapter } from "better-auth/adapters";
import type { Client } from "gel";

// Your custom adapter config options
interface GelAdapterConfig {
  /**
   * Helps you debug issues with the adapter.
   */
  debugLogs?: AdapterDebugLogs;
  /**
   * If the table names in the schema are plural.
   */
  usePlural?: boolean;
}

export const gelAdapter = (client: Client, config: GelAdapterConfig = {}) =>
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
    adapter: (options) => {
      console.log("Options", options.getFieldName({ model: "user", field: "id" }));
      return {
        create: async ({ model, data, select }) => {
          throw new Error("Not implemented");
        },
        update: async ({ model, where, update }) => {
          throw new Error("Not implemented");
        },
        updateMany: async ({ model, where, update }) => {
          throw new Error("Not implemented");
        },
        delete: async ({ model, where }) => {
          throw new Error("Not implemented");
        },
        count: async ({ model, where }) => {
          throw new Error("Not implemented");
        },
        findOne: async ({ model, where }) => {
          throw new Error("Not implemented");
        },
        findMany: async ({ model, where }) => {
          throw new Error("Not implemented");
        },
        deleteMany: async ({ model, where }) => {
          throw new Error("Not implemented");
        },
        createSchema: async ({ model, schema }) => {
          throw new Error("Not implemented");
        },
      };
    },
  });
