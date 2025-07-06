import React, { useState, useEffect, useCallback, useRef } from "react";
import { useVariablesContext } from "../../context/VariablesContext";
import { useTheme } from "../../context/ThemeContext";
import { useAppContext } from "../../context/AppContext";
import Modal from "../core/Modal";
import Tooltip from "../ui/Tooltip";
import {
    FiClock, FiCheckCircle, FiAlertCircle, FiEye, FiCopy,
    FiUpload, FiShield, FiGlobe, FiDatabase, FiCode, FiLock,
    FiRefreshCw, FiHash, FiUsers, FiUserCheck, FiKey
} from 'react-icons/fi';

const TokenGenerator: React.FC = () => {
    const { globalVariables, updateGlobalVariable } = useVariablesContext();
    const { tokenConfig, setTokenConfig } = useAppContext();
    const { isDarkMode } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [tokenDuration, setTokenDuration] = useState<number>(0);
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'auth' | 'extraction' | 'validation' | 'security' | 'preview' | 'debug'>('auth');
    const [responseInfo, setResponseInfo] = useState<{
        cookies: Array<{ name: string; value: string }>;
        headers: Array<{ name: string; value: string }>;
        responseText: string;
        setCookieHeader: string | null;
    } | null>(null);
    const [error, setError] = useState<string>('');
    // State for auto-detect
    const [isAutoDetecting, setIsAutoDetecting] = useState(false);

    // Refs for memory leak prevention
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Safe state setter that only updates if component is mounted
    const safeSetState = useCallback((setter: Function, value: any) => {
        if (isMountedRef.current) {
            setter(value);
        }
    }, []);

    const decodeString = useCallback((encodedString: string): string | null => {
        try {
            return atob(encodedString.replace(/-/g, "+").replace(/_/g, "/"));
        } catch (e) {
            console.error("Error decoding string:", e);
            return null;
        }
    }, []);


    const getCookieValue = useCallback((cookieName: string): string | null => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === cookieName && value) {
                return decodeURIComponent(value);
            }
        }
        return null;
    }, []);

    const extractTokenFromJson = useCallback((jsonData: any, paths: string[]): string | null => {
        // Default paths to try if none specified
        const defaultPaths = ['token', 'access_token', 'accessToken', 'jwt', 'auth_token'];
        const searchPaths = paths.length > 0 ? paths : defaultPaths;

        for (const path of searchPaths) {
            const value = jsonData[path];
            if (value && typeof value === 'string') {
                return value;
            }
        }
        return null;
    }, []);

    const extractTokenFromCookies = useCallback((cookieNames: string[]): string | null => {
        // Default cookie names to try if none specified
        const defaultNames = ['token', 'access_token', 'auth_token', 'jwt'];
        const searchNames = cookieNames.length > 0 ? cookieNames : defaultNames;


        for (const cookieName of searchNames) {
            const value = getCookieValue(cookieName);
            if (value) {
                return value;
            }
        }

        // Try to find any cookie that might contain the token
        const allCookies = document.cookie.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return { name: name?.trim(), value: value?.trim() };
        }).filter(cookie => cookie.name);

        const tokenCookie = allCookies.find(cookie =>
            cookie.name?.toLowerCase().includes('token') ||
            cookie.name?.toLowerCase().includes('auth') ||
            cookie.name?.toLowerCase().includes('jwt')
        );

        if (tokenCookie) {
            return tokenCookie.value ?? null;
        }

        return null;
    }, [getCookieValue]);

    const extractTokenFromSetCookieHeader = useCallback((response: Response, cookieNames: string[]): string | null => {
        // Try to extract from Set-Cookie header directly
        const setCookieHeader = response.headers.get('set-cookie');
        if (!setCookieHeader) {

            // Try to get all headers to see what's available
            const allHeaders: string[] = [];
            response.headers.forEach((value, key) => {
                allHeaders.push(`${key}: ${value}`);
            });

            return null;
        }


        // Parse the Set-Cookie header
        const cookies = setCookieHeader.split(',').map(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue?.trim().split('=') ?? [];
            return { name: name?.trim(), value: value?.trim() };
        });


        // Default cookie names to try if none specified
        const defaultNames = ['token', 'access_token', 'auth_token', 'jwt'];
        const searchNames = cookieNames.length > 0 ? cookieNames : defaultNames;

        for (const cookieName of searchNames) {
            const cookie = cookies.find(c => c.name === cookieName);
            if (cookie?.value) {
                return cookie.value;
            }
        }

        // Try to find any cookie that might contain the token
        const tokenCookie = cookies.find(cookie =>
            cookie.name?.toLowerCase().includes('token') ||
            cookie.name?.toLowerCase().includes('auth') ||
            cookie.name?.toLowerCase().includes('jwt')
        );

        if (tokenCookie?.value) {
            return tokenCookie.value;
        }

        return null;
    }, []);

    const extractTokenFromHeaders = useCallback((response: Response, headerNames: string[]): string | null => {
        // Default header names to try if none specified
        const defaultNames = ['authorization', 'x-access-token', 'x-auth-token', 'token'];
        const searchNames = headerNames.length > 0 ? headerNames : defaultNames;

        for (const headerName of searchNames) {
            const value = response.headers.get(headerName);
            if (value) {
                // Remove 'Bearer ' prefix if present
                return value.replace(/^Bearer\s+/i, '');
            }
        }
        return null;
    }, []);

    const extractTokenFromResponseText = useCallback((responseText: string): string | null => {

        // Try to find JWT pattern in the response text
        const jwtPattern = /jwt[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i;
        const match = responseText.match(jwtPattern);
        if (match) {
            return match[1] ?? null;
        }

        // Try to find any token pattern
        const tokenPattern = /(?:token|access_token|auth_token)[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i;
        const tokenMatch = responseText.match(tokenPattern);
        if (tokenMatch) {
            return tokenMatch[1] ?? null;
        }

        return null;
    }, []);

    const generateToken = useCallback(async (): Promise<void> => {
        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        safeSetState(setIsGenerating, true);
        safeSetState(setError, '');
        safeSetState(setSuccessMessage, "");

        try {
            if (!globalVariables['username'] || !globalVariables['password']) {
                throw new Error("Please set username and password in global variables");
            }

            const domain = tokenConfig.domain;
            if (!domain) {
                throw new Error("Please set a valid domain");
            }

            const requestUrl = `${domain}${tokenConfig.path}`;

            // Build request body based on content type and field mappings
            let requestBody: string;
            let contentType: string;

            if (tokenConfig.requestMapping.contentType === "json") {
                const bodyData = {
                    [tokenConfig.requestMapping.usernameField]: globalVariables['username'],
                    [tokenConfig.requestMapping.passwordField]: globalVariables['password']
                };
                requestBody = JSON.stringify(bodyData);
                contentType = 'application/json';
            } else {
                requestBody = `${tokenConfig.requestMapping.usernameField}=${encodeURIComponent(
                    globalVariables['username']
                )}&${tokenConfig.requestMapping.passwordField}=${encodeURIComponent(
                    globalVariables['password']
                )}`;
                contentType = 'application/x-www-form-urlencoded';
            }

            const response = await fetch(requestUrl, {
                method: tokenConfig.method,
                headers: {
                    'Accept': '*/*',
                    'Content-Type': contentType,
                },
                body: requestBody,
                signal: abortControllerRef.current.signal,
            });

            // Capture response information for debugging
            const allHeaders: Array<{ name: string; value: string }> = [];
            response.headers.forEach((value, key) => {
                allHeaders.push({ name: key, value });
            });
            const setCookieHeader = response.headers.get('set-cookie');

            // Wait a moment for cookies to be set by the browser
            if (isMountedRef.current) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Get all cookies from document.cookie
            const allCookies = document.cookie.split(';').map(cookie => {
                const [name, value] = cookie.trim().split('=');
                return { name: name?.trim() ?? '', value: value?.trim() ?? '' };
            }).filter(cookie => cookie.name);

            let token: string | null = null;
            let extractionSource = '';
            let responseText = '';

            // 1. Try to extract from JSON response first
            if (tokenConfig.extractionMethods.json) {
                try {
                    responseText = await response.text();
                    let jsonData: any;
                    try {

                        jsonData = JSON.parse(responseText);
                    } catch (e) {
                        console.log("Response is not JSON, trying other extraction methods", e);
                    }

                    if (jsonData) {
                        token = extractTokenFromJson(jsonData, tokenConfig.extractionMethods.jsonPaths);
                        if (token) {
                            extractionSource = 'JSON response';
                        }
                    }
                } catch (e) {
                    console.log("Failed to extract from JSON:", e);
                }
            }

            // 2. Try to extract from cookies if JSON extraction failed
            if (!token && tokenConfig.extractionMethods.cookies) {
                // First try to extract from Set-Cookie header directly
                token = extractTokenFromSetCookieHeader(response, tokenConfig.extractionMethods.cookieNames);
                if (token) {
                    extractionSource = 'Set-Cookie header';
                } else {
                    // Wait longer for cookies to be set by the browser
                    if (isMountedRef.current) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                    token = extractTokenFromCookies(tokenConfig.extractionMethods.cookieNames);
                    if (token) {
                        extractionSource = 'response cookies';
                    } else {
                    }
                }
            }

            // 3. Try to extract from response headers if previous methods failed
            if (!token && tokenConfig.extractionMethods.headers) {
                token = extractTokenFromHeaders(response, tokenConfig.extractionMethods.headerNames);
                if (token) {
                    extractionSource = 'response headers';
                }
            }

            // 4. Try to extract from response text if previous methods failed
            if (!token && tokenConfig.extractionMethods.cookies) {
                if (!responseText) {
                    responseText = await response.text();
                }
                token = extractTokenFromResponseText(responseText);
                if (token) {
                    extractionSource = 'response text';
                }
            }

            if (!token) {
                throw new Error("Token not found in response. Check your extraction configuration.");
            }

            updateGlobalVariable(tokenConfig.tokenName, token);
            updateGlobalVariable("tokenName", tokenConfig.tokenName);
            safeSetState(setSuccessMessage, `Token extracted from ${extractionSource} successfully!`);
            safeSetState(setIsModalOpen, false);

            // Handle refresh token extraction
            if (tokenConfig.refreshToken) {
                let refreshToken: string | null = null;

                // Try to extract refresh token using the same methods
                if (tokenConfig.extractionMethods.json && responseText) {
                    try {
                        const jsonData = JSON.parse(responseText);
                        refreshToken = jsonData.refresh_token || jsonData.refreshToken;
                    } catch (e) {
                        console.log("Failed to extract refresh token from JSON:", e);
                        // Ignore JSON parsing errors for refresh token
                    }
                }

                if (!refreshToken && tokenConfig.extractionMethods.cookies) {
                    refreshToken = getCookieValue(tokenConfig.refreshTokenName);
                }

                if (refreshToken) {
                    updateGlobalVariable(tokenConfig.refreshTokenName, refreshToken);
                }
            }

            // Store response information in responseInfo state
            safeSetState(setResponseInfo, {
                cookies: allCookies,
                headers: allHeaders,
                responseText: responseText,
                setCookieHeader: setCookieHeader
            });
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return; // Request was aborted, don't update state
            }
            console.error("Token generation error:", error);
            safeSetState(setError, error instanceof Error ? error.message : "Failed to generate token");
        } finally {
            safeSetState(setIsGenerating, false);
        }
    }, [globalVariables, tokenConfig, extractTokenFromJson, extractTokenFromCookies, extractTokenFromHeaders, extractTokenFromSetCookieHeader, getCookieValue, extractTokenFromResponseText]);

    const checkTokenExpiration = useCallback((): boolean => {
        if (!globalVariables) return false;

        const tokenName = tokenConfig.tokenName;
        const token = globalVariables[tokenName] as string;

        if (!token || token.trim() === "") {
            setTokenDuration(0);
            return false;
        }

        try {
            const payload = JSON.parse(decodeString(token.split(".")[1] as string) ?? "{ }");
            const now = Math.floor(Date.now() / 1000);
            const exp = payload.exp;
            const duration = (exp - now) / 60;
            setTokenDuration(duration);
            return duration > 1;
        } catch (e) {
            console.error("Error checking token expiration:", e);
            setTokenDuration(0);
            return false;
        }
    }, [globalVariables, tokenConfig.tokenName, decodeString]);

    useEffect(() => {
        if (!globalVariables) return;

        checkTokenExpiration();
        const interval = setInterval(checkTokenExpiration, 30000);
        return () => clearInterval(interval);
    }, [checkTokenExpiration, globalVariables]);

    useEffect(() => {
        if (!globalVariables) return;

        if (tokenDuration < 1 && tokenDuration !== 0) {
            generateToken();
        }
    }, [tokenDuration, generateToken, globalVariables]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name.startsWith('extraction.')) {
            const parts = name.split('.');
            const method = parts[1] as keyof typeof tokenConfig.extractionMethods;
            const field = parts[2];
            const checkedCondition = (type === "checkbox" ? checked : value)
            setTokenConfig((prev) => {
                const updated = {
                    ...prev,
                    extractionMethods: {
                        ...prev.extractionMethods,
                        [method]: field ? checkedCondition : checked,
                    },
                };
                return updated;
            });
        } else if (name.startsWith('requestMapping.')) {
            const parts = name.split('.');
            const field = parts[1] as keyof typeof tokenConfig.requestMapping;

            setTokenConfig((prev) => {
                const updated = {
                    ...prev,
                    requestMapping: {
                        ...prev.requestMapping,
                        [field]: value,
                    },
                };
                return updated;
            });
        } else {
            setTokenConfig((prev) => {
                const updated = {
                    ...prev,
                    [name]: type === "checkbox" ? checked : value,
                };
                return updated;
            });
        }
    };

    // Auto-detect extraction method
    const autoDetectExtractionMethod = useCallback(async () => {
        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        safeSetState(setIsAutoDetecting, true);
        safeSetState(setError, "");
        safeSetState(setSuccessMessage, "");
        try {
            if (!globalVariables['username'] || !globalVariables['password']) {
                throw new Error("Please set username and password in global variables");
            }
            const domain = tokenConfig.domain;
            if (!domain) {
                throw new Error("Please set a valid domain");
            }
            const requestUrl = `${domain}${tokenConfig.path}`;
            let requestBody: string;
            let contentType: string;
            if (tokenConfig.requestMapping.contentType === "json") {
                const bodyData = {
                    [tokenConfig.requestMapping.usernameField]: globalVariables['username'],
                    [tokenConfig.requestMapping.passwordField]: globalVariables['password']
                };
                requestBody = JSON.stringify(bodyData);
                contentType = 'application/json';
            } else {
                requestBody = `${tokenConfig.requestMapping.usernameField}=${encodeURIComponent(globalVariables['username'])}` +
                    `&${tokenConfig.requestMapping.passwordField}=${encodeURIComponent(globalVariables['password'])}`;
                contentType = 'application/x-www-form-urlencoded';
            }
            const response = await fetch(requestUrl, {
                method: tokenConfig.method,
                headers: {
                    'Accept': '*/*',
                    'Content-Type': contentType,
                },
                body: requestBody,
                signal: abortControllerRef.current.signal,
            });

            if (isMountedRef.current) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            let responseText = await response.text();
            let jsonData: any = null;
            try { jsonData = JSON.parse(responseText); } catch { }
            // Try JSON
            let token = null;
            if (jsonData) {
                token = extractTokenFromJson(jsonData, tokenConfig.extractionMethods.jsonPaths);
                if (token) {
                    if (isMountedRef.current) {
                        setTokenConfig(prev => {
                            const updated = {
                                ...prev,
                                extractionMethods: {
                                    ...prev.extractionMethods,
                                    json: true,
                                    cookies: false,
                                    headers: false,
                                }
                            };
                            return updated;
                        });
                        safeSetState(setSuccessMessage, 'Auto-detected: JSON extraction');
                        updateGlobalVariable(tokenConfig.tokenName, token);
                        safeSetState(setIsAutoDetecting, false);
                    }
                    return;
                }
            }
            // Try Set-Cookie header
            token = extractTokenFromSetCookieHeader(response, tokenConfig.extractionMethods.cookieNames);
            if (token) {
                if (isMountedRef.current) {
                    setTokenConfig(prev => {
                        const updated = {
                            ...prev,
                            extractionMethods: {
                                ...prev.extractionMethods,
                                json: false,
                                cookies: true,
                                headers: false,
                            }
                        };
                        return updated;
                    });
                    safeSetState(setSuccessMessage, 'Auto-detected: Cookie extraction');
                    updateGlobalVariable(tokenConfig.tokenName, token);
                    safeSetState(setIsAutoDetecting, false);
                }
                return;
            }
            // Try browser cookies
            token = extractTokenFromCookies(tokenConfig.extractionMethods.cookieNames);
            if (token) {
                if (isMountedRef.current) {
                    setTokenConfig(prev => {
                        const updated = {
                            ...prev,
                            extractionMethods: {
                                ...prev.extractionMethods,
                                json: false,
                                cookies: true,
                                headers: false,
                            }
                        };
                        return updated;
                    });
                    safeSetState(setSuccessMessage, 'Auto-detected: Cookie extraction');
                    updateGlobalVariable(tokenConfig.tokenName, token);
                    safeSetState(setIsAutoDetecting, false);
                }
                return;
            }
            // Try headers
            token = extractTokenFromHeaders(response, tokenConfig.extractionMethods.headerNames);
            if (token) {
                if (isMountedRef.current) {
                    setTokenConfig(prev => {
                        const updated = {
                            ...prev,
                            extractionMethods: {
                                ...prev.extractionMethods,
                                json: false,
                                cookies: false,
                                headers: true,
                            }
                        };
                        return updated;
                    });
                    safeSetState(setSuccessMessage, 'Auto-detected: Header extraction');
                    updateGlobalVariable(tokenConfig.tokenName, token);
                    safeSetState(setIsAutoDetecting, false);
                }
                return;
            }
            // Try response text
            token = extractTokenFromResponseText(responseText);
            if (token) {
                if (isMountedRef.current) {
                    setTokenConfig(prev => {
                        const updated = {
                            ...prev,
                            extractionMethods: {
                                ...prev.extractionMethods,
                                json: false,
                                cookies: false,
                                headers: false,
                            }
                        };
                        return updated;
                    });
                    safeSetState(setSuccessMessage, 'Auto-detected: Regex/Text extraction');
                    updateGlobalVariable(tokenConfig.tokenName, token);
                    safeSetState(setIsAutoDetecting, false);
                }
                return;
            }
            safeSetState(setError, 'Auto-detect failed: No token found.');
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return; // Request was aborted, don't update state
            }
            safeSetState(setError, err instanceof Error ? err.message : 'Auto-detect failed.');
        } finally {
            safeSetState(setIsAutoDetecting, false);
        }
    }, [globalVariables, tokenConfig, extractTokenFromJson, extractTokenFromSetCookieHeader, extractTokenFromCookies, extractTokenFromHeaders, extractTokenFromResponseText, updateGlobalVariable, setTokenConfig]);

    return (
        <>
            {/* Enhanced Token Generator Button */}
            <div className="relative group">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`relative px-6 py-3 rounded-xl font-semibold flex items-center space-x-3 transition-all duration-300 transform hover:scale-105 shadow-lg overflow-hidden ${isDarkMode
                        ? "text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-blue-500/25"
                        : "text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-blue-500/25"
                        }`}
                >
                    <div className="absolute inset-0 transition-transform duration-700 transform -translate-x-full -skew-x-12 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full"></div>
                    <FiKey className="relative z-10 w-5 h-5" />
                    <span className="relative z-10">Token Generator</span>
                    {tokenDuration > 0 && (
                        <div className={`relative z-10 px-2 py-1 text-xs font-bold rounded-full ${tokenDuration > 5
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}>
                            {Math.round(tokenDuration)}m
                        </div>
                    )}
                </button>

                {/* Status Indicator */}
                {tokenDuration > 0 && (
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${tokenDuration > 5
                        ? "bg-green-500"
                        : "bg-yellow-500"
                        } animate-pulse`}></div>
                )}
            </div>

            {/* Enhanced Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setError('');
                    setSuccessMessage("");
                    setResponseInfo(null);
                    setActiveTab('auth');
                }}
                size="6xl"
                onSave={generateToken}
                title={
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                            <FiKey className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Token Configuration</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Configure authentication and token extraction</p>
                        </div>
                    </div>
                }
                saveButtonText={isGenerating ? "Generating..." : "Generate Token"}
                showSaveButton={true}
            >
                {/* Tab Navigation */}
                <div className="flex mb-6 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
                    {[
                        { id: 'auth', label: 'Authentication', icon: FiLock, description: 'Configure auth type and credentials' },
                        { id: 'extraction', label: 'Extraction', icon: FiDatabase, description: 'Token extraction methods' },
                        { id: 'validation', label: 'Validation', icon: FiUserCheck, description: 'Token validation & refresh' },
                        { id: 'security', label: 'Security', icon: FiShield, description: 'Encryption & security settings' },
                        { id: 'preview', label: 'Preview', icon: FiEye, description: 'Request & token preview' },
                        { id: 'debug', label: 'Debug', icon: FiCode, description: 'Response analysis' }
                    ].map(({ id, label, icon: Icon, description }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className={`flex flex-col items-center space-y-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 min-w-max ${activeTab === id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{label}</span>
                            <span className="text-xs opacity-75">{description}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {/* Authentication Tab */}
                    {activeTab === 'auth' && (
                        <div className="space-y-6">
                            {/* Authentication Type Selection */}
                            <div className="p-6 border border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-6 space-x-3">
                                    <div className="p-3 bg-indigo-100 rounded-xl dark:bg-indigo-900">
                                        <FiLock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Authentication Type</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Choose your authentication method</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {[
                                        {
                                            id: 'bearer',
                                            label: 'Bearer Token',
                                            description: 'Username/password login with token response',
                                            icon: '🔑',
                                            color: 'blue',
                                            features: ['Form/JSON login', 'Token extraction', 'Auto refresh']
                                        },
                                        {
                                            id: 'basic',
                                            label: 'Basic Auth',
                                            description: 'HTTP Basic Authentication',
                                            icon: '🛡️',
                                            color: 'green',
                                            features: ['Base64 encoded', 'Simple setup', 'Widely supported']
                                        },
                                        {
                                            id: 'oauth2',
                                            label: 'OAuth 2.0',
                                            description: 'Modern OAuth2 flows',
                                            icon: '🔐',
                                            color: 'purple',
                                            features: ['Multiple flows', 'Refresh tokens', 'Scopes']
                                        },
                                        {
                                            id: 'api_key',
                                            label: 'API Key',
                                            description: 'Simple API key authentication',
                                            icon: '🗝️',
                                            color: 'orange',
                                            features: ['Header/Query/Cookie', 'No login required', 'Fast setup']
                                        },
                                        {
                                            id: 'session',
                                            label: 'Session Auth',
                                            description: 'Session-based authentication',
                                            icon: '👥',
                                            color: 'teal',
                                            features: ['Session cookies', 'Keep-alive', 'Server-side']
                                        },
                                        {
                                            id: 'custom',
                                            label: 'Custom',
                                            description: 'Custom authentication flow',
                                            icon: '⚙️',
                                            color: 'gray',
                                            features: ['Flexible', 'Advanced', 'Custom headers']
                                        }
                                    ].map((authType) => {
                                        const isSelected = tokenConfig.authType === authType.id;
                                        const colorClasses = {
                                            blue: isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-blue-50 dark:hover:bg-blue-900/10',
                                            green: isSelected ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : 'hover:bg-green-50 dark:hover:bg-green-900/10',
                                            purple: isSelected ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-purple-50 dark:hover:bg-purple-900/10',
                                            orange: isSelected ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-orange-50 dark:hover:bg-orange-900/10',
                                            teal: isSelected ? 'ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'hover:bg-teal-50 dark:hover:bg-teal-900/10',
                                            gray: isSelected ? 'ring-2 ring-gray-500 bg-gray-50 dark:bg-gray-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-900/10'
                                        };

                                        // Detailed tooltip content for each auth type
                                        const tooltipContent = {
                                            bearer: (
                                                <div>
                                                    <div className="mb-1 font-semibold">Bearer Token Authentication</div>
                                                    <div className="space-y-1 text-xs">
                                                        <div>• Login with username/password</div>
                                                        <div>• Token auto-extracted from response</div>
                                                        <div>• Sent as: Authorization: Bearer &lt;token&gt;</div>
                                                        <div>• Supports auto-refresh & JSON/Form</div>
                                                    </div>
                                                </div>
                                            ),
                                            basic: (
                                                <div>
                                                    <div className="mb-1 font-semibold">Basic Authentication</div>
                                                    <div className="space-y-1 text-xs">
                                                        <div>• Username & password Base64 encoded</div>
                                                        <div>• Sent as: Authorization: Basic &lt;encoded&gt;</div>
                                                        <div>• Simple setup, widely supported</div>
                                                        <div>• Best for simple APIs</div>
                                                    </div>
                                                </div>
                                            ),
                                            oauth2: (
                                                <div>
                                                    <div className="mb-1 font-semibold">OAuth 2.0</div>
                                                    <div className="space-y-1 text-xs">
                                                        <div>• Industry standard authorization</div>
                                                        <div>• Multiple flows (Password, Client, etc.)</div>
                                                        <div>• Refresh tokens & scopes support</div>
                                                        <div>• Secure token exchange</div>
                                                    </div>
                                                </div>
                                            ),
                                            api_key: (
                                                <div>
                                                    <div className="mb-1 font-semibold">API Key Authentication</div>
                                                    <div className="space-y-1 text-xs">
                                                        <div>• Static API key authentication</div>
                                                        <div>• Can be sent in: Header/Query/Cookie</div>
                                                        <div>• No login required</div>
                                                        <div>• Fastest setup for simple APIs</div>
                                                    </div>
                                                </div>
                                            ),
                                            session: (
                                                <div>
                                                    <div className="mb-1 font-semibold">Session Authentication</div>
                                                    <div className="space-y-1 text-xs">
                                                        <div>• Uses session cookies</div>
                                                        <div>• Server-side session management</div>
                                                        <div>• Keep-alive functionality</div>
                                                        <div>• Common in web applications</div>
                                                    </div>
                                                </div>
                                            ),
                                            custom: (
                                                <div>
                                                    <div className="mb-1 font-semibold">Custom Authentication</div>
                                                    <div className="space-y-1 text-xs">
                                                        <div>• Flexible for proprietary methods</div>
                                                        <div>• Configure custom headers</div>
                                                        <div>• Custom request formats</div>
                                                        <div>• Advanced token extraction</div>
                                                    </div>
                                                </div>
                                            )
                                        };

                                        return (
                                            <Tooltip
                                                key={authType.id}
                                                content={tooltipContent[authType.id as keyof typeof tooltipContent]}
                                                position="top"
                                                delay={300}
                                                multiline={true}
                                                className="block"
                                            >
                                                <button
                                                    onClick={() => setTokenConfig(prev => ({ ...prev, authType: authType.id as any }))}
                                                    className={`w-full p-6 rounded-xl border transition-all duration-300 transform hover:scale-[1.02] text-left ${colorClasses[authType.color as keyof typeof colorClasses]}`}
                                                >
                                                    <div className="flex items-start space-x-4">
                                                        <div className="text-3xl">{authType.icon}</div>
                                                        <div className="flex-1">
                                                            <h4 className="mb-1 font-bold text-gray-900 dark:text-gray-100">
                                                                {authType.label}
                                                            </h4>
                                                            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                                                                {authType.description}
                                                            </p>
                                                            <div className="space-y-1">
                                                                {authType.features.map((feature, index) => (
                                                                    <div key={index} className="flex items-center space-x-2">
                                                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{feature}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <FiCheckCircle className="w-5 h-5 text-green-500" />
                                                        )}
                                                    </div>
                                                </button>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Basic Configuration */}
                            <div className="p-6 border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                                        <FiGlobe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Configuration</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Domain
                                        </label>
                                        <input
                                            type="text"
                                            name="domain"
                                            value={tokenConfig.domain}
                                            onChange={handleInputChange}
                                            placeholder="https://api.example.com"
                                            className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                                                ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                }`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Path
                                        </label>
                                        <input
                                            type="text"
                                            name="path"
                                            value={tokenConfig.path}
                                            onChange={handleInputChange}
                                            placeholder="/auth/login"
                                            className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                                                ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                }`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Token Name
                                        </label>
                                        <input
                                            type="text"
                                            name="tokenName"
                                            value={tokenConfig.tokenName}
                                            onChange={handleInputChange}
                                            placeholder="access_token"
                                            className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                                                ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                }`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Header Key
                                        </label>
                                        <input
                                            type="text"
                                            name="headerKey"
                                            value={tokenConfig.headerKey}
                                            onChange={handleInputChange}
                                            placeholder="Authorization"
                                            className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                                                ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* OAuth2 Configuration */}
                            {tokenConfig.authType === 'oauth2' && (
                                <div className="p-6 border border-purple-200 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                    <div className="flex items-center mb-4 space-x-3">
                                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                                            <FiLock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">OAuth2 Configuration</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Grant Type
                                            </label>
                                            <select
                                                name="oauth2.grantType"
                                                value={tokenConfig.oauth2?.grantType}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    oauth2: { ...prev.oauth2!, grantType: e.target.value as any }
                                                }))}
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            >
                                                <option value="password">Password Grant</option>
                                                <option value="client_credentials">Client Credentials</option>
                                                <option value="authorization_code">Authorization Code</option>
                                                <option value="implicit">Implicit</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Client ID
                                            </label>
                                            <input
                                                type="text"
                                                name="oauth2.clientId"
                                                value={tokenConfig.oauth2?.clientId}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    oauth2: { ...prev.oauth2!, clientId: e.target.value }
                                                }))}
                                                placeholder="your_client_id"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Client Secret
                                            </label>
                                            <input
                                                type="password"
                                                name="oauth2.clientSecret"
                                                value={tokenConfig.oauth2?.clientSecret}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    oauth2: { ...prev.oauth2!, clientSecret: e.target.value }
                                                }))}
                                                placeholder="your_client_secret"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Scope
                                            </label>
                                            <input
                                                type="text"
                                                name="oauth2.scope"
                                                value={tokenConfig.oauth2?.scope}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    oauth2: { ...prev.oauth2!, scope: e.target.value }
                                                }))}
                                                placeholder="read write"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Token URL
                                            </label>
                                            <input
                                                type="text"
                                                name="oauth2.tokenUrl"
                                                value={tokenConfig.oauth2?.tokenUrl}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    oauth2: { ...prev.oauth2!, tokenUrl: e.target.value }
                                                }))}
                                                placeholder="https://api.example.com/oauth/token"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Refresh URL (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                name="oauth2.refreshUrl"
                                                value={tokenConfig.oauth2?.refreshUrl}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    oauth2: { ...prev.oauth2!, refreshUrl: e.target.value }
                                                }))}
                                                placeholder="https://api.example.com/oauth/refresh"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* API Key Configuration */}
                            {tokenConfig.authType === 'api_key' && (
                                <div className="p-6 border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                    <div className="flex items-center mb-4 space-x-3">
                                        <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
                                            <FiKey className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">API Key Configuration</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Key Name
                                            </label>
                                            <input
                                                type="text"
                                                name="apiKey.keyName"
                                                value={tokenConfig.apiKey?.keyName}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    apiKey: { ...prev.apiKey!, keyName: e.target.value }
                                                }))}
                                                placeholder="X-API-Key"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Key Value
                                            </label>
                                            <input
                                                type="password"
                                                name="apiKey.keyValue"
                                                value={tokenConfig.apiKey?.keyValue}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    apiKey: { ...prev.apiKey!, keyValue: e.target.value }
                                                }))}
                                                placeholder="your_api_key_here"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Location
                                            </label>
                                            <select
                                                name="apiKey.location"
                                                value={tokenConfig.apiKey?.location}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    apiKey: { ...prev.apiKey!, location: e.target.value as any }
                                                }))}
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            >
                                                <option value="header">Header</option>
                                                <option value="query">Query Parameter</option>
                                                <option value="cookie">Cookie</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Prefix (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                name="apiKey.prefix"
                                                value={tokenConfig.apiKey?.prefix}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    apiKey: { ...prev.apiKey!, prefix: e.target.value }
                                                }))}
                                                placeholder="Bearer "
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Session Configuration */}
                            {tokenConfig.authType === 'session' && (
                                <div className="p-6 border border-teal-200 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                    <div className="flex items-center mb-4 space-x-3">
                                        <div className="p-2 bg-teal-100 rounded-lg dark:bg-teal-900">
                                            <FiUsers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Session Configuration</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Session ID Field
                                            </label>
                                            <input
                                                type="text"
                                                name="session.sessionIdField"
                                                value={tokenConfig.session?.sessionIdField}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    session: { ...prev.session!, sessionIdField: e.target.value }
                                                }))}
                                                placeholder="session_id"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Session Token Field
                                            </label>
                                            <input
                                                type="text"
                                                name="session.sessionTokenField"
                                                value={tokenConfig.session?.sessionTokenField}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    session: { ...prev.session!, sessionTokenField: e.target.value }
                                                }))}
                                                placeholder="session_token"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                name="session.keepAlive"
                                                checked={tokenConfig.session?.keepAlive}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    session: { ...prev.session!, keepAlive: e.target.checked }
                                                }))}
                                                className={`h-4 w-4 text-teal-600 focus:ring-teal-500 border rounded ${isDarkMode
                                                    ? "bg-gray-800 border-gray-600"
                                                    : "bg-white border-gray-300"
                                                    }`}
                                            />
                                            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Enable Keep-Alive
                                            </label>
                                        </div>

                                        {tokenConfig.session?.keepAlive && (
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    Keep-Alive Interval (seconds)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="session.keepAliveInterval"
                                                    value={tokenConfig.session?.keepAliveInterval}
                                                    onChange={(e) => setTokenConfig(prev => ({
                                                        ...prev,
                                                        session: { ...prev.session!, keepAliveInterval: parseInt(e.target.value) }
                                                    }))}
                                                    min="30"
                                                    max="3600"
                                                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${isDarkMode
                                                        ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                        : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Extraction Tab */}
                    {activeTab === 'extraction' && (
                        <div className="space-y-6">
                            {/* Request Body Configuration */}
                            <div className="p-6 border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
                                        <FiUpload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request Body Configuration</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Content Type
                                        </label>

                                        {/* Modern Dataset Tab Interface */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                {
                                                    id: 'form',
                                                    label: 'Form Data',
                                                    description: 'application/x-www-form-urlencoded',
                                                    icon: '📝',
                                                    color: 'orange'
                                                },
                                                {
                                                    id: 'json',
                                                    label: 'JSON',
                                                    description: 'application/json',
                                                    icon: '🔧',
                                                    color: 'blue'
                                                }
                                            ].map((option) => {
                                                const isSelected = tokenConfig.requestMapping.contentType === option.id;
                                                const colorClasses = {
                                                    orange: {
                                                        selected: isDarkMode
                                                            ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/25"
                                                            : "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/25",
                                                        unselected: isDarkMode
                                                            ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-orange-500"
                                                            : "bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-300"
                                                    },
                                                    blue: {
                                                        selected: isDarkMode
                                                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25"
                                                            : "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25",
                                                        unselected: isDarkMode
                                                            ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-blue-500"
                                                            : "bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                                                    }
                                                };

                                                return (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            setTokenConfig(prev => ({
                                                                ...prev,
                                                                requestMapping: {
                                                                    ...prev.requestMapping,
                                                                    contentType: option.id as 'form' | 'json'
                                                                }
                                                            }));
                                                        }}
                                                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] group overflow-hidden ${isSelected
                                                            ? colorClasses[option.color as keyof typeof colorClasses].selected
                                                            : colorClasses[option.color as keyof typeof colorClasses].unselected
                                                            }`}
                                                    >
                                                        {/* Background Pattern */}
                                                        <div className={`absolute inset-0 opacity-5 transition-opacity duration-300 ${isSelected ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'
                                                            }`}>
                                                            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full translate-x-8 -translate-y-8 ${option.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                                                                }`}></div>
                                                            <div className={`absolute bottom-0 left-0 w-12 h-12 rounded-full -translate-x-6 translate-y-6 ${option.color === 'orange' ? 'bg-orange-400' : 'bg-blue-400'
                                                                }`}></div>
                                                        </div>

                                                        <div className="relative z-10 flex flex-col items-center space-y-2 text-center">
                                                            <div className={`text-2xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'
                                                                }`}>
                                                                {option.icon}
                                                            </div>
                                                            <div>
                                                                <h4 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'
                                                                    }`}>
                                                                    {option.label}
                                                                </h4>
                                                                <p className={`text-xs mt-1 ${isSelected
                                                                    ? 'text-orange-100 dark:text-orange-200'
                                                                    : 'text-gray-500 dark:text-gray-400'
                                                                    }`}>
                                                                    {option.description}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Selection Indicator */}
                                                        {isSelected && (
                                                            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${option.color === 'orange' ? 'bg-orange-200' : 'bg-blue-200'
                                                                } flex items-center justify-center`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${option.color === 'orange' ? 'bg-orange-600' : 'bg-blue-600'
                                                                    }`}></div>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Content Type Preview */}
                                        <div className="p-3 mt-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                            <h5 className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Request Body Preview:
                                            </h5>
                                            <pre className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                                {tokenConfig.requestMapping.contentType === "json"
                                                    ? JSON.stringify({
                                                        [tokenConfig.requestMapping.usernameField]: "your_username",
                                                        [tokenConfig.requestMapping.passwordField]: "your_password"
                                                    }, null, 2)
                                                    : `${tokenConfig.requestMapping.usernameField}=your_username&${tokenConfig.requestMapping.passwordField}=your_password`
                                                }
                                            </pre>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Username Field Name
                                            </label>
                                            <input
                                                type="text"
                                                name="requestMapping.usernameField"
                                                value={tokenConfig.requestMapping.usernameField}
                                                onChange={handleInputChange}
                                                placeholder="username"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                            <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                Maps to global variable 'username'
                                            </p>
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Password Field Name
                                            </label>
                                            <input
                                                type="text"
                                                name="requestMapping.passwordField"
                                                value={tokenConfig.requestMapping.passwordField}
                                                onChange={handleInputChange}
                                                placeholder="password"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                            <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                Maps to global variable 'password'
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Token Extraction Methods */}
                            <div className="p-6 border border-indigo-200 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900">
                                        <FiDatabase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Token Extraction Methods (Priority Order)</h3>
                                </div>

                                <div className="space-y-4">
                                    {/* JSON Extraction */}
                                    <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                        <div className="flex items-center">
                                            <div className="flex items-center h-6">
                                                <input
                                                    type="checkbox"
                                                    name="extraction.json"
                                                    checked={tokenConfig.extractionMethods.json}
                                                    onChange={handleInputChange}
                                                    className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border rounded ${isDarkMode
                                                        ? "bg-gray-800 border-gray-600"
                                                        : "bg-white border-gray-300"
                                                        }`}
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    1. Extract from JSON Response
                                                </label>
                                                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    Parse JSON response and extract token from specified paths
                                                </p>
                                            </div>
                                        </div>
                                        {tokenConfig.extractionMethods.json && (
                                            <div className="mt-3 ml-7">
                                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    JSON Paths (comma-separated)
                                                </label>
                                                <input
                                                    type="text"
                                                    name="extraction.jsonPaths"
                                                    value={tokenConfig.extractionMethods.jsonPaths.join(', ')}
                                                    onChange={(e) => {
                                                        const paths = e.target.value.split(',').map(p => p.trim()).filter(p => p);
                                                        setTokenConfig(prev => ({
                                                            ...prev,
                                                            extractionMethods: {
                                                                ...prev.extractionMethods,
                                                                jsonPaths: paths
                                                            }
                                                        }));
                                                    }}
                                                    placeholder="token, access_token, jwt"
                                                    className={`w-full px-3 py-2 rounded-md border text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isDarkMode
                                                        ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                        : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Cookie Extraction */}
                                    <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                        <div className="flex items-center">
                                            <div className="flex items-center h-6">
                                                <input
                                                    type="checkbox"
                                                    name="extraction.cookies"
                                                    checked={tokenConfig.extractionMethods.cookies}
                                                    onChange={handleInputChange}
                                                    className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border rounded ${isDarkMode
                                                        ? "bg-gray-800 border-gray-600"
                                                        : "bg-white border-gray-300"
                                                        }`}
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    2. Extract from Response Cookies
                                                </label>
                                                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    Extract token from Set-Cookie headers or browser cookies
                                                </p>
                                            </div>
                                        </div>
                                        {tokenConfig.extractionMethods.cookies && (
                                            <div className="mt-3 ml-7">
                                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    Cookie Names (comma-separated)
                                                </label>
                                                <input
                                                    type="text"
                                                    name="extraction.cookieNames"
                                                    value={tokenConfig.extractionMethods.cookieNames.join(', ')}
                                                    onChange={(e) => {
                                                        const names = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                                                        setTokenConfig(prev => ({
                                                            ...prev,
                                                            extractionMethods: {
                                                                ...prev.extractionMethods,
                                                                cookieNames: names
                                                            }
                                                        }));
                                                    }}
                                                    placeholder="token, access_token, auth_token"
                                                    className={`w-full px-3 py-2 rounded-md border text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isDarkMode
                                                        ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                        : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Header Extraction */}
                                    <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                        <div className="flex items-center">
                                            <div className="flex items-center h-6">
                                                <input
                                                    type="checkbox"
                                                    name="extraction.headers"
                                                    checked={tokenConfig.extractionMethods.headers}
                                                    onChange={handleInputChange}
                                                    className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border rounded ${isDarkMode
                                                        ? "bg-gray-800 border-gray-600"
                                                        : "bg-white border-gray-300"
                                                        }`}
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    3. Extract from Response Headers
                                                </label>
                                                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    Extract token from response headers like Authorization
                                                </p>
                                            </div>
                                        </div>
                                        {tokenConfig.extractionMethods.headers && (
                                            <div className="mt-3 ml-7">
                                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    Header Names (comma-separated)
                                                </label>
                                                <input
                                                    type="text"
                                                    name="extraction.headerNames"
                                                    value={tokenConfig.extractionMethods.headerNames.join(', ')}
                                                    onChange={(e) => {
                                                        const names = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                                                        setTokenConfig(prev => ({
                                                            ...prev,
                                                            extractionMethods: {
                                                                ...prev.extractionMethods,
                                                                headerNames: names
                                                            }
                                                        }));
                                                    }}
                                                    placeholder="authorization, x-access-token, token"
                                                    className={`w-full px-3 py-2 rounded-md border text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isDarkMode
                                                        ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                        : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={autoDetectExtractionMethod}
                                    disabled={isAutoDetecting}
                                    className={`px-4 py-2 rounded-lg font-semibold shadow transition-colors duration-200 ${isAutoDetecting ? 'bg-gray-400 text-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    {isAutoDetecting ? 'Detecting...' : 'Auto Detect Extraction Method'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preview Tab */}
                    {activeTab === 'preview' && (
                        <div className="space-y-6">
                            {/* Request Preview */}
                            <div className="p-6 border bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border-emerald-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                                        <FiEye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request Preview</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Request URL
                                        </h4>
                                        <div className={`p-3 rounded-lg border font-mono text-sm ${isDarkMode ? "text-gray-300 bg-gray-700 border-gray-600" : "text-gray-700 bg-gray-50 border-gray-300"}`}>
                                            {tokenConfig.domain}{tokenConfig.path}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Request Body
                                        </h4>
                                        <div className={`p-3 rounded-lg border font-mono text-sm ${isDarkMode ? "text-gray-300 bg-gray-700 border-gray-600" : "text-gray-700 bg-gray-50 border-gray-300"}`}>
                                            {tokenConfig.requestMapping.contentType === "json"
                                                ? JSON.stringify({
                                                    [tokenConfig.requestMapping.usernameField]: "your_username",
                                                    [tokenConfig.requestMapping.passwordField]: "your_password"
                                                }, null, 2)
                                                : `${tokenConfig.requestMapping.usernameField}=your_username&${tokenConfig.requestMapping.passwordField}=your_password`
                                            }
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Content Type
                                        </h4>
                                        <div className={`px-3 py-2 rounded-lg border font-mono text-sm ${isDarkMode ? "text-gray-300 bg-gray-700 border-gray-600" : "text-gray-700 bg-gray-50 border-gray-300"}`}>
                                            {tokenConfig.requestMapping.contentType === "json" ? "application/json" : "application/x-www-form-urlencoded"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Token Status */}
                            <div className="p-6 border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                                        <FiClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Token Status</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Current Token
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            {globalVariables[tokenConfig.tokenName] ? (
                                                <>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isDarkMode ? "text-green-200 bg-green-900" : "text-green-800 bg-green-100"}`}>
                                                        Active
                                                    </span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(globalVariables[tokenConfig.tokenName] ?? "No token found")}
                                                        className={`p-1 rounded transition-colors ${isDarkMode ? "text-gray-400 hover:text-blue-400" : "text-gray-500 hover:text-blue-600"}`}
                                                        title="Copy token"
                                                    >
                                                        <FiCopy className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isDarkMode ? "text-gray-300 bg-gray-700" : "text-gray-600 bg-gray-100"}`}>
                                                    Not Set
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {tokenDuration > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Expires In
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tokenDuration > 5
                                                ? (isDarkMode ? "text-green-200 bg-green-900" : "text-green-800 bg-green-100")
                                                : (isDarkMode ? "text-yellow-200 bg-yellow-900" : "text-yellow-800 bg-yellow-100")
                                                }`}>
                                                {Math.round(tokenDuration)} minutes
                                            </span>
                                        </div>
                                    )}

                                    {globalVariables[tokenConfig.tokenName] && (
                                        <div>
                                            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Token Preview
                                            </h4>
                                            <div className={`p-3 rounded-lg border font-mono text-xs break-all ${isDarkMode ? "text-gray-300 bg-gray-700 border-gray-600" : "text-gray-700 bg-gray-50 border-gray-300"}`}>
                                                {globalVariables[tokenConfig.tokenName]}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Debug Tab */}
                    {activeTab === 'debug' && (
                        <div className="space-y-6">
                            {/* Response Information */}
                            {responseInfo && (
                                <div className="p-6 border border-gray-200 bg-gradient-to-br from-gray-50 rounded-xl via-slate-50 to-zinc-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                    <div className="flex items-center mb-4 space-x-3">
                                        <div className="p-2 bg-gray-100 rounded-lg dark:bg-gray-900">
                                            <FiCode className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Response Information</h3>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Set-Cookie Header */}
                                        {responseInfo.setCookieHeader && (
                                            <div>
                                                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    Set-Cookie Header
                                                </h4>
                                                <div className={`p-3 rounded-lg border font-mono text-xs overflow-x-auto ${isDarkMode ? "text-gray-300 bg-gray-700 border-gray-600" : "text-gray-700 bg-gray-50 border-gray-300"}`}>
                                                    {responseInfo.setCookieHeader}
                                                </div>
                                            </div>
                                        )}

                                        {/* Response Headers */}
                                        {responseInfo.headers.length > 0 && (
                                            <div>
                                                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    Response Headers
                                                </h4>
                                                <div className={`p-3 rounded-lg border font-mono text-xs max-h-32 overflow-y-auto ${isDarkMode ? "text-gray-300 bg-gray-700 border-gray-600" : "text-gray-700 bg-gray-50 border-gray-300"}`}>
                                                    {responseInfo.headers.map((header, index) => (
                                                        <div key={index} className="mb-1">
                                                            <span className="font-medium">{header.name}:</span> {header.value}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Browser Cookies */}
                                        <div>
                                            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Browser Cookies
                                            </h4>
                                            {responseInfo.cookies.length > 0 ? (
                                                <div className={`p-3 rounded-lg border font-mono text-xs max-h-32 overflow-y-auto ${isDarkMode ? "text-gray-300 bg-gray-700 border-gray-600" : "text-gray-700 bg-gray-50 border-gray-300"}`}>
                                                    {responseInfo.cookies.map((cookie, index) => (
                                                        <div key={index} className="mb-1">
                                                            <span className="font-medium">{cookie.name}:</span> {cookie.value}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className={`p-3 rounded-lg border font-mono text-xs ${isDarkMode ? "text-yellow-200 bg-yellow-900 border-yellow-800" : "text-yellow-800 bg-yellow-50 border-yellow-300"}`}>
                                                    No cookies found in browser
                                                </div>
                                            )}
                                        </div>

                                        {/* Response Text */}
                                        {responseInfo.responseText && (
                                            <div>
                                                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    Response Text
                                                </h4>
                                                <div className={`p-3 rounded-lg border font-mono text-xs max-h-32 overflow-y-auto ${isDarkMode ? "text-gray-300 bg-gray-700 border-gray-600" : "text-gray-700 bg-gray-50 border-gray-300"}`}>
                                                    {responseInfo.responseText}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Settings Management */}
                            <div className="p-6 border bg-gradient-to-br via-gray-50 rounded-xl from-slate-50 to-zinc-50 border-slate-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            Settings are automatically saved
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTokenConfig({
                                                domain: "http://{base_url}",
                                                method: "POST",
                                                path: "/auth/login",
                                                tokenName: "x-access-token",
                                                headerKey: "x-access-token",
                                                headerValueFormat: "{token}",
                                                refreshToken: false,
                                                refreshTokenName: "refresh_token",

                                                // Enhanced authentication types
                                                authType: "bearer",

                                                // OAuth2 specific configuration
                                                oauth2: {
                                                    grantType: "password",
                                                    clientId: "",
                                                    clientSecret: "",
                                                    redirectUri: "",
                                                    scope: "",
                                                    authorizationUrl: "",
                                                    tokenUrl: "",
                                                    refreshUrl: "",
                                                },

                                                // API Key configuration
                                                apiKey: {
                                                    keyName: "X-API-Key",
                                                    keyValue: "",
                                                    location: "header",
                                                    prefix: "",
                                                },

                                                // Session-based authentication
                                                session: {
                                                    sessionIdField: "session_id",
                                                    sessionTokenField: "session_token",
                                                    keepAlive: false,
                                                    keepAliveInterval: 300,
                                                },

                                                extractionMethods: {
                                                    json: true,
                                                    jsonPaths: [],
                                                    cookies: true,
                                                    cookieNames: [],
                                                    headers: true,
                                                    headerNames: [],
                                                    regex: false,
                                                    regexPatterns: [],
                                                    xpath: false,
                                                    xpathExpressions: [],
                                                    css: false,
                                                    cssSelectors: [],
                                                    nestedJson: false,
                                                    nestedPaths: [],
                                                },
                                                requestMapping: {
                                                    usernameField: "username",
                                                    passwordField: "password",
                                                    contentType: "form",
                                                    additionalFields: [],
                                                    customHeaders: [],
                                                },
                                                validation: {
                                                    validateOnExtract: false,
                                                    validationEndpoint: "",
                                                    validationMethod: "GET",
                                                    validationHeaders: [],
                                                    autoRefresh: false,
                                                    refreshThreshold: 5,
                                                    maxRefreshAttempts: 3,
                                                },
                                                security: {
                                                    encryptToken: false,
                                                    encryptionKey: "",
                                                    hashToken: false,
                                                    hashAlgorithm: "sha256",
                                                    maskTokenInLogs: true,
                                                },
                                                errorHandling: {
                                                    retryOnFailure: true,
                                                    maxRetries: 3,
                                                    retryDelay: 1000,
                                                    customErrorMessages: {},
                                                },
                                            });
                                        }}
                                        className={`px-3 py-1 text-sm font-medium rounded-lg border transition-colors ${isDarkMode
                                            ? "text-gray-400 border-gray-600 hover:bg-gray-700 hover:text-gray-300"
                                            : "text-gray-500 border-gray-300 hover:bg-gray-100 hover:text-gray-700"
                                            }`}
                                    >
                                        Reset to Defaults
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Validation Tab */}
                    {activeTab === 'validation' && (
                        <div className="space-y-6">
                            {/* Token Validation */}
                            <div className="p-6 border bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border-emerald-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                                        <FiUserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Token Validation</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            name="validation.validateOnExtract"
                                            checked={tokenConfig.validation?.validateOnExtract}
                                            onChange={(e) => setTokenConfig(prev => ({
                                                ...prev,
                                                validation: { ...prev.validation!, validateOnExtract: e.target.checked }
                                            }))}
                                            className={`h-4 w-4 text-emerald-600 focus:ring-emerald-500 border rounded ${isDarkMode
                                                ? "bg-gray-800 border-gray-600"
                                                : "bg-white border-gray-300"
                                                }`}
                                        />
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Validate token immediately after extraction
                                        </label>
                                    </div>

                                    {tokenConfig.validation?.validateOnExtract && (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    Validation Endpoint
                                                </label>
                                                <input
                                                    type="text"
                                                    name="validation.validationEndpoint"
                                                    value={tokenConfig.validation?.validationEndpoint}
                                                    onChange={(e) => setTokenConfig(prev => ({
                                                        ...prev,
                                                        validation: { ...prev.validation!, validationEndpoint: e.target.value }
                                                    }))}
                                                    placeholder="https://api.example.com/validate"
                                                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${isDarkMode
                                                        ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                        : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                        }`}
                                                />
                                            </div>

                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    Validation Method
                                                </label>
                                                <select
                                                    name="validation.validationMethod"
                                                    value={tokenConfig.validation?.validationMethod}
                                                    onChange={(e) => setTokenConfig(prev => ({
                                                        ...prev,
                                                        validation: { ...prev.validation!, validationMethod: e.target.value as any }
                                                    }))}
                                                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${isDarkMode
                                                        ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                        : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                        }`}
                                                >
                                                    <option value="GET">GET</option>
                                                    <option value="POST">POST</option>
                                                    <option value="HEAD">HEAD</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Auto Refresh Configuration */}
                            <div className="p-6 border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                                        <FiRefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Auto Refresh Configuration</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            name="validation.autoRefresh"
                                            checked={tokenConfig.validation?.autoRefresh}
                                            onChange={(e) => setTokenConfig(prev => ({
                                                ...prev,
                                                validation: { ...prev.validation!, autoRefresh: e.target.checked }
                                            }))}
                                            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border rounded ${isDarkMode
                                                ? "bg-gray-800 border-gray-600"
                                                : "bg-white border-gray-300"
                                                }`}
                                        />
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Enable automatic token refresh
                                        </label>
                                    </div>

                                    {tokenConfig.validation?.autoRefresh && (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    Refresh Threshold (minutes)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="validation.refreshThreshold"
                                                    value={tokenConfig.validation?.refreshThreshold}
                                                    onChange={(e) => setTokenConfig(prev => ({
                                                        ...prev,
                                                        validation: { ...prev.validation!, refreshThreshold: parseInt(e.target.value) }
                                                    }))}
                                                    min="1"
                                                    max="60"
                                                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                                                        ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                        : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                        }`}
                                                />
                                                <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    Refresh token when it expires in X minutes
                                                </p>
                                            </div>

                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    Max Refresh Attempts
                                                </label>
                                                <input
                                                    type="number"
                                                    name="validation.maxRefreshAttempts"
                                                    value={tokenConfig.validation?.maxRefreshAttempts}
                                                    onChange={(e) => setTokenConfig(prev => ({
                                                        ...prev,
                                                        validation: { ...prev.validation!, maxRefreshAttempts: parseInt(e.target.value) }
                                                    }))}
                                                    min="1"
                                                    max="10"
                                                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                                                        ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                        : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                        }`}
                                                />
                                                <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    Maximum number of refresh attempts
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            {/* Token Encryption */}
                            <div className="p-6 border border-purple-200 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                                        <FiLock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Token Encryption</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            name="security.encryptToken"
                                            checked={tokenConfig.security?.encryptToken}
                                            onChange={(e) => setTokenConfig(prev => ({
                                                ...prev,
                                                security: { ...prev.security!, encryptToken: e.target.checked }
                                            }))}
                                            className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border rounded ${isDarkMode
                                                ? "bg-gray-800 border-gray-600"
                                                : "bg-white border-gray-300"
                                                }`}
                                        />
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Encrypt stored tokens
                                        </label>
                                    </div>

                                    {tokenConfig.security?.encryptToken && (
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Encryption Key
                                            </label>
                                            <input
                                                type="password"
                                                name="security.encryptionKey"
                                                value={tokenConfig.security?.encryptionKey}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    security: { ...prev.security!, encryptionKey: e.target.value }
                                                }))}
                                                placeholder="Enter encryption key"
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            />
                                            <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                Use a strong encryption key (32+ characters recommended)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Token Hashing */}
                            <div className="p-6 border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
                                        <FiHash className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Token Hashing</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            name="security.hashToken"
                                            checked={tokenConfig.security?.hashToken}
                                            onChange={(e) => setTokenConfig(prev => ({
                                                ...prev,
                                                security: { ...prev.security!, hashToken: e.target.checked }
                                            }))}
                                            className={`h-4 w-4 text-orange-600 focus:ring-orange-500 border rounded ${isDarkMode
                                                ? "bg-gray-800 border-gray-600"
                                                : "bg-white border-gray-300"
                                                }`}
                                        />
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Hash tokens for storage
                                        </label>
                                    </div>

                                    {tokenConfig.security?.hashToken && (
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Hash Algorithm
                                            </label>
                                            <select
                                                name="security.hashAlgorithm"
                                                value={tokenConfig.security?.hashAlgorithm}
                                                onChange={(e) => setTokenConfig(prev => ({
                                                    ...prev,
                                                    security: { ...prev.security!, hashAlgorithm: e.target.value as any }
                                                }))}
                                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDarkMode
                                                    ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                    : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                    }`}
                                            >
                                                <option value="sha256">SHA-256</option>
                                                <option value="sha512">SHA-512</option>
                                                <option value="md5">MD5</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Logging Security */}
                            <div className="p-6 border border-red-200 bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
                                        <FiShield className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Logging Security</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            name="security.maskTokenInLogs"
                                            checked={tokenConfig.security?.maskTokenInLogs}
                                            onChange={(e) => setTokenConfig(prev => ({
                                                ...prev,
                                                security: { ...prev.security!, maskTokenInLogs: e.target.checked }
                                            }))}
                                            className={`h-4 w-4 text-red-600 focus:ring-red-500 border rounded ${isDarkMode
                                                ? "bg-gray-800 border-gray-600"
                                                : "bg-white border-gray-300"
                                                }`}
                                        />
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Mask tokens in logs and console output
                                        </label>
                                    </div>
                                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        When enabled, tokens will be displayed as "***" in logs to prevent exposure
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="p-4 mt-6 border border-red-200 bg-red-50 rounded-xl dark:bg-red-900/20 dark:border-red-800">
                        <div className="flex items-center space-x-2">
                            <FiAlertCircle className="w-5 h-5 text-red-500" />
                            <p className={`text-sm font-medium ${isDarkMode ? "text-red-300" : "text-red-700"}`}>
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="p-4 mt-6 border border-green-200 bg-green-50 rounded-xl dark:bg-green-900/20 dark:border-green-800">
                        <div className="flex items-center space-x-2">
                            <FiCheckCircle className="w-5 h-5 text-green-500" />
                            <p className={`text-sm font-medium ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
                                {successMessage}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default TokenGenerator; 