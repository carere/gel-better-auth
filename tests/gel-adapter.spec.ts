import { runAdapterTest } from "better-auth/adapters/test";
import { createClient } from "gel";
import { describe } from "vitest";
import { gelAdapter } from "../src";

describe("Gel Adapter Tests", async () => {
  const db = createClient();
  const adapter = gelAdapter(db, {
    debugLogs: {
      isRunningAdapterTests: true,
    },
  });

  // beforeAll(async () => {
  //   await db.execute("delete session;");
  //   await db.execute("delete account;");
  //   await db.execute("delete user;");
  // });

  await runAdapterTest({
    getAdapter: async (betterAuthOptions = {}) => {
      return adapter(betterAuthOptions);
    },
  });
});
