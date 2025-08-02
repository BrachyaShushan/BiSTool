import {
  HTTPStatusCode,
  HTTPMethod,
  RequestBodyType,
  FormFieldType,
  ParameterLocation,
  TestResult,
  Environment,
  Protocol,
  ResponseCondition,
  URLSegment,
  QueryParameter,
  HeaderParameter,
  FormDataField,
  Variable,
  TestCase,
  URLData,
  RequestConfigData,
  ExtendedSession,
  APIResponse,
  APIError,
  ValidationResult,
  SearchResult,
  ExportConfig,
  ImportResult,
} from "./shared";
import {
  AppMode,
  TabType,
  SectionId,
  ModalType,
  Theme,
  LoadingState,
  SaveState,
  NotificationType,
  FileType,
  AuthType,
  OAuth2GrantType,
  APIKeyLocation,
  TokenSource,
  HashAlgorithm,
  EncryptionAlgorithm,
  RetryStrategy,
  BackoffStrategy,
  LogLevel,
  TestFramework,
  TestStyle,
  CodeStyle,
  ProgrammingLanguage,
  OutputFormat,
  APIEnvironment,
  ResponseValidation,
  ErrorHandling,
  ReportFormat,
  DataSource,
  DataFormat,
  ExecutionStrategy,
  Priority,
  Complexity,
  Status,
} from "@/types/core/common.types";

/**
 * Type guards for runtime validation
 */

// HTTP Status Code validation
export function isValidHTTPStatusCode(
  status: string
): status is HTTPStatusCode {
  const validStatuses: HTTPStatusCode[] = [
    "200",
    "201",
    "202",
    "204",
    "400",
    "401",
    "403",
    "404",
    "409",
    "422",
    "429",
    "500",
    "502",
    "503",
  ];
  return validStatuses.includes(status as HTTPStatusCode);
}

// HTTP Method validation
export function isValidHTTPMethod(method: string): method is HTTPMethod {
  const validMethods: HTTPMethod[] = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
  ];
  return validMethods.includes(method as HTTPMethod);
}

// Request Body Type validation
export function isValidRequestBodyType(type: string): type is RequestBodyType {
  const validTypes: RequestBodyType[] = ["none", "json", "form", "text"];
  return validTypes.includes(type as RequestBodyType);
}

// Form Field Type validation
export function isValidFormFieldType(type: string): type is FormFieldType {
  const validTypes: FormFieldType[] = [
    "text",
    "file",
    "email",
    "password",
    "number",
    "date",
    "datetime-local",
  ];
  return validTypes.includes(type as FormFieldType);
}

// Parameter Location validation
export function isValidParameterLocation(
  location: string
): location is ParameterLocation {
  const validLocations: ParameterLocation[] = [
    "path",
    "header",
    "query",
    "body",
  ];
  return validLocations.includes(location as ParameterLocation);
}

// Test Result validation
export function isValidTestResult(result: string): result is TestResult {
  const validResults: TestResult[] = ["pass", "fail", "pending", "running"];
  return validResults.includes(result as TestResult);
}

// Environment validation
export function isValidEnvironment(env: string): env is Environment {
  const validEnvironments: Environment[] = [
    "development",
    "staging",
    "production",
    "testing",
  ];
  return validEnvironments.includes(env as Environment);
}

// Protocol validation
export function isValidProtocol(protocol: string): protocol is Protocol {
  const validProtocols: Protocol[] = ["http", "https", "ws", "wss"];
  return validProtocols.includes(protocol as Protocol);
}

// App Mode validation
export function isValidAppMode(mode: string): mode is AppMode {
  const validModes: AppMode[] = ["basic", "expert"];
  return validModes.includes(mode as AppMode);
}

// Tab Type validation
export function isValidTabType(tab: string): tab is TabType {
  const validTabs: TabType[] = [
    "sessions",
    "variables",
    "projects",
    "settings",
    "tests",
    "import",
  ];
  return validTabs.includes(tab as TabType);
}

// Section ID validation
export function isValidSectionId(section: string): section is SectionId {
  const validSections: SectionId[] = [
    "url",
    "request",
    "tests",
    "yaml",
    "ai",
    "import",
    "json",
    "variables",
    "settings",
  ];
  return validSections.includes(section as SectionId);
}

// Modal Type validation
export function isValidModalType(type: string): type is ModalType {
  const validTypes: ModalType[] = [
    "new",
    "edit",
    "delete",
    "rename",
    "duplicate",
    "import",
    "export",
  ];
  return validTypes.includes(type as ModalType);
}

