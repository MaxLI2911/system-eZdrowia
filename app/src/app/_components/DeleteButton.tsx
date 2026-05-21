"use client";

import { useRouter } from "next/navigation";

type Props = {
  endpoint: string;
  redirectTo: string;
  label?: string;
  className?: string;
  confirmText?: string;
};

export function DeleteButton({
  endpoint,
  redirectTo,
  label = "Usun",
  className = "ghost",
  confirmText = "Czy na pewno usunac?",
}: Props) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(confirmText)) return;

    const response = await fetch(endpoint, { method: "DELETE" });
    if (!response.ok) {
      alert("Nie udalo sie usunac.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={handleDelete}>
      {label}
    </button>
  );
}
