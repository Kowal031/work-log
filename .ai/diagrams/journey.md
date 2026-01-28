<user_journey_analysis>
1) Ścieżki użytkownika (na podstawie PRD i specyfikacji autentykacji):
- Wejście do aplikacji jako niezalogowany.
- Próba wejścia na obszary chronione (strona główna, podsumowania) → przekierowanie do logowania.
- Logowanie (formularz logowania → walidacja → powodzenie/błąd → przekierowanie na stronę główną).
- Rejestracja (formularz rejestracji → walidacja → utworzenie konta → wysłanie maila weryfikacyjnego → przekierowanie na stronę główną).
- Odzyskiwanie hasła (formularz odzyskiwania → potwierdzenie wysyłki maila → link w wiadomości → strona aktualizacji hasła → zmiana hasła → powrót do logowania).
- Wylogowanie (przycisk wylogowania → powrót do logowania lub strony publicznej).

2) Główne podróże i odpowiadające stany:
- Podróż niezalogowanego użytkownika: StronaLogowania, StronaRejestracji, StronaOdzyskiwaniaHasla.
- Podróż logowania: FormularzLogowania → WalidacjaDanych → PróbaUwierzytelnienia → Zalogowany → StronaGlowna.
- Podróż rejestracji: FormularzRejestracji → WalidacjaDanych → UtworzenieKonta + WyslanieMaila (równolegle) → (opcjonalnie) WeryfikacjaEmail → Zalogowany → StronaGlowna.
- Podróż odzyskiwania: FormularzOdzyskiwania → PotwierdzenieWysylki → LinkEmail → StronaAktualizacjiHasla → WalidacjaNowegoHasla → HasloZmienione → StronaLogowania.
- Dostęp do funkcji po zalogowaniu: StronaGlowna, WidokPodsumowan, Nawigacja, Wylogowanie.

3) Punkty decyzyjne i alternatywne ścieżki:
- if_sesja: czy użytkownik ma ważną sesję (middleware, cookies) → tak: dostęp do obszarów chronionych, nie: przekierowanie do logowania.
- if_dane_logowania: poprawność danych logowania → tak: zalogowany, nie: błąd logowania i pozostanie na formularzu.
- if_rejestracja_poprawna: czy dane i konto są poprawne/unikalne → tak: konto utworzone, nie: komunikat o konflikcie (np. email istnieje).
- if_token_email: weryfikacja tokenu w linku mailowym (rejestracja/OAuth) → poprawny: sesja aktywna i powrót do aplikacji, błędny: komunikat o błędnym/nieaktualnym linku.
- if_token_reset: weryfikacja tokenu resetu hasła → poprawny: można ustawić nowe hasło, błędny: komunikat o błędzie i powrót do odzyskiwania.

4) Krótkie opisy stanów:
- StronaLogowania: dostępny formularz logowania oraz linki do rejestracji/odzyskiwania.
- FormularzLogowania: wprowadzenie e-mail/hasła, walidacja, wysłanie.
- BladLogowania: prezentacja błędu (np. nieprawidłowe dane) i możliwość ponownej próby.
- StronaRejestracji: dostępny formularz rejestracji.
- FormularzRejestracji: e-mail, hasło, potwierdzenie; walidacja, wysłanie.
- KontoUtworzone: konto poprawnie utworzone, mail weryfikacyjny wysłany.
- WeryfikacjaEmail: użytkownik otwiera link weryfikacyjny z maila.
- StronaOdzyskiwaniaHasla: formularz wprowadzenia e-maila do resetu.
- PotwierdzenieWysylki: informacja o wysłaniu maila z instrukcjami.
- StronaAktualizacjiHasla: formularz ustawienia nowego hasła.
- HasloZmienione: sukces zmiany hasła; przejście do logowania.
- StronaGlowna: główny widok (dashboard), dostępny po zalogowaniu.
- WidokPodsumowan: widok dziennych podsumowań; wymaga zalogowania.
- Wylogowany: brak sesji, powrót do logowania/stron publicznych.
</user_journey_analysis>

<mermaid_diagram>

