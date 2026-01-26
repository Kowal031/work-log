# Podsumowanie sesji planowania interfejsu użytkownika

## Decyzje

### Struktura główna i nawigacja
1. Dashboard będzie jednym widokiem łączącym listę zadań i aktywny timer
2. Kalendarz i podsumowania będą osobną stroną (routing: `/` dla dashboard, `/summaries` dla podsumowań)
3. Top nav bar z: Logo, linkami "Dashboard" | "Podsumowania", przyciskiem Logout (bez user menu w MVP)
4. Aktywny task wyświetla się na samej górze z timerem w sticky layout, pozostałe taski w scrollowalnej liście poniżej
5. Przy uruchomieniu timera - automatyczny scroll na górę do aktywnego taska

### Zarządzanie zadaniami (Tasks)
6. Task item zawiera: nazwę zadania, total time (suma sesji), status indicator (pulsujący zielony dot + live counter dla aktywnego), przyciski akcji (Start/Stop/Pause, Edit, Complete)
7. Na dashboard wyświetlane są tylko aktywne taski (ukończone widoczne tylko w Summaries w kontekście dnia)
8. Przycisk "Complete" disabled gdy task ma aktywny timer, wymaga confirmation dialog przed archiwizacją
9. Formularz tworzenia zadania jako modal z prostym formularzem (nazwa required, opis optional)

### Timer i tracking czasu
10. Live counter aktualizujący się co sekundę (format HH:MM:SS), jeden interval dla całej aplikacji
11. Instant UI feedback przy Start/Stop (przycisk zmienia stan, counter startuje) + subtle loading indicator podczas request, rollback + toast w przypadku błędu
12. Status "paused": frozen elapsed time + badge "PAUZA" + text "wstrzymano o [HH:MM]", przycisk "Wznów" prominent
13. Aplikacja prewentywnie blokuje przyciski "Start" dla innych zadań gdy jeden timer jest aktywny (disabled + tooltip)
14. W przypadku konfliktu 409: modal z informacją o aktywnym timerze i opcją "Przejdź do aktywnego zadania" lub "Zatrzymaj aktywny timer i rozpocznij nowy"

### Modal przywracania (nieoczekiwane zamknięcie)
15. Modal blokujący z trzema przyciskami: "Zapisz cały czas", "Odrzuć czas od zamknięcia", "Skoryguj ręcznie"
16. Modal przywracania pokazuje dokładny upłynięty czas z ostrzeżeniem jeśli >12h (format "2d 3h 15m" dla długich czasów)
17. "Skoryguj ręcznie" zamyka modal przywracania i otwiera standardowy modal edycji z pre-wybranym ostatnim wpisem czasowym
18. Potwierdzenie o niezmienionym czasie tylko dla przepływu "Skoryguj ręcznie" - jeśli użytkownik nie wprowadzi zmian: "Nie wprowadzono zmian. Oryginalny czas zostanie zapisany. Kontynuować?"

### Edycja i zarządzanie sesjami
19. Edycja sesji czasowych w osobnym modalu lub side drawer (nie inline)
20. Modal edycji zadania: single scrollable view z sekcjami "Szczegóły zadania" i "Historia sesji"
21. W rozwiniętej liście sesji tylko edit icon otwierający modal, delete dostępny w tym modalu jako secondary destructive action z confirmation

### Podsumowania (Summaries)
22. Domyślnie: podsumowanie dzisiejszego dnia
23. Na górze: date picker (Shadcn/ui Popover + Calendar) + quick navigation "← Poprzedni dzień" | "Dziś" | "Następny dzień →"
24. Grand total jako prominent header card (Hero section) z dużą liczbą total time, subtitle z datą
25. Lista tasków dla danego dnia (bo w jeden dzień mogliśmy pracować nad więcej niż jednym taskiem)
26. Kliknięcie w task rozwija (collapsible) listę sesji z timestamps "09:30 - 11:45 (2h 15m)" + edit icon
27. Przycisk "+ Dodaj czas ręcznie" na górze podsumowania

### Wdrażanie użytkownika i puste stany
28. Minimalistyczne puste stany z wyraźnym wezwaniem do działania: ilustracja + tekst "Rozpocznij trackowanie czasu" + przycisk "Utwórz pierwsze zadanie"

### Buforowanie i wydajność
29. Brak localStorage/IndexedDB dla MVP - poleganie na nagłówkach cache HTTP z API i stanie React dla bieżącej sesji
30. Brak skrótów klawiszowych dla MVP (mogą konfliktować z polami wejściowymi)

## Dopasowane rekomendacje

