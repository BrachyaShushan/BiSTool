import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useProjectContext } from "./ProjectContext";
import { STORAGE_KEYS } from "../constants/aiTestGenerator";

// Interface for prompt configuration
export interface PromptConfig {
    preInstructions: string;
    postInstructions: string;
    languageSpecificPrompts: Record<string, string>;
    frameworkSpecificPrompts: Record<string, string>;
    environmentSpecificPrompts: Record<string, string>;
    qualityGates: {
        minTestCases: number;
        maxTestCases: number;
        requiredAssertions: string[];
        forbiddenPatterns: string[];
    };
    customTemplates: Record<string, string>;
}

// Interface for custom template
export interface CustomTemplate {
    id: string;
    name: string;
    description: string;
    language: string;
    framework: string;
    environment: string;
    content: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

// Interface for the context
export interface PromptConfigContextType {
    // Configuration state
    config: PromptConfig;
    templates: CustomTemplate[];

    // Configuration actions
    updateConfig: (updates: Partial<PromptConfig>) => void;
    resetConfig: () => void;

    // Template actions
    addTemplate: (template: CustomTemplate) => void;
    updateTemplate: (id: string, updates: Partial<CustomTemplate>) => void;
    deleteTemplate: (id: string) => void;
    getTemplate: (id: string) => CustomTemplate | undefined;

    // Storage actions
    loadConfig: () => void;
    saveConfig: () => void;
    exportConfig: () => string;
    importConfig: (configData: string) => void;

