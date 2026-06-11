-- optymalizacja (indeksy i partycjonowanie)
CREATE INDEX IF NOT EXISTS idx_pacjenci_nazwisko ON pacjenci(nazwisko);
CREATE INDEX IF NOT EXISTS idx_wizyty_data ON wizyty(data);
CREATE INDEX IF NOT EXISTS idx_wizyty_lekarz ON wizyty(id_lekarza);

CREATE TABLE IF NOT EXISTS wizyty_archiwum (
    id_wizyty integer NOT NULL,
    id_pacjenta integer NOT NULL,
    id_lekarza integer NOT NULL,
    data timestamp NOT NULL,
    status varchar(20) NOT NULL
) PARTITION BY RANGE (data);

CREATE TABLE IF NOT EXISTS wizyty_archiwum_2025 PARTITION OF wizyty_archiwum FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE IF NOT EXISTS wizyty_archiwum_2026 PARTITION OF wizyty_archiwum FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');


-- procedury
CREATE OR REPLACE PROCEDURE dodaj_pacjenta(
    p_imie VARCHAR, p_nazwisko VARCHAR, p_numer_dokum VARCHAR,
    p_data_urodz TIMESTAMP, p_plec VARCHAR, p_email VARCHAR, p_telefon VARCHAR
) LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO pacjenci (imie, nazwisko, numer_dokum, data_urodz, plec, email, telefon)
    VALUES (p_imie, p_nazwisko, p_numer_dokum, p_data_urodz, p_plec, p_email, p_telefon);
END;
$$;

CREATE OR REPLACE PROCEDURE umow_wizyte(
    p_id_pacjenta INT, p_id_lekarza INT, p_data TIMESTAMP, 
    p_godzina TIMESTAMP, p_typ VARCHAR, p_id_przychodni INT
) LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO wizyty (id_pacjenta, id_lekarza, data, godzina, typ, status, id_przychodni)
    VALUES (p_id_pacjenta, p_id_lekarza, p_data, p_godzina, p_typ, 'Zaplanowana', p_id_przychodni);
END;
$$;

CREATE OR REPLACE PROCEDURE zrealizuj_wizyte(p_id_wizyty INT, p_opis VARCHAR) LANGUAGE plpgsql AS $$
BEGIN
    UPDATE wizyty SET status = 'Zakonczona', opis = p_opis WHERE id_wizyty = p_id_wizyty;
END;
$$;


-- triggery
CREATE OR REPLACE FUNCTION check_double_booking() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM wizyty 
        WHERE id_lekarza = NEW.id_lekarza 
          AND data = NEW.data 
          AND godzina = NEW.godzina 
          AND id_wizyty IS DISTINCT FROM NEW.id_wizyty 
          AND status != 'Anulowana'
    ) THEN
        RAISE EXCEPTION 'Lekarz zajety w tym terminie';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_double_booking ON wizyty;
CREATE TRIGGER trg_check_double_booking BEFORE INSERT OR UPDATE ON wizyty FOR EACH ROW EXECUTE FUNCTION check_double_booking();


CREATE OR REPLACE FUNCTION prevent_paid_deletion() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'Zaplacona' THEN
        RAISE EXCEPTION 'Nie mozna usunac oplaconej wizyty';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_paid_deletion ON platnosci;
CREATE TRIGGER trg_prevent_paid_deletion BEFORE DELETE ON platnosci FOR EACH ROW EXECUTE FUNCTION prevent_paid_deletion();