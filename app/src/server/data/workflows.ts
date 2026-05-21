import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  historie_leczenia,
  lekarze,
  leki,
  pacjenci,
  platnosci,
  pozycje_historii_leczenia,
  pozycje_recept,
  przychodnie,
  recepty,
  skierowania,
  uslugi,
  uslugi_w_wizytach,
  wizyty,
} from "@/lib/db/schema";

export async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [patientsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pacjenci);

  const [visitsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(wizyty)
    .where(andDateRange(today, nextWeek));

  const upcomingVisits = await db
    .select({
      id: wizyty.id_wizyty,
      data: wizyty.data,
      godzina: wizyty.godzina,
      typ: wizyty.typ,
      status: wizyty.status,
      pacjentImie: pacjenci.imie,
      pacjentNazwisko: pacjenci.nazwisko,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
      przychodnia: przychodnie.nazwa,
    })
    .from(wizyty)
    .leftJoin(pacjenci, eq(wizyty.id_pacjenta, pacjenci.id_pacjenta))
    .leftJoin(lekarze, eq(wizyty.id_lekarza, lekarze.id_lekarza))
    .leftJoin(przychodnie, eq(wizyty.id_przychodni, przychodnie.id_przychodni))
    .where(andDateRange(today, nextWeek))
    .orderBy(asc(wizyty.data), asc(wizyty.godzina))
    .limit(8);

  return {
    stats: {
      patients: patientsCount?.count ?? 0,
      visitsWeek: visitsCount?.count ?? 0,
    },
    upcomingVisits,
  };
}

export async function listPatients(search?: string) {
  const clauses = search
    ? or(
        ilike(pacjenci.imie, `%${search}%`),
        ilike(pacjenci.nazwisko, `%${search}%`),
        ilike(pacjenci.telefon, `%${search}%`),
      )
    : undefined;

  const query = db
    .select({
      id: pacjenci.id_pacjenta,
      imie: pacjenci.imie,
      nazwisko: pacjenci.nazwisko,
      telefon: pacjenci.telefon,
      dataUrodz: pacjenci.data_urodz,
      ostatniaWizyta: sql<Date>`max(${wizyty.data})`,
    })
    .from(pacjenci)
    .leftJoin(wizyty, eq(wizyty.id_pacjenta, pacjenci.id_pacjenta));

  if (clauses) {
    query.where(clauses);
  }

  return query
    .groupBy(pacjenci.id_pacjenta)
    .orderBy(asc(pacjenci.nazwisko), asc(pacjenci.imie))
    .limit(60);
}

export async function getPatientProfile(patientId: number) {
  const patient = await db
    .select()
    .from(pacjenci)
    .where(eq(pacjenci.id_pacjenta, patientId))
    .limit(1);

  if (!patient[0]) return null;

  const visits = await db
    .select({
      id: wizyty.id_wizyty,
      data: wizyty.data,
      godzina: wizyty.godzina,
      typ: wizyty.typ,
      status: wizyty.status,
      opis: wizyty.opis,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
      przychodnia: przychodnie.nazwa,
    })
    .from(wizyty)
    .leftJoin(lekarze, eq(wizyty.id_lekarza, lekarze.id_lekarza))
    .leftJoin(przychodnie, eq(wizyty.id_przychodni, przychodnie.id_przychodni))
    .where(eq(wizyty.id_pacjenta, patientId))
    .orderBy(desc(wizyty.data))
    .limit(10);

  const prescriptions = await db
    .select({
      id: recepty.id_recepty,
      data: recepty.data,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
      items: sql<number>`count(${pozycje_recept.Lp})`,
    })
    .from(recepty)
    .leftJoin(lekarze, eq(recepty.id_lekarza, lekarze.id_lekarza))
    .leftJoin(pozycje_recept, eq(recepty.id_recepty, pozycje_recept.id_recepty))
    .where(eq(recepty.id_pacjenta, patientId))
    .groupBy(recepty.id_recepty, lekarze.imie, lekarze.nazwisko)
    .orderBy(desc(recepty.data))
    .limit(10);

  const referrals = await db
    .select({
      numer: skierowania.numer,
      data: skierowania.data_wystaw,
      opis: skierowania.opis,
      usluga: uslugi.nazwa,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
    })
    .from(skierowania)
    .leftJoin(uslugi, eq(skierowania.id_uslugi, uslugi.id_uslugi))
    .leftJoin(lekarze, eq(skierowania.id_lekarza, lekarze.id_lekarza))
    .where(eq(skierowania.id_pacjenta, patientId))
    .orderBy(desc(skierowania.data_wystaw))
    .limit(10);

  const history = await db
    .select({
      id: historie_leczenia.id_historii,
      wizytaId: pozycje_historii_leczenia.id_wizyty,
      data: wizyty.data,
      typ: wizyty.typ,
      status: wizyty.status,
    })
    .from(historie_leczenia)
    .leftJoin(
      pozycje_historii_leczenia,
      eq(historie_leczenia.id_historii, pozycje_historii_leczenia.id_historii),
    )
    .leftJoin(wizyty, eq(pozycje_historii_leczenia.id_wizyty, wizyty.id_wizyty))
    .where(eq(historie_leczenia.id_pacjenta, patientId))
    .orderBy(desc(wizyty.data))
    .limit(10);

  const services = await db
    .select({
      wizytaId: uslugi_w_wizytach.id_wizyty,
      usluga: uslugi.nazwa,
    })
    .from(uslugi_w_wizytach)
    .leftJoin(uslugi, eq(uslugi_w_wizytach.id_uslugi, uslugi.id_uslugi))
    .leftJoin(wizyty, eq(uslugi_w_wizytach.id_wizyty, wizyty.id_wizyty))
    .where(eq(wizyty.id_pacjenta, patientId));

  return {
    patient: patient[0],
    visits,
    prescriptions,
    referrals,
    history,
    services,
  };
}

