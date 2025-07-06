import { ExtendedSession, ModalType } from "../../../types/features/SavedManager";
import { useAppContext } from "../../../context/AppContext";
import React, { useEffect, useState } from "react";
import Modal from "../../core/Modal";
import { FiEdit2, FiCopy, FiTrash2, FiFolder, FiPlus, FiDownload, FiUpload, FiChevronDown, FiCheckSquare, FiSquare, FiKey } from "react-icons/fi";
import { useVariablesContext } from '../../../context/VariablesContext';

const SessionsManager = () => {
    const [divideBy, setDivideBy] = useState<'none' | 'category'>("category");
    const [orderBy, setOrderBy] = useState<'date' | 'name' | 'method'>("name");
    const [importData, setImportData] = useState<any>(null);
    const [importStep, setImportStep] = useState<'options' | 'choose'>('options');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [sessionName, setSessionName] = useState<string>("");
    const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
    const [selectedSession, setSelectedSession] = useState<ExtendedSession | null>(null);
    const [sessionCategory, setSessionCategory] = useState<string>("");
    // Import/export states
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedImportSessions, setSelectedImportSessions] = useState<string[]>([]);
    const [selectedImportVariables, setSelectedImportVariables] = useState<string[]>([]);
    const [modalType, setModalType] = useState<ModalType>("new");

    // Add state for open categories
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const toggleCategory = (cat: string) => {
        setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };
    useEffect(() => {
        return () => {
            setShowSessionModal(false);
            setSessionName("");
            setSelectedSession(null);
            setError(null);
        };
    }, []);

    const toggleVariable = (key: string) => {
        setSelectedImportVariables(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const { methodColor, activeSession, savedSessions, handleLoadSession, handleSaveSession, handleDeleteSession } = useAppContext();
    const {
        globalVariables,
        updateGlobalVariable,

    } = useVariablesContext();
    // Convert sharedVariables array to object for logic if needed

    // Utility functions
    const handleSessionAction = (action: ModalType, session: ExtendedSession | null = null): void => {
        setSelectedSession(session);
        setModalType(action);
        if (action === "duplicate" && session) {
            setSessionName(`${session.name} (Copy)`);
            setSessionCategory(session.category || "");
        } else {
            setSessionName(action === "rename" && session ? session.name : "");
            setSessionCategory(action === "rename" && session ? session.category || "" : "");
        }
        setShowSessionModal(true);
    };

    const handleSessionModalSubmit = (): void => {
        if (!validateSessionName(sessionName)) {
            return;
        }

        if (sessionName.trim()) {
            try {
                switch (modalType) {
                    case "new":
                        const newSession: ExtendedSession = {
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            name: sessionName,
                            category: sessionCategory,
                            timestamp: new Date().toISOString(),
                            urlData: {
                                baseURL: "",
                                segments: "",
                                parsedSegments: [],
                                queryParams: [],
                                segmentVariables: [],
                                processedURL: "",
                                domain: "",
                                protocol: "https",
                                builtUrl: "",
                                environment: "development",
                            },
                            requestConfig: {
                                method: "GET",
                                queryParams: [],
                                headers: [],
                                bodyType: "none",
                                jsonBody: "{\n  \n}",
                                formData: [],
                            },
                            yamlOutput: "",
                            segmentVariables: {},
                            sharedVariables: {},
                            activeSection: "url",
                        };
                        handleSaveSession(sessionName, newSession);
                        break;
                    case "rename":
                        if (selectedSession) {
                            const renamedSession: ExtendedSession = {
                                ...selectedSession,
                                name: sessionName,
                                category: sessionCategory,
                            };
                            handleSaveSession(sessionName, renamedSession);
                        }
                        break;
                    case "duplicate":
                        if (selectedSession) {
                            const newSession: ExtendedSession = {
                                ...selectedSession,
                                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                name: sessionName,
                                category: sessionCategory,
                                timestamp: new Date().toISOString(),
                            };
                            handleSaveSession(sessionName, newSession);
                        }
                        break;
                    default:
                        console.warn(`Unknown modal type: ${modalType}`);
                        break;
                }
                setShowSessionModal(false);
                setSessionName("");
                setSessionCategory("");
                setSelectedSession(null);
                setError(null);
            } catch (err) {
                setError("Failed to save session");
            }
        }
    };
    // Session management functions
    const validateSessionName = (name: string): boolean => {
        if (!name.trim()) {
            setError("Session name cannot be empty");
            return false;
        }
        if (savedSessions.some((session) => session.name === name && session.id !== selectedSession?.id)) {
            setError("A session with this name already exists");
            return false;
        }
        setError(null);
        return true;
    };


    const orderSessions = (sessions: ExtendedSession[]) => {
        return [...sessions].sort((a, b) => {
            switch (orderBy) {
                case 'date':
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                case 'method':
                    return (a.requestConfig?.method || '').localeCompare(b.requestConfig?.method || '');
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });
    };

    const groupByCategory = (sessions: ExtendedSession[]) => {
        return sessions.reduce((acc, session) => {
            const category = session.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(session);
            return acc;
        }, {} as Record<string, ExtendedSession[]>);
    };

    const sessionCard = (session: ExtendedSession) => (
        <div
            key={session.id}
            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${activeSession?.id === session.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-md"
                : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
            onClick={() => handleLoadSession(session)}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start flex-1 min-w-0 space-x-3">
                    {/* Method Icon */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${methodColor[session.requestConfig?.method as keyof typeof methodColor]?.color || "text-gray-600 dark:text-gray-400"
                        }`}>
                        <span className={`text-xs font-bold`}>
                            {session.requestConfig?.method || "GET"}
                        </span>
                    </div>

                    {/* Session Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1 space-x-2">
                            <h3 className={`font-semibold truncate ${activeSession?.id === session.id
                                ? "text-blue-800 dark:text-blue-200"
                                : "text-gray-900 dark:text-white"
                                }`}>
                                {session.name}
                            </h3>
                            {activeSession?.id === session.id && (
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full dark:text-blue-100 dark:bg-blue-600 text-blue-700 bg-blue-100`}>
                                    Active
                                </span>
                            )}
                            {session.category && (
                                <span className={`px-2 py-1 text-xs rounded-full dark:text-gray-300 dark:bg-gray-600 text-gray-600 bg-gray-200`}>
                                    {session.category}
                                </span>
                            )}
                        </div>

                        {/* Generated URL */}
                        {(session.urlData?.builtUrl || session.urlData?.processedURL) && (
                            <div className="flex items-center mb-2 space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">🔗</span>
                                <button
                                    title={session.urlData?.builtUrl || session.urlData?.processedURL}
                                    className="text-xs text-gray-600 truncate transition-colors cursor-pointer dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                    onClick={e => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(session.urlData?.builtUrl || session.urlData?.processedURL || '');
                                    }}
                                >
                                    {session.urlData?.builtUrl || session.urlData?.processedURL}
                                </button>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>📅 {new Date(session.timestamp).toLocaleDateString()}</span>
                            {session.urlData?.environment && (
                                <span className={`px-2 py-1 rounded-full text-xs ${session.urlData.environment === 'production'
                                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    }`}>
                                    {session.urlData.environment}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center flex-shrink-0 ml-4 space-x-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSessionAction("rename", session);
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900 text-gray-600 hover:text-blue-600 hover:bg-blue-100`}
                        title="Rename session"
                    >
                        <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSessionAction("duplicate", session);
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900 text-gray-600 hover:text-green-600 hover:bg-green-100`}
                        title="Duplicate session"
                    >
                        <FiCopy className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900 text-gray-600 hover:text-red-600 hover:bg-red-100`}
                        title="Delete session"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    // Get unique categories from savedSessions
    const existingCategories = Array.from(new Set(savedSessions.map(s => (s.category || '').trim()).filter(Boolean)));

    // Export handler
    const handleExport = () => {
        const safeGlobalVariables = Object.fromEntries(Object.entries(globalVariables).map(([key, _]) => [key, '']));
        const data = {
            savedSessions,
            globalVariables: safeGlobalVariables,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'saved_manager_export.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import handlers
    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
        fileInputRef.current?.click();
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                setImportData(data);
                setImportStep('options');
                setShowImportModal(true);
                setSelectedImportSessions(data.savedSessions?.map((s: any) => s.id) || []);
                setSelectedImportVariables(Object.keys(data.globalVariables || {}));
            } catch (err) {
                setError('Invalid import file');
            }
        };
        reader.readAsText(file);
    };
    const handleImportOption = (option: 'add' | 'override' | 'choose') => {
        if (!importData) return;
        if (option === 'add') {
            // Merge sessions (skip duplicates by id)
            const newSessions = importData.savedSessions?.filter((s: any) => !savedSessions.some(currentSession => currentSession.id === s.id)) || [];
            const mergedSessions = [...savedSessions, ...newSessions];
            // Merge variables (skip duplicates by key)
            const newVars = Object.entries(importData.globalVariables || {}).filter(([k]) => !(k in globalVariables));
            const mergedVars = { ...globalVariables, ...Object.fromEntries(newVars) };
            // Save
            mergedSessions.forEach(s => handleSaveSession(s.name, s));
            Object.entries(mergedVars).forEach(([k, v]) => updateGlobalVariable(k, v as string));
            setShowImportModal(false);
        } else if (option === 'override') {
            // Replace all
            (importData.savedSessions || []).forEach((s: any) => handleSaveSession(s.name, s));
            Object.entries(importData.globalVariables || {}).forEach(([k, v]) => updateGlobalVariable(k, v as string));
            setShowImportModal(false);
        } else if (option === 'choose') {
            setImportStep('choose');
        }
    };
    const handleChooseImport = () => {
        if (!importData) return;
        // Sessions
        const chosenSessions = (importData.savedSessions || []).filter((s: any) => selectedImportSessions.includes(s.id));
        chosenSessions.forEach((s: any) => handleSaveSession(s.name, s));
        // Variables
        const chosenVars = Object.fromEntries(
            Object.entries(importData.globalVariables || {}).filter(([k]) => selectedImportVariables.includes(k))
        );
        Object.entries(chosenVars).forEach(([k, v]) => updateGlobalVariable(k, v as string));
        setShowImportModal(false);
    };
    const toggleSession = (id: string) => {
        setSelectedImportSessions(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    return (
        <>
            <div className="space-y-6">
                {/* Professional Header Section */}
                <div className="relative p-6 overflow-hidden border border-blue-100 shadow-sm bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 dark:opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 translate-x-16 -translate-y-16 bg-blue-500 rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 -translate-x-12 translate-y-12 bg-indigo-500 rounded-full"></div>
                    </div>

                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Title and Stats */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                                    <FiFolder className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400`}>
                                        Session Manager
                                    </h3>
                                    <div className="flex items-center mt-1 space-x-4">
                                        <p className={`text-sm font-medium dark:text-gray-300 text-gray-600`}>
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                                                {savedSessions.length} session{savedSessions.length !== 1 ? 's' : ''}
                                            </span>
                                        </p>
                                        <p className={`text-sm dark:text-gray-400 text-gray-500`}>
                                            {activeSession ? (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">
                                                    ✓ Active session loaded
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">
                                                    No active session
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => handleSessionAction('new')}
                                className={`group relative px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg overflow-hidden text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-blue-500/25`}
                                data-testid="session-create"
                            >
                                <div className="absolute inset-0 transition-transform duration-700 transform -translate-x-full -skew-x-12 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full"></div>
                                <FiPlus className="relative z-10 w-4 h-4" />
                                <span className="relative z-10">New Session</span>
                            </button>
                            <button
                                onClick={handleExport}
                                className={`group relative px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg overflow-hidden dark:text-white dark:bg-gradient-to-r dark:from-gray-700 dark:via-gray-600 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:via-gray-700 dark:hover:to-gray-900 dark:shadow-gray-500/25 text-gray-800 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 hover:from-gray-200 hover:via-gray-300 hover:to-gray-400 shadow-gray-500/25`}
                            >
                                <FiDownload className="relative z-10 w-4 h-4" />
                                <span className="relative z-10">Export</span>
                            </button>
                            <button
                                onClick={handleImportClick}
                                className={`group relative px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg overflow-hidden dark:text-white dark:bg-gradient-to-r dark:from-gray-700 dark:via-gray-600 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:via-gray-700 dark:hover:to-gray-900 dark:shadow-gray-500/25 text-gray-800 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 hover:from-gray-200 hover:via-gray-300 hover:to-gray-400 shadow-gray-500/25`}
                            >
                                <FiUpload className="relative z-10 w-4 h-4" />
                                <span className="relative z-10">Import</span>
                            </button>
                            {/* Hidden file input for import */}
                            <input
                                type="file"
                                accept="application/json"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* View Controls */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <label className={`text-sm font-semibold dark:text-gray-300 text-gray-700`}>
                                    Group by:
                                </label>
                                <div className="relative group">
                                    <select
                                        value={divideBy}
                                        onChange={e => setDivideBy(e.target.value as 'none' | 'category')}
                                        className={`appearance-none px-4 py-2 pr-10 rounded-lg text-sm border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm cursor-pointer dark:text-white dark:bg-gray-700 dark:border-gray-600 dark:focus:bg-gray-600 dark:hover:bg-gray-600 dark:focus:border-blue-400 text-gray-900 bg-white border-gray-300 focus:bg-white hover:bg-gray-50 `}
                                        data-grouping-options="none,category"
                                        data-default-value="category"
                                        data-control-type="grouping-selector"
                                        data-available-options='[{"value":"none","label":"No grouping","icon":"📋","description":"Display all sessions in a flat list"},{"value":"category","label":"By category","icon":"📁","description":"Group sessions by their categories"}]'
                                        data-current-selection={divideBy}
                                        data-session-count={savedSessions.length}
                                        data-category-count={Object.keys(groupByCategory(savedSessions)).length}
                                    >
                                        <option value="none" className={`dark:text-white dark:bg-gray-700 text-gray-900 bg-white`}>
                                            📋 No grouping
                                        </option>
                                        <option value="category" className={`dark:text-white dark:bg-gray-700 text-gray-900 bg-white`}>
                                            📁 By category
                                        </option>
                                    </select>
                                    <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none dark:text-gray-400 text-gray-500`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {/* Expert Design Tooltip */}
                                    <div className={`absolute -bottom-8 left-0 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none dark:text-gray-300 dark:bg-gray-800 text-gray-100 bg-gray-900`}>
                                        {divideBy === 'none' ? 'Flat list view' : 'Category-based grouping'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sort Controls */}
                        <div className="flex items-center space-x-3">
                            <label className={`text-sm font-semibold dark:text-gray-300 text-gray-700`}>
                                Sort by:
                            </label>
                            <div className="flex space-x-1">
                                {[
                                    { key: 'name', label: 'Name', icon: '📝' },
                                    { key: 'date', label: 'Date', icon: '📅' },
                                    { key: 'method', label: 'Method', icon: '🔧' }
                                ].map(({ key, label, icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setOrderBy(key as 'date' | 'name' | 'method')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${orderBy === key
                                            ? 'dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 dark:text-white dark:shadow-lg dark:shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:border dark:border-gray-600 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-200'}`}
                                    >
                                        <span className="text-xs">{icon}</span>
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Session List */}
                {divideBy === 'category' ? (
                    Object.entries(groupByCategory(orderSessions(savedSessions))).map(([cat, sessions]) => {
                        const isOpen = openCategories[cat] || false;
                        return (
                            <div key={cat} className="mb-4">
                                <button
                                    className={`flex items-center w-full text-left font-semibold mb-2 px-4 py-3 rounded-lg transition-colors focus:outline-none border border-transparent hover:border-blue-300 focus:border-blue-400 bg-white dark:bg-gray-800 dark:text-gray-100 ${isOpen ? 'dark:shadow-lg shadow-md' : ''}`}
                                    onClick={() => toggleCategory(cat)}
                                    aria-expanded={isOpen}
                                >
                                    <FiChevronDown
                                        className={`transition-transform duration-200 mr-2 ${isOpen ? 'rotate-180' : ''}`}
                                        aria-hidden="true"
                                    />
                                    <span className="flex-1">{cat}</span>
                                    <span className="text-xs text-gray-400">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'max-h-0 opacity-0'}`}
                                    style={{ willChange: 'max-height, opacity' }}
                                    aria-hidden={!isOpen}
                                >
                                    <div className="p-2 space-y-2">
                                        {sessions.map((session) => sessionCard(session))}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="space-y-2">
                        {orderSessions(savedSessions).map((session) => sessionCard(session))}
                    </div>
                )}
            </div>

            {/* Session Modal */}
            <Modal
                isOpen={showSessionModal}
                onClose={() => {
                    setShowSessionModal(false);
                    setSessionName("");
                    setSessionCategory("");
                    setSelectedSession(null);
                }}
                onSave={handleSessionModalSubmit}
                title={
                    modalType === "new"
                        ? "New Session"
                        : modalType === "rename"
                            ? "Rename Session"
                            : "Duplicate Session"
                }
            >
                <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Session name"
                    className={`w-full px-3 py-2 rounded-md border mb-4 dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300`}
                    data-testid="session-name-input"
                />
                <input
                    type="text"
                    value={sessionCategory}
                    onChange={(e) => setSessionCategory(e.target.value)}
                    placeholder="Category (optional)"
                    list="category-list"
                    className={`w-full px-3 py-2 rounded-md border mb-4 dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300`}
                />
                <datalist id="category-list">
                    {existingCategories.map((cat) => (
                        <option key={cat} value={cat} />
                    ))}
                </datalist>
                {error && (
                    <p className={`text-sm dark:text-red-400 text-red-600 mb-4`}>
                        {error}
                    </p>
                )}
            </Modal>

            {/* Import Modal */}
            {showImportModal && (
                <Modal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    title={importStep === 'options' ? 'Import Data' : 'Select Items to Import'}
                    showSaveButton={false}
                    size="2xl"
                >
                    {importStep === 'options' ? (
                        <div className="space-y-6">
                            {/* Import Summary */}
                            <div className="p-4 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl dark:from-gray-800 dark:to-gray-700 dark:border-gray-600">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                                        <FiUpload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold dark:text-gray-200 text-gray-800`}>
                                            Import Summary
                                        </h4>
                                        <div className="flex items-center mt-1 space-x-4 text-sm">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full dark:text-blue-200 dark:bg-blue-900 text-blue-800 bg-blue-100`}>
                                                {(importData?.savedSessions || []).length} sessions
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full dark:text-green-200 dark:bg-green-900 text-green-800 bg-green-100`}>
                                                {Object.keys(importData?.globalVariables || {}).length} variables
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Import Options */}
                            <div className="space-y-4">
                                <h4 className={`text-lg font-semibold dark:text-gray-200 text-gray-800`}>
                                    Choose Import Strategy
                                </h4>

                                {/* Add Option */}
                                <button
                                    onClick={() => handleImportOption('add')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-gray-700 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-3 rounded-lg dark:bg-green-900 bg-green-100`}>
                                            <FiPlus className={`w-6 h-6 dark:text-green-400 text-green-600`} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h5 className={`font-semibold mb-1 dark:text-gray-200 text-gray-800`}>
                                                Merge & Add
                                            </h5>
                                            <p className={`text-sm mb-2 dark:text-gray-400 text-gray-600`}>
                                                Import new items and merge with existing data. Duplicates will be skipped.
                                            </p>
                                            <div className="flex items-center space-x-2 text-xs">
                                                <span className={`px-2 py-1 rounded-full dark:text-gray-300 dark:bg-gray-700 text-gray-600 bg-gray-100`}>
                                                    Safe option
                                                </span>
                                                <span className={`px-2 py-1 rounded-full dark:text-green-300 dark:bg-green-900 text-green-700 bg-green-100`}>
                                                    Recommended
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-lg transition-colors dark:text-gray-400 text-gray-500 group-hover:text-green-600`}>
                                            <FiChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </button>

                                {/* Override Option */}
                                <button
                                    onClick={() => handleImportOption('override')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group dark:border-gray-600 dark:bg-gray-800 dark:hover:border-red-500 dark:hover:bg-gray-700 border-gray-200 bg-white hover:border-red-500 hover:bg-red-50`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-3 rounded-lg dark:bg-red-900 bg-red-100`}>
                                            <FiTrash2 className={`w-6 h-6 dark:text-red-400 text-red-600`} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h5 className={`font-semibold mb-1 dark:text-gray-200 text-gray-800`}>
                                                Replace All
                                            </h5>
                                            <p className={`text-sm mb-2 dark:text-gray-400 text-gray-600`}>
                                                Replace all existing data with imported data. This will overwrite everything.
                                            </p>
                                            <div className="flex items-center space-x-2 text-xs">
                                                <span className={`px-2 py-1 rounded-full dark:text-red-300 dark:bg-red-900 text-red-700 bg-red-100`}>
                                                    Destructive
                                                </span>
                                                <span className={`px-2 py-1 rounded-full dark:text-gray-300 dark:bg-gray-700 text-gray-600 bg-gray-100`}>
                                                    Use with caution
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-lg transition-colors dark:text-gray-400 text-gray-500 group-hover:text-red-600`}>
                                            <FiChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </button>

                                {/* Choose Option */}
                                <button
                                    onClick={() => handleImportOption('choose')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group dark:border-gray-600 dark:bg-gray-800 dark:hover:border-yellow-500 dark:hover:bg-gray-700 border-gray-200 bg-white hover:border-yellow-500 hover:bg-yellow-50`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-3 rounded-lg dark:bg-yellow-900 bg-yellow-100`}>
                                            <FiCheckSquare className={`w-6 h-6 dark:text-yellow-400 text-yellow-600`} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h5 className={`font-semibold mb-1 dark:text-gray-200 text-gray-800`}>
                                                Selective Import
                                            </h5>
                                            <p className={`text-sm mb-2 dark:text-gray-400 text-gray-600`}>
                                                Choose exactly which sessions and variables to import.
                                            </p>
                                            <div className="flex items-center space-x-2 text-xs">
                                                <span className={`px-2 py-1 rounded-full dark:text-yellow-300 dark:bg-yellow-900 text-yellow-700 bg-yellow-100`}>
                                                    Granular control
                                                </span>
                                                <span className={`px-2 py-1 rounded-full dark:text-gray-300 dark:bg-gray-700 text-gray-600 bg-gray-100`}>
                                                    Most flexible
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-lg transition-colors dark:text-gray-400 text-gray-500 group-hover:text-yellow-600`}>
                                            <FiChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Selection Summary */}
                            <div className="p-4 border border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl dark:from-gray-800 dark:to-gray-700 dark:border-gray-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                                            <FiCheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold dark:text-gray-200 text-gray-800`}>
                                                Selection Summary
                                            </h4>
                                            <div className="flex items-center mt-1 space-x-4 text-sm">
                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full dark:text-purple-200 dark:bg-purple-900 text-purple-800 bg-purple-100`}>
                                                    {selectedImportSessions.length} of {(importData?.savedSessions || []).length} sessions
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full dark:text-purple-200 dark:bg-purple-900 text-purple-800 bg-purple-100`}>
                                                    {selectedImportVariables.length} of {Object.keys(importData?.globalVariables || {}).length} variables
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleChooseImport}
                                        disabled={selectedImportSessions.length === 0 && selectedImportVariables.length === 0}
                                        className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white dark:bg-gradient-to-r dark:from-purple-600 dark:to-violet-600 dark:hover:from-purple-700 dark:hover:to-violet-700 dark:shadow-purple-500/25 text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-purple-500/25`}
                                    >
                                        Import Selected
                                    </button>
                                </div>
                            </div>

                            {/* Sessions Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className={`text-lg font-semibold flex items-center space-x-2 dark:text-gray-200 text-gray-800`}>
                                        <FiFolder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <span>Sessions</span>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full dark:text-blue-200 dark:bg-blue-900 text-blue-800 bg-blue-100`}>
                                            {(importData?.savedSessions || []).length}
                                        </span>
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setSelectedImportSessions((importData?.savedSessions || []).map((s: any) => s.id))}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900 text-blue-600 hover:text-blue-700 hover:bg-blue-100`}
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={() => setSelectedImportSessions([])}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 text-gray-600 hover:text-gray-700 hover:bg-gray-100`}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 space-y-2 overflow-y-auto border border-gray-200 rounded-lg max-h-60 dark:border-gray-600">
                                    {(importData?.savedSessions || []).map((s: any) => {
                                        const isSelected = selectedImportSessions.includes(s.id);
                                        const alreadyExists = savedSessions.some(currentSession => currentSession.id === s.id);
                                        return (
                                            <div
                                                key={s.id}
                                                className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${isSelected
                                                    ? "bg-blue-50 border-blue-500 dark:bg-blue-900/20"
                                                    : "bg-gray-50 border-gray-200 dark:border-gray-600 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                                                    }`}
                                                onClick={() => toggleSession(s.id)}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={`p-1 rounded ${isSelected
                                                        ? "bg-blue-100 dark:bg-blue-900"
                                                        : "bg-gray-100 dark:bg-gray-600"
                                                        }`}>
                                                        {isSelected ? (
                                                            <FiCheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        ) : (
                                                            <FiSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2">
                                                            <h5 className={`font-medium truncate ${isSelected
                                                                ? "text-blue-800 dark:text-blue-200"
                                                                : "text-gray-900 dark:text-white"
                                                                }`}>
                                                                {s.name}
                                                            </h5>
                                                            {alreadyExists && (
                                                                <span className={`px-2 py-1 text-xs rounded-full dark:text-orange-200 dark:bg-orange-900 text-orange-700 bg-orange-100`}>
                                                                    Exists
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-xs mt-1 ${isSelected
                                                            ? "text-blue-600 dark:text-blue-300"
                                                            : "text-gray-500 dark:text-gray-400"
                                                            }`}>
                                                            {s.requestConfig?.method || 'GET'} • {new Date(s.timestamp).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Variables Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className={`text-lg font-semibold flex items-center space-x-2 dark:text-gray-200 text-gray-800`}>
                                        <FiKey className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        <span>Global Variables</span>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full dark:text-green-200 dark:bg-green-900 text-green-800 bg-green-100`}>
                                            {Object.keys(importData?.globalVariables || {}).length}
                                        </span>
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setSelectedImportVariables(Object.keys(importData?.globalVariables || {}))}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900 text-green-600 hover:text-green-700 hover:bg-green-100`}
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={() => setSelectedImportVariables([])}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 text-gray-600 hover:text-gray-700 hover:bg-gray-100`}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 space-y-2 overflow-y-auto border border-gray-200 rounded-lg max-h-60 dark:border-gray-600">
                                    {Object.entries(importData?.globalVariables || {}).map(([k, _]) => {
                                        const isSelected = selectedImportVariables.includes(k);
                                        const alreadyExists = globalVariables[k] !== undefined;
                                        return (
                                            <div
                                                key={k}
                                                className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${isSelected
                                                    ? "bg-green-50 border-green-500 dark:bg-green-900/20"
                                                    : "bg-gray-50 border-gray-200 dark:border-gray-600 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                                                    }`}
                                                onClick={() => toggleVariable(k)}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={`p-1 rounded ${isSelected
                                                        ? "bg-green-100 dark:bg-green-900"
                                                        : "bg-gray-100 dark:bg-gray-600"
                                                        }`}>
                                                        {isSelected ? (
                                                            <FiCheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        ) : (
                                                            <FiSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2">
                                                            <h5 className={`font-medium truncate ${isSelected
                                                                ? "text-green-800 dark:text-green-200"
                                                                : "text-gray-900 dark:text-white"
                                                                }`}>
                                                                {k}
                                                            </h5>
                                                            {alreadyExists && (
                                                                <span className={`px-2 py-1 text-xs rounded-full dark:text-orange-200 dark:bg-orange-900 text-orange-700 bg-orange-100`}>
                                                                    Exists
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-xs mt-1 truncate ${isSelected
                                                            ? "text-green-600 dark:text-green-300"
                                                            : "text-gray-500 dark:text-gray-400"
                                                            }`}>
                                                            {_ as string}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="p-3 mt-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                            <p className={`text-sm dark:text-red-300 text-red-600`}>
                                {error}
                            </p>
                        </div>
                    )}
                </Modal>
            )}

        </>
    )
}
export default SessionsManager;