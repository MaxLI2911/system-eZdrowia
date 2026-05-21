import Link from "next/link";
import { BackButton } from "@/app/_components/BackButton";
import { formatDate, formatDateTime } from "@/lib/format";
import { listVisits } from "@/server/data/workflows";

export default async function VisitsPage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  const search = searchParams?.search ?? "";
  const visits = await listVisits(search || undefined);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Wizyty</p>
          <h1>Lista wizyt</h1>
        </div>
        <div className="header-actions">
          <BackButton />
          <form className="search" action="/app/visits">
            <input
              name="search"
              placeholder="Szukaj po pacjencie, lekarzu, statusie..."
              defaultValue={search}
            />
            <button type="submit">Szukaj</button>
          </form>
          <Link className="primary" href="/app/schedule">
            Nowa wizyta
          </Link>
        </div>
      </header>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pacjent</th>
              <th>Lekarz</th>
              <th>Data</th>
              <th>Status</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td>{visit.id}</td>
                <td>
                  <Link href={`/app/patients/${visit.pacjentId}`}>
                    {visit.pacjentImie} {visit.pacjentNazwisko}
                  </Link>
                </td>
                <td>
                  {visit.lekarzImie} {visit.lekarzNazwisko}
                </td>
                <td>
                  {formatDate(visit.data)} {formatDateTime(visit.godzina)}
                </td>
                <td>{visit.status}</td>
                <td>
                  <Link href={`/app/visits/${visit.id}`}>Otworz</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visits.length === 0 && <p className="empty">Brak wizyt.</p>}
      </section>
    </main>
  );
}
