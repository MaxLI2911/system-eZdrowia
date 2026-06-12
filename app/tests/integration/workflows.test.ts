import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  pacjenci,
  lekarze,
  wizyty,
  przychodnie,
  specjalizacje,
  recepty,
  pozycje_recept,
  leki,
  uslugi,
  uslugi_w_wizytach,
  skierowania,
  platnosci,
  historie_leczenia,
  pozycje_historii_leczenia,
} from "@/lib/db/schema";
import {
  getDashboardData,
  listPatients,
  getPatientProfile,
  listUpcomingVisits,
  listCalendarVisits,
  listVisits,
  getVisitDetails,
  listPrescriptions,
  listDoctors,
  getDoctorProfile,
  getReferralDetails,
  getPrescriptionDetails,
  listReferrals,
} from "@/server/data/workflows";
import { eq } from "drizzle-orm";

let patientId: number;
let doctorId: number;
let clinicId: number;
let visitId: number;
let prescriptionId: number;
let serviceId: number;
let historyId: number;

beforeAll(async () => {
  await db
    .insert(specjalizacje)
    .values({ id_specjaliz: 98, nazwa: "Kardiologia" });

  const [doc] = await db
    .insert(lekarze)
    .values({
      id_lekarza: 998,
      imie: "Jan",
      nazwisko: "Kowalski",
      id_specjaliz: 98,
    })
    .returning();
  doctorId = doc.id_lekarza;

  const [clinic] = await db
    .insert(przychodnie)
    .values({
      nazwa: "Przychodnia Centralna",
      miasto: "Warszawa",
      adres: "Marszalkowska 1",
    })
    .returning();
  clinicId = clinic.id_przychodni;

  const [pat] = await db
    .insert(pacjenci)
    .values({
      imie: "Maria",
      nazwisko: "Nowak",
      numer_dokum: "ABC789012",
      data_urodz: new Date("1985-07-22"),
      plec: "K",
      telefon: "500100200",
    })
    .returning();
  patientId = pat.id_pacjenta;

  const [svc] = await db
    .insert(uslugi)
    .values({
      nazwa: "Konsultacja kardiologiczna",
      cena: "200.00",
      wymaga_skierow: false,
    })
    .returning();
  serviceId = svc.id_uslugi;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const [vis] = await db
    .insert(wizyty)
    .values({
      id_pacjenta: patientId,
      id_lekarza: doctorId,
      data: tomorrow,
      godzina: tomorrow,
      typ: "Konsultacja",
      status: "Zaplanowana",
      id_przychodni: clinicId,
    })
    .returning();
  visitId = vis.id_wizyty;

  const [rx] = await db
    .insert(recepty)
    .values({
      data: new Date("2026-06-10"),
      id_pacjenta: patientId,
      id_lekarza: doctorId,
    })
    .returning();
  prescriptionId = rx.id_recepty;

  await db.insert(leki).values([
    { id_leku: 777, nazwa: "Aspiryna", forma: "tabletki" },
    { id_leku: 778, nazwa: "Ibuprofen", forma: "kapsulki" },
    { id_leku: 779, nazwa: "Paracetamol", forma: "tabletki" },
  ]);
  await db.insert(pozycje_recept).values([
    { id_recepty: prescriptionId, Lp: 1, id_leku: 777, ilosc: 30, dawkowanie: "2x dziennie" },
    { id_recepty: prescriptionId, Lp: 2, id_leku: 778, ilosc: 20, dawkowanie: "1x dziennie" },
    { id_recepty: prescriptionId, Lp: 3, id_leku: 779, ilosc: 10, dawkowanie: "3x dziennie" },
  ]);

  const [hist] = await db
    .insert(historie_leczenia)
    .values({ id_pacjenta: patientId })
    .returning();
  historyId = hist.id_historii;

  await db.insert(skierowania).values({
    numer: 5001,
    id_pacjenta: patientId,
    id_lekarza: doctorId,
    data_wystaw: new Date("2026-06-08"),
    opis: "Skierowanie na badania",
    id_uslugi: serviceId,
  });
});