// Theme validation
export function isValidTheme(theme: string): theme is Theme {
  const validThemes: Theme[] = ["light", "dark", "auto"];
  return validThemes.includes(theme as Theme);
}

// Loading State validation
export function isValidLoadingState(state: string): state is LoadingState {
  const validStates: LoadingState[] = ["idle", "loading", "success", "error"];
  return validStates.includes(state as LoadingState);
}

// Save State validation
export function isValidSaveState(state: string): state is SaveState {
  const validStates: SaveState[] = ["saved", "saving", "unsaved", "error"];
  return validStates.includes(state as SaveState);
}

// Notification Type validation
export function isValidNotificationType(
  type: string
): type is NotificationType {
  const validTypes: NotificationType[] = [
    "success",
    "error",
    "warning",
    "info",
  ];
  return validTypes.includes(type as NotificationType);
}

// File Type validation
export function isValidFileType(type: string): type is FileType {
  const validTypes: FileType[] = ["json", "yaml", "xml", "csv", "txt", "zip"];
  return validTypes.includes(type as FileType);
}

// Auth Type validation
export function isValidAuthType(type: string): type is AuthType {
  const validTypes: AuthType[] = [
    "none",
    "basic",
    "bearer",
    "api_key",
    "oauth2",
    "jwt",
    "session",
    "custom",
  ];
  return validTypes.includes(type as AuthType);
}

// OAuth2 Grant Type validation
export function isValidOAuth2GrantType(type: string): type is OAuth2GrantType {
  const validTypes: OAuth2GrantType[] = [
    "authorization_code",
    "client_credentials",
    "password",
    "implicit",
  ];
  return validTypes.includes(type as OAuth2GrantType);
}

// API Key Location validation
export function isValidAPIKeyLocation(
  location: string
): location is APIKeyLocation {
  const validLocations: APIKeyLocation[] = ["header", "query", "cookie"];
  return validLocations.includes(location as APIKeyLocation);
}

// Token Source validation
export function isValidTokenSource(source: string): source is TokenSource {
  const validSources: TokenSource[] = [
    "json",
    "cookies",
    "headers",
    "response-text",
    "set-cookie",
  ];
  return validSources.includes(source as TokenSource);
}

// Hash Algorithm validation
export function isValidHashAlgorithm(
  algorithm: string
): algorithm is HashAlgorithm {
  const validAlgorithms: HashAlgorithm[] = [
    "sha256",
    "sha512",
    "md5",
    "bcrypt",
  ];
  return validAlgorithms.includes(algorithm as HashAlgorithm);
}

// Encryption Algorithm validation
export function isValidEncryptionAlgorithm(
  algorithm: string
): algorithm is EncryptionAlgorithm {
  const validAlgorithms: EncryptionAlgorithm[] = [
    "aes-256-gcm",
    "aes-256-cbc",
    "chacha20-poly1305",
  ];
  return validAlgorithms.includes(algorithm as EncryptionAlgorithm);
}

// Retry Strategy validation
export function isValidRetryStrategy(
  strategy: string
): strategy is RetryStrategy {
  const validStrategies: RetryStrategy[] = ["linear", "exponential", "custom"];
  return validStrategies.includes(strategy as RetryStrategy);
}

// Backoff Strategy validation
export function isValidBackoffStrategy(
  strategy: string
): strategy is BackoffStrategy {
  const validStrategies: BackoffStrategy[] = [
    "fixed",
    "exponential",
    "fibonacci",
    "custom",
  ];
  return validStrategies.includes(strategy as BackoffStrategy);
}

// Log Level validation
export function isValidLogLevel(level: string): level is LogLevel {
  const validLevels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
  return validLevels.includes(level as LogLevel);
}

// Test Framework validation
export function isValidTestFramework(
  framework: string
): framework is TestFramework {
  const validFrameworks: TestFramework[] = [
    "pytest",
    "unittest",
    "jest",
    "mocha",
    "cypress",
    "playwright",
    "rest-assured",
    "junit",
    "nunit",
    "xunit",
    "go-test",
    "rspec",
    "phpunit",
    "dotnet-test",
  ];
  return validFrameworks.includes(framework as TestFramework);
}

// Test Style validation
export function isValidTestStyle(style: string): style is TestStyle {
  const validStyles: TestStyle[] = [
    "bdd",
    "tdd",
    "functional",
    "integration",
    "e2e",
    "unit",
    "api",
  ];
  return validStyles.includes(style as TestStyle);
}

