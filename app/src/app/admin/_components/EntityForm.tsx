"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ENTITY_CONFIGS,
  type EntityKey,
  type FieldConfig,
} from "@/lib/entities";
import { formatDate, formatDateTime } from "@/lib/format";

type Props = {
  entity: EntityKey;
  mode: "create" | "edit";
  initialData?: Record<string, unknown> | null;
  recordId?: string;
};

type Option = { value: string; label: string };

type OptionsMap = Record<string, Option[]>;

export function EntityForm({ entity, mode, initialData, recordId }: Props) {
  const router = useRouter();
  const config = ENTITY_CONFIGS[entity];
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    initializeValues(config.fields, initialData),
  );
  const [options, setOptions] = useState<OptionsMap>({});
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const selectFields = useMemo(
    () => config.fields.filter((field) => field.type === "select"),
    [config.fields],
  );

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      const nextOptions: OptionsMap = {};

      await Promise.all(
        selectFields.map(async (field) => {
          if (!field.optionsEntity) return;
          const response = await fetch(`/api/options/${field.optionsEntity}`);
          const data = (await response.json()) as Option[];
          if (active) nextOptions[field.name] = data;
        }),
      );

      if (active) setOptions(nextOptions);
    }

    loadOptions().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [selectFields]);

  function validateFields(): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const field of config.fields) {
      if (field.name === "telefon") {
        const val = String(values[field.name] ?? "");
        if (val.length > 0 && !/^\d+$/.test(val)) {
          errors[field.name] = "Dozwolone sa tylko cyfry";
        }
      }
    }

    return errors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSaving(true);

    try {
      const response = await fetch(getEndpoint(entity, mode, recordId), {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error ?? "Nie udalo sie zapisac danych.");
        return;
      }

      router.push(`/admin/${entity}`);
      router.refresh();
    } catch (err) {
      setError("Nie udalo sie zapisac danych.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    if (!confirm("Czy na pewno usunac rekord?")) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/${entity}/${recordId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error ?? "Nie udalo sie usunac rekordu.");
        return;
      }

      router.push(`/admin/${entity}`);
      router.refresh();
    } catch (err) {
      setError("Nie udalo sie usunac rekordu.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        {config.fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(next) => {
              setValues((prev) => ({ ...prev, [field.name]: next }));
              setFieldErrors((prev) => {
                if (!prev[field.name]) return prev;
                const copy = { ...prev };
                delete copy[field.name];
                return copy;
              });
            }}
            options={options[field.name] ?? []}
            fieldError={fieldErrors[field.name]}
            disabled={
              isSaving ||
              field.readOnly ||
              (mode === "edit" && config.primaryKey.includes(field.name))
            }
          />
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="primary" disabled={isSaving}>
          {isSaving ? "Zapisywanie..." : "Zapisz"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            className="ghost"
            onClick={handleDelete}
            disabled={isSaving}
          >
            Usun rekord
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  field,
  value,
  onChange,
  options,
  disabled,
  fieldError,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  options: Option[];
  disabled?: boolean;
  fieldError?: string;
}) {
  const commonProps = {
    name: field.name,
    disabled,
  };

  if (field.type === "textarea") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <textarea
          {...commonProps}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
        />
        {fieldError && <span className="field-error">{fieldError}</span>}
      </label>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select
          {...commonProps}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
        >
          <option value="">Wybierz</option>
          <option value="true">Tak</option>
          <option value="false">Nie</option>
        </select>
        {fieldError && <span className="field-error">{fieldError}</span>}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select
          {...commonProps}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
        >
          <option value="">Wybierz</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldError && <span className="field-error">{fieldError}</span>}
      </label>
    );
  }

  const inputType =
    field.type === "date"
      ? "date"
      : field.type === "datetime"
        ? "datetime-local"
        : field.type === "number" || field.type === "currency"
          ? "number"
          : "text";
  const inputValue = normalizeInputValue(field, value);

  return (
    <label className="field">
      <span>{field.label}</span>
      <input
        {...commonProps}
        type={inputType}
        value={inputValue}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        step={field.type === "currency" ? "0.01" : undefined}
      />
      {fieldError && <span className="field-error">{fieldError}</span>}
    </label>
  );
}

function normalizeInputValue(field: FieldConfig, value: unknown) {
  if (value === null || value === undefined) return "";

  if (field.type === "date") {
    return formatDate(String(value));
  }

  if (field.type === "datetime") {
    return formatDateTime(String(value));
  }

  return String(value);
}

function initializeValues(
  fields: FieldConfig[],
  initialData?: Record<string, unknown> | null,
) {
  const values: Record<string, unknown> = {};

  fields.forEach((field) => {
    values[field.name] = initialData?.[field.name] ?? "";
  });

  return values;
}

function getEndpoint(
  entity: EntityKey,
  mode: "create" | "edit",
  recordId?: string,
) {
  if (mode === "create") return `/api/${entity}`;
  return `/api/${entity}/${recordId}`;
}
