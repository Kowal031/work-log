# Plan implementacji widoku Dashboard

## 1. Przegląd
Widok Dashboard jest głównym interfejsem aplikacji, służącym do zarządzania zadaniami i śledzenia czasu pracy. Umożliwia użytkownikom tworzenie, edytowanie i przeglądanie listy aktywnych zadań. Kluczową funkcjonalnością jest możliwość uruchamiania i zatrzymywania licznika czasu dla poszczególnych zadań. Widok ten zawiera również stały, "przyklejony" komponent, który pokazuje aktywne zadanie z licznikiem czasu, zapewniając stały wgląd w bieżącą pracę.

## 2. Routing widoku
Widok Dashboard będzie dostępny pod główną ścieżką aplikacji: `/`.

## 3. Struktura komponentów
```
Layout (Astro)
└── TopNavigationBar (React)

DashboardView (Astro)
├── RecoveryModal (React) [na starcie aplikacji]
├── ActiveTimerCard (React)
│   └── TimerDisplay (React)
├── TaskList (React)
│   ├── TaskItem (React)
│   │   ├── StatusIndicator (React)
│   │   └── TaskActions (React)
│   └── TaskListEmptyState (React)
├── CreateTaskModal (React)
│   └── TaskForm (React)
├── EditTaskModal (React)
│   ├── TaskForm (React)
│   └── SessionHistoryList (React)
└── CompleteConfirmationDialog (React)
```

## 4. Szczegóły komponentów

### TopNavigationBar
- **Opis komponentu**: Persistent górny pasek nawigacji widoczny na wszystkich stronach głównej aplikacji. Zawiera logo, linki nawigacyjne i przycisk wylogowania.
- **Główne elementy**: `nav` (kontener), Logo (link), linki nawigacyjne ("Pulpit" | "Podsumowania"), przycisk "Logout".
- **Obsługiwane interakcje**:
  - Kliknięcie logo/linku: Nawigacja do odpowiedniego widoku
  - Kliknięcie Logout: Wylogowanie użytkownika
- **Warunki walidacji**: Brak.
- **Typy**: Brak specyficznych typów.
- **Propsy**:
  - `currentPath: string` - aktywna ścieżka do podświetlenia
- **Mobile**: Hamburger menu z drawer/sheet

### RecoveryModal
- **Opis komponentu**: Blokujący modal wyświetlany przy starcie aplikacji, gdy wykryto aktywny timer z poprzedniej sesji. Umożliwia użytkownikowi podjęcie decyzji co zrobić z niezakończonym czasem.
- **Główne elementy**: `AlertDialog` (Shadcn/ui), informacja o czasie, ostrzeżenie dla >12h, trzy przyciski akcji.
- **Obsługiwane interakcje**:
  - `onSaveAll`: Zatrzymuje timer i zapisuje cały czas od startu
  - `onDiscardFromClose`: Zatrzymuje timer i odrzuca czas od zamknięcia aplikacji
  - `onManualCorrect`: Otwiera modal edycji sesji do ręcznej korekty
- **Warunki walidacji**: 
  - Ostrzeżenie gdy elapsed time > 12h
- **Typy**: `ActiveTimerViewModel`, elapsed time w sekundach.
- **Propsy**:
  - `activeTimer: ActiveTimerViewModel`
  - `elapsedSeconds: number`
  - `lastAppCloseTime: string` - timestamp zamknięcia aplikacji
  - `onSaveAll: () => void`
  - `onDiscardFromClose: () => void`
  - `onManualCorrect: () => void`

### ActiveTimerCard
- **Opis komponentu**: "Przyklejony" do góry ekranu komponent, który jest widoczny tylko wtedy, gdy licznik czasu jest aktywny dla jakiegoś zadania. Wyświetla nazwę zadania, aktualny czas trwania sesji oraz przyciski do wstrzymania i zatrzymania licznika.
- **Główne elementy**: `div` (kontener), `h3` (nazwa zadania), `TimerDisplay` (komponent-dziecko), `Button` (Pauza/Wznów), `Button` (Stop).
- **Obsługiwane interakcje**:
  - `onStop`: Zatrzymuje licznik czasu.
