# Plan naprawy kompatybilności dat i stref czasowych

## 1. Diagnoza problemu

### 1.1 Obecny stan
- **Baza danych:** Wszystkie timestampy zapisane w UTC ✓
- **Backend splitting:** Dzieli sesje według lokalnej strefy czasowej użytkownika (timezone_offset) ✓
- **Problem:** PostgreSQL funkcja `get_daily_summary` filtruje według UTC dnia, nie lokalnego dnia użytkownika ❌
- **Problem:** Frontend nie wie że sesje zostały podzielone i pokazuje nieprawidłowe dane ❌

### 1.2 Przykład problemu
**Użytkownik w Polsce (UTC+1):**
- Wybiera w UI: 26.01.2026 23:00 → 27.01.2026 05:00
- Frontend wysyła: `26.01 22:00 UTC → 27.01 04:00 UTC` + `timezone_offset: 60`
- Backend dzieli: 
  - Sesja 1: `26.01 22:00 UTC → 26.01 22:59:59 UTC` (= 26.01 23:00-23:59:59 CET)
  - Sesja 2: `26.01 23:00 UTC → 27.01 04:00 UTC` (= 27.01 00:00-05:00 CET)

**Problem w Summary:**
- Użytkownik przełącza na 27.01
- Frontend wysyła: `GET /api/summary/daily?date=2026-01-27`
- PostgreSQL funkcja filtruje: `WHERE DATE(start_time) = '2026-01-27'` (UTC!)
- Znajduje tylko sesję 2, bo sesja 1 ma start_time w UTC dniu 26.01 ❌

**Problem w Dashboard:**
- Dashboard pokazuje "2 sesje" zamiast "1 sesja (podzielona)" ❌
- Użytkownik nie rozumie dlaczego ma 2 wpisy dla jednej pracy

## 2. Wymagania biznesowe

### 2.1 Splitowanie sesji
**Reguła:** Każda sesja przekraczająca północ w lokalnej strefie czasowej użytkownika musi być podzielona na osobne wpisy dla każdego dnia.

**Przykład 1 (2 dni):**
- Input: 26.01 23:00 → 27.01 05:00 (6h)
- Output:
  - Sesja 1: 26.01 23:00 → 26.01 23:59:59.999 (1h)
  - Sesja 2: 27.01 00:00 → 27.01 05:00 (5h)

**Przykład 2 (3 dni):**
- Input: 24.01 23:00 → 26.01 05:00 (30h)
- Output:
  - Sesja 1: 24.01 23:00 → 24.01 23:59:59.999 (1h)
  - Sesja 2: 25.01 00:00 → 25.01 23:59:59.999 (24h)
  - Sesja 3: 26.01 00:00 → 26.01 05:00 (5h)

### 2.2 Wyświetlanie dat
- **Wszystkie daty w UI:** Zawsze w lokalnej strefie czasowej użytkownika
- **Wszystkie daty w API requests/responses:** UTC (ISO 8601)
- **Konwersja:** Frontend odpowiedzialny za konwersję UTC ↔ lokalna strefa

## 3. Komponenty do naprawy

### 3.1 Backend - PostgreSQL funkcja get_daily_summary

**Plik:** `supabase/migrations/20260124100000_init_schema.sql`

**Problem:**
```sql
WHERE DATE(start_time) = date_param
```
Filtruje według UTC dnia, nie lokalnego dnia użytkownika.

**Rozwiązanie:**
Dodać parametr `timezone_offset_minutes INTEGER` do funkcji i filtrować według lokalnego dnia:
```sql
CREATE OR REPLACE FUNCTION get_daily_summary(
  user_id_param UUID,
  date_param DATE,
  timezone_offset_minutes INTEGER DEFAULT 0
)
...
WHERE 
  (start_time AT TIME ZONE 'UTC' + (timezone_offset_minutes || ' minutes')::INTERVAL)::DATE = date_param
  OR (end_time AT TIME ZONE 'UTC' + (timezone_offset_minutes || ' minutes')::INTERVAL)::DATE = date_param
```

