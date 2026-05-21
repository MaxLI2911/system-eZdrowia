import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/app/_components/BackButton";
import { DeleteButton } from "@/app/_components/DeleteButton";
import { formatDate } from "@/lib/format";
import { getPrescriptionDetails } from "@/server/data/workflows";

export default async function PrescriptionDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const prescriptionId = Number(params.id);
  if (Number.isNaN(prescriptionId)) return notFound();

  const details = await getPrescriptionDetails(prescriptionId);
  if (!details) return notFound();

  const { prescription, items } = details;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Recepta</p>
          <h1>Recepta #{prescription.id}</h1>
        </div>
        <div className="header-actions">
          <BackButton />
          <DeleteButton
            endpoint={`/api/recepty/id_recepty:${prescription.id}`}
            redirectTo="/app/prescriptions"
            label="Usun recepte"
          />
        </div>
      </header>

      <section className="profile-grid">
        <div className="profile-card">
          <h3>Pacjent</h3>
          <p>
            <Link href={`/app/patients/${prescription.pacjentId}`}>
              {prescription.pacjentImie} {prescription.pacjentNazwisko}
            </Link>
          </p>
          <p>Data: {formatDate(prescription.data)}</p>
        </div>
        <div className="profile-card">
          <h3>Lekarz</h3>
          <p>
            {prescription.lekarzImie} {prescription.lekarzNazwisko}
          </p>
          <p>Pozycje: {items.length}</p>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <h2>Pozycje recepty</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Lp</th>
              <th>Lek</th>
              <th>Ilosc</th>
              <th>Dawkowanie</th>
              <th>Odplatnosc</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.lp}>
                <td>{item.lp}</td>
                <td>{item.lekNazwa ?? "-"}</td>
                <td>{item.ilosc}</td>
                <td>{item.dawkowanie}</td>
                <td>{item.odplatnosc ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="empty">Brak pozycji recepty.</p>}
      </section>
    </main>
  );
}
