# Plan implementacji widoku podsumowania (Summaries)

## 1. Przegląd
Widok podsumowania dostarcza użytkownikom dzienne zestawienie ich czasu pracy. Umożliwia przeglądanie łącznego czasu spędzonego na zadaniach w wybranym dniu oraz nawigację po historii pracy. Domyślnie widok prezentuje dane dla bieżącego dnia. Celem jest zapewnienie użytkownikowi szybkiego wglądu w jego produktywność i historię aktywności, zgodnie z wymaganiami F-05, US-009 i US-010.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/summaries`. Implementacja będzie polegać na stworzeniu nowego pliku strony w Astro: `src/pages/summaries.astro`.

## 3. Struktura komponentów
Hierarchia komponentów zostanie zorganizowana w celu oddzielenia logiki od prezentacji. Główny komponent będzie renderowany po stronie klienta, aby zapewnić interaktywność.

```
/src/pages/summaries.astro
└── /src/components/summaries/SummariesView.tsx (Client-side)
    ├── /src/components/summaries/DateSelector.tsx
    ├── /src/components/summaries/SummaryHeroCard.tsx
    └── /src/components/summaries/SummaryTaskList.tsx
        └── /src/components/summaries/SummaryTaskItem.tsx
```

## 4. Szczegóły komponentów

### `SummariesView.tsx`
- **Opis komponentu:** Główny, stanowy komponent React, który zarządza logiką całego widoku. Odpowiada za zarządzanie stanem (wybrana data, dane z API, status ładowania) i orkiestrację komponentów podrzędnych.
- **Główne elementy:** `div` jako kontener dla `DateSelector`, `SummaryHeroCard` i `SummaryTaskList`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji; deleguje obsługę zdarzeń do komponentów podrzędnych i reaguje na zmiany stanu.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `DailySummaryResponseDto`, `TaskSummaryDto`.
- **Propsy:** Brak.

### `DateSelector.tsx`
- **Opis komponentu:** Komponent interfejsu użytkownika do wyboru daty. Składa się z przycisków szybkiej nawigacji ("Poprzedni dzień", "Dziś", "Następny dzień") oraz komponent kalendarza który jest cały czas otwarty.
- **Główne elementy:** Komponenty Shadcn/ui: `Button`, `Popover`, `Calendar`.
- **Obsługiwane interakcje:**
    - Kliknięcie przycisku daty otwiera `Popover` z `Calendar`.
    - Wybór daty w kalendarzu.
    - Kliknięcie przycisków szybkiej nawigacji.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
    ```typescript
    interface DateSelectorProps {
      selectedDate: Date;
      onDateChange: (newDate: Date) => void;
      disabled: boolean; // Do blokowania interakcji podczas ładowania danych
    }
    ```

### `SummaryHeroCard.tsx`
- **Opis komponentu:** Komponent prezentacyjny wyświetlający łączny czas pracy w danym dniu oraz wybraną datę. Pokazuje stan ładowania (np. skeleton).
- **Główne elementy:** Komponent `Card` z Shadcn/ui, zawierający `h2` dla łącznego czasu i `p` dla daty.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
    ```typescript
    interface SummaryHeroCardProps {
      totalDurationFormatted: string | null;
      date: string;
      isLoading: boolean;
    }
    ```

### `SummaryTaskList.tsx`
- **Opis komponentu:** Komponent renderujący listę zadań z podsumowania. Odpowiada za wyświetlanie stanu pustego (gdy brak zadań) lub stanu ładowania.
- **Główne elementy:** `div` zawierający listę komponentów `SummaryTaskItem` lub komunikat o braku danych/ładowaniu.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `TaskSummaryDto`.
- **Propsy:**
    ```typescript
    interface SummaryTaskListProps {
      tasks: TaskSummaryDto[];
      isLoading: boolean;
    }
    ```

### `SummaryTaskItem.tsx`
- **Opis komponentu:** Komponent prezentacyjny dla pojedynczego zadania na liście podsumowania. Wyświetla nazwę zadania i łączny czas pracy nad nim w danym dniu.
- **Główne elementy:** `div` lub `Card` z Shadcn/ui, zawierający nazwę zadania i sformatowany czas trwania.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `TaskSummaryDto`.
- **Propsy:**
    ```typescript
    interface SummaryTaskItemProps {
      task: TaskSummaryDto;
    }
    ```

## 5. Typy
Implementacja będzie opierać się na istniejących typach DTO zdefiniowanych w `src/types.ts`. Nie ma potrzeby tworzenia nowych, złożonych typów ViewModel.

- **`DailySummaryResponseDto`**: Główny obiekt odpowiedzi z API, zawierający podsumowanie.
    ```typescript
    export interface DailySummaryResponseDto {
      date_from: string;
      date_to: string;
      total_duration_seconds: number;
      total_duration_formatted: string;
      tasks: TaskSummaryDto[];
    }
    ```
- **`TaskSummaryDto`**: Obiekt reprezentujący pojedyncze zadanie w podsumowaniu.
    ```typescript
    export interface TaskSummaryDto {
      task_id: string;
      task_name: string;
      task_status: TaskStatus;
      duration_seconds: number;
      duration_formatted: string;
      entries_count: number;
    }
    ```

## 6. Zarządzanie stanem
Logika pobierania danych oraz zarządzanie stanem zostaną wyizolowane w dedykowanym customowym hooku, aby utrzymać komponent `SummariesView.tsx` w czystości.

**Custom Hook: `useDailySummary.ts`**
- **Lokalizacja:** `src/components/summaries/hooks/useDailySummary.ts`
- **Cel:** Abstrakcja logiki fetchowania danych, obsługi stanu ładowania i błędów.
- **Struktura:**
    ```typescript
    function useDailySummary(selectedDate: Date) {
      const [summary, setSummary] = useState<DailySummaryResponseDto | null>(null);
      const [isLoading, setIsLoading] = useState<boolean>(true);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        // Logika fetchowania danych na podstawie selectedDate
        // Ustawianie stanów isLoading, summary, error
      }, [selectedDate]);

      return { summary, isLoading, error };
    }
    ```
- **Stan w `SummariesView.tsx`:**
    - `selectedDate: Date`: Zarządzany przez `useState`, inicjalizowany na dzisiejszą datę. Zmiana tego stanu (przekazywanego do `useDailySummary`) spowoduje ponowne pobranie danych.

## 7. Integracja API
- **Endpoint:** `GET /api/summary/daily`
- **Metoda:** `GET`
- **Typ żądania:** Zapytanie będzie zawierać parametry w URL.
    - **Parametry:** `date_from` (string `YYYY-MM-DD`), `date_to` (string `YYYY-MM-DD`).
    - **Przykład:** `/api/summary/daily?date_from=2026-01-26&date_to=2026-01-26`
- **Typ odpowiedzi (sukces):** `DailySummaryResponseDto`
- **Typ odpowiedzi (błąd):** `ErrorResponseDto`
- **Logika integracji:** Funkcja `fetch` będzie opakowana w kliencie API (np. w nowym pliku `src/lib/api/summary.api.ts`), który będzie odpowiedzialny za formatowanie daty i dodawanie nagłówków autoryzacyjnych.

## 8. Interakcje użytkownika
- **Wejście na stronę:** Aplikacja automatycznie pobiera i wyświetla podsumowanie dla bieżącego dnia.
- **Zmiana daty w kalendarzu:** Użytkownik klika na przycisk daty, co otwiera kalendarz. Wybór nowej daty zamyka kalendarz, aktualizuje stan `selectedDate` i inicjuje ponowne pobranie danych dla wybranej daty.
- **Użycie szybkiej nawigacji:** Kliknięcie przycisków "Poprzedni dzień" lub "Następny dzień" modyfikuje `selectedDate` o jeden dzień i inicjuje ponowne pobranie danych. Kliknięcie "Dziś" ustawia `selectedDate` na bieżącą datę.
- **Stany ładowania:** Podczas pobierania danych, interfejs użytkownika (przyciski nawigacji daty, karta hero, lista zadań) powinien wyświetlać wskaźniki ładowania (np. skeleton UI, wyłączone przyciski).

## 9. Warunki i walidacja
- **Format daty:** Hook `useDailySummary` jest odpowiedzialny za poprawne sformatowanie obiektu `Date` do stringa `YYYY-MM-DD` przed wysłaniem zapytania do API. Zapewni to zgodność z oczekiwaniami backendu.
- **Blokada interfejsu:** Podczas gdy `isLoading` jest `true`, przyciski w `DateSelector` powinny być wyłączone, aby zapobiec wielokrotnym, nakładającym się zapytaniom API.

## 10. Obsługa błędów
- **Brak autoryzacji (401):** Hook `useDailySummary` ustawi stan błędu. Komponent `SummariesView` wyświetli komunikat "Wymagana autoryzacja. Proszę się zalogować." z linkiem do strony logowania.
- **Błąd serwera (500) lub sieci:** Hook ustawi stan błędu. Komponent `SummariesView` wyświetli ogólny komunikat, np. "Nie udało się załadować podsumowania. Spróbuj ponownie później."
- **Brak danych (pusta tablica `tasks`):** Komponent `SummaryTaskList` wyświetli komunikat "Nie zarejestrowano czasu pracy w tym dniu." Karta `SummaryHeroCard` pokaże "0h 0m".

## 11. Kroki implementacji
1.  **Utworzenie struktury plików:**
    - Strona Astro: `src/pages/summaries.astro`.
    - Komponenty React: `src/components/summaries/SummariesView.tsx`, `DateSelector.tsx`, `SummaryHeroCard.tsx`, `SummaryTaskList.tsx`, `SummaryTaskItem.tsx`.
    - Custom hook: `src/components/summaries/hooks/useDailySummary.ts`.
    - Klient API: `src/lib/api/summary.api.ts` (jeśli jeszcze nie istnieje).
2.  **Implementacja strony Astro (`SummariesPage.astro`):**
    - Dodaj podstawowy layout i zaimportuj `SummariesView.tsx` z dyrektywą `client:load`.
3.  **Implementacja komponentów prezentacyjnych:**
    - Stwórz `SummaryHeroCard`, `SummaryTaskList`, `SummaryTaskItem` jako proste komponenty przyjmujące propsy i renderujące UI, w tym stany `isLoading`.
4.  **Implementacja `DateSelector.tsx`:**
    - Zintegruj komponenty `Popover` i `Calendar` z Shadcn/ui.
    - Zaimplementuj logikę przycisków szybkiej nawigacji.
    - Podłącz `onDateChange` do interakcji użytkownika.
5.  **Implementacja hooka `useDailySummary.ts`:**
    - Zaimplementuj logikę `useEffect` do pobierania danych na podstawie `selectedDate`.
    - Wykorzystaj klienta API do wykonania zapytania `fetch`.
    - Zarządzaj stanami `summary`, `isLoading` i `error`.
6.  **Implementacja głównego komponentu `SummariesView.tsx`:**
    - Zaimplementuj stan `selectedDate`.
    - Użyj hooka `useDailySummary` do pobrania danych.
    - Przekaż dane i stany jako propsy do komponentów podrzędnych.
7.  **Stylowanie i finalizacja:**
    - Użyj Tailwind CSS do ostylowania komponentów zgodnie z planem UI.
    - Upewnij się, że stany ładowania (skeleton) i puste są poprawnie zaimplementowane.
    - Przetestuj ręcznie wszystkie interakcje użytkownika i scenariusze błędów.

## 12. Historia i Edycja Sesji Czasowych (Faza 2)

### 12.1. Przegląd
Zgodnie z `US-007`, użytkownik musi mieć możliwość edycji istniejących wpisów czasowych. Kliknięcie na `SummaryTaskItem` otworzy modal, w którym wyświetlona zostanie historia sesji dla danego zadania z wybranego dnia. W tym modalu użytkownik będzie mógł edytować lub usuwać poszczególne sesje.

### 12.2. Struktura komponentów
```
/src/components/summaries/SummaryTaskItem.tsx
└── /src/components/dashboard/task/EditTaskModal.tsx (Reużycie lub adaptacja)
    ├── /src/components/dashboard/task/SessionHistoryList.tsx
    │   └── /src/components/dashboard/task/SessionHistoryItem.tsx (Adaptacja)
    └── /src/components/dashboard/task/EditSessionModal.tsx
