import React from "react";
import { ProjectProvider } from "./context/ProjectContext";
import { StorageProvider } from "./context/StorageContext";
import { AIConfigProvider } from "./context/AIConfigContext";
import { AppProvider } from "./context/AppContext";
import { VariablesProvider } from "./context/VariablesContext";
import { TokenProvider } from "./context/TokenContext";
import { PromptConfigProvider } from "./context/PromptConfigContext";
import { SearchProvider } from "./context/SearchContext";
import { URLBuilderProvider } from "./context/URLBuilderContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ProjectProvider>
            <StorageProvider>
                <AIConfigProvider getProjectStorageKey={() => ''} currentProjectId={null}>
                    <AppProvider currentProjectId={null} forceReload={0}>
                        <VariablesProvider>
                            <TokenProvider currentProjectId={null} forceReload={0}>
                                <PromptConfigProvider>
                                    <SearchProvider>
                                        <URLBuilderProvider>
                                            {children}
                                        </URLBuilderProvider>
                                    </SearchProvider>
                                </PromptConfigProvider>
                            </TokenProvider>
                        </VariablesProvider>
                    </AppProvider>
                </AIConfigProvider>
            </StorageProvider>
        </ProjectProvider>
    );
} 