import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAppContext } from "../../context/AppContext";
import Editor from "@monaco-editor/react";
import Anthropic from "@anthropic-ai/sdk/index.mjs";
import {
  AITestGeneratorProps,
  EditorRef,
  EditorMountParams,
  AnthropicResponse,
} from "../../types/components/components.types";
import {
  FiCopy,
  FiCode,
  FiSettings,
  FiCheck,
  FiAlertCircle,
  FiDownload,
  FiStar,
  FiCpu,
  FiActivity,
  FiFileText,
  FiRefreshCw,
  FiEye,
  FiTarget,
} from "react-icons/fi";

const AITestGenerator: React.FC<AITestGeneratorProps> = ({ yamlData }) => {
  const { isDarkMode } = useTheme();
  const { activeSession, handleSaveSession, tokenConfig, generateAuthHeaders, isAuthenticated } = useAppContext();
  const [requirements, setRequirements] = useState<string>("");
  const [useOOP, setUseOOP] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedTest, setGeneratedTest] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const editorRef = useRef<EditorRef["current"]>(null);
  const [lastYamlData, setLastYamlData] = useState<string>("");

  // Load requirements from session on mount/session change
  useEffect(() => {
    if (activeSession && typeof activeSession.requirements === "string") {
      setRequirements(activeSession.requirements);
    } else {
      setRequirements("");
    }
  }, [activeSession?.id]);

  useEffect(() => {
    // Only update lastYamlData if yamlData has actually changed
    if (yamlData !== lastYamlData) {
      setLastYamlData(yamlData);
      // Clear generated test when yamlData changes
      setGeneratedTest("");
      setError("");
    }
  }, [yamlData]);

  // Save requirements to session when it changes
  useEffect(() => {
    if (activeSession && requirements !== activeSession.requirements) {
      const updatedSession = {
        ...activeSession,
        requirements,
      };
      handleSaveSession(activeSession.name, updatedSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirements]);

  const promptGenerator = (): string => {
    // Generate authentication information for the prompt
    const authHeaders = generateAuthHeaders();
    const authInfo = Object.keys(authHeaders).length > 0
      ? `Authentication Configuration:
    - Type: ${tokenConfig.authType}
    - Headers: ${Object.entries(authHeaders).map(([key, value]) => `${key}: ${value.includes('.') ? value.split('.').map(() => 'xxx').join('.') : 'xxx'}`).join(', ')}
    - Token Name: ${tokenConfig.tokenName}
    - Header Key: ${tokenConfig.headerKey}
    - Header Format: ${tokenConfig.headerValueFormat}`
      : 'No authentication configured';

    const prompt = `Create BDD-style pytest tests for the following Flask API endpoint based on this OpenAPI YAML specification:

    ${yamlData}
    
    ${authInfo}
    
    IMPORTANT: The tests must follow the exact style and structure of my existing test files, with these requirements:
    
    1. Use test_client from app.tests for all HTTP requests (NOT the requests library)
    2. Create a helper function that takes a role and all necessary parameters for the endpoint
    3. Use get_user_test_headers(role) for authentication headers
    4. Write detailed BDD-style docstrings with Given/When/Then format in each test function
    5. Use pytest.mark.parametrize for testing multiple parameter combinations
    6. Use AssertionMessages constants for standard assertions (status200, status400, res_data, etc.)
    7. Validate response structure with proper type checking
    8. Test all applicable user roles (company, division, region, facility)
    9. Include tests for all relevant status codes (200, 204, 400, 404, etc.)
    10. Add type hints for all function parameters and variables
    11. Store the variables that are used in the test cases in a dictionary in top of the test file
    
    Your tests should include:
    - A helper function to make requests to the endpoint with different parameters
    - Tests for valid requests with various parameter combinations
    - Tests for invalid parameter formats (400 errors)
    - Tests for non-existent resources (404 errors)
    - Validation of response structure including data fields, types, and values
    - At least one data validation test with specific expected response values
    
    Follow this general structure:
    \`\`\`python
    from typing import Dict, Optional
    from app.tests.messages import AssertionMessages
    from app.tests import get_user_test_headers, test_client
    import pytest
    
    
    def fetch_endpoint_data(role: str, param1: str, param2: str, filters: Optional[Dict] = None):
        """Helper function to fetch data from the endpoint."""
        headers = get_user_test_headers(role)
        
        query_string = filters or {}
        url = f"/api/endpoint/{param1}/{param2}"
        
        res = test_client.get(
            url,
            headers=headers,
            query_string=query_string
        )
        return res
    
    
    @pytest.mark.parametrize(
        "role, param1, param2, filters",
        [
            # Test cases here
        ]
    )
    def test_endpoint_status_200(role, param1, param2, filters):
        """
        Scenario: Retrieve data with valid parameters
        
        Given:
            - Valid parameters 
            - The user has appropriate role permissions
        
        When:
            - Requesting data with these parameters
        
        Then:
            - The API should return a status code of 200
            - The response should have the expected structure
        """
        # Test implementation
    \`\`\`
    
    Additional Requirements:
    ${requirements}
    
    IMPORTANT: Please ensure the response is complete and not cut off. Include all test cases and their implementations.
    IMPORTANT: ${useOOP
        ? "Please generate the test code in object-oriented style"
        : "Please generate the test code in functional style"
      }`;
    return prompt;
  };

  const generatePytestCode = async (): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const prompt = promptGenerator();

      const response: AnthropicResponse = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      if (!response.content || !response.content[0]?.text) {
        throw new Error("No test code generated");
      }

      const generatedCode = response.content[0].text;

      // Check if the response is complete
      if (generatedCode.includes("...") || generatedCode.endsWith('"')) {
        throw new Error("Generated test code appears to be incomplete");
      }

      setGeneratedTest(generatedCode);
    } catch (err) {
      console.error("Error generating test code:", err);
      setError(
        `Failed to generate test code: ${err instanceof Error ? err.message : "Unknown error"
        }`
      );
      // Fallback to sample code if there's an error
      setGeneratedTest(generateSampleTestCode());
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleTestCode = (): string => {
    let endpoint = "https://api.example.com/resource";
    let method = "GET";

    try {
      const endpointMatch = yamlData.match(/url:\s*["']?(.*?)["']?$/m);
      const methodMatch = yamlData.match(
        /method:\s*["']?(GET|POST|PUT|DELETE|PATCH)["']?$/m
      );

      if (endpointMatch && endpointMatch[1]) {
        endpoint = endpointMatch[1];
      }

      if (methodMatch && methodMatch[1]) {
        method = methodMatch[1];
      }
    } catch (e) {
      console.error("Error parsing YAML:", e);
    }

    return `from typing import Dict, Optional
from app.tests.messages import AssertionMessages
from app.tests import get_user_test_headers, test_client
import pytest


def fetch_endpoint_data(role: str, param1: str, param2: str, filters: Optional[Dict] = None):
    """Helper function to fetch data from the endpoint."""
    headers = get_user_test_headers(role)
    
    query_string = filters or {}
    url = f"${endpoint}/{param1}/{param2}"
    
    res = test_client.${method.toLowerCase()}(
        url,
        headers=headers,
        query_string=query_string
    )
    return res


@pytest.mark.parametrize(
    "role, param1, param2, filters",
    [
        ("company", "valid_param1", "valid_param2", None),
        ("division", "valid_param1", "valid_param2", {"filter": "value"}),
        ("region", "valid_param1", "valid_param2", None),
        ("facility", "valid_param1", "valid_param2", None),
    ]
)
def test_endpoint_status_200(role: str, param1: str, param2: str, filters: Optional[Dict]):
    """
    Scenario: Retrieve data with valid parameters
    
    Given:
        - Valid parameters ({param1}, {param2})
        - The user has {role} role permissions
        - Optional filters: {filters ? JSON.stringify(filters) : 'None'}
    
    When:
        - Requesting data with these parameters
    
    Then:
        - The API should return a status code of 200
        - The response should have the expected structure
    """
    res = fetch_endpoint_data(role, param1, param2, filters)
    
    assert res.status_code == 200, AssertionMessages.status200
    data = res.get_json()
    assert isinstance(data, dict), AssertionMessages.res_data
    assert "data" in data, "Response should contain 'data' field"


@pytest.mark.parametrize(
    "role, param1, param2, filters, expected_status",
    [
        ("company", "invalid_param", "valid_param2", None, 400),
        ("division", "valid_param1", "", None, 400),
        ("region", "valid_param1", "invalid_format", None, 400),
    ]
)
def test_endpoint_status_400(role: str, param1: str, param2: str, filters: Optional[Dict], expected_status: int):
    """
    Scenario: Handle invalid parameters
    
    Given:
        - Invalid parameters ({param1}, {param2})
        - The user has {role} role permissions
        - Optional filters: {filters ? JSON.stringify(filters) : 'None'}
    
    When:
        - Requesting data with these invalid parameters
    
    Then:
        - The API should return a status code of {expected_status}
        - The response should contain an error message
    """
    res = fetch_endpoint_data(role, param1, param2, filters)
    
    assert res.status_code == expected_status, AssertionMessages.status400
    data = res.get_json()
    assert "error" in data, "Response should contain 'error' field"
    assert "message" in data["error"], "Error should contain a message"`;
  };

  const handleGenerateCode = async (): Promise<void> => {
    try {
      await generatePytestCode();
    } catch (err) {
      console.error("Using fallback code generation Error: " + err);
      setGeneratedTest(generateSampleTestCode());
    }
  };

  const handleEditorDidMount = (
    editor: EditorMountParams["editor"],
    monaco: EditorMountParams["monaco"]
  ): void => {
    editorRef.current = editor;

    // Configure Python syntax highlighting
    monaco.languages.register({ id: "python" });
    monaco.languages.setMonarchTokensProvider("python", {
      defaultToken: "",
      tokenPostfix: ".python",
      keywords: [
        "and",
        "as",
        "assert",
        "break",
        "class",
        "continue",
        "def",
        "del",
        "elif",
        "else",
        "except",
        "finally",
        "for",
        "from",
        "global",
        "if",
        "import",
        "in",
        "is",
        "lambda",
        "nonlocal",
        "not",
        "or",
        "pass",
        "raise",
        "return",
        "try",
        "while",
        "with",
        "yield",
      ],
      tokenizer: {
        root: [
          // Comments
          [/#.*$/, "comment"],

          // Strings
          [/'([^'\\]|\\.)*$/, "string.invalid"],
          [/'([^'\\]|\\.)*'/, "string"],
          [/"([^"\\]|\\.)*$/, "string.invalid"],
          [/"([^"\\]|\\.)*"/, "string"],

          // Numbers
          [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
          [/\d+/, "number"],

          // Keywords
          [/@\w+/, "annotation"],
          [
            /\b(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/,
            "keyword",
          ],

          // Identifiers
          [/\b[A-Za-z_]\w*\b/, "identifier"],

          // Whitespace
          [/\s+/, "white"],

          // Delimiters
          [/[{}()[\]]/, "@brackets"],
          [/[;,.]/, "delimiter"],

          // Operators
          [/[+\-*/%&|^!~<>]=?/, "operator"],
        ],
      },
    });
  };

  // Calculate editor height based on content
  const getEditorHeight = (): number => {
    if (!generatedTest) return 200; // Default height
    const lineCount = generatedTest.split("\n").length;
    return Math.min(Math.max(lineCount * 20, 200), 800); // Min 200px, max 800px
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptGenerator());
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedTest);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadTestFile = () => {
    const blob = new Blob([generatedTest], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_test.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="overflow-hidden relative p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 rounded-2xl border border-purple-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500 rounded-full -translate-x-12 translate-y-12"></div>
        </div>

        <div className="flex relative justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <FiStar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                AI Test Generator
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Generate comprehensive pytest tests using AI-powered code generation
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-green-100 to-green-200 rounded-xl dark:from-green-900 dark:to-green-800">
              <FiCpu className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">AI-Powered</span>
            </div>
            <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl dark:from-blue-900 dark:to-blue-800">
              <FiTarget className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">BDD Style</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center mb-6 space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
            <FiSettings className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Test Configuration</h3>
        </div>

        <div className="space-y-6">
          {/* Requirements Input */}
          <div>
            <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Additional Test Requirements
            </label>
            <textarea
              value={requirements}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRequirements(e.target.value)
              }
              placeholder="Specify any additional test requirements, edge cases, or specific scenarios you want to test..."
              className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border border-gray-300 shadow-sm transition-all duration-200 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Describe specific test scenarios, edge cases, or validation requirements for your API endpoint
            </p>
          </div>

          {/* Options Row */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="use-oop"
                  checked={useOOP}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUseOOP(e.target.checked)
                  }
                  className="w-4 h-4 text-indigo-600 bg-white rounded border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <label
                  htmlFor="use-oop"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Use Object-Oriented Programming style
                </label>
              </div>
            </div>

            <button
              onClick={handleCopyPrompt}
              className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
            >
              {copiedPrompt ? (
                <>
                  <FiCheck className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-4 h-4" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerateCode}
          disabled={isLoading || !yamlData}
          className={`group px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-3 ${isLoading || !yamlData
            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105"
            }`}
        >
          {isLoading ? (
            <>
              <FiRefreshCw className="w-5 h-5 animate-spin" />
              <span>Generating Tests...</span>
            </>
          ) : (
            <>
              <FiStar className="w-5 h-5" />
              <span>Generate Pytest Code</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 dark:from-red-900 dark:to-red-800 dark:border-red-700">
          <div className="flex items-center space-x-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">Generation Error</h4>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Generated Code Section */}
      {generatedTest && (
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                <FiCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generated Pytest Code</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI-generated test code ready for your API endpoint
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-2 text-gray-600 rounded-lg transition-all duration-200 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                title={showPreview ? "Hide preview" : "Show preview"}
              >
                {showPreview ? <FiEye className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopyCode}
                className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
              >
                {copiedCode ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
              <button
                onClick={downloadTestFile}
                className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
              >
                <FiDownload className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="space-y-4">
              {/* Code Statistics */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 dark:from-blue-900 dark:to-blue-800 dark:border-blue-700">
                  <div className="flex items-center space-x-2">
                    <FiFileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Lines of Code</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {generatedTest.split('\n').length}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 dark:from-green-900 dark:to-green-800 dark:border-green-700">
                  <div className="flex items-center space-x-2">
                    <FiCpu className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">Test Functions</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {(generatedTest.match(/def test_/g) || []).length}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 dark:from-purple-900 dark:to-purple-800 dark:border-purple-700">
                  <div className="flex items-center space-x-2">
                    <FiTarget className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Test Cases</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {(generatedTest.match(/@pytest\.mark\.parametrize/g) || []).length}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 dark:from-orange-900 dark:to-orange-800 dark:border-orange-700">
                  <div className="flex items-center space-x-2">
                    <FiActivity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Coverage</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">High</p>
                </div>
              </div>

              {/* Code Editor */}
              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-600">
                <div className="flex justify-between items-center px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">generated_test.py</span>
                </div>
                <Editor
                  height={getEditorHeight()}
                  defaultLanguage="python"
                  value={generatedTest}
                  theme={isDarkMode ? "vs-dark" : "vs-light"}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollbar: {
                      vertical: "visible",
                      horizontal: "visible",
                      useShadows: false,
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                    },
                    automaticLayout: true,
                    wordWrap: "on",
                  }}
                  onMount={handleEditorDidMount}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AITestGenerator;