export async function listUpcomingVisits(rangeDays = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + rangeDays);

  return db
    .select({
      id: wizyty.id_wizyty,
      data: wizyty.data,
      godzina: wizyty.godzina,
      typ: wizyty.typ,
      status: wizyty.status,
      pacjentImie: pacjenci.imie,
      pacjentNazwisko: pacjenci.nazwisko,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
    })
    .from(wizyty)
    .leftJoin(pacjenci, eq(wizyty.id_pacjenta, pacjenci.id_pacjenta))
    .leftJoin(lekarze, eq(wizyty.id_lekarza, lekarze.id_lekarza))
    .where(andDateRange(today, endDate))
    .orderBy(asc(wizyty.data), asc(wizyty.godzina))
    .limit(60);
}

export async function listVisits(search?: string) {
  const clauses = search
    ? or(
        ilike(pacjenci.imie, `%${search}%`),
        ilike(pacjenci.nazwisko, `%${search}%`),
        ilike(lekarze.imie, `%${search}%`),
        ilike(lekarze.nazwisko, `%${search}%`),
        ilike(wizyty.typ, `%${search}%`),
        ilike(wizyty.status, `%${search}%`),
      )
    : undefined;

  const query = db
    .select({
      id: wizyty.id_wizyty,
      data: wizyty.data,
      godzina: wizyty.godzina,
      typ: wizyty.typ,
      status: wizyty.status,
      pacjentId: pacjenci.id_pacjenta,
      pacjentImie: pacjenci.imie,
      pacjentNazwisko: pacjenci.nazwisko,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
      przychodnia: przychodnie.nazwa,
    })
    .from(wizyty)
    .leftJoin(pacjenci, eq(wizyty.id_pacjenta, pacjenci.id_pacjenta))
    .leftJoin(lekarze, eq(wizyty.id_lekarza, lekarze.id_lekarza))
    .leftJoin(przychodnie, eq(wizyty.id_przychodni, przychodnie.id_przychodni));

  if (clauses) {
    query.where(clauses);
  }

  return query.orderBy(desc(wizyty.data), desc(wizyty.godzina)).limit(80);
}

export async function getVisitDetails(visitId: number) {
  const visit = await db
    .select({
      id: wizyty.id_wizyty,
      data: wizyty.data,
      godzina: wizyty.godzina,
      typ: wizyty.typ,
      status: wizyty.status,
      opis: wizyty.opis,
      pacjentId: pacjenci.id_pacjenta,
      pacjentImie: pacjenci.imie,
      pacjentNazwisko: pacjenci.nazwisko,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
      przychodnia: przychodnie.nazwa,
    })
    .from(wizyty)
    .leftJoin(pacjenci, eq(wizyty.id_pacjenta, pacjenci.id_pacjenta))
    .leftJoin(lekarze, eq(wizyty.id_lekarza, lekarze.id_lekarza))
    .leftJoin(przychodnie, eq(wizyty.id_przychodni, przychodnie.id_przychodni))
    .where(eq(wizyty.id_wizyty, visitId))
    .limit(1);

  if (!visit[0]) return null;

  const services = await db
    .select({
      id: uslugi.id_uslugi,
      nazwa: uslugi.nazwa,
      cena: uslugi.cena,
      wymagaSkierow: uslugi.wymaga_skierow,
    })
    .from(uslugi_w_wizytach)
    .leftJoin(uslugi, eq(uslugi_w_wizytach.id_uslugi, uslugi.id_uslugi))
    .where(eq(uslugi_w_wizytach.id_wizyty, visitId));

  const payments = await db
    .select({
      id: platnosci.id_platnosci,
      data: platnosci.data,
      kwota: platnosci.kwota,
      status: platnosci.status,
      metoda: platnosci.metoda,
    })
    .from(platnosci)
    .where(eq(platnosci.id_wizyty, visitId))
    .orderBy(desc(platnosci.data));

  return {
    visit: visit[0],
    services,
    payments,
  };
}

