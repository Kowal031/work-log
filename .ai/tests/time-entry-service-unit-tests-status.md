# Status Testów Jednostkowych: time-entry.service.ts

## Przegląd

Testy jednostkowe dla modułu `src/lib/services/time-entry.service.ts` obejmują podstawowe operacje zarządzania czasem pracy w aplikacji WorkLog. Implementacja wykorzystuje Vitest, mocki Supabase oraz wzorce testowe zgodne z najlepszymi praktykami.

**Uwaga:** Aktualnie testowane są tylko funkcje związane z timerem (`hasActiveTimer`, `getActiveTimer`, `startTimeEntry`, `stopTimeEntry`). Pozostałe funkcje serwisu (`createTimeEntry`, `updateTimeEntry`) nie posiadają testów jednostkowych.

**Plik testowy:** `src/lib/services/time-entry.service.test.ts`  
**Data implementacji:** 2026-01-29  
**Pokrycie kodu:** ~40% (tylko funkcje timera, brak testów dla ręcznego tworzenia/edycji wpisów)  
**Framework:** Vitest + TypeScript  
**Mock Strategy:** Factory Pattern dla Supabase Client

---

## ✅ Zrealizowane Testy

### 1. Funkcja `hasActiveTimer()` - 3 testy

#### ✅ Test 1.1: Zwrócenie true gdy zadanie ma aktywny timer
**Scenariusz:** Zadanie ma niezakończony wpis czasowy (end_time IS NULL)  
**Weryfikacja:**
- Query: `SELECT id FROM time_entries WHERE task_id = ? AND end_time IS NULL`
- Zwrócenie `true` gdy znaleziono aktywny timer
- Poprawne wywołanie `supabase.from("time_entries")`

**Arrange:**
```typescript
taskId = "task-123"
mockData = { id: "entry-1" }
```

**Assert:**
```typescript
result === true
supabase.from.calledWith("time_entries")
```

#### ✅ Test 1.2: Zwrócenie false gdy zadanie nie ma aktywnego timera
**Scenariusz:** Brak aktywnego timera dla zadania  
**Weryfikacja:**
- Obsługa błędu PGRST116 (no rows returned)
- Zwrócenie `false` zamiast rzucania błędu

**Arrange:**
```typescript
taskId = "task-123"
mockError = { code: "PGRST116" }
```

**Assert:**
```typescript
result === false
```

#### ✅ Test 1.3: Rzucenie błędu przy niepowodzeniu query
**Scenariusz:** Błąd bazy danych inny niż PGRST116  
**Weryfikacja:**
- Propagacja błędu z odpowiednim komunikatem
- Format: "Failed to check active timer: {message}"

**Arrange:**
```typescript
taskId = "task-123"
mockError = { code: "OTHER_ERROR", message: "Query failed" }
```

**Assert:**
```typescript
expect().rejects.toThrow("Failed to check active timer: Query failed")
```

### 2. Funkcja `getActiveTimer()` - 3 testy

#### ✅ Test 2.1: Zwrócenie aktywnego timera gdy użytkownik go ma
**Scenariusz:** Użytkownik ma jeden aktywny timer  
**Weryfikacja:**
- Query: `SELECT id, task_id, start_time FROM time_entries WHERE user_id = ? AND end_time IS NULL`
- Zwrócenie obiektu z danymi timera

**Arrange:**
```typescript
userId = "user-123"
mockTimer = { id: "entry-1", task_id: "task-1", start_time: "2026-01-29T10:00:00Z" }
```

**Assert:**
```typescript
result === mockTimer
```

#### ✅ Test 2.2: Zwrócenie null gdy użytkownik nie ma aktywnego timera
**Scenariusz:** Brak aktywnego timera dla użytkownika  
**Weryfikacja:**
- Obsługa błędu PGRST116
- Zwrócenie `null` zamiast rzucania błędu

**Arrange:**
```typescript
userId = "user-123"
mockError = { code: "PGRST116" }
```

**Assert:**
```typescript
result === null
```

#### ✅ Test 2.3: Rzucenie błędu przy niepowodzeniu query
**Scenariusz:** Błąd bazy danych inny niż PGRST116  
**Weryfikacja:**
- Propagacja błędu z komunikatem "Failed to get active timer: {message}"

**Arrange:**
```typescript
userId = "user-123"
mockError = { code: "OTHER_ERROR", message: "Query failed" }
```

**Assert:**
```typescript
expect().rejects.toThrow("Failed to get active timer: Query failed")
```

### 3. Funkcja `startTimeEntry()` - 3 testy

#### ✅ Test 3.1: Pomyślne uruchomienie nowego timera
**Scenariusz:** Użytkownik uruchamia timer dla zadania  
**Weryfikacja:**
- Insert: `INSERT INTO time_entries (user_id, task_id, start_time, end_time) VALUES (?, ?, ?, NULL)`
- Select z pojedynczym wynikiem
- Zwrócenie TimeEntryResponseDto

**Arrange:**
```typescript
command = {
  user_id: "user-123",
  task_id: "task-1",
  start_time: "2026-01-29T10:00:00Z"
}
mockResponse = {
  id: "entry-1",
  task_id: "task-1",
  start_time: "2026-01-29T10:00:00Z",
  end_time: null
}
```

**Assert:**
```typescript
result === mockResponse
supabase.from.calledWith("time_entries")
```

#### ✅ Test 3.2: Rzucenie błędu przy niepowodzeniu insert
**Scenariusz:** Błąd podczas wstawiania rekordu  
**Weryfikacja:**
- Propagacja błędu z komunikatem "Failed to start time entry: {message}"

