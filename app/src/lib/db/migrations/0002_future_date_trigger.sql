CREATE OR REPLACE FUNCTION check_future_visit_date() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data < CURRENT_DATE THEN
        RAISE EXCEPTION 'Data wizyty nie moze byc w przeszlosci';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_check_future_visit_date ON wizyty;
--> statement-breakpoint
CREATE TRIGGER trg_check_future_visit_date
BEFORE INSERT OR UPDATE ON wizyty
FOR EACH ROW EXECUTE FUNCTION check_future_visit_date();
