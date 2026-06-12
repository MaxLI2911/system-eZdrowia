// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ENTITY_LIST } from "@/lib/entities";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import AdminHomePage from "@/app/admin/page";

describe("T-UNIT-03: Poprawne renderowanie panelu", () => {
  it("renders all entity tiles with correct labels and active links", () => {
    render(<AdminHomePage />);

    const links = screen.getAllByRole("link");
    const hrefs = new Set(links.map((l) => l.getAttribute("href")));

    for (const entity of ENTITY_LIST) {
      expect(hrefs.has(`/admin/${entity.key}`)).toBe(true);
    }

    const labels = links.map((l) => l.textContent);
    for (const entity of ENTITY_LIST) {
      expect(labels.some((label) => label?.includes(entity.label))).toBe(true);
    }
  });

  it("renders exactly the number of tiles matching ENTITY_LIST", () => {
    render(<AdminHomePage />);
    const grid = document.querySelector(".grid");
    expect(grid).not.toBeNull();
    const tiles = grid!.querySelectorAll("a");
    expect(tiles.length).toBe(ENTITY_LIST.length);
  });

  it("renders the hero section with correct heading", () => {
    render(<AdminHomePage />);

    expect(
      screen.getByRole("heading", {
        name: /panel zarzadzania danymi szpitala/i,
      }),
    ).toBeInTheDocument();
  });
});
