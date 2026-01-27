# API Endpoint Implementation Plan: Daily Summary

## 1. Przegląd punktu końcowego

Endpoint **GET /api/summary/daily** umożliwia zalogowanym użytkownikom uzyskanie raportu dziennego z sumą przepracowanego czasu. Endpoint agreguje dane z time_entries, kalkuluje czas trwania każdego wpisu, grupuje po zadaniach i zwraca podsumowanie z całkowitą sumą czasu.

**Kluczowe funkcjonalności:**
- Agregacja time entries z wybranego okresu
- Kalkulacja duration dla każdego time entry (end_time - start_time)
- Grupowanie po zadaniach (task_id, task_name)
- Suma całkowitego czasu pracy
- Filtry: data od-do (opcjonalne)
- Domyślnie: dzisiejszy dzień

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/summary/daily`
- **Headers**:
  - `Authorization: Bearer <token>` (obsługiwane przez Supabase Auth via cookies/headers)
  
- **Query Parameters**:
  - `date_from` (string, ISO 8601 date, optional): Data początkowa (domyślnie: dzisiaj 00:00)
  - `date_to` (string, ISO 8601 date, optional): Data końcowa (domyślnie: dzisiaj 23:59)
  - `timezone_offset` (number, required): Offset strefy czasowej w minutach od UTC (np. 60 dla UTC+1, -300 dla UTC-5)

- **Przykładowe żądania**:
  ```bash
  # Raport z dzisiaj (domyślnie) dla użytkownika w Polsce (UTC+1)
  GET /api/summary/daily?timezone_offset=60
  
  # Raport z konkretnego dnia
  GET /api/summary/daily?date_from=2026-01-25&date_to=2026-01-25&timezone_offset=60
  
  # Raport z zakresu dat (tydzień)
  GET /api/summary/daily?date_from=2026-01-20&date_to=2026-01-26
  
  # Raport od daty do teraz
  GET /api/summary/daily?date_from=2026-01-01
  ```

## 3. Wykorzystywane typy

### Response DTOs

**DailySummaryResponseDto** - Główna struktura odpowiedzi:
```typescript
interface DailySummaryResponseDto {
  date_from: string;        // ISO 8601 date
  date_to: string;          // ISO 8601 date
  total_duration_seconds: number; // Suma w sekundach
  total_duration_formatted: string; // "HH:MM:SS"
  tasks: TaskSummaryDto[];  // Podsumowanie per zadanie
}
```

**TaskSummaryDto** - Podsumowanie dla pojedynczego zadania:
```typescript
interface TaskSummaryDto {
  task_id: string;
  task_name: string;
  task_status: TaskStatus;
  duration_seconds: number;
  duration_formatted: string; // "HH:MM:SS"
  entries_count: number;      // Liczba time entries
}
```

### Query DTOs

**DailySummaryQueryDto** - Parametry query:
```typescript
interface DailySummaryQueryDto {
  date_from?: string; // ISO 8601 date (YYYY-MM-DD)
  date_to?: string;   // ISO 8601 date (YYYY-MM-DD)
  timezone_offset: number; // Offset strefy czasowej w minutach (np. 60 dla UTC+1)
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

**Response Body** (z danymi):
```json
{
  "date_from": "2026-01-25T00:00:00.000Z",
  "date_to": "2026-01-25T23:59:59.999Z",
  "total_duration_seconds": 14400,
  "total_duration_formatted": "04:00:00",
  "tasks": [
    {
      "task_id": "550e8400-e29b-41d4-a716-446655440000",
      "task_name": "Backend API Development",
      "task_status": "active",
      "duration_seconds": 10800,
      "duration_formatted": "03:00:00",
      "entries_count": 2
    },
    {
      "task_id": "660e8400-e29b-41d4-a716-446655440001",
      "task_name": "Code Review",
      "task_status": "completed",
      "duration_seconds": 3600,
      "duration_formatted": "01:00:00",
      "entries_count": 1
    }
  ]
}
```

**Response Body** (brak danych w okresie):
```json
{
  "date_from": "2026-01-25T00:00:00.000Z",
  "date_to": "2026-01-25T23:59:59.999Z",
  "total_duration_seconds": 0,
  "total_duration_formatted": "00:00:00",
  "tasks": []
}
```

**Headers**:
```
Content-Type: application/json
```

### Błędy

**400 Bad Request** - Nieprawidłowy format daty:
```json
{
  "error": "ValidationError",
  "message": "Query validation failed",
  "details": {
    "errors": [
      {
        "field": "date_from",
        "message": "Invalid date format. Use YYYY-MM-DD."
      }
    ]
  }
}
```

**400 Bad Request** - date_from > date_to:
```json
{
  "error": "BadRequest",
  "message": "date_from must be before or equal to date_to"
}
```

**401 Unauthorized** - Brak autoryzacji:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required to view summary"
}
```

**405 Method Not Allowed** - Nieprawidłowa metoda HTTP:
```json
{
  "error": "MethodNotAllowed",
  "message": "Only GET method is allowed for this endpoint"
}
```

**500 Internal Server Error** - Błąd serwera:
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred while generating summary"
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/summary/daily?date_from=...&date_to=...
       ▼
┌─────────────────────────────────────────┐
│  Astro API Route Handler                │
│  (src/pages/api/summary/daily.ts)       │
│                                          │
│  1. Check prerender = false             │
│  2. Verify HTTP method is GET           │
│  3. Extract query params                │
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
│  Query Parameters Validation             │
│                                          │
│  - Validate date_from format (optional) │
│  - Validate date_to format (optional)   │
│  - Set defaults if not provided         │
│  - Validate date_from <= date_to        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Summary Service Layer                   │
│  (src/lib/services/summary.service.ts)   │
│                                          │
│  - Execute getDailySummary(query)       │
│  - Handle aggregation logic             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase Database Query                 │
│                                          │
│  SELECT                                 │
│    te.task_id,                          │
│    t.name as task_name,                 │
│    t.status as task_status,             │
│    te.start_time,                       │
│    te.end_time                          │
│  FROM time_entries te                   │
│  JOIN tasks t ON te.task_id = t.id      │
│  WHERE te.user_id = $1                  │
│    AND te.start_time >= $2              │
│    AND te.start_time <= $3              │
│    AND te.end_time IS NOT NULL          │
│  ORDER BY te.start_time ASC             │
│                                          │
│  - RLS Policy ensures user_id match    │
│  - Only completed entries (end_time)    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Data Processing (Service Layer)        │
│                                          │
│  1. Calculate duration for each entry:  │
│     duration = end_time - start_time    │
│                                          │
│  2. Group by task_id:                   │
│     Map<task_id, entries[]>             │
│                                          │
│  3. Sum durations per task              │
│                                          │
│  4. Format durations (HH:MM:SS)         │
│                                          │
│  5. Calculate total_duration            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Build Response DTO                      │
│                                          │
│  - DailySummaryResponseDto              │
│  - Array of TaskSummaryDto              │
│  - Formatted durations                  │
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

**Automatyczna filtracja:**
- Query zawiera `WHERE user_id = $userId`
- RLS Policy na poziomie bazy danych
- Użytkownik widzi tylko swoje dane
- Niemożliwe ujawnienie danych innych użytkowników

### 3. Query Injection Protection

**Walidacja parametrów:**
- Walidacja formatu daty (YYYY-MM-DD)
- Parametryzowane queries
- Zod schema validation
- Brak raw SQL construction

### 4. Data Privacy

**Ochrona danych:**
- Endpoint nie przyjmuje user_id w parametrach
- Zwraca tylko dane zalogowanego użytkownika
- Nie ujawnia informacji o innych użytkownikach

### 5. Performance Limits

**Ochrona przed abuse:**
- Maksymalny zakres dat (np. 1 rok)
- Walidacja sensowności dat
- Efficient database queries z indeksami

## 7. Obsługa błędów

### 1. Błędy walidacji (400 Bad Request)

**Scenariusze:**
- Nieprawidłowy format date_from (nie YYYY-MM-DD)
- Nieprawidłowy format date_to
- date_from > date_to
- Zbyt duży zakres dat (np. > 1 rok)

### 2. Błędy autoryzacji (401 Unauthorized)

**Scenariusze:**
- Brak tokenu autoryzacyjnego
- Nieważny token (wygasła sesja)
- Token nie powiązany z użytkownikiem

### 3. Błędy bazy danych (500 Internal Server Error)

**Scenariusze:**
- Utrata połączenia z bazą danych
- Błąd RLS policy
- Timeout zapytania
- Błąd agregacji danych

### 4. Błędy HTTP Method (405 Method Not Allowed)

**Scenariusze:**
- Użycie innej metody niż GET

## 8. Rozważania dotyczące wydajności

### 1. Optymalizacja zapytań

**Single query approach:**
- Jedno query z JOIN zamiast N+1 queries
- Agregacja po stronie aplikacji (flexibility)
- ~20-50ms execution time dla typowego dnia

### 2. Indeksy

**Wymagane indeksy:**
```sql
-- Composite index for time range queries
CREATE INDEX idx_time_entries_user_date_range 
ON time_entries(user_id, start_time) 
WHERE end_time IS NOT NULL;

