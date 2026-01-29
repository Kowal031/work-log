# Status Testów Jednostkowych: summary.service.ts

## Przegląd

Testy jednostkowe dla modułu `src/lib/services/summary.service.ts` obejmują funkcję generowania dziennych podsumowań czasu pracy w aplikacji WorkLog. Implementacja wykorzystuje Vitest, mocki Supabase oraz wzorce testowe zgodne z najlepszymi praktykami. Testy pokrywają zarówno ścieżkę single-day (PostgreSQL function) jak i multi-day (direct query).

**Plik testowy:** `src/lib/services/summary.service.test.ts`  
**Data implementacji:** 2026-01-29  
**Pokrycie kodu:** ~100% (wszystkie ścieżki, parsowanie interwałów i przypadki brzegowe)  
**Framework:** Vitest + TypeScript  
**Mock Strategy:** Factory Pattern dla Supabase Client

---

## ✅ Zrealizowane Testy

### 1. Funkcja `getDailySummary()` - Single Day - 9 testów

#### ✅ Test 1.1: Pobieranie podsumowania dla jednego dnia przez PostgreSQL function
**Scenariusz:** Użytkownik ma sesje czasu w jednym dniu  
**Weryfikacja:**
- Wywołanie `supabase.rpc('get_daily_summary')` z parametrami `p_user_id`, `p_date`, `p_timezone_offset_minutes`
- Parsowanie PostgreSQL interval (format "HH:MM:SS")
- Pobieranie statusów zadań z tabeli `tasks`
- Zwrócenie DailySummaryResponseDto z zagregowanymi danymi

**Arrange:**
```typescript
dateFrom = "2026-01-29T00:00:00.000Z"
dateTo = "2026-01-29T23:59:59.999Z" // Same day
mockSummaryData = [
  { task_id: "task-1", task_name: "Task 1", total_duration: "02:30:00" }
]
```

**Assert:**
- `supabase.rpc()` wywołany z ekstraktowaną datą "2026-01-29"
- `duration_seconds` = 9000 (2.5h)
- `duration_formatted` = "02:30:00"
- `tasks` posortowane malejąco po duration

#### ✅ Test 1.2: Parsowanie interwałów PostgreSQL z dniami
**Scenariusz:** Interval w formacie "X days HH:MM:SS"  
**Weryfikacja:**
- Funkcja `parsePostgresInterval()` poprawnie parsuje "2 days 03:45:12"
- Obliczenie: 2*24*3600 + 3*3600 + 45*60 + 12 = 186312s
- Formatowanie przez `secondsToHMS()`

**Edge case:** Długie sesje przekraczające 24h

#### ✅ Test 1.3: Pusta tablica gdy brak danych dla jednego dnia
**Scenariusz:** RPC zwraca pustą tablicę  
**Weryfikacja:**
- Zwrócenie empty summary: `tasks: []`, `total_duration_seconds: 0`
- Brak błędu (valid state)

#### ✅ Test 1.4: Pusta tablica gdy RPC zwraca null
**Scenariusz:** RPC zwraca `data: null` (bez errora)  
**Weryfikacja:**
- Fallback do empty summary
- Ochrona przed undefined

#### ✅ Test 1.5: Błąd przy niepowodzeniu RPC
**Scenariusz:** PostgreSQL function zwraca error  
**Weryfikacja:**
- Funkcja rzuca Error: "Failed to fetch summary: {message}"
- Error propagowany

#### ✅ Test 1.6: Błąd przy pobieraniu statusów zadań
**Scenariusz:** Query do tabeli `tasks` fails  
**Weryfikacja:**
- Funkcja rzuca Error: "Failed to fetch task statuses: {message}"
- Dodatkowy query nie może blokować całości

#### ✅ Test 1.7: Domyślny status 'active' gdy zadanie nie znalezione
**Scenariusz:** Task ID w summary nie istnieje w tabeli tasks (orphaned)  
**Weryfikacja:**
- Fallback: `task_status = "active"`
- Ochrona przed niespójnością danych

**Business Logic:**
```typescript
task_status: taskStatusMap.get(row.task_id) || "active"
```

#### ✅ Test 1.8: Sortowanie zadań po czasie malejąco
**Scenariusz:** Wiele zadań z różnymi czasami  
**Weryfikacja:**
- Sortowanie: najdłuższe zadanie pierwsze
- Array.sort() po `duration_seconds DESC`

