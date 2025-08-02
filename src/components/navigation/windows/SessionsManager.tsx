import { ExtendedSession, ModalType } from "@/types";
import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { FiEdit2, FiCopy, FiTrash2, FiFolder, FiPlus, FiDownload, FiUpload, FiChevronDown, FiCheckSquare, FiSquare, FiKey, FiGlobe, FiDatabase, FiWifi, FiSettings } from "react-icons/fi";
import { useVariablesContext } from '@/context/VariablesContext';
import { HTTP_METHODS, METHOD_ICONS } from '@/constants/requestConfig';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { IconWrapper } from "@/components/ui";

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
    // Duplicate modal state
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateMethods, setDuplicateMethods] = useState<string[]>([]);

    // New session modal states
    const [showNewSessionModal, setShowNewSessionModal] = useState(false);
    const [selectedApiPattern, setSelectedApiPattern] = useState<'rest' | 'graphql' | 'websocket' | 'custom' | null>(null);
    const [restApiConfig, setRestApiConfig] = useState({
        baseUrl: '',
        resourceName: '',
        hasAuth: false,
        authType: 'bearer' as 'bearer' | 'basic' | 'api-key',
        endpoints: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as string[]
    });

    // GraphQL API configuration
    const [graphqlApiConfig, setGraphqlApiConfig] = useState({
        endpoint: '/graphql',
        operations: ['query', 'mutation', 'subscription'] as string[],
        hasAuth: false,
        authType: 'bearer' as 'bearer' | 'basic' | 'api-key',
        selectedQueries: [] as string[],
        selectedMutations: [] as string[],
        selectedSubscriptions: [] as string[]
    });

    // WebSocket API configuration
    const [websocketApiConfig, setWebsocketApiConfig] = useState({
        endpoint: '/ws',
        events: ['connect', 'message', 'disconnect', 'error'] as string[],
        hasAuth: false,
        authType: 'bearer' as 'bearer' | 'basic' | 'api-key',
        selectedEvents: [] as string[]
    });

    // Custom API configuration
    const [customApiConfig, setCustomApiConfig] = useState({
        name: '',
        method: 'GET',
        path: '',
        hasAuth: false,
        authType: 'bearer' as 'bearer' | 'basic' | 'api-key',
        bodyType: 'none' as 'none' | 'json' | 'form' | 'text'
    });

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
            setDuplicateMethods([session.requestConfig?.method || 'GET']); // default to current method
            setShowDuplicateModal(true);
            setShowSessionModal(false);
        } else {
            setSessionName(action === "rename" && session ? session.name : "");
            setSessionCategory(action === "rename" && session ? session.category || "" : "");
            setShowSessionModal(true);
        }
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
                            <span><IconWrapper icon="📅" variant="colored" /> {new Date(session.timestamp).toLocaleDateString()}</span>
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

    // Handle duplicate modal confirm
    const handleDuplicateConfirm = () => {
        if (!selectedSession || duplicateMethods.length === 0) return;
        duplicateMethods.forEach(method => {
            // Ensure all required fields for requestConfig
            const origReq = selectedSession.requestConfig || {
                method: method,
                queryParams: [],
                headers: [],
                bodyType: 'none',
                jsonBody: '',
                formData: [],
                textBody: '',
            };
            const newSession: ExtendedSession = {
                ...selectedSession,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: `${sessionName} [${method}]`,
                category: sessionCategory,
                timestamp: new Date().toISOString(),
                requestConfig: {
                    ...origReq,
                    method: method as any,
                    queryParams: origReq.queryParams || [],
                    headers: origReq.headers || [],
                    bodyType: origReq.bodyType || 'none',
                    jsonBody: origReq.jsonBody || '',
                    formData: origReq.formData || [],
                    textBody: origReq.textBody || '',
                },
            };
            handleSaveSession(newSession.name, newSession);
        });
        setShowDuplicateModal(false);
        setDuplicateMethods([]);
        setSessionName("");
        setSessionCategory("");
        setSelectedSession(null);
        setError(null);
    };

    // Handle new session button click
    const handleNewSessionClick = () => {
        setShowNewSessionModal(true);
        setSelectedApiPattern(null);
        setRestApiConfig({
            baseUrl: '',
            resourceName: '',
            hasAuth: false,
            authType: 'bearer',
            endpoints: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        });
    };

    // Handle REST API creation
    const handleRestApiCreation = () => {
        if (!restApiConfig.resourceName) {
            setError('Resource Name is required');
            return;
        }

        const baseUrl = '{base_url}';
        const resourcePath = `/${restApiConfig.resourceName}`;

        restApiConfig.endpoints.forEach(method => {
            let endpointPath = resourcePath;
            let sessionName = `${restApiConfig.resourceName} ${method}`;

            // Adjust path and name based on method
            switch (method) {
                case 'GET':
                    // Create two GET endpoints: one for listing all, one for getting by ID
                    // First: GET all resources
                    const getAllSession: ExtendedSession = {
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: `${restApiConfig.resourceName} GET All`,
                        category: `REST API - ${restApiConfig.resourceName}`,
                        timestamp: new Date().toISOString(),
                        urlData: {
                            baseURL: baseUrl,
                            segments: resourcePath,
                            parsedSegments: [],
                            queryParams: [],
                            segmentVariables: [],
                            processedURL: `${baseUrl}${resourcePath}`,
                            domain: '',
                            protocol: 'https',
                            builtUrl: `${baseUrl}${resourcePath}`,
                            environment: 'development',
                        },
                        requestConfig: {
                            method: 'GET' as const,
                            queryParams: [],
                            headers: restApiConfig.hasAuth ? [
                                {
                                    key: restApiConfig.authType === 'bearer' ? 'Authorization' :
                                        restApiConfig.authType === 'basic' ? 'Authorization' : 'X-API-Key',
                                    value: restApiConfig.authType === 'bearer' ? 'Bearer {token}' :
                                        restApiConfig.authType === 'basic' ? 'Basic {credentials}' : '{api_key}',
                                    description: 'Authentication header',
                                    required: true,
                                    type: 'string' as const,
                                    in: 'header' as const
                                }
                            ] : [],
                            bodyType: 'none',
                            jsonBody: '',
                            formData: [],
                            textBody: '',
                        },
                        yamlOutput: '',
                        segmentVariables: {},
                        sharedVariables: {},

                    };
                    handleSaveSession(`${restApiConfig.resourceName} GET All`, getAllSession);

                    // Second: GET by ID
                    const getByIdSession: ExtendedSession = {
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: `${restApiConfig.resourceName} GET by ID`,
                        category: `REST API - ${restApiConfig.resourceName}`,
                        timestamp: new Date().toISOString(),
                        urlData: {
                            baseURL: baseUrl,
                            segments: `${resourcePath}/{id}`,
                            parsedSegments: [{
                                paramName: 'id',
                                description: 'Resource ID',
                                required: true,
                                value: '',
                                isDynamic: true
                            }],
                            queryParams: [],
                            segmentVariables: [],
                            processedURL: `${baseUrl}${resourcePath}/{id}`,
                            domain: '',
                            protocol: 'https',
                            builtUrl: `${baseUrl}${resourcePath}/{id}`,
                            environment: 'development',
                        },
                        requestConfig: {
                            method: 'GET',
                            queryParams: [],
                            headers: restApiConfig.hasAuth ? [
                                {
                                    key: restApiConfig.authType === 'bearer' ? 'Authorization' :
                                        restApiConfig.authType === 'basic' ? 'Authorization' : 'X-API-Key',
                                    value: restApiConfig.authType === 'bearer' ? 'Bearer {token}' :
                                        restApiConfig.authType === 'basic' ? 'Basic {credentials}' : '{api_key}',
                                    description: 'Authentication header',
                                    required: true,
                                    type: 'string',
                                    in: 'header' as const
                                }
                            ] : [],
                            bodyType: 'none',
                            jsonBody: '',
                            formData: [],
                            textBody: '',
                        },
                        yamlOutput: '',
                        segmentVariables: {},
                        sharedVariables: {},

                    };
                    handleSaveSession(`${restApiConfig.resourceName} GET by ID`, getByIdSession);
                    return; // Skip the default processing for GET
                case 'POST':
                    // Create new resource
                    break;
                case 'PUT':
                case 'PATCH':
                    // Update specific resource
                    endpointPath = `${resourcePath}/{id}`;
                    sessionName = `${restApiConfig.resourceName} ${method} by ID`;
                    break;
                case 'DELETE':
                    // Delete specific resource
                    endpointPath = `${resourcePath}/{id}`;
                    sessionName = `${restApiConfig.resourceName} ${method} by ID`;
                    break;
            }

            const newSession: ExtendedSession = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: sessionName,
                category: `REST API - ${restApiConfig.resourceName}`,
                timestamp: new Date().toISOString(),
                urlData: {
                    baseURL: baseUrl,
                    segments: endpointPath,
                    parsedSegments: endpointPath.includes('{id}') ? [{
                        paramName: 'id',
                        description: 'Resource ID',
                        required: true,
                        value: '',
                        isDynamic: true
                    }] : [],
                    queryParams: [],
                    segmentVariables: [],
                    processedURL: `${baseUrl}${endpointPath}`,
                    domain: '',
                    protocol: 'https',
                    builtUrl: `${baseUrl}${endpointPath}`,
                    environment: 'development',
                },
                requestConfig: {
                    method,
                    queryParams: [],
                    headers: restApiConfig.hasAuth ? [
                        {
                            key: restApiConfig.authType === 'bearer' ? 'Authorization' :
                                restApiConfig.authType === 'basic' ? 'Authorization' : 'X-API-Key',
                            value: restApiConfig.authType === 'bearer' ? 'Bearer {token}' :
                                restApiConfig.authType === 'basic' ? 'Basic {credentials}' : '{api_key}',
                            description: 'Authentication header',
                            required: true,
                            type: 'string',
                            in: 'header' as const
                        }
                    ] : [],
                    bodyType: ['POST', 'PUT', 'PATCH'].includes(method) ? 'json' : 'none',
                    jsonBody: ['POST', 'PUT', 'PATCH'].includes(method) ? `{\n  "name": "",\n  "description": ""\n}` : '',
                    formData: [],
                    textBody: '',
                },
                yamlOutput: '',
                segmentVariables: {},
                sharedVariables: {},

            };

            handleSaveSession(sessionName, newSession);
        });

        setShowNewSessionModal(false);
        setSelectedApiPattern(null);
        setRestApiConfig({
            baseUrl: '',
            resourceName: '',
            hasAuth: false,
            authType: 'bearer',
            endpoints: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        });
        setError(null);
    };

    // Handle GraphQL API creation
    const handleGraphqlApiCreation = () => {
        if (!graphqlApiConfig.endpoint) {
            setError('GraphQL endpoint is required');
            return;
        }

        const baseUrl = '{base_url}';
        const endpoint = graphqlApiConfig.endpoint.startsWith('/') ? graphqlApiConfig.endpoint : `/${graphqlApiConfig.endpoint}`;

        // Create Query session
        if (graphqlApiConfig.operations.includes('query')) {
            const querySession: ExtendedSession = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: 'GraphQL Query',
                category: 'GraphQL API',
                timestamp: new Date().toISOString(),
                urlData: {
                    baseURL: baseUrl,
                    segments: endpoint,
                    parsedSegments: [],
                    queryParams: [],
                    segmentVariables: [],
                    processedURL: `${baseUrl}${endpoint}`,
                    domain: '',
                    protocol: 'https',
                    builtUrl: `${baseUrl}${endpoint}`,
                    environment: 'development',
                },
                requestConfig: {
                    method: 'POST',
                    queryParams: [],
                    headers: [
                        {
                            key: 'Content-Type',
                            value: 'application/json',
                            description: 'GraphQL content type',
                            required: true,
                            type: 'string',
                            in: 'header' as const
                        },
                        ...(graphqlApiConfig.hasAuth ? [{
                            key: graphqlApiConfig.authType === 'bearer' ? 'Authorization' :
                                graphqlApiConfig.authType === 'basic' ? 'Authorization' : 'X-API-Key',
                            value: graphqlApiConfig.authType === 'bearer' ? 'Bearer {token}' :
                                graphqlApiConfig.authType === 'basic' ? 'Basic {credentials}' : '{api_key}',
                            description: 'Authentication header',
                            required: true,
                            type: 'string',
                            in: 'header' as const
                        }] : [])
                    ],
                    bodyType: 'json',
                    jsonBody: `{\n  "query": "query {\\n    # Your GraphQL query here\\n  }",\n  "variables": {}\n}`,
                    formData: [],
                    textBody: '',
                },
                yamlOutput: '',
                segmentVariables: {},
                sharedVariables: {},

            };
            handleSaveSession('GraphQL Query', querySession);
        }

        // Create Mutation session
        if (graphqlApiConfig.operations.includes('mutation')) {
            const mutationSession: ExtendedSession = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: 'GraphQL Mutation',
                category: 'GraphQL API',
                timestamp: new Date().toISOString(),
                urlData: {
                    baseURL: baseUrl,
                    segments: endpoint,
                    parsedSegments: [],
                    queryParams: [],
                    segmentVariables: [],
                    processedURL: `${baseUrl}${endpoint}`,
                    domain: '',
                    protocol: 'https',
                    builtUrl: `${baseUrl}${endpoint}`,
                    environment: 'development',
                },
                requestConfig: {
                    method: 'POST',
                    queryParams: [],
                    headers: [
                        {
                            key: 'Content-Type',
                            value: 'application/json',
                            description: 'GraphQL content type',
                            required: true,
                            type: 'string',
                            in: 'header' as const
                        },
                        ...(graphqlApiConfig.hasAuth ? [{
                            key: graphqlApiConfig.authType === 'bearer' ? 'Authorization' :
                                graphqlApiConfig.authType === 'basic' ? 'Authorization' : 'X-API-Key',
                            value: graphqlApiConfig.authType === 'bearer' ? 'Bearer {token}' :
                                graphqlApiConfig.authType === 'basic' ? 'Basic {credentials}' : '{api_key}',
                            description: 'Authentication header',
                            required: true,
                            type: 'string',
                            in: 'header' as const
                        }] : [])
                    ],
                    bodyType: 'json',
                    jsonBody: `{\n  "query": "mutation {\\n    # Your GraphQL mutation here\\n  }",\n  "variables": {}\n}`,
                    formData: [],
                    textBody: '',
                },
                yamlOutput: '',
                segmentVariables: {},
                sharedVariables: {},

            };
            handleSaveSession('GraphQL Mutation', mutationSession);
        }

        // Create Subscription session
        if (graphqlApiConfig.operations.includes('subscription')) {
            const subscriptionSession: ExtendedSession = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: 'GraphQL Subscription',
                category: 'GraphQL API',
                timestamp: new Date().toISOString(),
                urlData: {
                    baseURL: baseUrl.replace('https', 'wss').replace('http', 'ws'),
                    segments: endpoint,
                    parsedSegments: [],
                    queryParams: [],
                    segmentVariables: [],
                    processedURL: `${baseUrl.replace('https', 'wss').replace('http', 'ws')}${endpoint}`,
                    domain: '',
                    protocol: 'wss',
                    builtUrl: `${baseUrl.replace('https', 'wss').replace('http', 'ws')}${endpoint}`,
                    environment: 'development',
                },
                requestConfig: {
                    method: 'GET',
                    queryParams: [],
                    headers: [
                        {
                            key: 'Sec-WebSocket-Protocol',
                            value: 'graphql-ws',
                            description: 'GraphQL WebSocket protocol',
                            required: true,
                            type: 'string',
                            in: 'header' as const
                        },
                        ...(graphqlApiConfig.hasAuth ? [{
                            key: graphqlApiConfig.authType === 'bearer' ? 'Authorization' :
                                graphqlApiConfig.authType === 'basic' ? 'Authorization' : 'X-API-Key',
                            value: graphqlApiConfig.authType === 'bearer' ? 'Bearer {token}' :
                                graphqlApiConfig.authType === 'basic' ? 'Basic {credentials}' : '{api_key}',
                            description: 'Authentication header',
                            required: true,
                            type: 'string',
                            in: 'header' as const
                        }] : [])
                    ],
                    bodyType: 'json',
                    jsonBody: `{\n  "type": "start",\n  "id": "1",\n  "payload": {\n    "query": "subscription {\\n      # Your GraphQL subscription here\\n    }",\n    "variables": {}\n  }\n}`,
                    formData: [],
                    textBody: '',
                },
                yamlOutput: '',
                segmentVariables: {},
                sharedVariables: {},

            };
            handleSaveSession('GraphQL Subscription', subscriptionSession);
        }

        setShowNewSessionModal(false);
        setSelectedApiPattern(null);
        setGraphqlApiConfig({
            endpoint: '/graphql',
            operations: ['query', 'mutation', 'subscription'],
            hasAuth: false,
            authType: 'bearer',
            selectedQueries: [],
            selectedMutations: [],
            selectedSubscriptions: []
        });
        setError(null);
    };

    // Handle WebSocket API creation
    const handleWebsocketApiCreation = () => {
        if (!websocketApiConfig.endpoint) {
            setError('WebSocket endpoint is required');
            return;
        }

        const baseUrl = '{base_url}'.replace('https', 'wss').replace('http', 'ws');
        const endpoint = websocketApiConfig.endpoint.startsWith('/') ? websocketApiConfig.endpoint : `/${websocketApiConfig.endpoint}`;

        websocketApiConfig.selectedEvents.forEach(event => {
            const sessionName = `WebSocket ${event.charAt(0).toUpperCase() + event.slice(1)}`;
            const newSession: ExtendedSession = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: sessionName,
                category: 'WebSocket API',
                timestamp: new Date().toISOString(),
                urlData: {
                    baseURL: baseUrl,
                    segments: endpoint,
                    parsedSegments: [],
                    queryParams: [],
                    segmentVariables: [],
                    processedURL: `${baseUrl}${endpoint}`,
                    domain: '',
                    protocol: 'wss',
                    builtUrl: `${baseUrl}${endpoint}`,
                    environment: 'development',
                },
                requestConfig: {
                    method: 'GET',
                    queryParams: [],
                    headers: [
                        {
                            key: 'Upgrade',
                            value: 'websocket',
                            description: 'WebSocket upgrade header',
                            required: true,
                            type: 'string',
                            in: 'header' as const
                        },
                        {
                            key: 'Connection',
                            value: 'Upgrade',
                            description: 'Connection upgrade header',
                            required: true,
                            type: 'string',
                            in: 'header' as const
                        },
                        ...(websocketApiConfig.hasAuth ? [{
                            key: websocketApiConfig.authType === 'bearer' ? 'Authorization' :
                                websocketApiConfig.authType === 'basic' ? 'Authorization' : 'X-API-Key',
                            value: websocketApiConfig.authType === 'bearer' ? 'Bearer {token}' :
                                websocketApiConfig.authType === 'basic' ? 'Basic {credentials}' : '{api_key}',
                            description: 'Authentication header',
                            required: true,
                            type: 'string',
                            in: 'header' as const
                        }] : [])
                    ],
                    bodyType: 'json',
                    jsonBody: `{\n  "event": "${event}",\n  "data": {}\n}`,
                    formData: [],
                    textBody: '',
                },
                yamlOutput: '',
                segmentVariables: {},
                sharedVariables: {},

            };
            handleSaveSession(sessionName, newSession);
        });

        setShowNewSessionModal(false);
        setSelectedApiPattern(null);
        setWebsocketApiConfig({
            endpoint: '/ws',
            events: ['connect', 'message', 'disconnect', 'error'],
            hasAuth: false,
            authType: 'bearer',
            selectedEvents: []
        });
        setError(null);
    };

    // Handle Custom API creation
    const handleCustomApiCreation = () => {
        if (!customApiConfig.name || !customApiConfig.path) {
            setError('Name and Path are required');
            return;
        }

        const baseUrl = '{base_url}';
        const path = customApiConfig.path.startsWith('/') ? customApiConfig.path : `/${customApiConfig.path}`;

        const newSession: ExtendedSession = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: customApiConfig.name,
            category: 'Custom API',
            timestamp: new Date().toISOString(),
            urlData: {
                baseURL: baseUrl,
                segments: path,
                parsedSegments: [],
                queryParams: [],
                segmentVariables: [],
                processedURL: `${baseUrl}${path}`,
                domain: '',
                protocol: 'https',
                builtUrl: `${baseUrl}${path}`,
                environment: 'development',
            },
            requestConfig: {
                method: customApiConfig.method,
                queryParams: [],
                headers: [
                    ...(customApiConfig.bodyType === 'json' ? [{
                        key: 'Content-Type',
                        value: 'application/json',
                        description: 'JSON content type',
                        required: true,
                        type: 'string',
                        in: 'header' as const
                    }] : []),
                    ...(customApiConfig.hasAuth ? [{
                        key: customApiConfig.authType === 'bearer' ? 'Authorization' :
                            customApiConfig.authType === 'basic' ? 'Authorization' : 'X-API-Key',
                        value: customApiConfig.authType === 'bearer' ? 'Bearer {token}' :
                            customApiConfig.authType === 'basic' ? 'Basic {credentials}' : '{api_key}',
                        description: 'Authentication header',
                        required: true,
                        type: 'string',
                        in: 'header' as const
                    }] : [])
                ],
                bodyType: customApiConfig.bodyType,
                jsonBody: customApiConfig.bodyType === 'json' ? `{\n  "data": ""\n}` : '',
                formData: customApiConfig.bodyType === 'form' ? [{ key: '', value: '', type: 'text', required: false }] : [],
                textBody: customApiConfig.bodyType === 'text' ? '' : '',
            },
            yamlOutput: '',
            segmentVariables: {},
            sharedVariables: {},

        };

        handleSaveSession(customApiConfig.name, newSession);
        setShowNewSessionModal(false);
        setSelectedApiPattern(null);
        setCustomApiConfig({
            name: '',
            method: 'GET',
            path: '',
            hasAuth: false,
            authType: 'bearer',
            bodyType: 'none'
        });
        setError(null);
    };

    // API Pattern configurations
    const apiPatterns = [
        {
            id: 'rest',
            name: 'REST API',
            description: 'Create CRUD endpoints for a resource',
            icon: FiGlobe,
            color: 'from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-600',
            bgColor: 'from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900',
            borderColor: 'border-blue-200 dark:border-blue-600',
            features: ['CRUD Operations', 'Resource-based URLs', 'HTTP Methods', 'JSON Responses']
        },
        {
            id: 'graphql',
            name: 'GraphQL API',
            description: 'Create GraphQL queries and mutations',
            icon: FiDatabase,
            color: 'from-purple-500 to-pink-600 dark:from-purple-700 dark:to-pink-600',
            bgColor: 'from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900',
            borderColor: 'border-purple-200 dark:border-purple-600',
            features: ['Single Endpoint', 'Queries & Mutations', 'Type System', 'Introspection']
        },
        {
            id: 'websocket',
            name: 'WebSocket API',
            description: 'Create real-time communication endpoints',
            icon: FiWifi,
            color: 'from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-600',
            bgColor: 'from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900',
            borderColor: 'border-green-200 dark:border-green-600',
            features: ['Real-time Events', 'Bidirectional', 'Connection Management', 'Message Types']
        },
        {
            id: 'custom',
            name: 'Custom API',
            description: 'Create a custom API endpoint manually',
            icon: FiSettings,
            color: 'from-gray-500 to-slate-600 dark:from-gray-700 dark:to-slate-600',
            bgColor: 'from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900',
            borderColor: 'border-gray-200 dark:border-gray-600',
            features: ['Manual Configuration', 'Custom Headers', 'Flexible Body', 'Any Protocol']
        }
    ];

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
                                onClick={handleNewSessionClick}
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
                                        <IconWrapper icon={icon} variant="colored" />
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
                titleIcon={modalType === "new" ? <FiPlus className="w-5 h-5 text-blue-500" /> : modalType === "rename" ? <FiEdit2 className="w-5 h-5 text-blue-500" /> : <FiCopy className="w-5 h-5 text-blue-500" />}
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
                    titleIcon={<FiUpload className="w-5 h-5 text-blue-500" />}
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

            {/* Duplicate Modal */}
            {showDuplicateModal && (
                <Modal
                    isOpen={showDuplicateModal}
                    onClose={() => {
                        setShowDuplicateModal(false);
                        setDuplicateMethods([]);
                        setSessionName("");
                        setSessionCategory("");
                        setSelectedSession(null);
                    }}
                    onSave={handleDuplicateConfirm}
                    title="Duplicate Session"
                    titleIcon={<FiCopy className="w-5 h-5 text-blue-500" />}
                    saveButtonText="Duplicate"
                    showSaveButton={true}
                    showCancelButton={true}
                    size="lg"
                >
                    <div className="mb-4">
                        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Session Name</label>
                        <input
                            type="text"
                            value={sessionName}
                            onChange={e => setSessionName(e.target.value)}
                            placeholder="Session name"
                            className="w-full px-3 py-2 rounded-md border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300 mb-2"
                        />
                        <input
                            type="text"
                            value={sessionCategory}
                            onChange={e => setSessionCategory(e.target.value)}
                            placeholder="Category (optional)"
                            list="category-list"
                            className="w-full px-3 py-2 rounded-md border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                        />
                        <datalist id="category-list">
                            {existingCategories.map((cat) => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="font-semibold text-gray-700 dark:text-gray-200">Select HTTP Methods</label>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDuplicateMethods(HTTP_METHODS.map(m => m.value))}
                                >Select All</Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDuplicateMethods([])}
                                >Clear</Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {HTTP_METHODS.map(method => {
                                const isSelected = duplicateMethods.includes(method.value);
                                return (
                                    <Card
                                        key={method.value}
                                        variant={isSelected ? 'elevated' : 'default'}
                                        padding="md"
                                        interactive
                                        onClick={() => {
                                            setDuplicateMethods(prev =>
                                                prev.includes(method.value)
                                                    ? prev.filter(m => m !== method.value)
                                                    : [...prev, method.value]
                                            );
                                        }}
                                        className={`flex items-center space-x-3 border-2 transition-all duration-200 ${isSelected ? method.color + ' ring-2 ring-blue-400/50' : ''}`}
                                    >
                                        <Badge variant={isSelected ? 'primary' : 'default'} size="sm" className="mr-2">
                                            <IconWrapper icon={METHOD_ICONS[method.value] || '🔗'} variant="colored" />
                                        </Badge>
                                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{method.label}</span>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                    {error && (
                        <p className="text-sm dark:text-red-400 text-red-600 mb-4">{error}</p>
                    )}
                </Modal>
            )}

            {/* New Session Modal */}
            {showNewSessionModal && (
                <Modal
                    isOpen={showNewSessionModal}
                    onClose={() => {
                        setShowNewSessionModal(false);
                        setSelectedApiPattern(null);
                        setError(null);
                    }}
                    title="Create New Session"
                    titleIcon={<FiPlus className="w-5 h-5 text-blue-500" />}
                    showSaveButton={false}
                    showCancelButton={true}
                    size="2xl"
                >
                    {!selectedApiPattern ? (
                        // API Pattern Selection
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                    Choose API Pattern
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Select the type of API you want to create
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {apiPatterns.map((pattern) => (
                                    <Card
                                        key={pattern.id}
                                        variant="elevated"
                                        padding="lg"
                                        interactive
                                        onClick={() => setSelectedApiPattern(pattern.id as any)}
                                        className={`border-2 hover:border-blue-300 transition-all duration-300 ${pattern.borderColor} bg-gradient-to-br ${pattern.bgColor}`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className={`p-3 rounded-xl bg-gradient-to-br ${pattern.color} shadow-lg`}>
                                                <pattern.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                                    {pattern.name}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    {pattern.description}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {pattern.features.map((feature, index) => (
                                                        <Badge key={index} variant="default" size="sm" className="bg-opacity-60">
                                                            {feature}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : selectedApiPattern === 'rest' ? (
                        // REST API Configuration
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedApiPattern(null)}
                                    icon={FiChevronDown}
                                    iconPosition="left"
                                >
                                    Back
                                </Button>
                                <div className="flex items-center space-x-2">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                                        <FiGlobe className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        REST API Configuration
                                    </h3>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Resource Name
                                    </label>
                                    <input
                                        type="text"
                                        value={restApiConfig.resourceName}
                                        onChange={(e) => setRestApiConfig(prev => ({ ...prev, resourceName: e.target.value }))}
                                        placeholder="users, products, orders"
                                        className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        This will create endpoints like /{restApiConfig.resourceName || 'resource'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Authentication
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={restApiConfig.hasAuth}
                                                onChange={(e) => setRestApiConfig(prev => ({ ...prev, hasAuth: e.target.checked }))}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Include authentication headers
                                            </span>
                                        </label>

                                        {restApiConfig.hasAuth && (
                                            <select
                                                value={restApiConfig.authType}
                                                onChange={(e) => setRestApiConfig(prev => ({ ...prev, authType: e.target.value as any }))}
                                                className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                            >
                                                <option value="bearer">Bearer Token</option>
                                                <option value="basic">Basic Auth</option>
                                                <option value="api-key">API Key</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Select HTTP Methods
                                        </label>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setRestApiConfig(prev => ({ ...prev, endpoints: HTTP_METHODS.map(m => m.value) }))}
                                            >Select All</Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setRestApiConfig(prev => ({ ...prev, endpoints: [] }))}
                                            >Clear</Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {HTTP_METHODS.map(method => {
                                            const isSelected = restApiConfig.endpoints.includes(method.value);
                                            return (
                                                <Card
                                                    key={method.value}
                                                    variant={isSelected ? 'elevated' : 'default'}
                                                    padding="md"
                                                    interactive
                                                    onClick={() => {
                                                        setRestApiConfig(prev => ({
                                                            ...prev,
                                                            endpoints: prev.endpoints.includes(method.value)
                                                                ? prev.endpoints.filter(ep => ep !== method.value)
                                                                : [...prev.endpoints, method.value]
                                                        }));
                                                    }}
                                                    className={`flex items-center space-x-3 border-2 transition-all duration-200 ${isSelected ? method.color + ' ring-2 ring-blue-400/50' : ''}`}
                                                >
                                                    <Badge variant={isSelected ? 'primary' : 'default'} size="sm" className="mr-2">
                                                        <IconWrapper icon={METHOD_ICONS[method.value] || '🔗'} variant="colored" />
                                                    </Badge>
                                                    <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{method.label}</span>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedApiPattern(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    gradient
                                    onClick={handleRestApiCreation}
                                    disabled={!restApiConfig.resourceName || restApiConfig.endpoints.length === 0}
                                >
                                    Create REST API Sessions
                                </Button>
                            </div>
                        </div>
                    ) : selectedApiPattern === 'graphql' ? (
                        // GraphQL API Configuration
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedApiPattern(null)}
                                    icon={FiChevronDown}
                                    iconPosition="left"
                                >
                                    Back
                                </Button>
                                <div className="flex items-center space-x-2">
                                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                        <FiDatabase className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        GraphQL API Configuration
                                    </h3>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        GraphQL Endpoint
                                    </label>
                                    <input
                                        type="text"
                                        value={graphqlApiConfig.endpoint}
                                        onChange={(e) => setGraphqlApiConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                                        placeholder="/graphql"
                                        className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Usually /graphql or /api/graphql
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Authentication
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={graphqlApiConfig.hasAuth}
                                                onChange={(e) => setGraphqlApiConfig(prev => ({ ...prev, hasAuth: e.target.checked }))}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Include authentication headers
                                            </span>
                                        </label>

                                        {graphqlApiConfig.hasAuth && (
                                            <select
                                                value={graphqlApiConfig.authType}
                                                onChange={(e) => setGraphqlApiConfig(prev => ({ ...prev, authType: e.target.value as any }))}
                                                className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                            >
                                                <option value="bearer">Bearer Token</option>
                                                <option value="basic">Basic Auth</option>
                                                <option value="api-key">API Key</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            GraphQL Operations
                                        </label>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setGraphqlApiConfig(prev => ({ ...prev, operations: ['query', 'mutation', 'subscription'] }))}
                                            >Select All</Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setGraphqlApiConfig(prev => ({ ...prev, operations: [] }))}
                                            >Clear</Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'query', name: 'Query', icon: '🔍', color: 'from-blue-500 to-blue-600', description: 'Read data' },
                                            { id: 'mutation', name: 'Mutation', icon: '✏️', color: 'from-green-500 to-green-600', description: 'Modify data' },
                                            { id: 'subscription', name: 'Subscription', icon: '📡', color: 'from-purple-500 to-purple-600', description: 'Real-time updates' }
                                        ].map(operation => {
                                            const isSelected = graphqlApiConfig.operations.includes(operation.id);
                                            return (
                                                <Card
                                                    key={operation.id}
                                                    variant={isSelected ? 'elevated' : 'default'}
                                                    padding="md"
                                                    interactive
                                                    onClick={() => {
                                                        setGraphqlApiConfig(prev => ({
                                                            ...prev,
                                                            operations: prev.operations.includes(operation.id)
                                                                ? prev.operations.filter(op => op !== operation.id)
                                                                : [...prev.operations, operation.id]
                                                        }));
                                                    }}
                                                    className={`border-2 transition-all duration-200 ${isSelected ? operation.color + ' ring-2 ring-purple-400/50' : ''}`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Badge variant={isSelected ? 'primary' : 'default'} size="sm">
                                                            <span className="text-lg">{operation.icon}</span>
                                                        </Badge>
                                                        <div>
                                                            <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                {operation.name}
                                                            </span>
                                                            <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                {operation.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedApiPattern(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    gradient
                                    onClick={handleGraphqlApiCreation}
                                    disabled={!graphqlApiConfig.endpoint || graphqlApiConfig.operations.length === 0}
                                >
                                    Create GraphQL Sessions
                                </Button>
                            </div>
                        </div>
                    ) : selectedApiPattern === 'websocket' ? (
                        // WebSocket API Configuration
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedApiPattern(null)}
                                    icon={FiChevronDown}
                                    iconPosition="left"
                                >
                                    Back
                                </Button>
                                <div className="flex items-center space-x-2">
                                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                        <FiWifi className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        WebSocket API Configuration
                                    </h3>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        WebSocket Endpoint
                                    </label>
                                    <input
                                        type="text"
                                        value={websocketApiConfig.endpoint}
                                        onChange={(e) => setWebsocketApiConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                                        placeholder="/ws"
                                        className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        WebSocket connection endpoint
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Authentication
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={websocketApiConfig.hasAuth}
                                                onChange={(e) => setWebsocketApiConfig(prev => ({ ...prev, hasAuth: e.target.checked }))}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Include authentication headers
                                            </span>
                                        </label>

                                        {websocketApiConfig.hasAuth && (
                                            <select
                                                value={websocketApiConfig.authType}
                                                onChange={(e) => setWebsocketApiConfig(prev => ({ ...prev, authType: e.target.value as any }))}
                                                className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                            >
                                                <option value="bearer">Bearer Token</option>
                                                <option value="basic">Basic Auth</option>
                                                <option value="api-key">API Key</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            WebSocket Events
                                        </label>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setWebsocketApiConfig(prev => ({ ...prev, selectedEvents: websocketApiConfig.events }))}
                                            >Select All</Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setWebsocketApiConfig(prev => ({ ...prev, selectedEvents: [] }))}
                                            >Clear</Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {websocketApiConfig.events.map(event => {
                                            const isSelected = websocketApiConfig.selectedEvents.includes(event);
                                            const eventConfig = {
                                                connect: { icon: '🔌', color: 'from-green-500 to-green-600', description: 'Connection' },
                                                message: { icon: '💬', color: 'from-blue-500 to-blue-600', description: 'Message' },
                                                disconnect: { icon: '🔌', color: 'from-red-500 to-red-600', description: 'Disconnect' },
                                                error: { icon: '⚠️', color: 'from-yellow-500 to-yellow-600', description: 'Error' }
                                            }[event];

                                            if (!eventConfig) return null;

                                            return (
                                                <Card
                                                    key={event}
                                                    variant={isSelected ? 'elevated' : 'default'}
                                                    padding="md"
                                                    interactive
                                                    onClick={() => {
                                                        setWebsocketApiConfig(prev => ({
                                                            ...prev,
                                                            selectedEvents: prev.selectedEvents.includes(event)
                                                                ? prev.selectedEvents.filter(e => e !== event)
                                                                : [...prev.selectedEvents, event]
                                                        }));
                                                    }}
                                                    className={`border-2 transition-all duration-200 ${isSelected ? eventConfig.color + ' ring-2 ring-green-400/50' : ''}`}
                                                >
                                                    <div className="flex flex-col items-center space-y-2 text-center">
                                                        <Badge variant={isSelected ? 'primary' : 'default'} size="sm">
                                                            <span className="text-lg">{eventConfig.icon}</span>
                                                        </Badge>
                                                        <div>
                                                            <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                {event.charAt(0).toUpperCase() + event.slice(1)}
                                                            </span>
                                                            <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                {eventConfig.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedApiPattern(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    gradient
                                    onClick={handleWebsocketApiCreation}
                                    disabled={!websocketApiConfig.endpoint || websocketApiConfig.selectedEvents.length === 0}
                                >
                                    Create WebSocket Sessions
                                </Button>
                            </div>
                        </div>
                    ) : selectedApiPattern === 'custom' ? (
                        // Custom API Configuration
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedApiPattern(null)}
                                    icon={FiChevronDown}
                                    iconPosition="left"
                                >
                                    Back
                                </Button>
                                <div className="flex items-center space-x-2">
                                    <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg">
                                        <FiSettings className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        Custom API Configuration
                                    </h3>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Session Name
                                    </label>
                                    <input
                                        type="text"
                                        value={customApiConfig.name}
                                        onChange={(e) => setCustomApiConfig(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="My Custom API"
                                        className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            HTTP Method
                                        </label>
                                        <select
                                            value={customApiConfig.method}
                                            onChange={(e) => setCustomApiConfig(prev => ({ ...prev, method: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                        >
                                            {HTTP_METHODS.map(method => (
                                                <option key={method.value} value={method.value}>
                                                    {method.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Body Type
                                        </label>
                                        <select
                                            value={customApiConfig.bodyType}
                                            onChange={(e) => setCustomApiConfig(prev => ({ ...prev, bodyType: e.target.value as any }))}
                                            className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                        >
                                            <option value="none">None</option>
                                            <option value="json">JSON</option>
                                            <option value="form">Form Data</option>
                                            <option value="text">Text</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        API Path
                                    </label>
                                    <input
                                        type="text"
                                        value={customApiConfig.path}
                                        onChange={(e) => setCustomApiConfig(prev => ({ ...prev, path: e.target.value }))}
                                        placeholder="/api/custom"
                                        className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Path after the base URL
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Authentication
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={customApiConfig.hasAuth}
                                                onChange={(e) => setCustomApiConfig(prev => ({ ...prev, hasAuth: e.target.checked }))}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Include authentication headers
                                            </span>
                                        </label>

                                        {customApiConfig.hasAuth && (
                                            <select
                                                value={customApiConfig.authType}
                                                onChange={(e) => setCustomApiConfig(prev => ({ ...prev, authType: e.target.value as any }))}
                                                className="w-full px-3 py-2 rounded-lg border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300"
                                            >
                                                <option value="bearer">Bearer Token</option>
                                                <option value="basic">Basic Auth</option>
                                                <option value="api-key">API Key</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedApiPattern(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    gradient
                                    onClick={handleCustomApiCreation}
                                    disabled={!customApiConfig.name || !customApiConfig.path}
                                >
                                    Create Custom Session
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // Placeholder for other patterns
                        <div className="text-center py-8">
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700">
                                <FiSettings className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                    Coming Soon
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {selectedApiPattern === 'graphql' && 'GraphQL API creation is coming soon!'}
                                    {selectedApiPattern === 'websocket' && 'WebSocket API creation is coming soon!'}
                                    {selectedApiPattern === 'custom' && 'Custom API creation is coming soon!'}
                                </p>
                                <Button
                                    variant="primary"
                                    onClick={() => setSelectedApiPattern(null)}
                                >
                                    Back to Patterns
                                </Button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 mt-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                            <p className="text-sm dark:text-red-300 text-red-600">
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
