# API Endpoint Implementation Plan: Start Time Entry

## 1. Przegląd punktu końcowego

Endpoint **POST /api/tasks/{taskId}/time-entries/start** umożliwia zalogowanym użytkownikom rozpoczęcie śledzenia czasu dla wybranego zadania. Kluczową logiką biznesową jest sprawdzenie, czy użytkownik nie ma już aktywnego timera dla innego zadania - system pozwala tylko na jeden aktywny timer na raz.

**Kluczowe funkcjonalności:**
- Rozpoczęcie nowego time entry dla zadania
- Automatyczne ustawienie start_time na aktualny czas
- Sprawdzenie czy użytkownik nie ma już aktywnego timera (409 Conflict)
- Weryfikacja czy zadanie istnieje i należy do użytkownika (404)
- Zwracanie utworzonego time entry z pustym end_time

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/tasks/{taskId}/time-entries/start`
- **Headers**:
  - `Authorization: Bearer <token>` (obsługiwane przez Supabase Auth via cookies/headers)
  
- **Parametry**:
  - **Path Parameters**:
    - `taskId` (string, UUID): Identyfikator zadania dla którego rozpoczynamy timer
  
  - **Request Body**: Pusty (brak danych wejściowych)

- **Przykładowe żądania**:
  ```bash
  # Rozpoczęcie timera dla zadania
  POST /api/tasks/550e8400-e29b-41d4-a716-446655440000/time-entries/start
  
  # Brak body - wszystkie dane z path params i auth
  ```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**TimeEntryResponseDto** - Struktura odpowiedzi:
```typescript
type TimeEntryResponseDto = Omit<TimeEntry, "user_id" | "created_at">;
// {
//   id: string;              // UUID time entry
//   task_id: string;         // UUID zadania
//   start_time: string;      // ISO 8601 timestamp
//   end_time: string | null; // null dla aktywnego timera
// }
```

### Command Models

**StartTimeEntryCommand** - Model dla warstwy serwisowej:
```typescript
interface StartTimeEntryCommand {
  user_id: string;    // UUID użytkownika z sesji
  task_id: string;    // UUID zadania z path params
  start_time: string; // ISO 8601 timestamp (now)
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
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "start_time": "2026-01-25T10:30:00.000Z",
  "end_time": null
}
```

**Headers**:
```
Content-Type: application/json
Location: /api/tasks/{taskId}/time-entries/{timeEntryId}
```

### Błędy

**400 Bad Request** - Nieprawidłowy UUID:
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
  "message": "Authentication required to start timer"
}
```

**404 Not Found** - Zadanie nie istnieje:
```json
{
  "error": "NotFound",
  "message": "Task not found or you don't have permission to track time for it"
}
```

