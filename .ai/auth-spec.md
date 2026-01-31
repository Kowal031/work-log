# Specyfikacja Techniczna: Moduł Autentykacji Użytkowników

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i szczegóły techniczne implementacji modułu autentykacji (rejestracja, logowanie, wylogowywanie, odzyskiwanie hasła) dla aplikacji WorkLog. Specyfikacja bazuje na wymaganiach zdefiniowanych w pliku `prd.md` oraz stosie technologicznym opisanym w `tech-stack.md`.

**Kluczowe technologie:**
- **Frontend:** Astro (strony i layouty), React (komponenty interaktywne), TailwindCSS (stylizacja).
- **Backend & Auth:** Supabase (Auth, Baza Danych), Astro API Routes.
- **Walidacja:** Zod.

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Strony i Layouty (Astro)

#### 2.1.1. Nowe strony

- **`/login` (`src/pages/login.astro`):** Strona publiczna, dostępna dla niezalogowanych użytkowników. Będzie renderować kliencki komponent React `LoginForm`.
- **`/register` (`src/pages/register.astro`):** Strona publiczna, renderująca kliencki komponent React `RegisterForm`.
- **`/password-recovery` (`src/pages/password-recovery.astro`):** Strona publiczna, renderująca komponent React `PasswordRecoveryForm`.
- **`/update-password` (`src/pages/update-password.astro`):** Strona publiczna, na którą użytkownik jest przekierowywany z linku w mailu. Będzie renderować komponent `UpdatePasswordForm`.

#### 2.1.2. Modyfikacja istniejących stron i layoutów

- **`src/layouts/Layout.astro`:** Główny layout zostanie rozszerzony o logikę warunkowego renderowania elementów nawigacji w zależności od statusu autentykacji użytkownika. Wykorzysta `Astro.locals.session` do weryfikacji sesji po stronie serwera.
  - **Widok dla niezalogowanego:** Wyświetli linki "Zaloguj się" i "Zarejestruj się".
  - **Widok dla zalogowanego:** Wyświetli link do profilu użytkownika i przycisk "Wyloguj".

- **`src/pages/index.astro` i `src/pages/summaries.astro`:** Te strony staną się chronione. Logika weryfikacji sesji zostanie zaimplementowana w middleware Astro. Niezalogowany użytkownik próbujący uzyskać do nich dostęp zostanie przekierowany na stronę `/login`.

### 2.2. Komponenty (React)

#### 2.2.1. Nowe komponenty formularzy

Wszystkie formularze będą komponentami klienckimi React, aby zapewnić dynamiczną walidację i interakcję bez przeładowywania strony.

- **`src/components/auth/LoginForm.tsx`:**
  - **Pola:** Email, Hasło.
  - **Funkcjonalność:** Walidacja po stronie klienta (np. pustych pól, formatu email), obsługa wysyłki formularza do endpointu API `/api/auth/login`, wyświetlanie komunikatów o błędach (np. "Nieprawidłowe dane logowania").
  - **Nawigacja:** Po pomyślnym zalogowaniu, przekierowanie na stronę główną (`/`).

- **`src/components/auth/RegisterForm.tsx`:**
  - **Pola:** Email, Hasło, Potwierdź Hasło.
  - **Funkcjonalność:** Walidacja (format email, minimalna długość hasła, zgodność haseł), obsługa wysyłki do `/api/auth/register`, wyświetlanie błędów (np. "Użytkownik o tym adresie email już istnieje").
  - **Nawigacja:** Po pomyślnej rejestracji, przekierowanie na stronę główną (`/`).

- **`src/components/auth/PasswordRecoveryForm.tsx`:**
  - **Pola:** Email.
  - **Funkcjonalność:** Walidacja formatu email, wysyłka do `/api/auth/password-recovery`. Wyświetlanie komunikatu o powodzeniu (np. "Jeśli konto istnieje, link do resetu hasła został wysłany.").

- **`src/components/auth/UpdatePasswordForm.tsx`:**
  - **Pola:** Nowe Hasło, Potwierdź Nowe Hasło.
  - **Funkcjonalność:** Walidacja (długość i zgodność haseł), wysyłka do `/api/auth/update-password`. Token do zmiany hasła będzie pobierany z parametrów URL po stronie klienta.
  - **Nawigacja:** Po pomyślnej zmianie hasła, przekierowanie na stronę logowania (`/login`).

#### 2.2.2. Modyfikacja komponentów nawigacji

- **`src/components/layout/TopNavigationBar.tsx`:** Komponent zostanie zmodyfikowany, aby przyjmować `props` z informacją o statusie zalogowania i danych użytkownika (np. `user: { email: string } | null`). Na tej podstawie będzie renderować odpowiednie linki i przycisk wylogowania.
- **`src/components/auth/LogoutButton.tsx`:** Nowy, prosty komponent kliencki, który po kliknięciu będzie wysyłał żądanie POST do `/api/auth/logout`, a następnie odświeżał stronę lub przekierowywał na `/login`.

### 2.3. Scenariusze i walidacja

- **Walidacja po stronie klienta:** Błyskawiczna informacja zwrotna dla użytkownika dzięki hookom React (np. `react-hook-form`) zintegrowanym z `zod`.
- **Walidacja po stronie serwera:** Ostateczna weryfikacja w endpointach API przy użyciu tych samych schematów `zod`.
- **Komunikaty błędów:** Błędy zwracane z API (np. 400, 401, 409) będą przechwytywane w komponentach React i wyświetlane użytkownikowi w przyjaznej formie (np. pod odpowiednim polem formularza lub jako globalny alert).

