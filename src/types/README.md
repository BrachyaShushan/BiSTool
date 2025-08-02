# Type System Documentation

## Overview

This directory contains the comprehensive type system for the BiSTool application. The types have been significantly improved to provide better type safety, consistency, and maintainability.

## File Structure

```
src/types/
├── index.ts                 # Main type exports
├── shared.ts               # Core shared types
├── guards.ts               # Runtime type validation
├── IMPROVEMENTS.md         # Detailed improvement documentation
├── README.md               # This file
├── core/
│   ├── index.ts           # Core type exports
│   ├── app.types.ts       # Application-specific types
│   ├── project.types.ts   # Project-related types
│   └── common.types.ts    # Common utility types
├── components/
│   ├── index.ts           # Component type exports
│   ├── components.types.ts # Component interfaces
│   ├── Modal.types.ts     # Modal-related types
│   └── yamlGenerator.types.ts # YAML generator types
└── features/
    └── SavedManager.ts    # Saved manager types
```

## Key Improvements

### 1. Enhanced Type Safety

#### Before

```typescript
interface TestCase {
  expectedStatus: string; // Could be any string
  lastResult?: "pass" | "fail" | undefined; // Limited options
}
```

#### After

```typescript
interface TestCase {
  expectedStatus: HTTPStatusCode; // Strict typing
  lastResult?: TestResult; // Comprehensive options
  priority?: Priority; // New priority system
  timeout?: number; // Timeout configuration
  dependencies?: string[]; // Test dependencies
}
```

### 2. Comprehensive Type Definitions

#### HTTP and API Types

- `HTTPStatusCode`: Strict HTTP status codes
- `HTTPMethod`: All supported HTTP methods
- `RequestBodyType`: Extended body types
- `ParameterLocation`: Clear parameter locations

#### Application Types

- `AppMode`: Application modes (basic/expert)
- `TabType`: Extended tab types
- `SectionId`: Section identifiers
- `ModalType`: Modal operation types

#### Testing Types

- `TestFramework`: All supported test frameworks
- `TestStyle`: Test methodology styles
- `TestResult`: Enhanced test result states
- `Priority`: Priority levels

#### Security Types

- `AuthType`: Authentication types
- `HashAlgorithm`: Security hash algorithms
- `EncryptionAlgorithm`: Encryption algorithms
- `TokenSource`: Token extraction sources

### 3. Runtime Validation

The `guards.ts` file provides comprehensive runtime validation:

```typescript
import { isExtendedSession, isValidHTTPMethod } from "../types/guards";

// Validate HTTP method
if (isValidHTTPMethod(method)) {
  // method is now typed as HTTPMethod
}

// Validate session object
if (isExtendedSession(session)) {
  // session is now typed as ExtendedSession
}
```

## Usage Examples

### 1. Basic Type Usage

```typescript
import {
  HTTPMethod,
  HTTPStatusCode,
  ExtendedSession,
  TestCase,
  Priority,
} from "../types";

// Type-safe HTTP method
const method: HTTPMethod = "POST";

// Type-safe status code
const status: HTTPStatusCode = "201";

// Comprehensive session
const session: ExtendedSession = {
  id: "session-1",
  name: "API Test Session",
  timestamp: new Date().toISOString(),
  tests: [
    {
      id: "test-1",
      name: "Create User Test",
      expectedStatus: "201",
      priority: "high",
      timeout: 30,
    },
  ],
};
```

### 2. Runtime Validation

```typescript
import {
  isExtendedSession,
  isValidHTTPMethod,
  validateArray,
} from "../types/guards";

// Validate single object
if (isExtendedSession(data)) {
  // data is now typed as ExtendedSession
  console.log(data.name);
}

// Validate array
const sessions = [session1, session2, session3];
if (validateArray(sessions, isExtendedSession)) {
  // sessions is now typed as ExtendedSession[]
  sessions.forEach((session) => console.log(session.name));
}

// Validate HTTP method
const method = "POST";
if (isValidHTTPMethod(method)) {
  // method is now typed as HTTPMethod
  makeRequest(method, url);
}
```

### 3. Form Validation

