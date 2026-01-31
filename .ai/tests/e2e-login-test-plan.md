# Test Plan E2E - Scenariusz Logowania Użytkownika

## Przegląd

Plan testów E2E dla pełnego przepływu logowania użytkownika w aplikacji WorkLog. Testy weryfikują funkcjonalność formularza logowania, walidację danych, obsługę błędów oraz przekierowania po udanym logowaniu.

## Struktura Plików

```
tests/
├── e2e/
│   ├── fixtures.ts                    # Rozszerzone fixtures z użytkownikami testowymi
│   ├── auth/
│   │   └── login.spec.ts              # Testy scenariusza logowania
│   └── page-objects/
│       ├── LoginPage.ts               # Page Object dla strony logowania
│       └── DashboardPage.ts           # Page Object dla strony głównej
└── README.md
```

## Komponenty i Elementy `data-testid`

### LoginForm.tsx

| Element | data-testid | Opis |
|---------|--------------|------|
| Email Input | `login-email-input` | Pole tekstowe dla adresu email |
| Password Input | `login-password-input` | Pole hasła |
| Submit Button | `login-submit-button` | Przycisk logowania |
| Error Message | `login-error-message` | Komunikat błędu walidacji/logowania |
| Forgot Password Link | `login-forgot-password-link` | Link do odzyskiwania hasła |
| Register Link | `login-register-link` | Link do rejestracji |
| Card Container | `login-card` | Kontener karty logowania |
| Card Title | `login-card-title` | Nagłówek formularza |
| Card Description | `login-card-description` | Opis formularza |

### Layout.astro

| Element | data-testid | Opis |
|---------|--------------|------|
| Main Content | `main-content` | Główna zawartość strony |

### TopNavigationBar.tsx

| Element | data-testid | Opis |
|---------|--------------|------|
| Logo Link | `nav-logo` | Logo aplikacji (WorkLog) |
| Dashboard Link | `nav-dashboard-link` | Link do pulpitu |
| Summaries Link | `nav-summaries-link` | Link do podsumowań |
| User Email Display | `nav-user-email` | Wyświetlany email użytkownika |
| Logout Button | `nav-logout-button` | Przycisk wylogowania |
| Mobile Menu Button | `nav-mobile-menu-button` | Przycisk menu mobilnego |

### MobileNav.tsx

| Element | data-testid | Opis |
|---------|--------------|------|
| Mobile Sheet | `mobile-nav-sheet` | Kontener nawigacji mobilnej |
| Dashboard Link Mobile | `mobile-nav-dashboard-link` | Link do pulpitu (mobile) |
| Summaries Link Mobile | `mobile-nav-summaries-link` | Link do podsumowań (mobile) |
| User Email Mobile | `mobile-nav-user-email` | Email użytkownika (mobile) |
| Logout Button Mobile | `mobile-nav-logout-button` | Przycisk wylogowania (mobile) |

## Fixtures Testowe

### Dostępni Użytkownicy Testowi

```typescript
// tests/e2e/fixtures.ts

export const testUsers = {
  validUser: {
    email: "test@op.pl",
    password: "test",
  },
  
  invalidCredentials: {
    email: "test@op.pl",
    password: "WrongPassword123!",
  },
  
  unregisteredUser: {
    email: "notregistered@worklog.com",
    password: "Password123!",
  },
};

export const invalidInputs = {
  invalidEmail: {
    emails: [
      "notanemail",
      "missing@domain",
      "@nodomain.com",
      "spaces in@email.com",
      "double@@email.com",
    ],
  },
  
  emptyFields: {
    email: "",
    password: "",
  },
  
  weakPasswords: [
    "123",
    "short",
    "a",
  ],
};
```

### Custom Fixtures

```typescript
// Fixture dla zalogowanego użytkownika
authenticatedPage: async ({ page }, use) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Logowanie
  await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);

  // Czekaj na przekierowanie
  await page.waitForURL("/", { timeout: 10000 });

  // Czekaj na załadowanie dashboard
  await page.waitForLoadState("networkidle");

  // Czekaj na hydratację komponentów dashboard
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.waitForHydration();

  await use(page);
}

// Fixture dla niezalogowanego użytkownika na stronie logowania
loginPage: async ({ page }, use) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await use(loginPage);
}

// Fixture dla strony dashboard
dashboardPage: async ({ page }, use) => {
  const dashboardPage = new DashboardPage(page);
  await use(dashboardPage);
}
```

