import {
  FiCode,
  FiDatabase,
  FiGlobe,
  FiShield,
  FiZap,
  FiActivity,
  FiLayers,
  FiTarget,
  FiTrendingUp,
  FiMonitor,
  FiServer,
  FiCpu,
  FiWifi,
  FiCloud,
  FiHome,
  FiPackage,
  FiGitBranch,
} from "react-icons/fi";

// Programming Languages Configuration
export const PROGRAMMING_LANGUAGES = [
  {
    id: "python",
    name: "Python",
    icon: "🐍",
    color: "#3776ab",
    description:
      "High-level programming language with extensive testing libraries",
    frameworks: ["pytest", "unittest", "behave", "robot", "locust"],
    defaultFramework: "pytest",
    capabilities: [
      "api-testing",
      "web-testing",
      "performance",
      "ai-integration",
    ],
    syntaxHighlighting: "python",
    fileExtension: ".py",
    statusIcon: FiCode,
    statusColor: "green",
  },
  {
    id: "javascript",
    name: "JavaScript",
    icon: "🟨",
    color: "#f7df1e",
    description: "Dynamic programming language for web and Node.js testing",
    frameworks: ["jest", "mocha", "cypress", "playwright", "supertest"],
    defaultFramework: "jest",
    capabilities: ["api-testing", "web-testing", "e2e", "performance"],
    syntaxHighlighting: "javascript",
    fileExtension: ".js",
    statusIcon: FiActivity,
    statusColor: "yellow",
  },
  {
    id: "typescript",
    name: "TypeScript",
    icon: "🔷",
    color: "#3178c6",
    description: "Typed superset of JavaScript with enhanced tooling",
    frameworks: ["jest", "mocha", "cypress", "playwright", "supertest"],
    defaultFramework: "jest",
    capabilities: [
      "api-testing",
      "web-testing",
      "e2e",
      "performance",
      "type-safety",
    ],
    syntaxHighlighting: "typescript",
    fileExtension: ".ts",
    statusIcon: FiTarget,
    statusColor: "blue",
  },
  {
    id: "java",
    name: "Java",
    icon: "☕",
    color: "#007396",
    description: "Enterprise-grade language with robust testing ecosystem",
    frameworks: ["junit", "rest-assured", "testng", "selenium", "gatling"],
    defaultFramework: "junit",
    capabilities: ["api-testing", "web-testing", "performance", "enterprise"],
    syntaxHighlighting: "java",
    fileExtension: ".java",
    statusIcon: FiServer,
    statusColor: "orange",
  },
  {
    id: "csharp",
    name: "C#",
    icon: "💜",
    color: "#512bd4",
    description: "Microsoft's language with comprehensive testing tools",
    frameworks: ["nunit", "xunit", "mstest", "restsharp", "selenium"],
    defaultFramework: "nunit",
    capabilities: ["api-testing", "web-testing", "performance", "dotnet"],
    syntaxHighlighting: "csharp",
    fileExtension: ".cs",
    statusIcon: FiMonitor,
    statusColor: "purple",
  },
  {
    id: "go",
    name: "Go",
    icon: "🐹",
    color: "#00add8",
    description: "Fast, statically typed language with built-in testing",
    frameworks: ["go-test", "testify", "httptest", "gomock", "k6"],
    defaultFramework: "go-test",
    capabilities: ["api-testing", "performance", "concurrent", "microservices"],
    syntaxHighlighting: "go",
    fileExtension: ".go",
    statusIcon: FiTrendingUp,
    statusColor: "cyan",
  },
  {
    id: "ruby",
    name: "Ruby",
    icon: "💎",
    color: "#cc342d",
    description: "Dynamic language with elegant testing frameworks",
    frameworks: ["rspec", "minitest", "cucumber", "capybara", "httparty"],
    defaultFramework: "rspec",
    capabilities: ["api-testing", "web-testing", "bdd", "automation"],
    syntaxHighlighting: "ruby",
    fileExtension: ".rb",
  },
  {
    id: "php",
    name: "PHP",
    icon: "🐘",
    color: "#777bb4",
    description: "Server-side language with modern testing tools",
    frameworks: ["phpunit", "codeception", "behat", "guzzle", "artillery"],
    defaultFramework: "phpunit",
    capabilities: ["api-testing", "web-testing", "integration"],
    syntaxHighlighting: "php",
    fileExtension: ".php",
  },
  {
    id: "rust",
    name: "Rust",
    icon: "🦀",
    color: "#ce422b",
    description: "Systems programming language with memory safety",
    frameworks: ["cargo-test", "tokio-test", "mockall", "wiremock"],
    defaultFramework: "cargo-test",
    capabilities: ["api-testing", "performance", "systems", "concurrent"],
    syntaxHighlighting: "rust",
    fileExtension: ".rs",
  },
  {
    id: "kotlin",
    name: "Kotlin",
    icon: "🟪",
    color: "#7f52ff",
    description: "Modern JVM language with concise syntax",
    frameworks: ["junit", "kotest", "rest-assured", "selenium"],
    defaultFramework: "kotest",
    capabilities: ["api-testing", "web-testing", "android", "jvm"],
    syntaxHighlighting: "kotlin",
    fileExtension: ".kt",
  },
  {
    id: "swift",
    name: "Swift",
    icon: "🍎",
    color: "#f05138",
    description: "Apple's modern programming language",
    frameworks: ["xctest", "quick", "nimble", "ohhttpstubs"],
    defaultFramework: "xctest",
    capabilities: ["api-testing", "ios", "macos", "unit-testing"],
    syntaxHighlighting: "swift",
    fileExtension: ".swift",
  },
  {
    id: "dart",
    name: "Dart",
    icon: "🎯",
    color: "#00b4ab",
    description: "Google's language for Flutter and web development",
    frameworks: ["test", "flutter_test", "mockito", "http"],
    defaultFramework: "test",
    capabilities: ["api-testing", "flutter", "web", "mobile"],
    syntaxHighlighting: "dart",
    fileExtension: ".dart",
  },
  {
    id: "scala",
    name: "Scala",
    icon: "🔴",
    color: "#dc322f",
    description: "Functional programming on the JVM",
    frameworks: ["scalatest", "specs2", "akka-http-testkit", "gatling"],
    defaultFramework: "scalatest",
    capabilities: ["api-testing", "functional", "jvm", "reactive"],
    syntaxHighlighting: "scala",
    fileExtension: ".scala",
  },
  {
    id: "elixir",
    name: "Elixir",
    icon: "💜",
    color: "#6e4a7e",
    description: "Functional language built on Erlang VM",
    frameworks: ["exunit", "hound", "bypass", "wallaby"],
    defaultFramework: "exunit",
    capabilities: ["api-testing", "functional", "concurrent", "distributed"],
    syntaxHighlighting: "elixir",
    fileExtension: ".ex",
  },
  {
    id: "clojure",
    name: "Clojure",
    icon: "🟢",
    color: "#5881d8",
    description: "Lisp dialect for the JVM",
    frameworks: ["clojure.test", "midje", "kerodon", "clj-http"],
    defaultFramework: "clojure.test",
    capabilities: ["api-testing", "functional", "jvm", "data-processing"],
    syntaxHighlighting: "clojure",
    fileExtension: ".clj",
  },
  {
    id: "fsharp",
    name: "F#",
    icon: "🔵",
    color: "#378bba",
    description: "Functional-first language for .NET",
    frameworks: ["nunit", "xunit", "fscheck", "canopy"],
    defaultFramework: "nunit",
    capabilities: ["api-testing", "functional", "dotnet", "data-science"],
    syntaxHighlighting: "fsharp",
    fileExtension: ".fs",
  },
];

