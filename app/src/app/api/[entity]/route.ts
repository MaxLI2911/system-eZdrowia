import { NextResponse } from "next/server";
import { getEntityConfig, type EntityKey } from "@/lib/entities";
import { listRecords, createRecord } from "@/server/data/crud";

export async function GET(
  request: Request,
  context: { params: { entity: string } },
) {
  const entity = context.params.entity;
  const config = getEntityConfig(entity);

  if (!config) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 20);
  const search = searchParams.get("search") ?? undefined;
  const sortField = searchParams.get("sortField") ?? undefined;
  const sortDir = (searchParams.get("sortDir") ?? "asc") as "asc" | "desc";

  const result = await listRecords(entity as EntityKey, {
    page,
    pageSize,
    search,
    sortField,
    sortDir,
  });

  return NextResponse.json(result);
}

export async function POST(
  request: Request,
  context: { params: { entity: string } },
) {
  const entity = context.params.entity;
  const config = getEntityConfig(entity);

  if (!config) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const record = await createRecord(entity as EntityKey, body);

  return NextResponse.json(record, { status: 201 });
}
