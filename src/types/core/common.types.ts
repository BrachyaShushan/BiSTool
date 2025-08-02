// Re-export shared types for convenience
export * from "../../types/shared";

// Additional common types used across the application

/**
 * Application modes
 */
export type AppMode = "basic" | "expert";

/**
 * Tab types for the unified manager
 */
export type TabType =
  | "sessions"
  | "variables"
  | "projects"
  | "settings"
  | "tests"
  | "import";

/**
 * Section identifiers for the application
 */
export type SectionId =
  | "url"
  | "request"
  | "tests"
  | "yaml"
  | "ai"
  | "import"
  | "json"
  | "variables"
  | "settings";

/**
 * Modal types for different operations
 */
export type ModalType =
  | "new"
  | "edit"
  | "delete"
  | "rename"
  | "duplicate"
  | "import"
  | "export";

/**
 * Modal sizes for responsive design
 */
export type ModalSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "9xl";

/**
 * Theme types
 */
export type Theme = "light" | "dark" | "auto";

/**
 * Loading states
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Save states
 */
export type SaveState = "saved" | "saving" | "unsaved" | "error";

/**
 * Notification types
 */
export type NotificationType = "success" | "error" | "warning" | "info";

/**
 * File types for import/export
 */
export type FileType = "json" | "yaml" | "xml" | "csv" | "txt" | "zip";

/**
 * Authentication types
 */
export type AuthType =
  | "none"
  | "basic"
  | "bearer"
  | "api_key"
  | "oauth2"
  | "jwt"
  | "session"
  | "custom";

/**
 * OAuth2 grant types
 */
export type OAuth2GrantType =
  | "authorization_code"
  | "client_credentials"
  | "password"
  | "implicit";

/**
 * API key locations
 */
export type APIKeyLocation = "header" | "query" | "cookie";

/**
 * Token extraction sources
 */
export type TokenSource =
  | "json"
  | "cookies"
  | "headers"
  | "response-text"
  | "set-cookie";

/**
 * Hash algorithms for security
 */
export type HashAlgorithm = "sha256" | "sha512" | "md5" | "bcrypt";

/**
 * Encryption algorithms
 */
export type EncryptionAlgorithm =
  | "aes-256-gcm"
  | "aes-256-cbc"
  | "chacha20-poly1305";

/**
 * Retry strategies
 */
export type RetryStrategy = "linear" | "exponential" | "custom";

/**
 * Backoff strategies
 */
export type BackoffStrategy = "fixed" | "exponential" | "fibonacci" | "custom";

/**
 * Log levels
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Test frameworks
 */
export type TestFramework =
  | "pytest"
  | "unittest"
  | "jest"
  | "mocha"
  | "cypress"
  | "playwright"
  | "rest-assured"
  | "junit"
  | "nunit"
  | "xunit"
  | "go-test"
  | "rspec"
  | "phpunit"
  | "dotnet-test";

/**
 * Test styles
 */
export type TestStyle =
  | "bdd"
  | "tdd"
  | "functional"
  | "integration"
  | "e2e"
  | "unit"
  | "api";

/**
 * Code styles
 */
export type CodeStyle = "oop" | "functional" | "procedural" | "declarative";

/**
 * Programming languages
 */
export type ProgrammingLanguage =
  | "python"
  | "javascript"
  | "typescript"
  | "java"
  | "csharp"
  | "go"
  | "ruby"
  | "php"
  | "rust"
  | "kotlin"
  | "swift"
  | "dart"
  | "scala"
  | "elixir"
  | "clojure"
  | "fsharp";

/**
 * Output formats
 */
export type OutputFormat = "code" | "markdown" | "json" | "yaml" | "xml";

/**
 * API environments
 */
export type APIEnvironment =
  | "rest"
  | "graphql"
  | "soap"
  | "grpc"
  | "websocket"
  | "event-driven"
  | "microservices";

/**
 * Response validation levels
 */
