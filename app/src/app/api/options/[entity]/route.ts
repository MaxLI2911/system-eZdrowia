import { NextResponse } from "next/server";
import { getEntityConfig, type EntityKey } from "@/lib/entities";
import { listOptions } from "@/server/data/crud";

export async function GET(
  _request: Request,
  context: { params: { entity: string } },
) {
  const entity = context.params.entity;
  const config = getEntityConfig(entity);

  if (!config) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }

  const options = await listOptions(entity as EntityKey);
  return NextResponse.json(options);
}
