"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  imie: string;
  nazwisko: string;
  numer_dokum: string;
  data_urodz: string;
  plec: string;
  email: string;
  telefon: string;
};

export function PatientForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    imie: "",
    nazwisko: "",
    numer_dokum: "",
    data_urodz: "",
    plec: "K",
    email: "",
    telefon: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.imie || !form.nazwisko || !form.numer_dokum || !form.data_urodz) {
      setError("Wypelnij wszystkie wymagane pola.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/pacjenci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error ?? "Nie udalo sie zapisac pacjenta.");
        return;
      }

      router.push("/app/patients");
      router.refresh();
    } catch (err) {
      setError("Nie udalo sie zapisac pacjenta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flow-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Imie</span>
          <input
            type="text"
            value={form.imie}
            onChange={(event) => updateField("imie", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Nazwisko</span>
          <input
            type="text"
            value={form.nazwisko}
            onChange={(event) => updateField("nazwisko", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Numer dokumentu</span>
          <input
            type="text"
            value={form.numer_dokum}
            onChange={(event) => updateField("numer_dokum", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Data urodzenia</span>
          <input
            type="date"
            value={form.data_urodz}
            onChange={(event) => updateField("data_urodz", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Plec</span>
          <select
            value={form.plec}
            onChange={(event) => updateField("plec", event.target.value)}
          >
            <option value="K">K</option>
            <option value="M">M</option>
          </select>
        </label>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </label>
        <label className="field">
          <span>Telefon</span>
          <input
            type="text"
            value={form.telefon}
            onChange={(event) => updateField("telefon", event.target.value)}
          />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="primary" disabled={saving}>
          {saving ? "Zapisywanie..." : "Zapisz pacjenta"}
        </button>
      </div>
    </form>
  );
}
