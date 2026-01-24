# API Endpoint Implementation Plan: Create Task

## 1. Przegląd punktu końcowego

Endpoint **POST /api/tasks** umożliwia zalogowanym użytkownikom tworzenie nowych zadań w systemie śledzenia czasu pracy. Każde zadanie jest przypisane do konkretnego użytkownika za pomocą `user_id` i posiada domyślny status "active". Endpoint przyjmuje nazwę zadania (wymagane) oraz opcjonalny opis, a następnie zwraca pełny obiekt zadania z wygenerowanym identyfikatorem UUID.

**Kluczowe funkcjonalności:**
- Tworzenie nowych zadań dla zalogowanego użytkownika
- Automatyczne przypisanie user_id z sesji użytkownika
- Walidacja danych wejściowych zgodnie ze schematem bazy danych
- Zwracanie kompletnego obiektu zadania z wygenerowanym ID

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/tasks`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>` (obsługiwane przez Supabase Auth via cookies/headers)
  
- **Parametry**:
  - **Wymagane**:
    - `name` (string, 1-255 znaków) - Nazwa zadania
  - **Opcjonalne**:
    - `description` (string, max 5000 znaków) - Opis zadania
    
- **Request Body**:
  ```json
  {
    "name": "Implement user authentication",
    "description": "Add login and registration functionality using Supabase Auth"
  }
  ```

- **Przykładowe żądania**:
  ```json
  // Minimalne żądanie
  {
    "name": "Fix bug in timer"
  }
  
  // Pełne żądanie
  {
    "name": "Design new dashboard",
    "description": "Create wireframes and mockups for the new dashboard layout"
  }
  ```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**CreateTaskRequestDto** - Struktura danych wejściowych z request body:
```typescript
interface CreateTaskRequestDto {
  name: string;           // Wymagane, 1-255 znaków
  description?: string;   // Opcjonalne, max 5000 znaków
}
```

**TaskResponseDto** - Struktura odpowiedzi (bez user_id):
```typescript
type TaskResponseDto = Omit<Task, "user_id">;
// Rozwinięte:
// {
//   id: string;              // UUID
//   name: string;            // 1-255 znaków
//   description: string | null;
//   status: TaskStatus;      // 'active' | 'completed'
//   created_at: string;      // ISO 8601 timestamp
// }
```

### Command Models

**CreateTaskCommand** - Model dla warstwy serwisowej (zawiera user_id):
```typescript
interface CreateTaskCommand {
  user_id: string;       // UUID użytkownika z sesji
  name: string;          // Nazwa zadania
  description?: string;  // Opcjonalny opis
}
```

### Error DTOs

**ErrorResponseDto** - Standardowa struktura błędów:
```typescript
interface ErrorResponseDto {
  error: string;                    // Typ błędu
  message: string;                  // Czytelny komunikat
  details?: Record<string, unknown>; // Opcjonalne szczegóły
}
```

**ValidationErrorDto** - Szczegółowe błędy walidacji:
```typescript
interface ValidationErrorDto {
  error: "ValidationError";
  message: string;
  details: {
    field: string;    // Nazwa pola z błędem
    message: string;  // Komunikat błędu dla pola
  }[];
}
```

## 4. Szczegóły odpowiedzi

### Sukces - 201 Created

**Response Body**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Implement user authentication",
  "description": "Add login and registration functionality using Supabase Auth",
  "status": "active",
  "created_at": "2026-01-24T10:30:00.000Z"
}
```

**Headers**:
```
Content-Type: application/json
Location: /api/tasks/550e8400-e29b-41d4-a716-446655440000
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
      "message": "Name is required and cannot be empty"
    }
  ]
}
```

**400 Bad Request** - Nieprawidłowy JSON:
```json
{
  "error": "BadRequest",
  "message": "Invalid JSON in request body"
}
```

**401 Unauthorized** - Brak autoryzacji:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required to create tasks"
}
```

**500 Internal Server Error** - Błąd serwera:
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred while creating the task"
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/tasks
       │ { name, description }
       ▼
