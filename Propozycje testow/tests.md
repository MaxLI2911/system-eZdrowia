# Propozycje testów działania aplikacji i bazy danych – System eZdrowia

Dokument zawiera plan testów dla tworzonej aplikacji oraz bazy danych. Chcemy sprawdzić, czy kluczowe funkcje przychodni działają poprawnie i czy baza skutecznie blokuje nieprawidłowe dane.

## Środowisko testowe

* **Baza danych:** PostgreSQL uruchamiany przez Docker (`docker-compose`).
* **Aplikacja:** Panel webowy dla pracowników szpitala.
* **Narzędzia:** Będziemy testować aplikację wyklikując scenariusze w przeglądarce, a stan bazy weryfikować przez sql skryp jakiegoś scanariusza.

---

# Testy bazy danych (Logika i ograniczenia)

Testy sprawdzen, czy sama baza danych poprawnie pilnuje swoich reguł.

* **T-DB-01: Blokada błędnych dat**
  * **Cel:** Sprawdzenie, czy można dodać wizytę z datą w przeszłości.
  * **Kroki:** Wpisanie przez SQL instrukcji `INSERT` do tabeli `Wizyty` z datą wczorajszą.
  * **Oczekiwany wynik:** Baza odrzuca zapis i zwraca błąd naruszenia reguły. Rekord nie pojawia się w tabeli.

* **T-DB-02: Blokada podwójnej rezerwacji lekarza**
  * **Cel:** Weryfikacja działania procedury `umow_wizyte` / triggerów.
  * **Kroki:** Lekarz ID=1 ma już wizytę 10.10.2026 o 12:00. Próbujemy przez procedurę dodać drugiego pacjenta do tego samego lekarza na dokładnie ten sam termin.
  * **Oczekiwany wynik:** Baza przerywa operację i rzuca błędem o braku dostępności. Nowa wizyta nie zostaje dodana.

* **T-DB-03: Spójność recepty i jej leków**
  * **Cel:** Sprawdzenie, czy recepta dodaje się poprawnie, jeśli jeden z leków ma błąd.
  * **Kroki:** Próba dodania nagłówka `Recepty` i 3 `Pozycji recept`, przy czym trzeci lek ma nieistniejące w bazie ID.
  * **Oczekiwany wynik:** Baza wycofuje całą transakcję. Nie powstaje pusta recepta bez wszystkich leków.

---

# Testy przepływów w aplikacji

Tutaj testujemy cały proces: od kliknięcia w interfejsie po pojawienie się danych w tabelach. Zgodnie z tym, co obsługuje nasza aplikacja.

* **T-APP-01: Rezerwacja wizyty i wygenerowanie płatności**
  * **Cel:** Przejście całej drogi od umówienia pacjenta do rachunku.
  * **Kroki:**
    1. W panelu Admin Console przejdź do "Wizyty" i dodaj nową (wybierz pacjenta, lekarza, datę).
    2. Przejdź do "Usługi w wizytach" i przypisz dwie usługi (np. Konsultacja, EKG).
    3. Przejdź do "Płatności" i wygeneruj rachunek.
  * **Oczekiwany wynik:** Aplikacja nie zgłasza błędów. W bazie pojawia się odpowiednio 1 wpis w `Wizyty`, 2 w `Usługi w wizytach` i 1 wpis w `Płatności`, gdzie kwota jest poprawną sumą cen obu usług.

* **T-APP-02: Wystawianie recepty**
  * **Cel:** Zapisanie recepty z przypisanymi lekami dla konkretnej wizyty.
  * **Kroki:**
    1. Przejdź do zakładki "Recepty" i powiąż nową receptę z wybraną wizytą.
    2. Dodaj do niej 3 różne leki z bazy.
  * **Oczekiwany wynik:** W UI widać przypisane leki. W bazie widać 1 wpis w `Recepty` powiązany kluczami obcymi z 3 wpisami w tabeli `Pozycji recept`.

* **T-APP-03: Wystawienie skierowania**
  * **Cel:** Powiązanie skierowania z pacjentem i usługą medyczną.
  * **Kroki:**
    1. W zakładce "Skierowania" dodaj nowy wpis.
    2. Przypisz pacjenta, lekarza oraz zdefiniowaną wcześniej w bazie Usługę.
  * **Oczekiwany wynik:** Rekord zapisuje się poprawnie. W bazie widać, że tabela `Skierowania` ma dobrze ustawione klucze obce do pacjenta, lekarza i usługi.

---

# Testy obsługi błędów w aplikacji

Sprawdzamy, jak interfejs reaguje, gdy baza odrzuca jakieś działanie.

* **T-ERR-01: Blokada usunięcia pacjenta z historią leczenia**
  * **Cel:** Weryfikacja działania aplikacji przy błędzie bazy danych (naruszenie kluczy obcych).
  * **Kroki:** W panelu "Pacjenci" próbujemy usunąć pacjenta, który miał już w przeszłości wizyty i ma przypisaną "Historię leczenia".
  * **Oczekiwany wynik:** Baza blokuje usunięcie rekordu. Aplikacja przechwytuje ten błąd i nie zamyka się, tylko wyświetla użytkownikowi w panelu zrozumiały komunikat (np. "Nie można usunąć pacjenta, ponieważ odbył już wizyty").

---

# Testy jednostkowe aplikacji (Unit Tests)

Tsty skupiają się na samym kodzie prototypu. Sprawdzają, czy pojedyncze funkcje, formularze i komponenty interfejsu działają bezbłędnie.

* **T-UNIT-01: Walidacja formularza przed wysłaniem (Frontend)**
  * **Cel:** Sprawdzenie, czy formularz dodawania pacjenta blokuje błędne dane, zanim w ogóle wyśle zapytanie do bazy.
  * **Kroki:** W formularzu "Nowy Pacjent" wpisujemy w pole telefonu litery (np. "abcde") zamiast cyfr i klikamy "Zapisz".
  * **Oczekiwany wynik:** Aplikacja od razu blokuje przycisk, wyświetla pod polem komunikat "Dozwolone są tylko cyfry" i nie obciąża bazy danych niepotrzebnym zapytaniem.

* **T-UNIT-02: Testowanie punktów końcowych API**
  * **Cel:** Weryfikacja, czy serwer aplikacji poprawnie komunikuje się po HTTP.
  * **Kroki:** Skrypt testowy wysyła puste zapytanie `GET` pod adres `/api/lekarze/99999` (zapytanie o nieistniejącego lekarza).
  * **Oczekiwany wynik:** Kod aplikacji poprawnie to obsługuje i zwraca bezpieczny status HTTP `404 Not Found` wraz z pustym obiektem JSON, zamiast wyrzucać krytyczny błąd serwera `500 Internal Server Error`.

* **T-UNIT-03: Poprawne renderowanie panelu (UI)**
  * **Cel:** Sprawdzenie, czy główne menu aplikacji poprawnie się ładuje na podstawie uprawnień.
  * **Kroki:** Uruchomienie testu renderowania dla głównego widoku po zalogowaniu.
  * **Oczekiwany wynik:** Skrypt testowy potwierdza, że wygenerowały się wszystkie wymagane kafelki widoczne na makiecie (Pacjenci, Wizyty, Płatności itp.) i że każdy z nich posiada aktywny link kierujący do odpowiedniego modułu.