- **Warunki walidacji**: Brak.
- **Typy**: `ActiveTimerViewModel`.
- **Propsy**:
  - `activeTimer: ActiveTimerViewModel`
  - `onStop: (taskId: string, timeEntryId: string) => void`

### TaskList
- **Opis komponentu**: Komponent renderujący listę aktywnych zadań użytkownika. Obsługuje stan ładowania oraz pusty stan, gdy użytkownik nie ma żadnych zadań.
- **Główne elementy**: `div` (kontener), `Spinner` (wskaźnik ładowania), `TaskListEmptyState` lub `TaskItem` (mapowanie po liście zadań).
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji, deleguje je do `TaskItem`.
- **Warunki walidacji**: Brak.
- **Typy**: `TaskViewModel[]`.
- **Propsy**:
  - `tasks: TaskViewModel[]`
  - `isLoading: boolean`
  - `onStartTimer: (taskId: string) => void`
  - `onEdit: (task: TaskViewModel) => void`
  - `onStop: (taskId: string, timeEntryId: string) => void`
  - `activeTimer: ActiveTimerViewModel | null`

### TaskItem
- **Opis komponentu**: Reprezentuje pojedynczy element na liście zadań. Wyświetla nazwę, opis, total time, status indicator oraz przyciski akcji (Start, Edit, Complete).
- **Główne elementy**: `Card` (kontener), nazwa, opis, total time, `StatusIndicator`, przyciski akcji.
- **Obsługiwane interakcje**:
  - `onStartTimer`: Uruchamia licznik czasu dla zadania.
  - `onEdit`: Otwiera modal edycji zadania.
  - `onComplete`: Otwiera dialog potwierdzenia ukończenia zadania.
- **Warunki walidacji**: 
  - Przycisk "Start" wyłączony gdy inny timer aktywny.
  - Przyciski "Edit" i "Complete" wyłączone gdy to zadanie ma aktywny timer.
- **Typy**: `TaskViewModel` z dodatkowymi polami `totalTimeSeconds` i `totalTimeFormatted`.
- **Propsy**:
  - `task: TaskViewModel`
  - `onStartTimer: (taskId: string) => void`
  - `onEdit: (task: TaskViewModel) => void`
- **Opis komponentu**: Modal do edycji zadania zawierający dwie sekcje: szczegóły zadania (nazwa, opis) oraz historię sesji czasowych.
- **Główne elementy**: `Dialog` (Shadcn/ui), `ScrollArea`, dwie sekcje oddzielone `Separator`, `TaskForm`, `SessionHistoryList`.
- **Obsługiwane interakcje**:
  - `onSave`: Zapisuje zmiany w szczegółach zadania.
  - `onClose`: Zamyka modal.
  - `onEditSession`: Otwiera modal edycji konkretnej sesji.
- **Warunki walidacji**: 
  - Edycja szczegółów wyłączona gdy timer aktywny.
  - Delegowanie walidacji do `TaskForm`.
