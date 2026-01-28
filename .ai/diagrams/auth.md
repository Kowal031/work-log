<authentication_analysis>
1) Przepływy autentykacji:
- Rejestracja użytkownika (email+hasło) i utworzenie sesji
- Logowanie użytkownika (email+hasło) i ustawienie cookies sesji
- Wejście na chronioną stronę i weryfikacja sesji w middleware
- Callback z kodem (OAuth/magic link) i wymiana kodu na sesję
- Odświeżanie tokenu po wygaśnięciu access tokenu (z refresh tokenu)
- Wylogowanie i usunięcie cookies sesji
- Odzyskiwanie hasła (wysyłka maila resetującego)
- Aktualizacja hasła z tokenu resetu

2) Główni aktorzy i interakcje:
- Przegladarka: inicjuje nawigacje i żądania do API, trzyma cookies
- Middleware: na każdą prośbę o stronę sprawdza sesję i przekierowuje
- AstroAPI: obsługuje POST-y auth (register/login/logout/reset/update)
- SupabaseAuth: usługa uwierzytelniania (signUp/signIn/refresh/signOut)

3) Weryfikacja i odświeżanie tokenów:
- Middleware czyta cookies i weryfikuje sesję przez Supabase
- Gdy access token wygasł, próbuje odświeżyć z refresh tokenu
- Po sukcesie odświeżenia ustawia nowe cookies i kontynuuje
- Po porażce czyści cookies i przekierowuje na /login

4) Krótkie opisy kroków:
- Rejestracja: przeglądarka -> API register -> Supabase signUp -> cookies -> /
- Logowanie: przeglądarka -> API login -> Supabase signIn -> cookies -> /
- Ochrona stron: middleware weryfikuje sesję; brak -> /login
- Callback: middleware wymienia code na sesję, zapisuje cookies, -> /
- Odświeżanie: middleware widzi expired, odświeża, zapisuje cookies lub logout
- Wylogowanie: przeglądarka -> API logout -> Supabase signOut -> czyści cookies
- Reset hasła: przeglądarka -> API password-recovery -> mail wysłany
- Aktualizacja hasła: przeglądarka -> API update-password (z tokenem) -> OK
</authentication_analysis>

<mermaid_diagram>
```mermaid
%%{init: {"sequence": {"activateMessage": false}}}%%
sequenceDiagram
  autonumber
  participant Przegladarka
  participant Middleware
  participant AstroAPI
  participant SupabaseAuth

  Note over Przegladarka,Middleware: Wejście na stronę chronioną
  Przegladarka->>Middleware: GET / (strona chroniona)
  Middleware->>SupabaseAuth: Zweryfikuj sesję z cookies
  SupabaseAuth-->>Middleware: Sesja ważna lub błąd
  alt Sesja ważna
    Middleware-->>Przegladarka: 200 OK (render strony)
  else Brak lub nieważna
    Middleware-->>Przegladarka: 302 Redirect -> /login
  end

  Note over Przegladarka,AstroAPI: Rejestracja
  Przegladarka->>AstroAPI: POST /api/auth/register
  AstroAPI->>SupabaseAuth: signUp(email, hasło)
  par Wyślij mail weryfikacyjny
    SupabaseAuth-->>AstroAPI: Mail zaplanowany
  and Utwórz konto użytkownika
    SupabaseAuth-->>AstroAPI: Użytkownik utworzony
  end
  alt Rejestracja udana
    AstroAPI-->>Przegladarka: 200 + ustaw cookies sesji
    Przegladarka->>Middleware: GET /
    Middleware-->>Przegladarka: 200 OK (dashboard)
  else Rejestracja nieudana
    AstroAPI-->>Przegladarka: 409/400 z komunikatem
  end

  Note over Przegladarka,AstroAPI: Logowanie
  Przegladarka->>AstroAPI: POST /api/auth/login
  AstroAPI->>SupabaseAuth: signInWithPassword()
  SupabaseAuth-->>AstroAPI: user + session
  alt Logowanie udane
    AstroAPI-->>Przegladarka: 200 + set-cookie
    Przegladarka->>Middleware: GET /
    Middleware-->>Przegladarka: 200 OK (dashboard)
  else Błędne dane
    AstroAPI-->>Przegladarka: 401 Unauthorized
  end

  Note over Przegladarka,Middleware: Callback z kodem
  Przegladarka->>Middleware: GET /?code=...
  Middleware->>SupabaseAuth: exchangeCodeForSession(code)
  SupabaseAuth-->>Middleware: Sesja + cookies
  Middleware-->>Przegladarka: 302 Redirect -> /

  Note over Przegladarka,Middleware: Odświeżanie tokenu
  Przegladarka->>Middleware: GET /summaries
  Middleware->>SupabaseAuth: Sprawdź access token
  SupabaseAuth-->>Middleware: Token wygasł
  alt Dostępny refresh token
    Middleware->>SupabaseAuth: Refresh session()
    SupabaseAuth-->>Middleware: Nowe tokeny
    Middleware-->>Przegladarka: 200 OK (kontynuuj)
  else Brak/nieprawidłowy refresh
    Middleware-->>Przegladarka: 302 -> /login
  end

  Note over Przegladarka,AstroAPI: Wylogowanie
  Przegladarka->>AstroAPI: POST /api/auth/logout
  AstroAPI->>SupabaseAuth: signOut()
  SupabaseAuth-->>AstroAPI: OK
  AstroAPI-->>Przegladarka: 200 + usuń cookies
  Przegladarka->>Middleware: GET /login
  Middleware-->>Przegladarka: 200 OK (ekran logowania)

  Note over Przegladarka,AstroAPI: Odzyskiwanie hasła
  Przegladarka->>AstroAPI: POST /api/auth/password-recovery
  AstroAPI->>SupabaseAuth: resetPasswordForEmail(email)
  SupabaseAuth-->>AstroAPI: OK (mail wysłany)
  AstroAPI-->>Przegladarka: 200 (zawsze)

  Note over Przegladarka,AstroAPI: Aktualizacja hasła
  Przegladarka->>AstroAPI: POST /api/auth/update-password
  AstroAPI->>SupabaseAuth: updateUser(hasło, token)
  SupabaseAuth-->>AstroAPI: OK
  AstroAPI-->>Przegladarka: 200 -> /login
```
</mermaid_diagram>