To znajdzie wszystkie sesje które **rozpoczęły się** lub **zakończyły się** w danym lokalnym dniu.

### 3.2 Backend - API endpoint GET /api/summary/daily

**Plik:** `src/pages/api/summary/daily.ts`

**Zmiany:**
1. Dodać query parameter `timezone_offset` (wymagany)
2. Walidacja: `-720 <= timezone_offset <= 840`
3. Przekazać do funkcji PostgreSQL:
```typescript
const { data, error } = await supabase.rpc('get_daily_summary', {
  user_id_param: user.id,
  date_param: dateString,
  timezone_offset_minutes: timezoneOffset
});
```

### 3.3 Backend - Time entry service

**Plik:** `src/lib/services/time-entry.service.ts`

**Status:** ✅ Już naprawione - dzieli według lokalnej strefy czasowej użytkownika

**Weryfikacja:** Upewnić się że logika działa poprawnie:
- Konwertuje UTC → lokalny czas (dodaje offset)
- Znajduje koniec lokalnego dnia (23:59:59.999)
- Konwertuje z powrotem lokalny → UTC (odejmuje offset)
- Dzieli sesję jeśli przekracza midnight

### 3.4 Frontend - API client

**Plik:** `src/lib/api/summary.api.ts`

**Zmiany:**
1. Dodać `timezone_offset` do query:
```typescript
export async function getDailySummary(date: Date): Promise<DailySummaryResponseDto> {
  const dateString = format(date, 'yyyy-MM-dd');
  const timezoneOffset = -date.getTimezoneOffset(); // Negatywny offset
  
  const url = new URL('/api/summary/daily', window.location.origin);
  url.searchParams.set('date', dateString);
  url.searchParams.set('timezone_offset', timezoneOffset.toString());
  
  const response = await fetch(url.toString());
  // ...
}
```

### 3.5 Frontend - useDailySummary hook

**Plik:** `src/components/summaries/hooks/useDailySummary.ts`

**Status:** Prawdopodobnie już używa `getDailySummary(selectedDate)` więc automatycznie zadziała po naprawie API client ✓

**Weryfikacja:** Sprawdzić czy nie ma hardcoded timezone logic

### 3.6 Frontend - Dashboard komponenty

**Problem:** Dashboard pokazuje "2 sesje" dla podzielonej sesji

**Możliwe rozwiązania:**

**Opcja A (Proste):** Dodać informację o podzielonych sesjach
- W modalu sesji: pokazać badge "Sesja podzielona (2/2)" lub podobne
- W summary: grupować podzielone sesje wizualnie

**Opcja B (Złożone):** Backend grupuje podzielone sesje
- Dodać pole `session_group_id` do tabeli `time_entries`
- Przy splitowaniu, wszystkie chunki dostają ten sam `session_group_id`
- Frontend grupuje według `session_group_id`

**Rekomendacja:** Opcja A - prostsza i wystarczająca dla MVP

### 3.7 Frontend - Komponenty wyświetlające daty

**Pliki do sprawdzenia:**
1. `src/components/dashboard/task/SessionHistoryList.tsx` ✅ Używa `toLocaleTimeString`, `toLocaleDateString` - poprawne
2. `src/components/shared/EditSessionModal.tsx` ✅ Używa lokalnych metod `getHours()`, `getMinutes()` - poprawne
3. `src/components/summaries/SummaryTaskItem.tsx` - sprawdzić
4. `src/components/summaries/SummaryHeroCard.tsx` - sprawdzić

**Zasada:** Wszystkie komponenty muszą używać:
- `new Date(utcString)` - automatycznie konwertuje UTC na lokalną strefę
- `.toLocaleTimeString('pl-PL', {...})` - wyświetla w lokalnej strefie
- `.toLocaleDateString('pl-PL', {...})` - wyświetla w lokalnej strefie
- `getHours()`, `getMinutes()`, `getDate()` - operują na lokalnej strefie

**NIE używać:**
- `getUTCHours()`, `getUTCMinutes()`, `getUTCDate()` - to są UTC metody

## 4. Walidacja i typy

