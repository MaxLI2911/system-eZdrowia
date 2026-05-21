export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function formatDateTime(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value ? "Tak" : "Nie";
}

export function formatCurrency(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  const numberValue = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numberValue)) return String(value);
  return numberValue.toFixed(2);
}
