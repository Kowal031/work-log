# API Endpoint Implementation Plan: Get Tasks List

## 1. Przegląd punktu końcowego

Endpoint **GET /api/tasks** umożliwia zalogowanym użytkownikom pobieranie listy wszystkich swoich zadań z opcjonalnym filtrowaniem i sortowaniem. Endpoint wspiera parametry query do filtrowania po statusie zadania oraz sortowania według różnych pól. Zwraca tablicę zadań przypisanych do uwierzytelnionego użytkownika.

**Kluczowe funkcjonalności:**
- Pobieranie listy zadań dla zalogowanego użytkownika
- Filtrowanie po statusie zadania (active/completed)
- Sortowanie według pola i kierunku (asc/desc)
- Zwracanie pustej tablicy jeśli użytkownik nie ma zadań
- Paginacja (opcjonalnie dla przyszłych wersji)

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/tasks`
- **Headers**:
  - `Authorization: Bearer <token>` (obsługiwane przez Supabase Auth via cookies/headers)
  
- **Parametry**:
  - **Query Parameters** (wszystkie opcjonalne):
    - `status` (string, enum: 'active' | 'completed'): Filtrowanie po statusie zadania
    - `sortBy` (string, enum: 'created_at' | 'name'): Pole do sortowania
    - `order` (string, enum: 'asc' | 'desc'): Kierunek sortowania (domyślnie 'desc')

- **Request Body**: Brak (metoda GET)

- **Przykładowe żądania**:
  ```bash
  # Wszystkie zadania (bez filtrów)
  GET /api/tasks
  
  # Tylko aktywne zadania
  GET /api/tasks?status=active
  
  # Ukończone zadania, sortowane po nazwie rosnąco
  GET /api/tasks?status=completed&sortBy=name&order=asc
  
  # Wszystkie zadania, sortowane po dacie utworzenia (najnowsze pierwsze)
  GET /api/tasks?sortBy=created_at&order=desc
  ```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**TaskResponseDto** - Struktura odpowiedzi dla pojedynczego zadania:
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

**ListTasksQueryDto** - Parametry query dla filtrowania:
```typescript
interface ListTasksQueryDto {
  status?: TaskStatus;           // 'active' | 'completed'
  sortBy?: "created_at" | "name"; // Pole sortowania
  order?: "asc" | "desc";        // Kierunek sortowania
}
```

### Command Models

**GetTasksCommand** - Model dla warstwy serwisowej:
```typescript
interface GetTasksCommand {
  user_id: string;              // UUID użytkownika z sesji
  status?: TaskStatus;          // Opcjonalny filtr statusu
  sortBy?: "created_at" | "name"; // Opcjonalne sortowanie
  order?: "asc" | "desc";       // Kierunek sortowania
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
    field: string;
    message: string;
  }[];
}
```

## 4. Szczegóły odpowiedzi

### Sukces - 200 OK

**Response Body** (przykład z zadaniami):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Implement login feature",
    "description": "Add user authentication with email and password",
    "status": "active",
    "created_at": "2026-01-24T10:30:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Write API documentation",
    "description": null,
    "status": "completed",
    "created_at": "2026-01-23T14:20:00.000Z"
  }
]
```

**Response Body** (brak zadań):
```json
[]
```

**Headers**:
```
Content-Type: application/json
```

### Błędy

**400 Bad Request** - Nieprawidłowe query parameters:
```json
{
  "error": "ValidationError",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "status",
      "message": "Status must be either 'active' or 'completed'"
    }
  ]
}
```

**401 Unauthorized** - Brak autoryzacji:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required to retrieve tasks"
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
  "message": "An unexpected error occurred while retrieving tasks"
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/tasks?status=active&sortBy=created_at&order=desc
       │
       ▼
