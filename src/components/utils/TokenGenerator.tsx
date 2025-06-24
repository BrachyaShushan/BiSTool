import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import Modal from "../core/Modal";
import { FiKey } from "react-icons/fi";

const TokenGenerator: React.FC = () => {
    const { globalVariables, updateGlobalVariable, tokenConfig, setTokenConfig } = useAppContext();
    const { isDarkMode } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [tokenDuration, setTokenDuration] = useState<number>(0);
    const [successMessage, setSuccessMessage] = useState<string>("");
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
            return tokenCookie.value || null;
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
                return { name: name?.trim() || '', value: value?.trim() || '' };
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

            setTokenConfig((prev) => ({
                ...prev,
                extractionMethods: {
                    ...prev.extractionMethods,
                    [method]: field ? (type === "checkbox" ? checked : value) : checked,
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
            <button
                onClick={() => setIsModalOpen(true)}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 ${isDarkMode
                    ? "text-white bg-gray-700 hover:bg-gray-600"
                    : "text-gray-700 bg-white hover:bg-gray-50"
                    } border border-gray-300 shadow-sm`}
            >
                <FiKey />
                <span>Generate Token</span>
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setError(null);
                    setSuccessMessage("");
                    setResponseInfo(null);
                }}
                size="6xl"
                onSave={generateToken}
                title="Token Configuration"
                saveButtonText={isGenerating ? "Generating..." : "Generate Token"}
            >
                <div className="space-y-4">
                    <div>
                        <label
                            className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                                }`}
                        >
                            Domain
                        </label>
                        <input
                            type="text"
                            name="domain"
                            value={tokenConfig.domain}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                ? "text-white bg-gray-700 border-gray-600"
                                : "text-gray-900 bg-white border-gray-300"
                                }`}
                        />
                    </div>

                    <div>
                        <label
                            className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                                }`}
                        >
                            Method
                        </label>
                        <select
                            name="method"
                            value={tokenConfig.method}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                ? "text-white bg-gray-700 border-gray-600"
                                : "text-gray-900 bg-white border-gray-300"
                                }`}
                        >
                            <option value="POST">POST</option>
                            <option value="GET">GET</option>
                        </select>
                    </div>

                    <div>
                        <label
                            className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                                }`}
                        >
                            Path
                        </label>
                        <input
                            type="text"
                            name="path"
                            value={tokenConfig.path}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                ? "text-white bg-gray-700 border-gray-600"
                                : "text-gray-900 bg-white border-gray-300"
                                }`}
                        />
                    </div>

                    <div>
                        <label
                            className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                                }`}
                        >
                            Token Name
                        </label>
                        <input
                            type="text"
                            name="tokenName"
                            value={tokenConfig.tokenName}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                ? "text-white bg-gray-700 border-gray-600"
                                : "text-gray-900 bg-white border-gray-300"
                                }`}
                        />
                    </div>

                    <div>
                        <label
                            className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                                }`}
                        >
                            Header Key
                        </label>
                        <input
                            type="text"
                            name="headerKey"
                            value={tokenConfig.headerKey}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                ? "text-white bg-gray-700 border-gray-600"
                                : "text-gray-900 bg-white border-gray-300"
                                }`}
                        />
                    </div>

                    <div>
                        <label
                            className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                                }`}
                        >
                            Header Value Format
                        </label>
                        <input
                            type="text"
                            name="headerValueFormat"
                            value={tokenConfig.headerValueFormat}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                ? "text-white bg-gray-700 border-gray-600"
                                : "text-gray-900 bg-white border-gray-300"
                                }`}
                        />
                    </div>

                    {/* Request Mapping Configuration */}
                    <div className="pt-4 border-t">
                        <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            Request Body Configuration
                        </h4>

                        <div>
                            <label
                                className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                                    }`}
                            >
                                Content Type
                            </label>
                            <select
                                name="requestMapping.contentType"
                                value={tokenConfig.requestMapping.contentType}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                    ? "text-white bg-gray-700 border-gray-600"
                                    : "text-gray-900 bg-white border-gray-300"
                                    }`}
                            >
                                <option value="form">Form Data (application/x-www-form-urlencoded)</option>
                                <option value="json">JSON (application/json)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                                <label
                                    className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                                        }`}
                                >
                                    Username Field Name
                                </label>
                                <input
                                    type="text"
                                    name="requestMapping.usernameField"
                                    value={tokenConfig.requestMapping.usernameField}
                                    onChange={handleInputChange}
                                    placeholder="username"
                                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                        ? "text-white bg-gray-700 border-gray-600"
                                        : "text-gray-900 bg-white border-gray-300"
                                        }`}
                                />
                                <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    Maps to global variable 'username'
                                </p>
                            </div>

                            <div>
                                <label
                                    className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                                        }`}
                                >
                                    Password Field Name
                                </label>
                                <input
                                    type="text"
                                    name="requestMapping.passwordField"
                                    value={tokenConfig.requestMapping.passwordField}
                                    onChange={handleInputChange}
                                    placeholder="password"
                                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                        ? "text-white bg-gray-700 border-gray-600"
                                        : "text-gray-900 bg-white border-gray-300"
                                        }`}
                                />
                                <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    Maps to global variable 'password'
                                </p>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-3 mt-3 bg-gray-50 rounded border">
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

                    {/* Token Extraction Methods */}
                    <div className="pt-4 border-t">
                        <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            Token Extraction Methods (in priority order)
                        </h4>

                        {/* JSON Extraction */}
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="extraction.json"
                                    checked={tokenConfig.extractionMethods.json}
                                    onChange={handleInputChange}
                                    className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border rounded ${isDarkMode
                                        ? "bg-gray-800 border-gray-600"
                                        : "bg-white border-gray-300"
                                        }`}
                                />
                                <label className={`ml-2 block text-sm ${isDarkMode ? "text-white" : "text-gray-700"}`}>
                                    1. Extract from JSON Response
                                </label>
                            </div>
                            {tokenConfig.extractionMethods.json && (
                                <div className="ml-6">
                                    <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        JSON Paths (comma-separated, leave empty for defaults)
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
                                        className={`mt-1 block w-full border rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs ${isDarkMode
                                            ? "text-white bg-gray-700 border-gray-600"
                                            : "text-gray-900 bg-white border-gray-300"
                                            }`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Cookie Extraction */}
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="extraction.cookies"
                                    checked={tokenConfig.extractionMethods.cookies}
                                    onChange={handleInputChange}
                                    className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border rounded ${isDarkMode
                                        ? "bg-gray-800 border-gray-600"
                                        : "bg-white border-gray-300"
                                        }`}
                                />
                                <label className={`ml-2 block text-sm ${isDarkMode ? "text-white" : "text-gray-700"}`}>
                                    2. Extract from Response Cookies
                                </label>
                            </div>
                            {tokenConfig.extractionMethods.cookies && (
                                <div className="ml-6">
                                    <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        Cookie Names (comma-separated, leave empty for defaults)
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
                                        className={`mt-1 block w-full border rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs ${isDarkMode
                                            ? "text-white bg-gray-700 border-gray-600"
                                            : "text-gray-900 bg-white border-gray-300"
                                            }`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Header Extraction */}
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="extraction.headers"
                                    checked={tokenConfig.extractionMethods.headers}
                                    onChange={handleInputChange}
                                    className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border rounded ${isDarkMode
                                        ? "bg-gray-800 border-gray-600"
                                        : "bg-white border-gray-300"
                                        }`}
                                />
                                <label className={`ml-2 block text-sm ${isDarkMode ? "text-white" : "text-gray-700"}`}>
                                    3. Extract from Response Headers
                                </label>
                            </div>
                            {tokenConfig.extractionMethods.headers && (
                                <div className="ml-6">
                                    <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        Header Names (comma-separated, leave empty for defaults)
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
                                        className={`mt-1 block w-full border rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs ${isDarkMode
                                            ? "text-white bg-gray-700 border-gray-600"
                                            : "text-gray-900 bg-white border-gray-300"
                                            }`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="refreshToken"
                            checked={tokenConfig.refreshToken}
                            onChange={handleInputChange}
                            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border rounded ${isDarkMode
                                ? "bg-gray-800 border-gray-600"
                                : "bg-white border-gray-300"
                                }`}
                        />
                        <label
                            className={`ml-2 block text-sm ${isDarkMode ? "text-white" : "text-gray-700"
                                }`}
                        >
                            Enable Refresh Token
                        </label>
                    </div>

                    {tokenConfig.refreshToken && (
                        <div>
                            <label
                                className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                                    }`}
                            >
                                Refresh Token Name
                            </label>
                            <input
                                type="text"
                                name="refreshTokenName"
                                value={tokenConfig.refreshTokenName}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                    ? "text-white bg-gray-700 border-gray-600"
                                    : "text-gray-900 bg-white border-gray-300"
                                    }`}
                            />
                        </div>
                    )}

                    {error && (
                        <div
                            className={`p-3 rounded ${isDarkMode
                                ? "text-red-100 bg-red-900"
                                : "text-red-700 bg-red-100"
                                }`}
                        >
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div
                            className={`p-3 rounded ${isDarkMode
                                ? "text-green-100 bg-green-900"
                                : "text-green-700 bg-green-100"
                                }`}
                        >
                            {successMessage}
                        </div>
                    )}

                    {/* Response Information Display */}
                    {responseInfo && (
                        <div className={`p-4 rounded border ${isDarkMode
                            ? "text-white bg-gray-800 border-gray-600"
                            : "text-gray-700 bg-gray-50 border-gray-300"
                            }`}
                        >
                            <h4 className={`font-medium mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                Response Information
                            </h4>

                            {/* Set-Cookie Header */}
                            {responseInfo.setCookieHeader && (
                                <div className="mb-3">
                                    <h5 className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Set-Cookie Header:
                                    </h5>
                                    <pre className={`text-xs p-2 rounded bg-gray-100 overflow-x-auto ${isDarkMode ? "text-gray-800" : "text-gray-600"}`}>
                                        {responseInfo.setCookieHeader}
                                    </pre>
                                </div>
                            )}

                            {/* Response Headers */}
                            {responseInfo.headers.length > 0 && (
                                <div className="mb-3">
                                    <h5 className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Response Headers:
                                    </h5>
                                    <div className={`text-xs p-2 rounded bg-gray-100 max-h-32 overflow-y-auto ${isDarkMode ? "text-gray-800" : "text-gray-600"}`}>
                                        {responseInfo.headers.map((header, index) => (
                                            <div key={index} className="mb-1">
                                                <span className="font-medium">{header.name}:</span> {header.value}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Browser Cookies */}
                            <div className="mb-3">
                                <h5 className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    Browser Cookies (document.cookie):
                                </h5>
                                {responseInfo.cookies.length > 0 ? (
                                    <div className={`text-xs p-2 rounded bg-gray-100 max-h-32 overflow-y-auto ${isDarkMode ? "text-gray-800" : "text-gray-600"}`}>
                                        {responseInfo.cookies.map((cookie, index) => (
                                            <div key={index} className="mb-1">
                                                <span className="font-medium">{cookie.name}:</span> {cookie.value}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`text-xs p-2 rounded bg-yellow-100 ${isDarkMode ? "text-yellow-800" : "text-yellow-700"}`}>
                                        No cookies found in browser
                                    </div>
                                )}
                            </div>

                            {/* Response Text */}
                            {responseInfo.responseText && (
                                <div>
                                    <h5 className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Response Text:
                                    </h5>
                                    <pre className={`text-xs p-2 rounded bg-gray-100 max-h-32 overflow-y-auto ${isDarkMode ? "text-gray-800" : "text-gray-600"}`}>
                                        {responseInfo.responseText}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Settings Management */}
                    <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    Settings are automatically saved
                                </span>
                                <span className="text-xs text-green-500">✓</span>
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
                                className={`text-xs px-2 py-1 rounded border ${isDarkMode
                                    ? "text-gray-400 border-gray-600 hover:bg-gray-700"
                                    : "text-gray-500 border-gray-300 hover:bg-gray-100"
                                    }`}
                            >
                                Reset to Defaults
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default TokenGenerator; 