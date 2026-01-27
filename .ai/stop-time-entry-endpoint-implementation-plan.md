# API Endpoint Implementation Plan: Stop Time Entry

## 1. Przegląd punktu końcowego

Endpoint **POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop** umożliwia zalogowanym użytkownikom zatrzymanie aktywnego timera dla zadania. Endpoint ustawia end_time na aktualny czas (UTC), kończąc tym samym śledzenie czasu dla danego time entry.

**Kluczowe funkcjonalności:**
- Zatrzymanie aktywnego time entry
- Automatyczne ustawienie end_time na aktualny czas
- Weryfikacja czy time entry należy do użytkownika
- Weryfikacja czy time entry jest aktywny (end_time IS NULL)
- Zwracanie zaktualizowanego time entry z ustawionym end_time

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/tasks/{taskId}/time-entries/{timeEntryId}/stop`
- **Headers**:
  - `Authorization: Bearer <token>` (obsługiwane przez Supabase Auth via cookies/headers)
  - `Content-Type: application/json`
  
- **Parametry**:
  - **Path Parameters**:
    - `taskId` (string, UUID): Identyfikator zadania
    - `timeEntryId` (string, UUID): Identyfikator time entry do zatrzymania
  
  - **Request Body**:
    ```json
    {
      "timezone_offset": 60  // Minutes offset from UTC (e.g., 60 for UTC+1)
    }
    ```

- **Przykładowe żądania**:
  ```bash
  # Zatrzymanie timera
  POST /api/tasks/550e8400-e29b-41d4-a716-446655440000/time-entries/770e8400-e29b-41d4-a716-446655440000/stop
  Content-Type: application/json
  
  {
    "timezone_offset": 60
  }
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
//   end_time: string | null; // ISO 8601 timestamp (now)
// }
```

### Command Models

**StopTimeEntryCommand** - Model dla warstwy serwisowej:
```typescript
interface StopTimeEntryCommand {
  user_id: string;       // UUID użytkownika z sesji
  time_entry_id: string; // UUID time entry z path params
  end_time: string;      // ISO 8601 timestamp (now)
  timezone_offset: number; // Minutes offset from UTC (for capacity validation)
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

### Sukces - 200 OK

**Response Body**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "start_time": "2026-01-25T10:30:00.000Z",
  "end_time": "2026-01-25T12:45:30.000Z"
}
```

**Headers**:
```
Content-Type: application/json
```

### Błędy

**400 Bad Request** - Nieprawidłowy UUID:
```json
{
  "error": "BadRequest",
  "message": "Invalid task ID or time entry ID format. Must be valid UUIDs."
}
```

**400 Bad Request** - Przekroczenie limitu 24h:
```json
{
  "error": "Nie można zapisać sesji dla dnia 2026-01-25: przekroczono dzienny limit 24:00:00. Wykorzystany czas: 12:30:00, czas sesji: 14:00:00, łączny czas: 26:30:00.",
  "code": "DailyCapacityExceeded",
  "details": {
    "day": "2026-01-25",
    "existing_duration_formatted": "12:30:00",
    "new_duration_formatted": "14:00:00",
    "total_duration_formatted": "26:30:00",
    "limit": "24:00:00"
  }
}
```

**401 Unauthorized** - Brak autoryzacji:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required to stop timer"
}
```

**404 Not Found** - Time entry nie istnieje:
```json
{
  "error": "NotFound",
  "message": "Time entry not found or you don't have permission to stop it"
}
```

