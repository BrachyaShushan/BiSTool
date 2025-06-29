import {
  AIProvider,
  AIConfig,
  LocalAIConfig,
  CustomProviderConfig,
  CustomProviderTemplate,
  CustomProviderManager,
} from "../types/components/components.types";

// AI Provider Registry with Expert Design
export class AIProviderRegistry {
  private providers: AIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Cloud AI Providers
    this.providers = [
      // OpenAI
      {
        id: "openai",
        name: "OpenAI",
        description: "Leading AI research company with GPT models",
        icon: "🤖",
        color: "#10a37f",
        isLocal: false,
        apiKeyField: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        headers: {
          "Content-Type": "application/json",
        },
        models: [
          {
            id: "gpt-4o",
            name: "GPT-4o",
            version: "2024-05-13",
            description: "Most capable GPT-4 model for complex reasoning",
            maxTokens: 128000,
            contextWindow: 128000,
            pricing: { input: 0.005, output: 0.015 },
            capabilities: ["code-generation", "reasoning", "analysis"],
            status: "active" as const,
          },
          {
            id: "gpt-4o-mini",
            name: "GPT-4o Mini",
            version: "2024-07-18",
            description: "Fast and efficient GPT-4 model",
            maxTokens: 128000,
            contextWindow: 128000,
            pricing: { input: 0.00015, output: 0.0006 },
            capabilities: ["code-generation", "reasoning"],
            status: "active" as const,
          },
          {
            id: "gpt-3.5-turbo",
            name: "GPT-3.5 Turbo",
            version: "2024-06-20",
            description: "Fast and cost-effective model",
            maxTokens: 16385,
            contextWindow: 16385,
            pricing: { input: 0.0005, output: 0.0015 },
            capabilities: ["code-generation", "text-generation"],
            status: "active" as const,
          },
        ],
        features: [
          {
            id: "code-generation",
            name: "Code Generation",
            description: "Generate high-quality code",
            isSupported: true,
            isPremium: false,
          },
          {
            id: "reasoning",
            name: "Reasoning",
            description: "Advanced reasoning capabilities",
            isSupported: true,
            isPremium: false,
          },
          {
            id: "function-calling",
            name: "Function Calling",
            description: "Call external functions",
            isSupported: true,
            isPremium: false,
          },
        ],
        pricing: {
          tier: "pay-as-you-go",
          rateLimit: 5000,
        },
        status: "active" as const,
      },

      // Anthropic
      {
        id: "anthropic",
        name: "Anthropic",
        description: "AI safety research company with Claude models",
        icon: "🧠",
        color: "#d97706",
        isLocal: false,
        apiKeyField: "anthropic_api_key",
        baseUrl: "https://api.anthropic.com",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        models: [
          {
            id: "claude-3-5-sonnet-20241022",
            name: "Claude 3.5 Sonnet",
            version: "2024-10-22",
            description: "Most capable Claude model for complex tasks",
            maxTokens: 200000,
            contextWindow: 200000,
            pricing: { input: 0.003, output: 0.015 },
            capabilities: [
              "code-generation",
              "reasoning",
              "analysis",
              "vision",
            ],
            status: "active" as const,
          },
          {
            id: "claude-3-5-haiku-20241022",
            name: "Claude 3.5 Haiku",
            version: "2024-10-22",
            description: "Fast and efficient Claude model",
            maxTokens: 200000,
            contextWindow: 200000,
            pricing: { input: 0.00025, output: 0.00125 },
            capabilities: ["code-generation", "reasoning"],
            status: "active" as const,
          },
        ],
        features: [
          {
            id: "code-generation",
            name: "Code Generation",
            description: "Generate high-quality code",
            isSupported: true,
            isPremium: false,
          },
          {
            id: "reasoning",
            name: "Reasoning",
            description: "Advanced reasoning capabilities",
            isSupported: true,
            isPremium: false,
          },
          {
            id: "vision",
            name: "Vision",
            description: "Image analysis capabilities",
            isSupported: true,
            isPremium: false,
          },
        ],
        pricing: {
          tier: "pay-as-you-go",
          rateLimit: 5000,
        },
        status: "active" as const,
      },

      // Google Gemini
      {
        id: "google",
        name: "Google Gemini",
        description: "Google's most capable AI model",
        icon: "🔮",
        color: "#4285f4",
        isLocal: false,
        apiKeyField: "google_api_key",
        baseUrl: "https://generativelanguage.googleapis.com",
        headers: {
          "Content-Type": "application/json",
        },
        models: [
          {
            id: "gemini-1.5-pro",
            name: "Gemini 1.5 Pro",
            version: "1.5",
            description: "Most capable Gemini model",
            maxTokens: 1000000,
            contextWindow: 1000000,
            pricing: { input: 0.0035, output: 0.0105 },
            capabilities: [
              "code-generation",
              "reasoning",
              "analysis",
              "vision",
            ],
            status: "active" as const,
          },
          {
            id: "gemini-1.5-flash",
            name: "Gemini 1.5 Flash",
            version: "1.5",
            description: "Fast and efficient Gemini model",
            maxTokens: 1000000,
            contextWindow: 1000000,
            pricing: { input: 0.000075, output: 0.0003 },
            capabilities: ["code-generation", "reasoning"],
            status: "active" as const,
          },
        ],
        features: [
          {
            id: "code-generation",
            name: "Code Generation",
            description: "Generate high-quality code",
            isSupported: true,
            isPremium: false,
          },
          {
            id: "reasoning",
            name: "Reasoning",
            description: "Advanced reasoning capabilities",
            isSupported: true,
            isPremium: false,
          },
          {
            id: "vision",
            name: "Vision",
            description: "Image analysis capabilities",
            isSupported: true,
            isPremium: false,
          },
        ],
        pricing: {
          tier: "pay-as-you-go",
          rateLimit: 15000,
        },
        status: "active" as const,
      },

      // Local AI Providers
      {
        id: "ollama",
        name: "Ollama",
        description: "Local AI models for privacy and offline use",
        icon: "🏠",
        color: "#059669",
        isLocal: true,
        apiKeyField: "ollama_api_key",
        baseUrl: "http://localhost:11434",
        headers: {
          "Content-Type": "application/json",
        },
        models: [
          {
            id: "llama3.2:3b",
            name: "Llama 3.2 3B",
            version: "3.2",
            description: "Fast local model for basic tasks",
            maxTokens: 8192,
            contextWindow: 8192,
            pricing: { input: 0, output: 0 },
            capabilities: ["code-generation", "text-generation"],
            status: "active" as const,
          },
          {
            id: "llama3.2:7b",
            name: "Llama 3.2 7B",
            version: "3.2",
            description: "Balanced local model",
            maxTokens: 8192,
            contextWindow: 8192,
            pricing: { input: 0, output: 0 },
            capabilities: ["code-generation", "text-generation"],
            status: "active" as const,
          },
          {
            id: "codellama:7b",
            name: "Code Llama 7B",
            version: "7b",
            description: "Specialized for code generation",
            maxTokens: 16384,
            contextWindow: 16384,
            pricing: { input: 0, output: 0 },
            capabilities: ["code-generation"],
            status: "active" as const,
          },
        ],
        features: [
          {
            id: "code-generation",
            name: "Code Generation",
            description: "Generate high-quality code",
            isSupported: true,
            isPremium: false,
          },
          {
            id: "privacy",
            name: "Privacy",
            description: "Local processing, no data sent to cloud",
            isSupported: true,
            isPremium: false,
          },
          {
            id: "offline",
            name: "Offline",
            description: "Works without internet connection",
            isSupported: true,
            isPremium: false,
          },
        ],
        pricing: {
          tier: "free",
        },
        status: "active" as const,
      },

      // Custom OpenAI-Compatible
      {
        id: "openai-compatible",
        name: "OpenAI-Compatible",
        description: "Custom OpenAI-compatible API endpoints",
        icon: "🔧",
        color: "#7c3aed",
        isLocal: true,
        apiKeyField: "custom_api_key",
        baseUrl: "",
        headers: {
          "Content-Type": "application/json",
        },
        models: [
          {
            id: "custom-model",
            name: "Custom Model",
            version: "1.0",
            description: "Custom model configuration",
            maxTokens: 4096,
            contextWindow: 4096,
            pricing: { input: 0, output: 0 },
            capabilities: ["code-generation", "text-generation"],
            status: "active" as const,
          },
        ],
        features: [
          {
            id: "code-generation",
            name: "Code Generation",
            description: "Generate high-quality code",
            isSupported: true,
            isPremium: false,
          },
          {
            id: "custom-endpoint",
            name: "Custom Endpoint",
            description: "Use your own API endpoint",
            isSupported: true,
            isPremium: false,
          },
        ],
        pricing: {
          tier: "free",
        },
        status: "active" as const,
      },
    ];
  }

  // Expert Design Methods
  getProvider(id: string): AIProvider | undefined {
    const builtInProvider = this.providers.find((p) => p.id === id);
    if (builtInProvider) return builtInProvider;

    // Check custom providers
    return customProviderManager.getProvider(id);
  }

  getLocalProviders(): AIProvider[] {
    const builtInLocal = this.providers.filter((p) => p.isLocal);
    const customLocal = customProviderManager
      .getCustomProviders()
      .filter((p) => p.isLocal);
    return [...builtInLocal, ...customLocal];
  }

  getCloudProviders(): AIProvider[] {
    const builtInCloud = this.providers.filter((p) => !p.isLocal);
    const customCloud = customProviderManager
      .getCustomProviders()
      .filter((p) => !p.isLocal);
    return [...builtInCloud, ...customCloud];
  }

  getAllProviders(): AIProvider[] {
    return [...this.providers, ...customProviderManager.getAllProviders()];
  }

  getProviderByApiKeyField(apiKeyField: string): AIProvider | undefined {
    return this.providers.find((p) => p.apiKeyField === apiKeyField);
  }

  validateConfig(config: AIConfig): boolean {
    const provider = this.getProvider(config.provider);
    if (!provider) return false;

    const model = provider.models.find((m) => m.id === config.model);
    if (!model) return false;

    // Check if API key is required and provided for the current provider
    if (!provider.isLocal) {
      const apiKey = config.apiKeys[config.provider];
      if (!apiKey) return false;
    }

    if (config.maxTokens > model.maxTokens) return false;

    return true;
  }

  getDefaultConfig(providerId: string): AIConfig | null {
    const provider = this.getProvider(providerId);
    if (!provider || provider.models.length === 0) return null;

    const defaultModel = provider.models[0];
    if (!defaultModel) return null;

    return {
      provider: providerId,
      model: defaultModel.id,
      apiKeys: {}, // Empty object to store API keys for each provider
      baseUrl: provider.baseUrl || "",
      customHeaders: provider.headers || {},
      maxTokens: Math.min(4000, defaultModel.maxTokens),
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    };
  }

  // Local AI Configuration Helpers
  getLocalAIConfig(providerId: string): LocalAIConfig | null {
    const provider = this.getProvider(providerId);
    if (!provider || !provider.isLocal) return null;

    switch (providerId) {
      case "ollama":
        return {
          type: "ollama",
          baseUrl: "http://localhost:11434",
          models: provider.models.map((m) => m.id),
          timeout: 30000,
          retryAttempts: 3,
        };
      case "openai-compatible":
        return {
          type: "openai-compatible",
          baseUrl: "http://localhost:8000",
          apiKey: "",
          models: provider.models.map((m) => m.id),
          customHeaders: {},
          timeout: 30000,
          retryAttempts: 3,
        };
      default:
        return null;
    }
  }

  // Cost Calculation
  calculateCost(
    providerId: string,
    modelId: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const provider = this.getProvider(providerId);
    if (!provider) return 0;

    const model = provider.models.find((m) => m.id === modelId);
    if (!model) return 0;

    const inputCost = (inputTokens / 1000) * model.pricing.input;
    const outputCost = (outputTokens / 1000) * model.pricing.output;
    return inputCost + outputCost;
  }

  // Provider Status and Health
  async checkProviderHealth(
    providerId: string,
    config: AIConfig
  ): Promise<boolean> {
    const provider = this.getProvider(providerId);
    if (!provider) return false;

    try {
      const response = await fetch(
        `${config.baseUrl || provider.baseUrl}/health`,
        {
          method: "GET",
          headers: config.customHeaders || provider.headers || {},
          signal: AbortSignal.timeout(config.timeout),
        }
      );
      return response.ok;
    } catch (error) {
      console.error(`Health check failed for ${providerId}:`, error);
      return false;
    }
  }
}

