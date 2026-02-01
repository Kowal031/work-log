# CI/CD Documentation

## Overview

This document describes the CI/CD pipeline setup for the WorkLog project using GitHub Actions.

## Table of Contents

- [Workflow Structure](#workflow-structure)
- [Jobs Description](#jobs-description)
- [Environment Setup](#environment-setup)
- [Local Testing](#local-testing)
- [Troubleshooting](#troubleshooting)

## Workflow Structure

### CI CD Request Workflow (`ci-cd.yml`)

Triggers on:
- Pull requests to `master` branch
- Pushes to `master` branch

#### Job Flow

```
┌─────────┐
│  Lint   │
└────┬────┘
     │
     ├──────────────┬──────────────┐
     │              │              │
┌────▼────┐    ┌───▼────┐    (waits for both)
│Unit Test│    │E2E Test│         │
└────┬────┘    └───┬────┘         │
     │              │              │
     └──────────────┴──────────────┤
                                   │
                            ┌──────▼──────┐
                            │Status Comment│
                            └─────────────┘
```

## Jobs Description

### 1. Lint Job

**Purpose**: Validates code quality and style consistency.

**Steps**:
- Checkout code
- Setup Node.js (version from `.nvmrc`)
- Install dependencies with `npm ci`
- Run ESLint

**When it fails**: Fix linting errors with `npm run lint:fix` or manually address issues.

### 2. Unit Test Job

**Purpose**: Runs unit and integration tests with coverage reporting.

**Steps**:
- Checkout code
- Setup Node.js
- Install dependencies
- Run tests with coverage (`npm run test:coverage`)
- Upload coverage artifacts

**Dependencies**: Runs after successful lint job.

**Artifacts**:
- `unit-test-coverage/` - Code coverage reports (retained for 7 days)

**When it fails**: 
- Check test output in GitHub Actions logs
- Run `npm run test` locally to reproduce
- Fix failing tests or broken code

### 3. E2E Test Job

**Purpose**: Runs end-to-end tests using Playwright to verify complete user flows.

**Steps**:
- Checkout code
- Setup Node.js
- Install dependencies
- Install Playwright browsers (chromium only)
- Run E2E tests

**Dependencies**: Runs after successful lint job (parallel with unit tests).

**Environment**: `integration`

**Required Secrets**:
- `SUPABASE_URL`
- `SUPABASE_PUBLIC_KEY`
- `E2E_USERNAME_ID`
- `E2E_USERNAME`
- `E2E_PASSWORD`

**Artifacts**:
- `playwright-report/` - HTML test report (retained for 7 days)
- `test-results/` - Test execution results and screenshots (retained for 7 days)

**When it fails**:
- Download and review the Playwright HTML report artifact
- Check screenshots of failed tests
- Run `npm run test:e2e` locally with proper `.env.test` configuration
- Verify test data and user credentials

### 4. Status Comment Job

**Purpose**: Posts a summary comment on the pull request with CI results.

**Steps**:
- Evaluates results from all previous jobs
- Posts success or failure comment with job statuses

**Dependencies**: Runs after lint, unit-test, and e2e-test jobs complete.

**Permissions Required**: `pull-requests: write`

**Comment Format**:
- ✅ Success: Green checkmarks for all jobs
- ❌ Failure: Shows which jobs failed with red X marks

## Environment Setup

### GitHub Secrets Configuration

1. Navigate to: `Settings` → `Secrets and variables` → `Actions`
2. Add the following repository secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_PUBLIC_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `E2E_USERNAME_ID` | Test user UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `E2E_USERNAME` | Test user email | `test@example.com` |
| `E2E_PASSWORD` | Test user password | `SecurePassword123!` |

### GitHub Environment Configuration

1. Navigate to: `Settings` → `Environments`
2. Create environment: `integration`
3. Add the same secrets to this environment

**Why environment?** Provides better isolation and allows environment-specific deployment rules in the future.

## Local Testing

### Prerequisites

Ensure you have:
- Node.js 22.14.0 (use `nvm use`)
- Dependencies installed (`npm install`)
- Proper `.env` and `.env.test` files

### Running Tests Locally

```bash
# 1. Lint your code
npm run lint

# 2. Run unit tests
npm run test

# 3. Run unit tests with coverage
npm run test:coverage

# 4. Run E2E tests
npm run test:e2e

# 5. Run E2E tests in UI mode (interactive)
npm run test:e2e:ui

# 6. Debug E2E tests
npm run test:e2e:debug
```

### Environment Files

**`.env`** - For local development:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_PUBLIC_KEY=your_key_here
```

**`.env.test`** - For E2E tests:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_PUBLIC_KEY=your_key_here
E2E_USERNAME_ID=test_user_uuid
E2E_USERNAME=test@example.com
E2E_PASSWORD=test_password
```

## Troubleshooting

### Common Issues

#### 1. Lint Job Fails

**Problem**: ESLint errors in code.

**Solution**:
```bash
# Auto-fix linting issues
npm run lint:fix

# Check remaining issues
npm run lint
```

#### 2. Unit Tests Fail

**Problem**: Test failures or breaking changes.

**Solution**:
```bash
# Run tests locally
npm run test

# Run specific test file
npm run test -- tests/unit/example.test.ts

# Run with watch mode
npm run test -- --watch
```

#### 3. E2E Tests Fail

**Problem**: Browser tests timing out or failing.

**Solution**:
```bash
# Run tests with UI to see what's happening
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Check if dev server starts correctly
npm run dev:e2e
```

**Common E2E Issues**:
- **Timeout errors**: Increase timeout in `playwright.config.ts`
- **Element not found**: Check selectors in test files
- **Auth failures**: Verify test user credentials in `.env.test`

#### 4. Missing Environment Variables

**Problem**: Tests fail due to undefined environment variables.

**Solution**:
1. Check `.env.example` for required variables
2. Create/update `.env.test` with proper values
3. Verify GitHub Secrets are correctly configured

#### 5. Playwright Browser Not Installed

**Problem**: E2E tests fail with "Executable doesn't exist" error.

**Solution**:
```bash
# Install Playwright browsers
npx playwright install chromium

# Or with system dependencies
npx playwright install --with-deps chromium
```

#### 6. CI Passes but Local Tests Fail

**Possible causes**:
- Different Node.js versions (use `nvm use`)
- Missing dependencies (run `npm ci`)
- Stale cache (delete `node_modules` and reinstall)
- Environment variables not set locally

#### 7. PR Comment Not Posted

**Problem**: Status comment job runs but doesn't post to PR.

**Solution**:
1. Verify `pull-requests: write` permission is granted
2. Check if GitHub token has proper scopes
3. Review GitHub Actions logs for API errors

### Getting Help

If you encounter issues not covered here:

1. Check the GitHub Actions logs for detailed error messages
2. Review the artifacts (test reports, coverage) for more context
3. Run tests locally to reproduce the issue
4. Consult the project's main [README.md](../README.md)

## Best Practices

### Before Creating a PR

1. Run linter and fix issues: `npm run lint:fix`
2. Run all tests locally: `npm run test && npm run test:e2e`
3. Ensure code coverage is adequate
4. Review your changes for obvious issues

### Writing Tests

- **Unit Tests**: Fast, isolated, test single units of code
- **Integration Tests**: Test interactions between components
- **E2E Tests**: Test complete user workflows

### Maintaining CI Health

- Keep dependencies up to date
- Monitor test execution times
- Review and update test data regularly
- Archive old artifacts to save storage

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Documentation](https://supabase.com/docs)
