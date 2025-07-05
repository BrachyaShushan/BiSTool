import React, { createContext, useContext, ReactNode } from 'react';
import { useURLBuilder, UseURLBuilderOptions, UseURLBuilderReturn } from '../hooks/useURLBuilder';

interface URLBuilderContextType extends UseURLBuilderReturn {
    // Add any additional context-specific methods here
}

interface URLBuilderProviderProps {
    children: ReactNode;
    options?: UseURLBuilderOptions;
}

const URLBuilderContext = createContext<URLBuilderContextType | undefined>(undefined);

export const URLBuilderProvider: React.FC<URLBuilderProviderProps> = ({
    children,
    options = {}
}) => {
    const urlBuilderState = useURLBuilder(options);

    return (
        <URLBuilderContext.Provider value={urlBuilderState}>
            {children}
        </URLBuilderContext.Provider>
    );
};

export const useURLBuilderContext = (): URLBuilderContextType => {
    const context = useContext(URLBuilderContext);
    if (context === undefined) {
        throw new Error('useURLBuilderContext must be used within a URLBuilderProvider');
    }
    return context;
};

// Higher-order component for easy wrapping
export const withURLBuilder = <P extends object>(
    Component: React.ComponentType<P>,
    options: UseURLBuilderOptions = {}
) => {
    return (props: P) => (
        <URLBuilderProvider options={options}>
            <Component {...props} />
        </URLBuilderProvider>
    );
}; 