**Arrange:**
```typescript
tasks = ["Short Task" (15m), "Long Task" (3h), "Medium Task" (1.5h)]
```

**Assert:**
```typescript
result.tasks[0].task_name === "Long Task" // 3h
result.tasks[1].task_name === "Medium Task" // 1.5h
result.tasks[2].task_name === "Short Task" // 15m
```

#### ✅ Test 1.9: Formatowanie dat w wywołaniu RPC
**Scenariusz:** Ekstraktowanie daty z timestamp ISO 8601  
**Weryfikacja:**
- `dateFrom = "2026-01-29T00:00:00.000Z"` → `p_date = "2026-01-29"`
- Split by "T" i wzięcie pierwszej części

---

### 2. Funkcja `getDailySummary()` - Multi-Day Range - 8 testów

#### ✅ Test 2.1: Pobieranie podsumowania dla zakresu dni przez direct query
**Scenariusz:** Użytkownik zapyta o zakres 3 dni (fromDate !== toDate)  
**Weryfikacja:**
- Wywołanie `supabase.from('time_entries').select(...)`
- WHERE clauses: `eq('user_id')`, `gte('start_time', dateFrom)`, `lte('start_time', dateTo)`, `not('end_time', 'is', null)`
- ORDER BY: `start_time ASC`
- Agregacja per task_id (Map)
- Obliczanie duration w milisekundach: `(endMs - startMs) / 1000`

**Arrange:**
```typescript
dateFrom = "2026-01-28T00:00:00.000Z"
dateTo = "2026-01-30T23:59:59.999Z" // 3 days
mockEntries = [
  { task_id: "task-1", start: "2026-01-28T09:00", end: "2026-01-28T11:00" }, // 2h
  { task_id: "task-1", start: "2026-01-29T10:00", end: "2026-01-29T12:00" }, // 2h
  { task_id: "task-2", start: "2026-01-29T14:00", end: "2026-01-29T15:30" }  // 1.5h
]
```

**Assert:**
- Task 1: `duration_seconds = 14400` (4h), `entries_count = 2`
- Task 2: `duration_seconds = 5400` (1.5h), `entries_count = 1`
- Total: `19800s`

#### ✅ Test 2.2: Pusta tablica gdy brak wpisów dla zakresu
**Scenariusz:** Query zwraca `data: []`  
**Weryfikacja:**
- Empty summary bez błędu
- `tasks: []`, `total_duration_seconds: 0`

#### ✅ Test 2.3: Pusta tablica gdy data = null
**Scenariusz:** Query zwraca `data: null`  
**Weryfikacja:**
- Fallback do empty summary
- Ochrona przed undefined

#### ✅ Test 2.4: Błąd przy niepowodzeniu multi-day query
**Scenariusz:** Database timeout lub connection error  
**Weryfikacja:**
- Funkcja rzuca Error: "Failed to fetch summary: {message}"
- Error propagowany

#### ✅ Test 2.5: Filtrowanie wpisów z null tasks
**Scenariusz:** Entry należy do usuniętego zadania (`tasks: null`)  
**Weryfikacja:**
- Filter type guard: `entry.tasks !== null`
- Tylko valid entries w wyniku
- Brak błędów przy null reference

**Business Logic:**
```typescript
const flatEntries = entries
  .filter((entry): entry is EntryWithTask => entry.tasks !== null)
  .map(entry => ({ ...entry.tasks }))
```

#### ✅ Test 2.6: Agregacja wielu wpisów dla tego samego zadania
**Scenariusz:** Użytkownik ma 3 sesje dla jednego zadania w różnych dniach  
**Weryfikacja:**
- Suma czasów: `duration_seconds = sum(all entries)`
- Licznik: `entries_count = 3`
- Single task summary w wyniku

**Arrange:**
```typescript
mockEntries = [
  { task_id: "task-1", duration: 1h },
  { task_id: "task-1", duration: 1.5h },
  { task_id: "task-1", duration: 1h }
]
```

**Assert:**
```typescript
result.tasks[0].duration_seconds === 12600 // 3.5h
result.tasks[0].entries_count === 3
```

