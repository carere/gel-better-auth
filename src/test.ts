import { betterAuth } from "better-auth";
import { admin, organization } from "better-auth/plugins";
import { createClient } from "gel";
import { gelAdapter } from ".";

export const auth = betterAuth({
  database: gelAdapter(createClient()),
  plugins: [organization(), admin()],
  user: {
    modelName: "users",
    additionalFields: {
      fruit: {
        type: ["banana", "apple", "orange", "grape", "pineapple"],
        required: true,
        unique: true,
      },
      metadata: {
        type: "string",
        fieldName: "metadatas",
        references: {
          model: "session",
          field: "id",
          onDelete: "cascade",
        },
        unique: true,
      },
    },
  },
});

// to generate schema
const opts = auth.options;
const dbopts = opts.database(opts);
if (dbopts.createSchema) {
  dbopts.createSchema(opts);
}
