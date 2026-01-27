# Architektura UI dla WorkLog

## 1. Przegląd struktury UI

Aplikacja WorkLog posiada prostą, dwuwarstwową architekturę interfejsu użytkownika, składającą się z warstwy autoryzacji (Login, Register) oraz warstwy głównej aplikacji (Dashboard, Summaries). Struktura została zaprojektowana z myślą o prostocie użytkowania, minimalizacji punktów decyzyjnych oraz zapewnieniu płynnego przepływu pracy przy śledzeniu czasu.

### Kluczowe założenia architektoniczne:

- **Routing dwustronny:** Dashboard (/) jako główny widok pracy oraz Summaries (/summaries) jako widok historii i podsumowań
- **Sticky active timer:** Aktywne zadanie z timerem zawsze widoczne na górze ekranu w trybie sticky
- **Prewencyjne blokowanie:** Tylko jeden timer może być aktywny jednocześnie, pozostałe przyciski Start są wyłączone
- **Live updates:** Licznik czasu aktualizuje się co sekundę (HH:MM:SS)
- **Instant feedback:** Natychmiastowa reakcja interfejsu na akcje użytkownika z subtelnym wskaźnikiem ładowania podczas komunikacji z API
- **Modale:** Wszystkie operacje edycyjne i potwierdzenia w modalach
- **Responsywność:** Pełna adaptacja do urządzeń mobilnych (hamburger menu, FAB, sheets pełnoekranowe)
- **Dostępność:** Semantyczny HTML, ARIA landmarks, nawigacja klawiaturą, stany fokusa

## 2. Lista widoków

### 2.1 Login View
- **Ścieżka:** `/auth/login`
- **Główny cel:** Umożliwienie zalogowania się użytkownikowi do aplikacji
- **Kluczowe informacje:**
  - Formularz logowania (email, hasło)
  - Link do strony rejestracji
  - Komunikaty błędów walidacji i autoryzacji
- **API:** POST /api/auth/login
- **UX i bezpieczeństwo:**
  - Walidacja po stronie klienta, maskowanie hasła
  - Focus management, enter submit
  - Komunikaty błędów dla screen readers

### 2.2 Register View
- **Ścieżka:** `/auth/register`
- **Główny cel:** Umożliwienie rejestracji nowego użytkownika
- **Kluczowe informacje:**
  - Formularz rejestracji (email, hasło)
  - Link do strony logowania
  - Wymagania dotyczące hasła
  - Komunikaty błędów walidacji
- **API:** POST /api/auth/register
- **UX i bezpieczeństwo:**
  - Walidacja email i wymogi hasła
  - Automatyczne logowanie po rejestracji
  - Komunikat o już istniejącym koncie

### 2.3 Dashboard View
- **Ścieżka:** `/`
- **Główny cel:** Główny widok pracy - zarządzanie zadaniami i śledzenie czasu
- **Kluczowe informacje:**
  - Lista aktywnych zadań
  - Aktywne zadanie z live timerem (sticky)
  - Nazwa, opis, total time każdego zadania
  - Status indicator dla aktywnego zadania
  - Empty state gdy brak zadań
- **Kluczowe elementy:**
  - Górny pasek nawigacji (persistent)
  - Sticky card z aktywnym zadaniem i timerem
  - Scrollowalna lista zadań z akcjami (Start, Edit, Complete)
  - FAB/przycisk "Nowe zadanie"
  - Empty state z CTA
- **API:**
  - GET /api/tasks?status=active
  - GET /api/tasks/active-timer
  - POST /api/tasks
  - POST /api/tasks/{taskId}/time-entries/start
  - POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop
  - PATCH /api/tasks/{taskId}
- **UX i dostępność:**
  - Instant feedback przy akcjach
  - Prewencyjne blokowanie Start buttons
  - Automatyczne scrollowanie do aktywnego zadania
  - Live counter z setInterval
  - Animacje zanikania
  - Mobile: kompaktowy widok, dropdown menu dla akcji

### 2.4 Summaries View
- **Ścieżka:** `/summaries`
- **Główny cel:** Przeglądanie historii pracy i dziennych podsumowań
- **Kluczowe informacje:**
  - Wybrana data (domyślnie: dzisiaj)
  - Grand total dla wybranego dnia
  - Lista zadań dla wybranego dnia z total time
  - Lista sesji czasowych (rozwijana)
  - Timestamps sesji
  - Empty state gdy brak danych
- **Kluczowe elementy:**
  - Górny pasek nawigacji (persistent)
  - Hero card z grand total
  - Nawigacja dat (picker + quick navigation)
  - Przycisk "+ Dodaj czas ręcznie"
  - Rozwijana lista zadań z sesjami
  - Empty state
- **API:**
  - GET /api/summary/daily?date=YYYY-MM-DD
  - GET /api/tasks?status=active
  - POST /api/tasks
  - POST /api/tasks/{taskId}/time-entries
  - GET /api/tasks/{taskId}/time-entries
  - PATCH /api/tasks/{taskId}/time-entries/{timeEntryId}
- **UX i dostępność:**
  - Domyślnie dzisiejszy dzień
  - Collapsible dla sesji
  - Responsywność: date picker jako drawer na mobile
  - Focus management

## 3. Mapa podróży użytkownika

### 3.1 Główny przepływ użytkowania

**Autoryzacja:**
- Login/Register → Dashboard
- Sprawdzenie aktywnego timera przy starcie
- Recovery flow jeśli timer był aktywny (modal z opcjami)

