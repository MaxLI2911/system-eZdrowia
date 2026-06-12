// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import { EntityForm } from "@/app/admin/_components/EntityForm";
import { ENTITY_CONFIGS } from "@/lib/entities";

const pacjent = ENTITY_CONFIGS.pacjenci;
const L = Object.fromEntries(pacjent.fields.map((f) => [f.name, f.label]));

function fill(field: HTMLElement, value: string) {
  fireEvent.change(field, { target: { value } });
}

function fillRequired() {
  fill(screen.getByLabelText(L.imie), "Anna");
  fill(screen.getByLabelText(L.nazwisko), "Kowalska");
  fill(screen.getByLabelText(L.numer_dokum), "ABC123456");
  fill(screen.getByLabelText(L.data_urodz), "1990-01-01");
  fill(screen.getByLabelText(L.plec), "K");
}

describe("T-UNIT-01: Walidacja formularza przed wyslaniem", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockPush.mockClear();
    mockRefresh.mockClear();

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
  });

  it("shows error when telefon contains letters", () => {
    render(<EntityForm entity="pacjenci" mode="create" />);
    fillRequired();
    fill(screen.getByLabelText(L.telefon), "abcde");

    fireEvent.click(screen.getByRole("button", { name: /zapisz/i }));

    expect(
      screen.getByText("Dozwolone sa tylko cyfry"),
    ).toBeInTheDocument();
  });

  it("does not call API when validation fails", () => {
    render(<EntityForm entity="pacjenci" mode="create" />);
    fillRequired();
    fill(screen.getByLabelText(L.telefon), "xyz");

    fireEvent.click(screen.getByRole("button", { name: /zapisz/i }));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("submits successfully when all fields are valid", () => {
    render(<EntityForm entity="pacjenci" mode="create" />);
    fillRequired();
    fill(screen.getByLabelText(L.telefon), "500100200");

    fireEvent.click(screen.getByRole("button", { name: /zapisz/i }));

    expect(mockFetch).toHaveBeenCalled();
  });
});