┌─────────────────────────────────────────┐
│  Astro API Route Handler                │
│  (src/pages/api/tasks.ts)               │
│                                          │
│  1. Check prerender = false             │
│  2. Verify HTTP method is GET           │
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
│  Query Parameters Parsing                │
│                                          │
│  - Extract URL search params            │
│  - Parse status, sortBy, order          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Query Parameters Validation (Zod)      │
│                                          │
│  - Validate ListTasksQueryDto           │
│  - Check status: optional enum          │
│  - Check sortBy: optional enum          │
│  - Check order: optional enum           │
│  - Return 400 with details if invalid   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Create Command Object                   │
│                                          │
│  - Build GetTasksCommand                │
│  - Add user_id from authenticated user  │
│  - Add validated query parameters       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Task Service Layer                      │
│  (src/lib/services/task.service.ts)     │
│                                          │
│  - Execute getTasks(command)            │
│  - Apply filters and sorting            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase Database Query                 │
│  (via Astro.locals.supabase)            │
│                                          │
│  1. Query tasks table:                  │
│     SELECT id, name, description,       │
│            status, created_at           │
│     FROM tasks                          │
│     WHERE user_id = $1                  │
│     [AND status = $2]  -- if filtered   │
│     ORDER BY $3 $4     -- if sorted     │
│                                          │
│  2. RLS Policy Check:                   │
│     - Verify auth.uid() = user_id       │
│                                          │
│  3. Return matching rows                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Transform Response                      │
│  (Service Layer)                         │
│                                          │
│  - User_id already excluded in SELECT   │
│  - Return TaskResponseDto[]             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  API Route Response                      │
│                                          │
│  - Set status 200 OK                    │
│  - Return JSON array                    │
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
- Policy: `SELECT POLICY task_is_owner ON tasks USING (auth.uid() = user_id)`
- Automatycznie zapewnia, że użytkownik widzi tylko swoje zadania
- Dodatkowa warstwa bezpieczeństwa na poziomie bazy danych

### 3. Walidacja query parameters

**Zabezpieczenia:**
- Walidacja Zod zapobiega SQL injection
- Ograniczenie dozwolonych wartości dla enums:
  - `status`: tylko 'active' lub 'completed'
  - `sortBy`: tylko 'created_at' lub 'name'
  - `order`: tylko 'asc' lub 'desc'
- Ignorowanie nieznanych parametrów

**Schemat Zod:**
```typescript
const listTasksQuerySchema = z.object({
  status: z.enum(["active", "completed"]).optional(),
  sortBy: z.enum(["created_at", "name"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
```

### 4. Ochrona przed CSRF

- GET requests nie modyfikują danych (idempotent)
- CSRF tokens nie są wymagane dla GET
- RLS policies dodatkowa warstwa ochrony

### 5. Rate Limiting

**Zalecenia (implementacja opcjonalna dla MVP):**
- Ograniczenie liczby requestów na użytkownika (np. 1000 GET/godzinę)
- Implementacja na poziomie middleware lub API Gateway
- Użycie Redis do śledzenia limitów

### 6. Data Exposure

**Co jest ukrywane:**
- `user_id` nie jest zwracany w response (wykluczony w SELECT)
- Zadania innych użytkowników są niewidoczne (RLS)

**Co jest eksponowane:**
- Tylko dane zadań należących do zalogowanego użytkownika
- Wszystkie pola zadania oprócz user_id

### 7. Logowanie i audyt

**Co logować:**
- Błędy serwera (500) z pełnym stack trace
- Próby nieautoryzowanego dostępu (401) z user IP
- Błędy walidacji (400) bez wrażliwych danych

**Czego NIE logować:**
- Tokenów autoryzacyjnych
- Pełnych danych sesji
- Zawartości zadań (privacy)

## 7. Obsługa błędów

### 1. Błędy walidacji (400 Bad Request)

**Scenariusze:**
- Nieprawidłowa wartość parametru `status` (np. "pending")
- Nieprawidłowa wartość parametru `sortBy` (np. "title")
- Nieprawidłowa wartość parametru `order` (np. "ascending")

### 2. Błędy autoryzacji (401 Unauthorized)

**Scenariusze:**
- Brak tokenu autoryzacyjnego (brak sesji)
- Nieważny token (wygasła sesja)
- Token nie jest powiązany z żadnym użytkownikiem

### 3. Błędy bazy danych (500 Internal Server Error)

