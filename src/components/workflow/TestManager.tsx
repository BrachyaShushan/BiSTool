import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useTokenContext } from "../../context/TokenContext";
import { useVariablesContext } from "../../context/VariablesContext";
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
import {
    Button,
    Card,
    StatCard,
    TestStatusBadge,
    SectionHeader,
    Badge
} from "../ui";

const TestManager: React.FC = () => {
    const params = useParams();
    const navigate = useNavigate();
    const projectId = params["projectId"];
    const sessionId = params["sessionId"];

    const {
        urlData,
        requestConfig,
        activeSession,
        handleSaveSession,
        openUnifiedManager,
    } = useAppContext();
    const { generateAuthHeaders } = useTokenContext();
    const { replaceVariables } = useVariablesContext();

    const tests: TestCase[] = activeSession?.tests ?? [];

    // Calculate test statistics
    const testStats = {
        total: tests.length,
        passed: tests.filter(test => test.lastResult === 'pass').length,
        failed: tests.filter(test => test.lastResult === 'fail').length,
        notRun: tests.filter(test => !test.lastResult).length,
        successRate: tests.length > 0 ? Math.round((tests.filter(test => test.lastResult === 'pass').length / tests.length) * 100) : 0,
        selectedForAI: tests.filter(test => test.includeInAIPrompt !== false).length
    };

    // Add Test handler
    const handleAddTest = () => {
        if (!activeSession) {
            console.error('No active session available');
            return;
        }

        const newTest: TestCase = {
            id: uuidv4(),
            name: '',
            expectedStatus: '200',
            expectedResponse: '',
            includeInAIPrompt: true,
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
        if (projectId && sessionId) {
            navigate(`/project/${projectId}/session/${sessionId}/yaml`);
        }
    };

    const handleRunAllFailed = () => {
        tests.forEach(test => {
            if (test.lastResult === 'fail') {
                handleRunTest(test);
            }
        });
    };

    const handleToggleAllForAI = () => {
        if (!activeSession) return;

        const allSelected = tests.every(test => test.includeInAIPrompt !== false);
        const updatedTests = tests.map(test => ({
            ...test,
            includeInAIPrompt: !allSelected
        }));

        const updatedSession = {
            ...activeSession,
            tests: updatedTests,
        };
        handleSaveSession(activeSession.name, updatedSession);
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
        // Apply pathOverrides first
        if (urlData.parsedSegments) {
            urlData.parsedSegments.forEach((seg: any) => {
                const overrideVal = test.pathOverrides?.[seg.paramName];
                if (seg.isDynamic && overrideVal && overrideVal.trim() !== '') {
                    url = url.replace(`{${seg.paramName}}`, String(overrideVal));
                }
            });
        }
        // Use replaceVariables for any remaining variables
        return replaceVariables(url);
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
                <SectionHeader
                    icon={FiCode}
                    title="Test Manager"
                    description="Create, configure, and execute comprehensive API tests"
                    color="emerald"
                    badges={
                        <>
                            <Badge variant="primary" size="sm">
                                <FiTarget className="w-3 h-3 mr-1" />
                                Test Suite
                            </Badge>
                            <Badge variant="success" size="sm">
                                <FiActivity className="w-3 h-3 mr-1" />
                                Live Testing
                            </Badge>
                        </>
                    }
                />

                {/* No Active Session Warning */}
                <Card variant="elevated" padding="xl">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                            <FiCode className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                            No Active Session
                        </h3>
                        <p className="max-w-md mx-auto mb-6 text-gray-600 dark:text-gray-300">
                            You need to create or select an active session before managing tests.
                            Please go to the Session Manager to create a session first.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <Button
                                variant="secondary"
                                onClick={() => window.history.back()}
                            >
                                Go Back
                            </Button>
                            <Button
                                gradient
                                variant="primary"
                                onClick={() => openUnifiedManager('sessions')}
                            >
                                Create Session
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <SectionHeader
                icon={FiCode}
                title="Test Manager"
                description="Create, configure, and execute comprehensive API tests"
                color="emerald"
                badges={
                    <>
                        <Badge variant="primary" size="sm">
                            <FiTarget className="w-3 h-3 mr-1" />
                            Test Suite
                        </Badge>
                        <Badge variant="success" size="sm">
                            <FiActivity className="w-3 h-3 mr-1" />
                            Live Testing
                        </Badge>
                    </>
                }
            />

            {/* Test Statistics Dashboard */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={FiBarChart}
                    label="Total Tests"
                    value={testStats.total}
                    color="blue"
                />
                <StatCard
                    icon={FiCheck}
                    label="Passed"
                    value={testStats.passed}
                    color="green"
                />
                <StatCard
                    icon={FiX}
                    label="Failed"
                    value={testStats.failed}
                    color="red"
                />
                <StatCard
                    icon={FiTrendingUp}
                    label="Success Rate"
                    value={`${testStats.successRate}%`}
                    color="orange"
                />
            </div>

            {/* Action Buttons */}
            <Card variant="gradient" padding="lg">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                            <FiZap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Test Actions</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Manage and execute your API tests</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {testStats.notRun > 0 && (
                            <Badge variant="warning" size="sm">
                                <FiClock className="w-3 h-3 mr-1" />
                                {testStats.notRun} tests not run
                            </Badge>
                        )}
                        {testStats.selectedForAI > 0 && (
                            <Badge variant="primary" size="sm">
                                <FiCode className="w-3 h-3 mr-1" />
                                {testStats.selectedForAI} tests for AI
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Button
                        variant="success"
                        size="lg"
                        icon={FiPlus}
                        onClick={handleAddTest}
                        fullWidth
                    >
                        Add Test
                    </Button>

                    <Button
                        variant="primary"
                        size="lg"
                        icon={FiPlay}
                        onClick={handleRunAll}
                        disabled={tests.length === 0}
                        fullWidth
                    >
                        Run All Tests
                    </Button>

                    <Button
                        variant="danger"
                        size="lg"
                        icon={FiRefreshCw}
                        onClick={handleRunAllFailed}
                        disabled={testStats.failed === 0}
                        fullWidth
                    >
                        Run Failed Tests
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        icon={FiCode}
                        onClick={handleToggleAllForAI}
                        disabled={tests.length === 0}
                        fullWidth
                    >
                        {testStats.selectedForAI === tests.length ? 'Deselect All for AI' : 'Select All for AI'}
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        icon={FiArrowRight}
                        onClick={handleContinue}
                        disabled={testStats.failed > 0 && tests.length > 0}
                        fullWidth
                    >
                        Continue to YAML
                    </Button>
                </div>

                {/* Quick Stats Row */}
                <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <TestStatusBadge status="pass" size="sm" />
                                <span className="text-gray-600 dark:text-gray-400">: {testStats.passed}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <TestStatusBadge status="fail" size="sm" />
                                <span className="text-gray-600 dark:text-gray-400">: {testStats.failed}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <TestStatusBadge status={null} size="sm" />
                                <span className="text-gray-600 dark:text-gray-400">: {testStats.notRun}</span>
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
            </Card>

            {/* Test Cards */}
            <div className="space-y-4">
                {tests.length === 0 ? (
                    <Card variant="outlined" padding="xl">
                        <div className="text-center">
                            <FiCode className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="mb-4 text-gray-500 dark:text-gray-400">No tests created yet</p>
                            <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">Create your first test to start validating your API endpoints</p>
                            <Button
                                variant="primary"
                                icon={FiPlus}
                                onClick={handleAddTest}
                            >
                                Create First Test
                            </Button>
                        </div>
                    </Card>
                ) : (
                    tests.map((test: TestCase) => (
                        <TestCard
                            key={test.id}
                            test={test}
                            handleUpdateTest={handleUpdateTest}
                            handleDuplicateTest={handleDuplicateTest}
                            handleRemoveTest={handleRemoveTest}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default TestManager;