## 3. Logika Backendowa (Astro API & Supabase)

### 3.1. Middleware

- **`src/middleware/index.ts`:** Centralny punkt logiki autentykacji.
  - **Ochrona stron:** Middleware będzie sprawdzać `Astro.cookies` w poszukiwaniu tokena sesji Supabase.
  - **Weryfikacja sesji:** Użyje `supabase.auth.getSessionFromCookie()` do weryfikacji sesji. Wynik (sesja i użytkownik) zostanie zapisany w `Astro.locals`, aby był dostępny w layoutach i stronach (`Astro.locals.session`, `Astro.locals.user`).
  - **Przekierowania:** Jeśli użytkownik próbuje uzyskać dostęp do chronionej ścieżki (np. `/`, `/summaries`) bez aktywnej sesji, zostanie przekierowany na `/login`. Jeśli zalogowany użytkownik wejdzie na `/login` lub `/register`, zostanie przekierowany na `/`.
  - **Obsługa callbacku OAuth:** Middleware będzie również odpowiedzialne za obsługę `code` zwracanego przez Supabase po udanej autentykacji (np. z linku w mailu), wymianę go na sesję i zapisanie jej w cookies.

### 3.2. Endpointy API (`src/pages/api/auth/`)

Wszystkie endpointy będą miały `export const prerender = false;`.

- **`POST /api/auth/register.ts`:**
  - **Model danych (Request Body):** `{ email: string, password: string }`.
  - **Walidacja:** Użycie schemy `zod` do walidacji `email` i `password`.
  - **Logika:** Wywołanie `supabase.auth.signUp()`. W przypadku sukcesu, Supabase automatycznie wyśle email weryfikacyjny. Endpoint zwróci status 200. W przypadku błędu (np. użytkownik istnieje), zwróci odpowiedni status HTTP (np. 409 Conflict).

- **`POST /api/auth/login.ts`:**
  - **Model danych:** `{ email: string, password: string }`.
  - **Walidacja:** Schema `zod`.
  - **Logika:** Wywołanie `supabase.auth.signInWithPassword()`. W przypadku sukcesu, endpoint użyje `Astro.cookies.set()` do ustawienia ciasteczek sesji zwróconych przez Supabase. Zwróci status 200. W przypadku błędu, zwróci 401 Unauthorized.

- **`POST /api/auth/logout.ts`:**
  - **Logika:** Wywołanie `supabase.auth.signOut()`. Następnie usunięcie ciasteczek sesji za pomocą `Astro.cookies.delete()`. Zwróci status 200.

- **`POST /api/auth/password-recovery.ts`:**
  - **Model danych:** `{ email: string }`.
  - **Walidacja:** Schema `zod`.
  - **Logika:** Wywołanie `supabase.auth.resetPasswordForEmail()`. Endpoint zawsze zwróci 200, aby uniemożliwić enumerację użytkowników.

- **`POST /api/auth/update-password.ts`:**
  - **Model danych:** `{ password: string, token: string }`.
  - **Walidacja:** Schema `zod`.
  - **Logika:** Token zostanie przekazany z klienta. Endpoint najpierw zweryfikuje token, a następnie użyje `supabase.auth.updateUser()` do ustawienia nowego hasła.

### 3.3. Renderowanie Server-Side

- **`astro.config.mjs`:** Należy upewnić się, że `output` jest ustawiony na `server` lub `hybrid`, aby umożliwić renderowanie po stronie serwera i działanie middleware.

## 4. System Autentykacji (Integracja z Supabase)

- **Konfiguracja Supabase:** Klucze `SUPABASE_URL` i `SUPABASE_PUBLIC_KEY` muszą być skonfigurowane jako zmienne środowiskowe w Astro (`.env`).
- **Klient Supabase:** Istniejący plik `src/db/supabase.client.ts` będzie używany do tworzenia instancji klienta Supabase. W kontekście serwerowym (middleware, API routes), należy tworzyć klienta, który może operować na cookies (`createSupabaseServerClient`).
- **Powiązanie danych:** Zgodnie z `F-01`, wszystkie encje (zadania, wpisy czasowe) w bazie danych Supabase muszą mieć kolumnę `user_id` (typu `uuid`), która będzie kluczem obcym do tabeli `auth.users`.
- **Row Level Security (RLS):** Należy zdefiniować polityki RLS w Supabase, aby zapewnić, że użytkownicy mogą odczytywać i modyfikować tylko własne dane. Podobne polityki muszą zostać utworzone dla wszystkich operacji (UPDATE, DELETE) i wszystkich tabel przechowujących dane użytkownika.

## 5. Podsumowanie kluczowych zmian

1.  **Stworzenie publicznych stron** (`/login`, `/register`, etc.) renderujących formularze React.
2.  **Zabezpieczenie istniejących stron** (`/`, `/summaries`) za pomocą middleware Astro.
3.  **Implementacja centralnego middleware** do zarządzania sesją i przekierowaniami.
4.  **Budowa dedykowanych endpointów API** dla każdej akcji autentykacyjnej, z walidacją `zod`.
5.  **Pełna integracja z Supabase Auth**, włączając w to obsługę sesji w cookies i RLS.
6.  **Modyfikacja UI** w celu dynamicznego dostosowywania nawigacji do statusu zalogowania użytkownika.
7.  **Aktualizacja schematu bazy danych** o pole `user_id` i wdrożenie polityk RLS.
8.  **Konfiguracja Astro** do renderowania po stronie serwera (`output: 'server'`).
