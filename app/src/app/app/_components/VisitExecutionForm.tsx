"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/format";

type ServiceOption = { value: string; label: string; raw?: { cena?: string } };

type VisitDetails = {
  id: number;
  status: string;
};

type Props = {
  visit: VisitDetails;
  existingServices: {
    id: number;
    nazwa: string;
    cena?: string | number | null;
  }[];
  existingPayments: {
    id: number;
    kwota: string | number | null;
    status?: string | null;
    metoda?: string | null;
    data?: Date | string | null;
  }[];
};

const STATUS_OPTIONS = ["Zaplanowana", "W trakcie", "Zakonczona", "Anulowana"];
const PAYMENT_STATUS = ["Oczekujaca", "Zaplacona", "Nieoplacona"];
const PAYMENT_METHODS = ["Karta", "Gotowka", "Przelew", "Blik"];

export function VisitExecutionForm({
  visit,
  existingServices,
  existingPayments,
}: Props) {
  const router = useRouter();
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [status, setStatus] = useState(visit.status ?? "Zaplanowana");
  const [serviceId, setServiceId] = useState("");
  const [paymentStatusEdits, setPaymentStatusEdits] = useState<
    Record<number, string>
  >({});
  const [savingPaymentId, setSavingPaymentId] = useState<number | null>(null);
  const [payment, setPayment] = useState({
    kwota: "",
    status: "Oczekujaca",
    metoda: "Karta",
    data: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const usedServiceIds = useMemo(
    () => new Set(existingServices.map((service) => service.id)),
    [existingServices],
  );
  const totalCost = useMemo(
    () =>
      existingServices.reduce((sum, service) => {
        const value =
          typeof service.cena === "number"
            ? service.cena
            : Number(service.cena ?? 0);
        return Number.isNaN(value) ? sum : sum + value;
      }, 0),
    [existingServices],
  );

  useEffect(() => {
    let active = true;

    async function loadServices() {
      const response = await fetch("/api/options/uslugi");
      const data = (await response.json()) as ServiceOption[];
      if (active) setServiceOptions(data);
    }

    loadServices().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  async function updateStatus(nextStatus: string) {
    const paid = existingPayments.reduce((sum, item) => {
      const value =
        typeof item.kwota === "number" ? item.kwota : Number(item.kwota ?? 0);
      return Number.isNaN(value) ? sum : sum + value;
    }, 0);

    if (nextStatus === "Zakonczona" && totalCost > 0 && paid < totalCost) {
      setError("Aby zakonczyc wizyte, rozlicz platnosc.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/wizyty/id_wizyty:${visit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error ?? "Nie udalo sie zapisac statusu.");
        return;
      }

      setStatus(nextStatus);
      router.refresh();
    } catch (err) {
      setError("Nie udalo sie zapisac statusu.");
    } finally {
      setSaving(false);
    }
  }

  async function addService() {
    if (!serviceId) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/uslugi_w_wizytach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_wizyty: `id_wizyty:${visit.id}`,
          id_uslugi: serviceId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error ?? "Nie udalo sie dodac uslugi.");
        return;
      }

      setServiceId("");
      router.refresh();
    } catch (err) {
      setError("Nie udalo sie dodac uslugi.");
    } finally {
      setSaving(false);
    }
  }

  async function addPayment() {
    if (!payment.kwota) {
      setError("Podaj kwote platnosci.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/platnosci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_wizyty: `id_wizyty:${visit.id}`,
          kwota: payment.kwota,
          status: payment.status,
          data: payment.data,
          metoda: payment.metoda,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error ?? "Nie udalo sie zapisac platnosci.");
        return;
      }

      setPayment((prev) => ({ ...prev, kwota: "" }));
      router.refresh();
    } catch (err) {
      setError("Nie udalo sie zapisac platnosci.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePaymentStatus(paymentId: number) {
    const nextStatus =
      paymentStatusEdits[paymentId] ??
      existingPayments.find((item) => item.id === paymentId)?.status;

    if (!nextStatus) return;

    setSavingPaymentId(paymentId);
    setError(null);

    try {
      const response = await fetch(`/api/platnosci/id_platnosci:${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error ?? "Nie udalo sie zapisac platnosci.");
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Nie udalo sie zapisac platnosci.");
    } finally {
      setSavingPaymentId(null);
    }
  }

  async function deletePayment(paymentId: number) {
    if (!confirm("Czy na pewno usunac platnosc?")) return;

    setSavingPaymentId(paymentId);
    setError(null);

    try {
      const response = await fetch(`/api/platnosci/id_platnosci:${paymentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Nie udalo sie usunac platnosci.");
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Nie udalo sie usunac platnosci.");
    } finally {
      setSavingPaymentId(null);
    }
  }

  const availableServices = serviceOptions.filter(
    (option) => !usedServiceIds.has(Number(option.value.split(":")[1])),
  );

  return (
    <div className="flow-card">
      <div className="section-header">
        <h3>Status wizyty</h3>
        <div className="inline-actions">
          <select
            value={status}
            onChange={(event) => updateStatus(event.target.value)}
            disabled={saving}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 24 }}>
        <h3>Uslugi w wizycie</h3>
        <div className="inline-actions">
          <select
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            disabled={saving}
          >
            <option value="">Dodaj usluge...</option>
            {availableServices.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ghost"
            onClick={addService}
            disabled={saving || !serviceId}
          >
            Dodaj
          </button>
        </div>
      </div>

      <ul className="list" style={{ marginTop: 16 }}>
        {existingServices.map((service) => (
          <li key={service.id}>
            <div>
              <strong>{service.nazwa}</strong>
            </div>
          </li>
        ))}
      </ul>
      {existingServices.length === 0 && (
        <p className="empty">Brak dodanych uslug.</p>
      )}
      {existingServices.length > 0 && (
        <p className="hint">Laczny koszt uslug: {totalCost.toFixed(2)} PLN</p>
      )}

      <div className="section-header" style={{ marginTop: 24 }}>
        <h3>Platnosc</h3>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Kwota</span>
          <input
            type="number"
            step="0.01"
            value={payment.kwota}
            onChange={(event) =>
              setPayment((prev) => ({ ...prev, kwota: event.target.value }))
            }
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select
            value={payment.status}
            onChange={(event) =>
              setPayment((prev) => ({ ...prev, status: event.target.value }))
            }
          >
            {PAYMENT_STATUS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Metoda</span>
          <select
            value={payment.metoda}
            onChange={(event) =>
              setPayment((prev) => ({ ...prev, metoda: event.target.value }))
            }
          >
            {PAYMENT_METHODS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Data</span>
          <input
            type="date"
            value={payment.data}
            onChange={(event) =>
              setPayment((prev) => ({ ...prev, data: event.target.value }))
            }
          />
        </label>
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="primary"
          onClick={addPayment}
          disabled={saving}
        >
          Dodaj platnosc
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <section className="section-card" style={{ marginTop: 24 }}>
        <div className="section-header">
          <h3>Platnosci</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Kwota</th>
              <th>Status</th>
              <th>Metoda</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {existingPayments.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{formatDate(item.data)}</td>
                <td>{formatCurrency(item.kwota)}</td>
                <td>
                  <select
                    value={
                      paymentStatusEdits[item.id] ??
                      item.status ??
                      PAYMENT_STATUS[0]
                    }
                    onChange={(event) =>
                      setPaymentStatusEdits((prev) => ({
                        ...prev,
                        [item.id]: event.target.value,
                      }))
                    }
                    disabled={savingPaymentId === item.id}
                  >
                    {PAYMENT_STATUS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{item.metoda ?? "-"}</td>
                <td>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => updatePaymentStatus(item.id)}
                    disabled={savingPaymentId === item.id}
                  >
                    Zapisz
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => deletePayment(item.id)}
                    disabled={savingPaymentId === item.id}
                  >
                    Usun
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {existingPayments.length === 0 && (
          <p className="empty">Brak platnosci dla tej wizyty.</p>
        )}
      </section>
    </div>
  );
}
