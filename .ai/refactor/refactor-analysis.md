# Analiza plików w folderze `components` pod kątem złożoności (LOC - Lines of Code)

Na podstawie przeglądu wszystkich plików w folderze `src/components`, zidentyfikowałem **TOP 5 plików o największej liczbie linii kodu (LOC)**, wskazujących na potencjalnie wysoką złożoność. Analiza opiera się na pełnym przeczytaniu plików i oszacowaniu ich długości. Wybrałem pliki z największym LOC, skupiając się na tych, które przekraczają 150 linii, co sugeruje potrzebę refaktoryzacji dla lepszej czytelności, testowalności i utrzymania.

## TOP 5 plików o największej liczbie LOC:
1. **`src/components/dashboard/DashboardView.tsx`** - **414 linii**  
   Główny komponent dashboard, zarządzający stanem zadań, timera, modalami i interakcjami z API.

2. **`src/components/summaries/AddTimeEntryModal.tsx`** - **267 linii**  
   Modal do dodawania wpisów czasowych z walidacją dat, czasem i obsługą błędów.

3. **`src/components/summaries/EditTaskModalSummary.tsx`** - **262 linii**  
   Modal edycji zadań w widoku podsumowań, z historią sesji i obsługą dodawania czasu.

4. **`src/components/shared/EditSessionModal.tsx`** - **254 linii**  
   Modal edycji pojedynczych sesji czasowych z kalendarzem i walidacją.

5. **`src/components/dashboard/task/EditTaskModal.tsx`** - **155 linii**  
   Modal edycji zadań w dashboard, z historią sesji i integracją z timerem.

## Sugestie refaktoryzacji dla TOP 5 plików

Bazując na **tech-stack** (React 19, TypeScript 5, Tailwind 4, Shadcn/ui), skupiam się na wzorcach jak **custom hooks**, **compound components**, **render props** oraz **podział na mniejsze komponenty**. Celem jest zmniejszenie złożoności, poprawa reużywalności i ułatwienie testowania (z Vitest i React Testing Library).

### 1. `DashboardView.tsx` (414 linii) - Wysoka złożoność zarządzania stanem i modalami
**Potencjalne problemy:** Duży komponent z wieloma handlerami, stanami modalnymi i logiką biznesową. Łamie zasadę pojedynczej odpowiedzialności (Single Responsibility Principle).

**Sugerowane kierunki refaktoryzacji:**
- **Wyciągnąć logikę do custom hooks:** Utwórz `useDashboardActions` dla handlerów (np. `handleCreateTask`, `handleStartTimer`), aby oddzielić logikę od UI. Przykład:
  ```typescript
  // hooks/useDashboardActions.ts
  export function useDashboardActions(tasks, setTasks, activeTimer, setActiveTimer) {
    const handleCreateTask = async (data) => { /* logika */ };
    return { handleCreateTask, handleStartTimer, /* inne */ };
  }
  ```
  **Argumentacja:** React 19 wspiera hooks lepiej niż klasy; to zmniejszy LOC komponentu o ~200 linii, poprawi testowalność (Vitest) i reużywalność.
  
- **Podzielić na mniejsze komponenty:** Wyciągnij sekcje jak `<TaskManagementSection>` (lista zadań + przyciski) i `<ActiveTimerSection>` (karta timera). Użyj **compound components** dla modalnych grup.
  
- **Użyć Context API lub Zustand:** Dla globalnego stanu timera/tasks, aby uniknąć prop drilling. Shadcn/ui integruje się dobrze z Context.

- **Oczekiwany efekt:** Redukcja do ~150-200 linii, lepsza czytelność i łatwiejsze debugowanie.

### 2. `AddTimeEntryModal.tsx` (267 linii) - Złożona walidacja dat i czasu
**Potencjalne problemy:** Dużo logiki walidacji i formatowania dat, co utrudnia zrozumienie i testowanie.

**Sugerowane kierunki refaktoryzacji:**
- **Custom hook dla walidacji:** Utwórz `useTimeEntryValidation` do obsługi `formatDateTimeLocal`, walidacji zakresów dat i obliczeń czasu.
  ```typescript
  // hooks/useTimeEntryValidation.ts
  export function useTimeEntryValidation(initialDate) {
    const getMaxStartDateTime = () => { /* logika */ };
    return { getMaxStartDateTime, validateTimes, /* inne */ };
  }
  ```
  **Argumentacja:** TypeScript 5 pozwala na lepsze typowanie hooków; zmniejszy LOC o ~100 linii, ułatwi testowanie z Vitest (mockowanie dat).

