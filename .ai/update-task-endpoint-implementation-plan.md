# API Endpoint Implementation Plan: Update Task

## 1. Przegląd punktu końcowego

Endpoint **PATCH /api/tasks/{taskId}** umożliwia zalogowanym użytkownikom aktualizację istniejących zadań. Endpoint wspiera częściowe aktualizacje (partial updates) - użytkownik może zaktualizować tylko wybrane pola. Ważną logiką biznesową jest sprawdzenie, czy zadanie nie ma aktywnego timera przed pozwoleniem na zmianę, zgodnie z wymaganiami z api-plan.md.

**Kluczowe funkcjonalności:**
- Aktualizacja nazwy zadania (name)
- Aktualizacja opisu zadania (description)
- Zmiana statusu zadania (active/completed)
- Walidacja czy zadanie nie ma aktywnego timera przed aktualizacją
- Weryfikacja własności zadania (user authorization)
- Zwracanie zaktualizowanego obiektu zadania

## 2. Szczegóły żądania

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/tasks/{taskId}`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>` (obsługiwane przez Supabase Auth via cookies/headers)
  
- **Parametry**:
  - **Path Parameters**:
    - `taskId` (string, UUID): Identyfikator zadania do aktualizacji
  
  - **Request Body** (wszystkie pola opcjonalne):
    ```json
    {
      "name": "Updated task name",
      "description": "Updated description",
      "status": "completed"
    }
    ```

- **Przykładowe żądania**:
  ```bash
  # Zmiana nazwy zadania
  PATCH /api/tasks/550e8400-e29b-41d4-a716-446655440000
  {
    "name": "Updated task name"
  }
  
  # Zmiana opisu
  PATCH /api/tasks/550e8400-e29b-41d4-a716-446655440000
  {
    "description": "New description"
  }
  
  # Oznaczenie jako ukończone
  PATCH /api/tasks/550e8400-e29b-41d4-a716-446655440000
  {
    "status": "completed"
  }
  
  # Aktualizacja wielu pól jednocześnie
  PATCH /api/tasks/550e8400-e29b-41d4-a716-446655440000
  {
    "name": "Completed task",
    "description": "All work done",
    "status": "completed"
  }
  ```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**UpdateTaskRequestDto** - Struktura danych wejściowych:
```typescript
interface UpdateTaskRequestDto {
  name?: string;           // Opcjonalne, 1-255 znaków
  description?: string;    // Opcjonalne, max 5000 znaków
  status?: TaskStatus;     // Opcjonalne, 'active' | 'completed'
}
```

**TaskResponseDto** - Struktura odpowiedzi:
```typescript
type TaskResponseDto = Omit<Task, "user_id">;
// {
//   id: string;
//   name: string;
//   description: string | null;
//   status: TaskStatus;
//   created_at: string;
// }
```

### Command Models

**UpdateTaskCommand** - Model dla warstwy serwisowej:
```typescript
interface UpdateTaskCommand {
  user_id: string;       // UUID użytkownika z sesji
  task_id: string;       // UUID zadania do aktualizacji
  name?: string;         // Opcjonalna nowa nazwa
  description?: string;  // Opcjonalny nowy opis
  status?: TaskStatus;   // Opcjonalny nowy status
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
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated task name",
  "description": "New description",
  "status": "completed",
  "created_at": "2026-01-24T10:30:00.000Z"
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
      "field": "name",
      "message": "Task name must not exceed 255 characters"
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

**401 Unauthorized** - Brak autoryzacji:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required to update tasks"
}
```

**403 Forbidden** - Zadanie ma aktywny timer:
```json
{
  "error": "Forbidden",
  "message": "Cannot update task with active timer. Please stop the timer first."
}
```