### 4.1 Nowe typy

**Plik:** `src/types.ts`

**Zmiany:** Już dodane ✓
```typescript
export interface CreateTimeEntryRequestDto {
  start_time: string;
  end_time: string;
  timezone_offset: number; // Minutes offset from UTC (e.g., -60 for UTC+1)
}
```

### 4.2 Walidacja

**Plik:** `src/lib/validation/time-entry.validation.ts`

**Status:** Już dodane ✓
```typescript
export const createTimeEntrySchema = z.object({
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  timezone_offset: z.number().int().min(-720).max(840),
});
```

### 4.3 Dodatkowa walidacja dla summary

**Plik:** Nowy - `src/lib/validation/summary.validation.ts`

```typescript
import { z } from "zod";

export const getDailySummarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  timezone_offset: z.coerce.number().int().min(-720).max(840),
});
```

## 5. Plan implementacji

### Faza 1: Backend - PostgreSQL funkcja (PRIORYTET 1)
1. ✅ Przeczytać obecną funkcję `get_daily_summary`
2. ✅ Dodać parametr `timezone_offset_minutes`
3. ✅ Zmienić logikę filtrowania na lokalny dzień
4. ✅ Przetestować z różnymi timezone offsets
5. ✅ Zmienić migrację SQL

### Faza 2: Backend - API endpoint (PRIORYTET 1)
1. ✅ Dodać walidację schema dla summary
2. ✅ Dodać `timezone_offset` query param
3. ✅ Przekazać do funkcji PostgreSQL
4. ✅ Przetestować endpoint

### Faza 3: Frontend - API client (PRIORYTET 2)
1. ✅ Zaktualizować `getDailySummary` aby wysyłała timezone_offset
2. ✅ Przetestować z różnymi datami
3. ✅ Sprawdzić czy hook automatycznie zadziała

### Faza 4: Frontend - Weryfikacja komponentów (PRIORYTET 2)
1. ✅ Sprawdzić wszystkie komponenty wyświetlające daty
2. ✅ Upewnić się że używają lokalnych metod, nie UTC
3. ✅ Dodać testy dla edge cases (midnight, DST)

### Faza 5: UX - Informacja o podzielonych sesjach (PRIORYTET 3)
1. ⏳ Dodać badge "Sesja podzielona" w modal sesji
2. ⏳ Zaktualizować komunikat w toast po dodaniu wielodniowej sesji
3. ⏳ Dodać tooltip wyjaśniający splitowanie

### Faza 6: Testy end-to-end (PRIORYTET 3)
1. ⏳ Test: Dodanie sesji 26.01 23:00 → 27.01 05:00 w Polsce
2. ⏳ Test: Sprawdzenie summary dla 26.01 (powinno pokazać 1h)
3. ⏳ Test: Sprawdzenie summary dla 27.01 (powinno pokazać 5h)
4. ⏳ Test: Sprawdzenie modala sesji (powinno pokazać 2 wpisy)
5. ⏳ Test: Dodanie sesji przez 3 dni (24.01 23:00 → 26.01 05:00)
6. ⏳ Test: Różne strefy czasowe (UTC+1, UTC-5, UTC+9)

## 6. Edge cases i uwagi

### 6.1 DST (Daylight Saving Time)
- JavaScript automatycznie obsługuje DST w `getTimezoneOffset()`
- Podczas przejścia DST offset może się zmienić (np. UTC+1 → UTC+2)
- Backend musi używać offsetu z momentu startu sesji

### 6.2 Sesje rozpoczęte przed midnight, zakończone po midnight
- ✅ Już obsłużone przez logikę splitowania
- Sesja 1: do 23:59:59.999 w dniu rozpoczęcia
- Sesja 2: od 00:00:00.000 w dniu następnym

### 6.3 Bardzo długie sesje (>7 dni)
- Logika splitowania działa dla dowolnej liczby dni
- While loop kontynuuje dopóki `currentStart < end`

### 6.4 Sesje dokładnie o północy
- Start: 26.01 00:00:00 → nie wymaga splitowania
- End: 27.01 00:00:00 → splitowane na 2 dni (26.01 pełny dzień + 27.01 0 sekund)