    // State
    isLoading: boolean;
    hasLoaded: boolean;
    error: string | null;
}

const PromptConfigContext = createContext<PromptConfigContextType | undefined>(undefined);

// Default configuration
const DEFAULT_CONFIG: PromptConfig = {
    preInstructions: "",
    postInstructions: "",
    languageSpecificPrompts: {},
    frameworkSpecificPrompts: {},
    environmentSpecificPrompts: {},
    qualityGates: {
        minTestCases: 5,
        maxTestCases: 50,
        requiredAssertions: ["status_code", "response_time"],
        forbiddenPatterns: ["sleep", "hardcoded_values"]
    },
    customTemplates: {}
};

export const usePromptConfigContext = () => {
    const context = useContext(PromptConfigContext);
    if (!context) {
        throw new Error("usePromptConfigContext must be used within a PromptConfigProvider");
    }
    return context;
};

interface PromptConfigProviderProps {
    children: React.ReactNode;
}

export const PromptConfigProvider: React.FC<PromptConfigProviderProps> = ({ children }) => {
    const { currentProject } = useProjectContext();

    const [config, setConfig] = useState<PromptConfig>(DEFAULT_CONFIG);
    const [templates, setTemplates] = useState<CustomTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get storage key for current project
    const getStorageKey = useCallback((key: string): string => {
        if (!currentProject) {
            return key;
        }
        return `${currentProject.id}_${key}`;
    }, [currentProject?.id]);

    // Load configuration from storage
    const loadConfig = useCallback(() => {
        setIsLoading(true);
        setError(null);

        try {
            // Try to load project-specific config first, then fall back to global
            let storageKey = currentProject
                ? getStorageKey(STORAGE_KEYS.PROMPT_TEMPLATES)
                : STORAGE_KEYS.PROMPT_TEMPLATES;

            let savedData = localStorage.getItem(storageKey);

            // If no project-specific data and we have a project, try global data
            if (!savedData && currentProject) {
                storageKey = STORAGE_KEYS.PROMPT_TEMPLATES;
                savedData = localStorage.getItem(storageKey);
            }

            if (savedData) {
                const parsed = JSON.parse(savedData);

                // Load configuration
                if (parsed.preInstructions !== undefined) {
                    setConfig({
                        preInstructions: parsed.preInstructions || "",
                        postInstructions: parsed.postInstructions || "",
                        languageSpecificPrompts: parsed.languageSpecificPrompts || {},
                        frameworkSpecificPrompts: parsed.frameworkSpecificPrompts || {},
                        environmentSpecificPrompts: parsed.environmentSpecificPrompts || {},
                        qualityGates: {
                            minTestCases: parsed.qualityGates?.minTestCases || 5,
                            maxTestCases: parsed.qualityGates?.maxTestCases || 50,
                            requiredAssertions: parsed.qualityGates?.requiredAssertions || ["status_code", "response_time"],
                            forbiddenPatterns: parsed.qualityGates?.forbiddenPatterns || ["sleep", "hardcoded_values"]
                        },
                        customTemplates: parsed.customTemplates || {}
                    });
                }

                // Load templates
                if (parsed.templates && Array.isArray(parsed.templates)) {
                    setTemplates(parsed.templates);
                }
            } else {
                // No saved data, use defaults
                setConfig(DEFAULT_CONFIG);
                setTemplates([]);
            }

            setHasLoaded(true);
        } catch (err) {
            console.error("Failed to load prompt config:", err);
            setError("Failed to load prompt configuration");
            setConfig(DEFAULT_CONFIG);
            setTemplates([]);
            setHasLoaded(true);
        } finally {
            setIsLoading(false);
        }
    }, [currentProject, getStorageKey]);

    // Save configuration to storage
    const saveConfig = useCallback(() => {
        try {
            const storageKey = currentProject
                ? getStorageKey(STORAGE_KEYS.PROMPT_TEMPLATES)
                : STORAGE_KEYS.PROMPT_TEMPLATES;

            const dataToSave = {
                ...config,
                templates: templates,
                lastModified: new Date().toISOString(),
                projectId: currentProject?.id || 'global'
            };

            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            setError(null);
        } catch (err) {
            console.error("Failed to save prompt config:", err);
            setError("Failed to save prompt configuration");
        }
    }, [currentProject, config, templates, getStorageKey]);

    // Debounced save function
    const debouncedSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveConfig();
        }, 300);
    }, [saveConfig]);

    // Update configuration
    const updateConfig = useCallback((updates: Partial<PromptConfig>) => {
        setConfig(prev => {
            const newConfig = { ...prev, ...updates };
            debouncedSave();
            return newConfig;
        });
    }, [debouncedSave]);

    // Reset configuration
    const resetConfig = useCallback(() => {
        setConfig(DEFAULT_CONFIG);
        setTemplates([]);
        debouncedSave();
    }, [debouncedSave]);

    // Add template
    const addTemplate = useCallback((template: CustomTemplate) => {
        setTemplates(prev => {
            const newTemplates = [...prev, template];
            debouncedSave();
            return newTemplates;
        });

        // Also update config.customTemplates
        setConfig(prev => ({
            ...prev,
            customTemplates: {
                ...prev.customTemplates,
                [template.id]: template.content
            }
        }));
    }, [debouncedSave]);

    // Update template
    const updateTemplate = useCallback((id: string, updates: Partial<CustomTemplate>) => {
        setTemplates(prev => {
            const newTemplates = prev.map(template =>
                template.id === id
                    ? { ...template, ...updates, updatedAt: new Date().toISOString() }
                    : template
            );
            debouncedSave();
            return newTemplates;
        });

        // Update config.customTemplates if content changed
        if (updates.content !== undefined) {
            setConfig(prev => ({
                ...prev,
                customTemplates: {
                    ...prev.customTemplates,
                    [id]: updates.content!
                }
            }));
        }
    }, [debouncedSave]);

    // Delete template
    const deleteTemplate = useCallback((id: string) => {
        setTemplates(prev => {
            const newTemplates = prev.filter(template => template.id !== id);
            debouncedSave();
            return newTemplates;
        });

        // Remove from config.customTemplates
        setConfig(prev => {
            const { [id]: removed, ...rest } = prev.customTemplates;
            return { ...prev, customTemplates: rest };
        });
    }, [debouncedSave]);

    // Get template by ID
    const getTemplate = useCallback((id: string) => {
        return templates.find(template => template.id === id);
    }, [templates]);

    // Export configuration
    const exportConfig = useCallback(() => {
        const exportData = {
            config,
            templates,
            metadata: {
                exportedAt: new Date().toISOString(),
                projectId: currentProject?.id,
                projectName: currentProject?.name
            }
        };
        return JSON.stringify(exportData, null, 2);
    }, [config, templates, currentProject]);

    // Import configuration
    const importConfig = useCallback((configData: string) => {
        try {
            const parsed = JSON.parse(configData);

            if (parsed.config) {
                setConfig(parsed.config);
            }

            if (parsed.templates && Array.isArray(parsed.templates)) {
                setTemplates(parsed.templates);
            }

            debouncedSave();
            setError(null);
        } catch (err) {
            console.error("Failed to import config:", err);
            setError("Failed to import configuration");
        }
    }, [debouncedSave]);

    // Load config when project changes
    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const value: PromptConfigContextType = {
        config,
        templates,
        updateConfig,
        resetConfig,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplate,
        loadConfig,
        saveConfig,
        exportConfig,
        importConfig,
        isLoading,
        hasLoaded,
        error
    };

    return (
        <PromptConfigContext.Provider value={value}>
            {children}
        </PromptConfigContext.Provider>
    );
}; 