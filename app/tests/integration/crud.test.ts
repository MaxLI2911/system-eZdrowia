import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  pacjenci,
  lekarze,
  wizyty,
  przychodnie,
  specjalizacje,
  leki,
  recepty,
  pozycje_recept,
} from "@/lib/db/schema";
import {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  encodeEntityId,
  listOptions,
} from "@/server/data/crud";
import { eq } from "drizzle-orm";

let testPatientId: number;
let testDoctorId: number;
let testClinicId: number;

beforeAll(async () => {
  await db.insert(specjalizacje).values({
    id_specjaliz: 99,
    nazwa: "Specjalizacja Testowa",
  });

  const [doctor] = await db
    .insert(lekarze)
    .values({
      id_lekarza: 999,
      imie: "Testowy",
      nazwisko: "Lekarz",
      id_specjaliz: 99,
    })
    .returning();
  testDoctorId = doctor.id_lekarza;

  const [clinic] = await db
    .insert(przychodnie)
    .values({
      nazwa: "Testowa Przychodnia",
      miasto: "Testowo",
      adres: "Testowa 1",
    })
    .returning();
  testClinicId = clinic.id_przychodni;

  const [patient] = await db
    .insert(pacjenci)
    .values({
      imie: "Anna",
      nazwisko: "Testowa",
      numer_dokum: "TST123456",
      data_urodz: new Date("1990-05-10"),
      plec: "K",
    })
    .returning();
  testPatientId = patient.id_pacjenta;
});

afterAll(async () => {
  await db.delete(recepty).where(eq(recepty.id_pacjenta, testPatientId));
  await db.delete(wizyty).where(eq(wizyty.id_pacjenta, testPatientId));
  await db.delete(pacjenci).where(eq(pacjenci.id_pacjenta, testPatientId));
  await db.delete(lekarze).where(eq(lekarze.id_lekarza, testDoctorId));
  await db.delete(leki).where(eq(leki.id_leku, 888));
  await db.delete(przychodnie).where(eq(przychodnie.id_przychodni, testClinicId));
  await db.delete(specjalizacje).where(eq(specjalizacje.id_specjaliz, 99));
});

