## 1. Lista tabel

### users

This table should be managed by Supbase Auth

- id: UUID PRIMARY KEY
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_password: VARCHAR(255) NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPTZ

### Typy pomocnicze
- task_status: ENUM('active', 'completed')

### tasks
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- name: VARCHAR(255) NOT NULL
- description: VARCHAR(5000)
- status: task_status NOT NULL DEFAULT 'active'
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()

### time_entries
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- task_id: UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
- user_id: UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- start_time: TIMESTAMPTZ NOT NULL
- end_time: TIMESTAMPTZ
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- CHECK (end_time IS NULL OR end_time > start_time)

### Widok i funkcja pomocnicza
- active_task_details (VIEW): łączy `tasks` z `time_entries` i zwraca wiersze z `end_time IS NULL`
- get_daily_summary(p_user_id uuid, p_date date, p_timezone_offset_minutes integer DEFAULT 0) RETURNS TABLE (task_id uuid, task_name varchar(255), total_duration interval): sumuje `COALESCE(end_time, now()) - start_time` dla danego lokalnego dnia użytkownika (z uwzględnieniem strefy czasowej), grupując po zadaniu i filtrując po `user_id`. Filtruje sesje, które rozpoczęły się lub zakończyły w danym lokalnym dniu.

## 2. Relacje między tabelami
- `auth.users` (Supabase) 1 => N `tasks` (więcej zadań na użytkownika) przez `user_id`.
- `tasks` 1 => N `time_entries` (wiele wpisów na zadanie) przez `task_id`.
- `time_entries` zawiera własne `user_id` w celu uproszczenia RLS i zapytań podsumowań, ale utrzymuje integralność dzięki `ON DELETE CASCADE` z `auth.users`.
- Relacja dla widoku `active_task_details` to wewnętrzne połączenie `tasks JOIN time_entries` z filtrem `end_time IS NULL`.

## 3. Indeksy

- Indeks na kolumnach `user_id` i `status` w tabeli `tasks`.
- Indeks na kolumnach `task_id` i `start_time` w tabeli `time_entries`.
- Indeks na kolumnie `user_id` w tabeli `time_entries` dla optymalizacji zapytań.
- Unikalny indeks na kolumnie `user_id` w tabeli `time_entries` dla aktywnych wpisów (gdzie `end_time` jest NULL). 

## 4. Zasady PostgreSQL (RLS)
- **RLS dla `tasks`**: `CREATE POLICY task_is_owner ON tasks USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`; RLS włączone (`ALTER TABLE tasks ENABLE ROW LEVEL SECURITY`).
- **RLS dla `time_entries`**: analogiczna polityka `using (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`; RLS włączone.
- Polityki obejmują `SELECT`, `INSERT`, `UPDATE` i `DELETE`
- Widok `active_task_details` dziedziczy dostępność poprzez RLS z podłączonych tabel i może być ograniczony do użytkownika, jeżeli w przyszłości dodamy `SECURITY INVOKER`.

## 5. Dodatkowe uwagi

- Użycie `timestamptz` dla wszystkich znaczników czasu jest zgodne z najlepszymi praktykami.
- Funkcja `get_daily_summary` upraszcza logikę po stronie klienta.
- Widok `active_task_details` pomaga w zarządzaniu aktywnymi zadaniami.
- Walidacja pojemności czasowej dnia (24h limit): Implementowana w warstwie aplikacji (nie w bazie danych). System zapobiega dodawaniu lub edycji wpisów czasowych, które spowodowałyby przekroczenie 24 godzin w jednym dniu lokalnym użytkownika. Walidacja uwzględnia strefę czasową użytkownika i jest wykonywana przed zapisem do bazy.