```mermaid
stateDiagram-v2

[*] --> Wejscie

state "Autentykacja" as Autentykacja {
  [*] --> StronaPubliczna
  StronaPubliczna --> StronaLogowania: Przejście do logowania
  StronaPubliczna --> StronaRejestracji: Przejście do rejestracji
  StronaPubliczna --> StronaOdzyskiwaniaHasla: Przejście do odzyskiwania

  state "Logowanie" as Logowanie {
    [*] --> FormularzLogowania
    FormularzLogowania --> WalidacjaDanych: Wyślij formularz
    state if_dane_logowania <<choice>>
    WalidacjaDanych --> if_dane_logowania
    if_dane_logowania --> Zalogowany: Dane poprawne
    if_dane_logowania --> BladLogowania: Dane błędne
    BladLogowania --> FormularzLogowania: Spróbuj ponownie
  }

  state "Rejestracja" as Rejestracja {
    [*] --> FormularzRejestracji
    FormularzRejestracji --> WalidacjaRejestracji: Wyślij formularz
    state if_rejestracja_poprawna <<choice>>
    WalidacjaRejestracji --> if_rejestracja_poprawna

    state fork_reg <<fork>>
    state join_reg <<join>>

    if_rejestracja_poprawna --> fork_reg: Dane poprawne
    if_rejestracja_poprawna --> BladRejestracji: Konflikt lub błąd
    BladRejestracji --> FormularzRejestracji: Popraw dane

    fork_reg --> KontoUtworzone
    fork_reg --> WyslanieMailaWeryfikacyjnego
    KontoUtworzone --> join_reg
    WyslanieMailaWeryfikacyjnego --> join_reg

    join_reg --> WeryfikacjaEmail: Użytkownik klika w link z maila

    state if_token_email <<choice>>
    WeryfikacjaEmail --> if_token_email
    if_token_email --> Zalogowany: Token poprawny
    if_token_email --> BladLinku: Token błędny/nieaktualny
    BladLinku --> StronaLogowania: Wróć do logowania
  }

  state "Odzyskiwanie Hasła" as Odzyskiwanie {
    [*] --> FormularzOdzyskiwania
    FormularzOdzyskiwania --> PotwierdzenieWysylki: Wyślij e-mail
    PotwierdzenieWysylki --> StronaAktualizacjiHasla: Link z maila

    StronaAktualizacjiHasla --> WalidacjaNowegoHasla: Wyślij nowe hasło
    state if_token_reset <<choice>>
    WalidacjaNowegoHasla --> if_token_reset
    if_token_reset --> HasloZmienione: Token poprawny
    if_token_reset --> BladAktualizacji: Token błędny/hasło niepoprawne
    BladAktualizacji --> StronaOdzyskiwaniaHasla: Spróbuj ponownie

    HasloZmienione --> StronaLogowania: Przejdź do logowania
  }
}

state "Dostęp do aplikacji" as Aplikacja {
  [*] --> SprawdzenieSesji
  state if_sesja <<choice>>
  SprawdzenieSesji --> if_sesja
  if_sesja --> StronaGlowna: Sesja aktywna
  if_sesja --> StronaLogowania: Sesji brak (przekierowanie)

  StronaGlowna --> WidokPodsumowan: Przejdź do podsumowań
  WidokPodsumowan --> StronaGlowna: Powrót do głównego widoku

  StronaGlowna --> Wylogowanie: Klik przycisku Wyloguj
  Wylogowanie --> Wylogowany
  Wylogowany --> StronaLogowania
}

Wejscie --> Autentykacja
Zalogowany --> Aplikacja: Przekierowanie po sukcesie
StronaLogowania --> Logowanie
StronaRejestracji --> Rejestracja
StronaOdzyskiwaniaHasla --> Odzyskiwanie

note right of FormularzLogowania
  Użytkownik wprowadza e-mail i hasło.
  Link do odzyskiwania hasła dostępny.
end note

note right of FormularzRejestracji
  Pola: e-mail, hasło, potwierdzenie hasła.
  Walidacja i informacja o konieczności weryfikacji e-mail.
end note

note right of PotwierdzenieWysylki
  Zawsze komunikat sukcesu, bez ujawniania istnienia konta.
end note

```

</mermaid_diagram>