// Test Frameworks Configuration
export const TEST_FRAMEWORKS = {
  // Python Frameworks
  pytest: {
    id: "pytest",
    name: "pytest",
    language: "python",
    description: "Modern Python testing framework",
    icon: "🐍",
    color: "#3776ab",
    features: ["fixtures", "parametrize", "markers", "plugins"],
    template: "pytest_template",
    dependencies: ["pytest", "pytest-html", "pytest-xdist"],
    statusIcon: FiCpu,
    statusColor: "green",
  },
  unittest: {
    id: "unittest",
    name: "unittest",
    language: "python",
    description: "Python's built-in testing framework",
    icon: "🐍",
    color: "#3776ab",
    features: ["test-cases", "test-suites", "assertions"],
    template: "unittest_template",
    dependencies: [],
  },
  // JavaScript/TypeScript Frameworks
  jest: {
    id: "jest",
    name: "Jest",
    language: "javascript",
    description: "Delightful JavaScript testing framework",
    icon: "🟨",
    color: "#f7df1e",
    features: ["snapshots", "mocking", "coverage", "parallel"],
    template: "jest_template",
    dependencies: ["jest", "@types/jest"],
  },
  mocha: {
    id: "mocha",
    name: "Mocha",
    language: "javascript",
    description: "Flexible JavaScript test framework",
    icon: "🟨",
    color: "#f7df1e",
    features: ["async", "hooks", "reporters", "bdd"],
    template: "mocha_template",
    dependencies: ["mocha", "chai", "supertest"],
  },
  cypress: {
    id: "cypress",
    name: "Cypress",
    language: "javascript",
    description: "End-to-end testing framework",
    icon: "🟨",
    color: "#f7df1e",
    features: ["e2e", "visual", "network", "time-travel"],
    template: "cypress_template",
    dependencies: ["cypress"],
  },
  playwright: {
    id: "playwright",
    name: "Playwright",
    language: "javascript",
    description: "Reliable end-to-end testing",
    icon: "🟨",
    color: "#f7df1e",
    features: ["multi-browser", "auto-wait", "network", "mobile"],
    template: "playwright_template",
    dependencies: ["playwright", "@playwright/test"],
  },
  // Java Frameworks
  junit: {
    id: "junit",
    name: "JUnit",
    language: "java",
    description: "Unit testing framework for Java",
    icon: "☕",
    color: "#007396",
    features: ["annotations", "assertions", "parameterized", "extensions"],
    template: "junit_template",
    dependencies: ["junit-jupiter", "junit-platform"],
  },
  "rest-assured": {
    id: "rest-assured",
    name: "REST Assured",
    language: "java",
    description: "Java library for testing REST APIs",
    icon: "☕",
    color: "#007396",
    features: ["dsl", "validation", "authentication", "logging"],
    template: "rest_assured_template",
    dependencies: ["rest-assured", "junit-jupiter"],
  },
  // C# Frameworks
  nunit: {
    id: "nunit",
    name: "NUnit",
    language: "csharp",
    description: "Unit testing framework for .NET",
    icon: "💜",
    color: "#512bd4",
    features: ["attributes", "assertions", "data-driven", "parallel"],
    template: "nunit_template",
    dependencies: ["NUnit", "NUnit3TestAdapter"],
  },
  xunit: {
    id: "xunit",
    name: "xUnit",
    language: "csharp",
    description: "Modern testing framework for .NET",
    icon: "💜",
    color: "#512bd4",
    features: ["fact", "theory", "fixtures", "parallel"],
    template: "xunit_template",
    dependencies: ["xunit", "xunit.runner.visualstudio"],
  },
  // Go Frameworks
  "go-test": {
    id: "go-test",
    name: "Go Test",
    language: "go",
    description: "Go's built-in testing package",
    icon: "🐹",
    color: "#00add8",
    features: ["benchmarks", "examples", "coverage", "parallel"],
    template: "go_test_template",
    dependencies: [],
  },
  // Ruby Frameworks
  rspec: {
    id: "rspec",
    name: "RSpec",
    language: "ruby",
    description: "Behavior-driven development for Ruby",
    icon: "💎",
    color: "#cc342d",
    features: ["bdd", "mocking", "shared-examples", "custom-matchers"],
    template: "rspec_template",
    dependencies: ["rspec", "rspec-rails"],
  },
  // PHP Frameworks
  phpunit: {
    id: "phpunit",
    name: "PHPUnit",
    language: "php",
    description: "Unit testing framework for PHP",
    icon: "🐘",
    color: "#777bb4",
    features: ["annotations", "data-providers", "mocking", "coverage"],
    template: "phpunit_template",
    dependencies: ["phpunit/phpunit"],
  },
  // .NET Frameworks
  "dotnet-test": {
    id: "dotnet-test",
    name: ".NET Test",
    language: "csharp",
    description: ".NET CLI testing tool",
    icon: "💜",
    color: "#512bd4",
    features: ["discovery", "filtering", "parallel", "coverage"],
    template: "dotnet_test_template",
    dependencies: ["Microsoft.NET.Test.Sdk"],
  },
};