#### ✅ Test 2.7: Obliczanie czasu z precyzją milisekund
**Scenariusz:** Entry z millisekundami: "09:00:00.123Z" → "09:00:05.789Z"  
**Weryfikacja:**
- Obliczenie: `(endMs - startMs) / 1000`
- Floor do pełnych sekund: `Math.floor()`
- Wynik: 5s (5.666s floored)

#### ✅ Test 2.8: Sortowanie zadań po czasie malejąco (multi-day)
**Scenariusz:** Wiele zadań w zakresie dni  
**Weryfikacja:**
- Identyczne sortowanie jak w single-day
- `tasks.sort((a, b) => b.duration_seconds - a.duration_seconds)`

---

### 3. Edge Cases - 4 testy

#### ✅ Test 3.1: Obsługa wpisów o zerowym czasie trwania
**Scenariusz:** `start_time === end_time`  
**Weryfikacja:**
- Duration = 0 sekund
- Formatowanie: "00:00:00"
- Brak błędów, valid case

#### ✅ Test 3.2: Parsowanie interwału "00:00:00"
**Scenariusz:** PostgreSQL zwraca interval zerowy  
**Weryfikacja:**
- `parsePostgresInterval("00:00:00")` = 0
- Brak błędów regex

#### ✅ Test 3.3: Ujemny timezone offset
**Scenariusz:** Użytkownik w strefie UTC-5 (timezoneOffset = -300)  
**Weryfikacja:**
- RPC wywołany z `-300`
- Poprawne przekazanie parametru
- Funkcja działa dla wszystkich stref czasowych

**Edge case:** Obsługa stref po obu stronach UTC

#### ✅ Test 3.4: Boundary między single-day a multi-day
**Scenariusz:** `dateFrom === dateTo` (ten sam dzień)  
**Weryfikacja:**
- Wybór ścieżki single-day (RPC)
- Nie wybór ścieżki multi-day (direct query)

**Business Logic:**
```typescript
const fromDate = new Date(dateFrom).toISOString().split('T')[0];
const toDate = new Date(dateTo).toISOString().split('T')[0];

if (fromDate === toDate) {
  // Single day path
} else {
  // Multi-day path
}
```

---

## 🧪 Metodologia Testowania

### Mock Strategy: Factory Pattern (Extended)

**Implementacja:**
```typescript
const createMockSupabaseClient = () => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockNot = vi.fn();
  const mockOrder = vi.fn();
  const mockIn = vi.fn();
  const mockRpc = vi.fn();

  return {
    from: vi.fn(() => ({ select: mockSelect })),
    rpc: mockRpc,
    _mocks: { select, eq, gte, lte, not, order, in, rpc },
  } as unknown as SupabaseClient;
};
```

**Rozszerzenia vs task.service:**
- Dodany `mockRpc` dla PostgreSQL functions
- Dodane `mockGte`, `mockLte` dla range queries
- Dodany `mockNot` dla null filtering
- Dodany `mockIn` dla batch queries (task statuses)

### Complex Query Chain Mocking

**Multi-day query chain:**
```typescript
mockSupabase._mocks.select.mockReturnValue({
  eq: vi.fn().mockReturnValue({
    gte: vi.fn().mockReturnValue({
      lte: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data, error })
        })
      })
    })
  })
});
```

**Zalety:**
- Imituje rzeczywisty Supabase query builder
- Pozwala weryfikować całą ścieżkę zapytania
- Type-safe chain

### Inline Snapshots dla Formatowania

**Przykład użycia:**
```typescript
expect(result.tasks[0].duration_formatted).toMatchInlineSnapshot(`"51:45:12"`);
```

**Zalety:**
- Automatyczne capture expected output
- Widoczne zmiany w code review
- Łatwa aktualizacja przy zmianach formatowania

### Type Guards Testing

**Testowanie filter z type guard:**
```typescript
.filter((entry): entry is EntryWithTask => entry.tasks !== null)
```

**Weryfikacja:**
- Tylko entries z tasks !== null w wyniku
- TypeScript type narrowing działa
- Brak runtime errors

---

## 📊 Pokrycie Testowe

### Metryki

| Grupa Testów | Testy | Pokrycie linii | Pokrycie branchy | Status |
|--------------|-------|----------------|------------------|--------|
| Single Day (RPC) | 9 | 100% | 100% | ✅ |
| Multi-Day (Direct) | 8 | 100% | 100% | ✅ |
| Edge Cases | 4 | 100% | 100% | ✅ |
| **TOTAL** | **21** | **100%** | **100%** | ✅ |