## Scenariusze Testowe

### 1. Pomyślne Logowanie (Happy Path)

**Priorytet:** Wysoki  
**Kategoria:** Smoke Test

**Kroki:**
1. Przejdź do strony `/login`
2. Sprawdź, czy formularz jest widoczny
3. Wprowadź poprawny email
4. Wprowadź poprawne hasło
5. Kliknij przycisk "Zaloguj się"
6. Oczekuj przekierowania na `/`
7. Sprawdź, czy nawigacja wyświetla email użytkownika

**Oczekiwany Rezultat:**
- Użytkownik jest przekierowany na stronę główną
- Nawigacja wyświetla email użytkownika
- Brak komunikatów błędu

---

### 2. Przekierowanie Zalogowanego Użytkownika

**Priorytet:** Średni  
**Kategoria:** Authorization

**Kroki:**
1. Zaloguj się jako użytkownik testowy
2. Spróbuj przejść bezpośrednio do `/login`
3. Sprawdź przekierowanie

**Oczekiwany Rezultat:**
- Użytkownik jest automatycznie przekierowany na `/`
- Nie ma dostępu do strony logowania gdy jest zalogowany

---

### 3. Walidacja - Nieprawidłowy Format Email

**Priorytet:** Wysoki  
**Kategoria:** Validation

**Kroki:**
1. Przejdź do strony `/login`
2. Wprowadź nieprawidłowy format email (np. "notanemail")
3. Wprowadź poprawne hasło
4. Kliknij przycisk "Zaloguj się"
5. Sprawdź komunikat błędu

**Oczekiwany Rezultat:**
- Wyświetla się komunikat: "Nieprawidłowy format adresu email"
- Nie następuje przekierowanie
- Formularz pozostaje na stronie

**Warianty testowe:**
- Email bez @
- Email bez domeny
- Email ze spacjami
- Email z podwójnym @

---

### 4. Walidacja - Puste Pola

**Priorytet:** Wysoki  
**Kategoria:** Validation

**Kroki:**
1. Przejdź do strony `/login`
2. Pozostaw email pusty
3. Pozostaw hasło puste
4. Kliknij przycisk "Zaloguj się"
5. Sprawdź komunikat błędu

**Oczekiwany Rezultat:**
- Wyświetla się komunikat: "Wszystkie pola są wymagane"
- Nie następuje przekierowanie

**Warianty testowe:**
- Tylko email pusty
- Tylko hasło puste
- Oba pola puste

---

### 5. Nieprawidłowe Dane Logowania

**Priorytet:** Wysoki  
**Kategoria:** Authentication

**Kroki:**
1. Przejdź do strony `/login`
2. Wprowadź prawidłowy format email (niezarejestrowanego użytkownika)
3. Wprowadź hasło
4. Kliknij przycisk "Zaloguj się"
5. Sprawdź komunikat błędu od serwera

**Oczekiwany Rezultat:**
- Wyświetla się komunikat błędu autoryzacji
- Nie następuje przekierowanie
- Pola formularza pozostają wypełnione (email)

---

### 6. Link do Odzyskiwania Hasła

**Priorytet:** Średni  
**Kategoria:** Navigation

**Kroki:**
1. Przejdź do strony `/login`
2. Kliknij link "Zapomniałeś hasła?"
3. Sprawdź przekierowanie

**Oczekiwany Rezultat:**
- Użytkownik jest przekierowany na `/password-recovery`
- Strona odzyskiwania hasła jest widoczna

---

### 7. Link do Rejestracji

**Priorytet:** Średni  
**Kategoria:** Navigation

**Kroki:**
1. Przejdź do strony `/login`
2. Kliknij link "Zarejestruj się"
3. Sprawdź przekierowanie

