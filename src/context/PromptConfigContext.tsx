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

// Interface for metadata
export interface ConfigMetadata {
    lastModified: string;
    projectId: string | null;
    version: string;
    exportedAt?: string;
    projectName?: string | undefined;
}

// Interface for the complete stored data structure
export interface StoredPromptConfig {
    config: PromptConfig;
    templates: CustomTemplate[];
    metadata: ConfigMetadata;
}

// Interface for the context
export interface PromptConfigContextType {
    // Configuration state
    config: PromptConfig;
    templates: CustomTemplate[];
    selectedTemplate: string;

    // Configuration actions
    updateConfig: (updates: Partial<PromptConfig>) => void;
    resetConfig: () => void;

    // Template actions
    addTemplate: (template: CustomTemplate) => void;
    updateTemplate: (id: string, updates: Partial<CustomTemplate>) => void;
    deleteTemplate: (id: string) => void;
    getTemplate: (id: string) => CustomTemplate | undefined;
    setSelectedTemplate: (templateId: string) => void;

    // Storage actions
    loadConfig: () => void;
    saveConfig: () => void;
    exportConfig: () => string;
    importConfig: (configData: string) => void;

    // State
    isLoading: boolean;
    hasLoaded: boolean;
    error: string | null;

    // Debug
    reloadConfig: () => void;
}

