import React from "react";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { Editor } from "@monaco-editor/react";
import { FiPlay, FiCheck, FiX, FiTrash, FiCopy } from "react-icons/fi";
import { v4 as uuidv4 } from 'uuid';
import { TestCase } from "../types/SavedManager";

const TestManager: React.FC = () => {
    const {
        urlData,
        requestConfig,
        globalVariables,
        activeSession,
        handleSaveSession,
    } = useAppContext();

    const { isDarkMode } = useTheme();
    const tests: TestCase[] = activeSession?.tests ?? [];

    // Add Test handler
    const handleAddTest = () => {
        if (!activeSession) return;
        const newTest: import("../types/SavedManager").TestCase = {
            id: uuidv4(),
            name: '',
            bodyOverride: '',
            pathOverrides: {},
            queryOverrides: {},
            expectedStatus: '200',
            expectedResponse: '',
            lastResult: undefined,
            useToken: true,
        };
        const updatedSession = {
            ...activeSession,
            tests: [...tests, newTest],
        };
        handleSaveSession(activeSession.name, updatedSession);
    };

    // Update Test handler
    const handleUpdateTest = (id: string, update: Partial<import("../types/SavedManager").TestCase>) => {
        if (!activeSession) return;
        const safeUpdate = { ...update };
        if ('bodyOverride' in safeUpdate) safeUpdate.bodyOverride = safeUpdate.bodyOverride ?? '';
        if ('expectedResponse' in safeUpdate) safeUpdate.expectedResponse = safeUpdate.expectedResponse ?? '';
        const updatedTests = tests.map((test: import("../types/SavedManager").TestCase) =>
            test.id === id ? { ...test, ...safeUpdate } : test
        );
        const updatedSession = {
            ...activeSession,
            tests: updatedTests,
        };
        handleSaveSession(activeSession.name, updatedSession);
    };

    const handleDuplicateTest = (id: string) => {
        const test = tests.find(t => t.id === id);
        if (test && activeSession) {
            const newTest: import("../types/SavedManager").TestCase = {
                ...test,
                id: uuidv4(),
                name: `${test.name} Copy`,
            };
            const updatedSession = {
                ...activeSession,
                tests: [...tests, newTest],
            };
            handleSaveSession(activeSession.name, updatedSession);
        }
    };

    // Remove Test handler
    const handleRemoveTest = (id: string) => {
        if (!activeSession) return;
        const updatedTests = tests.filter((test: import("../types/SavedManager").TestCase) => test.id !== id);
        const updatedSession = {
            ...activeSession,
            tests: updatedTests,
        };
        handleSaveSession(activeSession.name, updatedSession);
    };

    // Run Test handler
    const handleRunTest = async (test: import("../types/SavedManager").TestCase) => {
        // Build request using overrides
        let url = urlData.builtUrl ?? '';

        // Path overrides: only override if non-empty string
        if (urlData.parsedSegments) {
            urlData.parsedSegments.forEach(seg => {
                const overrideVal = test.pathOverrides?.[seg.paramName];
                if (seg.isDynamic && overrideVal && overrideVal.trim() !== '') {
                    url = url.replace(`{${seg.paramName}}`, String(overrideVal));
                }
            });
        }

        // Replace any remaining {variable} in the URL with test overrides, session/shared, or global variables
        url = url.replace(/\{([^}]+)\}/g, (match, varName) => {
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

        // Query param overrides: only override if non-empty string
        let queryString = '';
        if (requestConfig?.queryParams) {
            const params = requestConfig.queryParams.map(param => {
                const overrideVal = test.queryOverrides?.[param.key];
                const value = (overrideVal && overrideVal.trim() !== '') ? overrideVal : param.value;
                return `${param.key}=${encodeURIComponent(value)}`;
            });
            queryString = params.length ? `?${params.join('&')}` : '';
        }
        url = url + queryString;

        // Body override: only use if non-empty string
        let body: string | undefined = undefined;
        let headers: Record<string, string> = (requestConfig?.headers || []).reduce((acc: Record<string, string>, h) => {
            acc[h.key] = h.value;
            return acc;
        }, {});

        // Add token header if useToken is true (or undefined)
        if (test.useToken !== false) {
            const tokenName = globalVariables?.['tokenName'] ?? 'x-access-token';
            const tokenValue = globalVariables[tokenName];
            if (tokenName && tokenValue) {
                headers[tokenName] = tokenValue;
            }
        }

        if (requestConfig?.bodyType === 'json') {
            if (test.bodyOverride && test.bodyOverride.trim() !== '') {
                body = test.bodyOverride;
            } else if (requestConfig.jsonBody) {
                body = requestConfig.jsonBody;
            }
            headers['Content-Type'] = 'application/json';
        }

        // Make the request
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
                    responseMatch = isPartialMatch(test.expectedResponse, test.serverResponse);
                } else {
                    const respJson = await response.json();
                    responseMatch = JSON.stringify(respJson) === test.expectedResponse;
                }
            }
            result = statusMatch && responseMatch ? 'pass' : 'fail';
            test.serverStatusCode = response.status;
        } catch {
            result = 'fail';
            test.serverStatusCode = 0;
        }
        handleUpdateTest(test.id, { lastResult: result });
    };

    const statusCodeColor = {
        "200": "dark:bg-blue-500 bg-blue-200",
        "201": "dark:bg-green-500 bg-green-200",
        "204": "dark:bg-green-500 bg-green-200",
        "400": "dark:bg-red-500 bg-red-200",
        "401": "dark:bg-red-500 bg-red-200",
        "403": "dark:bg-red-500 bg-red-200",
        "404": "dark:bg-red-500 bg-red-200",
        "500": "dark:bg-red-500 bg-red-200",
    };

    if (!requestConfig) {
        return <div>No request configuration available</div>;
    }

    return (
        <div className={`p-4 bg-white rounded-lg shadow dark:bg-gray-800`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-bold text-gray-900 dark:text-white`}>TESTS</h3>
                <button
                    className={`px-4 py-2 text-blue-700 bg-blue-100 rounded-md dark:bg-blue-600 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700`}
                    onClick={handleAddTest}
                >
                    Add Test
                </button>
            </div>

            <div className="space-y-6">
                {tests.map((test: TestCase) => (
                    <div key={test.id} className={`p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800`}>
                        <div className="flex items-center mb-2">
                            <input
                                type="text"
                                value={test.name}
                                onChange={e => handleUpdateTest(test.id, { name: e.target.value })}
                                placeholder="Test Name"
                                className={`px-2 py-1 mr-4 text-gray-900 bg-white rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                            />
                            <button
                                className={`flex gap-2 items-center px-2 py-1 ml-auto text-blue-700 bg-blue-100 rounded dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 hover:bg-blue-200`}
                                onClick={() => handleDuplicateTest(test.id)}
                            >
                                <FiCopy />
                                Duplicate
                            </button>
                            <button
                                className={`flex gap-2 items-center px-2 py-1 ml-auto text-red-700 bg-red-100 rounded dark:bg-red-600 dark:text-white dark:hover:bg-red-800 hover:bg-red-200`}
                                onClick={() => handleRemoveTest(test.id)}
                            >
                                <FiTrash />
                                Remove
                            </button>
                        </div>

                        {/* Path variable overrides */}
                        {urlData?.parsedSegments?.filter(seg => seg.isDynamic).length > 0 && (
                            <div className="mb-2">
                                <div className="mb-1 font-medium">Path Variable Overrides</div>
                                <div className="flex flex-wrap gap-2">
                                    {urlData.parsedSegments.filter(seg => seg.isDynamic).map(seg => (
                                        <input
                                            key={seg.paramName}
                                            type="text"
                                            value={test.pathOverrides?.[seg.paramName] ?? ''}
                                            onChange={e => handleUpdateTest(test.id, { pathOverrides: { ...test.pathOverrides, [seg.paramName]: e.target.value } })}
                                            placeholder={seg.paramName}
                                            className={`px-2 py-1 text-gray-900 bg-white rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Query param overrides */}
                        {requestConfig?.queryParams?.length > 0 && (
                            <div className="mb-2">
                                <div className="mb-1 font-medium">Query Param Overrides</div>
                                <div className="flex flex-wrap gap-2">
                                    {requestConfig.queryParams.map(param => (
                                        <input
                                            key={param.key}
                                            type="text"
                                            value={test.queryOverrides?.[param.key] ?? ''}
                                            onChange={e => handleUpdateTest(test.id, { queryOverrides: { ...test.queryOverrides, [param.key]: e.target.value } })}
                                            placeholder={param.key}
                                            className={`px-2 py-1 text-gray-900 bg-white rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Body override */}
                        {requestConfig?.bodyType === 'json' && (
                            <div className="mb-2">
                                <div className="mb-1 font-medium">Body Override (JSON)</div>
                                <Editor
                                    height="100px"
                                    defaultLanguage="json"
                                    value={test.bodyOverride ?? ''}
                                    onChange={value => handleUpdateTest(test.id, { bodyOverride: value ?? '' })}
                                    theme={isDarkMode ? 'vs-dark' : 'light'}
                                    options={{ minimap: { enabled: false }, fontSize: 14 }}
                                />
                            </div>
                        )}

                        {/* Expected status */}
                        <div className="mb-2">
                            <div className="mb-1 font-medium">Expected Status</div>
                            <input
                                type="text"
                                value={test.expectedStatus}
                                onChange={e => handleUpdateTest(test.id, { expectedStatus: e.target.value })}
                                className={`px-2 py-1 text-gray-900 bg-white rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                            />
                        </div>

                        {/* Expected response */}
                        <div className="mb-2">
                            <div className="flex items-center mb-1">
                                <span className="mb-1 font-medium">Expected Response (JSON)</span>
                                <label className="flex items-center ml-2">
                                    <input
                                        type="checkbox"
                                        checked={!!test.expectedPartialResponse}
                                        onChange={e => handleUpdateTest(test.id, { expectedPartialResponse: e.target.checked ? test.expectedResponse ?? '' : '' })}
                                    />
                                    <span className="ml-2">Partial match</span>
                                </label>
                            </div>
                            <Editor
                                height="100px"
                                defaultLanguage="json"
                                value={test.expectedResponse ?? ''}
                                onChange={value => handleUpdateTest(test.id, { expectedResponse: value ?? '' })}
                                theme={isDarkMode ? 'vs-dark' : 'light'}
                                options={{ minimap: { enabled: false }, fontSize: 14 }}
                            />
                        </div>

                        {/* Server response*/}
                        {/* Server status code */}
                        {test.serverStatusCode && test.serverStatusCode != 0 ? (
                            <div className="flex items-center mb-2">
                                <span className="mr-2 font-medium">Server Status Code:</span>
                                <span className={`font-medium px-2 py-1 rounded ${statusCodeColor[test.serverStatusCode as unknown as keyof typeof statusCodeColor]}`}>
                                    {test.serverStatusCode}
                                </span>
                            </div>
                        ) : null}

                        {test.serverResponse && test.serverResponse.trim() !== '' && (
                            <div className="mb-2">
                                <div className="mb-1 font-medium">Server Response (JSON)</div>
                                <Editor
                                    height="100px"
                                    defaultLanguage="json"
                                    value={
                                        (() => {
                                            try {
                                                return JSON.stringify(JSON.parse(test.serverResponse ?? ''), null, 2);
                                            } catch {
                                                return test.serverResponse ?? '';
                                            }
                                        })()
                                    }
                                    theme={isDarkMode ? 'vs-dark' : 'light'}
                                    options={{ minimap: { enabled: false }, readOnly: true, fontSize: 14 }}
                                />
                            </div>
                        )}

                        {/* Use token checkbox */}
                        <div className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                checked={test.useToken !== false}
                                onChange={e => handleUpdateTest(test.id, { useToken: e.target.checked })}
                                className="mr-2"
                                id={`use-token-${test.id}`}
                            />
                            <label htmlFor={`use-token-${test.id}`}>Use token</label>
                        </div>

                        {/* Run and result */}
                        <div className="flex items-center mt-2">
                            <button
                                className={`flex gap-2 items-center px-4 py-1 mr-4 text-blue-700 bg-blue-100 rounded dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 hover:bg-blue-200`}
                                onClick={() => handleRunTest(test)}
                            >
                                <FiPlay />
                                <span>Run</span>
                            </button>
                            {test.lastResult === 'pass' && <FiCheck className="text-green-600" size={30} />}
                            {test.lastResult === 'fail' && <FiX className="text-red-600" size={30} />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestManager;
