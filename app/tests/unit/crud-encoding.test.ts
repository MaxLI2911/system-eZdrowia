import { describe, it, expect } from "vitest";
import {
  encodeEntityId,
  decodeEntityId,
} from "@/server/data/crud";

describe("encodeEntityId / decodeEntityId round-trip", () => {
  it("encodes and decodes a single primary key entity", () => {
    const record = { id_pacjenta: 42, imie: "Jan", nazwisko: "Kowalski" };
    const encoded = encodeEntityId("pacjenci", record);
    const decoded = decodeEntityId("pacjenci", encoded);

    expect(decoded.id_pacjenta).toBe("42");
  });

  it("encodes and decodes a composite key entity", () => {
    const record = { id_recepty: 10, Lp: 3, id_leku: 5 };
    const encoded = encodeEntityId("pozycje_recept", record);
    const decoded = decodeEntityId("pozycje_recept", encoded);

    expect(decoded.id_recepty).toBe("10");
    expect(decoded.Lp).toBe("3");
  });

  it("handles string values in keys", () => {
    const record = { id_specjaliz: 7, nazwa: "Kardiologia" };
    const encoded = encodeEntityId("specjalizacje", record);
    const decoded = decodeEntityId("specjalizacje", encoded);

    expect(decoded.id_specjaliz).toBe("7");
  });

  it("uses URI encoding for special characters", () => {
    const record = { id_przychodni: 1, nazwa: "Klinika Główna", miasto: "Kraków" };
    const encoded = encodeEntityId("przychodnie", record);
    const decoded = decodeEntityId("przychodnie", encoded);

    expect(decoded.id_przychodni).toBe("1");
  });
});

describe("encodeEntityId", () => {
  it("joins multiple keys with separator", () => {
    const record = { id_wizyty: 1, id_uslugi: 2 };
    const encoded = encodeEntityId("uslugi_w_wizytach", record);
    expect(encoded).toContain("|");
    expect(encoded).toContain(":");
  });
});

describe("decodeEntityId", () => {
  it("throws when a required primary key is missing", () => {
    const invalidId = "missing_some_keys";
    expect(() => decodeEntityId("pacjenci", invalidId)).toThrow();
  });

  it("handles partial URI decoding gracefully", () => {
    const encoded = "id_pacjenta%3A5";
    const decoded = decodeEntityId("pacjenci", encoded);

    expect(decoded.id_pacjenta).toBe("5");
  });
});
