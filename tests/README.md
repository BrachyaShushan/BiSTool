# BiSTool E2E Testing with Playwright

This directory contains end-to-end tests for BiSTool using Playwright, with a focus on localStorage functionality and mobile compatibility.

## Test Structure

### Core Test Files

- **`localStorage.test.ts`** - Comprehensive localStorage testing (most critical)
- **`app-workflow.test.ts`** - Main application workflow and feature testing
- **`mobile.test.ts`** - Mobile-specific testing including touch interactions
- **`example.test.ts`** - Basic app functionality validation

### Helper Files

- **`utils/localStorage.helper.ts`** - Helper class for localStorage operations

## Running Tests

### Basic Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with browser visible
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# View test report
npm run test:report
```

### Specific Test Categories

```bash
# Run only localStorage tests (most critical)
npm run test:e2e:localStorage

# Run workflow tests
npm run test:e2e:workflow

# Run mobile-specific tests
npm run test:e2e:mobile-only
```

### Browser-Specific Tests

```bash
# Run on Chrome only
npm run test:e2e:chrome

# Run on mobile Chrome (Pixel 5 emulation)
npm run test:e2e:mobile
```

## Test Focus Areas

### 1. LocalStorage (Primary Focus)

- Data persistence across page reloads
- Project isolation and data integrity
- Efficient storage quota management
- Concurrent operation handling
- Data corruption recovery
- Cross-project compatibility

### 2. Application Workflow

- URL Builder functionality
- Request configuration
- Session management
- Variable management
- YAML generation
- Token management

### 3. Mobile Compatibility

- Touch interactions
- Responsive layout
- Orientation changes
- Mobile-specific localStorage behavior
- Performance on mobile constraints

## Configuration

The tests are configured in `playwright.config.ts` with:

- **Chrome desktop** and **mobile Chrome** (Pixel 5) projects
- **Headless mode** by default
- **Dev server** auto-start on `http://localhost:5173`
- **HTML reporter** for test results
- **Screenshots and videos** on failure

## Best Practices

1. **Always clean localStorage** before and after tests
2. **Use unique project IDs** to avoid test interference
3. **Test data persistence** across page reloads
4. **Verify mobile compatibility** for touch interactions
5. **Monitor storage quota** usage in tests
6. **Handle concurrent operations** gracefully
