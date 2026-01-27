# API Endpoint Implementation Plan: Create Time Entry

## 1. Przegląd punktu końcowego

Endpoint **POST /api/tasks/{taskId}/time-entries** umożliwia zalogowanym użytkownikom ręczne utworzenie nowej sesji czasowej dla zadania z określonymi czasami rozpoczęcia i zakończenia. Jest to alternatywa dla automatycznego timera (start/stop), używana głównie w widoku Summaries do dodawania czasu pracy wstecz.

**Kluczowe funkcjonalności:**
- Ręczne tworzenie time entry z start_time i end_time
- Walidacja: end_time > start_time
- Walidacja: czasy nie mogą być w przyszłości
- Weryfikacja, że zadanie należy do użytkownika
- Zapis do bazy danych z user_id

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/tasks/{taskId}/time-entries`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>` (obsługiwane przez Supabase Auth via cookies/headers)
  
- **Path Parameters**:
  - `taskId` (string, UUID): ID zadania, dla którego tworzony jest wpis czasu

- **Request Body**:
  ```json
  {
    "start_time": "2026-01-27T09:00:00.000Z",
    "end_time": "2026-01-27T17:00:00.000Z"
  }
  ```

- **Przykładowe żądania**:
  ```bash
  # Utworzenie sesji 8-godzinnej
  POST /api/tasks/550e8400-e29b-41d4-a716-446655440000/time-entries
  Content-Type: application/json
  
  {
    "start_time": "2026-01-27T09:00:00.000Z",
    "end_time": "2026-01-27T17:00:00.000Z"
  }
  
  # Utworzenie krótkiej sesji (1 godzina)
  POST /api/tasks/550e8400-e29b-41d4-a716-446655440000/time-entries
  
  {
    "start_time": "2026-01-27T10:00:00.000Z",
    "end_time": "2026-01-27T11:00:00.000Z"
  }
  ```

## 3. Wykorzystywane typy

### Request DTOs

**CreateTimeEntryRequestDto** - Dane wejściowe:
```typescript
interface CreateTimeEntryRequestDto {
  start_time: string; // ISO 8601 timestamp
  end_time: string;   // ISO 8601 timestamp
}
```

### Response DTOs

**TimeEntryResponseDto** - Odpowiedź sukcesu:
```typescript
interface TimeEntryResponseDto {
  id: string;         // UUID
  task_id: string;    // UUID
  start_time: string; // ISO 8601 timestamp
  end_time: string;   // ISO 8601 timestamp
}
```

### Error DTOs

**ErrorResponseDto** - Standardowa struktura błędów:
```typescript
interface ErrorResponseDto {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
```

## 4. Szczegóły odpowiedzi

### Sukces - 201 Created

**Response Body**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440099",
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "start_time": "2026-01-27T09:00:00.000Z",
  "end_time": "2026-01-27T17:00:00.000Z"
}
```

**Headers**:
```
Content-Type: application/json
Location: /api/tasks/550e8400-e29b-41d4-a716-446655440000/time-entries/770e8400-e29b-41d4-a716-446655440099
```

### Błędy

**400 Bad Request** - Nieprawidłowa walidacja:
```json
{
  "error": "ValidationError",
  "message": "Request body validation failed",
  "details": {
    "errors": [
      {
        "field": "end_time",
        "message": "end_time must be after start_time"
      }
    ]
  }
}
```

**400 Bad Request** - Czasy w przyszłości:
```json
{
  "error": "BadRequest",
  "message": "Times cannot be in the future"
}
```

**400 Bad Request** - Nieprawidłowy format UUID:
```json
{
  "error": "BadRequest",
  "message": "Invalid task ID format. Must be a valid UUID."
}
```

**401 Unauthorized** - Brak autoryzacji:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required to create time entry"
}
```

**404 Not Found** - Zadanie nie istnieje lub nie należy do użytkownika:
```json
{
  "error": "NotFound",
  "message": "Task not found or you don't have permission to access it"
}
```

**500 Internal Server Error** - Błąd serwera:
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred while creating time entry"
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/tasks/{taskId}/time-entries
       │ Body: { start_time, end_time }
       ▼