```
*Uwaga: Plan zakłada maksymalne reużycie istniejących komponentów z widoku Dashboard.*

### 12.3. Szczegóły komponentów

#### `SummaryTaskItem.tsx` (Modyfikacja)
- **Obsługiwane interakcje:** Kliknięcie na komponent otworzy `EditTaskModal`, przekazując `taskId` i `selectedDate`.

#### `EditTaskModal.tsx` (Reużycie)
- **Opis komponentu:** Istniejący modal z Dashboard, który zostanie zaadaptowany do wyświetlania sesji z konkretnego dnia.
- **Propsy (nowe/zmodyfikowane):**
    ```typescript
    interface EditTaskModalProps {
      // ... istniejące propsy
      initialDate?: Date; // Aby filtrować sesje do wybranego dnia
    }
    ```

#### `SessionHistoryList.tsx` (Reużycie)
- **Opis komponentu:** Komponent renderujący listę sesji. Będzie wymagał modyfikacji hooka `useTimeEntries` aby akceptował datę.
- **Hook `useTimeEntries(taskId, date)`:** Należy zmodyfikować, aby pobierał sesje dla konkretnego zadania i dnia.

#### `EditSessionModal.tsx` (Reużycie)
- **Opis komponentu:** Modal do edycji pojedynczej sesji czasowej. Powinien być gotowy do użycia bez większych zmian.

### 12.4. Integracja API
- `GET /api/tasks/{taskId}/time-entries?date=YYYY-MM-DD`: Pobranie sesji dla zadania z danego dnia.
- `PATCH /api/tasks/{taskId}/time-entries/{timeEntryId}`: Aktualizacja sesji.
- `DELETE /api/tasks/{taskId}/time-entries/{timeEntryId}`: Usunięcie sesji.

## 13. Ręczne Dodawanie Czasu (Faza 3)

### 13.1. Przegląd
Użytkownik powinien mieć możliwość ręcznego dodania wpisu czasowego dla dowolnego aktywnego zadania w kontekście wybranego w podsumowaniu dnia.

### 13.2. Struktura komponentów
```
/src/components/summaries/SummariesView.tsx
└── /src/components/summaries/AddManualTimeButton.tsx
    └── /src/components/summaries/AddManualTimeModal.tsx