// API Environments Configuration
export const API_ENVIRONMENTS = [
  {
    id: "rest",
    name: "REST API",
    icon: "🌐",
    color: "#3b82f6",
    description: "Representational State Transfer APIs",
    features: ["http-methods", "status-codes", "headers", "json-xml"],
    testingApproaches: [
      "endpoint-testing",
      "status-validation",
      "schema-validation",
    ],
    commonTools: ["postman", "insomnia", "curl", "rest-assured"],
    statusIcon: FiGlobe,
    statusColor: "blue",
  },
  {
    id: "graphql",
    name: "GraphQL",
    icon: "🔷",
    color: "#e535ab",
    description: "Query language and runtime for APIs",
    features: [
      "single-endpoint",
      "type-system",
      "introspection",
      "subscriptions",
    ],
    testingApproaches: [
      "query-testing",
      "mutation-testing",
      "subscription-testing",
    ],
    commonTools: ["graphql-playground", "insomnia", "apollo-studio"],
    statusIcon: FiDatabase,
    statusColor: "pink",
  },
  {
    id: "soap",
    name: "SOAP",
    icon: "🧼",
    color: "#ff6b35",
    description: "Simple Object Access Protocol",
    features: ["xml-based", "wsdl", "ws-security", "transactions"],
    testingApproaches: ["wsdl-testing", "xml-validation", "security-testing"],
    commonTools: ["soapui", "postman", "jmeter"],
  },
  {
    id: "grpc",
    name: "gRPC",
    icon: "⚡",
    color: "#00b4d8",
    description: "High-performance RPC framework",
    features: [
      "protocol-buffers",
      "streaming",
      "bidirectional",
      "code-generation",
    ],
    testingApproaches: [
      "service-testing",
      "stream-testing",
      "proto-validation",
    ],
    commonTools: ["grpcurl", "bloomrpc", "postman"],
    statusIcon: FiZap,
    statusColor: "cyan",
  },
  {
    id: "websocket",
    name: "WebSocket",
    icon: "🔌",
    color: "#10b981",
    description: "Full-duplex communication protocol",
    features: ["real-time", "bidirectional", "persistent-connection"],
    testingApproaches: [
      "connection-testing",
      "message-testing",
      "event-testing",
    ],
    commonTools: ["websocket-king", "postman", "wscat"],
    statusIcon: FiWifi,
    statusColor: "green",
  },
  {
    id: "event-driven",
    name: "Event-Driven",
    icon: "📡",
    color: "#8b5cf6",
    description: "Asynchronous event-based architecture",
    features: [
      "pub-sub",
      "event-streaming",
      "message-queues",
      "async-processing",
    ],
    testingApproaches: ["event-testing", "integration-testing", "end-to-end"],
    commonTools: ["kafka", "rabbitmq", "redis", "apache-pulsar"],
    statusIcon: FiLayers,
    statusColor: "purple",
  },
  {
    id: "microservices",
    name: "Microservices",
    icon: "🏗️",
    color: "#f59e0b",
    description: "Distributed service architecture",
    features: [
      "service-isolation",
      "api-gateway",
      "service-discovery",
      "load-balancing",
    ],
    testingApproaches: [
      "unit-testing",
      "integration-testing",
      "contract-testing",
    ],
    commonTools: ["docker", "kubernetes", "istio", "consul"],
    statusIcon: FiPackage,
    statusColor: "orange",
  },
];