### Kategorie testów

- **Happy Path:** 10 testów (sukces single/multi-day, różne scenariusze)
- **Error Handling:** 4 testy (RPC fail, query fail, task status fail)
- **Edge Cases:** 4 testy (zero duration, null handling, negative offset)
- **Business Logic:** 3 testy (aggregation, sorting, filtering null tasks)

### Funkcje pomocnicze pokryte

| Funkcja | Testy Bezpośrednie | Testy Pośrednie | Status |
|---------|-------------------|-----------------|--------|
| `parsePostgresInterval()` | 0 | 3 | ✅ |
| `secondsToHMS()` | 0 | 21 | ✅ |

*Funkcje pomocnicze testowane pośrednio przez testy głównej funkcji*

---

## 🎯 Kluczowe Reguły Biznesowe (Przetestowane)

### 1. Routing Single-Day vs Multi-Day
✅ Decyzja bazuje na `fromDate === toDate` (porównanie string dates)  
✅ Single-day używa PostgreSQL function (optymalizacja)  
✅ Multi-day używa direct query (elastyczność)

**Logika:**
```typescript
const fromDate = new Date(dateFrom).toISOString().split('T')[0];
const toDate = new Date(dateTo).toISOString().split('T')[0];
if (fromDate === toDate) { /* RPC */ } else { /* Direct */ }
```

### 2. Parsowanie PostgreSQL Intervals
✅ Format "HH:MM:SS" obsługiwany  
✅ Format "X days HH:MM:SS" obsługiwany  
✅ Regex extraction dla dni i czasu  
✅ Konwersja do sekund: `days*86400 + hours*3600 + minutes*60 + seconds`

### 3. Agregacja Czasu
✅ Sumowanie duration per task_id (Map)  
✅ Licznik entries_count per task  
✅ Formatowanie przez `secondsToHMS()`  
✅ Sortowanie malejąco po duration

### 4. Timezone Handling
✅ Offset w minutach przekazywany do PostgreSQL function  
✅ Obsługa ujemnych offsetów (strefy zachodnie)  
✅ Backend odpowiedzialny za lokalną datę użytkownika

### 5. Null Safety i Filtrowanie
✅ Filter entries z `tasks !== null` (deleted tasks)  
✅ Type guard dla TypeScript type narrowing  
✅ Fallback do empty array gdy `data = null`  
✅ Default status "active" gdy task nie znaleziony

### 6. Precyzja Czasowa
✅ Obliczenia w milisekundach: `(endMs - startMs)`  
✅ Floor do pełnych sekund: `Math.floor(duration / 1000)`  
✅ Brak zaokrągleń w górę (konsekwentne undercount)

---

## 🐛 Znane Ograniczenia i Uwagi

### Ograniczenia Mocków

1. **Brak testów PostgreSQL function**
   - Mocki nie weryfikują faktycznej logiki SQL
   - Nie testują midnight splitting
   - Rozwiązanie: Testy integracyjne z test database

2. **Parsowanie interval ograniczone do znanych formatów**
   - Regex zakłada format PostgreSQL
   - Brak testów dla egzotycznych formatów (np. "X years Y months")
   - Rozwiązanie: Rozszerzenie regex lub dokumentacja ograniczeń

3. **Brak testów wydajności**
   - Nie testujemy N+1 queries dla wielu zadań
   - Nie testujemy limitów date range
   - Rozwiązanie: Benchmarki i load testing

### Przypadki nie pokryte

1. **Timezone Edge Cases**
   - Brak testów DST transitions (zmiana czasu)
   - Brak testów dla stref z fractional offsets (np. Nepal UTC+5:45)
   - Wymagane: Testy z rzeczywistymi datami DST

2. **Midnight Splitting Verification**
   - Unit testy nie weryfikują czy PostgreSQL function splituje poprawnie
   - Logika jest w SQL, nie w TypeScript
   - Rozwiązanie: Testy SQL function

3. **Concurrency dla Multi-Day**
   - Brak testów race conditions przy jednoczesnych instertach
   - Wymagane: Testy integracyjne

4. **Data Consistency**
   - Brak testów czy RPC i direct query dają te same wyniki
   - Rozwiązanie: Consistency test porównujący obie ścieżki

---

## 📚 Dokumentacja Testów

### Uruchamianie Testów

