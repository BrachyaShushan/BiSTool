import React from "react";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { TestCase } from "../../types/features/SavedManager";
import {
    FiPlay,
    FiArrowRight,
    FiPlus,
    FiCheck,
    FiX,
    FiTarget,
    FiActivity,
    FiTrendingUp,
    FiZap,
    FiRefreshCw,
    FiBarChart,
    FiClock,
    FiCode
} from "react-icons/fi";
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
        generateAuthHeaders,
        openSessionManager,
    } = useAppContext();

    const { isDarkMode } = useTheme();
    const tests: TestCase[] = activeSession?.tests ?? [];

    // Calculate test statistics
    const testStats = {
        total: tests.length,
        passed: tests.filter(test => test.lastResult === 'pass').length,
        failed: tests.filter(test => test.lastResult === 'fail').length,
        notRun: tests.filter(test => !test.lastResult).length,
        successRate: tests.length > 0 ? Math.round((tests.filter(test => test.lastResult === 'pass').length / tests.length) * 100) : 0
    };

    // Add Test handler
    const handleAddTest = () => {
        console.log('handleAddTest called');
        console.log('activeSession:', activeSession);

        if (!activeSession) {
            console.error('No active session available');
            return;
        }

        const newTest: TestCase = {
            id: uuidv4(),
            name: '',
            expectedStatus: '200',
            expectedResponse: '',
        };

        console.log('Creating new test:', newTest);

        const updatedSession = {
            ...activeSession,
            tests: [...(activeSession.tests || []), newTest],
        };

        console.log('Updated session:', updatedSession);

        handleSaveSession(activeSession.name, updatedSession);
        console.log('Test added successfully');
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
    };

    // Run Test handler
    const handleRunTest = async (test: TestCase) => {
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

        // Body override: only use if method supports body and non-empty string
        let body: string | undefined = undefined;
        let headers: Record<string, string> = (requestConfig?.headers || []).reduce((acc: Record<string, string>, h: any) => {
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
                    body = requestConfig.formData.map(field => `${field.key}=${field.value}`).join("&");
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
    };

    if (!activeSession) {
        return (
            <div className="space-y-6">
                {/* Header Section */}
                <div className="overflow-hidden relative p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 dark:opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full translate-x-16 -translate-y-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500 rounded-full -translate-x-12 translate-y-12"></div>
                    </div>

                    <div className="flex relative justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                                <FiCode className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                                    Test Manager
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Create, configure, and execute comprehensive API tests
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl dark:from-blue-900 dark:to-blue-800">
                                <FiTarget className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Test Suite</span>
                            </div>
                            <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-green-100 to-green-200 rounded-xl dark:from-green-900 dark:to-green-800">
                                <FiActivity className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-semibold text-green-700 dark:text-green-300">Live Testing</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* No Active Session Warning */}
                <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                    <div className="text-center">
                        <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <FiCode className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                            No Active Session
                        </h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                            You need to create or select an active session before managing tests.
                            Please go to the Session Manager to create a session first.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => window.history.back()}
                                className="px-6 py-3 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={() => {
                                    // Open session manager modal on sessions tab
                                    openSessionManager({ tab: 'sessions' });
                                }}
                                className="px-6 py-3 font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            >
                                Create Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="overflow-hidden relative p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 dark:opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full translate-x-16 -translate-y-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500 rounded-full -translate-x-12 translate-y-12"></div>
                </div>

                <div className="flex relative justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                            <FiCode className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                                Test Manager
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                Create, configure, and execute comprehensive API tests
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl dark:from-blue-900 dark:to-blue-800">
                            <FiTarget className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Test Suite</span>
                        </div>
                        <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-green-100 to-green-200 rounded-xl dark:from-green-900 dark:to-green-800">
                            <FiActivity className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Live Testing</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Statistics Dashboard */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 dark:from-blue-900 dark:to-blue-800 dark:border-blue-700">
                    <div className="flex items-center space-x-2">
                        <FiBarChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Tests</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{testStats.total}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 dark:from-green-900 dark:to-green-800 dark:border-green-700">
                    <div className="flex items-center space-x-2">
                        <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">Passed</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{testStats.passed}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 dark:from-red-900 dark:to-red-800 dark:border-red-700">
                    <div className="flex items-center space-x-2">
                        <FiX className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-semibold text-red-700 dark:text-red-300">Failed</span>
                    </div>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-200">{testStats.failed}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 dark:from-orange-900 dark:to-orange-800 dark:border-orange-700">
                    <div className="flex items-center space-x-2">
                        <FiTrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Success Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{testStats.successRate}%</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-lg dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                            <FiZap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Test Actions</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Manage and execute your API tests</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {testStats.notRun > 0 && (
                            <div className="flex items-center px-3 py-1 space-x-1 text-amber-800 bg-amber-100 rounded-lg dark:bg-amber-900 dark:text-amber-200">
                                <FiClock className="w-4 h-4" />
                                <span className="text-sm font-semibold">{testStats.notRun} tests not run</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Add Test Button */}
                    <button
                        onClick={handleAddTest}
                        className="flex overflow-hidden relative flex-col items-center p-4 space-y-2 font-semibold text-white bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl border transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25 border-emerald-400/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 -translate-x-full via-white/10 group-hover:translate-x-full"></div>
                        <div className="relative p-2 rounded-lg backdrop-blur-sm bg-white/20">
                            <FiPlus className="w-6 h-6" />
                        </div>
                        <span className="relative text-sm font-semibold">Add Test</span>
                        <span className="relative text-xs opacity-80">Create new test case</span>
                    </button>

                    {/* Run All Tests Button */}
                    <button
                        onClick={handleRunAll}
                        disabled={tests.length === 0}
                        className="flex overflow-hidden relative flex-col items-center p-4 space-y-2 font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl border transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 border-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 -translate-x-full via-white/10 group-hover:translate-x-full"></div>
                        <div className="relative p-2 rounded-lg backdrop-blur-sm bg-white/20">
                            <FiPlay className="w-6 h-6" />
                        </div>
                        <span className="relative text-sm font-semibold">Run All Tests</span>
                        <span className="relative text-xs opacity-80">{tests.length} test{tests.length !== 1 ? 's' : ''}</span>
                    </button>

                    {/* Run Failed Tests Button */}
                    <button
                        onClick={handleRunAllFailed}
                        disabled={testStats.failed === 0}
                        className="flex overflow-hidden relative flex-col items-center p-4 space-y-2 font-semibold text-white bg-gradient-to-br from-red-500 to-red-600 rounded-xl border transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-red-500/25 border-red-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 -translate-x-full via-white/10 group-hover:translate-x-full"></div>
                        <div className="relative p-2 rounded-lg backdrop-blur-sm bg-white/20">
                            <FiRefreshCw className="w-6 h-6" />
                        </div>
                        <span className="relative text-sm font-semibold">Run Failed Tests</span>
                        <span className="relative text-xs opacity-80">{testStats.failed} failed</span>
                    </button>

                    {/* Continue to YAML Button */}
                    <button
                        onClick={handleContinue}
                        disabled={testStats.failed > 0 && tests.length > 0}
                        className="flex overflow-hidden relative flex-col items-center p-4 space-y-2 font-semibold text-white bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl border transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 border-purple-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 -translate-x-full via-white/10 group-hover:translate-x-full"></div>
                        <div className="relative p-2 rounded-lg backdrop-blur-sm bg-white/20">
                            <FiArrowRight className="w-6 h-6" />
                        </div>
                        <span className="relative text-sm font-semibold">Continue</span>
                        <span className="relative text-xs opacity-80">Generate YAML</span>
                    </button>
                </div>

                {/* Quick Stats Row */}
                <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-600 dark:text-gray-400">Passed: {testStats.passed}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-gray-600 dark:text-gray-400">Failed: {testStats.failed}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-gray-600 dark:text-gray-400">Not Run: {testStats.notRun}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <FiTrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="font-semibold text-green-600 dark:text-green-400">
                                {testStats.successRate}% Success Rate
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Cards */}
            <div className="space-y-4">
                {tests.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-gray-300 border-dashed dark:border-gray-600 dark:bg-gray-700">
                        <FiCode className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                        <p className="mb-4 text-gray-500 dark:text-gray-400">No tests created yet</p>
                        <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">Create your first test to start validating your API endpoints</p>
                        <button
                            onClick={handleAddTest}
                            className="flex items-center px-4 py-2 mx-auto space-x-2 font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>Create First Test</span>
                        </button>
                    </div>
                ) : (
                    tests.map((test: TestCase) => (
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
                            generateAuthHeaders={generateAuthHeaders}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default TestManager;
