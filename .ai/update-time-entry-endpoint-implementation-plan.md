# API Endpoint Implementation Plan: Update Time Entry

## 1. Przegląd punktu końcowego

Endpoint **PATCH /api/tasks/{taskId}/time-entries/{timeEntryId}** umożliwia zalogowanym użytkownikom edycję istniejących time entries. Endpoint wspiera częściowe aktualizacje (partial updates) - użytkownik może zaktualizować tylko wybrane pola (start_time, end_time).

**Kluczowe funkcjonalności:**
- Edycja start_time i/lub end_time
- Walidacja: end_time > start_time (jeśli oba podane)
- Sprawdzenie czy time entry nie jest aktywny (można edytować tylko zakończone)
- Weryfikacja własności time entry (user authorization)
- Zwracanie zaktualizowanego time entry

## 2. Szczegóły żądania

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/tasks/{taskId}/time-entries/{timeEntryId}`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>` (obsługiwane przez Supabase Auth via cookies/headers)
  
- **Parametry**:
  - **Path Parameters**:
    - `taskId` (string, UUID): Identyfikator zadania
    - `timeEntryId` (string, UUID): Identyfikator time entry do edycji
  
  - **Request Body** (wszystkie pola opcjonalne, co najmniej jedno wymagane):
    ```json
    {
      "start_time": "2026-01-25T10:00:00.000Z",
      "end_time": "2026-01-25T12:00:00.000Z"
    }
    ```

- **Przykładowe żądania**:
  ```bash
  # Zmiana start_time
  PATCH /api/tasks/550e8400-e29b-41d4-a716-446655440000/time-entries/770e8400-e29b-41d4-a716-446655440000
  {
    "start_time": "2026-01-25T09:00:00.000Z"
  }
  
  # Zmiana end_time
  PATCH /api/tasks/550e8400-e29b-41d4-a716-446655440000/time-entries/770e8400-e29b-41d4-a716-446655440000
  {
    "end_time": "2026-01-25T13:00:00.000Z"
  }
  
  # Zmiana obu pól
  PATCH /api/tasks/550e8400-e29b-41d4-a716-446655440000/time-entries/770e8400-e29b-41d4-a716-446655440000
  {
    "start_time": "2026-01-25T09:00:00.000Z",
    "end_time": "2026-01-25T13:00:00.000Z"
  }
  ```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**UpdateTimeEntryRequestDto** - Struktura danych wejściowych:
```typescript
interface UpdateTimeEntryRequestDto {
  start_time?: string;  // ISO 8601 timestamp
  end_time?: string;    // ISO 8601 timestamp
}
```

**TimeEntryResponseDto** - Struktura odpowiedzi:
```typescript
type TimeEntryResponseDto = Omit<TimeEntry, "user_id" | "created_at">;
// {
//   id: string;
//   task_id: string;
//   start_time: string;
//   end_time: string | null;
// }
```

### Command Models

**UpdateTimeEntryCommand** - Model dla warstwy serwisowej:
```typescript
interface UpdateTimeEntryCommand {
  user_id: string;       // UUID użytkownika z sesji
  time_entry_id: string; // UUID time entry do edycji
  start_time?: string;   // Opcjonalny nowy start_time
  end_time?: string;     // Opcjonalny nowy end_time
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

**ValidationErrorDto** - Szczegółowe błędy walidacji:
```typescript
interface ValidationErrorDto {
  error: "ValidationError";
  message: string;
  details: {
    field: string;
    message: string;
  }[];
}
```

## 4. Szczegóły odpowiedzi

### Sukces - 200 OK

**Response Body**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "start_time": "2026-01-25T09:00:00.000Z",
  "end_time": "2026-01-25T13:00:00.000Z"
}
```

**Headers**:
```
Content-Type: application/json
```

### Błędy

