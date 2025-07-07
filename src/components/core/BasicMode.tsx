import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useVariablesContext } from '../../context/VariablesContext';
import { Card, SectionHeader, MonacoEditor, Input, Button, Toggle, Textarea, Badge, IconButton, Divider } from '../ui';
import { FiGlobe, FiSettings, FiCode, FiSend, FiEye, FiPlus, FiTrash2, FiLink, FiZap, FiDatabase, FiActivity, FiEdit2, FiCheck, FiX, FiShield } from 'react-icons/fi';
import { useURLBuilder } from '../../hooks/useURLBuilder';
import { Header, QueryParam, FormDataField } from '../../types';
import { DEFAULT_JSON_BODY, DEFAULT_FORM_DATA } from '../../constants/requestConfig';

const BasicMode: React.FC = () => {
    const {
        urlData,
        requestConfig,
        yamlOutput,
        activeSession,
        handleNewSession,
        handleClearSession,
        handleSaveSession,
        generateAuthHeaders,
    } = useAppContext();

    const { globalVariables, sharedVariables, updateGlobalVariable, updateSharedVariable, deleteGlobalVariable, deleteSharedVariable, replaceVariables } = useVariablesContext();
    const [responseData, setResponseData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [responseError, setResponseError] = useState<string | null>(null);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [includeToken, setIncludeToken] = useState<boolean>(activeSession?.includeToken ?? true);

    // Inline editing state
    const [editingGlobalKey, setEditingGlobalKey] = useState<string | null>(null);
    const [editingGlobalValue, setEditingGlobalValue] = useState<string>('');
    const [editingGlobalNewKey, setEditingGlobalNewKey] = useState<string>('');
    const [editingSessionKey, setEditingSessionKey] = useState<string | null>(null);
    const [editingSessionValue, setEditingSessionValue] = useState<string>('');
    const [editingSessionNewKey, setEditingSessionNewKey] = useState<string>('');

    // Refs for auto-focusing inputs
    const globalEditKeyRef = useRef<HTMLInputElement>(null);
    const globalEditValueRef = useRef<HTMLInputElement>(null);
    const sessionEditKeyRef = useRef<HTMLInputElement>(null);
    const sessionEditValueRef = useRef<HTMLInputElement>(null);

    // URL Builder state
    const {
        protocol,
        domain,
        segments,
        environment,
        builtUrl,
        setProtocol,
        setDomain,
        setSegments,
        setEnvironment,
        handleSegmentAdd,
        handleSegmentRemove,
    } = useURLBuilder();

    // Request Config state
    const [method, setMethod] = useState<string>(requestConfig?.method || 'GET');
    const [queryParams, setQueryParams] = useState<QueryParam[]>(requestConfig?.queryParams || []);
    const [headers, setHeaders] = useState<Header[]>(requestConfig?.headers || []);
    const [bodyType, setBodyType] = useState<"none" | "json" | "form" | "text">(requestConfig?.bodyType || 'none');
    const [jsonBody, setJsonBody] = useState<string>(requestConfig?.jsonBody || DEFAULT_JSON_BODY);
    const [formData, setFormData] = useState<FormDataField[]>(requestConfig?.formData || DEFAULT_FORM_DATA);
    const [textBody, setTextBody] = useState<string>(requestConfig?.textBody || '');

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
    }, [includeToken, activeSession?.id]);

    // Auto-focus input when editing starts
    useEffect(() => {
        if (editingGlobalKey && globalEditKeyRef.current) {
            globalEditKeyRef.current.focus();
        }
    }, [editingGlobalKey]);

    useEffect(() => {
        if (editingSessionKey && sessionEditKeyRef.current) {
            sessionEditKeyRef.current.focus();
        }
    }, [editingSessionKey]);

    // Show loading state when creating session
    if (isCreatingSession) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 border-4 rounded-full border-blue-500/20 border-t-blue-500 animate-spin"></div>
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

    // Show no session state
    if (!activeSession) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
                <div className="max-w-md p-8 mx-auto text-center">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600">
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

    // Handle real fetch
    const handleFetch = async () => {
        if (!urlData?.builtUrl || !method) {
            setResponseError('Please configure URL and request method first');
            return;
        }

        setIsLoading(true);
        setResponseError(null);

        try {
            // Apply variable replacement to URL
            let resolvedUrl = replaceVariables(urlData.builtUrl);

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

    // Helper functions for request config
    const addQueryParam = () => {
        setQueryParams([...queryParams, { key: "", value: "", description: "", required: false }]);
    };

    const removeQueryParam = (index: number) => {
        setQueryParams(queryParams.filter((_, i) => i !== index));
    };

    const updateQueryParam = (index: number, field: keyof QueryParam, value: string | boolean) => {
        const newQueryParams = [...queryParams];
        const prev = newQueryParams[index] || { key: '', value: '' };
        const base: QueryParam = {
            key: field === 'key' ? (value as string) : prev.key || '',
            value: field === 'value' ? (value as string) : prev.value || '',
        };
        if (field === 'description' ? value : prev.description) {
            base.description = field === 'description' ? (value as string) : prev.description!;
        }
        if (field === 'required' ? value : prev.required !== undefined) {
            base.required = field === 'required' ? (value as boolean) : prev.required!;
        }
        if (field === 'type' ? value : prev.type) {
            base.type = field === 'type' ? (value as string) : prev.type!;
        }
        newQueryParams[index] = base;
        setQueryParams(newQueryParams);
    };

    const addHeader = () => {
        setHeaders([...headers, { key: "", value: "", description: "", required: false, in: "header" }]);
    };

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };

    const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
        const newHeaders = [...headers];
        const prev = newHeaders[index] || { key: '', value: '', in: 'header' };
        const base: Header = {
            key: field === 'key' ? (value as string) : prev.key || '',
            value: field === 'value' ? (value as string) : prev.value || '',
            in: field === 'in' ? (value as Header['in']) : prev.in || 'header',
        };
        if (field === 'description' ? value : prev.description) {
            base.description = field === 'description' ? (value as string) : prev.description!;
        }
        if (field === 'required' ? value : prev.required !== undefined) {
            base.required = field === 'required' ? (value as boolean) : prev.required!;
        }
        if (field === 'type' ? value : prev.type) {
            base.type = field === 'type' ? (value as string) : prev.type!;
        }
        newHeaders[index] = base;
        setHeaders(newHeaders);
    };

    const addFormField = () => {
        setFormData([...formData, { key: "", value: "", type: "text", required: false }]);
    };

    const removeFormField = (index: number) => {
        setFormData(formData.filter((_, i) => i !== index));
    };

    const updateFormField = (index: number, field: keyof FormDataField, value: string | boolean) => {
        const newFormData = [...formData];
        const prev = newFormData[index] || { key: '', value: '', type: 'text', required: false };
        const base: FormDataField = {
            key: field === 'key' ? (value as string) : prev.key || '',
            value: field === 'value' ? (value as string) : prev.value || '',
            type: field === 'type' ? (value as 'text' | 'file') : prev.type || 'text',
            required: field === 'required' ? (value as boolean) : (typeof prev.required === 'boolean' ? prev.required : false),
        };
        if (field === 'description' ? value : prev.description) {
            base.description = field === 'description' ? (value as string) : prev.description!;
        }
        newFormData[index] = base;
        setFormData(newFormData);
    };

    // Method color mapping
    const getMethodColor = (httpMethod: string) => {
        const colors = {
            GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
            POST: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
            PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
            DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
            PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
        };
        return colors[httpMethod as keyof typeof colors] || colors.GET;
    };

    // Handle Monaco editor change
    const handleJsonBodyChange = (value: string | undefined) => {
        setJsonBody(value || '');
    };

    // Inline editing functions for global variables
    const startEditingGlobal = (key: string, value: string) => {
        setEditingGlobalKey(key);
        setEditingGlobalValue(value);
        setEditingGlobalNewKey(key);
    };

    const saveGlobalEdit = () => {
        if (editingGlobalKey && editingGlobalNewKey.trim() && editingGlobalValue.trim()) {
            // If key changed, delete old key and create new one
            if (editingGlobalKey !== editingGlobalNewKey.trim()) {
                deleteGlobalVariable(editingGlobalKey);
            }
            updateGlobalVariable(editingGlobalNewKey.trim(), editingGlobalValue.trim());
        }
        setEditingGlobalKey(null);
        setEditingGlobalValue('');
        setEditingGlobalNewKey('');
    };

    const cancelGlobalEdit = () => {
        setEditingGlobalKey(null);
        setEditingGlobalValue('');
        setEditingGlobalNewKey('');
    };

    // Inline editing functions for session variables
    const startEditingSession = (key: string, value: string) => {
        setEditingSessionKey(key);
        setEditingSessionValue(value);
        setEditingSessionNewKey(key);
    };

    const saveSessionEdit = () => {
        if (editingSessionKey && editingSessionNewKey.trim() && editingSessionValue.trim()) {
            // If key changed, delete old key and create new one
            if (editingSessionKey !== editingSessionNewKey.trim()) {
                deleteSharedVariable(editingSessionKey);
            }
            updateSharedVariable(editingSessionNewKey.trim(), editingSessionValue.trim());
        }
        setEditingSessionKey(null);
        setEditingSessionValue('');
        setEditingSessionNewKey('');
    };

    const cancelSessionEdit = () => {
        setEditingSessionKey(null);
        setEditingSessionValue('');
        setEditingSessionNewKey('');
    };

    return (
        <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
            <div className="mx-auto space-y-6 max-w-7xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center p-4 mb-4 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                        <FiZap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="mb-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                        Basic Mode
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Simplified interface for quick API testing and configuration
                    </p>

                    {/* Session Info */}
                    {activeSession && (
                        <div className="p-4 mt-6 border border-gray-200 bg-white/80 dark:bg-gray-800/80 rounded-xl dark:border-gray-700 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Active Session: {activeSession.name || 'Untitled Session'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            ID: {activeSession.id}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={handleCreateNewSession}
                                        variant="secondary"
                                        size="sm"
                                        icon={FiPlus}
                                    >
                                        New Session
                                    </Button>
                                    <Button
                                        onClick={handleClearSession}
                                        variant="danger"
                                        size="sm"
                                        icon={FiTrash2}
                                    >
                                        Clear Session
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* URL Configuration */}
                        <Card variant="elevated" className="p-6 border-0 shadow-xl">
                            <SectionHeader
                                icon={FiGlobe}
                                title="URL Configuration"
                                description="Set your API endpoint"
                                className="mb-6"
                            />
                            <div className="space-y-6">
                                {/* Protocol */}
                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Protocol
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setProtocol('https')}
                                            className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${protocol === 'https'
                                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg scale-105'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:scale-105'
                                                }`}
                                        >
                                            <div className="text-center">
                                                <div className="mb-2 text-2xl">🔒</div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">HTTPS</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Secure</div>
                                            </div>
                                            {protocol === 'https' && (
                                                <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full top-2 right-2"></div>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setProtocol('http')}
                                            className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${protocol === 'http'
                                                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 shadow-lg scale-105'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 hover:scale-105'
                                                }`}
                                        >
                                            <div className="text-center">
                                                <div className="mb-2 text-2xl">🌐</div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">HTTP</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Standard</div>
                                            </div>
                                            {protocol === 'http' && (
                                                <div className="absolute w-3 h-3 bg-orange-500 border-2 border-white rounded-full top-2 right-2"></div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Domain */}
                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Domain
                                    </label>
                                    <div className="relative">
                                        <Input
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            placeholder="api.example.com"
                                            fullWidth
                                            className="pl-12"
                                        />
                                        <div className="absolute transform -translate-y-1/2 left-3 top-1/2">
                                            <FiGlobe className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Environment */}
                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Environment
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'development', label: 'Dev', color: 'green', icon: '🟢' },
                                            { id: 'staging', label: 'Staging', color: 'yellow', icon: '🟡' },
                                            { id: 'production', label: 'Prod', color: 'red', icon: '🔴' }
                                        ].map((env) => (
                                            <button
                                                key={env.id}
                                                onClick={() => setEnvironment(env.id)}
                                                className={`relative p-3 rounded-lg border-2 transition-all duration-200 group ${environment === env.id
                                                    ? `border-${env.color}-500 bg-gradient-to-br from-${env.color}-50 to-${env.color}-100 dark:from-${env.color}-900/20 dark:to-${env.color}-800/20 shadow-lg scale-105`
                                                    : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                                                    }`}
                                            >
                                                <div className="text-center">
                                                    <div className="mb-1 text-lg">{env.icon}</div>
                                                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{env.label}</div>
                                                </div>
                                                {environment === env.id && (
                                                    <div className={`absolute top-1 right-1 w-2 h-2 bg-${env.color}-500 border border-white rounded-full`}></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Segments */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Path Segments
                                        </label>
                                        <Button
                                            variant="primary"
                                            icon={FiPlus}
                                            onClick={handleSegmentAdd}
                                            size="sm"
                                            gradient
                                        >
                                            Add Segment
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {segments.map((segment, index) => (
                                            <div key={index} className="flex items-center p-3 space-x-3 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 dark:border-gray-600">
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
                                                />
                                                <Input
                                                    value={segment.isDynamic ? segment.paramName : segment.value}
                                                    onChange={(e) => {
                                                        const newSegments = [...segments];
                                                        if (segment.isDynamic) {
                                                            newSegments[index] = { ...segment, paramName: e.target.value };
                                                        } else {
                                                            newSegments[index] = { ...segment, value: e.target.value };
                                                        }
                                                        setSegments(newSegments);
                                                    }}
                                                    placeholder={segment.isDynamic ? "param_name" : "segment"}
                                                    className="flex-1"
                                                />
                                                <IconButton
                                                    icon={FiTrash2}
                                                    variant="ghost"
                                                    onClick={() => handleSegmentRemove(index)}
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Built URL Preview */}
                                {builtUrl && (
                                    <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700">
                                        <div className="flex items-center mb-2 space-x-2">
                                            <FiLink className="w-4 h-4 text-blue-500" />
                                            <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                Built URL:
                                            </div>
                                        </div>
                                        <div className="p-2 font-mono text-sm text-blue-600 break-all bg-white border rounded dark:text-blue-400 dark:bg-gray-800">
                                            {builtUrl}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Request Configuration */}
                        <Card variant="elevated" className="p-6 border-0 shadow-xl">
                            <SectionHeader
                                icon={FiSettings}
                                title="Request Configuration"
                                description="Set method, headers, and body"
                                className="mb-6"
                            />
                            <div className="space-y-6">
                                {/* Method */}
                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        HTTP Method
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { method: 'GET', icon: '📥', color: 'blue' },
                                            { method: 'POST', icon: '📤', color: 'green' },
                                            { method: 'PUT', icon: '🔄', color: 'yellow' },
                                            { method: 'DELETE', icon: '🗑️', color: 'red' }
                                        ].map(({ method: httpMethod, icon, color }) => (
                                            <button
                                                key={httpMethod}
                                                onClick={() => setMethod(httpMethod)}
                                                className={`relative p-3 rounded-lg border-2 transition-all duration-200 group ${method === httpMethod
                                                    ? `border-${color}-500 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20 shadow-lg scale-105`
                                                    : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                                                    }`}
                                            >
                                                <div className="text-center">
                                                    <div className="mb-1 text-lg">{icon}</div>
                                                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{httpMethod}</div>
                                                </div>
                                                {method === httpMethod && (
                                                    <div className={`absolute top-1 right-1 w-2 h-2 bg-${color}-500 border border-white rounded-full`}></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Token Toggle */}
                                <div className="flex items-center p-3 space-x-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <FiShield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    <Toggle
                                        checked={includeToken && !!globalVariables["tokenName"]}
                                        onChange={() => setIncludeToken((prev) => !prev)}
                                        label="Include Token"
                                        disabled={!globalVariables["tokenName"]}
                                        colorScheme="purple"
                                        size="md"
                                    />
                                    {!globalVariables["tokenName"] && (
                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                            No token configured
                                        </span>
                                    )}
                                </div>

                                <Divider />

                                {/* Query Parameters */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Query Parameters
                                        </label>
                                        <Button
                                            variant="secondary"
                                            icon={FiPlus}
                                            onClick={addQueryParam}
                                            size="sm"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {queryParams.map((param, index) => (
                                            <div key={index} className="flex items-center p-3 space-x-3 border border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700">
                                                <Input
                                                    value={param.key}
                                                    onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                                                    placeholder="Key"
                                                    className="flex-1"
                                                />
                                                <Input
                                                    value={param.value}
                                                    onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                                                    placeholder="Value"
                                                    className="flex-1"
                                                />
                                                <IconButton
                                                    icon={FiTrash2}
                                                    variant="ghost"
                                                    onClick={() => removeQueryParam(index)}
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Divider />

                                {/* Headers */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Headers
                                        </label>
                                        <Button
                                            variant="secondary"
                                            icon={FiPlus}
                                            onClick={addHeader}
                                            size="sm"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {headers.map((header, index) => (
                                            <div key={index} className="flex items-center p-3 space-x-3 border border-indigo-200 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 dark:border-indigo-700">
                                                <Input
                                                    value={header.key}
                                                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                                    placeholder="Header"
                                                    className="flex-1"
                                                />
                                                <Input
                                                    value={header.value}
                                                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                                    placeholder="Value"
                                                    className="flex-1"
                                                />
                                                <IconButton
                                                    icon={FiTrash2}
                                                    variant="ghost"
                                                    onClick={() => removeHeader(index)}
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Body */}
                                {['POST', 'PUT', 'PATCH'].includes(method) && (
                                    <>
                                        <Divider />
                                        <div>
                                            <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Request Body
                                            </label>
                                            <div className="space-y-4">
                                                <div className="flex space-x-2">
                                                    {[
                                                        { type: 'none', label: 'None', color: 'gray' },
                                                        { type: 'json', label: 'JSON', color: 'blue' },
                                                        { type: 'form', label: 'Form', color: 'green' },
                                                        { type: 'text', label: 'Text', color: 'purple' }
                                                    ].map(({ type, label, color }) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setBodyType(type as any)}
                                                            className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${bodyType === type
                                                                ? `border-${color}-500 bg-gradient-to-r from-${color}-500 to-${color}-600 text-white shadow-lg`
                                                                : `border-gray-200 dark:border-gray-600 hover:border-${color}-300`
                                                                }`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {bodyType === 'json' && (
                                                    <div className="p-3 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700">
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
                                                    <div className="p-3 space-y-3 border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700">
                                                        {formData.map((field, index) => (
                                                            <div key={index} className="flex items-center space-x-3">
                                                                <Input
                                                                    value={field.key}
                                                                    onChange={(e) => updateFormField(index, 'key', e.target.value)}
                                                                    placeholder="Field"
                                                                    className="flex-1"
                                                                />
                                                                <Input
                                                                    value={field.value}
                                                                    onChange={(e) => updateFormField(index, 'value', e.target.value)}
                                                                    placeholder="Value"
                                                                    className="flex-1"
                                                                />
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
                                                        >
                                                            Add Field
                                                        </Button>
                                                    </div>
                                                )}

                                                {bodyType === 'text' && (
                                                    <div className="p-3 border border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700">
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
                        </Card>

                        {/* Variables */}
                        <Card variant="elevated" className="p-6 border-0 shadow-xl">
                            <SectionHeader
                                icon={FiDatabase}
                                title="Variables"
                                description="Manage global and session variables"
                                className="mb-6"
                            />

                            {/* Global Variables */}
                            <div className="mb-6">
                                <div className="flex items-center mb-3 space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Global Variables</h4>
                                    <Badge variant="default" className="text-xs">
                                        {Object.keys(globalVariables).length}
                                    </Badge>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(globalVariables).map(([key, value]) => (
                                        <div key={key} className="flex items-center p-3 space-x-3 border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700">
                                            {editingGlobalKey === key ? (
                                                // Edit mode
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Input
                                                            ref={globalEditKeyRef}
                                                            value={editingGlobalNewKey}
                                                            onChange={(e) => setEditingGlobalNewKey(e.target.value)}
                                                            placeholder="Variable key"
                                                            className="flex-1 text-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') globalEditValueRef.current?.focus();
                                                                if (e.key === 'Escape') cancelGlobalEdit();
                                                            }}
                                                        />
                                                        <Input
                                                            ref={globalEditValueRef}
                                                            value={editingGlobalValue}
                                                            onChange={(e) => setEditingGlobalValue(e.target.value)}
                                                            placeholder="Variable value"
                                                            className="flex-1 text-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') saveGlobalEdit();
                                                                if (e.key === 'Escape') cancelGlobalEdit();
                                                            }}
                                                        />
                                                        <IconButton
                                                            icon={FiCheck}
                                                            variant="ghost"
                                                            onClick={saveGlobalEdit}
                                                            size="sm"
                                                            className="text-green-500 hover:text-green-700"
                                                        />
                                                        <IconButton
                                                            icon={FiX}
                                                            variant="ghost"
                                                            onClick={cancelGlobalEdit}
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                // View mode
                                                <>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{key}</div>
                                                        <div className="text-xs text-gray-500 truncate dark:text-gray-400">{value}</div>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <IconButton
                                                            icon={FiEdit2}
                                                            variant="ghost"
                                                            onClick={() => startEditingGlobal(key, value)}
                                                            size="sm"
                                                            className="text-green-500 hover:text-green-700"
                                                        />
                                                        <IconButton
                                                            icon={FiTrash2}
                                                            variant="ghost"
                                                            onClick={() => deleteGlobalVariable(key)}
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        variant="secondary"
                                        icon={FiPlus}
                                        onClick={() => updateGlobalVariable(`global_${Date.now()}`, '')}
                                        size="sm"
                                        fullWidth
                                    >
                                        Add Global Variable
                                    </Button>
                                </div>
                            </div>

                            <Divider />

                            {/* Session Variables */}
                            <div>
                                <div className="flex items-center mb-3 space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Session Variables</h4>
                                    <Badge variant="default" className="text-xs">
                                        {sharedVariables.length}
                                    </Badge>
                                </div>
                                <div className="space-y-3">
                                    {sharedVariables.map((variable) => (
                                        <div key={variable.key} className="flex items-center p-3 space-x-3 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700">
                                            {editingSessionKey === variable.key ? (
                                                // Edit mode
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Input
                                                            ref={sessionEditKeyRef}
                                                            value={editingSessionNewKey}
                                                            onChange={(e) => setEditingSessionNewKey(e.target.value)}
                                                            placeholder="Variable key"
                                                            className="flex-1 text-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') sessionEditValueRef.current?.focus();
                                                                if (e.key === 'Escape') cancelSessionEdit();
                                                            }}
                                                        />
                                                        <Input
                                                            ref={sessionEditValueRef}
                                                            value={editingSessionValue}
                                                            onChange={(e) => setEditingSessionValue(e.target.value)}
                                                            placeholder="Variable value"
                                                            className="flex-1 text-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') saveSessionEdit();
                                                                if (e.key === 'Escape') cancelSessionEdit();
                                                            }}
                                                        />
                                                        <IconButton
                                                            icon={FiCheck}
                                                            variant="ghost"
                                                            onClick={saveSessionEdit}
                                                            size="sm"
                                                            className="text-green-500 hover:text-green-700"
                                                        />
                                                        <IconButton
                                                            icon={FiX}
                                                            variant="ghost"
                                                            onClick={cancelSessionEdit}
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                // View mode
                                                <>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{variable.key}</div>
                                                        <div className="text-xs text-gray-500 truncate dark:text-gray-400">{variable.value}</div>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <IconButton
                                                            icon={FiEdit2}
                                                            variant="ghost"
                                                            onClick={() => startEditingSession(variable.key, variable.value)}
                                                            size="sm"
                                                            className="text-blue-500 hover:text-blue-700"
                                                        />
                                                        <IconButton
                                                            icon={FiTrash2}
                                                            variant="ghost"
                                                            onClick={() => deleteSharedVariable(variable.key)}
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        variant="secondary"
                                        icon={FiPlus}
                                        onClick={() => updateSharedVariable(`session_${Date.now()}`, '')}
                                        size="sm"
                                        fullWidth
                                    >
                                        Add Session Variable
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Send Request */}
                        <Card variant="elevated" className="p-6 border-0 shadow-xl">
                            <SectionHeader
                                icon={FiSend}
                                title="Send Request"
                                description="Execute your API request"
                                className="mb-6"
                            />
                            <div className="space-y-4">
                                <div className="flex items-center p-4 space-x-3 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700">
                                    <Badge variant="primary" className={getMethodColor(method)}>
                                        {method}
                                    </Badge>
                                    <div className="flex-1 font-mono text-sm text-gray-600 truncate dark:text-gray-300">
                                        {builtUrl || 'No URL configured'}
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
                                >
                                    {isLoading ? 'Sending...' : 'Send Request'}
                                </Button>
                            </div>
                        </Card>

                        {/* Response Preview */}
                        <Card variant="elevated" className="p-6 border-0 shadow-xl">
                            <SectionHeader
                                icon={FiEye}
                                title="Response Preview"
                                description="View API response"
                                className="mb-6"
                            />
                            <div className="space-y-4">
                                {responseError ? (
                                    <div className="p-4 border border-red-200 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 dark:border-red-800">
                                        <div className="flex items-center mb-2 space-x-2">
                                            <FiActivity className="w-4 h-4 text-red-500" />
                                            <div className="font-medium text-red-800 dark:text-red-200">Error</div>
                                        </div>
                                        <div className="text-sm text-red-600 dark:text-red-300">{responseError}</div>
                                    </div>
                                ) : responseData ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Badge
                                                variant={responseData.status >= 200 && responseData.status < 300 ? "success" : "danger"}
                                                className="text-sm"
                                            >
                                                {responseData.status} {responseData.statusText}
                                            </Badge>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {responseData.url}
                                            </div>
                                        </div>
                                        <div className="p-3 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 dark:border-gray-600">
                                            <MonacoEditor
                                                value={typeof responseData.body === 'string'
                                                    ? responseData.body
                                                    : JSON.stringify(responseData.body, null, 2)
                                                }
                                                language={typeof responseData.body === 'string' ? 'text' : 'json'}
                                                height="300px"
                                                readOnly
                                                showToolbar={false}
                                                variant="compact"
                                                colorTheme="bistool"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                                            <FiEye className="w-8 h-8 opacity-50" />
                                        </div>
                                        <p className="text-lg font-medium">No Response Yet</p>
                                        <p className="text-sm">Send a request to see the response here</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* YAML Output */}
                        <Card variant="elevated" className="p-6 border-0 shadow-xl">
                            <SectionHeader
                                icon={FiCode}
                                title="YAML Output"
                                description="Generated test configuration"
                                className="mb-6"
                            />
                            <div className="p-3 border rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
                                <MonacoEditor
                                    value={yamlOutput || '# YAML output will appear here after configuration'}
                                    language="yaml"
                                    height="200px"
                                    readOnly
                                    showToolbar={false}
                                    variant="compact"
                                    colorTheme="bistool"
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BasicMode; 