import Link from "next/link";
import { BackButton } from "@/app/_components/BackButton";
import { formatDate } from "@/lib/format";
import { listReferrals } from "@/server/data/workflows";

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  const search = searchParams?.search ?? "";
  const referrals = await listReferrals(search || undefined);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Skierowania</p>
          <h1>Lista skierowan</h1>
        </div>
        <div className="header-actions">
          <BackButton />
          <form className="search" action="/app/referrals">
            <input
              name="search"
              placeholder="Szukaj po pacjencie, lekarzu lub usludze..."
              defaultValue={search}
            />
            <button type="submit">Szukaj</button>
          </form>
          <Link className="primary" href="/app/referrals/new">
            Nowe skierowanie
          </Link>
        </div>
      </header>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Numer</th>
              <th>Pacjent</th>
              <th>Lekarz</th>
              <th>Usluga</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((item) => (
              <tr key={item.numer}>
                <td>
                  <Link href={`/app/referrals/${item.numer}`}>
                    {item.numer}
                  </Link>
                </td>
                <td>
                  <Link href={`/app/patients/${item.pacjentId}`}>
                    {item.pacjentImie} {item.pacjentNazwisko}
                  </Link>
                </td>
                <td>
                  {item.lekarzImie} {item.lekarzNazwisko}
                </td>
                <td>{item.usluga}</td>
                <td>{formatDate(item.data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {referrals.length === 0 && (
          <p className="empty">Brak skierowan do wyswietlenia.</p>
        )}
      </section>
    </main>
  );
}
