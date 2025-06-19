import React from "react";
import URLBuilder from "./components/URLBuilder";
import RequestConfig from "./components/RequestConfig";
import TestManager from "./components/TestManager";
import YAMLGenerator from "./components/YAMLGenerator";
import AITestGenerator from "./components/AITestGenerator";
import SavedManager from "./components/SavedManager";
import { AppProvider, useAppContext } from "./context/AppContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Section } from "./types";

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

    const { isDarkMode, toggleDarkMode } = useTheme();

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
        <div
            className={`min-h-screen transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100 bg-gray-100 text-gray-900`}
        >
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Header */}
                <header
                    className={`dark:bg-gray-800 bg-white shadow-sm transition-colors duration-200`}
                >
                    <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <h1
                                    className={`text-3xl font-bold dark:text-blue-400 text-blue-600`}
                                >
                                    BiSTool
                                </h1>
                            </div>
                            {/* Sessions of Current Category */}
                            {activeSession?.category && (
                                <div className="mt-4 p-4 rounded-lg shadow-sm gap-2 flex dark:bg-gray-800 bg-white">
                                    {savedSessions.filter(s => s.category === activeSession.category).length > 0 ? (
                                        savedSessions
                                            .filter(s => s.category === activeSession.category)
                                            .map(session => (
                                                <button
                                                    key={session.id}
                                                    onClick={() => handleLoadSession(session)}
                                                    className={`px-3 py-1 rounded ${activeSession.id === session.id ? "dark:bg-blue-600 dark:text-blue-100 bg-blue-200 text-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800" : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800"} transition-colors text-sm`}
                                                >
                                                    {session.name}
                                                </button>
                                            ))
                                    ) : (
                                        <span className="text-gray-500 text-sm">No other sessions in this category.</span>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center space-x-4">
                                {activeSession && <span className={`ml-2 px-2 py-2 rounded text-xs ${methodColor[activeSession?.requestConfig.method as keyof typeof methodColor].color}`}>{activeSession?.requestConfig.method}</span>}

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
                                <button
                                    onClick={toggleDarkMode}
                                    className={`p-2 rounded-full transition-colors duration-200 dark:bg-gray-700 dark:text-yellow-300 hover:bg-gray-600 bg-gray-200 text-gray-700 hover:bg-gray-300`}
                                    aria-label="Toggle dark mode"
                                >
                                    {isDarkMode ? "☀️" : "🌙"}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Navigation */}
                <nav
                    className={`mt-4 dark:bg-gray-800 bg-white rounded-lg shadow-sm`}
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
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </ThemeProvider>
    );
};

export default App; 