**Oczekiwany Rezultat:**
- Użytkownik jest przekierowany na `/register`
- Strona rejestracji jest widoczna

---

### 8. Stan Loading podczas Logowania

**Priorytet:** Niski  
**Kategoria:** UI/UX

**Kroki:**
1. Przejdź do strony `/login`
2. Wprowadź prawidłowe dane
3. Kliknij przycisk "Zaloguj się"
4. Sprawdź stan przycisku przed zakończeniem żądania

**Oczekiwany Rezultat:**
- Przycisk wyświetla tekst "Logowanie..."
- Przycisk jest wyłączony podczas ładowania
- Pola formularza są wyłączone podczas ładowania

---

### 9. Obsługa Błędu Połączenia

**Priorytet:** Średni  
**Kategoria:** Error Handling

**Kroki:**
1. Symuluj brak połączenia z API
2. Przejdź do strony `/login`
3. Wprowadź prawidłowe dane
4. Kliknij przycisk "Zaloguj się"
5. Sprawdź komunikat błędu

**Oczekiwany Rezultat:**
- Wyświetla się komunikat: "Wystąpił błąd połączenia. Spróbuj ponownie."
- Przycisk wraca do stanu aktywnego

---

### 10. Widoczność Elementów Formularza

**Priorytet:** Wysoki  
**Kategoria:** UI Rendering

**Kroki:**
1. Przejdź do strony `/login`
2. Sprawdź obecność wszystkich elementów

**Oczekiwany Rezultat:**
- Tytuł "Logowanie" jest widoczny
- Opis "Wprowadź swoje dane, aby się zalogować" jest widoczny
- Pole email jest widoczne z labelką "Email"
- Pole hasło jest widoczne z labelką "Hasło"
- Przycisk "Zaloguj się" jest widoczny
- Link "Zapomniałeś hasła?" jest widoczny
- Link "Zarejestruj się" jest widoczny
- Nawigacja jest ukryta (showNav={false})

---

### 11. Responsywność - Widok Mobilny

**Priorytet:** Średni  
**Kategoria:** Responsive

**Kroki:**
1. Ustaw viewport na urządzenie mobilne (375x667)
2. Przejdź do strony `/login`
3. Sprawdź layout formularza

**Oczekiwany Rezultat:**
- Formularz jest czytelny i użyteczny na mobile
- Padding jest odpowiedni (px-4)
- Karta formularza ma maksymalną szerokość (max-w-md)
- Wszystkie elementy są dostępne bez scrollowania poziomego

---

### 12. Accessibility - Nawigacja Klawiaturą

**Priorytet:** Średni  
**Kategoria:** Accessibility

**Kroki:**
1. Przejdź do strony `/login`
2. Użyj klawisza Tab do nawigacji między polami
3. Wypełnij formularz używając tylko klawiatury
4. Zatwierdź formularz klawiszem Enter

**Oczekiwany Rezultat:**
- Kolejność tabulacji jest logiczna (email → hasło → link "Zapomniałeś hasła?" → przycisk → link "Zarejestruj się")
- Wszystkie interaktywne elementy są dostępne z klawiatury
- Focus jest widoczny na aktywnym elemencie
- Formularz można wysłać klawiszem Enter

---

### 13. Obsługa Szybkich Kolejnych Prób Logowania

**Priorytet:** Niski  
**Kategoria:** Edge Case

**Kroki:**
1. Przejdź do strony `/login`
2. Wprowadź nieprawidłowe dane logowania
3. Kliknij przycisk "Zaloguj się" wielokrotnie w krótkim czasie
4. Sprawdź zachowanie aplikacji

**Oczekiwany Rezultat:**
- Aplikacja obsługuje wielokrotne próby bez awarii
- Nie następuje przekierowanie
- Komunikaty błędów są stabilne

---

### 14. Zachowanie Wartości Pola Email po Nieudanym Logowaniu

**Priorytet:** Niski  
**Kategoria:** Edge Case

**Kroki:**
1. Przejdź do strony `/login`
2. Wprowadź nieprawidłowy email
3. Wprowadź hasło
4. Kliknij przycisk "Zaloguj się"
5. Sprawdź wartość pola email po błędzie