- **Podzielić na sub-komponenty:** Wyciągnij `<TimeInputFields>` dla pól start/end time i `<DurationCalculator>` dla obliczeń. Użyj **render props** dla dynamicznych walidacji.

- **Biblioteka dat:** Zintegruj `date-fns` (już używane) w hooku, aby uprościć formatowanie.

- **Oczekiwany efekt:** Redukcja do ~150 linii, lepsza enkapsulacja logiki biznesowej.

### 3. `EditTaskModalSummary.tsx` (262 linii) - Zarządzanie sesjami i modalami
**Potencjalne problemy:** Mieszanie logiki pobierania sesji, edycji i obsługi błędów w jednym komponencie.

**Sugerowane kierunki refaktoryzacji:**
- **Custom hook dla sesji:** Utwórz `useTaskSessions` do `fetchSessions`, `filterSessionsByDate` i obsługi edycji.
  ```typescript
  // hooks/useTaskSessions.ts
  export function useTaskSessions(taskId, selectedDate) {
    const [sessions, setSessions] = useState([]);
    const fetchSessions = async () => { /* logika */ };
    return { sessions, fetchSessions, handleEditSession };
  }
  ```
  **Argumentacja:** React 19 hooks z `useCallback` optymalizują re-rendery; zmniejszy LOC o ~150 linii, poprawi testowalność (React Testing Library dla hooków).

- **Compound components:** Dla `<SessionList>` i `<AddSessionButton>`, aby modal był bardziej modułowy.

- **Error boundaries:** Dla obsługi błędów API, integrując z Shadcn/ui.

- **Oczekiwany efekt:** Redukcja do ~120 linii, lepsza separacja concerns.

### 4. `EditSessionModal.tsx` (254 linii) - Złożona edycja sesji z kalendarzem
**Potencjalne problemy:** Dużo stanu dla dat/godzin, walidacji i obsługi popoverów.

**Sugerowane kierunki refaktoryzacji:**
- **Custom hook dla formularza:** Utwórz `useSessionForm` do zarządzania stanem dat/godzin i walidacji.
  ```typescript
  // hooks/useSessionForm.ts
  export function useSessionForm(session) {
    const [startDate, setStartDate] = useState();
    const validateTimes = () => { /* logika */ };
    return { startDate, setStartDate, validateTimes, handleSubmit };
  }
  ```
  **Argumentacja:** TypeScript 5 umożliwia lepsze typowanie stanów; zmniejszy LOC o ~150 linii, ułatwi testowanie walidacji.

- **Podzielić na komponenty:** Wyciągnij `<DateTimePicker>` (z Shadcn/ui Calendar) jako reusable component.

- **Użyć controlled components:** Dla lepszej kontroli nad inputami czasu.

- **Oczekiwany efekt:** Redukcja do ~100 linii, zwiększona reużywalność.

### 5. `EditTaskModal.tsx` (155 linii) - Zarządzanie zadaniami i sesjami
**Potencjalne problemy:** Mieszanie logiki zadań i sesji, auto-opening modalu.

**Sugerowane kierunki refaktoryzacji:**
- **Custom hook dla modalu:** Utwórz `useEditTaskModal` do `fetchSessions`, `handleEditSession` i auto-opening.
  ```typescript
  // hooks/useEditTaskModal.ts
  export function useEditTaskModal(isOpen, taskId) {
    const [sessions, setSessions] = useState([]);
    useEffect(() => { if (isOpen) fetchSessions(); }, [isOpen]);
    return { sessions, handleEditSession };
  }
  ```
  **Argumentacja:** React hooks pozwalają na enkapsulację efektów; zmniejszy LOC o ~80 linii, poprawi czytelność.

- **Render props:** Dla warunkowego renderowania `<SessionHistoryList>`.

- **Memoizacja:** Użyj `React.memo` dla optymalizacji, jeśli komponent re-renderuje często.

- **Oczekiwany efekt:** Redukcja do ~80 linii, lepsza modułowość.

## Ogólne rekomendacje dla refaktoryzacji
- **Testowanie:** Po refaktoryzacji użyj Vitest do unit testów hooków i React Testing Library dla komponentów.
- **Stylizacja:** Tailwind 4 pozwala na utility-first, więc utrzymaj klasy, ale ekstraktuj do custom komponentów Shadcn/ui.
- **Wydajność:** React 19 z Suspense dla ładowania; unikaj niepotrzebnych re-renderów.
- **Dlaczego refaktoryzacja?** Duże LOC zwiększają ryzyko błędów, utrudniają code review i scaling. Te wzorce zmniejszą coupling, poprawią maintainability i zgodność z tech-stack.
