import type { FieldAttribute, FieldType } from "better-auth/db";
import { capitalize, entries, pipe } from "remeda";
import { match } from "ts-pattern";

export const generateFieldsString = (fields: Record<string, FieldAttribute<FieldType>>) => {
  const scalarEnumTypes: Record<Capitalize<string>, string> = {};

  return {
    scalarEnumTypes,
    fields: entries(fields)
      .map(([key, { type, required = false, unique = false, fieldName = key, references }]) => {
        let multi = false;
        const constraints: string[] = [];

        let kind = match(type)
          .with("string", () => "str")
          .with("number", () => "int")
          .with("boolean", () => "bool")
          .with("date", () => "datetime")
          .with("string[]", () => {
            multi = true;
            return "str";
          })
          .with("number[]", () => {
            multi = true;
            return "int";
          })
          .otherwise((literals) => {
            const enumName = capitalize(fieldName);
            scalarEnumTypes[enumName] =
              `scalar type ${enumName} extending enum<${literals.join(", ")}>;`;
            return enumName;
          });

        if (unique) constraints.push("constraint exclusive");

        if (references) {
          kind = references.model;
          if (references.onDelete === "cascade") {
            constraints.push("on target delete delete source");
          }
        }

        return pipe(
          `${fieldName}: ${kind}`,
          (str) => (multi ? `multi ${str}` : str),
          (str) => (required ? `required ${str}` : str),
          (str) =>
            constraints.length > 0
              ? `${str} {\n      ${constraints.join(";\n      ")};\n    }`
              : str,
          (str) => (constraints.length > 0 ? str : `${str};`),
        );
      })
      .join("\n    "),
  };
};