// Global AI Provider Registry Instance
export const aiProviderRegistry = new AIProviderRegistry();

// Default AI Configuration
export const getDefaultAIConfig = (): AIConfig => {
  return (
    aiProviderRegistry.getDefaultConfig("anthropic") || {
      provider: "anthropic",
      model: "claude-3-5-haiku-20241022",
      apiKeys: {}, // Empty object to store API keys for each provider
      baseUrl: "https://api.anthropic.com",
      customHeaders: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      maxTokens: 4000,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    }
  );
};

// AI Configuration Validation
export const validateAIConfig = (
  config: AIConfig
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.provider) errors.push("Provider is required");
  if (!config.model) errors.push("Model is required");

  // Check if API key is required and provided for the current provider
  const provider = aiProviderRegistry.getProvider(config.provider);
  if (provider && !provider.isLocal) {
    const apiKey = config.apiKeys[config.provider];
    if (!apiKey) {
      errors.push(`API key is required for ${provider.name}`);
    }
  }

  if (config.maxTokens <= 0) errors.push("Max tokens must be greater than 0");
  if (config.temperature < 0 || config.temperature > 2)
    errors.push("Temperature must be between 0 and 2");
  if (config.timeout <= 0) errors.push("Timeout must be greater than 0");

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Custom Provider Manager Implementation
export class CustomProviderManagerImpl implements CustomProviderManager {
  private customProviders: AIProvider[] = [];
  private customTemplates: CustomProviderTemplate[] = [];

