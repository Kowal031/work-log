import { test, expect } from "./fixtures";

test.describe("Example E2E Test", () => {
  test("should load the login page", async ({ page }) => {
    await page.goto("/login");
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");
    
    // Check if we're on the login page
    await expect(page).toHaveURL(/.*login/);
    
    // Check for expected elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});
