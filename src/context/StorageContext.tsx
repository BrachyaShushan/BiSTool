import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { StorageManager } from '../utils/storage';
import { useProjectContext } from './ProjectContext';

interface StorageContextType {
    storageManager: StorageManager;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentProject } = useProjectContext();
    const projectId = currentProject?.id || null;

    // Create a single shared StorageManager instance
    const storageManager = useMemo(() => new StorageManager(), []);

    // Set the current project in the StorageManager when it changes
    useEffect(() => {
        if (projectId) {
            storageManager.setCurrentProject(projectId);
        }
    }, [projectId, storageManager]);

    const value: StorageContextType = {
        storageManager,
    };

    return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};

export function useStorageContext() {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error("useStorageContext must be used within a StorageProvider");
    }
    return context;
} 