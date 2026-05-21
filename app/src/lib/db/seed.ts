import "dotenv/config";
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

const firstNames = [
  "Anna",
  "Jan",
  "Maria",
  "Piotr",
  "Agnieszka",
  "Krzysztof",
  "Katarzyna",
  "Tomasz",
  "Magdalena",
  "Michal",
];

const lastNames = [
  "Nowak",
  "Kowalski",
  "Wisniewska",
  "Wojcik",
  "Kaminska",
  "Lewandowski",
  "Zielinska",
  "Szymanski",
  "Dabrowska",
  "Kozlowski",
];

const cities = ["Warszawa", "Krakow", "Gdansk", "Wroclaw", "Poznan"];

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function dateTime(value: string) {
  return new Date(value);
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

async function main() {
  await resetData();

  await db.insert(schema.specjalizacje).values([
    { id_specjaliz: 1, nazwa: "Kardiologia" },
    { id_specjaliz: 2, nazwa: "Neurologia" },
    { id_specjaliz: 3, nazwa: "Pediatria" },
    { id_specjaliz: 4, nazwa: "Ortopedia" },
    { id_specjaliz: 5, nazwa: "Dermatologia" },
  ]);

  await db.insert(schema.przychodnie).values([
    {
      nazwa: "Centrum Medyczne Pulk",
      miasto: "Warszawa",
      adres: "Aleje Jerozolimskie 21",
    },
    { nazwa: "Klinika Nova", miasto: "Krakow", adres: "ul. Grunwaldzka 12" },
    {
      nazwa: "Przychodnia Vita",
      miasto: "Gdansk",
      adres: "ul. Dlugie Ogrody 7",
    },
  ]);

  await db.insert(schema.uslugi).values([
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
  ]);

  await db.insert(schema.leki).values([
    { id_leku: 2001, nazwa: "Cardiolin", forma: "tabletki" },
    { id_leku: 2002, nazwa: "Neurocalm", forma: "kapsulki" },
    { id_leku: 2003, nazwa: "Pediatus", forma: "syrop" },
    { id_leku: 2004, nazwa: "Dermasol", forma: "masc" },
    { id_leku: 2005, nazwa: "OrthoFlex", forma: "tabletki" },
    { id_leku: 2006, nazwa: "VitaPlus", forma: "kapsulki" },
  ]);

  await db.insert(schema.lekarze).values([
    {
      id_lekarza: 101,
      imie: "Ewa",
      nazwisko: "Maj",
      email: "e.maj@hospital.pl",
      telefon: "500123456",
      id_specjaliz: 1,
    },
    {
      id_lekarza: 102,
      imie: "Pawel",
      nazwisko: "Lis",
      email: "p.lis@hospital.pl",
      telefon: "500123457",
      id_specjaliz: 2,
    },
    {
      id_lekarza: 103,
      imie: "Joanna",
      nazwisko: "Gorska",
      email: "j.gorska@hospital.pl",
      telefon: "500123458",
      id_specjaliz: 3,
    },
    {
      id_lekarza: 104,
      imie: "Marek",
      nazwisko: "Zajac",
      email: "m.zajac@hospital.pl",
      telefon: "500123459",
      id_specjaliz: 4,
    },
    {
      id_lekarza: 105,
      imie: "Natalia",
      nazwisko: "Krol",
      email: "n.krol@hospital.pl",
      telefon: "500123460",
      id_specjaliz: 5,
    },
    {
      id_lekarza: 106,
      imie: "Oskar",
      nazwisko: "Wieczorek",
      email: "o.wieczorek@hospital.pl",
      telefon: "500123461",
      id_specjaliz: 1,
    },
  ]);

  const pacjenci = await db
    .insert(schema.pacjenci)
    .values(
      Array.from({ length: 12 }).map((_, index) => ({
        imie: pick(firstNames, index),
        nazwisko: pick(lastNames, index + 3),
        numer_dokum: `AB${100000 + index}`,
        data_urodz: dateOnly(
          `198${index % 10}-0${(index % 9) + 1}-1${index % 9}`,
        ),
        plec: index % 2 === 0 ? "K" : "M",
        email: `${pick(firstNames, index).toLowerCase()}.${pick(lastNames, index).toLowerCase()}@mail.pl`,
        telefon: `600200${(index + 10).toString().padStart(2, "0")}`,
      })),
    )
    .returning();

  const visitsSeed: VisitSeed[] = [
    {
      id_pacjenta: pacjenci[0].id_pacjenta,
      id_lekarza: 101,
      data: dateOnly("2025-01-12"),
      godzina: dateTime("2025-01-12T09:30:00"),
      typ: "Kontrola",
      status: "Zakonczona",
      id_przychodni: 1,
      opis: "Kontrola po zabiegu",
    },
    {
      id_pacjenta: pacjenci[1].id_pacjenta,
      id_lekarza: 102,
      data: dateOnly("2025-01-15"),
      godzina: dateTime("2025-01-15T11:00:00"),
      typ: "Konsultacja",
      status: "Zakonczona",
      id_przychodni: 2,
      opis: "Bole glowy",
    },
    {
      id_pacjenta: pacjenci[2].id_pacjenta,
      id_lekarza: 103,
      data: dateOnly("2025-02-05"),
      godzina: dateTime("2025-02-05T14:00:00"),
      typ: "Szczepienie",
      status: "Zakonczona",
      id_przychodni: 3,
    },
    {
      id_pacjenta: pacjenci[3].id_pacjenta,
      id_lekarza: 104,
      data: dateOnly("2025-02-20"),
      godzina: dateTime("2025-02-20T08:45:00"),
      typ: "Rehabilitacja",
      status: "Zaplanowana",
      id_przychodni: 2,
    },
    {
      id_pacjenta: pacjenci[4].id_pacjenta,
      id_lekarza: 105,
      data: dateOnly("2025-03-02"),
      godzina: dateTime("2025-03-02T15:30:00"),
      typ: "Konsultacja",
      status: "Zakonczona",
      id_przychodni: 1,
      opis: "Zmiany skorne",
    },
    {
      id_pacjenta: pacjenci[5].id_pacjenta,
      id_lekarza: 106,
      data: dateOnly("2025-03-12"),
      godzina: dateTime("2025-03-12T10:15:00"),
      typ: "Teleporada",
      status: "Zakonczona",
      id_przychodni: null,
    },
  ];

  const wizyty = await db.insert(schema.wizyty).values(visitsSeed).returning();

  await db.insert(schema.uslugi_w_wizytach).values([
    { id_wizyty: wizyty[0].id_wizyty, id_uslugi: 1 },
    { id_wizyty: wizyty[1].id_wizyty, id_uslugi: 2 },
    { id_wizyty: wizyty[2].id_wizyty, id_uslugi: 3 },
    { id_wizyty: wizyty[3].id_wizyty, id_uslugi: 4 },
    { id_wizyty: wizyty[4].id_wizyty, id_uslugi: 5 },
    { id_wizyty: wizyty[5].id_wizyty, id_uslugi: 6 },
  ]);

  await db.insert(schema.platnosci).values([
    {
      id_platnosci: 5001,
      id_wizyty: wizyty[0].id_wizyty,
      kwota: "320.00",
      status: "Zaplacona",
      data: dateOnly("2025-01-12"),
      metoda: "Karta",
    },
    {
      id_platnosci: 5002,
      id_wizyty: wizyty[1].id_wizyty,
      kwota: "220.00",
      status: "Zaplacona",
      data: dateOnly("2025-01-15"),
      metoda: "Gotowka",
    },
    {
      id_platnosci: 5003,
      id_wizyty: wizyty[4].id_wizyty,
      kwota: "240.00",
      status: "Zaplacona",
      data: dateOnly("2025-03-02"),
      metoda: "Przelew",
    },
  ]);

  await db.insert(schema.teleporady).values([
    {
      id_telepor: 6001,
      id_wizyty: wizyty[5].id_wizyty,
      link: "https://meet.example.com/teleporada-6001",
      godzina_rozpocz: dateTime("2025-03-12T10:15:00"),
      czas_trwania: 25,
    },
  ]);

  const recepty = await db
    .insert(schema.recepty)
    .values([
      {
        data: dateOnly("2025-01-12"),
        id_pacjenta: pacjenci[0].id_pacjenta,
        id_lekarza: 101,
      },
      {
        data: dateOnly("2025-03-02"),
        id_pacjenta: pacjenci[4].id_pacjenta,
        id_lekarza: 105,
      },
    ])
    .returning();

  await db.insert(schema.pozycje_recept).values([
    {
      id_recepty: recepty[0].id_recepty,
      Lp: 1,
      id_leku: 2001,
      ilosc: 2,
      dawkowanie: "1 tabletka dziennie",
      odplatnosc: "30%",
    },
    {
      id_recepty: recepty[0].id_recepty,
      Lp: 2,
      id_leku: 2006,
      ilosc: 1,
      dawkowanie: "1 kapsulka wieczorem",
      odplatnosc: "50%",
    },
    {
      id_recepty: recepty[1].id_recepty,
      Lp: 1,
      id_leku: 2004,
      ilosc: 1,
      dawkowanie: "2 razy dziennie",
      odplatnosc: "100%",
    },
  ]);

  const historie = await db
    .insert(schema.historie_leczenia)
    .values([
      { id_pacjenta: pacjenci[0].id_pacjenta },
      { id_pacjenta: pacjenci[1].id_pacjenta },
      { id_pacjenta: pacjenci[4].id_pacjenta },
    ])
    .returning();

  await db.insert(schema.pozycje_historii_leczenia).values([
    {
      id_historii: historie[0].id_historii,
      Lp: 1,
      id_wizyty: wizyty[0].id_wizyty,
    },
    {
      id_historii: historie[0].id_historii,
      Lp: 2,
      id_wizyty: wizyty[1].id_wizyty,
    },
    {
      id_historii: historie[1].id_historii,
      Lp: 1,
      id_wizyty: wizyty[1].id_wizyty,
    },
    {
      id_historii: historie[2].id_historii,
      Lp: 1,
      id_wizyty: wizyty[4].id_wizyty,
    },
  ]);

  await db.insert(schema.skierowania).values([
    {
      numer: 7001,
      id_pacjenta: pacjenci[3].id_pacjenta,
      id_lekarza: 104,
      data_wystaw: dateOnly("2025-02-20"),
      opis: "Rehabilitacja kolana",
      id_uslugi: 4,
    },
    {
      numer: 7002,
      id_pacjenta: pacjenci[1].id_pacjenta,
      id_lekarza: 102,
      data_wystaw: dateOnly("2025-01-15"),
      opis: "Dodatkowa diagnostyka neurologiczna",
      id_uslugi: 2,
    },
  ]);

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