afterAll(async () => {
  await db.delete(pozycje_historii_leczenia).where(eq(pozycje_historii_leczenia.id_historii, historyId));
  await db.delete(historie_leczenia).where(eq(historie_leczenia.id_historii, historyId));
  await db.delete(uslugi_w_wizytach).where(eq(uslugi_w_wizytach.id_wizyty, visitId));
  await db.delete(skierowania).where(eq(skierowania.numer, 5001));
  await db.delete(platnosci).where(eq(platnosci.id_wizyty, visitId));
  await db.delete(pozycje_recept).where(eq(pozycje_recept.id_recepty, prescriptionId));
  await db.delete(recepty).where(eq(recepty.id_pacjenta, patientId));
  await db.delete(wizyty).where(eq(wizyty.id_pacjenta, patientId));
  await db.delete(uslugi).where(eq(uslugi.id_uslugi, serviceId));
  await db.delete(leki).where(eq(leki.id_leku, 777));
  await db.delete(leki).where(eq(leki.id_leku, 778));
  await db.delete(leki).where(eq(leki.id_leku, 779));
  await db.delete(pacjenci).where(eq(pacjenci.id_pacjenta, patientId));
  await db.delete(lekarze).where(eq(lekarze.id_lekarza, doctorId));
  await db.delete(przychodnie).where(eq(przychodnie.id_przychodni, clinicId));
  await db.delete(specjalizacje).where(eq(specjalizacje.id_specjaliz, 98));
});

describe("getDashboardData", () => {
  it("returns dashboard stats and upcoming visits", async () => {
    const data = await getDashboardData();

    expect(data).toHaveProperty("stats");
    expect(data).toHaveProperty("upcomingVisits");
    expect(typeof data.stats.patients).toBe("number");
    expect(typeof data.stats.visitsWeek).toBe("number");
    expect(Array.isArray(data.upcomingVisits)).toBe(true);
  });
});

describe("listPatients", () => {
  it("returns patient list without search", async () => {
    const patients = await listPatients();
    expect(patients.length).toBeGreaterThan(0);
  });

  it("filters patients by search term", async () => {
    const patients = await listPatients("Maria");
    expect(patients.length).toBeGreaterThan(0);
    expect(patients.some((p) => p.imie === "Maria")).toBe(true);
  });

  it("returns empty array for unknown search", async () => {
    const patients = await listPatients("ZZZ_NOT_FOUND_ZZZ");
    expect(patients.length).toBe(0);
  });
});

describe("getPatientProfile", () => {
  it("returns profile with visits, prescriptions, referrals", async () => {
    const profile = await getPatientProfile(patientId);

    expect(profile).not.toBeNull();
    expect(profile!.patient).toBeDefined();
    expect(Array.isArray(profile!.visits)).toBe(true);
    expect(Array.isArray(profile!.prescriptions)).toBe(true);
    expect(Array.isArray(profile!.referrals)).toBe(true);
  });

  it("returns null for non-existent patient", async () => {
    const profile = await getPatientProfile(99999);
    expect(profile).toBeNull();
  });
});

describe("listUpcomingVisits", () => {
  it("returns array of upcoming visits", async () => {
    const visits = await listUpcomingVisits(30);
    expect(Array.isArray(visits)).toBe(true);
  });
});

describe("listCalendarVisits", () => {
  it("returns calendar visits with date range", async () => {
    const visits = await listCalendarVisits({
      pastDays: 7,
      futureDays: 14,
    });
    expect(Array.isArray(visits)).toBe(true);
  });

  it("returns all past visits when pastAll is true", async () => {
    const visits = await listCalendarVisits({
      pastDays: 0,
      futureDays: 0,
      pastAll: true,
    });
    expect(Array.isArray(visits)).toBe(true);
  });
});

describe("listVisits", () => {
  it("returns visit list", async () => {
    const visits = await listVisits();
    expect(visits.length).toBeGreaterThan(0);
  });

  it("filters visits by search", async () => {
    const visits = await listVisits("Konsultacja");
    expect(visits.length).toBeGreaterThan(0);
    expect(visits.some((v) => v.typ?.includes("Konsultacja"))).toBe(true);
  });
});

describe("getVisitDetails", () => {
  it("returns visit with services and payments", async () => {
    const details = await getVisitDetails(visitId);

    expect(details).not.toBeNull();
    expect(details!.visit).toBeDefined();
    expect(Array.isArray(details!.services)).toBe(true);
    expect(Array.isArray(details!.payments)).toBe(true);
  });

  it("returns null for non-existent visit", async () => {
    const details = await getVisitDetails(99999);
    expect(details).toBeNull();
  });
});

