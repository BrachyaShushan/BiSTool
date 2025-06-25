import React from "react";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { TestCase } from "../../types/features/SavedManager";
import { FiPlay, FiArrowRight } from "react-icons/fi";
import { FiPlus } from "react-icons/fi";
import { v4 as uuidv4 } from 'uuid';
import TestCard from "./TestCard";

const TestManager: React.FC = () => {
    const {
        urlData,
        requestConfig,
        globalVariables,
        activeSession,
        handleSaveSession,
        setActiveSection,
    } = useAppContext();

    const { isDarkMode } = useTheme();
    const tests: TestCase[] = activeSession?.tests ?? [];

    // Add Test handler
    const handleAddTest = () => {
        if (!activeSession) return;
        const newTest: TestCase = {
            id: uuidv4(),
            name: '',
            expectedStatus: '200',
            expectedResponse: '',
        };
        const updatedSession = {
            ...activeSession,
            tests: [...(activeSession.tests || []), newTest],
        };
        handleSaveSession(activeSession.name, updatedSession);
    };

    // Update Test handler
    const handleUpdateTest = (id: string, update: Partial<TestCase>) => {
        if (!activeSession) return;
        const safeUpdate = { ...update };
        const updatedTests = tests.map((test: TestCase) =>
            test.id === id ? { ...test, ...safeUpdate } : test
        );
        const updatedSession = {
            ...activeSession,
            tests: updatedTests,
        };
        handleSaveSession(activeSession.name, updatedSession);
    };

    const handleRunAll = () => {
        tests.forEach(test => handleRunTest(test));
    };
    const handleContinue = () => {
        setActiveSection("yaml");
    };

    const handleRunAllFailed = () => {
        tests.forEach(test => {
            if (test.lastResult === 'fail') {
                handleRunTest(test);
            }
        });
    };

    const handleDuplicateTest = (id: string) => {
        const test = tests.find(t => t.id === id);
        if (test && activeSession) {
            const newTest: TestCase = {
                ...test,
                id: uuidv4(),
                name: `${test.name} Copy`,
                expectedResponse: test.expectedResponse ?? '',
            };
            const updatedSession = {
                ...activeSession,
                tests: [...(activeSession.tests || []), newTest],
            };
            handleSaveSession(activeSession.name, updatedSession);
        }
    };

    // Remove Test handler
    const handleRemoveTest = (id: string) => {
        if (!activeSession) return;
        const updatedTests = tests.filter((test: TestCase) => test.id !== id);
        const updatedSession = {
            ...activeSession,
            tests: updatedTests,
        };
        handleSaveSession(activeSession.name, updatedSession);
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
    const evaluateUrl = (url: string, test: TestCase) => {
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
    }
    // Run Test handler
    const handleRunTest = async (test: TestCase) => {
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
        url = evaluateUrl(url, test);

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

        // Body override: only use if non-empty string
        let body: string | undefined = undefined;
        let headers: Record<string, string> = (requestConfig?.headers || []).reduce((acc: Record<string, string>, h: any) => {
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


    if (!requestConfig) {
        return <div>No request configuration available</div>;
    }

    return (
        <div className={`p-4 bg-white rounded-lg shadow dark:bg-gray-800`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-bold text-gray-900 dark:text-white`}>TESTS</h3>
                <button
                    className={`flex gap-2 items-center px-4 py-2 text-blue-700 bg-blue-100 rounded-md dark:bg-blue-600 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700`}
                    onClick={handleAddTest}
                >
                    <FiPlus />
                    <span>Add Test</span>
                </button>
                <button
                    className={`flex gap-2 items-center px-4 py-2 text-green-700 bg-green-100 rounded-md dark:bg-green-600 dark:text-white hover:bg-green-200 dark:hover:bg-green-700`}
                    onClick={handleRunAll}
                >
                    <FiPlay />
                    <span>Run All Tests</span>
                </button>
                <button
                    className={`flex gap-2 items-center px-4 py-2 text-red-700 bg-red-100 rounded-md dark:bg-red-600 dark:text-white hover:bg-red-200 dark:hover:bg-red-700`}
                    onClick={handleRunAllFailed}
                    disabled={tests.every(test => test.lastResult === 'fail')}
                >
                    <FiPlay />
                    <span>Run All Failed Tests</span>
                </button>
                <button
                    className={`flex gap-2 items-center px-4 py-2 text-blue-700 bg-blue-100 rounded-md dark:bg-blue-600 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700`}
                    onClick={handleContinue}
                    disabled={tests.every(test => test.lastResult === 'fail') && tests.length != 0}
                >
                    <FiArrowRight />
                    <span>Continue</span>
                </button>
            </div>

            <div className="space-y-6">
                {tests.map((test: TestCase) => (
                    <TestCard
                        key={test.id}
                        test={test}
                        urlData={urlData}
                        requestConfig={requestConfig}
                        globalVariables={globalVariables}
                        activeSession={activeSession}
                        isDarkMode={isDarkMode}
                        handleUpdateTest={handleUpdateTest}
                        handleDuplicateTest={handleDuplicateTest}
                        handleRemoveTest={handleRemoveTest}
                    />
                ))}
            </div>

        </div>
    );
};

export default TestManager;
