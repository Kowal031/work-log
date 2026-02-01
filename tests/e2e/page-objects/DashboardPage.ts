import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model dla strony głównej (dashboard)
 * Używany do weryfikacji pomyślnego logowania oraz interakcji z nawigacją
 */
export class DashboardPage {
  readonly page: Page;
  readonly url: string = "/";

  // Navigation selectors - używając data-test-id
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

  /**
   * Inicjalizuje Page Object dla strony głównej
   * Przypisuje lokatory nawigacji (desktop i mobile)
   */
  constructor(page: Page) {
    this.page = page;

    // Desktop navigation
    this.navLogo = page.getByTestId("nav-logo");
    this.navDashboardLink = page.getByTestId("nav-dashboard-link");
    this.navSummariesLink = page.getByTestId("nav-summaries-link");
    this.navUserEmail = page.getByTestId("nav-user-email");
    this.navLogoutButton = page.getByTestId("nav-logout-button");
    this.navMobileMenuButton = page.getByTestId("nav-mobile-menu-button");

    // Mobile navigation
    this.mobileNavSheet = page.getByTestId("mobile-nav-sheet");
    this.mobileNavDashboardLink = page.getByTestId("mobile-nav-dashboard-link");
    this.mobileNavSummariesLink = page.getByTestId("mobile-nav-summaries-link");
    this.mobileNavUserEmail = page.getByTestId("mobile-nav-user-email");
    this.mobileNavLogoutButton = page.getByTestId("mobile-nav-logout-button");
  }

  /**
   * Czeka na pełną hydratację React komponentów nawigacji
   * Używana gdy komponenty używają client:load w Astro
   */
  async waitForHydration(): Promise<void> {
    // Czekaj na widoczność nawigacji
    await this.navLogo.waitFor({
      state: "visible",
      timeout: 10000,
    });

    // Czekaj na email użytkownika (kluczowy element po zalogowaniu)
    await this.navUserEmail.waitFor({ state: "visible" });

    // Upewnij się że wszystkie skrypty się załadowały
    await this.page.waitForLoadState("networkidle");

    // Dodatkowe 100ms na pewność
    await this.page.waitForTimeout(100);
  }

