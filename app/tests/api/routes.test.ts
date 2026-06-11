import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GET as entityListGet, POST as entityListPost } from "@/app/api/[entity]/route";
import {
  GET as entityByIdGet,
  PUT as entityByIdPut,
  DELETE as entityByIdDelete,
} from "@/app/api/[entity]/[id]/route";
import { db } from "@/lib/db";
import { pacjenci, lekarze, specjalizacje } from "@/lib/db/schema";
import { encodeEntityId } from "@/server/data/crud";
import { eq } from "drizzle-orm";

let testPatientId: number;
let encodedPatientId: string;

beforeAll(async () => {
  await db
    .insert(specjalizacje)
    .values({ id_specjaliz: 96, nazwa: "Dermatologia" });

  await db.insert(lekarze).values({
    id_lekarza: 996,
    imie: "Ewa",
    nazwisko: "Dermatolog",
    id_specjaliz: 96,
  });

  const [pat] = await db
    .insert(pacjenci)
    .values({
      imie: "Tomasz",
      nazwisko: "Testowy",
      numer_dokum: "API001",
      data_urodz: new Date("1992-08-15"),
      plec: "M",
      telefon: "111222333",
    })
    .returning();
  testPatientId = pat.id_pacjenta;
  encodedPatientId = encodeEntityId("pacjenci", {
    id_pacjenta: testPatientId,
  });
});

afterAll(async () => {
  await db.delete(pacjenci).where(eq(pacjenci.id_pacjenta, testPatientId));
  await db.delete(lekarze).where(eq(lekarze.id_lekarza, 996));
  await db.delete(specjalizacje).where(eq(specjalizacje.id_specjaliz, 96));
});

function buildCtx(params: Record<string, string>) {
  return { params } as any;
}

describe("GET /api/[entity] - list", () => {
  it("T-UNIT-02: returns 404 for unknown entity", async () => {
    const response = await entityListGet(
      new Request("http://localhost/api/nieistniejacy"),
      buildCtx({ entity: "nieistniejacy" }),
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns paginated list for valid entity", async () => {
    const response = await entityListGet(
      new Request("http://localhost/api/pacjenci?page=1&pageSize=5"),
      buildCtx({ entity: "pacjenci" }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(Number(body.total)).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /api/[entity]/[id] - get by id", () => {
  it("T-UNIT-02: returns 404 for unknown entity with id", async () => {
    const response = await entityByIdGet(
      new Request("http://localhost/api/nieistniejacy/1"),
      buildCtx({ entity: "nieistniejacy", id: "1" }),
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 for existing entity but non-existent record", async () => {
    const encodedId = encodeEntityId("pacjenci", { id_pacjenta: 99999 });
    const response = await entityByIdGet(
      new Request(`http://localhost/api/pacjenci/${encodedId}`),
      buildCtx({ entity: "pacjenci", id: encodedId }),
    );

    expect(response.status).toBe(404);
  });

  it("T-UNIT-02: GET /api/lekarze/99999 returns 404", async () => {
    const encodedId = encodeEntityId("lekarze", { id_lekarza: 99999 });
    const response = await entityByIdGet(
      new Request(`http://localhost/api/lekarze/${encodedId}`),
      buildCtx({ entity: "lekarze", id: encodedId }),
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 200 with record for valid id", async () => {
    const response = await entityByIdGet(
      new Request(`http://localhost/api/pacjenci/${encodedPatientId}`),
      buildCtx({ entity: "pacjenci", id: encodedPatientId }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.imie).toBe("Tomasz");
  });
});

describe("POST /api/[entity] - create", () => {
  it("returns 404 for unknown entity", async () => {
    const response = await entityListPost(
      new Request("http://localhost/api/nieistniejacy", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      buildCtx({ entity: "nieistniejacy" }),
    );

    expect(response.status).toBe(404);
  });

  it("creates a record and returns 201", async () => {
    const response = await entityListPost(
      new Request("http://localhost/api/pacjenci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imie: "API",
          nazwisko: "Created",
          numer_dokum: "APICRT",
          data_urodz: new Date("1995-01-01"),
          plec: "K",
        }),
      }),
      buildCtx({ entity: "pacjenci" }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.imie).toBe("API");

    await db
      .delete(pacjenci)
      .where(eq(pacjenci.id_pacjenta, body.id_pacjenta as number));
  });
});

describe("PUT /api/[entity]/[id] - update", () => {
  it("returns 404 for unknown entity", async () => {
    const response = await entityByIdPut(
      new Request("http://localhost/api/nieistniejacy/1", {
        method: "PUT",
        body: JSON.stringify({}),
      }),
      buildCtx({ entity: "nieistniejacy", id: "1" }),
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 for non-existent record", async () => {
    const encodedId = encodeEntityId("pacjenci", { id_pacjenta: 99999 });
    const response = await entityByIdPut(
      new Request(`http://localhost/api/pacjenci/${encodedId}`, {
        method: "PUT",
        body: JSON.stringify({ telefon: "000000000" }),
      }),
      buildCtx({ entity: "pacjenci", id: encodedId }),
    );

    expect(response.status).toBe(404);
  });

  it("updates a record and returns 200", async () => {
    const response = await entityByIdPut(
      new Request(`http://localhost/api/pacjenci/${encodedPatientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefon: "999888777" }),
      }),
      buildCtx({ entity: "pacjenci", id: encodedPatientId }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.telefon).toBe("999888777");
  });
});

describe("DELETE /api/[entity]/[id] - delete", () => {
  it("returns 404 for unknown entity", async () => {
    const response = await entityByIdDelete(
      new Request("http://localhost/api/nieistniejacy/1"),
      buildCtx({ entity: "nieistniejacy", id: "1" }),
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 for non-existent record", async () => {
    const encodedId = encodeEntityId("pacjenci", { id_pacjenta: 99999 });
    const response = await entityByIdDelete(
      new Request(`http://localhost/api/pacjenci/${encodedId}`),
      buildCtx({ entity: "pacjenci", id: encodedId }),
    );

    expect(response.status).toBe(404);
  });

  it("returns 200 with deleted record on success", async () => {
    const [temp] = await db
      .insert(pacjenci)
      .values({
        imie: "DoUsunięciaApi",
        nazwisko: "Test",
        numer_dokum: "DELAPI01",
        data_urodz: new Date("1990-01-01"),
        plec: "K",
      })
      .returning();

    const encodedId = encodeEntityId("pacjenci", {
      id_pacjenta: temp.id_pacjenta,
    });

    const response = await entityByIdDelete(
      new Request(`http://localhost/api/pacjenci/${encodedId}`),
      buildCtx({ entity: "pacjenci", id: encodedId }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.imie).toBe("DoUsunięciaApi");
  });
});