```typescript
import { FormField, ValidationRule, FormConfig } from "../types";

const loginForm: FormConfig = {
  fields: [
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      validation: [
        {
          type: "required",
          message: "Email is required",
        },
        {
          type: "email",
          message: "Please enter a valid email",
        },
      ],
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: true,
      validation: [
        {
          type: "required",
          message: "Password is required",
        },
        {
          type: "minLength",
          value: 8,
          message: "Password must be at least 8 characters",
        },
      ],
    },
  ],
  onSubmit: (data) => {
    console.log("Form submitted:", data);
  },
};
```

### 4. API Response Handling

```typescript
import { APIResponse, APIError, ValidationResult } from "../types";

// Type-safe API response
const handleResponse = (response: APIResponse) => {
  if (response.status >= 200 && response.status < 300) {
    console.log("Success:", response.body);
  } else {
    console.error("Error:", response.statusText);
  }
};

// Error handling
const handleError = (error: APIError) => {
  console.error("API Error:", error.message);
  if (error.userMessage) {
    showUserMessage(error.userMessage);
  }
};

// Validation result
const validateData = (data: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.name) {
    errors.push("Name is required");
  }

  if (data.age && data.age < 18) {
    warnings.push("User is under 18");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    field: "user",
    value: data,
  };
};
```

## Migration Guide

### 1. Update Imports

#### Before

```typescript
import { Session } from "../types/core/app.types";
import { TestCase } from "../types/shared";
```

#### After

```typescript
import { ExtendedSession, TestCase } from "../types";
```

### 2. Replace String Types

#### Before

```typescript
interface RequestConfig {
  method: string;
  bodyType: string;
}
```

#### After

```typescript
import { HTTPMethod, RequestBodyType } from "../types";

interface RequestConfig {
  method: HTTPMethod;
  bodyType: RequestBodyType;
}
```

### 3. Add Runtime Validation

#### Before

```typescript
const handleSession = (session: any) => {
  console.log(session.name);
};
```

#### After

```typescript
import { isExtendedSession } from "../types/guards";

const handleSession = (session: any) => {
  if (isExtendedSession(session)) {
    console.log(session.name);
  } else {
    console.error("Invalid session data");
  }
};
```

## Best Practices

### 1. Use Type Guards for Runtime Validation

```typescript
// Always validate external data
const handleExternalData = (data: any) => {
  if (isExtendedSession(data)) {
    // Safe to use data as ExtendedSession
    processSession(data);
  } else {
    throw new Error("Invalid session data");
  }
};
```

### 2. Use Strict Types Instead of Strings

```typescript
// Good
const method: HTTPMethod = "POST";
const status: HTTPStatusCode = "201";

// Avoid
const method: string = "POST";
const status: string = "201";
```

### 3. Leverage Type Inference

```typescript
// TypeScript will infer the correct types
const testCase: TestCase = {
  id: "test-1",
  expectedStatus: "200", // TypeScript knows this is HTTPStatusCode
  priority: "high", // TypeScript knows this is Priority
  timeout: 30, // TypeScript knows this is number
};
```

### 4. Use Validation Results

```typescript
const validateUser = (user: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!user.email) {
    errors.push("Email is required");
  }

  if (user.age < 13) {
    errors.push("User must be at least 13 years old");
  }

  if (user.age < 18) {
    warnings.push("User is under 18");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    field: "user",
    value: user,
  };
};
```

## Future Enhancements

### 1. Schema Validation Integration

Consider integrating with libraries like Zod or io-ts for runtime schema validation:

```typescript
import { z } from "zod";

const SessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  timestamp: z.string(),
  // ... other fields
});

type Session = z.infer<typeof SessionSchema>;
```

### 2. Advanced Type Features

- **Conditional Types**: For complex type relationships
- **Template Literal Types**: For string manipulation
- **Mapped Types**: For dynamic type generation

### 3. Performance Optimizations

- **Lazy Loading**: For large type definitions
- **Type Caching**: For frequently used types
- **Bundle Optimization**: Tree-shaking friendly exports

## Contributing

When adding new types:

1. **Use existing patterns**: Follow the established naming conventions
2. **Add type guards**: Include runtime validation functions
3. **Document thoroughly**: Add JSDoc comments for complex types
4. **Test validation**: Ensure type guards work correctly
5. **Update exports**: Add new types to appropriate index files

## Support

For questions about the type system:

1. Check the `IMPROVEMENTS.md` file for detailed documentation
2. Review the `guards.ts` file for runtime validation examples
3. Look at existing usage in the codebase for patterns
4. Use TypeScript's built-in type checking for compile-time validation
