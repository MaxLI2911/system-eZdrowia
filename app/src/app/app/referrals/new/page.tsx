import { BackButton } from "@/app/_components/BackButton";
import { ReferralForm } from "@/app/app/_components/ReferralForm";

export default function ReferralNewPage({
  searchParams,
}: {
  searchParams?: { patient?: string };
}) {
  const patientId = searchParams?.patient
    ? Number(searchParams.patient)
    : undefined;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Skierowanie</p>
          <h1>Nowe skierowanie</h1>
        </div>
        <BackButton />
      </header>
      <ReferralForm initialPatientId={patientId} />
    </main>
  );
}
