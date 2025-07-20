import { betterAuth } from "better-auth";
import { createClient } from "gel";
import { gelAdapter } from ".";

export const auth = betterAuth({
  database: gelAdapter(createClient()),
});

// to generate schema
const opts = auth.options;
const dbopts = opts.database(opts);
if (dbopts.createSchema) {
  dbopts.createSchema(opts);
}