**404 Not Found** - Zadanie nie istnieje lub nie należy do użytkownika:
```json
{
  "error": "NotFound",
  "message": "Task not found or you don't have permission to update it"
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
  "message": "An unexpected error occurred while updating the task"
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ PATCH /api/tasks/{taskId}
       │ { "name": "Updated", "status": "completed" }
       ▼
┌─────────────────────────────────────────┐
│  Astro API Route Handler                │
│  (src/pages/api/tasks/[taskId].ts)     │
│                                          │
│  1. Check prerender = false             │
│  2. Verify HTTP method is PATCH         │
│  3. Extract taskId from params          │
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
│  - Validate UpdateTaskRequestDto        │
│  - Check name: optional, 1-255 chars    │
│  - Check description: optional, max 5000│
│  - Check status: optional, enum         │
│  - Return 400 with details if invalid   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Check for Active Timer                  │
│  (Time Entry Service)                    │
│                                          │
│  - Query time_entries for active timer  │
│  - WHERE task_id = $1 AND end_time IS   │
│    NULL                                  │
│  - Return 403 Forbidden if exists       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Create Command Object                   │
│                                          │
│  - Build UpdateTaskCommand              │
│  - Add user_id from authenticated user  │
│  - Add task_id from path params         │
│  - Add validated update fields          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Task Service Layer                      │
│  (src/lib/services/task.service.ts)     │
│                                          │
│  - Execute updateTask(command)          │
│  - Handle business logic                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase Database Interaction           │
│                                          │
│  1. Update tasks table:                 │
│     UPDATE tasks                        │
│     SET [provided fields]               │
│     WHERE id = $1 AND user_id = $2      │
│     RETURNING *                         │
│                                          │
│  2. RLS Policy Check:                   │
│     - Verify auth.uid() = user_id       │
│                                          │
│  3. Return updated row or null          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Handle Not Found                        │
│                                          │
│  - If no row returned: 404 Not Found    │
│  - Task doesn't exist or wrong user     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Transform Response                      │
│  (Service Layer)                         │
│                                          │
│  - Remove user_id from result           │
│  - Return TaskResponseDto               │
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

**Weryfikacja własności zadania:**
- UPDATE query zawiera `WHERE user_id = $user_id`
- RLS Policy na poziomie bazy danych: `UPDATE POLICY task_is_owner`
- Jeśli zadanie nie należy do użytkownika, zwracany jest 404 (nie 403, aby nie ujawniać istnienia zadania)

### 3. Walidacja danych wejściowych

**Schemat Zod:**
- Nazwa: trim, min 1, max 255 znaków (jeśli podana)
- Opis: max 5000 znaków (jeśli podany)
- Status: tylko 'active' lub 'completed' (jeśli podany)
- Co najmniej jedno pole musi być obecne

### 4. Logika biznesowa - Active Timer Check

**Ochrona integralności danych:**
- Przed aktualizacją sprawdzenie czy istnieje aktywny time_entry
- Query: `SELECT id FROM time_entries WHERE task_id = $1 AND end_time IS NULL`
- Jeśli istnieje, zwrócenie 403 Forbidden
- Zapobiega niespójnościom (np. completed task z aktywnym timerem)

### 5. Path Parameter Validation

**UUID Validation:**
- Walidacja czy taskId jest prawidłowym UUID
- Zapobiega SQL injection przez nieprawidłowe ID
- Zwrócenie 400 Bad Request jeśli nieprawidłowy format

## 7. Obsługa błędów

### 1. Błędy walidacji (400 Bad Request)

**Scenariusze:**
- Nazwa przekracza 255 znaków
- Opis przekracza 5000 znaków
- Nieprawidłowy status (nie 'active' ani 'completed')
- Puste body (brak pól do aktualizacji)
- Nieprawidłowy format taskId (nie UUID)
- Nieprawidłowy JSON

### 2. Błędy autoryzacji (401 Unauthorized)

**Scenariusze:**
- Brak tokenu autoryzacyjnego
- Nieważny token (wygasła sesja)
- Token nie powiązany z użytkownikiem

### 3. Błędy uprawnień (403 Forbidden)

**Scenariusze:**
- Próba aktualizacji zadania z aktywnym timerem
- Użytkownik musi najpierw zatrzymać timer

### 4. Błędy nie znaleziono (404 Not Found)

**Scenariusze:**
- Zadanie o podanym ID nie istnieje
- Zadanie należy do innego użytkownika
- Zadanie zostało usunięte

### 5. Błędy bazy danych (500 Internal Server Error)

**Scenariusze:**
- Utrata połączenia z bazą danych
- Naruszenie constraint (rzadkie)
- Błąd RLS policy
- Timeout zapytania

### 6. Błędy HTTP Method (405 Method Not Allowed)

**Scenariusze:**
- Użycie innej metody niż PATCH

## 8. Rozważania dotyczące wydajności

### 1. Optymalizacja zapytań

**Two-step process:**
1. SELECT dla sprawdzenia active timer (~5-10ms)
2. UPDATE dla aktualizacji zadania (~5-10ms)
Total: ~10-20ms + network

**Możliwa optymalizacja:**
- Połączenie sprawdzeń w jedną transakcję
- Użycie PostgreSQL function dla atomic check + update

### 2. Indeksy

**Wymagane indeksy:**
```sql
-- Podstawowy indeks na task_id (już istnieje - PK)
-- Indeks na user_id w tasks (już istnieje)