```

### 13.3. Szczegóły komponentów

#### `AddManualTimeButton.tsx`
- **Opis komponentu:** Prosty przycisk (np. z ikoną "+") umieszczony w `SummariesView`, który otwiera `AddManualTimeModal`.

#### `AddManualTimeModal.tsx`
- **Opis komponentu:** Modal z formularzem do ręcznego dodawania czasu.
- **Główne elementy:**
    - `Select`/`Combobox` do wyboru zadania (z listy aktywnych zadań).
    - `DatePicker` (domyślnie ustawiony na `selectedDate` z widoku podsumowania).
    - `TimePicker` dla czasu rozpoczęcia i zakończenia.
- **Walidacja:** Wszystkie pola wymagane, czas zakończenia musi być późniejszy niż czas rozpoczęcia.

### 13.4. Integracja API
- `GET /api/tasks?status=active`: Pobranie listy aktywnych zadań do wyboru w modalu.
- `POST /api/tasks/{taskId}/time-entries`: Utworzenie nowego wpisu czasowego (endpoint do zaimplementowania w backendzie).

## 14. Finalizacja (Faza 4)

### 14.1. Poprawki
- **Lokalizacja kalendarza:** Upewnić się, że komponent `Calendar` używa poprawnego obiektu `locale` z `date-fns/locale/pl` zamiast stringa `"pl"`.
- **Testy E2E:** Przeprowadzenie testów wszystkich interakcji: zmiana daty, otwieranie modali, edycja, usuwanie i dodawanie wpisów.
- **Responsywność:** Sprawdzenie wyglądu i działania na urządzeniach mobilnych.