// Authentication Types Configuration
export const AUTHENTICATION_TYPES = [
  {
    id: "none",
    name: "No Authentication",
    icon: "🚫",
    color: "#6b7280",
    description: "Public API without authentication",
    implementation: "No auth headers required",
    statusIcon: FiCloud,
    statusColor: "gray",
  },
  {
    id: "basic",
    name: "Basic Auth",
    icon: "🔐",
    color: "#059669",
    description: "Username and password authentication",
    implementation: "Authorization: Basic base64(username:password)",
    statusIcon: FiHome,
    statusColor: "green",
  },
  {
    id: "bearer",
    name: "Bearer Token",
    icon: "🎫",
    color: "#3b82f6",
    description: "JWT or OAuth2 bearer token",
    implementation: "Authorization: Bearer <token>",
    statusIcon: FiShield,
    statusColor: "blue",
  },
  {
    id: "api-key",
    name: "API Key",
    icon: "🔑",
    color: "#f59e0b",
    description: "API key in header or query parameter",
    implementation: "X-API-Key: <key> or ?api_key=<key>",
    statusIcon: FiGitBranch,
    statusColor: "yellow",
  },
  {
    id: "oauth2",
    name: "OAuth 2.0",
    icon: "🔒",
    color: "#dc2626",
    description: "OAuth 2.0 authorization flow",
    implementation: "Complex flow with client credentials",
  },
  {
    id: "jwt",
    name: "JWT",
    icon: "🎭",
    color: "#7c3aed",
    description: "JSON Web Token authentication",
    implementation: "Authorization: Bearer <jwt_token>",
  },
  {
    id: "session",
    name: "Session-based",
    icon: "🍪",
    color: "#ea580c",
    description: "Session cookie authentication",
    implementation: "Cookie: session=<session_id>",
  },
  {
    id: "custom",
    name: "Custom",
    icon: "⚙️",
    color: "#6b7280",
    description: "Custom authentication method",
    implementation: "User-defined implementation",
  },
];