// Code Style validation
export function isValidCodeStyle(style: string): style is CodeStyle {
  const validStyles: CodeStyle[] = [
    "oop",
    "functional",
    "procedural",
    "declarative",
  ];
  return validStyles.includes(style as CodeStyle);
}

// Programming Language validation
export function isValidProgrammingLanguage(
  language: string
): language is ProgrammingLanguage {
  const validLanguages: ProgrammingLanguage[] = [
    "python",
    "javascript",
    "typescript",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "rust",
    "kotlin",
    "swift",
    "dart",
    "scala",
    "elixir",
    "clojure",
    "fsharp",
  ];
  return validLanguages.includes(language as ProgrammingLanguage);
}

// Output Format validation
export function isValidOutputFormat(format: string): format is OutputFormat {
  const validFormats: OutputFormat[] = [
    "code",
    "markdown",
    "json",
    "yaml",
    "xml",
  ];
  return validFormats.includes(format as OutputFormat);
}

// API Environment validation
export function isValidAPIEnvironment(env: string): env is APIEnvironment {
  const validEnvironments: APIEnvironment[] = [
    "rest",
    "graphql",
    "soap",
    "grpc",
    "websocket",
    "event-driven",
    "microservices",
  ];
  return validEnvironments.includes(env as APIEnvironment);
}

// Response Validation validation
export function isValidResponseValidation(
  validation: string
): validation is ResponseValidation {
  const validValidations: ResponseValidation[] = [
    "strict",
    "lenient",
    "custom",
  ];
  return validValidations.includes(validation as ResponseValidation);
}

// Error Handling validation
export function isValidErrorHandling(
  handling: string
): handling is ErrorHandling {
  const validHandlings: ErrorHandling[] = ["comprehensive", "basic", "minimal"];
  return validHandlings.includes(handling as ErrorHandling);
}

// Report Format validation
export function isValidReportFormat(format: string): format is ReportFormat {
  const validFormats: ReportFormat[] = [
    "html",
    "json",
    "xml",
    "junit",
    "allure",
    "custom",
  ];
  return validFormats.includes(format as ReportFormat);
}

// Data Source validation
export function isValidDataSource(source: string): source is DataSource {
  const validSources: DataSource[] = ["inline", "file", "database", "api"];
  return validSources.includes(source as DataSource);
}

// Data Format validation
export function isValidDataFormat(format: string): format is DataFormat {
  const validFormats: DataFormat[] = ["json", "csv", "xml", "yaml"];
  return validFormats.includes(format as DataFormat);
}

// Execution Strategy validation
export function isValidExecutionStrategy(
  strategy: string
): strategy is ExecutionStrategy {
  const validStrategies: ExecutionStrategy[] = ["thread", "process", "async"];
  return validStrategies.includes(strategy as ExecutionStrategy);
}

// Priority validation
export function isValidPriority(priority: string): priority is Priority {
  const validPriorities: Priority[] = ["low", "medium", "high", "critical"];
  return validPriorities.includes(priority as Priority);
}

// Complexity validation
export function isValidComplexity(
  complexity: string
): complexity is Complexity {
  const validComplexities: Complexity[] = ["simple", "moderate", "complex"];
  return validComplexities.includes(complexity as Complexity);
}

// Status validation
export function isValidStatus(status: string): status is Status {
  const validStatuses: Status[] = [
    "draft",
    "active",
    "archived",
    "deprecated",
    "pending",
    "completed",
    "failed",
  ];
  return validStatuses.includes(status as Status);
}

// Complex object validation

/**
 * Validates if an object is a valid ResponseCondition
 */
export function isResponseCondition(obj: any): obj is ResponseCondition {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.status === "string" &&
    isValidHTTPStatusCode(obj.status) &&
    typeof obj.condition === "string" &&
    typeof obj.include === "boolean"
  );
}

/**
 * Validates if an object is a valid URLSegment
 */
export function isURLSegment(obj: any): obj is URLSegment {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.paramName === "string" &&
    typeof obj.value === "string" &&
    typeof obj.isDynamic === "boolean" &&
    (obj.description === undefined || typeof obj.description === "string") &&
    (obj.required === undefined || typeof obj.required === "boolean") &&
    (obj.type === undefined || typeof obj.type === "string") &&
    (obj.pattern === undefined || typeof obj.pattern === "string") &&
    (obj.example === undefined || typeof obj.example === "string")
  );
}

