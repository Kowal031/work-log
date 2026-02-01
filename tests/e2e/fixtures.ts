import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { DashboardPage } from "./page-objects/DashboardPage";

/**
 * Dane użytkowników testowych
 * Używane w testach logowania i autoryzacji
 */
export const testUsers = {
  validUser: {
    email: process.env.E2E_USERNAME || "test@op.pl",
    password: process.env.E2E_PASSWORD || "test",
  },

  invalidCredentials: {
    email: process.env.E2E_USERNAME || "test@op.pl",
    password: "WrongPassword123!",
  },

  unregisteredUser: {
    email: "notregistered@worklog.com",
    password: "Password123!",
  },
};

/**
 * Nieprawidłowe dane wejściowe dla testów walidacji
 */
export const invalidInputs = {
  invalidEmail: {
    emails: ["notanemail", "missing@domain", "@nodomain.com", "spaces in@email.com", "double@@email.com"],
  },

  emptyFields: {
    email: "",
    password: "",
  },

  weakPasswords: ["123", "short", "a"],
};

/**
 * Rozszerzenie typu fixtures dla TypeScript
 */
interface CustomFixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authenticatedPage: Page;
}

/**
 * Rozszerzone fixtures z custom Page Objects i authenticated page
 */
export const test = base.extend<CustomFixtures>({
  /**
   * Fixture zwracający instancję LoginPage
   * Automatycznie inicjalizuje Page Object dla strony logowania
   */
  loginPage: async ({ page }, fixtureUse) => {
    const loginPage = new LoginPage(page);
    await fixtureUse(loginPage);
  },

  /**
   * Fixture zwracający instancję DashboardPage
   * Automatycznie inicjalizuje Page Object dla strony głównej
   */
  dashboardPage: async ({ page }, fixtureUse) => {
    const dashboardPage = new DashboardPage(page);
    await fixtureUse(dashboardPage);
  },

  /**
   * Fixture dla zalogowanego użytkownika
   * Automatycznie loguje użytkownika testowego i przekierowuje na dashboard
   * Używany w testach wymagających authenticated state
   */
  authenticatedPage: async ({ page }, fixtureUse) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(); // To już czeka na hydratację

    // Logowanie
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);

    // Czekaj na przekierowanie
    await page.waitForURL("/", { timeout: 10000 });

    // Czekaj na załadowanie dashboard
    await page.waitForLoadState("networkidle");

    // Czekaj na hydratację komponentów dashboard
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForHydration();

    await fixtureUse(page);
  },
});

export { expect } from "@playwright/test";