**Scenariusze:**
- Utrata połączenia z bazą danych
- Timeout zapytania
- Błąd w RLS policy (rzadkie)

### 4. Błędy HTTP Method (405 Method Not Allowed)

**Scenariusze:**
- Użycie innej metody niż GET (POST, PUT, DELETE, PATCH)

## 8. Rozważania dotyczące wydajności

### 1. Optymalizacja zapytań do bazy danych

**Single SELECT Operation:**
- Endpoint wykonuje pojedyncze zapytanie SELECT
- Filtrowanie i sortowanie wykonywane na poziomie bazy danych (wydajne)
- Brak N+1 query problem

**Indeksy:**
- Kolumna `user_id` powinna mieć indeks (zgodnie z db-plan.md)
- Kolumna `status` może mieć indeks jeśli często filtrowana
- Kolumna `created_at` powinna mieć indeks dla sortowania
- Composite index na (user_id, status, created_at) dla optymalnej wydajności

**Zalecane indeksy:**
```sql
-- Podstawowy indeks na user_id (już istnieje)
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Composite index dla popularnych zapytań
CREATE INDEX idx_tasks_user_status_created ON tasks(user_id, status, created_at DESC);

-- Indeks dla sortowania po nazwie
CREATE INDEX idx_tasks_user_name ON tasks(user_id, name);
```

### 2. Paginacja (przyszła implementacja)

**Zalecenia dla dużych zbiorów danych:**
- Dodanie parametrów `limit` i `offset` lub `page` i `pageSize`
- Domyślny limit (np. 50 zadań na stronę)
- Zwracanie informacji o paginacji w response headers:
  ```
  X-Total-Count: 150
  X-Page: 1
  X-Page-Size: 50
  ```

**Przykładowa paginacja:**
```typescript
// Query parameters
interface PaginatedListTasksQueryDto extends ListTasksQueryDto {
  page?: number;      // Numer strony (domyślnie 1)
  pageSize?: number;  // Rozmiar strony (domyślnie 50, max 100)
}

// Supabase query
const { data, count } = await supabase
  .from("tasks")
  .select("*", { count: "exact" })
  .range((page - 1) * pageSize, page * pageSize - 1);
```

### 3. Caching

**Strategie (opcjonalne dla MVP):**
- **Client-side caching**: Cache-Control headers dla browser cache
- **Server-side caching**: Redis cache dla często pobieranych list
- **Stale-while-revalidate**: Zwracanie cached data z background refresh

**Przykład Cache-Control:**
```typescript
return new Response(JSON.stringify(tasks), {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "private, max-age=60", // Cache na 60 sekund
  }
});
```

### 4. Response Size

**Optymalizacja:**
- Pojedyncze zadanie: ~200-500 bytes
- 50 zadań: ~10-25 KB (akceptowalne bez kompresji)
- gzip automatycznie kompresuje JSON na poziomie HTTP
- Rozważenie paginacji dla użytkowników z >100 zadań

### 5. Query Performance

**Benchmarks (szacunkowe):**
- Query bez filtrów: ~5-20ms
- Query z filtrem status: ~5-20ms (z indeksem)
- Query z sortowaniem: ~5-25ms (z indeksem)
- Total request time: ~50-150ms (including network)

### 6. Skalowanie

**Horizontal Scaling:**
- Endpoint jest stateless (brak state w pamięci)
- Może być łatwo skalowany poziomo (wiele instancji)
- Supabase obsługuje connection pooling

**Database Scaling:**
- Supabase Free Tier: 500MB database, 2GB bandwidth
- Limit połączeń: Max 60 concurrent connections (Free Tier)
- Rozważenie upgrade przy >10,000 zadań na użytkownika

## 9. Kroki implementacji

### Krok 1: Rozszerzenie schematu walidacji Zod

**Lokalizacja:** `src/lib/validation/task.validation.ts` (istniejący plik)

**Zadania:**
1. Dodać schemat `listTasksQuerySchema` dla parametrów query
2. Walidować status, sortBy, order z odpowiednimi enumami
3. Wszystkie pola opcjonalne
4. Wyeksportować schemat

