export type FieldType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "currency"
  | "select"
  | "textarea";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readOnly?: boolean;
  optionsEntity?: EntityKey;
  searchable?: boolean;
};

export type EntityConfig = {
  key: EntityKey;
  label: string;
  primaryKey: string[];
  fields: FieldConfig[];
  listFields: string[];
  searchFields: string[];
  optionLabelFields?: string[];
};

export const ENTITY_CONFIGS = {
  pacjenci: {
    key: "pacjenci",
    label: "Pacjenci",
    primaryKey: ["id_pacjenta"],
    listFields: [
      "id_pacjenta",
      "imie",
      "nazwisko",
      "numer_dokum",
      "data_urodz",
      "plec",
      "telefon",
    ],
    searchFields: ["imie", "nazwisko", "numer_dokum", "email", "telefon"],
    optionLabelFields: ["imie", "nazwisko"],
    fields: [
      { name: "id_pacjenta", label: "ID", type: "number", readOnly: true },
      {
        name: "imie",
        label: "Imie",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "nazwisko",
        label: "Nazwisko",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "numer_dokum",
        label: "Numer dokumentu",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "data_urodz",
        label: "Data urodzenia",
        type: "date",
        required: true,
      },
      { name: "plec", label: "Plec", type: "text", required: true },
      { name: "email", label: "Email", type: "text", searchable: true },
      { name: "telefon", label: "Telefon", type: "text", searchable: true },
    ],
  },
  lekarze: {
    key: "lekarze",
    label: "Lekarze",
    primaryKey: ["id_lekarza"],
    listFields: ["id_lekarza", "imie", "nazwisko", "id_specjaliz", "telefon"],
    searchFields: ["imie", "nazwisko", "email", "telefon"],
    optionLabelFields: ["imie", "nazwisko"],
    fields: [
      { name: "id_lekarza", label: "ID", type: "number", required: true },
      {
        name: "imie",
        label: "Imie",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "nazwisko",
        label: "Nazwisko",
        type: "text",
        required: true,
        searchable: true,
      },
      { name: "email", label: "Email", type: "text", searchable: true },
      { name: "telefon", label: "Telefon", type: "text", searchable: true },
      {
        name: "id_specjaliz",
        label: "Specjalizacja",
        type: "select",
        required: true,
        optionsEntity: "specjalizacje",
      },
    ],
  },
  wizyty: {
    key: "wizyty",
    label: "Wizyty",
    primaryKey: ["id_wizyty"],
    listFields: [
      "id_wizyty",
      "id_pacjenta",
      "id_lekarza",
      "data",
      "godzina",
      "typ",
      "status",
    ],
    searchFields: ["typ", "status", "opis"],
    fields: [
      { name: "id_wizyty", label: "ID", type: "number", readOnly: true },
      {
        name: "id_pacjenta",
        label: "Pacjent",
        type: "select",
        required: true,
        optionsEntity: "pacjenci",
      },
      {
        name: "id_lekarza",
        label: "Lekarz",
        type: "select",
        required: true,
        optionsEntity: "lekarze",
      },
      { name: "data", label: "Data", type: "date", required: true },
      { name: "godzina", label: "Godzina", type: "datetime", required: true },
      {
        name: "typ",
        label: "Typ",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "status",
        label: "Status",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "id_przychodni",
        label: "Przychodnia",
        type: "select",
        optionsEntity: "przychodnie",
      },
      { name: "opis", label: "Opis", type: "textarea", searchable: true },
    ],
  },
  recepty: {
    key: "recepty",
    label: "Recepty",
    primaryKey: ["id_recepty"],
    listFields: ["id_recepty", "data", "id_pacjenta", "id_lekarza"],
    searchFields: [],
    fields: [
      { name: "id_recepty", label: "ID", type: "number", readOnly: true },
      { name: "data", label: "Data", type: "date", required: true },
      {
        name: "id_pacjenta",
        label: "Pacjent",
        type: "select",
        required: true,
        optionsEntity: "pacjenci",
      },
      {
        name: "id_lekarza",
        label: "Lekarz",
        type: "select",
        required: true,
        optionsEntity: "lekarze",
      },
    ],
  },
  pozycje_recept: {
    key: "pozycje_recept",
    label: "Pozycje recept",
    primaryKey: ["id_recepty", "Lp"],
    listFields: [
      "id_recepty",
      "Lp",
      "id_leku",
      "ilosc",
      "dawkowanie",
      "odplatnosc",
    ],
    searchFields: ["dawkowanie", "odplatnosc"],
    fields: [
      {
        name: "id_recepty",
        label: "Recepta",
        type: "select",
        required: true,
        optionsEntity: "recepty",
      },
      { name: "Lp", label: "Lp", type: "number", required: true },
      {
        name: "id_leku",
        label: "Lek",
        type: "select",
        required: true,
        optionsEntity: "leki",
      },
      { name: "ilosc", label: "Ilosc", type: "number", required: true },
      {
        name: "dawkowanie",
        label: "Dawkowanie",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "odplatnosc",
        label: "Odplatnosc",
        type: "text",
        searchable: true,
      },
    ],
  },
  leki: {
    key: "leki",
    label: "Leki",
    primaryKey: ["id_leku"],
    listFields: ["id_leku", "nazwa", "forma"],
    searchFields: ["nazwa", "forma"],
    optionLabelFields: ["nazwa", "forma"],
    fields: [
      { name: "id_leku", label: "ID", type: "number", required: true },
      {
        name: "nazwa",
        label: "Nazwa",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "forma",
        label: "Forma",
        type: "text",
        required: true,
        searchable: true,
      },
    ],
  },
  platnosci: {
    key: "platnosci",
    label: "Platnosci",
    primaryKey: ["id_platnosci"],
    listFields: [
      "id_platnosci",
      "id_wizyty",
      "kwota",
      "status",
      "data",
      "metoda",
    ],
    searchFields: ["status", "metoda"],
    fields: [
      { name: "id_platnosci", label: "ID", type: "number", readOnly: true },
      {
        name: "id_wizyty",
        label: "Wizyta",
        type: "select",
        required: true,
        optionsEntity: "wizyty",
      },
      { name: "kwota", label: "Kwota", type: "currency", required: true },
      { name: "status", label: "Status", type: "text", searchable: true },
      { name: "data", label: "Data", type: "date" },
      { name: "metoda", label: "Metoda", type: "text", searchable: true },
    ],
  },
  przychodnie: {
    key: "przychodnie",
    label: "Przychodnie",
    primaryKey: ["id_przychodni"],
    listFields: ["id_przychodni", "nazwa", "miasto", "adres"],
    searchFields: ["nazwa", "miasto", "adres"],
    optionLabelFields: ["nazwa", "miasto"],
    fields: [
      { name: "id_przychodni", label: "ID", type: "number", readOnly: true },
      {
        name: "nazwa",
        label: "Nazwa",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "miasto",
        label: "Miasto",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "adres",
        label: "Adres",
        type: "text",
        required: true,
        searchable: true,
      },
    ],
  },
  uslugi: {
    key: "uslugi",
    label: "Uslugi",
    primaryKey: ["id_uslugi"],
    listFields: ["id_uslugi", "nazwa", "cena", "wymaga_skierow"],
    searchFields: ["nazwa"],
    optionLabelFields: ["nazwa"],
    fields: [
      { name: "id_uslugi", label: "ID", type: "number", readOnly: true },
      {
        name: "nazwa",
        label: "Nazwa",
        type: "text",
        required: true,
        searchable: true,
      },
      { name: "cena", label: "Cena", type: "currency", required: true },
      {
        name: "wymaga_skierow",
        label: "Wymaga skierowania",
        type: "boolean",
        required: true,
      },
    ],
  },
  uslugi_w_wizytach: {
    key: "uslugi_w_wizytach",
    label: "Uslugi w wizytach",
    primaryKey: ["id_wizyty", "id_uslugi"],
    listFields: ["id_wizyty", "id_uslugi"],
    searchFields: [],
    fields: [
      {
        name: "id_wizyty",
        label: "Wizyta",
        type: "select",
        required: true,
        optionsEntity: "wizyty",
      },
      {
        name: "id_uslugi",
        label: "Usluga",
        type: "select",
        required: true,
        optionsEntity: "uslugi",
      },
    ],
  },
  teleporady: {
    key: "teleporady",
    label: "Teleporady",
    primaryKey: ["id_telepor"],
    listFields: [
      "id_telepor",
      "id_wizyty",
      "link",
      "godzina_rozpocz",
      "czas_trwania",
    ],
    searchFields: ["link"],
    fields: [
      { name: "id_telepor", label: "ID", type: "number", required: true },
      {
        name: "id_wizyty",
        label: "Wizyta",
        type: "select",
        required: true,
        optionsEntity: "wizyty",
      },
      {
        name: "link",
        label: "Link",
        type: "text",
        required: true,
        searchable: true,
      },
      {
        name: "godzina_rozpocz",
        label: "Godzina rozpoczecia",
        type: "datetime",
        required: true,
      },
      {
        name: "czas_trwania",
        label: "Czas trwania (min)",
        type: "number",
        required: true,
      },
    ],
  },
  specjalizacje: {
    key: "specjalizacje",
    label: "Specjalizacje",
    primaryKey: ["id_specjaliz"],
    listFields: ["id_specjaliz", "nazwa"],
    searchFields: ["nazwa"],
    optionLabelFields: ["nazwa"],
    fields: [
      { name: "id_specjaliz", label: "ID", type: "number", required: true },
      {
        name: "nazwa",
        label: "Nazwa",
        type: "text",
        required: true,
        searchable: true,
      },
    ],
  },
  historie_leczenia: {
    key: "historie_leczenia",
    label: "Historie leczenia",
    primaryKey: ["id_historii"],
    listFields: ["id_historii", "id_pacjenta"],
    searchFields: [],
    fields: [
      { name: "id_historii", label: "ID", type: "number", readOnly: true },
      {
        name: "id_pacjenta",
        label: "Pacjent",
        type: "select",
        required: true,
        optionsEntity: "pacjenci",
      },
    ],
  },
  pozycje_historii_leczenia: {
    key: "pozycje_historii_leczenia",
    label: "Pozycje historii leczenia",
    primaryKey: ["id_historii", "Lp"],
    listFields: ["id_historii", "Lp", "id_wizyty"],
    searchFields: [],
    fields: [
      {
        name: "id_historii",
        label: "Historia",
        type: "select",
        required: true,
        optionsEntity: "historie_leczenia",
      },
      { name: "Lp", label: "Lp", type: "number", required: true },
      {
        name: "id_wizyty",
        label: "Wizyta",
        type: "select",
        required: true,
        optionsEntity: "wizyty",
      },
    ],
  },
  skierowania: {
    key: "skierowania",
    label: "Skierowania",
    primaryKey: ["numer"],
    listFields: [
      "numer",
      "id_pacjenta",
      "id_lekarza",
      "data_wystaw",
      "id_uslugi",
    ],
    searchFields: ["opis"],
    fields: [
      { name: "numer", label: "Numer", type: "number", required: true },
      {
        name: "id_pacjenta",
        label: "Pacjent",
        type: "select",
        required: true,
        optionsEntity: "pacjenci",
      },
      {
        name: "id_lekarza",
        label: "Lekarz",
        type: "select",
        required: true,
        optionsEntity: "lekarze",
      },
      {
        name: "data_wystaw",
        label: "Data wystawienia",
        type: "date",
        required: true,
      },
      {
        name: "opis",
        label: "Opis",
        type: "textarea",
        required: true,
        searchable: true,
      },
      {
        name: "id_uslugi",
        label: "Usluga",
        type: "select",
        required: true,
        optionsEntity: "uslugi",
      },
    ],
  },
} satisfies Record<string, EntityConfig>;

export type EntityKey = keyof typeof ENTITY_CONFIGS;

export const ENTITY_LIST: EntityConfig[] = Object.values(ENTITY_CONFIGS);

export function getEntityConfig(entity: string): EntityConfig | undefined {
  return ENTITY_CONFIGS[entity as EntityKey];
}
