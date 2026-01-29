import { test as base } from "@playwright/test";

// Extend base test with custom fixtures if needed
export const test = base.extend({
  // Example: authenticated page fixture
  // authenticatedPage: async ({ page }, use) => {
  //   // Login logic here
  //   await page.goto('/login');
  //   await page.fill('[name="email"]', 'test@example.com');
  //   await page.fill('[name="password"]', 'password');
  //   await page.click('button[type="submit"]');
  //   await page.waitForURL('/');
  //   await use(page);
  // },
});

export { expect } from "@playwright/test";