**Praca z zadaniami (Dashboard):**
- Utworzenie zadania → Modal → Zadanie dodane do listy
- Start timera → Zadanie przenosi się do sticky card → Live counting
- Pauza → Timer zamrożony, badge "PAUZA" → Wznowienie
- Stop → Sesja zapisana, zadanie wraca do listy
- Edycja zadania → Modal (szczegóły + historia sesji)
- Edycja sesji → Modal (z poziomu edycji zadania lub summaries)
- Ukończenie zadania → Confirmation → Zadanie archiwizowane

**Przeglądanie historii (Summaries):**
- Dashboard → Summaries (link w nav)
- Wybór daty → Refresh danych
- Rozwinięcie zadania → Lista sesji
- Kliknięcie na zadanie → Modal z historią sesji dla wybranego dnia
- Edycja sesji → Modal
- Dodanie czasu ręcznie:
  - Kliknięcie "+ Dodaj czas" → Modal wyboru/tworzenia zadania
  - Wybór istniejącego zadania LUB utworzenie nowego
  - Automatyczne otwarcie modala sesji czasowych
  - Dodanie nowej sesji (data, start, end)
  - Walidacja i zapis → Odświeżenie podsumowania

**Przypadki specjalne:**
- Konflikt timerów (409) → Modal z opcjami
- Błąd API → Rollback + toast
- Unauthorized (401) → Redirect do Login

### 3.2 Przepływ między widokami

```
Login ──────────────> Dashboard ←──────────> Summaries
   ↑                      ↓                       ↓
   └──────────────────── Logout ─────────────────┘
   
Register ───────────> Dashboard
```

**Nawigacja:**
- Top nav: Logo (→ Dashboard), Linki (Dashboard ↔ Summaries), Logout (→ Login)
- Modale: Otwieranie z kontekstu, zamknięcie → powrót do widoku
- Redirect po akcjach: Rejestracja/Login → Dashboard, Logout/401 → Login

## 4. Układ i struktura nawigacji

### 4.1 Top Navigation Bar
**Układ:** `[Logo] [Pulpit | Podsumowania] [Logout]`
- Logo: link do Dashboard
- Linki nawigacyjne z aktywnym stanem
- Przycisk Logout
- **Mobile:** Hamburger menu → Drawer z linkami
- **Desktop:** Pełny układ poziomy
- Persistent na wszystkich stronach głównej aplikacji

### 4.2 Routing
**Publiczne:**
- `/auth/login` - Login View
- `/auth/register` - Register View

**Chronione (JWT):**
- `/` - Dashboard View
- `/summaries` - Summaries View

**Middleware:** Sprawdzanie JWT, redirect do `/auth/login` jeśli brak tokena

### 4.3 Zasady nawigacji
- Smooth transitions między widokami (Astro View Transitions)
- Automatyczne scrollowanie (aktywne zadanie, konflikt)
- Focus management dla modali
- Nawigacja klawiaturą (Tab order, stany fokusa)

## 5. Kluczowe komponenty

### 5.1 Layout & Navigation
- **Top Navigation Bar** - Persistent górny pasek z logo, linkami i logout
- **Mobile Navigation Drawer** - Hamburger menu dla urządzeń mobilnych

### 5.2 Task Management
- **Active Task Card** - Sticky karta z live timerem dla aktywnego zadania
- **Task Item Card** - Karta pojedynczego zadania z akcjami
- **Task List** - Scrollowalna lista zadań

### 5.3 Modals & Dialogs
- **Create Task Modal** - Formularz tworzenia zadania
- **Edit Task Modal** - Edycja szczegółów zadania i przegląd historii sesji
- **Edit Time Entry Modal** - Edycja pojedynczej sesji czasowej
- **Select Or Create Task Modal** - Wybór istniejącego zadania lub utworzenie nowego (w Summaries)
- **Add Time Entry Modal** - Dodawanie nowej sesji czasowej z datą, start i end time
- **Recovery Modal** - Obsługa aktywnego timera przy starcie aplikacji
- **Confirmation Dialogs** - Potwierdzenia dla destructive actions (Complete, Delete)
- **Conflict Modal** - Obsługa konfliktu aktywnych timerów

### 5.4 Summaries
- **Hero Card** - Grand total czasu dla wybranego dnia
- **Date Navigation** - Date picker i quick navigation (previous/today/next)
- **Add Time Button** - Przycisk "+ Dodaj czas" do ręcznego dodawania sesji
- **Task Summary Item** - Rozwijalna karta z listą sesji (klikalna, otwiera modal sesji)

### 5.5 UI Feedback
- **Empty State** - Komunikat i CTA gdy brak danych
- **Loading Indicator** - Spinner podczas żądań API
- **Toast Notifications** - Feedback dla akcji użytkownika (błędy, sukcesy)
- **Status Indicators** - Pulsująca kropka dla aktywnego timera

### 5.6 Forms & Inputs
- **Login Form** - Formularz logowania
- **Register Form** - Formularz rejestracji
- **Task Form** - Formularz zadania (create/edit)
- **Time Entry Form** - Formularz edycji sesji czasowej
- **Date/Time Pickers** - Wybór daty i czasu

### 5.7 Mobile-Specific
- **FAB** - Floating Action Button dla szybkiego dodawania zadania
- **Dropdown Menu** - Kompaktowe menu akcji dla Task Item

---

**Uwagi architektoniczne:**
- Spójność UI poprzez design system (Shadcn/ui)
- Lazy loading dla modali
- State management dla globalnego stanu (activeTimer, tasks)
- Error handling z rollback i toast notifications
- Authentication przez JWT middleware
- Responsive design (mobile-first)
- Accessibility (ARIA, semantic HTML, keyboard navigation)
