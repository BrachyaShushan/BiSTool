import { useAppContext } from "../context/AppContext";
import { useTokenContext } from "../context/TokenContext";
import { useVariablesContext } from "../context/VariablesContext";
import { useTheme } from "../context/ThemeContext";
import { useProjectContext } from "../context/ProjectContext";

import { FiFolder, FiSettings, FiKey, FiMenu, FiX, FiSun, FiMoon, FiSearch } from "react-icons/fi";
import SaveControls from "../components/ui/SaveControls";
import { ModeSwitcher, SearchBar } from "../components/ui";
import ResponsiveWorkflowSelector from "../components/ui/ResponsiveWorkflowSelector";
import VerticalCategorySelector from "../components/ui/VerticalCategorySelector";
import { useCallback, useEffect, useState } from "react";
import { generateTokenCore } from "../services/tokenService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/toastify-custom.css";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { SectionId } from "../types/core";

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
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { currentProject, clearCurrentProject } = useProjectContext();

    const tokenName = (globalVariables && tokenConfig && tokenConfig.tokenName) || "x-access-token";
    const token = globalVariables?.[tokenName];

    // Create categories from saved sessions
    const categories = savedSessions.reduce((acc: any[], session: any) => {
        const existingCategory = acc.find(cat => cat.id === session.category);
        if (existingCategory) {
            existingCategory.count++;
        } else {
            acc.push({
                id: session.category,
                name: session.category,
                count: 1
            });
        }
        return acc;
    }, []);

    // Create sections from sessions in the current category for ResponsiveWorkflowSelector
    const sessionSections = activeSession?.category
        ? savedSessions
            .filter((s: any) => s.category === activeSession.category)
            .map((session: any) => ({
                id: session.id as SectionId,
                label: session.name,
                className: methodColor[session.requestConfig?.method as keyof typeof methodColor]?.color || ''
            }))
        : [];

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

    // Handle session change from ResponsiveWorkflowSelector
    const handleSessionChange = (sessionId: SectionId) => {
        const session = savedSessions.find((s: any) => s.id === sessionId);
        if (session) {
            handleLoadSession(session);
        }
    };

    // Handle category change from VerticalCategorySelector
    const handleCategoryChange = (categoryId: string) => {
        const sessionsInCategory = savedSessions.filter((s: any) => s.category === categoryId);
        if (sessionsInCategory.length > 0) {
            // Load the first session in the selected category
            const firstSession = sessionsInCategory[0];
            if (firstSession) {
                handleLoadSession(firstSession);
            }
        }
    };

    const toggleHeaderCollapse = useCallback(() => {
        setIsHeaderCollapsed(prev => !prev);
    }, []);

    const toggleMobileSidebar = useCallback(() => {
        setIsMobileSidebarOpen(prev => !prev);
    }, []);

    // Close mobile sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (isMobileSidebarOpen && !target.closest('.mobile-sidebar') && !target.closest('.mobile-sidebar-toggle')) {
                setIsMobileSidebarOpen(false);
            }
        };

        if (isMobileSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isMobileSidebarOpen]);

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

                    {/* Center - Search Bar */}
                    <div className="hidden md:flex flex-1 justify-center items-center max-w-md mx-4">
                        <SearchBar
                            placeholder="Search projects, sessions, variables..."
                            compact
                            className="w-full"
                        />
                    </div>

                    {/* Category and Session Selectors - Hidden on mobile when collapsed */}
                    {categories.length > 0 && (
                        <div className={`hidden sm:flex sm:items-center gap-2 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-md min-w-0 transition-all duration-300 ${isHeaderCollapsed === true ? 'overflow-hidden max-w-0 opacity-0' : 'max-w-lg lg:max-w-xl opacity-100'} dark:bg-gray-700 dark:border-gray-600`}>
                            {/* Vertical Category Selector */}
                            <div className="flex flex-shrink-0">
                                <VerticalCategorySelector
                                    categories={categories}
                                    activeCategory={activeSession?.category || ''}
                                    onCategoryChange={handleCategoryChange}
                                    className="w-32"
                                />
                            </div>

                            {/* Divider */}
                            <div className="w-px h-full bg-gray-300 dark:bg-gray-600"></div>

                            {/* Horizontal Session Selector */}
                            {activeSession?.category && sessionSections.length > 0 && (
                                <div className="flex-1 min-w-0">
                                    <ResponsiveWorkflowSelector
                                        sections={sessionSections}
                                        activeSection={activeSession.id as SectionId}
                                        onSectionChange={handleSessionChange}
                                        className="max-w-full"
                                        useCustomStyling={true}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Right side - Desktop controls and mobile menu button */}
                    <div className="flex flex-shrink-0 items-center space-x-1 sm:space-x-2 md:space-x-3">


                        {/* Center - Mode Switcher (Desktop only) */}
                        <div className="hidden flex-1 justify-center items-center sm:flex">
                            <ModeSwitcher
                                mode={mode}
                                onModeChange={setMode}
                                className="mx-4"
                            />
                        </div>


                        {/* Desktop Controls */}
                        <div className="hidden sm:flex gap-1 justify-end items-center sm:gap-2">
                            {/* Collapsible Header Content */}
                            <div className={`flex items-center space-x-2 sm:space-x-3 md:space-x-4 transition-all duration-300 ease-in-out ${isHeaderCollapsed === true ? 'overflow-hidden max-w-0 opacity-0' : 'max-w-full opacity-100'}`}>
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

                                    {/* Active Session Method Badge */}
                                    {activeSession?.requestConfig && (
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold shadow-md ${methodColor[activeSession.requestConfig.method]?.color
                                                }`}>
                                                {activeSession.requestConfig.method}
                                            </span>
                                        </div>
                                    )}

                                    {/* Search Button */}
                                    <button
                                        onClick={() => {
                                            // Focus on search input
                                            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                                            if (searchInput) {
                                                searchInput.focus();
                                            }
                                        }}
                                        className={`p-2 text-gray-700 bg-gray-100 rounded-lg shadow-md transition-all duration-200 group sm:p-3 sm:rounded-xl hover:scale-105 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:text-white hover:bg-gray-200 hover:text-gray-900`}
                                        title="Search"
                                    >
                                        <FiSearch size={16} className="transition-transform duration-200 group-hover:scale-110 sm:w-4.5 sm:h-4.5" />
                                    </button>

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

                            {/* Desktop Hamburger Menu Button */}
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

                        {/* Mobile Search Button */}
                        <button
                            onClick={() => {
                                // Focus on search input in mobile sidebar
                                setIsMobileSidebarOpen(true);
                                // Add a small delay to ensure sidebar is open
                                setTimeout(() => {
                                    const searchInput = document.querySelector('.mobile-sidebar input[type="text"]') as HTMLInputElement;
                                    if (searchInput) {
                                        searchInput.focus();
                                    }
                                }, 100);
                            }}
                            className="flex sm:hidden justify-center items-center p-2 text-gray-700 bg-gray-100 rounded-lg shadow-md transition-all duration-200 group hover:scale-105 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 hover:bg-gray-200 mr-2"
                            title="Search"
                            aria-label="Search"
                        >
                            <FiSearch size={16} className="transition-transform duration-200 group-hover:scale-110" />
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileSidebar}
                            className="mobile-sidebar-toggle flex sm:hidden justify-center items-center p-2 text-gray-700 bg-gray-100 rounded-lg shadow-md transition-all duration-200 group hover:scale-105 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 hover:bg-gray-200"
                            title="Open menu"
                            aria-label="Open menu"
                        >
                            <FiMenu size={16} className="transition-transform duration-200 group-hover:scale-110" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div className="fixed inset-0 z-50 sm:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="mobile-sidebar absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out">
                        <div className="flex flex-col h-full">
                            {/* Sidebar Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                                <button
                                    onClick={() => setIsMobileSidebarOpen(false)}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            {/* Sidebar Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {/* Search */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Search</h3>
                                    <SearchBar
                                        placeholder="Search..."
                                        compact
                                        className="w-full"
                                    />
                                </div>

                                {/* Mode Switcher */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Mode</h3>
                                    <ModeSwitcher
                                        mode={mode}
                                        onModeChange={setMode}
                                        className="w-full"
                                    />
                                </div>

                                {/* Save Controls */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Save Status</h3>
                                    <SaveControls
                                        autoSave={autoSave}
                                        hasUnsavedChanges={hasUnsavedChanges}
                                        isSaving={isSaving}
                                        lastSaved={lastSaved}
                                    />
                                </div>

                                {/* Active Session Method Badge */}
                                {activeSession?.requestConfig && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Current Method</h3>
                                        <div className="flex items-center">
                                            <span className={`px-3 py-2 rounded-lg text-sm font-bold shadow-md ${methodColor[activeSession.requestConfig.method]?.color}`}>
                                                {activeSession.requestConfig.method}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Categories */}
                                {categories.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Categories</h3>
                                        <div className="max-h-32">
                                            <VerticalCategorySelector
                                                categories={categories}
                                                activeCategory={activeSession?.category || ''}
                                                onCategoryChange={(categoryId) => {
                                                    handleCategoryChange(categoryId);
                                                    setIsMobileSidebarOpen(false);
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Sessions of Current Category */}
                                {activeSession?.category && sessionSections.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                            {activeSession.category} Sessions
                                        </h3>
                                        <div className="max-h-40">
                                            <ResponsiveWorkflowSelector
                                                sections={sessionSections}
                                                activeSection={activeSession.id as SectionId}
                                                onSectionChange={(sessionId) => {
                                                    handleSessionChange(sessionId);
                                                    setIsMobileSidebarOpen(false);
                                                }}
                                                className="w-full"
                                                useCustomStyling={true}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Actions</h3>
                                    <div className="space-y-2">
                                        {/* Theme toggle */}
                                        <button
                                            onClick={toggleDarkMode}
                                            className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                                            </span>
                                            {isDarkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                                        </button>

                                        {/* Project Manager Button */}
                                        <button
                                            onClick={() => {
                                                openUnifiedManager();
                                                setIsMobileSidebarOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manager</span>
                                            <FiSettings size={16} />
                                        </button>

                                        {/* Token Status */}
                                        <button
                                            onClick={() => {
                                                handleRegenerateToken();
                                                setIsMobileSidebarOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-3 text-left rounded-lg transition-colors ${isTokenExpired
                                                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                : isTokenLoading
                                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                                    : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                                                }`}
                                        >
                                            <span className="text-sm font-medium">
                                                {isTokenExpired
                                                    ? "Token Expired"
                                                    : isTokenLoading
                                                        ? "Checking Token..."
                                                        : `Token Valid${tokenDuration !== null ? ` (${Math.round(tokenDuration)}m)` : ""}`
                                                }
                                            </span>
                                            <FiKey size={16} className={isTokenLoading ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </>
    )
}

export default Header;