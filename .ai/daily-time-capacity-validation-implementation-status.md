# Status implementacji: Walidacja pojemności czasowej dnia (Daily Time Capacity Validation)

**Data:** 27 stycznia 2026  
**Status:** ✅ ZAIMPLEMENTOWANE

## Przegląd

Zaimplementowano kompletną walidację pojemności czasowej dnia, która zapobiega sytuacjom, w których użytkownik próbuje dodać więcej niż 24 godziny czasu w jednym dniu (w swojej strefie czasowej).

## Zaimplementowane komponenty

### 1. Backend - Walidacja ✅

**Plik:** `src/lib/errors/time-entry.errors.ts`
- ✅ Klasa `DailyCapacityExceededError` z polskimi komunikatami
- ✅ Przechowuje: dzień, wykorzystany czas, nowy czas, sumę, limit
- ✅ Metody formatujące czas w formacie HH:MM:SS

**Plik:** `src/lib/services/time-entry.service.ts`
- ✅ Funkcja `validateDailyTimeCapacity` - główna walidacja
- ✅ Funkcja `sumNewEntriesForDay` - helper do obliczania czasu dla dni
- ✅ Integracja w `createTimeEntry` (po splitowaniu, przed zapisem)
- ✅ Integracja w `updateTimeEntry` (z wykluczeniem edytowanego wpisu)

**Plik:** `src/types.ts`
- ✅ Dodano `timezone_offset?: number` do `UpdateTimeEntryCommand`
- ✅ Dodano `timezone_offset?: number` do `UpdateTimeEntryRequestDto`

**Plik:** `src/lib/validation/time-entry.validation.ts`
- ✅ Dodano opcjonalny `timezone_offset` do `updateTimeEntrySchema`

### 2. Backend - API Endpoints ✅

**Plik:** `src/pages/api/tasks/[taskId]/time-entries.ts`
- ✅ Import `DailyCapacityExceededError`
- ✅ Obsługa błędu w POST endpoint
- ✅ Zwraca 400 Bad Request z kodem `DailyCapacityExceeded`
- ✅ Szczegółowe informacje w `details` (day, existing_duration_formatted, new_duration_formatted, total_duration_formatted, limit)

**Plik:** `src/pages/api/tasks/[taskId]/time-entries/[timeEntryId].ts`
- ✅ Obsługa błędu w PATCH endpoint
- ✅ Przekazuje `timezone_offset` do serwisu
- ✅ Zwraca 400 Bad Request z kodem `DailyCapacityExceeded`

### 3. Frontend - Error Handling ✅

**Plik:** `src/lib/api/tasks.api.ts`
- ✅ Interface `ExtendedError` zamiast `any` (proper typing)
- ✅ Funkcja `createErrorFromResponse` zachowuje error code i details
- ✅ `createTimeEntry` akceptuje `timezone_offset`
- ✅ `updateTimeEntry` akceptuje `timezone_offset`

**Plik:** `src/components/summaries/AddTimeEntryModal.tsx`
- ✅ Wysyła `timezone_offset` w danych

**Plik:** `src/components/shared/EditSessionModal.tsx`
- ✅ Wysyła `timezone_offset` w danych

**Plik:** `src/components/summaries/EditTaskModalSummary.tsx`
- ✅ `handleAddNewSession` wykrywa i wyświetla błąd `DailyCapacityExceeded`
- ✅ `handleSaveSession` wykrywa i wyświetla błąd `DailyCapacityExceeded`
- ✅ Polskie komunikaty w toast (7 sekund)
- ✅ Szczegółowe informacje: dzień, wykorzystany czas, nowy czas, suma, limit

### 4. Dokumentacja ✅

**Zaktualizowane pliki:**
- ✅ `update-time-entry-endpoint-implementation-plan.md` - dodano `timezone_offset`, opisano błąd `DailyCapacityExceeded`
- ✅ `post-time-entry-endpoint-implementation-plan.md` - opisano błąd `DailyCapacityExceeded`
- ✅ `api-plan.md` - dodano sekcję o walidacji pojemności czasowej w Business Logic
- ✅ `daily-time-capacity-validation-plan.md` - oryginalny plan (pozostaje jako referencja)