### Układ i struktura
1. **Sticky timer widget na górze, scrollowalna lista zadań** - Aktywny task na górze w sticky layout z prominentnym timerem, pozostałe taski w scrollowalnej liście. Automatyczne przewinięcie do aktywnego taska przy starcie.

2. **Routing: Dashboard (/) + Summaries (/summaries)** - Dwa główne widoki z jasną strukturą nawigacji. Top nav bar z linkami, Logo po lewej, Logout po prawej.

3. **Task item z pełnym kontekstem** - Nazwa, total time, status indicator (pulsujący zielony dot + live counter dla aktywnego), przyciski akcji (Start/Stop/Pause, Edit, Complete). Shadcn/ui Card, flex layout, ikony z Lucide React.

### Timer i interaktywność
4. **Live counter z setInterval** - Aktualizacja co sekundę (HH:MM:SS), jeden interval dla całej aplikacji dla performance. Prominentne umieszczenie w sticky header.

5. **Instant UI feedback + loading indicator** - Kompromis między optimistic updates a KISS: instant zmiana stanu UI + subtle spinner podczas request, rollback + toast w przypadku błędu.

6. **Prewencyjne blokowanie Start buttons** - Disabled state dla innych tasków gdy jeden timer aktywny, tooltip wyjaśniający. Modal z opcjami przy konflikcie 409.

### Okna modalne i dialogi
7. **Blokujący modal przywracania** - Trzy wyraźne przyciski akcji, wymuszająca decyzję. Dokładny upłynięty czas z ostrzeżeniem dla >12h. Format "2d 3h 15m" dla długich czasów.

8. **Sekwencyjny przepływ dla "Skoryguj ręcznie"** - Zamknięcie modalu przywracania, otwarcie standardowego modalu edycji z pre-wybranym wpisem. Potwierdzenie tylko jeśli użytkownik nie wprowadzi zmian.

9. **Modal tworzenia zadania** - Dialog z Shadcn/ui, prosty formularz (nazwa wymagana, opis opcjonalny), przyciski Anuluj/Utwórz.

10. **Modal edycji zadania** - Pojedynczy przewijalny widok z sekcjami "Szczegóły" i "Historia sesji", Shadcn/ui Dialog ze Scroll Area.

### Podsumowania i historia
11. **Hybrydowe podejście dla podsumowań** - Domyślnie dzisiejszy dzień, wybór daty na górze, szybka nawigacja (Poprzedni/Dziś/Następny).

12. **Suma całkowita jako karta hero** - Wyróżniona karta nagłówkowa z dużą liczbą całkowitego czasu, podtytuł z datą, może być pasek postępu lub wskaźnik wizualny.

13. **Zwijana lista sesji** - Kliknięcie w zadanie rozwija listę sesji ze znacznikami czasu i czasem trwania, ikona edycji dla każdej sesji otwierająca modal.

### Bezpieczeństwo i walidacja
14. **Przycisk ukończenia z walidacją** - Wyłączony gdy timer aktywny (podpowiedź: "Zatrzymaj timer przed ukończeniem"), dialog potwierdzenia przed archiwizacją.

15. **Edycja/usuwanie przez modal** - Tylko ikona edycji otwierająca modal (nie bezpośrednio), usuwanie w modalu jako drugorzędna destrukcyjna akcja z potwierdzeniem.

### Uproszczenie dla MVP
16. **Brak cache po stronie klienta** - Nagłówki cache HTTP + stan React/Context dla bieżącej sesji. Zasada KISS, eliminacja problemów z synchronizacją.

17. **Tylko aktywne zadania na pulpicie** - Ukończone widoczne tylko w Podsumowaniach. Opcjonalny przełącznik "Pokaż ukończone" na dole listy.

18. **Puste stany z wezwaniem do działania** - Minimalistyczne: ilustracja + tekst + przycisk "Utwórz pierwsze zadanie". Shadcn/ui Card z ikoną z Lucide React.

19. **Brak skrótów klawiszowych** - Mogą konfliktować z polami wejściowymi. Skupienie na przejrzystym, klikalnym interfejsie. Nawigacja Tab i stany fokusa dla dostępności (wbudowane w Shadcn/ui).

## Podsumowanie planowania architektury interfejsu użytkownika

### Główna struktura aplikacji

**Routing i nawigacja:**
- `/` - Dashboard (główny widok z listą zadań i aktywnym timerem)
- `/summaries` - Podsumowania (kalendarz + historia pracy)
- `/auth/login`, `/auth/register` - Strony autoryzacji