/**
 * Validates if an object is a valid QueryParameter
 */
export function isQueryParameter(obj: any): obj is QueryParameter {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.key === "string" &&
    typeof obj.value === "string" &&
    (obj.description === undefined || typeof obj.description === "string") &&
    (obj.required === undefined || typeof obj.required === "boolean") &&
    (obj.type === undefined || typeof obj.type === "string") &&
    (obj.format === undefined || typeof obj.format === "string") &&
    (obj.example === undefined || typeof obj.example === "string") &&
    (obj.deprecated === undefined || typeof obj.deprecated === "boolean")
  );
}

/**
 * Validates if an object is a valid HeaderParameter
 */
export function isHeaderParameter(obj: any): obj is HeaderParameter {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.key === "string" &&
    typeof obj.value === "string" &&
    (obj.description === undefined || typeof obj.description === "string") &&
    (obj.required === undefined || typeof obj.required === "boolean") &&
    (obj.type === undefined || typeof obj.type === "string") &&
    typeof obj.in === "string" &&
    isValidParameterLocation(obj.in) &&
    (obj.deprecated === undefined || typeof obj.deprecated === "boolean")
  );
}

/**
 * Validates if an object is a valid FormDataField
 */
export function isFormDataField(obj: any): obj is FormDataField {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.key === "string" &&
    typeof obj.value === "string" &&
    typeof obj.type === "string" &&
    isValidFormFieldType(obj.type) &&
    typeof obj.required === "boolean" &&
    (obj.description === undefined || typeof obj.description === "string") &&
    (obj.placeholder === undefined || typeof obj.placeholder === "string") &&
    (obj.validation === undefined || typeof obj.validation === "object")
  );
}

/**
 * Validates if an object is a valid Variable
 */
export function isVariable(obj: any): obj is Variable {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.key === "string" &&
    typeof obj.value === "string" &&
    (obj.description === undefined || typeof obj.description === "string") &&
    (obj.type === undefined || typeof obj.type === "string") &&
    (obj.isGlobal === undefined || typeof obj.isGlobal === "boolean") &&
    (obj.isSecret === undefined || typeof obj.isSecret === "boolean") &&
    (obj.lastModified === undefined || typeof obj.lastModified === "string") &&
    (obj.tags === undefined || Array.isArray(obj.tags))
  );
}

/**
 * Validates if an object is a valid TestCase
 */
export function isTestCase(obj: any): obj is TestCase {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    (obj.name === undefined || typeof obj.name === "string") &&
    (obj.description === undefined || typeof obj.description === "string") &&
    (obj.bodyOverride === undefined || typeof obj.bodyOverride === "string") &&
    (obj.pathOverrides === undefined ||
      typeof obj.pathOverrides === "object") &&
    (obj.queryOverrides === undefined ||
      typeof obj.queryOverrides === "object") &&
    (obj.headerOverrides === undefined ||
      typeof obj.headerOverrides === "object") &&
    typeof obj.expectedStatus === "string" &&
    isValidHTTPStatusCode(obj.expectedStatus) &&
    (obj.expectedResponse === undefined ||
      typeof obj.expectedResponse === "string") &&
    (obj.expectedPartialResponse === undefined ||
      typeof obj.expectedPartialResponse === "boolean") &&
    (obj.expectedResponseSchema === undefined ||
      typeof obj.expectedResponseSchema === "object") &&
    (obj.lastResult === undefined || isValidTestResult(obj.lastResult)) &&
    (obj.lastRun === undefined || typeof obj.lastRun === "string") &&
    (obj.executionTime === undefined ||
      typeof obj.executionTime === "number") &&
    (obj.useToken === undefined || typeof obj.useToken === "boolean") &&
    (obj.serverResponse === undefined ||
      typeof obj.serverResponse === "string") &&
    (obj.serverStatusCode === undefined ||
      typeof obj.serverStatusCode === "number") &&
    (obj.includeInAIPrompt === undefined ||
      typeof obj.includeInAIPrompt === "boolean") &&
    (obj.tags === undefined || Array.isArray(obj.tags)) &&
    (obj.priority === undefined || isValidPriority(obj.priority)) &&
    (obj.timeout === undefined || typeof obj.timeout === "number") &&
    (obj.retryCount === undefined || typeof obj.retryCount === "number") &&
    (obj.dependencies === undefined || Array.isArray(obj.dependencies))
  );
}

