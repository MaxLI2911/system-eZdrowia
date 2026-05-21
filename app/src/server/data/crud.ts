import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  ENTITY_CONFIGS,
  getEntityConfig,
  type EntityKey,
} from "@/lib/entities";
import { ENTITY_TABLES } from "@/server/data/entityMap";

const ID_PAIR_SEPARATOR = "|";
const ID_VALUE_SEPARATOR = ":";

export type ListParams = {
  page: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortDir?: "asc" | "desc";
};

export type ListResult = {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
};

export function encodeEntityId(
  entity: EntityKey,
  record: Record<string, unknown>,
): string {
  const config = ENTITY_CONFIGS[entity];
  return config.primaryKey
    .map(
      (key) =>
        `${key}${ID_VALUE_SEPARATOR}${encodeURIComponent(String(record[key] ?? ""))}`,
    )
    .join(ID_PAIR_SEPARATOR);
}

export function decodeEntityId(
  entity: EntityKey,
  id: string,
): Record<string, string> {
  const decodedId = safeDecode(id);
  const config = ENTITY_CONFIGS[entity];
  const entries = decodedId
    .split(ID_PAIR_SEPARATOR)
    .map((pair) => pair.split(ID_VALUE_SEPARATOR));
  const values: Record<string, string> = {};

  for (const [key, rawValue] of entries) {
    if (key && rawValue !== undefined) {
      values[key] = decodeURIComponent(rawValue);
    }
  }

  for (const key of config.primaryKey) {
    if (!(key in values)) {
      throw new Error(`Missing key ${key}`);
    }
  }

  return values;
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getTable(entity: EntityKey): Record<string, unknown> {
  return ENTITY_TABLES[entity] as Record<string, unknown>;
}

function buildSearchClause(entity: EntityKey, search?: string) {
  if (!search) return undefined;
  const config = ENTITY_CONFIGS[entity];
  const table = getTable(entity);
  const fields = config.searchFields;

  if (!fields.length) return undefined;

  const clauses = fields
    .map((field) => {
      const column = (table as Record<string, unknown>)[field];
      return column ? ilike(column as never, `%${search}%`) : undefined;
    })
    .filter(Boolean);

  if (!clauses.length) return undefined;
  return or(...(clauses as never[]));
}

function buildPrimaryKeyClause(
  entity: EntityKey,
  keyValues: Record<string, string>,
) {
  const config = ENTITY_CONFIGS[entity];
  const table = getTable(entity);
  const clauses = config.primaryKey.map((key) => {
    const column = (table as Record<string, unknown>)[key];
    const value = coerceValue(entity, key, keyValues[key]);
    return eq(column as never, value as never);
  });

  return clauses.length === 1 ? clauses[0] : and(...(clauses as never[]));
}

export async function listRecords(
  entity: EntityKey,
  params: ListParams,
): Promise<ListResult> {
  const table = getTable(entity);
  const config = ENTITY_CONFIGS[entity];
  const page = Math.max(params.page, 1);
  const pageSize = Math.min(Math.max(params.pageSize, 1), 100);
  const offset = (page - 1) * pageSize;
  const searchClause = buildSearchClause(entity, params.search);

  const orderField = params.sortField ?? config.primaryKey[0];
  const orderColumn =
    (table as Record<string, unknown>)[orderField] ??
    (table as Record<string, unknown>)[config.primaryKey[0]];
  const orderClause =
    params.sortDir === "desc"
      ? desc(orderColumn as never)
      : asc(orderColumn as never);

  const totalQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(table as never);
  const rowsQuery = db.select().from(table as never);

  if (searchClause) {
    totalQuery.where(searchClause as never);
    rowsQuery.where(searchClause as never);
  }

  const totalResult = await totalQuery;
  const rows = await rowsQuery
    .orderBy(orderClause as never)
    .limit(pageSize)
    .offset(offset);

  const data = rows.map((row) => ({
    ...row,
    __id: encodeEntityId(entity, row as Record<string, unknown>),
  }));

  return {
    data,
    total: totalResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getRecord(entity: EntityKey, id: string) {
  const table = getTable(entity);
  const keyValues = decodeEntityId(entity, id);
  const whereClause = buildPrimaryKeyClause(entity, keyValues);
  const rows = await db
    .select()
    .from(table as never)
    .where(whereClause as never)
    .limit(1);
  return rows[0] ?? null;
}

export async function createRecord(
  entity: EntityKey,
  payload: Record<string, unknown>,
) {
  const table = getTable(entity);
  const values = coercePayload(entity, payload, { omitReadOnly: true });
  const rows = await db
    .insert(table as never)
    .values(values as never)
    .returning();
  return rows[0] ?? null;
}

export async function updateRecord(
  entity: EntityKey,
  id: string,
  payload: Record<string, unknown>,
) {
  const table = getTable(entity);
  const keyValues = decodeEntityId(entity, id);
  const whereClause = buildPrimaryKeyClause(entity, keyValues);
  const values = coercePayload(entity, payload, {
    omitReadOnly: false,
    omitPrimaryKeys: true,
  });
  const rows = await db
    .update(table as never)
    .set(values as never)
    .where(whereClause as never)
    .returning();
  return rows[0] ?? null;
}

export async function deleteRecord(entity: EntityKey, id: string) {
  const table = getTable(entity);
  const keyValues = decodeEntityId(entity, id);
  const whereClause = buildPrimaryKeyClause(entity, keyValues);
  const rows = await db
    .delete(table as never)
    .where(whereClause as never)
    .returning();
  return rows[0] ?? null;
}

export async function listOptions(entity: EntityKey) {
  const table = getTable(entity);
  const config = ENTITY_CONFIGS[entity];
  const rows = await db
    .select()
    .from(table as never)
    .limit(200);

  return rows.map((row) => {
    const labelFields = config.optionLabelFields ?? config.primaryKey;
    const label = labelFields
      .map((field) => String((row as Record<string, unknown>)[field] ?? ""))
      .filter(Boolean)
      .join(" ");

    return {
      value: encodeEntityId(entity, row as Record<string, unknown>),
      label: label || encodeEntityId(entity, row as Record<string, unknown>),
      raw: row,
    };
  });
}

function coercePayload(
  entity: EntityKey,
  payload: Record<string, unknown>,
  options: { omitReadOnly: boolean; omitPrimaryKeys?: boolean },
) {
  const config = ENTITY_CONFIGS[entity];
  const result: Record<string, unknown> = {};

  for (const field of config.fields) {
    if (options.omitReadOnly && field.readOnly) continue;
    if (options.omitPrimaryKeys && config.primaryKey.includes(field.name))
      continue;
    if (!(field.name in payload)) continue;

    result[field.name] = coerceValue(entity, field.name, payload[field.name]);
  }

  return result;
}

function coerceValue(entity: EntityKey, fieldName: string, value: unknown) {
  const field = ENTITY_CONFIGS[entity].fields.find(
    (entry) => entry.name === fieldName,
  );

  if (!field) return value;
  if (value === null || value === undefined || value === "") return null;

  switch (field.type) {
    case "number":
      return typeof value === "number" ? value : Number(value);
    case "currency":
      return typeof value === "number" ? value : Number(value);
    case "boolean":
      return value === true || value === "true" || value === 1 || value === "1";
    case "date":
    case "datetime":
      return value instanceof Date ? value : new Date(String(value));
    case "select":
      if (typeof value === "string") {
        const targetEntity = field.optionsEntity ?? entity;
        const decoded = decodeEntityId(targetEntity, value);
        const primaryKey = ENTITY_CONFIGS[targetEntity].primaryKey[0];
        const keyValue = decoded[primaryKey];
        return coerceValue(targetEntity, primaryKey, keyValue);
      }
      return value;
    default:
      return value;
  }
}
