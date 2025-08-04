import { betterAuth } from "better-auth";
import { createClient } from "gel";
import { gelAdapter } from ".";

export const auth = betterAuth({
  database: gelAdapter(createClient(), {
    moduleName: "auth",
    indexes: {
      user: ["email"],
      account: ["userId"],
      session: ["userId", "token"],
      verification: ["identifier"],
      organization: ["slug"]
    },
  }),
});
