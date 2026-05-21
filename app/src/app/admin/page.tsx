import Link from "next/link";
import { ENTITY_LIST } from "@/lib/entities";

export default function AdminHomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Hospital Admin Console</p>
          <h1>Panel zarzadzania danymi szpitala</h1>
          <p className="subtle">
            Wybierz modul danych, aby przegladac rekordy, edytowac je lub
            dodawac nowe pozycje.
          </p>
        </div>
        <div className="hero-card">
          <h2>Gotowe przeplywy</h2>
          <ul>
            <li>Wizyta + uslugi + platnosc</li>
            <li>Recepta + pozycje recept</li>
            <li>Skierowanie powiazane z usluga</li>
          </ul>
        </div>
      </section>

      <section className="grid">
        {ENTITY_LIST.map((entity) => (
          <Link key={entity.key} href={`/admin/${entity.key}`} className="card">
            <div>
              <h3>{entity.label}</h3>
              <p>Edytuj i zarzadzaj rekordami</p>
            </div>
            <span className="chevron">&rarr;</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
