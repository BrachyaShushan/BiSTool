import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AIConfig, AIProvider } from '../types/components/components.types';
import { aiProviderRegistry } from '../utils/aiProviders';

interface AIConfigContextType {
    aiConfig: AIConfig;
    setAIConfig: (config: AIConfig) => void;
    updateAIConfig: (updates: Partial<AIConfig>) => void;
    getProjectStorageKey: (key: string) => string;
    currentProjectId: string | null;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const useAIConfigContext = () => {
    const context = useContext(AIConfigContext);
    if (!context) {
        throw new Error('useAIConfigContext must be used within an AIConfigProvider');
    }
    return context;
};

interface AIConfigProviderProps {
    children: React.ReactNode;
    getProjectStorageKey: (key: string) => string;
    currentProjectId: string | null;
}

const defaultAIConfig: AIConfig = {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    apiKeys: {},
    baseUrl: '',
    customHeaders: {},
    maxTokens: 4000,
    temperature: 0.7,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
};

export const AIConfigProvider: React.FC<AIConfigProviderProps> = ({
    children,
    getProjectStorageKey,
    currentProjectId,
}) => {
    const [aiConfig, setAIConfigState] = useState<AIConfig>(defaultAIConfig);

    // Load AI configuration from localStorage
    useEffect(() => {
        if (!currentProjectId) {
            console.log('No current project, using default AI config');
            setAIConfigState(defaultAIConfig);
            return;
        }

        try {
            const storageKey = getProjectStorageKey('ai_config');
            console.log('Loading AI config from:', storageKey);

            const savedConfig = localStorage.getItem(storageKey);
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                // Merge with default config to ensure all fields exist
                const mergedConfig = { ...defaultAIConfig, ...parsed };
                setAIConfigState(mergedConfig);
                console.log('Loaded AI config:', mergedConfig);
            } else {
                console.log('No saved AI config found, using default');
                setAIConfigState(defaultAIConfig);
            }
        } catch (error) {
            console.error('Failed to load AI config:', error);
            setAIConfigState(defaultAIConfig);
        }
    }, [currentProjectId, getProjectStorageKey]);

    // Save AI configuration to localStorage
    const setAIConfig = useCallback((config: AIConfig) => {
        if (!currentProjectId) {
            console.log('No current project, cannot save AI config');
            return;
        }

        try {
            const storageKey = getProjectStorageKey('ai_config');
            localStorage.setItem(storageKey, JSON.stringify(config));
            setAIConfigState(config);
            console.log('Saved AI config:', config);
        } catch (error) {
            console.error('Failed to save AI config:', error);
        }
    }, [currentProjectId, getProjectStorageKey]);

    // Update specific fields in AI configuration
    const updateAIConfig = useCallback((updates: Partial<AIConfig>) => {
        const newConfig = { ...aiConfig, ...updates };
        setAIConfig(newConfig);
    }, [aiConfig, setAIConfig]);

    const value: AIConfigContextType = {
        aiConfig,
        setAIConfig,
        updateAIConfig,
        getProjectStorageKey,
        currentProjectId,
    };

    return (
        <AIConfigContext.Provider value={value}>
            {children}
        </AIConfigContext.Provider>
    );
}; 