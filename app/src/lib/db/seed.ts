import "dotenv/config";
import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { db } from ".";
import * as schema from "./schema";

type VisitSeed = {
  id_pacjenta: number;
  id_lekarza: number;
  data: Date;
  godzina: Date;
  typ: string;
  status: string;
  id_przychodni?: number | null;
  opis?: string | null;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function makeDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
) {
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`,
  );
}

function pickRandom<T>(items: T[]) {
  return faker.helpers.arrayElement(items);
}

async function main() {
  faker.seed(42);
  await resetData();

  await db.insert(schema.specjalizacje).values([
    { id_specjaliz: 1, nazwa: "Kardiologia" },
    { id_specjaliz: 2, nazwa: "Neurologia" },
    { id_specjaliz: 3, nazwa: "Pediatria" },
    { id_specjaliz: 4, nazwa: "Ortopedia" },
    { id_specjaliz: 5, nazwa: "Dermatologia" },
  ]);

  const przychodnieSeed = Array.from({ length: 8 }).map(() => ({
    nazwa: `${faker.company.name()} Medical`,
    miasto: faker.location.city(),
    adres: faker.location.streetAddress(),
  }));

  const przychodnie = await db
    .insert(schema.przychodnie)
    .values(przychodnieSeed)
    .returning();

  const servicesData = [
    {
      nazwa: "Konsultacja kardiologiczna",
      cena: "320.00",
      wymaga_skierow: true,
    },
    { nazwa: "USG jamy brzusznej", cena: "220.00", wymaga_skierow: false },
    { nazwa: "Szczepienie ochronne", cena: "160.00", wymaga_skierow: false },
    { nazwa: "Rehabilitacja", cena: "280.00", wymaga_skierow: true },
    {
      nazwa: "Konsultacja dermatologiczna",
      cena: "240.00",
      wymaga_skierow: false,
    },
    { nazwa: "Teleporada", cena: "120.00", wymaga_skierow: false },
    { nazwa: "RTG klatki", cena: "180.00", wymaga_skierow: false },
    { nazwa: "Badanie EKG", cena: "140.00", wymaga_skierow: false },
    {
      nazwa: "Konsultacja neurologiczna",
      cena: "300.00",
      wymaga_skierow: true,
    },
  ];

  const uslugi = await db
    .insert(schema.uslugi)
    .values(servicesData)
    .returning();

  const lekiSeed = [
    { id_leku: 2001, nazwa: "Cardiolin", forma: "tabletki" },
    { id_leku: 2002, nazwa: "Neurocalm", forma: "kapsulki" },
    { id_leku: 2003, nazwa: "Pediatus", forma: "syrop" },
    { id_leku: 2004, nazwa: "Dermasol", forma: "masc" },
    { id_leku: 2005, nazwa: "OrthoFlex", forma: "tabletki" },
    { id_leku: 2006, nazwa: "VitaPlus", forma: "kapsulki" },
    { id_leku: 2007, nazwa: "Respiron", forma: "syrop" },
    { id_leku: 2008, nazwa: "CardioSafe", forma: "tabletki" },
    { id_leku: 2009, nazwa: "Dermacare", forma: "masc" },
  ];

  await db.insert(schema.leki).values(lekiSeed);

  await db.insert(schema.lekarze).values(
    Array.from({ length: 10 }).map((_, index) => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        id_lekarza: 101 + index,
        imie: firstName,
        nazwisko: lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        telefon: `5${faker.number.int({ min: 10000000, max: 99999999 })}`,
        id_specjaliz: 1 + (index % 5),
      };
    }),
  );

  const pacjenci = await db
    .insert(schema.pacjenci)
    .values(
      Array.from({ length: 40 }).map((_, index) => ({
        imie: faker.person.firstName(),
        nazwisko: faker.person.lastName(),
        numer_dokum: `AB${100000 + index}`,
        data_urodz: faker.date.between({
          from: new Date("1960-01-01"),
          to: new Date("2005-12-31"),
        }),
        plec: index % 2 === 0 ? "K" : "M",
        email: faker.internet.email().toLowerCase(),
        telefon: `6${faker.number.int({ min: 10000000, max: 99999999 })}`,
      })),
    )
    .returning();

  const visitTypes = [
    "Kontrola",
    "Konsultacja",
    "Szczepienie",
    "Rehabilitacja",
    "Teleporada",
    "Diagnostyka",
  ];
  const statusOptions = ["Zaplanowana", "W trakcie", "Zakonczona", "Anulowana"];

  const visitsSeed: VisitSeed[] = Array.from({ length: 80 }).map((_, index) => {
    const patient = pickRandom(pacjenci);
    const doctorId = 101 + (index % 10);
    const typ = pickRandom(visitTypes);
    const status = pickRandom(statusOptions);
    const clinic = pickRandom(przychodnie);
    const visitDate = faker.date.between({
      from: new Date("2025-01-01"),
      to: new Date("2025-06-30"),
    });
    const data = new Date(visitDate);
    data.setHours(0, 0, 0, 0);
    const godzina = new Date(visitDate);
    godzina.setHours(
      faker.number.int({ min: 8, max: 17 }),
      pickRandom([0, 15, 30, 45]),
      0,
      0,
    );

    return {
      id_pacjenta: patient.id_pacjenta,
      id_lekarza: doctorId,
      data,
      godzina,
      typ,
      status,
      id_przychodni: typ === "Teleporada" ? null : clinic.id_przychodni,
      opis: index % 4 === 0 ? faker.lorem.sentence({ min: 3, max: 6 }) : null,
    };
  });

  // the seed data uses dates in the past, disable the trigger that would otherwise reject the data
  await db.execute(
    sql`ALTER TABLE wizyty DISABLE TRIGGER trg_check_future_visit_date`,
  );
  const wizyty = await db.insert(schema.wizyty).values(visitsSeed).returning();
  await db.execute(
    sql`ALTER TABLE wizyty ENABLE TRIGGER trg_check_future_visit_date`,
  );

  const uslugiWizyty: { id_wizyty: number; id_uslugi: number }[] = [];
  const teleporady: {
    id_telepor: number;
    id_wizyty: number;
    link: string;
    godzina_rozpocz: Date;
    czas_trwania: number;
  }[] = [];
  const platnosci: {
    id_wizyty: number;
    kwota: string;
    status: string;
    data: Date;
    metoda: string;
  }[] = [];

  let teleId = 7000;
  const paymentStatuses = ["Zaplacona", "Oczekujaca", "Nieoplacona"];
  const paymentMethods = ["Karta", "Gotowka", "Przelew", "Blik"];

  wizyty.forEach((visit, index) => {
    const serviceCount = 1 + (index % 2);
    const used = new Set<number>();
    for (let i = 0; i < serviceCount; i += 1) {
      const service = pickRandom(uslugi);
      if (used.has(service.id_uslugi)) continue;
      used.add(service.id_uslugi);
      uslugiWizyty.push({
        id_wizyty: visit.id_wizyty,
        id_uslugi: service.id_uslugi,
      });
    }

    if (visit.typ === "Teleporada") {
      teleId += 1;
      teleporady.push({
        id_telepor: teleId,
        id_wizyty: visit.id_wizyty,
        link: `https://meet.example.com/teleporada-${teleId}`,
        godzina_rozpocz: visit.godzina,
        czas_trwania: 15 + (index % 3) * 10,
      });
    }

    if (visit.status === "Zakonczona") {
      const sum = Array.from(used).reduce((acc, serviceId) => {
        const found = uslugi.find((item) => item.id_uslugi === serviceId);
        const value = Number(found?.cena ?? 0);
        return acc + (Number.isNaN(value) ? 0 : value);
      }, 0);

      platnosci.push({
        id_wizyty: visit.id_wizyty,
        kwota: sum.toFixed(2),
        status: pickRandom(paymentStatuses),
        data: visit.data,
        metoda: pickRandom(paymentMethods),
      });
    }
  });

  if (uslugiWizyty.length > 0) {
    await db.insert(schema.uslugi_w_wizytach).values(uslugiWizyty);
  }

  if (platnosci.length > 0) {
    for (const p of platnosci) {
      await db.insert(schema.platnosci).values(p);
    }
  }

  if (teleporady.length > 0) {
    await db.insert(schema.teleporady).values(teleporady);
  }

  const receptySeed = Array.from({ length: 35 }).map((_, index) => ({
    data: faker.date.between({
      from: new Date("2025-01-01"),
      to: new Date("2025-06-30"),
    }),
    id_pacjenta: pickRandom(pacjenci).id_pacjenta,
    id_lekarza: 101 + (index % 10),
  }));

  const recepty = await db
    .insert(schema.recepty)
    .values(receptySeed)
    .returning();

  const dawkowanieList = [
    "1 tabletka dziennie",
    "2 razy dziennie",
    "1 kapsulka wieczorem",
    "Rano i wieczorem",
  ];
  const odplatnoscList = ["30%", "50%", "100%", "bezplatnie"];

  const pozycjeRecept: {
    id_recepty: number;
    Lp: number;
    id_leku: number;
    ilosc: number;
    dawkowanie: string;
    odplatnosc: string;
  }[] = [];

  recepty.forEach((recepta) => {
    const itemsCount = 1 + (recepta.id_recepty % 3);
    for (let i = 0; i < itemsCount; i += 1) {
      const lek = pickRandom(lekiSeed);
      pozycjeRecept.push({
        id_recepty: recepta.id_recepty,
        Lp: i + 1,
        id_leku: lek.id_leku,
        ilosc: 1 + (i % 3),
        dawkowanie: pickRandom(dawkowanieList),
        odplatnosc: pickRandom(odplatnoscList),
      });
    }
  });

  await db.insert(schema.pozycje_recept).values(pozycjeRecept);

  const historie = await db
    .insert(schema.historie_leczenia)
    .values(
      pacjenci
        .slice(0, 12)
        .map((patient) => ({ id_pacjenta: patient.id_pacjenta })),
    )
    .returning();

  const pozycjeHistorii: {
    id_historii: number;
    Lp: number;
    id_wizyty: number;
  }[] = [];

  historie.forEach((history, index) => {
    const itemsCount = 1 + (index % 3);
    for (let i = 0; i < itemsCount; i += 1) {
      const visit = pickRandom(wizyty);
      pozycjeHistorii.push({
        id_historii: history.id_historii,
        Lp: i + 1,
        id_wizyty: visit.id_wizyty,
      });
    }
  });

  await db.insert(schema.pozycje_historii_leczenia).values(pozycjeHistorii);

  const referralServices = uslugi.filter((item) => item.wymaga_skierow);
  const skierowaniaSeed = Array.from({ length: 30 }).map((_, index) => {
    const service =
      referralServices.length > 0
        ? pickRandom(referralServices)
        : pickRandom(uslugi);
    return {
      numer: 7000 + index + 1,
      id_pacjenta: pickRandom(pacjenci).id_pacjenta,
      id_lekarza: 101 + (index % 10),
      data_wystaw: faker.date.between({
        from: new Date("2025-01-01"),
        to: new Date("2025-06-30"),
      }),
      opis: faker.lorem.sentence({ min: 4, max: 8 }),
      id_uslugi: service.id_uslugi,
    };
  });

  await db.insert(schema.skierowania).values(skierowaniaSeed);

  console.log("Seed complete");
}

async function resetData() {
  await db.delete(schema.uslugi_w_wizytach);
  await db.delete(schema.pozycje_recept);
  await db.delete(schema.pozycje_historii_leczenia);
  await db.delete(schema.platnosci);
  await db.delete(schema.teleporady);
  await db.delete(schema.recepty);
  await db.delete(schema.skierowania);
  await db.delete(schema.wizyty);
  await db.delete(schema.historie_leczenia);
  await db.delete(schema.leki);
  await db.delete(schema.uslugi);
  await db.delete(schema.lekarze);
  await db.delete(schema.pacjenci);
  await db.delete(schema.przychodnie);
  await db.delete(schema.specjalizacje);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
