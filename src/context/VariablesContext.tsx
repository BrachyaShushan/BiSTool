import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Variable } from "@/types";
import { useProjectContext } from "@/context/ProjectContext";
import { useVariableStorage } from "@/hooks/useStorage";
import { useStorageContext } from "@/context/StorageContext";
import { useAppContext } from "@/context/AppContext";
import { DEFAULT_GLOBAL_VARIABLES, DEFAULT_SHARED_VARIABLES } from "@/constants/variables";

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

// Helper function to compare session variables
function areSessionVarsEqual(a: Record<string, string>, b: Record<string, string>) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
        if (a[key] !== b[key]) return false;
    }
    return true;
}

export const VariablesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentProject } = useProjectContext();
    const projectId = currentProject?.id || null;
    const projectName = currentProject?.name || "Unnamed Project";
    const [globalVariables, setGlobalVariables] = useState<Record<string, string>>(DEFAULT_GLOBAL_VARIABLES);
    const [sharedVariables, setSharedVariables] = useState<Variable[]>(DEFAULT_SHARED_VARIABLES);
    const [hasLoaded, setHasLoaded] = useState(false);
    const isSavingRef = useRef(false);
    // Use the shared StorageManager from StorageContext
    const { storageManager } = useStorageContext();
    const { saveGlobalVariables, loadGlobalVariables } = useVariableStorage(storageManager, projectId, projectName);

    // ✅ Always call hooks at the top level
    const { activeSession, updateSessionVariables } = useAppContext();

    // Load global variables from storage
    const loadVariables = useCallback(() => {
        try {
            const loadedGlobal = loadGlobalVariables();
            if (loadedGlobal && Object.keys(loadedGlobal).length > 0) {
                const mergedGlobal = { ...DEFAULT_GLOBAL_VARIABLES, ...loadedGlobal };
                setGlobalVariables(mergedGlobal);
            } else {
                setGlobalVariables(DEFAULT_GLOBAL_VARIABLES);
            }
            setHasLoaded(true);
        } catch (error) {
            setGlobalVariables(DEFAULT_GLOBAL_VARIABLES);
            setHasLoaded(true);
        }
    }, [projectId, loadGlobalVariables]);

    // Load session variables from active session
    const loadSessionVariables = useCallback(() => {
        if (activeSession?.sharedVariables) {
            // Convert from Record<string, string> to Variable[]
            const sessionVars: Variable[] = Object.entries(activeSession.sharedVariables).map(([key, value]) => ({
                key,
                value: String(value)
            }));
            setSharedVariables(sessionVars);
        } else {
            setSharedVariables(DEFAULT_SHARED_VARIABLES);
        }
    }, [activeSession?.sharedVariables]);

    // Save global variables to storage
    const saveVariables = useCallback(() => {
        if (projectId) {
            saveGlobalVariables(globalVariables);
        }
    }, [projectId, saveGlobalVariables, globalVariables]);

    // Save session variables to active session
    const saveSessionVariables = useCallback(() => {
        if (activeSession && updateSessionVariables) {
            // Convert from Variable[] to Record<string, string>
            const sessionVarsObj: Record<string, string> = {};
            sharedVariables.forEach(v => {
                sessionVarsObj[v.key] = v.value;
            });
            // Only update if changed
            if (!areSessionVarsEqual(sessionVarsObj, activeSession.sharedVariables || {})) {
                updateSessionVariables(sessionVarsObj);
            }
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
        if (activeSession) {
            loadSessionVariables();
        }
    }, [activeSession?.id, loadSessionVariables]);

    // Save global variables when they change (only if we have a current project and after load)
    useEffect(() => {
        if (projectId && hasLoaded) {
            saveVariables();
        }
    }, [projectId, globalVariables, saveVariables, hasLoaded]);

    // Save session variables when they change (only if we have an active session)
    useEffect(() => {
        if (activeSession && hasLoaded && !isSavingRef.current) {
            // Use a timeout to debounce rapid changes and prevent infinite loops
            const timeoutId = setTimeout(() => {
                isSavingRef.current = true;
                saveSessionVariables();
                // Reset the flag after a short delay
                setTimeout(() => {
                    isSavingRef.current = false;
                }, 50);
            }, 100);

            return () => clearTimeout(timeoutId);
        }
        return undefined;
    }, [activeSession?.id, sharedVariables, saveSessionVariables, hasLoaded]);

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

        // Check environment-specific variables (e.g., {paramName}_{env})
        const envSpecificKey = `${paramName}_${env}`;
        if (globalVariables[envSpecificKey]) {
            return globalVariables[envSpecificKey];
        }


        const envSpecificSharedVar = sharedVariables.find(v => v.key === envSpecificKey);
        if (envSpecificSharedVar) {
            return envSpecificSharedVar.value;
        }

        // Check global variables first
        if (globalVariables[paramName]) {
            return globalVariables[paramName];
        }

        // Check shared variables
        const sharedVar = sharedVariables.find(v => v.key === paramName);
        if (sharedVar) {
            return sharedVar.value;
        }


        return null;
    }, [globalVariables, sharedVariables]);

    const value = useMemo(() => ({
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
    }), [
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
        getVariableValue
    ]);

    return <VariablesContext.Provider value={value}>{children}</VariablesContext.Provider>;
};

export const useVariablesContext = () => {
    const context = useContext(VariablesContext);
    if (!context) {
        throw new Error("useVariablesContext must be used within a VariablesProvider");
    }
    return context;
};