**400 Bad Request** - Błąd walidacji:
```json
{
  "error": "ValidationError",
  "message": "Request validation failed",
  "details": [
    {
      "field": "start_time",
      "message": "Invalid ISO 8601 timestamp format"
    }
  ]
}
```

**400 Bad Request** - Puste body:
```json
{
  "error": "BadRequest",
  "message": "At least one field must be provided for update"
}
```

**400 Bad Request** - end_time <= start_time:
```json
{
  "error": "BadRequest",
  "message": "End time must be after start time"
}
```

**401 Unauthorized** - Brak autoryzacji:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required to update time entries"
}
```

**404 Not Found** - Time entry nie istnieje:
```json
{
  "error": "NotFound",
  "message": "Time entry not found or you don't have permission to update it"
}
```

**409 Conflict** - Time entry jest aktywny:
```json
{
  "error": "Conflict",
  "message": "Cannot update active time entry. Please stop it first."
}
```

**405 Method Not Allowed** - Nieprawidłowa metoda HTTP:
```json
{
  "error": "MethodNotAllowed",
  "message": "Only PATCH method is allowed for this endpoint"
}
```

**500 Internal Server Error** - Błąd serwera:
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred while updating the time entry"
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ PATCH /api/tasks/{taskId}/time-entries/{timeEntryId}
       │ { "start_time": "...", "end_time": "..." }
       ▼
┌─────────────────────────────────────────┐
│  Astro API Route Handler                │
│  (src/pages/api/tasks/[taskId]/        │
│   time-entries/[timeEntryId].ts)        │
│                                          │
│  1. Check prerender = false             │
│  2. Verify HTTP method is PATCH         │
│  3. Extract taskId & timeEntryId        │
│  4. Validate UUID formats               │
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
│  Request Body Parsing                    │
│                                          │
│  - Parse JSON from request              │
│  - Return 400 if invalid JSON           │
│  - Return 400 if empty body             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Input Validation (Zod Schema)          │
│                                          │
│  - Validate UpdateTimeEntryRequestDto   │
│  - Check start_time: ISO 8601 format    │
│  - Check end_time: ISO 8601 format      │
│  - Return 400 with details if invalid   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Business Logic Validation               │
│                                          │
│  - If both times provided:              │
│    Check end_time > start_time          │
│  - Return 400 if invalid                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Create Command Object                   │
│                                          │
│  - Build UpdateTimeEntryCommand         │
│  - Add user_id from authenticated user  │
│  - Add time_entry_id from path params   │
│  - Add validated update fields          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Time Entry Service Layer                │
│  (src/lib/services/                      │
│   time-entry.service.ts)                 │
│                                          │
│  - Execute updateTimeEntry(command)     │
│  - Handle business logic                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase Database Interaction           │
│                                          │
│  1. Update time_entries table:          │
│     UPDATE time_entries                 │
│     SET [provided fields]               │
│     WHERE id = $1                       │
│       AND user_id = $2                  │
│       AND end_time IS NOT NULL          │
│     RETURNING *                         │
│                                          │
│  2. RLS Policy Check:                   │
│     - Verify auth.uid() = user_id       │
│                                          │
│  3. Check end_time IS NOT NULL:         │
│     - Prevents editing active timers    │
│                                          │
│  4. Return updated row or null          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Handle Not Found / Conflict             │
│                                          │
│  - If no row returned: check reason     │
│  - Query to check if entry exists       │
│  - If exists with end_time NULL: 409    │
│  - If doesn't exist: 404                │
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
│  - Set status 200 OK                    │
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

**Weryfikacja własności time entry:**
- UPDATE query zawiera `WHERE user_id = $user_id`
- RLS Policy na poziomie bazy danych
- Jeśli time entry nie należy do użytkownika, zwracany jest 404

### 3. Logika biznesowa - Active Timer Protection

**Ochrona przed edycją aktywnego timera:**
- UPDATE query zawiera `WHERE end_time IS NOT NULL`
- Jeśli time entry jest aktywny (end_time NULL), UPDATE zwraca null
- Dodatkowy SELECT dla rozróżnienia 404 vs 409
- Zwrócenie 409 Conflict jeśli aktywny

### 4. Path Parameters Validation

**UUID Validation:**
- Walidacja czy taskId i timeEntryId są prawidłowymi UUID
- Zapobiega SQL injection
- Zwrócenie 400 Bad Request jeśli nieprawidłowy format

### 5. Time Integrity Validation

**Business Logic:**
- Jeśli oba czasy podane: end_time > start_time
- Zapobiega niespójnym danym
- ISO 8601 format validation (Zod)
- UTC timestamps

### 6. Data Integrity

**Atomic Updates:**
- Partial updates wspierane
- Tylko podane pola są aktualizowane
- Transakcyjna atomiczność przez PostgreSQL

## 7. Obsługa błędów

### 1. Błędy walidacji (400 Bad Request)

**Scenariusze:**
- Nieprawidłowy format start_time (nie ISO 8601)
- Nieprawidłowy format end_time (nie ISO 8601)
- end_time <= start_time
- Puste body (brak pól do aktualizacji)
- Nieprawidłowy format UUID (taskId, timeEntryId)
- Nieprawidłowy JSON

### 2. Błędy autoryzacji (401 Unauthorized)

**Scenariusze:**
- Brak tokenu autoryzacyjnego
- Nieważny token (wygasła sesja)
- Token nie powiązany z użytkownikiem

### 3. Błędy nie znaleziono (404 Not Found)

**Scenariusze:**
- Time entry o podanym ID nie istnieje
- Time entry należy do innego użytkownika
- Time entry został usunięty

### 4. Błędy konfliktu (409 Conflict)

**Scenariusze:**
- Time entry jest aktywny (end_time IS NULL)
- Użytkownik musi najpierw zatrzymać timer

### 5. Błędy bazy danych (500 Internal Server Error)

**Scenariusze:**
- Utrata połączenia z bazą danych
- Naruszenie constraint
- Błąd RLS policy
- Timeout zapytania

### 6. Błędy HTTP Method (405 Method Not Allowed)

**Scenariusze:**
- Użycie innej metody niż PATCH

## 8. Rozważania dotyczące wydajności

### 1. Optymalizacja zapytań

**Two-step process (w przypadku błędu):**
1. UPDATE dla aktualizacji (~5-10ms)
2. SELECT dla rozróżnienia 404 vs 409 (tylko jeśli UPDATE zwraca null)
Total: ~5-20ms + network

**Normalna ścieżka:**
- Tylko jeden UPDATE (~5-10ms)

### 2. Indeksy

**Wymagane indeksy:**
```sql
-- Time entry PK
CREATE INDEX idx_time_entries_id ON time_entries(id);