**409 Conflict** - Time entry już zatrzymany:
```json
{
  "error": "Conflict",
  "message": "Time entry is already stopped"
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
  "message": "An unexpected error occurred while stopping the timer"
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop
       │ (empty body)
       ▼
┌─────────────────────────────────────────┐
│  Astro API Route Handler                │
│  (src/pages/api/tasks/[taskId]/        │
│   time-entries/[timeEntryId]/stop.ts)   │
│                                          │
│  1. Check prerender = false             │
│  2. Extract taskId & timeEntryId        │
│  3. Validate UUID formats               │
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
│  Create Command Object                   │
│                                          │
│  - Build StopTimeEntryCommand           │
│  - user_id from authenticated user      │
│  - time_entry_id from path params       │
│  - end_time = new Date().toISOString()  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Time Entry Service Layer                │
│  (src/lib/services/                      │
│   time-entry.service.ts)                 │
│                                          │
│  - Execute stopTimeEntry(command)       │
│  - Handle business logic                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase Database Interaction           │
│                                          │
│  1. Update time_entries table:          │
│     UPDATE time_entries                 │
│     SET end_time = $3                   │
│     WHERE id = $1                       │
│       AND user_id = $2                  │
│       AND end_time IS NULL              │
│     RETURNING *                         │
│                                          │
│  2. RLS Policy Check:                   │
│     - Verify auth.uid() = user_id       │
│                                          │
│  3. Check end_time IS NULL:             │
│     - Prevents stopping already stopped │
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
│  - If exists with end_time: 409         │
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

### 3. Logika biznesowa - Already Stopped Check

**Ochrona przed podwójnym zatrzymaniem:**
- UPDATE query zawiera `WHERE end_time IS NULL`
- Jeśli time entry już ma end_time, UPDATE zwraca null
- Dodatkowy SELECT dla rozróżnienia 404 vs 409
- Zwrócenie 409 Conflict jeśli już zatrzymany

### 4. Path Parameters Validation

**UUID Validation:**
- Walidacja czy taskId i timeEntryId są prawidłowymi UUID
- Zapobiega SQL injection
- Zwrócenie 400 Bad Request jeśli nieprawidłowy format

### 5. Time Integrity

**ISO 8601 Timestamps:**
- end_time zawsze w UTC
- Generowane po stronie serwera (new Date().toISOString())
- Zapobiega manipulacji czasem przez klienta
- Gwarantuje że end_time > start_time (logicznie)

## 7. Obsługa błędów

### 1. Błędy walidacji (400 Bad Request)

**Scenariusze:**
- Nieprawidłowy format taskId (nie UUID)
- Nieprawidłowy format timeEntryId (nie UUID)
- Brak parametrów w path

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
- Time entry już ma ustawiony end_time
- Próba zatrzymania już zatrzymanego timera

### 5. Błędy bazy danych (500 Internal Server Error)

**Scenariusze:**
- Utrata połączenia z bazą danych
- Naruszenie constraint
- Błąd RLS policy
- Timeout zapytania

### 6. Błędy HTTP Method (405 Method Not Allowed)

**Scenariusze:**
- Użycie innej metody niż POST

## 8. Rozważania dotyczące wydajności

### 1. Optymalizacja zapytań

**Two-step process (w przypadku błędu):**
1. UPDATE dla zatrzymania timera (~5-10ms)
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

-- Active timer filter
CREATE INDEX idx_time_entries_end_time ON time_entries(end_time) 
WHERE end_time IS NULL;
```

### 3. Walidacja przed query

**Early returns:**
- Walidacja UUID przed query do bazy
- Sprawdzenie autoryzacji przed costly operations
- Fast-fail pattern

### 4. Atomic Operation

**Single UPDATE:**
- Wszystkie warunki w jednym UPDATE
- Atomiczność gwarantowana przez PostgreSQL
- Brak race conditions

## 9. Kroki implementacji

### Krok 1: Utworzenie struktury plików

**Zadania:**
1. Utworzyć folder `[timeEntryId]` w `src/pages/api/tasks/[taskId]/time-entries/`
2. Utworzyć plik `stop.ts`
3. Dodać `export const prerender = false`

### Krok 2: Rozszerzenie time-entry.service.ts

**Zadania:**
1. Dodać funkcję `stopTimeEntry(supabase, command)`
2. Wykonać UPDATE z warunkami user_id i end_time IS NULL
3. Jeśli null, wykonać SELECT dla rozróżnienia błędów
4. Zwrócić TimeEntryResponseDto lub rzucić błąd

### Krok 3: Implementacja POST handler

**Zadania:**
1. Dodać eksport `POST: APIRoute`
2. Wyekstrahować taskId i timeEntryId z `Astro.params`
3. Walidować UUID format obu parametrów
4. Sprawdzić autoryzację
5. Utworzyć command z end_time = now()
6. Wywołać stopTimeEntry
7. Obsłużyć błędy (404 vs 409)

### Krok 4: Obsługa błędów

**Zadania:**
1. Try-catch dla wszystkich operacji
2. Rozróżnienie 404 (not found) vs 409 (already stopped)
3. Szczegółowe komunikaty błędów
4. Odpowiednie status codes
5. Logging

### Krok 5: Weryfikacja błędów kompilacji

**Zadania:**
1. TypeScript compiler check
2. Linter check
3. Naprawienie błędów

### Krok 6: Testowanie endpointu

**Zadania:**
1. Test podstawowy - start → stop timer
2. Test 409 - próba zatrzymania już zatrzymanego
3. Test 404 - nieistniejący time entry
4. Test 401 - brak autoryzacji
5. Test 400 - nieprawidłowe UUID

### Krok 7: Aktualizacja dokumentacji

**Zadania:**
1. Dodać dokumentację POST stop do README.md
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
- Ale już ma ustawiony end_time
- Query: `SELECT end_time FROM time_entries WHERE id = $1 AND user_id = $2`

### Business Logic Priority

**Kolejność sprawdzeń:**
1. Authentication (401)
2. UUID validation (400)
3. Ownership & existence (404 lub 409)
4. Database update (500)

### Time Zones

**Zawsze UTC:**
- end_time w UTC (ISO 8601 z 'Z')
- Zgodność z start_time
- Client odpowiedzialny za konwersję

### Idempotency

**POST stop NIE jest idempotentny w pełni:**
- Pierwsze wywołanie: 200 OK (zatrzymuje timer)
- Drugie wywołanie: 409 Conflict (już zatrzymany)
- Ale efekt końcowy jest taki sam (timer zatrzymany)
- Bezpieczne do retry (nie spowoduje niespójności)