/**
 * Validates if an object is a valid URLData
 */
export function isURLData(obj: any): obj is URLData {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.baseURL === "string" &&
    typeof obj.segments === "string" &&
    Array.isArray(obj.parsedSegments) &&
    obj.parsedSegments.every((segment: any) => isURLSegment(segment)) &&
    Array.isArray(obj.queryParams) &&
    obj.queryParams.every((param: any) => isQueryParameter(param)) &&
    Array.isArray(obj.segmentVariables) &&
    obj.segmentVariables.every((variable: any) => isVariable(variable)) &&
    typeof obj.processedURL === "string" &&
    typeof obj.domain === "string" &&
    typeof obj.protocol === "string" &&
    isValidProtocol(obj.protocol) &&
    typeof obj.builtUrl === "string" &&
    typeof obj.environment === "string" &&
    isValidEnvironment(obj.environment) &&
    (obj.sessionDescription === undefined ||
      typeof obj.sessionDescription === "string") &&
    (obj.metadata === undefined || typeof obj.metadata === "object")
  );
}

/**
 * Validates if an object is a valid RequestConfigData
 */
export function isRequestConfigData(obj: any): obj is RequestConfigData {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.method === "string" &&
    isValidHTTPMethod(obj.method) &&
    Array.isArray(obj.queryParams) &&
    obj.queryParams.every((param: any) => isQueryParameter(param)) &&
    Array.isArray(obj.headers) &&
    obj.headers.every((header: any) => isHeaderParameter(header)) &&
    typeof obj.bodyType === "string" &&
    isValidRequestBodyType(obj.bodyType) &&
    (obj.jsonBody === undefined || typeof obj.jsonBody === "string") &&
    (obj.formData === undefined || Array.isArray(obj.formData)) &&
    (obj.formData === undefined ||
      obj.formData.every((field: any) => isFormDataField(field))) &&
    (obj.textBody === undefined || typeof obj.textBody === "string") &&
    (obj.xmlBody === undefined || typeof obj.xmlBody === "string") &&
    (obj.body === undefined || typeof obj.body === "object") &&
    (obj.timeout === undefined || typeof obj.timeout === "number") &&
    (obj.retryConfig === undefined || typeof obj.retryConfig === "object") &&
    (obj.metadata === undefined || typeof obj.metadata === "object")
  );
}

/**
 * Validates if an object is a valid ExtendedSession
 */
export function isExtendedSession(obj: any): obj is ExtendedSession {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.timestamp === "string" &&
    (obj.category === undefined || typeof obj.category === "string") &&
    (obj.urlData === undefined || isURLData(obj.urlData)) &&
    (obj.requestConfig === undefined ||
      isRequestConfigData(obj.requestConfig)) &&
    (obj.yamlOutput === undefined || typeof obj.yamlOutput === "string") &&
    (obj.segmentVariables === undefined ||
      typeof obj.segmentVariables === "object") &&
    (obj.sharedVariables === undefined ||
      typeof obj.sharedVariables === "object") &&
    (obj.activeSection === undefined ||
      typeof obj.activeSection === "string") &&
    (obj.responseConditions === undefined ||
      Array.isArray(obj.responseConditions)) &&
    (obj.responseConditions === undefined ||
      obj.responseConditions.every((condition: any) =>
        isResponseCondition(condition)
      )) &&
    (obj.includeToken === undefined || typeof obj.includeToken === "boolean") &&
    (obj.requirements === undefined || typeof obj.requirements === "string") &&
    (obj.tests === undefined || Array.isArray(obj.tests)) &&
    (obj.tests === undefined ||
      obj.tests.every((test: any) => isTestCase(test))) &&
    (obj.customResponse === undefined ||
      typeof obj.customResponse === "string") &&
    (obj.metadata === undefined || typeof obj.metadata === "object") &&
    (obj.statistics === undefined || typeof obj.statistics === "object")
  );
}

/**
 * Validates if an object is a valid APIResponse
 */
export function isAPIResponse(obj: any): obj is APIResponse {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.status === "number" &&
    typeof obj.statusText === "string" &&
    typeof obj.headers === "object" &&
    typeof obj.body !== "undefined" &&
    typeof obj.responseTime === "number" &&
    typeof obj.timestamp === "string" &&
    (obj.size === undefined || typeof obj.size === "number") &&
    (obj.url === undefined || typeof obj.url === "string") &&
    (obj.method === undefined || typeof obj.method === "string")
  );
}