**Kod:**
```typescript
export const listTasksQuerySchema = z.object({
  status: z.enum(["active", "completed"]).optional(),
  sortBy: z.enum(["created_at", "name"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
```

### Krok 2: Aktualizacja serwisu zadań

**Lokalizacja:** `src/lib/services/task.service.ts` (istniejący plik)

**Zadania:**
1. Dodać typ `GetTasksCommand` (lub użyć z types.ts)
2. Rozszerzyć funkcję `getTasks()` o obsługę filtrowania i sortowania
3. Budować dynamiczne query z opcjonalnymi filtrami
4. Zwracać `TaskResponseDto[]`

### Krok 3: Dodanie GET handler do API route

**Lokalizacja:** `src/pages/api/tasks.ts` (istniejący plik)

**Zadania:**
1. Dodać eksport `GET: APIRoute`
2. Implementować podobny flow jak POST
3. Parsować i walidować query parameters
4. Wywołać `getTasks()` z service layer
5. Zwrócić 200 OK z tablicą zadań

### Krok 4: Implementacja sprawdzenia metody HTTP dla GET

**Zadania:**
1. Dodać sprawdzenie `request.method !== 'GET'`
2. Zwrócić 405 Method Not Allowed z header `Allow: GET`

### Krok 5: Implementacja sprawdzenia uwierzytelniania

**Zadania:**
1. Użyć `locals.supabase.auth.getUser()`
2. Zwrócić 401 Unauthorized jeśli brak użytkownika

### Krok 6: Implementacja parsowania query parameters

**Zadania:**
1. Użyć `new URL(request.url).searchParams`
2. Wyekstrahować `status`, `sortBy`, `order`
3. Przekazać do walidacji Zod

### Krok 7: Implementacja walidacji query parameters

**Zadania:**
1. Użyć `listTasksQuerySchema.parse()`
2. Obsłużyć `ZodError` i zwrócić 400 Bad Request
3. Zwrócić szczegółowe błędy walidacji

### Krok 8: Utworzenie command object i wywołanie serwisu

**Zadania:**
1. Utworzyć `GetTasksCommand` z user_id i validated query params
2. Wywołać `taskService.getTasks(command)`
3. Obsłużyć błędy serwisu

### Krok 9: Zwrócenie sukcesu (200 OK)

**Zadania:**
1. Zwrócić tablicę zadań jako JSON
2. Ustawić status 200
3. Dodać odpowiednie headers

### Krok 10: Weryfikacja błędów kompilacji

**Zadania:**
1. Uruchomić TypeScript compiler
2. Sprawdzić linter
3. Naprawić wszystkie błędy

### Krok 11: Testowanie endpointu (opcjonalne)

**Zadania:**
1. Test bez parametrów
2. Test z filtrem status
3. Test z sortowaniem
4. Test z nieprawidłowymi parametrami
5. Test bez autoryzacji

### Krok 12: Aktualizacja dokumentacji API

**Zadania:**
1. Dodać dokumentację GET /api/tasks do README.md
2. Przykłady requestów i responses
3. Lista błędów
4. Przykłady użycia z curl

## 10. Dodatkowe uwagi

### Różnice między POST i GET

**POST /api/tasks:**
- Tworzy nowe zasoby
- Request body z danymi
- Zwraca 201 Created
- Location header z URL nowego zasobu

**GET /api/tasks:**
- Pobiera istniejące zasoby
- Query parameters dla filtrowania
- Zwraca 200 OK
- Może zwrócić pustą tablicę (nie błąd)

### Domyślne zachowanie

**Jeśli brak parametrów query:**
- Zwracane są wszystkie zadania użytkownika
- Sortowanie: `created_at DESC` (najnowsze pierwsze)
- Brak limitu (wszystkie zadania)

### Przyszłe rozszerzenia

**Możliwe usprawnienia:**
- Paginacja (limit/offset)
- Full-text search w name i description
- Filtrowanie po zakresie dat (created_after, created_before)
- Sortowanie po wielu polach
- Agregacje (count, total time tracked)
- Response headers z metadanymi (total count, page info)
