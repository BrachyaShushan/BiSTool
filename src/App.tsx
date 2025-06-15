import React from "react";
import URLBuilder from "./components/URLBuilder";
import RequestConfig from "./components/RequestConfig";
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
    } = useAppContext();

    const { isDarkMode, toggleDarkMode } = useTheme();

    const renderActiveSection = (): React.ReactNode => {
        switch (activeSection) {
            case "request":
                return <RequestConfig onSubmit={handleRequestConfigSubmit} />;
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
        { id: "yaml", label: "YAML Generator" },
        { id: "ai", label: "AI Test Generator" },
    ];

    const methodColor = {
        dark: {
            GET: "bg-blue-100 text-blue-700",
            POST: "bg-green-100 text-green-700",
            PUT: "bg-yellow-100 text-yellow-700",
            DELETE: "bg-red-100 text-red-700",
        },
        light: {
            GET: "bg-blue-100 text-blue-700",
            POST: "bg-green-100 text-green-700",
            PUT: "bg-yellow-100 text-yellow-700",
            DELETE: "bg-red-100 text-red-700",
        }
    }
    return (
        <div
            className={`min-h-screen transition-colors duration-200 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
                }`}
        >
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Header */}
                <header
                    className={`${isDarkMode ? "bg-gray-800" : "bg-white"
                        } shadow-sm transition-colors duration-200`}
                >
                    <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <h1
                                    className={`text-3xl font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"
                                        }`}
                                >
                                    BiSTool
                                </h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                {activeSession && <span className={`ml-2 px-2 py-2 rounded text-xs ${isDarkMode ? methodColor.dark[activeSession?.requestConfig.method as keyof typeof methodColor.dark] : methodColor.light[activeSession?.requestConfig.method as keyof typeof methodColor.light]}`}>{activeSession?.requestConfig.method}</span>}

                                <SavedManager
                                    activeSession={activeSession}
                                    savedSessions={savedSessions}
                                    globalVariables={globalVariables}
                                    handleLoadSession={handleLoadSession}
                                    handleSaveSession={handleSaveSession}
                                    handleDeleteSession={handleDeleteSession}
                                    updateGlobalVariable={updateGlobalVariable}
                                    updateSessionVariable={updateSessionVariable}
                                />
                                <button
                                    onClick={toggleDarkMode}
                                    className={`p-2 rounded-full transition-colors duration-200 ${isDarkMode
                                        ? "bg-gray-700 text-yellow-300 hover:bg-gray-600"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
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
                    className={`mt-4 ${isDarkMode ? "bg-gray-800" : "bg-white"
                        } rounded-lg shadow-sm`}
                >
                    <div className="flex p-2 space-x-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${activeSection === section.id
                                    ? isDarkMode
                                        ? "bg-blue-600 text-white"
                                        : "bg-blue-100 text-blue-700"
                                    : isDarkMode
                                        ? "text-gray-300 hover:bg-gray-700"
                                        : "text-gray-700 hover:bg-gray-50"
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