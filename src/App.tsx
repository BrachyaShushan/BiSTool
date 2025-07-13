import React from "react";
import URLBuilder from "./components/workflow/URLBuilder";
import RequestConfig from "./components/workflow/RequestConfig";
import TestManager from "./components/workflow/TestManager";
import YAMLGenerator from "./components/workflow/YAMLGenerator";
import AITestGenerator from "./components/workflow/AITestGenerator";
import SessionImporter from "./components/workflow/SessionImporter";
import WelcomeScreen from "./components/core/WelcomeScreen";
import BasicMode from "./components/core/BasicMode";
import { AppProvider, useAppContext } from "./context/AppContext";
import { ProjectProvider, useProjectContext } from "./context/ProjectContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AIConfigProvider } from "./context/AIConfigContext";
import { StorageProvider } from "./context/StorageContext";
import { Section } from "./types/core";
import Header from "./layout/Header";
import MonacoEditorDemo from "./components/ui/MonacoEditorDemo";
import UIComponentsDemo from "./components/ui/UIComponentsDemo";
import UnifiedManager from "./components/navigation/UnifiedManager";
import { VariablesProvider } from "./context/VariablesContext";
import { TokenProvider } from "./context/TokenContext";
import { URLBuilderProvider } from "./context/URLBuilderContext";
import { PromptConfigProvider } from "./context/PromptConfigContext";

const AppContent: React.FC = () => {
    const {
        yamlOutput,
        activeSection,
        handleURLBuilderSubmit,
        handleRequestConfigSubmit,
        handleYAMLGenerated,
        setActiveSection,
        handleImportSessions,
        showUnifiedManager,
        unifiedManagerTab,
        setShowUnifiedManager,
        isLoading: appIsLoading,
        error: appError,
        mode,
        requestConfig,
        setRequestConfig,
    } = useAppContext();
    const { currentProject, isLoading: projectIsLoading, error: projectError } = useProjectContext();

    // Determine if we should show loading state
    const isInitializing = projectIsLoading || appIsLoading;
    const hasError = projectError || appError;

    // Show loading screen while initializing
    if (isInitializing) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center p-4 mb-6 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl animate-pulse">
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h1 className="mb-4 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                        Loading BiSTool...
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Initializing your workspace
                    </p>
                </div>
            </div>
        );
    }

    // Show error state if there's an error
    if (hasError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-red-100 dark:from-gray-900 dark:via-red-900 dark:to-red-800 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="inline-flex items-center justify-center p-4 mb-6 shadow-2xl bg-gradient-to-br from-red-500 to-red-600 rounded-2xl">
                        <div className="w-12 h-12 text-white text-2xl">⚠️</div>
                    </div>
                    <h1 className="mb-4 text-3xl font-bold text-red-600 dark:text-red-400">
                        Loading Error
                    </h1>
                    <p className="mb-6 text-gray-700 dark:text-gray-300">
                        {hasError}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 font-semibold text-white transition-all duration-200 shadow-lg bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:scale-105 hover:shadow-xl"
                    >
                        Reload App
                    </button>
                </div>
            </div>
        );
    }

    const renderActiveSection = (): React.ReactNode => {
        switch (activeSection) {
            case "request":
                return <RequestConfig onSubmit={handleRequestConfigSubmit} />;
            case "tests":
                return <TestManager />;
            case "yaml":
                return <YAMLGenerator onGenerate={handleYAMLGenerated} />;
            case "ai":
                return <AITestGenerator yamlData={yamlOutput} />;
            case "import":
                return <SessionImporter onImportSessions={handleImportSessions} />;
            case "monaco":
                return <MonacoEditorDemo />;
            case "ui":
                return <UIComponentsDemo />;
            case "url":
            default:
                return <URLBuilder onSubmit={handleURLBuilderSubmit} />;
        }
    };

    const sections: Section[] = [
        { id: "url", label: "URL Builder" },
        { id: "request", label: "Request Config" },
        { id: "tests", label: "Tests" },
        { id: "yaml", label: "YAML Generator" },
        { id: "ai", label: "AI Test Generator" },
        { id: "import", label: "Session Importer" },
        { id: "monaco", label: "Monaco Editor" },
        { id: "ui", label: "UI Components" },
    ];

    return (
        <>
            {/* Show welcome screen if no project is selected */}
            {!currentProject ? (
                <WelcomeScreen />
            ) : (
                <div
                    className={`min-h-screen text-gray-900 bg-gray-100 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100`}
                >
                    {/* Header */}
                    <Header />

                    {/* Render Basic Mode or Expert Mode based on current mode */}
                    {mode === 'basic' ? (
                        <BasicMode
                            requestConfig={requestConfig}
                            setRequestConfig={setRequestConfig}
                        />
                    ) : (
                        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                            {/* Navigation - Only show in Expert Mode */}
                            <nav className="mt-6 overflow-hidden bg-white border border-gray-200 shadow-lg rounded-xl dark:bg-gray-800 dark:border-gray-700">
                                <div className="flex p-2 space-x-1">
                                    {sections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 ${activeSection === section.id
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                                }`}
                                        >
                                            {section.label}
                                        </button>
                                    ))}
                                </div>
                            </nav>

                            {/* Main Content */}
                            <main className="mt-4">{renderActiveSection()}</main>
                        </div>
                    )}
                </div >
            )}

            {/* Unified Manager Modal - Available globally */}
            {showUnifiedManager && (
                <UnifiedManager
                    isOpen={showUnifiedManager}
                    onClose={() => setShowUnifiedManager(false)}
                    initialTab={unifiedManagerTab}
                />
            )}
        </>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <ProjectProvider>
                <StorageProvider>
                    <AppContentWrapper />
                </StorageProvider>
            </ProjectProvider>
        </ThemeProvider>
    );
};

// Wrapper component to access ProjectContext and pass getProjectStorageKey to AppProvider
const AppContentWrapper: React.FC = () => {
    const { getProjectStorageKey, currentProject, forceReload } = useProjectContext();

    return (
        <AIConfigProvider
            getProjectStorageKey={getProjectStorageKey}
            currentProjectId={currentProject?.id || null}
        >
            <AppProvider
                currentProjectId={currentProject?.id || null}
                forceReload={forceReload}
            >
                <VariablesProvider>
                    <TokenProvider
                        currentProjectId={currentProject?.id || null}
                        forceReload={forceReload}
                    >
                        <PromptConfigProvider>
                            <URLBuilderProvider>
                                <AppContent />
                            </URLBuilderProvider>
                        </PromptConfigProvider>
                    </TokenProvider>
                </VariablesProvider>
            </AppProvider>
        </AIConfigProvider>
    );
};

export default App; 