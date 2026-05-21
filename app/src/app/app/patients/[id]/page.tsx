import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/app/_components/BackButton";
import { formatDate, formatDateTime } from "@/lib/format";
import { getPatientProfile } from "@/server/data/workflows";

export default async function PatientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const patientId = Number(params.id);
  if (Number.isNaN(patientId)) return notFound();

  const profile = await getPatientProfile(patientId);
  if (!profile) return notFound();

  const { patient, visits, prescriptions, referrals, history } = profile;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Profil pacjenta</p>
          <h1>
            {patient.imie} {patient.nazwisko}
          </h1>
        </div>
        <div className="header-actions">
          <BackButton />
          <Link className="ghost" href="/app/schedule">
            Umow wizyte
          </Link>
          <Link className="primary" href="/app/patients">
            Wroc do listy
          </Link>
        </div>
      </header>

      <section className="profile-grid">
        <div className="profile-card">
          <h3>Dane podstawowe</h3>
          <p>Data urodzenia: {formatDate(patient.data_urodz)}</p>
          <p>Plec: {patient.plec}</p>
          <p>Numer dokumentu: {patient.numer_dokum}</p>
          <p>Email: {patient.email ?? "-"}</p>
          <p>Telefon: {patient.telefon ?? "-"}</p>
        </div>
        <div className="profile-card">
          <h3>Szybkie akcje</h3>
          <div className="button-stack">
            <Link className="primary" href="/app/schedule">
              Nowa wizyta
            </Link>
            <Link
              className="ghost"
              href={`/app/prescriptions/new?patient=${patient.id_pacjenta}`}
            >
              Wystaw recepte
            </Link>
            <Link
              className="ghost"
              href={`/app/referrals/new?patient=${patient.id_pacjenta}`}
            >
              Wystaw skierowanie
            </Link>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <h2>Wizyty</h2>
          <Link href="/app/calendar">Zobacz w kalendarzu</Link>
        </div>
        <ul className="list">
          {visits.map((visit) => (
            <li key={visit.id}>
              <div>
                <strong>
                  <Link href={`/app/visits/${visit.id}`}>{visit.typ}</Link>
                </strong>
                <span>
                  {visit.lekarzImie} {visit.lekarzNazwisko} •{" "}
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
          <h2>Recepty</h2>
          <span className="muted-text">Ostatnie</span>
        </div>
        <ul className="list">
          {prescriptions.map((item) => (
            <li key={item.id}>
              <div>
                <strong>
                  <Link href={`/app/prescriptions/${item.id}`}>
                    Recepta #{item.id}
                  </Link>
                </strong>
                <span>
                  {item.lekarzImie} {item.lekarzNazwisko} • pozycje:{" "}
                  {item.items}
                </span>
              </div>
              <div className="list-meta">
                <span>{formatDate(item.data)}</span>
              </div>
            </li>
          ))}
        </ul>
        {prescriptions.length === 0 && <p className="empty">Brak recept.</p>}
      </section>

      <section className="section-card">
        <div className="section-header">
          <h2>Skierowania</h2>
          <span className="muted-text">Ostatnie</span>
        </div>
        <ul className="list">
          {referrals.map((item) => (
            <li key={item.numer}>
              <div>
                <strong>
                  <Link href={`/app/referrals/${item.numer}`}>
                    Skierowanie #{item.numer}
                  </Link>
                </strong>
                <span>
                  {item.usluga} • {item.lekarzImie} {item.lekarzNazwisko}
                </span>
              </div>
              <div className="list-meta">
                <span>{formatDate(item.data)}</span>
              </div>
            </li>
          ))}
        </ul>
        {referrals.length === 0 && <p className="empty">Brak skierowan.</p>}
      </section>

      <section className="section-card">
        <div className="section-header">
          <h2>Historia leczenia</h2>
          <span className="muted-text">Podglad</span>
        </div>
        <ul className="list">
          {history.map((item) => (
            <li key={`${item.id}-${item.wizytaId}`}>
              <div>
                <strong>Wizyta {item.wizytaId}</strong>
                <span>{item.typ ?? "-"}</span>
              </div>
              <div className="list-meta">
                <span>{item.data ? formatDate(item.data) : "-"}</span>
                <span className="pill">{item.status ?? "-"}</span>
              </div>
            </li>
          ))}
        </ul>
        {history.length === 0 && <p className="empty">Brak historii.</p>}
      </section>
    </main>
  );
}
