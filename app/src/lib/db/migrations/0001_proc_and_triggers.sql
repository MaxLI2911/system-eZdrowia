-- Custom SQL migration file, put your code below! --
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

CREATE OR REPLACE PROCEDURE zrealizuj_wizyte(p_id_wizyty INT, p_opis_lekarski VARCHAR) LANGUAGE plpgsql AS $$
DECLARE
    v_id_pacjenta INT;
    v_id_historii INT;
BEGIN
    UPDATE wizyty SET status = 'Zakonczona', opis = p_opis_lekarski WHERE id_wizyty = p_id_wizyty;
    
    SELECT id_pacjenta INTO v_id_pacjenta FROM wizyty WHERE id_wizyty = p_id_wizyty;
    
    SELECT id_historii INTO v_id_historii FROM historie_leczenia WHERE id_pacjenta = v_id_pacjenta LIMIT 1;
    
    IF v_id_historii IS NULL THEN
        INSERT INTO historie_leczenia (id_pacjenta) VALUES (v_id_pacjenta) RETURNING id_historii INTO v_id_historii;
    END IF;
    
    -- Automatyczny wpis do pozycji historii leczenia
    INSERT INTO pozycje_historii_leczenia (id_historii, id_wizyty, opis, data_wpisu)
    VALUES (v_id_historii, p_id_wizyty, p_opis_lekarski, CURRENT_TIMESTAMP);
END;
$$;

CREATE OR REPLACE PROCEDURE anuluj_wizyte(p_id_wizyty INT) LANGUAGE plpgsql AS $$
BEGIN
    -- Zmiana statusu wizyty (zwalnia termin w check_double_booking)
    UPDATE wizyty SET status = 'Anulowana' WHERE id_wizyty = p_id_wizyty;
    
    -- Inicjowanie korekty płatności (Spójność finansowa)
    UPDATE platnosci SET status = 'Zwrot' WHERE id_wizyty = p_id_wizyty AND status != 'Zaplacona';
    -- Jeśli płatność była zapłacona, można zmienić na status 'DoZwrotu' lub wygenerować korektę
    UPDATE platnosci SET status = 'DoZwrotu' WHERE id_wizyty = p_id_wizyty AND status = 'Zaplacona';
END;
$$;

CREATE OR REPLACE PROCEDURE wystaw_skierowanie(
    p_numer INT, p_id_pacjenta INT, p_id_lekarza INT, p_data_wystaw TIMESTAMP, p_opis VARCHAR, p_id_uslugi INT
) LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO skierowania (numer, id_pacjenta, id_lekarza, data_wystaw, opis, id_uslugi)
    VALUES (p_numer, p_id_pacjenta, p_id_lekarza, p_data_wystaw, p_opis, p_id_uslugi);
END;
$$;


CREATE OR REPLACE PROCEDURE wystaw_recepte(
    p_data TIMESTAMP, p_id_pacjenta INT, p_id_lekarza INT
) LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO recepty (data, id_pacjenta, id_lekarza)
    VALUES (p_data, p_id_pacjenta, p_id_lekarza);
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

CREATE OR REPLACE FUNCTION auto_generate_payment() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO platnosci (id_wizyty, kwota, status, data, metoda)
    VALUES (NEW.id_wizyty, 100.00, 'Oczekujaca', CURRENT_DATE, 'Gotowka');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_generate_payment ON wizyty;
CREATE TRIGGER trg_auto_generate_payment
AFTER INSERT ON wizyty
FOR EACH ROW EXECUTE FUNCTION auto_generate_payment();

CREATE OR REPLACE FUNCTION fn_czy_lekarz_dostepny(
    p_id_lekarza INT, 
    p_data TIMESTAMP, 
    p_godzina TIMESTAMP
) RETURNS BOOLEAN AS $$
DECLARE
    v_zajety INT;
BEGIN
    SELECT COUNT(*) INTO v_zajety
    FROM wizyty
    WHERE id_lekarza = p_id_lekarza
      AND data = p_data
      AND godzina = p_godzina
      AND status != 'Anulowana';
      
    IF v_zajety > 0 THEN
        RETURN FALSE; -- Lekarz jest zajęty
    ELSE
        RETURN TRUE;  -- Lekarz jest wolny
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_transaction_amount() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.kwota < 0 THEN
        RAISE EXCEPTION 'Kwota transakcji nie moze byc ujemna! Podano: %', NEW.kwota;
    END IF;
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_platnosci_amount ON platnosci;
CREATE TRIGGER trg_check_platnosci_amount
AFTER INSERT OR UPDATE ON platnosci
FOR EACH ROW EXECUTE FUNCTION check_transaction_amount();