import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  varchar,
  numeric,
  boolean as dbBoolean,
} from "drizzle-orm/pg-core";

export const recepty = pgTable("recepty", {
  id_recepty: serial("id_recepty").primaryKey(),
  data: timestamp("data", { mode: "date" }).notNull(),
  id_pacjenta: integer("id_pacjenta").notNull(),
  id_lekarza: integer("id_lekarza").notNull(),
});

export const leki = pgTable("leki", {
  id_leku: integer("id_leku").primaryKey(),
  nazwa: varchar("nazwa", { length: 255 }).notNull(),
  forma: varchar("forma", { length: 50 }).notNull(),
});

export const lekarze = pgTable("lekarze", {
  id_lekarza: integer("id_lekarza").primaryKey(),
  imie: varchar("imie", { length: 50 }).notNull(),
  nazwisko: varchar("nazwisko", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }),
  telefon: varchar("telefon", { length: 15 }),
  id_specjaliz: integer("id_specjaliz").notNull(),
});

export const platnosci = pgTable("platnosci", {
  id_platnosci: integer("id_platnosci").primaryKey(),
  id_wizyty: integer("id_wizyty").notNull(),
  kwota: numeric("kwota", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }),
  data: timestamp("data", { mode: "date" }),
  metoda: varchar("metoda", { length: 20 }),
});

export const przychodnie = pgTable("przychodnie", {
  id_przychodni: serial("id_przychodni").primaryKey(),
  nazwa: varchar("nazwa", { length: 255 }).notNull(),
  miasto: varchar("miasto", { length: 100 }).notNull(),
  adres: varchar("adres", { length: 255 }).notNull(),
});

export const uslugi_w_wizytach = pgTable("uslugi_w_wizytach", {
  id_wizyty: integer("id_wizyty").notNull(),
  id_uslugi: integer("id_uslugi").notNull(),
});

export const historie_leczenia = pgTable("historie_leczenia", {
  id_historii: serial("id_historii").primaryKey(),
  id_pacjenta: integer("id_pacjenta").notNull(),
});

export const uslugi = pgTable("uslugi", {
  id_uslugi: serial("id_uslugi").primaryKey(),
  nazwa: varchar("nazwa", { length: 255 }).notNull(),
  cena: numeric("cena", { precision: 12, scale: 2 }).notNull(),
  wymaga_skierow: dbBoolean("wymaga_skierow").notNull(),
});

export const teleporady = pgTable("teleporady", {
  id_telepor: integer("id_telepor").primaryKey(),
  id_wizyty: integer("id_wizyty").notNull(),
  link: varchar("link", { length: 255 }).notNull(),
  godzina_rozpocz: timestamp("godzina_rozpocz").notNull(),
  czas_trwania: integer("czas_trwania").notNull(),
});

export const wizyty = pgTable("wizyty", {
  id_wizyty: serial("id_wizyty").primaryKey(),
  id_pacjenta: integer("id_pacjenta").notNull(),
  id_lekarza: integer("id_lekarza").notNull(),
  data: timestamp("data", { mode: "date" }).notNull(),
  godzina: timestamp("godzina").notNull(),
  typ: varchar("typ", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  id_przychodni: integer("id_przychodni"),
  opis: varchar("opis", { length: 255 }),
});

export const pacjenci = pgTable("pacjenci", {
  id_pacjenta: serial("id_pacjenta").primaryKey(),
  imie: varchar("imie", { length: 50 }).notNull(),
  nazwisko: varchar("nazwisko", { length: 50 }).notNull(),
  numer_dokum: varchar("numer_dokum", { length: 20 }).notNull(),
  data_urodz: timestamp("data_urodz", { mode: "date" }).notNull(),
  plec: varchar("plec", { length: 10 }).notNull(),
  email: varchar("email", { length: 100 }),
  telefon: varchar("telefon", { length: 15 }),
});

export const skierowania = pgTable("skierowania", {
  numer: integer("numer").primaryKey(),
  id_pacjenta: integer("id_pacjenta").notNull(),
  id_lekarza: integer("id_lekarza").notNull(),
  data_wystaw: timestamp("data_wystaw", { mode: "date" }).notNull(),
  opis: varchar("opis", { length: 255 }).notNull(),
  id_uslugi: integer("id_uslugi").notNull(),
});

export const pozycje_recept = pgTable("pozycje_recept", {
  id_recepty: integer("id_recepty").notNull(),
  Lp: integer("Lp").notNull(),
  id_leku: integer("id_leku").notNull(),
  ilosc: integer("ilosc").notNull(),
  dawkowanie: varchar("dawkowanie", { length: 100 }).notNull(),
  odplatnosc: varchar("odpłatnosc", { length: 20 }),
});

export const pozycje_historii_leczenia = pgTable("pozycje_historii_leczenia", {
  id_historii: integer("id_historii").notNull(),
  Lp: integer("Lp").notNull(),
  id_wizyty: integer("id_wizyty").notNull(),
});

export const specjalizacje = pgTable("specjalizacje", {
  id_specjaliz: integer("id_specjaliz").primaryKey(),
  nazwa: varchar("nazwa", { length: 100 }).notNull(),
});
