import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatBoolean,
  formatCurrency,
} from "@/lib/format";

describe("formatDate", () => {
  it("formats a Date object to ISO date string", () => {
    const date = new Date("2026-05-15T12:00:00Z");
    expect(formatDate(date)).toBe("2026-05-15");
  });

  it("formats an ISO string to date-only", () => {
    expect(formatDate("2026-01-31T08:30:00.000Z")).toBe("2026-01-31");
  });

  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatDate("")).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("");
  });

  it("handles epoch date", () => {
    expect(formatDate(new Date(0))).toBe("1970-01-01");
  });
});

describe("formatDateTime", () => {
  it("formats a Date to ISO datetime (no seconds)", () => {
    const date = new Date("2026-05-15T12:30:00Z");
    expect(formatDateTime(date)).toBe("2026-05-15T12:30");
  });

  it("formats an ISO string", () => {
    expect(formatDateTime("2026-01-31T08:15:00.000Z")).toBe("2026-01-31T08:15");
  });

  it("returns empty string for null", () => {
    expect(formatDateTime(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDateTime(undefined)).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDateTime("garbage")).toBe("");
  });
});

describe("formatBoolean", () => {
  it('returns "Tak" for true', () => {
    expect(formatBoolean(true)).toBe("Tak");
  });

  it('returns "Nie" for false', () => {
    expect(formatBoolean(false)).toBe("Nie");
  });

  it("returns empty string for null", () => {
    expect(formatBoolean(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatBoolean(undefined)).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats a number to 2 decimal places", () => {
    expect(formatCurrency(150)).toBe("150.00");
  });

  it("formats a number with decimals", () => {
    expect(formatCurrency(99.5)).toBe("99.50");
  });

  it("formats a numeric string", () => {
    expect(formatCurrency("250.75")).toBe("250.75");
  });

  it("returns empty string for null", () => {
    expect(formatCurrency(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatCurrency(undefined)).toBe("");
  });

  it("returns original string for non-numeric input", () => {
    expect(formatCurrency("abc")).toBe("abc");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("0.00");
  });
});