### 6.5 Różne strefy czasowe użytkowników
- Każdy użytkownik wysyła swój własny `timezone_offset`
- Backend używa tego offsetu do splitowania i filtrowania
- Użytkownik z Tokio (UTC+9) widzi inne podziały niż użytkownik z NYC (UTC-5)

## 7. Komunikacja z użytkownikiem

### 7.1 Toast notifications
**Po dodaniu wielodniowej sesji:**
```
Sukces
Sesja została podzielona na 3 wpisy (3 dni)
```

### 7.2 Tooltip/Help text
**Przy "+ Dodaj czas":**
```
Sesje dłuższe niż 1 dzień zostaną automatycznie podzielone 
o północy dla każdego dnia osobno.
```

### 7.3 Badge w modal sesji
**Jeśli sesja jest częścią podzielonej:**
```
[Badge: Sesja podzielona (1/2)]
26.01.2026 23:00 - 23:59:59
```

## 8. Dokumentacja do aktualizacji

### 8.1 api-plan.md
- Zaktualizować POST /api/tasks/{taskId}/time-entries
- Dodać informację o timezone_offset w request body
- Dodać informację o automatycznym splitowaniu
- Zaktualizować GET /api/summary/daily
- Dodać timezone_offset do query parameters

### 8.2 post-time-entry-endpoint-implementation-plan.md
- Dodać sekcję o timezone handling
- Dodać przykłady z różnymi strefami czasowymi
- Dodać informację o splitowaniu sesji

### 8.3 get-daily-summary-endpoint-implementation-plan.md
- Dodać timezone_offset parameter
- Wyjaśnić logikę filtrowania według lokalnego dnia
- Dodać przykłady dla różnych stref czasowych

## 9. Podsumowanie zmian

### Backend
1. ✅ `time-entry.service.ts` - logika splitowania (już zrobione)
2. ✅ `20260124100000_init_schema.sql` - funkcja get_daily_summary + timezone_offset
3. ✅ `daily.ts` - endpoint + timezone_offset query param
4. ✅ `summary.validation.ts` - walidacja dla getDailySummary

### Frontend
1. ✅ `summary.api.ts` - dodać timezone_offset do getDailySummary
2. ✅ `useDailySummary.ts` - automatycznie zadziała (już używa API)
3. ✅ Weryfikacja komponentów wyświetlających daty
4. ⏳ UX improvements (badges, tooltips, messages)

### Dokumentacja
1. ⏳ Zaktualizować api-plan.md
2. ⏳ Zaktualizować implementation plans
3. ⏳ Dodać przykłady użycia z timezone

## 10. Kryteria akceptacji

✅ **CA-1:** Użytkownik w Polsce dodaje sesję 26.01 23:00 → 27.01 05:00
- Backend dzieli na 2 wpisy (26.01 23:00-23:59:59, 27.01 00:00-05:00)
- Summary 26.01 pokazuje 1h
- Summary 27.01 pokazuje 5h
- Modal sesji pokazuje 2 wpisy z badge "Sesja podzielona"

✅ **CA-2:** Użytkownik w Nowym Jorku (UTC-5) dodaje tę samą sesję
- Sesje są splitowane według czasu lokalnego NYC, nie Polski
- Summary działa poprawnie dla strefy NYC

✅ **CA-3:** Użytkownik dodaje bardzo długą sesję (30h)
- Backend dzieli na 3 wpisy zgodnie z przykładem
- Każdy dzień ma poprawne wpisy w summary

✅ **CA-4:** Wszystkie daty w UI wyświetlają się w lokalnej strefie użytkownika
- SessionHistoryList pokazuje poprawne czasy
- EditSessionModal pokazuje poprawne czasy w inputach
- Summary pokazuje poprawne daty i czasy

✅ **CA-5:** Nie ma błędów timezone dla sesji rozpoczętych przed/po midnight
- Edge cases obsłużone poprawnie
- Walidacja działa dla wszystkich przypadków
