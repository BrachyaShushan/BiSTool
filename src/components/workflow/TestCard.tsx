import React, { useState } from "react";
import { Editor } from "@monaco-editor/react";
import {
    FiTrash2,
    FiPlay,
    FiCopy,
    FiTarget,
    FiCode,
    FiGlobe,
    FiDatabase,
    FiFileText,
    FiShield,
    FiRefreshCw,
    FiEye,
    FiEyeOff,
    FiZap
} from "react-icons/fi";
import { TestCase } from "../../types/features/SavedManager";
import {
    Button,
    Card,
    Input,
    IconButton,
    TestStatusBadge,
    Textarea,
    Badge,
    Toggle
} from "../ui";
import { useVariablesContext } from "../../context/VariablesContext";
import { useAppContext } from "../../context/AppContext";
import { useTokenContext } from "../../context/TokenContext";
import { useTheme } from "../../context/ThemeContext";

interface TestCardProps {
    test: TestCase;
    handleUpdateTest: (id: string, update: Partial<TestCase>) => void;
    handleDuplicateTest: (id: string) => void;
    handleRemoveTest: (id: string) => void;
}

const statusCodeColors = {
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

const TestCard: React.FC<TestCardProps> = ({
    test,
    handleUpdateTest,
    handleDuplicateTest,
    handleRemoveTest,
}) => {
    const { replaceVariables } = useVariablesContext();
    const { urlData, requestConfig } = useAppContext();
    const { generateAuthHeaders } = useTokenContext();
    const { isDarkMode } = useTheme();
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

        // Use replaceVariables for any remaining variables
        url = replaceVariables(url);

        // Query param overrides: only override if non-empty string
        let queryString = '';
        if (requestConfig?.queryParams?.length) {
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
        <Card variant="elevated" padding="lg">
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
                                <Input
                                    value={test.name}
                                    onChange={(e) => handleUpdateTest(test.id, { name: e.target.value })}
                                    placeholder="Enter test name..."
                                    variant="outlined"
                                    className="text-lg font-semibold bg-transparent border-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Test Status Indicator */}
                            <TestStatusBadge
                                status={loading ? 'running' : test.lastResult || null}
                                size="md"
                            />

                            {/* AI Selection Indicator */}
                            {test.includeInAIPrompt !== false && (
                                <Badge variant="primary" size="sm">
                                    <FiCode className="mr-1 w-3 h-3" />
                                    AI
                                </Badge>
                            )}

                            {/* Action Buttons */}
                            <IconButton
                                variant="ghost"
                                size="md"
                                icon={showDetails ? FiEyeOff : FiEye}
                                onClick={() => setShowDetails(!showDetails)}
                                title={showDetails ? "Hide details" : "Show details"}
                            />
                            <IconButton
                                variant="primary"
                                size="md"
                                icon={FiCopy}
                                onClick={() => handleDuplicateTest(test.id)}
                                title="Duplicate test"
                            />
                            <IconButton
                                variant="danger"
                                size="md"
                                icon={FiTrash2}
                                onClick={() => handleRemoveTest(test.id)}
                                title="Remove test"
                            />
                        </div>
                    </div>

                    {/* Quick Info Row */}
                    <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                        <Card variant="outlined" padding="sm">
                            <div className="flex items-center space-x-2">
                                <FiTarget className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Status:</span>
                                <Input
                                    value={test.expectedStatus}
                                    onChange={(e) => handleUpdateTest(test.id, { expectedStatus: e.target.value })}
                                    size="sm"
                                    className="w-20"
                                />
                            </div>
                        </Card>

                        {test.serverStatusCode && test.serverStatusCode !== 0 && (
                            <Card variant="outlined" padding="sm">
                                <div className="flex items-center space-x-2">
                                    <FiZap className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Server Status:</span>
                                    <Badge
                                        variant={test.serverStatusCode >= 200 && test.serverStatusCode < 300 ? 'success' : 'danger'}
                                        size="sm"
                                        className={statusCodeColors[test.serverStatusCode.toString() as keyof typeof statusCodeColors]}
                                    >
                                        {test.serverStatusCode}
                                    </Badge>
                                </div>
                            </Card>
                        )}

                        <Card variant="outlined" padding="sm">
                            <div className="flex items-center space-x-2">
                                <FiShield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <Toggle
                                    checked={test.useToken !== false}
                                    onChange={(checked) => handleUpdateTest(test.id, { useToken: checked })}
                                    label="Use Token"
                                    colorScheme="purple"
                                    size="sm"
                                    position="left"
                                    data-testid={`test-use-token-${test.id}`}
                                />
                            </div>
                        </Card>

                        <Card variant="outlined" padding="sm">
                            <div className="flex items-center space-x-2">
                                <FiCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <Toggle
                                    checked={test.includeInAIPrompt !== false}
                                    onChange={(checked) => handleUpdateTest(test.id, { includeInAIPrompt: checked })}
                                    label="Include in AI Prompt"
                                    colorScheme="blue"
                                    size="sm"
                                    position="left"
                                    data-testid={`test-include-ai-${test.id}`}
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Detailed Configuration */}
                    {showDetails && (
                        <div className="space-y-6">
                            {/* Path Variable Overrides */}
                            {urlData?.parsedSegments?.filter((seg: any) => seg.isDynamic).length > 0 && (
                                <Card variant="outlined" padding="md" className="border-blue-200 dark:border-blue-700">
                                    <div className="flex items-center mb-3 space-x-2">
                                        <FiGlobe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Path Variable Overrides</h4>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {urlData.parsedSegments.filter((seg: any) => seg.isDynamic).map((seg: any) => (
                                            <Input
                                                key={seg.paramName}
                                                label={seg.paramName}
                                                value={test.pathOverrides?.[seg.paramName] ?? ''}
                                                onChange={(e) => handleUpdateTest(test.id, { pathOverrides: { ...test.pathOverrides, [seg.paramName]: e.target.value } })}
                                                placeholder={`Override ${seg.paramName}`}
                                                size="sm"
                                                fullWidth
                                            />
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Query Param Overrides */}
                            {requestConfig?.queryParams && requestConfig.queryParams.length > 0 && (
                                <Card variant="outlined" padding="md" className="border-green-200 dark:border-green-700">
                                    <div className="flex items-center mb-3 space-x-2">
                                        <FiCode className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-300">Query Parameter Overrides</h4>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {requestConfig.queryParams.map((param: any) => (
                                            <Input
                                                key={param.key}
                                                label={param.key}
                                                value={test.queryOverrides?.[param.key] ?? ''}
                                                onChange={(e) => handleUpdateTest(test.id, { queryOverrides: { ...test.queryOverrides, [param.key]: e.target.value } })}
                                                placeholder={`Override ${param.key}`}
                                                size="sm"
                                                fullWidth
                                            />
                                        ))}
                                    </div>
                                </Card>
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
                                        <Card variant="outlined" padding="md" className="border-purple-200 dark:border-purple-700">
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
                                        </Card>
                                    );
                                } else if (requestConfig?.bodyType === 'form') {
                                    return (
                                        <Card variant="outlined" padding="md" className="border-orange-200 dark:border-orange-700">
                                            <div className="flex items-center mb-3 space-x-2">
                                                <FiDatabase className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300">Body Override (Form Data)</h4>
                                            </div>
                                            <Textarea
                                                value={test.bodyOverride ?? ''}
                                                onChange={(e) => handleUpdateTest(test.id, { bodyOverride: e.target.value })}
                                                placeholder="Enter form data (e.g., key1=value1&key2=value2)"
                                                rows={3}
                                                fullWidth
                                            />
                                        </Card>
                                    );
                                } else if (requestConfig?.bodyType === 'text') {
                                    return (
                                        <Card variant="outlined" padding="md" className="border-indigo-200 dark:border-indigo-700">
                                            <div className="flex items-center mb-3 space-x-2">
                                                <FiFileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Body Override (Text)</h4>
                                            </div>
                                            <Textarea
                                                value={test.bodyOverride ?? ''}
                                                onChange={(e) => handleUpdateTest(test.id, { bodyOverride: e.target.value })}
                                                placeholder="Enter text body"
                                                rows={3}
                                                fullWidth
                                            />
                                        </Card>
                                    );
                                }

                                return null;
                            })()}

                            {/* Expected Response */}
                            <Card variant="outlined" padding="md" className="border-teal-200 dark:border-teal-700">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center space-x-2">
                                        <FiTarget className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                        <h4 className="text-sm font-semibold text-teal-700 dark:text-teal-300">Expected Response (JSON)</h4>
                                    </div>
                                    <Toggle
                                        checked={!!test.expectedPartialResponse}
                                        onChange={(checked) => handleUpdateTest(test.id, { expectedPartialResponse: checked })}
                                        label="Partial match"
                                        colorScheme="teal"
                                        size="sm"
                                        position="left"
                                        data-testid={`test-partial-match-${test.id}`}
                                    />
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
                            </Card>

                            {/* Server Response */}
                            {test.serverResponse && test.serverResponse.trim() !== '' && (
                                <Card variant="outlined" padding="md" className="border-gray-200 dark:border-gray-600">
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
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Run Button */}
                    <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-2">
                            <TestStatusBadge
                                status={loading ? 'running' : test.lastResult || null}
                                size="md"
                            />
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            icon={loading ? FiRefreshCw : FiPlay}
                            onClick={handleRunTest}
                            disabled={loading}
                            loading={loading}
                        >
                            {loading ? 'Running...' : 'Run Test'}
                        </Button>
                    </div>
                </>
            )}
        </Card>
    );
};

export default TestCard; 