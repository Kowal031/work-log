# Status implementacji widoku Dashboard

## Zrealizowane kroki

### ✅ Faza 1: Podstawowa struktura i CRUD (UKOŃCZONA)

#### 1. Struktura plików i katalogów
- ✅ Utworzono katalogi:
  - `src/components/dashboard/hooks/`
  - `src/components/dashboard/task/`
  - `src/components/dashboard/timer/`
- ✅ Dodano typy ViewModels do `src/types.ts`:
  - `TaskViewModel` z flagą `isBeingEdited`
  - `ActiveTimerViewModel` z polem `taskName`

#### 2. Komponenty podstawowe
- ✅ `src/components/dashboard/timer/TimerDisplay.tsx` - licznik czasu z live update co 1s, obsługa pauzy
- ✅ `src/components/dashboard/timer/ActiveTimerCard.tsx` - sticky card z timerem, przyciski Pauza/Wznów/Stop
- ✅ `src/components/dashboard/task/TaskForm.tsx` - formularz z walidacją (min 3 znaki nazwa, max 5000 opis), licznik znaków
- ✅ `src/components/dashboard/task/CreateTaskModal.tsx` - modal tworzenia zadania
- ✅ `src/components/dashboard/task/EditTaskModal.tsx` - modal edycji zadania
- ✅ `src/components/dashboard/task/TaskItem.tsx` - karta zadania z akcjami, text-wrap dla opisu
- ✅ `src/components/dashboard/task/TaskList.tsx` - lista zadań z loading/empty state
- ✅ `src/components/dashboard/task/TaskListEmptyState.tsx` - pusty stan z CTA

#### 3. Zarządzanie stanem
- ✅ `src/components/dashboard/hooks/useDashboardState.ts` - custom hook hermetyzujący stan
- ✅ Zarządzanie stanem: tasks, activeTimer, isLoading, error, modals
- ✅ Callbacks z useCallback dla optymalizacji

#### 4. Główny komponent
- ✅ `src/components/dashboard/DashboardView.tsx` - główny komponent dashboard
- ✅ Podłączono do `src/pages/index.astro`
- ✅ Struktura: ActiveTimerCard (sticky) + Header + TaskList

#### 5. Integracja API
- ✅ `src/lib/api/tasks.api.ts` - wszystkie funkcje API:
  - `getTasks()` - GET /api/tasks
  - `getActiveTimer()` - GET /api/tasks/active-timer
  - `createTask()` - POST /api/tasks
  - `updateTask()` - PATCH /api/tasks/{taskId}
  - `startTimer()` - POST /api/tasks/{taskId}/time-entries/start
  - `stopTimer()` - POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop
- ✅ useEffect z Promise.all dla równoległego pobierania danych

#### 6. Obsługa akcji użytkownika
- ✅ `handleCreateTask` - tworzenie zadania z toast
- ✅ `handleEditTask` - edycja zadania z toast
- ✅ `handleStartTimer` - start timera z toast, obsługa 409 Conflict
- ✅ `handleStopTimer` - stop timera z obsługą błędów DailyCapacityExceeded poprzez modal CapacityExceededModal
- ✅ Instant UI feedback z rollback przy błędach

#### 7. Obsługa błędów
- ✅ Zainstalowano Sonner (toast notifications)
- ✅ Dodano Toaster do `src/layouts/Layout.astro`
- ✅ Try-catch we wszystkich handleCallach
- ✅ Toast dla sukcesu i błędów
- ✅ Specjalna obsługa 409 Conflict
- ✅ Poprawiono: brak toasta przy braku aktywnego timera (to normalna sytuacja)

#### 8. Walidacja i UX
- ✅ Walidacja formularza: min 3 znaki nazwa, max 5000 znaków opis
- ✅ Licznik znaków opisu: "{length} / 5000"
- ✅ Text-wrap dla opisu zadania (whitespace-pre-wrap break-words)
- ✅ Blokowanie Start buttons gdy timer aktywny
- ✅ Blokowanie Edit button gdy zadanie ma aktywny timer
- ✅ Loading state ze spinnerem
- ✅ Empty state z CTA "Utwórz pierwsze zadanie"

#### 9. Timer i UI
- ✅ Live counter z setInterval, aktualizacja co 1s (HH:MM:SS)
- ✅ Sticky positioning dla ActiveTimerCard (top-4 z-50)
- ✅ Przyciski Pauza/Wznów (UI state, backend nie wspiera)
- ✅ Pauza zamraża licznik wizualnie
- ✅ Ikony z Lucide React (Play, Pause, Square, Pencil, Plus)
- ✅ Status badge "PAUZA"

#### 10. Komponenty Shadcn/ui
- ✅ Zainstalowano: Button, Card, Dialog, Input, Label, Textarea, Sonner
- ✅ Użyto w komponentach: Card, Dialog, Input, Label, Textarea
- ✅ Toast notifications działają

