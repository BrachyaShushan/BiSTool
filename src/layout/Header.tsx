import { useAppContext } from "../context/AppContext";
import { useTokenContext } from "../context/TokenContext";
import { useVariablesContext } from "../context/VariablesContext";
import { useTheme } from "../context/ThemeContext";
import { useProjectContext } from "../context/ProjectContext";

import { FiFolder, FiSettings, FiKey, FiMenu, FiX, FiSun, FiMoon, FiArrowRight } from "react-icons/fi";
import SaveControls from "../components/ui/SaveControls";
import { ModeSwitcher } from "../components/ui";
import { useCallback, useEffect, useState } from "react";
import { generateTokenCore } from "../services/tokenService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/toastify-custom.css";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";

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
        openUnifiedManager,
        // Mode management
        mode,
        setMode,
    } = useAppContext();
    const { tokenConfig } = useTokenContext();
    const { globalVariables, updateGlobalVariable, replaceVariables } = useVariablesContext();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [isTokenLoading, setIsTokenLoading] = useState(false);
    const [isTokenExpired, setIsTokenExpired] = useState(false);
    const [tokenDuration, setTokenDuration] = useState<number | null>(null);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const { currentProject, clearCurrentProject } = useProjectContext();

    const tokenName = (globalVariables && tokenConfig && tokenConfig.tokenName) || "x-access-token";
    const token = globalVariables?.[tokenName];

    // Token regeneration logic using generateTokenCore
    const handleRegenerateToken = async () => {
        setIsTokenLoading(true);
        try {
            const result = await generateTokenCore({
                globalVariables,
                tokenConfig,
                updateGlobalVariable,
                replaceVariables,
            });
            if (!result.success) {
                toast.error(
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FiAlertCircle style={{ marginRight: 12, fontSize: 22, color: '#ef4444' }} />
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 2 }}>Token Generation Failed</div>
                            <div style={{ fontSize: '0.98em', whiteSpace: 'pre-line' }}>{result.error || "Token fetch failed"}</div>
                        </div>
                    </div>
                );
            } else {
                toast.success(
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FiCheckCircle style={{ marginRight: 12, fontSize: 22, color: '#22c55e' }} />
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 2 }}>Token Generated</div>
                            <div style={{ fontSize: '0.98em', whiteSpace: 'pre-line' }}>{result.details ? result.details : 'Token generated successfully.'}</div>
                        </div>
                    </div>
                );
            }
        } catch (e) {
            toast.error(
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FiAlertCircle style={{ marginRight: 12, fontSize: 22, color: '#ef4444' }} />
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>Token Generation Error</div>
                        <div style={{ fontSize: '0.98em', whiteSpace: 'pre-line' }}>{e instanceof Error ? e.message : String(e)}</div>
                    </div>
                </div>
            );
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
    useEffect(() => {
        setIsTokenLoading(true);
        if (!token || token.trim() === "") {
            setTokenDuration(null);
            setIsTokenExpired(true);
            setIsTokenLoading(false);
            return;
        }
        try {
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
    }, [token]);

    return (
        <>
            <header className={`sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-all duration-300 dark:bg-gray-900 dark:border-gray-700`}>
                <div className="flex justify-between items-center px-3 py-2 sm:px-4 md:px-6 sm:py-3">
                    {/* Left side - Project info and navigation */}
                    <div className="flex flex-1 items-center space-x-2 min-w-0 sm:space-x-4">
                        <button
                            onClick={handleReturnToWelcome}
                            className="flex flex-shrink-0 items-center space-x-2 transition-all duration-200 sm:space-x-3 group hover:scale-105"
                            title="Return to Welcome Screen"
                        >
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg sm:p-3 sm:rounded-xl">
                                <h1 className="text-lg font-bold text-white sm:text-2xl">B</h1>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <h1 className="text-lg font-bold text-transparent truncate bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 sm:text-xl md:text-2xl dark:from-blue-400 dark:to-indigo-400">
                                    BiSTool
                                </h1>
                                {currentProject && (
                                    <div className="flex items-center mt-0.5 sm:mt-1 space-x-1 sm:space-x-2 min-w-0">
                                        <FiFolder size={12} className="text-gray-500 dark:text-gray-400 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                                        <span className="text-xs font-medium text-gray-600 truncate sm:text-sm dark:text-gray-300">
                                            {currentProject.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </button>
                    </div>

                    {/* Center - Mode Switcher */}
                    <div className="hidden flex-1 justify-center items-center sm:flex">
                        <ModeSwitcher
                            mode={mode}
                            onModeChange={setMode}
                            className="mx-4"
                        />
                    </div>

                    {/* Right side - Save controls and theme toggle */}
                    <div className="flex flex-shrink-0 items-center space-x-1 sm:space-x-2 md:space-x-3">

                        {/* Sessions of Current Category - Hidden on mobile when collapsed */}
                        {activeSession?.category && (
                            <div className={`hidden sm:flex gap-2 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-md min-w-0 transition-all duration-300 ${isHeaderCollapsed === true ? 'overflow-hidden max-w-0 opacity-0' : 'max-w-xs lg:max-w-md opacity-100'} dark:bg-gray-700 dark:border-gray-600`}>
                                <div className="flex flex-shrink-0 items-center space-x-2">
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
                                            className="absolute left-0 top-1/2 z-10 p-1 bg-white rounded-full border border-gray-200 shadow-md opacity-0 transition-all duration-200 -translate-y-1/2 dark:bg-gray-700 dark:border-gray-600 group-hover:opacity-100 hover:scale-110"
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
                                            className="absolute right-0 top-1/2 z-10 p-1 bg-white rounded-full border border-gray-200 shadow-md opacity-0 transition-all duration-200 -translate-y-1/2 dark:bg-gray-700 dark:border-gray-600 group-hover:opacity-100 hover:scale-110"
                                            title="Scroll right"
                                        >
                                            <FiArrowRight className="w-2.5 h-2.5 text-gray-600 dark:text-gray-300" />
                                        </button>

                                        {/* Scrollable Content */}
                                        <div
                                            id="sessions-scroll"
                                            className="flex overflow-x-auto gap-1 items-center px-4 scrollbar-hide scroll-smooth"
                                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                        >
                                            {savedSessions
                                                .filter((s: any) => s.category === activeSession.category)
                                                .map((session: any) => (
                                                    <button
                                                        key={session.id}
                                                        onClick={() => handleLoadSession(session)}
                                                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 flex-shrink-0 whitespace-nowrap ${methodColor[session.requestConfig?.method as keyof typeof methodColor]?.color
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
                                    <span className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">No other sessions</span>
                                )}
                            </div>
                        )}

                        <div className="flex gap-1 justify-end items-center sm:gap-2">
                            {/* Collapsible Header Content */}
                            <div className={`flex items-center space-x-2 sm:space-x-3 md:space-x-4 transition-all duration-300 ease-in-out ${isHeaderCollapsed === true ? 'overflow-hidden max-w-0 opacity-0' : 'max-w-full opacity-100'}`}>
                                {/* Mobile Mode Switcher */}
                                <div className="sm:hidden">
                                    <ModeSwitcher
                                        mode={mode}
                                        onModeChange={setMode}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-1 sm:space-x-2">

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
                                        className={`p-1.5 sm:p-2 rounded-lg transition-colors dark:hover:bg-gray-700 hover:bg-gray-100`}
                                        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                                    >
                                        {isDarkMode ? <FiSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </button>

                                    {/* Active Session Method Badge - Hidden on mobile */}
                                    {activeSession?.requestConfig && (
                                        <div className="hidden items-center space-x-2 sm:flex">
                                            <span className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold shadow-md ${methodColor[activeSession.requestConfig.method]?.color
                                                }`}>
                                                {activeSession.requestConfig.method}
                                            </span>
                                        </div>
                                    )}

                                    {/* Project Manager Button */}
                                    <button
                                        onClick={() => openUnifiedManager()}
                                        className={`p-2 text-gray-700 bg-gray-100 rounded-lg shadow-md transition-all duration-200 group sm:p-3 sm:rounded-xl hover:scale-105 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:text-white hover:bg-gray-200 hover:text-gray-900`}
                                        title="Manager"
                                    >
                                        <FiSettings size={16} className="transition-transform duration-200 group-hover:rotate-90 sm:w-4.5 sm:h-4.5" />
                                    </button>

                                    {/* Token Status */}
                                    <button
                                        onClick={handleRegenerateToken}
                                        className={`group p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-105 shadow-md ${isTokenExpired
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
                                        <FiKey size={16} className={`transition-transform duration-200 group-hover:scale-110 ${isTokenLoading ? 'animate-spin' : ''} sm:w-4.5 sm:h-4.5`} />
                                    </button>
                                </div>
                            </div>

                            {/* Hamburger Menu Button */}
                            <button
                                onClick={toggleHeaderCollapse}
                                className={`flex justify-center items-center p-2 text-gray-700 bg-gray-100 rounded-lg shadow-md transition-all duration-200 group sm:p-3 sm:rounded-xl hover:scale-105 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 hover:bg-gray-200`}
                                title={isHeaderCollapsed === true ? "Expand header" : "Collapse header"}
                                aria-label={isHeaderCollapsed === true ? "Expand header" : "Collapse header"}
                            >
                                <div className="transition-transform duration-200 group-hover:scale-110">
                                    {isHeaderCollapsed === true ? <FiMenu size={16} className="sm:w-4.5 sm:h-4.5" /> : <FiX size={16} className="sm:w-4.5 sm:h-4.5" />}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </>
    )
}

export default Header;