┌─────────────────────────────────────────┐
│  Astro API Route Handler                │
│  (src/pages/api/tasks/[taskId]/         │
│   time-entries.ts)                      │
│                                          │
│  1. Check prerender = false             │
│  2. Verify HTTP method is POST          │
│  3. Extract taskId from path params     │
│  4. Parse request body                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Path Parameter Validation               │
│                                          │
│  - Validate taskId is valid UUID        │
│  - Return 400 if invalid format         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Authentication Check                    │
│                                          │
│  - Get user from session                │
│  - Return 401 if not authenticated      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Request Body Validation                 │
│                                          │
│  - Validate start_time format (ISO)     │
│  - Validate end_time format (ISO)       │
│  - Both fields required                 │
│  - Return 400 if validation fails       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Business Logic Validation               │
│                                          │
│  - Check end_time > start_time          │
│  - Check times are not in future        │
│  - Return 400 if validation fails       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Task Ownership Verification             │
│                                          │
│  SELECT id FROM tasks                   │
│  WHERE id = $taskId                     │
│    AND user_id = $userId                │
│                                          │
│  - RLS Policy ensures user_id match    │
│  - Return 404 if task not found         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Time Entry Service Layer                │
│  (src/lib/services/time-entry.service.ts)│
│                                          │
│  - Execute createTimeEntry()            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase Database Insert                │
│                                          │
│  INSERT INTO time_entries               │
│    (task_id, user_id, start_time,       │
│     end_time)                           │
│  VALUES ($1, $2, $3, $4)                │
│  RETURNING id, task_id, start_time,     │
│            end_time                     │
│                                          │
│  - RLS Policy ensures user_id match    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Build Response DTO                      │
│                                          │
│  - TimeEntryResponseDto                 │
│  - Set status 201 Created               │
│  - Set Location header                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  API Route Response                      │
│                                          │
│  - Return JSON response                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Client    │
│  (Success)  │
└─────────────┘

Error Flow:
═══════════
At any stage, if an error occurs:
1. Catch the error
2. Log details (console.error)
3. Determine appropriate status code
4. Build ErrorResponseDto
5. Return error response to client
```

## 6. Względy bezpieczeństwa

### 1. Uwierzytelnianie (Authentication)

**Implementacja:**
- Sprawdzenie sesji użytkownika przez `locals.supabase.auth.getUser()`
- Endpoint wymaga zalogowanego użytkownika
- Zwrócenie 401 Unauthorized jeśli sesja nie istnieje

### 2. Autoryzacja (Authorization)

**Weryfikacja własności zadania:**
- Query sprawdza `WHERE task_id = $taskId AND user_id = $userId`
- RLS Policy na poziomie bazy danych
- Użytkownik może tworzyć time entries tylko dla swoich zadań
- Zwrócenie 404 jeśli zadanie nie należy do użytkownika

**Automatyczne przypisanie user_id:**
- INSERT zawiera `user_id` z sesji
- Niemożliwe utworzenie wpisu dla innego użytkownika

### 3. Input Validation

**Walidacja czasu:**
- end_time > start_time (logiczna spójność)
- Czasy nie mogą być w przyszłości (data integrity)
- Format ISO 8601 (parsowanie przez Date constructor)
- Zod schema validation dla request body

### 4. SQL Injection Protection

**Parametryzowane queries:**
- Wszystkie wartości przekazywane jako parametry
- Supabase client automatycznie sanitizuje
- Brak raw SQL construction

## 7. Obsługa błędów

### 1. Błędy walidacji (400 Bad Request)

**Scenariusze:**
- Brak start_time lub end_time
- Nieprawidłowy format timestamp (nie ISO 8601)
- end_time <= start_time
- Czasy w przyszłości
- Nieprawidłowy format UUID taskId

### 2. Błędy autoryzacji (401 Unauthorized)

**Scenariusze:**
- Brak tokenu autoryzacyjnego
- Nieważny token (wygasła sesja)
- Token nie powiązany z użytkownikiem

### 3. Błędy zasobów (404 Not Found)

**Scenariusze:**
- Zadanie o podanym taskId nie istnieje
- Zadanie nie należy do zalogowanego użytkownika
- Zadanie zostało usunięte

### 4. Błędy bazy danych (500 Internal Server Error)

**Scenariusze:**
- Utrata połączenia z bazą danych
- Błąd RLS policy
- Constraint violation (unexpected)
- Timeout zapytania

## 8. Rozważania dotyczące wydajności

### 1. Optymalizacja zapytań

**Single query approach:**
- Jedno query do weryfikacji task ownership
- Jedno query do INSERT time entry
- ~10-20ms execution time

### 2. Indeksy

**Wymagane indeksy:**
```sql
-- Task lookup and ownership check
CREATE INDEX idx_tasks_user_id ON tasks(user_id, id);

