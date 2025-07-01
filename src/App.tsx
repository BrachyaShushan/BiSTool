import React, { useState } from "react";
import URLBuilder from "./components/workflow/URLBuilder";
import RequestConfig from "./components/workflow/RequestConfig";
import TestManager from "./components/workflow/TestManager";
import YAMLGenerator from "./components/workflow/YAMLGenerator";
import AITestGenerator from "./components/workflow/AITestGenerator";
import SessionImporter from "./components/workflow/SessionImporter";
import UnifiedManager from "./components/navigation/UnifiedManager";
import WelcomeScreen from "./components/core/WelcomeScreen";
import { AppProvider, useAppContext } from "./context/AppContext";
import { ProjectProvider, useProjectContext } from "./context/ProjectContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AIConfigProvider } from "./context/AIConfigContext";
import { Section } from "./types/core";
import { FiFolder, FiSettings, FiKey, FiMenu, FiX, FiSun, FiMoon, FiArrowRight } from "react-icons/fi";
import SaveControls from './components/ui/SaveControls';

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
        handleImportSessions,
        updateGlobalVariable,
        updateSessionVariable,
        deleteGlobalVariable,
        methodColor,
        tokenConfig,
        regenerateToken,
        // Save management
        autoSave,
        isSaving,
        lastSaved,
        hasUnsavedChanges,
        saveFrequency,
        manualSave,
        undo,
        toggleAutoSave,
        updateSaveFrequency,
        isUndoAvailable,
    } = useAppContext();

    const { currentProject, clearCurrentProject } = useProjectContext();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [showUnifiedManager, setShowUnifiedManager] = useState(false);
    const [sessionManagerTab, setSessionManagerTab] = useState<'sessions' | 'variables' | 'projects'>('sessions');
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

    // Listen for session manager open events
    React.useEffect(() => {
        const handleOpenSessionManager = (event: CustomEvent) => {
            const options = event.detail || { tab: 'sessions' };
            setSessionManagerTab(options.tab || 'sessions');
            setShowUnifiedManager(true);
        };

        window.addEventListener('openSessionManager', handleOpenSessionManager as EventListener);

        return () => {
            window.removeEventListener('openSessionManager', handleOpenSessionManager as EventListener);
        };
    }, []);

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
                <WelcomeScreen onCreateProject={handleCreateProjectClick} />
            ) : (
                <div
                    className={`min-h-screen text-gray-900 bg-gray-100 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100`}
                >
                    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {/* Header */}
                        <header className={`sticky top-0 z-40 transition-all duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
                            <div className="flex items-center justify-between px-6 py-3">
                                {/* Left side - Project info and navigation */}
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

                                {/* Right side - Save controls and theme toggle */}
                                <div className="flex items-center space-x-3">

                                    {/* Sessions of Current Category */}
                                    {activeSession?.category && (
                                        <div className={`flex gap-2 p-3 bg-white rounded-xl border border-gray-200 shadow-md min-w-0 ${isHeaderCollapsed ? 'overflow-hidden max-w-0 opacity-0' : 'max-w-md opacity-100'} dark:bg-gray-700 dark:border-gray-600`}>
                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                                    {activeSession.category}
                                                </span>
                                                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                                            </div>
                                            {savedSessions.filter((s: any) => s.category === activeSession.category).length > 0 ? (
                                                <div className="relative flex-1 min-w-0 group">
                                                    {/* Left Arrow */}
                                                    <button
                                                        onClick={() => {
                                                            const container = document.getElementById('sessions-scroll');
                                                            if (container) {
                                                                container.scrollBy({ left: -200, behavior: 'smooth' });
                                                            }
                                                        }}
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-gray-700 rounded-full shadow-md border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                                        title="Scroll left"
                                                    >
                                                        <FiArrowRight className="w-2.5 h-2.5 text-gray-600 rotate-180 dark:text-gray-300" />
                                                    </button>

                                                    {/* Right Arrow */}
                                                    <button
                                                        onClick={() => {
                                                            const container = document.getElementById('sessions-scroll');
                                                            if (container) {
                                                                container.scrollBy({ left: 200, behavior: 'smooth' });
                                                            }
                                                        }}
                                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-gray-700 rounded-full shadow-md border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                                        title="Scroll right"
                                                    >
                                                        <FiArrowRight className="w-2.5 h-2.5 text-gray-600 dark:text-gray-300" />
                                                    </button>

                                                    {/* Scrollable Content */}
                                                    <div
                                                        id="sessions-scroll"
                                                        className="flex overflow-x-auto items-center px-4 gap-1 scrollbar-hide scroll-smooth"
                                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                                    >
                                                        {savedSessions
                                                            .filter((s: any) => s.category === activeSession.category)
                                                            .map((session: any) => (
                                                                <button
                                                                    key={session.id}
                                                                    onClick={() => handleLoadSession(session)}
                                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex-shrink-0 whitespace-nowrap ${methodColor[session.requestConfig?.method as keyof typeof methodColor]?.color
                                                                        } ${activeSession.id === session.id
                                                                            ? "bg-opacity-100 shadow-md"
                                                                            : "bg-opacity-30 dark:bg-opacity-30 hover:bg-opacity-50"
                                                                        }`}
                                                                >
                                                                    {session.name}
                                                                </button>
                                                            ))}
                                                    </div>
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

                                                {/* Save Controls */}
                                                <SaveControls
                                                    autoSave={autoSave}
                                                    onAutoSaveToggle={toggleAutoSave}
                                                    onManualSave={manualSave}
                                                    onUndo={undo}
                                                    hasUnsavedChanges={hasUnsavedChanges}
                                                    isSaving={isSaving}
                                                    canUndo={isUndoAvailable}
                                                    lastSaved={lastSaved}
                                                    saveFrequency={saveFrequency}
                                                    onSaveFrequencyChange={updateSaveFrequency}
                                                />

                                                {/* Theme toggle */}
                                                <button
                                                    onClick={toggleDarkMode}
                                                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                                                >
                                                    {isDarkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                                                </button>

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
                initialTab={sessionManagerTab}
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

    // Debug effect to track project changes
    React.useEffect(() => {
        console.log(`AppContentWrapper: currentProject changed to:`, currentProject?.id || 'null');
        console.log(`AppContentWrapper: forceReload:`, forceReload);
    }, [currentProject, forceReload]);

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