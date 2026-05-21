"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ENTITY_LIST } from "@/lib/entities";
import { ROLE_STORAGE_KEY } from "@/app/_components/RoleSwitcher";

type RoleKey = "admin" | "doctor";

const doctorLinks = [
  { href: "/app", label: "Panel glowny" },
  { href: "/app/patients", label: "Pacjenci" },
  { href: "/app/patients/new", label: "Nowy pacjent" },
  { href: "/app/schedule", label: "Rejestracja wizyty" },
  { href: "/app/visits", label: "Wizyty" },
  { href: "/app/doctors", label: "Lekarze" },
  { href: "/app/prescriptions", label: "Recepty" },
  { href: "/app/referrals", label: "Skierowania" },
  { href: "/app/calendar", label: "Kalendarz" },
];

export function SidebarNav() {
  const [role, setRole] = useState<RoleKey>("doctor");

  useEffect(() => {
    function syncRole() {
      const stored = window.localStorage.getItem(
        ROLE_STORAGE_KEY,
      ) as RoleKey | null;
      if (stored === "admin" || stored === "doctor") {
        setRole(stored);
      } else {
        setRole("doctor");
      }
    }

    syncRole();

    function handleStorage(event: StorageEvent) {
      if (event.key === ROLE_STORAGE_KEY) {
        syncRole();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("rolechange", syncRole);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("rolechange", syncRole);
    };
  }, []);

  if (role === "admin") {
    return (
      <nav className="nav">
        <span className="nav-label">Admin</span>
        <Link href="/admin">Panel danych</Link>
        {ENTITY_LIST.map((entity) => (
          <Link key={entity.key} href={`/admin/${entity.key}`}>
            {entity.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="nav">
      <span className="nav-label">Lekarz</span>
      {doctorLinks.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