-- Time entries by task
CREATE INDEX idx_time_entries_task_user 
ON time_entries(task_id, user_id);
```

### 3. Walidacja po stronie klienta

**Pre-validation:**
- Frontend sprawdza end > start przed wysłaniem
- Frontend blokuje przyszłe daty
- Redukcja niepotrzebnych requestów

### 4. Transaction safety

**Atomowość:**
- Single INSERT operation (atomic by default)
- No need for explicit transaction
- Rollback automatyczny przy błędzie

## 9. Kroki implementacji

### Krok 1: Rozszerzenie types.ts

**Zadania:**
1. Dodać `CreateTimeEntryRequestDto`
2. Upewnić się, że `TimeEntryResponseDto` istnieje
3. TypeScript validation

### Krok 2: Dodanie schematu walidacji

**Zadania:**
1. Otworzyć `src/lib/validation/time-entry.validation.ts`
2. Dodać `createTimeEntrySchema` z Zod
3. Walidacja ISO 8601 timestamps
4. Wymagane pola: start_time, end_time

### Krok 3: Rozszerzenie serwisu time-entry

**Zadania:**
1. Otworzyć `src/lib/services/time-entry.service.ts`
2. Dodać funkcję `createTimeEntry(supabase, userId, taskId, data)`
3. INSERT do time_entries
4. RETURNING id, task_id, start_time, end_time

### Krok 4: Rozszerzenie endpointu time-entries

**Zadania:**
1. Otworzyć `src/pages/api/tasks/[taskId]/time-entries.ts`
2. Dodać eksport `POST: APIRoute`
3. Wyekstrahować taskId z params
4. Walidować UUID format
5. Parse request body
6. Walidować z Zod schema
7. Sprawdzić authentication
8. Sprawdzić task ownership
9. Walidować end_time > start_time
10. Walidować brak przyszłych czasów
11. Wywołać createTimeEntry service
12. Zwrócić 201 Created z Location header

### Krok 5: Dodanie funkcji API po stronie frontendu

**Zadania:**
1. Otworzyć `src/lib/api/tasks.api.ts`
2. Dodać funkcję `createTimeEntry(taskId, data)`
3. POST request do `/api/tasks/${taskId}/time-entries`
4. Obsługa błędów z try-catch
5. Return TimeEntryResponseDto

### Krok 6: Obsługa błędów

**Zadania:**
1. Try-catch dla wszystkich operacji
2. Szczegółowe komunikaty błędów
3. Odpowiednie status codes
4. Logging błędów

### Krok 7: Weryfikacja błędów kompilacji

**Zadania:**
1. TypeScript compiler check
2. Linter check
3. Naprawienie błędów

### Krok 8: Testowanie endpointu

**Zadania:**
1. Test - sukces (201)
2. Test - end_time <= start_time (400)
3. Test - przyszłe czasy (400)
4. Test - nieprawidłowy UUID (400)
5. Test - bez autoryzacji (401)
6. Test - zadanie nie istnieje (404)
7. Test - zadanie innego użytkownika (404)

### Edge Cases

**Overlapping entries:**
- Możliwe (brak walidacji overlaps w tym endpointcie)
- Frontend może ostrzec, ale nie blokuje
- Użytkownik odpowiedzialny za sensowność danych

**Zero duration:**
- start_time == end_time (walidacja: end > start)
- Zwraca 400 Bad Request

**Very long duration:**
- Np. 24+ godzin
- Dozwolone (brak limitu górnego)
- Sensowność po stronie użytkownika

**Timezone handling:**
- Wszystkie czasy w UTC (ISO 8601 z Z)
- Client odpowiedzialny za konwersję do local time
- Server nie interpretuje timezone

## 10. Integracja z UI

### AddTimeEntryModal

**Użycie:**
```tsx
const handleSave = async (data: { start_time: string; end_time: string }) => {
  await tasksApi.createTimeEntry(taskId, data);
  toast.success("Sesja została dodana");
  refetch(); // Odświeżenie danych
  onClose();
};

<AddTimeEntryModal
  isOpen={isOpen}
  onClose={onClose}
  taskName={taskName}
  initialDate={selectedDate}
  onSave={handleSave}
/>
```

### SelectOrCreateTaskModal

**Workflow:**
```tsx
const handleTaskSelected = (taskId: string, taskName: string) => {
  setSelectedTaskId(taskId);
  setSelectedTaskName(taskName);
  setIsAddTimeModalOpen(true);
};
```

### SummariesView orchestration

**Przepływ:**
1. User klika "+ Dodaj czas"
2. Otwiera się SelectOrCreateTaskModal
3. User wybiera/tworzy zadanie
4. Otwiera się AddTimeEntryModal z wybranym taskId
5. User wprowadza start/end times
6. Wywołanie createTimeEntry API
7. Odświeżenie danych z refetch()
8. Toast notification
