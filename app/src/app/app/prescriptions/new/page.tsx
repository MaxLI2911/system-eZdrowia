import { BackButton } from "@/app/_components/BackButton";
import { PrescriptionForm } from "@/app/app/_components/PrescriptionForm";

export default function PrescriptionNewPage({
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
          <p className="eyebrow">Recepta</p>
          <h1>Nowa recepta</h1>
        </div>
        <BackButton />
      </header>
      <PrescriptionForm initialPatientId={patientId} />
    </main>
  );
}
