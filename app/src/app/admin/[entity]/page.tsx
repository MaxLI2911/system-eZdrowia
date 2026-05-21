import Link from "next/link";
import { notFound } from "next/navigation";
import { getEntityConfig, type EntityKey } from "@/lib/entities";
import {
  formatBoolean,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/lib/format";
import { listRecords } from "@/server/data/crud";

const PAGE_SIZE = 20;

export default async function EntityListPage({
  params,
  searchParams,
}: {
  params: { entity: string };
  searchParams?: { page?: string; search?: string };
}) {
  const config = getEntityConfig(params.entity);
  if (!config) return notFound();

  const page = Number(searchParams?.page ?? 1);
  const search = searchParams?.search ?? "";

  const result = await listRecords(config.key as EntityKey, {
    page,
    pageSize: PAGE_SIZE,
    search,
  });

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{config.label}</p>
          <h1>Lista rekordow</h1>
        </div>
        <div className="header-actions">
          <form className="search" action={`/admin/${config.key}`}>
            <input
              name="search"
              placeholder="Szukaj..."
              defaultValue={search}
            />
            <button type="submit">Szukaj</button>
          </form>
          <Link className="primary" href={`/admin/${config.key}/new`}>
            Dodaj rekord
          </Link>
        </div>
      </header>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              {config.listFields.map((field) => (
                <th key={field}>{field}</th>
              ))}
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((row) => (
              <tr key={String(row.__id)}>
                {config.listFields.map((field) => {
                  const fieldConfig = config.fields.find(
                    (item) => item.name === field,
                  );
                  return (
                    <td key={field}>
                      {formatCell(fieldConfig?.type, row[field])}
                    </td>
                  );
                })}
                <td>
                  <Link href={`/admin/${config.key}/${row.__id}`}>Edytuj</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.data.length === 0 && (
          <p className="empty">Brak rekordow do wyswietlenia.</p>
        )}
      </section>

      <footer className="pagination">
        <Link
          href={`/admin/${config.key}?page=${Math.max(page - 1, 1)}&search=${encodeURIComponent(search)}`}
          className={page <= 1 ? "disabled" : ""}
        >
          Poprzednia
        </Link>
        <span>
          Strona {result.page} /{" "}
          {Math.max(Math.ceil(result.total / result.pageSize), 1)}
        </span>
        <Link
          href={`/admin/${config.key}?page=${page + 1}&search=${encodeURIComponent(search)}`}
          className={
            page >= Math.ceil(result.total / result.pageSize) ? "disabled" : ""
          }
        >
          Nastepna
        </Link>
      </footer>
    </main>
  );
}

function formatCell(type: string | undefined, value: unknown) {
  if (value instanceof Date) return formatDateTime(value);
  if (value === null || value === undefined) return "";

  if (type === "boolean") return formatBoolean(Boolean(value));
  if (type === "currency") return formatCurrency(value as string | number);
  if (type === "date") return formatDate(String(value));
  if (type === "datetime") return formatDateTime(String(value));

  const stringValue = String(value);
  if (stringValue.length > 60) return `${stringValue.slice(0, 57)}...`;
  return stringValue;
}