**Oczekiwany Rezultat:**
- Wartość pola email pozostaje wprowadzona
- Użytkownik nie musi ponownie wpisywać emaila

---

### 15. Czyszczenie Komunikatu Błędu po Poprawie

**Priorytet:** Niski  
**Kategoria:** Edge Case

**Kroki:**
1. Przejdź do strony `/login`
2. Wprowadź nieprawidłowe dane (np. pusty email)
3. Kliknij przycisk "Zaloguj się"
4. Popraw dane (wprowadź prawidłowy email)
5. Sprawdź komunikat błędu

**Oczekiwany Rezultat:**
- Komunikat błędu znika po poprawie danych
- Formularz pozwala na ponowne wysłanie

---

### 16. Bezpieczeństwo - Ukrywanie Hasła

**Priorytet:** Wysoki  
**Kategoria:** Security

**Kroki:**
1. Przejdź do strony `/login`
2. Wprowadź hasło
3. Sprawdź typ pola hasła

**Oczekiwany Rezultat:**
- Hasło jest ukryte (type="password")
- Nie jest widoczne w postaci zwykłego tekstu

---

### 17. Utrzymanie Sesji po Odświeżeniu Strony

**Priorytet:** Średni  
**Kategoria:** Integration

**Kroki:**
1. Zaloguj się jako użytkownik testowy
2. Odśwież stronę dashboard
3. Sprawdź, czy użytkownik nadal jest zalogowany

**Oczekiwany Rezultat:**
- Sesja jest utrzymana po odświeżeniu
- Użytkownik nie jest przekierowany na stronę logowania
- Email użytkownika jest nadal widoczny w nawigacji

## Page Object Model

### LoginPage

**Lokalizacja:** `tests/e2e/page-objects/LoginPage.ts`

**Opis:**  
Page Object reprezentujący stronę logowania. Enkapsuluje wszystkie interakcje z formularzem logowania oraz metodach walidacji.

#### Właściwości

```typescript
class LoginPage {
  readonly page: Page;
  readonly url: string = '/login';
  
  // Selektory - używając data-testid
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly cardContainer: Locator;
  readonly cardTitle: Locator;
  readonly cardDescription: Locator;
}
```

#### Metody

**`constructor(page: Page)`**
- Inicjalizuje Page Object z instancją Playwright Page
- Przypisuje wszystkie lokatory elementów używając data-testid

**`async waitForHydration(): Promise<void>`**
- Czeka na pełną hydratację React komponentu LoginForm
- Rozwiązuje problem timeout'ów gdy komponenty z client:load nie są jeszcze zhydratowane

**`async goto(): Promise<void>`**
- Nawiguje do strony logowania (`/login`)
- Czeka na pełne załadowanie strony oraz hydratację React komponentu

**`async login(email: string, password: string): Promise<void>`**
- Wypełnia formularz logowania podanymi danymi
- Klika przycisk submit
- Podstawowa metoda do logowania

**`async fillEmail(email: string): Promise<void>`**
- Wypełnia pole email
- Używana w testach walidacji

**`async fillPassword(password: string): Promise<void>`**
- Wypełnia pole hasła
- Używana w testach walidacji

**`async clickSubmit(): Promise<void>`**
- Klika przycisk logowania
- Używana do testowania stanu loading

**`async clickForgotPassword(): Promise<void>`**
- Klika link "Zapomniałeś hasła?"
- Nawigacja do odzyskiwania hasła

**`async clickRegister(): Promise<void>`**
- Klika link "Zarejestruj się"
- Nawigacja do rejestracji

**`async getErrorMessage(): Promise<string>`**
- Zwraca tekst komunikatu błędu
- Używana w asercjach testowych

**`async isErrorVisible(): Promise<boolean>`**
- Sprawdza, czy komunikat błędu jest widoczny
- Używana w testach walidacji

**`async isSubmitButtonDisabled(): Promise<boolean>`**
- Sprawdza, czy przycisk submit jest wyłączony
- Używana w testach stanu loading

