import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model dla strony logowania
 * Enkapsuluje wszystkie interakcje z formularzem logowania oraz walidację
 */
export class LoginPage {
  readonly page: Page;
  readonly url: string = "/login";

  // Selektory - używając data-test-id zgodnie z Playwright best practices
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly cardContainer: Locator;
  readonly cardTitle: Locator;
  readonly cardDescription: Locator;

  /**
   * Inicjalizuje Page Object z instancją Playwright Page
   * Przypisuje wszystkie lokatory elementów używając data-test-id
   */
  constructor(page: Page) {
    this.page = page;

    // Inicjalizacja lokatorów
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.getByTestId("login-error-message");
    this.forgotPasswordLink = page.getByTestId("login-forgot-password-link");
    this.registerLink = page.getByTestId("login-register-link");
    this.cardContainer = page.getByTestId("login-card");
    this.cardTitle = page.getByTestId("login-card-title");
    this.cardDescription = page.getByTestId("login-card-description");
  }

  /**
   * Czeka na pełną hydratację React komponentu LoginForm
   * KRYTYCZNE: Musi być wywołane przed jakąkolwiek interakcją
   * Rozwiązuje problem timeout'ów gdy React komponenty z client:load nie są jeszcze zhydratowane
   */
  async waitForHydration(): Promise<void> {
    // Czekaj na dołączenie kontenera karty do DOM
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await this.cardContainer.waitFor({ state: "visible", timeout: 5000 });

    // Dodatkowe czekanie na hydratację React
    await this.page.waitForLoadState("networkidle");

    // Czekaj na dostępność pól formularza z większym timeoutem
    await this.emailInput.waitFor({ state: "visible", timeout: 5000 });
    await this.passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await this.submitButton.waitFor({ state: "visible", timeout: 5000 });

    // Dodatkowe 500ms na pewność
    await this.page.waitForTimeout(500);
  }

  /**
   * Nawiguje do strony logowania
   * Czeka na pełne załadowanie strony oraz hydratację React komponentu
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.page.waitForLoadState("domcontentloaded");
    await this.waitForHydration();
  }

  /**
   * Wypełnia formularz logowania i wysyła go
   * Podstawowa metoda do logowania użytkownika
   * @param email - Adres email użytkownika
   * @param password - Hasło użytkownika
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  /**
   * Wypełnia pole email
   * Używana w testach walidacji
   * @param email - Adres email do wpisania
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Wypełnia pole hasła
   * Używana w testach walidacji
   * @param password - Hasło do wpisania
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Klika przycisk logowania
   * Używana do testowania stanu loading
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Klika link "Zapomniałeś hasła?"
   * Nawigacja do odzyskiwania hasła
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  /**
   * Klika link "Zarejestruj się"
   * Nawigacja do rejestracji
   */
  async clickRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Zwraca tekst komunikatu błędu
   * Używana w asercjach testowych
   * @returns Tekst błędu lub pusty string jeśli błąd nie jest widoczny
   */
  async getErrorMessage(): Promise<string> {
    if (await this.isErrorVisible()) {
      return (await this.errorMessage.textContent()) || "";
    }
    return "";
  }

  /**
   * Sprawdza, czy komunikat błędu jest widoczny
   * Używana w testach walidacji
   * @returns true jeśli komunikat błędu jest widoczny
   */
  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Sprawdza, czy przycisk submit jest wyłączony
   * Używana w testach stanu loading
   * @returns true jeśli przycisk jest wyłączony
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Zwraca tekst przycisku submit
   * Weryfikacja stanu "Logowanie..." vs "Zaloguj się"
   * @returns Tekst przycisku
   */
  async getSubmitButtonText(): Promise<string> {
    return (await this.submitButton.textContent()) || "";
  }

  /**
   * Czeka na przekierowanie do podanego URL
   * Używana po udanym logowaniu
   * @param url - Oczekiwany URL docelowy
   */
  async waitForRedirect(url: string): Promise<void> {
    await this.page.waitForURL(url);
  }

  /**
   * Sprawdza, czy cały formularz jest widoczny
   * Używana w testach renderowania
   * @returns true jeśli formularz jest widoczny
   */
  async isFormVisible(): Promise<boolean> {
    return await this.cardContainer.isVisible();
  }

  /**
   * Asercja sprawdzająca widoczność wszystkich elementów formularza
   * Helper do testów UI
   */
  async expectAllElementsVisible(): Promise<void> {
    await expect(this.cardContainer).toBeVisible();
    await expect(this.cardTitle).toBeVisible();
    await expect(this.cardDescription).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.forgotPasswordLink).toBeVisible();
    await expect(this.registerLink).toBeVisible();
  }

  /**
   * Asercja sprawdzająca treść komunikatu błędu
   * Helper do testów walidacji
   * @param expectedMessage - Oczekiwany komunikat błędu
   */
  async expectErrorMessage(expectedMessage: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expectedMessage);
  }

  /**
   * Asercja sprawdzająca brak komunikatu błędu
   * Helper do testów happy path
   */
  async expectNoError(): Promise<void> {
    await expect(this.errorMessage).not.toBeVisible();
  }

  /**
   * Sprawdza czy pole email ma focus
   * Używana w testach accessibility
   * @returns true jeśli pole ma focus
   */
  async isEmailInputFocused(): Promise<boolean> {
    return await this.emailInput.evaluate((el) => el === document.activeElement);
  }

  /**
   * Sprawdza wartość w polu email
   * Używana w testach walidacji
   * @returns Wartość pola email
   */
  async getEmailValue(): Promise<string> {
    return (await this.emailInput.inputValue()) || "";
  }

  /**
   * Sprawdza wartość w polu hasła
   * Używana w testach walidacji
   * @returns Wartość pola hasła
   */
  async getPasswordValue(): Promise<string> {
    return (await this.passwordInput.inputValue()) || "";
  }

  /**
   * Czyści pola formularza
   * Używana w testach z wieloma próbami logowania
   */
  async clearForm(): Promise<void> {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Wysyła formularz klawiszem Enter
   * Używana w testach accessibility
   */
  async submitWithEnter(): Promise<void> {
    await this.passwordInput.press("Enter");
  }
}
