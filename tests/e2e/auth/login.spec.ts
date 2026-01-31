import { test, expect, testUsers, invalidInputs } from "../fixtures";
import { LoginPage } from "../page-objects/LoginPage";
import { DashboardPage } from "../page-objects/DashboardPage";

/**
 * Test Suite: Login Flow
 * Weryfikuje pełny przepływ logowania użytkownika, walidację formularza,
 * obsługę błędów oraz przekierowania.
 */

test.describe("Login Flow - Happy Path & Authorization", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to login page before each test
    await page.goto("/login");
  });

  test("should login successfully with valid credentials @smoke @critical", async ({ loginPage, page }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);

    // Assert
    await expect(page).toHaveURL("/");

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectUserEmail(testUsers.validUser.email);
    await loginPage.expectNoError();
  });

  test("should redirect authenticated user away from login page @authorization", async ({ authenticatedPage }) => {
    // Arrange - User is already authenticated via fixture

    // Act - Try to access login page
    await authenticatedPage.goto("/login");

    // Assert - Should be redirected to dashboard
    await expect(authenticatedPage).toHaveURL("/");
  });
});

test.describe("Login Flow - Form Validation", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display error for invalid email format @validation", async () => {
    // Arrange
    const invalidEmail = invalidInputs.invalidEmail.emails[0]; // "notanemail"

    // Act
    await loginPage.fillEmail(invalidEmail);
    await loginPage.fillPassword("ValidPassword123!");
    await loginPage.clickSubmit();

    // Assert
    await loginPage.expectErrorMessage("Nieprawidłowy format adresu email");
    expect(await loginPage.page.url()).toContain("/login");
  });

  test("should display error for email without @ symbol @validation", async () => {
    // Arrange
    const emailWithoutAt = "testexample.com";

    // Act
    await loginPage.fillEmail(emailWithoutAt);
    await loginPage.fillPassword("ValidPassword123!");
    await loginPage.clickSubmit();

    // Assert
    await loginPage.expectErrorMessage("Nieprawidłowy format adresu email");
  });

  test("should display error for missing domain in email @validation", async () => {
    // Arrange
    const emailWithoutDomain = invalidInputs.invalidEmail.emails[1]; // "missing@domain"

    // Act
    await loginPage.fillEmail(emailWithoutDomain);
    await loginPage.fillPassword("ValidPassword123!");
    await loginPage.clickSubmit();

    // Assert
    await loginPage.expectErrorMessage("Nieprawidłowy format adresu email");
  });

  test("should display error when both fields are empty @validation", async () => {
    // Arrange - Fields are already empty

    // Act
    await loginPage.clickSubmit();

    // Assert
    await loginPage.expectErrorMessage("Wszystkie pola są wymagane");
    expect(await loginPage.page.url()).toContain("/login");
  });

  test("should display error when only email is empty @validation", async () => {
    // Arrange
    await loginPage.fillPassword("ValidPassword123!");

    // Act
    await loginPage.clickSubmit();

    // Assert
    await loginPage.expectErrorMessage("Wszystkie pola są wymagane");
  });

  test("should display error when only password is empty @validation", async () => {
    // Arrange
    await loginPage.fillEmail(testUsers.validUser.email);

    // Act
    await loginPage.clickSubmit();

    // Assert
    await loginPage.expectErrorMessage("Wszystkie pola są wymagane");
  });
});

test.describe("Login Flow - Authentication Errors", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display error for invalid credentials @authentication", async () => {
    // Arrange
    const { email, password } = testUsers.invalidCredentials;

    // Act
    await loginPage.login(email, password);

    // Assert
    await expect(loginPage.errorMessage).toBeVisible();
    expect(await loginPage.page.url()).toContain("/login");

    // Email field should retain value
    expect(await loginPage.getEmailValue()).toBe(email);
  });

  test("should display error for unregistered user @authentication", async () => {
    // Arrange
    const { email, password } = testUsers.unregisteredUser;

    // Act
    await loginPage.login(email, password);

    // Assert
    await expect(loginPage.errorMessage).toBeVisible();
    expect(await loginPage.page.url()).toContain("/login");
  });
});

test.describe("Login Flow - Navigation", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should navigate to password recovery page @navigation", async ({ page }) => {
    // Act
    await loginPage.clickForgotPassword();

    // Assert
    await expect(page).toHaveURL("/password-recovery");
  });

  test("should navigate to registration page @navigation", async ({ page }) => {
    // Act
    await loginPage.clickRegister();

    // Assert
    await expect(page).toHaveURL("/register");
  });
});

test.describe("Login Flow - UI/UX States", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display loading state during login @ui", async () => {
    // Arrange
    await loginPage.fillEmail(testUsers.validUser.email);
    await loginPage.fillPassword(testUsers.validUser.password);

    // Act
    const submitPromise = loginPage.clickSubmit();

    // Assert - Check loading state immediately after click
    // Note: This might be flaky depending on API speed
    // In real scenario, consider using page.route() to delay response
    await expect(loginPage.submitButton).toBeDisabled();

    await submitPromise;
  });

  test("should disable form fields during login @ui", async () => {
    // Arrange
    await loginPage.fillEmail(testUsers.validUser.email);
    await loginPage.fillPassword(testUsers.validUser.password);

    // Act
    const submitPromise = loginPage.clickSubmit();

    // Assert - Fields should be disabled during loading
    await expect(loginPage.emailInput).toBeDisabled();
    await expect(loginPage.passwordInput).toBeDisabled();

    await submitPromise;
  });

  test("should display all form elements correctly @ui-rendering", async () => {
    // Act & Assert
    await loginPage.expectAllElementsVisible();

    // Verify specific text content
    await expect(loginPage.cardTitle).toHaveText("Logowanie");
    await expect(loginPage.cardDescription).toContainText("Wprowadź swoje dane, aby się zalogować");
  });

  test("should show submit button with correct text @ui", async () => {
    // Assert
    const buttonText = await loginPage.getSubmitButtonText();
    expect(buttonText).toBe("Zaloguj się");
  });
});

