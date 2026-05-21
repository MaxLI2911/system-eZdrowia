import { BackButton } from "@/app/_components/BackButton";
import { AppointmentForm } from "@/app/app/_components/AppointmentForm";

export default function SchedulePage() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Rejestracja</p>
          <h1>Nowa wizyta</h1>
        </div>
        <BackButton />
      </header>
      <AppointmentForm />
    </main>
  );
}
