Jasne, oto zaktualizowana wersja planu testów z dodaną kolumną "Narzędzia / Metody" w tabeli w sekcji 3.

---

# Plan Testów dla Aplikacji WorkLog

---

## 1. Wprowadzenie i Cele Testowania

### 1.1 Wprowadzenie
Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji **WorkLog**, narzędzia do zarządzania zadaniami i śledzenia czasu pracy. Aplikacja oparta jest na nowoczesnym stosie technologicznym, w skład którego wchodzą Astro, React, TypeScript oraz Supabase jako backend. Celem planu jest zapewnienie najwyższej jakości, niezawodności i bezpieczeństwa aplikacji przed jej wdrożeniem produkcyjnym.

### 1.2 Cele Testowania
Główne cele procesu testowego to:
*   **Weryfikacja funkcjonalności:** Potwierdzenie, że wszystkie funkcje aplikacji działają zgodnie ze specyfikacją, w tym uwierzytelnianie, zarządzanie zadaniami, śledzenie czasu i generowanie podsumowań.
*   **Zapewnienie jakości i niezawodności:** Identyfikacja i eliminacja błędów, aby zapewnić stabilne i bezproblemowe działanie aplikacji.
*   **Walidacja bezpieczeństwa:** Upewnienie się, że dane użytkowników są odpowiednio chronione, a dostęp do zasobów jest ściśle kontrolowany.
*   **Ocena użyteczności (UX/UI):** Sprawdzenie, czy interfejs użytkownika jest intuicyjny, spójny i responsywny na różnych urządzeniach.
*   **Potwierdzenie integralności danych:** Zapewnienie, że wszystkie operacje na danych (tworzenie, modyfikacja, usuwanie) są poprawnie odzwierciedlane w bazie danych.

---

## 2. Zakres Testów

### 2.1 Funkcjonalności w Zakresie Testów
Testom poddane zostaną wszystkie kluczowe moduły i funkcjonalności aplikacji:

*   **Moduł uwierzytelniania:**
    *   Rejestracja nowego użytkownika.
    *   Logowanie i wylogowywanie.
    *   Mechanizm odzyskiwania hasła.
    *   Aktualizacja hasła po odzyskaniu.
    *   Ochrona tras i autoryzacja dostępu do danych.
*   **Moduł Zarządzania Zadaniami (Dashboard):**
    *   Tworzenie, edycja i oznaczanie zadań jako ukończone.
    *   Wyświetlanie listy aktywnych zadań.
    *   Walidacja formularzy (np. długość nazwy, opis).
*   **Moduł Śledzenia Czasu:**
    *   Uruchamianie i zatrzymywanie stopera dla zadań.
    *   Obsługa tylko jednego aktywnego stopera w danym momencie.
    *   Wyświetlanie aktywnego stopera.
    *   Mechanizm odzyskiwania sesji po nieoczekiwanym zamknięciu aplikacji (`RecoveryModal`).
    *   Obsługa przekroczenia 24-godzinnego limitu pracy w ciągu dnia (`CapacityExceededModal`).
*   **Moduł Edycji Sesji Czasowych:**
    *   Wyświetlanie historii sesji dla zadania.
    *   Ręczna edycja czasu rozpoczęcia i zakończenia zarejestrowanej sesji.
    *   Ręczne dodawanie nowych wpisów czasowych.
*   **Moduł Podsumowań:**
    *   Wyświetlanie dziennego podsumowania czasu pracy.
    *   Nawigacja między dniami.
    *   Agregacja danych per zadanie.
*   **Interfejs API:**
    *   Wszystkie punkty końcowe w `src/pages/api/` zostaną przetestowane pod kątem poprawności działania, walidacji danych wejściowych i obsługi błędów.

### 2.2 Funkcjonalności Poza Zakresem Testów
*   Testowanie infrastruktury Supabase (wydajność bazy danych, działanie serwerów).
*   Testowanie zewnętrznych bibliotek i frameworków (np. React, Astro) poza kontekstem ich implementacji w projekcie.
*   Testy penetracyjne wykraczające poza standardową weryfikację autoryzacji.

---

## 3. Typy Testów do Przeprowadzenia

Proces testowania zostanie podzielony na kilka poziomów, aby zapewnić kompleksowe pokrycie.

