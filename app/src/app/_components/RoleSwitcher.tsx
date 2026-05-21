"use client";

import { useEffect, useState } from "react";

export const ROLE_STORAGE_KEY = "hospital-role";

const ROLES = [
  { key: "doctor", label: "Lekarz" },
  { key: "admin", label: "Admin" },
] as const;

type RoleKey = (typeof ROLES)[number]["key"];

export function RoleSwitcher() {
  const [role, setRole] = useState<RoleKey>("doctor");

  useEffect(() => {
    const stored = window.localStorage.getItem(
      ROLE_STORAGE_KEY,
    ) as RoleKey | null;
    if (stored && ROLES.some((item) => item.key === stored)) {
      setRole(stored);
    }
  }, []);

  function handleSelect(nextRole: RoleKey) {
    setRole(nextRole);
    window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
    window.dispatchEvent(new Event("rolechange"));
  }

  return (
    <div className="role-switcher">
      <span>Tryb:</span>
      <div className="role-buttons">
        {ROLES.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.key === role ? "active" : ""}
            onClick={() => handleSelect(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
