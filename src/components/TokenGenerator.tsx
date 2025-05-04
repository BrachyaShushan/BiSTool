import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import Modal from "./Modal";

interface TokenConfig {
    domain: string;
    method: "POST" | "GET";
    path: string;
    tokenName: string;
    headerKey: string;
    headerValueFormat: string;
    refreshToken: boolean;
    refreshTokenName: string;
}

const TokenGenerator: React.FC = () => {
    const { globalVariables, updateGlobalVariable } = useAppContext();
    const { isDarkMode } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
        domain: "http://{base_url}",
        method: "POST",
        path: "/auth/login",
        tokenName: "x-access-token",
        headerKey: "x-access-token",
        headerValueFormat: "{token}",
        refreshToken: false,
        refreshTokenName: "refresh_token",
    });
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [tokenDuration, setTokenDuration] = useState<number>(0);
    const [successMessage, setSuccessMessage] = useState<string>("");

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

    const generateToken = useCallback(async (): Promise<void> => {
        setIsGenerating(true);
        setError(null);
        setSuccessMessage("");

        try {
            if (!globalVariables.username || !globalVariables.password) {
                throw new Error("Please set username and password in global variables");
            }

            const domain = replaceVariables(tokenConfig.domain);
            if (!domain) {
                throw new Error("Please set a valid domain");
            }

            const requestUrl = `${domain}${tokenConfig.path}`;
            const requestBody = `username=${encodeURIComponent(
                globalVariables.username
            )}&password=${globalVariables.password}`;

            const response = await fetch(requestUrl, {
                method: tokenConfig.method,
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: requestBody,
                credentials: "same-origin",
            });

            const responseText = await response.text();

            let jsonData: any;
            try {
                jsonData = JSON.parse(responseText);
            } catch (e) {
                console.error("Failed to parse response as JSON:", e);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }

            const token =
                jsonData.token ||
                jsonData.access_token ||
                jsonData.accessToken ||
                jsonData.jwt;
            if (!token) {
                throw new Error(
                    `Token not found in response. Response format: ${JSON.stringify(
                        jsonData
                    )}`
                );
            }

            updateGlobalVariable(tokenConfig.tokenName, token);
            updateGlobalVariable("tokenName", tokenConfig.tokenName);
            setSuccessMessage("Token generated successfully!");
            setIsModalOpen(false);

            const refreshToken = jsonData.refresh_token || jsonData.refreshToken;
            if (tokenConfig.refreshToken && refreshToken) {
                updateGlobalVariable(tokenConfig.refreshTokenName, refreshToken);
            }
        } catch (error) {
            console.error("Token generation error:", error);
            setError(error instanceof Error ? error.message : "Failed to generate token");
        } finally {
            setIsGenerating(false);
        }
    }, [globalVariables, tokenConfig, replaceVariables, updateGlobalVariable]);

    const checkTokenExpiration = useCallback((): boolean => {
        if (!globalVariables) return false;

        const tokenName = tokenConfig.tokenName;
        const token = globalVariables[tokenName];

        if (!token || token.trim() === "") {
            setTokenDuration(0);
            return false;
        }

        try {
            const payload = JSON.parse(decodeString(token.split(".")[1]) || "{}");
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
        setTokenConfig((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`px-4 py-2 rounded-md ${isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                    } border border-gray-300 shadow-sm`}
            >
                Generate Token
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setError(null);
                    setSuccessMessage("");
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
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
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
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
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
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
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
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
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
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
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
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                                }`}
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="refreshToken"
                            checked={tokenConfig.refreshToken}
                            onChange={handleInputChange}
                            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border rounded ${isDarkMode
                                ? "border-gray-600 bg-gray-800"
                                : "border-gray-300 bg-white"
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
                                    ? "bg-gray-700 border-gray-600 text-white"
                                    : "bg-white border-gray-300 text-gray-900"
                                    }`}
                            />
                        </div>
                    )}

                    {error && (
                        <div
                            className={`p-3 rounded ${isDarkMode
                                ? "bg-red-900 text-red-100"
                                : "bg-red-100 text-red-700"
                                }`}
                        >
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div
                            className={`p-3 rounded ${isDarkMode
                                ? "bg-green-900 text-green-100"
                                : "bg-green-100 text-green-700"
                                }`}
                        >
                            {successMessage}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default TokenGenerator; 