┌─────────────────────────────────────────┐
│  Astro API Route Handler                │
│  (src/pages/api/tasks.ts)               │
│                                          │
│  1. Check prerender = false             │
│  2. Verify HTTP method is POST          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Authentication Check                    │
│  (Astro.locals.supabase)                │
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
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Input Validation (Zod Schema)          │
│                                          │
│  - Validate CreateTaskRequestDto        │
│  - Check name: required, 1-255 chars    │
│  - Check description: optional, max 5000│
│  - Return 400 with details if invalid   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Create Command Object                   │
│                                          │
│  - Build CreateTaskCommand              │
│  - Add user_id from authenticated user  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Task Service Layer                      │
│  (src/lib/services/task.service.ts)     │
│                                          │
│  - Execute createTask(command)          │
│  - Handle business logic                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase Database Interaction           │
│  (via Astro.locals.supabase)            │
│                                          │
│  1. Insert into tasks table:            │
│     - user_id (from command)            │
│     - name (from command)               │
│     - description (from command)        │
│     - status = 'active' (default)       │
│     - created_at = now() (default)      │
│     - id = gen_random_uuid() (default)  │
│                                          │
│  2. RLS Policy Check:                   │
│     - Verify auth.uid() = user_id       │
│                                          │
│  3. Return inserted row                 │
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
- Zwrócenie 401 Unauthorized jeśli sesja nie istnieje lub wygasła

### 2. Autoryzacja (Authorization)