**Górny pasek nawigacji:**
- Logo (lewy górny, link do Pulpitu)
- Linki nawigacyjne: "Pulpit" | "Podsumowania" (centrum/lewa-centrum)
- Przycisk wylogowania (prawy górny, przycisk ikonowy lub link tekstowy)
- Mobile: menu hamburger z szufladą
- Stan aktywny dla bieżącej strony (podkreślenie lub tło)
- Wykorzystanie wariantów przycisków Shadcn/ui

### Widok pulpitu (`/`)

**Główny układ:**
- **Karta aktywnego zadania (przyklejona na górze):**
  - Wyróżniony licznik czasu z odświeżaniem na żywo (HH:MM:SS, aktualizacja co sekundę)
  - Nazwa zadania i całkowity czas
  - Wskaźnik statusu: pulsująca zielona kropka
  - Przyciski akcji: Pauza, Stop (wyraźnie widoczne)
  - Opcjonalnie: podział ekranu na sekcję aktywnego zadania i listę pozostałych
  - Automatyczne przewijanie do tej sekcji przy starcie timera

- **Lista zadań (przewijalna):**
  - Lista aktywnych zadań (ukończone nie są wyświetlane)
  - Każda karta zadania zawiera:
    - Nazwę zadania
    - Całkowity czas (suma wszystkich sesji)
    - Wskaźnik statusu (dla aktywnego: pulsująca zielona kropka + licznik na żywo)
    - Przyciski akcji: Start, Edytuj, Ukończ
  - Układ: karta Shadcn/ui, układ flex, ikony z Lucide React
  - Mobile: widok kompaktowy ze zwiniętymi akcjami (menu rozwijane)
  - Kolejność chronologiczna (najnowsze na górze, z wyjątkiem aktywnego który jest przyklejony)

- **Stan pusty:**
  - Gdy brak zadań: ilustracja + tekst "Rozpocznij trackowanie czasu" + przycisk "Utwórz pierwsze zadanie"
  - Karta Shadcn/ui z ikoną z Lucide React

- **Pływający przycisk akcji:**
  - "+ Nowe zadanie" (mobile: FAB, desktop: wyróżniony przycisk na górze listy)
  - Otwiera modal tworzenia zadania

**Funkcjonalność timera:**
- Licznik na żywo aktualizowany co sekundę (jeden setInterval dla całej aplikacji)
- Natychmiastowa reakcja interfejsu przy Start/Stop z subtelnym wskaźnikiem ładowania podczas żądania API
- W przypadku błędu: wycofanie + powiadomienie toast
- Stan "Wstrzymany": zamrożony upłynięty czas + odznaka "PAUZA" + tekst "wstrzymano o [HH:MM]" + przycisk "Wznów"
- Prewencyjne blokowanie: wyłączony stan dla przycisków Start innych zadań gdy jedno jest aktywne (wyjaśniająca podpowiedź)

**Stan globalny:**
- Stan aktywnego timera zarządzany globalnie (React Context API lub Zustand)
- Synchronizacja z `/api/tasks/active-timer` przy starcie aplikacji

### Widok podsumowań (`/summaries`)

**Układ:**
- **Karta hero (nagłówek):**
  - Suma całkowita: duża liczba z całkowitym czasem (np. "8h 45m")
  - Podtytuł: "Przepracowano [data]"
  - Opcjonalnie: pasek postępu lub wskaźnik wizualny (np. cel dzienny 8h)
  - Karta Shadcn/ui z obramowaniem/tłem akcentującym

- **Nawigacja dat (górna sekcja):**
  - Wybór daty: Shadcn/ui Popover + komponent Calendar
  - Szybka nawigacja: "← Poprzedni dzień" | "Dziś" | "Następny dzień →"
  - Domyślnie: dzisiejszy dzień
  - Opcjonalnie: mini pasek boczny kalendarza z wyróżnionymi datami (dni z danymi)

- **Lista podsumowania zadań:**
  - Lista zadań dla wybranego dnia z całkowitym czasem na zadanie
  - Kliknięcie w zadanie rozwija (Shadcn/ui Collapsible) listę sesji
  - Każda sesja: "09:30 - 11:45 (2h 15m)" + ikona edycji
  - Ikona edycji otwiera modal edycji sesji
  - Mobile: może być domyślnie rozwinięte dla dostępności

- **Szybkie akcje:**
  - Przycisk "+ Dodaj czas ręcznie" na górze (szybki ręczny wpis)
  - Otwiera modal z formularzem dodawania sesji

- **Stopka:**
  - Powtórzenie sumy dla długich list (opcjonalnie)