export async function listPrescriptions(search?: string) {
  const clauses = search
    ? or(
        ilike(pacjenci.imie, `%${search}%`),
        ilike(pacjenci.nazwisko, `%${search}%`),
        ilike(lekarze.imie, `%${search}%`),
        ilike(lekarze.nazwisko, `%${search}%`),
      )
    : undefined;

  const query = db
    .select({
      id: recepty.id_recepty,
      data: recepty.data,
      pacjentId: pacjenci.id_pacjenta,
      pacjentImie: pacjenci.imie,
      pacjentNazwisko: pacjenci.nazwisko,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
      items: sql<number>`count(${pozycje_recept.Lp})`,
    })
    .from(recepty)
    .leftJoin(pacjenci, eq(recepty.id_pacjenta, pacjenci.id_pacjenta))
    .leftJoin(lekarze, eq(recepty.id_lekarza, lekarze.id_lekarza))
    .leftJoin(
      pozycje_recept,
      eq(recepty.id_recepty, pozycje_recept.id_recepty),
    );

  if (clauses) {
    query.where(clauses);
  }

  return query
    .groupBy(
      recepty.id_recepty,
      pacjenci.id_pacjenta,
      pacjenci.imie,
      pacjenci.nazwisko,
      lekarze.imie,
      lekarze.nazwisko,
    )
    .orderBy(desc(recepty.data))
    .limit(80);
}

export async function listDoctors(search?: string) {
  const clauses = search
    ? or(
        ilike(lekarze.imie, `%${search}%`),
        ilike(lekarze.nazwisko, `%${search}%`),
        ilike(lekarze.email, `%${search}%`),
      )
    : undefined;

  const query = db
    .select({
      id: lekarze.id_lekarza,
      imie: lekarze.imie,
      nazwisko: lekarze.nazwisko,
      email: lekarze.email,
      telefon: lekarze.telefon,
      visits: sql<number>`count(${wizyty.id_wizyty})`,
      lastVisit: sql<Date>`max(${wizyty.data})`,
    })
    .from(lekarze)
    .leftJoin(wizyty, eq(wizyty.id_lekarza, lekarze.id_lekarza));

  if (clauses) {
    query.where(clauses);
  }

  return query
    .groupBy(lekarze.id_lekarza)
    .orderBy(asc(lekarze.nazwisko), asc(lekarze.imie))
    .limit(60);
}

export async function getDoctorProfile(doctorId: number) {
  const doctor = await db
    .select({
      id: lekarze.id_lekarza,
      imie: lekarze.imie,
      nazwisko: lekarze.nazwisko,
      email: lekarze.email,
      telefon: lekarze.telefon,
    })
    .from(lekarze)
    .where(eq(lekarze.id_lekarza, doctorId))
    .limit(1);

  if (!doctor[0]) return null;

  const visits = await db
    .select({
      id: wizyty.id_wizyty,
      data: wizyty.data,
      godzina: wizyty.godzina,
      typ: wizyty.typ,
      status: wizyty.status,
      pacjentId: pacjenci.id_pacjenta,
      pacjentImie: pacjenci.imie,
      pacjentNazwisko: pacjenci.nazwisko,
      przychodnia: przychodnie.nazwa,
    })
    .from(wizyty)
    .leftJoin(pacjenci, eq(wizyty.id_pacjenta, pacjenci.id_pacjenta))
    .leftJoin(przychodnie, eq(wizyty.id_przychodni, przychodnie.id_przychodni))
    .where(eq(wizyty.id_lekarza, doctorId))
    .orderBy(desc(wizyty.data))
    .limit(12);

  const patients = await db
    .select({
      id: pacjenci.id_pacjenta,
      imie: pacjenci.imie,
      nazwisko: pacjenci.nazwisko,
      lastVisit: sql<Date>`max(${wizyty.data})`,
      visitsCount: sql<number>`count(${wizyty.id_wizyty})`,
    })
    .from(wizyty)
    .leftJoin(pacjenci, eq(wizyty.id_pacjenta, pacjenci.id_pacjenta))
    .where(eq(wizyty.id_lekarza, doctorId))
    .groupBy(pacjenci.id_pacjenta)
    .orderBy(desc(sql<Date>`max(${wizyty.data})`))
    .limit(12);

  return {
    doctor: doctor[0],
    visits,
    patients,
  };
}

