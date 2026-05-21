import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/app/_components/BackButton";
import { formatDate, formatDateTime } from "@/lib/format";
import { getDoctorProfile } from "@/server/data/workflows";

export default async function DoctorProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const doctorId = Number(params.id);
  if (Number.isNaN(doctorId)) return notFound();

  const profile = await getDoctorProfile(doctorId);
  if (!profile) return notFound();

  const { doctor, visits, patients } = profile;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Lekarz</p>
          <h1>
            {doctor.imie} {doctor.nazwisko}
          </h1>
        </div>
        <BackButton />
      </header>

      <section className="profile-grid">
        <div className="profile-card">
          <h3>Dane kontaktowe</h3>
          <p>Email: {doctor.email ?? "-"}</p>
          <p>Telefon: {doctor.telefon ?? "-"}</p>
        </div>
        <div className="profile-card">
          <h3>Statystyki</h3>
          <p>Wizyty: {visits.length}</p>
          <p>Pacjenci: {patients.length}</p>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <h2>Ostatnie wizyty</h2>
        </div>
        <ul className="list">
          {visits.map((visit) => (
            <li key={visit.id}>
              <div>
                <strong>
                  <Link href={`/app/visits/${visit.id}`}>{visit.typ}</Link>
                </strong>
                <span>
                  {visit.pacjentImie} {visit.pacjentNazwisko} •{" "}
                  {visit.przychodnia ?? "-"}
                </span>
              </div>
              <div className="list-meta">
                <span>{formatDate(visit.data)}</span>
                <span>{formatDateTime(visit.godzina)}</span>
                <span className="pill">{visit.status}</span>
              </div>
            </li>
          ))}
        </ul>
        {visits.length === 0 && <p className="empty">Brak wizyt.</p>}
      </section>

      <section className="section-card">
        <div className="section-header">
          <h2>Pacjenci lekarza</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Pacjent</th>
              <th>Wizyty</th>
              <th>Ostatnia wizyta</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>
                  <Link href={`/app/patients/${patient.id}`}>
                    {patient.imie} {patient.nazwisko}
                  </Link>
                </td>
                <td>{patient.visitsCount}</td>
                <td>
                  {patient.lastVisit ? formatDate(patient.lastVisit) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {patients.length === 0 && (
          <p className="empty">Brak pacjentow przypisanych.</p>
        )}
      </section>
    </main>
  );
}
