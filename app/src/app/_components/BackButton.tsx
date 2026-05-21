"use client";

import { useRouter } from "next/navigation";

type Props = {
  label?: string;
  className?: string;
};

export function BackButton({ label = "Wstecz", className = "ghost" }: Props) {
  const router = useRouter();

  return (
    <button type="button" className={className} onClick={() => router.back()}>
      {label}
    </button>
  );
}