## Kolejne kroki

### 🔄 Faza 2: Funkcjonalności dodatkowe (DO ZREALIZOWANIA)

#### P0 - Krytyczne (blokują podstawową funkcjonalność)

##### 11. Recovery Modal (F-06 z PRD) - PRIORYTET 1
**Komponenty do utworzenia:**
- `src/components/dashboard/RecoveryModal.tsx`
- `src/lib/utils/recovery.utils.ts` (obliczanie elapsed time, formatowanie)

**Funkcjonalności:**
- Sprawdzanie aktywnego timera przy starcie aplikacji (już mamy GET /api/tasks/active-timer)
- localStorage dla timestamp zamknięcia (beforeunload event)
- Obliczanie elapsed time od start_time do teraz
- Formatowanie czasu: "2d 3h 15m" dla długich czasów
- Ostrzeżenie gdy >12h: "⚠️ Timer był aktywny przez 48h 23m. Czy to jest poprawne?"
- Trzy przyciski:
  - "Zapisz cały czas" → stop z aktualnym czasem
  - "Odrzuć czas od zamknięcia" → stop z czasem z localStorage
  - "Skoryguj ręcznie" → otwiera edit modal z pre-wybraną sesją
- Confirmation gdy "Skoryguj" bez zmian

**Zależności:** AlertDialog (Shadcn/ui)

##### 12. Complete Task (F-02 z PRD) - PRIORYTET 2
**Komponenty do utworzenia:**
- `src/components/dashboard/task/CompleteConfirmationDialog.tsx`
- Dodać przycisk "Ukończ" do `TaskItem.tsx`

**Funkcjonalności:**
- Przycisk "Ukończ" w TaskItem (disabled gdy timer aktywny)
- Dialog: "Czy na pewno chcesz oznaczyć jako ukończone? Zadanie zostanie zarchiwizowane."
- handleCompleteTask: PATCH /api/tasks/{taskId} z status: "completed"
- Animacja fade-out przy ukończeniu
- Usunięcie z listy tasks po potwierdzeniu
- Toast: "Zadanie ukończone"

**Zależności:** AlertDialog (Shadcn/ui)

##### 13. Top Navigation Bar - PRIORYTET 3
**Komponenty do utworzenia:**
- `src/components/layout/TopNavigationBar.tsx`
- `src/components/layout/MobileNav.tsx`
- Zaktualizować `src/layouts/Layout.astro`

**Funkcjonalności:**
- Logo (link do Dashboard)
- Linki: "Pulpit" | "Podsumowania"
- Przycisk Logout
- Aktywny stan dla bieżącej strony
- Mobile: hamburger menu z drawer/sheet
- Persistent na wszystkich stronach

**Zależności:** Sheet (Shadcn/ui) dla mobile

#### P1 - Ważne (wpływają na UX)

##### 14. Total Time per Task
**Do zmodyfikowania:**
- `src/types.ts` - dodać pola do TaskViewModel
- `src/lib/utils/time.utils.ts` - funkcje formatowania
- `src/components/dashboard/DashboardView.tsx` - obliczanie total time
- `src/components/dashboard/task/TaskItem.tsx` - wyświetlanie

**Funkcjonalności:**
- Dodać `totalTimeSeconds: number` i `totalTimeFormatted: string` do TaskViewModel
- Funkcja `calculateTotalTime(sessions: TimeEntry[]): number`
- Funkcja `formatDuration(seconds: number): string` → "8h 45m"
- Pobieranie sesji dla każdego zadania (GET /api/tasks/{id}/time-entries lub agregacja na backendzie)
- Wyświetlanie w TaskItem obok nazwy
- Aktualizacja po stop timer

##### 15. Status Filtering
**Do zmodyfikowania:**
- `src/lib/api/tasks.api.ts` - dodać query param
- `src/components/dashboard/DashboardView.tsx` - użyć ?status=active

**Funkcjonalności:**
- Zmienić getTasks() na getTasks(status?: 'active' | 'completed')
- Wywołanie: getTasks('active')
- Tylko aktywne zadania na liście
- Opcjonalnie: toggle "Pokaż ukończone" (nice to have)

#### P2 - Ulepszenia

##### 16. Session History w EditModal
**Komponenty do utworzenia:**
- `src/components/dashboard/task/SessionHistoryList.tsx`
- `src/components/dashboard/task/EditSessionModal.tsx`

**Do zmodyfikowania:**
- `src/components/dashboard/task/EditTaskModal.tsx`

**Funkcjonalności:**
- Sekcja "Historia sesji" w EditTaskModal (ScrollArea + Separator)
- Lista sesji z timestamp "09:30 - 11:45 (2h 15m)"
- Ikona edycji przy każdej sesji
- Modal edycji sesji z polami start_time, end_time
- Walidacja: end_time > start_time
- PATCH /api/tasks/{taskId}/time-entries/{timeEntryId}
- Przycisk "Usuń sesję" jako secondary destructive action

