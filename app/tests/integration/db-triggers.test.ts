import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  wizyty,
  lekarze,
  pacjenci,
  przychodnie,
  specjalizacje,
  leki,
  platnosci,
  recepty,
  pozycje_recept,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

let doctorId: number;
let patientId: number;
let clinicId: number;
let paymentVisitId: number;

beforeAll(async () => {
  await db
    .insert(specjalizacje)
    .values({ id_specjaliz: 97, nazwa: "Chirurgia" });

  const [doc] = await db
    .insert(lekarze)
    .values({
      id_lekarza: 997,
      imie: "Adam",
      nazwisko: "Chirurg",
      id_specjaliz: 97,
    })
    .returning();
  doctorId = doc.id_lekarza;

  const [clinic] = await db
    .insert(przychodnie)
    .values({
      nazwa: "Klinika Chirurgii",
      miasto: "Krakow",
      adres: "Chirurgiczna 5",
    })
    .returning();
  clinicId = clinic.id_przychodni;

  const [pat] = await db
    .insert(pacjenci)
    .values({
      imie: "Piotr",
      nazwisko: "Chory",
      numer_dokum: "CHR001",
      data_urodz: new Date("1975-03-12"),
      plec: "M",
    })
    .returning();
  patientId = pat.id_pacjenta;

  await db.insert(leki).values([
    { id_leku: 666, nazwa: "Ibuprofen", forma: "kapsulki" },
  ]);
  await db.execute(sql`SET session_replication_role = 'origin';`);
});

afterAll(async () => {
  if (paymentVisitId) {
    await db.delete(platnosci).where(eq(platnosci.id_wizyty, paymentVisitId));
  }
  await db.delete(wizyty).where(eq(wizyty.id_lekarza, doctorId));
  await db.delete(leki).where(eq(leki.id_leku, 666));
  await db.delete(lekarze).where(eq(lekarze.id_lekarza, doctorId));
  await db.delete(pacjenci).where(eq(pacjenci.id_pacjenta, patientId));
  await db.delete(przychodnie).where(eq(przychodnie.id_przychodni, clinicId));
  await db.delete(specjalizacje).where(eq(specjalizacje.id_specjaliz, 97));
});

describe("T-DB-01: Blokada podwojnej rezerwacji lekarza (double booking)", () => {
  let firstVisitId: number;

  beforeAll(async () => {
    const visitDate = new Date("2026-10-10");
    const visitTime = new Date("2026-10-10T12:00:00");

    const [vis] = await db
      .insert(wizyty)
      .values({
        id_pacjenta: patientId,
        id_lekarza: doctorId,
        data: visitDate,
        godzina: visitTime,
        typ: "Kontrolna",
        status: "Zaplanowana",
        id_przychodni: clinicId,
      })
      .returning();
    firstVisitId = vis.id_wizyty;
  });

  afterAll(async () => {
    if (firstVisitId) {
      await db.delete(wizyty).where(eq(wizyty.id_wizyty, firstVisitId));
    }
  });

  it("prevents double-booking the same doctor at the same time", async () => {
    const visitDate = new Date("2026-10-10");
    const visitTime = new Date("2026-10-10T12:00:00");

    await expect(
      db.insert(wizyty).values({
        id_pacjenta: patientId,
        id_lekarza: doctorId,
        data: visitDate,
        godzina: visitTime,
        typ: "Konsultacja",
        status: "Zaplanowana",
        id_przychodni: clinicId,
      }),
    ).rejects.toThrow();
  });
});

describe("Payment deletion trigger", () => {
  beforeAll(async () => {
    const [vis] = await db
      .insert(wizyty)
      .values({
        id_pacjenta: patientId,
        id_lekarza: doctorId,
        data: new Date("2026-11-15"),
        godzina: new Date("2026-11-15T14:00:00"),
        typ: "Kontrolna",
        status: "Zaplanowana",
        id_przychodni: clinicId,
      })
      .returning();
    paymentVisitId = vis.id_wizyty;
  });

  afterAll(async () => {
    if (paymentVisitId) {
      await db
        .delete(wizyty)
        .where(eq(wizyty.id_wizyty, paymentVisitId));
    }
  });

  it("prevents deleting a paid payment", async () => {
    const [payment] = await db
      .insert(platnosci)
      .values({
        id_wizyty: paymentVisitId,
        kwota: "100.00",
        status: "Zaplacona",
        data: new Date("2026-11-15"),
        metoda: "Karta",
      })
      .returning();

    await expect(
      db.delete(platnosci).where(
        eq(platnosci.id_platnosci, payment.id_platnosci),
      ),
    ).rejects.toThrow();

    await db
      .update(platnosci)
      .set({ status: "Niezaplacona" })
      .where(eq(platnosci.id_platnosci, payment.id_platnosci));

    await db
      .delete(platnosci)
      .where(eq(platnosci.id_platnosci, payment.id_platnosci));
  });
});

describe("T-DB-02: Spójność transakcji recepty i pozycji", () => {
  let testRxId: number;

  afterAll(async () => {
    if (testRxId) {
      await db.delete(pozycje_recept).where(eq(pozycje_recept.id_recepty, testRxId));
      await db.delete(recepty).where(eq(recepty.id_recepty, testRxId));
    }
  });

  it("rolls back entire transaction when one insert violates NOT NULL", async () => {
    const [rx] = await db.insert(recepty).values({
      data: new Date("2026-06-01"),
      id_pacjenta: patientId,
      id_lekarza: doctorId,
    }).returning();
    testRxId = rx.id_recepty;

    let errorCaught = false;
    try {
      await db.transaction(async (tx) => {
        await tx.insert(pozycje_recept).values({
          id_recepty: testRxId,
          Lp: 1,
          id_leku: 666,
          ilosc: 10,
          dawkowanie: "1x dziennie",
        });
        await tx.insert(pozycje_recept).values({
          id_recepty: testRxId,
          Lp: 2,
          id_leku: 666,
          ilosc: null as unknown as number,
          dawkowanie: "2x dziennie",
        });
      });
    } catch {
      errorCaught = true;
    }

    expect(errorCaught).toBe(true);

    const items = await db
      .select()
      .from(pozycje_recept)
      .where(eq(pozycje_recept.id_recepty, testRxId));
    expect(items.length).toBe(0);
  });
});


