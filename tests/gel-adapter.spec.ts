import { runAdapterTest } from "better-auth/adapters/test";
import { createClient } from "gel";
import { beforeAll, describe } from "vitest";
import { gelAdapter } from "../src";

describe("Gel Adapter Tests", async () => {
  const db = createClient();
  const adapter = gelAdapter(db, {
    moduleName: "auth",
    debugLogs: {
      isRunningAdapterTests: true,
    },
  });

  beforeAll(async () => {
    await db.execute("delete auth::session;");
    await db.execute("delete auth::account;");
    await db.execute("delete auth::user;");
  });

  await runAdapterTest({
    disableTests: {
      CREATE_MODEL: false,
      CREATE_MODEL_SHOULD_ALWAYS_RETURN_AN_ID: false,
      FIND_MODEL: false,
      FIND_MODEL_WITHOUT_ID: false,
      FIND_MODEL_WITH_SELECT: false,
      FIND_MODEL_WITH_MODIFIED_FIELD_NAME: false,
      UPDATE_MODEL: true,
      SHOULD_FIND_MANY: true,
      SHOULD_FIND_MANY_WITH_WHERE: true,
      SHOULD_FIND_MANY_WITH_OPERATORS: true,
      SHOULD_WORK_WITH_REFERENCE_FIELDS: true,
      SHOULD_FIND_MANY_WITH_SORT_BY: true,
      SHOULD_FIND_MANY_WITH_LIMIT: true,
      SHOULD_FIND_MANY_WITH_OFFSET: true,
      SHOULD_UPDATE_WITH_MULTIPLE_WHERE: true,
      DELETE_MODEL: true,
      SHOULD_DELETE_MANY: true,
      SHOULD_NOT_THROW_ON_DELETE_RECORD_NOT_FOUND: true,
      SHOULD_NOT_THROW_ON_RECORD_NOT_FOUND: true,
      SHOULD_FIND_MANY_WITH_CONTAINS_OPERATOR: true,
      SHOULD_SEARCH_USERS_WITH_STARTS_WITH: true,
      SHOULD_SEARCH_USERS_WITH_ENDS_WITH: true,
      SHOULD_PREFER_GENERATE_ID_IF_PROVIDED: true,
    },
    getAdapter: async (betterAuthOptions = {}) => {
      return adapter(betterAuthOptions);
    },
  });
});