**`async getSubmitButtonText(): Promise<string>`**
- Zwraca tekst przycisku submit
- Weryfikacja stanu "Logowanie..." vs "Zaloguj się"

**`async waitForRedirect(url: string): Promise<void>`**
- Czeka na przekierowanie do podanego URL
- Używana po udanym logowaniu

**`async isFormVisible(): Promise<boolean>`**
- Sprawdza, czy cały formularz jest widoczny
- Używana w testach renderowania

**`async expectAllElementsVisible(): Promise<void>`**
- Asercja sprawdzająca widoczność wszystkich elementów formularza
- Helper do testów UI

**`async expectErrorMessage(expectedMessage: string): Promise<void>`**
- Asercja sprawdzająca treść komunikatu błędu
- Helper do testów walidacji

**`async expectNoError(): Promise<void>`**
- Asercja sprawdzająca brak komunikatu błędu
- Helper do testów happy path

**`async isEmailInputFocused(): Promise<boolean>`**
- Sprawdza czy pole email ma focus
- Używana w testach accessibility

**`async getEmailValue(): Promise<string>`**
- Sprawdza wartość w polu email
- Używana w testach walidacji

---

### DashboardPage

**Lokalizacja:** `tests/e2e/page-objects/DashboardPage.ts`

**Opis:**  
Page Object reprezentujący stronę główną (dashboard). Używany do weryfikacji pomyślnego logowania oraz interakcji z nawigacją.

#### Właściwości

```typescript
class DashboardPage {
  readonly page: Page;
  readonly url: string = '/';
  
  // Navigation selectors - używając data-testid
  readonly navLogo: Locator;
  readonly navDashboardLink: Locator;
  readonly navSummariesLink: Locator;
  readonly navUserEmail: Locator;
  readonly navLogoutButton: Locator;
  readonly navMobileMenuButton: Locator;
  
  // Mobile navigation selectors
  readonly mobileNavSheet: Locator;
  readonly mobileNavDashboardLink: Locator;
  readonly mobileNavSummariesLink: Locator;
  readonly mobileNavUserEmail: Locator;
  readonly mobileNavLogoutButton: Locator;
}
```

#### Metody

**`constructor(page: Page)`**
- Inicjalizuje Page Object dla strony głównej
- Przypisuje lokatory nawigacji (desktop i mobile)

**`async waitForHydration(): Promise<void>`**
- Czeka na pełną hydratację React komponentów nawigacji
- Używana gdy komponenty używają client:load w Astro

**`async goto(): Promise<void>`**
- Nawiguje do strony głównej (`/`)
- Używana w testach bezpośredniego dostępu

**`async isUserLoggedIn(): Promise<boolean>`**
- Sprawdza, czy użytkownik jest zalogowany
- Weryfikuje obecność email w nawigacji

**`async getUserEmail(): Promise<string>`**
- Zwraca email użytkownika wyświetlany w nawigacji
- Używana w asercjach po logowaniu

**`async logout(): Promise<void>`**
- Klika przycisk wylogowania
- Czeka na przekierowanie do `/login`

**`async expectUserEmail(email: string): Promise<void>`**
- Asercja sprawdzająca poprawność wyświetlanego emaila
- Helper do weryfikacji pomyślnego logowania

**`async isOnDashboard(): Promise<boolean>`**
- Sprawdza, czy użytkownik jest na stronie dashboard
- Weryfikuje URL

**`async openMobileMenu(): Promise<void>`**
- Otwiera menu mobilne
- Używana w testach responsywnych

**`async isMobileMenuOpen(): Promise<boolean>`**
- Sprawdza, czy menu mobilne jest otwarte

**`async getMobileUserEmail(): Promise<string>`**
- Zwraca email użytkownika z menu mobilnego
- Używana w testach mobilnych

**`async logoutFromMobile(): Promise<void>`**
- Wylogowuje użytkownika przez menu mobilne
- Używana w testach mobilnych

**`async clickMobileDashboardLink(): Promise<void>`**
- Klika link Dashboard w menu mobilnym