describe("listRecords", () => {
  it("returns paginated results for pacjenci", async () => {
    const result = await listRecords("pacjenci", {
      page: 1,
      pageSize: 10,
    });

    expect(result.data.length).toBeGreaterThan(0);
    expect(Number(result.total)).toBeGreaterThanOrEqual(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it("supports search parameter", async () => {
    const result = await listRecords("pacjenci", {
      page: 1,
      pageSize: 10,
      search: "Anna",
    });

    expect(result.data.length).toBeGreaterThan(0);
    expect(Number(result.total)).toBeGreaterThanOrEqual(1);
  });

  it("respects pageSize", async () => {
    const result = await listRecords("pacjenci", {
      page: 1,
      pageSize: 2,
    });

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.length).toBeLessThanOrEqual(2);
  });

  it("encodes entity id into each row", async () => {
    const result = await listRecords("pacjenci", {
      page: 1,
      pageSize: 10,
    });

    for (const row of result.data) {
      expect(row.__id).toBeDefined();
      expect(typeof row.__id).toBe("string");
    }
  });
});

describe("getRecord", () => {
  it("returns a record by encoded id", async () => {
    const encodedId = encodeEntityId("pacjenci", {
      id_pacjenta: testPatientId,
    });
    const result = await getRecord("pacjenci", encodedId);

    expect(result).not.toBeNull();
    expect((result as Record<string, unknown>).imie).toBe("Anna");
  });

  it("returns null for non-existent record", async () => {
    const encodedId = encodeEntityId("pacjenci", {
      id_pacjenta: 99999,
    });
    const result = await getRecord("pacjenci", encodedId);

    expect(result).toBeNull();
  });
});

describe("createRecord", () => {
  it("creates a new record and returns it", async () => {
    let createdId: number | undefined;
    try {
      const result = await createRecord("pacjenci", {
        imie: "Nowy",
        nazwisko: "Pacjent",
        numer_dokum: "DOC999",
        data_urodz: new Date("2000-01-01"),
        plec: "M",
      });

      expect(result).not.toBeNull();
      const r = result as Record<string, unknown>;
      expect(r.imie).toBe("Nowy");
      createdId = r.id_pacjenta as number;
    } finally {
      if (createdId) {
        await db
          .delete(pacjenci)
          .where(eq(pacjenci.id_pacjenta, createdId));
      }
    }
  });

  it("fills missing fields with defaults via stored procedure", async () => {
    let createdId: number | undefined;
    try {
      const result = await createRecord("pacjenci", { imie: "Bez" });

      expect(result).not.toBeNull();
      const r = result as Record<string, unknown>;
      expect(r.imie).toBe("Bez");
      createdId = r.id_pacjenta as number;
    } finally {
      if (createdId) {
        await db
          .delete(pacjenci)
          .where(eq(pacjenci.id_pacjenta, createdId));
      }
    }
  });
});

describe("updateRecord", () => {
  it("updates an existing record", async () => {
    const encodedId = encodeEntityId("pacjenci", {
      id_pacjenta: testPatientId,
    });

    const updated = await updateRecord("pacjenci", encodedId, {
      telefon: "123456789",
    });

    expect(updated).not.toBeNull();
    expect((updated as Record<string, unknown>).telefon).toBe("123456789");
  });

  it("returns null for non-existent record", async () => {
    const encodedId = encodeEntityId("pacjenci", {
      id_pacjenta: 99999,
    });

    const updated = await updateRecord("pacjenci", encodedId, {
      telefon: "000000000",
    });

    expect(updated).toBeNull();
  });
});

describe("deleteRecord", () => {
  it("deletes a record and returns it", async () => {
    const [temp] = await db
      .insert(pacjenci)
      .values({
        imie: "DoUsuniecia",
        nazwisko: "Test",
        numer_dokum: "DEL001",
        data_urodz: new Date("1980-01-01"),
        plec: "M",
      })
      .returning();

    const encodedId = encodeEntityId("pacjenci", {
      id_pacjenta: temp.id_pacjenta,
    });

    const deleted = await deleteRecord("pacjenci", encodedId);
    expect(deleted).not.toBeNull();
    expect((deleted as Record<string, unknown>).id_pacjenta).toBe(
      temp.id_pacjenta,
    );
  });
});

describe("listOptions", () => {
  it("returns labeled options for select dropdowns", async () => {
    const options = await listOptions("pacjenci");

    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);

    const first = options[0];
    expect(first.value).toBeDefined();
    expect(first.label).toBeDefined();
    expect(first.raw).toBeDefined();
  });
});

describe("CRUD on composite key entity (pozycje_recept)", () => {
  let prescriptionId: number;

  beforeAll(async () => {
    await db
      .insert(leki)
      .values({ id_leku: 888, nazwa: "Testowy Lek", forma: "tabletki" })
      .onConflictDoNothing();

    const [rx] = await db
      .insert(recepty)
      .values({
        data: new Date("2026-06-01"),
        id_pacjenta: testPatientId,
        id_lekarza: testDoctorId,
      })
      .returning();
    prescriptionId = rx.id_recepty;
  });

  afterAll(async () => {
    await db.delete(pozycje_recept).where(eq(pozycje_recept.id_recepty, prescriptionId));
    await db.delete(recepty).where(eq(recepty.id_recepty, prescriptionId));
  });

  it("creates a composite key record via direct insert", async () => {
    const result = await db.insert(pozycje_recept).values({
      id_recepty: prescriptionId,
      Lp: 1,
      id_leku: 888,
      ilosc: 2,
      dawkowanie: "1x dziennie",
      odplatnosc: "100%",
    });

    expect(result.rowCount).toBe(1);

    const rows = await db
      .select()
      .from(pozycje_recept)
      .where(eq(pozycje_recept.id_recepty, prescriptionId));

    expect(rows.length).toBe(1);
    expect(rows[0].Lp).toBe(1);
  });

  it("reads composite key record via direct query", async () => {
    const rows = await db
      .select()
      .from(pozycje_recept)
      .where(eq(pozycje_recept.id_recepty, prescriptionId));

    expect(rows.length).toBe(1);
    expect(rows[0].Lp).toBe(1);
    expect(rows[0].id_leku).toBe(888);
  });
});
