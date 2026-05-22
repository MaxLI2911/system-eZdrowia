CREATE SEQUENCE IF NOT EXISTS "platnosci_id_platnosci_seq";

ALTER TABLE "platnosci"
	ALTER COLUMN "id_platnosci" SET DEFAULT nextval('platnosci_id_platnosci_seq');

ALTER SEQUENCE "platnosci_id_platnosci_seq"
	OWNED BY "platnosci"."id_platnosci";

SELECT setval(
	'platnosci_id_platnosci_seq',
	COALESCE((SELECT max("id_platnosci") FROM "platnosci"), 0)
);