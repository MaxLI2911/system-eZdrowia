"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

type OptionsMap = Record<string, Option[]>;

type ItemState = {
  medicine: string;
  ilosc: string;
  dawkowanie: string;
  odplatnosc: string;
};

type Props = {
  initialPatientId?: number;
};

export function PrescriptionForm({ initialPatientId }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<OptionsMap>({});
  const [form, setForm] = useState({
    patient: initialPatientId ? `id_pacjenta:${initialPatientId}` : "",
    doctor: "",
    date: "",
  });
  const [items, setItems] = useState<ItemState[]>([
    { medicine: "", ilosc: "1", dawkowanie: "", odplatnosc: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const optionKeys = useMemo(
    () => [
      { key: "patient", entity: "pacjenci" },
      { key: "doctor", entity: "lekarze" },
      { key: "medicine", entity: "leki" },
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

  function updateItem(index: number, field: keyof ItemState, value: string) {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { medicine: "", ilosc: "1", dawkowanie: "", odplatnosc: "" },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.patient || !form.doctor || !form.date) {
      setError("Wypelnij wymagane pola recepty.");
      return;
    }

    if (items.length === 0) {
      setError("Dodaj przynajmniej jedna pozycje recepty.");
      return;
    }

    const invalidItem = items.find(
      (item) => !item.medicine || !item.ilosc || !item.dawkowanie,
    );

    if (invalidItem) {
      setError("Uzupelnij wszystkie pozycje recepty.");
      return;
    }

    setSaving(true);

    try {
      const prescriptionResponse = await fetch("/api/recepty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: form.date,
          id_pacjenta: form.patient,
          id_lekarza: form.doctor,
        }),
      });

      if (!prescriptionResponse.ok) {
        const payload = await prescriptionResponse.json();
        setError(payload?.error ?? "Nie udalo sie zapisac recepty.");
        return;
      }

      const prescription = (await prescriptionResponse.json()) as {
        id_recepty: number;
      };

      const itemRequests = items.map((item, index) =>
        fetch("/api/pozycje_recept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_recepty: prescription.id_recepty,
            Lp: index + 1,
            id_leku: item.medicine,
            ilosc: item.ilosc,
            dawkowanie: item.dawkowanie,
            odplatnosc: item.odplatnosc || null,
          }),
        }),
      );

      const results = await Promise.all(itemRequests);
      if (results.some((response) => !response.ok)) {
        setError("Nie udalo sie zapisac pozycji recepty.");
        return;
      }

      router.push("/app/prescriptions");
      router.refresh();
    } catch (err) {
      setError("Nie udalo sie zapisac recepty.");
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
          <span>Data wystawienia</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => updateField("date", event.target.value)}
            required
          />
        </label>
      </div>

      <div className="section-header" style={{ marginTop: 24 }}>
        <h3>Pozycje recepty</h3>
        <button type="button" className="ghost" onClick={addItem}>
          Dodaj pozycje
        </button>
      </div>

      <div className="item-grid">
        {items.map((item, index) => (
          <div className="item-row" key={index}>
            <label className="field">
              <span>Lek</span>
              <select
                value={item.medicine}
                onChange={(event) =>
                  updateItem(index, "medicine", event.target.value)
                }
                required
              >
                <option value="">Wybierz lek</option>
                {(options.medicine ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Ilosc</span>
              <input
                type="number"
                min={1}
                value={item.ilosc}
                onChange={(event) =>
                  updateItem(index, "ilosc", event.target.value)
                }
                required
              />
            </label>
            <label className="field">
              <span>Dawkowanie</span>
              <input
                type="text"
                value={item.dawkowanie}
                onChange={(event) =>
                  updateItem(index, "dawkowanie", event.target.value)
                }
                required
              />
            </label>
            <label className="field">
              <span>Odplatnosc</span>
              <input
                type="text"
                value={item.odplatnosc}
                onChange={(event) =>
                  updateItem(index, "odplatnosc", event.target.value)
                }
                placeholder="np. 50%"
              />
            </label>
            <div className="inline-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                Usun
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="primary" disabled={saving}>
          {saving ? "Zapisywanie..." : "Zapisz recepte"}
        </button>
      </div>
    </form>
  );
}