**Arrange:**
```typescript
command = { user_id: "user-123", task_id: "task-1", start_time: "2026-01-29T10:00:00Z" }
mockError = { message: "Insertion failed" }
```

**Assert:**
```typescript
expect().rejects.toThrow("Failed to start time entry: Insertion failed")
```

#### ✅ Test 3.3: Rzucenie błędu gdy nie zwrócono danych
**Scenariusz:** Insert się powiódł ale nie zwrócił danych  
**Weryfikacja:**
- Sprawdzenie czy `data` nie jest null/undefined
- Rzucenie błędu "No data returned from time entry creation"

**Arrange:**
```typescript
command = { user_id: "user-123", task_id: "task-1", start_time: "2026-01-29T10:00:00Z" }
mockResult = { data: null, error: null }
```

**Assert:**
```typescript
expect().rejects.toThrow("No data returned from time entry creation")
```

### 4. Funkcja `stopTimeEntry()` - 4 testy

#### ✅ Test 4.1: Pomyślne zatrzymanie aktywnego timera
**Scenariusz:** Użytkownik zatrzymuje aktywny timer  
**Weryfikacja:**
- Pobranie aktualnego wpisu (start_time)
- Walidacja dziennej pojemności (validateDailyTimeCapacity)
- Update: `UPDATE time_entries SET end_time = ? WHERE id = ? AND user_id = ? AND end_time IS NULL`
- Zwrócenie zaktualizowanego TimeEntryResponseDto

**Arrange:**
```typescript
command = {
  user_id: "user-123",
  time_entry_id: "entry-1",
  end_time: "2026-01-29T12:00:00Z",
  timezone_offset: 60
}
mockCurrentEntry = { start_time: "2026-01-29T10:00:00Z" }
mockUpdatedEntry = {
  id: "entry-1",
  task_id: "task-1",
  start_time: "2026-01-29T10:00:00Z",
  end_time: "2026-01-29T12:00:00Z"
}
```

**Assert:**
```typescript
result === mockUpdatedEntry
```

#### ✅ Test 4.2: Rzucenie TIME_ENTRY_NOT_FOUND gdy wpis nie istnieje
**Scenariusz:** Próba zatrzymania nieistniejącego wpisu  
**Weryfikacja:**
- PGRST116 przy fetchu aktualnego wpisu
- Dodatkowe sprawdzenie czy wpis istnieje
- Rzucenie błędu "TIME_ENTRY_NOT_FOUND"

**Arrange:**
```typescript
command = { user_id: "user-123", time_entry_id: "entry-1", end_time: "2026-01-29T12:00:00Z", timezone_offset: 60 }
mockFetchError = { code: "PGRST116" }
mockCheckResult = { data: null, error: { code: "PGRST116" } }
```

**Assert:**
```typescript
expect().rejects.toThrow("TIME_ENTRY_NOT_FOUND")
```

#### ✅ Test 4.3: Rzucenie TIME_ENTRY_ALREADY_STOPPED gdy wpis już zatrzymany
**Scenariusz:** Próba zatrzymania już zatrzymanego timera  
**Weryfikacja:**
- PGRST116 przy fetchu (bo end_time IS NULL nie pasuje)
- Sprawdzenie pokazuje że wpis istnieje i ma end_time
- Rzucenie błędu "TIME_ENTRY_ALREADY_STOPPED"

**Arrange:**
```typescript
command = { user_id: "user-123", time_entry_id: "entry-1", end_time: "2026-01-29T12:00:00Z", timezone_offset: 60 }
mockFetchError = { code: "PGRST116" }
mockCheckResult = { data: { id: "entry-1", end_time: "2026-01-29T11:00:00Z" }, error: null }
```

**Assert:**
```typescript
expect().rejects.toThrow("TIME_ENTRY_ALREADY_STOPPED")
```

#### ✅ Test 4.4: Rzucenie błędu przy niepowodzeniu update
**Scenariusz:** Błąd podczas aktualizacji wpisu  
**Weryfikacja:**
- Walidacja pojemności się powodzi
- Update fails z błędem
- Rzucenie błędu "Failed to stop time entry: {message}"

**Arrange:**
```typescript
command = { user_id: "user-123", time_entry_id: "entry-1", end_time: "2026-01-29T12:00:00Z", timezone_offset: 60 }
mockCurrentEntry = { start_time: "2026-01-29T10:00:00Z" }
mockUpdateError = { message: "Update failed" }
```

**Assert:**
```typescript
expect().rejects.toThrow("Failed to stop time entry: Update failed")
```
---

## 📊 Statystyki Pokrycia

| Funkcja | Testy | Pokrycie | Status |
|---------|-------|----------|--------|
| `hasActiveTimer` | 3/3 | 100% | ✅ |
| `getActiveTimer` | 3/3 | 100% | ✅ |
| `startTimeEntry` | 3/3 | 100% | ✅ |
| `stopTimeEntry` | 4/4 | 100% | ✅ |
| `createTimeEntry` | 0/? | 0% | ❌ |
| `updateTimeEntry` | 0/? | 0% | ❌ |
| `validateDailyTimeCapacity` | 0/? | 0% | ❌ |
| Funkcje pomocnicze | 0/? | 0% | ❌ |

**Razem:** 13 testów zrealizowanych.

---

## 🔧 Rekomendacje

1. **Dodanie testów dla `createTimeEntry`** - szczególnie scenariusze z podziałem na dni
2. **Dodanie testów dla `updateTimeEntry`** - walidacja i ochrona przed konfliktami
3. **Testy integracyjne** dla `validateDailyTimeCapacity` z rzeczywistą logiką biznesową
4. **Testy edge case** dla walidacji 24h i obsługi błędów
5. **Mockowanie złożonych scenariuszy** z wieloma istniejącymi wpisami
