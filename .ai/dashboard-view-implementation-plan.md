# Plan implementacji widoku Dashboard

## 1. Przegląd
Widok Dashboard jest głównym interfejsem aplikacji, służącym do zarządzania zadaniami i śledzenia czasu pracy. Umożliwia użytkownikom tworzenie, edytowanie i przeglądanie listy aktywnych zadań. Kluczową funkcjonalnością jest możliwość uruchamiania i zatrzymywania licznika czasu dla poszczególnych zadań. Widok ten zawiera również stały, "przyklejony" komponent, który pokazuje aktywne zadanie z licznikiem czasu, zapewniając stały wgląd w bieżącą pracę.

## 2. Routing widoku
Widok Dashboard będzie dostępny pod główną ścieżką aplikacji: `/`.

## 3. Struktura komponentów
```
DashboardView (Astro)
├── ActiveTimerCard (React)
│   └── TimerDisplay (React)
├── TaskList (React)
│   ├── TaskItem (React)
│   │   └── TaskActions (React)
│   └── TaskListEmptyState (React)
├── CreateTaskModal (React)
│   └── TaskForm (React)
└── EditTaskModal (React)
    └── TaskForm (React)
```

## 4. Szczegóły komponentów

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
- **Opis komponentu**: Reprezentuje pojedynczy element na liście zadań. Wyświetla nazwę, opis zadania oraz przycisk do rozpoczęcia śledzenia czasu.
- **Główne elementy**: `div` (kontener), `p` (nazwa i opis), `Button` (Start).
- **Obsługiwane interakcje**:
  - `onStartTimer`: Uruchamia licznik czasu dla zadania.
  - `onEdit`: Otwiera modal edycji zadania.
- **Warunki walidacji**: Przycisk "Start" jest wyłączony (`disabled`), jeśli jakiekolwiek inne zadanie ma aktywny licznik.
- **Typy**: `TaskViewModel`.
- **Propsy**:
  - `task: TaskViewModel`
  - `onStartTimer: (taskId: string) => void`
  - `onEdit: (task: TaskViewModel) => void`
  - `isTimerActive: boolean`

### CreateTaskModal / EditTaskModal
- **Opis komponentu**: Modal służący do tworzenia lub edycji zadania. Zawiera formularz `TaskForm`.
- **Główne elementy**: `Dialog` (komponent Shadcn/ui), `DialogContent`, `DialogHeader`, `DialogFooter`, `TaskForm`.
- **Obsługiwane interakcje**:
  - `onSave`: Zapisuje zmiany (tworzy lub aktualizuje zadanie).
  - `onClose`: Zamyka modal.
- **Warunki walidacji**: Delegowane do `TaskForm`.
- **Typy**: `TaskViewModel` (dla edycji).
- **Propsy**:
  - `isOpen: boolean`
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
export interface ActiveTimerViewModel extends ActiveTimerResponseDto {
  taskName: string;
}
```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane za pomocą hooków React (`useState`, `useEffect`) w głównym komponencie `DashboardView.astro`, który będzie pełnił rolę "smart component". Rozważone zostanie stworzenie customowego hooka `useDashboardState` w celu hermetyzacji logiki.

- **`tasks`**: `useState<TaskViewModel[]>([])` - przechowuje listę zadań.
- **`activeTimer`**: `useState<ActiveTimerViewModel | null>(null)` - przechowuje informacje o aktywnym liczniku.
- **`isLoading`**: `useState<boolean>(true)` - kontroluje stan ładowania danych.
- **`error`**: `useState<string | null>(null)` - przechowuje komunikaty błędów.
- **`isCreateModalOpen` / `isEditModalOpen`**: `useState<boolean>(false)` - zarządza widocznością modali.
- **`taskToEdit`**: `useState<TaskViewModel | null>(null)` - przechowuje dane zadania do edycji.

## 7. Integracja API

- **`GET /api/tasks`**:
  - **Akcja**: Pobranie listy zadań przy pierwszym renderowaniu komponentu.
  - **Odpowiedź**: `TaskResponseDto[]`.
- **`GET /api/tasks/active-timer`**:
  - **Akcja**: Sprawdzenie aktywnego licznika przy pierwszym renderowaniu.
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
