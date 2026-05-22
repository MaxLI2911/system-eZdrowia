import Link from "next/link";
import { BackButton } from "@/app/_components/BackButton";
import { formatDate, formatDateTime } from "@/lib/format";
import { listCalendarVisits } from "@/server/data/workflows";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: { past?: string };
}) {
  const showPast = searchParams?.past === "1";
  const showPastAll = searchParams?.past === "all";
  const visits = await listCalendarVisits({
    pastDays: showPast ? 14 : 0,
    pastAll: showPastAll,
    futureDays: 14,
  });
  const grouped = new Map<string, typeof visits>();

  visits.forEach((visit) => {
    const key = formatDate(visit.data);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(visit);
  });

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Kalendarz</p>
          <h1>
            {showPastAll
              ? "Wizyty z przeszlosci i nadchodzacych dni"
              : showPast
                ? "Wizyty z ostatnich i nadchodzacych dni"
                : "Wizyty w nadchodzacych dniach"}
          </h1>
        </div>
        <div className="inline-actions">
          <Link className="ghost" href="/app/calendar">
            Tylko przyszle
          </Link>
          <Link className="ghost" href="/app/calendar?past=1">
            Pokaz tez przeszle
          </Link>
          <Link className="ghost" href="/app/calendar?past=all">
            Pokaz cala historie
          </Link>
          <BackButton />
        </div>
      </header>

      {Array.from(grouped.entries()).map(([date, items]) => (
        <section className="section-card" key={date}>
          <div className="section-header">
            <h2>{date}</h2>
            <span className="pill">{items.length} wizyt</span>
          </div>
          <ul className="list">
            {items.map((visit) => (
              <li key={visit.id}>
                <div>
                  <strong>
                    <Link href={`/app/visits/${visit.id}`}>
                      {visit.pacjentImie} {visit.pacjentNazwisko}
                    </Link>
                  </strong>
                  <span>
                    {visit.typ} • {visit.lekarzImie} {visit.lekarzNazwisko}
                  </span>
                </div>
                <div className="list-meta">
                  <span>{formatDateTime(visit.godzina)}</span>
                  <span className="pill">{visit.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {visits.length === 0 && <p className="empty">Brak wizyt w kalendarzu.</p>}
    </main>
  );
}
