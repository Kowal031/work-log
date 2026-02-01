# Migracja Row Level Security

## Opis migracji

Ta migracja włącza Row Level Security (RLS) dla tabel `tasks` i `time_entries` oraz dodaje kompleksowe polityki bezpieczeństwa dla wszystkich operacji CRUD.

### Pliki migracji
- `supabase/migrations/20260201061122_enable_rls_policies.sql`

### Zmiany bezpieczeństwa
- Włączenie RLS dla tabel `tasks` i `time_entries`
- Dodanie polityk RLS dla wszystkich operacji (SELECT, INSERT, UPDATE, DELETE)
- Polityki ograniczają dostęp do rekordów należących do uwierzytelnionego użytkownika (`user_id = auth.uid()`)

## Instrukcja wykonania migracji

### 1. Zainstaluj Supabase CLI (jeśli nie masz)
```bash
npm install -g supabase
```

### 2. Zaloguj się do Supabase
```bash
supabase login
```

### 3. Połącz z projektem
Przejdź do katalogu projektu i połącz z istniejącym projektem Supabase:
```bash
cd /path/to/your/project
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Zastosuj migrację
```bash
supabase db push
```

Alternatywnie, jeśli chcesz zastosować tylko tę migrację:
```bash
supabase migration up
```

### 5. Wygeneruj nowe typy TypeScript
Po zastosowaniu migracji, zaktualizuj typy bazy danych:
```bash
supabase gen types typescript --local > src/db/database.types.ts
```

## Ważne uwagi dotyczące bezpieczeństwa

- **Polityki RLS**: Migracja włącza Row Level Security i dodaje polityki, które zapewniają, że użytkownicy mogą tylko operować na swoich własnych danych (gdzie `user_id = auth.uid()`).
- **Role anon i authenticated**: Dodano osobne polityki dla obu ról Supabase, zgodnie z rekomendacjami.
- **Operacje CRUD**: Wszystkie operacje (SELECT, INSERT, UPDATE, DELETE) są chronione politykami RLS.
- **Backward compatibility**: Migracja nie zmienia istniejących danych, tylko dodaje warstwę bezpieczeństwa.

## Weryfikacja

Po zastosowaniu migracji, sprawdź w Supabase Dashboard > Database > Tables czy RLS jest włączone dla tabel `tasks` i `time_entries`, oraz czy polityki zostały utworzone.