// Default configuration
const DEFAULT_CONFIG: PromptConfig = {
    preInstructions: "Generate comprehensive API tests with proper error handling and validation.",
    postInstructions: "Ensure all tests include proper assertions, error handling, and follow best practices for the selected framework.",
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

const PromptConfigContext = createContext<PromptConfigContextType | undefined>(undefined);

export const PromptConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentProject } = useProjectContext();

    // State
    const [config, setConfig] = useState<PromptConfig>(DEFAULT_CONFIG);
    const [templates, setTemplates] = useState<CustomTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs for debouncing and persistence
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true);

    // Get storage key for current project
    const getStorageKey = useCallback((): string => {
        if (!currentProject?.id) {
            return STORAGE_KEYS.PROMPT_TEMPLATES;
        }
        return `${currentProject.id}_${STORAGE_KEYS.PROMPT_TEMPLATES}`;
    }, [currentProject?.id]);

    // Get storage key for selected template
    const getSelectedTemplateStorageKey = useCallback((): string => {
        if (!currentProject?.id) {
            return STORAGE_KEYS.SELECTED_TEMPLATE;
        }
        return `${currentProject.id}_${STORAGE_KEYS.SELECTED_TEMPLATE}`;
    }, [currentProject?.id]);

    // Save to localStorage with immediate persistence
    const saveToStorage = useCallback((configData: PromptConfig, templatesData: CustomTemplate[]) => {
        try {
            const storageKey = getStorageKey();
            const dataToSave: StoredPromptConfig = {
                config: {
                    ...configData,
                    customTemplates: templatesData.reduce((acc, template) => {
                        acc[template.id] = template.content;
                        return acc;
                    }, {} as Record<string, string>)
                },
                templates: templatesData,
                metadata: {
                    lastModified: new Date().toISOString(),
                    projectId: currentProject?.id || null,
                    version: "1.0"
                }
            };

            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            setError(null);
        } catch (err) {
            console.error("Failed to save config:", err);
            setError("Failed to save configuration");
        }
    }, [currentProject?.id, getStorageKey]);

    // Load from localStorage
    const loadFromStorage = useCallback((): { config: PromptConfig; templates: CustomTemplate[] } => {
        try {
            const storageKey = getStorageKey();
            const savedData = localStorage.getItem(storageKey);

            if (!savedData) {
                return { config: DEFAULT_CONFIG, templates: [] };
            }

            const parsed = JSON.parse(savedData);

            // Handle hierarchical structure
            if (parsed.config && parsed.templates) {
                const loadedConfig = {
                    preInstructions: parsed.config.preInstructions || DEFAULT_CONFIG.preInstructions,
                    postInstructions: parsed.config.postInstructions || DEFAULT_CONFIG.postInstructions,
                    languageSpecificPrompts: parsed.config.languageSpecificPrompts || {},
                    frameworkSpecificPrompts: parsed.config.frameworkSpecificPrompts || {},
                    environmentSpecificPrompts: parsed.config.environmentSpecificPrompts || {},
                    qualityGates: {
                        minTestCases: parsed.config.qualityGates?.minTestCases || DEFAULT_CONFIG.qualityGates.minTestCases,
                        maxTestCases: parsed.config.qualityGates?.maxTestCases || DEFAULT_CONFIG.qualityGates.maxTestCases,
                        requiredAssertions: parsed.config.qualityGates?.requiredAssertions || DEFAULT_CONFIG.qualityGates.requiredAssertions,
                        forbiddenPatterns: parsed.config.qualityGates?.forbiddenPatterns || DEFAULT_CONFIG.qualityGates.forbiddenPatterns
                    },
                    customTemplates: parsed.config.customTemplates || {}
                };

                const loadedTemplates = Array.isArray(parsed.templates)
                    ? parsed.templates
                    : [];

                return { config: loadedConfig, templates: loadedTemplates };
            }

            // Handle legacy flat structure
            if (parsed.preInstructions !== undefined) {
                const legacyConfig = {
                    preInstructions: parsed.preInstructions || DEFAULT_CONFIG.preInstructions,
                    postInstructions: parsed.postInstructions || DEFAULT_CONFIG.postInstructions,
                    languageSpecificPrompts: parsed.languageSpecificPrompts || {},
                    frameworkSpecificPrompts: parsed.frameworkSpecificPrompts || {},
                    environmentSpecificPrompts: parsed.environmentSpecificPrompts || {},
                    qualityGates: {
                        minTestCases: parsed.qualityGates?.minTestCases || DEFAULT_CONFIG.qualityGates.minTestCases,
                        maxTestCases: parsed.qualityGates?.maxTestCases || DEFAULT_CONFIG.qualityGates.maxTestCases,
                        requiredAssertions: parsed.qualityGates?.requiredAssertions || DEFAULT_CONFIG.qualityGates.requiredAssertions,
                        forbiddenPatterns: parsed.qualityGates?.forbiddenPatterns || DEFAULT_CONFIG.qualityGates.forbiddenPatterns
                    },
                    customTemplates: parsed.customTemplates || {}
                };

                const legacyTemplates = Array.isArray(parsed.templates)
                    ? parsed.templates
                    : [];

                return { config: legacyConfig, templates: legacyTemplates };
            }

            // Fallback to defaults
            return { config: DEFAULT_CONFIG, templates: [] };
        } catch (err) {
            console.error("Failed to load config:", err);
            setError("Failed to load configuration");

            return { config: DEFAULT_CONFIG, templates: [] };
        }
    }, [getStorageKey]);

    // Load selected template from storage
    const loadSelectedTemplate = useCallback(() => {
        try {
            const storageKey = getSelectedTemplateStorageKey();
            const savedTemplateId = localStorage.getItem(storageKey);
            if (savedTemplateId) {
                setSelectedTemplate(savedTemplateId);
            }
        } catch (err) {
            console.error("Failed to load selected template:", err);
        }
    }, [getSelectedTemplateStorageKey]);

    // Debounced save function
    const debouncedSave = useCallback((configData: PromptConfig, templatesData: CustomTemplate[]) => {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout
        saveTimeoutRef.current = setTimeout(() => {
            saveToStorage(configData, templatesData);
        }, 500);
    }, [saveToStorage]);

    // Load configuration
    const loadConfig = useCallback(() => {
        setIsLoading(true);
        setError(null);

        try {
            const { config: loadedConfig, templates: loadedTemplates } = loadFromStorage();
            setConfig(loadedConfig);
            setTemplates(loadedTemplates);
            loadSelectedTemplate();
            setHasLoaded(true);
        } catch (err) {
            console.error("Failed to load config:", err);
            setError("Failed to load configuration");
        } finally {
            setIsLoading(false);
        }
    }, [currentProject?.id, loadFromStorage, loadSelectedTemplate]);

    // Save configuration
    const saveConfig = useCallback(() => {
        saveToStorage(config, templates);
    }, [config, templates, saveToStorage]);

    // Initialize/reload when project changes
    useEffect(() => {
        if (isInitialLoadRef.current) {
            loadConfig();
            isInitialLoadRef.current = false;
        } else if (currentProject?.id) {
            loadConfig();
        }
    }, [currentProject?.id, loadConfig]);

    // Update configuration
    const updateConfig = useCallback((updates: Partial<PromptConfig>) => {
        setConfig(prev => {
            const newConfig = { ...prev, ...updates };
            debouncedSave(newConfig, templates);
            return newConfig;
        });
    }, [templates, debouncedSave]);

    // Reset configuration
    const resetConfig = useCallback(() => {
        setConfig(DEFAULT_CONFIG);
        setTemplates([]);
        saveToStorage(DEFAULT_CONFIG, []);
    }, [saveToStorage]);

    // Add template
    const addTemplate = useCallback((template: CustomTemplate) => {
        setTemplates(prev => {
            const newTemplates = [...prev, template];
            // Immediate save for template changes
            saveToStorage(config, newTemplates);
            return newTemplates;
        });
    }, [config, saveToStorage]);

    // Update template
    const updateTemplate = useCallback((id: string, updates: Partial<CustomTemplate>) => {
        setTemplates(prev => {
            const newTemplates = prev.map(template =>
                template.id === id
                    ? { ...template, ...updates, updatedAt: new Date().toISOString() }
                    : template
            );
            // Immediate save for template changes
            saveToStorage(config, newTemplates);
            return newTemplates;
        });
    }, [config, saveToStorage]);

    // Delete template
    const deleteTemplate = useCallback((id: string) => {
        setTemplates(prev => {
            const newTemplates = prev.filter(template => template.id !== id);
            // Immediate save for template changes
            saveToStorage(config, newTemplates);
            return newTemplates;
        });
    }, [config, saveToStorage]);

    // Get template by ID
    const getTemplate = useCallback((id: string) => {
        return templates.find(template => template.id === id);
    }, [templates]);

    // Set selected template
    const setSelectedTemplateHandler = useCallback((templateId: string) => {
        setSelectedTemplate(templateId);
        try {
            const storageKey = getSelectedTemplateStorageKey();
            localStorage.setItem(storageKey, templateId);
        } catch (err) {
            console.error("Failed to save selected template:", err);
        }
    }, [getSelectedTemplateStorageKey]);

    // Export configuration
    const exportConfig = useCallback(() => {
        const exportData: StoredPromptConfig = {
            config: {
                ...config,
                customTemplates: templates.reduce((acc, template) => {
                    acc[template.id] = template.content;
                    return acc;
                }, {} as Record<string, string>)
            },
            templates: templates,
            metadata: {
                lastModified: new Date().toISOString(),
                projectId: currentProject?.id || null,
                version: "1.0",
                exportedAt: new Date().toISOString(),
                projectName: currentProject?.name
            }
        };
        return JSON.stringify(exportData, null, 2);
    }, [config, templates, currentProject]);

    // Import configuration
    const importConfig = useCallback((configData: string) => {
        try {
            const parsed = JSON.parse(configData);

            // Handle hierarchical structure
            if (parsed.config && parsed.templates) {
                setConfig(parsed.config);
                setTemplates(Array.isArray(parsed.templates) ? parsed.templates : []);
            } else if (parsed.preInstructions !== undefined) {
                // Handle legacy structure
                setConfig({
                    preInstructions: parsed.preInstructions || "",
                    postInstructions: parsed.postInstructions || "",
                    languageSpecificPrompts: parsed.languageSpecificPrompts || {},
                    frameworkSpecificPrompts: parsed.frameworkSpecificPrompts || {},
                    environmentSpecificPrompts: parsed.environmentSpecificPrompts || {},
                    qualityGates: {
                        minTestCases: parsed.qualityGates?.minTestCases || DEFAULT_CONFIG.qualityGates.minTestCases,
                        maxTestCases: parsed.qualityGates?.maxTestCases || DEFAULT_CONFIG.qualityGates.maxTestCases,
                        requiredAssertions: parsed.qualityGates?.requiredAssertions || DEFAULT_CONFIG.qualityGates.requiredAssertions,
                        forbiddenPatterns: parsed.qualityGates?.forbiddenPatterns || DEFAULT_CONFIG.qualityGates.forbiddenPatterns
                    },
                    customTemplates: parsed.customTemplates || {}
                });
                setTemplates(Array.isArray(parsed.templates) ? parsed.templates : []);
            }

            // Save imported data
            saveToStorage(config, templates);
            setError(null);
        } catch (err) {
            console.error("Failed to import config:", err);
            setError("Failed to import configuration");
        }
    }, [config, templates, saveToStorage]);




    // Cleanup on unmount
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
        selectedTemplate,
        updateConfig,
        resetConfig,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplate,
        setSelectedTemplate: setSelectedTemplateHandler,
        loadConfig,
        saveConfig,
        exportConfig,
        importConfig,
        isLoading,
        hasLoaded,
        error,
        reloadConfig: loadConfig,
    };

    return (
        <PromptConfigContext.Provider value={value}>
            {children}
        </PromptConfigContext.Provider>
    );
};

export const usePromptConfigContext = (): PromptConfigContextType => {
    const context = useContext(PromptConfigContext);
    if (!context) {
        throw new Error("usePromptConfigContext must be used within a PromptConfigProvider");
    }
    return context;
}; 