# API Endpoint Implementation Plan: Get Active Timer

## 1. Przegląd punktu końcowego

Endpoint **GET /api/tasks/active-timer** umożliwia zalogowanym użytkownikom sprawdzenie czy mają aktywny timer. Jest to szczególnie przydatne przy starcie aplikacji, aby wyświetlić aktualnie działający timer w interfejsie użytkownika.

**Kluczowe funkcjonalności:**
- Sprawdzenie czy użytkownik ma aktywny timer
- Zwracanie szczegółów aktywnego time entry (id, task_id, start_time)
- Zwracanie 404 jeśli brak aktywnego timera
- Prosty endpoint bez parametrów (wszystko z auth session)

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/tasks/active-timer`
- **Headers**:
  - `Authorization: Bearer <token>` (obsługiwane przez Supabase Auth via cookies/headers)
  
- **Parametry**: Brak (user_id z sesji)

- **Przykładowe żądania**:
  ```bash
  # Sprawdzenie aktywnego timera
  GET /api/tasks/active-timer
  
  # Brak body i query params
  ```

## 3. Wykorzystywane typy

### Response DTOs

**ActiveTimerResponseDto** - Struktura odpowiedzi z aktywnym timerem:
```typescript
interface ActiveTimerResponseDto {
  id: string;         // UUID time entry
  task_id: string;    // UUID zadania
  start_time: string; // ISO 8601 timestamp
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

### Sukces - 200 OK (ma aktywny timer)

**Response Body**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "start_time": "2026-01-25T10:30:00.000Z"
}
```

**Headers**:
```
Content-Type: application/json
```

### Sukces - 404 Not Found (brak aktywnego timera)

**Response Body**:
```json
{
  "error": "NotFound",
  "message": "No active timer found"
}
```

**Headers**:
```
Content-Type: application/json
```

### Błędy

**401 Unauthorized** - Brak autoryzacji:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required to check active timer"
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
  "message": "An unexpected error occurred while checking active timer"
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/tasks/active-timer
       ▼
┌─────────────────────────────────────────┐
│  Astro API Route Handler                │
│  (src/pages/api/tasks/active-timer.ts)  │
│                                          │
│  1. Check prerender = false             │
│  2. Verify HTTP method is GET           │
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
│  Time Entry Service Layer                │
│  (src/lib/services/                      │
│   time-entry.service.ts)                 │
│                                          │
│  - Execute getActiveTimer(userId)       │
│  - Already implemented                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase Database Query                 │
│                                          │
│  SELECT id, task_id, start_time         │
│  FROM time_entries                      │
│  WHERE user_id = $1                     │
│    AND end_time IS NULL                 │
│  LIMIT 1                                │
│                                          │
│  - RLS Policy ensures user_id match    │
│  - Returns data or null                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Check Result                            │
│                                          │
│  - If null: Return 404 Not Found        │
│  - If data: Return 200 OK with data     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  API Route Response                      │
│                                          │
│  - Set appropriate status code          │
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
- Użytkownik widzi tylko swoje time entries
- Niemożliwe ujawnienie timerów innych użytkowników

### 3. Privacy

**Ochrona danych:**
- Endpoint nie przyjmuje parametrów (nie można podać user_id)
- Zwraca tylko dane zalogowanego użytkownika
- Nie ujawnia informacji o istnieniu innych użytkowników

## 7. Obsługa błędów

### 1. Błędy autoryzacji (401 Unauthorized)

**Scenariusze:**
- Brak tokenu autoryzacyjnego
- Nieważny token (wygasła sesja)
- Token nie powiązany z użytkownikiem

### 2. Brak aktywnego timera (404 Not Found)

**Scenariusz:**
- Użytkownik nie ma aktualnie uruchomionego timera
- To nie jest błąd - to normalna sytuacja
- Client powinien obsłużyć gracefully

### 3. Błędy bazy danych (500 Internal Server Error)

**Scenariusze:**
- Utrata połączenia z bazą danych
- Błąd RLS policy
- Timeout zapytania

### 4. Błędy HTTP Method (405 Method Not Allowed)

**Scenariusze:**
- Użycie innej metody niż GET

## 8. Rozważania dotyczące wydajności

### 1. Prostota zapytania

**Single SELECT:**
- Proste query z indeksem
- WHERE user_id + end_time IS NULL
- LIMIT 1 (early termination)
- ~5-10ms execution time

### 2. Indeksy

**Wymagane indeksy:**
```sql
-- Unique index for active timer per user
CREATE UNIQUE INDEX idx_time_entries_user_active 
ON time_entries(user_id) 
WHERE end_time IS NULL;
```
- Ten index już istnieje (dla START endpoint)
- Gwarantuje szybkie wyszukiwanie
- Gwarantuje tylko jeden aktywny timer na użytkownika

### 3. Caching considerations

**Możliwe optymalizacje:**
- Client-side cache (React Query / SWR)
- Short TTL (np. 30s) wystarczający
- Revalidate on focus
- Revalidate po START/STOP operations

### 4. Rate limiting

**Nie potrzebne:**
- Read-only operation
- Bardzo lekka query
- Używana tylko przy starcie app
- Brak ryzyka abuse

## 9. Kroki implementacji

### Krok 1: Utworzenie pliku route

**Lokalizacja:** `src/pages/api/tasks/active-timer.ts` (nowy plik)

**Zadania:**
1. Utworzyć plik w `src/pages/api/tasks/`
2. Dodać `export const prerender = false`

### Krok 2: Implementacja GET handler

**Zadania:**
1. Dodać eksport `GET: APIRoute`
2. Sprawdzić autoryzację
3. Wywołać `getActiveTimer()` z serwisu (już istnieje)
4. Obsłużyć null result (404)
5. Zwrócić dane (200) lub 404

### Krok 3: Obsługa błędów

**Zadania:**
1. Try-catch dla wszystkich operacji
2. Szczegółowe komunikaty błędów
3. Odpowiednie status codes
4. Logging

### Krok 4: Weryfikacja błędów kompilacji

**Zadania:**
1. TypeScript compiler check
2. Linter check
3. Naprawienie błędów

### Krok 5: Testowanie endpointu

**Zadania:**
1. Test - brak aktywnego timera (404)
2. Test - z aktywnym timerem (200 + data)
3. Test - bez autoryzacji (401)

### Krok 6: Aktualizacja dokumentacji

**Zadania:**
1. Dodać dokumentację GET active-timer do README.md
2. Przykłady responses
3. Use cases (startup check)

## 10. Dodatkowe uwagi

### Różnica między 404 a błąd

**404 Not Found:**
- To normalna odpowiedź
- Oznacza "nie masz aktywnego timera"
- Client powinien to traktować jak sukces
- Nie logować jako error

**500 Internal Server Error:**
- To rzeczywisty błąd
- Problem z bazą/systemem
- Client powinien pokazać error message

### Integration z innymi endpoints

**Consistency check:**
- Po START: GET active-timer powinien zwrócić 200
- Po STOP: GET active-timer powinien zwrócić 404
- Frontend może używać do weryfikacji

### Idempotency

**GET jest idempotentny:**
- Wielokrotne wywołania = ten sam rezultat
- Bezpieczne do retry
- Brak side effects
- Cache-friendly
