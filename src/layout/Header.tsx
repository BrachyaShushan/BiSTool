import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { useProjectContext } from "../context/ProjectContext";

import { FiFolder, FiSettings, FiKey, FiMenu, FiX, FiSun, FiMoon, FiArrowRight } from "react-icons/fi";
import SaveControls from "../components/ui/SaveControls";
import { useCallback, useEffect, useState } from "react";

const Header = () => {
    const {
        // Save management
        activeSession,
        savedSessions,
        handleLoadSession,
        methodColor,
        autoSave,
        isSaving,
        lastSaved,
        hasUnsavedChanges,
        globalVariables,
        tokenConfig,
        regenerateToken,
        setShowUnifiedManager,
        showUnifiedManager,
    } = useAppContext();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [isTokenLoading, setIsTokenLoading] = useState(false);
    const [isTokenExpired, setIsTokenExpired] = useState(false);
    const [tokenDuration, setTokenDuration] = useState<number | null>(null);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const { currentProject, clearCurrentProject } = useProjectContext();
    const [sessionManagerTab, setSessionManagerTab] = useState<'sessions' | 'variables' | 'projects'>('sessions');

    // Token regeneration logic (reuse from TokenGenerator)
    const handleRegenerateToken = async () => {
        setIsTokenLoading(true);
        try {
            await regenerateToken();
        } finally {
            setIsTokenLoading(false);
        }
    };

    const handleReturnToWelcome = () => {
        clearCurrentProject();
    };

    const toggleHeaderCollapse = useCallback(() => {
        setIsHeaderCollapsed(prev => !prev);
    }, []);

    // Helper to decode JWT and check expiration
    const checkTokenExpiration = useCallback(() => {
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

    useEffect(() => {
        checkTokenExpiration();
        const interval = setInterval(checkTokenExpiration, 30000);
        return () => clearInterval(interval);
    }, [checkTokenExpiration]);

    // Listen for session manager open events
    useEffect(() => {
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

    return (
        <>
            <header className={`sticky top-0 z-40 transition-all duration-300 dark:bg-gray-900 dark:border-gray-700 bg-white border-gray-200 border-b shadow-sm`}>
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
                            <div className={`flex gap-2 p-3 bg-white rounded-xl border border-gray-200 shadow-md min-w-0 transition-all duration-300 ${isHeaderCollapsed === true ? 'overflow-hidden max-w-0 opacity-0' : 'max-w-md opacity-100'} dark:bg-gray-700 dark:border-gray-600`}>
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
                            <div className={`flex items-center space-x-4 transition-all duration-300 ease-in-out ${isHeaderCollapsed === true ? 'overflow-hidden max-w-0 opacity-0' : 'max-w-full opacity-100'}`}>
                                {/* Action Buttons */}
                                <div className="flex items-center space-x-2">

                                    {/* Save Status Indicator */}
                                    <SaveControls
                                        autoSave={autoSave}
                                        hasUnsavedChanges={hasUnsavedChanges}
                                        isSaving={isSaving}
                                        lastSaved={lastSaved}
                                    />

                                    {/* Theme toggle */}
                                    <button
                                        onClick={toggleDarkMode}
                                        className={`p-2 rounded-lg transition-colors dark:hover:bg-gray-700 hover:bg-gray-100`}
                                        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
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
                                        className={`group p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-md dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:text-white text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900`}
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
                                className={`group flex justify-center items-center p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-md dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 bg-gray-100 hover:bg-gray-200`}
                                title={isHeaderCollapsed === true ? "Expand header" : "Collapse header"}
                                aria-label={isHeaderCollapsed === true ? "Expand header" : "Collapse header"}
                            >
                                <div className="transition-transform duration-200 group-hover:scale-110">
                                    {isHeaderCollapsed === true ? <FiMenu size={18} /> : <FiX size={18} />}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        </>
    )
}

export default Header;