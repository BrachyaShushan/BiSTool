import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const TokenGenerator = () => {
    const { sharedVariables, updateSharedVariable } = useAppContext();
    const { isDarkMode } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tokenConfig, setTokenConfig] = useState({
        domain: 'http://${base_url}', // Default local development server
        method: 'POST',
        path: '/auth/login',
        tokenName: 'x-access-token',
        headerKey: 'x-access-token',
        headerValueFormat: '${token}',
        refreshToken: false,
        refreshTokenName: 'refresh_token'
    });
    const [error, setError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [tokenDuration, setTokenDuration] = useState(0);
    const [successMessage, setSuccessMessage] = useState('');

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setTokenConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const decodeString = (encodedString) => {
        try {
            return atob(encodedString.replace(/-/g, '+').replace(/_/g, '/'));
        } catch (e) {
            console.error('Error decoding string:', e);
            return null;
        }
    };

    const replaceVariables = (str) => {
        if (!str) return str;
        return str.replace(/\${([^}]+)}/g, (match, variableName) => {
            return sharedVariables[variableName] || match;
        });
    };

    const checkTokenExpiration = () => {
        const token = sharedVariables[tokenConfig.tokenName];
        if (token && token.trim() !== "") {
            try {
                const payload = JSON.parse(decodeString(token.split(".")[1]));
                const now = Math.floor(Date.now() / 1000);
                const exp = payload.exp;
                const duration = (exp - now) / 60;
                setTokenDuration(duration);
                return duration > 1;
            } catch (e) {
                console.error('Error checking token expiration:', e);
                setTokenDuration(0);
                return false;
            }
        } else {
            setTokenDuration(0);
            return false;
        }
    };

    const generateToken = async () => {
        setIsGenerating(true);
        setError(null);
        setSuccessMessage('');

        try {
            // Validate required fields
            if (!sharedVariables.username || !sharedVariables.password) {
                throw new Error('Please set username and password in shared variables');
            }

            const domain = replaceVariables(tokenConfig.domain);
            if (!domain) {
                throw new Error('Please set a valid domain');
            }

            const requestUrl = `${domain}${tokenConfig.path}`;
            // Only encode the username, not the password
            const requestBody = `username=${encodeURIComponent(sharedVariables.username)}&password=${sharedVariables.password}`;

            console.log('Token Generation Request:', {
                url: requestUrl,
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: requestBody
            });

            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: requestBody,
                credentials: 'same-origin'
            });


            const responseText = await response.text();

            let jsonData;
            try {
                jsonData = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }

            // Check for token in different possible locations
            const token = jsonData.token || jsonData.access_token || jsonData.accessToken || jsonData.jwt;
            if (!token) {
                throw new Error(`Token not found in response. Response format: ${JSON.stringify(jsonData)}`);
            }

            updateSharedVariable(tokenConfig.tokenName, token);
            updateSharedVariable("tokenName", tokenConfig.tokenName);
            setSuccessMessage('Token generated successfully!');

            // If refresh token is enabled and available
            const refreshToken = jsonData.refresh_token || jsonData.refreshToken;
            if (tokenConfig.refreshToken && refreshToken) {
                updateSharedVariable(tokenConfig.refreshTokenName, refreshToken);
            }

        } catch (error) {
            console.error('Token generation error:', error);
            setError(error.message || 'Failed to generate token');
        } finally {
            setIsGenerating(false);
        }
    };

    // Check token expiration on mount and periodically
    useEffect(() => {
        checkTokenExpiration();
        const interval = setInterval(checkTokenExpiration, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [checkTokenExpiration]);

    // Generate token if expired
    useEffect(() => {
        if (tokenDuration < 1 && tokenDuration !== 0) {
            generateToken();
        }
    }, [tokenDuration, generateToken]);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`px-4 py-2 rounded-md ${isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                    } border border-gray-300 shadow-sm`}
            >
                Generate Token
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`w-full max-w-md rounded-lg shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Token Configuration
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                    }`}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'
                                    }`}>Domain</label>
                                <input
                                    type="text"
                                    name="domain"
                                    value={tokenConfig.domain}
                                    onChange={handleInputChange}
                                    placeholder="https://api.example.com or https://${apiHost}"
                                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                />
                                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                    Use ${'{variableName}'} to insert shared variable values (e.g., ${'{apiHost}'})
                                </p>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'
                                    }`}>Path</label>
                                <input
                                    type="text"
                                    name="path"
                                    value={tokenConfig.path}
                                    onChange={handleInputChange}
                                    placeholder="/auth/login"
                                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'
                                    }`}>Token Name</label>
                                <input
                                    type="text"
                                    name="tokenName"
                                    value={tokenConfig.tokenName}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'
                                    }`}>Header Key</label>
                                <input
                                    type="text"
                                    name="headerKey"
                                    value={tokenConfig.headerKey}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="refreshToken"
                                    checked={tokenConfig.refreshToken}
                                    onChange={handleInputChange}
                                    className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${isDarkMode ? 'border-gray-600' : 'border-gray-300'
                                        }`}
                                />
                                <label className={`ml-2 block text-sm ${isDarkMode ? 'text-white' : 'text-gray-700'
                                    }`}>
                                    Include Refresh Token
                                </label>
                            </div>

                            {tokenConfig.refreshToken && (
                                <div>
                                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'
                                        }`}>Refresh Token Name</label>
                                    <input
                                        type="text"
                                        name="refreshTokenName"
                                        value={tokenConfig.refreshTokenName}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                    />
                                </div>
                            )}

                            {error && (
                                <div className={`p-3 rounded ${isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className={`p-3 rounded ${isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-700'
                                    }`}>
                                    {successMessage}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${isDarkMode
                                    ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={generateToken}
                                disabled={isGenerating}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Token'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TokenGenerator; 