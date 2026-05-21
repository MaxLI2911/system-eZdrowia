import Link from "next/link";
import { BackButton } from "@/app/_components/BackButton";
import { formatDate, formatDateTime } from "@/lib/format";
import { getDashboardData } from "@/server/data/workflows";

export default async function HospitalDashboard() {
  const { stats, upcomingVisits } = await getDashboardData();

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Hospital Operations</p>
          <h1>Panel glowny</h1>
        </div>
        <div className="header-actions">
          <BackButton />
          <Link className="primary" href="/app/schedule">
            Zarejestruj wizyte
          </Link>
          <Link className="ghost" href="/app/patients">
            Lista pacjentow
          </Link>
        </div>
      </header>

      <section className="stat-grid">
        <div className="stat-card">
          <h3>Pacjenci</h3>
          <p>{stats.patients}</p>
          <span>aktywni w systemie</span>
        </div>
        <div className="stat-card">
          <h3>Wizyty 7 dni</h3>
          <p>{stats.visitsWeek}</p>
          <span>zaplanowane</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="section-card">
          <div className="section-header">
            <h2>Nadchodzace wizyty</h2>
            <Link href="/app/calendar">Kalendarz</Link>
          </div>
          <ul className="list">
            {upcomingVisits.map((visit) => (
              <li key={visit.id}>
                <div>
                  <strong>
                    {visit.pacjentImie} {visit.pacjentNazwisko}
                  </strong>
                  <span>
                    {visit.typ} • {visit.lekarzImie} {visit.lekarzNazwisko}
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
          {upcomingVisits.length === 0 && (
            <p className="empty">Brak nadchodzacych wizyt.</p>
          )}
        </div>
      </section>
    </main>
  );
}
