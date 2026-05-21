import Link from "next/link";
import { BackButton } from "@/app/_components/BackButton";
import { formatDate } from "@/lib/format";
import { listPatients } from "@/server/data/workflows";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  const search = searchParams?.search ?? "";
  const patients = await listPatients(search || undefined);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Pacjenci</p>
          <h1>Lista pacjentow</h1>
        </div>
        <div className="header-actions">
          <BackButton />
          <form className="search" action="/app/patients">
            <input
              name="search"
              placeholder="Szukaj pacjenta..."
              defaultValue={search}
            />
            <button type="submit">Szukaj</button>
          </form>
          <Link className="primary" href="/app/patients/new">
            Nowy pacjent
          </Link>
        </div>
      </header>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pacjent</th>
              <th>Telefon</th>
              <th>Data urodzenia</th>
              <th>Ostatnia wizyta</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>{patient.id}</td>
                <td>
                  <Link href={`/app/patients/${patient.id}`}>
                    {patient.imie} {patient.nazwisko}
                  </Link>
                </td>
                <td>{patient.telefon ?? "-"}</td>
                <td>{formatDate(patient.dataUrodz)}</td>
                <td>
                  {patient.ostatniaWizyta
                    ? formatDate(patient.ostatniaWizyta)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {patients.length === 0 && (
          <p className="empty">Brak pacjentow do wyswietlenia.</p>
        )}
      </section>
    </main>
  );
}