-- User ownership check
CREATE INDEX idx_time_entries_user ON time_entries(user_id);

-- Task relationship
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
```

### 3. Walidacja przed query

**Early returns:**
- Walidacja UUID przed query do bazy
- Walidacja pustego body przed parsowaniem
- Walidacja czasów przed UPDATE
- Sprawdzenie autoryzacji przed costly operations

### 4. Partial Updates

**Efektywność:**
- Tylko zmienione pola są aktualizowane
- Brak nadpisywania niezmienionych danych
- Mniejszy payload w UPDATE query

## 9. Kroki implementacji

### Krok 1: Utworzenie pliku route (jeśli nie istnieje)

**Lokalizacja:** `src/pages/api/tasks/[taskId]/time-entries/[timeEntryId].ts`

**Zadania:**
1. Sprawdzić czy plik już istnieje (może być utworzony dla innych metod)
2. Dodać `export const prerender = false` (jeśli nowy plik)

### Krok 2: Rozszerzenie schematu walidacji

**Lokalizacja:** `src/lib/validation/time-entry.validation.ts` (nowy plik)

**Zadania:**
1. Utworzyć plik jeśli nie istnieje
2. Dodać `updateTimeEntrySchema` z Zod
3. Walidacja ISO 8601 dla obu pól (optional)
4. Co najmniej jedno pole wymagane

### Krok 3: Rozszerzenie serwisu time entries

**Lokalizacja:** `src/lib/services/time-entry.service.ts`

**Zadania:**
1. Dodać funkcję `updateTimeEntry(supabase, command)`
2. Wykonać UPDATE z warunkami user_id i end_time IS NOT NULL
3. Jeśli null, wykonać SELECT dla rozróżnienia błędów
4. Zwrócić TimeEntryResponseDto lub rzucić błąd

### Krok 4: Implementacja PATCH handler

**Zadania:**
1. Dodać eksport `PATCH: APIRoute`
2. Wyekstrahować taskId i timeEntryId z `Astro.params`
3. Walidować UUID format obu parametrów
4. Sprawdzić autoryzację
5. Sparsować i walidować request body
6. Walidować end_time > start_time (jeśli oba podane)
7. Wywołać updateTimeEntry
8. Obsłużyć błędy (404 vs 409)

### Krok 5: Walidacja czasów

**Zadania:**
1. Jeśli oba czasy podane w request
2. Sprawdzić czy end_time > start_time
3. Zwrócić 400 jeśli nieprawidłowe

### Krok 6: Obsługa błędów

**Zadania:**
1. Try-catch dla wszystkich operacji
2. Rozróżnienie 404 (not found) vs 409 (active timer)
3. Szczegółowe komunikaty błędów
4. Odpowiednie status codes

### Krok 7: Weryfikacja błędów kompilacji

**Zadania:**
1. TypeScript compiler check
2. Linter check
3. Naprawienie błędów

### Krok 8: Testowanie endpointu

**Zadania:**
1. Test edycji start_time
2. Test edycji end_time
3. Test edycji obu pól
4. Test 409 - próba edycji aktywnego timera
5. Test 400 - end_time <= start_time
6. Test 404 - nieistniejący time entry
7. Test 401 - brak autoryzacji

### Krok 9: Aktualizacja dokumentacji (później)

**Zadania:**
1. Dodać dokumentację PATCH time-entry do README.md
2. Przykłady requestów i responses
3. Lista błędów

## 10. Dodatkowe uwagi

### Różnica między 404 a 409

**404 Not Found:**
- Time entry nie istnieje
- Time entry należy do innego użytkownika
- Query: `SELECT id FROM time_entries WHERE id = $1 AND user_id = $2`

**409 Conflict:**
- Time entry istnieje i należy do użytkownika
- Ale jest aktywny (end_time IS NULL)
- Query: `SELECT end_time FROM time_entries WHERE id = $1 AND user_id = $2`

### Business Logic Priority

**Kolejność sprawdzeń:**
1. Authentication (401)
2. UUID validation (400)
3. Body validation (400)
4. Time validation (400 - end > start)
5. Ownership & existence (404 lub 409)
6. Database update (500)

### Use Cases

**Korekta błędów:**
- Użytkownik pomylił czas startu
- Użytkownik zapomniał zatrzymać timer (zatrzymał ręcznie za późno)
- Zaokrąglenie czasów (np. do pełnych 15 minut)

### Ograniczenia

**Nie można:**
- Edytować aktywnego timera (end_time NULL)
- Ustawić end_time <= start_time
- Edytować time entries innych użytkowników
- Zmienić task_id (to wymagałoby DELETE + INSERT)

### Time Zones

**Zawsze UTC:**
- start_time i end_time w UTC (ISO 8601 z 'Z')
- Client odpowiedzialny za konwersję
- Spójność z całym systemem

### Partial Updates

**PATCH semantyka:**
- Tylko podane pola są aktualizowane
- Niepodane pola pozostają bez zmian
- Co najmniej jedno pole musi być podane
- RESTful approach