test.describe("Login Flow - Error Handling", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should handle network errors gracefully @error-handling", async ({ page }) => {
    // Arrange - Simulate network failure
    await page.route("**/api/auth/login", (route) => route.abort("failed"));

    // Act
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);

    // Assert
    await loginPage.expectErrorMessage("Wystąpił błąd połączenia. Spróbuj ponownie.");

    // Button should be enabled again after error
    expect(await loginPage.isSubmitButtonDisabled()).toBe(false);
  });

  test("should handle API errors with appropriate message @error-handling", async ({ page }) => {
    // Arrange - Simulate API error response
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Server error occurred" }),
      })
    );

    // Act
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);

    // Assert
    await expect(loginPage.errorMessage).toBeVisible();
    expect(await loginPage.page.url()).toContain("/login");
  });
});

test.describe("Login Flow - Responsive Design", () => {
  test("should display form correctly on mobile viewport @responsive", async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 375, height: 667 });
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Assert
    await loginPage.expectAllElementsVisible();
    await expect(loginPage.cardContainer).toBeVisible();

    // Check that form is within viewport (no horizontal scroll)
    const cardBox = await loginPage.cardContainer.boundingBox();
    expect(cardBox).not.toBeNull();
    if (cardBox) {
      expect(cardBox.width).toBeLessThanOrEqual(375);
    }
  });

  test("should be usable on tablet viewport @responsive", async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 768, height: 1024 });
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);

    // Assert
    await expect(page).toHaveURL("/");
  });
});

test.describe("Login Flow - Accessibility", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should support keyboard navigation @accessibility", async ({ page }) => {
    // Act - Navigate using Tab key
    await page.keyboard.press("Tab"); // Focus email
    expect(await loginPage.isEmailInputFocused()).toBe(true);

    await page.keyboard.type(testUsers.validUser.email);

    await page.keyboard.press("Tab"); // Focus password
    await page.keyboard.type(testUsers.validUser.password);

    await page.keyboard.press("Tab"); // Focus forgot password link
    await page.keyboard.press("Tab"); // Focus submit button

    // Assert - Submit with Enter
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/");
  });

  test("should submit form with Enter key in password field @accessibility", async ({ page }) => {
    // Arrange
    await loginPage.fillEmail(testUsers.validUser.email);
    await loginPage.fillPassword(testUsers.validUser.password);

    // Act
    await loginPage.submitWithEnter();

    // Assert
    await expect(page).toHaveURL("/");
  });

  test("should have visible focus indicators @accessibility", async ({ page }) => {
    // Act
    await loginPage.emailInput.focus();

    // Assert - Check that element is focused (browser handles visual indicator)
    expect(await loginPage.isEmailInputFocused()).toBe(true);
  });
});

test.describe("Login Flow - Security & Edge Cases", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should not display password in plain text @security", async () => {
    // Act
    await loginPage.fillPassword("SecretPassword123!");

    // Assert
    const passwordType = await loginPage.passwordInput.getAttribute("type");
    expect(passwordType).toBe("password");
  });

  test("should clear error message after successful input correction @edge-case", async () => {
    // Arrange - Trigger validation error first
    await loginPage.clickSubmit();
    await loginPage.expectErrorMessage("Wszystkie pola są wymagane");

    // Act - Fill form with valid data
    await loginPage.clearForm();
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);

    // Assert - Error should be gone and login successful
    await expect(loginPage.page).toHaveURL("/");
  });

  test("should handle rapid consecutive login attempts @edge-case", async () => {
    // Arrange
    await loginPage.fillEmail(testUsers.validUser.email);
    await loginPage.fillPassword(testUsers.validUser.password);

    // Act - Click submit multiple times rapidly
    const clicks = [
      loginPage.clickSubmit(),
      loginPage.submitButton.click().catch(() => {}),
      loginPage.submitButton.click().catch(() => {}),
    ];

    await Promise.all(clicks);

    // Assert - Should still work correctly (button disabled prevents multiple submits)
    await expect(loginPage.page).toHaveURL("/");
  });

  test("should preserve email field value after failed login @edge-case", async () => {
    // Arrange
    const email = testUsers.invalidCredentials.email;
    const password = testUsers.invalidCredentials.password;

    // Act
    await loginPage.login(email, password);

    // Assert
    await expect(loginPage.errorMessage).toBeVisible();
    expect(await loginPage.getEmailValue()).toBe(email);
    // Password should be cleared for security (or check based on actual behavior)
  });
});

test.describe("Login Flow - Integration with Dashboard", () => {
  test("should display user email in navigation after login @integration", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);

    // Assert
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectUserAuthenticated(testUsers.validUser.email);
    expect(await dashboardPage.isUserLoggedIn()).toBe(true);
  });

  test("should allow logout after successful login @integration", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);

    // Act
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.logout();

    // Assert
    await expect(page).toHaveURL("/login");
  });

  test("should maintain session after page refresh @integration", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);

    // Ensure login is complete and redirected to dashboard
    await expect(page).toHaveURL("/");

    // Act
    await page.reload();

    // Assert - Should still be on dashboard
    await expect(page).toHaveURL("/");

    const dashboardPage = new DashboardPage(page);
    expect(await dashboardPage.isUserLoggedIn()).toBe(true);
  });
});
