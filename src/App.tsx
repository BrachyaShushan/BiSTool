import React from "react";
import URLBuilder from "./components/workflow/URLBuilder";
import RequestConfig from "./components/workflow/RequestConfig";
import TestManager from "./components/workflow/TestManager";
import YAMLGenerator from "./components/workflow/YAMLGenerator";
import AITestGenerator from "./components/workflow/AITestGenerator";
import SessionImporter from "./components/workflow/SessionImporter";
import WelcomeScreen from "./components/core/WelcomeScreen";
import { AppProvider, useAppContext } from "./context/AppContext";
import { ProjectProvider, useProjectContext } from "./context/ProjectContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AIConfigProvider } from "./context/AIConfigContext";
import { Section } from "./types/core";
import Header from "./layout/Header";
const AppContent: React.FC = () => {
    const {
        yamlOutput,
        activeSection,
        handleURLBuilderSubmit,
        handleRequestConfigSubmit,
        handleYAMLGenerated,
        setActiveSection,
        handleImportSessions,
    } = useAppContext();
    const { currentProject } = useProjectContext();

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
                    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {/* Header */}
                        <Header />

                        {/* Navigation */}
                        <nav className="overflow-hidden mt-6 bg-white rounded-xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
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
                    </div >
                </div >
            )}


        </>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <ProjectProvider>
                <AppContentWrapper />
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
                <AppContent />
            </AppProvider>
        </AIConfigProvider>
    );
};

export default App; 