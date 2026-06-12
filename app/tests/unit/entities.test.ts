import { describe, it, expect } from "vitest";
import {
  ENTITY_CONFIGS,
  getEntityConfig,
  ENTITY_LIST,
} from "@/lib/entities";
import type { EntityKey } from "@/lib/entities";
import { ENTITY_TABLES } from "@/server/data/entityMap";

const ALL_ENTITY_KEYS: EntityKey[] = [
  "pacjenci",
  "lekarze",
  "wizyty",
  "recepty",
  "pozycje_recept",
  "leki",
  "platnosci",
  "przychodnie",
  "uslugi",
  "uslugi_w_wizytach",
  "teleporady",
  "specjalizacje",
  "historie_leczenia",
  "pozycje_historii_leczenia",
  "skierowania",
];

describe("ENTITY_CONFIGS", () => {
  it("all entities from ENTITY_TABLES exist in ENTITY_CONFIGS", () => {
    const tableKeys = Object.keys(ENTITY_TABLES) as EntityKey[];
    for (const key of tableKeys) {
      expect(ENTITY_CONFIGS[key]).toBeDefined();
    }
  });

  it("all entities from ENTITY_CONFIGS exist in ENTITY_TABLES", () => {
    const configKeys = Object.keys(ENTITY_CONFIGS) as EntityKey[];
    for (const key of configKeys) {
      expect(ENTITY_TABLES[key]).toBeDefined();
    }
  });

  it("all entities have a non-empty primary key", () => {
    for (const config of ENTITY_LIST) {
      expect(config.primaryKey.length).toBeGreaterThan(0);
    }
  });

  it("all entities have at least one list field", () => {
    for (const config of ENTITY_LIST) {
      expect(config.listFields.length).toBeGreaterThan(0);
    }
  });

  it("primary keys appear in fields", () => {
    for (const config of ENTITY_LIST) {
      const fieldNames = config.fields.map((f) => f.name);
      for (const pk of config.primaryKey) {
        expect(fieldNames).toContain(pk);
      }
    }
  });

  it("list fields exist in field definitions", () => {
    for (const config of ENTITY_LIST) {
      const fieldNames = config.fields.map((f) => f.name);
      for (const lf of config.listFields) {
        expect(fieldNames).toContain(lf);
      }
    }
  });

  it("select-type fields have optionsEntity defined", () => {
    for (const config of ENTITY_LIST) {
      for (const field of config.fields) {
        if (field.type === "select") {
          expect(field.optionsEntity).toBeDefined();
        }
      }
    }
  });

  it("search fields reference existing field names", () => {
    for (const config of ENTITY_LIST) {
      const fieldNames = config.fields.map((f) => f.name);
      for (const sf of config.searchFields) {
        expect(fieldNames).toContain(sf);
      }
    }
  });

  it("required fields are not readOnly", () => {
    for (const config of ENTITY_LIST) {
      for (const field of config.fields) {
        if (field.required) {
          expect(field.readOnly).not.toBe(true);
        }
      }
    }
  });
});

describe("getEntityConfig", () => {
  it("returns config for valid entity key", () => {
    const config = getEntityConfig("pacjenci");
    expect(config).toBeDefined();
    expect(config!.key).toBe("pacjenci");
  });

  it("returns undefined for invalid entity key", () => {
    const config = getEntityConfig("nieistniejacy_entity");
    expect(config).toBeUndefined();
  });

  it("returns the same object reference as ENTITY_CONFIGS entry", () => {
    const config = getEntityConfig("lekarze");
    expect(config).toBe(ENTITY_CONFIGS.lekarze);
  });
});

describe("ENTITY_LIST", () => {
  it("matches all keys from ENTITY_CONFIGS", () => {
    const configKeys = Object.keys(ENTITY_CONFIGS).sort();
    const listKeys = ENTITY_LIST.map((e) => e.key).sort();

    expect(listKeys).toEqual(configKeys);

    expect(ALL_ENTITY_KEYS.slice().sort()).toEqual(configKeys);
  });
});
