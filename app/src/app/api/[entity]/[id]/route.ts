import { NextResponse } from "next/server";
import { getEntityConfig, type EntityKey } from "@/lib/entities";
import { deleteRecord, getRecord, updateRecord } from "@/server/data/crud";

export async function GET(
  _request: Request,
  context: { params: { entity: string; id: string } },
) {
  const entity = context.params.entity;
  const config = getEntityConfig(entity);

  if (!config) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }

  const record = await getRecord(entity as EntityKey, context.params.id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PUT(
  request: Request,
  context: { params: { entity: string; id: string } },
) {
  const entity = context.params.entity;
  const config = getEntityConfig(entity);

  if (!config) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const record = await updateRecord(
    entity as EntityKey,
    context.params.id,
    body,
  );

  return NextResponse.json(record ?? { error: "Not found" }, {
    status: record ? 200 : 404,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: { entity: string; id: string } },
) {
  const entity = context.params.entity;
  const config = getEntityConfig(entity);

  if (!config) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }

  const record = await deleteRecord(entity as EntityKey, context.params.id);

  return NextResponse.json(record ?? { error: "Not found" }, {
    status: record ? 200 : 404,
  });
}