**`async clickMobileSummariesLink(): Promise<void>`**
- Klika link Summaries w menu mobilnym

**`async clickDashboardLink(): Promise<void>`**
- Klika link Dashboard w nawigacji desktop

**`async clickSummariesLink(): Promise<void>`**
- Klika link Summaries w nawigacji desktop

**`async clickLogo(): Promise<void>`**
- Klika logo WorkLog
- Powinno przekierować na stronę główną

**`async expectDesktopNavVisible(): Promise<void>`**
- Asercja sprawdzająca widoczność nawigacji desktop

**`async expectMobileMenuButtonVisible(): Promise<void>`**
- Asercja sprawdzająca widoczność przycisku menu mobilnego

**`async waitForDashboardLoad(): Promise<void>`**
- Czeka na pełne załadowanie dashboard
- Używana do zapewnienia stabilności testów

**`async isDashboardLinkActive(): Promise<boolean>`**
- Sprawdza, czy link Dashboard jest aktywny (ma odpowiednią klasę CSS)

**`async expectUserEmail(email: string): Promise<void>`**
- Asercja sprawdzająca poprawność wyświetlanego emaila
- Helper do weryfikacji pomyślnego logowania

**`async isOnDashboard(): Promise<boolean>`**
- Sprawdza, czy użytkownik jest na stronie dashboard
- Weryfikuje URL

**`async openMobileMenu(): Promise<void>`**
- Otwiera menu mobilne
- Używana w testach responsywnych

## Uruchamianie Testów

### Środowisko Testowe

#### Wymagania

- Node.js 18+
- Playwright zainstalowany (`npm install @playwright/test`)
- Przeglądarka Chromium zainstalowana (`npx playwright install chromium`)

#### Zmienne Środowiskowe

Utworzenie pliku `.env.test` w głównym katalogu projektu:

```env
# Base URL aplikacji testowej
BASE_URL=http://localhost:3000

# Supabase Test Configuration
SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_PUBLIC_KEY=your-test-anon-key

# Test Database
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres

# Optional: CI Configuration
CI=false
```

### Komendy

#### Uruchomienie wszystkich testów E2E

```bash
npm run test:e2e
```

#### Uruchomienie testów w trybie UI (interaktywny)

```bash
npx playwright test --ui
```

#### Uruchomienie konkretnego pliku testowego

```bash
npx playwright test tests/e2e/auth/login.spec.ts
```

#### Uruchomienie testów w trybie headed (widoczna przeglądarka)

```bash
npx playwright test --headed
```

#### Uruchomienie testów w trybie debug

```bash
npx playwright test --debug
```

#### Generowanie raportu HTML

```bash
npx playwright show-report
```

#### Uruchomienie testów z konkretnym tagiem

```bash
npx playwright test --grep "@smoke"
```
## Best Practices

### 1. Arrange-Act-Assert Pattern

Każdy test powinien mieć jasną strukturę:

```typescript
test('should login successfully', async ({ loginPage, page }) => {
  // Arrange - przygotowanie stanu
  await loginPage.goto();
  
  // Act - wykonanie akcji
  await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);
  
  // Assert - weryfikacja rezultatu
  await expect(page).toHaveURL('/');
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.expectUserEmail(testUsers.validUser.email);
});
```

### 2. Używanie Page Object Model

Preferuj Page Objects zamiast bezpośrednich interakcji z selektorami:

✅ **Dobrze:**
```typescript
await loginPage.login(email, password);
await loginPage.expectErrorMessage('Nieprawidłowy format adresu email');
```

❌ **Źle:**
```typescript
await page.fill('[data-testid="login-email-input"]', email);
await page.fill('[data-testid="login-password-input"]', password);
await page.click('[data-testid="login-submit-button"]');
```

### 3. Page Object Model

Enkapsuluj logikę interakcji w Page Objects:

✅ **Dobrze:**
```typescript
await loginPage.login(email, password);
await loginPage.expectErrorMessage('Nieprawidłowy format adresu email');
```

❌ **Źle:**
```typescript
await page.fill('[data-testid="login-email-input"]', email);
await page.fill('[data-testid="login-password-input"]', password);
await page.click('[data-testid="login-submit-button"]');
```