/**
 * Validates if an object is a valid APIError
 */
export function isAPIError(obj: any): obj is APIError {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.message === "string" &&
    (obj.code === undefined || typeof obj.code === "string") &&
    (obj.status === undefined || typeof obj.status === "number") &&
    typeof obj.timestamp === "string" &&
    (obj.context === undefined || typeof obj.context === "object") &&
    (obj.stack === undefined || typeof obj.stack === "string") &&
    (obj.userMessage === undefined || typeof obj.userMessage === "string")
  );
}

/**
 * Validates if an object is a valid ValidationResult
 */
export function isValidationResult(obj: any): obj is ValidationResult {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.isValid === "boolean" &&
    Array.isArray(obj.errors) &&
    obj.errors.every((error: any) => typeof error === "string") &&
    Array.isArray(obj.warnings) &&
    obj.warnings.every((warning: any) => typeof warning === "string") &&
    (obj.field === undefined || typeof obj.field === "string") &&
    obj.value !== undefined // value can be any type
  );
}

/**
 * Validates if an object is a valid SearchResult
 */
export function isSearchResult(obj: any): obj is SearchResult {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.type === "string" &&
    ["session", "test", "variable", "header", "query"].includes(obj.type) &&
    typeof obj.title === "string" &&
    (obj.description === undefined || typeof obj.description === "string") &&
    typeof obj.relevance === "number" &&
    obj.relevance >= 0 &&
    obj.relevance <= 1 &&
    (obj.tags === undefined || Array.isArray(obj.tags)) &&
    (obj.timestamp === undefined || typeof obj.timestamp === "string") &&
    (obj.metadata === undefined || typeof obj.metadata === "object")
  );
}

/**
 * Validates if an object is a valid ExportConfig
 */
export function isExportConfig(obj: any): obj is ExportConfig {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.format === "string" &&
    ["json", "yaml", "xml", "csv"].includes(obj.format) &&
    (obj.includeMetadata === undefined ||
      typeof obj.includeMetadata === "boolean") &&
    (obj.includeTests === undefined || typeof obj.includeTests === "boolean") &&
    (obj.includeVariables === undefined ||
      typeof obj.includeVariables === "boolean") &&
    (obj.includeHistory === undefined ||
      typeof obj.includeHistory === "boolean") &&
    (obj.compression === undefined || typeof obj.compression === "boolean") &&
    (obj.encryption === undefined || typeof obj.encryption === "object")
  );
}

/**
 * Validates if an object is a valid ImportResult
 */
export function isImportResult(obj: any): obj is ImportResult {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.success === "boolean" &&
    typeof obj.importedCount === "number" &&
    Array.isArray(obj.errors) &&
    obj.errors.every((error: any) => typeof error === "string") &&
    Array.isArray(obj.warnings) &&
    obj.warnings.every((warning: any) => typeof warning === "string") &&
    Array.isArray(obj.conflicts) &&
    obj.conflicts.every(
      (conflict: any) =>
        typeof conflict === "object" &&
        typeof conflict.type === "string" &&
        ["session", "variable", "test"].includes(conflict.type) &&
        typeof conflict.name === "string" &&
        typeof conflict.action === "string" &&
        ["skip", "overwrite", "rename"].includes(conflict.action)
    ) &&
    (obj.metadata === undefined || typeof obj.metadata === "object")
  );
}

/**
 * Validates an array of objects against a type guard
 */
export function validateArray<T>(
  arr: any[],
  guard: (item: any) => item is T
): arr is T[] {
  return Array.isArray(arr) && arr.every(guard);
}

/**
 * Validates an object with optional properties
 */
export function validateOptional<T>(
  obj: any,
  guard: (item: any) => item is T
): obj is T | undefined {
  return obj === undefined || guard(obj);
}

/**
 * Creates a type guard for objects with required and optional properties
 */
export function createObjectGuard<T>(
  requiredGuards: Record<string, (value: any) => boolean>,
  optionalGuards: Record<string, (value: any) => boolean> = {}
): (obj: any) => obj is T {
  return (obj: any): obj is T => {
    if (!obj || typeof obj !== "object") return false;

    // Check required properties
    for (const [key, guard] of Object.entries(requiredGuards)) {
      if (!(key in obj) || !guard(obj[key])) return false;
    }

    // Check optional properties
    for (const [key, guard] of Object.entries(optionalGuards)) {
      if (key in obj && !guard(obj[key])) return false;
    }

    return true;
  };
}