-- Task lookup
CREATE INDEX idx_tasks_id ON tasks(id);

-- User lookup
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
```

### 3. Caching considerations

**Możliwe optymalizacje:**
- Client-side cache dla historycznych dat (immutable)
- Short TTL dla bieżącego dnia (5-10 min)
- React Query / SWR integration

### 4. Data volume

**Skalowanie:**
- Typowy dzień: 5-20 time entries
- Typowy tydzień: 30-100 entries
- Query optymalizowane dla małych-średnich datasetów
- Pagination nie potrzebna dla daily summary

## 9. Kroki implementacji

### Krok 1: Utworzenie struktury plików

**Lokalizacje:**
- `src/pages/api/summary/daily.ts` (nowy folder + plik)
- `src/lib/services/summary.service.ts` (nowy plik)
- `src/lib/validation/summary.validation.ts` (nowy plik)

### Krok 2: Utworzenie schematu walidacji

**Zadania:**
1. Utworzyć `summary.validation.ts`
2. Dodać `dailySummaryQuerySchema` z Zod
3. Walidacja date format (YYYY-MM-DD)
4. Opcjonalne pola

### Krok 3: Utworzenie serwisu summary

**Zadania:**
1. Funkcja `getDailySummary(supabase, userId, query)`
2. Query do bazy z JOIN tasks + time_entries
3. Filtrowanie po date range
4. Tylko completed entries (end_time NOT NULL)

### Krok 4: Przetwarzanie danych

**Zadania:**
1. Kalkulacja duration dla każdego entry
2. Grupowanie po task_id
3. Sumowanie per task
4. Formatowanie duration (secondsToHMS)
5. Kalkulacja total_duration

### Krok 5: Implementacja GET handler

**Zadania:**
1. Dodać eksport `GET: APIRoute`
2. Wyekstrahować query params
3. Walidować z Zod schema
4. Set defaults (today) jeśli brak parametrów
5. Walidować date_from <= date_to
6. Wywołać getDailySummary
7. Zwrócić response

### Krok 6: Helper functions

**Zadania:**
1. `secondsToHMS(seconds)` - formatowanie czasu
2. `startOfDay(date)` - 00:00:00
3. `endOfDay(date)` - 23:59:59
4. `isValidDateFormat(str)` - YYYY-MM-DD validation

### Krok 7: Obsługa błędów

**Zadania:**
1. Try-catch dla wszystkich operacji
2. Szczegółowe komunikaty błędów
3. Odpowiednie status codes

### Krok 8: Weryfikacja błędów kompilacji

**Zadania:**
1. TypeScript compiler check
2. Linter check
3. Naprawienie błędów

### Krok 9: Testowanie endpointu

**Zadania:**
1. Test - brak danych (empty array)
2. Test - z danymi (suma czasu)
3. Test - zakres dat (tydzień)
4. Test - date_from > date_to (400)
5. Test - nieprawidłowy format daty (400)
6. Test - bez autoryzacji (401)

### Edge Cases

**Aktywny timer:**
- Pomijamy (WHERE end_time IS NOT NULL)
- Aktywny timer nie jest uwzględniony w raporcie
- Użytkownik musi najpierw zatrzymać timer

**Overlapping entries:**
- Możliwe (brak walidacji overlaps)
- Suma czasu może przekroczyć 24h w dniu
- To OK - user może edytować błędne wpisy

**Timezone handling:**
- Wszystkie czasy w UTC
- Client odpowiedzialny za konwersję do local time
- date_from/date_to interpretowane jako UTC dates

### Performance Notes

**Typical query:**
- 10-20 time entries per day
- 1 JOIN (tasks)
- Simple aggregation in app
- ~20-30ms total

**Optimization opportunities:**
- Materialized view dla historical data
- Cached aggregates per day (updated on entry stop)
- Incremental calculations
