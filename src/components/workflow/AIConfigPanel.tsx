import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAIConfigContext } from '../../context/AIConfigContext';
import {
    AIProvider,
    AIConfig,
    AIModel,
    CustomProviderTemplate
} from '../../types/components/components.types';
import {
    aiProviderRegistry,
    validateAIConfig,
    customProviderManager
} from '../../utils/aiProviders';
import {
    FiSettings,
    FiCpu,
    FiGlobe,
    FiHome,
    FiKey,
    FiCheck,
    FiAlertCircle,
    FiRefreshCw,
    FiChevronDown,
    FiChevronRight,
    FiX,
    FiPlus,
    FiEdit,
    FiTrash2,
    FiDownload,
    FiUpload,
    FiCode,
    FiZap,
} from 'react-icons/fi';

interface CustomProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingProvider: AIProvider | null;
    onSave: (provider: AIProvider) => void;
}

const CustomProviderModal: React.FC<CustomProviderModalProps> = ({
    isOpen,
    onClose,
    editingProvider,
    onSave,
}) => {
    const { isDarkMode } = useTheme();
    const [selectedTemplate, setSelectedTemplate] = useState<CustomProviderTemplate | null>(null);
    const [providerData, setProviderData] = useState<Partial<AIProvider>>({
        name: '',
        description: '',
        icon: '🤖',
        color: '#6b7280',
        apiKeyField: 'api_key',
        baseUrl: '',
        models: [],
        features: [],
        pricing: { tier: 'pay-as-you-go' },
        status: 'active',
        customConfig: {
            apiEndpoint: '',
            requestFormat: 'openai',
            responseFormat: 'openai',
            authMethod: 'api_key',
            authHeader: 'Authorization',
            authPrefix: 'Bearer ',
            customHeaders: {},
        },
    });

    useEffect(() => {
        if (editingProvider) {
            setProviderData(editingProvider);
            if (editingProvider.customConfig) {
                setSelectedTemplate(customProviderManager.templates.find(t =>
                    t.config.requestFormat === editingProvider.customConfig?.requestFormat
                ) || null);
            }
        }
    }, [editingProvider]);

    const handleTemplateSelect = (template: CustomProviderTemplate) => {
        setSelectedTemplate(template);
        setProviderData(prev => ({
            ...prev,
            name: template.name,
            description: template.description,
            icon: template.icon,
            color: template.color,
            models: template.defaultModels,
            features: template.config.supportedFeatures?.map(feature => ({
                id: feature,
                name: feature,
                description: `Supports ${feature}`,
                isSupported: true,
                isPremium: false,
            })) || [],
            customConfig: {
                ...prev.customConfig,
                ...template.config,
            },
        }));
    };

    const handleSave = () => {
        if (!providerData.name || !providerData.customConfig?.apiEndpoint) {
            return;
        }

        const provider: AIProvider = {
            id: editingProvider?.id || `custom-${Date.now()}`,
            name: providerData.name,
            description: providerData.description || '',
            icon: providerData.icon || '🤖',
            color: providerData.color || '#6b7280',
            isLocal: false,
            isCustom: true,
            models: providerData.models || [],
            apiKeyField: providerData.apiKeyField || 'api_key',
            baseUrl: providerData.baseUrl || '',
            headers: providerData.customConfig?.customHeaders || {},
            features: providerData.features || [],
            pricing: providerData.pricing || { tier: 'pay-as-you-go' },
            status: 'active',
            customConfig: providerData.customConfig,
        };

        onSave(provider);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/50' : 'bg-black/30'}`}>
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${isDarkMode ? 'text-white bg-gray-800' : 'text-gray-900 bg-white'}`}>
                {/* Header */}
                <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-purple-900' : 'bg-purple-100'}`}>
                                <FiCode className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {editingProvider ? 'Edit Custom Provider' : 'Add Custom Provider'}
                                </h2>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Configure a custom AI provider with your own API endpoints
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Template Selection */}
                    <div className="space-y-4">
                        <h3 className="flex items-center space-x-2 text-lg font-semibold">
                            <FiZap className="w-5 h-5" />
                            <span>Choose Template</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {customProviderManager.templates.map((template) => (
                                <div
                                    key={template.id}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedTemplate?.id === template.id
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                        : isDarkMode
                                            ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}
                                    onClick={() => handleTemplateSelect(template)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="flex justify-center items-center w-8 h-8 text-lg text-white rounded-lg"
                                            style={{ backgroundColor: template.color }}
                                        >
                                            {template.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-semibold">{template.name}</h5>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Provider Configuration */}
                    <div className="space-y-4">
                        <h3 className="flex items-center space-x-2 text-lg font-semibold">
                            <FiSettings className="w-5 h-5" />
                            <span>Provider Configuration</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Provider Name
                                </label>
                                <input
                                    type="text"
                                    value={providerData.name}
                                    onChange={(e) => setProviderData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="My Custom AI Provider"
                                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                        ? 'placeholder-gray-400 text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                        : 'placeholder-gray-500 text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                        }`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={providerData.description}
                                    onChange={(e) => setProviderData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Description of your custom provider"
                                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                        ? 'placeholder-gray-400 text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                        : 'placeholder-gray-500 text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                        }`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Base URL
                                </label>
                                <input
                                    type="url"
                                    value={providerData.baseUrl}
                                    onChange={(e) => setProviderData(prev => ({ ...prev, baseUrl: e.target.value }))}
                                    placeholder="https://api.example.com"
                                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                        ? 'placeholder-gray-400 text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                        : 'placeholder-gray-500 text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                        }`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    API Endpoint
                                </label>
                                <input
                                    type="text"
                                    value={providerData.customConfig?.apiEndpoint}
                                    onChange={(e) => setProviderData(prev => ({
                                        ...prev,
                                        customConfig: {
                                            ...prev.customConfig!,
                                            apiEndpoint: e.target.value
                                        }
                                    }))}
                                    placeholder="/v1/chat/completions"
                                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                        ? 'placeholder-gray-400 text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                        : 'placeholder-gray-500 text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                        }`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Auth Header
                                </label>
                                <input
                                    type="text"
                                    value={providerData.customConfig?.authHeader}
                                    onChange={(e) => setProviderData(prev => ({
                                        ...prev,
                                        customConfig: {
                                            ...prev.customConfig!,
                                            authHeader: e.target.value
                                        }
                                    }))}
                                    placeholder="Authorization"
                                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                        ? 'placeholder-gray-400 text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                        : 'placeholder-gray-500 text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                        }`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Auth Prefix
                                </label>
                                <input
                                    type="text"
                                    value={providerData.customConfig?.authPrefix}
                                    onChange={(e) => setProviderData(prev => ({
                                        ...prev,
                                        customConfig: {
                                            ...prev.customConfig!,
                                            authPrefix: e.target.value
                                        }
                                    }))}
                                    placeholder="Bearer "
                                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                        ? 'placeholder-gray-400 text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                        : 'placeholder-gray-500 text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                        }`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    API Key Field
                                </label>
                                <input
                                    type="text"
                                    value={providerData.apiKeyField}
                                    onChange={(e) => setProviderData(prev => ({ ...prev, apiKeyField: e.target.value }))}
                                    placeholder="api_key"
                                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                        ? 'placeholder-gray-400 text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                        : 'placeholder-gray-500 text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end items-center pt-4 space-x-3 border-t">
                        <button
                            onClick={onClose}
                            className={`px-6 py-2 rounded-lg transition-colors ${isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!providerData.name || !providerData.customConfig?.apiEndpoint}
                            className="px-6 py-2 text-white bg-purple-600 rounded-lg transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingProvider ? 'Update Provider' : 'Create Provider'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface AIConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigChange: (config: AIConfig) => void;
    currentConfig?: AIConfig;
}

const AIConfigPanel: React.FC<AIConfigPanelProps> = ({
    isOpen,
    onClose,
    onConfigChange,
    currentConfig,
}) => {
    const { isDarkMode } = useTheme();
    const { aiConfig, setAIConfig } = useAIConfigContext();

    const [config, setConfig] = useState<AIConfig>(currentConfig || aiConfig);
    const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
    const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [healthStatus, setHealthStatus] = useState<Record<string, boolean>>({});
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isAddingCustomProvider, setIsAddingCustomProvider] = useState(false);
    const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);

    // Load configuration from AI context
    useEffect(() => {
        const loadConfigFromContext = () => {
            const newConfig: AIConfig = {
                ...aiConfig,
                ...currentConfig, // Allow override from props
            };

            setConfig(newConfig);
            setSelectedProvider(aiProviderRegistry.getProvider(newConfig.provider) || null);
            setSelectedModel(aiProviderRegistry.getProvider(newConfig.provider)?.models.find(m => m.id === newConfig.model) || null);
        };

        loadConfigFromContext();
    }, [aiConfig, currentConfig]);

    // Save configuration to AI context
    const saveConfigToContext = (newConfig: AIConfig) => {
        setAIConfig(newConfig);
        onConfigChange(newConfig);
    };

    const handleProviderChange = (providerId: string) => {
        const provider = aiProviderRegistry.getProvider(providerId);
        if (!provider) return;

        const defaultConfig = aiProviderRegistry.getDefaultConfig(providerId);
        if (!defaultConfig) return;

        // Load API key from AI config for the specific provider
        const apiKey = aiConfig.apiKeys[providerId] || '';
        const newConfig = {
            ...defaultConfig,
            apiKeys: {
                ...aiConfig.apiKeys,
                [providerId]: apiKey
            },
            baseUrl: provider.isLocal
                ? (providerId === 'ollama' ? aiConfig.baseUrl || 'http://localhost:11434' : aiConfig.baseUrl || 'http://localhost:8000') || ''
                : provider.baseUrl || '',
        };

        setConfig(newConfig);
        setSelectedProvider(provider);
        setSelectedModel(provider.models[0] ?? null);
        saveConfigToContext(newConfig);
    };

    const handleModelChange = (modelId: string) => {
        const model = selectedProvider?.models.find(m => m.id === modelId);
        if (!model) return;

        const newConfig = {
            ...config,
            model: modelId,
            maxTokens: Math.min(config.maxTokens, model.maxTokens),
        };

        setConfig(newConfig);
        setSelectedModel(model);
        saveConfigToContext(newConfig);
    };

    const handleConfigChange = (field: keyof AIConfig, value: any) => {
        const newConfig = { ...config, [field]: value };
        setConfig(newConfig);
        saveConfigToContext(newConfig);
    };

    // Handle API key changes for specific providers
    const handleApiKeyChange = (providerId: string, apiKey: string) => {
        const newConfig = {
            ...config,
            apiKeys: {
                ...config.apiKeys,
                [providerId]: apiKey
            }
        };
        setConfig(newConfig);
        saveConfigToContext(newConfig);
    };

    const validateCurrentConfig = () => {
        const validation = validateAIConfig(config);
        setValidationErrors(validation.errors);
        return validation.isValid;
    };

    const checkAllProvidersHealth = async () => {
        setIsCheckingHealth(true);
        const providers = aiProviderRegistry.getAllProviders();
        const healthResults: Record<string, boolean> = {};

        await Promise.all(
            providers.map(async (provider) => {
                try {
                    const isHealthy = await aiProviderRegistry.checkProviderHealth(provider.id, config);
                    healthResults[provider.id] = isHealthy;
                } catch (error) {
                    healthResults[provider.id] = false;
                }
            })
        );

        setHealthStatus(healthResults);
        setIsCheckingHealth(false);
    };

    const getProviderIcon = (provider: AIProvider) => {
        return (
            <div
                className="flex justify-center items-center w-8 h-8 text-lg text-white rounded-lg"
                style={{ backgroundColor: provider.color }}
            >
                {provider.icon}
            </div>
        );
    };

    const getModelPricing = (model: AIModel) => {
        if (model.pricing.input === 0 && model.pricing.output === 0) {
            return <span className="font-semibold text-green-600 dark:text-green-400">Free</span>;
        }
        return (
            <span className="text-gray-600 dark:text-gray-400">
                ${model.pricing.input}/1K input, ${model.pricing.output}/1K output
            </span>
        );
    };

    const getModelIcon = (modelId: string): string => {
        const modelIcons: Record<string, string> = {
            // OpenAI Models
            'gpt-4o': '🤖',
            'gpt-4o-mini': '⚡',
            'gpt-3.5-turbo': '🚀',
            'gpt-4': '🧠',

            // Anthropic Models
            'claude-3-5-sonnet-20241022': '🧠',
            'claude-3-5-haiku-20241022': '🌸',
            'claude-3': '🧠',

            // Google Models
            'gemini-1.5-pro': '🔮',
            'gemini-1.5-flash': '⚡',
            'gemini-pro': '🔮',

            // Ollama Models
            'llama3.2:3b': '🦙',
            'llama3.2:7b': '🦙',
            'codellama:7b': '💻',

            // Custom Models
            'custom-model': '🔧',
        };

        return modelIcons[modelId] || '🤖';
    };

    const getModelColor = (modelId: string): string => {
        const modelColors: Record<string, string> = {
            // OpenAI Models
            'gpt-4o': '#10a37f',
            'gpt-4o-mini': '#10a37f',
            'gpt-3.5-turbo': '#10a37f',
            'gpt-4': '#10a37f',

            // Anthropic Models
            'claude-3-5-sonnet-20241022': '#d97706',
            'claude-3-5-haiku-20241022': '#d97706',
            'claude-3': '#d97706',

            // Google Models
            'gemini-1.5-pro': '#4285f4',
            'gemini-1.5-flash': '#4285f4',
            'gemini-pro': '#4285f4',

            // Ollama Models
            'llama3.2:3b': '#059669',
            'llama3.2:7b': '#059669',
            'codellama:7b': '#059669',

            // Custom Models
            'custom-model': '#7c3aed',
        };

        return modelColors[modelId] || '#6b7280';
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/50' : 'bg-black/30'}`}>
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${isDarkMode ? 'text-white bg-gray-800' : 'text-gray-900 bg-white'}`}>
                {/* Header */}
                <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                                <FiSettings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">AI Configuration</h2>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Configure AI providers, models, and settings for test generation
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="flex items-center space-x-2 text-lg font-semibold">
                                <FiGlobe className="w-5 h-5" />
                                <span>AI Provider</span>
                            </h3>
                            <button
                                onClick={checkAllProvidersHealth}
                                disabled={isCheckingHealth}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center space-x-2 ${isCheckingHealth
                                    ? 'opacity-50 cursor-not-allowed'
                                    : isDarkMode
                                        ? 'bg-gray-700 hover:bg-gray-600'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                <FiRefreshCw className={`w-4 h-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                                <span>Check Health</span>
                            </button>
                        </div>

                        {/* Cloud Providers */}
                        <div className="space-y-3">
                            <h4 className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                <FiGlobe className="w-4 h-4" />
                                <span>Cloud Providers</span>
                            </h4>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {aiProviderRegistry.getCloudProviders().map((provider) => (
                                    <div
                                        key={provider.id}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${config.provider === provider.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : isDarkMode
                                                ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleProviderChange(provider.id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            {getProviderIcon(provider)}
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h5 className="font-semibold">{provider.name}</h5>
                                                    {healthStatus[provider.id] !== undefined && (
                                                        <div className={`flex items-center space-x-1 ${healthStatus[provider.id] ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {healthStatus[provider.id] ? <FiCheck className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {provider.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Local Providers */}
                        <div className="space-y-3">
                            <h4 className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                <FiHome className="w-4 h-4" />
                                <span>Local Providers</span>
                            </h4>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {aiProviderRegistry.getLocalProviders().map((provider) => (
                                    <div
                                        key={provider.id}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${config.provider === provider.id
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : isDarkMode
                                                ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleProviderChange(provider.id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            {getProviderIcon(provider)}
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h5 className="font-semibold">{provider.name}</h5>
                                                    <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">
                                                        Local
                                                    </span>
                                                    {healthStatus[provider.id] !== undefined && (
                                                        <div className={`flex items-center space-x-1 ${healthStatus[provider.id] ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {healthStatus[provider.id] ? <FiCheck className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {provider.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom Providers */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <FiCode className="w-4 h-4" />
                                    <span>Custom Providers</span>
                                </h4>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setIsAddingCustomProvider(true)}
                                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <FiPlus className="w-3 h-3" />
                                        <span>Add</span>
                                    </button>
                                    <button
                                        onClick={() => setIsAddingCustomProvider(!isAddingCustomProvider)}
                                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        <FiSettings className="w-3 h-3" />
                                        <span>Manage</span>
                                    </button>
                                </div>
                            </div>

                            {isAddingCustomProvider && (
                                <div className="p-4 space-y-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center justify-between">
                                        <h5 className="font-semibold">Custom Provider Management</h5>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    const data = customProviderManager.exportProviders();
                                                    const blob = new Blob([data], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = 'custom-ai-providers.json';
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <FiDownload className="w-3 h-3" />
                                                <span>Export</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = '.json';
                                                    input.onchange = (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (e) => {
                                                                const result = e.target?.result as string;
                                                                const importResult = customProviderManager.importProviders(result);
                                                                if (importResult.success) {
                                                                    // Refresh the UI
                                                                    window.location.reload();
                                                                } else {
                                                                    console.error('Import failed:', importResult.errors);
                                                                }
                                                            };
                                                            reader.readAsText(file);
                                                        }
                                                    };
                                                    input.click();
                                                }}
                                                className="flex items-center space-x-1 px-2 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                <FiUpload className="w-3 h-3" />
                                                <span>Import</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {customProviderManager.getAllProviders().map((provider) => (
                                            <div key={provider.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {getProviderIcon(provider)}
                                                    <div>
                                                        <h6 className="font-medium">{provider.name}</h6>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{provider.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => setEditingProvider(provider)}
                                                        className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                                                    >
                                                        <FiEdit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            customProviderManager.removeProvider(provider.id);
                                                            window.location.reload();
                                                        }}
                                                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {customProviderManager.getAllProviders().length === 0 && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                No custom providers configured. Click "Add" to create one.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {customProviderManager.getAllProviders().map((provider) => (
                                    <div
                                        key={provider.id}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${config.provider === provider.id
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : isDarkMode
                                                ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleProviderChange(provider.id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            {getProviderIcon(provider)}
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h5 className="font-semibold">{provider.name}</h5>
                                                    <span className="px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-200">
                                                        Custom
                                                    </span>
                                                    {healthStatus[provider.id] !== undefined && (
                                                        <div className={`flex items-center space-x-1 ${healthStatus[provider.id] ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {healthStatus[provider.id] ? <FiCheck className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {provider.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Model Selection */}
                    {selectedProvider && (
                        <div className="space-y-4">
                            <h3 className="flex items-center space-x-2 text-lg font-semibold">
                                <FiCpu className="w-5 h-5" />
                                <span>AI Model</span>
                            </h3>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {selectedProvider.models.map((model) => (
                                    <div
                                        key={model.id}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${config.model === model.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : isDarkMode
                                                ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleModelChange(model.id)}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        className="flex justify-center items-center w-10 h-10 text-lg text-white rounded-lg shadow-sm"
                                                        style={{ backgroundColor: getModelColor(model.id) }}
                                                    >
                                                        {getModelIcon(model.id)}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-semibold">{model.name}</h5>
                                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            v{model.version}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${model.status === 'active'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                    }`}>
                                                    {model.status}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {model.description}
                                            </p>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                    Max: {model.maxTokens.toLocaleString()} tokens
                                                </span>
                                                {getModelPricing(model)}
                                            </div>
                                            {model.capabilities && model.capabilities.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {model.capabilities.slice(0, 3).map((capability) => (
                                                        <span
                                                            key={capability}
                                                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full dark:bg-gray-600 dark:text-gray-300"
                                                        >
                                                            {capability}
                                                        </span>
                                                    ))}
                                                    {model.capabilities.length > 3 && (
                                                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full dark:bg-gray-600 dark:text-gray-300">
                                                            +{model.capabilities.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* API Key Configuration */}
                    {selectedProvider && !selectedProvider.isLocal && (
                        <div className="space-y-4">
                            <h3 className="flex items-center space-x-2 text-lg font-semibold">
                                <FiKey className="w-5 h-5" />
                                <span>API Key</span>
                            </h3>
                            <div className="space-y-2">
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {selectedProvider.name} API Key
                                </label>
                                <input
                                    type="password"
                                    value={config.apiKeys[selectedProvider.id] || ''}
                                    onChange={(e) => handleApiKeyChange(selectedProvider.id, e.target.value)}
                                    placeholder={`Enter your ${selectedProvider.name} API key`}
                                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                        ? 'placeholder-gray-400 text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                        : 'placeholder-gray-500 text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                        }`}
                                />
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Your API key is stored locally and never sent to our servers.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Advanced Settings */}
                    {selectedProvider && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                className="flex justify-between items-center p-4 w-full rounded-xl border transition-colors"
                            >
                                <h3 className="flex items-center space-x-2 text-lg font-semibold">
                                    <FiSettings className="w-5 h-5" />
                                    <span>Advanced Settings</span>
                                </h3>
                                {isAdvancedOpen ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
                            </button>

                            {isAdvancedOpen && (
                                <div className="p-4 space-y-4 rounded-xl border">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Max Tokens
                                            </label>
                                            <input
                                                type="number"
                                                value={config.maxTokens}
                                                onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                                                min="1"
                                                max={selectedModel?.maxTokens || 4000}
                                                className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                                    ? 'text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                                    : 'text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                                    }`}
                                            />
                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Max: {selectedModel?.maxTokens.toLocaleString() || 4000} tokens
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Temperature
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.1"
                                                value={config.temperature}
                                                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Focused (0)</span>
                                                <span>{config.temperature}</span>
                                                <span>Creative (2)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Top P
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={config.topP}
                                                onChange={(e) => handleConfigChange('topP', parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Focused (0)</span>
                                                <span>{config.topP}</span>
                                                <span>Diverse (1)</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Frequency Penalty
                                            </label>
                                            <input
                                                type="range"
                                                min="-2"
                                                max="2"
                                                step="0.1"
                                                value={config.frequencyPenalty}
                                                onChange={(e) => handleConfigChange('frequencyPenalty', parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Repeat (-2)</span>
                                                <span>{config.frequencyPenalty}</span>
                                                <span>Unique (2)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Presence Penalty
                                            </label>
                                            <input
                                                type="range"
                                                min="-2"
                                                max="2"
                                                step="0.1"
                                                value={config.presencePenalty}
                                                onChange={(e) => handleConfigChange('presencePenalty', parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Stay on topic (-2)</span>
                                                <span>{config.presencePenalty}</span>
                                                <span>New topics (2)</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Timeout (ms)
                                            </label>
                                            <input
                                                type="number"
                                                value={config.timeout}
                                                onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                                                min="1000"
                                                max="300000"
                                                step="1000"
                                                className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                                    ? 'text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                                    : 'text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Retry Attempts
                                            </label>
                                            <input
                                                type="number"
                                                value={config.retryAttempts}
                                                onChange={(e) => handleConfigChange('retryAttempts', parseInt(e.target.value))}
                                                min="0"
                                                max="10"
                                                className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                                    ? 'text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                                    : 'text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                                    }`}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Retry Delay (ms)
                                            </label>
                                            <input
                                                type="number"
                                                value={config.retryDelay}
                                                onChange={(e) => handleConfigChange('retryDelay', parseInt(e.target.value))}
                                                min="100"
                                                max="10000"
                                                step="100"
                                                className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                                                    ? 'text-white bg-gray-700 border-gray-600 focus:border-blue-500'
                                                    : 'text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className="p-4 bg-red-50 rounded-xl border border-red-200 dark:border-red-800 dark:bg-red-900/20">
                            <div className="flex items-center mb-2 space-x-2">
                                <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <h4 className="font-semibold text-red-800 dark:text-red-200">Configuration Errors</h4>
                            </div>
                            <ul className="space-y-1">
                                {validationErrors.map((error, index) => (
                                    <li key={index} className="text-sm text-red-700 dark:text-red-300">• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end items-center pt-4 space-x-3 border-t">
                        <button
                            onClick={onClose}
                            className={`px-6 py-2 rounded-lg transition-colors ${isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (validateCurrentConfig()) {
                                    onConfigChange(config);
                                    onClose();
                                }
                            }}
                            className="px-6 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
                        >
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom Provider Configuration Modal */}
            {(isAddingCustomProvider || editingProvider) && (
                <CustomProviderModal
                    isOpen={isAddingCustomProvider || !!editingProvider}
                    onClose={() => {
                        setIsAddingCustomProvider(false);
                        setEditingProvider(null);
                    }}
                    editingProvider={editingProvider}
                    onSave={(provider) => {
                        if (editingProvider) {
                            customProviderManager.updateProvider(editingProvider.id, provider);
                        } else {
                            customProviderManager.addProvider(provider);
                        }
                        setIsAddingCustomProvider(false);
                        setEditingProvider(null);
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
};

export default AIConfigPanel; 