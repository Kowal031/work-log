# Test Structure

This directory contains all tests for the WorkLog application.

## Directory Structure

```
tests/
├── unit/                 # Unit tests for services, utilities, and pure functions
├── integration/          # Integration tests for API endpoints and component interactions
├── e2e/                  # End-to-end tests using Playwright
├── fixtures/             # Test data and fixtures
├── mocks/                # MSW handlers and mock server setup
└── setup.ts              # Global test setup for Vitest
```

## Running Tests

### Unit & Integration Tests (Vitest)
```bash
npm run test              # Run tests in watch mode
npm run test:ui           # Run tests with UI
npm run test:coverage     # Run tests with coverage report
```

### E2E Tests (Playwright)
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run E2E tests with UI
npm run test:e2e:debug    # Debug E2E tests
```

## Writing Tests

### Unit Tests
Place unit tests next to the code they test or in `tests/unit/` directory.
Use `.test.ts` or `.spec.ts` extension.

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### E2E Tests
Place E2E tests in `tests/e2e/` directory.
Use `.spec.ts` extension.

```typescript
import { test, expect } from './fixtures';

test('should complete user flow', async ({ page }) => {
  await page.goto('/');
  // ... test steps
});
```

#### Test Plans
Detailed test plans are available for complex scenarios:

- **Login Test Plan** (`tests/e2e/.ai/e2e-login-test-plan.md`): Comprehensive plan covering login flow, validation, error handling, accessibility, and integration scenarios. Includes 17 test scenarios with detailed steps and expected results.

## Best Practices

1. **Unit Tests**: Focus on testing individual functions and components in isolation
2. **Integration Tests**: Test the interaction between multiple modules
3. **E2E Tests**: Test complete user workflows from start to finish
4. **Use Fixtures**: Reuse test data via fixtures for consistency
5. **Mock External Dependencies**: Use MSW for API mocking
6. **Follow AAA Pattern**: Arrange, Act, Assert in your tests
7. **Use Descriptive Names**: Test names should clearly describe what they test