  /**
   * Nawiguje do strony głównej
   * Używana w testach bezpośredniego dostępu
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.page.waitForLoadState("domcontentloaded");
    await this.waitForHydration();
  }

  /**
   * Sprawdza, czy użytkownik jest zalogowany
   * Weryfikuje obecność email w nawigacji
   * @returns true jeśli użytkownik jest zalogowany
   */
  async isUserLoggedIn(): Promise<boolean> {
    try {
      await this.navUserEmail.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Zwraca email użytkownika wyświetlany w nawigacji
   * Używana w asercjach po logowaniu
   * @returns Email użytkownika lub pusty string
   */
  async getUserEmail(): Promise<string> {
    if (await this.navUserEmail.isVisible()) {
      const text = await this.navUserEmail.textContent();
      return text?.trim() || "";
    }
    return "";
  }

  /**
   * Klika przycisk wylogowania
   */
  async logout(): Promise<void> {
    await this.navLogoutButton.click();
  }

  /**
   * Asercja sprawdzająca poprawność wyświetlanego emaila
   * Helper do weryfikacji pomyślnego logowania
   * @param email - Oczekiwany email użytkownika
   */
  async expectUserEmail(email: string): Promise<void> {
    await expect(this.navUserEmail).toBeVisible();
    await expect(this.navUserEmail).toContainText(email);
  }

  /**
   * Sprawdza, czy użytkownik jest na stronie dashboard
   * Weryfikuje URL
   * @returns true jeśli URL to '/'
   */
  async isOnDashboard(): Promise<boolean> {
    return this.page.url().endsWith("/");
  }

  /**
   * Otwiera menu mobilne
   * Używana w testach responsywnych
   */
  async openMobileMenu(): Promise<void> {
    await this.navMobileMenuButton.click();
    await this.mobileNavSheet.waitFor({ state: "visible" });
  }

  /**
   * Sprawdza, czy menu mobilne jest otwarte
   * @returns true jeśli menu mobilne jest widoczne
   */
  async isMobileMenuOpen(): Promise<boolean> {
    return await this.mobileNavSheet.isVisible();
  }

  /**
   * Zwraca email użytkownika z menu mobilnego
   * Używana w testach mobilnych
   * @returns Email użytkownika z menu mobilnego
   */
  async getMobileUserEmail(): Promise<string> {
    if (await this.mobileNavUserEmail.isVisible()) {
      const text = await this.mobileNavUserEmail.textContent();
      return text?.trim() || "";
    }
    return "";
  }

  /**
   * Wylogowuje użytkownika przez menu mobilne
   * Używana w testach mobilnych
   */
  async logoutFromMobile(): Promise<void> {
    await this.openMobileMenu();
    await this.mobileNavLogoutButton.click();
    await this.page.waitForURL("/login");
  }

  /**
   * Klika link Dashboard w menu mobilnym
   * Używana w testach nawigacji mobilnej
   */
  async clickMobileDashboardLink(): Promise<void> {
    await this.mobileNavDashboardLink.click();
  }

  /**
   * Klika link Summaries w menu mobilnym
   * Używana w testach nawigacji mobilnej
   */
  async clickMobileSummariesLink(): Promise<void> {
    await this.mobileNavSummariesLink.click();
  }

  /**
   * Klika link Dashboard w nawigacji desktop
   * Używana w testach nawigacji
   */
  async clickDashboardLink(): Promise<void> {
    await this.navDashboardLink.click();
  }

  /**
   * Klika link Summaries w nawigacji desktop
   * Używana w testach nawigacji
   */
  async clickSummariesLink(): Promise<void> {
    await this.navSummariesLink.click();
  }

  /**
   * Klika logo WorkLog
   * Powinno przekierować na stronę główną
   */
  async clickLogo(): Promise<void> {
    await this.navLogo.click();
  }

  /**
   * Asercja sprawdzająca widoczność nawigacji desktop
   * Helper do testów UI
   */
  async expectDesktopNavVisible(): Promise<void> {
    await expect(this.navLogo).toBeVisible();
    await expect(this.navDashboardLink).toBeVisible();
    await expect(this.navSummariesLink).toBeVisible();
  }

  /**
   * Asercja sprawdzająca widoczność przycisku menu mobilnego
   * Helper do testów responsywnych
   */
  async expectMobileMenuButtonVisible(): Promise<void> {
    await expect(this.navMobileMenuButton).toBeVisible();
  }

  /**
   * Czeka na pełne załadowanie dashboard
   * Używana do zapewnienia stabilności testów
   */
  async waitForDashboardLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    await expect(this.navLogo).toBeVisible();
  }

  /**
   * Sprawdza, czy link Dashboard jest aktywny (ma odpowiednią klasę CSS)
   * Używana w testach stanu nawigacji
   * @returns true jeśli link jest aktywny
   */
  async isDashboardLinkActive(): Promise<boolean> {
    const classes = await this.navDashboardLink.getAttribute("class");
    return classes?.includes("text-foreground") || false;
  }

  /**
   * Sprawdza, czy link Summaries jest aktywny (ma odpowiednią klasę CSS)
   * Używana w testach stanu nawigacji
   * @returns true jeśli link jest aktywny
   */
  async isSummariesLinkActive(): Promise<boolean> {
    const classes = await this.navSummariesLink.getAttribute("class");
    return classes?.includes("text-foreground") || false;
  }

  /**
   * Asercja sprawdzająca, że użytkownik jest zalogowany i widzi swój email
   * Kompleksowa weryfikacja stanu zalogowania
   * @param email - Oczekiwany email użytkownika
   */
  async expectUserAuthenticated(email: string): Promise<void> {
    await this.waitForDashboardLoad();
    await this.expectUserEmail(email);
    expect(await this.isUserLoggedIn()).toBe(true);
  }
}
