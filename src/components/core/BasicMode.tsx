import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTokenContext } from '../../context/TokenContext';
import { useVariablesContext } from '../../context/VariablesContext';
import { useURLBuilderContext } from '../../context/URLBuilderContext';
import { Card, SectionHeader, MonacoEditor, Input, Button, Toggle, Textarea, Badge, IconButton, Divider, Tooltip } from '../ui';
import { FiGlobe, FiSettings, FiSend, FiEye, FiPlus, FiTrash2, FiLink, FiZap, FiDatabase, FiEdit2, FiCheck, FiX, FiShield, FiInfo, FiServer, FiCode, FiFileText, FiKey, FiHash, FiList, FiType, FiMail, FiUser, FiAlertCircle, FiClock, FiExternalLink, FiLayers, FiTag, FiActivity as FiActivityIcon, FiDownload } from 'react-icons/fi';
import { Header, QueryParam, FormDataField } from '../../types';
import { DEFAULT_JSON_BODY, DEFAULT_FORM_DATA } from '../../constants/requestConfig';
import { LuReplace } from 'react-icons/lu';
import { GiTrafficLightsOrange, GiTrafficLightsReadyToGo, GiTrafficLightsRed } from 'react-icons/gi';

interface BasicModeProps {
    requestConfig?: any;
    setRequestConfig?: (config: any) => void;
}

