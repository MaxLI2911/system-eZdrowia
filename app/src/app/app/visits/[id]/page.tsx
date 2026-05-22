import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/app/_components/BackButton";
import { formatDate, formatDateTime } from "@/lib/format";
import { getVisitDetails } from "@/server/data/workflows";
import { VisitExecutionForm } from "@/app/app/_components/VisitExecutionForm";

export default async function VisitDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const visitId = Number(params.id);
  if (Number.isNaN(visitId)) return notFound();

  const details = await getVisitDetails(visitId);
  if (!details) return notFound();

  const { visit, services, payments } = details;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Wizyta</p>
          <h1>Wizyta #{visit.id}</h1>
        </div>
        <BackButton />
      </header>

      <section className="profile-grid">
        <div className="profile-card">
          <h3>Pacjent</h3>
          <p>
            <Link href={`/app/patients/${visit.pacjentId}`}>
              {visit.pacjentImie} {visit.pacjentNazwisko}
            </Link>
          </p>
          <p>Data: {formatDate(visit.data)}</p>
          <p>Godzina: {formatDateTime(visit.godzina)}</p>
        </div>
        <div className="profile-card">
          <h3>Opiekun</h3>
          <p>
            <Link href={`/app/doctors/${visit.lekarzId}`}>
              {visit.lekarzImie} {visit.lekarzNazwisko}
            </Link>
          </p>
          <p>Typ: {visit.typ}</p>
          <p>Status: {visit.status}</p>
        </div>
        <div className="profile-card">
          <h3>Placowka</h3>
          <p>{visit.przychodnia ?? "-"}</p>
          <p>{visit.opis ?? "-"}</p>
        </div>
      </section>

      <VisitExecutionForm
        visit={{ id: visit.id, status: visit.status }}
        existingServices={services}
        existingPayments={payments}
      />
    </main>
  );
}
