import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/app/_components/BackButton";
import { DeleteButton } from "@/app/_components/DeleteButton";
import { formatDate } from "@/lib/format";
import { getReferralDetails } from "@/server/data/workflows";

export default async function ReferralDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const referralNumber = Number(params.id);
  if (Number.isNaN(referralNumber)) return notFound();

  const referral = await getReferralDetails(referralNumber);
  if (!referral) return notFound();

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Skierowanie</p>
          <h1>Skierowanie #{referral.numer}</h1>
        </div>
        <div className="header-actions">
          <BackButton />
          <DeleteButton
            endpoint={`/api/skierowania/numer:${referral.numer}`}
            redirectTo="/app/referrals"
            label="Usun skierowanie"
          />
        </div>
      </header>

      <section className="profile-grid">
        <div className="profile-card">
          <h3>Pacjent</h3>
          <p>
            <Link href={`/app/patients/${referral.pacjentId}`}>
              {referral.pacjentImie} {referral.pacjentNazwisko}
            </Link>
          </p>
          <p>Data: {formatDate(referral.data)}</p>
        </div>
        <div className="profile-card">
          <h3>Lekarz</h3>
          <p>
            {referral.lekarzImie} {referral.lekarzNazwisko}
          </p>
          <p>Usluga: {referral.usluga}</p>
        </div>
        <div className="profile-card">
          <h3>Opis</h3>
          <p>{referral.opis}</p>
          <p>
            {referral.wymagaSkierow
              ? "Usluga wymaga skierowania."
              : "Usluga nie wymaga skierowania."}
          </p>
        </div>
      </section>
    </main>
  );
}