export type ResponseValidation = "strict" | "lenient" | "custom";

/**
 * Error handling levels
 */
export type ErrorHandling = "comprehensive" | "basic" | "minimal";

/**
 * Reporting formats
 */
export type ReportFormat =
  | "html"
  | "json"
  | "xml"
  | "junit"
  | "allure"
  | "custom";

/**
 * Data sources
 */
export type DataSource = "inline" | "file" | "database" | "api";

/**
 * Data formats
 */
export type DataFormat = "json" | "csv" | "xml" | "yaml";

/**
 * Execution strategies
 */
export type ExecutionStrategy = "thread" | "process" | "async";

/**
 * Priority levels
 */
export type Priority = "low" | "medium" | "high" | "critical";

/**
 * Complexity levels
 */
export type Complexity = "simple" | "moderate" | "complex";

/**
 * Status types
 */
export type Status =
  | "draft"
  | "active"
  | "archived"
  | "deprecated"
  | "pending"
  | "completed"
  | "failed";

/**
 * Generic result type for operations
 */
export interface Result<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Filter parameters
 */
export interface FilterParams {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "in"
    | "notIn";
  value: any;
}

/**
 * Search parameters
 */
export interface SearchParams {
  query: string;
  fields?: string[];
  filters?: FilterParams[];
  sort?: SortParams;
  pagination?: PaginationParams;
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Validation rule
 */
export interface ValidationRule {
  type:
    | "required"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "email"
    | "url"
    | "number"
    | "integer"
    | "boolean"
    | "custom";
  value?: any;
  message: string;
  field?: string;
}

/**
 * Form field configuration
 */
export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "textarea"
    | "checkbox"
    | "radio"
    | "file"
    | "date"
    | "datetime-local";
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  validation?: ValidationRule[];
  disabled?: boolean;
  hidden?: boolean;
  helpText?: string;
}

/**
 * Form configuration
 */
export interface FormConfig {
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  initialValues?: Record<string, any>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Table column configuration
 */
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex: keyof T;
  width?: number | string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
  ellipsis?: boolean;
}

/**
 * Table configuration
 */
export interface TableConfig<T = any> {
  columns: TableColumn<T>[];
  dataSource: T[];
  loading?: boolean;
  pagination?: PaginationParams;
  sort?: SortParams;
  filters?: FilterParams[];
  rowKey?: string | ((record: T) => string);
  rowSelection?: {
    type: "checkbox" | "radio";
    selectedRowKeys?: string[];
    onChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
  };
  onRow?: (
    record: T,
    index: number
  ) => {
    onClick?: () => void;
    onDoubleClick?: () => void;
    onContextMenu?: () => void;
  };
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

/**
 * Chart configuration
 */
export interface ChartConfig {
  type: "line" | "bar" | "pie" | "scatter" | "area" | "doughnut";
  data: ChartDataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

/**
 * Menu item configuration
 */
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  children?: MenuItem[];
  onClick?: () => void;
  badge?: string | number;
  divider?: boolean;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  key: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
  content: string | React.ReactNode;
  title?: string;
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "topLeft"
    | "topRight"
    | "bottomLeft"
    | "bottomRight";
  trigger?: "hover" | "click" | "focus";
  arrow?: boolean;
  delay?: number;
}

/**
 * Context menu item
 */
export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  onClick: () => void;
}

/**
 * Keyboard shortcut
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

/**
 * Drag and drop configuration
 */
export interface DragDropConfig {
  type: string;
  data: any;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  accept?: string[];
  disabled?: boolean;
}

/**
 * Resize configuration
 */
export interface ResizeConfig {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  onResize?: (width: number, height: number) => void;
  disabled?: boolean;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  type: "fade" | "slide" | "scale" | "rotate" | "custom";
  duration: number;
  easing?:
    | "linear"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "bounce"
    | "elastic";
  delay?: number;
  direction?: "in" | "out" | "in-out";
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    divider: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}
