import Link from "next/link";
import { PatientForm } from "@/app/app/_components/PatientForm";

export default function PatientNewPage() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Pacjent</p>
          <h1>Nowy pacjent</h1>
        </div>
        <Link className="ghost" href="/app/patients">
          Wroc do listy
        </Link>
      </header>
      <PatientForm />
    </main>
  );
}