| Typ Testów | Opis | Odpowiedzialność | Narzędzia / Metody |
| :--- | :--- | :--- | :--- |
| **Testy Jednostkowe** | Weryfikacja pojedynczych funkcji i komponentów w izolacji, zwłaszcza logiki biznesowej w usługach (`services`) i funkcji pomocniczych (`utils`). | Deweloperzy | Vitest, React Testing Library, mockowanie zależności. |
| **Testy Integracyjne** | Testowanie współpracy między modułami: UI -> API Client -> API Endpoint -> Service -> Baza Danych. Skupienie na poprawnym przepływie danych i logiki. | Deweloperzy / Inżynier QA | Vitest, React Testing Library, Mock Service Worker (MSW) do symulacji odpowiedzi API. |
| **Testy End-to-End (E2E)** | Symulacja pełnych scenariuszy użytkownika w przeglądarce, od logowania po generowanie raportu, w celu weryfikacji kompletnych przepływów pracy. | Inżynier QA | Cypress lub Playwright do automatyzacji interakcji w przeglądarce. |
| **Testy API** | Bezpośrednie testowanie punktów końcowych API w celu weryfikacji logiki, schematów odpowiedzi, kodów statusu HTTP, walidacji i obsługi błędów. | Inżynier QA | Postman, Insomnia. Zautomatyzowane skrypty (np. w Cypress). |
| **Testy Manualne (Eksploracyjne)** | Ręczne testowanie aplikacji w celu znalezienia błędów, które mogły zostać pominięte w testach automatycznych, ze szczególnym uwzględnieniem UX/UI. | Inżynier QA | Narzędzia deweloperskie przeglądarki, testowanie ad-hoc, testowanie oparte na scenariuszach. |
| **Testy Bezpieczeństwa** | Weryfikacja, czy użytkownik A nie ma dostępu do danych użytkownika B. Sprawdzanie poprawności działania middleware i zapytań do bazy danych z warunkiem `user_id`. | Inżynier QA | Ręczna weryfikacja żądań API, logowanie na dwa różne konta w dwóch przeglądarkach, analiza kodu. |
| **Testy Kompatybilności** | Sprawdzenie poprawnego działania i wyświetlania aplikacji na różnych przeglądarkach i systemach operacyjnych. | Inżynier QA | Manualne testowanie na różnych przeglądarkach (Chrome, Firefox, Safari), emulacja urządzeń mobilnych. |
| **Testy Regresji** | Uruchamianie zestawu testów automatycznych po każdej zmianie w kodzie, aby upewnić się, że nowe funkcje nie zepsuły istniejących. | Zautomatyzowane (CI/CD) | GitHub Actions, skrypty uruchamiające testy jednostkowe, integracyjne i E2E. |

---

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

Poniżej przedstawiono kluczowe scenariusze testowe, które zostaną rozwinięte w szczegółowe przypadki testowe.

### 4.1 Uwierzytelnianie i Autoryzacja
*   **Rejestracja:** Pomyślna rejestracja z poprawnymi danymi; próba rejestracji z istniejącym e-mailem; walidacja formularza (słabe hasło, niezgodne hasła).
*   **Logowanie:** Pomyślne logowanie z poprawnymi danymi; próba logowania z błędnym hasłem/e-mailem; przekierowanie do panelu po zalogowaniu.
*   **Odzyskiwanie hasła:** Pomyślne wysłanie linku do resetu; obsługa nieistniejącego adresu e-mail; zmiana hasła przy użyciu tokenu z linku.
*   **Autoryzacja:** Próba dostępu do chronionych stron (`/`, `/summaries`) bez zalogowania (oczekiwane przekierowanie); próba wykonania zapytań API jako niezalogowany użytkownik (oczekiwany błąd 401).
*   **Separacja danych:** Użytkownik A po zalogowaniu nie widzi i nie może modyfikować zadań ani wpisów czasowych użytkownika B.

### 4.2 Zarządzanie Zadaniami i Czasem Pracy
*   **Tworzenie zadania:** Pomyślne utworzenie zadania; walidacja formularza (pusta nazwa, zbyt długa nazwa/opis).
*   **Edycja zadania:** Pomyślna edycja nazwy i opisu; próba edycji zadania z aktywnym stoperem (oczekiwany błąd).
*   **Uruchamianie/Zatrzymywanie stopera:** Stoper uruchamia się i poprawnie zlicza czas; próba uruchomienia drugiego stopera, gdy jeden jest już aktywny (oczekiwany błąd); zatrzymanie stopera i zapisanie sesji.
*   **Odzyskiwanie sesji:** Symulacja zamknięcia przeglądarki z aktywnym stoperem; po ponownym otwarciu aplikacji pojawia się modal odzyskiwania; testowanie opcji "Zapisz", "Odrzuć", "Skoryguj ręcznie".
*   **Przekroczenie limitu dziennego:** Ręczna edycja/dodanie wpisu, który powoduje przekroczenie 24h w danym dniu (oczekiwane pojawienie się modala `CapacityExceededModal` i błąd API 400).
*   **Ręczne dodawanie czasu:** Pomyślne dodanie wpisu czasowego; walidacja (czas zakończenia przed czasem rozpoczęcia, czas w przyszłości).

### 4.3 Podsumowania
*   **Wyświetlanie danych:** Poprawne wyświetlanie sumarycznego czasu pracy dla wybranego dnia.
*   **Nawigacja:** Przełączanie między dniem poprzednim, następnym i dzisiejszym.
*   **Agregacja:** Weryfikacja, czy sumy czasów dla poszczególnych zadań oraz suma całkowita są obliczane poprawnie.
*   **Stan pusty:** Poprawne wyświetlanie komunikatu o braku zarejestrowanego czasu w danym dniu.

---

## 5. Środowisko Testowe