### Okna modalne i dialogi

**1. Modal tworzenia zadania:**
- Dialog Shadcn/ui
- Prosty formularz: pole wprowadzania dla nazwy (wymagane) + pole tekstowe dla opisu (opcjonalne)
- Przyciski: Anuluj / Utwórz
- Uruchamiany przez FAB lub przycisk "+ Nowe zadanie"

**2. Modal edycji zadania:**
- Dialog Shadcn/ui z Scroll Area
- Pojedynczy przewijalny widok z sekcjami (oddzielone Separatorem Shadcn/ui):
  - Sekcja "Szczegóły zadania": nazwa, opis (edytowalne tylko gdy timer nieaktywny)
  - Sekcja "Historia sesji": lista wszystkich wpisów czasowych dla tego zadania
- Każda sesja z ikoną edycji
- Mobile: modal pełnoekranowy (sheet) z natywnym przewijaniem

**3. Modal edycji sesji czasowej:**
- Formularz z polami: czas_rozpoczęcia, czas_zakończenia
- Walidacja: czas_zakończenia > czas_rozpoczęcia
- Przycisk "Usuń sesję" na dole (drugorzędna destrukcyjna akcja)
- Usuwanie z potwierdzeniem: "Czy na pewno usunąć tę sesję? Tego nie można cofnąć."

**4. Modal przywracania (nieoczekiwane zamknięcie):**
- Modal blokujący (Dialog alertu Shadcn/ui)
- Pokazuje dokładny upłynięty czas
- Ostrzeżenie jeśli >12h: "⚠️ Timer był aktywny przez 48h 23m. Czy to jest poprawne?"
- Format dla długich czasów: "2d 3h 15m"
- Trzy wyraźne przyciski:
  - "Zapisz cały czas" (działa natychmiastowo)
  - "Odrzuć czas od zamknięcia" (działa natychmiastowo)
  - "Skoryguj ręcznie" (otwiera modal edycji)

**5. Potwierdzenie dla "Skoryguj ręcznie":**
- Jeśli użytkownik nie wprowadzi zmian i próbuje zamknąć modal edycji:
- Dialog: "Nie wprowadzono zmian. Oryginalny czas zostanie zapisany. Kontynuować?"
- Opcje: "Wróć do edycji" / "Zapisz oryginalny czas"

**6. Potwierdzenie dla ukończenia:**
- Gdy timer nieaktywny, kliknięcie Ukończ:
- Dialog: "Czy na pewno chcesz oznaczyć jako ukończone? Zadanie zostanie zarchiwizowane."
- Przyciski: Anuluj / Potwierdź
- Po potwierdzeniu: zadanie znika z listy z animacją zanikania

**7. Modal konfliktu (409):**
- Gdy mimo prewencji wystąpi konflikt aktywnych timerów:
- Dialog: "Inny timer jest już aktywny"
- Opcje: "Przejdź do aktywnego zadania" / "Zatrzymaj aktywny timer i rozpocznij nowy"

### Responsywność i urządzenia mobilne

**Punkty przerwania (Tailwind):**
- Mobilne: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Adaptacje mobilne:**
- Górny pasek nawigacji: menu hamburger z szufladą
- Lista zadań: widok kompaktowy ze zwiniętymi akcjami (menu rozwijane)
- Widget timera: może być zwinięty do ikony z czasem
- Okna modalne: arkusze pełnoekranowe dla lepszego UX
- Kalendarz: zwijana/rozwijalna szuflada
- Podsumowania: rozwinięta lista sesji domyślnie dla dostępności

**Optymalizacje desktopowe:**
- Pasek boczny z kalendarzem (opcjonalnie w Podsumowaniach)
- Stany najechania dla elementów interaktywnych
- Nawigacja klawiaturą ze stanami fokusa
- Większe obszary klikalne

### Dostępność i wymagania interfejsu użytkownika

**Wymagane funkcje:**
- Semantyczny HTML (main, nav, section, article)
- Punkty orientacyjne ARIA dla czytników ekranu
- Stany fokusa dla wszystkich elementów interaktywnych (wbudowane w Shadcn/ui)
- Wsparcie nawigacji Tab
- aria-label dla przycisków ikonowych
- aria-expanded dla sekcji zwijanych
- Kontrast kolorów zgodnie z WCAG AA
- Stany ładowania z regionami aria-live dla czytników ekranu
- Komunikaty błędów z aria-describedby dla formularzy
- Komponenty interfejsu (Shadcn/ui)
- Ikony (ikony Lucide React)
- Warstwa wizualna (Tailwind 4)