## Kluczowe cechy

✅ **Walidacja przed zapisem do bazy** - Zapobiega zapisowi nieprawidłowych danych  
✅ **Timezone-aware** - Oblicza limity w lokalnej strefie czasowej użytkownika  
✅ **Obsługuje sesje wielodniowe** - Waliduje każdy dotknięty dzień osobno  
✅ **Wyklucza edytowany wpis** - Przy edycji nie liczy starej wersji  
✅ **Szczegółowe komunikaty błędów** - Pokazuje dzień, wykorzystany czas, nowy czas, sumę i limit  
✅ **User-friendly UI** - Polskie toasty z 7-sekundowym wyświetlaniem  
✅ **Proper TypeScript typing** - Brak użycia `any`, interfejs `ExtendedError`

## Algorytm walidacji

1. **Wyodrębnienie dni** - Identyfikuje wszystkie dni dotknięte przez nowe/edytowane wpisy (w strefie czasowej użytkownika)
2. **Dla każdego dnia:**
   - Pobiera istniejące zakończone wpisy dla tego dnia (z wykluczeniem edytowanego)
   - Oblicza łączny czas istniejących wpisów (w sekundach)
   - Oblicza czas nowych wpisów dla tego dnia (w sekundach)
   - Sprawdza czy suma nie przekracza 86400 sekund (24h)
3. **Jeśli suma > 24h:** Rzuca `DailyCapacityExceededError` z detalami
4. **Jeśli wszystkie dni OK:** Pozwala na zapis

## Przykładowe scenariusze

### ✅ Scenariusz 1: Sukces - dokładnie 24h
- Dzień 2026-01-25, istniejące: 2h
- Nowy wpis: 22h
- Suma: 2h + 22h = 24h ✓

### ❌ Scenariusz 2: Błąd - przekroczenie limitu
- Dzień 2026-01-25, istniejące: 12h
- Nowy wpis: 14h
- Suma: 12h + 14h = 26h > 24h ✗
- Błąd: `DailyCapacityExceeded` z komunikatem po polsku

### ✅ Scenariusz 3: Sesja wielodniowa
- Wpis: 24.05 23:00 → 26.05 01:00 (26h)
- Po splitowaniu:
  - 24.05: 1h
  - 25.05: 24h
  - 26.05: 1h
- Każdy dzień walidowany osobno

### ✅ Scenariusz 4: Edycja z wykluczeniem
- Dzień 2026-01-25
- Entry A (edytowany): 10:00-12:00 (2h)
- Entry B: 14:00-18:00 (4h)
- Edycja A na: 09:00-18:00 (9h)
- Walidacja: 4h (B) + 9h (nowy A) = 13h ✓
- Entry A (stary) jest wykluczony

## Testy zalecane

1. ✅ Dodaj 24h sesję do pustego dnia
2. ✅ Spróbuj dodać sesję przekraczającą 24h
3. ✅ Sesja wielodniowa mieszcząca się w limitach
4. ✅ Edytuj sesję żeby przekroczyć limit
5. ✅ Wiele małych sesji sumujących się do 24h
6. ✅ Aktywne timery nie są liczone

## Konfiguracja

Brak dodatkowej konfiguracji - funkcja działa out-of-the-box dla wszystkich użytkowników.

**Limit:** 86400 sekund (24:00:00) na dzień lokalny użytkownika

## Notatki implementacyjne

- **Performance:** Query do bazy jest zoptymalizowany - pobiera tylko wpisy dotykające konkretnych dni
- **Timezone handling:** Używa `timezone_offset` w minutach (np. 60 dla UTC+1)
- **Error propagation:** Błędy są prawidłowo propagowane przez wszystkie warstwy (service → API → frontend)
- **Type safety:** Pełna typizacja TypeScript bez użycia `any`
- **Lokalizacja:** Wszystkie komunikaty dla użytkownika końcowego w języku polskim