**RLS Policies w Supabase:**
- Tabela `tasks` ma włączone Row Level Security
- Policy: `CREATE POLICY task_is_owner ON tasks USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
- Automatycznie zapewnia, że użytkownik może tworzyć tylko swoje zadania
- Dodatkowa warstwa bezpieczeństwa na poziomie bazy danych

### 3. Walidacja danych wejściowych

**Zabezpieczenia przed atakami:**
- Walidacja Zod zapobiega SQL injection (typy są sprawdzane przed zapytaniem)
- Ograniczenie długości pól:
  - `name`: max 255 znaków (zgodnie z kolumną VARCHAR(255) w bazie)
  - `description`: max 5000 znaków (zgodnie z kolumną VARCHAR(5000) w bazie)
- Wymóg niepustej nazwy (min 1 znak po trim)

### 4. Ochrona przed CSRF

- Astro automatycznie weryfikuje origin dla żądań POST
- Middleware może dodatkowo sprawdzać nagłówki CSRF token jeśli wymagane
- Supabase session cookies mają flagi HttpOnly i Secure

### 5. Rate Limiting

**Zalecenia (implementacja opcjonalna dla MVP):**
- Ograniczenie liczby requestów na użytkownika (np. 100 zadań/godzinę)
- Implementacja na poziomie middleware lub API Gateway
- Użycie Redis do śledzenia limitów

### 6. Sanityzacja danych

- Zod automatycznie konwertuje typy i waliduje format
- `trim()` na polu name usuwa białe znaki z początku i końca
- Supabase Prepared Statements zapobiegają SQL injection

### 7. Logowanie i audyt

**Co logować:**
- Błędy serwera (500) z pełnym stack trace
- Próby nieautoryzowanego dostępu (401) z user IP
- Błędy walidacji (400) bez wrażliwych danych

**Czego NIE logować:**
- Tokenów autoryzacyjnych
- Pełnych danych sesji
- Haseł użytkowników

## 7. Obsługa błędów

### 1. Błędy walidacji (400 Bad Request)

**Scenariusze:**
- Brak pola `name` w request body
- Pole `name` jest puste lub zawiera tylko białe znaki
- Pole `name` przekracza 255 znaków
- Pole `description` przekracza 5000 znaków
- Nieprawidłowy format JSON

### 2. Błędy autoryzacji (401 Unauthorized)

**Scenariusze:**
- Brak tokenu autoryzacyjnego (brak sesji)
- Nieważny token (wygasła sesja)
- Token nie jest powiązany z żadnym użytkownikiem

### 3. Błędy bazy danych (500 Internal Server Error)

**Scenariusze:**
- Utrata połączenia z bazą danych
- Naruszenie ograniczeń bazy danych (foreign key, check constraints)
- Błąd RLS policy (rzadkie, ale możliwe)
- Timeout zapytania

### 4. Błędy parsowania JSON (400 Bad Request)

**Scenariusze:**
- Nieprawidłowy format JSON w request body
- Brak Content-Type: application/json

### 5. Błędy HTTP Method (405 Method Not Allowed)

**Scenariusze:**
- Użycie innej metody niż POST (GET, PUT, DELETE, PATCH)

## 8. Rozważania dotyczące wydajności

### 1. Optymalizacja zapytań do bazy danych

**Single Insert Operation:**
- Endpoint wykonuje pojedyncze zapytanie INSERT
- Supabase automatycznie zwraca wstawiony wiersz (RETURNING *)
- Brak konieczności dodatkowego SELECT

**Indeksy:**
- Kolumna `user_id` w tabeli `tasks` powinna mieć indeks (zgodnie z db-plan.md)
- Indeks wspiera RLS policy check i przyszłe zapytania filtrujące po użytkowniku

### 2. Walidacja i parsowanie

**Zod Performance:**
- Walidacja Zod jest szybka dla prostych schematów
- Schemat CreateTaskRequestDto ma tylko 2 pola
- Overhead walidacji < 1ms dla typowego request

**JSON Parsing:**
- Astro używa natywnego `JSON.parse()` (bardzo wydajne)
- Limit rozmiaru request body powinien być ustawiony na poziomie serwera (np. 1MB)

### 3. Connection Pooling

**Supabase Client:**
- Supabase automatycznie zarządza connection poolingiem
- Używanie `Astro.locals.supabase` zapewnia reużycie połączeń
- Nie tworzymy nowych klientów dla każdego żądania

### 4. Response Size

**Optymalizacja odpowiedzi:**
- TaskResponseDto jest mały (< 1KB typowo)
- Brak niepotrzebnych pól (user_id jest usuwany)
- JSON jest naturalnie skompresowany przez gzip na poziomie HTTP

### 5. Error Handling Overhead

**Fast-fail pattern:**
- Wczesne zwracanie błędów walidacji (guard clauses)
- Unikanie niepotrzebnych operacji przy błędnych danych
- Minimalizacja try-catch bloków do niezbędnych operacji

### 6. Potencjalne wąskie gardła

**Identyfikacja:**
1. **Supabase latency**: Zależne od lokalizacji serwera (typowo 20-100ms)
2. **RLS policy evaluation**: Dodatkowe ~5-10ms na sprawdzenie polityk
3. **Cold start** (jeśli używamy serverless): Pierwszy request może być wolniejszy

**Strategie mitygacji:**
- Używanie Supabase w tym samym regionie co aplikacja
- Monitoring czasów odpowiedzi (logging)
- Rozważenie cachingu dla często używanych danych (nie dotyczy CREATE)

### 7. Skalowanie

**Horizontal Scaling:**
- Endpoint jest stateless (brak state w pamięci)
- Może być łatwo skalowany poziomo (wiele instancji)
- Supabase obsługuje connection pooling dla wielu instancji

**Limits:**
- Supabase Free Tier: 500MB database, 2GB bandwidth, 50MB file uploads
- Supabase Pro: Unlimited requests (rate limited per API key)
- Rozważenie rate limiting na poziomie aplikacji przy dużym ruchu

## 9. Kroki implementacji

### Krok 1: Utworzenie schematu walidacji Zod

**Lokalizacja:** `src/lib/validation/task.validation.ts` (nowy plik)

**Zadania:**
1. Zaimportować zod
2. Utworzyć schemat `createTaskSchema` zgodny z CreateTaskRequestDto
3. Wyeksportować schemat dla użycia w route handler

### Krok 2: Utworzenie serwisu zadań

**Lokalizacja:** `src/lib/services/task.service.ts` (nowy plik)

**Zadania:**
1. Zaimportować typy: CreateTaskCommand, TaskResponseDto, Task
2. Zaimportować SupabaseClient z `src/db/supabase.client.ts`
3. Utworzyć funkcję `createTask(supabase: SupabaseClient, command: CreateTaskCommand): Promise<TaskResponseDto>`
4. Implementować logikę:
   - Insert do tabeli tasks
   - Obsługa błędów Supabase
   - Transformacja wyniku (usunięcie user_id)
   - Zwrócenie TaskResponseDto

### Krok 3: Utworzenie API route handler

**Lokalizacja:** `src/pages/api/tasks.ts` (nowy plik)

**Zadania:**
1. Dodać `export const prerender = false;` na początku pliku
2. Zaimportować potrzebne typy i funkcje
3. Zdefiniować funkcję POST handler
4. Implementować kolejne kroki walidacji i przetwarzania

### Krok 4: Implementacja sprawdzenia metody HTTP

### Krok 5: Implementacja sprawdzenia uwierzytelniania

### Krok 6: Implementacja parsowania i walidacji request body

### Krok 7: Utworzenie command object i wywołanie serwisu

### Krok 8: Zwrócenie sukcesu (201 Created)

### Krok 9: Testowanie endpointu

### Krok 10: Dodanie testów automatycznych (opcjonalne dla MVP)

**Lokalizacja:** `src/pages/api/tasks.test.ts`

**Framework:** Vitest lub inny test runner

**Przypadki testowe:**
- Utworzenie zadania z poprawnymi danymi
- Odmowa dostępu dla niezalogowanego użytkownika
- Walidacja wymaganych pól
- Walidacja długości pól
- Obsługa nieprawidłowego JSON
- Obsługa błędów bazy danych (mock)

### Krok 11: Dokumentacja API

**Lokalizacja:** Aktualizacja `README.md` lub dedykowany plik API docs

**Zawartość:**
- Opis endpointu
- Przykłady żądań i odpowiedzi
- Lista błędów
- Wymagania autoryzacyjne
- Rate limiting (jeśli dotyczy)

### Krok 12: Code Review i deployment