##### 17. Status Indicator
**Komponenty do utworzenia:**
- `src/components/dashboard/task/StatusIndicator.tsx`

**Do zmodyfikowania:**
- `src/components/dashboard/task/TaskItem.tsx`

**Funkcjonalności:**
- Pulsująca zielona kropka dla aktywnego timera
- CSS animation pulse (Tailwind: animate-pulse)
- Conditional rendering w TaskItem

##### 18. Mobile Adaptations
**Do zmodyfikowania:**
- Wszystkie komponenty dashboard
- Dodać responsive breakpoints (sm:, md:, lg:)

**Funkcjonalności:**
- FAB (Floating Action Button) dla "Dodaj zadanie" na mobile
- Dropdown menu dla akcji w TaskItem (kompaktowy widok)
- Sheet (pełnoekranowy modal) dla mobile dialogs
- Compact view dla TaskItem na mobile
- Testowanie na różnych rozdzielczościach

##### 19. Auto-scroll
**Do zmodyfikowania:**
- `src/components/dashboard/DashboardView.tsx`

**Funkcjonalności:**
- useEffect z scrollIntoView() po starcie timera
- Smooth scroll animation: `behavior: 'smooth'`
- Scroll do sticky ActiveTimerCard
- Opcjonalnie: scroll do nowo utworzonego zadania

### 🧪 Faza 3: Testowanie i optymalizacja

##### 20. Responsywność
- Testowanie na mobile (320px+)
- Testowanie na tablet (768px+)
- Testowanie na desktop (1024px+)
- Weryfikacja breakpoints Tailwind

##### 21. Accessibility
- Nawigacja klawiaturą (Tab order)
- Screen reader testing
- ARIA labels kompletne
- Focus management w modalach
- Contrast ratio (WCAG AA)

##### 22. Performance
- Optymalizacja re-renderów (React.memo gdzie potrzeba)
- Lazy loading modali
- Debouncing dla walidacji
- Profiling z React DevTools

##### 23. Error scenarios
- Testowanie 409 Conflict
- Testowanie 403 Forbidden
- Testowanie 404 Not Found
- Testowanie 401 Unauthorized (redirect)
- Testowanie timeout/network errors

##### 24. User testing
- Przepływ Recovery Modal (wszystkie 3 opcje)
- Przepływ Complete Task
- Nawigacja między widokami
- Tworzenie/edycja zadań
- Start/Stop/Pauza timera

## Znane ograniczenia

### Backend nie wspiera pauzy
- Przyciski Pauza/Wznów działają tylko na UI (zamrażają licznik)
- Nie tworzą osobnych sesji w bazie
- Do rozważenia: dodanie do API w przyszłości jako enhancement

### Total Time wymaga dodatkowej implementacji
- Obecnie nie pobieramy sesji dla zadań
- Potrzebne: agregacja po stronie backendu lub dodatkowe zapytania
- Może wpłynąć na performance przy wielu zadaniach

### localStorage dla Recovery
- Wymaga obsługi beforeunload/visibilitychange events
- Może nie działać jeśli user force-close browser
- Należy testować różne scenariusze zamknięcia

## Struktura plików (obecna)

```
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardView.tsx ✅
│   │   ├── hooks/
│   │   │   └── useDashboardState.ts ✅
│   │   ├── task/
│   │   │   ├── CreateTaskModal.tsx ✅
│   │   │   ├── EditTaskModal.tsx ✅
│   │   │   ├── TaskForm.tsx ✅
│   │   │   ├── TaskItem.tsx ✅
│   │   │   ├── TaskList.tsx ✅
│   │   │   └── TaskListEmptyState.tsx ✅
│   │   └── timer/
│   │       ├── ActiveTimerCard.tsx ✅
│   │       └── TimerDisplay.tsx ✅
│   ├── ui/ (Shadcn/ui) ✅
│   └── Welcome.astro
├── layouts/
│   └── Layout.astro ✅ (z Toaster)
├── lib/
│   ├── api/
│   │   └── tasks.api.ts ✅
│   └── utils.ts
├── pages/
│   └── index.astro ✅
└── types.ts ✅ (z ViewModels)
```

## Metryki pokrycia

- **Podstawowe CRUD**: ✅ 100%
- **Timer funkcjonalność**: ✅ 100% (bez backend pauzy)
- **Walidacja i błędy**: ✅ 100%
- **UI/UX podstawowe**: ✅ 100%
- **Funkcjonalności dodatkowe**: ⏳ 0% (Faza 2)
- **Responsywność mobile**: ⏳ 50% (działa ale nie ma dedykowanych rozwiązań)
- **Accessibility**: ⏳ 70% (podstawowe ARIA, brak pełnego testingu)

**Ogólne pokrycie planu**: ~70% (Faza 1 ukończona, Faza 2 i 3 do zrobienia)
