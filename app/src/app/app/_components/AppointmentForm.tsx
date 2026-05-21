"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

type OptionsMap = Record<string, Option[]>;

const STATUS_OPTIONS = ["Zaplanowana", "Zakonczona", "Anulowana"] as const;

export function AppointmentForm() {
  const router = useRouter();
  const [options, setOptions] = useState<OptionsMap>({});
  const [form, setForm] = useState({
    patient: "",
    doctor: "",
    clinic: "",
    date: "",
    time: "",
    typ: "Konsultacja",
    status: "Zaplanowana",
    opis: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const optionKeys = useMemo(
    () => [
      { key: "patient", entity: "pacjenci" },
      { key: "doctor", entity: "lekarze" },
      { key: "clinic", entity: "przychodnie" },
    ],
    [],
  );

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      const nextOptions: OptionsMap = {};
      await Promise.all(
        optionKeys.map(async ({ key, entity }) => {
          const response = await fetch(`/api/options/${entity}`);
          const data = (await response.json()) as Option[];
          if (active) nextOptions[key] = data;
        }),
      );
      if (active) setOptions(nextOptions);
    }

    loadOptions().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [optionKeys]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.patient || !form.doctor || !form.date || !form.time) {
      setError("Wypelnij wymagane pola.");
      return;
    }

    const datetime = `${form.date}T${form.time}:00`;

    setSaving(true);

    try {
      const response = await fetch("/api/wizyty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pacjenta: form.patient,
          id_lekarza: form.doctor,
          id_przychodni: form.clinic || null,
          data: form.date,
          godzina: datetime,
          typ: form.typ,
          status: form.status,
          opis: form.opis,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error ?? "Nie udalo sie zapisac wizyty.");
        return;
      }

      router.push("/app");
      router.refresh();
    } catch (err) {
      setError("Nie udalo sie zapisac wizyty.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flow-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Pacjent</span>
          <select
            value={form.patient}
            onChange={(event) => updateField("patient", event.target.value)}
            required
          >
            <option value="">Wybierz pacjenta</option>
            {(options.patient ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Lekarz</span>
          <select
            value={form.doctor}
            onChange={(event) => updateField("doctor", event.target.value)}
            required
          >
            <option value="">Wybierz lekarza</option>
            {(options.doctor ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Przychodnia</span>
          <select
            value={form.clinic}
            onChange={(event) => updateField("clinic", event.target.value)}
          >
            <option value="">Bez przypisania</option>
            {(options.clinic ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Data</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => updateField("date", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Godzina</span>
          <input
            type="time"
            value={form.time}
            onChange={(event) => updateField("time", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Typ wizyty</span>
          <input
            type="text"
            value={form.typ}
            onChange={(event) => updateField("typ", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            required
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Opis</span>
          <textarea
            value={form.opis}
            onChange={(event) => updateField("opis", event.target.value)}
            rows={3}
          />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="primary" disabled={saving}>
          {saving ? "Zapisywanie..." : "Zapisz wizyte"}
        </button>
        <a className="ghost" href="/app/patients/new">
          Nowy pacjent
        </a>
      </div>
    </form>
  );
}