// Test Styles Configuration
export const TEST_STYLES = [
  {
    id: "bdd",
    name: "Behavior-Driven Development",
    icon: "📝",
    color: "#059669",
    description: "Given-When-Then format with business language",
    keywords: ["Given", "When", "Then", "And", "But"],
    frameworks: ["cucumber", "behave", "rspec", "jbehave"],
  },
  {
    id: "tdd",
    name: "Test-Driven Development",
    icon: "🔄",
    color: "#3b82f6",
    description: "Red-Green-Refactor cycle",
    keywords: ["Arrange", "Act", "Assert", "Setup", "Teardown"],
    frameworks: ["junit", "nunit", "pytest", "jest"],
  },
  {
    id: "functional",
    name: "Functional Testing",
    icon: "⚙️",
    color: "#f59e0b",
    description: "Testing application functionality",
    keywords: ["Test", "Verify", "Validate", "Check"],
    frameworks: ["all", "framework-agnostic"],
  },
  {
    id: "integration",
    name: "Integration Testing",
    icon: "🔗",
    color: "#8b5cf6",
    description: "Testing component interactions",
    keywords: ["Integration", "Component", "Service", "API"],
    frameworks: ["all", "framework-agnostic"],
  },
  {
    id: "e2e",
    name: "End-to-End Testing",
    icon: "🌐",
    color: "#dc2626",
    description: "Testing complete user workflows",
    keywords: ["E2E", "User Journey", "Workflow", "Scenario"],
    frameworks: ["cypress", "playwright", "selenium", "cucumber"],
  },
  {
    id: "unit",
    name: "Unit Testing",
    icon: "🧩",
    color: "#10b981",
    description: "Testing individual code units",
    keywords: ["Unit", "Function", "Method", "Class"],
    frameworks: ["all", "framework-agnostic"],
  },
  {
    id: "api",
    name: "API Testing",
    icon: "🔌",
    color: "#7c3aed",
    description: "Testing API endpoints and contracts",
    keywords: ["API", "Endpoint", "Contract", "Schema"],
    frameworks: ["rest-assured", "supertest", "httpx", "requests"],
  },
];