export async function getReferralDetails(referralNumber: number) {
  const referral = await db
    .select({
      numer: skierowania.numer,
      data: skierowania.data_wystaw,
      opis: skierowania.opis,
      pacjentId: pacjenci.id_pacjenta,
      pacjentImie: pacjenci.imie,
      pacjentNazwisko: pacjenci.nazwisko,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
      usluga: uslugi.nazwa,
      wymagaSkierow: uslugi.wymaga_skierow,
    })
    .from(skierowania)
    .leftJoin(pacjenci, eq(skierowania.id_pacjenta, pacjenci.id_pacjenta))
    .leftJoin(lekarze, eq(skierowania.id_lekarza, lekarze.id_lekarza))
    .leftJoin(uslugi, eq(skierowania.id_uslugi, uslugi.id_uslugi))
    .where(eq(skierowania.numer, referralNumber))
    .limit(1);

  return referral[0] ?? null;
}

export async function getPrescriptionDetails(prescriptionId: number) {
  const prescription = await db
    .select({
      id: recepty.id_recepty,
      data: recepty.data,
      pacjentId: pacjenci.id_pacjenta,
      pacjentImie: pacjenci.imie,
      pacjentNazwisko: pacjenci.nazwisko,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
    })
    .from(recepty)
    .leftJoin(pacjenci, eq(recepty.id_pacjenta, pacjenci.id_pacjenta))
    .leftJoin(lekarze, eq(recepty.id_lekarza, lekarze.id_lekarza))
    .where(eq(recepty.id_recepty, prescriptionId))
    .limit(1);

  if (!prescription[0]) return null;

  const items = await db
    .select({
      lp: pozycje_recept.Lp,
      ilosc: pozycje_recept.ilosc,
      dawkowanie: pozycje_recept.dawkowanie,
      odplatnosc: pozycje_recept.odplatnosc,
      lekId: pozycje_recept.id_leku,
      lekNazwa: leki.nazwa,
    })
    .from(pozycje_recept)
    .leftJoin(leki, eq(pozycje_recept.id_leku, leki.id_leku))
    .where(eq(pozycje_recept.id_recepty, prescriptionId))
    .orderBy(asc(pozycje_recept.Lp));

  return {
    prescription: prescription[0],
    items,
  };
}

export async function listReferrals(search?: string) {
  const clauses = search
    ? or(
        ilike(pacjenci.imie, `%${search}%`),
        ilike(pacjenci.nazwisko, `%${search}%`),
        ilike(lekarze.imie, `%${search}%`),
        ilike(lekarze.nazwisko, `%${search}%`),
        ilike(uslugi.nazwa, `%${search}%`),
      )
    : undefined;

  const query = db
    .select({
      numer: skierowania.numer,
      data: skierowania.data_wystaw,
      opis: skierowania.opis,
      pacjentId: pacjenci.id_pacjenta,
      pacjentImie: pacjenci.imie,
      pacjentNazwisko: pacjenci.nazwisko,
      lekarzImie: lekarze.imie,
      lekarzNazwisko: lekarze.nazwisko,
      usluga: uslugi.nazwa,
    })
    .from(skierowania)
    .leftJoin(pacjenci, eq(skierowania.id_pacjenta, pacjenci.id_pacjenta))
    .leftJoin(lekarze, eq(skierowania.id_lekarza, lekarze.id_lekarza))
    .leftJoin(uslugi, eq(skierowania.id_uslugi, uslugi.id_uslugi));

  if (clauses) {
    query.where(clauses);
  }

  return query.orderBy(desc(skierowania.data_wystaw)).limit(80);
}

function andDateRange(startDate: Date, endDate: Date) {
  return sql`${wizyty.data} >= ${startDate} AND ${wizyty.data} <= ${endDate}`;
}