- **Typy**: `TaskViewModel`, `TimeEntry[]`.
- **Propsy**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onSave: (data: UpdateTaskRequestDto) => void`
  - `task: TaskViewModel`
  - `sessions: TimeEntry[]`
  - `onEditSession: (sessionId: string) => void`

### SessionHistoryList
- **Opis komponentu**: Lista wszystkich sesji czasowych dla danego zadania z możliwością edycji każdej.
- **Główne elementy**: Lista elementów z timestamp, duration, ikona edycji.
- **Obsługiwane interakcje**:
  - `onEditSession`: Otwiera modal edycji sesji.
- **Warunki walidacji**: Brak.
- **Typy**: `TimeEntry[]`.
- **Propsy**:
  - `sessions: TimeEntry[]`
  - `onEditSession: (sessionId: string) => void`

### CompleteConfirmationDialog
- **Opis komponentu**: Dialog potwierdzenia przed oznaczeniem zadania jako ukończone.
- **Główne elementy**: `AlertDialog` (Shadcn/ui), treść ostrzeżenia, przyciski Anuluj/Potwierdź.
- **Obsługiwane interakcje**:
  - `onConfirm`: Oznacza zadanie jako completed i archiwizuje.
  - `onCancel`: Zamyka dialog bez zmian.
- **Warunki walidacji**: Brak.
- **Typy**: `TaskViewModel`.
- **Propsy**:
  - `isOpen: boolean`
  - `task: TaskViewModel | null`
  - `onConfirm: () => void`
  - `onCancel: () => void` oraz total time.
```typescript
export interface TaskViewModel extends TaskResponseDto {
  isBeingEdited: boolean;
  totalTimeSeconds: number;      // Suma wszystkich sesji w sekundach
  totalTimeFormatted: string;     // Format: "8h 45m" lub "2h 15m"
}
```

### `ActiveTimerViewModel`
Adaptuje `ActiveTimerResponseDto` na potrzeby widoku, dodając nazwę zadania.
```typescript
export interface ActiveTimerViewModel extends ActiveTimerResponseDto {
  taskName: string;
}
```

### `RecoveryData`
Dane dla Recovery Modal przy starcie aplikacji.
```typescript
export interface RecoveryData {
  activeTimer: ActiveTimerViewModel;
  elapsedSeconds: number;
  lastAppCloseTime: string;
  formattedElapsed: string;      // Format: "2d 3h 15m" dla długich czasów
  isLongDuration: boolean;        // true jeśli > 12hn`
  - `onClose: () => void`
  - `onSave: (data: CreateTaskRequestDto | UpdateTaskRequestDto) => void`
  - `initialData?: TaskViewModel` (dla edycji)

### TaskForm
- **Opis komponentu**: Formularz do wprowadzania danych zadania (nazwa, opis).
- **Główne elementy**: `form`, `Input` (nazwa), `Textarea` (opis), `Button` (Zapisz).
- **Obsługiwane interakcje**: `onSubmit`.
- **Warunki walidacji**:
  - `name`: Pole wymagane, minimum 3 znaki.
- **Typy**: `CreateTaskRequestDto`, `UpdateTaskRequestDto`.
- **Propsy**:
  - `onSubmit: (data: any) => void`
  - `initialData?: { name: string; description?: string | null }`

## 5. Typy

### `TaskViewModel`
Adaptuje `TaskResponseDto` na potrzeby widoku, dodając flagi stanu UI.
```typescript
export interface TaskViewModel extends TaskResponseDto {
  isBeingEdited: boolean;
}
```

### `ActiveTimerViewModel`
Adaptuje `ActiveTimerResponseDto` na potrzeby widoku, dodając flagi stanu UI.
```typescript
- **`recoveryData`**: `useState<RecoveryData | null>(null)` - dane dla Recovery Modal.
- **`isRecoveryModalOpen`**: `useState<boolean>(false)` - widoczność Recovery Modal.
- **`taskToComplete`**: `useState<TaskViewModel | null>(null)` - zadanie do ukończenia (confirmation dialog).
- **`isCompleteDial?status=active`**:
  - **Akcja**: Pobranie listy aktywnych zadań przy pierwszym renderowaniu komponentu.
  - **Query params**: `status=active` (filtrowanie tylko aktywnych zadań).
  - **Odpowiedź**: `TaskResponseDto[]`.
  - **Uwaga**: Dla każdego zadania należy obliczyć `totalTimeSeconds` sumując wszystkie sesje.

- **`GET /api/tasks/active-timer`**:
  - **Akcja**: Sprawdzenie aktywnego licznika przy pierwszym renderowaniu.
  - **Odpowiedź**: `ActiveTimerResponseDto | null`.
  - **Recovery flow**: Jeśli zwraca dane, sprawdź czy aplikacja była zamknięta i wyświetl Recovery Modal.

- **`POST /api/tasks`**:
  - **Akcja**: Utworzenie nowego zadania.
  - **Żądanie**: `CreateTaskRequestDto`.
  - **Odpowiedź**: `TaskResponseDto`.

- **`PATCH /api/tasks/{taskId}`**:
  - **Akcja**: Aktualizacja zadania (szczegóły lub status).
  - **Żądanie**: `UpdateTaskRequestDto` (może zawierać `status: "completed"`).
  - **Odpowiedź**: `TaskResponseDto`.
  - **Complete flow**: Wysłanie z `status: "completed"` archiwizuje zadanie.

- **`POST /api/tasks/{taskId}/time-entries/start`**:
  - **Akcja**: Uruchomienie licznika dla zadania.
  - **Odpowiedź**: `TimeEntryResponseDto`.
  - **Błąd 409**: Inny timer już aktywny.

- **`POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop`**:
  - **Akcja**: Zatrzymanie aktywnego licznika.
  - **Żądanie**: Opcjonalnie `end_time` jeśli korekta czasu (Recovery flow).
  - **Odpowiedź**: `TimeEntryResponseDto`.

- **`PATCH /api/tasks/{taskId}/time-entries/{timeEntryId}`**:
  - **Akcja**: Ręczna edycja sesji czasowej (z Recovery Modal lub Edit Modal).
  - **Żądanie**: `UpdateTimeEntryRequestDto` (`start_time`, `end_time`).
  - **Odpowiedź**: `TimeEntryResponseDto`.

### Podstawowe operacje
- **Tworzenie zadania**: Użytkownik klika "Dodaj zadanie", otwiera się modal, wypełnia formularz i zapisuje. Lista zadań jest odświeżana, nowe zadanie pojawia się na górze.

- **Edycja zadania**: Użytkownik klika ikonę edycji przy zadaniu, otwiera się modal z dwiema sekcjami: szczegóły zadania (edytowalne gdy timer nieaktywny) i historia sesji (lista z możliwością edycji). Po zapisaniu lista jest odświeżana.

- **Edycja sesji**: Z poziomu Edit Modal lub Summaries, kliknięcie ikony edycji przy sesji otwiera modal edycji czasu (start_time, end_time). Zapisanie aktualizuje total time zadania.

### Timer i tracking
- **Start licznika**: Użytkownik klika "Start". Następuje:
  1. Instant feedback (przycisk disabled, zmiana UI)
  2. API call w tle
  3. Automatyczne scrollowanie do góry strony
  4. Zadanie przenosi się do sticky `ActiveTimerCard`
  5. Wszystkie inne przyciski "Start" są wyłączone
  6. Live counting rozpoczyna się

- **Pauza/Wznów**: Kliknięcie "Pauza" zamraża licznik (tylko UI), wyświetla badge "PAUZA" i czas wstrzymania. "Wznów" kontynuuje liczenie. **Uwaga**: Backend nie wspiera pauzy, więc to tylko wizualne zamrożenie.

- **Stop licznika**: Użytkownik klika "Stop" na `ActiveTimerCard`. Komponent znika, zadanie wraca na listę z zaktualizowanym total time, przyciski "Start" stają się aktywne.

### Faza 1: Podstawowa struktura i CRUD (✅ Zaimplementowane)
1.  ✅ **Struktura plików**: Utworzenie plików dla nowych komponentów React w katalogu `src/components/dashboard/`.
2.  ✅ **Komponenty statyczne**: Implementacja komponentów `TaskItem`, `TaskList`, `ActiveTimerCard` z przykładowymi danymi (mock data), aby zbudować statyczny layout.
3.  ✅ **Główny komponent `DashboardView`**: Stworzenie pliku `src/pages/index.astro` lub dedykowanego komponentu, który będzie zarządzał stanem.
4.  ✅ **Pobieranie danych**: Implementacja logiki pobierania zadań (`GET /api/tasks`) i aktywnego licznika (`GET /api/tasks/active-timer`) przy użyciu `useEffect`.
5.  ✅ **Zarządzanie stanem**: Podłączenie pobranych danych do stanu komponentów i przekazanie ich jako propsy do komponentów-dzieci.
6.  ✅ **Implementacja akcji**:
    -   Dodanie funkcji `handleStartTimer` wywołującej `POST /api/tasks/{taskId}/time-entries/start`.
    -   Dodanie funkcji `handleStopTimer` wywołującej `POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop`.
7.  ✅ **Implementacja modali**: Stworzenie komponentów `CreateTaskModal` i `EditTaskModal` wraz z formularzem `TaskForm`.
8.  ✅ **Logika tworzenia/edycji**: Implementacja funkcji `handleCreateTask` i `handleUpdateTask` wywołujących odpowiednio `POST /api/tasks` i `PATCH /api/tasks/{taskId}`.
9.  ✅ **Obsługa błędów i stany UI**: Dodanie obsługi stanów ładowania, błędów oraz przypadków brzegowych (np. wyłączanie przycisków).
10. ✅ **Stylowanie podstawowe**: Wykorzystanie Shadcn/ui i Tailwind CSS.

### Faza 2: Funkcjonalności dodatkowe (🔄 Do zaimplementowania)

#### P0 - Krytyczne (blokują podstawową funkcjonalność)
11. **Recovery Modal** (F-06 z PRD):
    - Komponent `RecoveryModal.tsx` z trzema przyciskami akcji
    - Logika sprawdzania aktywnego timera przy starcie
    - Obliczanie elapsed time i formatowanie ("2d 3h 15m")
    - Ostrzeżenie dla >12h
    - localStorage dla timestamp zamknięcia aplikacji
    - Implementacja trzech flow: Save All, Discard From Close, Manual Correct
    - Confirmation dialog dla Manual Correct bez zmian

12. **Complete Task** (F-02 z PRD):
    - Przycisk "Ukończ" w `TaskItem.tsx`
    - Komponent `CompleteConfirmationDialog.tsx`
    - Handler `handleCompleteTask` z `PATCH status: "completed"`
    - Disabled state gdy timer aktywny
    - Animacja fade-out przy ukończeniu
    - Usunięcie z listy po archiwizacji

13. **Top Navigation Bar**:
    - Komponent `TopNavigationBar.tsx` w `src/components/layout/`
    - Logo, linki nawigacyjne ("Pulpit" | "Podsumowania"), Logout
    - Aktywny stan dla bieżącej strony
    - Mobile: `MobileNav.tsx` z hamburger menu i drawer
    - Dodanie do `Layout.astro` jako persistent element

#### P1 - Ważne (wpływają na UX)
14. **Total Time per Task**:
    - Dodanie pola `totalTimeSeconds` i `totalTimeFormatted` do `TaskViewModel`
    - Funkcja `calculateTotalTime(sessions: TimeEntry[]): number`
    - Funkcja `formatDuration(seconds: number): string` (format: "8h 45m")
    - Wyświetlanie w `TaskItem.tsx` obok nazwy
    - Aktualizacja po stop timer i edycji sesji

15. **Status Filtering**:
    - Modyfikacja API call: `GET /api/tasks?status=active`
    - Usunięcie ukończonych zadań z listy
    - Opcjonalnie: toggle "Pokaż ukończone" (nice to have)

#### P2 - Ulepszenia
16. **Session History w EditModal**:
    - Komponent `SessionHistoryList.tsx`
    - Sekcja "Historia sesji" w `EditTaskModal.tsx`
    - ScrollArea z Separator między sekcjami
    - Lista sesji z timestamp "09:30 - 11:45 (2h 15m)"
    - Ikona edycji otwierająca modal edycji sesji
    - Pobieranie sesji dla zadania

17. **Status Indicator**:
    - Komponent `StatusIndicator.tsx`
    - Pulsująca zielona kropka dla aktywnego timera
    - CSS animation pulse
    - Dodanie do `TaskItem.tsx`

18. **Mobile Adaptations**:
    - FAB (Floating Action Button) dla "Dodaj zadanie"
    - Dropdown menu dla akcji w `TaskItem` (mobile viewport)
    - Responsive breakpoints (Tailwind: sm:, md:, lg:)
    - Sheet (pełnoekranowy modal) dla mobile
    - Compact view dla TaskItem

19. **Auto-scroll**:
    - `useEffect` z `scrollIntoView()` po starcie timera
    - Smooth scroll animation
    - Scroll do sticky `ActiveTimerCard`

### Faza 3: Testowanie i optymalizacja
20. **Responsywność**: Testowanie na różnych urządzeniach (mobile, tablet, desktop).
21. **Accessibility**: Sprawdzenie nawigacji klawiaturą, screen reader, ARIA labels.
22. **Performance**: Optymalizacja re-renderów, lazy loading modali.
23. **Error scenarios**: Testowanie wszystkich przypadków błędów (409, 403, 404, 401).
24. **User testing**: Przepływ Recovery Modal, Complete Task, nawigacja.

## 12. Notatki techniczne

### Ograniczenia i znane problemy
- **Pauza/Wznów**: Backend nie wspiera, tylko UI state. W przyszłości rozważyć dodanie do API.
- **localStorage dla Recovery**: Wymaga zapisywania timestamp przy zamknięciu/ukryciu okna (beforeunload, visibilitychange events).
- **Total Time calculation**: Wymaga pobierania wszystkich sesji dla każdego zadania lub agregacji po stronie backendu.
- **Animacje**: Używać Tailwind transitions i framer-motion (opcjonalnie) dla smooth UX.

### Dependencje zewnętrzne
- Shadcn/ui: Dialog, AlertDialog, Sheet, ScrollArea, Separator
- Lucide React: ikony (Play, Pause, Square, Pencil, Check, X, Menu)
- Sonner: Toast notifications (już zainstalowane)
- Date-fns lub dayjs: formatowanie czasu (opcjonalnie)alStorage timestamp)
     - **"Skoryguj ręcznie"**: Zamknięcie modal, otwarcie Edit Modal z pre-wybraną ostatnią sesją
  4. Jeśli "Skoryguj" i użytkownik nie zmieni nic: confirmation "Nie wprowadzono zmian. Oryginalny czas zostanie zapisany."

### Nawigacja
- **Top Nav**: Kliknięcie logo lub "Pulpit" → Dashboard, "Podsumowania" → Summaries, "Logout" → wylogowanie i redirect do Login.
- **Mobile**: Hamburger menu otwiera drawer z linkami nawigacyjnymi
  - **Odpowiedź**: `ActiveTimerResponseDto | null`.
- **`POST /api/tasks`**:
  - **Akcja**: Utworzenie nowego zadania.
  - **Żądanie**: `CreateTaskRequestDto`.
  - **Odpowiedź**: `TaskResponseDto`.
- **`PATCH /api/tasks/{taskId}`**:
  - **Akcja**: Aktualizacja istniejącego zadania.
  - **Żądanie**: `UpdateTaskRequestDto`.
  - **Odpowiedź**: `TaskResponseDto`.
- **`POST /api/tasks/{taskId}/time-entries/start`**:
  - **Akcja**: Uruchomienie licznika dla zadania.
  - **Odpowiedź**: `TimeEntryResponseDto`.
- **`POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop`**:
  - **Akcja**: Zatrzymanie aktywnego licznika.
  - **Odpowiedź**: `TimeEntryResponseDto`.

## 8. Interakcje użytkownika

- **Tworzenie zadania**: Użytkownik klika "Dodaj zadanie", otwiera się modal, wypełnia formularz i zapisuje. Lista zadań jest odświeżana.
- **Edycja zadania**: Użytkownik klika ikonę edycji przy zadaniu, otwiera się modal z wypełnionymi danymi. Po zapisaniu lista jest odświeżana.
- **Start licznika**: Użytkownik klika "Start". Przycisk jest blokowany, a na górze ekranu pojawia się `ActiveTimerCard`. Wszystkie inne przyciski "Start" są wyłączone.
- **Stop licznika**: Użytkownik klika "Stop" na `ActiveTimerCard`. Komponent znika, a przyciski "Start" na liście zadań stają się ponownie aktywne.

## 9. Warunki i walidacja

- **Jeden aktywny licznik**: Interfejs uniemożliwia uruchomienie więcej niż jednego licznika jednocześnie poprzez wyłączenie (`disabled`) przycisków "Start" na wszystkich `TaskItem`, gdy `activeTimer` nie jest `null`.
- **Walidacja formularza**: W `TaskForm` pole `name` jest wymagane i musi mieć co najmniej 3 znaki. Przycisk zapisu jest nieaktywny, dopóki warunek nie jest spełniony.
- **Edycja zadania z aktywnym licznikiem**: API zwraca błąd `403 Forbidden`. Na frontendzie przycisk edycji dla zadania, które ma aktywny licznik, powinien być wyłączony.

## 10. Obsługa błędów

- **Błędy API**: Każde wywołanie API będzie opakowane w blok `try...catch`. W przypadku błędu, użytkownikowi zostanie wyświetlony komunikat (np. za pomocą komponentu Toast/Sonner) informujący o niepowodzeniu operacji.
- **Błąd `409 Conflict` (aktywny licznik)**: Jeśli API zwróci błąd 409 przy próbie uruchomienia nowego licznika, stan `activeTimer` na frontendzie zostanie zsynchronizowany z danymi z odpowiedzi błędu, aby odzwierciedlić rzeczywistość.
- **Błąd `403 Forbidden` (edycja aktywnego zadania)**: Frontend powinien prewencyjnie blokować tę akcję. Jeśli jednak dojdzie do wywołania, użytkownik otrzyma stosowny komunikat.
- **Stan pusty i ładowania**: Komponent `TaskList` będzie obsługiwał stany `isLoading` oraz `tasks.length === 0`, wyświetlając odpowiednio wskaźnik ładowania lub komunikat o braku zadań.

## 11. Kroki implementacji

1.  **Struktura plików**: Utworzenie plików dla nowych komponentów React w katalogu `src/components/dashboard/`.
2.  **Komponenty statyczne**: Implementacja komponentów `TaskItem`, `TaskList`, `ActiveTimerCard` z przykładowymi danymi (mock data), aby zbudować statyczny layout.
3.  **Główny komponent `DashboardView`**: Stworzenie pliku `src/pages/index.astro` lub dedykowanego komponentu, który będzie zarządzał stanem.
4.  **Pobieranie danych**: Implementacja logiki pobierania zadań (`GET /api/tasks`) i aktywnego licznika (`GET /api/tasks/active-timer`) przy użyciu `useEffect`.
5.  **Zarządzanie stanem**: Podłączenie pobranych danych do stanu komponentów i przekazanie ich jako propsy do komponentów-dzieci.
6.  **Implementacja akcji**:
    -   Dodanie funkcji `handleStartTimer` wywołującej `POST /api/tasks/{taskId}/time-entries/start`.
    -   Dodanie funkcji `handleStopTimer` wywołującej `POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop`.
7.  **Implementacja modali**: Stworzenie komponentów `CreateTaskModal` i `EditTaskModal` wraz z formularzem `TaskForm`.
8.  **Logika tworzenia/edycji**: Implementacja funkcji `handleCreateTask` i `handleUpdateTask` wywołujących odpowiednio `POST /api/tasks` i `PATCH /api/tasks/{taskId}`.
9.  **Obsługa błędów i stany UI**: Dodanie obsługi stanów ładowania, błędów oraz przypadków brzegowych (np. wyłączanie przycisków).
10. **Stylowanie i responsywność**: Dopracowanie wyglądu komponentów zgodnie z `ui-plan.md` przy użyciu Tailwind CSS, zapewnienie poprawnego działania na urządzeniach mobilnych.
11. **Testowanie**: Ręczne przetestowanie wszystkich interakcji użytkownika i przepływów danych.