**409 Conflict** - Już jest aktywny timer:
```json
{
  "error": "Conflict",
  "message": "You already have an active timer running. Please stop it before starting a new one.",
  "details": {
    "active_timer_id": "880e8400-e29b-41d4-a716-446655440000",
    "active_task_id": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

**405 Method Not Allowed** - Nieprawidłowa metoda HTTP:
```json
{
  "error": "MethodNotAllowed",
  "message": "Only POST method is allowed for this endpoint"
}
```

**500 Internal Server Error** - Błąd serwera:
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred while starting the timer"
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/tasks/{taskId}/time-entries/start
       │ (empty body)
       ▼
┌─────────────────────────────────────────┐
│  Astro API Route Handler                │
│  (src/pages/api/tasks/[taskId]/        │
│   time-entries/start.ts)                │
│                                          │
│  1. Check prerender = false             │
│  2. Extract taskId from params          │
│  3. Validate UUID format                │
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
│  Check Task Existence & Ownership        │
│  (Task Service)                          │
│                                          │
│  - Query: SELECT id FROM tasks          │
│    WHERE id = $1 AND user_id = $2       │
│  - Return 404 if not found              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Check for Active Timer (User-wide)      │
│  (Time Entry Service)                    │
│                                          │
│  - Query: SELECT * FROM time_entries    │
│    WHERE user_id = $1 AND end_time IS   │
│    NULL                                  │
│  - Return 409 Conflict if exists        │
│  - Include active timer details         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Create Command Object                   │
│                                          │
│  - Build StartTimeEntryCommand          │
│  - user_id from authenticated user      │
│  - task_id from path params             │
│  - start_time = new Date().toISOString()│
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Time Entry Service Layer                │
│  (src/lib/services/                      │
│   time-entry.service.ts)                 │
│                                          │
│  - Execute startTimeEntry(command)      │
│  - Handle business logic                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase Database Interaction           │
│                                          │
│  1. Insert into time_entries table:     │
│     INSERT INTO time_entries            │
│     (user_id, task_id, start_time,      │
│      end_time)                          │
│     VALUES ($1, $2, $3, NULL)           │
│     RETURNING *                         │
│                                          │
│  2. RLS Policy Check:                   │
│     - Verify auth.uid() = user_id       │
│                                          │
│  3. Unique constraint check:            │
│     - idx_time_entries_user_active      │
│     - Ensures only 1 active per user    │
│                                          │
│  4. Return inserted row                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Transform Response                      │
│  (Service Layer)                         │
│                                          │
│  - Remove user_id and created_at        │
│  - Return TimeEntryResponseDto          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  API Route Response                      │
│                                          │
│  - Set status 201 Created               │
│  - Set Location header                  │
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
- Sprawdzenie sesji użytkownika przez `Astro.locals.supabase.auth.getUser()`
- Endpoint wymaga zalogowanego użytkownika
- Zwrócenie 401 Unauthorized jeśli sesja nie istnieje

### 2. Autoryzacja (Authorization)

**Weryfikacja własności zadania:**
- Sprawdzenie czy zadanie istnieje i należy do użytkownika
- Query: `SELECT id FROM tasks WHERE id = $taskId AND user_id = $userId`
- Jeśli nie istnieje lub nie należy do użytkownika: 404 Not Found

**RLS Policies:**
- INSERT na time_entries wymaga auth.uid() = user_id
- Automatyczna ochrona przed utworzeniem time entry dla innego usera

### 3. Logika biznesowa - Single Active Timer

**Ochrona przed wieloma timerami:**
- Sprawdzenie czy użytkownik nie ma już aktywnego timera
- Query: `SELECT * FROM time_entries WHERE user_id = $1 AND end_time IS NULL`
- Jeśli istnieje: 409 Conflict z szczegółami aktywnego timera
- Wspierane przez unique index: `idx_time_entries_user_active`

### 4. Path Parameter Validation

**UUID Validation:**
- Walidacja czy taskId jest prawidłowym UUID
- Zapobiega SQL injection przez nieprawidłowe ID
- Zwrócenie 400 Bad Request jeśli nieprawidłowy format

### 5. Time Integrity

**ISO 8601 Timestamps:**
- start_time zawsze w UTC
- Generowane po stronie serwera (new Date().toISOString())
- Zapobiega manipulacji czasem przez klienta

### 6. Database Constraints

**Unique Index:**
```sql
CREATE UNIQUE INDEX idx_time_entries_user_active 
ON time_entries(user_id) 
WHERE end_time IS NULL;
```
- Gwarantuje tylko jeden aktywny timer na użytkownika
- Database-level enforcement (dodatkowa warstwa ochrony)

## 7. Obsługa błędów

### 1. Błędy walidacji (400 Bad Request)

**Scenariusze:**
- Nieprawidłowy format taskId (nie UUID)
- Brak taskId w path params

### 2. Błędy autoryzacji (401 Unauthorized)

**Scenariusze:**
- Brak tokenu autoryzacyjnego
- Nieważny token (wygasła sesja)
- Token nie powiązany z użytkownikiem

### 3. Błędy nie znaleziono (404 Not Found)

**Scenariusze:**
- Zadanie o podanym ID nie istnieje
- Zadanie należy do innego użytkownika
- Zadanie zostało usunięte

### 4. Błędy konfliktu (409 Conflict)

**Scenariusze:**
- Użytkownik ma już aktywny timer dla innego zadania
- Próba rozpoczęcia timera gdy poprzedni nie został zatrzymany
- Response zawiera szczegóły aktywnego timera

### 5. Błędy bazy danych (500 Internal Server Error)

**Scenariusze:**
- Utrata połączenia z bazą danych
- Naruszenie constraint (unique index)
- Błąd RLS policy
- Timeout zapytania

### 6. Błędy HTTP Method (405 Method Not Allowed)

**Scenariusze:**
- Użycie innej metody niż POST

## 8. Rozważania dotyczące wydajności

### 1. Optymalizacja zapytań

**Three-step process:**
1. SELECT dla sprawdzenia task existence (~5-10ms)
2. SELECT dla sprawdzenia active timer (~5-10ms)
3. INSERT dla utworzenia time entry (~5-10ms)
Total: ~15-30ms + network

**Możliwa optymalizacja:**
- Połączenie kroków 1-2 w jedną transakcję
- Użycie PostgreSQL function dla atomic checks

### 2. Indeksy

**Wymagane indeksy:**
```sql
-- Task existence check
CREATE INDEX idx_tasks_id_user ON tasks(id, user_id);

-- Active timer check (unique constraint)
CREATE UNIQUE INDEX idx_time_entries_user_active 
ON time_entries(user_id) 
WHERE end_time IS NULL;

