// Common HTTP status codes for better type safety
export type HTTPStatusCode =
  | "200"
  | "201"
  | "202"
  | "204"
  | "400"
  | "401"
  | "403"
  | "404"
  | "409"
  | "422"
  | "429"
  | "500"
  | "502"
  | "503";

// HTTP methods for better type safety
export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

// Body types for requests
export type RequestBodyType = "none" | "json" | "form" | "text";

// Form data field types
export type FormFieldType =
  | "text"
  | "file"
  | "email"
  | "password"
  | "number"
  | "date"
  | "datetime-local";

// Parameter location types
export type ParameterLocation = "path" | "header" | "query" | "body";

// Test result types
export type TestResult = "pass" | "fail" | "pending" | "running";

// Environment types
export type Environment = string;

// Protocol types
export type Protocol = string;

/**
 * Response condition for filtering API responses
 */
export interface ResponseCondition {
  status: string;
  condition: string; // user-provided text description
  include: boolean; // whether to include this response
}

/**
 * Parsed URL segment with metadata
 */
export interface URLSegment {
  paramName: string;
  description?: string;
  required?: boolean;
  value: string;
  isDynamic: boolean;
  type?: "string" | "number" | "uuid" | "date" | "custom";
  pattern?: string; // regex pattern for validation
  example?: string; // example value
}

/**
 * Query parameter with metadata
 */
export interface QueryParameter {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "array" | "object";
  format?: "date" | "date-time" | "email" | "uri" | "uuid";
  example?: string;
  deprecated?: boolean;
}

/**
 * Header parameter with metadata
 */
export interface HeaderParameter {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
  type?: string;
  in: ParameterLocation;
  deprecated?: boolean;
}

/**
 * Form data field with metadata
 */
export interface FormDataField {
  key: string;
  value: string;
  type: FormFieldType;
  required: boolean;
  description?: string;
  placeholder?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

/**
 * Variable with metadata
 */
export interface Variable {
  key: string;
  value: string;
  description?: string;
  type?: "string" | "number" | "boolean" | "object" | "array";
  isGlobal?: boolean;
  isSecret?: boolean; // for sensitive data like tokens
  lastModified?: string;
  tags?: string[];
}

/**
 * Test case with comprehensive metadata
 */
export interface TestCase {
  id: string;
  name?: string;
  description?: string;
  bodyOverride?: string;
  pathOverrides?: Record<string, string>;
  queryOverrides?: Record<string, string>;
  headerOverrides?: Record<string, string>;
  expectedStatus: string;
  expectedResponse?: string;
  expectedPartialResponse?: boolean;
  expectedResponseSchema?: Record<string, any>; // JSON schema for validation
  lastResult?: TestResult;
  lastRun?: string;
  executionTime?: number; // in milliseconds
  useToken?: boolean;
  serverResponse?: string;
  serverStatusCode?: number;
  includeInAIPrompt?: boolean;
  tags?: string[];
  priority?: "low" | "medium" | "high" | "critical";
  timeout?: number; // in seconds
  retryCount?: number;
  dependencies?: string[]; // IDs of tests this depends on
}

/**
 * URL data with comprehensive metadata
 */
export interface URLData {
  baseURL: string;
  segments: string;
  parsedSegments: URLSegment[];
  queryParams: QueryParameter[];
  segmentVariables: Variable[];
  processedURL: string;
  domain: string;
  protocol: Protocol;
  builtUrl: string;
  environment: Environment;
  sessionDescription?: string;
  metadata?: {
    createdAt?: string;
    lastModified?: string;
    version?: string;
    tags?: string[];
  };
}

/**
 * Request configuration with comprehensive metadata
 */
export interface RequestConfigData {
  method: string;
  queryParams: QueryParameter[];
  headers: HeaderParameter[];
  bodyType: RequestBodyType;
  jsonBody?: string;
  formData?: FormDataField[];
  textBody?: string;
  xmlBody?: string;
  body?: Record<string, any>;
  timeout?: number; // in seconds
  retryConfig?: {
    enabled: boolean;
    maxAttempts: number;
    backoffStrategy: "linear" | "exponential" | "custom";
    retryableStatusCodes: number[];
  };
  metadata?: {
    createdAt?: string;
    lastModified?: string;
    version?: string;
    tags?: string[];
  };
}

/**
 * Extended session with comprehensive metadata and state
 */
export interface ExtendedSession {
  id: string;
  name: string;
  timestamp: string;
  category?: string;
  urlData?: URLData;
  requestConfig?: RequestConfigData;
  yamlOutput?: string;
  segmentVariables?: Record<string, string>;
  sharedVariables?: Record<string, string>;
  activeSection?: string;
  responseConditions?: ResponseCondition[];
  includeToken?: boolean;
  requirements?: string;
  tests?: TestCase[];
  customResponse?: string;
  metadata?: {
    description?: string;
    tags?: string[];
    version?: string;
    author?: string;
    lastModified?: string;
    estimatedDuration?: number; // in seconds
    complexity?: "simple" | "moderate" | "complex";
    status?: "draft" | "active" | "archived" | "deprecated";
  };
  statistics?: {
    totalTests?: number;
    passedTests?: number;
    failedTests?: number;
    averageResponseTime?: number;
    lastExecuted?: string;
    executionCount?: number;
  };
}

/**
 * API response with metadata
 */
export interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number; // in milliseconds
  timestamp: string;
  size?: number; // response size in bytes
  url?: string;
  method?: HTTPMethod;
}

/**
 * Error information with context
 */
export interface APIError {
  message: string;
  code?: string;
  status?: number;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
  userMessage?: string; // user-friendly error message
}

/**
 * Validation result for data validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  field?: string;
  value?: any;
}

/**
 * Search result with relevance scoring
 */
export interface SearchResult {
  id: string;
  type: "session" | "test" | "variable" | "header" | "query";
  title: string;
  description?: string;
  relevance: number; // 0-1 score
  tags?: string[];
  timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Configuration for data export/import
 */
export interface ExportConfig {
  format: "json" | "yaml" | "xml" | "csv";
  includeMetadata?: boolean;
  includeTests?: boolean;
  includeVariables?: boolean;
  includeHistory?: boolean;
  compression?: boolean;
  encryption?: {
    enabled: boolean;
    algorithm?: string;
    key?: string;
  };
}

/**
 * Import result with validation
 */
export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: string[];
  warnings: string[];
  conflicts: Array<{
    type: "session" | "variable" | "test";
    name: string;
    action: "skip" | "overwrite" | "rename";
  }>;
  metadata?: {
    source: string;
    version: string;
    timestamp: string;
  };
}
