import React from "react";
import { AIConfigProvider } from "./context/AIConfigContext";
import { URLBuilderProvider } from "./context/URLBuilderContext";
import { ProjectProvider } from "./context/ProjectContext";
import { AppProvider } from "./context/AppContext";
import { SearchProvider } from "./context/SearchContext";
import { StorageProvider } from "./context/StorageContext";
import { VariablesProvider } from "./context/VariablesContext";
import { TokenProvider } from "./context/TokenContext";
import { PromptConfigProvider } from "./context/PromptConfigContext";

// Single provider hierarchy with proper dependency order
export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AIConfigProvider getProjectStorageKey={() => ''} currentProjectId={null}>
            <ProjectProvider>
                <StorageProvider>
                    <PromptConfigProvider>
                        <AppProvider currentProjectId={null} forceReload={0}>
                            <VariablesProvider>
                                <TokenProvider currentProjectId={null} forceReload={0}>
                                    <URLBuilderProvider>
                                        <SearchProvider>
                                            {children}
                                        </SearchProvider>
                                    </URLBuilderProvider>
                                </TokenProvider>
                            </VariablesProvider>
                        </AppProvider>
                    </PromptConfigProvider>
                </StorageProvider>
            </ProjectProvider>
        </AIConfigProvider>
    );
} 