-- Time entries lookup
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
```

### 3. Walidacja przed query

**Early returns:**
- Walidacja UUID przed query do bazy
- Sprawdzenie autoryzacji przed costly operations
- Fast-fail pattern dla błędów

### 4. Database Constraints vs Application Logic

**Dual enforcement:**
- Application check: Lepsze error messages (409 z details)
- Database constraint: Safety net (zapobiega race conditions)
- Oba mechanizmy działają razem

## 9. Kroki implementacji

### Krok 1: Utworzenie struktury plików

**Lokalizacja:** `src/pages/api/tasks/[taskId]/time-entries/start.ts` (nowy plik)

**Zadania:**
1. Utworzyć folder `time-entries` w `src/pages/api/tasks/[taskId]/`
2. Utworzyć plik `start.ts` dla start endpoint
3. Dodać `export const prerender = false`

### Krok 2: Rozszerzenie time-entry.service.ts

**Lokalizacja:** `src/lib/services/time-entry.service.ts` (istniejący plik)

**Zadania:**
1. Dodać funkcję `getActiveTimer(supabase, userId)` - zwraca aktywny timer lub null
2. Dodać funkcję `startTimeEntry(supabase, command)` - tworzy nowy time entry
3. Obsługa błędów i transformacja response

### Krok 3: Dodanie funkcji w task.service.ts

**Lokalizacja:** `src/lib/services/task.service.ts` (istniejący plik)

**Zadania:**
1. Dodać funkcję `taskExists(supabase, taskId, userId)` - sprawdza istnienie
2. Zwraca boolean
3. Używa simple SELECT query

### Krok 4: Implementacja POST handler

**Lokalizacja:** `src/pages/api/tasks/[taskId]/time-entries/start.ts`

**Zadania:**
1. Dodać eksport `POST: APIRoute`
2. Wyekstrahować taskId z `Astro.params`
3. Walidować UUID format taskId
4. Sprawdzić autoryzację
5. Sprawdzić istnienie zadania (404)
6. Sprawdzić aktywny timer (409)
7. Utworzyć time entry

### Krok 5: Generowanie start_time

**Zadania:**
1. Użyć `new Date().toISOString()` dla current timestamp
2. Zawsze UTC timezone
3. Format ISO 8601

### Krok 6: Tworzenie time entry

**Zadania:**
1. Utworzyć StartTimeEntryCommand
2. Wywołać `startTimeEntry()` z serwisu
3. Zwrócić 201 Created z Location header
4. Response z TimeEntryResponseDto

### Krok 7: Obsługa konfliktów (409)

**Zadania:**
1. Wywołać `getActiveTimer()`
2. Jeśli istnieje, przygotować szczegółowy error response
3. Zawrzeć active_timer_id i active_task_id w details
4. Zwrócić 409 Conflict

### Krok 8: Obsługa błędów

**Zadania:**
1. Try-catch dla wszystkich operacji
2. Szczegółowe komunikaty błędów
3. Odpowiednie status codes
4. Logging

### Krok 9: Weryfikacja błędów kompilacji

**Zadania:**
1. TypeScript compiler check
2. Linter check
3. Naprawienie błędów

### Krok 10: Testowanie endpointu

**Zadania:**
1. Test podstawowy - start timer dla zadania
2. Test 409 - próba startu gdy timer aktywny
3. Test 404 - nieistniejące zadanie
4. Test 401 - brak autoryzacji
5. Test 400 - nieprawidłowy UUID

### Krok 11: Aktualizacja dokumentacji

**Zadania:**
1. Dodać dokumentację POST /api/tasks/{taskId}/time-entries/start do README.md
2. Przykłady requestów i responses
3. Lista błędów
4. Przykłady użycia

### Krok 12: Testy integracyjne (opcjonalne)

**Zadania:**
1. Test scenariusza: create task -> start timer -> verify
2. Test scenariusza: start timer -> try start another -> 409
3. Test scenariusza: start timer -> stop -> start again

## 10. Dodatkowe uwagi

### Różnice między Start a Stop

**Start Timer (POST):**
- Pusty request body
- Sprawdza czy nie ma aktywnego timera (409)
- Tworzy nowy time_entry z end_time = null
- Zwraca 201 Created

**Stop Timer (POST - następny endpoint):**
- Pusty request body
- Wymaga timeEntryId w path params
- Ustawia end_time na now()
- Zwraca 200 OK

### Business Logic Priority

**Kolejność sprawdzeń:**
1. Authentication (401)
2. UUID validation (400)
3. Task existence & ownership (404)
4. Active timer check (409)
5. Database insert (500)

### Race Conditions

**Ochrona:**
- Unique index na database level
- Application-level check dla lepszych messages
- W przypadku race condition: database constraint zwróci błąd
- Application catch i zwraca 409 Conflict

### Time Zones

**Zawsze UTC:**
- start_time i end_time zawsze w UTC
- ISO 8601 format z 'Z' suffix
- Client odpowiedzialny za konwersję do local time
- Zapobiega problemom z timezone changes (DST, etc.)

### Location Header

**RESTful practice:**
```
Location: /api/tasks/{taskId}/time-entries/{timeEntryId}
```
- Wskazuje URL nowo utworzonego zasobu
- Client może użyć do fetch details
- Standard dla 201 Created responses