-- Indeks dla sprawdzania aktywnych timerów
CREATE INDEX idx_time_entries_task_active 
ON time_entries(task_id, end_time) 
WHERE end_time IS NULL;
```

### 3. Walidacja przed query

**Early returns:**
- Walidacja UUID przed query do bazy
- Walidacja pustego body przed parsowaniem
- Sprawdzenie autoryzacji przed costly operations

### 4. Partial Updates

**Efektywność:**
- Tylko zmienione pola są aktualizowane
- Brak nadpisywania niezmienionych danych
- Mniejszy payload w UPDATE query

## 9. Kroki implementacji

### Krok 1: Utworzenie struktury plików

**Lokalizacja:** `src/pages/api/tasks/[taskId].ts` (nowy plik)

**Zadania:**
1. Utworzyć folder `tasks` w `src/pages/api/`
2. Utworzyć plik `[taskId].ts` dla dynamic routing
3. Dodać `export const prerender = false`

### Krok 2: Utworzenie serwisu dla time entries

**Lokalizacja:** `src/lib/services/time-entry.service.ts` (nowy plik)

**Zadania:**
1. Utworzyć funkcję `hasActiveTimer(supabase, taskId)`
2. Query do sprawdzenia czy istnieje aktywny timer
3. Zwrócić boolean

### Krok 3: Implementacja PATCH handler

**Lokalizacja:** `src/pages/api/tasks/[taskId].ts`

**Zadania:**
1. Dodać eksport `PATCH: APIRoute`
2. Wyekstrahować taskId z `Astro.params`
3. Walidować UUID format taskId
4. Sprawdzić autoryzację
5. Sparsować i walidować request body

### Krok 4: Sprawdzenie active timer

**Zadania:**
1. Wywołać `hasActiveTimer(taskId)`
2. Jeśli true, zwrócić 403 Forbidden
3. Kontynuować jeśli false

### Krok 5: Aktualizacja zadania

**Zadania:**
1. Utworzyć UpdateTaskCommand
2. Wywołać `updateTask()` z serwisu
3. Obsłużyć przypadek null (404 Not Found)
4. Zwrócić 200 OK z zaktualizowanym zadaniem

### Krok 6: Rozszerzenie schematu walidacji

**Lokalizacja:** `src/lib/validation/task.validation.ts`

**Zadania:**
1. Schemat `updateTaskSchema` już istnieje
2. Dodać walidację UUID dla taskId
3. Dodać walidację pustego body

### Krok 7: Aktualizacja serwisu zadań

**Lokalizacja:** `src/lib/services/task.service.ts`

**Zadania:**
1. Funkcja `updateTask()` już istnieje
2. Upewnić się że zwraca null dla nie znalezionych zadań
3. Sprawdzić czy user_id jest w WHERE clause

### Krok 8: Obsługa błędów

**Zadania:**
1. Try-catch dla wszystkich operacji
2. Szczegółowe komunikaty błędów
3. Odpowiednie status codes

### Krok 9: Weryfikacja błędów kompilacji

**Zadania:**
1. TypeScript compiler check
2. Linter check
3. Naprawienie błędów

### Krok 10: Testowanie endpointu

**Zadania:**
1. Test aktualizacji pojedynczych pól
2. Test aktualizacji wielu pól
3. Test z active timer (403)
4. Test nie istniejącego zadania (404)
5. Test bez autoryzacji (401)
6. Test walidacji (400)

### Krok 11: Aktualizacja dokumentacji

**Zadania:**
1. Dodać dokumentację PATCH /api/tasks/{taskId} do README.md
2. Przykłady requestów i responses
3. Lista błędów
4. Przykłady użycia

### Krok 12: Testy integracyjne (opcjonalne)

**Zadania:**
1. Test scenariusza: create -> update -> verify
2. Test scenariusza: create -> start timer -> try update -> fail
3. Test scenariusza: update task belongs to another user

## 10. Dodatkowe uwagi

### Partial Updates vs Full Updates

**PATCH (partial):**
- Aktualizacja tylko podanych pól
- Bardziej RESTful
- Używane w tym API

**PUT (full):**
- Wymaga wszystkich pól
- Zastępuje cały zasób
- Nie używane w tym API

### Status Transitions

**Dozwolone przejścia:**
- `active` → `completed`: ✓ (pod warunkiem że brak aktywnego timera)
- `completed` → `active`: ✓ (reaktywacja zadania)

### Idempotency

**PATCH jest idempotentny:**
- Wielokrotne wywołanie z tymi samymi danymi daje ten sam rezultat
- Nie tworzy duplikatów
- Bezpieczne do retry

### Business Logic Priority

**Kolejność sprawdzeń:**
1. Authentication (401)
2. Input validation (400)
3. Active timer check (403)
4. Task existence & ownership (404)
5. Database update (500)

To zapewnia że użytkownik dostaje najbardziej specyficzny błąd.
