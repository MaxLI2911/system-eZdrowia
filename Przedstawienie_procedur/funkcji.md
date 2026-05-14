# Przedstawienie części procedur/funkcji składowanych bazy danych, które zostaną opracowane. 

## Zarządzanie wizytami i konsultacjami  
Te procedury obsługują cykl życia wizyty lekarskiej, w tym teleporad.   

`umow_wizyte(p_id_pacjenta, p_id_lekarza, p_data, p_godzina, p_typ)`:  
Tworzy nowy wpis w tabeli `Wizyty`.  
Sprawdza dostępność lekarza w danym terminie.  
Jeśli typem jest "teleporada", automatycznie inicjuje wpis w tabeli `Teleporady`. 

`zrealizuj_wizyte(p_id_wizyty, p_opis_lekarski)`:  
Zmienia status wizyty na "zrealizowana".  
Automatycznie dodaje wpis do tabeli `Historie leczenia` powiązanej z pacjentem.

`anuluj_wizyte(p_id_wizyty)`:  
Zmienia status wizyty na "anulowana".  
Zwalnia termin w kalendarzu lekarza i (opcjonalnie) generuje informację o zwrocie w tabeli `Płatności`.  

## Obsługa dokumentacji medycznej 
Zapewnienie sprawnego wystawiania dokumentów podczas wizyty.  

`wystaw_recepte(p_id_wizyty, p_lista_lekow)`:  
Tworzy nagłówek w tabeli `Recepty` z aktualną datą.  
Dla każdego leku z listy dodaje rekord do tabeli `Pozycje recept`, określając dawkę i ilość.  

`wystaw_skierowanie(p_id_pacjenta, p_id_lekarza, p_opis)`:  
Generuje nowe skierowanie z unikalnym identyfikatorem.  
Powiązuje dokument z konkretnym pacjentem i lekarzem wystawiającym.

## Rozliczenia i płatności
Automatyzacja finansowej strony usług medycznych.  

`generuj_platnosc_za_wizyte(p_id_wizyty)`:  
Pobiera cenę z tabeli `Usługi` przypisanej do danej wizyty.  
Tworzy rekord w tabeli `Płatności` ze statusem "oczekująca".  

`potwierdz_oplate(p_id_platnosci, p_metoda)`:  
Aktualizuje status płatności na "opłacona" i zapisuje datę transakcji.  

## Funkcje analityczne i pomocnicze
Zgodnie z zapotrzebowaniem na funkcje raportowe.  

`fn_czy_lekarz_dostepny(p_id_lekarza, p_data, p_godzina)`:  
Zwraca wartość logiczną (true/false) sprawdzając, czy lekarz nie ma innej wizyty w tym samym czasie.

`fn_pobierz_historie_pacjenta(p_id_pacjenta)`:  
Zwraca sformatowany zbiór danych zawierający wszystkie przebyte wizyty, rozpoznania oraz wystawione recepty dla danego pacjenta.  

`fn_raport_oblozenia_przychodni(p_id_przych, p_data_od, p_data_do)`:  
Oblicza liczbę zrealizowanych wizyt w danej placówce w zadanym okresie.  

## Bezpieczeństwo i administracja  
`zarejestruj_uzytkownika(p_login, p_haslo, p_rola)`:  
Tworzy konto w tabeli `Użytkowniki`.  
W zależności od roli (np. "Pacjent", "Lekarz"), wymusza utworzenie odpowiedniego profilu w powiązanych tabelach.