const BasicMode: React.FC<BasicModeProps> = ({
    requestConfig,
    setRequestConfig
}) => {
    // Get all functionality from contexts
    const {
        activeSession,
        handleNewSession,
        handleSaveSession,
    } = useAppContext();

    const { globalVariables, sharedVariables, replaceVariables, updateSharedVariable, updateGlobalVariable, deleteGlobalVariable, deleteSharedVariable, getVariableValue } = useVariablesContext();
    const { generateAuthHeaders, isAuthenticated } = useTokenContext();

    // Get URL building functionality from URLBuilderContext
    const {
        protocol,
        setProtocol,
        domain,
        setDomain,
        environment,
        setEnvironment,
        segments,
        setSegments,
        builtUrl,
        handleSegmentAdd,
        handleSegmentRemove,
    } = useURLBuilderContext();

    // Local state for request configuration (will be saved to context)
    const [method, setMethod] = useState<string>(requestConfig?.method || 'GET');
    const [queryParams, setQueryParams] = useState<QueryParam[]>(requestConfig?.queryParams || []);
    const [headers, setHeaders] = useState<Header[]>(requestConfig?.headers || []);
    const [bodyType, setBodyType] = useState<"none" | "json" | "form" | "text">(requestConfig?.bodyType || 'none');
    const [jsonBody, setJsonBody] = useState<string>(requestConfig?.jsonBody || DEFAULT_JSON_BODY);
    const [formData, setFormData] = useState<FormDataField[]>(requestConfig?.formData || DEFAULT_FORM_DATA);
    const [textBody, setTextBody] = useState<string>(requestConfig?.textBody || '');
    const [includeToken, setIncludeToken] = useState<boolean>(requestConfig?.includeToken ?? true);

    // Local state for UI
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [responseData, setResponseData] = useState<any>(null);
    const [responseError, setResponseError] = useState<string | null>(null);
    const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);

    // State for editing variables
    const [editingGlobalKey, setEditingGlobalKey] = useState<string | null>(null);
    const [editingSessionKey, setEditingSessionKey] = useState<string | null>(null);
    const [editingGlobalValue, setEditingGlobalValue] = useState<string>('');
    const [editingSessionValue, setEditingSessionValue] = useState<string>('');
    const [editingGlobalNewKey, setEditingGlobalNewKey] = useState<string>('');
    const [editingSessionNewKey, setEditingSessionNewKey] = useState<string>('');

    // Refs for auto-focus
    const globalEditKeyRef = useRef<HTMLInputElement>(null);
    const globalEditValueRef = useRef<HTMLInputElement>(null);
    const sessionEditKeyRef = useRef<HTMLInputElement>(null);
    const sessionEditValueRef = useRef<HTMLInputElement>(null);

    // Custom session creation handler
    const handleCreateNewSession = () => {
        console.log('BasicMode: Creating new session...');
        setIsCreatingSession(true);
        try {
            handleNewSession();
            console.log('BasicMode: handleNewSession called successfully');
        } catch (error) {
            console.error('Error creating session:', error);
            setIsCreatingSession(false);
        }
    };

    // Reset creating session state when session is available
    useEffect(() => {
        console.log('BasicMode: activeSession changed:', activeSession?.id, 'isCreatingSession:', isCreatingSession);
        if (activeSession && isCreatingSession) {
            console.log('BasicMode: Session created successfully, resetting loading state');
            setIsCreatingSession(false);
        }
    }, [activeSession, isCreatingSession]);

    // Timeout for session creation to prevent infinite loading
    useEffect(() => {
        if (isCreatingSession) {
            const timeout = setTimeout(() => {
                console.warn('Session creation timeout, resetting state');
                setIsCreatingSession(false);
            }, 5000); // 5 second timeout

            return () => clearTimeout(timeout);
        }
        return undefined;
    }, [isCreatingSession]);

    // Sync includeToken with session on session change
    useEffect(() => {
        setIncludeToken(activeSession?.includeToken ?? true);
    }, [activeSession?.id]);

    // Automatically disable includeToken if no token is available
    useEffect(() => {
        if (!isAuthenticated() && includeToken) {
            setIncludeToken(false);
        }
    }, [isAuthenticated, includeToken]);

    // Save includeToken to session when it changes
    useEffect(() => {
        if (activeSession && includeToken !== undefined) {
            const updatedSession = {
                ...activeSession,
                includeToken,
            };
            if (activeSession.includeToken !== includeToken) {
                handleSaveSession(activeSession.name, updatedSession);
            }
        }
    }, [includeToken, activeSession?.id, handleSaveSession]);

    // Save request configuration when it changes
    useEffect(() => {
        if (setRequestConfig) {
            const config = {
                method,
                queryParams,
                headers,
                bodyType,
                jsonBody,
                formData,
                textBody,
                includeToken,
            };
            setRequestConfig(config);
        }
    }, [method, queryParams, headers, bodyType, jsonBody, formData, textBody, includeToken, setRequestConfig]);

    // Auto-focus value input when editing starts
    useEffect(() => {
        if (editingGlobalKey && globalEditValueRef.current) {
            globalEditValueRef.current.focus();
        }
    }, [editingGlobalKey]);

    useEffect(() => {
        if (editingSessionKey && sessionEditValueRef.current) {
            sessionEditValueRef.current.focus();
        }
    }, [editingSessionKey]);

    // Request configuration functions
    const addQueryParam = () => {
        setQueryParams([...queryParams, { key: '', value: '' }]);
    };

    const removeQueryParam = (index: number) => {
        setQueryParams(queryParams.filter((_, i) => i !== index));
    };

    const updateQueryParam = (index: number, field: keyof QueryParam, value: string | boolean) => {
        const newParams = [...queryParams];
        newParams[index] = { ...newParams[index], [field]: value } as QueryParam;
        setQueryParams(newParams);
    };

    const addHeader = () => {
        setHeaders([...headers, { key: '', value: '', in: 'header' }]);
    };

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };

    const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
        const newHeaders = [...headers];
        newHeaders[index] = { ...newHeaders[index], [field]: value } as Header;
        setHeaders(newHeaders);
    };

    const addFormField = () => {
        setFormData([...formData, { key: '', value: '', type: 'text', required: false }]);
    };

    const removeFormField = (index: number) => {
        setFormData(formData.filter((_, i) => i !== index));
    };

    const updateFormField = (index: number, field: keyof FormDataField, value: string | boolean) => {
        const newFormData = [...formData];
        newFormData[index] = { ...newFormData[index], [field]: value } as FormDataField;
        setFormData(newFormData);
    };

    const getMethodColor = (httpMethod: string) => {
        const colors: Record<string, string> = {
            GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return colors[httpMethod] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    };

    const handleJsonBodyChange = (value: string | undefined) => {
        setJsonBody(value || '');
    };

    // Variable editing functions
    const startEditingGlobal = (key: string) => {
        setEditingGlobalKey(key);
        setEditingGlobalNewKey(key);
        setEditingGlobalValue(globalVariables[key] || '');
    };

    const startEditingSession = (key: string) => {
        setEditingSessionKey(key);
        setEditingSessionNewKey(key);
        const sessionVar = sharedVariables.find(v => v.key === key);
        setEditingSessionValue(sessionVar?.value || '');
    };

    const saveGlobalEdit = () => {
        if (editingGlobalKey && editingGlobalNewKey.trim()) {
            // If key changed, delete old and create new
            if (editingGlobalNewKey !== editingGlobalKey) {
                deleteGlobalVariable(editingGlobalKey);
            }
            updateGlobalVariable(editingGlobalNewKey, editingGlobalValue);
            setEditingGlobalKey(null);
            setEditingGlobalNewKey('');
            setEditingGlobalValue('');
        }
    };

    const saveSessionEdit = () => {
        if (editingSessionKey && editingSessionNewKey.trim()) {
            // If key changed, delete old and create new
            if (editingSessionNewKey !== editingSessionKey) {
                deleteSharedVariable(editingSessionKey);
            }
            updateSharedVariable(editingSessionNewKey, editingSessionValue);
            setEditingSessionKey(null);
            setEditingSessionNewKey('');
            setEditingSessionValue('');
        }
    };

    const cancelGlobalEdit = () => {
        setEditingGlobalKey(null);
        setEditingGlobalNewKey('');
        setEditingGlobalValue('');
    };

    const cancelSessionEdit = () => {
        setEditingSessionKey(null);
        setEditingSessionNewKey('');
        setEditingSessionValue('');
    };

    const addGlobalVariable = () => {
        const newKey = `global_${Date.now()}`;
        updateGlobalVariable(newKey, '');
    };

    const removeGlobalVariable = (key: string) => {
        deleteGlobalVariable(key);
    };

    const addSessionVariable = () => {
        const newKey = `session_var_${Date.now()}`;
        updateSharedVariable(newKey, '');
    };

    const removeSessionVariable = (key: string) => {
        deleteSharedVariable(key);
    };

    // Handle real fetch
    const handleFetch = async () => {
        if (!builtUrl || !method) {
            setResponseError('Please configure URL and request method first');
            return;
        }

        setIsLoading(true);
        setResponseError(null);

        try {
            // Apply variable replacement to URL
            let resolvedUrl = replaceVariables(builtUrl);

            // Add query parameters if any
            const queryParamsWithValues = queryParams.filter(param => param.key && param.value);
            if (queryParamsWithValues.length > 0) {
                const queryString = queryParamsWithValues
                    .map(param => {
                        const resolvedKey = replaceVariables(param.key);
                        const resolvedValue = replaceVariables(param.value);
                        return `${encodeURIComponent(resolvedKey)}=${encodeURIComponent(resolvedValue)}`;
                    })
                    .join('&');
                resolvedUrl = `${resolvedUrl}${resolvedUrl.includes('?') ? '&' : '?'}${queryString}`;
            }

            const headersObj: Record<string, string> = {};
            headers.forEach(header => {
                if (header.key && header.value) {
                    // Apply variable replacement to header values
                    headersObj[header.key] = replaceVariables(header.value);
                }
            });

            // Add authentication headers if includeToken is enabled
            if (includeToken) {
                const authHeaders = generateAuthHeaders();
                Object.assign(headersObj, authHeaders);
            }

            let body: any = undefined;
            if (bodyType === 'json' && jsonBody) {
                // Apply variable replacement to JSON body
                const resolvedJsonBody = replaceVariables(jsonBody);
                body = JSON.stringify(JSON.parse(resolvedJsonBody));
                headersObj['Content-Type'] = 'application/json';
            } else if (bodyType === 'form' && formData) {
                const formDataObj = new FormData();
                formData.forEach(field => {
                    if (field.key && field.value) {
                        // Apply variable replacement to form data values
                        formDataObj.append(field.key, replaceVariables(field.value));
                    }
                });
                body = formDataObj;
            } else if (bodyType === 'text' && textBody) {
                // Apply variable replacement to text body
                body = replaceVariables(textBody);
                headersObj['Content-Type'] = 'text/plain';
            }

            const response = await fetch(resolvedUrl, {
                method,
                headers: headersObj,
                body,
            });

            const responseText = await response.text();
            let responseJson;
            try {
                responseJson = JSON.parse(responseText);
            } catch {
                responseJson = null;
            }

            setResponseData({
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: responseJson || responseText,
                url: response.url,
            });
        } catch (error) {
            setResponseError(error instanceof Error ? error.message : 'Request failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Render loading state when creating session
    if (isCreatingSession) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
                <div className="text-center">
                    <div className="mx-auto mb-6 w-16 h-16 rounded-full border-4 animate-spin border-blue-500/20 border-t-blue-500"></div>
                    <div className="mb-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        Creating Session...
                    </div>
                    <div className="mb-6 text-gray-600 dark:text-gray-300">Setting up your workspace</div>
                    <Button
                        onClick={() => setIsCreatingSession(false)}
                        variant="secondary"
                        size="sm"
                        icon={FiX}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    // Render no session state
    if (!activeSession) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
                <div className="p-8 mx-auto max-w-md text-center">
                    <div className="flex justify-center items-center mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-xl">
                        <FiZap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="mb-4 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        No Active Session
                    </h1>
                    <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
                        Start a new session to begin testing your APIs in Basic Mode
                    </p>
                    <div className="space-y-4">
                        <Button
                            onClick={handleCreateNewSession}
                            variant="primary"
                            size="lg"
                            icon={FiPlus}
                            gradient
                            className="w-full"
                        >
                            Create New Session
                        </Button>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Or switch to Expert Mode to manage sessions
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
            {/* Header Section */}
            <div className="sticky top-0 z-10 border-b backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50">
                <div className="px-6 py-4 mx-auto max-w-7xl">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <FiZap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">API Testing Studio</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Basic Mode - Simplified Interface</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant="success" className="text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <span>Connected</span>
                                </div>
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-8 mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Left Column - Configuration */}
                    <div className="space-y-6 lg:col-span-7">
                        {/* URL Configuration */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <SectionHeader
                                    icon={FiGlobe}
                                    title="URL Configuration"
                                    description="Configure your API endpoint with precision"
                                    className="mb-8"
                                />
                                <div className="space-y-8">
                                    {/* Protocol Selection */}
                                    <div>
                                        <label className="block mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Protocol
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setProtocol('https')}
                                                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group hover:scale-105 ${protocol === 'https'
                                                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/25'
                                                    : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <FiShield className={`w-6 h-6 ${protocol === 'https' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                                                    <span className="text-lg font-bold">HTTPS</span>
                                                </div>
                                                {protocol === 'https' && (
                                                    <div className="flex absolute -top-2 -right-2 justify-center items-center w-8 h-8 bg-emerald-500 rounded-full shadow-lg">
                                                        <FiCheck className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-br from-transparent rounded-2xl opacity-0 transition-opacity duration-300 to-black/5 group-hover:opacity-100"></div>
                                            </button>
                                            <button
                                                onClick={() => setProtocol('http')}
                                                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group hover:scale-105 ${protocol === 'http'
                                                    ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/25'
                                                    : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <FiLink className={`w-6 h-6 ${protocol === 'http' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                                                    <span className="text-lg font-bold">HTTP</span>
                                                </div>
                                                {protocol === 'http' && (
                                                    <div className="flex absolute -top-2 -right-2 justify-center items-center w-8 h-8 bg-blue-500 rounded-full shadow-lg">
                                                        <FiCheck className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-br from-transparent rounded-2xl opacity-0 transition-opacity duration-300 to-black/5 group-hover:opacity-100"></div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Domain */}
                                    <div>
                                        <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center space-x-2">
                                                <FiServer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                <span>Domain</span>
                                            </div>
                                        </label>
                                        <Input
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            placeholder="api.example.com"
                                            fullWidth
                                        />
                                    </div>

                                    {/* Environment Selection */}
                                    <div>
                                        <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center space-x-2">
                                                <FiLayers className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                <span>Environment</span>
                                            </div>
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'dev', name: 'Development', color: 'green', icon: GiTrafficLightsRed },
                                                { id: 'staging', name: 'Staging', color: 'yellow', icon: GiTrafficLightsOrange },
                                                { id: 'prod', name: 'Production', color: 'red', icon: GiTrafficLightsReadyToGo }
                                            ].map((env) => {
                                                const isActive = environment === env.id;
                                                const colorClasses = {
                                                    green: isActive ? 'border-green-500 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' : 'border-gray-200 dark:border-gray-600 hover:border-green-300',
                                                    yellow: isActive ? 'border-yellow-500 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg' : 'border-gray-200 dark:border-gray-600 hover:border-yellow-300',
                                                    red: isActive ? 'border-red-500 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' : 'border-gray-200 dark:border-gray-600 hover:border-red-300'
                                                };

                                                return (
                                                    <Button
                                                        key={env.id}
                                                        onClick={() => setEnvironment(env.id)}
                                                        className={`relative p-3 rounded-lg border-2 transition-all duration-200 group ${colorClasses[env.color as keyof typeof colorClasses]}`}
                                                        variant="secondary"
                                                        icon={env.icon}
                                                        isChecked={isActive}
                                                        children={env.name}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* URL Segments */}
                                    <div>
                                        <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center space-x-2">
                                                <FiCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                <span>URL Path</span>
                                            </div>
                                        </label>
                                        <div className="space-y-3">
                                            {segments.map((segment, index) => (
                                                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                                                    <div className="grid gap-3 items-center md:grid-cols-12">
                                                        {/* Segment Type Toggle */}
                                                        <div className="md:col-span-2">
                                                            <Toggle
                                                                checked={segment.isDynamic}
                                                                onChange={(checked) => {
                                                                    const newSegments = [...segments];
                                                                    newSegments[index] = {
                                                                        ...segment,
                                                                        isDynamic: checked,
                                                                        value: checked ? "" : segment.value,
                                                                        paramName: checked ? segment.paramName : ""
                                                                    };
                                                                    setSegments(newSegments);
                                                                }}
                                                                label={segment.isDynamic ? "Variable" : "Static"}
                                                                size="sm"
                                                                colorScheme="blue"
                                                                position="right"
                                                            />
                                                        </div>

                                                        {/* Segment Value/Parameter Name */}
                                                        <div className="md:col-span-8">
                                                            {segment.isDynamic ? (
                                                                <div>
                                                                    <div className="flex items-center mb-1 space-x-2">
                                                                        <FiKey className="w-3 h-3 text-gray-500" />
                                                                        <span className="text-xs text-gray-600 dark:text-gray-400">Variable Name</span>
                                                                    </div>
                                                                    <Input
                                                                        type="text"
                                                                        value={segment.paramName}
                                                                        onChange={(e) => {
                                                                            const newSegments = [...segments];
                                                                            newSegments[index] = {
                                                                                ...segment,
                                                                                paramName: e.target.value
                                                                            };
                                                                            setSegments(newSegments);
                                                                        }}
                                                                        placeholder="Variable name (e.g., user_id)"
                                                                        fullWidth
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <div className="flex items-center mb-1 space-x-2">
                                                                        <FiCode className="w-3 h-3 text-gray-500" />
                                                                        <span className="text-xs text-gray-600 dark:text-gray-400">Segment Value</span>
                                                                    </div>
                                                                    <Input
                                                                        type="text"
                                                                        value={segment.value}
                                                                        onChange={(e) => {
                                                                            const newSegments = [...segments];
                                                                            newSegments[index] = {
                                                                                ...segment,
                                                                                value: e.target.value
                                                                            };
                                                                            setSegments(newSegments);
                                                                        }}
                                                                        placeholder="Segment value (e.g., api)"
                                                                        fullWidth
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="md:col-span-2">
                                                            <IconButton
                                                                icon={FiTrash2}
                                                                variant="ghost"
                                                                onClick={() => handleSegmentRemove(index)}
                                                                size="sm"
                                                                className="text-red-500 hover:text-red-700"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                variant="secondary"
                                                icon={FiPlus}
                                                onClick={handleSegmentAdd}
                                                size="sm"
                                                fullWidth
                                                className="flex items-center space-x-2"
                                            >
                                                <span>Segment</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Dynamic Segment Variables */}
                                    {(segments.some((s) => s.isDynamic) || domain === "{base_url}") && (
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
                                            <div className="flex items-center mb-3 space-x-2">
                                                <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Variable Values</span>
                                            </div>
                                            <div className="grid gap-2 md:grid-cols-2">
                                                {/* Show base_url variable if it's being used */}
                                                {domain === "{base_url}" && (
                                                    <div className="flex justify-between items-center p-2 bg-white rounded-lg dark:bg-gray-700">
                                                        <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                                            base_url:
                                                        </span>
                                                        <span className={`text-sm px-2 py-1 rounded ${globalVariables?.['base_url']
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }`}>
                                                            {getVariableValue('base_url', environment) || "Not set"}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Show segment variables */}
                                                {segments
                                                    .filter((s) => s.isDynamic && s.paramName)
                                                    .map((segment, i) => {
                                                        const value = globalVariables?.[segment.paramName] || sharedVariables.find(v => v.key === segment.paramName)?.value || "Not set";
                                                        return (
                                                            <div key={i} className="flex justify-between items-center p-2 bg-white rounded-lg dark:bg-gray-700">
                                                                <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                                                    {segment.paramName}:
                                                                </span>
                                                                <span className={`text-sm px-2 py-1 rounded ${value === "Not set"
                                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                    }`}>
                                                                    {value}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Built URL Preview */}
                                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-600">
                                        <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center space-x-2">
                                                <FiExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                <span>Built URL:</span>
                                            </div>
                                        </div>
                                        <div className="font-mono text-sm text-gray-600 break-all dark:text-gray-400">
                                            {builtUrl || 'No URL configured'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Request Configuration */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <SectionHeader
                                    icon={FiSettings}
                                    title="Request Configuration"
                                    description="Configure HTTP method and parameters"
                                    className="mb-8"
                                />
                                <div className="space-y-8">
                                    {/* HTTP Method */}
                                    <div>
                                        <label className="block mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            HTTP Method
                                        </label>
                                        <div className="grid grid-cols-5 gap-3">
                                            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((httpMethod) => {
                                                const methodColors = {
                                                    GET: { color: 'emerald', icon: FiDownload },
                                                    POST: { color: 'blue', icon: FiSend },
                                                    PUT: { color: 'yellow', icon: LuReplace },
                                                    PATCH: { color: 'purple', icon: FiEdit2 },
                                                    DELETE: { color: 'red', icon: FiTrash2 }
                                                };
                                                const color = methodColors[httpMethod as keyof typeof methodColors].color;
                                                const isActive = method === httpMethod;

                                                return (
                                                    <Button
                                                        key={httpMethod}
                                                        onClick={() => setMethod(httpMethod)}
                                                        className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 font-bold text-sm hover:scale-105 ${isActive
                                                            ? `text-white bg-gradient-to-br shadow-xl border-${color}-500 from-${color}-500 to-${color}-600 shadow-${color}-500/25`
                                                            : `border-slate-200 dark:border-slate-600 hover:border-${color}-300 hover:bg-${color}-50 dark:hover:bg-${color}-900/10`
                                                            }`}
                                                        variant="secondary"
                                                        icon={methodColors[httpMethod as keyof typeof methodColors].icon}
                                                        children={httpMethod}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Query Parameters */}
                                    <div>
                                        <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center space-x-2">
                                                <FiHash className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                <span>Query Parameters</span>
                                            </div>
                                        </label>
                                        <div className="space-y-3">
                                            {queryParams.map((param, index) => (
                                                <div key={index} className="flex items-center space-x-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-1 space-x-2">
                                                            <FiHash className="w-3 h-3 text-gray-500" />
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">Parameter</span>
                                                        </div>
                                                        <Input
                                                            value={param.key}
                                                            onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                                                            placeholder="Parameter name"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-1 space-x-2">
                                                            <FiTag className="w-3 h-3 text-gray-500" />
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">Value</span>
                                                        </div>
                                                        <Input
                                                            value={param.value}
                                                            onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                                                            placeholder="Parameter value"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <IconButton
                                                        icon={FiTrash2}
                                                        variant="ghost"
                                                        onClick={() => removeQueryParam(index)}
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700"
                                                    />
                                                </div>
                                            ))}
                                            <Button
                                                variant="secondary"
                                                icon={FiPlus}
                                                onClick={addQueryParam}
                                                size="sm"
                                                fullWidth
                                                className="flex items-center space-x-2"
                                                children={"Query Parameter"}
                                            />
                                        </div>
                                    </div>

                                    {/* Headers */}
                                    <div>
                                        <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center space-x-2">
                                                <FiList className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                                <span>Headers</span>
                                            </div>
                                        </label>
                                        <div className="space-y-3">
                                            {headers.map((header, index) => (
                                                <div key={index} className="flex items-center space-x-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-1 space-x-2">
                                                            <FiList className="w-3 h-3 text-gray-500" />
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">Header</span>
                                                        </div>
                                                        <Input
                                                            value={header.key}
                                                            onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                                            placeholder="Header name"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-1 space-x-2">
                                                            <FiTag className="w-3 h-3 text-gray-500" />
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">Value</span>
                                                        </div>
                                                        <Input
                                                            value={header.value}
                                                            onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                                            placeholder="Header value"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <IconButton
                                                        icon={FiTrash2}
                                                        variant="ghost"
                                                        onClick={() => removeHeader(index)}
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700"
                                                    />
                                                </div>
                                            ))}
                                            <Button
                                                variant="secondary"
                                                icon={FiPlus}
                                                onClick={addHeader}
                                                size="sm"
                                                fullWidth
                                                className="flex items-center space-x-2"
                                                children={"Header"}
                                            />
                                        </div>
                                    </div>

                                    {/* Body */}
                                    {['POST', 'PUT', 'PATCH'].includes(method) && (
                                        <>
                                            <Divider />
                                            <div>
                                                <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    <div className="flex items-center space-x-2">
                                                        <FiFileText className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                                                        <span>Request Body</span>
                                                    </div>
                                                </label>
                                                <div className="space-y-4">
                                                    <div className="flex space-x-2">
                                                        {[
                                                            { type: 'none', label: 'None', color: 'gray', icon: FiX },
                                                            { type: 'json', label: 'JSON', color: 'blue', icon: FiCode },
                                                            { type: 'form', label: 'Form', color: 'green', icon: FiMail },
                                                            { type: 'text', label: 'Text', color: 'purple', icon: FiType }
                                                        ].map(({ type, label, color, icon: Icon }) => {
                                                            const isActive = bodyType === type;
                                                            const colorClasses = {
                                                                gray: isActive ? 'border-gray-500 bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300',
                                                                blue: isActive ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300',
                                                                green: isActive ? 'border-green-500 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' : 'border-gray-200 dark:border-gray-600 hover:border-green-300',
                                                                purple: isActive ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                                                            };

                                                            return (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => setBodyType(type as any)}
                                                                    className={`flex items-center px-4 py-2 space-x-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${colorClasses[color as keyof typeof colorClasses]}`}
                                                                >
                                                                    <Icon className="w-4 h-4" />
                                                                    <span>{label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {bodyType === 'json' && (
                                                        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700">
                                                            <MonacoEditor
                                                                value={jsonBody}
                                                                onChange={handleJsonBodyChange}
                                                                language="json"
                                                                height="200px"
                                                                variant="compact"
                                                                colorTheme="bistool"
                                                            />
                                                        </div>
                                                    )}

                                                    {bodyType === 'form' && (
                                                        <div className="p-3 space-y-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700">
                                                            {formData.map((field, index) => (
                                                                <div key={index} className="flex items-center space-x-3">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center mb-1 space-x-2">
                                                                            <FiKey className="w-3 h-3 text-gray-500" />
                                                                            <span className="text-xs text-gray-600 dark:text-gray-400">Field</span>
                                                                        </div>
                                                                        <Input
                                                                            value={field.key}
                                                                            onChange={(e) => updateFormField(index, 'key', e.target.value)}
                                                                            placeholder="Field name"
                                                                            className="w-full"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center mb-1 space-x-2">
                                                                            <FiTag className="w-3 h-3 text-gray-500" />
                                                                            <span className="text-xs text-gray-600 dark:text-gray-400">Value</span>
                                                                        </div>
                                                                        <Input
                                                                            value={field.value}
                                                                            onChange={(e) => updateFormField(index, 'value', e.target.value)}
                                                                            placeholder="Field value"
                                                                            className="w-full"
                                                                        />
                                                                    </div>
                                                                    <IconButton
                                                                        icon={FiTrash2}
                                                                        variant="ghost"
                                                                        onClick={() => removeFormField(index)}
                                                                        size="sm"
                                                                        className="text-red-500 hover:text-red-700"
                                                                    />
                                                                </div>
                                                            ))}
                                                            <Button
                                                                variant="secondary"
                                                                icon={FiPlus}
                                                                onClick={addFormField}
                                                                size="sm"
                                                                fullWidth
                                                                className="flex items-center space-x-2"
                                                            >
                                                                <FiMail className="w-4 h-4" />
                                                                <span>Add Field</span>
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {bodyType === 'text' && (
                                                        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700">
                                                            <Textarea
                                                                value={textBody}
                                                                onChange={(e) => setTextBody(e.target.value)}
                                                                placeholder="Enter text body..."
                                                                rows={4}
                                                                fullWidth
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Variables */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <SectionHeader
                                    icon={FiDatabase}
                                    title="Variables"
                                    description="Manage global and session variables"
                                    className="mb-8"
                                />
                                <div className="space-y-8">
                                    {/* Global Variables */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                <div className="flex items-center space-x-2">
                                                    <FiGlobe className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    <span>Global Variables</span>
                                                </div>
                                            </h3>
                                            <Tooltip
                                                content={!isAuthenticated() ? "No token available. Generate a token first to enable this option." : "Include authentication token in requests"}
                                                position="left"
                                            >
                                                <div>
                                                    <Toggle
                                                        checked={includeToken}
                                                        onChange={setIncludeToken}
                                                        label="Include Token"
                                                        disabled={!isAuthenticated()}
                                                    />
                                                </div>
                                            </Tooltip>
                                        </div>
                                        <div className="space-y-3">
                                            {Object.entries(globalVariables).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-center p-3 bg-green-50 rounded-lg dark:bg-green-800/20">
                                                    {editingGlobalKey === key ? (
                                                        <>
                                                            <div className="flex-1 space-y-2">
                                                                <div>
                                                                    <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        <div className="flex items-center space-x-1">
                                                                            <FiKey className="w-3 h-3 text-gray-500" />
                                                                            <span>Key</span>
                                                                        </div>
                                                                    </label>
                                                                    <Input
                                                                        ref={globalEditKeyRef}
                                                                        value={editingGlobalNewKey}
                                                                        onChange={(e) => setEditingGlobalNewKey(e.target.value)}
                                                                        placeholder="Enter key..."
                                                                        className="w-full"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        <div className="flex items-center space-x-1">
                                                                            <FiTag className="w-3 h-3 text-gray-500" />
                                                                            <span>Value</span>
                                                                        </div>
                                                                    </label>
                                                                    <Input
                                                                        ref={globalEditValueRef}
                                                                        value={editingGlobalValue}
                                                                        onChange={(e) => setEditingGlobalValue(e.target.value)}
                                                                        placeholder="Enter value..."
                                                                        className="w-full"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <input type="button" value="Save" onClick={saveGlobalEdit} className='hidden' />
                                                            <div className="flex items-center space-x-2">
                                                                <IconButton
                                                                    icon={FiCheck}
                                                                    variant="ghost"
                                                                    onClick={saveGlobalEdit}
                                                                    size="sm"
                                                                    className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                                                />
                                                                <IconButton
                                                                    icon={FiX}
                                                                    variant="ghost"
                                                                    onClick={cancelGlobalEdit}
                                                                    size="sm"
                                                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                                />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex-1">
                                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{key}</div>
                                                                <Tooltip content={value} position="top" multiline>
                                                                    <div className="text-xs text-gray-500 truncate max-w-[220px] dark:text-gray-400 cursor-pointer select-text">{value}</div>
                                                                </Tooltip>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <IconButton
                                                                    icon={FiEdit2}
                                                                    variant="ghost"
                                                                    onClick={() => startEditingGlobal(key)}
                                                                    size="sm"
                                                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                                />
                                                                <IconButton
                                                                    icon={FiTrash2}
                                                                    variant="ghost"
                                                                    onClick={() => removeGlobalVariable(key)}
                                                                    size="sm"
                                                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                            <Button
                                                variant="secondary"
                                                icon={FiPlus}
                                                onClick={addGlobalVariable}
                                                size="sm"
                                                fullWidth
                                                children={"Global Variable"}
                                                className="flex items-center space-x-2"
                                            />
                                        </div>
                                    </div>

                                    {/* Session Variables */}
                                    <div>
                                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                            <div className="flex items-center space-x-2">
                                                <FiUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                <span>Session Variables</span>
                                            </div>
                                        </h3>
                                        <div className="space-y-3">
                                            {sharedVariables.map((variable) => (
                                                <div key={variable.key} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                                                    {editingSessionKey === variable.key ? (
                                                        <>
                                                            <div className="flex-1 space-y-2">
                                                                <div>
                                                                    <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        <div className="flex items-center space-x-1">
                                                                            <FiKey className="w-3 h-3 text-gray-500" />
                                                                            <span>Key</span>
                                                                        </div>
                                                                    </label>
                                                                    <Input
                                                                        ref={sessionEditKeyRef}
                                                                        value={editingSessionNewKey}
                                                                        onChange={(e) => setEditingSessionNewKey(e.target.value)}
                                                                        placeholder="Enter key..."
                                                                        className="w-full"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        <div className="flex items-center space-x-1">
                                                                            <FiTag className="w-3 h-3 text-gray-500" />
                                                                            <span>Value</span>
                                                                        </div>
                                                                    </label>
                                                                    <Input
                                                                        ref={sessionEditValueRef}
                                                                        value={editingSessionValue}
                                                                        onChange={(e) => setEditingSessionValue(e.target.value)}
                                                                        placeholder="Enter value..."
                                                                        className="w-full"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <IconButton
                                                                    icon={FiCheck}
                                                                    variant="ghost"
                                                                    onClick={saveSessionEdit}
                                                                    size="sm"
                                                                    className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                                                />
                                                                <IconButton
                                                                    icon={FiX}
                                                                    variant="ghost"
                                                                    onClick={cancelSessionEdit}
                                                                    size="sm"
                                                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                                />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex-1">
                                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{variable.key}</div>
                                                                <Tooltip content={variable.value} position="top" multiline>
                                                                    <div className="text-xs text-gray-500 truncate max-w-[220px] dark:text-gray-400 cursor-pointer select-text">{variable.value}</div>
                                                                </Tooltip>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <IconButton
                                                                    icon={FiEdit2}
                                                                    variant="ghost"
                                                                    onClick={() => startEditingSession(variable.key)}
                                                                    size="sm"
                                                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                                />
                                                                <IconButton
                                                                    icon={FiTrash2}
                                                                    variant="ghost"
                                                                    onClick={() => removeSessionVariable(variable.key)}
                                                                    size="sm"
                                                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                            <Button
                                                variant="secondary"
                                                icon={FiPlus}
                                                onClick={addSessionVariable}
                                                size="sm"
                                                fullWidth
                                                children={"Session Variable"}
                                                className="flex items-center space-x-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Send Request */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <SectionHeader
                                    icon={FiSend}
                                    title="Send Request"
                                    description="Execute your API request"
                                    className="mb-8"
                                />
                                <div className="space-y-6">
                                    <div className="flex items-center p-6 space-x-4 bg-gradient-to-br to-blue-50 rounded-2xl border-2 shadow-lg from-slate-50 border-slate-200 dark:from-slate-800 dark:to-blue-900/20 dark:border-slate-600">
                                        <Badge variant="primary" className={`px-4 py-2 text-lg font-bold ${getMethodColor(method)}`}>
                                            {method}
                                        </Badge>
                                        <div className="flex-1 font-mono text-base break-all text-slate-700 dark:text-slate-200">
                                            {builtUrl || 'No URL configured'}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Ready</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleFetch}
                                        disabled={isLoading || !builtUrl || !method}
                                        variant="primary"
                                        icon={FiSend}
                                        fullWidth
                                        size="lg"
                                        gradient
                                        className="h-14 text-lg font-bold shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-5 h-5 rounded-full border-2 animate-spin border-white/30 border-t-white"></div>
                                                <span>Sending Request...</span>
                                            </div>
                                        ) : (
                                            'Send Request'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Response Preview */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <SectionHeader
                                    icon={FiEye}
                                    title="Response Preview"
                                    description="View API response"
                                    className="mb-8"
                                />
                                <div className="space-y-6">
                                    {responseError ? (
                                        <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200 dark:from-red-900/20 dark:to-pink-900/20 dark:border-red-800">
                                            <div className="flex items-center mb-2 space-x-2">
                                                <FiAlertCircle className="w-4 h-4 text-red-500" />
                                                <div className="font-medium text-red-800 dark:text-red-200">Error</div>
                                            </div>
                                            <div className="text-sm text-red-600 dark:text-red-300">{responseError}</div>
                                        </div>
                                    ) : responseData ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-3">
                                                <Badge
                                                    variant={responseData.status >= 200 && responseData.status < 300 ? "success" : "danger"}
                                                    className="flex items-center space-x-2 text-sm"
                                                >
                                                    <FiActivityIcon className="w-4 h-4" />
                                                    <span>{responseData.status} {responseData.statusText}</span>
                                                </Badge>
                                                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <FiExternalLink className="w-3 h-3" />
                                                    <span>{responseData.url}</span>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-600">
                                                <MonacoEditor
                                                    allowSettings
                                                    allowFullscreen
                                                    description='Response Body'
                                                    value={typeof responseData.body === 'string'
                                                        ? responseData.body
                                                        : JSON.stringify(responseData.body, null, 2)
                                                    }
                                                    language={typeof responseData.body === 'string' ? 'text' : 'json'}
                                                    height="300px"
                                                    variant="compact"
                                                    colorTheme="bistool"
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full dark:from-gray-700 dark:to-gray-600">
                                                <FiEye className="w-8 h-8 opacity-50" />
                                            </div>
                                            <div className="flex justify-center items-center mb-2 space-x-2">
                                                <FiClock className="w-5 h-5 text-gray-400" />
                                                <p className="text-lg font-medium">No Response Yet</p>
                                            </div>
                                            <p className="text-sm">Send a request to see the response here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BasicMode; 