  constructor() {
    this.initializeTemplates();
    this.loadCustomProviders();
  }

  private initializeTemplates(): void {
    this.customTemplates = [
      {
        id: "openai-compatible",
        name: "OpenAI-Compatible",
        description: "For providers that follow OpenAI's API format",
        category: "openai-compatible",
        icon: "🤖",
        color: "#10a37f",
        config: {
          apiEndpoint: "/v1/chat/completions",
          requestFormat: "openai",
          responseFormat: "openai",
          authMethod: "api_key",
          authHeader: "Authorization",
          authPrefix: "Bearer ",
          modelsEndpoint: "/v1/models",
          healthEndpoint: "/health",
          supportedFeatures: ["chat", "completion", "function-calling"],
        },
        defaultModels: [
          {
            id: "gpt-4",
            name: "GPT-4",
            version: "4.0",
            description: "Advanced language model",
            maxTokens: 8192,
            contextWindow: 8192,
            pricing: { input: 0.03, output: 0.06 },
            capabilities: ["chat", "completion"],
            status: "active",
          },
        ],
        documentation:
          "Configure your OpenAI-compatible provider with the standard chat completions endpoint.",
        examples: [
          "https://api.openai.com/v1/chat/completions",
          "https://api.anthropic.com/v1/messages",
        ],
      },
      {
        id: "anthropic-compatible",
        name: "Anthropic-Compatible",
        description: "For providers that follow Anthropic's Claude API format",
        category: "anthropic-compatible",
        icon: "🧠",
        color: "#d97706",
        config: {
          apiEndpoint: "/v1/messages",
          requestFormat: "anthropic",
          responseFormat: "anthropic",
          authMethod: "api_key",
          authHeader: "x-api-key",
          customHeaders: {
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          modelsEndpoint: "/v1/models",
          healthEndpoint: "/health",
          supportedFeatures: ["chat", "completion"],
        },
        defaultModels: [
          {
            id: "claude-3",
            name: "Claude 3",
            version: "3.0",
            description: "Advanced AI assistant",
            maxTokens: 200000,
            contextWindow: 200000,
            pricing: { input: 0.003, output: 0.015 },
            capabilities: ["chat", "completion"],
            status: "active",
          },
        ],
        documentation:
          "Configure your Anthropic-compatible provider with the messages endpoint.",
      },
      {
        id: "google-compatible",
        name: "Google-Compatible",
        description: "For providers that follow Google's Gemini API format",
        category: "google-compatible",
        icon: "🔮",
        color: "#4285f4",
        config: {
          apiEndpoint: "/v1beta/models/{model}:generateContent",
          requestFormat: "google",
          responseFormat: "google",
          authMethod: "api_key",
          authHeader: "x-goog-api-key",
          modelsEndpoint: "/v1beta/models",
          healthEndpoint: "/health",
          supportedFeatures: ["chat", "completion", "vision"],
        },
        defaultModels: [
          {
            id: "gemini-pro",
            name: "Gemini Pro",
            version: "1.0",
            description: "Google's most capable model",
            maxTokens: 1000000,
            contextWindow: 1000000,
            pricing: { input: 0.0035, output: 0.0105 },
            capabilities: ["chat", "completion", "vision"],
            status: "active",
          },
        ],
        documentation:
          "Configure your Google-compatible provider with the generateContent endpoint.",
      },
      {
        id: "custom-format",
        name: "Custom Format",
        description: "For providers with completely custom API formats",
        category: "custom",
        icon: "⚙️",
        color: "#6b7280",
        config: {
          apiEndpoint: "/api/chat",
          requestFormat: "custom",
          responseFormat: "custom",
          authMethod: "custom",
          customHeaders: {},
          supportedFeatures: ["chat"],
        },
        defaultModels: [
          {
            id: "custom-model",
            name: "Custom Model",
            version: "1.0",
            description: "Your custom AI model",
            maxTokens: 4000,
            contextWindow: 4000,
            pricing: { input: 0, output: 0 },
            capabilities: ["chat"],
            status: "active",
          },
        ],
        documentation:
          "Configure your custom provider with a completely custom API format.",
      },
    ];
  }

  private loadCustomProviders(): void {
    try {
      const saved = localStorage.getItem("custom_ai_providers");
      if (saved) {
        this.customProviders = JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load custom providers:", error);
    }
  }

  private saveCustomProviders(): void {
    try {
      localStorage.setItem(
        "custom_ai_providers",
        JSON.stringify(this.customProviders)
      );
    } catch (error) {
      console.error("Failed to save custom providers:", error);
    }
  }

  get providers(): AIProvider[] {
    return this.customProviders;
  }

  get templates(): CustomProviderTemplate[] {
    return this.customTemplates;
  }

  addProvider(provider: AIProvider): void {
    provider.isCustom = true;
    this.customProviders.push(provider);
    this.saveCustomProviders();
  }

  removeProvider(id: string): void {
    this.customProviders = this.customProviders.filter((p) => p.id !== id);
    this.saveCustomProviders();
  }

  updateProvider(id: string, provider: AIProvider): void {
    const index = this.customProviders.findIndex((p) => p.id === id);
    if (index !== -1) {
      provider.isCustom = true;
      this.customProviders[index] = provider;
      this.saveCustomProviders();
    }
  }

  getProvider(id: string): AIProvider | undefined {
    return this.customProviders.find((p) => p.id === id);
  }

  getAllProviders(): AIProvider[] {
    return this.customProviders;
  }

  getCustomProviders(): AIProvider[] {
    return this.customProviders;
  }

  validateProvider(provider: AIProvider): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!provider.id) errors.push("Provider ID is required");
    if (!provider.name) errors.push("Provider name is required");
    if (!provider.apiKeyField) errors.push("API key field is required");
    if (!provider.models || provider.models.length === 0) {
      errors.push("At least one model is required");
    }

    if (provider.customConfig) {
      if (!provider.customConfig.apiEndpoint) {
        errors.push("API endpoint is required");
      }
      if (!provider.customConfig.requestFormat) {
        errors.push("Request format is required");
      }
      if (!provider.customConfig.responseFormat) {
        errors.push("Response format is required");
      }
      if (!provider.customConfig.authMethod) {
        errors.push("Auth method is required");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async testProvider(provider: AIProvider, config: AIConfig): Promise<boolean> {
    try {
      if (!provider.customConfig) return false;

      const testUrl = `${config.baseUrl || provider.baseUrl}${
        provider.customConfig.healthEndpoint || "/health"
      }`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...provider.customConfig.customHeaders,
      };

      // Add authentication
      if (provider.customConfig.authMethod === "api_key") {
        const apiKey = config.apiKeys[provider.id];
        if (apiKey) {
          const headerName =
            provider.customConfig.authHeader || "Authorization";
          const prefix = provider.customConfig.authPrefix || "";
          headers[headerName] = `${prefix}${apiKey}`;
        }
      }

      const response = await fetch(testUrl, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(config.timeout || 30000),
      });

      return response.ok;
    } catch (error) {
      console.error("Provider test failed:", error);
      return false;
    }
  }

  exportProviders(): string {
    return JSON.stringify(this.customProviders, null, 2);
  }

  importProviders(data: string): { success: boolean; errors: string[] } {
    try {
      const providers = JSON.parse(data);
      if (!Array.isArray(providers)) {
        return {
          success: false,
          errors: ["Invalid format: expected array of providers"],
        };
      }

      const errors: string[] = [];
      const validProviders: AIProvider[] = [];

      for (const provider of providers) {
        const validation = this.validateProvider(provider);
        if (validation.isValid) {
          validProviders.push(provider);
        } else {
          errors.push(
            `Provider ${provider.name || provider.id}: ${validation.errors.join(
              ", "
            )}`
          );
        }
      }

      if (validProviders.length > 0) {
        this.customProviders = [...this.customProviders, ...validProviders];
        this.saveCustomProviders();
      }

      return {
        success: validProviders.length > 0,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        errors: ["Failed to parse providers data"],
      };
    }
  }

  createProviderFromTemplate(
    template: CustomProviderTemplate,
    customConfig: Partial<CustomProviderConfig>
  ): AIProvider {
    const id = `custom-${Date.now()}`;
    const config = { ...template.config, ...customConfig };

    return {
      id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
      isLocal: false,
      isCustom: true,
      models: template.defaultModels,
      apiKeyField: "api_key",
      baseUrl: "",
      headers: config.customHeaders || {},
      features:
        config.supportedFeatures?.map((feature) => ({
          id: feature,
          name: feature,
          description: `Supports ${feature}`,
          isSupported: true,
          isPremium: false,
        })) || [],
      pricing: {
        tier: "pay-as-you-go",
      },
      status: "active",
      customConfig: config,
    };
  }
}

// Global Custom Provider Manager Instance
export const customProviderManager = new CustomProviderManagerImpl();