### 4. Używanie Fixtures

Używaj fixtures dla powtarzalnych setupów:

```typescript
test('should show user dashboard', async ({ authenticatedPage }) => {
  // authenticatedPage jest już zalogowana
  await expect(authenticatedPage).toHaveURL('/');
});
```

### 3. Używanie data-testid

W Page Objects preferuj `data-testid` dla lokalizacji elementów:

✅ **Dobrze (w Page Object):**
```typescript
this.emailInput = page.getByTestId('login-email-input');
```

❌ **Źle:**
```typescript
this.emailInput = page.locator('input[type="email"]');
```

### 6. Opisowe Nazwy Testów

Nazwy powinny jasno opisywać cel testu:

✅ **Dobrze:**
```typescript
test('should display error message when email format is invalid', async ({ page }) => {
```

❌ **Źle:**
```typescript
test('test login', async ({ page }) => {
```

### 7. Grupowanie Testów

Używaj `test.describe()` do grupowania:

```typescript
test.describe('Login Form Validation', () => {
  test('should require email field', async ({ page }) => { });
  test('should require password field', async ({ page }) => { });
  test('should validate email format', async ({ page }) => { });
});
```

### 8. Czekanie na Stan

Używaj właściwych metod czekania:

```typescript
// Czekaj na URL
await page.waitForURL('/dashboard');

// Czekaj na element
await page.waitForSelector('[data-testid="user-profile"]');

// Czekaj na response
await page.waitForResponse(resp => resp.url().includes('/api/auth/login'));
```

### 9. Obsługa Błędów

Testuj zarówno happy paths jak i error cases:

```typescript
test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => { });
  test('should display validation errors', async ({ page }) => { });
  test('should handle API errors', async ({ page }) => { });
});
```

### 10. Tagi dla Testów

Używaj tagów do kategoryzacji:

```typescript
test('should login successfully @smoke @critical', async ({ page }) => {
  // Critical smoke test
});

test('should validate email format @validation', async ({ page }) => {
  // Validation test
});
```

### 11. Visual Regression (Opcjonalnie)

Dla krytycznych widoków:

```typescript
test('should render login form correctly', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveScreenshot('login-form.png');
});
```

### 12. Trace Viewer

W przypadku błędów, używaj trace viewer:

```bash
npx playwright show-trace trace.zip
```

Trace jest automatycznie zbierany przy `trace: 'on-first-retry'`.

## Maintenance

### Aktualizacja Testów

- Aktualizuj `data-testid` gdy zmieniają się komponenty
- Aktualizuj fixtures gdy zmieniają się dane testowe
- Aktualizuj Page Objects gdy zmienia się struktura strony

### Code Review Checklist

- [ ] Testy używają Page Object Model
- [ ] Wszystkie selektory używają `data-testid`
- [ ] Testy są niezależne i mogą być uruchomione równolegle
- [ ] Testy mają opisowe nazwy
- [ ] Testy używają Arrange-Act-Assert pattern
- [ ] Testy są szybkie (unikaj niepotrzebnych czekań)
- [ ] Testy sprawdzają zarówno happy paths jak i edge cases
- [ ] Asercje są konkretne i znaczące

## Podsumowanie

Ten test plan zapewnia kompleksowe pokrycie scenariusza logowania, od podstawowej funkcjonalności przez walidację po obsługę błędów i integrację z dashboard. Implementacja testów w #file:login.spec.ts oraz Page Objects w #file:LoginPage.ts i #file:DashboardPage.ts jest w pełni zgodna z tym planem.

**Kluczowe cechy pokrycia:**
- ✅ Pełny happy path logowania z walidacją i przekierowaniem
- ✅ Obsługa błędów autoryzacji i walidacji formularza
- ✅ Testy responsywności i dostępności
- ✅ Integracja z nawigacją i utrzymanie sesji
- ✅ Bezpieczeństwo (ukrywanie hasła, obsługa błędów)
- ✅ Edge cases (szybkie próby, czyszczenie błędów)
