import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import Modal from "../core/Modal";
import { FiKey, FiSettings, FiClock, FiCheckCircle, FiAlertCircle, FiEye, FiCopy, FiUpload, FiZap, FiShield, FiGlobe, FiDatabase, FiCode } from "react-icons/fi";

const TokenGenerator: React.FC = () => {
    const { globalVariables, updateGlobalVariable, tokenConfig, setTokenConfig } = useAppContext();
    const { isDarkMode } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [tokenDuration, setTokenDuration] = useState<number>(0);
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'config' | 'extraction' | 'preview' | 'debug'>('config');
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [responseInfo, setResponseInfo] = useState<{
        cookies: Array<{ name: string; value: string }>;
        headers: Array<{ name: string; value: string }>;
        responseText: string;
        setCookieHeader: string | null;
    } | null>(null);

    const decodeString = useCallback((encodedString: string): string | null => {
        try {
            return atob(encodedString.replace(/-/g, "+").replace(/_/g, "/"));
        } catch (e) {
            console.error("Error decoding string:", e);
            return null;
        }
    }, []);

    const replaceVariables = useCallback(
        (str: string): string => {
            if (!str) return str;
            return str.replace(/\{([^}]+)\}/g, (match, variableName) => {
                return globalVariables?.[variableName] || match;
            });
        },
        [globalVariables]
    );

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

        console.log("Available cookies:", document.cookie);
        console.log("Searching for cookie names:", searchNames);

        for (const cookieName of searchNames) {
            const value = getCookieValue(cookieName);
            if (value) {
                console.log(`Found token in cookie: ${cookieName}`);
                return value;
            }
        }

        // Try to find any cookie that might contain the token
        const allCookies = document.cookie.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return { name: name?.trim(), value: value?.trim() };
        }).filter(cookie => cookie.name);

        console.log("All available cookies:", allCookies);

        const tokenCookie = allCookies.find(cookie =>
            cookie.name?.toLowerCase().includes('token') ||
            cookie.name?.toLowerCase().includes('auth') ||
            cookie.name?.toLowerCase().includes('jwt')
        );

        if (tokenCookie) {
            console.log(`Found token cookie: ${tokenCookie.name}`);
            return tokenCookie.value ?? null;
        }

        return null;
    }, [getCookieValue]);

    const extractTokenFromSetCookieHeader = useCallback((response: Response, cookieNames: string[]): string | null => {
        // Try to extract from Set-Cookie header directly
        const setCookieHeader = response.headers.get('set-cookie');
        if (!setCookieHeader) {
            console.log("No Set-Cookie header found - this might be due to CORS restrictions");

            // Try to get all headers to see what's available
            const allHeaders: string[] = [];
            response.headers.forEach((value, key) => {
                allHeaders.push(`${key}: ${value}`);
            });
            console.log("Available response headers:", allHeaders);

            return null;
        }

        console.log("Set-Cookie header:", setCookieHeader);

        // Parse the Set-Cookie header
        const cookies = setCookieHeader.split(',').map(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue?.trim().split('=') ?? [];
            return { name: name?.trim(), value: value?.trim() };
        });

        console.log("Parsed cookies from Set-Cookie:", cookies);

        // Default cookie names to try if none specified
        const defaultNames = ['token', 'access_token', 'auth_token', 'jwt'];
        const searchNames = cookieNames.length > 0 ? cookieNames : defaultNames;

        for (const cookieName of searchNames) {
            const cookie = cookies.find(c => c.name === cookieName);
            if (cookie?.value) {
                console.log(`Found token in Set-Cookie: ${cookieName}`);
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
            console.log(`Found token cookie in Set-Cookie: ${tokenCookie.name}`);
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
        console.log("Response text:", responseText);

        // Try to find JWT pattern in the response text
        const jwtPattern = /jwt[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i;
        const match = responseText.match(jwtPattern);
        if (match) {
            console.log("Found JWT in response text:", match[1]);
            return match[1] ?? null;
        }

        // Try to find any token pattern
        const tokenPattern = /(?:token|access_token|auth_token)[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i;
        const tokenMatch = responseText.match(tokenPattern);
        if (tokenMatch) {
            console.log("Found token in response text:", tokenMatch[1]);
            return tokenMatch[1] ?? null;
        }

        return null;
    }, []);

    const generateToken = useCallback(async (): Promise<void> => {
        setIsGenerating(true);
        setError(null);
        setSuccessMessage("");

        try {
            if (!globalVariables['username'] || !globalVariables['password']) {
                throw new Error("Please set username and password in global variables");
            }

            const domain = replaceVariables(tokenConfig.domain);
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
            });

            // Capture response information for debugging
            const allHeaders: Array<{ name: string; value: string }> = [];
            response.headers.forEach((value, key) => {
                allHeaders.push({ name: key, value });
            });
            console.log("response", response);
            console.log("response.headers", response.headers);
            console.log("set-cookie", response.headers.get('set-cookie'));
            const setCookieHeader = response.headers.get('set-cookie');

            // Wait a moment for cookies to be set by the browser
            await new Promise(resolve => setTimeout(resolve, 100));

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
                    console.log("Waiting for cookies to be set by browser...");
                    await new Promise(resolve => setTimeout(resolve, 500));

                    console.log("Checking for cookies after wait...");
                    token = extractTokenFromCookies(tokenConfig.extractionMethods.cookieNames);
                    if (token) {
                        extractionSource = 'response cookies';
                    } else {
                        console.log("Still no cookies found. This might be due to domain/path restrictions.");
                        console.log("Current domain:", window.location.hostname);
                        console.log("Current path:", window.location.pathname);
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
            setSuccessMessage(`Token extracted from ${extractionSource} successfully!`);
            setIsModalOpen(false);

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
            setResponseInfo({
                cookies: allCookies,
                headers: allHeaders,
                responseText: responseText,
                setCookieHeader: setCookieHeader
            });
        } catch (error) {
            console.error("Token generation error:", error);
            setError(error instanceof Error ? error.message : "Failed to generate token");
        } finally {
            setIsGenerating(false);
        }
    }, [globalVariables, tokenConfig, replaceVariables, updateGlobalVariable, extractTokenFromJson, extractTokenFromCookies, extractTokenFromHeaders, extractTokenFromSetCookieHeader, getCookieValue, extractTokenFromResponseText]);

    const checkTokenExpiration = useCallback((): boolean => {
        if (!globalVariables) return false;

        const tokenName = tokenConfig.tokenName;
        const token = globalVariables[tokenName] as string;

        if (!token || token.trim() === "") {
            setTokenDuration(0);
            return false;
        }

        try {
            const payload = JSON.parse(decodeString(token.split(".")[1] as string) ?? "{}");
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
            setTokenConfig((prev) => ({
                ...prev,
                extractionMethods: {
                    ...prev.extractionMethods,
                    [method]: field ? checkedCondition : checked,
                },
            }));
        } else if (name.startsWith('requestMapping.')) {
            const parts = name.split('.');
            const field = parts[1] as keyof typeof tokenConfig.requestMapping;

            setTokenConfig((prev) => ({
                ...prev,
                requestMapping: {
                    ...prev.requestMapping,
                    [field]: value,
                },
            }));
        } else {
            setTokenConfig((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        }
    };

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
                    <div className="absolute inset-0 bg-gradient-to-r transition-transform duration-700 transform -translate-x-full -skew-x-12 from-white/0 via-white/20 to-white/0 group-hover:translate-x-full"></div>
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
                    setError(null);
                    setSuccessMessage("");
                    setResponseInfo(null);
                    setActiveTab('config');
                }}
                size="6xl"
                onSave={generateToken}
                title={
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
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
                <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
                    {[
                        { id: 'config', label: 'Configuration', icon: FiSettings },
                        { id: 'extraction', label: 'Extraction', icon: FiDatabase },
                        { id: 'preview', label: 'Preview', icon: FiEye },
                        { id: 'debug', label: 'Debug', icon: FiCode }
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {/* Configuration Tab */}
                    {activeTab === 'config' && (
                        <div className="space-y-6">
                            {/* Basic Configuration */}
                            <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
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
                                        <label className={`block text-sm font-medium mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Method
                                        </label>

                                        {/* Modern Dataset Tab Interface for Method */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                {
                                                    id: 'POST',
                                                    label: 'POST',
                                                    description: 'Send data in request body',
                                                    icon: '📤',
                                                    color: 'blue'
                                                },
                                                {
                                                    id: 'GET',
                                                    label: 'GET',
                                                    description: 'Send data as query parameters',
                                                    icon: '📥',
                                                    color: 'green'
                                                }
                                            ].map((option) => {
                                                const isSelected = tokenConfig.method === option.id;
                                                const colorClasses = {
                                                    blue: {
                                                        selected: isDarkMode
                                                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25"
                                                            : "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25",
                                                        unselected: isDarkMode
                                                            ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-blue-500"
                                                            : "bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                                                    },
                                                    green: {
                                                        selected: isDarkMode
                                                            ? "bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/25"
                                                            : "bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/25",
                                                        unselected: isDarkMode
                                                            ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-green-500"
                                                            : "bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-300"
                                                    }
                                                };

                                                return (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            setTokenConfig(prev => ({
                                                                ...prev,
                                                                method: option.id as 'POST' | 'GET'
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
                                                            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full translate-x-8 -translate-y-8 ${option.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                                                                }`}></div>
                                                            <div className={`absolute bottom-0 left-0 w-12 h-12 rounded-full -translate-x-6 translate-y-6 ${option.color === 'blue' ? 'bg-blue-400' : 'bg-green-400'
                                                                }`}></div>
                                                        </div>

                                                        <div className="flex relative z-10 flex-col items-center space-y-2 text-center">
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
                                                                    ? 'text-blue-100 dark:text-blue-200'
                                                                    : 'text-gray-500 dark:text-gray-400'
                                                                    }`}>
                                                                    {option.description}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Selection Indicator */}
                                                        {isSelected && (
                                                            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${option.color === 'blue' ? 'bg-blue-200' : 'bg-green-200'
                                                                } flex items-center justify-center`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${option.color === 'blue' ? 'bg-blue-600' : 'bg-green-600'
                                                                    }`}></div>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
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
                                </div>
                            </div>

                            {/* Header Configuration */}
                            <div className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                                        <FiShield className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Header Configuration</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                            className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${isDarkMode
                                                ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                }`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            Header Value Format
                                        </label>
                                        <input
                                            type="text"
                                            name="headerValueFormat"
                                            value={tokenConfig.headerValueFormat}
                                            onChange={handleInputChange}
                                            placeholder="Bearer {token}"
                                            className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${isDarkMode
                                                ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Options */}
                            <div className="p-6 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 rounded-xl border border-purple-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                                            <FiZap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Advanced Options</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${isDarkMode
                                            ? "text-purple-400 hover:text-purple-300 hover:bg-purple-900"
                                            : "text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                                            }`}
                                    >
                                        {showAdvanced ? 'Hide' : 'Show'} Advanced
                                    </button>
                                </div>

                                {showAdvanced && (
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="refreshToken"
                                                checked={tokenConfig.refreshToken}
                                                onChange={handleInputChange}
                                                className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border rounded ${isDarkMode
                                                    ? "bg-gray-800 border-gray-600"
                                                    : "bg-white border-gray-300"
                                                    }`}
                                            />
                                            <label className={`ml-3 block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                Enable Refresh Token
                                            </label>
                                        </div>

                                        {tokenConfig.refreshToken && (
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                    Refresh Token Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="refreshTokenName"
                                                    value={tokenConfig.refreshTokenName}
                                                    onChange={handleInputChange}
                                                    placeholder="refresh_token"
                                                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDarkMode
                                                        ? "text-white bg-gray-700 border-gray-600 focus:bg-gray-600"
                                                        : "text-gray-900 bg-white border-gray-300 focus:bg-white"
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Extraction Tab */}
                    {activeTab === 'extraction' && (
                        <div className="space-y-6">
                            {/* Request Body Configuration */}
                            <div className="p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl border border-orange-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
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

                                                        <div className="flex relative z-10 flex-col items-center space-y-2 text-center">
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
                                        <div className="p-3 mt-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
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
                            <div className="p-6 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-xl border border-indigo-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900">
                                        <FiDatabase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Token Extraction Methods (Priority Order)</h3>
                                </div>

                                <div className="space-y-4">
                                    {/* JSON Extraction */}
                                    <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
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
                                    <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
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
                                    <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
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
                        </div>
                    )}

                    {/* Preview Tab */}
                    {activeTab === 'preview' && (
                        <div className="space-y-6">
                            {/* Request Preview */}
                            <div className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border border-emerald-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-900">
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
                                            {replaceVariables(tokenConfig.domain)}{tokenConfig.path}
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
                            <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex items-center mb-4 space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                                        <FiClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Token Status</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
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
                                        <div className="flex justify-between items-center">
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
                                <div className="p-6 bg-gradient-to-br from-gray-50 rounded-xl border border-gray-200 via-slate-50 to-zinc-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
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
                            <div className="p-6 bg-gradient-to-br via-gray-50 rounded-xl border from-slate-50 to-zinc-50 border-slate-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                                <div className="flex justify-between items-center">
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
                                                extractionMethods: {
                                                    json: true,
                                                    jsonPaths: [],
                                                    cookies: true,
                                                    cookieNames: [],
                                                    headers: true,
                                                    headerNames: [],
                                                },
                                                requestMapping: {
                                                    usernameField: "username",
                                                    passwordField: "password",
                                                    contentType: "form",
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
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="p-4 mt-6 bg-red-50 rounded-xl border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                        <div className="flex items-center space-x-2">
                            <FiAlertCircle className="w-5 h-5 text-red-500" />
                            <p className={`text-sm font-medium ${isDarkMode ? "text-red-300" : "text-red-700"}`}>
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="p-4 mt-6 bg-green-50 rounded-xl border border-green-200 dark:bg-green-900/20 dark:border-green-800">
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