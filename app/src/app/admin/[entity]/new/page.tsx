import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityForm } from "@/app/admin/_components/EntityForm";
import { getEntityConfig } from "@/lib/entities";

export default function EntityCreatePage({
  params,
}: {
  params: { entity: string };
}) {
  const config = getEntityConfig(params.entity);
  if (!config) return notFound();

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{config.label}</p>
          <h1>Nowy rekord</h1>
        </div>
        <Link href={`/admin/${config.key}`}>Wroc do listy</Link>
      </header>
      <EntityForm entity={config.key} mode="create" />
    </main>
  );
}
