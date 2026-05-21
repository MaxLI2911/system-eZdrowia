import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityForm } from "@/app/admin/_components/EntityForm";
import { getEntityConfig } from "@/lib/entities";
import { getRecord } from "@/server/data/crud";

export default async function EntityEditPage({
  params,
}: {
  params: { entity: string; id: string };
}) {
  const config = getEntityConfig(params.entity);
  if (!config) return notFound();

  const record = await getRecord(config.key, params.id);
  if (!record) return notFound();

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{config.label}</p>
          <h1>Edycja rekordu</h1>
        </div>
        <Link href={`/admin/${config.key}`}>Wroc do listy</Link>
      </header>
      <EntityForm
        entity={config.key}
        mode="edit"
        initialData={record}
        recordId={params.id}
      />
    </main>
  );
}