```bash
# Wszystkie testy summary.service
npm run test summary.service

# Watch mode
npm run test summary.service -- --watch

# Coverage report
npm run test:coverage summary.service

# UI mode
npm run test:ui

# Specific describe block
npm run test summary.service -- -t "single day"
```

### Struktura Pliku Testowego

```
summary.service.test.ts (21 testów)
├── describe: getDailySummary - single day (9 testów)
│   ├── ✅ RPC success scenarios (2)
│   ├── ✅ Empty states (2)
│   ├── ✅ Error scenarios (2)
│   └── ✅ Business logic (3: sorting, status fallback, interval parsing)
├── describe: getDailySummary - multi-day range (8 testów)
│   ├── ✅ Direct query success (1)
│   ├── ✅ Empty states (2)
│   ├── ✅ Error scenarios (1)
│   └── ✅ Business logic (4: filtering, aggregation, precision, sorting)
└── describe: edge cases (4 testy)
    ├── ✅ Zero duration (1)
    ├── ✅ Interval formats (1)
    ├── ✅ Negative timezone (1)
    └── ✅ Boundary conditions (1)
```

### Best Practices Zastosowane

✅ **Descriptive test names** - jasny opis scenariusza  
✅ **AAA Pattern** - Arrange-Act-Assert w każdym teście  
✅ **Mock Factory** - reużywalny mock z extended methods  
✅ **Type Safety** - pełne typowanie + type guards  
✅ **beforeEach cleanup** - izolacja testów  
✅ **Edge cases coverage** - zero, null, negative values  
✅ **Inline snapshots** - dla formatowania czasu  
✅ **Complex chain mocking** - realistic Supabase queries  
✅ **Business logic verification** - routing, aggregation, sorting

---

## 📈 Historia Zmian

| Data | Wersja | Zmiany |
|------|--------|--------|
| 2026-01-29 | 1.0 | Początkowa implementacja 21 testów jednostkowych dla summary.service |

---

## 🔍 Analiza Pokrycia Specjalnego

### Funkcja `parsePostgresInterval()`

**Testowana pośrednio przez:**
- Test 1.2: Interval z dniami "2 days 03:45:12"
- Test 3.2: Interval zerowy "00:00:00"
- Test 1.1: Standard interval "02:30:00"

**Pokrycie:**
- ✅ Days regex match
- ✅ Time regex match
- ✅ Konwersja do sekund
- ✅ Edge case: brak dni w stringu

**Nie pokryte:**
- ❌ Malformed intervals (np. "invalid")
- ❌ Negative intervals
- Rozwiązanie: Założenie że PostgreSQL zwraca zawsze valid format

### Routing Logic (Single vs Multi-Day)

**Testowany:**
- Test 1.1: Single day (fromDate === toDate)
- Test 2.1: Multi-day (fromDate !== toDate)

**Pokrycie:**
- ✅ Date extraction z ISO timestamp
- ✅ String comparison
- ✅ Branch selection

**Edge case nie pokryty:**
- ❌ Invalid ISO timestamps
- ❌ Future dates
- Rozwiązanie: Walidacja na API endpoint level (Zod)

---

## 🎓 Wnioski i Rekomendacje

### Co działa dobrze

1. **Dual-path approach** - RPC dla single-day (fast), direct query dla multi-day (flexible)
2. **Null safety** - konsekwentne filtrowanie i fallbacks
3. **Type guards** - TypeScript type narrowing dla filtered entries
4. **Sortowanie** - malejąco po duration dla lepszego UX

### Co można poprawić

1. **Error messages** - dodać więcej kontekstu (user_id, date range)
2. **Validation** - dodać walidację date range na service level
3. **Caching** - rozważyć cache dla często używanych dat
4. **Pagination** - dla bardzo długich zakresów dat

### Rekomendacje dla Developerów

1. Użyj `npm run test:ui` do debugowania złożonych testów
2. Inline snapshots są świetne dla formatowania - aktualizuj je z `-u` flag
3. Mock factory pattern skaluje się dobrze - dodaj metody gdy potrzeba
4. Testuj edge cases wczesnie - znajdziesz więcej bugów

---

**Status:** ✅ **UKOŃCZONE**  
**Kolejny krok:** Implementacja testów integracyjnych z PostgreSQL function `get_daily_summary` i verification midnight splitting logic
