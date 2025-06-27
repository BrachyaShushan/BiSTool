import React, { useState } from "react";
import { Editor } from "@monaco-editor/react";
import {
    FiTrash2,
    FiPlay,
    FiCopy,
    FiCheck,
    FiX,
    FiTarget,
    FiCode,
    FiGlobe,
    FiDatabase,
    FiFileText,
    FiShield,
    FiRefreshCw,
    FiEye,
    FiEyeOff,
    FiClock,
    FiZap
} from "react-icons/fi";
import { TestCase } from "../../types/features/SavedManager";

interface TestCardProps {
    test: TestCase;
    urlData: any;
    requestConfig: any;
    globalVariables: any;
    activeSession: any;
    isDarkMode: boolean;
    handleUpdateTest: (id: string, update: Partial<TestCase>) => void;
    handleDuplicateTest: (id: string) => void;
    handleRemoveTest: (id: string) => void;
    generateAuthHeaders: () => Record<string, string>;
}

const statusCodeColor = {
    "200": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "201": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "204": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "400": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "401": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "403": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "404": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "500": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

// Utility: Deep subset check for objects/arrays
const isDeepSubset = (expected: any, actual: any): boolean => {
    if (typeof expected !== typeof actual) return false;
    if (typeof expected !== 'object' || expected === null || actual === null) {
        return expected === actual;
    }
    if (Array.isArray(expected)) {
        if (!Array.isArray(actual)) return false;
        return expected.every(expItem => actual.some(actItem => isDeepSubset(expItem, actItem)));
    }
    return Object.keys(expected).every(key =>
        key in actual && isDeepSubset(expected[key], actual[key])
    );
};

const isPartialMatch = (expected: string, actual: string) => {
    try {
        const expectedJson = JSON.parse(expected);
        const actualJson = JSON.parse(actual);
        return isDeepSubset(expectedJson, actualJson);
    } catch {
        return false;
    }
};

const evaluateUrl = (url: string, test: TestCase, activeSession: any, globalVariables: any) => {
    return url.replace(/\{([^}]+)\}/g, (match, varName) => {
        if (test.pathOverrides?.[varName] && test.pathOverrides[varName].trim() !== '') {
            return test.pathOverrides[varName];
        }
        if (activeSession?.sharedVariables?.[varName]) {
            return activeSession.sharedVariables[varName];
        }
        if (globalVariables?.[varName]) {
            return globalVariables[varName];
        }
        return match; // leave as is if not found
    });
};

