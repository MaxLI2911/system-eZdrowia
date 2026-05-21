import Link from "next/link";
import { BackButton } from "@/app/_components/BackButton";
import { formatDate } from "@/lib/format";
import { listPrescriptions } from "@/server/data/workflows";

export default async function PrescriptionsPage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  const search = searchParams?.search ?? "";
  const prescriptions = await listPrescriptions(search || undefined);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Recepty</p>
          <h1>Lista recept</h1>
        </div>
        <div className="header-actions">
          <BackButton />
          <form className="search" action="/app/prescriptions">
            <input
              name="search"
              placeholder="Szukaj po pacjencie lub lekarzu..."
              defaultValue={search}
            />
            <button type="submit">Szukaj</button>
          </form>
          <Link className="primary" href="/app/prescriptions/new">
            Nowa recepta
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
              <th>Pozycje</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/app/prescriptions/${item.id}`}>{item.id}</Link>
                </td>
                <td>
                  <Link href={`/app/patients/${item.pacjentId}`}>
                    {item.pacjentImie} {item.pacjentNazwisko}
                  </Link>
                </td>
                <td>
                  {item.lekarzImie} {item.lekarzNazwisko}
                </td>
                <td>{formatDate(item.data)}</td>
                <td>{item.items}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {prescriptions.length === 0 && (
          <p className="empty">Brak recept do wyswietlenia.</p>
        )}
      </section>
    </main>
  );
}
