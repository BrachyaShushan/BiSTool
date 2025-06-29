import {
  URLData,
  RequestConfigData,
  QueryParam,
  Header,
  FormDataField,
} from "../core/app.types";

export interface URLBuilderProps {
  onSubmit: (data: URLData) => void;
}

export interface RequestConfigProps {
  onSubmit: (data: RequestConfigData) => void;
}

export interface TestManagerProps {
  onSubmit?: (data: any) => void;
}

export interface YAMLGeneratorProps {
  onGenerate: (yaml: string) => void;
}

export interface AITestGeneratorProps {
  yamlData: string;
  aiConfig?: AIConfig;
  testConfig?: Partial<AITestGeneratorConfig>;
  onConfigChange?: (config: AITestGeneratorConfig) => void;
  onTestGenerated?: (test: string, metadata: any) => void;
}

export interface SavedManagerProps {
  // Add saved manager specific props here
  [key: string]: any;
}

export interface EditorRef {
  current: any; // Monaco editor type
}

export interface EditorMountParams {
  editor: any; // Monaco editor instance
  monaco: {
    languages: {
      register: (options: { id: string }) => void;
      setMonarchTokensProvider: (languageId: string, provider: any) => void;
    };
  };
}

export interface AnthropicResponse {
  content: Array<{
    text?: string;
    type: string;
  }>;
  role: string;
  _request_id?: string | null;
}

export interface RequestConfigState {
  activeTab: "params" | "headers" | "body";
  queryParams: QueryParam[];
  headers: Header[];
  method: string;
  bodyType: "none" | "json" | "form";
  jsonBody: string;
  formData: FormDataField[];
  tokenExpiration: number | null;
}

// AI Provider Types
export interface AIProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isLocal: boolean;
  isCustom?: boolean; // New field to identify custom providers
  models: AIModel[];
  apiKeyField: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  features: AIFeature[];
  pricing?: AIPricing;
  status: "active" | "beta" | "deprecated";
  // Custom provider specific fields
  customConfig?: CustomProviderConfig;
}

export interface AIModel {
  id: string;
  name: string;
  version: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  pricing: {
    input: number; // per 1K tokens
    output: number; // per 1K tokens
  };
  capabilities: string[];
  status: "active" | "beta" | "deprecated";
}

export interface AIFeature {
  id: string;
  name: string;
  description: string;
  isSupported: boolean;
  isPremium: boolean;
}

export interface AIPricing {
  tier: "free" | "pay-as-you-go" | "pro" | "enterprise";
  monthlyLimit?: number;
  rateLimit?: number;
}

export interface AIConfig {
  provider: string;
  model: string;
  apiKeys: Record<string, string>; // Store API keys for each provider separately
  baseUrl?: string;
  customHeaders?: Record<string, string>;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface AITestGeneratorConfig {
  aiConfig: AIConfig;
  testFramework: "pytest" | "unittest" | "jest" | "mocha";
  testStyle: "bdd" | "tdd" | "functional";
  codeStyle: "oop" | "functional";
  language: "python" | "javascript" | "typescript" | "java";
  outputFormat: "code" | "markdown" | "json";
  includeExamples: boolean;
  includeEdgeCases: boolean;
  includePerformanceTests: boolean;
  includeSecurityTests: boolean;
  customPrompts?: Record<string, string>;
}

// AI Response Types
export interface AIResponse {
  content: string;
  metadata: {
    provider: string;
    model: string;
    tokensUsed: number;
    responseTime: number;
    cost?: number;
  };
  error?: string;
}

// Local AI Configuration
export interface LocalAIConfig {
  type: "ollama" | "openai-compatible" | "anthropic-compatible" | "custom";
  baseUrl: string;
  apiKey?: string;
  models: string[];
  customHeaders?: Record<string, string>;
  timeout: number;
  retryAttempts: number;
}

// AI Provider Registry
export interface AIProviderRegistry {
  providers: AIProvider[];
  getProvider: (id: string) => AIProvider | undefined;
  getLocalProviders: () => AIProvider[];
  getCloudProviders: () => AIProvider[];
  validateConfig: (config: AIConfig) => boolean;
}

// Custom Provider Configuration
export interface CustomProviderConfig {
  apiEndpoint: string;
  requestFormat: "openai" | "anthropic" | "google" | "custom";
  responseFormat: "openai" | "anthropic" | "google" | "custom";
  authMethod: "api_key" | "bearer" | "custom";
  authHeader?: string;
  authPrefix?: string;
  modelEndpoint?: string;
  modelsEndpoint?: string;
  healthEndpoint?: string;
  customHeaders?: Record<string, string>;
  requestTemplate?: string;
  responseParser?: string;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  supportedFeatures?: string[];
}

// Custom Model Configuration
export interface CustomModelConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  pricing: {
    input: number;
    output: number;
  };
  capabilities: string[];
  status: "active" | "beta" | "deprecated";
  customFields?: Record<string, any>;
}

// Custom Provider Template
export interface CustomProviderTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "openai-compatible"
    | "anthropic-compatible"
    | "google-compatible"
    | "custom";
  icon: string;
  color: string;
  config: CustomProviderConfig;
  defaultModels: CustomModelConfig[];
  documentation?: string;
  examples?: string[];
}

// Custom Provider Management
export interface CustomProviderManager {
  providers: AIProvider[];
  templates: CustomProviderTemplate[];
  addProvider: (provider: AIProvider) => void;
  removeProvider: (id: string) => void;
  updateProvider: (id: string, provider: AIProvider) => void;
  getProvider: (id: string) => AIProvider | undefined;
  getAllProviders: () => AIProvider[];
  getCustomProviders: () => AIProvider[];
  validateProvider: (provider: AIProvider) => {
    isValid: boolean;
    errors: string[];
  };
  testProvider: (provider: AIProvider, config: AIConfig) => Promise<boolean>;
  exportProviders: () => string;
  importProviders: (data: string) => { success: boolean; errors: string[] };
}
