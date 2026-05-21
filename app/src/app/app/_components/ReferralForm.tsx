"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  value: string;
  label: string;
  raw?: { wymaga_skierow?: boolean };
};

type OptionsMap = Record<string, Option[]>;

type Props = {
  initialPatientId?: number;
};

export function ReferralForm({ initialPatientId }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<OptionsMap>({});
  const [form, setForm] = useState({
    numer: String(Math.floor(Date.now() / 1000)),
    patient: initialPatientId ? `id_pacjenta:${initialPatientId}` : "",
    doctor: "",
    service: "",
    date: "",
    opis: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const optionKeys = useMemo(
    () => [
      { key: "patient", entity: "pacjenci" },
      { key: "doctor", entity: "lekarze" },
      { key: "service", entity: "uslugi" },
    ],
    [],
  );

  const serviceHint = (options.service ?? []).find(
    (item) => item.value === form.service,
  )?.raw?.wymaga_skierow;

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

    if (
      !form.patient ||
      !form.doctor ||
      !form.service ||
      !form.date ||
      !form.opis
    ) {
      setError("Wypelnij wszystkie wymagane pola.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/skierowania", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numer: form.numer,
          id_pacjenta: form.patient,
          id_lekarza: form.doctor,
          id_uslugi: form.service,
          data_wystaw: form.date,
          opis: form.opis,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error ?? "Nie udalo sie zapisac skierowania.");
        return;
      }

      router.push("/app/referrals");
      router.refresh();
    } catch (err) {
      setError("Nie udalo sie zapisac skierowania.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flow-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Numer</span>
          <input
            type="number"
            value={form.numer}
            onChange={(event) => updateField("numer", event.target.value)}
            required
          />
        </label>
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
          <span>Usluga</span>
          <select
            value={form.service}
            onChange={(event) => updateField("service", event.target.value)}
            required
          >
            <option value="">Wybierz usluge</option>
            {(options.service ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {form.service && (
            <p className="hint">
              {serviceHint
                ? "Usluga wymaga skierowania."
                : "Usluga nie wymaga skierowania."}
            </p>
          )}
        </label>
        <label className="field">
          <span>Data wystawienia</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => updateField("date", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Opis</span>
          <textarea
            value={form.opis}
            onChange={(event) => updateField("opis", event.target.value)}
            rows={3}
            required
          />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="primary" disabled={saving}>
          {saving ? "Zapisywanie..." : "Zapisz skierowanie"}
        </button>
      </div>
    </form>
  );
}