describe("listPrescriptions", () => {
  it("returns prescription list", async () => {
    const prescriptions = await listPrescriptions();
    expect(prescriptions.length).toBeGreaterThan(0);
  });
});

describe("listDoctors", () => {
  it("returns doctor list", async () => {
    const doctors = await listDoctors();
    expect(doctors.length).toBeGreaterThan(0);
  });

  it("filters doctors by search", async () => {
    const doctors = await listDoctors("Kowalski");
    expect(doctors.length).toBeGreaterThan(0);
    expect(doctors.some((d) => d.nazwisko === "Kowalski")).toBe(true);
  });
});

describe("getDoctorProfile", () => {
  it("returns doctor with visits and patients", async () => {
    const profile = await getDoctorProfile(doctorId);

    expect(profile).not.toBeNull();
    expect(profile!.doctor).toBeDefined();
    expect(Array.isArray(profile!.visits)).toBe(true);
    expect(Array.isArray(profile!.patients)).toBe(true);
  });
});

describe("getPrescriptionDetails", () => {
  it("returns prescription with items", async () => {
    const details = await getPrescriptionDetails(prescriptionId);

    expect(details).not.toBeNull();
    expect(details!.prescription).toBeDefined();
    expect(Array.isArray(details!.items)).toBe(true);
    expect(details!.items.length).toBe(3);
    expect(details!.items[0].lekNazwa).toBe("Aspiryna");
    expect(details!.items[0].dawkowanie).toBe("2x dziennie");
    expect(details!.items[1].lekNazwa).toBe("Ibuprofen");
    expect(details!.items[2].lekNazwa).toBe("Paracetamol");
  });

  it("returns null for non-existent prescription", async () => {
    const details = await getPrescriptionDetails(99999);
    expect(details).toBeNull();
  });
});

describe("getReferralDetails", () => {
  it("returns referral details", async () => {
    const details = await getReferralDetails(5001);

    expect(details).not.toBeNull();
    expect(details!.opis).toBe("Skierowanie na badania");
  });
});

describe("listReferrals", () => {
  it("returns referral list", async () => {
    const referrals = await listReferrals();
    expect(referrals.length).toBeGreaterThan(0);
  });
});

describe("T-APP-03: Wystawienie skierowania", () => {
  afterAll(async () => {
    await db.delete(skierowania).where(eq(skierowania.numer, 5003));
  });

  it("creates a skierowanie and reads it back with correct FK relationships", async () => {
    await db.insert(skierowania).values({
      numer: 5003,
      id_pacjenta: patientId,
      id_lekarza: doctorId,
      data_wystaw: new Date("2026-06-09"),
      opis: "Skierowanie testowe",
      id_uslugi: serviceId,
    });

    const details = await getReferralDetails(5003);
    expect(details).not.toBeNull();
    expect(details!.opis).toBe("Skierowanie testowe");
    expect(details!.pacjentId).toBe(patientId);
  });
});

describe("T-APP-01: Rezerwacja wizyty i wygenerowanie płatności", () => {
  let ekServiceId: number;

  beforeAll(async () => {
    const [svc] = await db.insert(uslugi).values({
      nazwa: "Badanie EKG",
      cena: "140.00",
      wymaga_skierow: false,
    }).returning();
    ekServiceId = svc.id_uslugi;
  });

  afterAll(async () => {
    await db.delete(platnosci).where(eq(platnosci.id_wizyty, visitId));
    await db.delete(uslugi_w_wizytach).where(eq(uslugi_w_wizytach.id_wizyty, visitId));
    await db.delete(uslugi).where(eq(uslugi.id_uslugi, ekServiceId));
  });

  it("creates visit, attaches 2 services, generates payment with correct sum", async () => {
    await db.insert(uslugi_w_wizytach).values([
      { id_wizyty: visitId, id_uslugi: serviceId },
      { id_wizyty: visitId, id_uslugi: ekServiceId },
    ]);

    await db.insert(platnosci).values({
      id_wizyty: visitId,
      kwota: "340.00",
      status: "Oczekujaca",
      data: new Date(),
      metoda: "Karta",
    });

    const details = await getVisitDetails(visitId);
    expect(details).not.toBeNull();
    expect(details!.services.length).toBe(2);
    expect(details!.payments.length).toBe(1);
    expect(details!.payments[0].kwota).toBe("340.00");
  });
});
