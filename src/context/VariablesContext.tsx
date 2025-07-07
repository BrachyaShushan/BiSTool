import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Variable } from "../types/core/app.types";
import { useProjectContext } from "./ProjectContext";
import { useVariableStorage } from "../hooks/useStorage";
import { useStorageContext } from './StorageContext';
import { useAppContext } from "./AppContext";
import { DEFAULT_GLOBAL_VARIABLES, DEFAULT_SHARED_VARIABLES } from "../constants/variables";

export interface VariablesContextType {
    globalVariables: Record<string, string>;
    sharedVariables: Variable[];
    updateGlobalVariable: (key: string, value: string) => void;
    deleteGlobalVariable: (key: string) => void;
    updateSharedVariable: (key: string, value: string) => void;
    deleteSharedVariable: (key: string) => void;
    loadVariables: () => void;
    saveVariables: () => void;
    loadSessionVariables: () => void;
    saveSessionVariables: () => void;
    replaceVariables: (text: string) => string;
    getVariableValue: (paramName: string, env: string) => string | null;
}

const VariablesContext = createContext<VariablesContextType | undefined>(undefined);

export const VariablesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentProject } = useProjectContext();
    const projectId = currentProject?.id || null;
    const projectName = currentProject?.name || "Unnamed Project";
    const [globalVariables, setGlobalVariables] = useState<Record<string, string>>(DEFAULT_GLOBAL_VARIABLES);
    const [sharedVariables, setSharedVariables] = useState<Variable[]>(DEFAULT_SHARED_VARIABLES);
    const [hasLoaded, setHasLoaded] = useState(false);
    // Use the shared StorageManager from StorageContext
    const { storageManager } = useStorageContext();
    const { saveGlobalVariables, loadGlobalVariables } = useVariableStorage(storageManager, projectId, projectName);

    // Try to get session data from AppContext, but don't fail if not available
    let activeSession: any = null;
    let updateSessionVariables: ((sessionVariables: Record<string, string>) => void) | null = null;

    try {
        const appContext = useAppContext();
        activeSession = appContext.activeSession;
        updateSessionVariables = appContext.updateSessionVariables;
    } catch (error) {
        // AppContext not available, continue without session functionality
        console.log('VariablesContext: AppContext not available, session functionality disabled');
    }

    // Load global variables from storage
    const loadVariables = useCallback(() => {
        console.log('VariablesContext: Loading global variables for project:', projectId, projectName);
        try {
            const loadedGlobal = loadGlobalVariables();
            console.log('VariablesContext: Loaded global variables:', loadedGlobal);
            if (loadedGlobal && Object.keys(loadedGlobal).length > 0) {
                const mergedGlobal = { ...DEFAULT_GLOBAL_VARIABLES, ...loadedGlobal };
                setGlobalVariables(mergedGlobal);
            } else {
                setGlobalVariables(DEFAULT_GLOBAL_VARIABLES);
            }
            setHasLoaded(true);
        } catch (error) {
            console.error('VariablesContext: Error loading global variables:', error);
            setGlobalVariables(DEFAULT_GLOBAL_VARIABLES);
            setHasLoaded(true);
        }
    }, [projectId, loadGlobalVariables]);

    // Load session variables from active session
    const loadSessionVariables = useCallback(() => {
        console.log('VariablesContext: Loading session variables from active session:', activeSession?.id);
        if (activeSession?.sharedVariables) {
            // Convert from Record<string, string> to Variable[]
            const sessionVars: Variable[] = Object.entries(activeSession.sharedVariables).map(([key, value]) => ({
                key,
                value: String(value)
            }));
            console.log('VariablesContext: Loaded session variables:', sessionVars);
            setSharedVariables(sessionVars);
        } else {
            console.log('VariablesContext: No session variables found, using defaults');
            setSharedVariables(DEFAULT_SHARED_VARIABLES);
        }
    }, [activeSession]);

    // Save global variables to storage
    const saveVariables = useCallback(() => {
        console.log('VariablesContext: Saving global variables for project:', projectId, projectName);
        if (projectId) {
            console.log('VariablesContext: Saving global variables:', globalVariables);
            saveGlobalVariables(globalVariables);
        }
    }, [projectId, saveGlobalVariables, globalVariables]);

    // Save session variables to active session
    const saveSessionVariables = useCallback(() => {
        console.log('VariablesContext: Saving session variables to active session:', activeSession?.id);
        if (activeSession && updateSessionVariables) {
            // Convert from Variable[] to Record<string, string>
            const sessionVarsObj: Record<string, string> = {};
            sharedVariables.forEach(v => {
                sessionVarsObj[v.key] = v.value;
            });
            console.log('VariablesContext: Saving session variables:', sessionVarsObj);

            // Update the active session with new session variables
            updateSessionVariables(sessionVarsObj);
        }
    }, [activeSession, sharedVariables, updateSessionVariables]);

    // Update global variable
    const updateGlobalVariable = useCallback((key: string, value: string) => {
        setGlobalVariables(prev => {
            const updated = { ...prev, [key]: value };
            return updated;
        });
    }, []);

    // Delete global variable
    const deleteGlobalVariable = useCallback((key: string) => {
        setGlobalVariables(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    }, []);

    // Update shared variable
    const updateSharedVariable = useCallback((key: string, value: string) => {
        setSharedVariables(prev => {
            const existingIndex = prev.findIndex(v => v.key === key);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = { key, value };
                return updated;
            }
            return [...prev, { key, value }];
        });
    }, []);

    // Delete shared variable
    const deleteSharedVariable = useCallback((key: string) => {
        setSharedVariables(prev => prev.filter(v => v.key !== key));
    }, []);

    // Load global variables on mount or project change
    useEffect(() => {
        if (projectId) {
            setHasLoaded(false);
            const timer = setTimeout(() => {
                loadVariables();
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setHasLoaded(true);
            setGlobalVariables(DEFAULT_GLOBAL_VARIABLES);
            return undefined;
        }
    }, [projectId, loadVariables]);

    // Load session variables when active session changes
    useEffect(() => {
        if (hasLoaded) {
            loadSessionVariables();
        }
    }, [activeSession?.id, hasLoaded, loadSessionVariables]);

    // Save global variables when they change (only if we have a current project and after load)
    useEffect(() => {
        if (projectId && hasLoaded) {
            console.log('VariablesContext: Auto-saving global variables due to state change');
            saveVariables();
        } else {
            console.log('VariablesContext: No project ID or not loaded, skipping global auto-save');
        }
    }, [projectId, globalVariables, saveVariables, hasLoaded]);

    // Save session variables when they change (only if we have an active session and after load)
    useEffect(() => {
        if (activeSession && hasLoaded) {
            console.log('VariablesContext: Auto-saving session variables due to state change');
            saveSessionVariables();
        } else {
            console.log('VariablesContext: No active session or not loaded, skipping session auto-save');
        }
    }, [activeSession, sharedVariables, saveSessionVariables, hasLoaded]);

    // Replace variables in text with their values
    const replaceVariables = useCallback((text: string): string => {
        if (!text) return text;

        return text.replace(/\{([^}]+)\}/g, (match, varName) => {
            // Check global variables first
            if (globalVariables[varName]) {
                return globalVariables[varName];
            }
            // Check shared variables
            const sharedVar = sharedVariables.find(v => v.key === varName);
            if (sharedVar) {
                return sharedVar.value;
            }
            // Return original if not found
            return match;
        });
    }, [globalVariables, sharedVariables]);

    // Get variable value for a specific parameter and environment
    const getVariableValue = useCallback((paramName: string, env: string): string | null => {
        // Check global variables first
        if (globalVariables[paramName]) {
            return globalVariables[paramName];
        }

        // Check shared variables
        const sharedVar = sharedVariables.find(v => v.key === paramName);
        if (sharedVar) {
            return sharedVar.value;
        }

        // Check environment-specific variables (e.g., {paramName}_{env})
        const envSpecificKey = `${paramName}_${env}`;
        if (globalVariables[envSpecificKey]) {
            return globalVariables[envSpecificKey];
        }

        const envSpecificSharedVar = sharedVariables.find(v => v.key === envSpecificKey);
        if (envSpecificSharedVar) {
            return envSpecificSharedVar.value;
        }

        return null;
    }, [globalVariables, sharedVariables]);

    const value: VariablesContextType = {
        globalVariables,
        sharedVariables,
        updateGlobalVariable,
        deleteGlobalVariable,
        updateSharedVariable,
        deleteSharedVariable,
        loadVariables,
        saveVariables,
        loadSessionVariables,
        saveSessionVariables,
        replaceVariables,
        getVariableValue,
    };

    return <VariablesContext.Provider value={value}>{children}</VariablesContext.Provider>;
};

export const useVariablesContext = () => {
    const context = useContext(VariablesContext);
    if (!context) {
        throw new Error("useVariablesContext must be used within a VariablesProvider");
    }
    return context;
};