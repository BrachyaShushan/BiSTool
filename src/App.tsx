import React, { useState } from "react";
import URLBuilder from "./components/workflow/URLBuilder";
import RequestConfig from "./components/workflow/RequestConfig";
import TestManager from "./components/workflow/TestManager";
import YAMLGenerator from "./components/workflow/YAMLGenerator";
import AITestGenerator from "./components/workflow/AITestGenerator";
import SavedManager from "./components/navigation/SavedManager";
import ProjectManager from "./components/navigation/ProjectManager";
import WelcomeScreen from "./components/core/WelcomeScreen";
import { AppProvider, useAppContext } from "./context/AppContext";
import { ProjectProvider, useProjectContext } from "./context/ProjectContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Section } from "./types/core";
import { FiFolder, FiSettings } from "react-icons/fi";

const AppContent: React.FC = () => {
    const {
        yamlOutput,
        activeSection,
        handleURLBuilderSubmit,
        handleRequestConfigSubmit,
        handleYAMLGenerated,
        setActiveSection,
        activeSession,
        savedSessions,
        globalVariables,
        handleLoadSession,
        handleSaveSession,
        handleDeleteSession,
        updateGlobalVariable,
        updateSessionVariable,
        deleteGlobalVariable,
    } = useAppContext();

    const { currentProject, clearCurrentProject } = useProjectContext();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [showProjectManager, setShowProjectManager] = useState(false);

    const handleCreateProjectClick = () => {
        setShowProjectManager(true);
    };

    const handleReturnToWelcome = () => {
        clearCurrentProject();
    };

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
    ];

    const methodColor = {
        GET: { value: "GET", label: "GET", color: "dark:text-green-400 dark:bg-green-900 bg-green-50 text-green-500" },
        POST: { value: "POST", label: "POST", color: "dark:text-blue-400 dark:bg-blue-900 bg-blue-50 text-blue-500" },
        PUT: { value: "PUT", label: "PUT", color: "dark:text-yellow-400 dark:bg-yellow-900 bg-yellow-50 text-yellow-500" },
        DELETE: { value: "DELETE", label: "DELETE", color: "dark:text-red-400 dark:bg-red-900 bg-red-50 text-red-500" },
        PATCH: { value: "PATCH", label: "PATCH", color: "dark:text-yellow-400 dark:bg-yellow-900 bg-yellow-50 text-yellow-500" },
        HEAD: { value: "HEAD", label: "HEAD", color: "dark:text-blue-400 dark:bg-blue-900 bg-blue-50 text-blue-500" },
        OPTIONS: { value: "OPTIONS", label: "OPTIONS", color: "dark:text-purple-400 dark:bg-purple-900 bg-purple-50 text-purple-500" },
    }

    return (
        <>
            {/* Show welcome screen if no project is selected */}
            {!currentProject ? (
                <WelcomeScreen onCreateProject={handleCreateProjectClick} />
            ) : (
                <div
                    className={`min-h-screen text-gray-900 bg-gray-100 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100`}
                >
                    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {/* Header */}
                        <header
                            className={`bg-white shadow-sm transition-colors duration-200 dark:bg-gray-800`}
                        >
                            <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <h1
                                            className={`text-3xl font-bold text-blue-600 dark:text-blue-400`}
                                        >
                                            BiSTool
                                        </h1>
                                        {currentProject && (
                                            <div className="flex items-center mt-1 space-x-2">
                                                <FiFolder size={14} className="text-gray-500" />
                                                <span className="text-sm text-gray-500">
                                                    {currentProject.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Sessions of Current Category */}
                                    {activeSession?.category && (
                                        <div className="flex gap-2 p-4 mt-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                                            {savedSessions.filter((s: any) => s.category === activeSession.category).length > 0 ? (
                                                savedSessions
                                                    .filter((s: any) => s.category === activeSession.category)
                                                    .map((session: any) => (
                                                        <button
                                                            key={session.id}
                                                            onClick={() => handleLoadSession(session)}
                                                            className={`px-3 py-1 rounded ${activeSession.id === session.id ? "dark:bg-blue-600 dark:text-blue-100 bg-blue-200 text-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800" : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800"} transition-colors text-sm`}
                                                        >
                                                            {session.name}
                                                        </button>
                                                    ))
                                            ) : (
                                                <span className="text-sm text-gray-500">No other sessions in this category.</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-4">
                                        {activeSession?.requestConfig && <span className={`ml-2 px-2 py-2 rounded text-xs ${methodColor[activeSession.requestConfig.method as keyof typeof methodColor].color}`}>{activeSession.requestConfig.method}</span>}

                                        <SavedManager
                                            activeSession={activeSession}
                                            savedSessions={savedSessions}
                                            globalVariables={globalVariables}
                                            handleLoadSession={handleLoadSession}
                                            handleSaveSession={handleSaveSession}
                                            handleDeleteSession={handleDeleteSession}
                                            updateGlobalVariable={updateGlobalVariable}
                                            updateSessionVariable={updateSessionVariable}
                                            deleteGlobalVariable={deleteGlobalVariable}
                                        />

                                        {/* Return to Welcome Button */}
                                        <button
                                            onClick={handleReturnToWelcome}
                                            className={`p-2 rounded-full transition-colors duration-200 flex items-center space-x-2 ${isDarkMode
                                                ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                                                : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                                                }`}
                                            title="Return to Welcome Screen"
                                        >
                                            <span className="text-sm">🏠</span>
                                        </button>

                                        {/* Project Manager Button */}
                                        <button
                                            onClick={() => setShowProjectManager(true)}
                                            className={`p-2 rounded-full transition-colors duration-200 flex items-center space-x-2 ${isDarkMode
                                                ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                                                : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                                                }`}
                                            title="Project Manager"
                                        >
                                            <FiSettings size={16} />
                                        </button>

                                        <button
                                            onClick={toggleDarkMode}
                                            className={`p-2 text-gray-700 bg-gray-200 rounded-full transition-colors duration-200 dark:bg-gray-700 dark:text-yellow-300 dark:hover:bg-gray-600 hover:bg-gray-300`}
                                            aria-label="Toggle dark mode"
                                        >
                                            {isDarkMode ? "☀️" : "🌙"}
                                        </button>

                                        {/* Debug Button */}
                                        <button
                                            onClick={() => {
                                                console.log("=== DEBUG: Current localStorage ===");
                                                console.log("Current project:", currentProject);
                                                if (currentProject) {
                                                    const keys = [
                                                        `${currentProject.id}_app_state`,
                                                        `${currentProject.id}_active_session`,
                                                        `${currentProject.id}_saved_sessions`,
                                                        `${currentProject.id}_shared_variables`
                                                    ];
                                                    keys.forEach(key => {
                                                        const value = localStorage.getItem(key);
                                                        console.log(`${key}:`, value ? JSON.parse(value) : null);
                                                    });
                                                }
                                                console.log("All localStorage keys:", Object.keys(localStorage));
                                            }}
                                            className={`p-2 text-gray-700 bg-gray-200 rounded-full transition-colors duration-200 dark:bg-gray-700 dark:text-red-300 dark:hover:bg-gray-600 hover:bg-gray-300`}
                                            title="Debug localStorage"
                                        >
                                            🐛
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Navigation */}
                        <nav
                            className={`mt-4 bg-white rounded-lg shadow-sm dark:bg-gray-800`}
                        >
                            <div className="flex p-2 space-x-1">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${activeSection === section.id
                                            ? "dark:bg-blue-600 dark:text-white bg-blue-100 text-blue-700"
                                            : "dark:text-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                </div>
            )}

            {/* Project Manager Modal */}
            <ProjectManager
                isOpen={showProjectManager}
                onClose={() => setShowProjectManager(false)}
            />
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
        <AppProvider
            getProjectStorageKey={getProjectStorageKey}
            currentProjectId={currentProject?.id || null}
            forceReload={forceReload}
        >
            <AppContent />
        </AppProvider>
    );
};

export default App; 