const TestCard: React.FC<TestCardProps> = ({
    test,
    urlData,
    requestConfig,
    globalVariables,
    activeSession,
    isDarkMode,
    handleUpdateTest,
    handleDuplicateTest,
    handleRemoveTest,
    generateAuthHeaders,
}) => {
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Run Test handler (per card)
    const handleRunTest = async () => {
        setLoading(true);
        // Function to check if HTTP method supports a body
        const methodSupportsBody = (httpMethod: string): boolean => {
            const methodsWithBody = ["POST", "PUT", "PATCH"];
            return methodsWithBody.includes(httpMethod.toUpperCase());
        };

        // Build request using overrides
        let url = urlData.builtUrl ?? '';

        // Path overrides: only override if non-empty string
        if (urlData.parsedSegments) {
            urlData.parsedSegments.forEach((seg: any) => {
                const overrideVal = test.pathOverrides?.[seg.paramName];
                if (seg.isDynamic && overrideVal && overrideVal.trim() !== '') {
                    url = url.replace(`{${seg.paramName}}`, String(overrideVal));
                }
            });
        }

        // Replace any remaining {variable} in the URL with test overrides, session/shared, or global variables
        url = evaluateUrl(url, test, activeSession, globalVariables);

        // Query param overrides: only override if non-empty string
        let queryString = '';
        if (requestConfig?.queryParams) {
            const params = requestConfig.queryParams.map((param: any) => {
                const overrideVal = test.queryOverrides?.[param.key];
                const value = (overrideVal && overrideVal.trim() !== '') ? overrideVal : param.value;
                return `${param.key}=${encodeURIComponent(value)}`;
            });
            queryString = params.length ? `?${params.join('&')}` : '';
        }
        url = url + queryString;

        // Body override: only use if method supports body and non-empty string
        let body: string | undefined = undefined;
        let headers: Record<string, string> = (requestConfig?.headers ?? []).reduce((acc: Record<string, string>, h: any) => {
            acc[h.key] = h.value;
            return acc;
        }, {});

        // Generate authentication headers based on the chosen auth method
        const authHeaders = generateAuthHeaders();
        Object.assign(headers, authHeaders);

        // Only add body if method supports it
        if (methodSupportsBody(requestConfig?.method ?? 'GET')) {
            if (requestConfig?.bodyType === 'json') {
                if (test.bodyOverride && test.bodyOverride.trim() !== '') {
                    body = test.bodyOverride;
                } else if (requestConfig.jsonBody) {
                    body = requestConfig.jsonBody;
                }
                headers['Content-Type'] = 'application/json';
            } else if (requestConfig?.bodyType === 'form' && requestConfig.formData) {
                if (test.bodyOverride && test.bodyOverride.trim() !== '') {
                    body = test.bodyOverride;
                } else {
                    body = requestConfig.formData.map((field: any) => `${field.key}=${field.value}`).join("&");
                }
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            } else if (requestConfig?.bodyType === 'text') {
                if (test.bodyOverride && test.bodyOverride.trim() !== '') {
                    body = test.bodyOverride;
                } else if (requestConfig.textBody) {
                    body = requestConfig.textBody;
                }
                headers['Content-Type'] = 'text/plain';
            }
        }

        let result: 'pass' | 'fail';
        try {
            const fetchOptions: RequestInit = {
                method: requestConfig?.method ?? 'GET',
                headers,
                ...(body !== undefined ? { body } : {}),
            };
            const response = await fetch(url, fetchOptions);
            test.serverResponse = await response.text();
            const statusMatch = response.status.toString() === test.expectedStatus;
            let responseMatch = true;
            if (test.expectedResponse) {
                if (test.expectedPartialResponse) {
                    responseMatch = isPartialMatch(test.expectedResponse, test.serverResponse);
                } else {
                    try {
                        const respJson = await response.json();
                        responseMatch = JSON.stringify(respJson) === test.expectedResponse;
                    } catch {
                        // If response is not JSON, compare as text
                        responseMatch = test.serverResponse === test.expectedResponse;
                    }
                }
            }
            result = statusMatch && responseMatch ? 'pass' : 'fail';
            test.serverStatusCode = response.status;
        } catch (error) {
            console.error('Test execution error:', error);
            result = 'fail';
            test.serverStatusCode = 0;
            test.serverResponse = error instanceof Error ? error.message : 'Unknown error';
        }
        handleUpdateTest(test.id, { lastResult: result });
        setLoading(false);
    };

    return (
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="flex justify-between items-center">
                        <div className="w-1/3 h-8 bg-gray-300 rounded dark:bg-gray-600"></div>
                        <div className="flex space-x-2">
                            <div className="w-20 h-8 bg-gray-300 rounded dark:bg-gray-600"></div>
                            <div className="w-20 h-8 bg-gray-300 rounded dark:bg-gray-600"></div>
                        </div>
                    </div>
                    <div className="w-1/2 h-6 bg-gray-300 rounded dark:bg-gray-600"></div>
                    <div className="w-1/2 h-6 bg-gray-300 rounded dark:bg-gray-600"></div>
                    <div className="w-full h-24 bg-gray-300 rounded dark:bg-gray-600"></div>
                </div>
            ) : (
                <>
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                                <FiTarget className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={test.name}
                                    onChange={e => handleUpdateTest(test.id, { name: e.target.value })}
                                    placeholder="Enter test name..."
                                    className="px-3 py-2 w-full text-lg font-semibold text-gray-900 bg-transparent rounded-lg border-none dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Test Status Indicator */}
                            <div className="flex items-center space-x-2">
                                {test.lastResult === 'pass' && (
                                    <div className="flex items-center px-3 py-1 space-x-1 text-green-800 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-200">
                                        <FiCheck className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Passed</span>
                                    </div>
                                )}
                                {test.lastResult === 'fail' && (
                                    <div className="flex items-center px-3 py-1 space-x-1 text-red-800 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
                                        <FiX className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Failed</span>
                                    </div>
                                )}
                                {!test.lastResult && (
                                    <div className="flex items-center px-3 py-1 space-x-1 text-gray-600 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-300">
                                        <FiClock className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Not Run</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="p-2 text-gray-600 rounded-lg transition-all duration-200 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={showDetails ? "Hide details" : "Show details"}
                            >
                                {showDetails ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => handleDuplicateTest(test.id)}
                                className="p-2 text-blue-600 bg-blue-100 rounded-lg transition-all duration-200 group dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 hover:scale-105"
                                title="Duplicate test"
                            >
                                <FiCopy className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleRemoveTest(test.id)}
                                className="p-2 text-red-600 bg-red-100 rounded-lg transition-all duration-200 group dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 hover:scale-105"
                                title="Remove test"
                            >
                                <FiTrash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Info Row */}
                    <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                        <div className="flex items-center p-3 space-x-2 bg-gray-50 rounded-lg dark:bg-gray-700">
                            <FiTarget className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Status:</span>
                            <input
                                type="text"
                                value={test.expectedStatus}
                                onChange={e => handleUpdateTest(test.id, { expectedStatus: e.target.value })}
                                className="px-2 py-1 text-sm text-gray-900 bg-white rounded border border-gray-300 transition-all duration-200 dark:text-white dark:bg-gray-600 dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {test.serverStatusCode && test.serverStatusCode !== 0 && (
                            <div className="flex items-center p-3 space-x-2 bg-gray-50 rounded-lg dark:bg-gray-700">
                                <FiZap className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Server Status:</span>
                                <span className={`px-2 py-1 text-sm font-semibold rounded ${statusCodeColor[test.serverStatusCode as unknown as keyof typeof statusCodeColor]}`}>
                                    {test.serverStatusCode}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center p-3 space-x-2 bg-gray-50 rounded-lg dark:bg-gray-700">
                            <FiShield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Use Token:</span>
                            <input
                                type="checkbox"
                                checked={test.useToken !== false}
                                onChange={e => handleUpdateTest(test.id, { useToken: e.target.checked })}
                                className="w-4 h-4 text-purple-600 bg-white rounded border-gray-300 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800"
                            />
                        </div>
                    </div>

                    {/* Detailed Configuration */}
                    {showDetails && (
                        <div className="space-y-6">
                            {/* Path Variable Overrides */}
                            {urlData?.parsedSegments?.filter((seg: any) => seg.isDynamic).length > 0 && (
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 dark:from-blue-900 dark:to-blue-800 dark:border-blue-700">
                                    <div className="flex items-center mb-3 space-x-2">
                                        <FiGlobe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Path Variable Overrides</h4>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {urlData.parsedSegments.filter((seg: any) => seg.isDynamic).map((seg: any) => (
                                            <div key={seg.paramName} className="space-y-1">
                                                <label className="text-xs font-medium text-blue-600 dark:text-blue-400">{seg.paramName}</label>
                                                <input
                                                    type="text"
                                                    value={test.pathOverrides?.[seg.paramName] ?? ''}
                                                    onChange={e => handleUpdateTest(test.id, { pathOverrides: { ...test.pathOverrides, [seg.paramName]: e.target.value } })}
                                                    placeholder={`Override ${seg.paramName}`}
                                                    className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-lg border border-blue-300 transition-all duration-200 dark:text-white dark:bg-gray-600 dark:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Query Param Overrides */}
                            {requestConfig?.queryParams?.length > 0 && (
                                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 dark:from-green-900 dark:to-green-800 dark:border-green-700">
                                    <div className="flex items-center mb-3 space-x-2">
                                        <FiCode className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-300">Query Parameter Overrides</h4>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {requestConfig.queryParams.map((param: any) => (
                                            <div key={param.key} className="space-y-1">
                                                <label className="text-xs font-medium text-green-600 dark:text-green-400">{param.key}</label>
                                                <input
                                                    type="text"
                                                    value={test.queryOverrides?.[param.key] ?? ''}
                                                    onChange={e => handleUpdateTest(test.id, { queryOverrides: { ...test.queryOverrides, [param.key]: e.target.value } })}
                                                    placeholder={`Override ${param.key}`}
                                                    className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-lg border border-green-300 transition-all duration-200 dark:text-white dark:bg-gray-600 dark:border-green-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Body Override */}
                            {(() => {
                                const methodSupportsBody = (httpMethod: string): boolean => {
                                    const methodsWithBody = ["POST", "PUT", "PATCH"];
                                    return methodsWithBody.includes(httpMethod.toUpperCase());
                                };

                                if (!methodSupportsBody(requestConfig?.method ?? 'GET')) {
                                    return null;
                                }

                                if (requestConfig?.bodyType === 'json') {
                                    return (
                                        <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 dark:from-purple-900 dark:to-purple-800 dark:border-purple-700">
                                            <div className="flex items-center mb-3 space-x-2">
                                                <FiCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300">Body Override (JSON)</h4>
                                            </div>
                                            <Editor
                                                height="120px"
                                                defaultLanguage="json"
                                                value={test.bodyOverride ?? ''}
                                                onChange={value => handleUpdateTest(test.id, { bodyOverride: value ?? '' })}
                                                theme={isDarkMode ? 'vs-dark' : 'light'}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 12,
                                                    scrollBeyondLastLine: false,
                                                    lineNumbers: "on",
                                                    roundedSelection: false,
                                                    automaticLayout: true,
                                                }}
                                            />
                                        </div>
                                    );
                                } else if (requestConfig?.bodyType === 'form') {
                                    return (
                                        <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 dark:from-orange-900 dark:to-orange-800 dark:border-orange-700">
                                            <div className="flex items-center mb-3 space-x-2">
                                                <FiDatabase className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300">Body Override (Form Data)</h4>
                                            </div>
                                            <textarea
                                                value={test.bodyOverride ?? ''}
                                                onChange={e => handleUpdateTest(test.id, { bodyOverride: e.target.value })}
                                                placeholder="Enter form data (e.g., key1=value1&key2=value2)"
                                                className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-lg border border-orange-300 transition-all duration-200 resize-none dark:text-white dark:bg-gray-600 dark:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                rows={3}
                                            />
                                        </div>
                                    );
                                } else if (requestConfig?.bodyType === 'text') {
                                    return (
                                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 dark:from-indigo-900 dark:to-indigo-800 dark:border-indigo-700">
                                            <div className="flex items-center mb-3 space-x-2">
                                                <FiFileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Body Override (Text)</h4>
                                            </div>
                                            <textarea
                                                value={test.bodyOverride ?? ''}
                                                onChange={e => handleUpdateTest(test.id, { bodyOverride: e.target.value })}
                                                placeholder="Enter text body"
                                                className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-lg border border-indigo-300 transition-all duration-200 resize-none dark:text-white dark:bg-gray-600 dark:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                rows={3}
                                            />
                                        </div>
                                    );
                                }

                                return null;
                            })()}

                            {/* Expected Response */}
                            <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200 dark:from-teal-900 dark:to-teal-800 dark:border-teal-700">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center space-x-2">
                                        <FiTarget className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                        <h4 className="text-sm font-semibold text-teal-700 dark:text-teal-300">Expected Response (JSON)</h4>
                                    </div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={!!test.expectedPartialResponse}
                                            onChange={e => handleUpdateTest(test.id, { expectedPartialResponse: e.target.checked ? test.expectedResponse ?? '' : '' })}
                                            className="w-4 h-4 text-teal-600 bg-white rounded border-teal-300 focus:ring-teal-500 dark:border-teal-600 dark:bg-gray-800"
                                        />
                                        <span className="text-xs font-medium text-teal-600 dark:text-teal-400">Partial match</span>
                                    </label>
                                </div>
                                <Editor
                                    height="120px"
                                    defaultLanguage="json"
                                    value={test.expectedResponse ?? ''}
                                    onChange={value => handleUpdateTest(test.id, { expectedResponse: value ?? '' })}
                                    theme={isDarkMode ? 'vs-dark' : 'light'}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 12,
                                        scrollBeyondLastLine: false,
                                        lineNumbers: "on",
                                        roundedSelection: false,
                                        automaticLayout: true,
                                    }}
                                />
                            </div>

                            {/* Server Response */}
                            {test.serverResponse && test.serverResponse.trim() !== '' && (
                                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
                                    <div className="flex items-center mb-3 space-x-2">
                                        <FiCode className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Server Response (JSON)</h4>
                                    </div>
                                    <Editor
                                        height="120px"
                                        defaultLanguage="json"
                                        value={(() => {
                                            try {
                                                return JSON.stringify(JSON.parse(test.serverResponse ?? ''), null, 2);
                                            } catch {
                                                return test.serverResponse ?? '';
                                            }
                                        })()}
                                        theme={isDarkMode ? 'vs-dark' : 'light'}
                                        options={{
                                            minimap: { enabled: false },
                                            readOnly: true,
                                            fontSize: 12,
                                            scrollBeyondLastLine: false,
                                            lineNumbers: "on",
                                            roundedSelection: false,
                                            automaticLayout: true,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Run Button */}
                    <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-2">
                            {test.lastResult === 'pass' && (
                                <div className="flex items-center px-3 py-1 space-x-1 text-green-800 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-200">
                                    <FiCheck className="w-4 h-4" />
                                    <span className="text-sm font-semibold">Test Passed</span>
                                </div>
                            )}
                            {test.lastResult === 'fail' && (
                                <div className="flex items-center px-3 py-1 space-x-1 text-red-800 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
                                    <FiX className="w-4 h-4" />
                                    <span className="text-sm font-semibold">Test Failed</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleRunTest}
                            disabled={loading}
                            className="flex items-center px-6 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Running...</span>
                                </>
                            ) : (
                                <>
                                    <FiPlay className="w-4 h-4" />
                                    <span>Run Test</span>
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TestCard; 