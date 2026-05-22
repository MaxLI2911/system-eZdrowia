CREATE TABLE "historie_leczenia" (
	"id_historii" serial PRIMARY KEY NOT NULL,
	"id_pacjenta" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lekarze" (
	"id_lekarza" integer PRIMARY KEY NOT NULL,
	"imie" varchar(50) NOT NULL,
	"nazwisko" varchar(50) NOT NULL,
	"email" varchar(100),
	"telefon" varchar(15),
	"id_specjaliz" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leki" (
	"id_leku" integer PRIMARY KEY NOT NULL,
	"nazwa" varchar(255) NOT NULL,
	"forma" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pacjenci" (
	"id_pacjenta" serial PRIMARY KEY NOT NULL,
	"imie" varchar(50) NOT NULL,
	"nazwisko" varchar(50) NOT NULL,
	"numer_dokum" varchar(20) NOT NULL,
	"data_urodz" timestamp NOT NULL,
	"plec" varchar(10) NOT NULL,
	"email" varchar(100),
	"telefon" varchar(15)
);
--> statement-breakpoint
CREATE TABLE "platnosci" (
	"id_platnosci" serial PRIMARY KEY NOT NULL,
	"id_wizyty" integer NOT NULL,
	"kwota" numeric(12, 2) NOT NULL,
	"status" varchar(20),
	"data" timestamp,
	"metoda" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "pozycje_historii_leczenia" (
	"id_historii" integer NOT NULL,
	"Lp" integer NOT NULL,
	"id_wizyty" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pozycje_recept" (
	"id_recepty" integer NOT NULL,
	"Lp" integer NOT NULL,
	"id_leku" integer NOT NULL,
	"ilosc" integer NOT NULL,
	"dawkowanie" varchar(100) NOT NULL,
	"odpłatnosc" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "przychodnie" (
	"id_przychodni" serial PRIMARY KEY NOT NULL,
	"nazwa" varchar(255) NOT NULL,
	"miasto" varchar(100) NOT NULL,
	"adres" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recepty" (
	"id_recepty" serial PRIMARY KEY NOT NULL,
	"data" timestamp NOT NULL,
	"id_pacjenta" integer NOT NULL,
	"id_lekarza" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skierowania" (
	"numer" integer PRIMARY KEY NOT NULL,
	"id_pacjenta" integer NOT NULL,
	"id_lekarza" integer NOT NULL,
	"data_wystaw" timestamp NOT NULL,
	"opis" varchar(255) NOT NULL,
	"id_uslugi" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specjalizacje" (
	"id_specjaliz" integer PRIMARY KEY NOT NULL,
	"nazwa" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teleporady" (
	"id_telepor" integer PRIMARY KEY NOT NULL,
	"id_wizyty" integer NOT NULL,
	"link" varchar(255) NOT NULL,
	"godzina_rozpocz" timestamp NOT NULL,
	"czas_trwania" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uslugi" (
	"id_uslugi" serial PRIMARY KEY NOT NULL,
	"nazwa" varchar(255) NOT NULL,
	"cena" numeric(12, 2) NOT NULL,
	"wymaga_skierow" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uslugi_w_wizytach" (
	"id_wizyty" integer NOT NULL,
	"id_uslugi" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wizyty" (
	"id_wizyty" serial PRIMARY KEY NOT NULL,
	"id_pacjenta" integer NOT NULL,
	"id_lekarza" integer NOT NULL,
	"data" timestamp NOT NULL,
	"godzina" timestamp NOT NULL,
	"typ" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"id_przychodni" integer,
	"opis" varchar(255)
);