*   **Baza danych:** Oddzielny projekt Supabase przeznaczony wyłącznie do celów testowych, z wyizolowanymi danymi.
*   **Aplikacja Frontend/Backend:** Dedykowana instancja aplikacji (staging), wdrożona w środowisku zbliżonym do produkcyjnego (np. Vercel, Netlify).
*   **Przeglądarki:**
    *   **Podstawowe:** Najnowsza wersja Chrome.
    *   **Dodatkowe:** Najnowsze wersje Firefox, Safari, Edge.
*   **Systemy operacyjne:** Windows 11, macOS (najnowsza wersja).
*   **Urządzenia:** Testy responsywności na emulatorach urządzeń mobilnych (np. iPhone 13, Samsung Galaxy S21) oraz na fizycznym urządzeniu (w miarę dostępności).

---

## 6. Narzędzia do Testowania

*   **Testy jednostkowe i integracyjne:** [Vitest](https://vitest.dev/) z [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) do testowania komponentów i usług.
*   **Testy E2E:** [Cypress](https://www.cypress.io/) lub [Playwright](https://playwright.dev/) do automatyzacji scenariuszy użytkownika w przeglądarce.
*   **Testy API:** [Postman](https://www.postman.com/) lub [Insomnia](https://insomnia.rest/) do manualnego i zautomatyzowanego testowania punktów końcowych API.
*   **Zarządzanie testami i błędami:** [Jira](https://www.atlassian.com/software/jira), [Trello](https://trello.com/) lub [GitHub Issues](https://docs.github.com/en/issues) do śledzenia przypadków testowych i raportowania błędów.
*   **Ciągła Integracja (CI/CD):** [GitHub Actions](https://github.com/features/actions) do automatycznego uruchamiania testów regresji po każdym pushu do repozytorium.

---

## 7. Harmonogram Testów

Testowanie będzie procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania.

*   **Testy jednostkowe/integracyjne:** Pisane na bieżąco przez deweloperów w trakcie implementacji nowych funkcji.
*   **Testy E2E/API:** Rozwijane równolegle z developmentem. Pełny cykl testów automatycznych uruchamiany przed każdym wdrożeniem na środowisko staging.
*   **Testy manualne (eksploracyjne):** Przeprowadzane po wdrożeniu nowej funkcjonalności na środowisko staging.
*   **Pełna regresja:** Wykonywana przed każdym wydaniem produkcyjnym.

---

## 8. Kryteria Akceptacji Testów

### 8.1 Kryteria Wejścia (Rozpoczęcia Testów)
*   Funkcjonalność została zaimplementowana i wdrożona na środowisku testowym.
*   Testy jednostkowe i integracyjne napisane przez deweloperów przechodzą pomyślnie.
*   Dostępna jest dokumentacja techniczna dla testowanych funkcji API.

### 8.2 Kryteria Wyjścia (Zakończenia Testów)
*   Wszystkie zaplanowane przypadki testowe zostały wykonane.
*   Pokrycie kodu testami jednostkowymi i integracyjnymi dla krytycznej logiki biznesowej (usługi) wynosi co najmniej 85%.
*   Wszystkie zidentyfikowane błędy krytyczne i blokujące zostały naprawione i zweryfikowane.
*   Brak znanych błędów o wysokim priorytecie w głównych przepływach aplikacji.
*   Raport z testów został przygotowany i zaakceptowany przez interesariuszy projektu.

---

## 9. Role i Odpowiedzialności

*   **Deweloperzy:**
    *   Tworzenie testów jednostkowych i integracyjnych.
    *   Naprawianie błędów zgłoszonych przez zespół QA.
    *   Utrzymanie środowiska CI/CD.
*   **Inżynier QA:**
    *   Projektowanie i implementacja testów E2E oraz testów API.
    *   Wykonywanie testów manualnych i eksploracyjnych.
    *   Raportowanie i weryfikacja błędów.
    *   Tworzenie i utrzymanie planu testów.
    *   Przygotowanie końcowego raportu z testów.
*   **Project Manager / Product Owner:**
    *   Priorytetyzacja błędów.
    *   Podejmowanie decyzji o wydaniu aplikacji na podstawie raportu z testów.

---

## 10. Procedury Raportowania Błędów

Każdy zidentyfikowany błąd zostanie zaraportowany w systemie do śledzenia błędów (np. Jira, GitHub Issues) i będzie zawierał następujące informacje:
*   **Tytuł:** Zwięzły i jednoznaczny opis problemu.
*   **Środowisko:** Wersja aplikacji, przeglądarka, system operacyjny.
*   **Kroki do odtworzenia:** Szczegółowa, ponumerowana lista kroków prowadzących do wystąpienia błędu.
*   **Oczekiwany rezultat:** Co powinno się wydarzyć.
*   **Rzeczywisty rezultat:** Co faktycznie się wydarzyło.
*   **Priorytet/Waga:** Określenie wpływu błędu na działanie aplikacji (np. Krytyczny, Wysoki, Średni, Niski).
*   **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.