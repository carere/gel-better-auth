import type { CleanedWhere } from "better-auth/adapters";
import type { BetterAuthDbSchema, FieldAttribute, FieldType } from "better-auth/db";
import { capitalize, entries, filter, join, keys, map, mapKeys, mapToObj, pipe } from "remeda";
import { match } from "ts-pattern";

const FILTER_PREFIX = "filter_";
const PARAMS_PREFIX = "params_";

export const getGelType = (
  field: string,
  type: FieldType,
  fieldName?: string,
  operator?: string,
): string => {
  if (field === "id") {
    // For 'in' operator with id field, use array<uuid>
    return operator === "in" ? "array<uuid>" : "uuid";
  }

  return match(type)
    .with("string", () => (operator === "in" ? "array<str>" : "str"))
    .with("number", () => (operator === "in" ? "array<int>" : "int"))
    .with("boolean", () => (operator === "in" ? "array<bool>" : "bool"))
    .with("date", () => (operator === "in" ? "array<datetime>" : "datetime"))
    .with("string[]", () => "array<str>")
    .with("number[]", () => "array<int>")
    .otherwise(() => capitalize(fieldName ?? field));
};

export const getGelOperator = (operator: string): string =>
  match(operator)
    .with("eq", () => "=")
    .with("ne", () => "!=")
    .with("lt", () => "<")
    .with("lte", () => "<=")
    .with("gt", () => ">")
    .with("gte", () => ">=")
    .with("in", () => "in")
    .otherwise(() => "like");

export const getModelFieldNameMapping = (
  model: string,
  schema: BetterAuthDbSchema,
): Record<string, FieldAttribute<FieldType>> => {
  const fields = schema[model]?.fields;

  if (!fields) throw new Error(`[Gel Adapter] Model ${model} not found in schema`);

  const mapping: Record<string, FieldAttribute<FieldType>> = {};

  for (const [key, field] of Object.entries(fields)) {
    mapping[key] = field;
    if (field.fieldName && field.fieldName !== key) {
      mapping[field.fieldName] = field;
    }
  }

  return mapping;
};

export const whereClause = (
  where: CleanedWhere[],
  model: string,
  schema: BetterAuthDbSchema,
): string => {
  const fieldMapping = getModelFieldNameMapping(model, schema);

  return pipe(
    where,
    map(({ connector, field, operator }, index) => {
      const fieldAttributes = fieldMapping[field] as FieldAttribute<FieldType>;
      const actualFieldName = fieldAttributes.fieldName ?? field;

      return pipe(index === 0 ? "" : connector === "AND" ? "and " : "or ", (str) => {
        const gelOperator = getGelOperator(operator);
        const gelType = getGelType(field, fieldAttributes.type, actualFieldName, operator);
        const isReferencing = fieldAttributes.references !== undefined;

        return match(operator)
          .with(
            "in",
            () =>
              `${str}.${isReferencing ? `${fieldAttributes.references?.model}.id` : field} ${gelOperator} array_unpack(<${isReferencing ? "uuid" : gelType}>$${FILTER_PREFIX}${actualFieldName})`,
          )
          .otherwise(
            () =>
              `${str}.${isReferencing ? `${fieldAttributes.references?.model}.id` : field} ${gelOperator} <${isReferencing ? "uuid" : gelType}>$${FILTER_PREFIX}${actualFieldName}`,
          );
      });
    }),
    join("\n"),
  );
};

export const formatFilterParams = (
  where: CleanedWhere[] | undefined,
  model: string,
  schema: BetterAuthDbSchema,
) => {
  if (!where) return undefined;

  const fieldMapping = getModelFieldNameMapping(model, schema);
  const defaultUuid = "00000000-0000-0000-0000-000000000000";
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return mapToObj(where, (v) => {
    const fieldAttributes = fieldMapping[v.field];
    const isIdField = v.field === "id";
    const isReferenceField = fieldAttributes?.references !== undefined;

    let value = match(v.operator)
      .with("contains", () => `%${v.value}%`)
      .with("starts_with", () => `${v.value}%`)
      .with("ends_with", () => `%${v.value}`)
      .otherwise(() => v.value);

    // Replace invalid UUIDs with default UUID for id and reference fields
    if ((isIdField || isReferenceField) && typeof value === "string" && !uuidRegex.test(value)) {
      value = defaultUuid;
    }

    return [`${FILTER_PREFIX}${fieldAttributes?.fieldName ?? v.field}`, value];
  });
};

export const selectClause = (model: string, schema: BetterAuthDbSchema, select?: string[]) => {
  const fieldMapping = getModelFieldNameMapping(model, schema);
  const fieldKeys = keys(schema[model]?.fields ?? {});

  return pipe(
    fieldKeys,
    filter((key) =>
      select && select.length > 0 ? select.includes(fieldMapping[key]?.fieldName ?? key) : true,
    ),
    map((key) => {
      let keyStr = `${key}`;
      if (fieldMapping[key]?.fieldName && fieldMapping[key].fieldName !== key)
        keyStr = `${fieldMapping[key].fieldName} := .${keyStr}`;
      return keyStr;
    }),
    join(", "),
  );
};

export const updateClause = (
  update: Record<string, unknown>,
  model: string,
  schema: BetterAuthDbSchema,
) => {
  const fieldMapping = getModelFieldNameMapping(model, schema);
  const fieldKeys = keys(schema[model]?.fields ?? {});
  const updateKeys = keys(update);

  return pipe(
    fieldKeys,
    filter((key) => (updateKeys ? updateKeys.includes(fieldMapping[key]?.fieldName ?? key) : true)),
    map((key) => {
      return `${key} := <${getGelType(key, fieldMapping[key]?.type ?? "string", key)}>$${PARAMS_PREFIX}${fieldMapping[key]?.fieldName ?? key}`;
    }),
    join(", "),
  );
};

export const formatUpdateParams = (update: Record<string, unknown>) =>
  mapKeys(update, (key) => `${PARAMS_PREFIX}${key}`);

export const generateFieldsString = (
  fields: Record<string, FieldAttribute<FieldType>>,
  indexes?: Array<string | string[]>,
) => {
  const scalarEnumTypes: Record<Capitalize<string>, string> = {};
  const referenceStr: string[] = [];

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
          fieldName = references.model;
          referenceStr.push(`${key} := .${fieldName}.id;`);
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
      .concat(referenceStr)
      .concat(
        pipe(
          indexes ?? [],
          filter((index) => {
            if (Array.isArray(index)) return true;
            // Single field index - check if field doesn't have unique constraint or is a reference
            const fieldAttr = fields[index];
            if (!fieldAttr) return false;
            return !fieldAttr.unique && !fieldAttr.references;
          }),
          map((index) => {
            if (Array.isArray(index)) {
              // Composite index
              return `index on ((${index.map((field) => `.${field}`).join(", ")}));`;
            }
            // Single field index
            return `index on (.${index});`;
          }),
        ),
      )
      .join("\n    "),
  };
};
