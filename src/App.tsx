import React, { useState } from "react";
import URLBuilder from "./components/workflow/URLBuilder";
import RequestConfig from "./components/workflow/RequestConfig";
import TestManager from "./components/workflow/TestManager";
import YAMLGenerator from "./components/workflow/YAMLGenerator";
import AITestGenerator from "./components/workflow/AITestGenerator";
import UnifiedManager from "./components/navigation/UnifiedManager";
import WelcomeScreen from "./components/core/WelcomeScreen";
import { AppProvider, useAppContext } from "./context/AppContext";
import { ProjectProvider, useProjectContext } from "./context/ProjectContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Section } from "./types/core";
import { FiFolder, FiSettings, FiKey, FiMenu, FiX } from "react-icons/fi";

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
        methodColor,
        tokenConfig,
        regenerateToken,
    } = useAppContext();

    const { currentProject, clearCurrentProject } = useProjectContext();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [showUnifiedManager, setShowUnifiedManager] = useState(false);
    const [isTokenLoading, setIsTokenLoading] = useState(false);
    const [isTokenExpired, setIsTokenExpired] = useState(false);
    const [tokenDuration, setTokenDuration] = useState<number | null>(null);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

    const handleCreateProjectClick = () => {
        setShowUnifiedManager(true);
    };

    const handleReturnToWelcome = () => {
        clearCurrentProject();
    };

    const toggleHeaderCollapse = () => {
        setIsHeaderCollapsed(!isHeaderCollapsed);
    };

    // Helper to decode JWT and check expiration
    const checkTokenExpiration = React.useCallback(() => {
        setIsTokenLoading(true);
        try {
            const tokenName = (globalVariables && tokenConfig && tokenConfig.tokenName) || "x-access-token";
            const token = globalVariables?.[tokenName];
            if (!token || token.trim() === "") {
                setTokenDuration(null);
                setIsTokenExpired(true);
                setIsTokenLoading(false);
                return;
            }
            const parts = token.split(".");
            if (parts.length < 2 || typeof parts[1] !== "string") {
                setTokenDuration(null);
                setIsTokenExpired(true);
                setIsTokenLoading(false);
                return;
            }
            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);
            const exp = payload.exp;
            const duration = (exp - now) / 60;
            setTokenDuration(duration);
            setIsTokenExpired(duration < 1);
        } catch (e) {
            setTokenDuration(null);
            setIsTokenExpired(true);
        }
        setIsTokenLoading(false);
    }, [globalVariables, tokenConfig]);

    React.useEffect(() => {
        checkTokenExpiration();
        const interval = setInterval(checkTokenExpiration, 30000);
        return () => clearInterval(interval);
    }, [checkTokenExpiration]);

    // Token regeneration logic (reuse from TokenGenerator)
    const handleRegenerateToken = async () => {
        setIsTokenLoading(true);
        try {
            await regenerateToken();
        } finally {
            setIsTokenLoading(false);
        }
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
                        <header className="overflow-hidden relative bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-700">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-5 dark:opacity-10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full translate-x-16 -translate-y-16"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 rounded-full -translate-x-12 translate-y-12"></div>
                            </div>

                            <div className="relative px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                                <div className="flex justify-between items-center">
                                    {/* Logo and Project Info */}
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={handleReturnToWelcome}
                                            className="flex items-center space-x-3 transition-all duration-200 group hover:scale-105"
                                            title="Return to Welcome Screen"
                                        >
                                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                                <h1 className="text-2xl font-bold text-white">B</h1>
                                            </div>
                                            <div className="flex flex-col">
                                                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                                    BiSTool
                                                </h1>
                                                {currentProject && (
                                                    <div className="flex items-center mt-1 space-x-2">
                                                        <FiFolder size={14} className="text-gray-500 dark:text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                            {currentProject.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                    {/* Sessions of Current Category */}
                                    {activeSession?.category && (
                                        <div className={`flex gap-2 p-3 bg-white rounded-xl border border-gray-200 shadow-md ${isHeaderCollapsed ? 'overflow-hidden max-w-0 opacity-0' : 'max-w-full opacity-100'} dark:bg-gray-700 dark:border-gray-600`}>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                                    {activeSession.category}
                                                </span>
                                                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                                            </div>
                                            {savedSessions.filter((s: any) => s.category === activeSession.category).length > 0 ? (
                                                <div className="flex gap-1">
                                                    {savedSessions
                                                        .filter((s: any) => s.category === activeSession.category)
                                                        .map((session: any) => (
                                                            <button
                                                                key={session.id}
                                                                onClick={() => handleLoadSession(session)}
                                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${methodColor[session.requestConfig?.method as keyof typeof methodColor]?.color
                                                                    } ${activeSession.id === session.id
                                                                        ? "bg-opacity-100 shadow-md"
                                                                        : "bg-opacity-30 dark:bg-opacity-30 hover:bg-opacity-50"
                                                                    }`}
                                                            >
                                                                {session.name}
                                                            </button>
                                                        ))}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">No other sessions</span>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex gap-2 justify-end items-center">
                                        {/* Collapsible Header Content */}
                                        <div className={`flex items-center space-x-4 transition-all duration-300 ease-in-out ${isHeaderCollapsed ? 'overflow-hidden max-w-0 opacity-0' : 'max-w-full opacity-100'}`}>



                                            {/* Action Buttons */}
                                            <div className="flex items-center space-x-2">
                                                {/* Active Session Method Badge */}
                                                {activeSession?.requestConfig && (
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-3 py-2 rounded-lg text-xs font-bold shadow-md ${methodColor[activeSession.requestConfig.method]?.color
                                                            }`}>
                                                            {activeSession.requestConfig.method}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Project Manager Button */}
                                                <button
                                                    onClick={() => setShowUnifiedManager(true)}
                                                    className={`group p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-md ${isDarkMode
                                                        ? "text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white"
                                                        : "text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900"
                                                        }`}
                                                    title="Manager"
                                                >
                                                    <FiSettings size={18} className="transition-transform duration-200 group-hover:rotate-90" />
                                                </button>

                                                {/* Dark Mode Toggle */}
                                                <button
                                                    onClick={toggleDarkMode}
                                                    className={`p-2 text-gray-700 bg-gray-100 rounded-xl shadow-md transition-all duration-200 group hover:scale-105 dark:text-yellow-300 dark:bg-gray-700 dark:hover:bg-gray-600 hover:bg-gray-200`}
                                                    aria-label="Toggle dark mode"
                                                    title="Toggle dark mode"
                                                >
                                                    <span className="text-lg transition-transform duration-200 group-hover:scale-110">
                                                        {isDarkMode ? "☀️" : "🌙"}
                                                    </span>
                                                </button>

                                                {/* Token Status */}
                                                <button
                                                    onClick={handleRegenerateToken}
                                                    className={`group p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-md ${isTokenExpired
                                                        ? "text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                                                        : isTokenLoading
                                                            ? "text-blue-500 bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
                                                            : "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                                                        }`}
                                                    title={
                                                        isTokenExpired
                                                            ? "Token expired. Click to regenerate."
                                                            : isTokenLoading
                                                                ? "Checking token..."
                                                                : `Token valid${tokenDuration !== null ? ` (${Math.round(tokenDuration)} min left)` : ""}`
                                                    }
                                                    aria-label="Regenerate token"
                                                >
                                                    <FiKey size={18} className={`transition-transform duration-200 group-hover:scale-110 ${isTokenLoading ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Hamburger Menu Button */}
                                        <button
                                            onClick={toggleHeaderCollapse}
                                            className={`group flex justify-center items-center p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-md ${isDarkMode
                                                ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                                                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                                                }`}
                                            title={isHeaderCollapsed ? "Expand header" : "Collapse header"}
                                            aria-label={isHeaderCollapsed ? "Expand header" : "Collapse header"}
                                        >
                                            <div className="transition-transform duration-200 group-hover:scale-110">
                                                {isHeaderCollapsed ? <FiMenu size={18} /> : <FiX size={18} />}
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </header>

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

            {/* Unified Manager Modal */}
            <UnifiedManager
                isOpen={showUnifiedManager}
                onClose={() => setShowUnifiedManager(false)}
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