import Link from "next/link";
import { BackButton } from "@/app/_components/BackButton";
import { formatDate } from "@/lib/format";
import { listDoctors } from "@/server/data/workflows";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  const search = searchParams?.search ?? "";
  const doctors = await listDoctors(search || undefined);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Lekarze</p>
          <h1>Lista lekarzy</h1>
        </div>
        <div className="header-actions">
          <BackButton />
          <form className="search" action="/app/doctors">
            <input
              name="search"
              placeholder="Szukaj lekarza..."
              defaultValue={search}
            />
            <button type="submit">Szukaj</button>
          </form>
        </div>
      </header>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Lekarz</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Wizyty</th>
              <th>Ostatnia wizyta</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.id}</td>
                <td>
                  <Link href={`/app/doctors/${doctor.id}`}>
                    {doctor.imie} {doctor.nazwisko}
                  </Link>
                </td>
                <td>{doctor.email ?? "-"}</td>
                <td>{doctor.telefon ?? "-"}</td>
                <td>{doctor.visits}</td>
                <td>{doctor.lastVisit ? formatDate(doctor.lastVisit) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {doctors.length === 0 && (
          <p className="empty">Brak lekarzy do wyswietlenia.</p>
        )}
      </section>
    </main>
  );
}