// Code Styles Configuration
export const CODE_STYLES = [
  {
    id: "oop",
    name: "Object-Oriented",
    icon: "🏗️",
    color: "#3b82f6",
    description: "Class-based programming with inheritance",
    keywords: ["class", "object", "inheritance", "encapsulation"],
    patterns: ["Page Object Model", "Test Classes", "Base Classes"],
  },
  {
    id: "functional",
    name: "Functional",
    icon: "⚡",
    color: "#10b981",
    description: "Function-based programming with immutability",
    keywords: ["function", "pure", "immutable", "composition"],
    patterns: [
      "Function Composition",
      "Pure Functions",
      "Higher-Order Functions",
    ],
  },
  {
    id: "procedural",
    name: "Procedural",
    icon: "📋",
    color: "#f59e0b",
    description: "Step-by-step procedure execution",
    keywords: ["procedure", "step", "sequence", "linear"],
    patterns: ["Linear Steps", "Procedural Functions", "Sequential Execution"],
  },
  {
    id: "declarative",
    name: "Declarative",
    icon: "📝",
    color: "#8b5cf6",
    description: "What to do rather than how to do it",
    keywords: ["what", "declaration", "intent", "description"],
    patterns: ["DSL", "Configuration", "Intent-Based"],
  },
];

// Default Configuration Templates
export const DEFAULT_CONFIG_TEMPLATES = {
  python: {
    testFramework: "pytest",
    testStyle: "bdd",
    codeStyle: "functional",
    apiEnvironment: "rest",
    authenticationType: "bearer",
    responseValidation: "strict",
    errorHandling: "comprehensive",
    loggingLevel: "info",
    timeoutConfig: {
      request: 30000,
      response: 30000,
      global: 60000,
    },
    retryConfig: {
      enabled: true,
      maxAttempts: 3,
      backoffStrategy: "exponential",
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
    dataDrivenTesting: {
      enabled: true,
      dataSource: "inline",
      dataFormat: "json",
    },
    parallelExecution: {
      enabled: true,
      maxConcurrency: 4,
      strategy: "process",
    },
    reporting: {
      format: "html",
      includeScreenshots: true,
      includeVideos: false,
      includeLogs: true,
    },
    promptConfig: {
      preInstructions:
        "Generate comprehensive API tests following Python best practices",
      postInstructions: "Include proper error handling and logging",
      customTemplates: {},
      languageSpecificPrompts: {
        python: "Use Python type hints and follow PEP 8 style guidelines",
      },
      frameworkSpecificPrompts: {
        pytest: "Use pytest fixtures and parametrize for data-driven testing",
      },
      environmentSpecificPrompts: {
        rest: "Test all HTTP methods and validate response schemas",
      },
      qualityGates: {
        minTestCases: 5,
        maxTestCases: 50,
        requiredAssertions: [
          "status_code",
          "response_time",
          "schema_validation",
        ],
        forbiddenPatterns: ["sleep", "time.sleep", "hardcoded_values"],
      },
    },
  },
  javascript: {
    testFramework: "jest",
    testStyle: "functional",
    codeStyle: "functional",
    apiEnvironment: "rest",
    authenticationType: "bearer",
    responseValidation: "strict",
    errorHandling: "comprehensive",
    loggingLevel: "info",
    timeoutConfig: {
      request: 30000,
      response: 30000,
      global: 60000,
    },
    retryConfig: {
      enabled: true,
      maxAttempts: 3,
      backoffStrategy: "exponential",
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
    dataDrivenTesting: {
      enabled: true,
      dataSource: "inline",
      dataFormat: "json",
    },
    parallelExecution: {
      enabled: true,
      maxConcurrency: 4,
      strategy: "async",
    },
    reporting: {
      format: "html",
      includeScreenshots: true,
      includeVideos: false,
      includeLogs: true,
    },
    promptConfig: {
      preInstructions: "Generate modern JavaScript API tests using async/await",
      postInstructions: "Include proper error handling and modern JS patterns",
      customTemplates: {},
      languageSpecificPrompts: {
        javascript: "Use ES6+ features and async/await for HTTP requests",
      },
      frameworkSpecificPrompts: {
        jest: "Use Jest mocks and describe/it blocks for test organization",
      },
      environmentSpecificPrompts: {
        rest: "Test all HTTP methods and validate JSON responses",
      },
      qualityGates: {
        minTestCases: 5,
        maxTestCases: 50,
        requiredAssertions: ["status_code", "response_time", "json_schema"],
        forbiddenPatterns: ["setTimeout", "setInterval", "eval"],
      },
    },
  },
};

// Prompt Templates for Different Languages and Frameworks
export const PROMPT_TEMPLATES = {
  python: {
    pytest: `Create comprehensive pytest tests for the following API endpoint:

{yamlData}

Requirements:
- Use pytest fixtures for setup and teardown
- Use @pytest.mark.parametrize for data-driven testing
- Include proper type hints
- Follow PEP 8 style guidelines
- Use requests library for HTTP calls
- Include comprehensive error handling
- Validate response schemas
- Test edge cases and error scenarios

{requirements}

Generate tests that cover:
1. Happy path scenarios
2. Error handling (400, 401, 403, 404, 500)
3. Edge cases and boundary conditions
4. Response validation
5. Performance considerations

Use this structure:
\`\`\`python
import pytest
import requests
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class TestData:
    # Test data here
    pass

@pytest.fixture
def api_client():
    # Setup API client
    pass

def test_endpoint_success(api_client, test_data):
    """Test successful API call"""
    # Test implementation
    pass
\`\`\``,
    unittest: `Create comprehensive unittest tests for the following API endpoint:

{yamlData}

Requirements:
- Use unittest.TestCase class
- Use setUp and tearDown methods
- Include proper docstrings
- Follow Python naming conventions
- Use requests library for HTTP calls
- Include comprehensive error handling

{requirements}

Generate tests that cover:
1. Happy path scenarios
2. Error handling
3. Edge cases
4. Response validation

Use this structure:
\`\`\`python
import unittest
import requests
from typing import Dict, Any

class TestAPIEndpoint(unittest.TestCase):
    def setUp(self):
        # Setup code
        pass
    
    def tearDown(self):
        # Cleanup code
        pass
    
    def test_successful_request(self):
        """Test successful API call"""
        # Test implementation
        pass
\`\`\``,
  },
  javascript: {
    jest: `Create comprehensive Jest tests for the following API endpoint:

{yamlData}

Requirements:
- Use Jest describe/it blocks
- Use Jest mocks for external dependencies
- Use async/await for HTTP requests
- Include proper error handling
- Use axios or fetch for HTTP calls
- Validate response schemas

{requirements}

Generate tests that cover:
1. Happy path scenarios
2. Error handling
3. Edge cases
4. Response validation

Use this structure:
\`\`\`javascript
import axios from 'axios';

describe('API Endpoint Tests', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should successfully call the API', async () => {
    // Test implementation
  });
});
\`\`\``,
    mocha: `Create comprehensive Mocha tests for the following API endpoint:

{yamlData}

Requirements:
- Use Mocha describe/it blocks
- Use Chai assertions
- Use async/await for HTTP requests
- Include proper error handling
- Use supertest for HTTP testing

{requirements}

Generate tests that cover:
1. Happy path scenarios
2. Error handling
3. Edge cases
4. Response validation

Use this structure:
\`\`\`javascript
const { expect } = require('chai');
const request = require('supertest');

describe('API Endpoint Tests', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should successfully call the API', async () => {
    // Test implementation
  });
});
\`\`\``,
  },
};

// Storage Keys for Project Configuration
export const STORAGE_KEYS = {
  AI_TEST_CONFIG: "bistool_ai_test_config",
  PROMPT_TEMPLATES: "bistool_prompt_templates",
  SELECTED_TEMPLATE: "bistool_selected_template",
  LANGUAGE_CONFIGS: "bistool_language_configs",
  FRAMEWORK_CONFIGS: "bistool_framework_configs",
};
